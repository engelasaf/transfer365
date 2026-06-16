// netlify/functions/ls-setup.mjs
// Reads existing LemonSqueezy products/variants and returns checkout URLs
// Products must be created in LemonSqueezy dashboard first

async function lsGET(apiKey, path) {
  const r = await fetch(`https://api.lemonsqueezy.com/v1${path}`, {
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Accept": "application/vnd.api+json",
    },
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`LS GET ${path} → ${r.status}: ${text.slice(0, 200)}`);
  return JSON.parse(text);
}

export default async (req) => {
  const cors = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };
  if (req.method === "OPTIONS") return new Response("", { status: 200, headers: cors });

  const apiKey = new URL(req.url).searchParams.get("key") || Netlify.env.get("LEMONSQUEEZY_API_KEY");
  if (!apiKey) return Response.json({ error: "Missing ?key= param" }, { status: 400, headers: cors });

  try {
    // Get store
    const storeRes  = await lsGET(apiKey, "/stores");
    const store     = storeRes.data?.[0];
    if (!store) throw new Error("No store found");
    const storeId   = store.id;
    const storeSlug = store.attributes.slug;

    // Get all products
    const prodsRes  = await lsGET(apiKey, `/products?filter[store_id]=${storeId}&page[size]=50`);
    const products  = prodsRes.data || [];

    if (products.length === 0) {
      return Response.json({
        configured: false,
        store: { id: storeId, slug: storeSlug },
        message: "No products found. Create them in LemonSqueezy dashboard first.",
        dashboard: "https://app.lemonsqueezy.com/products",
        instructions: [
          "1. Go to https://app.lemonsqueezy.com/products",
          "2. Create product: 'Transfer365 Agent' — subscription €49/mo or €468/yr",
          "3. Create product: 'Transfer365 Director' — subscription €99/mo or €948/yr",
          "4. Create product: 'Transfer365 Executive' — subscription €199/mo or €1908/yr",
          "5. Each product needs 2 variants: Monthly + Annual (7-day free trial)",
          "6. Run this URL again after creating products",
        ]
      }, { headers: cors });
    }

    // Get variants for each product
    const result = { store: { id: storeId, slug: storeSlug }, products: [], checkoutUrls: {} };

    for (const prod of products) {
      const pid  = prod.id;
      const name = prod.attributes.name;
      const varsRes  = await lsGET(apiKey, `/variants?filter[product_id]=${pid}&page[size]=20`);
      const variants = (varsRes.data || []).filter(v => v.attributes.status !== "draft");

      const productEntry = { id: pid, name, variants: [] };

      for (const v of variants) {
        const vid      = v.id;
        const vname    = v.attributes.name;
        const price    = v.attributes.price;
        const interval = v.attributes.interval;
        const checkoutUrl = `https://${storeSlug}.lemonsqueezy.com/checkout/buy/${vid}?embed=1`;

        productEntry.variants.push({ id: vid, name: vname, price: `€${price/100}`, interval, checkoutUrl });

        // Auto-map to plan slugs
        const lname = name.toLowerCase();
        const lvar  = vname.toLowerCase();
        const plan  = lname.includes("executive") ? "executive" : lname.includes("director") ? "director" : "agent";
        const bill  = lvar.includes("annual") || lvar.includes("year") ? "annual" : "monthly";

        if (!result.checkoutUrls[plan]) result.checkoutUrls[plan] = {};
        result.checkoutUrls[plan][bill] = { variantId: vid, url: checkoutUrl };
      }

      result.products.push(productEntry);
    }

    result.configured = true;
    result.env_vars_for_webhook = {};
    ["agent","director","executive"].forEach(plan => {
      ["monthly","annual"].forEach(bill => {
        const key = `LS_VARIANT_${plan.toUpperCase()}_${bill.toUpperCase()}`;
        result.env_vars_for_webhook[key] = result.checkoutUrls[plan]?.[bill]?.variantId || "NOT_FOUND";
      });
    });

    return Response.json(result, { headers: cors });

  } catch(e) {
    return Response.json({ error: e.message }, { status: 500, headers: cors });
  }
};

export const config = { path: "/api/ls-setup" };
