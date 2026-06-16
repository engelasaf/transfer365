import { getStore } from "@netlify/blobs";

export default async () => {
  const store  = getStore("tm-agents");
  const status = await store.get("status", { type: "json" }).catch(() => null);
  const agents = await store.get("agents", { type: "json" }).catch(() => []);
  return Response.json({ status, count: (agents||[]).length,
    withContact: (agents||[]).filter(r => r.email||r.phone).length });
};

export const config = { path: "/api/scrape-status" };
