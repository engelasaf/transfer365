// netlify/functions/scan-news.mjs
// Scheduled: every 30 min | Auto-creates DB | Emails digest
const SB_URL = process.env.SUPABASE_URL || "";
const SB_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || "";
const SB_PAT = process.env.SUPABASE_PAT || "";
const RESEND  = process.env.RESEND_API_KEY || process.env.RESEND_KEY || "";
const REF     = (SB_URL.match(/\/\/([^.]+)\.supabase\.co/) || [])[1] || "";

const SQL_SETUP = `
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id TEXT NOT NULL, player_name TEXT NOT NULL,
  trigger_type TEXT NOT NULL, headline TEXT NOT NULL,
  summary TEXT, source TEXT, url TEXT UNIQUE, icon TEXT,
  severity TEXT DEFAULT 'medium', published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='alerts' AND policyname='pub_r') THEN CREATE POLICY pub_r ON public.alerts FOR SELECT USING (true); END IF;
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='alerts' AND policyname='pub_i') THEN CREATE POLICY pub_i ON public.alerts FOR INSERT WITH CHECK (true); END IF;
END $$;
CREATE TABLE IF NOT EXISTS public.scan_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scanned_at TIMESTAMPTZ DEFAULT NOW(),
  players_scanned INTEGER, articles_found INTEGER, alerts_created INTEGER
);
ALTER TABLE public.scan_log ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='scan_log' AND policyname='pub_rl') THEN CREATE POLICY pub_rl ON public.scan_log FOR SELECT USING (true); END IF;
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='scan_log' AND policyname='pub_il') THEN CREATE POLICY pub_il ON public.scan_log FOR INSERT WITH CHECK (true); END IF;
END $$;
CREATE TABLE IF NOT EXISTS public.agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  telegram TEXT,
  plan TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='agents' AND policyname='pub_ra') THEN CREATE POLICY pub_ra ON public.agents FOR SELECT USING (true); END IF;
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='agents' AND policyname='pub_ia') THEN CREATE POLICY pub_ia ON public.agents FOR INSERT WITH CHECK (true); END IF;
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='agents' AND policyname='pub_ua') THEN CREATE POLICY pub_ua ON public.agents FOR UPDATE USING (true); END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_al_p ON public.alerts(player_id);
CREATE INDEX IF NOT EXISTS idx_al_ts ON public.alerts(created_at DESC);
`;

async function ensureTables() {
  const chk = await fetch(`${SB_URL}/rest/v1/alerts?limit=1`, {headers:{"apikey":SB_KEY,"Authorization":`Bearer ${SB_KEY}`}});
  if (chk.ok) return;
  if (!SB_PAT) return;
  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`,{
    method:"POST",headers:{"Authorization":`Bearer ${SB_PAT}`,"Content-Type":"application/json"},
    body:JSON.stringify({query:SQL_SETUP})
  });
  console.log(`DB auto-setup: ${r.status}`);
}

const PLAYERS = [
  {id:"wirtz",    name:"Florian Wirtz",         q:"Florian+Wirtz",         club:"Liverpool"},
  {id:"calvert",  name:"Dominic Calvert-Lewin", q:"Calvert-Lewin",         club:"Leeds Utd"},
  {id:"hato",     name:"Jorrel Hato",           q:"Jorrel+Hato",           club:"Chelsea"},
  {id:"gyok",     name:"Viktor Gyokeres",       q:"Viktor+Gyokeres",       club:"Arsenal"},
  {id:"donna",    name:"Gianluigi Donnarumma",  q:"Donnarumma+goalkeeper", club:"PSG"},
  {id:"olise",    name:"Michael Olise",         q:"Michael+Olise+Bayern",  club:"Bayern"},
  {id:"kerkez",   name:"Milos Kerkez",          q:"Milos+Kerkez",          club:"Liverpool"},
  {id:"nkunku",   name:"Christopher Nkunku",    q:"Nkunku+Chelsea",        club:"Chelsea"},
  {id:"gvardiol", name:"Josko Gvardiol",        q:"Gvardiol+Manchester",   club:"Man City"},
];

const TRIGGERS = {
  injury:      {icon:"🏥",sev:"high",  badgeBg:"#FEE2E2",badgeC:"#DC2626", kw:["injur","ruled out","out for","hamstring","knee","ankle","acl","surgery","muscle","sidelined","fitness","absent","weeks","setback"]},
  transfer:    {icon:"🔄",sev:"high",  badgeBg:"#DBEAFE",badgeC:"#1D4ED8", kw:["transfer","signing","bid","interest","linked","move","fee","deal","loan","target","approach","offer","agree","swap"]},
  contract:    {icon:"📋",sev:"medium",badgeBg:"#FEF3C7",badgeC:"#D97706", kw:["contract","expir","extension","release clause","free agent","bosman","renew","new deal","leaving","exit","talks"]},
  performance: {icon:"⭐",sev:"low",  badgeBg:"#FEF9C3",badgeC:"#CA8A04", kw:["hat-trick","motm","man of the match","player of","goal of","record","milestone","brace"]},
  discipline:  {icon:"🟥",sev:"medium",badgeBg:"#FEE2E2",badgeC:"#B91C1C", kw:["red card","suspended","ban","banned","disciplin","fine"]},
  club:        {icon:"🏟️",sev:"low",  badgeBg:"#F3E8FF",badgeC:"#7C3AED", kw:["sack","fired","resign","new manager","relegat","promoted"]},
};

function classify(text) {
  const t=(text||"").toLowerCase();
  for(const[type,cfg]of Object.entries(TRIGGERS))
    if(cfg.kw.some(kw=>t.includes(kw)))
      return{type,icon:cfg.icon,severity:cfg.sev,badgeBg:cfg.badgeBg,badgeC:cfg.badgeC};
  return null;
}

function parseRSS(xml){
  const items=[];const re=/<item>([\s\S]*?)<\/item>/g;let m;
  while((m=re.exec(xml))!==null){
    const r=m[1];
    const get=tag=>r.match(new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`))?.[1]||r.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))?.[1]||"";
    const title=get("title").trim(),desc=get("description").replace(/<[^>]+>/g,"").trim().slice(0,280);
    let rawLink=get("link").trim();
    // Strip any HTML tags that might wrap the URL in some RSS feeds
    rawLink=rawLink.replace(/<[^>]+>/g,"").trim();
    // Also try to extract URL from href= if it's embedded as HTML
    const hrefMatch=r.match(/href="(https?[^"]+)"/);
    const link=(rawLink.startsWith("http")?rawLink:hrefMatch?.[1]||rawLink).trim();
    const pub=get("pubDate");
    let src=r.match(/<source[^>]*>([^<]*)<\/source>/)?.[1]||"";
    if(!src&&link){try{src=new URL(link).hostname.replace("www.","");}catch(e){}}
    if(title)items.push({title,desc,link,pub,src});
  }
  return items;
}

