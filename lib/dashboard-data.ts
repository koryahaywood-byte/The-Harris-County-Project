// War room dashboard data layer.
// Primary: Google News RSS (aggregates paywalled publications, always fresh)
// Fallback: Bing News RSS
// Stories are always the most recent — never show "no story" for active publications.

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

    // Title — strip CDATA, HTML entities, trailing " - Source" suffixes
    const rawTitle = item.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1] ?? "";
    const title = rawTitle
      .replace(/<!\[CDATA\[|\]\]>/g, "")
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
      .replace(/\s[-|]\s[^-|]{3,60}$/, "")
      .trim();

    // Link — Google News wraps in <a>, Bing uses redirect URL
    const rawLink = item.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim()
      ?? item.match(/<guid[^>]*>([\s\S]*?)<\/guid>/)?.[1]?.trim() ?? "";
    const bingUrl  = rawLink.match(/[?&]url=([^&]+)/)?.[1];
    const link = bingUrl ? decodeURIComponent(bingUrl) : rawLink;

    // Pub date
    const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() ?? "";

    // Source — Google News puts it in <source>, Bing in <News:Source>
    const source =
      item.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, "").trim()
      ?? item.match(/<News:Source>([\s\S]*?)<\/News:Source>/)?.[1]?.trim()
      ?? "";

    // Image — Bing <News:Image>, or og:image in enclosure, or media:content
    const image =
      item.match(/<News:Image>([\s\S]*?)<\/News:Image>/)?.[1]?.trim()
      ?? item.match(/<media:content[^>]+url="([^"]+)"/)?.[1]
      ?? item.match(/<enclosure[^>]+url="([^"]+)"/)?.[1]
      ?? null;

    if (title && link) items.push({ title, link, source, pubDate, image });
  }
  return items;
}

// ── Fetch og:image via Microlink API ─────────────────────────────────────────
// Microlink is a free metadata API that properly follows JS redirects
// (e.g. Google News → real article URL) and returns the og:image.
// Free tier: 100 req/day per IP — cached 30 min so 3 stories = 3 req per cycle.
async function scrapeOgImage(articleUrl: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const api = `https://api.microlink.io?url=${encodeURIComponent(articleUrl)}&screenshot=false&video=false&audio=false`;
    const res = await fetch(api, {
      signal: controller.signal,
      headers: { "Accept": "application/json" },
      next: { revalidate: 1800 },
    });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const json = await res.json();

    const img: string | null =
      json?.data?.image?.url
      ?? json?.data?.logo?.url
      ?? null;

    // Reject tiny logos/icons masquerading as story images
    const w = json?.data?.image?.width ?? 999;
    const h = json?.data?.image?.height ?? 999;
    if (!img || (w < 200 && h < 200)) return null;

    return img;
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
  // Try all feeds in parallel — prefer today's story from any source
  const results = await Promise.all(feeds.map(f => fetchFromFeed(f.url, todayStr, f.source)));
  return results.find(r => r?.isToday) ?? results.find(r => r !== null) ?? null;
}

// ── Feed definitions ──────────────────────────────────────────────────────────

// LOCAL — Chronicle Houston Politics section only (city hall, Harris County, mayor, commissioners)
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

// STATE — Tribune primary + Chronicle Texas Politics section
const STATE_FEEDS = [
  // Texas Tribune direct RSS (always fresh TX-specific coverage)
  { url: "https://www.texastribune.org/feeds/", source: "Texas Tribune" },
  // Chronicle Texas Politics section RSS
  { url: "https://www.houstonchronicle.com/rss/feed/Texas-Politics-2341355.php", source: "Houston Chronicle" },
  { url: `${GN}${encodeURIComponent("Texas Tribune Texas legislature Austin politics 2026")}`, source: "Texas Tribune" },
  { url: `${GN}${encodeURIComponent('site:houstonchronicle.com Texas politics Austin legislature governor')}`, source: "Houston Chronicle" },
  { url: "https://www.bing.com/news/search?q=Texas+Tribune+Texas+politics+Austin+legislature&format=rss" },
];

// FEDERAL — Chronicle US/World + WaPo/NYT
const FEDERAL_FEEDS = [
  // Chronicle US & World Politics section RSS
  { url: "https://www.houstonchronicle.com/rss/feed/US-World-Politics-2341360.php", source: "Houston Chronicle" },
  { url: `${GN}${encodeURIComponent("Washington Post Congress White House politics")}`, source: "Washington Post" },
  { url: `${GN}${encodeURIComponent("New York Times Congress Senate federal politics 2026")}`, source: "New York Times" },
  { url: `${GN}${encodeURIComponent('site:houstonchronicle.com Congress federal Washington politics')}`, source: "Houston Chronicle" },
  { url: "https://www.bing.com/news/search?q=Congress+Senate+White+House+federal+politics+2026&format=rss" },
];

// November 2026 Harris County ballot
const NOVEMBER_2026_BALLOT: BallotRace[] = [
  { office: "Harris County Judge",     incumbent: "Lina Hidalgo (D)",    party: "D", competitive: "Toss-up", href: "/politicians" },
  { office: "U.S. House TX-07",        incumbent: "Lizzie Fletcher (D)", party: "D", competitive: "Toss-up", href: "/tools/congress-beat" },
  { office: "U.S. Senate (TX)",        incumbent: "John Cornyn (R)",     party: "R", competitive: "Lean R",  href: "/tools/congress-beat" },
  { office: "TX Governor",             incumbent: "Greg Abbott (R)",     party: "R", competitive: "Lean R",  href: "/tools/state-beat" },
  { office: "HC Commissioner Pct. 2",  incumbent: "Adrian Garcia (D)",   party: "D", competitive: "Lean D", href: "/politicians" },
  { office: "U.S. House TX-22",        incumbent: "Troy Nehls (R)",      party: "R", competitive: "Lean R",  href: "/tools/congress-beat" },
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

  // Countdown: only actual voting days (primary, runoff, general) — not filing or registration deadlines
  const ELECTION_DAY_IDS = new Set(["primary-2026", "runoff-2026", "general-2026"]);
  const nextElectionEvent = EVENTS
    .filter(e => ELECTION_DAY_IDS.has(e.id) && e.date > todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null;
  const nextElection = nextElectionEvent ? {
    title: nextElectionEvent.title, date: nextElectionEvent.date,
    daysAway: Math.ceil((new Date(nextElectionEvent.date).getTime() - new Date(todayStr).getTime()) / 86400000),
  } : null;

  return { federal, state, local, todayEvents, upcomingEvent, nextElection, ballot: NOVEMBER_2026_BALLOT };
}
