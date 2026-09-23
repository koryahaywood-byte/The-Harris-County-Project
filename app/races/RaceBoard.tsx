"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { RaceLite, GroupId } from "@/lib/races";
import { RATING, SCALE, PARTY, raceHref } from "@/lib/ratings";
import { fmt } from "@/lib/campaign-finance";
import { RatingChip } from "@/components/desk/Rating";
import Face from "@/components/desk/Face";

type View = "all" | "competitive" | "open" | "women";
type Sort = "ballot" | "closest" | "money";

const VIEWS: { id: View; label: string }[] = [
  { id: "all", label: "All races" },
  { id: "competitive", label: "In play" },
  { id: "open", label: "Open seats" },
  { id: "women", label: "Women on the ballot" },
];
const SORTS: { id: Sort; label: string }[] = [
  { id: "ballot", label: "Ballot order" },
  { id: "closest", label: "Closest first" },
  { id: "money", label: "Most money" },
];

const num = (k: string) => parseInt(k.replace(/\D+/g, " ").trim().split(" ")[0] || "0", 10);
const closeness = (r: RaceLite) => (r.lean ? Math.abs(RATING[r.lean].order - 4) : 9);
const cash = (r: RaceLite) => (r.d?.cash ?? 0) + (r.r?.cash ?? 0);

