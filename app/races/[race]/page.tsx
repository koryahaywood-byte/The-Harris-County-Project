import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllRaces, getRaceBySlug, byCompetitiveness, toLite, GROUPS, type Candidate, type Race } from "@/lib/races";
import { RATING, PARTY, raceHref } from "@/lib/ratings";
import { entriesFor } from "@/lib/desk-log";
import { fmt, formatAsOf } from "@/lib/campaign-finance";
import { RatingChip, RatingScale } from "@/components/desk/Rating";
import { CashDuel, ResultBar } from "@/components/desk/Bars";
import Face from "@/components/desk/Face";
import RaceTile from "@/components/desk/RaceTile";
import AddressForm from "@/components/desk/AddressForm";
import CopyLink from "@/components/desk/CopyLink";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllRaces().map(r => ({ race: r.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ race: string }> }): Promise<Metadata> {
  const { race: slug } = await params;
  const r = getRaceBySlug(slug);
  if (!r) return {};
  const who = [r.d?.name, r.r?.name].filter(Boolean).join(" vs. ");
  const rating = r.lean ? RATING[r.lean].long : "Unrated";
  const desc = `${who || r.office}. Rated ${rating}. ${r.stakes ?? ""}`.trim().slice(0, 300);
  const og = new URLSearchParams({ tool: r.office, section: `${r.tag} · Nov 3, 2026`, desc: r.stakes ?? desc });
  if (r.lean) og.set("badge", RATING[r.lean].label);
  if (r.d && r.r && (r.d.finance?.cash || r.r.finance?.cash)) og.set("duel", `${r.d.name}|${r.d.finance?.cash ?? 0}|${r.r.name}|${r.r.finance?.cash ?? 0}`);
  if (r.last && !r.last.proxy) og.set("bar", `D ${r.last.year}|${r.last.dPct}|R ${r.last.year}|${r.last.rPct}`);
  return {
    title: `${r.office}: ${who || "2026"} · The Harris County Project`,
    description: desc,
    openGraph: { title: `${r.office}: ${rating}`, description: desc, images: [{ url: `/api/og?${og}`, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image" },
  };
}

const fmtDate = (iso: string) => new Date(iso + "T12:00:00Z").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

/** Split the desk's long detail note into readable paragraphs of ~2 sentences.
 *  Never drops text: splits only at sentence ends, and re-joins pieces that end
 *  in a known abbreviation ("Aug.", "U.S.", "Gov.") so dates stay whole. */
const ABBREV = /\b(?:Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec|Gov|Lt|Rep|Sen|St|No|Nos|vs|Mr|Mrs|Ms|Dr|Jr|Sr|Inc|Co|Pct|U\.S|D\.C|a\.m|p\.m)\.$/;
function paragraphs(text?: string): string[] {
  if (!text) return [];
  const pieces = text.split(/(?<=[.!?])\s+(?=[A-Z0-9"'(])/);
  const sentences: string[] = [];
  for (const p of pieces) {
    const prev = sentences[sentences.length - 1];
    if (prev && (ABBREV.test(prev) || /\b[A-Z]\.$/.test(prev))) sentences[sentences.length - 1] = `${prev} ${p}`;
    else sentences.push(p);
  }
  const out: string[] = [];
  let buf = "";
  for (const s of sentences) {
    buf = buf ? `${buf} ${s}` : s;
    if (buf.length > 220) { out.push(buf); buf = ""; }
  }
  if (buf) out.push(buf);
  return out;
}

export default async function RacePage({ params }: { params: Promise<{ race: string }> }) {
  const { race: slug } = await params;
  const race = getRaceBySlug(slug);
  if (!race) notFound();

  const group = GROUPS.find(g => g.id === race.group)!;
  const m = race.lean ? RATING[race.lean] : null;
  const log = entriesFor(race.key);
  const related = getAllRaces().filter(r => r.group === race.group && r.key !== race.key).sort(byCompetitiveness).slice(0, 3);
  const dCash = race.d?.finance?.cash ?? 0, rCash = race.r?.finance?.cash ?? 0;
  const holderName = race.holder === "D" ? race.d?.name : race.holder === "R" ? race.r?.name : null;

  return (
    <article>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header style={{ background: "var(--surface)", borderBottom: "1px solid var(--rule)" }}>
        <div className="max-w-6xl mx-auto px-4 md:px-6 pt-6 pb-8">
          <nav className="text-[13px] flex items-center gap-2" aria-label="Breadcrumb" style={{ color: "#6B726D" }}>
            <Link href="/races" className="hover:underline">Races</Link>
            <span aria-hidden>/</span>
            <Link href={`/races?level=${race.group}`} className="hover:underline">{group.label}</Link>
          </nav>
          <div className="mt-6 grid md:grid-cols-[1fr_300px] gap-8 items-end">
            <div>
              <p className="label" style={{ color: "var(--brand)" }}>{race.tag} · {race.open ? "Open seat" : `Incumbent: ${holderName}`}</p>
              <h1 className="serif text-[36px] md:text-[50px] leading-[1.04] tracking-[-0.02em] font-semibold mt-2" style={{ color: "var(--ink)" }}>
                {race.office}
              </h1>
              {race.stakes && (
                <p className="mt-4 text-[18px] md:text-[19px] leading-relaxed max-w-3xl" style={{ color: "#2F3632" }}>{race.stakes}</p>
              )}
            </div>
            <div className="rounded-lg p-4" style={{ background: m ? m.tint : "#F1F2EE" }}>
              <p className="label" style={{ color: "#4F5752" }}>The desk’s rating</p>
              <p className="serif text-[28px] font-semibold leading-tight mt-1 mb-4" style={{ color: "var(--ink)" }}>{m ? m.long : "Not rated"}</p>
              <RatingScale lean={race.lean} />
            </div>
          </div>
        </div>
      </header>

      {/* ── The matchup ────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 pt-8">
        <div className="grid md:grid-cols-2 gap-4 relative">
          <CandidateCard c={race.d} party="D" status={race.status} />
          <CandidateCard c={race.r} party="R" status={race.status} />
          <span className="hidden md:flex absolute left-1/2 top-12 -translate-x-1/2 w-10 h-10 rounded-full items-center justify-center label"
            style={{ background: "var(--paper)", border: "1px solid var(--rule)", color: "#6B726D" }} aria-hidden>vs</span>
        </div>
      </section>

      {/* ── Body ───────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 pt-10 pb-6 grid lg:grid-cols-[1fr_340px] gap-10">
        <div>
          {(dCash > 0 || rCash > 0) && race.d && race.r && (
            <div className="mb-10">
              <h2 className="desk-head serif text-[22px] font-semibold mb-4" style={{ color: "var(--ink)" }}>Money</h2>
              <CashDuel d={dCash} r={rCash} dName={race.d.name} rName={race.r.name} />
              <p className="text-[12px] mt-3" style={{ color: "#8A918C" }}>
                Cash on hand as reported in each campaign’s latest filing{asOfNote(race)}. <Link href={`/tools/where-is-the-dough?q=${encodeURIComponent(race.d.name)}`} className="link">Full finance records</Link>
              </p>
            </div>
          )}

          <h2 className="desk-head serif text-[22px] font-semibold mb-3" style={{ color: "var(--ink)" }}>The desk’s notes</h2>
          <div className="space-y-4 text-[16px] leading-[1.7]" style={{ color: "#2F3632" }}>
            {paragraphs(race.detail).map((p, i) => <p key={i}>{p}</p>)}
            {!race.detail && <p style={{ color: "#6B726D" }}>No reporting on file for this race yet.</p>}
          </div>

          {log.length > 0 && (
            <div className="mt-10">
              <h2 className="desk-head serif text-[22px] font-semibold mb-2" style={{ color: "var(--ink)" }}>What changed</h2>
              <ol>
                {log.map((e, i) => (
                  <li key={i} className="py-3 border-b grid grid-cols-[110px_1fr] gap-4" style={{ borderColor: "var(--rule)" }}>
                    <p className="label pt-0.5" style={{ color: "#6B726D" }}>{fmtDate(e.date).replace(", 2026", "")}</p>
                    <div>
                      {e.kind === "rating" && e.from && e.to && (
                        <p className="flex items-center gap-1.5 mb-1"><RatingChip lean={e.from} className="opacity-60 line-through" /><span aria-hidden>→</span><RatingChip lean={e.to} /></p>
                      )}
                      <p className="text-[15px] leading-relaxed" style={{ color: "#2F3632" }}>{e.headline}</p>
                      {e.source && <p className="text-[12px] mt-0.5" style={{ color: "#8A918C" }}>Source: {e.source}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        <aside className="space-y-6">
          {race.last && (
            <div className="panel p-5">
              <p className="label" style={{ color: "#6B726D" }}>{race.last.proxy ? "Partisan baseline" : "Last time"}</p>
              <p className="serif text-[18px] font-semibold mt-1 mb-4" style={{ color: "var(--ink)" }}>
                {race.last.label}, {race.last.year}
              </p>
              <ResultBar dPct={race.last.dPct} rPct={race.last.rPct}
                caption={race.last.proxy
                  ? "No same-office result on file, so this shows the county's partisan baseline, not this race."
                  : `${race.last.dVotes.toLocaleString()} D votes to ${race.last.rVotes.toLocaleString()} R, two-party share.`} />
              {race.districtHref && (
                <Link href={race.districtHref} className="mt-4 inline-block text-[13px] font-bold" style={{ color: "var(--brand)" }}>
                  Precinct results and demographics <span aria-hidden>→</span>
                </Link>
              )}
            </div>
          )}

          <div className="panel p-5">
            <p className="serif text-[18px] font-semibold" style={{ color: "var(--ink)" }}>Is this race on your ballot?</p>
            <p className="text-[13px] mt-1 mb-3" style={{ color: "#6B726D" }}>Enter your address to see every race you vote in.</p>
            <AddressForm />
          </div>

          <div className="panel p-5">
            <p className="label mb-2" style={{ color: "#6B726D" }}>Share this race</p>
            <CopyLink />
            <p className="text-[12px] mt-3" style={{ color: "#8A918C" }}>
              Spot an error? <Link href="/contact" className="link">Tell the desk</Link>. Ratings follow our <Link href="/methodology" className="link">published method</Link>.
            </p>
          </div>
        </aside>
      </section>

      {related.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 md:px-6 pt-6 pb-16">
          <div className="desk-head flex items-baseline justify-between mb-5">
            <h2 className="serif text-[22px] font-semibold" style={{ color: "var(--ink)" }}>More in {group.label}</h2>
            <Link href={`/races?level=${race.group}`} className="text-[13px] font-bold" style={{ color: "var(--brand)" }}>All {group.label.toLowerCase()} races <span aria-hidden>→</span></Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {related.map(r => <RaceTile key={r.key} race={toLite(r)} />)}
          </div>
        </section>
      )}
    </article>
  );
}

function asOfNote(race: Race): string {
  const dates = [formatAsOf(race.d?.finance?.asOf), formatAsOf(race.r?.finance?.asOf)].filter(Boolean);
  if (!dates.length) return "";
  const uniq = [...new Set(dates)];
  return ` (as of ${uniq.join(" and ")})`;
}

function CandidateCard({ c, party, status }: { c: Candidate | null; party: "D" | "R"; status: Race["status"] }) {
  const p = PARTY[party];
  if (!c) {
    return (
      <div className="panel p-6 flex flex-col justify-center min-h-[180px]" style={{ borderTop: `4px solid ${p.soft}` }}>
        <p className="label" style={{ color: p.color }}>{p.name}</p>
        <p className="serif text-[22px] font-semibold mt-2" style={{ color: "#6B726D" }}>
          {status === "set" ? `No ${p.name.toLowerCase()} filed` : "Nominee not yet set"}
        </p>
        <p className="text-[14px] mt-1" style={{ color: "#8A918C" }}>
          {status === "set" ? "This seat is uncontested on the November ballot." : "The party has not settled a nominee for November."}
        </p>
      </div>
    );
  }
  const f = c.finance;
  return (
    <div className="panel p-5 md:p-6" style={{ borderTop: `4px solid ${p.color}` }}>
      <div className="flex items-start gap-4">
        <Face name={c.name} party={party} photo={c.photo} size={76} />
        <div className="min-w-0 pt-1">
          <p className="label" style={{ color: p.color }}>{p.name}{c.incumbent ? " · Incumbent" : ""}</p>
          <p className="serif text-[26px] font-semibold leading-tight mt-1" style={{ color: "var(--ink)" }}>{c.name}</p>
          {c.note && <p className="text-[14px] mt-1.5 leading-snug" style={{ color: "#4F5752" }}>{c.note}</p>}
        </div>
      </div>
      <dl className="grid grid-cols-3 gap-px mt-5 rounded-md overflow-hidden" style={{ background: "var(--rule)", border: "1px solid var(--rule)" }}>
        {[
          ["Cash on hand", f?.cash],
          ["Raised", f?.raised],
          ["Spent", f?.spent],
        ].map(([k, v]) => (
          <div key={k as string} className="bg-white px-3 py-2.5">
            <dt className="label" style={{ color: "#7C837E", fontSize: 10 }}>{k}</dt>
            <dd className="text-[18px] font-extrabold num mt-0.5" style={{ color: typeof v === "number" && v > 0 ? "var(--ink)" : "#A7ADA8" }}>
              {typeof v === "number" && v > 0 ? fmt(v) : "None"}
            </dd>
          </div>
        ))}
      </dl>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
        {formatAsOf(f?.asOf) && <span style={{ color: "#8A918C" }}>Filing as of {formatAsOf(f?.asOf)}</span>}
        {f?.filingUrl && <a href={f.filingUrl} target="_blank" rel="noopener noreferrer" className="font-semibold" style={{ color: "var(--brand)" }}>Source filing <span aria-hidden>↗</span></a>}
        {c.slug && <Link href={`/politicians/${c.slug}`} className="font-semibold" style={{ color: "var(--brand)" }}>Record and profile <span aria-hidden>→</span></Link>}
      </div>
    </div>
  );
}
