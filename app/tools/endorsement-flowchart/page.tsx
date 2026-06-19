"use client";
import { useState, useMemo } from "react";
import ShareButton from "@/components/ShareButton";

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface Endorsement {
  id: string;
  endorser: string;
  endorserType: EndorserType;
  candidate: string;
  race: string;
  year: number;
  notes?: string;
}

type EndorserType =
  | "Union"
  | "Elected Official"
  | "Party Org"
  | "Civic Org"
  | "Newspaper"
  | "Business Org";

/* ─── Data ───────────────────────────────────────────────────────────────── */
const ENDORSEMENTS: Endorsement[] = [
  // ── 2026 TX US Senate ────────────────────────────────────────────────────
  { id: "e1",  endorser: "AFL-CIO Texas",           endorserType: "Union",            candidate: "Jasmine Crockett", race: "U.S. Senate 2026",          year: 2026 },
  { id: "e2",  endorser: "Texas AFT",               endorserType: "Union",            candidate: "Jasmine Crockett", race: "U.S. Senate 2026",          year: 2026 },
  { id: "e3",  endorser: "SEIU Texas",              endorserType: "Union",            candidate: "Jasmine Crockett", race: "U.S. Senate 2026",          year: 2026 },
  { id: "e4",  endorser: "Houston Chronicle",       endorserType: "Newspaper",        candidate: "Jasmine Crockett", race: "U.S. Senate 2026",          year: 2026 },
  { id: "e5",  endorser: "Sylvia Garcia",           endorserType: "Elected Official", candidate: "Jasmine Crockett", race: "U.S. Senate 2026",          year: 2026 },
  { id: "e6",  endorser: "Al Green",                endorserType: "Elected Official", candidate: "Jasmine Crockett", race: "U.S. Senate 2026",          year: 2026 },
  { id: "e7",  endorser: "Sheila Jackson Lee Estate", endorserType: "Elected Official", candidate: "Jasmine Crockett", race: "U.S. Senate 2026",        year: 2026, notes: "Family endorsement" },
  { id: "e8",  endorser: "James Talarico",          endorserType: "Elected Official", candidate: "James Talarico",   race: "U.S. Senate 2026",          year: 2026, notes: "Self (candidate)" },
  { id: "e9",  endorser: "Harris County Democrats", endorserType: "Party Org",        candidate: "Jasmine Crockett", race: "U.S. Senate 2026",          year: 2026 },

  // ── 2024 Harris County Judge ─────────────────────────────────────────────
  { id: "e10", endorser: "Houston Chronicle",       endorserType: "Newspaper",        candidate: "Lina Hidalgo",     race: "Harris County Judge 2024",  year: 2024 },
  { id: "e11", endorser: "AFL-CIO Texas",           endorserType: "Union",            candidate: "Lina Hidalgo",     race: "Harris County Judge 2024",  year: 2024 },
  { id: "e12", endorser: "Texas AFT",               endorserType: "Union",            candidate: "Lina Hidalgo",     race: "Harris County Judge 2024",  year: 2024 },
  { id: "e13", endorser: "Emily's List",            endorserType: "Civic Org",        candidate: "Lina Hidalgo",     race: "Harris County Judge 2024",  year: 2024 },
  { id: "e14", endorser: "Sylvia Garcia",           endorserType: "Elected Official", candidate: "Lina Hidalgo",     race: "Harris County Judge 2024",  year: 2024 },
  { id: "e15", endorser: "Al Green",                endorserType: "Elected Official", candidate: "Lina Hidalgo",     race: "Harris County Judge 2024",  year: 2024 },
  { id: "e16", endorser: "Lizzie Fletcher",         endorserType: "Elected Official", candidate: "Lina Hidalgo",     race: "Harris County Judge 2024",  year: 2024 },

  // ── 2024 Harris County Commissioner Pct 2 ───────────────────────────────
  { id: "e17", endorser: "AFL-CIO Texas",           endorserType: "Union",            candidate: "Adrian Garcia",    race: "County Commissioner Pct 2 2024", year: 2024 },
  { id: "e18", endorser: "Houston Chronicle",       endorserType: "Newspaper",        candidate: "Adrian Garcia",    race: "County Commissioner Pct 2 2024", year: 2024 },
  { id: "e19", endorser: "Sylvia Garcia",           endorserType: "Elected Official", candidate: "Adrian Garcia",    race: "County Commissioner Pct 2 2024", year: 2024 },
  { id: "e20", endorser: "Harris County Democrats", endorserType: "Party Org",        candidate: "Adrian Garcia",    race: "County Commissioner Pct 2 2024", year: 2024 },

  // ── 2024 TX-18 Special Election ──────────────────────────────────────────
  { id: "e21", endorser: "AFL-CIO Texas",           endorserType: "Union",            candidate: "Amanda Edwards",   race: "TX-18 2024",                year: 2024 },
  { id: "e22", endorser: "Houston Chronicle",       endorserType: "Newspaper",        candidate: "Amanda Edwards",   race: "TX-18 2024",                year: 2024 },
  { id: "e23", endorser: "Emily's List",            endorserType: "Civic Org",        candidate: "Amanda Edwards",   race: "TX-18 2024",                year: 2024 },
  { id: "e24", endorser: "Harris County Democrats", endorserType: "Party Org",        candidate: "Amanda Edwards",   race: "TX-18 2024",                year: 2024 },
  { id: "e25", endorser: "Sylvia Garcia",           endorserType: "Elected Official", candidate: "Amanda Edwards",   race: "TX-18 2024",                year: 2024 },

  // ── 2022 Harris County Judge ─────────────────────────────────────────────
  { id: "e26", endorser: "Houston Chronicle",       endorserType: "Newspaper",        candidate: "Lina Hidalgo",     race: "Harris County Judge 2022",  year: 2022 },
  { id: "e27", endorser: "AFL-CIO Texas",           endorserType: "Union",            candidate: "Lina Hidalgo",     race: "Harris County Judge 2022",  year: 2022 },
  { id: "e28", endorser: "Emily's List",            endorserType: "Civic Org",        candidate: "Lina Hidalgo",     race: "Harris County Judge 2022",  year: 2022 },
  { id: "e29", endorser: "Sylvia Garcia",           endorserType: "Elected Official", candidate: "Lina Hidalgo",     race: "Harris County Judge 2022",  year: 2022 },
  { id: "e30", endorser: "SEIU Texas",              endorserType: "Union",            candidate: "Lina Hidalgo",     race: "Harris County Judge 2022",  year: 2022 },

  // ── 2026 TX US Senate — additional endorsers ─────────────────────────────
  { id: "e31", endorser: "Texas Democratic Party",   endorserType: "Party Org",       candidate: "Jasmine Crockett", race: "U.S. Senate 2026",          year: 2026 },
  { id: "e32", endorser: "Texas NAACP",              endorserType: "Civic Org",       candidate: "Jasmine Crockett", race: "U.S. Senate 2026",          year: 2026 },
  { id: "e33", endorser: "Planned Parenthood Action", endorserType: "Civic Org",      candidate: "Jasmine Crockett", race: "U.S. Senate 2026",          year: 2026 },
  { id: "e34", endorser: "CWA Texas",                endorserType: "Union",           candidate: "Jasmine Crockett", race: "U.S. Senate 2026",          year: 2026, notes: "Communications Workers of America" },
  { id: "e35", endorser: "Lizzie Fletcher",          endorserType: "Elected Official", candidate: "Jasmine Crockett", race: "U.S. Senate 2026",          year: 2026 },

  // ── 2026 TX US Senate — Ted Cruz (R incumbent) ───────────────────────────
  { id: "e36", endorser: "Donald Trump",             endorserType: "Elected Official", candidate: "Ted Cruz",         race: "U.S. Senate 2026",          year: 2026 },
  { id: "e37", endorser: "Texas Republican Party",   endorserType: "Party Org",       candidate: "Ted Cruz",         race: "U.S. Senate 2026",          year: 2026 },
  { id: "e38", endorser: "NRA Political Victory Fund", endorserType: "Civic Org",     candidate: "Ted Cruz",         race: "U.S. Senate 2026",          year: 2026 },
  { id: "e39", endorser: "Club for Growth",          endorserType: "Civic Org",       candidate: "Ted Cruz",         race: "U.S. Senate 2026",          year: 2026 },

  // ── 2026 Harris County Judge — Republican primary ────────────────────────
  { id: "e40", endorser: "Texas Republican Party",   endorserType: "Party Org",       candidate: "Greg Plummer",     race: "Harris County Judge 2026",  year: 2026, notes: "Won May 2026 GOP runoff" },
  { id: "e41", endorser: "Harris County Republicans", endorserType: "Party Org",      candidate: "Greg Plummer",     race: "Harris County Judge 2026",  year: 2026 },
];

