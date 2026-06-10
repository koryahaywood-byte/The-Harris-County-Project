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

// LOCAL — Chronicle is primary. Google News aggregates their paywalled content.
const LOCAL_FEEDS = [
  { url: `${GN}${encodeURIComponent("Houston Chronicle politics")}`, source: "Houston Chronicle" },
  { url: `${GN}${encodeURIComponent("Houston politics Harris County government")}` },
  { url: `${GN}${encodeURIComponent("site:houstonchronicle.com politics")}`, source: "Houston Chronicle" },
  { url: "https://www.bing.com/news/search?q=Houston+Chronicle+politics+Harris+County&format=rss" },
  { url: "https://www.bing.com/news/search?q=Harris+County+Houston+politics+government&format=rss" },
];

// STATE — Tribune is gold standard for TX political coverage
const STATE_FEEDS = [
  { url: "https://www.texastribune.org/feeds/", source: "Texas Tribune" },
  { url: `${GN}${encodeURIComponent("Texas Tribune Texas politics")}`, source: "Texas Tribune" },
  { url: `${GN}${encodeURIComponent("Texas politics Austin government 2026")}` },
  { url: "https://www.bing.com/news/search?q=Texas+Tribune+Texas+politics&format=rss" },
  { url: "https://www.bing.com/news/search?q=Texas+politics+Austin+Statesman&format=rss" },
];

// FEDERAL — NYT/WaPo/WSJ political coverage
const FEDERAL_FEEDS = [
  { url: `${GN}${encodeURIComponent("Washington Post politics Congress")}`, source: "Washington Post" },
  { url: `${GN}${encodeURIComponent("New York Times politics Congress 2026")}`, source: "New York Times" },
  { url: `${GN}${encodeURIComponent("federal politics Congress Senate midterms 2026")}` },
  { url: "https://www.bing.com/news/search?q=Washington+Post+Congress+politics&format=rss" },
  { url: "https://www.bing.com/news/search?q=NYT+politics+Congress+Senate+2026&format=rss" },
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

  const local   = localRaw   ? { ...localRaw,   image: localRaw.image   ?? FALLBACK_IMAGES.local   } : null;
  const state   = stateRaw   ? { ...stateRaw,   image: stateRaw.image   ?? FALLBACK_IMAGES.state   } : null;
  const federal = federalRaw ? { ...federalRaw, image: federalRaw.image ?? FALLBACK_IMAGES.federal } : null;

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

  const nextElectionEvent = EVENTS
    .filter(e => e.category === "Elections" && e.importance === "high" && e.date > todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null;
  const nextElection = nextElectionEvent ? {
    title: nextElectionEvent.title, date: nextElectionEvent.date,
    daysAway: Math.ceil((new Date(nextElectionEvent.date).getTime() - new Date(todayStr).getTime()) / 86400000),
  } : null;

  return { federal, state, local, todayEvents, upcomingEvent, nextElection, ballot: NOVEMBER_2026_BALLOT };
}
