// netlify/functions/ls-setup.mjs
// Auto-creates all Transfer365 plans in LemonSqueezy
// GET /api/ls-setup  (uses LEMONSQUEEZY_API_KEY env var)

import { getStore } from "@netlify/blobs";

const PLANS = [
  { name:"Transfer365 Agent Monthly",   slug:"agent",     billing:"monthly", price:4900,  interval:"month", trial:7 },
  { name:"Transfer365 Agent Annual",    slug:"agent",     billing:"annual",  price:46800, interval:"year",  trial:7 },
  { name:"Transfer365 Director Monthly",slug:"director",  billing:"monthly", price:9900,  interval:"month", trial:7 },
  { name:"Transfer365 Director Annual", slug:"director",  billing:"annual",  price:94800, interval:"year",  trial:7 },
  { name:"Transfer365 Executive Monthly",slug:"executive",billing:"monthly", price:19900, interval:"month", trial:7 },
  { name:"Transfer365 Executive Annual", slug:"executive",billing:"annual",  price:190800,interval:"year",  trial:7 },
];

const PRODUCT_DESCRIPTIONS = {
  agent:     "Intelligence platform for licensed football agents. Real-time alerts, 300 player profiles, 50 AI match scores/month.",
  director:  "Unlimited intelligence for serious football intermediaries. No limits on profiles, scores, or alert rules.",
  executive: "Full agency solution. 5 team seats, branded PDF reports, API access, dedicated account manager.",
};

async function lsAPI(apiKey, path, method="GET", body=null) {
  const opts = {
    method,
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/vnd.api+json",
      "Accept": "application/vnd.api+json",
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(`https://api.lemonsqueezy.com/v1${path}`, opts);
  const text = await r.text();
  if (!r.ok) throw new Error(`LS ${method} ${path} → ${r.status}: ${text.slice(0,300)}`);
  return text ? JSON.parse(text) : {};
}

export default async (req) => {
  const cors = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store",
  };
  if (req.method === "OPTIONS") return new Response("", { status: 200, headers: cors });

  const apiKey = Netlify.env.get("LEMONSQUEEZY_API_KEY");
  if (!apiKey) {
    return Response.json({ error: "LEMONSQUEEZY_API_KEY not set in Netlify env vars" }, { status: 400, headers: cors });
  }

  try {
    // 1. Get store
    const storesRes = await lsAPI(apiKey, "/stores");
    const store = storesRes.data?.[0];
    if (!store) throw new Error("No store found in LemonSqueezy account");
    const storeId = store.id;
    const storeSlug = store.attributes.slug;
    console.log(`Store: ${storeId} (${storeSlug})`);

    // 2. Get existing products to avoid duplicates
    const existingProds = await lsAPI(apiKey, `/products?filter[store_id]=${storeId}&page[size]=50`);
    const existingByName = {};
    (existingProds.data || []).forEach(p => {
      existingByName[p.attributes.name] = p.id;
    });
    console.log("Existing products:", Object.keys(existingByName));

    // 3. Create/find products and variants
    const results = { agent:{}, director:{}, executive:{} };
    const productMap = {}; // slug → productId

    // First pass: create products
    for (const planSlug of ["agent","director","executive"]) {
      const productName = `Transfer365 ${planSlug.charAt(0).toUpperCase()+planSlug.slice(1)}`;
      if (existingByName[productName]) {
        productMap[planSlug] = existingByName[productName];
        console.log(`Using existing product: ${productName} → ${productMap[planSlug]}`);
      } else {
        const prod = await lsAPI(apiKey, "/products", "POST", {
          data: {
            type: "products",
            attributes: {
              name: productName,
              description: PRODUCT_DESCRIPTIONS[planSlug],
              slug: `t365-${planSlug}-${Date.now()}`,
            },
            relationships: {
              store: { data: { type: "stores", id: String(storeId) } }
            }
          }
        });
        productMap[planSlug] = prod.data.id;
        console.log(`Created product: ${productName} → ${productMap[planSlug]}`);
      }
    }

    // Second pass: create variants
    // Get existing variants
    const existingVars = await lsAPI(apiKey, `/variants?page[size]=100`);
    const existingVarNames = {};
    (existingVars.data || []).forEach(v => {
      existingVarNames[`${v.attributes.product_id}_${v.attributes.name}`] = { id: v.id, productId: v.attributes.product_id };
    });

    for (const plan of PLANS) {
      const productId = productMap[plan.slug];
      const varKey = `${productId}_${plan.name}`;

      let variantId;
      if (existingVarNames[varKey]) {
        variantId = existingVarNames[varKey].id;
        console.log(`Using existing variant: ${plan.name} → ${variantId}`);
      } else {
        const v = await lsAPI(apiKey, "/variants", "POST", {
          data: {
            type: "variants",
            attributes: {
              name: plan.name,
              price: plan.price,
              is_subscription: true,
              interval: plan.interval,
              interval_count: 1,
              has_free_trial: true,
              trial_interval: "day",
              trial_interval_count: plan.trial,
              status: "published",
            },
            relationships: {
              product: { data: { type: "products", id: String(productId) } }
            }
          }
        });
        variantId = v.data.id;
        console.log(`Created variant: ${plan.name} → ${variantId}`);
      }

      const checkoutUrl = `https://${storeSlug}.lemonsqueezy.com/checkout/buy/${variantId}?embed=1`;
      results[plan.slug][plan.billing] = { variantId, checkoutUrl };
    }

    // 4. Save to Netlify Blobs
    const blobStore = getStore("ls-config");
    const config = {
      storeId,
      storeSlug,
      updatedAt: new Date().toISOString(),
      plans: {
        agent:     { monthly: results.agent.monthly,    annual: results.agent.annual     },
        director:  { monthly: results.director.monthly, annual: results.director.annual  },
        executive: { monthly: results.executive.monthly,annual: results.executive.annual },
      }
    };
    await blobStore.setJSON("checkout-config", config);

    // 5. Return env vars to set for webhook
    return Response.json({
      success: true,
      storeId,
      storeSlug,
      plans: config.plans,
      env_vars_for_webhook: {
        LS_VARIANT_AGENT_MONTHLY:      results.agent.monthly?.variantId,
        LS_VARIANT_AGENT_ANNUAL:       results.agent.annual?.variantId,
        LS_VARIANT_DIRECTOR_MONTHLY:   results.director.monthly?.variantId,
        LS_VARIANT_DIRECTOR_ANNUAL:    results.director.annual?.variantId,
        LS_VARIANT_EXECUTIVE_MONTHLY:  results.executive.monthly?.variantId,
        LS_VARIANT_EXECUTIVE_ANNUAL:   results.executive.annual?.variantId,
      },
      webhook_url: "https://transfer365.net/.netlify/functions/lemonsqueezy-webhook",
      next_step: "Register the webhook_url in LemonSqueezy Dashboard → Settings → Webhooks",
    }, { headers: cors });

  } catch(e) {
    console.error("ls-setup error:", e.message);
    return Response.json({ error: e.message }, { status: 500, headers: cors });
  }
};

export const config = { path: "/api/ls-setup" };
