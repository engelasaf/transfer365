// netlify/functions/ls-config.mjs
// Returns checkout URLs — reads from Netlify Blobs (set by ls-setup)

import { getStore } from "@netlify/blobs";

export default async (req) => {
  const cors = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };
  if (req.method === "OPTIONS") return new Response("", { status: 200, headers: cors });

  try {
    const store = getStore("ls-config");
    const config = await store.get("checkout-config", { type: "json" });
    if (config?.plans) {
      return Response.json({ configured: true, ...config }, { headers: cors });
    }
    return Response.json({ configured: false, message: "Run /api/ls-setup first" }, { headers: cors });
  } catch(e) {
    return Response.json({ configured: false, error: e.message }, { status: 500, headers: cors });
  }
};

export const config = { path: "/api/ls-config" };
