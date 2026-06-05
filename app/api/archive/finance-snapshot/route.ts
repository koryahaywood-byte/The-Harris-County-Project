import { NextResponse } from "next/server";
import { writeFile, readFile, mkdir } from "fs/promises";
import path from "path";

// GET /api/archive/finance-snapshot
// Triggered by Vercel cron on Jan 16, Apr 16, Jul 16, Oct 16 (after filing deadlines)
// Calls the four live finance routes, collects the responses, and archives them.

const BASE = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

type Level = "federal" | "state" | "county" | "houston";

const ROUTES: { path: string; level: Level }[] = [
  { path: "/api/finance/fec",           level: "federal" },
  { path: "/api/finance/tec",           level: "state" },
  { path: "/api/finance/harris-county", level: "county" },
  { path: "/api/finance/houston",       level: "houston" },
];

async function fetchLevel(routePath: string): Promise<unknown[]> {
  try {
    const res = await fetch(`${BASE}${routePath}`, { signal: AbortSignal.timeout(30000) });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json) ? json : json.candidates ?? [];
  } catch {
    return [];
  }
}

export async function GET() {
  const now = new Date();
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const dir = path.join(process.cwd(), "data", "finance-history");
  await mkdir(dir, { recursive: true });

  const results: Record<string, { count: number; status: string }> = {};

  for (const { path: routePath, level } of ROUTES) {
    const filePath = path.join(dir, `${period}-${level}.json`);
    try {
      await readFile(filePath);
      results[level] = { count: 0, status: "exists" };
      continue;
    } catch { /* write it */ }

    const candidates = await fetchLevel(routePath);
    const payload = {
      period,
      level,
      candidates,
      archivedAt: now.toISOString(),
      count: candidates.length,
    };
    await writeFile(filePath, JSON.stringify(payload, null, 2), "utf-8");
    results[level] = { count: candidates.length, status: "written" };
  }

  return NextResponse.json({ period, results, snapshotAt: now.toISOString() });
}
