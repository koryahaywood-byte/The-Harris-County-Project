import type { Metadata } from "next";
import Link from "next/link";
import { EV, MIN_DISTRICT_BALLOTS, dayName, rateGap, pctText, evDistrictFor } from "@/lib/early-vote";
import { gapOf } from "./scale";
import { MATCHUPS_2026 } from "@/lib/matchups-2026";
import { raceHref } from "@/lib/ratings";
import { PARTY } from "@/lib/ratings";
import EVMix from "@/components/desk/EVMix";
import EVCurve from "./EVCurve";
import EVDistricts from "./EVDistricts";
import EVMapPanel from "./EVMapPanel";
import RelatedTools from "@/components/RelatedTools";

const t = EV.totals;
const vs22 = t.all / EV.compare2022.atSameDay - 1;
// Like with like: early voters who voted in the March 2026 primary, over everyone who did.
const rateD = (t.D26 ?? 0) / EV.universe.D, rateR = (t.R26 ?? 0) / EV.universe.R;
const ahead = rateD >= rateR ? "D" : "R";
const fmt = (n: number) => n.toLocaleString("en-US");

export const metadata: Metadata = {
  title: `Early vote, day ${EV.day}: ${fmt(t.all)} ballots · The Harris County Project`,
  description: `Harris County early vote through ${dayName(EV.through)}: ${fmt(t.all)} ballots, ${pctText(Math.abs(vs22), 0)} ${vs22 >= 0 ? "ahead of" : "behind"} the 2022 midterm. ${pctText(rateD)} of March's Democratic primary voters and ${pctText(rateR)} of its Republican primary voters have voted.`,
  openGraph: {
    title: `Harris County early vote, day ${EV.day}: ${fmt(t.all)} ballots`,
    description: `Who is voting, by primary history, district and precinct. Updated daily from the county's rosters.`,
  },
};

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="panel px-4 py-3.5">
      <p className="label" style={{ color: "#6B726D", fontSize: 10 }}>{label}</p>
      <p className="num text-[28px] leading-tight font-bold mt-1" style={{ color: "var(--ink)" }}>{value}</p>
      {note && <p className="text-[12.5px] mt-0.5" style={{ color: "#5B635E" }}>{note}</p>}
    </div>
  );
}

function RateBar({ party, rate, voted, universe }: { party: "D" | "R"; rate: number; voted: number; universe: number }) {
  const max = Math.max(rateD, rateR) * 1.15;
  return (
    <div>
      <div className="flex items-baseline justify-between text-[13.5px]">
        <span className="inline-flex items-center gap-1.5" style={{ color: "var(--ink-2)" }}>
          <span className="w-2.5 h-2.5 rounded-[2px]" style={{ background: PARTY[party].color }} aria-hidden />
          {party === "D" ? "Democratic" : "Republican"}-primary voters
        </span>
        <b className="num text-[15px]" style={{ color: "var(--ink)" }}>{pctText(rate)}</b>
      </div>
      <div className="h-2.5 mt-1.5 rounded-[4px]" style={{ background: "#ECEDE8" }}>
        <div className="h-full rounded-[4px] bar-grow" style={{ width: `${(rate / max) * 100}%`, background: PARTY[party].color }} />
      </div>
      <p className="num text-[12px] mt-1" style={{ color: "#6B726D" }}>{fmt(voted)} of {fmt(universe)}</p>
    </div>
  );
}

