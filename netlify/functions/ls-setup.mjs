// netlify/functions/ls-setup.mjs
// ONE-TIME SETUP: Creates all Transfer365 plans in LemonSqueezy
// Run once: GET /api/ls-setup?key=YOUR_LS_API_KEY&store=YOUR_STORE_ID
//
// After running, the function stores variant IDs and checkout URLs
// as Netlify environment variables automatically.

import { getStore } from "@netlify/blobs";

const PLANS = [
  { name:"Transfer365 Agent",     slug:"agent",     desc:"The essential plan for individual licensed football agents.", price_monthly:4900, price_annual:46800  },
  { name:"Transfer365 Director",  slug:"director",  desc:"Unlimited intelligence for serious football intermediaries.",  price_monthly:9900, price_annual:94800  },
  { name:"Transfer365 Executive", slug:"executive", desc:"Full agency solution — team seats, API access, reporting.",    price_monthly:19900, price_annual:190800 },
];

async function lsAPI(apiKey, path, method="GET", body=null) {
  const opts = {
    method,
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/vnd.api+json", "Accept": "application/vnd.api+json" },
  };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(`https://api.lemonsqueezy.com/v1${path}`, opts);
  if (!r.ok) {
    const err = await r.text();
    throw new Error(`LS API ${path}: ${r.status} ${err}`);
  }
  return r.json();
}

export default async (req) => {
  const cors = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };
  if (req.method === "OPTIONS") return new Response("", { status: 200 });

  const url    = new URL(req.url);
  const apiKey = url.searchParams.get("key") || Netlify.env.get("LEMONSQUEEZY_API_KEY");
  const storeId = url.searchParams.get("store") || Netlify.env.get("LEMONSQUEEZY_STORE_ID");

  if (!apiKey || !storeId) {
    return Response.json({
      error: "Missing params",
      usage: "/api/ls-setup?key=YOUR_LS_API_KEY&store=YOUR_STORE_ID",
      how_to_get: {
        api_key: "LemonSqueezy Dashboard → Account → API Keys",
        store_id: "LemonSqueezy Dashboard → Settings → your store ID in the URL",
      }
    }, { status: 400, headers: cors });
  }

  try {
    const results = {};
    const store = getStore("ls-config");

    for (const plan of PLANS) {
      // Create product
      const product = await lsAPI(apiKey, "/products", "POST", {
        data: {
          type: "products",
          attributes: { name: plan.name, description: plan.desc, slug: `t365-${plan.slug}` },
          relationships: { store: { data: { type: "stores", id: String(storeId) } } }
        }
      });
      const productId = product.data.id;

      // Create Monthly variant
      const vm = await lsAPI(apiKey, "/variants", "POST", {
        data: {
          type: "variants",
          attributes: {
            name: "Monthly",
            price: plan.price_monthly,
            is_subscription: true,
            interval: "month",
            interval_count: 1,
            has_free_trial: true,
            trial_interval: "day",
            trial_interval_count: 7,
          },
          relationships: { product: { data: { type: "products", id: productId } } }
        }
      });

      // Create Annual variant
      const va = await lsAPI(apiKey, "/variants", "POST", {
        data: {
          type: "variants",
          attributes: {
            name: "Annual",
            price: plan.price_annual,
            is_subscription: true,
            interval: "year",
            interval_count: 1,
            has_free_trial: true,
            trial_interval: "day",
            trial_interval_count: 7,
          },
          relationships: { product: { data: { type: "products", id: productId } } }
        }
      });

      const vmId = vm.data.id;
      const vaId = va.data.id;
      const checkoutM = `https://${storeId}.lemonsqueezy.com/checkout/buy/${vmId}`;
      const checkoutA = `https://${storeId}.lemonsqueezy.com/checkout/buy/${vaId}`;

      results[plan.slug] = { productId, monthly: { id: vmId, url: checkoutM }, annual: { id: vaId, url: checkoutA } };
      console.log(`Created ${plan.name}: product=${productId} monthly=${vmId} annual=${vaId}`);
    }

    // Store config in Netlify Blobs
    await store.setJSON("checkout-urls", results);
    console.log("Config saved to Netlify Blobs");

    return Response.json({
      success: true,
      message: "All plans created! Add these to Netlify env vars:",
      results,
      env_vars_to_set: {
        LEMONSQUEEZY_API_KEY: apiKey,
        LEMONSQUEEZY_STORE_ID: storeId,
        LEMONSQUEEZY_WEBHOOK_SECRET: "— set from LemonSqueezy Dashboard → Webhooks",
        LS_VARIANT_AGENT_MONTHLY:     results.agent?.monthly?.id,
        LS_VARIANT_AGENT_ANNUAL:      results.agent?.annual?.id,
        LS_VARIANT_DIRECTOR_MONTHLY:  results.director?.monthly?.id,
        LS_VARIANT_DIRECTOR_ANNUAL:   results.director?.annual?.id,
        LS_VARIANT_EXECUTIVE_MONTHLY: results.executive?.monthly?.id,
        LS_VARIANT_EXECUTIVE_ANNUAL:  results.executive?.annual?.id,
      }
    }, { status: 200, headers: cors });

  } catch(e) {
    return Response.json({ error: e.message }, { status: 500, headers: cors });
  }
};

export const config = { path: "/api/ls-setup" };
