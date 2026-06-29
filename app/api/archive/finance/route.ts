import { NextResponse } from "next/server";
import { writeFile, readFile, mkdir } from "fs/promises";
import path from "path";

// POST /api/archive/finance
// Body: { period: "2026-01", level: "federal"|"state"|"county"|"houston", candidates: CandidateFinance[] }
// Called by Vercel cron after each filing deadline. Never overwrites.

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.period || !body?.level || !body?.candidates) {
    return NextResponse.json({ error: "Missing period, level, or candidates" }, { status: 400 });
  }

  const { period, level, candidates } = body as {
    period: string;
    level: string;
    candidates: unknown[];
  };

  if (!/^\d{4}-\d{2}$/.test(period)) {
    return NextResponse.json({ error: "period must be YYYY-MM" }, { status: 400 });
  }

  const dir = path.join(process.cwd(), "data", "finance-history");
  const filePath = path.join(dir, `${period}-${level}.json`);

  await mkdir(dir, { recursive: true });

  try {
    await readFile(filePath);
    return NextResponse.json({ status: "exists", path: `data/finance-history/${period}-${level}.json` });
  } catch { /* doesn't exist. Write it */ }

  const payload = {
    period,
    level,
    candidates,
    archivedAt: new Date().toISOString(),
    count: candidates.length,
  };

  await writeFile(filePath, JSON.stringify(payload, null, 2), "utf-8");

  return NextResponse.json({
    status: "written",
    path: `data/finance-history/${period}-${level}.json`,
    count: candidates.length,
  });
}

// GET /api/archive/finance?level=houston. List archived periods for a level
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const level = searchParams.get("level");
  const period = searchParams.get("period");
  const dir = path.join(process.cwd(), "data", "finance-history");

  try {
    const { readdir } = await import("fs/promises");
    const files = await readdir(dir).catch(() => [] as string[]);

    const filtered = files
      .filter((f) => f.endsWith(".json") && (!level || f.includes(`-${level}.json`)))
      .map((f) => f.replace(".json", ""))
      .sort()
      .reverse();

    if (period && level) {
      const filePath = path.join(dir, `${period}-${level}.json`);
      const raw = await readFile(filePath, "utf-8").catch(() => null);
      if (!raw) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(JSON.parse(raw));
    }

    return NextResponse.json({ periods: filtered, count: filtered.length });
  } catch {
    return NextResponse.json({ periods: [], count: 0 });
  }
}
