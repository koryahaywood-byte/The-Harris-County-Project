import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { POLITICIANS } from "@/lib/politicians";

// Dev-only sink for the figure pre-render pipeline (/admin/render-figures).
// Accepts a PNG snapshot of the 3D figure and writes public/renders/<slug>.png.

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "dev only" }, { status: 403 });
  }
  const { slug, png } = await req.json();
  if (!POLITICIANS.some(p => p.slug === slug)) {
    return NextResponse.json({ error: "unknown slug" }, { status: 400 });
  }
  const m = /^data:image\/png;base64,(.+)$/.exec(png ?? "");
  if (!m) return NextResponse.json({ error: "expected png data url" }, { status: 400 });
  const dir = path.join(process.cwd(), "public", "renders");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, `${slug}.png`), Buffer.from(m[1], "base64"));
  return NextResponse.json({ ok: true, slug });
}