export default function RaceBoard({ races, groups }: { races: RaceLite[]; groups: { id: GroupId; label: string; blurb: string }[] }) {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const view = (sp.get("view") as View) || "all";
  const level = (sp.get("level") as GroupId | "all") || "all";
  const sort = (sp.get("sort") as Sort) || (view === "competitive" ? "closest" : "ballot");
  const q = sp.get("q") ?? "";

  function set(patch: Record<string, string | null>) {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) (v == null || v === "" ? next.delete(k) : next.set(k, v));
    router.replace(`${pathname}${next.toString() ? `?${next}` : ""}`, { scroll: false });
  }

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return races.filter(r => {
      if (view === "competitive" && !(r.lean && RATING[r.lean].competitive)) return false;
      if (view === "open" && !r.open) return false;
      if (view === "women" && !(r.d?.woman || r.r?.woman)) return false;
      if (level !== "all" && r.group !== level) return false;
      if (needle) {
        const hay = `${r.office} ${r.tag} ${r.key} ${r.d?.name ?? ""} ${r.r?.name ?? ""}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [races, view, level, q]);

  const sorted = useMemo(() => {
    const gi = (g: GroupId) => groups.findIndex(x => x.id === g);
    const list = [...filtered];
    if (sort === "closest") list.sort((a, b) => closeness(a) - closeness(b) || gi(a.group) - gi(b.group) || cash(b) - cash(a));
    else if (sort === "money") list.sort((a, b) => cash(b) - cash(a));
    else list.sort((a, b) => gi(a.group) - gi(b.group) || num(a.key) - num(b.key) || a.key.localeCompare(b.key));
    return list;
  }, [filtered, sort, groups]);

  const levelCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of races) {
      if (view === "competitive" && !(r.lean && RATING[r.lean].competitive)) continue;
      if (view === "open" && !r.open) continue;
      if (view === "women" && !(r.d?.woman || r.r?.woman)) continue;
      c[r.group] = (c[r.group] ?? 0) + 1;
    }
    return c;
  }, [races, view]);

  const grouped = sort === "ballot";
  const sections = grouped
    ? groups.map(g => ({ g, rows: sorted.filter(r => r.group === g.id) })).filter(s => s.rows.length)
    : [{ g: null, rows: sorted }];

  return (
    <div>
      {/* ── Controls ──────────────────────────────────────────────── */}
      <div className="sticky top-14 z-20 border-b" style={{ background: "rgba(241,242,238,0.96)", backdropFilter: "blur(10px)", borderColor: "var(--rule)" }}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-md p-0.5 border" style={{ borderColor: "var(--rule-strong)", background: "var(--surface)" }} role="tablist" aria-label="Which races">
              {VIEWS.map(v => (
                <button key={v.id} role="tab" aria-selected={view === v.id} onClick={() => set({ view: v.id === "all" ? null : v.id })}
                  className="px-3 py-1.5 text-[13px] font-semibold rounded-[5px] transition-colors"
                  style={view === v.id ? { background: "var(--ink)", color: "#fff" } : { color: "#3C443F" }}>
                  {v.label}
                </button>
              ))}
            </div>
            <label className="relative ml-auto w-full sm:w-72">
              <span className="sr-only">Search races and candidates</span>
              <input value={q} onChange={e => set({ q: e.target.value })} placeholder="Search a name, office or district"
                className="w-full rounded-md border px-3 py-2 text-[14px] outline-none focus:ring-2"
                style={{ borderColor: "var(--rule-strong)", background: "var(--surface)", ["--tw-ring-color" as string]: "var(--brand)" }} />
            </label>
            <label className="flex items-center gap-2 text-[13px]" style={{ color: "#4F5752" }}>
              Sort
              <select value={sort} onChange={e => set({ sort: e.target.value })}
                className="rounded-md border px-2 py-1.5 text-[13px] font-semibold" style={{ borderColor: "var(--rule-strong)", background: "var(--surface)", color: "var(--ink)" }}>
                {SORTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </label>
          </div>
          <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-0.5" style={{ scrollbarWidth: "none" }}>
            <LevelChip active={level === "all"} onClick={() => set({ level: null })} label="Every level" count={Object.values(levelCounts).reduce((a, b) => a + b, 0)} />
            {groups.map(g => levelCounts[g.id] ? (
              <LevelChip key={g.id} active={level === g.id} onClick={() => set({ level: g.id })} label={g.label} count={levelCounts[g.id]} />
            ) : null)}
          </div>
        </div>
      </div>

      {/* ── Board ─────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="flex items-baseline justify-between mb-4">
          <p className="text-[14px]" style={{ color: "#4F5752" }}>
            <strong className="num" style={{ color: "var(--ink)" }}>{sorted.length}</strong> {sorted.length === 1 ? "race" : "races"}
            {q && <> matching “{q}”</>}
          </p>
          <Legend />
        </div>

        {sorted.length === 0 && (
          <div className="panel p-10 text-center">
            <p className="serif text-[20px] font-semibold" style={{ color: "var(--ink)" }}>No races match.</p>
            <p className="text-[14px] mt-1" style={{ color: "#6B726D" }}>Try a last name, an office like “sheriff”, or a district like “HD 134”.</p>
            <button onClick={() => set({ q: null, view: null, level: null })} className="btn btn-ink mt-4">Show every race</button>
          </div>
        )}

        {sections.map(({ g, rows }) => (
          <section key={g?.id ?? "flat"} className="mb-10">
            {g && (
              <div className="desk-head flex items-baseline justify-between gap-4 mb-3">
                <div className="flex items-baseline gap-3">
                  <h2 className="serif text-[24px] font-semibold" style={{ color: "var(--ink)" }}>{g.label}</h2>
                  <span className="text-[13px]" style={{ color: "#6B726D" }}>{rows.length} {rows.length === 1 ? "race" : "races"}</span>
                </div>
                <MiniTally rows={rows} />
              </div>
            )}
            <div className="hidden md:grid grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_128px_minmax(0,1fr)_minmax(0,0.9fr)] gap-4 px-4 pb-2 label" style={{ color: "#7C837E", fontSize: 10 }}>
              <span>Race</span><span>Democrat</span><span className="text-center">Rating</span><span className="text-right">Republican</span><span>Last result</span>
            </div>
            <ul className="panel divide-y overflow-hidden" style={{ borderColor: "var(--rule)" }}>
              {rows.map(r => <Row key={r.key} r={r} />)}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

function LevelChip({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button onClick={onClick} aria-pressed={active}
      className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-semibold border transition-colors"
      style={active ? { background: "var(--board)", color: "#fff", borderColor: "var(--board)" } : { background: "var(--surface)", color: "#3C443F", borderColor: "var(--rule-strong)" }}>
      {label}<span className="num text-[12px]" style={{ opacity: 0.65 }}>{count}</span>
    </button>
  );
}

function Legend() {
  return (
    <div className="hidden sm:flex items-center gap-2" aria-label="Rating scale">
      <span className="label" style={{ color: "#7C837E", fontSize: 10 }}>Safe D</span>
      <span className="flex gap-[2px]">{SCALE.map(s => <span key={s} className="w-4 h-2 rounded-[1px]" style={{ background: RATING[s].color }} />)}</span>
      <span className="label" style={{ color: "#7C837E", fontSize: 10 }}>Safe R</span>
    </div>
  );
}

function MiniTally({ rows }: { rows: RaceLite[] }) {
  return (
    <div className="hidden sm:flex h-2 w-40 rounded-full overflow-hidden" aria-hidden>
      {[...rows].sort((a, b) => (a.lean ? RATING[a.lean].order : 4) - (b.lean ? RATING[b.lean].order : 4)).map(r => (
        <span key={r.key} className="flex-1" style={{ background: r.lean ? RATING[r.lean].color : "#C9CCC4" }} />
      ))}
    </div>
  );
}

function Side({ s, party, align }: { s: RaceLite["d"]; party: "D" | "R"; align: "left" | "right" }) {
  const right = align === "right";
  if (!s) return <p className={`text-[13px] italic ${right ? "md:text-right" : ""}`} style={{ color: "#9AA19C" }}>No {party === "D" ? "Democrat" : "Republican"}</p>;
  return (
    <div className={`flex items-center gap-2.5 min-w-0 ${right ? "md:flex-row-reverse md:text-right" : ""}`}>
      <Face name={s.name} party={party} photo={s.photo} size={30} />
      <div className="min-w-0">
        <p className="text-[14px] font-bold leading-tight truncate" style={{ color: "var(--ink)" }}>
          {s.name}{s.incumbent && <span className="label ml-1.5" style={{ fontSize: 9, color: "#6B726D" }}>Inc.</span>}
        </p>
        <p className="text-[12px] num" style={{ color: s.cash > 0 ? PARTY[party].color : "#9AA19C" }}>{s.cash > 0 ? `${fmt(s.cash)} on hand` : "No cash reported"}</p>
      </div>
    </div>
  );
}

function Row({ r }: { r: RaceLite }) {
  const m = r.lean ? RATING[r.lean] : null;
  return (
    <li className="relative">
      <span className="absolute left-0 top-0 bottom-0 w-[4px]" style={{ background: m?.color ?? "#C9CCC4" }} aria-hidden />
      <Link href={raceHref(r.key)} className="group grid grid-cols-1 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_128px_minmax(0,1fr)_minmax(0,0.9fr)] gap-x-4 gap-y-2.5 items-center pl-5 pr-4 py-3.5 hover:bg-[#FAFAF7] transition-colors">
        <div className="min-w-0 flex items-start justify-between gap-3 md:block">
          <div className="min-w-0">
            <p className="label" style={{ color: "#7C837E", fontSize: 10 }}>{r.tag}{r.open ? " · Open" : ""}</p>
            <p className="serif text-[16px] font-semibold leading-snug group-hover:underline decoration-1 underline-offset-4" style={{ color: "var(--ink)" }}>{r.office}</p>
          </div>
          <span className="md:hidden shrink-0"><RatingChip lean={r.lean} /></span>
        </div>
        <Side s={r.d} party="D" align="left" />
        <div className="hidden md:flex justify-center"><RatingChip lean={r.lean} /></div>
        <Side s={r.r} party="R" align="right" />
        <div className="min-w-0">
          {r.last ? (
            <div>
              <div className="flex h-1.5 rounded-full overflow-hidden" style={{ background: "#E4E6E0" }}>
                <span style={{ width: `${r.last.dPct}%`, background: PARTY.D.color }} />
                <span style={{ width: `${r.last.rPct}%`, background: PARTY.R.color }} />
              </div>
              <p className="text-[12px] mt-1 num" style={{ color: "#4F5752" }}>
                <span className="font-bold" style={{ color: r.last.dPct >= r.last.rPct ? PARTY.D.color : PARTY.R.color }}>
                  {r.last.dPct >= r.last.rPct ? "D" : "R"}+{Math.abs(r.last.dPct - r.last.rPct).toFixed(1)}
                </span>{" "}
                in {r.last.year}{r.last.proxy ? ", baseline" : ""}
              </p>
            </div>
          ) : <p className="text-[12px]" style={{ color: "#9AA19C" }}>No prior result on file</p>}
        </div>
      </Link>
    </li>
  );
}
