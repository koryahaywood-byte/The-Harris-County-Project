"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { EDGE_STEPS, GAP_STEPS, MIN_POOL, TURNOUT_RAMP, turnoutBreaks, type Metric, type PrecinctRow } from "./scale";

const EarlyVoteMap = dynamic(() => import("./EarlyVoteMap"), {
  ssr: false,
  loading: () => <div style={{ height: 520, background: "#F1F2EE" }} />,
});

export default function EVMapPanel({ precincts }: { precincts: Record<string, PrecinctRow> }) {
  const [metric, setMetric] = useState<Metric>("gap");
  const breaks = useMemo(() => turnoutBreaks(Object.values(precincts)), [precincts]);
  const legend = metric === "gap"
    ? GAP_STEPS.map(s => ({ color: s.color, label: s.label }))
    : metric === "edge"
    ? EDGE_STEPS.map((s, i) => ({ color: s.color, label: i === 3 ? "Even" : i < 3 ? `R+${[30, 15, 5][i]}` : `D+${[5, 15, 30][i - 4]}` }))
    : TURNOUT_RAMP.map((c, i) => ({ color: c, label: i === 0 ? `<${Math.round(breaks[0] * 100)}%` : i === TURNOUT_RAMP.length - 1 ? `${Math.round(breaks[i - 1] * 100)}%+` : `${Math.round(breaks[i - 1] * 100)}%` }));

  return (
    <div className="panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b" style={{ borderColor: "var(--rule)" }}>
        <div className="flex gap-1.5" role="tablist" aria-label="Map shows">
          {([["gap", "Turnout gap"], ["edge", "Who\u2019s voting"], ["turnout", "Turnout"]] as const).map(([m, label]) => (
            <button key={m} role="tab" aria-selected={metric === m} onClick={() => setMetric(m)}
              className="px-3 py-1.5 rounded-full text-[13px] font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0B6A4A]"
              style={metric === m ? { background: "var(--board)", color: "#fff" } : { color: "var(--ink-2)", boxShadow: "inset 0 0 0 1px var(--rule)" }}>
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-[2px]" aria-label="Legend">
          {legend.map((l, i) => (
            <span key={i} className="flex flex-col items-center">
              <span className="w-9 h-2.5" style={{ background: l.color, borderRadius: i === 0 ? "3px 0 0 3px" : i === legend.length - 1 ? "0 3px 3px 0" : 0 }} />
              <span className="num text-[10.5px] mt-1" style={{ color: "#5B635E" }}>{l.label}</span>
            </span>
          ))}
        </div>
      </div>
      <EarlyVoteMap precincts={precincts} metric={metric} />
      <p className="px-4 py-2.5 text-[12px] border-t" style={{ color: "#6B726D", borderColor: "var(--rule)" }}>
        {metric === "gap"
          ? `Share of the precinct's March 2026 Democratic primary voters who have voted, minus the Republican share. Blank where either party had fewer than ${MIN_POOL} March voters.`
          : metric === "edge"
          ? "Democratic-primary minus Republican-primary voters among each precinct's early voters, by last primary. Precincts with fewer than 25 ballots are left blank."
          : "Early ballots as a share of the precinct's registered voters in November 2024. Breaks are quintiles of today's precincts."}
      </p>
    </div>
  );
}
