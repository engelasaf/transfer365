import { getStore } from "@netlify/blobs";

export default async (req) => {
  const store = getStore("tm-agents");
  const body  = await req.json().catch(() => ({}));
  const page  = parseInt(body.page || "1");
  const BASE  = "https://www.transfermarkt.com";

  const HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml",
    "Referer": "https://www.google.com"
  };

  const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  const PHONE_RE = /(?:\+\d{1,3}[\s\-]?)?(?:\(?\d{1,4}\)?[\s\-]?)?(?:\d[\s\-]?){6,12}\d/g;

  async function fetchPage(url) {
    try {
      const r = await fetch(url, { headers: HEADERS });
      return r.ok ? r.text() : null;
    } catch { return null; }
  }

  function extractEmails(html) {
    const mailto = [...html.matchAll(/mailto:([^"\s&]+)/g)].map(m => m[1]);
    const text   = [...(html.match(EMAIL_RE) || [])];
    return [...new Set([...mailto, ...text])].filter(e =>
      !e.includes("transfermarkt") && !e.match(/\.(png|jpg|gif|svg|css|js)$/) && e.includes("@")
    )[0] || "";
  }

  function extractPhone(html) {
    const phones = (html.match(PHONE_RE) || [])
      .map(p => p.trim())
      .filter(p => p.replace(/[\D]/g,"").length >= 7);
    return phones[0] || "";
  }

  function extractName(html) {
    const m = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
    return m ? m[1].trim() : "";
  }

  function extractCountry(html) {
    const m = html.match(/class="country-name">([^<]+)</);
    return m ? m[1].trim() : "";
  }

  // Fetch listing page to get agent profile URLs
  const listHtml = await fetchPage(`${BASE}/berater/spielerberateruebersicht/berater/page/${page}`);
  if (!listHtml) {
    await store.set(`status`, JSON.stringify({ done: true, error: "blocked", page }));
    return;
  }

  // Extract agent profile URLs
  const profileUrls = [...listHtml.matchAll(/href="(\/berater\/profil\/[^"]+)"/g)]
    .map(m => BASE + m[1])
    .filter((v, i, a) => a.indexOf(v) === i);

  if (!profileUrls.length) {
    await store.set(`status`, JSON.stringify({ done: true, lastPage: page - 1 }));
    return;
  }

  // Scrape each profile (max 20 per call)
  const existing = await store.get(`agents`, { type: "json" }).catch(() => []);
  const records  = existing || [];

  for (const url of profileUrls.slice(0, 20)) {
    await new Promise(r => setTimeout(r, 800 + Math.random() * 600));
    const html = await fetchPage(url);
    if (!html) continue;
    records.push({
      url,
      name:    extractName(html),
      email:   extractEmails(html),
      phone:   extractPhone(html),
      country: extractCountry(html),
    });
  }

  await store.set(`agents`, JSON.stringify(records));
  await store.set(`status`, JSON.stringify({ 
    done: profileUrls.length < 20, 
    page, 
    total: records.length,
    withContact: records.filter(r => r.email || r.phone).length
  }));
};

export const config = { path: "/api/scrape-agents-background" };
