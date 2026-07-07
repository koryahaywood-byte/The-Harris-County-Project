"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────
interface VoterRecord {
  vuid: string;
  last_name: string;
  first_name: string;
  middle_name?: string;
  dob_year?: number;
  gender?: string;
  address_street?: string;
  address_city?: string;
  address_zip?: string;
  precinct_number?: string;
  estimated_race?: string;
}

interface HistoryEntry {
  election_code: string;
  election_label: string;
  election_date: string;
  voted: boolean;
  method?: string | null;
}

interface SearchResult {
  status: "ok" | "no_data";
  total?: number;
  page?: number;
  pages?: number;
  voters?: VoterRecord[];
}

interface DetailResult {
  status: "ok" | "no_data";
  voter?: VoterRecord;
  history?: HistoryEntry[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const RACE_LABELS: Record<string, string> = {
  white: "White",
  black: "Black / African American",
  hispanic: "Hispanic / Latino",
  asian: "Asian / Pacific Islander",
  other: "Other / Unknown",
};

const METHOD_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  MAIL:         { label: "Mail-in",      color: "#6d28d9", bg: "#ede9fe" },
  EARLY:        { label: "Early",        color: "#0369a1", bg: "#e0f2fe" },
  ELECTION_DAY: { label: "Election Day", color: "#065f46", bg: "#d1fae5" },
};

function genderLabel(g?: string) {
  if (!g) return "Unknown";
  return g === "M" ? "Male" : g === "F" ? "Female" : g;
}

function paddedPrec(p?: string) {
  if (!p) return "–";
  return p.padStart(4, "0");
}

// ── Sub-components ────────────────────────────────────────────────────────────
function MethodChip({ method }: { method?: string | null }) {
  if (!method) return null;
  const m = METHOD_LABELS[method] ?? { label: method, color: "#374151", bg: "#f3f4f6" };
  return (
    <span className="text-[9px] font-bold uppercase tracking-[0.12em] px-2 py-0.5 rounded-full"
      style={{ color: m.color, background: m.bg }}>
      {m.label}
    </span>
  );
}

function VoterCard({ voter, onClick }: { voter: VoterRecord; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="w-full text-left rounded-xl p-4 transition-all card-lift"
      style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black truncate" style={{ color: "#111827" }}>
            {voter.last_name}, {voter.first_name}{voter.middle_name ? ` ${voter.middle_name[0]}.` : ""}
          </p>
          <p className="text-[11px] mt-0.5 truncate" style={{ color: "#6b7280" }}>
            {voter.address_street && `${voter.address_street}, `}{voter.address_city ?? "Houston"}{voter.address_zip ? ` ${voter.address_zip}` : ""}
          </p>
        </div>
        <div className="flex-shrink-0 text-right">
          <p className="text-[10px] font-bold" style={{ color: "var(--accent)" }}>
            Precinct {paddedPrec(voter.precinct_number)}
          </p>
          {voter.dob_year && (
            <p className="text-[10px]" style={{ color: "#9ca3af" }}>
              b. {voter.dob_year}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2">
        {voter.gender && (
          <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: "#f3f4f6", color: "#374151" }}>
            {genderLabel(voter.gender)}
          </span>
        )}
        {voter.estimated_race && (
          <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: "#f3f4f6", color: "#374151" }}>
            {RACE_LABELS[voter.estimated_race] ?? voter.estimated_race}
          </span>
        )}
        <span className="ml-auto text-[10px] font-semibold" style={{ color: "#9ca3af" }}>
          View history →
        </span>
      </div>
    </button>
  );
}

