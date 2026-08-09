// netlify/functions/paddle-setup.mjs
// GET /api/paddle-setup?secret=SETUP_SECRET
// Creates all Paddle products, prices, webhook automatically
// Stores results in Supabase t365_config table

function getEnv(k) {
  try { if (process.env[k]) return process.env[k]; } catch(e) {}
  try { return Netlify.env.get(k) || ''; } catch(e) {}
  return '';
}

const CORS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

async function paddle(method, path, body) {
  const apiKey = getEnv('PADDLE_API_KEY');
  const r = await fetch(`https://api.paddle.com${path}`, {
    method,
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const d = await r.json();
  if (!r.ok) throw new Error(`Paddle ${path}: ${JSON.stringify(d.error || d)}`);
  return d.data || d;
}

async function sbUpsert(url, key, table, row) {
  const r = await fetch(`${url}/rest/v1/${table}`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify([row]),
  });
  return r.ok;
}

async function sbGet(url, key, table, filter) {
  const r = await fetch(`${url}/rest/v1/${table}?${filter}&limit=1`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  const d = await r.json();
  return Array.isArray(d) ? d[0] : null;
}

async function ensureConfigTable(sbUrl, sbKey) {
  await fetch(`${sbUrl}/rest/v1/t365_config`, {
    method: 'POST',
    headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}`,
      'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify([{ key: '_init', value: '1' }]),
  });
}

export default async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

  const url = new URL(req.url);
  const secret = url.searchParams.get('secret') || '';
  const expected = getEnv('SETUP_SECRET') || 'transfer365setup2026';
  if (secret !== expected) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: CORS });

  const SB_URL = getEnv('SUPABASE_URL');
  const SB_KEY = getEnv('SUPABASE_ANON_KEY');
  const PADDLE_KEY = getEnv('PADDLE_API_KEY');

  if (!PADDLE_KEY) return Response.json({ error: 'PADDLE_API_KEY not set' }, { status: 500, headers: CORS });

  const log = [];
  const results = { products: {}, prices: {}, webhook: null, client_token: null };

  try {
    // ── Check existing products ──────────────────────────────────────
    log.push('Checking existing Paddle products...');
    const existing = await paddle('GET', '/products?status=active&per_page=50');
    const existingNames = (existing || []).map(p => p.name);
    log.push(`Existing: ${existingNames.join(', ') || 'none'}`);

    // ── Create products ──────────────────────────────────────────────
    const PRODUCTS = [
      { name: 'Transfer365 Agent', description: 'Agent plan — unlimited players, email alerts, CRM, AI matches', tax_category: 'saas' },
      { name: 'Transfer365 Director', description: 'Director plan — everything in Agent + WhatsApp, advanced analytics', tax_category: 'saas' },
      { name: 'Transfer365 Executive', description: 'Executive plan — everything in Director + API access, white-label', tax_category: 'saas' },
    ];

    for (const prod of PRODUCTS) {
      const existing_prod = (existing || []).find(p => p.name === prod.name);
      if (existing_prod) {
        results.products[prod.name] = existing_prod.id;
        log.push(`Product exists: ${prod.name} (${existing_prod.id})`);
      } else {
        const created = await paddle('POST', '/products', prod);
        results.products[prod.name] = created.id;
        log.push(`Created product: ${prod.name} (${created.id})`);
      }
    }

    // ── Create prices ────────────────────────────────────────────────
    const agentId    = results.products['Transfer365 Agent'];
    const directorId = results.products['Transfer365 Director'];
    const execId     = results.products['Transfer365 Executive'];

    const PRICES = [
      { key: 'agent_m',    productId: agentId,    name: 'Agent Monthly',    amount: 3900,  billing: 'monthly' },
      { key: 'agent_a',    productId: agentId,    name: 'Agent Annual',     amount: 34800, billing: 'annual'  },
      { key: 'dir_m',      productId: directorId, name: 'Director Monthly', amount: 9900,  billing: 'monthly' },
      { key: 'dir_a',      productId: directorId, name: 'Director Annual',  amount: 94800, billing: 'annual'  },
      { key: 'exec_m',     productId: execId,     name: 'Executive Monthly',amount: 24900, billing: 'monthly' },
      { key: 'exec_a',     productId: execId,     name: 'Executive Annual', amount: 238800,billing: 'annual'  },
    ];

    // Check existing prices
    const existingPrices = await paddle('GET', '/prices?status=active&per_page=100');

    for (const price of PRICES) {
      const ep = (existingPrices || []).find(p => p.name === price.name);
      if (ep) {
        results.prices[price.key] = ep.id;
        log.push(`Price exists: ${price.name} (${ep.id})`);
        continue;
      }
      const interval = price.billing === 'annual' ? { interval: 'year', frequency: 1 } : { interval: 'month', frequency: 1 };
      const created = await paddle('POST', '/prices', {
        product_id: price.productId,
        name: price.name,
        description: `Transfer365 ${price.name}`,
        billing_cycle: interval,
        unit_price: { amount: String(price.amount), currency_code: 'USD' },
        trial_period: { interval: 'day', frequency: 7 },
        tax_mode: 'account_setting',
      });
      results.prices[price.key] = created.id;
      log.push(`Created price: ${price.name} = $${price.amount/100} (${created.id})`);
    }

    // ── Create client token ──────────────────────────────────────────
    try {
      const tokens = await paddle('GET', '/client-tokens');
      const liveToken = (tokens || []).find(t => t.status === 'active');
      if (liveToken) {
        results.client_token = liveToken.id;
        log.push(`Client token: ${liveToken.id}`);
      } else {
        const ct = await paddle('POST', '/client-tokens', { description: 'Transfer365 frontend' });
        results.client_token = ct.id;
        log.push(`Created client token: ${ct.id}`);
      }
    } catch(e) {
      log.push(`Client token: use dashboard (${e.message})`);
    }

    // ── Create webhook ───────────────────────────────────────────────
    try {
      const SITE_URL = 'https://transfer365.net';
      const webhookUrl = `${SITE_URL}/api/paddle-webhook`;
      const existingWebhooks = await paddle('GET', '/notification-settings');
      const existingWh = (existingWebhooks || []).find(w => w.destination === webhookUrl);

      if (existingWh) {
        results.webhook = { id: existingWh.id, secret: existingWh.endpoint_secret_key };
        log.push(`Webhook exists: ${existingWh.id}`);
      } else {
        const wh = await paddle('POST', '/notification-settings', {
          description: 'Transfer365 subscription webhook',
          destination: webhookUrl,
          subscribed_events: [
            'subscription.created', 'subscription.updated', 'subscription.canceled',
            'subscription.paused', 'subscription.resumed', 'subscription.past_due',
            'transaction.completed',
          ],
          active: true,
          type: 'url',
        });
        results.webhook = { id: wh.id, secret: wh.endpoint_secret_key };
        log.push(`Created webhook: ${wh.id}`);
      }
    } catch(e) {
      log.push(`Webhook error: ${e.message}`);
    }

    // ── Store everything in Supabase ─────────────────────────────────
    if (SB_URL && SB_KEY) {
      // Create t365_config table via upsert (will fail gracefully if no table)
      const configRows = [
        { key: 'paddle_price_agent_m',  value: results.prices.agent_m    || '' },
        { key: 'paddle_price_agent_a',  value: results.prices.agent_a    || '' },
        { key: 'paddle_price_dir_m',    value: results.prices.dir_m      || '' },
        { key: 'paddle_price_dir_a',    value: results.prices.dir_a      || '' },
        { key: 'paddle_price_exec_m',   value: results.prices.exec_m     || '' },
        { key: 'paddle_price_exec_a',   value: results.prices.exec_a     || '' },
        { key: 'paddle_client_token',   value: results.client_token      || '' },
        { key: 'paddle_webhook_id',     value: results.webhook?.id       || '' },
        { key: 'paddle_webhook_secret', value: results.webhook?.secret   || '' },
      ];
      for (const row of configRows) {
        await sbUpsert(SB_URL, SB_KEY, 't365_config', row).catch(() => {});
      }
      log.push(`Stored ${configRows.length} config values in Supabase`);
    }

    return Response.json({ success: true, log, results }, { headers: CORS });

  } catch(e) {
    console.error('paddle-setup error:', e.message);
    return Response.json({ success: false, error: e.message, log }, { status: 500, headers: CORS });
  }
};

export const config = { path: '/api/paddle-setup' };
