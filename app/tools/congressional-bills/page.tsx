"use client";
import { useState, useEffect } from "react";
import ShareButton from "@/components/ShareButton";
import { SourceBadge } from "@/components/SourceBadge";

type Rep = {
  name: string;
  district: string;
  chamber: "House" | "Senate";
  party: "D" | "R";
  role: string;
};

type Bill = {
  bill_id: number;
  bill_number: string;
  title: string;
  last_action: string;
  last_action_date: string;
  url: string;
};

type BillStatus = "law" | "passed" | "committee" | "filed";

function getBillStatus(last_action: string): BillStatus {
  const a = (last_action || "").toLowerCase();
  if (a.includes("signed by president") || a.includes("became public law") || a.includes("enacted")) return "law";
  if (a.includes("passed house") || a.includes("passed senate") || a.includes("agreed to in")) return "passed";
  if (a.includes("reported") || a.includes("ordered to be reported") || a.includes("placed on calendar")) return "committee";
  return "filed";
}

const STATUS_STYLES: Record<BillStatus, { label: string; bg: string; text: string }> = {
  law:       { label: "Signed into Law",   bg: "#dcfce7", text: "#16a34a" },
  passed:    { label: "Passed a Chamber",  bg: "#ede9fe", text: "#7c3aed" },
  committee: { label: "Out of Committee",  bg: "#dbeafe", text: "#1d4ed8" },
  filed:     { label: "Introduced",        bg: "#f3f4f6", text: "#6b7280" },
};

type Counts = { total: number; committee: number; passed: number; law: number; pct: number };

// Harris County US Representatives — 119th Congress (2025-2027)
const REPS: Rep[] = [
  { name: "Sylvia Garcia",     district: "TX-29", chamber: "House",  party: "D", role: "U.S. Representative" },
  { name: "Lizzie Fletcher",   district: "TX-7",  chamber: "House",  party: "D", role: "U.S. Representative" },
  { name: "Al Green",          district: "TX-9",  chamber: "House",  party: "D", role: "U.S. Representative" },
  { name: "Dan Crenshaw",      district: "TX-2",  chamber: "House",  party: "R", role: "U.S. Representative" },
  { name: "Brian Babin",       district: "TX-36", chamber: "House",  party: "R", role: "U.S. Representative" },
  { name: "Wesley Hunt",       district: "TX-38", chamber: "House",  party: "R", role: "U.S. Representative" },
  { name: "Amanda Edwards",    district: "TX-18", chamber: "House",  party: "D", role: "U.S. Representative (CD-18)" },
  { name: "John Cornyn",       district: "TX",    chamber: "Senate", party: "R", role: "U.S. Senator" },
  { name: "Ted Cruz",          district: "TX",    chamber: "Senate", party: "R", role: "U.S. Senator" },
];

async function fetchSummary(rep: Rep): Promise<Counts> {
  const res = await fetch(`/api/congress-bills?action=summary&rep=${encodeURIComponent(rep.name)}`);
  const data = await res.json();
  const bills: Bill[] = data.bills ?? [];
  const counts: Counts = { total: data.total ?? bills.length, committee: 0, passed: 0, law: 0, pct: 0 };
  for (const b of bills) {
    const s = getBillStatus(b.last_action);
    if (s === "law")       { counts.law++; counts.passed++; counts.committee++; }
    else if (s === "passed")    { counts.passed++; counts.committee++; }
    else if (s === "committee") { counts.committee++; }
  }
  counts.pct = counts.total > 0 ? Math.round((counts.law / counts.total) * 100) : 0;
  return counts;
}

// ── Stat pill ────────────────────────────────────────────────────────────────
function StatPill({ value, label, color }: { value: number | string; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 min-w-[48px]">
      <span className="text-lg font-bold leading-none" style={{ color, fontFamily: "var(--font-playfair), serif" }}>
        {value}
      </span>
      <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
        {label}
      </span>
    </div>
  );
}