function ElectionTimeline({ history }: { history: HistoryEntry[] }) {
  const sorted = [...history].sort((a, b) =>
    new Date(b.election_date).getTime() - new Date(a.election_date).getTime()
  );

  const participated = sorted.filter(h => h.voted).length;
  const pct = sorted.length ? Math.round((participated / sorted.length) * 100) : 0;

  return (
    <div>
      {/* Participation summary */}
      <div className="flex items-center gap-4 mb-4 p-3 rounded-xl"
        style={{ background: "rgba(37,99,168,0.06)", border: "1px solid rgba(37,99,168,0.12)" }}>
        <div>
          <p className="text-2xl font-black" style={{ color: "var(--accent)" }}>{pct}%</p>
          <p className="text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: "#6b7280" }}>
            participation
          </p>
        </div>
        <div className="flex-1">
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "#e5e7eb" }}>
            <div className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, background: pct >= 75 ? "#059669" : pct >= 50 ? "#2563a8" : "#f59e0b" }} />
          </div>
          <p className="text-[10px] mt-1" style={{ color: "#9ca3af" }}>
            Voted in {participated} of {sorted.length} elections on record
          </p>
        </div>
      </div>

      {/* Election list */}
      <div className="relative pl-5">
        <div className="absolute left-2 top-0 bottom-0 w-px" style={{ background: "rgba(0,0,0,0.08)" }} />
        <div className="flex flex-col gap-3">
          {sorted.map((h, i) => (
            <div key={i} className="relative">
              {/* Timeline dot */}
              <div className="absolute -left-5 top-3 w-2.5 h-2.5 rounded-full border-2 border-white"
                style={{
                  background: h.voted
                    ? (h.method === "MAIL" ? "#7c3aed" : h.method === "EARLY" ? "#0369a1" : "#059669")
                    : "#e5e7eb",
                  boxShadow: h.voted ? "0 0 0 1px rgba(0,0,0,0.12)" : "none",
                }} />

              <div className="rounded-lg p-3"
                style={{
                  background: h.voted ? "#fff" : "rgba(0,0,0,0.02)",
                  border: `1px solid ${h.voted ? "rgba(0,0,0,0.08)" : "rgba(0,0,0,0.04)"}`,
                  opacity: h.voted ? 1 : 0.55,
                }}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-bold" style={{ color: h.voted ? "#111827" : "#6b7280" }}>
                    {h.election_label}
                  </p>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {h.voted ? (
                      <MethodChip method={h.method} />
                    ) : (
                      <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: "#f3f4f6", color: "#9ca3af" }}>
                        Did not vote
                      </span>
                    )}
                  </div>
                </div>
                {h.election_date && (
                  <p className="text-[9px] mt-0.5" style={{ color: "#9ca3af" }}>
                    {new Date(h.election_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function VoterSearch() {
  const [last, setLast] = useState("");
  const [first, setFirst] = useState("");
  const [precinct, setPrecinct] = useState("");

  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [searched, setSearched] = useState(false);

  const [selected, setSelected] = useState<VoterRecord | null>(null);
  const [detail, setDetail] = useState<DetailResult | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!last.trim()) return;
    setSearching(true);
    setSelected(null);
    setDetail(null);
    setSearched(true);
    try {
      const res = await fetch("/api/voter-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ last: last.trim(), first: first.trim() || undefined, precinct: precinct.trim() || undefined }),
      });
      setResult(await res.json());
    } catch {
      setResult(null);
    } finally {
      setSearching(false);
    }
  }, [last, first, precinct]);

  const handleSelectVoter = useCallback(async (voter: VoterRecord) => {
    setSelected(voter);
    setLoadingDetail(true);
    setDetail(null);
    try {
      const res = await fetch(`/api/voter/${voter.vuid}`);
      setDetail(await res.json());
    } catch {
      setDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const noData = result?.status === "no_data";
  const hasResults = result?.status === "ok" && (result.voters?.length ?? 0) > 0;
  const noResults = result?.status === "ok" && (result.voters?.length ?? 0) === 0;

  return (
    <div className="topo-light min-h-screen" style={{ background: "var(--background)", fontFamily: "var(--font-outfit, sans-serif)" }}>
      <div className="max-w-4xl mx-auto px-5 py-12">

        {/* Header */}
        <div className="mb-8">
          <div className="mb-4 rounded-xl px-4 py-3 text-[11px] leading-relaxed"
            style={{ background: "rgba(180,83,9,0.08)", border: "1px solid rgba(180,83,9,0.25)", color: "#92400e" }}>
            <strong>Private research tool.</strong> Voter rolls are public records under TX Election
            Code §18.008, but this search is intentionally unlisted and blocked from search engines:
            it exists for the project&apos;s own research, not as a public lookup service.
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] mb-2" style={{ color: "var(--accent)" }}>
            Harris County Project
          </p>
          <h1 className="text-3xl font-black mb-2" style={{ color: "var(--accent)", fontFamily: "var(--font-playfair, serif)" }}>
            Voter Search
          </h1>
          <p className="text-sm" style={{ color: "#6b7280" }}>
            Search Harris County registered voters by name. View their complete election participation history, estimated demographics, and precinct context.
          </p>
        </div>

        {/* Data status notice */}
        {!searched && (
          <div className="rounded-xl p-4 mb-6 flex items-start gap-3"
            style={{ background: "rgba(37,99,168,0.06)", border: "1px solid rgba(37,99,168,0.15)" }}>
            <svg width="16" height="16" fill="none" stroke="#2563a8" strokeWidth="1.5" viewBox="0 0 24 24" className="flex-shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div>
              <p className="text-xs font-bold mb-0.5" style={{ color: "#1a3a5c" }}>Voter roll pending import</p>
              <p className="text-xs leading-relaxed" style={{ color: "#6b7280" }}>
                Harris County voter registration data is not yet loaded. The tool is ready. Once the roll is imported, searches go live instantly.
              </p>
            </div>
          </div>
        )}

        {/* Search form */}
        <form onSubmit={handleSearch}
          className="rounded-2xl p-5 mb-8"
          style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="block text-[9px] font-black uppercase tracking-[0.16em] mb-1.5" style={{ color: "#6b7280" }}>
                Last Name *
              </label>
              <input
                type="text"
                value={last}
                onChange={e => setLast(e.target.value)}
                placeholder="e.g. Williams"
                className="w-full px-3 py-2.5 rounded-lg text-sm font-semibold"
                style={{ border: "1.5px solid rgba(0,0,0,0.12)", outline: "none", background: "#fafafa" }}
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-[9px] font-black uppercase tracking-[0.16em] mb-1.5" style={{ color: "#6b7280" }}>
                First Name
              </label>
              <input
                type="text"
                value={first}
                onChange={e => setFirst(e.target.value)}
                placeholder="Optional"
                className="w-full px-3 py-2.5 rounded-lg text-sm font-semibold"
                style={{ border: "1.5px solid rgba(0,0,0,0.12)", outline: "none", background: "#fafafa" }}
              />
            </div>
            <div className="w-32">
              <label className="block text-[9px] font-black uppercase tracking-[0.16em] mb-1.5" style={{ color: "#6b7280" }}>
                Precinct
              </label>
              <input
                type="text"
                value={precinct}
                onChange={e => setPrecinct(e.target.value)}
                placeholder="e.g. 0555"
                className="w-full px-3 py-2.5 rounded-lg text-sm font-semibold"
                style={{ border: "1.5px solid rgba(0,0,0,0.12)", outline: "none", background: "#fafafa" }}
                maxLength={6}
              />
            </div>
            <div className="flex items-end">
              <button type="submit" disabled={searching || !last.trim()}
                className="px-6 py-2.5 rounded-lg text-sm font-black uppercase tracking-[0.12em] text-white transition-opacity disabled:opacity-40"
                style={{ background: "var(--accent)" }}>
                {searching ? "Searching…" : "Search"}
              </button>
            </div>
          </div>
        </form>

        {/* No data state */}
        {searched && noData && (
          <div className="rounded-2xl p-10 text-center"
            style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
            <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ background: "rgba(37,99,168,0.08)" }}>
              <svg width="24" height="24" fill="none" stroke="#2563a8" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M12 6v6m0 4h.01M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z"
                  strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className="text-lg font-black mb-2" style={{ color: "#374151", fontFamily: "var(--font-playfair, serif)" }}>
              Voter roll not yet loaded
            </h2>
            <p className="text-sm mb-4" style={{ color: "#6b7280", maxWidth: 420, margin: "0 auto" }}>
              Harris County voter registration data hasn&apos;t been imported. Once loaded, search all 2.4M registered voters by name, address, or precinct and see their complete election participation history.
            </p>
            <div className="rounded-xl p-4 text-left max-w-sm mx-auto mt-4"
              style={{ background: "rgba(37,99,168,0.04)", border: "1px solid rgba(37,99,168,0.12)" }}>
              <p className="text-[9px] font-black uppercase tracking-[0.16em] mb-2" style={{ color: "#2563a8" }}>
                To enable this tool
              </p>
              <ol className="text-[11px] flex flex-col gap-1" style={{ color: "#6b7280" }}>
                <li>1. Request voter roll from Harris County Clerk</li>
                <li>2. Run <code className="font-mono px-1 rounded" style={{ background: "#f3f4f6" }}>node scripts/import-voter-roll.mjs</code></li>
                <li>3. Search becomes live instantly</li>
              </ol>
            </div>
          </div>
        )}

        {/* Results + detail panel */}
        {searched && !noData && (
          <div className="flex flex-col lg:flex-row gap-5">

            {/* Results list */}
            <div className="lg:w-80 flex-shrink-0">
              {searching && (
                <div className="text-center py-12">
                  <div className="w-7 h-7 rounded-full border-2 mx-auto mb-3 animate-spin"
                    style={{ borderColor: "#2563a8", borderTopColor: "transparent" }} />
                  <p className="text-xs" style={{ color: "#9ca3af" }}>Searching…</p>
                </div>
              )}

              {!searching && noResults && (
                <div className="rounded-xl p-8 text-center"
                  style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
                  <p className="text-sm font-bold mb-1" style={{ color: "#374151" }}>No voters found</p>
                  <p className="text-xs" style={{ color: "#9ca3af" }}>
                    Try a broader search. Only last name is required.
                  </p>
                </div>
              )}

              {!searching && hasResults && result?.voters && (
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.16em] mb-3" style={{ color: "#9ca3af" }}>
                    {result.total?.toLocaleString()} result{result.total !== 1 ? "s" : ""} · showing {result.voters.length}
                  </p>
                  <div className="flex flex-col gap-2">
                    {result.voters.map(v => (
                      <VoterCard key={v.vuid} voter={v}
                        onClick={() => handleSelectVoter(v)} />
                    ))}
                  </div>
                  {(result.pages ?? 1) > 1 && (
                    <p className="text-[10px] text-center mt-4" style={{ color: "#9ca3af" }}>
                      Page {result.page} of {result.pages}. Refine your search to narrow results
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Detail panel */}
            <div className="flex-1 min-w-0">
              {!selected && !searching && (
                <div className="rounded-2xl p-10 text-center h-full flex flex-col items-center justify-center"
                  style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", minHeight: 300 }}>
                  <svg width="32" height="32" fill="none" stroke="#d1d5db" strokeWidth="1.5" viewBox="0 0 24 24" className="mb-3">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/>
                  </svg>
                  <p className="text-sm font-bold mb-1" style={{ color: "#9ca3af" }}>Select a voter</p>
                  <p className="text-xs" style={{ color: "#d1d5db" }}>
                    Click any result on the left to view their full voting history.
                  </p>
                </div>
              )}

              {selected && (
                <div className="rounded-2xl overflow-hidden"
                  style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>

                  {/* Voter header */}
                  <div className="px-6 py-5 border-b border-black/8"
                    style={{ background: "linear-gradient(135deg, #1a3a5c 0%, #2563a8 100%)" }}>
                    <p className="text-[9px] font-black uppercase tracking-[0.22em] mb-1 text-white/50">
                      Voter Record
                    </p>
                    <h2 className="text-xl font-black text-white" style={{ fontFamily: "var(--font-playfair, serif)" }}>
                      {selected.last_name}, {selected.first_name}{selected.middle_name ? ` ${selected.middle_name[0]}.` : ""}
                    </h2>
                    {selected.dob_year && (
                      <p className="text-white/60 text-xs mt-0.5">Born {selected.dob_year}</p>
                    )}

                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="text-[9px] font-bold px-2 py-1 rounded-full"
                        style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.85)" }}>
                        Precinct {paddedPrec(selected.precinct_number)}
                      </span>
                      {selected.gender && (
                        <span className="text-[9px] font-bold px-2 py-1 rounded-full"
                          style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.85)" }}>
                          {genderLabel(selected.gender)}
                        </span>
                      )}
                      {selected.estimated_race && (
                        <span className="text-[9px] font-bold px-2 py-1 rounded-full"
                          style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.85)" }}>
                          Est. {RACE_LABELS[selected.estimated_race] ?? selected.estimated_race}
                        </span>
                      )}
                    </div>

                    {selected.address_street && (
                      <p className="text-white/50 text-[11px] mt-2">
                        {selected.address_street}, {selected.address_city ?? "Houston"} {selected.address_zip}
                      </p>
                    )}
                  </div>

                  {/* Precinct context link */}
                  {selected.precinct_number && (
                    <div className="px-6 py-3 border-b border-black/8 flex items-center justify-between"
                      style={{ background: "rgba(37,99,168,0.03)" }}>
                      <p className="text-[10px]" style={{ color: "#6b7280" }}>
                        Precinct {paddedPrec(selected.precinct_number)} voting history
                      </p>
                      <Link
                        href={`/tools/precinct-lookup?p=${selected.precinct_number}`}
                        className="text-[10px] font-bold hover:opacity-70 transition-opacity"
                        style={{ color: "var(--accent)" }}>
                        View precinct →
                      </Link>
                    </div>
                  )}

                  {/* Election history */}
                  <div className="p-6">
                    {loadingDetail && (
                      <div className="text-center py-8">
                        <div className="w-6 h-6 rounded-full border-2 mx-auto mb-2 animate-spin"
                          style={{ borderColor: "#2563a8", borderTopColor: "transparent" }} />
                        <p className="text-xs" style={{ color: "#9ca3af" }}>Loading history…</p>
                      </div>
                    )}

                    {detail?.status === "ok" && detail.history && (
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] mb-4" style={{ color: "#374151" }}>
                          Election Participation History
                        </p>
                        {detail.history.length === 0 ? (
                          <p className="text-sm text-center py-6" style={{ color: "#9ca3af" }}>
                            No election history on record.
                          </p>
                        ) : (
                          <ElectionTimeline history={detail.history} />
                        )}
                      </div>
                    )}

                    {detail?.status === "no_data" && (
                      <p className="text-sm text-center py-6" style={{ color: "#9ca3af" }}>
                        History data not available.
                      </p>
                    )}
                  </div>

                  {/* Footer note */}
                  <div className="px-6 py-3 border-t border-black/8"
                    style={{ background: "rgba(0,0,0,0.01)" }}>
                    <p className="text-[9px]" style={{ color: "#d1d5db" }}>
                      Source: Harris County Voter Registration · Race estimated via BISG surname/zip inference, not self-reported · Public record data
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Info block when no search yet */}
        {!searched && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { title: "2.4M voters", sub: "Harris County registered voters" },
              { title: "10+ elections", sub: "History from 2014 forward when loaded" },
              { title: "Public record", sub: "Public data under TX Election Code §18.008. Shows participation and primary pulled — never ballot choices" },
            ].map(card => (
              <div key={card.title} className="rounded-xl p-5"
                style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
                <p className="text-lg font-black" style={{ color: "var(--accent)" }}>{card.title}</p>
                <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>{card.sub}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
