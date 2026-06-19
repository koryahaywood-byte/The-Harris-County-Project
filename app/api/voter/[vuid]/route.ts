import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "data", "voters.db");

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ vuid: string }> }
) {
  const { vuid } = await params;

  if (!fs.existsSync(DB_PATH)) {
    return NextResponse.json({ status: "no_data" });
  }

  try {
    const Database = (await import("better-sqlite3" as string)).default;
    const db = new Database(DB_PATH, { readonly: true });

    const voter = db.prepare(
      `SELECT vuid, last_name, first_name, middle_name, dob_year, gender,
              address_street, address_city, address_zip, precinct_number, estimated_race
       FROM voters WHERE vuid = ?`
    ).get(vuid);

    if (!voter) {
      db.close();
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    const history = db.prepare(
      `SELECT election_code, election_label, election_date, voted, method
       FROM voter_history WHERE vuid = ?
       ORDER BY election_date DESC`
    ).all(vuid);

    db.close();

    return NextResponse.json({ status: "ok", voter, history });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Cannot find module")) {
      return NextResponse.json({ status: "no_data" });
    }
    console.error("[voter-detail]", err);
    return NextResponse.json({ error: "database error" }, { status: 500 });
  }
}
