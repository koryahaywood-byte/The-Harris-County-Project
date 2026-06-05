import { NextRequest, NextResponse } from "next/server";

const BSKY_API = "https://bsky.social/xrpc";

interface BskyPost {
  uri: string;
  cid: string;
  author: { handle: string; displayName?: string; avatar?: string };
  record: { text: string; createdAt: string };
  indexedAt: string;
  likeCount?: number;
  repostCount?: number;
}

async function createSession(): Promise<string | null> {
  const id  = process.env.BSKY_IDENTIFIER;
  const pwd = process.env.BSKY_APP_PASSWORD;
  if (!id || !pwd) return null;

  const r = await fetch(`${BSKY_API}/com.atproto.server.createSession`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: id, password: pwd }),
  });
  if (!r.ok) return null;
  const d = await r.json();
  return d.accessJwt ?? null;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q) return NextResponse.json({ posts: [] });

  try {
    const token = await createSession();
    if (!token) {
      return NextResponse.json({ posts: [], note: "BSKY_IDENTIFIER and BSKY_APP_PASSWORD not configured" });
    }

    const url = `${BSKY_API}/app.bsky.feed.searchPosts?q=${encodeURIComponent(`"${q}"`)}&limit=10&sort=latest`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) return NextResponse.json({ posts: [] });

    const data = await r.json();
    const posts: BskyPost[] = data.posts ?? [];

    return NextResponse.json({
      posts: posts.map(p => ({
        id:          p.uri,
        author:      p.author.displayName || p.author.handle,
        handle:      p.author.handle,
        avatar:      p.author.avatar,
        text:        p.record.text,
        date:        p.record.createdAt,
        url:         `https://bsky.app/profile/${p.author.handle}/post/${p.uri.split("/").pop()}`,
        likes:       p.likeCount ?? 0,
        reposts:     p.repostCount ?? 0,
      })),
    }, { headers: { "Cache-Control": "public, s-maxage=900" } });
  } catch {
    return NextResponse.json({ posts: [] });
  }
}
