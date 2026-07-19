// netlify/functions/lemonsqueezy-webhook.js
// Handles all LemonSqueezy webhook events with idempotency

const crypto = require('crypto');

// Plan name from variant/product name
function planFromName(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('executive') || n.includes('exec')) return 'executive';
  if (n.includes('director'))  return 'director';
  if (n.includes('agent'))     return 'agent';
  return 'scout';
}

function billingFromName(name) {
  return (name || '').toLowerCase().includes('annual') ? 'annual' : 'monthly';
}

async function sbPatch(sbUrl, sbKey, table, filter, update) {
  const r = await fetch(`${sbUrl}/rest/v1/${table}?${filter}`, {
    method: 'PATCH',
    headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}`,
      'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
    body: JSON.stringify({ ...update, updated_at: new Date().toISOString() }),
  });
  return r.ok;
}

async function sbUpsert(sbUrl, sbKey, table, row) {
  const r = await fetch(`${sbUrl}/rest/v1/${table}`, {
    method: 'POST',
    headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify([row]),
  });
  return r.ok;
}

async function sbGet(sbUrl, sbKey, table, filter) {
  const r = await fetch(`${sbUrl}/rest/v1/${table}?${filter}&limit=1`, {
    headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}` },
  });
  const rows = await r.json();
  return Array.isArray(rows) ? rows[0] : null;
}

exports.handler = async (event) => {
  const SB_URL = process.env.SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_ANON_KEY;
  const LS_SIG_SECRET = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

  // ── 1. Verify webhook signature ──────────────────────────────────
  if (LS_SIG_SECRET) {
    const sig  = event.headers['x-signature'] || '';
    const hmac = crypto.createHmac('sha256', LS_SIG_SECRET)
      .update(event.body || '').digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(hmac))) {
      console.error('Webhook: invalid signature');
      return { statusCode: 401, body: 'Invalid signature' };
    }
  }

  let payload;
  try { payload = JSON.parse(event.body || '{}'); }
  catch(e) { return { statusCode: 400, body: 'Bad JSON' }; }

  const eventName = payload?.meta?.event_name || '';
  const eventId   = payload?.meta?.event_id   || payload?.data?.id || '';

  console.log(`Webhook: ${eventName} (${eventId})`);

  // ── 2. Idempotency — skip if already processed ──────────────────
  if (SB_URL && SB_KEY && eventId) {
    const existing = await sbGet(SB_URL, SB_KEY,
      't365_webhook_events', `event_id=eq.${encodeURIComponent(eventId)}`
    ).catch(() => null);

    if (existing) {
      console.log(`Webhook: duplicate event ${eventId} — skipping`);
      return { statusCode: 200, body: 'Already processed' };
    }

    // Record this event
    await sbUpsert(SB_URL, SB_KEY, 't365_webhook_events', {
      event_id:   eventId,
      event_name: eventName,
      processed_at: new Date().toISOString(),
    }).catch(() => {});
  }

  // ── 3. Handle each event type ──────────────────────────────────
  const data     = payload?.data?.attributes || {};
  const email    = data?.user_email || '';
  const name     = data?.user_name  || '';
  const prodName = data?.product_name || data?.first_subscription_item?.variant_name || '';
  const plan     = planFromName(prodName);
  const billing  = billingFromName(prodName);
  const orderId  = String(payload?.data?.id || '');

  if (!email) {
    console.warn('Webhook: no email in payload');
    return { statusCode: 200, body: 'No email' };
  }

  if (!SB_URL || !SB_KEY) {
    console.warn('Webhook: Supabase not configured');
    return { statusCode: 200, body: 'DB not configured' };
  }

  // ── order_created / subscription_created ────────────────────────
  if (['order_created','subscription_created'].includes(eventName)) {
    await sbUpsert(SB_URL, SB_KEY, 't365_subscribers', {
      email, full_name: name, plan, status: 'active',
      billing, ls_order_id: orderId,
      created_at: new Date().toISOString(),
    });
    console.log(`Webhook: activated ${email} → ${plan} (${billing})`);
  }

  // ── subscription_updated (upgrade/downgrade) ─────────────────────
  else if (eventName === 'subscription_updated') {
    const newStatus = data?.status || 'active';
    await sbPatch(SB_URL, SB_KEY, 't365_subscribers',
      `email=eq.${encodeURIComponent(email)}`,
      { plan, status: newStatus, billing });
    console.log(`Webhook: updated ${email} → ${plan} status:${newStatus}`);
  }

  // ── subscription_payment_success ─────────────────────────────────
  else if (eventName === 'subscription_payment_success') {
    await sbPatch(SB_URL, SB_KEY, 't365_subscribers',
      `email=eq.${encodeURIComponent(email)}`,
      { status: 'active' });
    console.log(`Webhook: payment success ${email} → active`);
  }

  // ── subscription_payment_failed ──────────────────────────────────
  else if (eventName === 'subscription_payment_failed') {
    await sbPatch(SB_URL, SB_KEY, 't365_subscribers',
      `email=eq.${encodeURIComponent(email)}`,
      { status: 'past_due' });
    console.log(`Webhook: payment failed ${email} → past_due`);
  }

  // ── subscription_cancelled / subscription_expired ─────────────────
  else if (['subscription_cancelled','subscription_expired'].includes(eventName)) {
    const newStatus = eventName === 'subscription_expired' ? 'expired' : 'cancelled';
    await sbPatch(SB_URL, SB_KEY, 't365_subscribers',
      `email=eq.${encodeURIComponent(email)}`,
      { status: newStatus });
    console.log(`Webhook: ${eventName} ${email} → ${newStatus}`);
  }

  // ── subscription_paused ───────────────────────────────────────────
  else if (eventName === 'subscription_paused') {
    await sbPatch(SB_URL, SB_KEY, 't365_subscribers',
      `email=eq.${encodeURIComponent(email)}`,
      { status: 'paused' });
  }

  // ── subscription_resumed ──────────────────────────────────────────
  else if (eventName === 'subscription_resumed') {
    await sbPatch(SB_URL, SB_KEY, 't365_subscribers',
      `email=eq.${encodeURIComponent(email)}`,
      { status: 'active' });
  }

  // ── order_refunded ────────────────────────────────────────────────
  else if (eventName === 'order_refunded') {
    await sbPatch(SB_URL, SB_KEY, 't365_subscribers',
      `email=eq.${encodeURIComponent(email)}`,
      { status: 'cancelled', plan: 'scout' });
    console.log(`Webhook: refund ${email} → scout/cancelled`);
  }

  else {
    console.log(`Webhook: unhandled event ${eventName} — ignored safely`);
  }

  return { statusCode: 200, body: 'OK' };
};
