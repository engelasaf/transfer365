// netlify/functions/tm-player.mjs
// GET /api/tm-player?url=TRANSFERMARKT_URL
// Extracts player data from Transfermarkt URL

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

const POS_MAP_EN = {
  'Centre-Back': 'בלם', 'Left-Back': 'מגן', 'Right-Back': 'מגן',
  'Defensive Midfield': 'קשר', 'Central Midfield': 'קשר',
  'Attacking Midfield': 'קשר', 'Left Midfield': 'קשר', 'Right Midfield': 'קשר',
  'Left Winger': 'חלוץ', 'Right Winger': 'חלוץ',
  'Centre-Forward': 'חלוץ', 'Second Striker': 'חלוץ',
  'Goalkeeper': 'שוער',
};

export default async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

  const url    = new URL(req.url);
  const tmUrl  = (url.searchParams.get('url') || '').trim();

  if (!tmUrl || !tmUrl.includes('transfermarkt.com')) {
    return Response.json({ error: 'Invalid Transfermarkt URL' }, { headers: CORS });
  }

  // Extract player ID from URL
  // URL format: /player-name/profil/spieler/12345
  const idMatch = tmUrl.match(/spieler\/(\d+)/);
  if (!idMatch) {
    return Response.json({ error: 'Could not find player ID in URL' }, { headers: CORS });
  }
  const playerId = idMatch[1];

  try {
    // Use Transfermarkt's unofficial API
    const apiUrl = `https://transfermarkt-api.fly.dev/players/${playerId}/profile`;
    const r = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Transfer365/1.0 (football agent platform)',
        'Accept': 'application/json',
      },
    });

    if (!r.ok) throw new Error(`TM API ${r.status}`);
    const d = await r.json();

    const pos = POS_MAP_EN[d.position] || d.position || '';
    const val = d.marketValue
      ? parseFloat(d.marketValue.replace(/[€kmM,]/gi, m =>
          m==='k'?'':'e'===m?'':m==='m'||m==='M'?'000':''))
      : 0;

    const player = {
      name:        d.name || d.fullName || '',
      pos,
      tm:          d.club?.name || '',
      age:         d.age || '',
      nationality: d.nationality?.[0] || '',
      pp:          (d.nationality||[]).includes('Israel') ? 'IL' : (d.nationality?.[0]||''),
      val:         val || 0,
      sal:         0,
      days:        365,
      st:          'active',
      g: 0, a: 0, rat: 7.0,
      photo:       d.imageUrl || '',
    };

    return Response.json({ player, raw: d }, { headers: CORS });

  } catch(e) {
    console.error('tm-player error:', e.message);
    return Response.json({
      error: 'Could not fetch from Transfermarkt: ' + e.message,
      hint: 'Use manual entry instead',
    }, { headers: CORS });
  }
};

export const config = { path: '/api/tm-player' };
