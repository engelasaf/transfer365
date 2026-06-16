// netlify/functions/scan-news.mjs
// Scheduled: every 30 minutes — env vars loaded — scans Google News RSS per player
// Env vars needed: SUPABASE_URL, SUPABASE_KEY, RESEND_KEY

const SB_URL = process.env.SUPABASE_URL || "https://hivyothlbntxcbsilktp.supabase.co";
const SB_KEY = process.env.SUPABASE_KEY  || "";
const RESEND  = process.env.RESEND_KEY   || "";

// ── Players to track ────────────────────────────────────────────────
const PLAYERS = [
  { id:"wirtz",    name:"Florian Wirtz",            q:"Florian+Wirtz" },
  { id:"calvert",  name:"Dominic Calvert-Lewin",    q:"Calvert-Lewin" },
  { id:"hato",     name:"Jorrel Hato",              q:"Jorrel+Hato" },
  { id:"gyok",     name:"Viktor Gyokeres",          q:"Viktor+Gyokeres" },
  { id:"donna",    name:"Gianluigi Donnarumma",     q:"Donnarumma" },
  { id:"olise",    name:"Michael Olise",            q:"Michael+Olise" },
  { id:"kerkez",   name:"Milos Kerkez",             q:"Milos+Kerkez" },
  { id:"nkunku",   name:"Christopher Nkunku",       q:"Nkunku" },
  { id:"gvardiol", name:"Josko Gvardiol",           q:"Gvardiol" },
];

// ── Trigger classifier ───────────────────────────────────────────────
const TRIGGERS = {
  injury: {
    icon:"🏥", severity:"high",
    kw:["injur","ruled out","out for","hamstring","knee","ankle","acl","surgery",
        "muscle","scan","absent","miss","doubtful","blow","fitness","sidelined","setback"]
  },
  transfer: {
    icon:"🔄", severity:"high",
    kw:["transfer","signing","bid","interest","linked","move","fee","deal","swap",
        "loan","target","want","pursue","approach","offer","accept","agree","contract agreed"]
  },
  contract: {
    icon:"📋", severity:"medium",
    kw:["contract","expir","extension","release clause","free agent","bosman",
        "renew","new deal","leaving","exit","talks","unsigned"]
  },
  performance: {
    icon:"⭐", severity:"low",
    kw:["hat-trick","motm","man of the match","player of","goal of",
        "record","milestone","brilliant","sensational","masterclass"]
  },
  discipline: {
    icon:"🟥", severity:"medium",
    kw:["red card","suspended","ban","banned","disciplin","fine","misconduct"]
  },
  club: {
    icon:"🏟️", severity:"low",
    kw:["sack","fired","resign","new manager","relegat","champion","promoted"]
  },
};

function classify(text) {
  const t = text.toLowerCase();
  for (const [type, cfg] of Object.entries(TRIGGERS)) {
    if (cfg.kw.some(kw => t.includes(kw))) return { type, ...cfg };
  }
  return null;
}

// ── RSS parser (no npm) ──────────────────────────────────────────────
function parseRSS(xml) {
  const items = [];
  const re = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const raw = m[1];
    const title = (raw.match(/<title><!\[CDATA\[(.*?)\]\]>/s)?.[1] ||
                   raw.match(/<title>(.*?)<\/title>/s)?.[1] || "").trim();
    const desc  = (raw.match(/<description><!\[CDATA\[(.*?)\]\]>/s)?.[1] ||
                   raw.match(/<description>(.*?)<\/description>/s)?.[1] || "")
                  .replace(/<[^>]+>/g,"").trim().slice(0,300);
    const link  = (raw.match(/<link>(.*?)<\/link>/s)?.[1] || "").trim();
    const pub   = raw.match(/<pubDate>(.*?)<\/pubDate>/s)?.[1] || "";
    const src   = raw.match(/<source[^>]*>(.*?)<\/source>/s)?.[1] || 
                  new URL(link || "https://x").hostname.replace("www.","");
    if (title) items.push({ title, desc, link, pub, src });
  }
  return items;
}

