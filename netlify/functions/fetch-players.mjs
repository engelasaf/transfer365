// netlify/functions/fetch-players.mjs
// GET /api/fetch-players?league=271&season=2025
// Fetches live player data from API-Football and upserts into Supabase

const API_BASE  = "https://v3.football.api-sports.io";
const ISR_LEAGUE = 271;   // Israeli Premier League (Ligat Ha'al)
const SEASON    = 2025;

async function apiFetch(endpoint, params, apiKey) {
  const url = new URL(API_BASE + endpoint);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const r = await fetch(url.toString(), {
    headers: {
      "x-apisports-key": apiKey,
      "Accept": "application/json",
    },
  });
  if (!r.ok) throw new Error(`API-Football ${endpoint}: ${r.status}`);
  return r.json();
}

async function supabaseUpsert(sbUrl, sbKey, table, rows) {
  const r = await fetch(`${sbUrl}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      "apikey": sbKey,
      "Authorization": `Bearer ${sbKey}`,
      "Content-Type": "application/json",
      "Prefer": "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(rows),
  });
  if (!r.ok) {
    const err = await r.text();
    throw new Error(`Supabase upsert ${table}: ${err}`);
  }
  return rows.length;
}

export default async (req) => {
  const API_KEY = Netlify.env.get("API_FOOTBALL_KEY");
  const SB_URL  = Netlify.env.get("SUPABASE_URL");
  const SB_KEY  = Netlify.env.get("SUPABASE_ANON_KEY");

  if (!API_KEY) return Response.json({ error: "API_FOOTBALL_KEY not set" }, { status: 500 });
  if (!SB_URL || !SB_KEY) return Response.json({ error: "Supabase not configured" }, { status: 500 });

  const url    = new URL(req.url);
  const league = url.searchParams.get("league") || ISR_LEAGUE;
  const season = url.searchParams.get("season") || SEASON;

  try {
    const results = { players: 0, injuries: 0, transfers: 0 };

    // ── 1. Fetch squads for all teams in the league ──────────────────
    const teamsData = await apiFetch("/teams", { league, season }, API_KEY);
    const teams     = teamsData.response || [];

    const playerRows = [];
    const teamMap    = {};

    for (const { team } of teams.slice(0, 16)) {
      teamMap[team.id] = team.name;
      // Short delay to respect rate limit (10 req/min on free tier)
      await new Promise(r => setTimeout(r, 6500));
      const pData = await apiFetch("/players", {
        team:   team.id,
        season,
        league,
      }, API_KEY);

      for (const { player, statistics } of (pData.response || [])) {
        const stat = statistics?.[0] || {};
        playerRows.push({
          player_id:     player.id,
          name:          player.name,
          firstname:     player.firstname,
          lastname:      player.lastname,
          age:           player.age,
          nationality:   player.nationality,
          photo:         player.photo,
          position:      stat.games?.position || "Unknown",
          team_id:       team.id,
          team_name:     team.name,
          games_played:  stat.games?.appearences || 0,
          goals:         stat.goals?.total || 0,
          assists:       stat.goals?.assists || 0,
          rating:        parseFloat(stat.games?.rating) || 0,
          minutes:       stat.games?.minutes || 0,
          league_id:     parseInt(league),
          season:        parseInt(season),
          updated_at:    new Date().toISOString(),
        });
      }
    }

    if (playerRows.length > 0) {
      results.players = await supabaseUpsert(SB_URL, SB_KEY, "t365_players", playerRows);
    }

    // ── 2. Fetch current injuries in the league ──────────────────────
    await new Promise(r => setTimeout(r, 6500));
    const injData = await apiFetch("/injuries", { league, season }, API_KEY);
    const injRows = (injData.response || []).map(({ player, team }) => ({
      player_id:   player.id,
      player_name: player.name,
      team_name:   team.name,
      injury_type: player.type,
      reason:      player.reason,
      league_id:   parseInt(league),
      season:      parseInt(season),
      updated_at:  new Date().toISOString(),
    }));

    if (injRows.length > 0) {
      results.injuries = await supabaseUpsert(SB_URL, SB_KEY, "t365_injuries", injRows);
    }

    return Response.json({
      success: true,
      league,
      season,
      teams: teams.length,
      ...results,
      timestamp: new Date().toISOString(),
    });

  } catch (e) {
    console.error("fetch-players error:", e.message);
    return Response.json({ error: e.message }, { status: 500 });
  }
};

export const config = { path: "/api/fetch-players" };
