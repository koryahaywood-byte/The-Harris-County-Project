// War room dashboard data layer.
// Primary: Google News RSS (aggregates paywalled publications, always fresh)
// Fallback: Bing News RSS
// Stories are always the most recent. Never show "no story" for active publications.

import { EVENTS } from "@/lib/civic-events";

export interface NewsStory {
  title: string;
  link: string;
  source: string;
  pubDate: string;
  image: string | null;
  isToday: boolean;
}

export interface BallotRace {
  office: string;
  incumbent: string;
  party: "D" | "R" | "?";
  competitive: "Safe D" | "Lean D" | "Toss-up" | "Lean R" | "Safe R";
  href: string;
}

export interface DashboardData {
  federal: NewsStory | null;
  state:   NewsStory | null;
  local:   NewsStory | null;
  todayEvents: { title: string; category: string; description: string }[];
  upcomingEvent: { title: string; date: string; daysAway: number; category: string } | null;
  nextElection:  { title: string; date: string; daysAway: number } | null;
  nextFiling:    { title: string; date: string; daysAway: number } | null;
  ballot: BallotRace[];
}

const FALLBACK_IMAGES: Record<string, string> = {
  federal: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Capitol_Building_Full_View.jpg/330px-Capitol_Building_Full_View.jpg",
  state:   "https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/TexasStateCapitol-2010-01.JPG/330px-TexasStateCapitol-2010-01.JPG",
  local:   "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Texas_medical_center.jpg/330px-Texas_medical_center.jpg",
};

function isTodayDate(pubDate: string, todayStr: string): boolean {
  if (!pubDate) return false;
  try { return new Date(pubDate).toISOString().slice(0, 10) === todayStr; }
  catch { return false; }
}

// ── RSS parser (handles Google News, Bing, Tribune, AP formats) ───────────────
function parseRssItems(xml: string): Array<{
  title: string; link: string; source: string; pubDate: string; image: string | null;
}> {
  const items: Array<{ title: string; link: string; source: string; pubDate: string; image: string | null }> = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = itemRe.exec(xml)) !== null) {
    const item = m[1];

    // Title. Strip CDATA, HTML entities, trailing " - Source" suffixes
    const rawTitle = item.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1] ?? "";
    const title = rawTitle
      .replace(/<!\[CDATA\[|\]\]>/g, "")
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
      .replace(/\s[-|]\s[^-|]{3,60}$/, "")
      .trim();

    // Link. Google News wraps in <a>, Bing uses redirect URL
    const rawLink = item.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim()
      ?? item.match(/<guid[^>]*>([\s\S]*?)<\/guid>/)?.[1]?.trim() ?? "";
    const bingUrl  = rawLink.match(/[?&]url=([^&]+)/)?.[1];
    const link = bingUrl ? decodeURIComponent(bingUrl) : rawLink;

    // Pub date
    const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() ?? "";

    // Source. Google News puts it in <source>, Bing in <News:Source>
    const source =
      item.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, "").trim()
      ?? item.match(/<News:Source>([\s\S]*?)<\/News:Source>/)?.[1]?.trim()
      ?? "";

    // Image: Bing <News:Image>, or og:image in enclosure, or media:content
    const image =
      item.match(/<News:Image>([\s\S]*?)<\/News:Image>/)?.[1]?.trim()
      ?? item.match(/<media:content[^>]+url="([^"]+)"/)?.[1]
      ?? item.match(/<enclosure[^>]+url="([^"]+)"/)?.[1]
      ?? null;

    if (title && link) items.push({ title, link, source, pubDate, image });
  }
  return items;
}

