export default async (req) => {
  const url  = new URL(req.url);
  const page = url.searchParams.get("page") || "1";
  const mode = url.searchParams.get("mode") || "list"; // list | profile

  const TM_BASE = "https://www.transfermarkt.com";
  const HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Referer": "https://www.google.com/",
    "Cache-Control": "no-cache",
  };

  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") return new Response("", { headers: cors });

  try {
    if (mode === "list") {
      // Fetch agent listing page → return profile URLs
      const listUrl = `${TM_BASE}/berater/spielerberateruebersicht/berater/page/${page}`;
      const r = await fetch(listUrl, { headers: HEADERS });

      if (!r.ok) {
        return Response.json({ error: `TM returned ${r.status}`, urls: [] }, { headers: cors });
      }

      const html = await r.text();

      // Extract agent profile URLs
      const urlMatches = [...html.matchAll(/href="(\/berater\/profil\/[^"?]+)"/g)];
      const urls = [...new Set(urlMatches.map(m => TM_BASE + m[1]))];

      // Check if there's a next page
      const hasNext = html.includes(`page/${parseInt(page)+1}`) || urls.length >= 15;

      return Response.json({ urls, page: parseInt(page), hasNext }, { headers: cors });

    } else if (mode === "profile") {
      // Fetch one agent profile → extract contact info
      const profileUrl = url.searchParams.get("url");
      if (!profileUrl) return Response.json({ error: "missing url" }, { headers: cors });

      const r = await fetch(profileUrl, { headers: HEADERS });
      if (!r.ok) return Response.json({ error: `${r.status}`, url: profileUrl }, { headers: cors });

      const html = await r.text();

      // Extract name
      const nameM = html.match(/<h1[^>]*class="[^"]*data-header[^"]*"[^>]*>([^<]+)/);
      const name  = nameM ? nameM[1].trim() : (html.match(/<h1[^>]*>([^<]{2,60})<\/h1>/)?.[1]?.trim() || "");

      // Extract email — mailto links first
      const mailtoMatches = [...html.matchAll(/mailto:([^"'\s&?]+)/g)];
      const emails = mailtoMatches.map(m => m[1].toLowerCase().trim())
        .filter(e => e.includes("@") && !e.includes("transfermarkt") && e.length < 80);

      // Fallback: regex in text
      if (!emails.length) {
        const textEmails = [...html.matchAll(/[a-zA-Z0-9._%+\-]{1,30}@[a-zA-Z0-9.\-]{2,30}\.[a-zA-Z]{2,6}/g)]
          .map(m => m[0].toLowerCase())
          .filter(e => !e.includes("transfermarkt") && !e.match(/\.(png|jpg|gif|svg|css|js)$/));
        if (textEmails.length) emails.push(textEmails[0]);
      }

      // Phone — look for international format
      const phoneMatches = [...html.matchAll(/(?:\+\d{1,3}[\s\-.]?)?\(?\d{1,4}\)?[\s\-.]?\d{3,4}[\s\-.]?\d{3,4}[\s\-.]?\d{0,4}/g)]
        .map(m => m[0].trim())
        .filter(p => p.replace(/[^\d]/g,"").length >= 7 && p.replace(/[^\d]/g,"").length <= 15);

      // Country
      const countryM = html.match(/class="[^"]*country-name[^"]*"[^>]*>([^<]{2,40})</);
      const country  = countryM ? countryM[1].trim() : "";

      return Response.json({
        url: profileUrl,
        name,
        email: emails[0] || "",
        phone: phoneMatches[0] || "",
        country,
      }, { headers: cors });
    }

    return Response.json({ error: "unknown mode" }, { headers: cors });

  } catch (err) {
    return Response.json({ error: err.message }, { headers: cors });
  }
};

export const config = { path: "/api/tm-scrape" };
