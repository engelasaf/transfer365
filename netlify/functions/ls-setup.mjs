// netlify/functions/ls-setup.mjs
async function lsGET(apiKey, path) {
  const r = await fetch(`https://api.lemonsqueezy.com/v1${path}`, {
    headers: { "Authorization": `Bearer ${apiKey}`, "Accept": "application/vnd.api+json" }
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`LS GET ${path} → ${r.status}: ${text.slice(0,200)}`);
  return JSON.parse(text);
}

export default async (req) => {
  const cors = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };
  if (req.method === "OPTIONS") return new Response("", { status: 200, headers: cors });

  const apiKey = new URL(req.url).searchParams.get("key") || Netlify.env.get("LEMONSQUEEZY_API_KEY");
  if (!apiKey) return Response.json({ error: "Missing ?key=" }, { status: 400, headers: cors });

  try {
    // Get store
    const storeRes  = await lsGET(apiKey, "/stores");
    const store     = storeRes.data?.[0];
    if (!store) throw new Error("No store found");
    const storeId   = store.id;
    const storeSlug = store.attributes.slug;

    // Get ALL products (including drafts) - no status filter
    const prodsRes = await lsGET(apiKey, `/products?filter[store_id]=${storeId}&page[size]=50&include=variants`);
    const products = prodsRes.data || [];
    const included = prodsRes.included || [];

    // Also get variants separately to ensure we get them all
    const allVarsRes = await lsGET(apiKey, `/variants?page[size]=100`);
    const allVars    = allVarsRes.data || [];

    // Build variant map by product_id
    const varsByProduct = {};
    [...included, ...allVars].forEach(item => {
      if (item.type !== "variants") return;
      const pid = String(item.attributes.product_id);
      if (!varsByProduct[pid]) varsByProduct[pid] = [];
      // avoid dupes
      if (!varsByProduct[pid].find(v => v.id === item.id)) {
        varsByProduct[pid].push(item);
      }
    });

    if (products.length === 0) {
      return Response.json({
        configured: false,
        store: { id: storeId, slug: storeSlug },
        allVariantsFound: allVars.length,
        message: "No products found — even searching drafts. Please create products in LemonSqueezy dashboard.",
        dashboard: `https://app.lemonsqueezy.com/stores/${storeId}/products/new`,
      }, { headers: cors });
    }

    // Build result
    const result = {
      configured: false,
      store: { id: storeId, slug: storeSlug },
      products: [],
      checkoutUrls: {},
      env_vars_for_webhook: {},
    };

    for (const prod of products) {
      const pid    = prod.id;
      const name   = prod.attributes.name;
      const status = prod.attributes.status;
      const vars   = varsByProduct[pid] || [];

      const productEntry = { id: pid, name, status, variants: [] };

      for (const v of vars) {
        const vid      = v.id;
        const vname    = v.attributes.name || "Default";
        const price    = v.attributes.price;
        const interval = v.attributes.interval;
        const vstatus  = v.attributes.status;
        const url      = `https://${storeSlug}.lemonsqueezy.com/checkout/buy/${vid}?embed=1`;

        productEntry.variants.push({ id: vid, name: vname, price: `€${(price/100).toFixed(0)}`, interval, status: vstatus, checkoutUrl: url });

        // Auto-map by name
        const lname = name.toLowerCase();
        const lvar  = vname.toLowerCase();
        const plan  = lname.includes("executive") ? "executive" : lname.includes("director") ? "director" : "agent";
        const bill  = (lvar.includes("annual") || lvar.includes("year") || interval === "year") ? "annual" : "monthly";

        if (!result.checkoutUrls[plan]) result.checkoutUrls[plan] = {};
        if (!result.checkoutUrls[plan][bill]) {
          result.checkoutUrls[plan][bill] = { variantId: vid, url };
        }
      }

      result.products.push(productEntry);
    }

    const hasAgent     = result.checkoutUrls.agent?.monthly;
    const hasDirector  = result.checkoutUrls.director?.monthly;
    const hasExecutive = result.checkoutUrls.executive?.monthly;
    result.configured  = !!(hasAgent && hasDirector && hasExecutive);

    ["agent","director","executive"].forEach(plan => {
      ["monthly","annual"].forEach(bill => {
        const k = `LS_VARIANT_${plan.toUpperCase()}_${bill.toUpperCase()}`;
        result.env_vars_for_webhook[k] = result.checkoutUrls[plan]?.[bill]?.variantId || "NOT_FOUND";
      });
    });

    return Response.json(result, { headers: cors });

  } catch(e) {
    return Response.json({ error: e.message }, { status: 500, headers: cors });
  }
};

export const config = { path: "/api/ls-setup" };