/* ─── Metadata ───────────────────────────────────────────────────────────── */
const TYPE_COLOR: Record<EndorserType, { bg: string; text: string; border: string }> = {
  "Union":            { bg: "#fef3c7", text: "#92400e", border: "#fcd34d" },
  "Elected Official": { bg: "#dbeafe", text: "#1d4ed8", border: "#93c5fd" },
  "Party Org":        { bg: "#ede9fe", text: "#6d28d9", border: "#c4b5fd" },
  "Civic Org":        { bg: "#dcfce7", text: "#166534", border: "#86efac" },
  "Newspaper":        { bg: "#f3f4f6", text: "#374151", border: "#d1d5db" },
  "Business Org":     { bg: "#fce7f3", text: "#9d174d", border: "#f9a8d4" },
};

const ENDORSER_TYPES: EndorserType[] = [
  "Union", "Elected Official", "Party Org", "Civic Org", "Newspaper", "Business Org",
];

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

/* ─── Component: EndorserNode ────────────────────────────────────────────── */
function EndorserNode({
  endorser,
  type,
  candidates,
  selected,
  onClick,
}: {
  endorser: string;
  type: EndorserType;
  candidates: string[];
  selected: boolean;
  onClick: () => void;
}) {
  const style = TYPE_COLOR[type];
  return (
    <button
      onClick={onClick}
      className={`group text-left rounded-[1.35rem] ring-1 p-[4px] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] w-full ${
        selected
          ? "ring-[var(--accent)] shadow-lg scale-[1.01]"
          : "card-lift ring-black/8 hover:ring-[var(--accent-light)]"
      }`}
      style={{ background: selected ? "rgba(26,58,92,0.04)" : "rgba(255,255,255,0.6)" }}
    >
      <div className="rounded-[1rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] px-4 py-3">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <span className="font-bold text-[var(--accent)] text-sm leading-snug" style={{ fontFamily: "var(--font-playfair), serif" }}>
            {endorser}
          </span>
          <span
            className="flex-shrink-0 text-[9px] font-bold uppercase tracking-[0.1em] px-2 py-0.5 rounded-full border"
            style={{ background: style.bg, color: style.text, borderColor: style.border }}
          >
            {type}
          </span>
        </div>
        <p className="text-[11px] text-[var(--muted)]">
          {candidates.length} endorsement{candidates.length !== 1 ? "s" : ""}
        </p>
      </div>
    </button>
  );
}

