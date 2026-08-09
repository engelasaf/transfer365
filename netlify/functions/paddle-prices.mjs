// netlify/functions/paddle-prices.mjs
// GET /api/paddle-prices
// Returns Paddle price IDs from Supabase config

function getEnv(k) {
  try { if (process.env[k]) return process.env[k]; } catch(e) {}
  try { return Netlify.env.get(k) || ''; } catch(e) {}
  return '';
}

const CORS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

async function sbConfig(sbUrl, sbKey) {
  try {
    const r = await fetch(`${sbUrl}/rest/v1/t365_config?key=like.paddle_*`,
      { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` } });
    if (!r.ok) return {};
    const rows = await r.json();
    return Object.fromEntries((rows || []).map(row => [row.key, row.value]));
  } catch(e) { return {}; }
}

export default async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

  const SB_URL = getEnv('SUPABASE_URL');
  const SB_KEY = getEnv('SUPABASE_ANON_KEY');

  // Try Supabase config first
  const cfg = (SB_URL && SB_KEY) ? await sbConfig(SB_URL, SB_KEY) : {};

  // Fall back to env vars
  const prices = {
    agent:     {
      monthly: cfg.paddle_price_agent_m || getEnv('PADDLE_PRICE_AGENT_M'),
      annual:  cfg.paddle_price_agent_a || getEnv('PADDLE_PRICE_AGENT_A'),
    },
    director:  {
      monthly: cfg.paddle_price_dir_m   || getEnv('PADDLE_PRICE_DIR_M'),
      annual:  cfg.paddle_price_dir_a   || getEnv('PADDLE_PRICE_DIR_A'),
    },
    executive: {
      monthly: cfg.paddle_price_exec_m  || getEnv('PADDLE_PRICE_EXEC_M'),
      annual:  cfg.paddle_price_exec_a  || getEnv('PADDLE_PRICE_EXEC_A'),
    },
    client_token: cfg.paddle_client_token || getEnv('PADDLE_CLIENT_TOKEN'),
  };

  const configured = !!(prices.agent.monthly && prices.agent.annual &&
    prices.director.monthly && prices.executive.monthly);

  return Response.json({ success: true, prices, configured }, { headers: CORS });
};

export const config = { path: '/api/paddle-prices' };
