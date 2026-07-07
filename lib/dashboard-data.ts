// War room dashboard data layer.
// Primary: Google News RSS (aggregates paywalled publications, always fresh)
// Fallback: Bing News RSS
// Stories are always the most recent. Never show "no story" for active publications.

import { EVENTS } from "@/lib/civic-events";
import { MATCHUPS_2026, type RaceLean } from "@/lib/matchups-2026";

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
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
      .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(Number(c)))
      .replace(/\s[-|]\s[^-|]{3,60}$/, "")
      .trim();

    // Link. Google News wraps in <a>, Bing uses redirect URL
    const deent = (u: string) => u.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    const rawLink = deent(item.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim()
      ?? item.match(/<guid[^>]*>([\s\S]*?)<\/guid>/)?.[1]?.trim() ?? "");
    const bingUrl  = rawLink.match(/[?&]url=([^&]+)/)?.[1];
    // Google News base64 blobs no longer carry the URL; the item description
    // links straight to the publisher — use it as the real link when present.
    const descRaw = deent(item.match(/<description>([\s\S]*?)<\/description>/)?.[1] ?? "");
    const descHref = descRaw.match(/href=["']?(https?:\/\/(?!news\.google)[^"'\s>]+)/)?.[1];
    const link = bingUrl ? decodeURIComponent(bingUrl)
      : (rawLink.includes("news.google.com") && descHref) ? deent(descHref)
      : rawLink;

    // Pub date
    const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() ?? "";

    // Source. Google News puts it in <source>, Bing in <News:Source>
    const source = (
      item.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, "").trim()
      ?? item.match(/<News:Source>([\s\S]*?)<\/News:Source>/)?.[1]?.trim()
      ?? ""
    ).replace(/\s+on MSN$/i, "").replace(/^MSN$/i, "MSN News");

    // Image: Bing <News:Image>, or og:image in enclosure, or media:content
    let image =
      item.match(/<News:Image>([\s\S]*?)<\/News:Image>/)?.[1]?.trim()
      ?? item.match(/<media:content[^>]+url="([^"]+)"/)?.[1]
      ?? item.match(/<enclosure[^>]+url="([^"]+)"/)?.[1]
      ?? null;
    if (image) {
      image = deent(image);
      // Bing serves tiny thumbs by default; ask for card size
      if (image.includes("bing.com/th?id=")) image += "&w=640&h=360&qlt=90&c=7";
    }

    // Aggregator feeds occasionally emit junk items whose "title" is just a
    // hostname (e.g. "- preview-prod.w.houstonchronicle.com") — never card-worthy
    const junkTitle = /^[\s\-–—·|]*(?:[a-z0-9-]+\.)+[a-z]{2,}[\s\-–—·|]*$/i.test(title);
    if (title && link && !junkTitle) items.push({ title, link, source, pubDate, image });
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

    // Prefer today's story, fall back to the newest by pubDate (feeds aren't
    // always newest-first — a stale section feed can lead with an old item)
    const byNewest = [...items].sort((a, b) =>
      (new Date(b.pubDate).getTime() || 0) - (new Date(a.pubDate).getTime() || 0));
    const todayItems = byNewest.filter(i => isTodayDate(i.pubDate, todayStr));
    const candidate  = todayItems[0] ?? byNewest[0];
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
  // Try all feeds in parallel; return candidates BEST-FIRST so the picker can
  // fall to a runner-up when another tier already claimed the top story.
  const results = await Promise.all(feeds.map(f => fetchFromFeed(f.url, todayStr, f.source)));
  // Google News links are JS interstitials we can't resolve server-side, so a
  // direct-feed story (Tribune/HPM/NPR RSS, Bing) beats a GN one at equal
  // freshness: real link for readers, scrapeable og:image for the card.
  const direct = (r: { link: string }) => !r.link.includes("news.google.com");
  const ageDays = (r: { pubDate: string }) => {
    const t = new Date(r.pubDate).getTime();
    return Number.isFinite(t) ? (Date.now() - t) / 864e5 : Infinity;
  };
  // Never let an old direct story beat a fresh GN one: today+direct → today →
  // direct ≤3 days → anything ≤3 days → newest overall. Ties break by age.
  const band = (r: NonNullable<(typeof results)[number]>) =>
    r.isToday && direct(r) ? 0
    : r.isToday ? 1
    : direct(r) && ageDays(r) <= 3 ? 2
    : ageDays(r) <= 3 ? 3
    : 4;
  return results
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => band(a) - band(b) || ageDays(a) - ageDays(b));
}

// Same story often lands in two tiers (e.g. Houston Public Media syndicates
// Texas Tribune statehouse coverage via The Texas Newsroom). Claim order is
// state → federal → local: a cross-tier duplicate is almost always a statewide
// story echoed by a local outlet, so the state card keeps it and the local
// card falls to its runner-up.
function pickDistinct(ranked: Awaited<ReturnType<typeof fetchTier>>, taken: Set<string>) {
  const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
  const pick = ranked.find(r => !taken.has(norm(r.title))) ?? ranked[0] ?? null;
  if (pick) taken.add(norm(pick.title));
  return pick;
}

// ── Feed definitions ──────────────────────────────────────────────────────────

