// netlify/functions/ls-setup.mjs
// Creates Transfer365 plans in LemonSqueezy
// Uses only built-in Node modules — no npm packages needed

async function lsAPI(apiKey, path, method = "GET", body = null) {
  const opts = {
    method,
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/vnd.api+json",
      "Accept":        "application/vnd.api+json",
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(`https://api.lemonsqueezy.com/v1${path}`, opts);
  const text = await r.text();
  if (!r.ok) throw new Error(`LS ${method} ${path} → ${r.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : {};
}

export default async (req) => {
  const cors = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };
  if (req.method === "OPTIONS") return new Response("", { status: 200, headers: cors });

  const apiKey = Netlify.env.get("LEMONSQUEEZY_API_KEY");
  if (!apiKey) {
    return Response.json({
      error: "LEMONSQUEEZY_API_KEY not set",
      fix: "It should already be set — try redeploying"
    }, { status: 400, headers: cors });
  }

  try {
    // 1. Find store
    const storesRes = await lsAPI(apiKey, "/stores");
    const store     = storesRes.data?.[0];
    if (!store) throw new Error("No LemonSqueezy store found for this API key");
    const storeId   = store.id;
    const storeSlug = store.attributes.slug;
    const storeName = store.attributes.name;
    console.log(`Store: ${storeName} (id=${storeId}, slug=${storeSlug})`);

    // 2. Define plans
    const PLANS = [
      { productSlug: "agent",     productName: "Transfer365 Agent",     desc: "Essential intelligence for licensed football agents.",              monthly: 4900,  annual: 46800  },
      { productSlug: "director",  productName: "Transfer365 Director",  desc: "Unlimited intelligence for serious football intermediaries.",       monthly: 9900,  annual: 94800  },
      { productSlug: "executive", productName: "Transfer365 Executive", desc: "Full agency solution — team seats, API access, branded reports.",   monthly: 19900, annual: 190800 },
    ];

    // 3. Get existing products (skip duplicates)
    const existingProds  = await lsAPI(apiKey, `/products?filter[store_id]=${storeId}&page[size]=50`);
    const prodByName     = {};
    (existingProds.data || []).forEach(p => { prodByName[p.attributes.name] = p.id; });

    const results = {};

    for (const plan of PLANS) {
      // Create or reuse product
      let productId = prodByName[plan.productName];
      if (productId) {
        console.log(`Reusing product: ${plan.productName} → ${productId}`);
      } else {
        const prod = await lsAPI(apiKey, "/products", "POST", {
          data: {
            type: "products",
            attributes: { name: plan.productName, description: plan.desc },
            relationships: { store: { data: { type: "stores", id: String(storeId) } } }
          }
        });
        productId = prod.data.id;
        console.log(`Created product: ${plan.productName} → ${productId}`);
      }

      // Get existing variants for this product
      const existVars = await lsAPI(apiKey, `/variants?filter[product_id]=${productId}&page[size]=20`);
      const varByName = {};
      (existVars.data || []).forEach(v => { varByName[v.attributes.name] = v.id; });

      // Monthly variant
      let monthlyId = varByName["Monthly"];
      if (!monthlyId) {
        const vm = await lsAPI(apiKey, "/variants", "POST", {
          data: {
            type: "variants",
            attributes: { name: "Monthly", price: plan.monthly, is_subscription: true, interval: "month", interval_count: 1, has_free_trial: true, trial_interval: "day", trial_interval_count: 7, status: "published" },
            relationships: { product: { data: { type: "products", id: String(productId) } } }
          }
        });
        monthlyId = vm.data.id;
        console.log(`Created Monthly variant: ${monthlyId}`);
      }

      // Annual variant
      let annualId = varByName["Annual"];
      if (!annualId) {
        const va = await lsAPI(apiKey, "/variants", "POST", {
          data: {
            type: "variants",
            attributes: { name: "Annual", price: plan.annual, is_subscription: true, interval: "year", interval_count: 1, has_free_trial: true, trial_interval: "day", trial_interval_count: 7, status: "published" },
            relationships: { product: { data: { type: "products", id: String(productId) } } }
          }
        });
        annualId = va.data.id;
        console.log(`Created Annual variant: ${annualId}`);
      }

      results[plan.productSlug] = {
        productId,
        monthly: { variantId: monthlyId, url: `https://${storeSlug}.lemonsqueezy.com/checkout/buy/${monthlyId}?embed=1` },
        annual:  { variantId: annualId,  url: `https://${storeSlug}.lemonsqueezy.com/checkout/buy/${annualId}?embed=1`  },
      };
    }

    // 4. Return everything needed
    return Response.json({
      success:    true,
      store:      { id: storeId, slug: storeSlug, name: storeName },
      plans:      results,
      webhook:    { url: "https://transfer365.net/.netlify/functions/lemonsqueezy-webhook" },
      env_vars:   {
        LEMONSQUEEZY_STORE_ID:         storeId,
        LS_VARIANT_AGENT_MONTHLY:      results.agent?.monthly?.variantId,
        LS_VARIANT_AGENT_ANNUAL:       results.agent?.annual?.variantId,
        LS_VARIANT_DIRECTOR_MONTHLY:   results.director?.monthly?.variantId,
        LS_VARIANT_DIRECTOR_ANNUAL:    results.director?.annual?.variantId,
        LS_VARIANT_EXECUTIVE_MONTHLY:  results.executive?.monthly?.variantId,
        LS_VARIANT_EXECUTIVE_ANNUAL:   results.executive?.annual?.variantId,
      },
      next_steps: [
        "1. Copy env_vars above → Netlify dashboard → Environment Variables",
        "2. Register webhook URL in LemonSqueezy → Settings → Webhooks",
        "3. Set LEMONSQUEEZY_WEBHOOK_SECRET from the webhook page",
        "4. Redeploy Netlify — buttons will now use real checkout URLs",
      ]
    }, { headers: cors });

  } catch (e) {
    console.error("ls-setup error:", e.message);
    return Response.json({ error: e.message }, { status: 500, headers: cors });
  }
};

export const config = { path: "/api/ls-setup" };