const H={"apikey":SB_KEY,"Authorization":`Bearer ${SB_KEY}`,"Content-Type":"application/json"};
async function sbInsert(table,data){
  return fetch(`${SB_URL}/rest/v1/${table}`,{method:"POST",headers:{...H,"Prefer":"return=minimal,resolution=ignore-duplicates"},body:JSON.stringify(data)});
}
async function sbExists(url){
  if(!url)return false;
  const r=await fetch(`${SB_URL}/rest/v1/alerts?url=eq.${encodeURIComponent(url)}&select=id&limit=1`,{headers:H});
  const d=await r.json().catch(()=>[]);return Array.isArray(d)&&d.length>0;
}

function timeAgo(pub){
  if(!pub)return"";
  const d=Date.now()-new Date(pub).getTime();
  if(d<3600000)return Math.floor(d/60000)+"m ago";
  if(d<86400000)return Math.floor(d/3600000)+"h ago";
  return Math.floor(d/86400000)+"d ago";
}

// ── Beautiful mobile-first email ────────────────────────────────────
function buildEmail(alerts, scanTime) {
  const playerCount = [...new Set(alerts.map(a=>a.player_id))].length;
  const scanDate = new Date(scanTime).toLocaleString("en-GB",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit",timeZone:"Europe/London"});

  const alertCards = alerts.map(a => {
    const t = TRIGGERS[a.trigger_type]||TRIGGERS.transfer;
    const abbr = a.player_name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
    const player = PLAYERS.find(p=>p.id===a.player_id);
    const ta = timeAgo(a.published_at||a.created_at);
    const safeUrl=(a.url||"").replace(/<[^>]+>/g,"").trim();
    const validUrl=safeUrl.startsWith("http")?safeUrl:"";
    return `
    <tr>
      <td style="padding:0 16px 16px">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
               style="background:#FFFFFF;border:1px solid #E5E7EB;border-radius:12px;overflow:hidden">
          <tr>
            <!-- Left accent bar by severity -->
            <td width="4" style="background:${t.badgeC};border-radius:12px 0 0 12px">&nbsp;</td>
            <td style="padding:14px 16px">
              <table width="100%" cellpadding="0" cellspacing="0">
                <!-- Row 1: badge + player name + club -->
                <tr>
                  <td>
                    <span style="background:${t.badgeBg};color:${t.badgeC};font-size:10px;font-weight:800;
                      padding:3px 8px;border-radius:20px;text-transform:uppercase;letter-spacing:0.06em;
                      display:inline-block">${a.trigger_type}</span>
                    <span style="color:#111827;font-size:13px;font-weight:700;margin-left:8px">${a.player_name}</span>
                    ${player?`<span style="color:#9CA3AF;font-size:12px;margin-left:4px">· ${player.club}</span>`:""}
                  </td>
                </tr>
                <!-- Row 2: headline -->
                <tr><td style="padding-top:8px">
                  <p style="margin:0;color:#111827;font-size:14px;font-weight:600;line-height:1.45">
                    ${(a.headline||"").slice(0,110)}${(a.headline||"").length>110?"…":""}
                  </p>
                </td></tr>
                ${a.summary?`
                <tr><td style="padding-top:5px">
                  <p style="margin:0;color:#6B7280;font-size:12px;line-height:1.5">
                    ${a.summary.slice(0,140)}…
                  </p>
                </td></tr>`:""}
                <!-- Row 3: source + read button -->
                <tr><td style="padding-top:10px">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="color:#9CA3AF;font-size:11px;vertical-align:middle">
                        ${a.source||""}${ta?` · ${ta}`:""}
                      </td>
                      ${validUrl?`
                      <td align="right" style="vertical-align:middle">
                        <a href="${validUrl}" target="_blank"
                           style="background:#0D1F14;color:#22C55E;font-size:12px;font-weight:700;
                                  padding:6px 14px;border-radius:8px;text-decoration:none;
                                  display:inline-block;white-space:nowrap">
                          Read article →
                        </a>
                      </td>`:""}
                    </tr>
                  </table>
                </td></tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
  }).join("");

  const highCount = alerts.filter(a=>TRIGGERS[a.trigger_type]?.sev==="high").length;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta name="color-scheme" content="light">
<title>Transfer365 Alert</title>
</head>
<body style="margin:0;padding:0;background:#F0F4F8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased">

<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
<tr><td align="center" style="padding:24px 12px">
  <table width="100%" style="max-width:580px" cellpadding="0" cellspacing="0" border="0">

    <!-- HEADER -->
    <tr>
      <td style="background:linear-gradient(135deg,#071A09 0%,#0D2B12 100%);border-radius:14px 14px 0 0;padding:22px 24px">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <span style="color:#22C55E;font-size:22px;font-weight:800;letter-spacing:-0.5px">Transfer365</span>
            </td>
            <td align="right">
              <span style="background:rgba(34,197,94,0.15);border:1px solid rgba(34,197,94,0.4);color:#22C55E;
                           font-size:11px;font-weight:700;padding:4px 10px;border-radius:20px;letter-spacing:0.05em">
                ● LIVE SCAN
              </span>
            </td>
          </tr>
          <tr>
            <td colspan="2" style="padding-top:6px;color:rgba(255,255,255,0.5);font-size:12px">
              ${scanDate} GMT · ${alerts.length} alert${alerts.length!==1?"s":""} across ${playerCount} player${playerCount!==1?"s":""}
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- ALERT CARDS -->
    <tr>
      <td style="background:#F8FAFC;padding:16px 0 4px">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${alertCards}
        </table>
      </td>
    </tr>

    <!-- STATS BAR -->
    <tr>
      <td style="background:#FFFFFF;border-top:1px solid #E5E7EB;padding:16px 24px">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="border-right:1px solid #E5E7EB">
              <div style="font-size:22px;font-weight:800;color:#111827">${highCount}</div>
              <div style="font-size:11px;color:#9CA3AF;margin-top:2px">High priority</div>
            </td>
            <td align="center" style="border-right:1px solid #E5E7EB">
              <div style="font-size:22px;font-weight:800;color:#111827">${playerCount}</div>
              <div style="font-size:11px;color:#9CA3AF;margin-top:2px">Players tracked</div>
            </td>
            <td align="center">
              <div style="font-size:22px;font-weight:800;color:#111827">${alerts.length}</div>
              <div style="font-size:11px;color:#9CA3AF;margin-top:2px">Total alerts</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- CTA -->
    <tr>
      <td style="background:#0D1F14;border-radius:0 0 14px 14px;padding:20px 24px;text-align:center">
        <a href="https://transfer365.net/app" target="_blank"
           style="background:#22C55E;color:#0A1A0B;font-size:14px;font-weight:800;
                  padding:12px 32px;border-radius:8px;text-decoration:none;
                  display:inline-block;letter-spacing:0.01em">
          Open Transfer365 →
        </a>
        <p style="margin:14px 0 0;color:rgba(255,255,255,0.35);font-size:11px;line-height:1.6">
          Transfer365 · Intelligence for football agents ·
          <a href="https://transfer365.net" target="_blank" style="color:#22C55E;text-decoration:none">transfer365.net</a>
        </p>
        <p style="margin:6px 0 0;color:rgba(255,255,255,0.25);font-size:10px">
          Automated scan every 30 minutes · ${PLAYERS.length} players monitored ·
          <a href="https://transfer365.net/app" target="_blank"
             style="color:rgba(255,255,255,0.35);text-decoration:underline">Manage alerts</a>
        </p>
      </td>
    </tr>

  </table>
</td></tr>
</table>

</body>
</html>`;

