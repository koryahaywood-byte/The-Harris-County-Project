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

// Wikipedia REST API returns verified, hotlink-safe thumbnail URLs.
// Cached for 24h since these images rarely change.
const WIKI_TOPICS: Record<string, string> = {
  federal: "United_States_Capitol",
  state:   "Texas_State_Capitol",
  local:   "Houston",
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

async function getWikipediaImage(topic: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`,
      {
        next: { revalidate: 86400 },
        headers: { "User-Agent": "HarrisCountyProject/1.0 (dapr@theharriscountyproject.com)" },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    // Use the thumbnail CDN URL (hotlink-safe) and bump to 800px wide
    const thumb: string | undefined = data?.thumbnail?.source;
    if (!thumb) return null;
    // Replace whatever px width is in the URL with 800px
    return thumb.replace(/\/\d+px-/, "/800px-");
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
  image: string | null
): Promise<NewsStory | null> {
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
      // No stories today — fall back to most recent without date filter
      const q2 = encodeURIComponent(query);
      const res2 = await fetch(
        `https://news.google.com/rss/search?q=${q2}&hl=en-US&gl=US&ceid=US:en`,
        { next: { revalidate: 3600 } }
      );
      if (!res2.ok) return null;
      const xml2 = await res2.text();
      const items2 = parseAllItems(xml2);
      if (items2.length === 0) return null;
      return { ...items2[0], image, isToday: false };
    }

    const todayItems = items.filter(i => isTodayDate(i.pubDate, todayStr));
    const candidate = todayItems[0] ?? items[0];
    return { ...candidate, image, isToday: isTodayDate(candidate.pubDate, todayStr) };
  } catch {
    return null;
  }
}

export async function getDashboardData(): Promise<DashboardData> {
  const todayStr = new Date().toISOString().slice(0, 10);

  // Fetch Wikipedia images, news stories, and market data in parallel
  const [wikiImgs, federalStory, stateStory, localStory, rawMarkets] = await Promise.all([
    Promise.all([
      getWikipediaImage(WIKI_TOPICS.federal),
      getWikipediaImage(WIKI_TOPICS.state),
      getWikipediaImage(WIKI_TOPICS.local),
    ]),
    fetchTopStory("US Congress White House federal politics", todayStr, null),
    fetchTopStory("Texas Austin legislature politics 2026", todayStr, null),
    fetchTopStory("Houston Harris County local politics government", todayStr, null),
    Promise.all([
      fetchMarketIndex("^DJI",  "Dow Jones"),
      fetchMarketIndex("^GSPC", "S&P 500"),
      fetchMarketIndex("^IXIC", "NASDAQ"),
      fetchMarketIndex("CL=F",  "Oil (WTI)"),
    ]),
  ]);

  const [fedImg, stateImg, localImg] = wikiImgs;

  const federal = federalStory ? { ...federalStory, image: fedImg } : null;
  const state   = stateStory   ? { ...stateStory,   image: stateImg } : null;
  const local   = localStory   ? { ...localStory,   image: localImg } : null;

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
