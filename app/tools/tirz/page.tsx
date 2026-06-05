"use client";
import { useState } from "react";
import Link from "next/link";
import ShareButton from "@/components/ShareButton";

/* ─── TIRZ Data — City of Houston ───────────────────────────────────────── */
interface BoardAppointer {
  appointer: string;      // e.g. "Mayor", "District H Council Member"
  seats: number;
  currentHolder?: string; // current officeholder name
  profileSlug?: string;   // link to /politicians/[slug]
}

interface TIRZ {
  id: number;
  name: string;
  neighborhood: string;
  created: number;
  expires: number;
  areaSqMi: number;
  totalRevenueM: number;
  projectsCount: number;
  keyProject: string;
  status: "Active" | "Expired";
  lat: number;
  lng: number;
  boardSize: number;
  boardAppointers: BoardAppointer[];
  meetingSchedule: string;
}

const TIRZ_DATA: TIRZ[] = [
  { id:  1, name: "Main Street/Market Square", neighborhood: "Downtown",         created: 1995, expires: 2030, areaSqMi: 0.8, totalRevenueM: 142, projectsCount: 38, keyProject: "Main Street Square redevelopment", status: "Active", lat: 29.757, lng: -95.366,
    boardSize: 13, meetingSchedule: "3rd Thursday, monthly",
    boardAppointers: [
      { appointer: "Mayor", seats: 2, currentHolder: "John Whitmire", profileSlug: "john-whitmire" },
      { appointer: "District H Council Member", seats: 4, currentHolder: "Mario Castillo", profileSlug: "mario-castillo" },
      { appointer: "District I Council Member", seats: 3, currentHolder: "Joaquin Martinez", profileSlug: "joaquin-martinez" },
      { appointer: "At-Large Members", seats: 4 },
    ]},
  { id:  2, name: "Upper Kirby",               neighborhood: "Upper Kirby",      created: 1997, expires: 2032, areaSqMi: 1.2, totalRevenueM:  89, projectsCount: 24, keyProject: "Kirby Drive streetscaping", status: "Active", lat: 29.735, lng: -95.416,
    boardSize: 11, meetingSchedule: "2nd Wednesday, monthly",
    boardAppointers: [
      { appointer: "Mayor", seats: 2, currentHolder: "John Whitmire", profileSlug: "john-whitmire" },
      { appointer: "District G Council Member", seats: 4, currentHolder: "Mary Nan Huffman", profileSlug: "mary-nan-huffman" },
      { appointer: "District C Council Member", seats: 3, currentHolder: "Joe Panzarella", profileSlug: "joe-panzarella" },
      { appointer: "At-Large Members", seats: 2 },
    ]},
  { id:  3, name: "Old Spanish Trail",         neighborhood: "South Houston",    created: 1999, expires: 2034, areaSqMi: 2.1, totalRevenueM:  54, projectsCount: 18, keyProject: "MacGregor Park improvements", status: "Active", lat: 29.715, lng: -95.355,
    boardSize: 9, meetingSchedule: "1st Tuesday, monthly",
    boardAppointers: [
      { appointer: "Mayor", seats: 2, currentHolder: "John Whitmire", profileSlug: "john-whitmire" },
      { appointer: "District D Council Member", seats: 4, currentHolder: "Carolyn Evans-Shabazz", profileSlug: "carolyn-evans-shabazz" },
      { appointer: "At-Large Members", seats: 3 },
    ]},
  { id:  4, name: "Midtown",                   neighborhood: "Midtown",          created: 1999, expires: 2034, areaSqMi: 1.9, totalRevenueM: 198, projectsCount: 62, keyProject: "Baldwin Park and Bagby corridor", status: "Active", lat: 29.744, lng: -95.375,
    boardSize: 13, meetingSchedule: "4th Tuesday, monthly",
    boardAppointers: [
      { appointer: "Mayor", seats: 3, currentHolder: "John Whitmire", profileSlug: "john-whitmire" },
      { appointer: "District H Council Member", seats: 4, currentHolder: "Mario Castillo", profileSlug: "mario-castillo" },
      { appointer: "District D Council Member", seats: 3, currentHolder: "Carolyn Evans-Shabazz", profileSlug: "carolyn-evans-shabazz" },
      { appointer: "At-Large Members", seats: 3 },
    ]},
  { id:  5, name: "Memorial Heights",          neighborhood: "Memorial Heights", created: 2000, expires: 2035, areaSqMi: 1.4, totalRevenueM:  76, projectsCount: 21, keyProject: "White Oak Bayou hike/bike trail", status: "Active", lat: 29.766, lng: -95.402,
    boardSize: 11, meetingSchedule: "2nd Thursday, monthly",
    boardAppointers: [
      { appointer: "Mayor", seats: 2, currentHolder: "John Whitmire", profileSlug: "john-whitmire" },
      { appointer: "District H Council Member", seats: 3, currentHolder: "Mario Castillo", profileSlug: "mario-castillo" },
      { appointer: "District C Council Member", seats: 3, currentHolder: "Joe Panzarella", profileSlug: "joe-panzarella" },
      { appointer: "At-Large Members", seats: 3 },
    ]},
  { id:  6, name: "Eastside",                  neighborhood: "East End",         created: 2001, expires: 2036, areaSqMi: 3.2, totalRevenueM:  48, projectsCount: 15, keyProject: "Navigation Boulevard improvements", status: "Active", lat: 29.750, lng: -95.337,
    boardSize: 9, meetingSchedule: "3rd Wednesday, monthly",
    boardAppointers: [
      { appointer: "Mayor", seats: 2, currentHolder: "John Whitmire", profileSlug: "john-whitmire" },
      { appointer: "District I Council Member", seats: 4, currentHolder: "Joaquin Martinez", profileSlug: "joaquin-martinez" },
      { appointer: "At-Large Members", seats: 3 },
    ]},
  { id:  7, name: "Old Sixth Ward",            neighborhood: "Sixth Ward",       created: 2001, expires: 2036, areaSqMi: 0.6, totalRevenueM:  32, projectsCount: 12, keyProject: "Victorian streetscaping project", status: "Active", lat: 29.763, lng: -95.394,
    boardSize: 9, meetingSchedule: "1st Wednesday, monthly",
    boardAppointers: [
      { appointer: "Mayor", seats: 2, currentHolder: "John Whitmire", profileSlug: "john-whitmire" },
      { appointer: "District C Council Member", seats: 4, currentHolder: "Joe Panzarella", profileSlug: "joe-panzarella" },
      { appointer: "At-Large Members", seats: 3 },
    ]},
  { id:  8, name: "Chinatown",                 neighborhood: "Chinatown",        created: 2003, expires: 2038, areaSqMi: 2.4, totalRevenueM:  58, projectsCount: 19, keyProject: "Bellaire Blvd corridor improvements", status: "Active", lat: 29.706, lng: -95.462,
    boardSize: 11, meetingSchedule: "2nd Monday, monthly",
    boardAppointers: [
      { appointer: "Mayor", seats: 2, currentHolder: "John Whitmire", profileSlug: "john-whitmire" },
      { appointer: "District F Council Member", seats: 4, currentHolder: "Tiffany Thomas", profileSlug: "tiffany-thomas" },
      { appointer: "District G Council Member", seats: 3, currentHolder: "Mary Nan Huffman", profileSlug: "mary-nan-huffman" },
      { appointer: "At-Large Members", seats: 2 },
    ]},
  { id:  9, name: "South Post Oak",            neighborhood: "Westwood",         created: 2003, expires: 2038, areaSqMi: 1.8, totalRevenueM:  44, projectsCount: 14, keyProject: "Community park network", status: "Active", lat: 29.685, lng: -95.456,
    boardSize: 9, meetingSchedule: "3rd Monday, monthly",
    boardAppointers: [
      { appointer: "Mayor", seats: 2, currentHolder: "John Whitmire", profileSlug: "john-whitmire" },
      { appointer: "District F Council Member", seats: 4, currentHolder: "Tiffany Thomas", profileSlug: "tiffany-thomas" },
      { appointer: "At-Large Members", seats: 3 },
    ]},
  { id: 10, name: "Lake Houston",              neighborhood: "Kingwood",         created: 2004, expires: 2039, areaSqMi: 4.1, totalRevenueM:  38, projectsCount: 11, keyProject: "Town center redevelopment", status: "Active", lat: 30.046, lng: -95.178,
    boardSize: 9, meetingSchedule: "2nd Tuesday, monthly",
    boardAppointers: [
      { appointer: "Mayor", seats: 2, currentHolder: "John Whitmire", profileSlug: "john-whitmire" },
      { appointer: "District E Council Member", seats: 4, currentHolder: "Fred Flickinger", profileSlug: "fred-flickinger" },
      { appointer: "At-Large Members", seats: 3 },
    ]},
  { id: 14, name: "Fourth Ward",               neighborhood: "Freedmen's Town",  created: 2006, expires: 2041, areaSqMi: 0.7, totalRevenueM:  28, projectsCount:  9, keyProject: "Historic preservation & affordable housing", status: "Active", lat: 29.757, lng: -95.380,
    boardSize: 11, meetingSchedule: "1st Thursday, monthly",
    boardAppointers: [
      { appointer: "Mayor", seats: 2, currentHolder: "John Whitmire", profileSlug: "john-whitmire" },
      { appointer: "District H Council Member", seats: 4, currentHolder: "Mario Castillo", profileSlug: "mario-castillo" },
      { appointer: "District C Council Member", seats: 3, currentHolder: "Joe Panzarella", profileSlug: "joe-panzarella" },
      { appointer: "At-Large Members", seats: 2 },
    ]},
  { id: 17, name: "Memorial City",             neighborhood: "Memorial City",    created: 2007, expires: 2042, areaSqMi: 2.6, totalRevenueM:  92, projectsCount: 27, keyProject: "BRT transit and pedestrian grid", status: "Active", lat: 29.766, lng: -95.498,
    boardSize: 11, meetingSchedule: "4th Wednesday, monthly",
    boardAppointers: [
      { appointer: "Mayor", seats: 2, currentHolder: "John Whitmire", profileSlug: "john-whitmire" },
      { appointer: "District G Council Member", seats: 5, currentHolder: "Mary Nan Huffman", profileSlug: "mary-nan-huffman" },
      { appointer: "At-Large Members", seats: 4 },
    ]},
  { id: 21, name: "Hardy Yards",               neighborhood: "Near Northside",   created: 2012, expires: 2047, areaSqMi: 0.5, totalRevenueM:  22, projectsCount:  7, keyProject: "Hardy mixed-use development", status: "Active", lat: 29.775, lng: -95.361,
    boardSize: 9, meetingSchedule: "3rd Tuesday, monthly",
    boardAppointers: [
      { appointer: "Mayor", seats: 2, currentHolder: "John Whitmire", profileSlug: "john-whitmire" },
      { appointer: "District H Council Member", seats: 4, currentHolder: "Mario Castillo", profileSlug: "mario-castillo" },
      { appointer: "At-Large Members", seats: 3 },
    ]},
  { id: 23, name: "Gulfgate/Pine Valley",      neighborhood: "Gulfgate",         created: 2014, expires: 2049, areaSqMi: 1.9, totalRevenueM:  18, projectsCount:  6, keyProject: "Gulfgate center redesign", status: "Active", lat: 29.698, lng: -95.312,
    boardSize: 9, meetingSchedule: "2nd Wednesday, monthly",
    boardAppointers: [
      { appointer: "Mayor", seats: 2, currentHolder: "John Whitmire", profileSlug: "john-whitmire" },
      { appointer: "District E Council Member", seats: 4, currentHolder: "Fred Flickinger", profileSlug: "fred-flickinger" },
      { appointer: "At-Large Members", seats: 3 },
    ]},
  { id: 26, name: "Montrose",                  neighborhood: "Montrose",         created: 2017, expires: 2052, areaSqMi: 1.6, totalRevenueM:  34, projectsCount: 10, keyProject: "Westheimer streetscaping phase 1", status: "Active", lat: 29.741, lng: -95.392,
    boardSize: 9, meetingSchedule: "1st Monday, monthly",
    boardAppointers: [
      { appointer: "Mayor", seats: 2, currentHolder: "John Whitmire", profileSlug: "john-whitmire" },
      { appointer: "District C Council Member", seats: 4, currentHolder: "Joe Panzarella", profileSlug: "joe-panzarella" },
      { appointer: "At-Large Members", seats: 3 },
    ]},
  { id: 27, name: "Houston Healthcare Innovation", neighborhood: "Medical Center", created: 2018, expires: 2053, areaSqMi: 1.3, totalRevenueM:  61, projectsCount: 16, keyProject: "TMC3 campus infrastructure", status: "Active", lat: 29.706, lng: -95.398,
    boardSize: 13, meetingSchedule: "3rd Wednesday, monthly",
    boardAppointers: [
      { appointer: "Mayor", seats: 3, currentHolder: "John Whitmire", profileSlug: "john-whitmire" },
      { appointer: "District D Council Member", seats: 3, currentHolder: "Carolyn Evans-Shabazz", profileSlug: "carolyn-evans-shabazz" },
      { appointer: "District K Council Member", seats: 3, currentHolder: "Martha Castex-Tatum", profileSlug: "martha-castex-tatum" },
      { appointer: "TMC Representative", seats: 2 },
      { appointer: "At-Large Members", seats: 2 },
    ]},
];

