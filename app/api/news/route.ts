import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name") ?? "";
  if (!name) return NextResponse.json({ articles: [] });

  const q = encodeURIComponent(`"${name}" Harris County Texas`);
  const url = `https://news.google.com/rss/search?q=${q}&hl=en-US&gl=US&ceid=US:en`;

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    const xml = await res.text();

    const articles: { title: string; link: string; pubDate: string; source: string }[] = [];
    const matches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);

    for (const match of matches) {
      const item = match[1];
      const title = item.match(/<title>([\s\S]*?)<\/title>/)?.[1]
        ?.replace(/<!\[CDATA\[|\]\]>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
      const link = item.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim()
        ?? item.match(/<link\s*\/>([\s\S]*?)<\/link>/)?.[1]?.trim();
      const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() ?? "";
      const source = item.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1]
        ?.replace(/<!\[CDATA\[|\]\]>/g, "").trim() ?? "";

      if (title && link) {
        articles.push({ title, link, pubDate, source });
      }
      if (articles.length >= 8) break;
    }

    return NextResponse.json({ articles });
  } catch {
    return NextResponse.json({ articles: [] });
  }
}
