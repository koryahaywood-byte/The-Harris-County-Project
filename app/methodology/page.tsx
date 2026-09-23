import type { Metadata } from "next";
import Link from "next/link";
import { RATING, SCALE } from "@/lib/ratings";
import { getAllRaces, tally } from "@/lib/races";
import { DESK_LOG } from "@/lib/desk-log";

export const metadata: Metadata = {
  title: "How we rate races · The Harris County Project",
  description: "The rating scale behind every race on the Harris County ballot, what goes into it, when it changes, and how the Accountability Score is computed.",
};

const MEANING: Record<string, string> = {
  "safe-d": "Not competitive. The Democrat would need an extraordinary event to lose.",
  "likely-d": "The Democrat is a clear favorite, but the race could tighten.",
  "lean-d": "Competitive, with the Democrat holding a real but beatable edge.",
  "toss-up": "Either candidate could win. No meaningful advantage on the evidence available.",
  "lean-r": "Competitive, with the Republican holding a real but beatable edge.",
  "likely-r": "The Republican is a clear favorite, but the race could tighten.",
  "safe-r": "Not competitive. The Republican would need an extraordinary event to lose.",
};

const INPUTS = [
  ["The last general election", "How the same district voted the last time the office was on the ballot, as a two-party share from the Harris County canvass. Where no same-office result exists (most judicial benches), we use the countywide judicial average from 2024 and label it a baseline."],
  ["The district's partisan lean", "Presidential and other top-of-ticket results inside the district, precinct by precinct, which show how the seat behaves beyond one candidate."],
  ["Incumbency and open seats", "Whether an incumbent is on the ballot, how they won last time, and whether the seat is open."],
  ["Money", "Cash on hand and fundraising from the latest FEC, Texas Ethics Commission and county filings. Money moves a rating only when the gap is large and the race is otherwise close."],
  ["Reported polling", "Independent public polls with a stated sample, field dates and population. We cite each poll in the race notes; we do not average or adjust them."],
  ["Events", "Primary upsets, withdrawals, appointments, indictments and redistricting, each tied to a dated news report."],
];

const COMPONENTS = [
  { name: "Fundraising strength", weight: "30%", what: "Cash on hand as a percentile among officials in the same chamber (Texas Senate, Texas House, Harris County, City of Houston, HISD).", source: "Latest filing: FEC, Texas Ethics Commission, Harris County clerk, City of Houston.", limits: "A single-snapshot measure. As the filing archive grows, this becomes a trajectory across periods." },
  { name: "Legislative output", weight: "30%", what: "For legislators: bills passed into law divided by bills filed this session, plus a volume credit capped at 20 points. For executives and judges: a fixed office-scope baseline, labeled as such.", source: "LegiScan, Texas 89th Legislature.", limits: "Rewards focus over volume. Co-authorship is not yet counted." },
  { name: "Peer standing", weight: "20%", what: "The official's overall rating as a percentile within their chamber, computed with identical inputs for everyone.", source: "Computed in the open in lib/politician-stats.ts.", limits: "Shares inputs with other components by design: it is the relative view of the same record." },
  { name: "Experience", weight: "20%", what: "Years since first elected to public office, scaled linearly and capped at 25 years.", source: "Official biographies and election records.", limits: "Counts continuous public service, including prior offices." },
];

