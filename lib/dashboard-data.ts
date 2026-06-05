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

// Fetch the OG image from a news article URL (server-side, follows redirects)
async function fetchOGImage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        "Accept": "text/html",
      },
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    // Only read the first 12KB — og:image is always in <head>
    const reader = res.body?.getReader();
    if (!reader) return null;
    let html = "";
    while (html.length < 12000) {
      const { done, value } = await reader.read();
      if (done) break;
      html += new TextDecoder().decode(value);
    }
    reader.cancel();
    const match =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ??
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ??
      html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

function isTodayDate(pubDate: string, todayStr: string): boolean {
  if (!pubDate) return false;
  try {
    const d = new Date(pubDate);
    return d.toISOString().slice(0, 10) === todayStr;
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
    const link  = item.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() ?? "";
    const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() ?? "";
    const source  = item.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1]
      ?.replace(/<!\[CDATA\[|\]\]>/g, "").trim() ?? "";
    if (title && link) items.push({ title, link, source, pubDate });
  }
  return items;
}

export async function fetchTopStory(query: string, todayStr: string): Promise<NewsStory | null> {
  try {
    const q = encodeURIComponent(query);
    const res = await fetch(
      `https://news.google.com/rss/search?q=${q}&hl=en-US&gl=US&ceid=US:en`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    const xml = await res.text();
    const items = parseAllItems(xml);
    if (items.length === 0) return null;

    // Prefer today's stories; fall back to most recent if none today
    const todayItems = items.filter(i => isTodayDate(i.pubDate, todayStr));
    const candidate = todayItems[0] ?? items[0];
    const isToday = isTodayDate(candidate.pubDate, todayStr);

    // Fetch OG image in parallel — non-blocking (returns null on timeout)
    const image = await fetchOGImage(candidate.link);

    return { ...candidate, image, isToday };
  } catch {
    return null;
  }
}

export async function getDashboardData(): Promise<DashboardData> {
  const todayStr = new Date().toISOString().slice(0, 10);

  const [federal, state, local] = await Promise.all([
    fetchTopStory("US federal government politics Congress White House", todayStr),
    fetchTopStory("Texas politics government Austin legislature 2026", todayStr),
    fetchTopStory("Houston Harris County politics local government 2026", todayStr),
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
