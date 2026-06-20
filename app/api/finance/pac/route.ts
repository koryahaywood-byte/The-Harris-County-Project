import { NextResponse } from "next/server";

export const revalidate = 21600; // 6h cache

const FEC_KEY = process.env.FEC_API_KEY ?? "DEMO_KEY";
const CYCLE = 2026;

export interface PACSpend {
  committee: string;        // PAC name
  committeeId?: string;
  candidate?: string;       // candidate name targeted
  candidateId?: string;
  support: "S" | "O";      // support or oppose
  amount: number;
  date: string;
  description?: string;
  office?: string;          // Senate, House, President
  state?: string;
}

export interface PACRollup {
  committee: string;
  committeeId?: string;
  totalFor: number;
  totalAgainst: number;
  targets: { candidate: string; support: "S" | "O"; amount: number }[];
  lastActivity?: string;
}

export interface PACResponse {
  expenditures: PACSpend[];
  rollups: PACRollup[];
  totalExternalSpend: number;
  availableThrough?: string;
  fetchedAt: string;
  source: "live" | "unavailable";
}

async function fetchScheduleE(page = 1): Promise<{ results: Record<string, unknown>[]; pagination?: { count: number } }> {
  const params = new URLSearchParams({
    state: "TX",
    cycle: String(CYCLE),
    api_key: FEC_KEY,
    per_page: "100",
    sort: "-expenditure_amount",
    page: String(page),
    office: "senate,house",
  });
  const url = `https://api.fec.gov/v1/schedules/schedule_e/?${params}`;
  const res = await fetch(url, { next: { revalidate: 3600 * 6 } });
  if (!res.ok) throw new Error(`FEC API ${res.status}`);
  return res.json();
}

export async function GET() {
  const fetchedAt = new Date().toISOString();

  try {
    const data = await fetchScheduleE();
    const raw = data.results ?? [];

    const expenditures: PACSpend[] = raw.map((r) => ({
      committee:   String(r.committee_name ?? ""),
      committeeId: r.committee_id ? String(r.committee_id) : undefined,
      candidate:   r.candidate_name ? String(r.candidate_name) : undefined,
      candidateId: r.candidate_id ? String(r.candidate_id) : undefined,
      support:     (String(r.support_oppose_indicator ?? "S").toUpperCase().startsWith("S") ? "S" : "O") as "S" | "O",
      amount:      Number(r.expenditure_amount ?? 0),
      date:        String(r.expenditure_date ?? ""),
      description: r.expenditure_description ? String(r.expenditure_description) : undefined,
      office:      r.office ? String(r.office) : undefined,
      state:       r.state ? String(r.state) : undefined,
    }));

    // Rollup by committee
    const byCommittee = new Map<string, PACRollup>();
    for (const e of expenditures) {
      const key = e.committee;
      if (!byCommittee.has(key)) {
        byCommittee.set(key, {
          committee:   e.committee,
          committeeId: e.committeeId,
          totalFor:    0,
          totalAgainst: 0,
          targets:     [],
          lastActivity: e.date,
        });
      }
      const roll = byCommittee.get(key)!;
      if (e.support === "S") roll.totalFor += e.amount;
      else roll.totalAgainst += e.amount;
      if (e.candidate) {
        const existing = roll.targets.find(t => t.candidate === e.candidate && t.support === e.support);
        if (existing) existing.amount += e.amount;
        else roll.targets.push({ candidate: e.candidate, support: e.support, amount: e.amount });
      }
      if (e.date > (roll.lastActivity ?? "")) roll.lastActivity = e.date;
    }

    const rollups = [...byCommittee.values()]
      .sort((a, b) => (b.totalFor + b.totalAgainst) - (a.totalFor + a.totalAgainst));

    const total = expenditures.reduce((s, e) => s + e.amount, 0);

    const resp: PACResponse = {
      expenditures,
      rollups,
      totalExternalSpend: total,
      fetchedAt,
      source: "live",
    };
    return NextResponse.json(resp);
  } catch {
    // Return empty but valid structure when FEC unavailable
    const resp: PACResponse = {
      expenditures: [],
      rollups: [],
      totalExternalSpend: 0,
      fetchedAt,
      source: "unavailable",
    };
    return NextResponse.json(resp, { status: 200 });
  }
}
