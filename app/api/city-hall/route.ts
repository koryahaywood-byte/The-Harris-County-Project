import { NextResponse } from "next/server";
import { writeFile, readFile, mkdir } from "fs/promises";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";

async function archiveMeeting(date: string, data: CouncilMeetingData) {
  const dir = path.join(process.cwd(), "data", "council-meetings");
  const filePath = path.join(dir, `${date}.json`);
  await mkdir(dir, { recursive: true });
  try { await readFile(filePath); return; } catch { /* doesn't exist — write it */ }
  await writeFile(filePath, JSON.stringify({ ...data, archivedAt: new Date().toISOString() }, null, 2), "utf-8");
}

const EMILY_FEED = "https://emilytakesnotes.com/feed/";
const GOOGLE_NEWS = (q: string) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(q)}+Houston&hl=en-US&gl=US&ceid=US:en`;

export interface AgendaItem {
  id: string;
  title: string;
  summary: string;
  politicians: string[];
  newsHits: { title: string; url: string; source: string; date: string }[];
  significance: "high" | "medium" | "low";
  category: string;
}

export interface CouncilMeetingData {
  date: string;
  meetingTitle: string;
  emilyHeadline: string;
  emilyUrl: string;
  emilyExcerpt: string;
  items: AgendaItem[];
  fetchedAt: string;
  cached: boolean;
}

function parseRssItems(xml: string): { title: string; link: string; pubDate: string; description: string }[] {
  const items: { title: string; link: string; pubDate: string; description: string }[] = [];
  const itemRe = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(xml)) !== null) {
    const block = m[1];
    const title = (block.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/) || [])[1]?.trim() ?? "";
    const link  = (block.match(/<link[^>]*>([\s\S]*?)<\/link>/)  || (block.match(/<link[^>]*\/>/) && block.match(/https?:\/\/[^\s<"]+/))) ?
                  ((block.match(/<link[^>]*>([\s\S]*?)<\/link>/) || [])[1]?.trim() ?? "") : "";
    const pubDate = (block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/) || [])[1]?.trim() ?? "";
    const description = (block.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/) || [])[1]?.trim() ?? "";
    if (title) items.push({ title, link, pubDate, description });
  }
  return items;
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchFullPost(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; HarrisCountyProject/1.0)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return "";
    const html = await res.text();
    // Extract the main post content div
    const contentMatch = html.match(/<div[^>]*class="[^"]*entry-content[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<div/i)
      || html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    const raw = contentMatch ? contentMatch[1] : html;
    return stripHtml(raw).slice(0, 8000);
  } catch {
    return "";
  }
}

async function fetchGoogleNewsForTerm(term: string): Promise<{ title: string; url: string; source: string; date: string }[]> {
  try {
    const res = await fetch(GOOGLE_NEWS(term), {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const items = parseRssItems(xml).slice(0, 3);
    return items.map((i) => ({
      title: i.title,
      url: i.link,
      source: (i.description.match(/<source[^>]*>(.*?)<\/source>/i) || [])[1] ?? "",
      date: i.pubDate,
    }));
  } catch {
    return [];
  }
}

async function generateTimeline(postContent: string, postTitle: string): Promise<AgendaItem[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Fallback: parse paragraphs into items
    const lines = postContent.split("\n").filter((l) => l.trim().length > 40).slice(0, 6);
    return lines.map((line, i) => ({
      id: `item-${i}`,
      title: line.slice(0, 80),
      summary: line,
      politicians: [],
      newsHits: [],
      significance: "medium" as const,
      category: "Council Business",
    }));
  }

  const client = new Anthropic({ apiKey });

  const prompt = `You are analyzing a blog post from "Emily Takes Notes" — a civic journalist who covers Houston City Council meetings.

Post title: "${postTitle}"

Post content:
${postContent}

Extract the key agenda items discussed. For each item, identify:
- A clear, short title (under 10 words)
- A 2-3 sentence plain-English summary of what happened and why it matters
- Any Houston politicians named (first and last name)
- The category (e.g., "Budget", "Development", "Public Safety", "Transportation", "Housing", "Environment", "Personnel", "Other")
- Significance level: "high" (major policy, big money, controversy), "medium" (routine but notable), "low" (procedural/minor)

Respond with a JSON array of objects with these exact fields:
{
  "id": "item-N",
  "title": string,
  "summary": string,
  "politicians": string[],
  "significance": "high"|"medium"|"low",
  "category": string
}

Return ONLY the JSON array, no markdown, no other text. Extract 4-8 items.`;

  try {
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });
    const text = (msg.content[0] as { type: string; text: string }).text;
    const parsed = JSON.parse(text);
    return parsed as AgendaItem[];
  } catch {
    return [];
  }
}

// In-memory cache (resets on cold start; good enough for rate limiting)
let cache: { data: CouncilMeetingData; ts: number } | null = null;
const CACHE_TTL = 1000 * 60 * 60 * 4; // 4 hours

export async function GET() {
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return NextResponse.json({ ...cache.data, cached: true });
  }

  try {
    // 1. Fetch Emily's RSS feed
    const feedRes = await fetch(EMILY_FEED, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; HarrisCountyProject/1.0)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!feedRes.ok) throw new Error("Feed fetch failed");
    const feedXml = await feedRes.text();
    const feedItems = parseRssItems(feedXml);
    if (!feedItems.length) throw new Error("No feed items");

    // Get latest council-meeting post (usually first)
    const latest = feedItems[0];
    const postDate = latest.pubDate
      ? new Date(latest.pubDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];

    const excerpt = stripHtml(latest.description).slice(0, 400);

    // 2. Fetch full post
    const fullContent = await fetchFullPost(latest.link);
    const content = fullContent || excerpt;

    // 3. Generate AI timeline
    const rawItems = await generateTimeline(content, latest.title);

    // 4. Fetch Google News for each significant item (limit to top 4)
    const topItems = rawItems.slice(0, 4);
    const itemsWithNews = await Promise.all(
      rawItems.map(async (item, i) => {
        if (i >= topItems.length) return { ...item, newsHits: [] };
        const hits = await fetchGoogleNewsForTerm(`Houston City Council ${item.title}`);
        return { ...item, newsHits: hits };
      })
    );

    const data: CouncilMeetingData = {
      date: postDate,
      meetingTitle: latest.title,
      emilyHeadline: latest.title,
      emilyUrl: latest.link,
      emilyExcerpt: excerpt,
      items: itemsWithNews,
      fetchedAt: new Date().toISOString(),
      cached: false,
    };

    cache = { data, ts: Date.now() };

    // Archive to data/council-meetings/YYYY-MM-DD.json (fire-and-forget, never overwrites)
    archiveMeeting(postDate, data).catch(() => {});

    return NextResponse.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
