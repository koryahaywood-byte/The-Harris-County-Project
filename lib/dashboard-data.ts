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

export interface DashboardData {
  federal: NewsStory | null;
  state:   NewsStory | null;
  local:   NewsStory | null;
  todayEvents: { title: string; category: string; description: string }[];
  upcomingEvent: { title: string; date: string; daysAway: number; category: string } | null;
  nextElection:  { title: string; date: string; daysAway: number } | null;
}

// Contextual fallback images per tier — reliable Wikimedia Commons photos
const TIER_IMAGES: Record<string, string> = {
  federal: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/US_Capitol_Building_at_night_Jan_2006.jpg/1200px-US_Capitol_Building_at_night_Jan_2006.jpg",
  state:   "https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Texas_State_Capitol_at_sunset.jpg/1200px-Texas_State_Capitol_at_sunset.jpg",
  local:   "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Houston_night_skyline_composite.jpg/1200px-Houston_night_skyline_composite.jpg",
};

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
  tier: "federal" | "state" | "local"
): Promise<NewsStory | null> {
  try {
    // Add `after:` filter so Google News returns only articles from today/recent
    const afterDate = todayStr; // YYYY-MM-DD
    const q = encodeURIComponent(`${query} after:${afterDate}`);
    const res = await fetch(
      `https://news.google.com/rss/search?q=${q}&hl=en-US&gl=US&ceid=US:en`,
      { next: { revalidate: 1800 } } // 30-min cache for freshness
    );
    if (!res.ok) return null;
    const xml = await res.text();
    const items = parseAllItems(xml);
    if (items.length === 0) {
      // Fallback: try without the date filter if no results today
      const q2 = encodeURIComponent(query);
      const res2 = await fetch(
        `https://news.google.com/rss/search?q=${q2}&hl=en-US&gl=US&ceid=US:en`,
        { next: { revalidate: 3600 } }
      );
      if (!res2.ok) return null;
      const xml2 = await res2.text();
      const items2 = parseAllItems(xml2);
      if (items2.length === 0) return null;
      const best = items2[0];
      return { ...best, image: TIER_IMAGES[tier], isToday: false };
    }

    const todayItems = items.filter(i => isTodayDate(i.pubDate, todayStr));
    const candidate = todayItems[0] ?? items[0];
    const isToday = isTodayDate(candidate.pubDate, todayStr);

    return { ...candidate, image: TIER_IMAGES[tier], isToday };
  } catch {
    return null;
  }
}

export async function getDashboardData(): Promise<DashboardData> {
  const todayStr = new Date().toISOString().slice(0, 10);

  const [federal, state, local] = await Promise.all([
    fetchTopStory("US Congress White House federal politics", todayStr, "federal"),
    fetchTopStory("Texas Austin legislature politics 2026", todayStr, "state"),
    fetchTopStory("Houston Harris County local politics government", todayStr, "local"),
  ]);

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

  return { federal, state, local, todayEvents, upcomingEvent, nextElection };
}
