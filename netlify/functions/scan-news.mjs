// netlify/functions/scan-news.mjs
// Scheduled: every 30 minutes — autonomous news scanner
// Auto-creates DB tables on first run if they don't exist

const SB_URL = process.env.SUPABASE_URL || "https://hivyothlbntxcbsilktp.supabase.co";
const SB_KEY = process.env.SUPABASE_KEY  || "sb_publishable_JSj4WcwoxYSrEC7Hi2Zxlg_0rboiHzE";
const SB_PAT = process.env.SUPABASE_PAT  || "";
const RESEND  = process.env.RESEND_KEY   || "re_fpiGyquS_6da8bc4B3z1GgSS3yWDMnzKp";
const REF     = "hivyothlbntxcbsilktp";

const SQL_SETUP = `
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id TEXT NOT NULL,
  player_name TEXT NOT NULL,
  trigger_type TEXT NOT NULL,
  headline TEXT NOT NULL,
  summary TEXT,
  source TEXT,
  url TEXT UNIQUE,
  icon TEXT,
  severity TEXT DEFAULT 'medium',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='alerts' AND policyname='pub_r') THEN
    CREATE POLICY pub_r ON public.alerts FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='alerts' AND policyname='pub_i') THEN
    CREATE POLICY pub_i ON public.alerts FOR INSERT WITH CHECK (true);
  END IF;
END $$;
CREATE TABLE IF NOT EXISTS public.scan_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scanned_at TIMESTAMPTZ DEFAULT NOW(),
  players_scanned INTEGER, articles_found INTEGER, alerts_created INTEGER
);
ALTER TABLE public.scan_log ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='scan_log' AND policyname='pub_rl') THEN
    CREATE POLICY pub_rl ON public.scan_log FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='scan_log' AND policyname='pub_il') THEN
    CREATE POLICY pub_il ON public.scan_log FOR INSERT WITH CHECK (true);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_al_p ON public.alerts(player_id);
CREATE INDEX IF NOT EXISTS idx_al_ts ON public.alerts(created_at DESC);
`;

// ── Auto-setup DB if tables don't exist ────────────────────────────
async function ensureTables() {
  // Quick check: try a SELECT on alerts
  const chk = await fetch(`${SB_URL}/rest/v1/alerts?limit=1`, {
    headers: { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}` }
  });
  if (chk.ok) return; // tables exist

  // Tables missing — create via Management API using PAT
  if (!SB_PAT) { console.warn("SUPABASE_PAT not set — cannot auto-create tables"); return; }
  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${SB_PAT}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: SQL_SETUP })
  });
  console.log(`DB setup: ${r.status} ${r.ok ? "OK" : await r.text()}`);
}

// ── Players to track ────────────────────────────────────────────────
const PLAYERS = [
  { id:"wirtz",    name:"Florian Wirtz",         q:"Florian+Wirtz" },
  { id:"calvert",  name:"Dominic Calvert-Lewin", q:"Calvert-Lewin" },
  { id:"hato",     name:"Jorrel Hato",           q:"Jorrel+Hato" },
  { id:"gyok",     name:"Viktor Gyokeres",       q:"Viktor+Gyokeres" },
  { id:"donna",    name:"Gianluigi Donnarumma",  q:"Donnarumma+goalkeeper" },
  { id:"olise",    name:"Michael Olise",         q:"Michael+Olise+Bayern" },
  { id:"kerkez",   name:"Milos Kerkez",          q:"Milos+Kerkez" },
  { id:"nkunku",   name:"Christopher Nkunku",    q:"Nkunku+Chelsea" },
  { id:"gvardiol", name:"Josko Gvardiol",        q:"Gvardiol+Manchester" },
];

// ── Trigger classifier ───────────────────────────────────────────────
const TRIGGERS = {
  injury:      { icon:"🏥", sev:"high",   kw:["injur","ruled out","out for","hamstring","knee","ankle","acl","surgery","muscle","sidelined","fitness doubt","absent","miss weeks","setback","scan"] },
  transfer:    { icon:"🔄", sev:"high",   kw:["transfer","signing","bid","interest","linked","move","fee","deal","loan","target","approach","offer","agree","contract agreed","swap","pursue"] },
  contract:    { icon:"📋", sev:"medium", kw:["contract","expir","extension","release clause","free agent","bosman","renew","new deal","leaving","exit","talks","unsigned","out of contract"] },
  performance: { icon:"⭐", sev:"low",    kw:["hat-trick","motm","man of the match","player of","goal of","record","milestone","brace","masterclass"] },
  discipline:  { icon:"🟥", sev:"medium", kw:["red card","suspended","ban","banned","disciplin","fine","misconduct"] },
  club:        { icon:"🏟️", sev:"low",    kw:["sack","fired","resign","new manager","relegat","promoted","champion"] },
};

function classify(text) {
  const t = (text||"").toLowerCase();
  for (const [type, cfg] of Object.entries(TRIGGERS))
    if (cfg.kw.some(kw => t.includes(kw)))
      return { type, icon: cfg.icon, severity: cfg.sev };
  return null;
}

// ── RSS parser (zero dependencies) ──────────────────────────────────
function parseRSS(xml) {
  const items = [];
  const re = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const r = m[1];
    const get = (tag) =>
      r.match(new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`))?.[1] ||
      r.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))?.[1] || "";
    const title = get("title").trim();
    const desc  = get("description").replace(/<[^>]+>/g,"").trim().slice(0,350);
    const link  = get("link").trim();
    const pub   = get("pubDate");
    let src = r.match(/<source[^>]*>([^<]*)<\/source>/)?.[1] || "";
    if (!src && link) { try { src = new URL(link).hostname.replace("www.",""); } catch(e){} }
    if (title) items.push({ title, desc, link, pub, src });
  }
  return items;
}