// ── Decode Google News base64 article URLs → real article URL ────────────────
// Google News RSS article links are protobuf-encoded blobs. The real URL is
// embedded as a UTF-8 string inside the decoded bytes.
function resolveArticleUrl(url: string): string {
  if (!url.includes("news.google.com")) return url;
  try {
    const b64 = url.match(/articles\/([A-Za-z0-9_\-]+=*)/)?.[1];
    if (!b64) return url;
    const decoded = Buffer.from(b64, "base64").toString("binary");
    // Real URL is a contiguous ASCII substring starting with http
    const found = decoded.match(/https?:\/\/[!-~]+/)?.[0];
    if (!found) return url;
    // Strip trailing garbage bytes that may have been included
    return found.replace(/[^\x20-\x7e]/g, "").replace(/[^\w\-._~:/?#\[\]@!$&'()*+,;=%]/g, "");
  } catch { return url; }
}

// ── Scrape og:image from the real article page (stream first 24 KB) ───────────
async function scrapeOgImage(articleUrl: string): Promise<string | null> {
  const realUrl = resolveArticleUrl(articleUrl);
  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(realUrl, {
      signal: controller.signal,
      headers: {
        // Mimic social crawler so sites serve the open-graph head without a paywall redirect
        "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
        "Accept": "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      next: { revalidate: 1800 },
    });
    clearTimeout(tid);
    if (!res.ok) return null;

    // Stream only the first 24 KB: enough to reach </head>
    const reader = res.body?.getReader();
    if (!reader) return null;
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (total < 24576) {
      const { done, value } = await reader.read();
      if (done || !value) break;
      chunks.push(value);
      total += value.byteLength;
      const partial = new TextDecoder().decode(value, { stream: true });
      if (partial.includes("</head>") || partial.includes("<body")) break;
    }
    reader.cancel().catch(() => {});

    const html = new TextDecoder().decode(
      new Uint8Array(chunks.reduce<number[]>((acc, c) => [...acc, ...c], []))
    );

    // Try og:image first, then twitter:image
    const imgUrl =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1]
      ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)?.[1]
      ?? html.match(/<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i)?.[1]
      ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["']/i)?.[1]
      ?? null;

    if (!imgUrl) return null;
    // Reject obvious logos/placeholders
    if (/logo|icon|placeholder|default|avatar/i.test(imgUrl)) return null;
    // Must look like an image URL
    if (!/\.(jpe?g|png|webp|gif)/i.test(imgUrl) && !imgUrl.includes("image") && !imgUrl.includes("photo")) return null;

    return imgUrl.startsWith("//") ? `https:${imgUrl}` : imgUrl;
  } catch { return null; }
}

// ── Fetch from a URL, parse, return best story ────────────────────────────────
async function fetchFromFeed(url: string, todayStr: string, sourceName?: string) {
  try {
    const res = await fetch(url, {
      next: { revalidate: 1800 },
      headers: { "User-Agent": "Mozilla/5.0 (compatible; HarrisCountyProject/1.0)" },
    });
    if (!res.ok) return null;
    const xml   = await res.text();
    const items = parseRssItems(xml);
    if (!items.length) return null;

    // Prefer today's story, fall back to most recent
    const todayItems = items.filter(i => isTodayDate(i.pubDate, todayStr));
    const candidate  = todayItems[0] ?? items[0];
    return {
      ...candidate,
      source: sourceName ?? candidate.source,
      isToday: isTodayDate(candidate.pubDate, todayStr),
    };
  } catch { return null; }
}

// ── Google News RSS (always has today's headlines from paywalled sources) ─────
const GN = "https://news.google.com/rss/search?hl=en-US&gl=US&ceid=US:en&q=";

async function fetchTier(feeds: Array<{ url: string; source?: string }>, todayStr: string) {
  // Try all feeds in parallel. Prefer today's story from any source
  const results = await Promise.all(feeds.map(f => fetchFromFeed(f.url, todayStr, f.source)));
  return results.find(r => r?.isToday) ?? results.find(r => r !== null) ?? null;
}

// ── Feed definitions ──────────────────────────────────────────────────────────

// LOCAL. Chronicle Houston Politics section only (city hall, Harris County, mayor, commissioners)
// Explicitly exclude Texas/national Chronicle sections so we don't bleed tiers
const LOCAL_FEEDS = [
  // Chronicle's Houston Politics RSS (direct section feed)
  { url: "https://www.houstonchronicle.com/rss/feed/Houston-Politics-2341346.php", source: "Houston Chronicle" },
  // Google News targeting Chronicle Houston/Harris County stories specifically
  { url: `${GN}${encodeURIComponent('site:houstonchronicle.com "houston" OR "harris county" politics -texas -senate -governor')}`, source: "Houston Chronicle" },
  { url: `${GN}${encodeURIComponent("Houston mayor city council Harris County commissioner Whitmire politics")}`, source: "Houston Chronicle" },
  { url: "https://www.bing.com/news/search?q=site:houstonchronicle.com+Houston+Harris+County+local+politics&format=rss", source: "Houston Chronicle" },
  { url: "https://www.bing.com/news/search?q=Houston+city+hall+mayor+Whitmire+Harris+County+commissioner&format=rss" },
];

// STATE. Tribune primary + Chronicle Texas Politics section
const STATE_FEEDS = [
  // Texas Tribune direct RSS (always fresh TX-specific coverage)
  { url: "https://www.texastribune.org/feeds/", source: "Texas Tribune" },
  // Chronicle Texas Politics section RSS
  { url: "https://www.houstonchronicle.com/rss/feed/Texas-Politics-2341355.php", source: "Houston Chronicle" },
  { url: `${GN}${encodeURIComponent("Texas Tribune Texas legislature Austin politics 2026")}`, source: "Texas Tribune" },
  { url: `${GN}${encodeURIComponent('site:houstonchronicle.com Texas politics Austin legislature governor')}`, source: "Houston Chronicle" },
  { url: "https://www.bing.com/news/search?q=Texas+Tribune+Texas+politics+Austin+legislature&format=rss" },
];

// FEDERAL. Chronicle US/World + WaPo/NYT
const FEDERAL_FEEDS = [
  // Chronicle US & World Politics section RSS
  { url: "https://www.houstonchronicle.com/rss/feed/US-World-Politics-2341360.php", source: "Houston Chronicle" },
  { url: `${GN}${encodeURIComponent("Washington Post Congress White House politics")}`, source: "Washington Post" },
  { url: `${GN}${encodeURIComponent("New York Times Congress Senate federal politics 2026")}`, source: "New York Times" },
  { url: `${GN}${encodeURIComponent('site:houstonchronicle.com Congress federal Washington politics')}`, source: "Houston Chronicle" },
  { url: "https://www.bing.com/news/search?q=Congress+Senate+White+House+federal+politics+2026&format=rss" },
];

// November 2026 Harris County ballot. Lean ratings sync'd with matchups-2026.ts
const NOVEMBER_2026_BALLOT: BallotRace[] = [
  { office: "Harris County Judge",     incumbent: "Plummer (D) vs Sanchez (R). Open", party: "D", competitive: "Lean D",  href: "/tools/ballot-2026" },
  { office: "U.S. Senate (TX)",        incumbent: "Talarico (D) vs Paxton (R)",         party: "D", competitive: "Lean D",  href: "/tools/ballot-2026" },
  { office: "U.S. House TX-07",        incumbent: "Fletcher (D) vs Hale (R)",           party: "D", competitive: "Toss-up", href: "/tools/ballot-2026" },
  { office: "U.S. House TX-09",        incumbent: "Open. Gutierrez (D) vs Mealer (R)", party: "D", competitive: "Toss-up", href: "/tools/ballot-2026" },
  { office: "U.S. House TX-38",        incumbent: "McDonough (D) vs Bonck (R). Open",  party: "R", competitive: "Lean R",  href: "/tools/ballot-2026" },
  { office: "TX Governor",             incumbent: "Hinojosa (D) vs Abbott (R)",         party: "R", competitive: "Safe R",  href: "/tools/ballot-2026" },
];

export async function getDashboardData(): Promise<DashboardData> {
  const todayStr = new Date().toISOString().slice(0, 10);

  const [localRaw, stateRaw, federalRaw] = await Promise.all([
    fetchTier(LOCAL_FEEDS,   todayStr),
    fetchTier(STATE_FEEDS,   todayStr),
    fetchTier(FEDERAL_FEEDS, todayStr),
  ]);

  // Scrape og:image from actual article pages in parallel.
  // If the RSS already has an image, use it directly (skip scrape).
  const [localImg, stateImg, federalImg] = await Promise.all([
    localRaw?.image   ? Promise.resolve(localRaw.image)   : localRaw   ? scrapeOgImage(localRaw.link)   : Promise.resolve(null),
    stateRaw?.image   ? Promise.resolve(stateRaw.image)   : stateRaw   ? scrapeOgImage(stateRaw.link)   : Promise.resolve(null),
    federalRaw?.image ? Promise.resolve(federalRaw.image) : federalRaw ? scrapeOgImage(federalRaw.link) : Promise.resolve(null),
  ]);

  const local   = localRaw   ? { ...localRaw,   image: localImg   ?? FALLBACK_IMAGES.local   } : null;
  const state   = stateRaw   ? { ...stateRaw,   image: stateImg   ?? FALLBACK_IMAGES.state   } : null;
  const federal = federalRaw ? { ...federalRaw, image: federalImg ?? FALLBACK_IMAGES.federal } : null;

  const todayEvents = EVENTS.filter(e => {
    if (e.endDate) return e.date <= todayStr && e.endDate >= todayStr;
    return e.date === todayStr;
  }).map(e => ({ title: e.title, category: e.category, description: e.description }));

  const future = EVENTS
    .filter(e => (e.endDate ? e.endDate : e.date) >= todayStr && e.date > todayStr)
    .sort((a, b) => a.date.localeCompare(b.date));
  const next = future[0] ?? null;
  const upcomingEvent = next ? {
    title: next.title, date: next.date, category: next.category,
    daysAway: Math.ceil((new Date(next.date).getTime() - new Date(todayStr).getTime()) / 86400000),
  } : null;

  // Countdown: only actual voting days (primary, runoff, general, municipal)
  const ELECTION_DAY_IDS = new Set(["primary-2026", "runoff-2026", "general-2026", "hcc-election-2027"]);
  const nextElectionEvent = EVENTS
    .filter(e => ELECTION_DAY_IDS.has(e.id) && e.date > todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null;

  // Secondary: next candidate filing deadline OR campaign finance report deadline
  const FILING_CLOSE_IDS = new Set([
    "candidate-filing-close", "hcc-filing-close-2027",
    "tec-jan-2026", "tec-jul-2026", "tec-jan-2027",
    "fec-q2-2026", "fec-q3-2026", "fec-pre-general-2026",
  ]);
  const nextFilingEvent = EVENTS
    .filter(e => FILING_CLOSE_IDS.has(e.id) && e.date > todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null;
  const nextElection = nextElectionEvent ? {
    title: nextElectionEvent.title, date: nextElectionEvent.date,
    daysAway: Math.ceil((new Date(nextElectionEvent.date).getTime() - new Date(todayStr).getTime()) / 86400000),
  } : null;

  const nextFiling = nextFilingEvent ? {
    title: nextFilingEvent.title, date: nextFilingEvent.date,
    daysAway: Math.ceil((new Date(nextFilingEvent.date).getTime() - new Date(todayStr).getTime()) / 86400000),
  } : null;

  return { federal, state, local, todayEvents, upcomingEvent, nextElection, nextFiling, ballot: NOVEMBER_2026_BALLOT };
}
