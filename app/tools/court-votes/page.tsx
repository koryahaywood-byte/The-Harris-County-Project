import type { Metadata } from "next";
import Link from "next/link";
import RelatedTools from "@/components/RelatedTools";
import courtVotes from "@/data/court-votes.json";

export const metadata: Metadata = {
  title: "The Vote Record · Commissioners Court · The Harris County Project",
  description:
    "How each Harris County commissioner votes on recorded items at Commissioners Court, meeting by meeting, with agreement rates between members. Archive-first: every vote stays.",
};

interface Vote {
  date: string;
  item: string;
  summary: string;
  result: string;
  tally: Record<string, string>;
  source?: string;
}
interface CourtVotesData {
  note: string;
  startedTracking: string;
  members: { name: string; seat: string; party: "D" | "R" }[];
  votes: Vote[];
}

const DATA = courtVotes as CourtVotesData;

const VOTE_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  yes:     { bg: "#dcfce7", color: "#15803d", label: "Yes" },
  no:      { bg: "#fee2e2", color: "#b91c1c", label: "No" },
  abstain: { bg: "#fef9c3", color: "#a16207", label: "Abstain" },
  absent:  { bg: "#f3f4f6", color: "#6b7280", label: "Absent" },
};

function agreementPairs(votes: Vote[], members: CourtVotesData["members"]) {
  const pairs: { a: string; b: string; agree: number; total: number }[] = [];
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      const a = members[i].name, b = members[j].name;
      let agree = 0, total = 0;
      for (const v of votes) {
        const va = v.tally[a], vb = v.tally[b];
        if ((va === "yes" || va === "no") && (vb === "yes" || vb === "no")) {
          total++;
          if (va === vb) agree++;
        }
      }
      if (total > 0) pairs.push({ a, b, agree, total });
    }
  }
  return pairs.sort((x, y) => x.agree / x.total - y.agree / y.total);
}

export default function CourtVotesPage() {
  const votes = [...DATA.votes].sort((a, b) => b.date.localeCompare(a.date));
  const pairs = agreementPairs(votes, DATA.members);
  const firstName = (full: string) => full.split(" ").slice(-1)[0];

  return (
    <div>
      {/* Hero */}
      <section className="bg-[var(--accent)] text-white px-6 py-16 md:py-24 relative overflow-hidden topo-dark">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_80%_50%,rgba(37,99,168,0.4),transparent)]" />
        <div className="max-w-4xl mx-auto relative z-10">
          <p className="text-sky-300/80 text-[11px] font-bold uppercase tracking-[0.25em] mb-3">Commissioners Court · Accountability</p>
          <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4" style={{ fontFamily: "var(--font-playfair), serif" }}>
            The Vote Record
          </h1>
          <p className="text-white/80 text-base leading-relaxed max-w-2xl">
            Five people control a $2 billion county budget. This ledger records how each one
            votes on every recorded item at Commissioners Court, and how often they vote
            together. Summaries paraphrase the agenda; every entry cites its item number.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Members */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-10">
          {DATA.members.map(m => (
            <div key={m.name} className="rounded-xl bg-white ring-1 ring-black/5 shadow-sm px-3 py-2.5 text-center">
              <p className="text-[12px] font-bold" style={{ color: m.party === "R" ? "#b91c1c" : "#1d4ed8" }}>{m.name}</p>
              <p className="text-[10px]" style={{ color: "#8a8578" }}>{m.seat}</p>
            </div>
          ))}
        </div>

        {votes.length === 0 ? (
          <div className="rounded-2xl bg-white ring-1 ring-black/5 shadow-sm px-6 py-10 text-center mb-10">
            <p className="text-lg font-bold mb-2" style={{ color: "var(--accent)", fontFamily: "var(--font-playfair), serif" }}>
              Tracking begins with the July 2026 sessions.
            </p>
            <p className="text-sm max-w-lg mx-auto leading-relaxed" style={{ color: "#6b7280" }}>
              We record votes going forward from official agenda action pages rather than
              reconstructing history we can&apos;t verify. Each Commissioners Court meeting adds
              its recorded votes here within a day, and the ledger only ever grows. Meeting
              summaries are already flowing at{" "}
              <Link href="/tools/harris-county-beat" className="underline font-semibold">the County Beat</Link>.
            </p>
          </div>
        ) : (
          <>
            {/* Agreement rates */}
            {pairs.length > 0 && (
              <section className="mb-10">
                <h2 className="text-lg font-bold mb-3" style={{ color: "var(--accent)", fontFamily: "var(--font-playfair), serif" }}>
                  Who votes together
                </h2>
                <div className="rounded-2xl bg-white ring-1 ring-black/5 shadow-sm overflow-hidden">
                  {pairs.map(p => (
                    <div key={`${p.a}-${p.b}`} className="px-4 py-2.5 border-b last:border-b-0 flex items-center gap-3" style={{ borderColor: "#f0ede7" }}>
                      <span className="text-[12px] font-semibold w-40 shrink-0" style={{ color: "var(--accent)" }}>
                        {firstName(p.a)} · {firstName(p.b)}
                      </span>
                      <div className="flex-1 h-1.5 rounded-full" style={{ background: "#f0ede7" }}>
                        <div className="h-1.5 rounded-full" style={{ width: `${(p.agree / p.total) * 100}%`, background: "var(--accent-light)" }} />
                      </div>
                      <span className="text-[11px] tabular-nums w-24 text-right" style={{ color: "#6b7280" }}>
                        {Math.round((p.agree / p.total) * 100)}% of {p.total}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Vote ledger */}
            <section className="mb-10">
              <h2 className="text-lg font-bold mb-3" style={{ color: "var(--accent)", fontFamily: "var(--font-playfair), serif" }}>
                {votes.length} recorded vote{votes.length !== 1 ? "s" : ""}
              </h2>
              <div className="space-y-3">
                {votes.map(v => (
                  <div key={`${v.date}-${v.item}`} className="rounded-2xl bg-white ring-1 ring-black/5 shadow-sm px-4 py-3.5">
                    <div className="flex items-baseline justify-between gap-3 mb-1">
                      <span className="text-[11px] font-bold" style={{ color: "#8a8578" }}>
                        {new Date(v.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · Item {v.item}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                        style={{ background: "#eef2f7", color: "var(--accent)" }}>{v.result}</span>
                    </div>
                    <p className="text-[13px] leading-snug mb-2" style={{ color: "var(--accent)" }}>{v.summary}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {DATA.members.map(m => {
                        const cast = (v.tally[m.name] ?? "absent").toLowerCase();
                        const s = VOTE_STYLE[cast] ?? VOTE_STYLE.absent;
                        return (
                          <span key={m.name} className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: s.bg, color: s.color }}>
                            {firstName(m.name)}: {s.label}
                          </span>
                        );
                      })}
                    </div>
                    {v.source && (
                      <a href={v.source} target="_blank" rel="noopener noreferrer" className="text-[10px] underline" style={{ color: "#9ca3af" }}>
                        Agenda source →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        <p className="text-[11px] leading-relaxed" style={{ color: "#9ca3af" }}>
          Recorded votes only: most agenda items pass on unanimous consent and aren&apos;t individually
          tallied. Source for every entry: the official agenda action pages at{" "}
          <a href="https://agenda.harriscountytx.gov" target="_blank" rel="noopener noreferrer" className="underline">agenda.harriscountytx.gov</a>.
          Tracking started {new Date(DATA.startedTracking + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}; the ledger is additive and nothing is ever removed.
        </p>

        <RelatedTools current="/tools/court-votes" />
      </div>
    </div>
  );
}
