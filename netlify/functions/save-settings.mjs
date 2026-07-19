// netlify/functions/save-settings.mjs
// POST /api/save-settings — save notification channel prefs
// Plan enforcement: Email requires agent+, WhatsApp requires director+

import { requirePlan, PLAN_ERR } from './_auth.mjs';

const CORS = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*",
               "Access-Control-Allow-Headers": "Content-Type" };

export default async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST")    return Response.json({ error: "POST only" }, { status: 405 });

  const SB_URL = Netlify.env.get("SUPABASE_URL");
  const SB_KEY = Netlify.env.get("SUPABASE_ANON_KEY");

  let body;
  try { body = await req.json(); } catch(e) {
    return Response.json({ error: "Invalid JSON" }, { status: 400, headers: CORS });
  }

  const { userId, email, channels, timing } = body;
  if (!userId && !email) return Response.json({ error: "userId or email required" }, { status: 400, headers: CORS });

  // ── Plan enforcement ────────────────────────────────────────────
  if (SB_URL && SB_KEY && email) {
    // WhatsApp requires director+
    if (channels?.whatsapp?.on) {
      const { allowed, plan } = await requirePlan(
        new Request(req.url + `?user_email=${encodeURIComponent(email)}`),
        'director', SB_URL, SB_KEY
      );
      if (!allowed) return PLAN_ERR('director', plan);
    }

    // Email/Telegram require agent+
    if (channels?.email?.on || channels?.telegram?.on) {
      const { allowed, plan } = await requirePlan(
        new Request(req.url + `?user_email=${encodeURIComponent(email)}`),
        'agent', SB_URL, SB_KEY
      );
      if (!allowed) return PLAN_ERR('agent', plan);
    }
  }

  if (!SB_URL || !SB_KEY) {
    return Response.json({ success: true, note: "DB not configured — settings not persisted" }, { headers: CORS });
  }

  const row = {
    user_id: userId || email, email: email || '',
    ch_email_on:     channels?.email?.on    ?? false,
    ch_email_val:    channels?.email?.val   ?? '',
    ch_whatsapp_on:  channels?.whatsapp?.on ?? false,
    ch_whatsapp_val: channels?.whatsapp?.val ?? '',
    ch_telegram_on:  channels?.telegram?.on  ?? false,
    ch_telegram_val: channels?.telegram?.val ?? '',
    ch_push_on:      channels?.push?.on      ?? false,
    timing:          timing || 'immediate',
    updated_at:      new Date().toISOString(),
  };

  try {
    const r = await fetch(`${SB_URL}/rest/v1/notification_settings?on_conflict=user_id`, {
      method: 'POST',
      headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify([row]),
    });
    if (!r.ok) throw new Error(`Supabase ${r.status}`);
    return Response.json({ success: true }, { headers: CORS });
  } catch(e) {
    return Response.json({ error: e.message }, { status: 500, headers: CORS });
  }
};

export const config = { path: "/api/save-settings" };
