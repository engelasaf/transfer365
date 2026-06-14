// netlify/functions/lemonsqueezy-webhook.js
// LemonSqueezy Webhook — Netlify Functions (modern ES module format)
//
// Webhook URL after deploy:
//   https://www.transfer365.net/.netlify/functions/lemonsqueezy-webhook
//
// Register in LemonSqueezy Dashboard → Settings → Webhooks → Add webhook

import crypto from "crypto";

const VARIANT_TO_PLAN = {
  [Netlify.env.get("LS_VARIANT_AGENT_MONTHLY")]:     { plan: "agent",     billing: "monthly" },
  [Netlify.env.get("LS_VARIANT_AGENT_ANNUAL")]:      { plan: "agent",     billing: "annual"  },
  [Netlify.env.get("LS_VARIANT_DIRECTOR_MONTHLY")]:  { plan: "director",  billing: "monthly" },
  [Netlify.env.get("LS_VARIANT_DIRECTOR_ANNUAL")]:   { plan: "director",  billing: "annual"  },
  [Netlify.env.get("LS_VARIANT_EXECUTIVE_MONTHLY")]: { plan: "executive", billing: "monthly" },
  [Netlify.env.get("LS_VARIANT_EXECUTIVE_ANNUAL")]:  { plan: "executive", billing: "annual"  },
};

export default async (req) => {
  if (req.method === "OPTIONS") return new Response("", { status: 200 });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const body   = await req.text();
  const secret = Netlify.env.get("LEMONSQUEEZY_WEBHOOK_SECRET");
  const sig    = req.headers.get("x-signature") || "";
  const digest = crypto.createHmac("sha256", secret).update(body).digest("hex");

  if (!crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(sig))) {
    return new Response("Invalid signature", { status: 401 });
  }

  const payload   = JSON.parse(body);
  const eventName = payload.meta?.event_name;
  const data      = payload.data?.attributes || {};
  const variantId = String(data.variant_id || "");
  const planInfo  = VARIANT_TO_PLAN[variantId] || { plan: "agent", billing: "monthly" };
  const email     = data.user_email || "";
  const portalUrl = data.urls?.customer_portal || "";

  console.log(`[LS] ${eventName} | ${email} → ${planInfo.plan}`);

  switch (eventName) {
    case "subscription_created":
      console.log(`NEW SUBSCRIBER: ${email} on ${planInfo.plan} (${planInfo.billing})`);
      // TODO: save to database (Supabase / Netlify Blobs)
      break;
    case "subscription_updated":
      console.log(`UPDATED: ${email} → ${planInfo.plan} status:${data.status}`);
      break;
    case "subscription_cancelled":
      console.log(`CANCELLED: ${email}`);
      break;
    case "subscription_expired":
      console.log(`EXPIRED → free: ${email}`);
      break;
    case "subscription_payment_success":
      console.log(`PAYMENT OK: €${(data.total||0)/100} — ${email}`);
      break;
    case "subscription_payment_failed":
      console.warn(`PAYMENT FAILED: ${email}`);
      break;
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export const config = {
  path: "/api/lemonsqueezy-webhook",
};
