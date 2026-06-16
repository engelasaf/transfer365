import { getStore } from "@netlify/blobs";

export default async (req) => {
  const store  = getStore("tm-agents");
  const agents = await store.get("agents", { type: "json" }).catch(() => []);
  const mode   = new URL(req.url).searchParams.get("mode") || "facebook";

  if (mode === "facebook") {
    // Facebook Custom Audience format
    let csv = "email,phone,fn,ln,country\n";
    for (const a of (agents||[])) {
      if (!a.email && !a.phone) continue;
      const parts = (a.name||"").split(" ");
      csv += [
        (a.email||"").toLowerCase(),
        (a.phone||"").replace(/[^\d+]/g,""),
        parts[0]||"",
        parts.slice(1).join(" ")||"",
        a.country||""
      ].map(v => `"${v.replace(/"/g,\'\'")}"`).join(",") + "\n";
    }
    return new Response(csv, {
      headers: { "Content-Type": "text/csv",
                 "Content-Disposition": "attachment; filename=agents_facebook.csv" }
    });
  }

  // Raw full data
  let csv = "name,email,phone,country,url\n";
  for (const a of (agents||[])) {
    csv += [a.name,a.email,a.phone,a.country,a.url]
      .map(v => `"${(v||"").replace(/"/g,\'\'")}"`).join(",") + "\n";
  }
  return new Response(csv, {
    headers: { "Content-Type": "text/csv",
               "Content-Disposition": "attachment; filename=agents_all.csv" }
  });
};

export const config = { path: "/api/download-agents" };
