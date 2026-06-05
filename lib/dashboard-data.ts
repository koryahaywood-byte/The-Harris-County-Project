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


function isTodayDate(pubDate: string, todayStr: string): boolean {
  if (!pubDate) return false;
  try {
    return new Date(pubDate).toISOString().slice(0, 10) === todayStr;
  } catch {
    return false;
  }
}

function parseBingItems(xml: string): Array<{ title: string; link: string; source: string; pubDate: string; image: string | null }> {
  const items: Array<{ title: string; link: string; source: string; pubDate: string; image: string | null }> = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = itemRe.exec(xml)) !== null) {
    const item = m[1];
    const title = item.match(/<title>([\s\S]*?)<\/title>/)?.[1]
      ?.replace(/<!\[CDATA\[|\]\]>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim() ?? "";
    // Bing RSS links are Bing redirect URLs — extract the real URL from the `url=` param
    const rawLink = item.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() ?? "";
    const realUrl = rawLink.match(/[?&]url=([^&]+)/)?.[1];
    const link = realUrl ? decodeURIComponent(realUrl) : rawLink;
    const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() ?? "";
    const source = item.match(/<News:Source>([\s\S]*?)<\/News:Source>/)?.[1]?.trim() ?? "";
    // Bing includes <News:Image> with a direct CDN thumbnail URL
    const image = item.match(/<News:Image>([\s\S]*?)<\/News:Image>/)?.[1]?.trim() ?? null;
    if (title && link) items.push({ title, link, source, pubDate, image });
  }
  return items;
}

export async function fetchTopStory(
  query: string,
  todayStr: string,
): Promise<{ title: string; link: string; source: string; pubDate: string; image: string | null; isToday: boolean } | null> {
  try {
    const q = encodeURIComponent(query);
    const res = await fetch(
      `https://www.bing.com/news/search?q=${q}&format=rss`,
      {
        next: { revalidate: 1800 },
        headers: { "User-Agent": "Mozilla/5.0 (compatible; HarrisCountyProject/1.0)" },
      }
    );
    if (!res.ok) return null;
    const xml = await res.text();
    const items = parseBingItems(xml);
    if (items.length === 0) return null;

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

  // Bing RSS includes <News:Image> CDN thumbnails directly — use them, fall back to landmark
  const federal = federalRaw ? { ...federalRaw, image: federalRaw.image ?? FALLBACK_IMAGES.federal } : null;
  const state   = stateRaw   ? { ...stateRaw,   image: stateRaw.image   ?? FALLBACK_IMAGES.state   } : null;
  const local   = localRaw   ? { ...localRaw,   image: localRaw.image   ?? FALLBACK_IMAGES.local   } : null;

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
