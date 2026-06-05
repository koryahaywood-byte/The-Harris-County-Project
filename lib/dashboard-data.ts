// Shared data-fetching logic for the dashboard widget.
// Called directly by DashboardWidget (server component) and re-exported by the API route.

import { EVENTS } from "@/lib/civic-events";

export interface NewsStory {
  title: string;
  link: string;
  source: string;
  pubDate: string;
  image: string | null;
  isToday: boolean;
}

export interface MarketIndex {
  symbol: string;
  name: string;
  price: number;
  change: number;      // absolute
  changePct: number;   // percentage
}

export interface DashboardData {
  federal: NewsStory | null;
  state:   NewsStory | null;
  local:   NewsStory | null;
  todayEvents: { title: string; category: string; description: string }[];
  upcomingEvent: { title: string; date: string; daysAway: number; category: string } | null;
  nextElection:  { title: string; date: string; daysAway: number } | null;
  markets: MarketIndex[];
}

// Reliable fallback images — exact URLs returned by Wikipedia REST API (330px, pre-rendered).
const FALLBACK_IMAGES: Record<string, string> = {
  federal: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Capitol_Building_Full_View.jpg/330px-Capitol_Building_Full_View.jpg",
  state:   "https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/TexasStateCapitol-2010-01.JPG/330px-TexasStateCapitol-2010-01.JPG",
  local:   "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Texas_medical_center.jpg/330px-Texas_medical_center.jpg",
};

async function fetchMarketIndex(symbol: string, name: string): Promise<MarketIndex | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
    const res = await fetch(url, {
      next: { revalidate: 900 }, // 15-min cache
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) return null;
    const price = meta.regularMarketPrice ?? 0;
    const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
    const change = price - prevClose;
    const changePct = prevClose ? (change / prevClose) * 100 : 0;
    return { symbol, name, price, change, changePct };
  } catch {
    return null;
  }
}

async function getWikipediaImage(topic: string, fallback: string): Promise<string> {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`,
      {
        next: { revalidate: 86400 },
        headers: { "User-Agent": "HarrisCountyProject/1.0 (dapr@theharriscountyproject.com)" },
      }
    );
    if (!res.ok) return fallback;
    const data = await res.json();
    const thumb: string | undefined = data?.thumbnail?.source;
    if (!thumb) return fallback;
    return thumb;
  } catch {
    return fallback;
  }
}

async function fetchOgImage(googleNewsUrl: string, fallback: string): Promise<string> {
  try {
    const res = await fetch(googleNewsUrl, {
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; HarrisCountyProject/1.0)" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return fallback;
    // If the redirect kept us on Google's domain, the article page isn't accessible server-side
    if (res.url.includes("google.com") || res.url.includes("gstatic.com")) return fallback;
    const html = await res.text();
    const match = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
                ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    const url = match?.[1];
    if (!url || !url.startsWith("http")) return fallback;
    // Skip google/gstatic images (e.g. the Google News logo)
    if (url.includes("google.com") || url.includes("gstatic.com")) return fallback;
    return url;
  } catch {
    return fallback;
  }
}

function isTodayDate(pubDate: string, todayStr: string): boolean {
  if (!pubDate) return false;
  try {
    return new Date(pubDate).toISOString().slice(0, 10) === todayStr;
  } catch {
    return false;
  }
}

function parseAllItems(xml: string): Array<{ title: string; link: string; source: string; pubDate: string }> {
  const items: Array<{ title: string; link: string; source: string; pubDate: string }> = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = itemRe.exec(xml)) !== null) {
    const item = m[1];
    const title = item.match(/<title>([\s\S]*?)<\/title>/)?.[1]
      ?.replace(/<!\[CDATA\[|\]\]>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim() ?? "";
    const link = item.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() ?? "";
    const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() ?? "";
    const source = item.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1]
      ?.replace(/<!\[CDATA\[|\]\]>/g, "").trim() ?? "";
    if (title && link) items.push({ title, link, source, pubDate });
  }
  return items;
}

export async function fetchTopStory(
  query: string,
  todayStr: string,
): Promise<{ title: string; link: string; source: string; pubDate: string; isToday: boolean } | null> {
  try {
    const q = encodeURIComponent(`${query} after:${todayStr}`);
    const res = await fetch(
      `https://news.google.com/rss/search?q=${q}&hl=en-US&gl=US&ceid=US:en`,
      { next: { revalidate: 1800 } }
    );
    if (!res.ok) return null;
    const xml = await res.text();
    const items = parseAllItems(xml);

    if (items.length === 0) {
      const q2 = encodeURIComponent(query);
      const res2 = await fetch(
        `https://news.google.com/rss/search?q=${q2}&hl=en-US&gl=US&ceid=US:en`,
        { next: { revalidate: 3600 } }
      );
      if (!res2.ok) return null;
      const xml2 = await res2.text();
      const items2 = parseAllItems(xml2);
      if (items2.length === 0) return null;
      return { ...items2[0], isToday: false };
    }

    const todayItems = items.filter(i => isTodayDate(i.pubDate, todayStr));
    const candidate = todayItems[0] ?? items[0];
    return { ...candidate, isToday: isTodayDate(candidate.pubDate, todayStr) };
  } catch {
    return null;
  }
}