// ── Rep row ──────────────────────────────────────────────────────────────────
function RepRow({
  rep,
  counts,
  loading,
  active,
  onClick,
}: {
  rep: Rep;
  counts: Counts | null;
  loading: boolean;
  active: boolean;
  onClick: () => void;
}) {
  const lawPct = counts && counts.total > 0 ? (counts.law / counts.total) * 100 : 0;

  return (
    <div
      className={`rounded-[1.75rem] ring-1 p-[5px] cursor-pointer card-lift transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
        active
          ? "ring-[var(--accent)] bg-[var(--accent)]/5 shadow-lg"
          : "ring-black/8 bg-white/60 hover:ring-[var(--accent-light)]"
      }`}
      onClick={onClick}
    >
      <div className="rounded-[1.35rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] px-5 py-4">
        <div className="flex items-center gap-4">
          {/* Party dot */}
          <div
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: rep.party === "D" ? "#1d4ed8" : "#b91c1c" }}
          >
            {rep.party}
          </div>

          {/* Name + info */}
          <div className="flex-1 min-w-0">
            <h3
              className="font-bold text-[var(--accent)] text-sm leading-snug"
              style={{ fontFamily: "var(--font-playfair), serif" }}
            >
              {rep.name}
            </h3>
            <p className="text-[11px] text-[var(--muted)]">
              {rep.district} &middot; {rep.role}
            </p>
          </div>

          {/* Stats */}
          {loading ? (
            <div className="flex gap-3 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-10 h-8 rounded-lg bg-gray-100" />
              ))}
            </div>
          ) : counts ? (
            <div className="flex items-center gap-4">
              <div className="flex gap-3">
                <StatPill value={counts.law} label="Laws" color="#16a34a" />
                <StatPill value={counts.passed} label="Passed" color="#7c3aed" />
                <StatPill value={counts.total} label="Total" color="var(--accent)" />
              </div>
              {/* Progress bar */}
              <div className="hidden sm:block w-20">
                <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-400 transition-all duration-1000 ease-[cubic-bezier(0.32,0.72,0,1)]"
                    style={{ width: `${lawPct}%` }}
                  />
                </div>
                <p className="text-[9px] text-[var(--muted)] mt-0.5 font-bold uppercase tracking-widest">
                  {counts.pct}% law
                </p>
              </div>
            </div>
          ) : null}

          {/* Chevron */}
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            stroke="var(--muted)"
            strokeWidth="1.5"
            className={`flex-shrink-0 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${active ? "rotate-180" : ""}`}
          >
            <path d="M3 5l4 4 4-4" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// ── Bill list (expanded) ──────────────────────────────────────────────────────