// LOCAL. City hall, Harris County, mayor, commissioners — exclude state/national
// so we don't bleed tiers. Hearst killed all Chronicle RSS section feeds (404),
// so Houston Public Media is the direct-feed anchor here.
const LOCAL_FEEDS = [
  { url: "https://www.houstonpublicmedia.org/articles/news/politics/feed/", source: "Houston Public Media" },
  // Google News targeting Chronicle Houston/Harris County stories specifically
  { url: `${GN}${encodeURIComponent('site:houstonchronicle.com "houston" OR "harris county" politics -texas -senate -governor')}`, source: "Houston Chronicle" },
  { url: `${GN}${encodeURIComponent("Houston mayor city council Harris County commissioner Whitmire politics")}`, source: "Houston Chronicle" },
  { url: "https://www.bing.com/news/search?q=site:houstonchronicle.com+Houston+Harris+County+local+politics&format=rss", source: "Houston Chronicle" },
  { url: "https://www.bing.com/news/search?q=Houston+city+hall+mayor+Whitmire+Harris+County+commissioner&format=rss" },
];

// STATE. Tribune primary. NOTE: texastribune.org/feeds/ is an HTML index page,
// not RSS — the real feed lives at feeds.texastribune.org. Chronicle Texas
// Politics RSS is dead (Hearst removed all section feeds).
const STATE_FEEDS = [
  { url: "https://feeds.texastribune.org/feeds/main/", source: "Texas Tribune" },
  { url: `${GN}${encodeURIComponent("Texas Tribune Texas legislature Austin politics 2026")}`, source: "Texas Tribune" },
  { url: `${GN}${encodeURIComponent('site:houstonchronicle.com Texas politics Austin legislature governor')}`, source: "Houston Chronicle" },
  { url: "https://www.bing.com/news/search?q=Texas+Tribune+Texas+politics+Austin+legislature&format=rss" },
];

// FEDERAL. NPR/Hill direct feeds (real links + og:images) + WaPo/NYT via GN
const FEDERAL_FEEDS = [
  { url: "https://feeds.npr.org/1014/rss.xml", source: "NPR" },
  { url: "https://thehill.com/homenews/feed/", source: "The Hill" },
  { url: `${GN}${encodeURIComponent("Washington Post Congress White House politics")}`, source: "Washington Post" },
  { url: `${GN}${encodeURIComponent("New York Times Congress Senate federal politics 2026")}`, source: "New York Times" },
  { url: `${GN}${encodeURIComponent('site:houstonchronicle.com Congress federal Washington politics')}`, source: "Houston Chronicle" },
  { url: "https://www.bing.com/news/search?q=Congress+Senate+White+House+federal+politics+2026&format=rss" },
];

// November 2026 marquee races, derived from lib/matchups-2026.ts — the single
// ratings source. Never hand-enter a lean here; edit the matchup instead.
const MARQUEE_RACES: { key: string; office: string }[] = [
  { key: "HC-Countywide", office: "Harris County Judge" },
  { key: "US-Senate",     office: "U.S. Senate (TX)" },
  { key: "CD-7",          office: "U.S. House TX-07" },
  { key: "CD-9",          office: "U.S. House TX-09" },
  { key: "CD-38",         office: "U.S. House TX-38" },
  { key: "TX-Governor",   office: "TX Governor" },
];

const LEAN_TO_COMPETITIVE: Record<RaceLean, BallotRace["competitive"]> = {
  "safe-d": "Safe D", "likely-d": "Lean D", "lean-d": "Lean D",
  "toss-up": "Toss-up",
  "lean-r": "Lean R", "likely-r": "Lean R", "safe-r": "Safe R",
  "uncontested-d": "Safe D", "uncontested-r": "Safe R",
};

const NOVEMBER_2026_BALLOT: BallotRace[] = MARQUEE_RACES.flatMap(({ key, office }) => {
  const m = MATCHUPS_2026[key];
  if (!m) return [];
  const d = m.sides.find(s => s.party === "D");
  const r = m.sides.find(s => s.party === "R");
  const last = (n?: string) => n ? n.split(" ").slice(-1)[0] : "TBD";
  const open = m.sides.length > 0 && !m.sides.some(s => s.incumbent);
  const holder = m.sides.find(s => s.incumbent);
  return [{
    office,
    incumbent: `${last(d?.name)} (D) vs ${last(r?.name)} (R)${open ? ". Open" : ""}`,
    party: (holder?.party ?? (m.lean?.endsWith("-d") ? "D" : m.lean?.endsWith("-r") ? "R" : "?")) as BallotRace["party"],
    competitive: LEAN_TO_COMPETITIVE[m.lean ?? "toss-up"],
    href: "/tools/ballot-2026",
  }];
});

export async function getDashboardData(): Promise<DashboardData> {
  const todayStr = new Date().toISOString().slice(0, 10);

  const [localRanked, stateRanked, federalRanked] = await Promise.all([
    fetchTier(LOCAL_FEEDS,   todayStr),
    fetchTier(STATE_FEEDS,   todayStr),
    fetchTier(FEDERAL_FEEDS, todayStr),
  ]);

  // Cross-tier dedup: state claims first, then federal, then local (see
  // pickDistinct for why), so the same headline never shows on two cards.
  const taken = new Set<string>();
  const stateRaw   = pickDistinct(stateRanked,   taken);
  const federalRaw = pickDistinct(federalRanked, taken);
  const localRaw   = pickDistinct(localRanked,   taken);

  // Scrape og:image from actual article pages in parallel.
  // If the RSS already has an image, use it directly (skip scrape).
  const [localImg, stateImg, federalImg] = await Promise.all([
    localRaw   ? scrapeOgImage(localRaw.link).then(og => og ?? localRaw.image)     : Promise.resolve(null),
    stateRaw   ? scrapeOgImage(stateRaw.link).then(og => og ?? stateRaw.image)     : Promise.resolve(null),
    federalRaw ? scrapeOgImage(federalRaw.link).then(og => og ?? federalRaw.image) : Promise.resolve(null),
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
