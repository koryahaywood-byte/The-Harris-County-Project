import { NextResponse } from "next/server";
import { EVENTS } from "@/lib/civic-events";

export interface NewsStory {
  title: string;
  link: string;
  source: string;
  pubDate: string;
  image: string | null;
}

export interface DashboardData {
  federal: NewsStory | null;
  state: NewsStory | null;
  local: NewsStory | null;
  todayEvents: { title: string; category: string; description: string }[];
  upcomingEvent: { title: string; date: string; daysAway: number; category: string } | null;
  nextElection: { title: string; date: string; daysAway: number } | null;
}

function parseImage(description: string): string | null {
  // Description may use HTML entities (&lt;img&gt;) or raw CDATA (<img>)
  const decoded = description
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"');
  const match = decoded.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match?.[1] ?? null;
}

function parseItem(xml: string): NewsStory | null {
  const itemMatch = xml.match(/<item>([\s\S]*?)<\/item>/);
  if (!itemMatch) return null;
  const item = itemMatch[1];

  const title = item.match(/<title>([\s\S]*?)<\/title>/)?.[1]
    ?.replace(/<!\[CDATA\[|\]\]>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim() ?? "";
  const link = item.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() ?? "";
  const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() ?? "";
  const source = item.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1]
    ?.replace(/<!\[CDATA\[|\]\]>/g, "").trim() ?? "";
  const description = item.match(/<description>([\s\S]*?)<\/description>/)?.[1]
    ?.replace(/<!\[CDATA\[|\]\]>/g, "") ?? "";
  const image = parseImage(description);

  if (!title || !link) return null;
  return { title, link, source, pubDate, image };
}

async function fetchTopStory(query: string): Promise<NewsStory | null> {
  try {
    const q = encodeURIComponent(query);
    const url = `https://news.google.com/rss/search?q=${q}&hl=en-US&gl=US&ceid=US:en`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    const xml = await res.text();
    return parseItem(xml);
  } catch {
    return null;
  }
}

export async function GET() {
  const today = new Date().toISOString().split("T")[0];

  const [federal, state, local] = await Promise.all([
    fetchTopStory("US federal government politics Congress White House"),
    fetchTopStory("Texas politics government Austin legislature 2026"),
    fetchTopStory("Houston Harris County politics local government 2026"),
  ]);

  // Today's events (date matches today OR spans today via endDate)
  const todayEvents = EVENTS.filter((e) => {
    if (e.endDate) return e.date <= today && e.endDate >= today;
    return e.date === today;
  }).map((e) => ({ title: e.title, category: e.category, description: e.description }));

  // Next upcoming event (future, not past)
  const future = EVENTS
    .filter((e) => (e.endDate ? e.endDate : e.date) >= today && e.date > today)
    .sort((a, b) => a.date.localeCompare(b.date));
  const next = future[0] ?? null;
  const upcomingEvent = next ? {
    title: next.title,
    date: next.date,
    daysAway: Math.ceil((new Date(next.date).getTime() - new Date(today).getTime()) / 86400000),
    category: next.category,
  } : null;

  // Next election (high importance Elections category, in the future)
  const nextElectionEvent = EVENTS
    .filter((e) => e.category === "Elections" && e.importance === "high" && e.date > today)
    .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null;
  const nextElection = nextElectionEvent ? {
    title: nextElectionEvent.title,
    date: nextElectionEvent.date,
    daysAway: Math.ceil((new Date(nextElectionEvent.date).getTime() - new Date(today).getTime()) / 86400000),
  } : null;

  const data: DashboardData = { federal, state, local, todayEvents, upcomingEvent, nextElection };
  return NextResponse.json(data, {
    headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400" },
  });
}
