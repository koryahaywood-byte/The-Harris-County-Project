import { NextRequest, NextResponse } from "next/server";
import { POLITICIANS } from "@/lib/politicians";

// Same-origin proxy for politician headshots so Three.js can texture-map them
// onto the 3D figure. Most photo hosts send no CORS headers, which makes
// TextureLoader fail silently and the figure renders a blank toon head.
// Strictly whitelisted to URLs present in lib/politicians.ts — not an open proxy.

const ALLOWED = new Set(POLITICIANS.map(p => p.photo).filter(Boolean) as string[]);

export async function GET(req: NextRequest) {
  const u = req.nextUrl.searchParams.get("u") ?? "";
  if (!ALLOWED.has(u)) {
    return NextResponse.json({ error: "not a known headshot" }, { status: 403 });
  }
  try {
    const res = await fetch(u, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; HarrisCountyProject/1.0)" },
      signal: AbortSignal.timeout(12_000),
      next: { revalidate: 60 * 60 * 24 },
    });
    if (!res.ok) return NextResponse.json({ error: `upstream ${res.status}` }, { status: 502 });
    const type = res.headers.get("content-type") ?? "image/jpeg";
    if (!type.startsWith("image/")) return NextResponse.json({ error: "not an image" }, { status: 502 });
    return new NextResponse(res.body, {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return NextResponse.json({ error: "fetch failed" }, { status: 502 });
  }
}
