// netlify/functions/test-notification.mjs
// POST /api/test-notification
// Body: { userId, channel: "email"|"telegram"|"whatsapp" }

export default async (req) => {
  const cors = { "Content-Type": "application/json" };
  if (req.method !== "POST") return Response.json({ error: "POST only" }, { status: 405 });

  try {
    const { userId, channel } = await req.json();
    if (!userId || !channel) return Response.json({ error: "userId and channel required" }, { status: 400 });

    // Forward to send-notification with a test payload
    const origin = new URL(req.url).origin;
    const r = await fetch(`${origin}/api/send-notification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        subject:    "בדיקת התראה מ-Transfer365",
        message:    "✅ ערוץ ההתראות שלך מחובר ועובד! תקבל התראות לפי ההגדרות שבחרת.",
        alertType:  "test",
        playerName: "TEST",
      }),
    });
    const data = await r.json();
    return Response.json({ success: true, channel, result: data }, { headers: cors });
  } catch(e) {
    return Response.json({ error: e.message }, { status: 500, headers: cors });
  }
};

export const config = { path: "/api/test-notification" };
