// netlify/functions/paddle-prices.mjs
// GET /api/paddle-prices
// Returns Paddle price IDs for checkout

function getEnv(k) {
  try { if (process.env[k]) return process.env[k]; } catch(e) {}
  try { return Netlify.env.get(k) || ''; } catch(e) {}
  return '';
}

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

export default async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

  const prices = {
    agent:     { monthly: getEnv('PADDLE_PRICE_AGENT_M'), annual: getEnv('PADDLE_PRICE_AGENT_A') },
    director:  { monthly: getEnv('PADDLE_PRICE_DIR_M'),   annual: getEnv('PADDLE_PRICE_DIR_A') },
    executive: { monthly: getEnv('PADDLE_PRICE_EXEC_M'),  annual: getEnv('PADDLE_PRICE_EXEC_A') },
    client_token: getEnv('PADDLE_CLIENT_TOKEN'),
  };

  const configured = Object.values(prices.agent).every(Boolean);
  return Response.json({ success: true, prices, configured }, { headers: CORS });
};

export const config = { path: '/api/paddle-prices' };
