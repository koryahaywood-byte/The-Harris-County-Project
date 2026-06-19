import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "data", "voters.db");

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { last, first, precinct, page = 1 } = body as {
    last?: string; first?: string; precinct?: string; page?: number;
  };

  if (!last?.trim()) {
    return NextResponse.json({ error: "last name required" }, { status: 400 });
  }

  // Check if DB exists — if not, return graceful no_data state
  if (!fs.existsSync(DB_PATH)) {
    return NextResponse.json({ status: "no_data" });
  }

  try {
    // Dynamic import so build doesn't fail when better-sqlite3 isn't installed yet
    const Database = (await import("better-sqlite3" as string)).default;
    const db = new Database(DB_PATH, { readonly: true });

    const LIMIT = 25;
    const OFFSET = (page - 1) * LIMIT;

    const conditions: string[] = ["UPPER(last_name) LIKE UPPER(?)"];
    const params: (string | number)[] = [`${last.trim()}%`];

    if (first?.trim()) {
      conditions.push("UPPER(first_name) LIKE UPPER(?)");
      params.push(`${first.trim()}%`);
    }
    if (precinct?.trim()) {
      conditions.push("precinct_number = ?");
      params.push(precinct.trim().replace(/^0+/, "") || "0");
    }

    const where = conditions.join(" AND ");

    const total = (db.prepare(`SELECT COUNT(*) as n FROM voters WHERE ${where}`).get(...params) as { n: number }).n;

    const voters = db.prepare(
      `SELECT vuid, last_name, first_name, middle_name, dob_year, gender,
              address_street, address_city, address_zip, precinct_number, estimated_race
       FROM voters WHERE ${where}
       ORDER BY last_name, first_name
       LIMIT ? OFFSET ?`
    ).all(...params, LIMIT, OFFSET);

    db.close();

    return NextResponse.json({
      status: "ok",
      total,
      page,
      pages: Math.ceil(total / LIMIT),
      voters,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Cannot find module")) {
      // better-sqlite3 not installed yet
      return NextResponse.json({ status: "no_data" });
    }
    console.error("[voter-search]", err);
    return NextResponse.json({ error: "database error" }, { status: 500 });
  }
}