// ── Supabase helpers ─────────────────────────────────────────────────
async function sb_insert(table, data) {
  return fetch(`${SB_URL}/rest/v1/${table}`, {
    method:"POST",
    headers:{
      "apikey": SB_KEY,
      "Authorization": `Bearer ${SB_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=minimal,resolution=ignore-duplicates"
    },
    body: JSON.stringify(data)
  });
}

async function sb_exists(url) {
  const res = await fetch(
    `${SB_URL}/rest/v1/alerts?url=eq.${encodeURIComponent(url)}&select=id&limit=1`,
    { headers:{ "apikey":SB_KEY, "Authorization":`Bearer ${SB_KEY}` } }
  );
  const d = await res.json();
  return Array.isArray(d) && d.length > 0;
}

// ── Email digest ────────────────────────────────────────────────────
async function sendDigest(newAlerts) {
  if (!RESEND || !newAlerts.length) return;
  const rows = newAlerts.map(a =>
    `<tr style="border-bottom:1px solid #eee">
      <td style="padding:8px 12px">${a.icon} ${a.trigger_type.toUpperCase()}</td>
      <td style="padding:8px 12px"><b>${a.player_name}</b></td>
      <td style="padding:8px 12px"><a href="${a.url}">${a.headline.slice(0,80)}…</a></td>
      <td style="padding:8px 12px;color:#9CA3AF;font-size:11px">${a.source}</td>
    </tr>`).join("");

  await fetch("https://api.resend.com/emails", {
    method:"POST",
    headers:{ "Authorization":`Bearer ${RESEND}`, "Content-Type":"application/json" },
    body:JSON.stringify({
      from: "Transfer365 Alerts <noreply@transfer365.net>",
      to: ["support@transfer365.net"], // TODO: per-user email
      subject: `Transfer365 — ${newAlerts.length} new alert${newAlerts.length>1?"s":""} (${new Date().toUTCString().slice(0,16)})`,
      html: `<!DOCTYPE html><html><body style="font-family:-apple-system,sans-serif;max-width:700px;margin:auto;padding:32px">
        <div style="background:#0D1F14;padding:20px 24px;border-radius:10px;margin-bottom:24px">
          <span style="color:#22C55E;font-weight:700;font-size:18px">Transfer365</span>
          <span style="color:rgba(255,255,255,.5);font-size:13px;margin-left:12px">Live Alert Digest</span>
        </div>
        <p style="color:#374151">You have <b>${newAlerts.length} new transfer intelligence alert${newAlerts.length>1?"s":""}</b> from the last 30 minutes.</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead><tr style="background:#F3F4F6">
            <th style="padding:8px 12px;text-align:left">Type</th>
            <th style="padding:8px 12px;text-align:left">Player</th>
            <th style="padding:8px 12px;text-align:left">Headline</th>
            <th style="padding:8px 12px;text-align:left">Source</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="margin-top:24px;text-align:center">
          <a href="https://transfer365.net/app" style="background:#22C55E;color:#052E0A;padding:12px 28px;border-radius:8px;font-weight:700;text-decoration:none">Open Transfer365</a>
        </p>
        <p style="color:#9CA3AF;font-size:11px;text-align:center;margin-top:24px">Transfer365 · Automated intelligence scan · transfer365.net</p>
      </body></html>`
    })
  });
}

// ── Main scan ────────────────────────────────────────────────────────
export default async () => {
  const results = { players:0, articles:0, alerts:0, errors:[] };

  for (const player of PLAYERS) {
    try {
      // Google News RSS — free, no auth, player-specific
      const rssUrl = `https://news.google.com/rss/search?q=${player.q}+football&hl=en&gl=GB&ceid=GB:en`;
      const res = await fetch(rssUrl, {
        headers:{ "User-Agent":"Mozilla/5.0 (compatible; Transfer365-Scanner/1.0)" }
      });
      if (!res.ok) { results.errors.push(`${player.id}: HTTP ${res.status}`); continue; }

      const xml = await res.text();
      const items = parseRSS(xml);
      results.articles += items.length;
      results.players++;

      // Filter: only articles from last 6 hours
      const cutoff = Date.now() - 6 * 3600 * 1000;
      const recent = items.filter(it => {
        const d = new Date(it.pub);
        return !isNaN(d) ? d.getTime() > cutoff : true;
      });

      for (const item of recent) {
        // Classify
        const trigger = classify(item.title + " " + item.desc);
        if (!trigger) continue;

        // Skip if already stored
        if (item.link && await sb_exists(item.link)) continue;

        const alert = {
          player_id:    player.id,
          player_name:  player.name,
          trigger_type: trigger.type,
          headline:     item.title.slice(0,250),
          summary:      item.desc.slice(0,400),
          source:       item.src,
          url:          item.link || null,
          icon:         trigger.icon,
          severity:     trigger.severity,
          published_at: item.pub ? new Date(item.pub).toISOString() : null,
        };

        const ins = await sb_insert("alerts", alert);
        if (ins.status === 201 || ins.status === 200) results.alerts++;
      }
    } catch(e) {
      results.errors.push(`${player.id}: ${e.message}`);
    }
  }

  // Log this scan
  await sb_insert("scan_log", {
    players_scanned: results.players,
    articles_found:  results.articles,
    alerts_created:  results.alerts,
  });

  console.log("Transfer365 Scan:", JSON.stringify(results));
  return new Response(JSON.stringify(results), { headers:{"Content-Type":"application/json"} });
};

export const config = {
  schedule: "*/30 * * * *"
};
