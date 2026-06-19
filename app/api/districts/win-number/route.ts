import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";

type CrosswalkEntry = { hd?: string; sd?: string; cd?: string; jp?: string; council?: string; pct?: string };

function parseDistrict(district: string): { field: keyof CrosswalkEntry | "all"; value: string } | null {
  if (district === "HC-Countywide" || district === "US-Senate") return { field: "all", value: "all" };
  const m = district.match(/^(CD|SD|HD|PCT)-(\d+)$/);
  if (m) {
    const map: Record<string, keyof CrosswalkEntry> = { CD: "cd", SD: "sd", HD: "hd", PCT: "pct" };
    return { field: map[m[1]], value: m[2] };
  }
  const jpM = district.match(/^HC-JP(\d+)$/);
  if (jpM) return { field: "jp", value: jpM[1] };
  return null;
}

export interface WinNumberResult {
  district: string;
  precinctCount: number;
  reg2022: number;
  reg2024: number;
  turnout2022: number;
  turnout2024: number;
  dVotes2022: number;
  dPct2022: number | null;
  estimatedTurnout2026: number;
  targetDVotes: number;
  gap: number;
  status: "ahead" | "behind" | "toss-up";
  primary2026DemBallots: number;
  primary2026RepBallots: number;
  primary2026DemEdge: number;
}

export async function GET(req: NextRequest) {
  const district = req.nextUrl.searchParams.get("district") ?? "";
  const parsed = parseDistrict(district);
  if (!parsed) {
    return NextResponse.json({ error: `Invalid district key: ${district}` }, { status: 400 });
  }

  const histPath = join(process.cwd(), "public", "data", "precinct-history.json");
  const cwPath   = join(process.cwd(), "lib", "precinct-crosswalk.json");
  const t26Path  = join(process.cwd(), "public", "data", "precinct-turnout-2026.json");

  let hist: Record<string, unknown>, cwRaw: Record<string, unknown>;
  try {
    hist  = JSON.parse(readFileSync(histPath, "utf-8"));
    cwRaw = JSON.parse(readFileSync(cwPath,   "utf-8"));
  } catch (e) {
    return NextResponse.json({ error: "Failed to load data files" }, { status: 500 });
  }

  let primary2026: Record<string, { dem: number; rep: number }> = {};
  try {
    primary2026 = JSON.parse(readFileSync(t26Path, "utf-8")).precincts ?? {};
  } catch { /* optional */ }

  const crosswalk: Record<string, CrosswalkEntry> = (cwRaw as { precincts?: Record<string, CrosswalkEntry> }).precincts ?? (cwRaw as Record<string, CrosswalkEntry>);
  const cycles = (hist as { cycles?: Record<string, unknown> }).cycles ?? {};

  const voter2022: Record<string, { reg: number; turnout: number }> =
    (cycles["2022G"] as { voter?: Record<string, { reg: number; turnout: number }> })?.voter ?? {};
  const voter2024: Record<string, { reg: number; turnout: number }> =
    (cycles["2024G"] as { voter?: Record<string, { reg: number; turnout: number }> })?.voter ?? {};

  // Build 2022 D% from governor race
  function buildDPct2022(): Record<string, number> {
    const cycle = cycles["2022G"] as { races?: Record<string, { candidates: { party: string }[]; votes: Record<string, number[]> }> } | undefined;
    const race = cycle?.races?.["governor"];
    if (!race) return {};
    let d = -1, r = -1;
    for (let i = 0; i < race.candidates.length; i++) {
      if (race.candidates[i].party === "D") d = i;
      if (race.candidates[i].party === "R") r = i;
    }
    if (d < 0 || r < 0) return {};
    const out: Record<string, number> = {};
    for (const [pct, vtotals] of Object.entries(race.votes)) {
      const total = vtotals.reduce((a, b) => a + b, 0);
      if (total > 0) out[pct] = vtotals[d] / total;
    }
    return out;
  }

  const dp2022 = buildDPct2022();

  // Filter precincts
  const precincts: string[] = parsed.field === "all"
    ? Object.keys(crosswalk)
    : Object.entries(crosswalk)
        .filter(([, v]) => v[parsed.field as keyof CrosswalkEntry] === parsed.value)
        .map(([pct]) => pct);

  if (precincts.length === 0) {
    return NextResponse.json({ error: `No precincts found for ${district}` }, { status: 404 });
  }

  let totalReg2022 = 0, totalReg2024 = 0;
  let totalTurnout2022 = 0, totalTurnout2024 = 0;
  let totalDVotes2022 = 0;
  let totalPrimDem = 0, totalPrimRep = 0;

  for (const pct of precincts) {
    const v22 = voter2022[pct];
    const v24 = voter2024[pct];
    if (v22) {
      totalReg2022     += v22.reg;
      totalTurnout2022 += v22.turnout;
      const dp = dp2022[pct];
      if (dp !== undefined) totalDVotes2022 += dp * v22.turnout;
    }
    if (v24) {
      totalReg2024     += v24.reg;
      totalTurnout2024 += v24.turnout;
    }
    const p26 = primary2026[pct];
    if (p26) {
      totalPrimDem += p26.dem;
      totalPrimRep += p26.rep;
    }
  }

  // Growth-adjusted 2026 turnout estimate (use 2022 off-year as base, scale by reg growth)
  const regGrowthFactor = totalReg2022 > 0 ? totalReg2024 / totalReg2022 : 1;
  const estimatedTurnout2026 = Math.round(totalTurnout2022 * regGrowthFactor);

  const targetDVotes = Math.round(estimatedTurnout2026 * 0.505);
  const baselineDVotes = Math.round(totalDVotes2022);
  const gap = targetDVotes - baselineDVotes;

  const dPct2022 = totalTurnout2022 > 0 ? Math.round((baselineDVotes / totalTurnout2022) * 1000) / 10 : null;

  let status: "ahead" | "behind" | "toss-up";
  if (gap <= -2000) status = "ahead";
  else if (gap >= 2000) status = "behind";
  else status = "toss-up";

  const result: WinNumberResult = {
    district,
    precinctCount: precincts.length,
    reg2022: totalReg2022,
    reg2024: totalReg2024,
    turnout2022: totalTurnout2022,
    turnout2024: totalTurnout2024,
    dVotes2022: baselineDVotes,
    dPct2022,
    estimatedTurnout2026,
    targetDVotes,
    gap,
    status,
    primary2026DemBallots: totalPrimDem,
    primary2026RepBallots: totalPrimRep,
    primary2026DemEdge: totalPrimDem - totalPrimRep,
  };

  return NextResponse.json(result, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
  });
}
