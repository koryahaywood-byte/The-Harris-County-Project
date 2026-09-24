import Link from "next/link";
import { Suspense } from "react";
import { getAllRaces, competitiveRaces, tally, toLite, byCompetitiveness, type Race } from "@/lib/races";
import { RATING, PARTY, raceHref } from "@/lib/ratings";
import { DESK_LOG } from "@/lib/desk-log";
import { EVENTS } from "@/lib/civic-events";
import { fmt } from "@/lib/campaign-finance";
import { getDashboardData } from "@/lib/dashboard-data";
import BallotStrip from "@/components/desk/BallotStrip";
import RaceTile from "@/components/desk/RaceTile";
import Face from "@/components/desk/Face";
import { RatingChip } from "@/components/desk/Rating";
import { CashDuel, ResultBar } from "@/components/desk/Bars";
import AddressForm from "@/components/desk/AddressForm";
import MarketBar from "@/components/desk/MarketBar";
import County3DLoader from "@/components/desk/County3DLoader";
import { getAllMarketOdds, type MarketOdds } from "@/lib/kalshi";

export const revalidate = 1800;

const WORDS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"];
const spell = (n: number) => WORDS[n] ?? String(n);

function todayCentral(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
const fmtDate = (iso: string, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }) =>
  new Date(iso + "T12:00:00Z").toLocaleDateString("en-US", { ...opts, timeZone: "UTC" });

