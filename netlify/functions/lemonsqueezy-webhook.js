// netlify/functions/lemonsqueezy-webhook.js (update existing)
// Handles order_created → upserts user into t365_subscribers

const crypto = require('crypto');

const PLAN_MAP = {
  // Map LemonSqueezy variant IDs to plan names
  // Fill these in after creating products in LS dashboard
  "agent_monthly":    "agent",
  "agent_annual":     "agent",
  "director_monthly": "director",
  "director_annual":  "director",
  "exec_monthly":     "executive",
  "exec_annual":      "executive",
};

async function sbUpsert(sbUrl, sbKey, row) {
  const r = await fetch(`${sbUrl}/rest/v1/t365_subscribers`, {
    method: "POST",
    headers: {
      "apikey": sbKey, "Authorization": `Bearer ${sbKey}`,
      "Content-Type": "application/json",
      "Prefer": "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify([row]),
  });
  return r.ok;
}

exports.handler = async (event) => {
  const SB_URL = process.env.SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_ANON_KEY;
  const LS_SIG = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

  // Verify signature
  if (LS_SIG) {
    const sig  = event.headers['x-signature'] || '';
    const hmac = crypto.createHmac('sha256', LS_SIG)
      .update(event.body).digest('hex');
    if (sig !== hmac) return { statusCode: 401, body: 'Invalid signature' };
  }

  const payload = JSON.parse(event.body || '{}');
  const type    = payload?.meta?.event_name;

  if (type === 'order_created' || type === 'subscription_created') {
    const data     = payload?.data?.attributes || {};
    const email    = data?.user_email || '';
    const name     = data?.user_name  || '';
    const variantName = data?.product_name?.toLowerCase() || '';
    const plan     = Object.entries(PLAN_MAP).find(([k]) => variantName.includes(k.split('_')[0]))?.[1] || 'agent';
    const billing  = variantName.includes('annual') ? 'annual' : 'monthly';
    const orderId  = payload?.data?.id;

    if (email && SB_URL && SB_KEY) {
      await sbUpsert(SB_URL, SB_KEY, {
        email, full_name: name, plan, status: 'active',
        billing, ls_order_id: orderId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Also update Supabase auth user metadata if they exist
      console.log(`Webhook: ${type} — ${email} → plan:${plan}`);
    }
  }

  if (type === 'subscription_cancelled' || type === 'order_refunded') {
    const email = payload?.data?.attributes?.user_email;
    if (email && SB_URL && SB_KEY) {
      await fetch(`${SB_URL}/rest/v1/t365_subscribers?email=eq.${encodeURIComponent(email)}`, {
        method: "PATCH",
        headers: { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}`,
          "Content-Type": "application/json" },
        body: JSON.stringify({ status: 'cancelled', updated_at: new Date().toISOString() }),
      });
      console.log(`Webhook: ${type} — ${email} → cancelled`);
    }
  }

  return { statusCode: 200, body: 'OK' };
};
