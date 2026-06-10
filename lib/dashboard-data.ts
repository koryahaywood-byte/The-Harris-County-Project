// War room dashboard data layer.
// Three news tiers sourced from the publications practitioners actually read.
// Called by DashboardWidget (server component).

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

// Fallback landmark images per tier
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

function parseBingItems(xml: string) {
  const items: Array<{ title: string; link: string; source: string; pubDate: string; image: string | null }> = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = itemRe.exec(xml)) !== null) {
    const item = m[1];
    const title = (item.match(/<title>([\s\S]*?)<\/title>/)?.[1]
      ?.replace(/<!\[CDATA\[|\]\]>/g, "")
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/\s[-|]\s[^-|]{3,60}$/, "").trim() ?? "");
    const rawLink = item.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() ?? "";
    const realUrl = rawLink.match(/[?&]url=([^&]+)/)?.[1];
    const link    = realUrl ? decodeURIComponent(realUrl) : rawLink;
    const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() ?? "";
    const source  = item.match(/<News:Source>([\s\S]*?)<\/News:Source>/)?.[1]?.trim() ?? "";
    const image   = item.match(/<News:Image>([\s\S]*?)<\/News:Image>/)?.[1]?.trim() ?? null;
    if (title && link) items.push({ title, link, source, pubDate, image });
  }
  return items;
}

async function fetchTopStory(query: string, todayStr: string) {
  try {
    const res = await fetch(
      `https://www.bing.com/news/search?q=${encodeURIComponent(query)}&format=rss`,
      { next: { revalidate: 1800 }, headers: { "User-Agent": "Mozilla/5.0 (compatible; HarrisCountyProject/1.0)" } }
    );
    if (!res.ok) return null;
    const items = parseBingItems(await res.text());
    if (!items.length) return null;
    const todayItems = items.filter(i => isTodayDate(i.pubDate, todayStr));
    const candidate  = todayItems[0] ?? items[0];
    return { ...candidate, isToday: isTodayDate(candidate.pubDate, todayStr) };
  } catch { return null; }
}

async function fetchBestStory(queries: string[], todayStr: string) {
  const results = await Promise.all(queries.map(q => fetchTopStory(q, todayStr)));
  // Prefer today's story from any source — fall back to most recent only if nothing today
  return results.find(r => r?.isToday) ?? results.find(r => r !== null) ?? null;
}

async function fetchTodayStory(queries: string[], todayStr: string) {
  // Same as fetchBestStory but marks the result so the card can show "No story today"
  return fetchBestStory(queries, todayStr);
}

// ── News source targeting ────────────────────────────────────────────────────
// LOCAL  — Houston Chronicle politics + Houston Public Media + Click2Houston
// STATE  — Texas Tribune + Austin American-Statesman + Texas Monthly + AP Texas
// FEDERAL — NYT Politics + Washington Post + Wall Street Journal + AP Politics

const LOCAL_QUERIES = [
  "site:houstonchronicle.com politics Harris County 2026",
  "Houston Chronicle Harris County politics election",
  "Houston Chronicle Mayor City Council Harris County",
  "Harris County politics Houston government 2026",
  "Houston politics election Lina Hidalgo Whitmire 2026",
];

const STATE_QUERIES = [
  "site:texastribune.org Texas politics 2026",
  "Texas Tribune Texas politics election 2026",
  "Texas Tribune Austin Statesman Texas government",
  "Texas politics Greg Abbott 2026 election",
  "Texas legislature 2026 Texas Monthly AP Texas",
];

const FEDERAL_QUERIES = [
  "site:nytimes.com politics Congress 2026 election",
  "Washington Post Congress Senate election 2026",
  "Wall Street Journal Congress midterm 2026 politics",
  "AP politics Congress Senate 2026 election results",
  "federal politics Congress midterms 2026",
];

// November 2026 Harris County ballot — update as candidates file/withdraw
const NOVEMBER_2026_BALLOT: BallotRace[] = [
  { office: "Harris County Judge",      incumbent: "Lina Hidalgo (D)",    party: "D", competitive: "Toss-up", href: "/politicians" },
  { office: "U.S. House TX-07",         incumbent: "Lizzie Fletcher (D)", party: "D", competitive: "Toss-up", href: "/tools/congress-beat" },
  { office: "U.S. Senate (TX)",         incumbent: "John Cornyn (R)",     party: "R", competitive: "Lean R",  href: "/tools/congress-beat" },
  { office: "TX Governor",              incumbent: "Greg Abbott (R)",     party: "R", competitive: "Lean R",  href: "/tools/state-beat" },
  { office: "HC Commissioner Pct. 2",   incumbent: "Adrian Garcia (D)",   party: "D", competitive: "Lean D", href: "/politicians" },
  { office: "U.S. House TX-22",         incumbent: "Troy Nehls (R)",      party: "R", competitive: "Lean R",  href: "/tools/congress-beat" },
];

export async function getDashboardData(): Promise<DashboardData> {
  const todayStr = new Date().toISOString().slice(0, 10);

  const [localRaw, stateRaw, federalRaw] = await Promise.all([
    fetchBestStory(LOCAL_QUERIES,   todayStr),
    fetchBestStory(STATE_QUERIES,   todayStr),
    fetchBestStory(FEDERAL_QUERIES, todayStr),
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