function BillList({ rep }: { rep: Rep }) {
  const [bills, setBills] = useState<Bill[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/congress-bills?action=search&rep=${encodeURIComponent(rep.name)}`)
      .then((r) => r.json())
      .then((d) => setBills(d.bills ?? []))
      .finally(() => setLoading(false));
  }, [rep.name]);

  if (loading) {
    return (
      <div className="py-8 flex flex-col gap-2 animate-pulse px-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 rounded-xl bg-gray-100" />
        ))}
      </div>
    );
  }

  if (!bills || bills.length === 0) {
    return <div className="py-8 text-center text-sm text-[var(--muted)] px-5">No bills found in the current session.</div>;
  }

  const sorted = [...bills].sort((a, b) => {
    const order: BillStatus[] = ["law", "passed", "committee", "filed"];
    return order.indexOf(getBillStatus(a.last_action)) - order.indexOf(getBillStatus(b.last_action));
  });

  return (
    <div className="px-5 pb-5 flex flex-col gap-2">
      <div className="border-t border-[var(--border)] pt-4 mb-2">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
          {bills.length} bill{bills.length !== 1 ? "s" : ""} — 119th Congress
        </p>
      </div>
      {sorted.map((bill) => {
        const status = getBillStatus(bill.last_action);
        const style = STATUS_STYLES[status];
        return (
          <a
            key={bill.bill_id}
            href={bill.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 rounded-xl p-3 hover:bg-[var(--accent)]/4 transition-colors duration-300 group"
          >
            <span
              className="flex-shrink-0 text-[10px] font-bold uppercase tracking-[0.1em] px-2.5 py-1 rounded-full ring-1 mt-0.5"
              style={{ background: style.bg, color: style.text }}
            >
              {bill.bill_number}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[var(--foreground)] leading-snug group-hover:text-[var(--accent)] transition-colors duration-300">
                {bill.title}
              </p>
              <p className="text-[11px] text-[var(--muted)] mt-0.5 flex items-center gap-1.5">
                <span
                  className="inline-block px-2 py-px rounded-full text-[9px] font-bold uppercase tracking-widest ring-1"
                  style={{ background: style.bg, color: style.text }}
                >
                  {style.label}
                </span>
                {bill.last_action_date && (
                  <span>{bill.last_action_date}</span>
                )}
              </p>
            </div>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--muted)" strokeWidth="1.5" className="flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <path d="M2.5 9.5l7-7M5 2.5h4.5v4.5" />
            </svg>
          </a>
        );
      })}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
type SortKey = "law" | "passed" | "total" | "pct";
export default function CongressionalBillTracker() {
  const [countsMap, setCountsMap] = useState<Record<string, Counts>>({});
  const [loadingSet, setLoadingSet] = useState<Set<string>>(new Set());
  const [activeRep, setActiveRep] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("law");
  const [chamberFilter, setChamberFilter] = useState<"All" | "House" | "Senate">("All");

  // Pre-load all summaries
  useEffect(() => {
    const toLoad = REPS.filter((r) => !countsMap[r.name] && !loadingSet.has(r.name));
    if (toLoad.length === 0) return;

    setLoadingSet((prev) => {
      const next = new Set(prev);
      toLoad.forEach((r) => next.add(r.name));
      return next;
    });

    Promise.allSettled(
      toLoad.map(async (rep) => {
        const counts = await fetchSummary(rep);
        return { name: rep.name, counts };
      })
    ).then((results) => {
      const newCounts: Record<string, Counts> = {};
      for (const r of results) {
        if (r.status === "fulfilled") {
          newCounts[r.value.name] = r.value.counts;
        }
      }
      setCountsMap((prev) => ({ ...prev, ...newCounts }));
      setLoadingSet((prev) => {
        const next = new Set(prev);
        toLoad.forEach((r) => next.delete(r.name));
        return next;
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleReps = REPS.filter(
    (r) => chamberFilter === "All" || r.chamber === chamberFilter
  );

  const sorted = [...visibleReps].sort((a, b) => {
    const ca = countsMap[a.name];
    const cb = countsMap[b.name];
    if (!ca || !cb) return 0;
    if (sortKey === "law") return cb.law - ca.law;
    if (sortKey === "passed") return cb.passed - ca.passed;
    if (sortKey === "total") return cb.total - ca.total;
    if (sortKey === "pct") return cb.pct - ca.pct;
    return 0;
  });

  const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: "law", label: "Laws" },
    { key: "passed", label: "Passed" },
    { key: "total", label: "Total Bills" },
    { key: "pct", label: "Pass Rate" },
  ];

  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div className="bg-[var(--accent)] text-white px-6 py-16 md:py-24 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_80%_50%,rgba(37,99,168,0.4),transparent)]" />
        <div className="max-w-6xl mx-auto relative z-10">
          <p className="text-sky-300/80 text-[11px] font-bold uppercase tracking-[0.25em] mb-3">
            Legislative
          </p>
          <h1
            className="text-3xl md:text-4xl font-bold leading-tight mb-2"
            style={{ fontFamily: "var(--font-playfair), serif" }}
          >
            Congressional Bill Tracker
          </h1>
          <p className="text-white/70 text-sm max-w-lg">
            What did Harris County&apos;s U.S. Representatives and Senators actually pass in Congress? Ranked by bills signed into law — 119th Congress (2025–2027).
          </p>
          <ShareButton
            toolName="Congressional Bill Tracker"
            section="Legislative"
            description="What did Harris County's US reps actually pass in Congress? Ranked by bills signed into law — 119th Congress."
            stats={[{ label: "Congress", value: "119th" }, { label: "Reps Tracked", value: "7" }]}
          />
        </div>
      </div>

      {/* ── Controls ──────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-[var(--background)]/90 backdrop-blur border-b border-[var(--border)] px-6 py-3">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center gap-3">
          {/* Chamber filter */}
          <div className="flex gap-1.5">
            {(["All", "House", "Senate"] as const).map((c) => (
              <button
                key={c}
                onClick={() => setChamberFilter(c)}
                className={`text-xs font-bold uppercase tracking-[0.12em] px-3 py-1.5 rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                  chamberFilter === c
                    ? "bg-[var(--accent)] text-white"
                    : "bg-white ring-1 ring-[var(--border)] text-[var(--muted)] hover:ring-[var(--accent-light)]"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <span className="text-[var(--border)] hidden sm:block">|</span>

          {/* Sort */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Sort:</span>
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setSortKey(opt.key)}
                className={`text-xs font-bold uppercase tracking-[0.1em] px-3 py-1.5 rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                  sortKey === opt.key
                    ? "bg-[var(--accent)] text-white"
                    : "bg-white ring-1 ring-[var(--border)] text-[var(--muted)] hover:ring-[var(--accent-light)]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Rep list ──────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-6 py-12 flex flex-col gap-3">
        {sorted.map((rep) => {
          const isActive = activeRep === rep.name;
          return (
            <div key={rep.name}>
              <RepRow
                rep={rep}
                counts={countsMap[rep.name] ?? null}
                loading={loadingSet.has(rep.name)}
                active={isActive}
                onClick={() => setActiveRep(isActive ? null : rep.name)}
              />
              {/* Bill list panel */}
              <div
                className={`overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                  isActive ? "max-h-[2000px] opacity-100 mt-2" : "max-h-0 opacity-0"
                }`}
              >
                <div className="rounded-[1.75rem] ring-1 ring-[var(--accent)]/20 bg-white/60 p-[5px]">
                  <div className="rounded-[1.35rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]">
                    {isActive && <BillList rep={rep} />}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Note */}
        <div className="mt-8 rounded-[1.75rem] bg-white/60 ring-1 ring-black/8 p-[5px]">
          <div className="rounded-[1.35rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] p-5 text-center">
            <div className="flex flex-wrap items-center gap-2 justify-center mb-3">
              <SourceBadge source={{ label: "LegiScan", detail: "119th U.S. Congress · 2025–2027", type: "api", url: "https://legiscan.com" }} />
              <SourceBadge source={{ label: "Congress.gov", detail: "Official bill status", type: "government", url: "https://www.congress.gov" }} />
            </div>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Covers sponsored and co-sponsored legislation. Not all Harris County U.S. House districts may be listed.{" "}
              <a href="/contact" className="text-[var(--accent-light)] underline underline-offset-2">
                Report a missing rep →
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
