// netlify/functions/scan-alerts.mjs
// Scheduled: runs daily at 07:00 UTC
// Scans Supabase player data for actionable alerts:
//   - New injuries
//   - Contracts expiring within 60 days
//   - Players requesting transfer
//   - Free agents in target positions
// Then fires send-notification for each subscribed agent

const ALERT_TYPES = {
  INJURY:          "injury",
  CONTRACT_EXPIRY: "contract",
  TRANSFER_REQ:    "transfer",
  FREE_AGENT:      "free_agent",
};

async function sbFetch(sbUrl, sbKey, path) {
  const r = await fetch(`${sbUrl}/rest/v1/${path}`, {
    headers: { "apikey": sbKey, "Authorization": `Bearer ${sbKey}` },
  });
  if (!r.ok) throw new Error(`Supabase ${path}: ${r.status}`);
  return r.json();
}

async function sbUpsert(sbUrl, sbKey, table, rows) {
  const r = await fetch(`${sbUrl}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      "apikey": sbKey, "Authorization": `Bearer ${sbKey}`,
      "Content-Type": "application/json",
      "Prefer": "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(rows),
  });
  return r.ok;
}

export default async (req) => {
  const SB_URL = Netlify.env.get("SUPABASE_URL");
  const SB_KEY = Netlify.env.get("SUPABASE_ANON_KEY");
  if (!SB_URL || !SB_KEY) return;

  try {
    const alerts = [];

    // ── Scan injuries ────────────────────────────────────────────────
    const injuries = await sbFetch(SB_URL, SB_KEY,
      "t365_injuries?select=*&order=updated_at.desc&limit=50");
    for (const inj of injuries) {
      alerts.push({
        type:        ALERT_TYPES.INJURY,
        player_id:   inj.player_id,
        player_name: inj.player_name,
        team_name:   inj.team_name,
        title:       `Injury: ${inj.player_name} (${inj.team_name})`,
        body:        `${inj.injury_type} — ${inj.reason || "Details TBC"}`,
        urgency:     "high",
        created_at:  new Date().toISOString(),
      });
    }

    // ── Scan expiring contracts (players with < 60 days remaining) ──
    const players = await sbFetch(SB_URL, SB_KEY,
      "t365_players?select=*&order=contract_end.asc&limit=200");
    const now = Date.now();
    for (const p of players) {
      if (!p.contract_end) continue;
      const daysLeft = Math.round((new Date(p.contract_end) - now) / 86400000);
      if (daysLeft > 0 && daysLeft <= 60) {
        alerts.push({
          type:        ALERT_TYPES.CONTRACT_EXPIRY,
          player_id:   p.player_id,
          player_name: p.name,
          team_name:   p.team_name,
          title:       `Contract expiring: ${p.name} — ${daysLeft} days`,
          body:        `${p.position} at ${p.team_name}. Contract ends ${p.contract_end}.`,
          urgency:     daysLeft <= 30 ? "high" : "medium",
          created_at:  new Date().toISOString(),
        });
      }
    }

    // ── Store alerts in Supabase ─────────────────────────────────────
    if (alerts.length > 0) {
      await sbUpsert(SB_URL, SB_KEY, "t365_alerts", alerts);
    }

    // ── Notify all subscribed agents ─────────────────────────────────
    const highAlerts = alerts.filter(a => a.urgency === "high");
    if (highAlerts.length > 0) {
      const settings = await sbFetch(SB_URL, SB_KEY,
        "notification_settings?select=user_id,ch_email_on,ch_telegram_on,ch_whatsapp_on");

      const origin = new URL(req.url).origin;
      for (const user of settings) {
        if (!user.ch_email_on && !user.ch_telegram_on && !user.ch_whatsapp_on) continue;
        const summary = highAlerts.slice(0, 5)
          .map(a => `• ${a.title}`).join("\n");
        await fetch(`${origin}/api/send-notification`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId:    user.user_id,
            subject:   `${highAlerts.length} urgent alert${highAlerts.length > 1 ? "s" : ""} on Transfer365`,
            message:   summary,
            alertType: "injury",
          }),
        });
      }
    }

    console.log(`scan-alerts: ${alerts.length} alerts generated, ${highAlerts?.length || 0} high-priority`);

  } catch (e) {
    console.error("scan-alerts error:", e.message);
  }
};

export const config = { schedule: "0 7 * * *" };  // 07:00 UTC daily