export default async function FrontPage() {
  const races = getAllRaces();
  const odds = await getAllMarketOdds();
  const t = tally(races);
  const competitive = competitiveRaces();
  const tossups = competitive.filter(r => r.lean === "toss-up");
  const watch = competitive.slice(0, 9);
  const marquee = ["US-Senate", "HC-Countywide"].map(k => races.find(r => r.key === k)).filter(Boolean) as Race[];
  const stripRaces = [...races]
    .sort((a, b) => (RATING[a.lean ?? "toss-up"].order - RATING[b.lean ?? "toss-up"].order) || byCompetitiveness(a, b))
    .map(r => ({ key: r.key, tag: r.tag, office: r.office, lean: r.lean, d: r.d?.name, r: r.r?.name }));

  const today = todayCentral();
  const upcoming = EVENTS
    .filter(e => (e.endDate ?? e.date) >= today && (e.importance === "high" || e.category === "Elections" || e.category === "Courts"))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6);

  // Every candidate on a November ballot with money on file, richest first.
  const warChests = races.flatMap(r => [r.d, r.r].filter(Boolean).map(c => ({ c: c!, race: r })))
    .filter(x => (x.c.finance?.cash ?? 0) > 0)
    .sort((a, b) => b.c.finance!.cash - a.c.finance!.cash)
    .slice(0, 7);
  const topCash = warChests[0]?.c.finance?.cash ?? 1;

  const lastUpdate = DESK_LOG[0]?.date;

  return (
    <div>
      {/* ── SCOREBOARD ─────────────────────────────────────────────── */}
      <section className="board">
        <div className="max-w-7xl mx-auto px-4 md:px-6 pt-10 md:pt-14 pb-10">
          <div className="grid lg:grid-cols-[1fr_380px] gap-10 lg:gap-16 items-end">
            <div>
              <p className="label" style={{ color: "var(--gold)" }}>Election desk · November 3, 2026 general</p>
              <h1 className="serif mt-4 text-[38px] sm:text-[50px] lg:text-[62px] leading-[1.02] tracking-[-0.02em] font-semibold text-white">
                {t.total} races are on the Harris County ballot.{" "}
                <span style={{ color: "var(--gold)" }}>{spell(t.toss + t.dLean + t.rLean)} are in play.</span>
              </h1>
              <p className="mt-5 max-w-2xl text-[16px] md:text-[17px] leading-relaxed text-white/70">
                Every contest from U.S. Senate to justice of the peace, rated from Safe Democratic to Safe Republican
                and backed by the last result, the money on hand, and what changed this cycle.
              </p>
            </div>
            <div className="rounded-lg p-5" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
              <p className="serif text-[20px] font-semibold text-white leading-snug">What’s on your ballot?</p>
              <p className="text-[14px] text-white/60 mt-1 mb-4">Enter a Harris County address. You’ll get every race you vote in, in ballot order.</p>
              <AddressForm dark />
            </div>
          </div>

          <div className="mt-12">
            <div className="flex items-baseline justify-between gap-4 mb-4">
              <p className="label text-white/60"><span className="hidden sm:inline">The whole ballot, </span>one bar per race</p>
              <Link href="/races" className="text-[13px] font-semibold text-white/80 hover:text-white">Open the race board <span aria-hidden>→</span></Link>
            </div>
            <BallotStrip races={stripRaces} />
          </div>
        </div>
      </section>

      {/* ── THE MARQUEE ─────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 pt-12">
        <SectionHead title="Top of the ticket" note="Both seats are open for the first time in years" />
        <div className="grid md:grid-cols-2 gap-5">
          {marquee.map(r => <Marquee key={r.key} race={r} odds={odds[r.key]} />)}
        </div>
      </section>

      {/* ── RACES TO WATCH ──────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 pt-14">
        <SectionHead
          title="Races to watch"
          note={`${spell(tossups.length)} toss-up${tossups.length === 1 ? "" : "s"} and ${t.dLean + t.rLean} leaning races, closest first`}
          href="/races?view=competitive" cta={`All ${competitive.length} competitive races`} />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {watch.map(r => <RaceTile key={r.key} race={toLite(r, odds)} />)}
        </div>
      </section>

      {/* ── THE COUNTY IN 3D ─────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 pt-14">
        <SectionHead title="The county, precinct by precinct" note="Every 2024 precinct, raised by the votes it cast" href="/tools/heat-check" cta="Open the precinct map" />
        <County3DLoader />
      </section>

      {/* ── DESK + SIDEBAR ─────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 pt-14 grid lg:grid-cols-[1fr_360px] gap-12">
        <div>
          <SectionHead title="Latest from the desk" note={lastUpdate ? `Updated ${fmtDate(lastUpdate, { month: "long", day: "numeric" })}` : undefined} />
          <ol className="divide-y" style={{ borderColor: "var(--rule)" }}>
            {DESK_LOG.slice(0, 7).map((e, i) => {
              const race = races.find(r => r.key === e.race);
              return (
                <li key={i} className="py-4 grid grid-cols-[72px_1fr] gap-4" style={{ borderColor: "var(--rule)" }}>
                  <div>
                    <p className="label" style={{ color: "#6B726D" }}>{fmtDate(e.date)}</p>
                    <p className="label mt-1" style={{ color: e.kind === "rating" ? "var(--gold-ink)" : e.kind === "fix" ? "#962A20" : "#8A918C", fontSize: 10 }}>
                      {e.kind === "rating" ? "Rating" : e.kind === "money" ? "Money" : e.kind === "fix" ? "Correction" : "News"}
                    </p>
                  </div>
                  <div>
                    <Link href={raceHref(e.race)} className="serif text-[17px] font-semibold hover:underline decoration-1 underline-offset-4" style={{ color: "var(--ink)" }}>
                      {race?.office ?? e.race}
                    </Link>
                    {e.kind === "rating" && e.from && e.to && (
                      <span className="ml-2 inline-flex items-center gap-1.5 align-middle">
                        <RatingChip lean={e.from} className="opacity-60 line-through" />
                        <span aria-hidden style={{ color: "#8A918C" }}>→</span>
                        <RatingChip lean={e.to} />
                      </span>
                    )}
                    <p className="text-[15px] leading-relaxed mt-1" style={{ color: "#3C443F" }}>{e.headline}</p>
                    {e.source && <p className="text-[12px] mt-1" style={{ color: "#8A918C" }}>Source: {e.source}</p>}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <aside className="space-y-12">
          <div>
            <SectionHead title="Coming up" href="/tools/civic-calendar" cta="Calendar" />
            <ul className="space-y-0">
              {upcoming.map(e => {
                const days = Math.round((Date.parse(e.date + "T12:00:00Z") - Date.parse(today + "T12:00:00Z")) / 86_400_000);
                return (
                  <li key={e.id} className="grid grid-cols-[52px_1fr] gap-3 py-3 border-b" style={{ borderColor: "var(--rule)" }}>
                    <div className="text-center rounded-md py-1.5" style={{ background: e.category === "Elections" ? "var(--board)" : "var(--surface)", border: e.category === "Elections" ? "none" : "1px solid var(--rule)" }}>
                      <p className="label leading-none" style={{ fontSize: 10, color: e.category === "Elections" ? "var(--gold)" : "#6B726D" }}>{fmtDate(e.date, { month: "short" })}</p>
                      <p className="text-[20px] font-extrabold leading-tight num" style={{ color: e.category === "Elections" ? "#fff" : "var(--ink)" }}>{fmtDate(e.date, { day: "numeric" })}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold leading-snug" style={{ color: "var(--ink)" }}>{e.title.replace(/\. /g, ": ")}</p>
                      <p className="text-[12px] mt-0.5" style={{ color: "#6B726D" }}>
                        {days <= 0 ? "Happening now" : days === 1 ? "Tomorrow" : `In ${days} days`} · {e.category}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <SectionHead title="Biggest war chests" note="Cash on hand, November candidates" href="/tools/where-is-the-dough" cta="Money" />
            <ol>
              {warChests.map(({ c, race }, i) => (
                <li key={c.name} className="py-2.5 border-b" style={{ borderColor: "var(--rule)" }}>
                  <Link href={raceHref(race.key)} className="group grid grid-cols-[18px_1fr_auto] gap-3 items-baseline">
                    <span className="text-[12px] font-bold num" style={{ color: "#8A918C" }}>{i + 1}</span>
                    <span className="min-w-0">
                      <span className="text-[14px] font-semibold group-hover:underline" style={{ color: "var(--ink)" }}>{c.name}</span>
                      <span className="block text-[12px] truncate" style={{ color: "#6B726D" }}>{race.office}</span>
                      <span className="block mt-1 h-[3px] rounded-full" style={{ background: "#ECEDE8" }}>
                        <span className="block h-[3px] rounded-full" style={{ width: `${(c.finance!.cash / topCash) * 100}%`, background: PARTY[c.party].color }} />
                      </span>
                    </span>
                    <span className="text-[14px] font-bold num" style={{ color: "var(--ink)" }}>{fmt(c.finance!.cash)}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </section>

      {/* ── HEADLINES ──────────────────────────────────────────────── */}
      <Suspense fallback={null}>
        <Headlines />
      </Suspense>

      {/* ── USE THE DESK ───────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 pt-14 pb-20">
        <SectionHead title="Go deeper" href="/tools" cta="Every tool" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px rounded-lg overflow-hidden" style={{ background: "var(--rule)", border: "1px solid var(--rule)" }}>
          {[
            { href: "/tools/heat-check", k: "Maps", t: "How every precinct voted", d: "1,011 precincts, every general since 2012. Zoom to your block and see the swing." },
            { href: "/tools/where-is-the-dough", k: "Money", t: "Who has the cash", d: "Cash on hand, raised and spent for every official and challenger, from FEC and TEC filings." },
            { href: "/my-officials", k: "Government", t: "Who represents you", d: "Your address in, every official out: justice of the peace through U.S. Senate, with contacts." },
            { href: "/tools/districts", k: "Districts", t: "Portrait of a seat", d: "Vote history, demographics and the number of votes it takes to win any district." },
          ].map(x => (
            <Link key={x.href} href={x.href} className="group p-5 bg-white hover:bg-[#FAFAF8] transition-colors">
              <p className="label" style={{ color: "var(--brand)" }}>{x.k}</p>
              <p className="serif text-[19px] font-semibold mt-1.5 group-hover:underline decoration-1 underline-offset-4" style={{ color: "var(--ink)" }}>{x.t}</p>
              <p className="text-[14px] leading-relaxed mt-1.5" style={{ color: "#4F5752" }}>{x.d}</p>
            </Link>
          ))}
        </div>
        <p className="mt-6 text-[13px]" style={{ color: "#6B726D" }}>
          Ratings are the desk’s judgment, built from past results, registration, money and reported polling. <Link href="/methodology" className="link">How we rate races</Link>.
        </p>
      </section>
    </div>
  );
}

/* ── Pieces ──────────────────────────────────────────────────────────── */

function SectionHead({ title, note, href, cta }: { title: string; note?: string; href?: string; cta?: string }) {
  return (
    <div className="desk-head flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-4 mb-5">
      <div className="flex items-baseline gap-x-3 gap-y-1 flex-wrap">
        <h2 className="serif text-[24px] md:text-[26px] font-semibold tracking-[-0.01em]" style={{ color: "var(--ink)" }}>{title}</h2>
        {note && <p className="text-[13px]" style={{ color: "#6B726D" }}>{note}</p>}
      </div>
      {href && cta && (
        <Link href={href} className="shrink-0 text-[13px] font-bold whitespace-nowrap" style={{ color: "var(--brand)" }}>{cta} <span aria-hidden>→</span></Link>
      )}
    </div>
  );
}

function Marquee({ race, odds }: { race: Race; odds?: MarketOdds }) {
  const d = race.d, r = race.r;
  const m = race.lean ? RATING[race.lean] : null;
  return (
    <Link href={raceHref(race.key)} className="group card-depth block overflow-hidden"
      style={{ ["--tint" as string]: m?.tint ?? "#F1F2EE", ["--accent-line" as string]: m?.color ?? "#C9CCC4" }}>
      <div className="px-5 pt-4 pb-5">
        <div className="flex items-center justify-between">
          <p className="label" style={{ color: "#6B726D" }}>{race.tag} · {race.open ? "Open seat" : "Incumbent running"}</p>
          <RatingChip lean={race.lean} />
        </div>
        <h3 className="serif text-[26px] font-semibold mt-1 group-hover:underline decoration-1 underline-offset-4" style={{ color: "var(--ink)" }}>{race.office}</h3>
        <div className="grid grid-cols-2 gap-4 mt-5">
          {[d, r].map((c, i) => c && (
            <div key={c.name} className={`flex flex-col ${i === 1 ? "items-end text-right" : ""}`}>
              <span className="face-pop"><Face name={c.name} party={c.party} photo={c.photo} size={72} /></span>
              <p className="mt-3 text-[17px] font-bold leading-tight" style={{ color: "var(--ink)" }}>{c.name}</p>
              <p className="text-[12px] mt-0.5" style={{ color: PARTY[c.party].color }}>{c.party === "D" ? "Democrat" : "Republican"}</p>
            </div>
          ))}
        </div>
        {odds && d && r && (
          <div className="mt-4 rounded-md px-3 py-2.5" style={{ background: "rgba(255,255,255,0.75)", boxShadow: "inset 0 0 0 1px var(--rule)" }}>
            <MarketBar dName={d.name} rName={r.name} demProb={odds.demProb} openInterest={odds.openInterest} compact />
          </div>
        )}
        {race.stakes && <p className="mt-4 text-[15px] leading-relaxed" style={{ color: "#3C443F" }}>{race.stakes.split(". ").slice(0, 2).join(". ").replace(/\.?$/, ".")}</p>}
        <div className="mt-5 grid sm:grid-cols-2 gap-5">
          {(d?.finance || r?.finance) && (
            <div>
              <p className="label mb-2" style={{ color: "#6B726D" }}>Cash on hand</p>
              <CashDuel d={d?.finance?.cash ?? 0} r={r?.finance?.cash ?? 0} compact />
            </div>
          )}
          {race.last && (
            <div>
              <p className="label mb-2" style={{ color: "#6B726D" }}>{race.last.label}, {race.last.year}</p>
              <ResultBar dPct={race.last.dPct} rPct={race.last.rPct} compact />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

async function Headlines() {
  let data: Awaited<ReturnType<typeof getDashboardData>> | null = null;
  try { data = await getDashboardData(); } catch { return null; }
  const stories = [data.local && { k: "Harris County", s: data.local }, data.state && { k: "Texas", s: data.state }, data.federal && { k: "Washington", s: data.federal }]
    .filter(Boolean) as { k: string; s: NonNullable<typeof data.local> }[];
  if (!stories.length) return null;
  return (
    <section className="max-w-7xl mx-auto px-4 md:px-6 pt-14">
      <SectionHead title="Elsewhere in the news" note="Latest reporting, linked to the source" />
      <div className="grid md:grid-cols-3 gap-5">
        {stories.map(({ k, s }) => (
          <a key={s.link} href={s.link} target="_blank" rel="noopener noreferrer" className="group block">
            {s.image && (
              <div className="aspect-[16/9] rounded-md overflow-hidden mb-3" style={{ background: "#E4E6E0" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.image} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" />
              </div>
            )}
            <p className="label" style={{ color: "var(--brand)" }}>{k} · {s.source}</p>
            <p className="serif text-[18px] font-semibold leading-snug mt-1 group-hover:underline decoration-1 underline-offset-4" style={{ color: "var(--ink)" }}>{s.title}</p>
          </a>
        ))}
      </div>
    </section>
  );
}
