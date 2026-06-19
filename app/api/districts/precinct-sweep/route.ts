import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";

type FieldClass = "surge" | "hold" | "persuasion" | "strongR" | "unknown";

export interface SweepPrecinct {
  precinct: string;
  classification: FieldClass;
  label: string;
  avgDPct: number | null;
  dPct2020: number | null;
  dPct2022: number | null;
  dPct2024: number | null;
  reg2024: number | null;
  turnout2024: number | null;
  turnoutDelta: number | null;  // 2024 - 2020 actual votes
  ssvr: number | null;          // Spanish-surname voter registration
}

function classifyAvg(avg: number): { cls: FieldClass; label: string } {
  if (avg >= 65) return { cls: "surge",      label: "GOTV Surge Target" };
  if (avg >= 55) return { cls: "hold",       label: "Hold & Turn Out" };
  if (avg >= 44) return { cls: "persuasion", label: "Battleground" };
  return                { cls: "strongR",    label: "Strong Republican" };
}

export async function GET() {
  const filePath = join(process.cwd(), "public", "data", "precinct-history.json");

  let raw: string;
  try {
    raw = readFileSync(filePath, "utf-8");
  } catch {
    return NextResponse.json({ error: "precinct-history.json not found" }, { status: 500 });
  }

  const data = JSON.parse(raw);
  const cycles = data.cycles ?? {};
  const demographics: Record<string, { vap: number; anglo: number; black: number; hisp: number; asian: number }> = data.demographics ?? {};

  // Helper: find D and R candidate indices in a race
  function dRIdx(race: { candidates: { party: string }[] }) {
    let d = -1, r = -1;
    for (let i = 0; i < race.candidates.length; i++) {
      if (race.candidates[i].party === "D") d = i;
      if (race.candidates[i].party === "R") r = i;
    }
    return { d, r };
  }

  // Build per-cycle D% maps
  function buildDPct(cycleKey: string): Record<string, number> {
    const cycle = cycles[cycleKey];
    if (!cycle?.races) return {};
    const race = cycle.races["president"] ?? cycle.races["governor"];
    if (!race) return {};
    const { d, r } = dRIdx(race);
    if (d < 0 || r < 0) return {};
    const out: Record<string, number> = {};
    for (const [pct, vtotals] of Object.entries(race.votes as Record<string, number[]>)) {
      const total = vtotals.reduce((a, b) => a + b, 0);
      if (total > 0) out[pct] = Math.round((vtotals[d] / total) * 1000) / 10;
    }
    return out;
  }

  const dp2020 = buildDPct("2020G");
  const dp2022 = buildDPct("2022G");
  const dp2024 = buildDPct("2024G");

  const voter2024: Record<string, { reg: number; turnout: number; ssvr: number }> = cycles["2024G"]?.voter ?? {};
  const voter2020: Record<string, { reg: number; turnout: number; ssvr: number }> = cycles["2020G"]?.voter ?? {};

  // Union of all precincts
  const allPrecincts = new Set([
    ...Object.keys(dp2020),
    ...Object.keys(dp2022),
    ...Object.keys(dp2024),
    ...Object.keys(voter2024),
  ]);

  const results: SweepPrecinct[] = [];

  for (const pct of allPrecincts) {
    const vals = [dp2020[pct], dp2022[pct], dp2024[pct]].filter((v): v is number => v !== undefined);
    const avg = vals.length >= 2 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;

    const vr24 = voter2024[pct];
    const vr20 = voter2020[pct];

    let classification: FieldClass = "unknown";
    let label = "Insufficient data";
    if (avg !== null) {
      const c = classifyAvg(avg);
      classification = c.cls;
      label = c.label;
    }

    results.push({
      precinct: pct,
      classification,
      label,
      avgDPct: avg !== null ? Math.round(avg * 10) / 10 : null,
      dPct2020: dp2020[pct] ?? null,
      dPct2022: dp2022[pct] ?? null,
      dPct2024: dp2024[pct] ?? null,
      reg2024: vr24?.reg ?? null,
      turnout2024: vr24?.turnout ?? null,
      turnoutDelta: vr24 && vr20 ? vr24.turnout - vr20.turnout : null,
      ssvr: vr24?.ssvr ?? null,
    });
  }

  // Sort: surge first, then by avgDPct desc within each class
  const ORDER: Record<FieldClass, number> = { surge: 0, hold: 1, persuasion: 2, strongR: 3, unknown: 4 };
  results.sort((a, b) => {
    const co = ORDER[a.classification] - ORDER[b.classification];
    if (co !== 0) return co;
    return (b.avgDPct ?? 0) - (a.avgDPct ?? 0);
  });

  return NextResponse.json(
    { precincts: results, builtAt: data.builtAt ?? null, total: results.length },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
  );
}
