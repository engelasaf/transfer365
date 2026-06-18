// netlify/functions/get-players.mjs
// GET /api/players?league=271&season=2025&limit=50
// Returns player data from Supabase for the app dashboard

export default async (req) => {
  const SB_URL = Netlify.env.get("SUPABASE_URL");
  const SB_KEY = Netlify.env.get("SUPABASE_ANON_KEY");
  if (!SB_URL || !SB_KEY) return Response.json({ error: "Supabase not configured" }, { status: 500 });

  const url    = new URL(req.url);
  const league = url.searchParams.get("league") || 271;
  const season = url.searchParams.get("season") || 2025;
  const limit  = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
  const pos    = url.searchParams.get("position");
  const team   = url.searchParams.get("team");

  try {
    let query = `t365_players?league_id=eq.${league}&season=eq.${season}`;
    if (pos)  query += `&position=eq.${encodeURIComponent(pos)}`;
    if (team) query += `&team_name=ilike.${encodeURIComponent("*" + team + "*")}`;
    query += `&order=rating.desc&limit=${limit}`;
    query += "&select=player_id,name,age,nationality,position,team_name,goals,assists,rating,minutes,photo,updated_at";

    const r = await fetch(`${SB_URL}/rest/v1/${query}`, {
      headers: { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}` },
    });
    if (!r.ok) throw new Error(`Supabase query failed: ${r.status}`);
    const players = await r.json();

    // Also fetch active injuries for these players
    const injR = await fetch(
      `${SB_URL}/rest/v1/t365_injuries?league_id=eq.${league}&season=eq.${season}&select=player_id,injury_type,reason`,
      { headers: { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}` } }
    );
    const injuries = injR.ok ? await injR.json() : [];
    const injMap   = Object.fromEntries(injuries.map(i => [i.player_id, i]));

    // Enrich players with injury status
    const enriched = players.map(p => ({
      ...p,
      injury:      injMap[p.player_id] || null,
      status:      injMap[p.player_id] ? "injury" : "active",
    }));

    return Response.json({
      success: true,
      count:   enriched.length,
      league,
      season,
      players: enriched,
    }, {
      headers: { "Cache-Control": "public, max-age=3600" },
    });

  } catch (e) {
    console.error("get-players error:", e.message);
    return Response.json({ error: e.message }, { status: 500 });
  }
};

export const config = { path: "/api/players" };
