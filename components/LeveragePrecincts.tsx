"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

// Row shape from GET /api/districts/precinct-sweep
interface SweepRow {
  precinct: string;
  classification: string;
  label: string;
  avgDPct: number | null;
  dPct2024: number | null;
  reg2024: number | null;
}

const CLASS_COLORS: Record<string, string> = {
  surge: "#1d4ed8",
  hold: "#2563a8",
  persuasion: "#7c3aed",
  strongR: "#dc2626",
};

/** Top battleground precincts (40–60% average D share) in the selected district,
 *  ranked by 2024 registration. Renders nothing when the district has none. */
export default function LeveragePrecincts({ districtLabel, precincts }: {
  districtLabel: string;
  precincts: string[];
}) {
  const [rows, setRows] = useState<SweepRow[] | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/districts/precinct-sweep")
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (alive) setRows(d?.precincts ?? null); })
      .catch(() => { if (alive) setRows(null); });
    return () => { alive = false; };
  }, []);

  const top = useMemo(() => {
    if (!rows || precincts.length === 0) return [];
    const inDistrict = new Set(precincts);
    return rows
      .filter(r => inDistrict.has(r.precinct) && r.avgDPct !== null && r.avgDPct >= 40 && r.avgDPct <= 60)
      .sort((a, b) => (b.reg2024 ?? 0) - (a.reg2024 ?? 0))
      .slice(0, 10);
  }, [rows, precincts]);

  if (top.length === 0) return null;

  return (
    <div className="rounded-[1.35rem] bg-white/70 ring-1 ring-black/8 p-[4px] mt-4">
      <div className="rounded-[1rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] p-5">
        <h3 className="text-lg font-bold mb-1" style={{ fontFamily: "var(--font-playfair), serif", color: "#1a3a5c" }}>
          The {top.length} precincts that decide {districtLabel}
        </h3>
        <p className="text-[11px] mb-4" style={{ color: "#6b7280" }}>
          Battleground precincts (40–60% average D share, top of ticket 2020–2024), ranked by 2024 registration.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {[
                  { h: "Precinct", right: false },
                  { h: "Avg D%", right: true },
                  { h: "2024 D%", right: true },
                  { h: "Registered", right: true },
                  { h: "Classification", right: false },
                ].map(c => (
                  <th key={c.h}
                    className={`text-[10px] font-bold uppercase tracking-[0.18em] pb-2 ${c.right ? "text-right" : ""} ${c.h === "Classification" ? "pl-4" : ""}`}
                    style={{ color: "#9ca3af", borderBottom: "1px solid #e5e7eb" }}>
                    {c.h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {top.map(r => (
                <tr key={r.precinct} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td className="py-2">
                    <Link href={`/tools/precinct-lookup?precinct=${encodeURIComponent(r.precinct)}`}
                      className="text-[12px] font-bold tabular-nums hover:underline" style={{ color: "#2563a8" }}>
                      {r.precinct}
                    </Link>
                  </td>
                  <td className="py-2 text-right text-[12px] font-semibold tabular-nums"
                    style={{ color: (r.avgDPct ?? 0) >= 50 ? "#2563a8" : "#dc2626" }}>
                    {r.avgDPct !== null ? `${r.avgDPct.toFixed(1)}%` : "·"}
                  </td>
                  <td className="py-2 text-right text-[12px] tabular-nums"
                    style={{ color: r.dPct2024 === null ? "#9ca3af" : r.dPct2024 >= 50 ? "#2563a8" : "#dc2626" }}>
                    {r.dPct2024 !== null ? `${r.dPct2024.toFixed(1)}%` : "·"}
                  </td>
                  <td className="py-2 text-right text-[12px] tabular-nums" style={{ color: "#374151" }}>
                    {r.reg2024 !== null ? r.reg2024.toLocaleString() : "·"}
                  </td>
                  <td className="py-2 pl-4 text-[11px] font-semibold whitespace-nowrap"
                    style={{ color: CLASS_COLORS[r.classification] ?? "#6b7280" }}>
                    {r.label}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[9px] mt-3" style={{ color: "#b0b8c4" }}>
          D share: county canvass, top of ticket, 2020–2024 generals. Registration: Harris County voter roll, 2024.
        </p>
      </div>
    </div>
  );
}
