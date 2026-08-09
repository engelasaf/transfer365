// netlify/functions/paddle-webhook.mjs
// Handles all Paddle subscription events
// https://developer.paddle.com/webhooks/overview

import crypto from 'crypto';

function getEnv(k) {
  try { if (process.env[k]) return process.env[k]; } catch(e) {}
  try { return Netlify.env.get(k) || ''; } catch(e) {}
  return '';
}

async function sbPatch(url, key, table, filter, data) {
  const r = await fetch(`${url}/rest/v1/${table}?${filter}`, {
    method: 'PATCH',
    headers: { apikey: key, Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ ...data, updated_at: new Date().toISOString() }),
  });
  return r.ok;
}

async function sbUpsert(url, key, table, row) {
  const r = await fetch(`${url}/rest/v1/${table}`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify([row]),
  });
  return r.ok;
}

async function sbGet(url, key, table, filter) {
  const r = await fetch(`${url}/rest/v1/${table}?${filter}&limit=1`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  const d = await r.json();
  return Array.isArray(d) ? d[0] : null;
}

function planFromPriceId(priceId) {
  const m = {
    [getEnv('PADDLE_PRICE_AGENT_M')]:   'agent',
    [getEnv('PADDLE_PRICE_AGENT_A')]:   'agent',
    [getEnv('PADDLE_PRICE_DIR_M')]:     'director',
    [getEnv('PADDLE_PRICE_DIR_A')]:     'director',
    [getEnv('PADDLE_PRICE_EXEC_M')]:    'executive',
    [getEnv('PADDLE_PRICE_EXEC_A')]:    'executive',
  };
  return m[priceId] || 'agent';
}

function billingFromPriceId(priceId) {
  const annuals = [getEnv('PADDLE_PRICE_AGENT_A'), getEnv('PADDLE_PRICE_DIR_A'), getEnv('PADDLE_PRICE_EXEC_A')];
  return annuals.includes(priceId) ? 'annual' : 'monthly';
}

export default async (req) => {
  const SB_URL = getEnv('SUPABASE_URL');
  const SB_KEY = getEnv('SUPABASE_ANON_KEY');
  // Read webhook secret from env var OR Supabase config
  let WEBHOOK_SECRET = getEnv('PADDLE_WEBHOOK_SECRET');
  if (!WEBHOOK_SECRET && SB_URL && SB_KEY) {
    try {
      const cr = await fetch(
        `${SB_URL}/rest/v1/t365_config?key=eq.paddle_webhook_secret&limit=1`,
        { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
      );
      const cd = await cr.json();
      WEBHOOK_SECRET = cd?.[0]?.value || '';
    } catch(e) {}
  }

  // Verify signature
  if (WEBHOOK_SECRET) {
    const sig  = req.headers.get('paddle-signature') || '';
    const body = await req.text();
    const ts   = sig.match(/ts=(\d+)/)?.[1] || '';
    const h1   = sig.match(/h1=([a-f0-9]+)/)?.[1] || '';
    const signed = crypto.createHmac('sha256', WEBHOOK_SECRET)
      .update(`${ts}:${body}`).digest('hex');
    if (h1 !== signed) {
      console.error('Paddle webhook: invalid signature');
      return new Response('Invalid signature', { status: 401 });
    }
    var payload = JSON.parse(body);
  } else {
    var payload = await req.json();
  }

  const { event_type, data } = payload;
  const customerId = data?.customer_id;
  const subId      = data?.id;

  console.log(`Paddle webhook: ${event_type} customer=${customerId}`);

  // Get email from customer data
  let email = data?.customer?.email || data?.address?.email || '';

  // If no email, look up by customer_id
  if (!email && customerId && SB_URL && SB_KEY) {
    const sub = await sbGet(SB_URL, SB_KEY, 't365_subscribers',
      `paddle_customer_id=eq.${encodeURIComponent(customerId)}`);
    email = sub?.email || '';
  }

  if (!SB_URL || !SB_KEY) {
    console.warn('Paddle webhook: Supabase not configured');
    return new Response('OK', { status: 200 });
  }

  // Idempotency
  const eventId = payload.notification_id || payload.id || '';
  if (eventId) {
    const existing = await sbGet(SB_URL, SB_KEY, 't365_webhook_events',
      `event_id=eq.${encodeURIComponent(eventId)}`).catch(() => null);
    if (existing) return new Response('Already processed', { status: 200 });
    await sbUpsert(SB_URL, SB_KEY, 't365_webhook_events', {
      event_id: eventId, event_name: event_type,
      processed_at: new Date().toISOString(),
    }).catch(() => {});
  }

  const priceId = data?.items?.[0]?.price?.id || data?.items?.[0]?.price_id || '';
  const plan    = planFromPriceId(priceId);
  const billing = billingFromPriceId(priceId);

  // Handle events
  if (['subscription.created', 'transaction.completed'].includes(event_type)) {
    if (email) {
      await sbUpsert(SB_URL, SB_KEY, 't365_subscribers', {
        email, plan, status: 'active', billing,
        paddle_customer_id: customerId,
        paddle_subscription_id: subId,
        created_at: new Date().toISOString(),
      });
      console.log(`Paddle: activated ${email} → ${plan}`);
    }
  } else if (event_type === 'subscription.updated') {
    if (email) await sbPatch(SB_URL, SB_KEY, 't365_subscribers',
      `email=eq.${encodeURIComponent(email)}`,
      { plan, billing, status: 'active', paddle_subscription_id: subId });
  } else if (['subscription.canceled'].includes(event_type)) {
    if (email) await sbPatch(SB_URL, SB_KEY, 't365_subscribers',
      `email=eq.${encodeURIComponent(email)}`,
      { status: 'cancelled', plan: 'scout' });
  } else if (event_type === 'subscription.paused') {
    if (email) await sbPatch(SB_URL, SB_KEY, 't365_subscribers',
      `email=eq.${encodeURIComponent(email)}`, { status: 'paused' });
  } else if (event_type === 'subscription.resumed') {
    if (email) await sbPatch(SB_URL, SB_KEY, 't365_subscribers',
      `email=eq.${encodeURIComponent(email)}`, { status: 'active', plan });
  } else if (event_type === 'subscription.past_due') {
    if (email) await sbPatch(SB_URL, SB_KEY, 't365_subscribers',
      `email=eq.${encodeURIComponent(email)}`, { status: 'past_due' });
  }

  return new Response('OK', { status: 200 });
};

export const config = { path: '/api/paddle-webhook' };