// ── Supabase REST helpers ────────────────────────────────────────────
const H = { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}`, "Content-Type": "application/json" };

async function sbInsert(table, data) {
  return fetch(`${SB_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...H, "Prefer": "return=minimal,resolution=ignore-duplicates" },
    body: JSON.stringify(data)
  });
}

async function sbExists(url) {
  if (!url) return false;
  const r = await fetch(`${SB_URL}/rest/v1/alerts?url=eq.${encodeURIComponent(url)}&select=id&limit=1`, { headers: H });
  const d = await r.json().catch(() => []);
  return Array.isArray(d) && d.length > 0;
}

// ── Email digest via Resend ──────────────────────────────────────────
async function sendDigest(alerts) {
  if (!RESEND || !alerts.length) return;
  const rows = alerts.map(a =>
    `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee">${a.icon} <b>${a.trigger_type.toUpperCase()}</b></td>
     <td style="padding:8px 12px;border-bottom:1px solid #eee">${a.player_name}</td>
     <td style="padding:8px 12px;border-bottom:1px solid #eee"><a href="${a.url||'#'}" style="color:#1d4ed8">${(a.headline||"").slice(0,80)}…</a></td>
     <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#9CA3AF;font-size:11px">${a.source||""}</td></tr>`
  ).join("");

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${RESEND}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Transfer365 Alerts <noreply@transfer365.net>",
      to: ["engelasaf@gmail.com"],
      subject: `⚽ Transfer365 — ${alerts.length} new alert${alerts.length>1?"s":""} detected`,
      html: `<div style="font-family:-apple-system,sans-serif;max-width:680px;margin:auto;padding:32px">
        <div style="background:#0D1F14;padding:18px 24px;border-radius:10px;margin-bottom:24px">
          <span style="color:#22C55E;font-weight:700;font-size:18px">Transfer365</span>
          <span style="color:rgba(255,255,255,.5);font-size:13px;margin-left:12px">Automated Intelligence Scan</span>
        </div>
        <p style="color:#374151">Detected <b>${alerts.length} new alert${alerts.length>1?"s":""}</b> from the last 30 minutes across 9 tracked players.</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin:16px 0">
          <tr style="background:#F3F4F6"><th style="padding:8px 12px;text-align:left">Type</th><th style="padding:8px 12px;text-align:left">Player</th><th style="padding:8px 12px;text-align:left">Headline</th><th style="padding:8px 12px;text-align:left">Source</th></tr>
          ${rows}
        </table>
        <div style="text-align:center;margin-top:24px">
          <a href="https://transfer365.net/app" style="background:#22C55E;color:#052E0A;padding:12px 28px;border-radius:8px;font-weight:700;text-decoration:none;display:inline-block">Open Transfer365 →</a>
        </div>
        <p style="color:#9CA3AF;font-size:11px;text-align:center;margin-top:20px">Transfer365 · Automated every 30 minutes · transfer365.net</p>
      </div>`
    })
  }).catch(e => console.warn("Email send failed:", e.message));
}

// ── Main export ──────────────────────────────────────────────────────
export default async () => {
  const started = Date.now();
  const log = { players:0, articles:0, alerts:0, errors:[] };

  // Step 1: Ensure tables exist (idempotent)
  await ensureTables();

  const newAlerts = [];

  // Step 2: Scan each player
  for (const player of PLAYERS) {
    try {
      const url = `https://news.google.com/rss/search?q=${player.q}+football&hl=en&gl=GB&ceid=GB:en`;
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; Transfer365/1.0 +https://transfer365.net)" }
      });
      if (!res.ok) { log.errors.push(`${player.id}:HTTP${res.status}`); continue; }

      const xml = await res.text();
      const items = parseRSS(xml);
      log.articles += items.length;
      log.players++;

      // Only articles from last 6 hours
      const cutoff = Date.now() - 6 * 3600 * 1000;
      const fresh = items.filter(it => {
        if (!it.pub) return true;
        const d = new Date(it.pub);
        return isNaN(d.getTime()) || d.getTime() > cutoff;
      });

      for (const item of fresh.slice(0, 5)) { // max 5 per player per scan
        const trigger = classify(item.title + " " + item.desc);
        if (!trigger) continue;
        if (await sbExists(item.link)) continue; // already stored

        const alert = {
          player_id:    player.id,
          player_name:  player.name,
          trigger_type: trigger.type,
          headline:     item.title.slice(0, 250),
          summary:      item.desc.slice(0, 400),
          source:       item.src,
          url:          item.link || null,
          icon:         trigger.icon,
          severity:     trigger.severity,
          published_at: item.pub ? new Date(item.pub).toISOString() : null,
        };

        const ins = await sbInsert("alerts", alert);
        if (ins.status === 201 || ins.status === 200) {
          log.alerts++;
          newAlerts.push(alert);
        }
      }
    } catch(e) {
      log.errors.push(`${player.id}:${e.message.slice(0,60)}`);
    }
  }

  // Step 3: Log scan
  await sbInsert("scan_log", {
    players_scanned: log.players,
    articles_found:  log.articles,
    alerts_created:  log.alerts,
  }).catch(() => {});

  // Step 4: Email digest if new alerts found
  if (newAlerts.length > 0) await sendDigest(newAlerts);

  const summary = {
    ...log,
    duration_ms: Date.now() - started,
    next_scan: "in ~30 minutes",
    timestamp: new Date().toISOString()
  };
  console.log("Transfer365 Scan complete:", JSON.stringify(summary));
  return new Response(JSON.stringify(summary, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
};

export const config = {
  schedule: "*/30 * * * *"
};