/* ─── Component: CandidateNode ───────────────────────────────────────────── */
function CandidateNode({
  candidate,
  endorsements,
  highlighted,
}: {
  candidate: string;
  endorsements: Endorsement[];
  highlighted: boolean;
}) {
  return (
    <div
      className={`rounded-[1.35rem] ring-1 p-[4px] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
        highlighted
          ? "ring-[var(--accent)] bg-[var(--accent)]/5 shadow-lg"
          : "ring-black/8 bg-white/60 opacity-40"
      }`}
    >
      <div className="rounded-[1rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] px-4 py-3">
        <p className="font-bold text-[var(--accent)] text-sm leading-snug mb-1" style={{ fontFamily: "var(--font-playfair), serif" }}>
          {candidate}
        </p>
        <p className="text-[11px] text-[var(--muted)]">
          {endorsements.length} endorser{endorsements.length !== 1 ? "s" : ""}
        </p>
        {highlighted && (
          <div className="mt-2 flex flex-wrap gap-1">
            {endorsements.map((e) => {
              const s = TYPE_COLOR[e.endorserType];
              return (
                <span
                  key={e.id}
                  className="text-[9px] font-semibold px-2 py-0.5 rounded-full border"
                  style={{ background: s.bg, color: s.text, borderColor: s.border }}
                >
                  {e.endorserType}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function EndorsementFlowchart() {
  const [selectedEndorser, setSelectedEndorser] = useState<string | null>(null);
  const [raceFilter, setRaceFilter] = useState<string>("All");
  const [typeFilter, setTypeFilter] = useState<EndorserType | "All">("All");

  const races = useMemo(() => ["All", ...unique(ENDORSEMENTS.map((e) => e.race)).sort()], []);

  const filtered = useMemo(() => {
    return ENDORSEMENTS.filter(
      (e) =>
        (raceFilter === "All" || e.race === raceFilter) &&
        (typeFilter === "All" || e.endorserType === typeFilter)
    );
  }, [raceFilter, typeFilter]);

  // Build endorser → candidates map
  const endorserMap = useMemo(() => {
    const map = new Map<string, { type: EndorserType; candidates: string[] }>();
    for (const e of filtered) {
      if (!map.has(e.endorser)) map.set(e.endorser, { type: e.endorserType, candidates: [] });
      if (!map.get(e.endorser)!.candidates.includes(e.candidate)) {
        map.get(e.endorser)!.candidates.push(e.candidate);
      }
    }
    return map;
  }, [filtered]);

  // Build candidate → endorsements map
  const candidateMap = useMemo(() => {
    const map = new Map<string, Endorsement[]>();
    for (const e of filtered) {
      if (!map.has(e.candidate)) map.set(e.candidate, []);
      map.get(e.candidate)!.push(e);
    }
    return map;
  }, [filtered]);

  // Which candidates are highlighted based on selection
  const highlightedCandidates = useMemo(() => {
    if (!selectedEndorser) return new Set(candidateMap.keys());
    const node = endorserMap.get(selectedEndorser);
    return new Set(node?.candidates ?? []);
  }, [selectedEndorser, endorserMap, candidateMap]);

  const endorserEntries = Array.from(endorserMap.entries()).sort(
    (a, b) => b[1].candidates.length - a[1].candidates.length
  );
  const candidateEntries = Array.from(candidateMap.entries()).sort(
    (a, b) => b[1].length - a[1].length
  );

  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div className="bg-[var(--accent)] text-white px-6 py-16 md:py-24 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_80%_50%,rgba(37,99,168,0.4),transparent)]" />
        <div className="max-w-6xl mx-auto relative z-10">
          <p className="text-sky-300/80 text-[11px] font-bold uppercase tracking-[0.25em] mb-3">
            Elections
          </p>
          <h1
            className="text-3xl md:text-4xl font-bold leading-tight mb-2"
            style={{ fontFamily: "var(--font-playfair), serif" }}
          >
            Endorsement Flowchart
          </h1>
          <p className="text-white/70 text-sm max-w-lg">
            Who endorsed whom in Harris County races? Click any endorser on the left to highlight which candidates they backed.
          </p>
          <ShareButton
            toolName="Endorsement Flowchart"
            section="Elections"
            description="Who endorsed whom in Harris County races? Every endorser-to-candidate connection, mapped."
          />
        </div>
      </div>

      {/* ── Filters ───────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-[var(--background)]/90 backdrop-blur border-b border-[var(--border)] px-6 py-3">
        <div className="max-w-6xl mx-auto flex flex-wrap gap-2">
          {/* Race filter */}
          <div className="flex gap-1.5 flex-wrap">
            {races.map((r) => (
              <button
                key={r}
                onClick={() => setRaceFilter(r)}
                className={`text-xs font-bold uppercase tracking-[0.1em] px-3 py-1.5 rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                  raceFilter === r
                    ? "bg-[var(--accent)] text-white"
                    : "bg-white ring-1 ring-[var(--border)] text-[var(--muted)] hover:ring-[var(--accent-light)]"
                }`}
              >
                {r === "All" ? "All Races" : r}
              </button>
            ))}
          </div>

          {/* Type filter */}
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setTypeFilter("All")}
              className={`text-xs font-bold uppercase tracking-[0.1em] px-3 py-1.5 rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                typeFilter === "All"
                  ? "bg-[var(--accent)] text-white"
                  : "bg-white ring-1 ring-[var(--border)] text-[var(--muted)] hover:ring-[var(--accent-light)]"
              }`}
            >
              All Types
            </button>
            {ENDORSER_TYPES.map((t) => {
              const s = TYPE_COLOR[t];
              return (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className="text-xs font-bold uppercase tracking-[0.1em] px-3 py-1.5 rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] border"
                  style={
                    typeFilter === t
                      ? { background: s.text, color: "#fff", borderColor: s.text }
                      : { background: s.bg, color: s.text, borderColor: s.border }
                  }
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Flowchart ─────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Instructions */}
        {!selectedEndorser && (
          <p className="text-xs text-[var(--muted)] text-center mb-8 italic">
            Click an endorser to see which candidates they backed
          </p>
        )}
        {selectedEndorser && (
          <div className="text-center mb-8">
            <button
              onClick={() => setSelectedEndorser(null)}
              className="text-xs font-semibold text-[var(--accent-light)] underline underline-offset-2"
            >
              Clear selection — show all
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-8 items-start">
          {/* Left: Endorsers */}
          <div>
            <div className="flex items-center gap-2 mb-5">
              <span className="block w-5 h-px bg-[var(--muted)]/40" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
                Endorsers
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {endorserEntries.map(([endorser, { type, candidates }]) => (
                <EndorserNode
                  key={endorser}
                  endorser={endorser}
                  type={type}
                  candidates={candidates}
                  selected={selectedEndorser === endorser}
                  onClick={() =>
                    setSelectedEndorser(selectedEndorser === endorser ? null : endorser)
                  }
                />
              ))}
            </div>
          </div>

          {/* Center: Arrow */}
          <div className="hidden md:flex flex-col items-center justify-center py-20 gap-2 text-[var(--muted)]/40">
            <div className="w-px h-16 bg-current" />
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 14l-6-6h12l-6 6z" />
            </svg>
            <p className="text-[9px] font-bold uppercase tracking-widest rotate-0 text-center w-16 leading-tight">
              Endorsed
            </p>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 14l-6-6h12l-6 6z" />
            </svg>
            <div className="w-px h-16 bg-current" />
          </div>

          {/* Right: Candidates */}
          <div>
            <div className="flex items-center gap-2 mb-5">
              <span className="block w-5 h-px bg-[var(--muted)]/40" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
                Candidates
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {candidateEntries.map(([candidate, endorsements]) => (
                <CandidateNode
                  key={candidate}
                  candidate={candidate}
                  endorsements={endorsements}
                  highlighted={highlightedCandidates.has(candidate)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-12 rounded-[1.75rem] bg-white/60 ring-1 ring-black/8 p-[5px]">
          <div className="rounded-[1.35rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] p-5 text-center">
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Endorsement data compiled from public announcements. Missing an endorsement?{" "}
              <a href="/contact" className="text-[var(--accent-light)] underline underline-offset-2">
                Submit it →
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
