// netlify/functions/save-settings.mjs
// POST /api/save-settings
// Body: { userId, email, channels: { email, whatsapp, telegram, push }, timing }

async function supabaseRequest(url, apiKey, method, body) {
  const r = await fetch(url, {
    method,
    headers: {
      "apikey":        apiKey,
      "Authorization": "Bearer " + apiKey,
      "Content-Type":  "application/json",
      "Prefer":        "return=representation,resolution=merge-duplicates",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  return text ? JSON.parse(text) : {};
}

export default async (req) => {
  const cors = { "Content-Type": "application/json" };
  if (req.method === "OPTIONS") return new Response("", { status: 200 });
  if (req.method !== "POST") return Response.json({ error: "POST only" }, { status: 405 });

  const SB_URL = Netlify.env.get("SUPABASE_URL");
  const SB_KEY = Netlify.env.get("SUPABASE_ANON_KEY");
  if (!SB_URL || !SB_KEY) return Response.json({ error: "Supabase not configured" }, { status: 500 });

  try {
    const body = await req.json();
    const { userId, email, channels, timing } = body;
    if (!userId && !email) return Response.json({ error: "userId or email required" }, { status: 400 });

    // Upsert settings into notification_settings table
    const row = {
      user_id:          userId || email,
      email:            email,
      ch_email_on:      channels?.email?.on    ?? false,
      ch_email_val:     channels?.email?.val   ?? "",
      ch_whatsapp_on:   channels?.whatsapp?.on ?? false,
      ch_whatsapp_val:  channels?.whatsapp?.val ?? "",
      ch_telegram_on:   channels?.telegram?.on ?? false,
      ch_telegram_val:  channels?.telegram?.val ?? "",
      ch_push_on:       channels?.push?.on     ?? false,
      timing:           timing || "immediate",
      updated_at:       new Date().toISOString(),
    };

    const result = await supabaseRequest(
      `${SB_URL}/rest/v1/notification_settings?on_conflict=user_id`,
      SB_KEY, "POST", [row]
    );

    return Response.json({ success: true, saved: result }, { headers: cors });
  } catch(e) {
    console.error("save-settings error:", e.message);
    return Response.json({ error: e.message }, { status: 500, headers: cors });
  }
};

export const config = { path: "/api/save-settings" };