const TOTAL_REVENUE = TIRZ_DATA.reduce((s, t) => s + t.totalRevenueM, 0);

function TIRZCard({ tirz, selected, onClick }: { tirz: TIRZ; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-[1.35rem] ring-1 p-[4px] w-full card-lift transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
        selected
          ? "ring-[var(--accent)] bg-[var(--accent)]/5 shadow-lg"
          : "ring-black/8 bg-white/60 hover:ring-[var(--accent-light)]"
      }`}
    >
      <div className="rounded-[1rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] px-4 py-3">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div>
            <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--muted)]">TIRZ {tirz.id}</span>
            <p className="font-bold text-[var(--accent)] text-sm leading-tight" style={{ fontFamily: "var(--font-playfair), serif" }}>
              {tirz.name}
            </p>
            <p className="text-[11px] text-[var(--muted)]">{tirz.neighborhood}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-base font-bold text-[var(--accent)]" style={{ fontFamily: "var(--font-playfair), serif" }}>
              ${tirz.totalRevenueM}M
            </p>
            <p className="text-[9px] text-[var(--muted)] uppercase tracking-widest">Tax Increment</p>
          </div>
        </div>

        {selected && (
          <div className="mt-3 pt-3 border-t border-[var(--border)] space-y-3 text-left">
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Created", value: tirz.created },
                { label: "Expires", value: tirz.expires },
                { label: "Projects", value: tirz.projectsCount },
              ].map((s) => (
                <div key={s.label} className="bg-[var(--accent)]/5 rounded-xl px-2 py-2 text-center">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--muted)]">{s.label}</p>
                  <p className="text-sm font-bold text-[var(--accent)]" style={{ fontFamily: "var(--font-playfair), serif" }}>{s.value}</p>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-[var(--muted)] leading-snug">
              <span className="font-semibold text-[var(--foreground)]">Key project: </span>
              {tirz.keyProject}
            </p>
            <p className="text-[11px] text-[var(--muted)]">Area: {tirz.areaSqMi} sq mi</p>

            {/* Governance panel */}
            <div className="rounded-xl bg-[var(--accent)]/5 ring-1 ring-[var(--accent)]/10 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--accent)]">Board Governance</p>
                <span className="text-[9px] font-semibold text-[var(--muted)] bg-white rounded-full px-2 py-0.5 ring-1 ring-black/8">
                  {tirz.boardSize} seats
                </span>
              </div>

              <div className="space-y-1.5">
                {tirz.boardAppointers.map((a, i) => (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold text-[var(--foreground)] truncate">{a.appointer}</p>
                        {a.currentHolder && (
                          a.profileSlug ? (
                            <Link href={`/politicians/${a.profileSlug}`}
                              className="text-[9px] text-[var(--accent-light)] hover:underline underline-offset-1 truncate block">
                              {a.currentHolder} →
                            </Link>
                          ) : (
                            <p className="text-[9px] text-[var(--muted)] truncate">{a.currentHolder}</p>
                          )
                        )}
                      </div>
                    </div>
                    <span className="text-[9px] font-bold text-[var(--accent)] flex-shrink-0 bg-white rounded-full px-1.5 py-0.5 ring-1 ring-black/8">
                      {a.seats} seat{a.seats !== 1 ? "s" : ""}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-1 border-t border-[var(--accent)]/10 flex items-center gap-1">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted)] flex-shrink-0">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                <p className="text-[9px] text-[var(--muted)]">Meets: {tirz.meetingSchedule}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </button>
  );
}

export default function TIRZTool() {
  const [selected, setSelected] = useState<number | null>(null);
  const [sort, setSort] = useState<"revenue" | "created" | "projects">("revenue");

  const sorted = [...TIRZ_DATA].sort((a, b) => {
    if (sort === "revenue") return b.totalRevenueM - a.totalRevenueM;
    if (sort === "created") return a.created - b.created;
    return b.projectsCount - a.projectsCount;
  });

  const selectedTIRZ = TIRZ_DATA.find((t) => t.id === selected);

  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div className="bg-[var(--accent)] text-white px-6 py-16 md:py-24 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_80%_50%,rgba(37,99,168,0.4),transparent)]" />
        <div className="max-w-6xl mx-auto relative z-10">
          <p className="text-sky-300/80 text-[11px] font-bold uppercase tracking-[0.25em] mb-3">Money</p>
          <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-2" style={{ fontFamily: "var(--font-playfair), serif" }}>
            TIRZ Tool
          </h1>
          <p className="text-white/70 text-sm max-w-lg mb-4">
            Tax Increment Reinvestment Zones redirect a portion of local property tax growth back into a defined area for infrastructure and development. Houston has {TIRZ_DATA.length}+ active TIRZs.
          </p>
          <ShareButton
            toolName="TIRZ Tool"
            section="Money"
            description="Tax Increment Reinvestment Zones — Houston's 16 active TIRZs mapped and ranked by revenue captured."
            stats={[{ label: "Active TIRZs", value: "16" }, { label: "Focus", value: "Houston" }]}
          />
          <div className="flex gap-4 flex-wrap">
            <div className="bg-white/10 ring-1 ring-white/20 rounded-2xl px-5 py-3">
              <p className="text-sky-300/80 text-[9px] font-bold uppercase tracking-widest mb-0.5">Total Tax Increment (shown)</p>
              <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-playfair), serif" }}>${TOTAL_REVENUE}M</p>
            </div>
            <div className="bg-white/10 ring-1 ring-white/20 rounded-2xl px-5 py-3">
              <p className="text-sky-300/80 text-[9px] font-bold uppercase tracking-widest mb-0.5">Active TIRZs</p>
              <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-playfair), serif" }}>{TIRZ_DATA.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Explainer ─────────────────────────────────────────────────── */}
      <div className="bg-amber-50 border-b border-amber-200 px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs text-amber-800 leading-relaxed max-w-3xl">
            <strong>What is a TIRZ?</strong> When a TIRZ is created, the tax base is frozen. As property values rise, the additional tax revenue (the &ldquo;increment&rdquo;) goes into the TIRZ fund instead of the general budget — funding local improvements like streets, parks, and drainage. Critics argue TIRZs can divert money from schools and city services.
          </p>
        </div>
      </div>

      {/* ── Controls ──────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-[var(--background)]/90 backdrop-blur border-b border-[var(--border)] px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Sort:</span>
          {([["revenue", "Tax Increment"], ["created", "Date Created"], ["projects", "# Projects"]] as const).map(([s, label]) => (
            <button key={s} onClick={() => setSort(s)}
              className={`text-xs font-bold uppercase tracking-[0.1em] px-3 py-1.5 rounded-full transition-all duration-500 ${sort === s ? "bg-[var(--accent)] text-white" : "bg-white ring-1 ring-[var(--border)] text-[var(--muted)] hover:ring-[var(--accent-light)]"}`}>
              {label}
            </button>
          ))}
          {selected && (
            <button onClick={() => setSelected(null)} className="ml-auto text-xs font-semibold text-[var(--accent-light)] underline underline-offset-2">
              Clear selection
            </button>
          )}
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Revenue bar chart */}
        <div className="rounded-[1.75rem] bg-white/60 ring-1 ring-black/8 p-[6px] mb-8">
          <div className="rounded-[1.35rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] mb-4">Tax Increment Revenue by TIRZ</p>
            <div className="flex flex-col gap-2">
              {[...TIRZ_DATA].sort((a, b) => b.totalRevenueM - a.totalRevenueM).map((t) => {
                const max = Math.max(...TIRZ_DATA.map((x) => x.totalRevenueM));
                return (
                  <div key={t.id} className="flex items-center gap-3 group cursor-pointer" onClick={() => setSelected(selected === t.id ? null : t.id)}>
                    <span className="w-4 text-[10px] font-bold text-[var(--muted)] flex-shrink-0 text-right">{t.id}</span>
                    <span className="w-32 text-xs text-[var(--foreground)] flex-shrink-0 truncate">{t.name}</span>
                    <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-[var(--accent)] group-hover:bg-[var(--accent-light)] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
                        style={{ width: `${(t.totalRevenueM / max) * 100}%` }} />
                    </div>
                    <span className="text-xs font-bold text-[var(--accent)] w-14 text-right flex-shrink-0">${t.totalRevenueM}M</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* TIRZ cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sorted.map((tirz) => (
            <TIRZCard
              key={tirz.id}
              tirz={tirz}
              selected={selected === tirz.id}
              onClick={() => setSelected(selected === tirz.id ? null : tirz.id)}
            />
          ))}
        </div>

        <div className="mt-10 rounded-[1.75rem] bg-white/60 ring-1 ring-black/8 p-[5px]">
          <div className="rounded-[1.35rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] p-5 text-center">
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Data from Houston TIRZ annual reports and City of Houston Finance Dept. Revenue figures are cumulative since creation.{" "}
              <a href="https://www.houstontx.gov/tirz" target="_blank" rel="noopener noreferrer" className="text-[var(--accent-light)] underline underline-offset-2">Official TIRZ page →</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
