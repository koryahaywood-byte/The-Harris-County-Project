"use client";

// Who Gave: the donor graph, but askable. Type a name or employer and see
// every tracked official that donor funds. Data: public/data/donor-network.json
// (FEC Schedule A + TEC nightly bulk, built by the donor-network pipeline).

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import RelatedTools from "@/components/RelatedTools";

interface DonorRecipient { official: string; amount: number }
interface Donor { name: string; employer?: string; total: number; recipients: DonorRecipient[] }
interface DonorNetwork {
  builtAt: string;
  coverage: string;
  officials: { name: string; office: string; party: "D" | "R" }[];
  donors: Donor[];
  sharedCount: number;
}

const money = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : n >= 1000 ? `$${Math.round(n / 1000)}K` : `$${n}`;

export default function DonorSearchClient() {
  const [data, setData] = useState<DonorNetwork | null>(null);
  const [failed, setFailed] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch("/data/donor-network.json")
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setData)
      .catch(() => setFailed(true));
  }, []);

  const partyOf = useMemo(() => {
    const m = new Map<string, "D" | "R">();
    data?.officials.forEach(o => m.set(o.name, o.party));
    return m;
  }, [data]);

  const results = useMemo(() => {
    if (!data) return [];
    const needle = q.trim().toLowerCase();
    const pool = needle
      ? data.donors.filter(d =>
          d.name.toLowerCase().includes(needle) || (d.employer ?? "").toLowerCase().includes(needle))
      : data.donors;
    return [...pool].sort((a, b) => b.total - a.total).slice(0, 50);
  }, [data, q]);

  return (
    <div>
      {/* Hero */}
      <section className="bg-[var(--accent)] text-white px-6 py-16 md:py-24 relative overflow-hidden topo-dark">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_80%_50%,rgba(37,99,168,0.4),transparent)]" />
        <div className="max-w-3xl mx-auto relative z-10">
          <p className="text-sky-300/80 text-[11px] font-bold uppercase tracking-[0.25em] mb-3">Campaign Finance</p>
          <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4" style={{ fontFamily: "var(--font-playfair), serif" }}>
            Who gave. To whom. How much.
          </h1>
          <p className="text-white/80 text-base leading-relaxed max-w-xl mb-8">
            Search the top donors behind Harris County officials by name or employer.
            Every dollar shown comes from itemized FEC and Texas Ethics Commission filings.
          </p>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Try a PAC, a law firm, or a last name"
            className="w-full max-w-xl rounded-full px-5 py-3 text-sm text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300"
            aria-label="Search donors by name or employer"
          />
          {data && (
            <p className="mt-3 text-[12px] text-sky-200/80">
              {data.donors.length.toLocaleString()} donors · {data.sharedCount} give to more than one official · built {new Date(data.builtAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          )}
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {failed && (
          <p className="text-sm" style={{ color: "#b91c1c" }}>
            Couldn&apos;t load the donor dataset. Refresh to try again.
          </p>
        )}
        {!data && !failed && <p className="text-sm" style={{ color: "#8a8578" }}>Loading the donor network…</p>}

        {data && (
          <>
            <p className="text-[12px] mb-4" style={{ color: "#8a8578" }}>
              {q.trim() ? `${results.length === 50 ? "Top 50 matches" : `${results.length} match${results.length === 1 ? "" : "es"}`} for "${q.trim()}"` : "Top 50 donors by total given"}
            </p>
            <div className="space-y-3">
              {results.map(d => (
                <div key={`${d.name}-${d.total}`} className="rounded-2xl bg-white ring-1 ring-black/5 shadow-sm px-4 py-3.5 card-lift">
                  <div className="flex items-baseline justify-between gap-3 mb-1">
                    <h3 className="text-[14px] font-bold truncate" style={{ color: "var(--accent)" }}>{d.name}</h3>
                    <span className="text-[13px] font-bold tabular-nums shrink-0" style={{ color: "var(--accent)" }}>{money(d.total)}</span>
                  </div>
                  {d.employer && d.employer.toLowerCase() !== d.name.toLowerCase() && (
                    <p className="text-[11px] mb-1.5" style={{ color: "#8a8578" }}>{d.employer}</p>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {[...d.recipients].sort((a, b) => b.amount - a.amount).map(r => {
                      const party = partyOf.get(r.official);
                      return (
                        <Link key={r.official} href={`/tools/where-is-the-dough?q=${encodeURIComponent(r.official)}`}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full hover:opacity-80 transition"
                          style={{
                            background: party === "R" ? "#fdecec" : "#e7f0fe",
                            color: party === "R" ? "#b91c1c" : "#1d4ed8",
                          }}>
                          {r.official} · {money(r.amount)}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
              {q.trim() && results.length === 0 && (
                <p className="text-sm" style={{ color: "#8a8578" }}>
                  No donor matches. The dataset covers itemized gifts of $100+ to the {data.officials.length} officials
                  with the largest war chests; smaller or unitemized gifts don&apos;t appear.
                </p>
              )}
            </div>

            <p className="mt-8 text-[11px] leading-relaxed" style={{ color: "#9ca3af" }}>
              Coverage: {data.coverage} Recipient chips link to each official&apos;s entry on{" "}
              <Link href="/tools/where-is-the-dough" className="underline">Where the Money Resides</Link>.
              For the full web of shared donors, see{" "}
              <Link href="/tools/the-network" className="underline">The Network</Link>.
            </p>
          </>
        )}

        <RelatedTools current="/tools/donor-search" />
      </div>
    </div>
  );
}
