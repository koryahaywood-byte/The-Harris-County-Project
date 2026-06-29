import { NextResponse } from "next/server";
import { writeFile, readFile, mkdir } from "fs/promises";
import path from "path";

// POST /api/archive/council-meeting
// Body: { date: "YYYY-MM-DD", data: CouncilMeetingData }
// This is called by the city-hall API after a successful fetch (or by Vercel cron).
// It writes to data/council-meetings/YYYY-MM-DD.json: never overwrites.

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.date || !body?.data) {
    return NextResponse.json({ error: "Missing date or data" }, { status: 400 });
  }

  const { date, data } = body as { date: string; data: unknown };

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
  }

  const dir = path.join(process.cwd(), "data", "council-meetings");
  const filePath = path.join(dir, `${date}.json`);

  await mkdir(dir, { recursive: true });

  // Never overwrite: archive-first ethos
  try {
    await readFile(filePath);
    return NextResponse.json({ status: "exists", path: `data/council-meetings/${date}.json` });
  } catch {
    // File doesn't exist: write it
  }

  const payload = {
    ...((data as Record<string, unknown>)),
    archivedAt: new Date().toISOString(),
  };

  await writeFile(filePath, JSON.stringify(payload, null, 2), "utf-8");

  return NextResponse.json({ status: "written", path: `data/council-meetings/${date}.json` });
}

// GET /api/archive/council-meeting?list=true. List all archived meetings
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dir = path.join(process.cwd(), "data", "council-meetings");

  try {
    const { readdir } = await import("fs/promises");
    const files = await readdir(dir).catch(() => [] as string[]);
    const meetings = files
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(".json", ""))
      .sort()
      .reverse();

    if (searchParams.get("date")) {
      const date = searchParams.get("date")!;
      const filePath = path.join(dir, `${date}.json`);
      const raw = await readFile(filePath, "utf-8").catch(() => null);
      if (!raw) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(JSON.parse(raw));
    }

    return NextResponse.json({ meetings, count: meetings.length });
  } catch {
    return NextResponse.json({ meetings: [], count: 0 });
  }
}