export default function EarlyVotePage() {
  const c22 = EV.compare2022;
  const leanShift = c22.lean != null ? (EV.lean.earlyVote - c22.lean) * 100 : null;
  const curve = EV.byDay.map((d, i) => ({ day: d.day, date: dayName(d.date).split(", ")[1], v26: d.cumulative, v22: c22.curve[i].cumulative }));
  const races: Record<string, string> = {};
  for (const k of Object.keys(MATCHUPS_2026)) { const d = evDistrictFor(k); if (d && EV.districts[d]) races[d] ??= raceHref(k); }
  const hd = Object.entries(EV.districts).filter(([k, m]) => k.startsWith("HD-") && m.all >= MIN_DISTRICT_BALLOTS).map(([k, m]) => ({ k, g: rateGap(m) }));
  const hdD = hd.filter(h => h.g > 0).length;
  const gaps = Object.values(EV.precincts).map(gapOf).filter((g): g is number => g != null);
  const dAhead = gaps.filter(g => g > 0).length;
  const updated = new Date(EV.updated).toLocaleString("en-US", { timeZone: "America/Chicago", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

  return (
    <div>
      <header className="border-b" style={{ borderColor: "var(--rule)", background: "var(--surface)" }}>
        <div className="max-w-6xl mx-auto px-4 md:px-6 pt-10 pb-8">
          <p className="label" style={{ color: "var(--brand)" }}>
            {`Early vote · Day ${EV.day} of ${EV.evDays} · through ${dayName(EV.through)}`}
          </p>
          <h1 className="serif text-[40px] md:text-[56px] leading-[1.02] tracking-[-0.02em] font-semibold mt-2" style={{ color: "var(--ink)" }}>
            {`${fmt(t.all)} ballots are in`}
          </h1>
          <p className="mt-3 max-w-3xl text-[17.5px] leading-relaxed" style={{ color: "#3C443F" }}>
            {`Harris County is ${pctText(Math.abs(vs22), 0)} ${vs22 >= 0 ? "ahead of" : "behind"} the 2022 midterm at the same point. `}
            {`Among people who voted in this March's primaries, ${ahead === "D" ? "Democrats" : "Republicans"} are turning out faster: ${pctText(ahead === "D" ? rateD : rateR)} have already voted, against ${pctText(ahead === "D" ? rateR : rateD)} of ${ahead === "D" ? "Republicans" : "Democrats"}.`}
          </p>
          <p className="mt-3 text-[12.5px]" style={{ color: "#6B726D" }}>
            {`From the county's early-voting and mail-ballot rosters, updated ${updated}. Early voting runs through Friday, Oct. 30; Election Day is Tuesday, Nov. 3.`}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <Stat label="In person" value={fmt(t.inPerson)} />
            <Stat label="By mail" value={fmt(t.mail)} note="Mail ballots received" />
            <Stat label={`2022 at day ${EV.day}`} value={fmt(c22.atSameDay)} note={`${vs22 >= 0 ? "+" : ""}${pctText(vs22, 0)} this year`} />
            <Stat label="Of 2024 registered" value={pctText(t.all / EV.registered2024)} note={`${fmt(EV.registered2024)} registered in 2024`} />
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-10 space-y-14">
        {/* Who is voting */}
        <section className="grid md:grid-cols-[1.4fr_1fr] gap-8 md:gap-12">
          <div>
            <h2 className="serif text-[26px] leading-tight font-semibold" style={{ color: "var(--ink)" }}>
              {`${pctText(t.D / t.all, 0)} of early voters last chose a Democratic primary; ${pctText(t.R / t.all, 0)} a Republican one`}
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed" style={{ color: "#3C443F" }}>
              Texas has no party registration, so the desk sorts each voter by the last party primary they voted in: March 2022, 2024 or 2026.
              It shows who is voting, not how they vote. &ldquo;No primary&rdquo; is new voters, independents and people who skip primaries.
            </p>
            <div className="mt-5 space-y-5">
              <div>
                <p className="label mb-1.5" style={{ color: "#5B635E", fontSize: 10 }}>{`Everyone so far · ${fmt(t.all)}`}</p>
                <EVMix m={t} />
              </div>
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <p className="label mb-1.5" style={{ color: "#5B635E", fontSize: 10 }}>{`In person · ${fmt(t.inPerson)}`}</p>
                  <EVMix m={EV.byMethod.inPerson} compact />
                </div>
                <div>
                  <p className="label mb-1.5" style={{ color: "#5B635E", fontSize: 10 }}>{`By mail · ${fmt(t.mail)}`}</p>
                  <EVMix m={EV.byMethod.mail} compact />
                </div>
              </div>
            </div>
          </div>
          <div className="panel p-5 self-start">
            <h3 className="font-semibold text-[16px]" style={{ color: "var(--ink)" }}>Share of March 2026 primary voters who have voted</h3>
            <p className="text-[13px] mt-1 leading-snug" style={{ color: "#5B635E" }}>
              The fair test of turnout. Democrats&rsquo; March primary was far bigger, which inflates the bar on the left; comparing each party&rsquo;s own March voters cancels that out.
            </p>
            <div className="mt-4 space-y-4">
              <RateBar party="D" rate={rateD} voted={t.D26 ?? 0} universe={EV.universe.D} />
              <RateBar party="R" rate={rateR} voted={t.R26 ?? 0} universe={EV.universe.R} />
            </div>
          </div>
        </section>

        {/* Against 2022 */}
        <section>
          <h2 className="serif text-[26px] leading-tight font-semibold" style={{ color: "var(--ink)" }}>
            {`Day ${EV.day}: ${fmt(t.all - c22.atSameDay)} more ballots than 2022 at this point`}
          </h2>
          <div className="grid md:grid-cols-[1.6fr_1fr] gap-8 mt-5">
            <div className="panel p-4 md:p-5">
              <EVCurve points={curve} />
            </div>
            <div className="space-y-4">
              {leanShift != null && (
                <div className="panel p-4">
                  <p className="label" style={{ color: "#6B726D", fontSize: 10 }}>Where early voters live</p>
                  <p className="text-[14.5px] leading-snug mt-1.5" style={{ color: "var(--ink)" }}>
                    {`This year's early voters live in precincts that gave Harris ${pctText(EV.lean.earlyVote)} in 2024. At this point in 2022 it was ${pctText(c22.lean!)}: `}
                    <b>{`${Math.abs(leanShift).toFixed(1)} points ${leanShift >= 0 ? "bluer" : "redder"}`}</b>
                    {` this year, on the same yardstick. The county as a whole gave Harris ${pctText(EV.lean.county2024)}.`}
                  </p>
                </div>
              )}
              <div className="panel p-4">
                <p className="label" style={{ color: "#6B726D", fontSize: 10 }}>Voted in that year&rsquo;s March primary</p>
                <table className="w-full mt-2 text-[13.5px] num">
                  <thead>
                    <tr style={{ color: "#6B726D" }} className="text-left">
                      <th className="font-normal py-1" />
                      <th className="font-normal py-1 text-right">Dem</th>
                      <th className="font-normal py-1 text-right">Rep</th>
                      <th className="font-normal py-1 text-right">Neither</th>
                    </tr>
                  </thead>
                  <tbody style={{ color: "var(--ink)" }}>
                    <tr className="border-t" style={{ borderColor: "var(--rule)" }}>
                      <td className="py-1.5 font-semibold">2026</td>
                      <td className="text-right">{pctText(EV.sameCycle.D / t.all, 0)}</td>
                      <td className="text-right">{pctText(EV.sameCycle.R / t.all, 0)}</td>
                      <td className="text-right">{pctText(EV.sameCycle.N / t.all, 0)}</td>
                    </tr>
                    <tr className="border-t" style={{ borderColor: "var(--rule)" }}>
                      <td className="py-1.5 font-semibold">2022</td>
                      <td className="text-right">{pctText(c22.sameCycle.D / c22.sameCycle.total, 0)}</td>
                      <td className="text-right">{pctText(c22.sameCycle.R / c22.sameCycle.total, 0)}</td>
                      <td className="text-right">{pctText(c22.sameCycle.N / c22.sameCycle.total, 0)}</td>
                    </tr>
                  </tbody>
                </table>
                <p className="text-[12px] mt-2 leading-snug" style={{ color: "#6B726D" }}>
                  {`Early voters at day ${EV.day} each year. Part of the swing is the size of each primary, not only who is showing up.`}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Day by day */}
        <section>
          <h2 className="serif text-[26px] leading-tight font-semibold" style={{ color: "var(--ink)" }}>Day by day</h2>
          <div className="panel overflow-x-auto mt-4">
            <table className="w-full text-[13.5px] num min-w-[560px]">
              <thead>
                <tr className="label text-left" style={{ color: "#6B726D", fontSize: 10 }}>
                  <th className="font-normal px-4 py-2.5">Day</th>
                  <th className="font-normal px-2 py-2.5 text-right">In person</th>
                  <th className="font-normal px-2 py-2.5 text-right">Mail</th>
                  <th className="font-normal px-2 py-2.5 text-right">Total so far</th>
                  <th className="font-normal px-4 py-2.5 w-[38%]">Last primary of that day&rsquo;s voters</th>
                </tr>
              </thead>
              <tbody>
                {EV.mailBeforeEV.all > 0 && (
                  <tr className="border-t" style={{ borderColor: "var(--rule)" }}>
                    <td className="px-4 py-2.5" style={{ color: "var(--ink-2)" }}>Before early voting</td>
                    <td className="px-2 text-right" style={{ color: "#9AA19C" }}>–</td>
                    <td className="px-2 text-right">{fmt(EV.mailBeforeEV.mail)}</td>
                    <td className="px-2 text-right">{fmt(EV.mailBeforeEV.all)}</td>
                    <td className="px-4"><EVMix m={EV.mailBeforeEV} inline /></td>
                  </tr>
                )}
                {EV.byDay.map(d => {
                  const done = d.cumulative != null;
                  return (
                    <tr key={d.day} className="border-t" style={{ borderColor: "var(--rule)", color: done ? "var(--ink)" : "#9AA19C" }}>
                      <td className="px-4 py-2.5"><b className="font-semibold">{d.day}</b> <span style={{ color: done ? "#5B635E" : "#9AA19C" }}>{dayName(d.date)}</span></td>
                      <td className="px-2 text-right">{done ? fmt(d.inPerson) : "–"}</td>
                      <td className="px-2 text-right">{done ? fmt(d.mail) : "–"}</td>
                      <td className="px-2 text-right font-semibold">{done ? fmt(d.cumulative!) : "–"}</td>
                      <td className="px-4">{done ? <EVMix m={d} inline /> : null}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Districts */}
        <section>
          <h2 className="serif text-[26px] leading-tight font-semibold" style={{ color: "var(--ink)" }}>
            {`Democrats are out-voting Republicans in ${hdD} of ${hd.length} State House districts`}
          </h2>
          <p className="mt-2 text-[15px]" style={{ color: "#3C443F" }}>
            Measured by the share of each party&rsquo;s March 2026 primary voters in the district who have voted. Seats on this year&rsquo;s ballot link to the race.
          </p>
          <div className="mt-5"><EVDistricts districts={EV.districts} races={races} /></div>
        </section>

        {/* Precincts */}
        <section>
          <h2 className="serif text-[26px] leading-tight font-semibold" style={{ color: "var(--ink)" }}>
            {`Democrats are out-voting Republicans in ${fmt(dAhead)} of ${fmt(gaps.length)} precincts`}
          </h2>
          <div className="mt-5"><EVMapPanel precincts={EV.precincts} /></div>
        </section>

        <section className="max-w-3xl text-[13.5px] leading-relaxed space-y-2" style={{ color: "#3C443F" }}>
          <h2 className="label" style={{ color: "#5B635E" }}>How this is built</h2>
          <p>
            Every morning the county clerk posts who has voted early in person and whose mail ballot has arrived, by voter ID and precinct
            (<a className="underline" href="https://www.harrisvotes.com/Election-Results/Election-Rosters" target="_blank" rel="noopener noreferrer">harrisvotes.com election rosters</a>).
            The desk matches those IDs to the county&rsquo;s official rosters of the March 2022, 2024 and 2026 primaries, which record each voter&rsquo;s party ballot.
            {` ${pctText(EV.matchRate, 0)} of early voters so far voted in at least one of those primaries.`}
          </p>
          <p>
            The 2022 comparison uses the county&rsquo;s official November 2022 roster, counted through the same day of early voting (early voting began on a Monday both years).
            Precinct lean is each precinct&rsquo;s 2024 presidential result, the same yardstick for both years. The rosters are unofficial until the canvass, so totals can shift slightly.
            Only totals are published here; no individual voter appears on this site.
          </p>
          <p>
            Related: <Link className="underline" href="/races">every race, rated</Link> · <Link className="underline" href="/tools/my-ballot">your ballot</Link>.
          </p>
        </section>
      </div>
      <RelatedTools current="/tools/early-vote" />
    </div>
  );
}