export async function getDashboardData(): Promise<DashboardData> {
  const todayStr = new Date().toISOString().slice(0, 10);

  // Fetch news stories and market data in parallel
  const [federalRaw, stateRaw, localRaw, rawMarkets] = await Promise.all([
    fetchTopStory("US Congress White House federal politics", todayStr),
    fetchTopStory("Texas Austin legislature politics 2026", todayStr),
    fetchTopStory("Houston Harris County local politics government", todayStr),
    Promise.all([
      fetchMarketIndex("^DJI",  "Dow Jones"),
      fetchMarketIndex("^GSPC", "S&P 500"),
      fetchMarketIndex("^IXIC", "NASDAQ"),
      fetchMarketIndex("CL=F",  "Oil (WTI)"),
    ]),
  ]);

  // Fetch OG images from each article in parallel, falling back to landmark photos
  const [fedImg, stateImg, localImg] = await Promise.all([
    federalRaw ? fetchOgImage(federalRaw.link, FALLBACK_IMAGES.federal) : Promise.resolve(FALLBACK_IMAGES.federal),
    stateRaw   ? fetchOgImage(stateRaw.link,   FALLBACK_IMAGES.state)   : Promise.resolve(FALLBACK_IMAGES.state),
    localRaw   ? fetchOgImage(localRaw.link,   FALLBACK_IMAGES.local)   : Promise.resolve(FALLBACK_IMAGES.local),
  ]);

  const federal = federalRaw ? { ...federalRaw, image: fedImg } : null;
  const state   = stateRaw   ? { ...stateRaw,   image: stateImg } : null;
  const local   = localRaw   ? { ...localRaw,   image: localImg } : null;

  const todayEvents = EVENTS.filter((e) => {
    if (e.endDate) return e.date <= todayStr && e.endDate >= todayStr;
    return e.date === todayStr;
  }).map((e) => ({ title: e.title, category: e.category, description: e.description }));

  const future = EVENTS
    .filter((e) => (e.endDate ? e.endDate : e.date) >= todayStr && e.date > todayStr)
    .sort((a, b) => a.date.localeCompare(b.date));
  const next = future[0] ?? null;
  const upcomingEvent = next ? {
    title: next.title,
    date: next.date,
    daysAway: Math.ceil((new Date(next.date).getTime() - new Date(todayStr).getTime()) / 86400000),
    category: next.category,
  } : null;

  const nextElectionEvent = EVENTS
    .filter((e) => e.category === "Elections" && e.importance === "high" && e.date > todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null;
  const nextElection = nextElectionEvent ? {
    title: nextElectionEvent.title,
    date: nextElectionEvent.date,
    daysAway: Math.ceil((new Date(nextElectionEvent.date).getTime() - new Date(todayStr).getTime()) / 86400000),
  } : null;

  const markets = rawMarkets.filter((m): m is MarketIndex => m !== null);

  return { federal, state, local, todayEvents, upcomingEvent, nextElection, markets };
}
