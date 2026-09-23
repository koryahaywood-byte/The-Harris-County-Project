"use client";

// Your ballot: address → the exact races this voter sees on November 3, 2026,
// in ballot order, rated, with money. Doubles as a printable crib sheet
// (Texas lets voters bring written notes into the booth). Nothing is stored:
// the address is geocoded, matched to districts, and discarded.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { RaceLite } from "@/lib/races";
import type { RepEntry } from "@/lib/representatives";
import { RATING, PARTY, raceHref } from "@/lib/ratings";
import { fmt } from "@/lib/campaign-finance";
import { RatingChip } from "@/components/desk/Rating";
import RaceTile from "@/components/desk/RaceTile";
import BallotStrip from "@/components/desk/BallotStrip";
import AddressForm from "@/components/desk/AddressForm";
import Face from "@/components/desk/Face";

interface Districts { cd?: string; sd?: string; hd?: string; jp?: string; council?: string; pct?: string }
interface Lookup { matched: string; precinct: string; districts: Districts; officials: RepEntry[] }

const SECTIONS = ["Federal", "Statewide", "Texas Legislature", "District courts", "Harris County", "County courts", "Your precinct"] as const;
type Section = typeof SECTIONS[number];

/** Which races are on this voter's ballot, in Texas ballot order. */
function ballotFor(d: Districts, all: RaceLite[]): { race: RaceLite; section: Section }[] {
  const by = new Map(all.map(r => [r.key, r]));
  const keys = all.map(r => r.key);
  const n = (k: string) => parseInt(k.replace(/\D+/g, " ").trim().split(" ")[0] || "0", 10);
  const series = (p: string) => keys.filter(k => k.startsWith(p)).sort((a, b) => n(a) - n(b));
  const out: { race: RaceLite; section: Section }[] = [];
  const push = (k: string, s: Section) => { const r = by.get(k); if (r) out.push({ race: r, section: s }); };
  push("US-Senate", "Federal");
  if (d.cd) push(`CD-${d.cd}`, "Federal");
  for (const k of keys.filter(k => k.startsWith("TX-"))) push(k, "Statewide");
  if (d.sd) push(`SD-${d.sd}`, "Texas Legislature");
  if (d.hd) push(`HD-${d.hd}`, "Texas Legislature");
  for (const k of series("DC-")) push(k, "District courts");
  push("HC-Countywide", "Harris County");
  for (const k of keys.filter(k => k.startsWith("HC-") && k !== "HC-Countywide")) push(k, "Harris County");
  for (const k of [...series("CCL-"), ...series("Probate-")]) push(k, "County courts");
  if (d.pct) push(`PCT-${d.pct}`, "Your precinct");
  if (d.jp) for (const k of keys.filter(k => k.startsWith(`JP-${d.jp}-`))) push(k, "Your precinct");
  return out.sort((a, b) => SECTIONS.indexOf(a.section) - SECTIONS.indexOf(b.section));
}

