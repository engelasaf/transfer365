// netlify/functions/ls-config.mjs
// Returns checkout URLs from env vars — no external packages

function variantUrl(storeSlug, variantId) {
  if (!variantId || !storeSlug) return null;
  return `https://${storeSlug}.lemonsqueezy.com/checkout/buy/${variantId}?embed=1`;
}

export default async (req) => {
  const cors = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };
  if (req.method === "OPTIONS") return new Response("", { status: 200, headers: cors });

  const slug = Netlify.env.get("LEMONSQUEEZY_STORE_ID") || "";

  const plans = {
    agent:     { monthly: variantUrl(slug, Netlify.env.get("LS_VARIANT_AGENT_MONTHLY")),     annual: variantUrl(slug, Netlify.env.get("LS_VARIANT_AGENT_ANNUAL")) },
    director:  { monthly: variantUrl(slug, Netlify.env.get("LS_VARIANT_DIRECTOR_MONTHLY")),  annual: variantUrl(slug, Netlify.env.get("LS_VARIANT_DIRECTOR_ANNUAL")) },
    executive: { monthly: variantUrl(slug, Netlify.env.get("LS_VARIANT_EXECUTIVE_MONTHLY")), annual: variantUrl(slug, Netlify.env.get("LS_VARIANT_EXECUTIVE_ANNUAL")) },
  };

  const configured = Object.values(plans).some(p => p.monthly);

  return Response.json({ configured, storeSlug: slug, plans }, { headers: cors });
};

export const config = { path: "/api/ls-config" };
