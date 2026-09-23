"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { RaceLean } from "@/lib/matchups-2026";
import { RATING, SCALE, raceHref } from "@/lib/ratings";

// The ballot strip: every race on the Harris County ballot as one bar, laid
// out from safest Democratic to safest Republican. Segment widths are the
// real counts, so the strip IS the chart. Toss-ups sit at the center in gold.

export interface StripRace { key: string; tag: string; office: string; lean?: RaceLean; d?: string; r?: string }

const fold = (l?: RaceLean): RaceLean => (l === "uncontested-d" ? "safe-d" : l === "uncontested-r" ? "safe-r" : l ?? "toss-up");

export default function BallotStrip({ races, height = 64 }: { races: StripRace[]; height?: number }) {
  const [hover, setHover] = useState<{ race: StripRace; x: number } | null>(null);
  const wrap = useRef<HTMLDivElement>(null);

  const buckets = SCALE.map(s => ({ lean: s, races: races.filter(r => fold(r.lean) === s) })).filter(b => b.races.length > 0);
  let i = 0;

  function show(race: StripRace, el: HTMLElement) {
    const box = wrap.current?.getBoundingClientRect();
    const c = el.getBoundingClientRect();
    if (!box) return;
    setHover({ race, x: c.left + c.width / 2 - box.left });
  }

  return (
    <div ref={wrap} className="relative" onMouseLeave={() => setHover(null)}>
      <div className="strip strip-grow flex gap-[6px] items-end" style={{ height }}>
        {buckets.map(b => (
          <div key={b.lean} className="flex gap-[2px] items-end h-full" style={{ flex: `${b.races.length} 1 0`, minWidth: 30 }}>
            {b.races.map(r => {
              const delay = (i++ % 100) * 6;
              const lean = r.lean ?? "toss-up";
              return (
                <Link key={r.key} href={raceHref(r.key)}
                  className="strip-cell flex-1 rounded-[2px] min-w-[3px]"
                  aria-label={`${r.office}: ${RATING[lean].long}`}
                  onMouseEnter={e => show(r, e.currentTarget)}
                  onFocus={e => show(r, e.currentTarget)}
                  style={{
                    height: b.lean === "toss-up" ? "100%" : RATING[b.lean].competitive ? "84%" : "70%",
                    background: RATING[lean].color,
                    animationDelay: `${delay}ms`,
                  }} />
              );
            })}
          </div>
        ))}
      </div>

      {/* Bucket legend, aligned to the segments above */}
      <div className="flex gap-[6px] mt-3">
        {buckets.map(b => (
          <div key={b.lean} className="min-w-0" style={{ flex: `${b.races.length} 1 0`, minWidth: 30 }}>
            <p className="text-[20px] md:text-[26px] font-extrabold leading-none num" style={{ color: b.lean === "toss-up" ? "var(--gold)" : "#fff" }}>{b.races.length}</p>
            <p className="label mt-1 text-white/55 leading-tight" style={{ fontSize: 10 }}>{b.races.length < 3 ? RATING[b.lean].label.split(/[\s-]/).map((w, i) => <span key={i} className="block">{w}</span>) : RATING[b.lean].label}</p>
          </div>
        ))}
      </div>

      {hover && (
        <div className="pointer-events-none absolute z-10 -translate-x-1/2 bottom-full mb-3 w-64 rounded-md px-3 py-2.5 shadow-xl"
          style={{ left: Math.min(Math.max(hover.x, 128), (wrap.current?.clientWidth ?? 300) - 128), background: "#fff", color: "var(--ink)" }}>
          <p className="label" style={{ color: "#6B726D" }}>{hover.race.tag} · {hover.race.lean ? RATING[hover.race.lean].label : "Unrated"}</p>
          <p className="serif text-[15px] font-semibold leading-snug mt-0.5">{hover.race.office}</p>
          <p className="text-[12px] mt-1" style={{ color: "#454D48" }}>
            {hover.race.d ?? "No Democrat"} <span style={{ color: "#9AA19C" }}>vs</span> {hover.race.r ?? "No Republican"}
          </p>
        </div>
      )}
    </div>
  );
}