export default function MyBallotClient({ races }: { races: RaceLite[] }) {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Lookup | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const address = sp.get("address") ?? "";
  const lat = sp.get("lat"), lng = sp.get("lng");

  const run = useCallback(async (params: string) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/my-officials?${params}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "That lookup didn't work. Check the address and try again."); setResult(null); return; }
      setResult({ matched: data.matched, precinct: data.precinct, districts: data.districts ?? {}, officials: data.officials ?? [] });
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    } catch {
      setError("The lookup service didn't respond. Check your connection and try again.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (address) run(`address=${encodeURIComponent(address)}`);
    else if (lat && lng) run(`lat=${lat}&lng=${lng}`);
  }, [address, lat, lng, run]);

  const ballot = useMemo(() => (result ? ballotFor(result.districts, races) : []), [result, races]);
  const inPlay = ballot.filter(b => b.race.lean && RATING[b.race.lean].competitive).map(b => b.race)
    .sort((a, b) => Math.abs(RATING[a.lean!].order - 4) - Math.abs(RATING[b.lean!].order - 4));
  const uncontested = ballot.filter(b => !b.race.d || !b.race.r).length;

  const d = result?.districts;
  const chips = d ? [
    d.cd && { label: `Congress ${d.cd}`, href: `/tools/districts?type=cd&district=${d.cd}` },
    d.sd && { label: `State Senate ${d.sd}`, href: `/tools/districts?type=sd&district=${d.sd}` },
    d.hd && { label: `State House ${d.hd}`, href: `/tools/districts?type=hd&district=${d.hd}` },
    d.pct && { label: `Commissioner Pct ${d.pct}`, href: `/tools/districts?type=pct&district=${d.pct}` },
    d.jp && { label: `JP Pct ${d.jp}`, href: `/tools/districts?type=jp&district=${d.jp}` },
    result && { label: `Voting precinct ${result.precinct}`, href: `/tools/precinct-lookup?precinct=${result.precinct}` },
  ].filter(Boolean) as { label: string; href: string }[] : [];

  return (
    <div>
      <style>{`
        .print-only { display: none; }
        @media print {
          body { background: #fff !important; }
          .print-only { display: block; }
          .ballot-sheet { border: none !important; }
          .ballot-sheet li { break-inside: avoid; }
        }
      `}</style>

      {/* ── Lookup ─────────────────────────────────────────────────── */}
      <header className="no-print border-b" style={{ background: "var(--surface)", borderColor: "var(--rule)" }}>
        <div className="max-w-5xl mx-auto px-4 md:px-6 pt-10 pb-9 grid md:grid-cols-[1fr_400px] gap-8 items-end">
          <div>
            <p className="label" style={{ color: "var(--brand)" }}>November 3, 2026 general election</p>
            <h1 className="serif text-[40px] md:text-[52px] leading-[1.03] tracking-[-0.02em] font-semibold mt-2" style={{ color: "var(--ink)" }}>Your ballot</h1>
            <p className="mt-3 text-[17px] leading-relaxed max-w-xl" style={{ color: "#3C443F" }}>
              Every race you vote in, in the order it appears, with the desk’s rating and each candidate’s cash.
              Print it and bring it to the booth: Texas allows written notes while you vote.
            </p>
          </div>
          <div>
            <AddressForm key={address} initial={address}
              onSubmit={a => router.replace(`${pathname}?address=${encodeURIComponent(a)}`, { scroll: false })} />
            {loading && <p className="mt-3 text-[14px]" style={{ color: "#4F5752" }} role="status">Finding your districts…</p>}
            {error && <p className="mt-3 text-[14px] font-semibold" style={{ color: "#962A20" }} role="alert">{error}</p>}
          </div>
        </div>
      </header>

      {/* ── Empty state ────────────────────────────────────────────── */}
      {!result && !loading && (
        <section className="max-w-5xl mx-auto px-4 md:px-6 py-12 no-print grid md:grid-cols-3 gap-8">
          {[
            ["Your races, not all 93", "Harris County's November ballot has 93 contests, but no one votes in all of them. Your address decides your congressional, legislative, commissioner and JP races."],
            ["Where your vote counts most", "Races rated toss-up or leaning are pulled to the top, so you know which contests on your ballot are genuinely in doubt."],
            ["Nothing is saved", "The address goes to the U.S. Census geocoder to find your precinct, then it's discarded. We keep no record of who looked up what."],
          ].map(([t, x]) => (
            <div key={t} className="desk-head-light">
              <p className="serif text-[19px] font-semibold" style={{ color: "var(--ink)" }}>{t}</p>
              <p className="text-[15px] leading-relaxed mt-2" style={{ color: "#4F5752" }}>{x}</p>
            </div>
          ))}
          <p className="md:col-span-3 text-[14px]" style={{ color: "#6B726D" }}>
            Not sure it works for you? <button className="link font-semibold" onClick={() => router.replace(`${pathname}?address=${encodeURIComponent("1001 Preston St, Houston, TX 77002")}`)}>Try the Harris County administration building</button>.
          </p>
        </section>
      )}

      {/* ── Results ───────────────────────────────────────────────── */}
      {result && (
        <div ref={resultsRef} className="scroll-mt-16">
          <section className="board no-print">
            <div className="max-w-5xl mx-auto px-4 md:px-6 py-9">
              <p className="label" style={{ color: "var(--gold)" }}>{result.matched}</p>
              <h2 className="serif text-[30px] md:text-[40px] leading-[1.08] font-semibold text-white mt-2">
                You vote in {ballot.length} races.{" "}
                <span style={{ color: "var(--gold)" }}>{inPlay.length === 0 ? "None are rated competitive." : `${inPlay.length} ${inPlay.length === 1 ? "is" : "are"} in play.`}</span>
              </h2>
              <p className="text-[15px] text-white/65 mt-2">
                {uncontested > 0 ? `${uncontested} have only one party on the ballot. ` : ""}Select any race for the full matchup.
              </p>
              <div className="mt-8">
                <BallotStrip height={48} races={[...ballot.map(b => b.race)]
                  .sort((a, b) => RATING[a.lean ?? "toss-up"].order - RATING[b.lean ?? "toss-up"].order)
                  .map(r => ({ key: r.key, tag: r.tag, office: r.office, lean: r.lean, d: r.d?.name, r: r.r?.name }))} />
              </div>
              <div className="flex flex-wrap gap-2 mt-8">
                {chips.map(c => (
                  <Link key={c.label} href={c.href} className="text-[13px] font-semibold px-3 py-1.5 rounded-full text-white/85 hover:text-white hover:bg-white/10 transition-colors"
                    style={{ border: "1px solid rgba(255,255,255,0.2)" }}>{c.label}</Link>
                ))}
              </div>
            </div>
          </section>

          <div className="max-w-5xl mx-auto px-4 md:px-6">
            {inPlay.length > 0 && (
              <section className="pt-10 no-print">
                <div className="desk-head flex items-baseline gap-3 mb-5">
                  <h2 className="serif text-[24px] font-semibold" style={{ color: "var(--ink)" }}>Where your vote counts most</h2>
                  <p className="text-[13px]" style={{ color: "#6B726D" }}>Rated toss-up or leaning</p>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {inPlay.slice(0, 6).map(r => <RaceTile key={r.key} race={r} />)}
                </div>
              </section>
            )}

            <section className="pt-12">
              <div className="desk-head flex items-baseline justify-between gap-3 mb-4 no-print">
                <h2 className="serif text-[24px] font-semibold" style={{ color: "var(--ink)" }}>Your full ballot</h2>
                <button onClick={() => window.print()} className="btn btn-ink !py-2 !text-[13px]">Print a crib sheet</button>
              </div>
              <div className="print-only mb-4">
                <p style={{ fontSize: 18, fontWeight: 700 }}>My ballot · November 3, 2026 · Harris County</p>
                <p style={{ fontSize: 12 }}>{result.matched} · Precinct {result.precinct}</p>
              </div>
              <div className="ballot-sheet panel overflow-hidden">
                {SECTIONS.map(section => {
                  const rows = ballot.filter(b => b.section === section);
                  if (!rows.length) return null;
                  return (
                    <div key={section}>
                      <p className="label px-4 py-2 border-b" style={{ background: "#F6F6F3", color: "#5B635E", borderColor: "var(--rule)" }}>{section}</p>
                      <ol>
                        {rows.map(({ race }) => <BallotLine key={race.key} r={race} />)}
                      </ol>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-[12px] leading-relaxed" style={{ color: "#8A918C" }}>
                Built from your districts and the {races.length} races the desk tracks. Order follows the Texas ballot. Your official sample ballot is at{" "}
                <a href="https://www.harrisvotes.com" target="_blank" rel="noopener noreferrer" className="link">HarrisVotes.com</a>.
              </p>
            </section>

            <section className="pt-12 no-print grid md:grid-cols-[1fr_320px] gap-10 pb-16">
              <div>
                <div className="desk-head flex items-baseline justify-between gap-3 mb-4">
                  <h2 className="serif text-[24px] font-semibold" style={{ color: "var(--ink)" }}>Who represents you now</h2>
                  <Link href={`/my-officials?address=${encodeURIComponent(result.matched)}`} className="text-[13px] font-bold" style={{ color: "var(--brand)" }}>Contacts and records <span aria-hidden>→</span></Link>
                </div>
                <ul className="grid sm:grid-cols-2 gap-x-6">
                  {result.officials.slice(0, 16).map(o => (
                    <li key={`${o.name}-${o.office}`} className="py-2.5 border-b flex items-center gap-3" style={{ borderColor: "var(--rule)" }}>
                      {o.party === "NP"
                        ? <span className="w-9 h-9 rounded-full bg-[#E4E6E0] shrink-0" aria-hidden />
                        : <Face name={o.name} party={o.party} photo={o.photo} size={36} />}
                      <div className="min-w-0">
                        {o.slug
                          ? <Link href={`/politicians/${o.slug}`} className="text-[14px] font-bold hover:underline" style={{ color: "var(--ink)" }}>{o.name}</Link>
                          : <p className="text-[14px] font-bold" style={{ color: "var(--ink)" }}>{o.name}</p>}
                        <p className="text-[12px] truncate" style={{ color: "#6B726D" }}>{o.office}{o.district && o.district !== "Texas" ? `, ${o.district}` : ""}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <aside className="panel p-5 self-start">
                <p className="serif text-[19px] font-semibold" style={{ color: "var(--ink)" }}>How to vote</p>
                <dl className="mt-3 space-y-3 text-[14px]">
                  {[
                    ["Register by", "Monday, Oct 5"],
                    ["Early voting", "Oct 19 to Oct 30"],
                    ["Mail ballot application due", "Friday, Oct 23"],
                    ["Election Day", "Tuesday, Nov 3, 7 a.m. to 7 p.m."],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 border-b pb-2" style={{ borderColor: "var(--rule)" }}>
                      <dt style={{ color: "#6B726D" }}>{k}</dt><dd className="font-semibold text-right" style={{ color: "var(--ink)" }}>{v}</dd>
                    </div>
                  ))}
                </dl>
                <p className="text-[13px] mt-3 leading-relaxed" style={{ color: "#4F5752" }}>
                  Harris County uses countywide vote centers: vote at any location.
                </p>
                <a href="https://www.harrisvotes.com/voting-locations" target="_blank" rel="noopener noreferrer" className="btn btn-gold w-full justify-center mt-4">Find a vote center <span aria-hidden>↗</span></a>
              </aside>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

function BallotLine({ r }: { r: RaceLite }) {
  const side = (s: RaceLite["d"], party: "D" | "R") => s ? (
    <span className="flex items-center gap-2 min-w-0">
      <span className="print-only w-3.5 h-3.5 rounded-full border border-black shrink-0" aria-hidden />
      <span className="w-2 h-2 rounded-full shrink-0 no-print" style={{ background: PARTY[party].color }} aria-hidden />
      <span className="text-[14px] font-semibold truncate" style={{ color: "var(--ink)" }}>{s.name}</span>
      {s.incumbent && <span className="label shrink-0" style={{ fontSize: 9, color: "#8A918C" }}>Inc.</span>}
      {s.cash > 0 && <span className="text-[12px] num shrink-0 no-print" style={{ color: "#8A918C" }}>{fmt(s.cash)}</span>}
    </span>
  ) : <span className="text-[13px] italic" style={{ color: "#A7ADA8" }}>No {party === "D" ? "Democrat" : "Republican"}</span>;

  return (
    <li className="border-b last:border-b-0" style={{ borderColor: "var(--rule)" }}>
      <Link href={raceHref(r.key)} className="group grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)_104px] gap-x-4 gap-y-1.5 items-center px-4 py-3 hover:bg-[#FAFAF7]">
        <span className="min-w-0 flex items-center justify-between gap-3">
          <span className="text-[15px] font-bold leading-snug group-hover:underline" style={{ color: "var(--ink)" }}>{r.office}</span>
          <span className="md:hidden"><RatingChip lean={r.lean} /></span>
        </span>
        {side(r.d, "D")}
        {side(r.r, "R")}
        <span className="hidden md:flex justify-end"><RatingChip lean={r.lean} /></span>
      </Link>
    </li>
  );
}
