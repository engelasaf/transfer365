// netlify/functions/search-players.mjs
// GET /api/search-players?q=PLAYER_NAME
// Searches API-Football for players by name

function getEnv(k) {
  try { if (process.env[k]) return process.env[k]; } catch(e) {}
  try { return Netlify.env.get(k) || ''; } catch(e) {}
  return '';
}

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

const POS_MAP = {
  Goalkeeper: 'שוער', Defender: 'בלם', Midfielder: 'קשר',
  Attacker: 'חלוץ', Forward: 'חלוץ', Winger: 'חלוץ',
};

export default async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

  const url   = new URL(req.url);
  const query = (url.searchParams.get('q') || '').trim();

  if (!query || query.length < 2) {
    return Response.json({ players: [], error: 'Query too short' }, { headers: CORS });
  }

  const API_KEY = getEnv('API_FOOTBALL_KEY');

  // If no API key, return mock helpful message
  if (!API_KEY) {
    return Response.json({
      players: [],
      error: 'API_FOOTBALL_KEY not configured',
      hint: 'Add API_FOOTBALL_KEY to Netlify env vars from api-football.com',
    }, { headers: CORS });
  }

  try {
    // Search by player name
    const r = await fetch(
      `https://v3.football.api-sports.io/players?search=${encodeURIComponent(query)}&season=2024`,
      {
        headers: {
          'x-rapidapi-key': API_KEY,
          'x-rapidapi-host': 'v3.football.api-sports.io',
        },
      }
    );

    if (!r.ok) throw new Error(`API error ${r.status}`);
    const data = await r.json();
    const raw  = data.response || [];

    const players = raw.slice(0, 12).map(item => {
      const p  = item.player || {};
      const st = (item.statistics || [])[0] || {};
      const pos = POS_MAP[p.position] || p.position || '';
      return {
        id:          p.id,
        name:        p.name || '',
        pos,
        tm:          st?.team?.name || '',
        age:         p.age || '',
        nationality: p.nationality || '',
        photo:       p.photo || '',
        sal:         0,
        val:         0,
        pp:          p.nationality === 'Israel' ? 'IL' : (p.nationality || ''),
        days:        365,
        st:          'active',
        g:           st?.goals?.total || 0,
        a:           st?.goals?.assists || 0,
        rat:         parseFloat(st?.games?.rating) || 7.0,
      };
    });

    return Response.json({ players, total: data.paging?.total || players.length }, { headers: CORS });

  } catch(e) {
    console.error('search-players error:', e.message);
    return Response.json({ players: [], error: e.message }, { headers: CORS });
  }
};

export const config = { path: '/api/search-players' };
