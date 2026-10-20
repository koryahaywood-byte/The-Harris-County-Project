"use client";

import Link from "next/link";
import { useState } from "react";
import { PARTY } from "@/lib/ratings";
import { DISTRICT_KINDS, MIN_DISTRICT_BALLOTS, gapLabel, rateGap, type DistrictMix } from "@/lib/early-vote";
import EVMix from "@/components/desk/EVMix";

const pct = (n: number, d: number) => (d ? `${((n / d) * 100).toFixed(1)}%` : "–");

/** Early voters per district: who has voted, and which party's March voters are turning out faster. */
export default function EVDistricts({ districts, races }: { districts: Record<string, DistrictMix>; races: Record<string, string> }) {
  const [kind, setKind] = useState<(typeof DISTRICT_KINDS)[number]["prefix"]>("HD");
  const meta = DISTRICT_KINDS.find(k => k.prefix === kind)!;
  const rows = Object.entries(districts)
    .filter(([k, m]) => k.startsWith(kind + "-") && m.all >= MIN_DISTRICT_BALLOTS)
    .map(([k, m]) => ({ key: k, n: k.slice(kind.length + 1), m, g: rateGap(m) }))
    .sort((a, b) => b.g - a.g);

  return (
    <div>
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="District type">
        {DISTRICT_KINDS.map(k => (
          <button key={k.prefix} role="tab" aria-selected={kind === k.prefix} onClick={() => setKind(k.prefix)}
            className="px-3 py-1.5 rounded-full text-[13px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0B6A4A]"
            style={kind === k.prefix ? { background: "var(--board)", color: "#fff" } : { background: "var(--surface)", color: "var(--ink-2)", boxShadow: "inset 0 0 0 1px var(--rule)" }}>
            {k.label}
          </button>
        ))}
      </div>
      <div className="mt-4 panel overflow-hidden">
        <div className="hidden md:grid grid-cols-[minmax(120px,1.1fr)_80px_minmax(180px,2.2fr)_150px_80px] gap-4 px-4 py-2.5 label border-b"
          style={{ color: "#6B726D", borderColor: "var(--rule)", fontSize: 10 }}>
          <span>District</span><span className="text-right">Ballots</span><span>Last primary of early voters</span>
          <span className="text-right">March voters who voted</span><span className="text-right">Gap</span>
        </div>
        <ul>
          {rows.map(r => {
            const race = races[r.key];
            const name = meta.name(r.n);
            return (
              <li key={r.key} className="grid grid-cols-[1fr_auto] md:grid-cols-[minmax(120px,1.1fr)_80px_minmax(180px,2.2fr)_150px_80px] gap-x-4 gap-y-2 px-4 py-3 border-b last:border-b-0 items-center"
                style={{ borderColor: "var(--rule)" }}>
                <span className="font-semibold text-[14.5px]" style={{ color: "var(--ink)" }}>
                  {race ? <Link href={race} className="underline decoration-1 underline-offset-4 hover:decoration-2">{name}</Link> : name}
                  {race && <span className="label ml-2" style={{ color: "var(--brand)", fontSize: 9 }}>On ballot</span>}
                </span>
                <span className="num text-right text-[14px]" style={{ color: "var(--ink-2)" }}>{r.m.all.toLocaleString()}<span className="md:hidden"> ballots</span></span>
                <div className="col-span-2 md:col-span-1"><EVMix m={r.m} inline /></div>
                <span className="num text-[13px] md:text-right" style={{ color: "var(--ink-2)" }}>
                  <span className="inline-block w-2 h-2 rounded-[2px] mr-1" style={{ background: PARTY.D.color }} aria-hidden />D {pct(r.m.D26 ?? 0, r.m.poolD)}
                  <span style={{ color: "#B5BAB3" }}> · </span>
                  <span className="inline-block w-2 h-2 rounded-[2px] mr-1" style={{ background: PARTY.R.color }} aria-hidden />R {pct(r.m.R26 ?? 0, r.m.poolR)}
                </span>
                <span className="num text-right font-bold text-[14px]" style={{ color: "var(--ink)" }}>{gapLabel(r.g)}</span>
              </li>
            );
          })}
        </ul>
      </div>
      <p className="text-[12px] mt-2" style={{ color: "#6B726D" }}>
        Gap: points by which one party&rsquo;s March 2026 primary voters in the district have out-voted the other&rsquo;s so far. Sorted from the widest Democratic gap. Districts with fewer than {MIN_DISTRICT_BALLOTS} Harris County ballots so far are left out.
      </p>
    </div>
  );
}