export default function MethodologyPage() {
  const races = getAllRaces();
  const t = tally(races);
  const changes = DESK_LOG.filter(e => e.kind === "rating");
  return (
    <div>
      <header className="border-b" style={{ background: "var(--surface)", borderColor: "var(--rule)" }}>
        <div className="max-w-3xl mx-auto px-4 md:px-6 pt-10 pb-8">
          <p className="label" style={{ color: "var(--brand)" }}>Methodology</p>
          <h1 className="serif text-[40px] md:text-[50px] leading-[1.04] tracking-[-0.02em] font-semibold mt-2" style={{ color: "var(--ink)" }}>How we rate races</h1>
          <p className="mt-4 text-[18px] leading-relaxed" style={{ color: "#2F3632" }}>
            Every race on the Harris County ballot gets one of seven ratings, from Safe Democratic to Safe Republican.
            A rating is the desk’s judgment of who is favored today. It is not a prediction of the final margin and it is not an endorsement.
          </p>
          <nav className="mt-6 flex gap-5 text-[14px] font-semibold" style={{ color: "var(--brand)" }}>
            <a href="#scale">The scale</a><a href="#inputs">What goes in</a><a href="#changes">When it changes</a><a href="#accountability">Accountability Score</a>
          </nav>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 md:px-6 py-10 space-y-14">
        <section id="scale" className="scroll-mt-20">
          <h2 className="desk-head serif text-[26px] font-semibold mb-5" style={{ color: "var(--ink)" }}>The scale</h2>
          <ol className="space-y-0 border-t" style={{ borderColor: "var(--rule)" }}>
            {SCALE.map(s => {
              const count = races.filter(r => (r.lean === "uncontested-d" ? "safe-d" : r.lean === "uncontested-r" ? "safe-r" : r.lean) === s).length;
              return (
                <li key={s} className="grid grid-cols-[112px_1fr_48px] gap-4 items-center py-3.5 border-b" style={{ borderColor: "var(--rule)" }}>
                  <span className="inline-flex items-center gap-2 text-[14px] font-bold" style={{ color: "var(--ink)" }}>
                    <span className="w-3.5 h-3.5 rounded-[3px] shrink-0" style={{ background: RATING[s].color }} aria-hidden />{RATING[s].label}
                  </span>
                  <span className="text-[15px] leading-snug" style={{ color: "#3C443F" }}>{MEANING[s]}</span>
                  <span className="text-[15px] font-extrabold num text-right" style={{ color: "var(--ink)" }} title="Races with this rating today">{count}</span>
                </li>
              );
            })}
          </ol>
          <p className="text-[14px] mt-4 leading-relaxed" style={{ color: "#4F5752" }}>
            “In play” means Toss-up, Lean D or Lean R: {t.toss + t.dLean + t.rLean} races today. Races with only one party on the ballot are counted as Safe
            and labeled “No D filed” or “No R filed”. The number beside each step is how many of the {t.total} races carry that rating now.
          </p>
        </section>

        <section id="inputs" className="scroll-mt-20">
          <h2 className="desk-head serif text-[26px] font-semibold mb-5" style={{ color: "var(--ink)" }}>What goes into a rating</h2>
          <dl className="space-y-5">
            {INPUTS.map(([k, v]) => (
              <div key={k}>
                <dt className="text-[16px] font-bold" style={{ color: "var(--ink)" }}>{k}</dt>
                <dd className="text-[15px] leading-relaxed mt-1" style={{ color: "#3C443F" }}>{v}</dd>
              </div>
            ))}
          </dl>
          <p className="text-[14px] mt-6 leading-relaxed" style={{ color: "#4F5752" }}>
            No single input decides a rating, and there is no formula that converts them into one. That is deliberate: a formula would treat a
            two-point 2024 margin the same whether or not the incumbent has since been indicted.
          </p>
        </section>

        <section id="changes" className="scroll-mt-20">
          <h2 className="desk-head serif text-[26px] font-semibold mb-5" style={{ color: "var(--ink)" }}>When a rating changes</h2>
          <p className="text-[15px] leading-relaxed" style={{ color: "#3C443F" }}>
            Ratings move only on hard evidence: a candidate leaving the race, a credible public poll of the district or state, an indictment, or a shift in
            who is on the ballot. The desk reviews every race against the week’s reporting. Each change is dated, sourced and shown on the race page and
            the front page, with the old rating struck through.
          </p>
          {changes.length > 0 && (
            <ul className="mt-5 panel divide-y" style={{ borderColor: "var(--rule)" }}>
              {changes.map((e, i) => {
                const race = races.find(r => r.key === e.race);
                return (
                  <li key={i} className="px-4 py-3 text-[14px]" style={{ borderColor: "var(--rule)" }}>
                    <span className="label mr-2" style={{ color: "#6B726D" }}>{new Date(e.date + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}</span>
                    <Link href={`/races/${e.race.toLowerCase()}`} className="font-bold hover:underline" style={{ color: "var(--ink)" }}>{race?.office}</Link>
                    <span style={{ color: "#4F5752" }}>: {e.from && RATING[e.from].label} to {e.to && RATING[e.to].label}. {e.headline}</span>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="text-[14px] mt-5 leading-relaxed" style={{ color: "#4F5752" }}>
            Corrections to our own data are logged the same way and labeled as corrections. Found an error? <Link href="/contact" className="link">Tell the desk</Link>.
          </p>
        </section>

        <section id="sources" className="scroll-mt-20">
          <h2 className="desk-head serif text-[26px] font-semibold mb-5" style={{ color: "var(--ink)" }}>Sources</h2>
          <ul className="text-[15px] leading-relaxed space-y-2 list-disc pl-5" style={{ color: "#3C443F" }}>
            <li>Election results: Harris County Clerk canvass returns, precinct level, 2012 through the 2026 primaries and runoffs.</li>
            <li>Campaign finance: Federal Election Commission, Texas Ethics Commission, Harris County clerk and City of Houston filings. Each figure shows its filing date.</li>
            <li>Districts and demographics: U.S. Census Bureau (TIGER boundaries, American Community Survey citizen voting-age population).</li>
            <li>Candidate photos: official government portraits or the lead image of each candidate’s Wikipedia article. Where neither exists, we show initials.</li>
          </ul>
        </section>

        <section id="accountability" className="scroll-mt-20">
          <h2 className="desk-head serif text-[26px] font-semibold" style={{ color: "var(--ink)" }}>The Accountability Score</h2>
          <p className="text-[15px] leading-relaxed mt-4" style={{ color: "#3C443F" }}>
            Each official’s profile carries one number, 0 to 100, built only from public records.
            <strong style={{ color: "var(--ink)" }}> Score = 30% fundraising strength + 30% legislative output + 20% peer standing + 20% experience.</strong>{" "}
            When a component has no data, it is dropped and the remaining weights renormalized: no official is penalized for a gap in our records.
          </p>
          <div className="mt-6 space-y-6">
            {COMPONENTS.map(c => (
              <div key={c.name} className="border-t pt-4" style={{ borderColor: "var(--rule)" }}>
                <div className="flex items-baseline justify-between">
                  <h3 className="text-[17px] font-bold" style={{ color: "var(--ink)" }}>{c.name}</h3>
                  <span className="text-[15px] font-extrabold num" style={{ color: "var(--ink)" }}>{c.weight}</span>
                </div>
                <p className="text-[15px] leading-relaxed mt-1" style={{ color: "#3C443F" }}>{c.what}</p>
                <p className="text-[13px] leading-relaxed mt-2" style={{ color: "#6B726D" }}><strong>Source:</strong> {c.source} <strong>Limits:</strong> {c.limits}</p>
              </div>
            ))}
          </div>
          <p className="text-[14px] mt-6 leading-relaxed" style={{ color: "#4F5752" }}>
            It is not an ideology score, an endorsement or a prediction. Two officials with opposite politics can both score 85.
          </p>
        </section>
      </div>
    </div>
  );
}
