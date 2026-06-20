import { NextResponse } from "next/server";
import { readdir, readFile } from "fs/promises";
import path from "path";

// GET /api/finance/history?name=Rodney+Ellis
// Returns all historical finance snapshots for a given politician, sorted ascending by period.

export const revalidate = 3600;

interface HistoryPoint {
  period: string;
  cash: number;
  raised: number;
  spent: number;
  loans: number;
  asOf: string;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name")?.trim();

  if (!name) {
    return NextResponse.json({ error: "name param required" }, { status: 400 });
  }

  const dir = path.join(process.cwd(), "data", "finance-history");

  let files: string[];
  try {
    const all = await readdir(dir);
    files = all.filter(f => /^\d{4}-\d{2}\.json$/.test(f)).sort();
  } catch {
    return NextResponse.json({ name, history: [] });
  }

  const history: HistoryPoint[] = [];

  for (const file of files) {
    try {
      const raw = await readFile(path.join(dir, file), "utf-8");
      const snapshot = JSON.parse(raw);
      const match = (snapshot.candidates ?? []).find(
        (c: { name: string }) => c.name.toLowerCase() === name.toLowerCase()
      );
      if (match) {
        history.push({
          period: snapshot.period ?? file.replace(".json", ""),
          cash:   match.cash   ?? 0,
          raised: match.raised ?? 0,
          spent:  match.spent  ?? 0,
          loans:  match.loans  ?? 0,
          asOf:   match.asOf   ?? "unknown",
        });
      }
    } catch {
      // skip unreadable snapshot
    }
  }

  return NextResponse.json({ name, history });
}
