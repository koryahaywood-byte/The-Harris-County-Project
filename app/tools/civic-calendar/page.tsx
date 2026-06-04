"use client";

import { useState, useMemo } from "react";
import ShareButton from "@/components/ShareButton";

/* ─── Types ──────────────────────────────────────────────────────────────── */
type Category = "All" | "Elections" | "Legislature" | "Courts" | "City Council" | "HISD";

interface CivicEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD — for ranges like early voting
  category: Exclude<Category, "All">;
  description: string;
  importance: "high" | "normal";
}

/* ─── Data ───────────────────────────────────────────────────────────────── */
const EVENTS: CivicEvent[] = [
  // ── Elections 2025-2026 ──────────────────────────────────────────────────
  {
    id: "vreg-primary-2026",
    title: "Voter Registration Deadline — 2026 Primary",
    date: "2026-02-02",
    category: "Elections",
    description: "Last day to register to vote or update your registration for the March 2026 Texas Primary Election.",
    importance: "high",
  },
  {
    id: "ev-primary-2026",
    title: "Early Voting — 2026 Texas Primary",
    date: "2026-02-17",
    endDate: "2026-02-28",
    category: "Elections",
    description: "Early voting period for the March 3 Texas Primary. Harris County Clerk locations open across the county.",
    importance: "high",
  },
  {
    id: "primary-2026",
    title: "2026 Texas Primary Election Day",
    date: "2026-03-03",
    category: "Elections",
    description: "Texas statewide primary election. Vote for Democratic and Republican nominees for U.S. Senate, U.S. House, Texas Governor, state legislature, and Harris County offices.",
    importance: "high",
  },
  {
    id: "primary-runoff-vreg-2026",
    title: "Voter Registration Deadline — 2026 Primary Runoff",
    date: "2026-04-27",
    category: "Elections",
    description: "Last day to register to vote for the May 2026 Primary Runoff, if applicable.",
    importance: "normal",
  },
  {
    id: "ev-runoff-2026",
    title: "Early Voting — 2026 Primary Runoff",
    date: "2026-05-11",
    endDate: "2026-05-22",
    category: "Elections",
    description: "Early voting period for the May 26 Primary Runoff.",
    importance: "normal",
  },
  {
    id: "runoff-2026",
    title: "2026 Texas Primary Runoff",
    date: "2026-05-26",
    category: "Elections",
    description: "Primary runoff for races where no candidate received more than 50% in the March primary.",
    importance: "high",
  },
  {
    id: "vreg-general-2026",
    title: "Voter Registration Deadline — 2026 General",
    date: "2026-10-05",
    category: "Elections",
    description: "Last day to register to vote for the November 3, 2026 General Election.",
    importance: "high",
  },
  {
    id: "ev-general-2026",
    title: "Early Voting — 2026 General Election",
    date: "2026-10-19",
    endDate: "2026-10-30",
    category: "Elections",
    description: "Early voting period for the November 3 General Election.",
    importance: "high",
  },
  {
    id: "general-2026",
    title: "2026 General Election Day",
    date: "2026-11-03",
    category: "Elections",
    description: "Texas General Election. Polls open 7 AM – 7 PM. All active registered voters may participate.",
    importance: "high",
  },

  // ── Legislature ──────────────────────────────────────────────────────────
  {
    id: "lege-89-adjourn",
    title: "TX 89th Legislature Adjourned",
    date: "2025-06-02",
    category: "Legislature",
    description: "The Texas 89th Regular Legislative Session concluded. The next regular session begins January 2027.",
    importance: "normal",
  },
  {
    id: "lege-90-start",
    title: "TX 90th Legislature Convenes",
    date: "2027-01-12",
    category: "Legislature",
    description: "The 90th Texas Regular Legislative Session begins. Sessions meet every odd year from January through June.",
    importance: "high",
  },

  // ── Harris County Commissioners Court ────────────────────────────────────
  {
    id: "cc-jul-1",
    title: "Commissioners Court Meeting",
    date: "2025-07-08",
    category: "Courts",
    description: "Harris County Commissioners Court regular meeting. Agenda posted 72 hours prior at harriscountytx.gov.",
    importance: "normal",
  },
  {
    id: "cc-jul-2",
    title: "Commissioners Court Meeting",
    date: "2025-07-22",
    category: "Courts",
    description: "Harris County Commissioners Court regular meeting. Agenda posted 72 hours prior at harriscountytx.gov.",
    importance: "normal",
  },
  {
    id: "cc-aug-1",
    title: "Commissioners Court Meeting",
    date: "2025-08-12",
    category: "Courts",
    description: "Harris County Commissioners Court regular meeting.",
    importance: "normal",
  },
  {
    id: "cc-aug-2",
    title: "Commissioners Court Meeting",
    date: "2025-08-26",
    category: "Courts",
    description: "Harris County Commissioners Court regular meeting.",
    importance: "normal",
  },
  {
    id: "cc-sep-1",
    title: "Commissioners Court Meeting",
    date: "2025-09-09",
    category: "Courts",
    description: "Harris County Commissioners Court regular meeting.",
    importance: "normal",
  },
  {
    id: "cc-sep-2",
    title: "Commissioners Court Meeting",
    date: "2025-09-23",
    category: "Courts",
    description: "Harris County Commissioners Court regular meeting.",
    importance: "normal",
  },
  {
    id: "cc-oct-1",
    title: "Commissioners Court Meeting",
    date: "2025-10-14",
    category: "Courts",
    description: "Harris County Commissioners Court regular meeting.",
    importance: "normal",
  },
  {
    id: "cc-oct-2",
    title: "Commissioners Court Meeting",
    date: "2025-10-28",
    category: "Courts",
    description: "Harris County Commissioners Court regular meeting.",
    importance: "normal",
  },
  {
    id: "cc-nov-1",
    title: "Commissioners Court Meeting",
    date: "2025-11-18",
    category: "Courts",
    description: "Harris County Commissioners Court regular meeting. (Moved from Nov 11 due to Veterans Day.)",
    importance: "normal",
  },
  {
    id: "cc-dec-1",
    title: "Commissioners Court Meeting",
    date: "2025-12-09",
    category: "Courts",
    description: "Harris County Commissioners Court regular meeting.",
    importance: "normal",
  },
  {
    id: "cc-budget-2026",
    title: "Commissioners Court Budget Adoption",
    date: "2025-09-30",
    category: "Courts",
    description: "Harris County Commissioners Court typically adopts the annual budget by September 30. This is the public's best opportunity to weigh in on county spending priorities.",
    importance: "high",
  },

  // ── Houston City Council ──────────────────────────────────────────────────
  {
    id: "hcc-jul",
    title: "Houston City Council — Monthly Session",
    date: "2025-07-09",
    category: "City Council",
    description: "Houston City Council meets weekly on Wednesdays at 9 AM. Full agendas at houstontx.gov/citysec.",
    importance: "normal",
  },
  {
    id: "hcc-aug",
    title: "Houston City Council — Monthly Session",
    date: "2025-08-06",
    category: "City Council",
    description: "Houston City Council meets weekly on Wednesdays at 9 AM. Public comment accepted at the start of each meeting.",
    importance: "normal",
  },
  {
    id: "hcc-budget",
    title: "Houston City Budget Adoption",
    date: "2025-06-11",
    category: "City Council",
    description: "Houston City Council votes on the FY2026 budget. The city's fiscal year begins July 1.",
    importance: "high",
  },

  // ── HISD Board ───────────────────────────────────────────────────────────
  {
    id: "hisd-jul",
    title: "HISD Board of Managers Meeting",
    date: "2025-07-10",
    category: "HISD",
    description: "Houston ISD Board of Managers regular monthly meeting. Meetings are held at Hattie Mae White Educational Support Center.",
    importance: "normal",
  },
  {
    id: "hisd-aug",
    title: "HISD Board of Managers Meeting",
    date: "2025-08-14",
    category: "HISD",
    description: "HISD Board of Managers regular monthly meeting.",
    importance: "normal",
  },
  {
    id: "hisd-sep",
    title: "HISD Board of Managers Meeting",
    date: "2025-09-11",
    category: "HISD",
    description: "HISD Board of Managers regular monthly meeting.",
    importance: "normal",
  },
  {
    id: "hisd-oct",
    title: "HISD Board of Managers Meeting",
    date: "2025-10-09",
    category: "HISD",
    description: "HISD Board of Managers regular monthly meeting.",
    importance: "normal",
  },
  {
    id: "hisd-nov",
    title: "HISD Board of Managers Meeting",
    date: "2025-11-13",
    category: "HISD",
    description: "HISD Board of Managers regular monthly meeting.",
    importance: "normal",
  },
  {
    id: "hisd-budget",
    title: "HISD Budget Adoption",
    date: "2025-06-26",
    category: "HISD",
    description: "HISD Board of Managers adopts the annual district budget for the 2025-2026 school year.",
    importance: "high",
  },
  {
    id: "hisd-back-to-school",
    title: "HISD First Day of School",
    date: "2025-08-11",
    category: "HISD",
    description: "First day of the 2025-2026 Houston ISD school year.",
    importance: "normal",
  },
];

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatShort(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatMonthYear(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function toICSDate(dateStr: string) {
  return dateStr.replace(/-/g, "") + "T090000Z";
}

function toICSDateOnly(dateStr: string) {
  return dateStr.replace(/-/g, "");
}

function googleCalendarUrl(event: CivicEvent) {
  const start = toICSDate(event.date);
  const end = toICSDate(event.endDate ?? event.date);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${start}/${end}`,
    details: event.description,
    location: "Harris County, TX",
  });
  return `https://calendar.google.com/calendar/r/eventedit?${params.toString()}`;
}

function outlookUrl(event: CivicEvent) {
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    startdt: `${event.date}T09:00:00`,
    enddt: `${event.endDate ?? event.date}T17:00:00`,
    subject: event.title,
    body: event.description,
    location: "Harris County, TX",
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

function downloadICS(event: CivicEvent) {
  const uid = `${event.id}@harriscountyproject`;
  const start = event.endDate
    ? `DTSTART;VALUE=DATE:${toICSDateOnly(event.date)}`
    : `DTSTART:${toICSDate(event.date)}`;
  const end = event.endDate
    ? `DTEND;VALUE=DATE:${toICSDateOnly(event.endDate)}`
    : `DTEND:${toICSDate(event.date)}`;

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//The Harris County Project//EN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    start,
    end,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description.replace(/,/g, "\\,")}`,
    "LOCATION:Harris County\\, TX",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${event.id}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ─── Category metadata ──────────────────────────────────────────────────── */
const CATEGORY_COLOR: Record<Exclude<Category, "All">, string> = {
  Elections: "bg-sky-100 text-sky-700 ring-sky-200",
  Legislature: "bg-violet-100 text-violet-700 ring-violet-200",
  Courts: "bg-amber-100 text-amber-700 ring-amber-200",
  "City Council": "bg-emerald-100 text-emerald-700 ring-emerald-200",
  HISD: "bg-rose-100 text-rose-700 ring-rose-200",
};

const CATEGORIES: Category[] = ["All", "Elections", "Legislature", "Courts", "City Council", "HISD"];

/* ─── Component: EventCard ───────────────────────────────────────────────── */
function EventCard({ event }: { event: CivicEvent }) {
  const [open, setOpen] = useState(false);
  const today = new Date().toISOString().split("T")[0];
  const isPast = event.date < today;

  return (
    <div
      className={`rounded-[1.75rem] ring-1 p-[5px] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
        event.importance === "high"
          ? "bg-[var(--accent)]/5 ring-[var(--accent)]/20 hover:ring-[var(--accent)]/40 hover:shadow-lg"
          : "bg-white/60 ring-black/8 hover:ring-[var(--accent-light)] hover:shadow-md"
      } ${isPast ? "opacity-50" : ""}`}
    >
      <div className="rounded-[1.35rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] p-5">
        {/* Header row */}
        <div className="flex items-start gap-3">
          {/* Date block */}
          <div className="flex-shrink-0 w-14 text-center rounded-xl bg-[var(--accent)]/6 px-2 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent)]/60 leading-none mb-0.5">
              {new Date(event.date + "T12:00:00").toLocaleDateString("en-US", { month: "short" })}
            </p>
            <p className="text-2xl font-bold text-[var(--accent)] leading-none" style={{ fontFamily: "var(--font-playfair), serif" }}>
              {new Date(event.date + "T12:00:00").getDate()}
            </p>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className={`text-[10px] font-bold uppercase tracking-[0.15em] px-2.5 py-0.5 rounded-full ring-1 ${CATEGORY_COLOR[event.category]}`}>
                {event.category}
              </span>
              {event.importance === "high" && (
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-amber-600 bg-amber-50 ring-1 ring-amber-200 px-2.5 py-0.5 rounded-full">
                  Key Date
                </span>
              )}
              {isPast && (
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)] bg-gray-100 ring-1 ring-gray-200 px-2.5 py-0.5 rounded-full">
                  Past
                </span>
              )}
            </div>

            <h3 className="font-bold text-[var(--accent)] text-sm leading-snug" style={{ fontFamily: "var(--font-playfair), serif" }}>
              {event.title}
            </h3>

            {event.endDate && (
              <p className="text-[11px] text-[var(--muted)] mt-0.5">
                {formatShort(event.date)} – {formatShort(event.endDate)}
              </p>
            )}
          </div>

          {/* Expand toggle */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--accent)]/8 flex items-center justify-center text-[var(--accent)] transition-all duration-500 hover:bg-[var(--accent)]/15 active:scale-95"
            aria-label="Toggle details"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className={`transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${open ? "rotate-180" : ""}`}
            >
              <path d="M2 4l4 4 4-4" />
            </svg>
          </button>
        </div>

        {/* Expanded details */}
        <div
          className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${open ? "max-h-64 mt-4 opacity-100" : "max-h-0 opacity-0"}`}
        >
          <div className="border-t border-[var(--border)] pt-4">
            <p className="text-sm text-[var(--muted)] leading-relaxed mb-4">{event.description}</p>

            {!isPast && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => downloadICS(event)}
                  className="group inline-flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-light)] text-white text-xs font-semibold rounded-full px-4 py-2 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97]"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                  Apple / iCal
                </button>
                <a
                  href={googleCalendarUrl(event)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-white ring-1 ring-[var(--border)] hover:ring-[var(--accent-light)] text-[var(--accent)] text-xs font-semibold rounded-full px-4 py-2 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-sm active:scale-[0.97]"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                  Google Calendar
                </a>
                <a
                  href={outlookUrl(event)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-white ring-1 ring-[var(--border)] hover:ring-[var(--accent-light)] text-[var(--accent)] text-xs font-semibold rounded-full px-4 py-2 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-sm active:scale-[0.97]"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  Outlook
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function CivicCalendar() {
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const today = new Date().toISOString().split("T")[0];

  const filtered = useMemo(() => {
    return EVENTS.filter((e) => activeCategory === "All" || e.category === activeCategory).sort(
      (a, b) => a.date.localeCompare(b.date)
    );
  }, [activeCategory]);

  // Group by month
  const grouped = useMemo(() => {
    const map = new Map<string, CivicEvent[]>();
    for (const e of filtered) {
      const key = formatMonthYear(e.date);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return map;
  }, [filtered]);

  const upcoming = filtered.filter((e) => e.date >= today);
  const nextKey = upcoming[0]?.date ? formatMonthYear(upcoming[0].date) : null;

  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div className="bg-[var(--accent)] text-white px-6 py-16 md:py-24 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_80%_50%,rgba(37,99,168,0.4),transparent)]" />
        <div className="max-w-6xl mx-auto relative z-10">
          <p className="text-sky-300/80 text-[11px] font-bold uppercase tracking-[0.25em] mb-3">
            Community
          </p>
          <h1
            className="text-3xl md:text-4xl font-bold leading-tight mb-2"
            style={{ fontFamily: "var(--font-playfair), serif" }}
          >
            Civic Calendar
          </h1>
          <p className="text-white/70 text-sm max-w-lg">
            Election days, voter registration deadlines, commissioners court, city council, HISD board — every date that matters. Add any event directly to your calendar.
          </p>
          <ShareButton
            toolName="Civic Calendar"
            section="Community"
            description="Election days, voter registration deadlines, commissioners court, city council, HISD board — every date that matters."
          />

          {/* Next up pill */}
          {upcoming[0] && (
            <div className="mt-6 inline-flex items-center gap-3 bg-white/10 ring-1 ring-white/20 rounded-full px-5 py-2.5 text-sm">
              <span className="w-2 h-2 rounded-full bg-sky-300 animate-pulse flex-shrink-0" />
              <span className="text-white/70 text-xs uppercase tracking-widest font-semibold">Next Up</span>
              <span className="text-white font-semibold">{upcoming[0].title}</span>
              <span className="text-white/50 text-xs">{formatShort(upcoming[0].date)}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Filters ───────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-[var(--background)]/90 backdrop-blur border-b border-[var(--border)] px-6 py-3">
        <div className="max-w-6xl mx-auto flex gap-2 overflow-x-auto scrollbar-none pb-0.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 text-xs font-bold uppercase tracking-[0.12em] px-4 py-2 rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                activeCategory === cat
                  ? "bg-[var(--accent)] text-white shadow-sm"
                  : "bg-white ring-1 ring-[var(--border)] text-[var(--muted)] hover:ring-[var(--accent-light)] hover:text-[var(--accent)]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Timeline ──────────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-6 py-16">
        {grouped.size === 0 && (
          <div className="text-center py-20 text-[var(--muted)]">No events in this category.</div>
        )}

        {Array.from(grouped.entries()).map(([monthYear, events]) => {
          const isCurrentMonth = nextKey === monthYear;
          return (
            <div key={monthYear} className="mb-14">
              {/* Month label */}
              <div className="flex items-center gap-3 mb-6">
                {isCurrentMonth && (
                  <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse flex-shrink-0" />
                )}
                <span
                  className={`text-lg font-bold ${isCurrentMonth ? "text-[var(--accent)]" : "text-[var(--muted)]"}`}
                  style={{ fontFamily: "var(--font-playfair), serif" }}
                >
                  {monthYear}
                </span>
                <span className="flex-1 h-px bg-[var(--border)]" />
              </div>

              {/* Events */}
              <div className="flex flex-col gap-3">
                {events.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          );
        })}

        {/* Footer note */}
        <div className="mt-8 rounded-[1.75rem] bg-white/60 ring-1 ring-black/8 p-[5px]">
          <div className="rounded-[1.35rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] p-5 text-center">
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Dates are gathered from official public sources. Commissioners Court and board meetings may be rescheduled.{" "}
              <a href="mailto:koryahaywood@gmail.com" className="text-[var(--accent-light)] underline underline-offset-2">
                Submit a missing date →
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
