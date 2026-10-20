import Link from "next/link";
import { PARTY } from "@/lib/ratings";
import { EV, dayName, pctText, MIN_DISTRICT_BALLOTS, type Mix } from "@/lib/early-vote";
import EVMix from "@/components/desk/EVMix";

const fmt = (n: number) => n.toLocaleString("en-US");

function Rates({ m, poolD, poolR }: { m: Mix; poolD: number; poolR: number }) {
  const d = poolD ? (m.D26 ?? 0) / poolD : 0, r = poolR ? (m.R26 ?? 0) / poolR : 0;
  return (
    <div className="grid grid-cols-2 gap-3 mt-4">
      {([["D", d], ["R", r]] as const).map(([p, v]) => (
        <div key={p}>
          <p className="text-[12px] inline-flex items-center gap-1.5" style={{ color: "#5B635E" }}>
            <span className="w-2 h-2 rounded-[2px]" style={{ background: PARTY[p].color }} aria-hidden />
            {p === "D" ? "Dem" : "GOP"} March voters who voted
          </p>
          <p className="num text-[20px] font-bold leading-tight" style={{ color: "var(--ink)" }}>{pctText(v)}</p>
        </div>
      ))}
    </div>
  );
}

/** Sidebar panel on a race page: the early vote where this race is decided. */
export function RaceEVPanel({ district, label }: { district: string | null; label: string }) {
  const m = district ? EV.districts[district] : null;
  if (district && (!m || m.all < MIN_DISTRICT_BALLOTS)) return null;
  const mix = m ?? EV.totals;
  return (
    <div className="panel p-5">
      <p className="label" style={{ color: "#6B726D" }}>{`Early vote · day ${EV.day} · through ${dayName(EV.through).split(", ")[1]}`}</p>
      <p className="serif text-[18px] font-semibold mt-1" style={{ color: "var(--ink)" }}>
        {`${fmt(mix.all)} ballots ${m ? `in ${label}` : "countywide"}`}
      </p>
      <div className="mt-3"><EVMix m={mix} compact /></div>
      <Rates m={mix} poolD={m ? m.poolD : EV.universe.D} poolR={m ? m.poolR : EV.universe.R} />
      <p className="text-[12px] mt-3 leading-relaxed" style={{ color: "#8A918C" }}>
        Bar: each early voter&rsquo;s last party primary. Rates: share of the March 2026 primary voters here who have voted. Who is voting, not how.
      </p>
      <Link href="/tools/early-vote" className="mt-3 inline-block text-[13px] font-bold" style={{ color: "var(--brand)" }}>
        Every district and precinct <span aria-hidden>→</span>
      </Link>
    </div>
  );
}

/** Front-page band under the scoreboard while early voting is under way. */
export function EVBand() {
  const t = EV.totals;
  if (!t.all) return null;
  const vs22 = t.all / EV.compare2022.atSameDay - 1;
  const d = (t.D26 ?? 0) / EV.universe.D, r = (t.R26 ?? 0) / EV.universe.R;
  return (
    <section className="border-b" style={{ background: "var(--surface)", borderColor: "var(--rule)" }}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 grid md:grid-cols-[auto_1fr_auto] gap-6 md:gap-10 items-center">
        <div>
          <p className="label" style={{ color: "var(--brand)" }}>{`Early vote · day ${EV.day} of ${EV.evDays}`}</p>
          <p className="num serif text-[34px] font-semibold leading-tight mt-1" style={{ color: "var(--ink)" }}>{fmt(t.all)}</p>
          <p className="text-[13px]" style={{ color: "#5B635E" }}>
            {`ballots through ${dayName(EV.through).split(", ")[1]} · ${vs22 >= 0 ? "+" : ""}${pctText(vs22, 0)} vs 2022`}
          </p>
        </div>
        <div className="min-w-0">
          <EVMix m={t} compact />
          <p className="text-[13.5px] mt-2 leading-snug" style={{ color: "var(--ink-2)" }}>
            {`${pctText(d)} of March's Democratic primary voters have voted, ${pctText(r)} of Republican primary voters.`}
          </p>
        </div>
        <Link href="/tools/early-vote" className="btn self-center whitespace-nowrap text-[14px] font-semibold rounded-md px-4 py-2.5"
          style={{ background: "var(--board)", color: "#fff" }}>
          Who&rsquo;s voting <span aria-hidden>→</span>
        </Link>
      </div>
    </section>
  );
}
