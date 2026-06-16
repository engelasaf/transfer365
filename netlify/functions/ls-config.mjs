// netlify/functions/ls-config.mjs
// Returns checkout URLs for each plan (from Netlify Blobs or env vars)

import { getStore } from "@netlify/blobs";

const STORE_ID = Netlify.env.get("LEMONSQUEEZY_STORE_ID") || "transfer365";

function variantUrl(variantId) {
  if (!variantId) return null;
  return `https://${STORE_ID}.lemonsqueezy.com/checkout/buy/${variantId}`;
}

export default async (req) => {
  const cors = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };
  if (req.method === "OPTIONS") return new Response("", { status: 200, headers: cors });

  try {
    // Try Blobs first (set by ls-setup)
    const store = getStore("ls-config");
    const saved = await store.get("checkout-urls", { type: "json" }).catch(() => null);

    if (saved) {
      return Response.json({ source: "blobs", plans: saved }, { headers: cors });
    }

    // Fallback: build from env vars
    const plans = {
      agent:     { monthly: variantUrl(Netlify.env.get("LS_VARIANT_AGENT_MONTHLY")),     annual: variantUrl(Netlify.env.get("LS_VARIANT_AGENT_ANNUAL")) },
      director:  { monthly: variantUrl(Netlify.env.get("LS_VARIANT_DIRECTOR_MONTHLY")),  annual: variantUrl(Netlify.env.get("LS_VARIANT_DIRECTOR_ANNUAL")) },
      executive: { monthly: variantUrl(Netlify.env.get("LS_VARIANT_EXECUTIVE_MONTHLY")), annual: variantUrl(Netlify.env.get("LS_VARIANT_EXECUTIVE_ANNUAL")) },
    };

    // Check if configured
    const configured = Object.values(plans).some(p => p.monthly);
    return Response.json({ source: "env", configured, plans }, { headers: cors });

  } catch(e) {
    return Response.json({ error: e.message, configured: false }, { status: 500, headers: cors });
  }
};

export const config = { path: "/api/ls-config" };
