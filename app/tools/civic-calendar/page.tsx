"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import type { MapEvent } from "./CivicMap";

const CivicMap = dynamic(() => import("./CivicMap"), { ssr: false, loading: () => (
  <div className="flex items-center justify-center rounded-2xl animate-pulse" style={{ height: 240, background: "#f0f4f8" }}>
    <p className="text-xs" style={{ color: "#9ca3af" }}>Loading map…</p>
  </div>
) });

/* ─── Types ──────────────────────────────────────────────────────────────── */
import { EVENTS, CAT_COLOR, type Category, type CivicEvent } from "@/lib/civic-events";

type FilterGroup = "all" | "political" | "governmental" | "civic";

const POLITICAL:     Category[] = ["Elections", "Legislature"];
const GOVERNMENTAL:  Category[] = ["Courts", "City Council", "HISD"];
const CIVIC_CATS:    Category[] = ["Civic"];

/* ─── Calendar helpers ───────────────────────────────────────────────────── */
function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function firstWeekday(y: number, m: number) { return new Date(y, m, 1).getDay(); }
function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

interface CalDay {
  dateStr: string;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

function buildGrid(year: number, month: number): CalDay[][] {
  const today = new Date().toISOString().split("T")[0];
  const firstWd = firstWeekday(year, month);
  const dim = daysInMonth(year, month);
  const prevDim = daysInMonth(year, month - 1);
  const cells: CalDay[] = [];

  // Leading days (prev month)
  for (let i = firstWd - 1; i >= 0; i--) {
    const d = prevDim - i;
    const m2 = month === 0 ? 11 : month - 1;
    const y2 = month === 0 ? year - 1 : year;
    const dateStr = toDateStr(y2, m2, d);
    cells.push({ dateStr, day: d, isCurrentMonth: false, isToday: dateStr === today });
  }
  // Current month
  for (let d = 1; d <= dim; d++) {
    const dateStr = toDateStr(year, month, d);
    cells.push({ dateStr, day: d, isCurrentMonth: true, isToday: dateStr === today });
  }
  // Trailing
  const need = 42 - cells.length;
  for (let d = 1; d <= need; d++) {
    const m2 = month === 11 ? 0 : month + 1;
    const y2 = month === 11 ? year + 1 : year;
    const dateStr = toDateStr(y2, m2, d);
    cells.push({ dateStr, day: d, isCurrentMonth: false, isToday: dateStr === today });
  }

  const weeks: CalDay[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/* ─── ICS / calendar add helpers ────────────────────────────────────────── */
function toICSDate(s: string) { return s.replace(/-/g, "") + "T090000Z"; }
function toICSDateOnly(s: string) { return s.replace(/-/g, ""); }

function googleCalendarUrl(event: CivicEvent) {
  const params = new URLSearchParams({
    action: "TEMPLATE", text: event.title,
    dates: `${toICSDate(event.date)}/${toICSDate(event.endDate ?? event.date)}`,
    details: event.description, location: "Harris County, TX",
  });
  return `https://calendar.google.com/calendar/r/eventedit?${params}`;
}

function downloadICS(event: CivicEvent) {
  const start = event.endDate
    ? `DTSTART;VALUE=DATE:${toICSDateOnly(event.date)}`
    : `DTSTART:${toICSDate(event.date)}`;
  const end = event.endDate
    ? `DTEND;VALUE=DATE:${toICSDateOnly(event.endDate)}`
    : `DTEND:${toICSDate(event.date)}`;
  const ics = ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//The Harris County Project//EN",
    "BEGIN:VEVENT",`UID:${event.id}@harriscountyproject`,start,end,
    `SUMMARY:${event.title}`,`DESCRIPTION:${event.description.replace(/,/g,"\\,")}`,
    "LOCATION:Harris County\\, TX","END:VEVENT","END:VCALENDAR"].join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
  a.download = `${event.id}.ics`;
  a.click();
}

/* ─── Event detail panel ─────────────────────────────────────────────────── */
function EventDetail({ event }: { event: CivicEvent }) {
  const today = new Date().toISOString().split("T")[0];
  const isPast = event.date < today;
  const cc = CAT_COLOR[event.category];
  const d = new Date(event.date + "T12:00:00");
  const dateLabel = d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="rounded-2xl overflow-hidden ring-1 ring-black/8" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(26,58,92,0.07)" }}>
      {/* Top accent */}
      <div style={{ height: 3, background: event.importance === "high" ? cc : `${cc}60` }}/>
      <div className="p-5">
        <div className="flex items-start gap-3 mb-3">
          {/* Date block */}
          <div className="shrink-0 w-12 text-center rounded-xl py-2 px-1" style={{ background: `${cc}10` }}>
            <p className="text-[9px] font-bold uppercase tracking-widest leading-none mb-0.5" style={{ color: cc }}>
              {d.toLocaleDateString("en-US", { month: "short" })}
            </p>
            <p className="text-xl font-bold leading-none" style={{ color: cc, fontFamily: "var(--font-playfair), serif" }}>
              {d.getDate()}
            </p>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-1.5 mb-1">
              <span className="text-[9px] font-bold uppercase tracking-[0.15em] px-2 py-0.5 rounded-full"
                style={{ background: `${cc}15`, color: cc }}>
                {event.category}
              </span>
              {event.importance === "high" && (
                <span className="text-[9px] font-bold uppercase tracking-[0.12em] px-2 py-0.5 rounded-full"
                  style={{ background: "#fef3c7", color: "#b45309" }}>
                  Key Date
                </span>
              )}
              {isPast && (
                <span className="text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{ background: "#f3f4f6", color: "#6b7280" }}>Past</span>
              )}
            </div>
            <h3 className="font-bold text-sm leading-snug" style={{ color: "#1a3a5c", fontFamily: "var(--font-playfair), serif" }}>
              {event.title}
            </h3>
            <p className="text-[11px] mt-0.5" style={{ color: "#9ca3af" }}>
              {event.endDate
                ? `${dateLabel}: ${new Date(event.endDate + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric" })}`
                : dateLabel}
            </p>
          </div>
        </div>
        <p className="text-xs leading-relaxed mb-3" style={{ color: "#6b7280" }}>{event.description}</p>
        {!isPast && (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => downloadICS(event)}
              className="px-3 py-1.5 rounded-full text-[10px] font-bold transition-colors duration-150"
              style={{ background: "#1a3a5c", color: "#fff" }}>
              + Apple / iCal
            </button>
            <a href={googleCalendarUrl(event)} target="_blank" rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-full text-[10px] font-semibold ring-1 ring-black/10 transition-colors duration-150"
              style={{ background: "#fff", color: "#1a3a5c" }}>
              + Google Calendar
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export default function CivicCalendar() {
  const now = new Date();
  const [year, setYear]         = useState(now.getFullYear());
  const [month, setMonth]       = useState(now.getMonth());
  const [filter, setFilter]     = useState<FilterGroup>("all");
  const [cats, setCats]         = useState<Set<Category>>(new Set(["Elections","Legislature","Courts","City Council","HISD","Civic"]));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1);
    setSelectedDate(null);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1);
    setSelectedDate(null);
  }
  function jumpToday() {
    setYear(now.getFullYear()); setMonth(now.getMonth());
    setSelectedDate(now.toISOString().split("T")[0]);
  }

  function applyFilterGroup(g: FilterGroup) {
    setFilter(g);
    if (g === "all")          setCats(new Set(["Elections","Legislature","Courts","City Council","HISD","Civic"]));
    if (g === "political")    setCats(new Set(POLITICAL));
    if (g === "governmental") setCats(new Set(GOVERNMENTAL));
    if (g === "civic")        setCats(new Set(CIVIC_CATS));
  }

  function toggleCat(c: Category) {
    setCats(prev => {
      const next = new Set(prev);
      next.has(c) ? next.delete(c) : next.add(c);
      return next;
    });
    setFilter("all");
  }

  // Map events to dates (multi-day events appear on every date in range)
  const eventMap = useMemo(() => {
    const m = new Map<string, CivicEvent[]>();
    for (const e of EVENTS) {
      if (!cats.has(e.category)) continue;
      // Enumerate all dates in range
      const start = new Date(e.date + "T12:00:00");
      const end   = e.endDate ? new Date(e.endDate + "T12:00:00") : start;
      const cur   = new Date(start);
      while (cur <= end) {
        const ds = cur.toISOString().split("T")[0];
        if (!m.has(ds)) m.set(ds, []);
        m.get(ds)!.push(e);
        cur.setDate(cur.getDate() + 1);
      }
    }
    return m;
  }, [cats]);

  const grid = useMemo(() => buildGrid(year, month), [year, month]);

  const selectedEvents = useMemo(() =>
    selectedDate ? (eventMap.get(selectedDate) ?? []) : [],
    [selectedDate, eventMap]
  );

  // Civic map events for current month view
  const civicMapEvents = useMemo((): MapEvent[] => {
    const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
    return EVENTS
      .filter(e => e.category === "Civic" && e.date.startsWith(monthStr) && e.location)
      .map(e => ({
        id: e.id,
        title: e.title,
        address: e.location!.address,
        lat: e.location!.lat,
        lng: e.location!.lng,
        color: CAT_COLOR.Civic,
        date: e.date,
      }));
  }, [year, month]);

  // Upcoming event for "next up" banner
  const today = now.toISOString().split("T")[0];
  const nextUp = EVENTS
    .filter(e => cats.has(e.category) && e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  return (
    <div style={{ background: "var(--bg, #f2f5f9)", minHeight: "100vh", fontFamily: "var(--font-outfit), sans-serif" }}>
      {/* Hero */}
      <section className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,#1a3a5c 0%,#0f2540 60%,#162e4a 100%)", paddingTop: "3rem", paddingBottom: "3rem" }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 70% 60% at 80% 40%,rgba(37,99,168,0.18) 0%,transparent 70%)" }}/>
        <div className="relative max-w-6xl mx-auto px-5">
          <p className="text-sky-300 text-xs font-bold uppercase tracking-[0.22em] mb-3">Community</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2"
            style={{ fontFamily: "var(--font-playfair), serif" }}>Civic Calendar</h1>
          <p className="text-white/50 text-sm max-w-lg mb-4">
            Election days, voter registration deadlines, court meetings, city council, HISD. Every date that matters.
          </p>
          {nextUp && (
            <div className="inline-flex items-center gap-3 rounded-full px-4 py-2 text-xs"
              style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.15)" }}>
              <span className="relative flex h-2 w-2">
                <span className="alive-halo absolute inset-0 rounded-full bg-sky-400"/>
                <span className="alive-pulse relative h-2 w-2 rounded-full bg-sky-400"/>
              </span>
              <span className="text-white/50 font-semibold uppercase tracking-wider text-[10px]">Next Up</span>
              <span className="text-white font-semibold">{nextUp.title}</span>
              <span className="text-white/40">{new Date(nextUp.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
            </div>
          )}
        </div>
      </section>

      {/* Main layout */}
      <div className="max-w-6xl mx-auto px-4 py-8 flex gap-6 items-start">

        {/* ── Sidebar ──────────────────────────────────────────────────── */}
        <aside className="w-56 flex-shrink-0 hidden md:block sticky top-20">
          {/* Month nav */}
          <div className="rounded-2xl ring-1 ring-black/8 mb-4 overflow-hidden"
            style={{ background: "#fff", boxShadow: "0 1px 4px rgba(26,58,92,0.06)" }}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-1">
                <button onClick={prevMonth}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-colors duration-150"
                  style={{ background: "rgba(26,58,92,0.07)" }}>
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#1a3a5c" strokeWidth="2">
                    <path d="M8 2L4 6l4 4"/>
                  </svg>
                </button>
                <div className="text-center">
                  <p className="font-bold text-sm" style={{ color: "#1a3a5c", fontFamily: "var(--font-playfair), serif" }}>
                    {MONTH_NAMES[month]}
                  </p>
                  <p className="text-xs" style={{ color: "#9ca3af" }}>{year}</p>
                </div>
                <button onClick={nextMonth}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-colors duration-150"
                  style={{ background: "rgba(26,58,92,0.07)" }}>
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#1a3a5c" strokeWidth="2">
                    <path d="M4 2l4 4-4 4"/>
                  </svg>
                </button>
              </div>
              <button onClick={jumpToday}
                className="w-full mt-2 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.15em] transition-colors duration-150"
                style={{ background: "rgba(26,58,92,0.07)", color: "#1a3a5c" }}>
                Today
              </button>
            </div>
          </div>

          {/* Filter groups */}
          <div className="rounded-2xl ring-1 ring-black/8 overflow-hidden"
            style={{ background: "#fff", boxShadow: "0 1px 4px rgba(26,58,92,0.06)" }}>
            <div className="p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: "#9ca3af" }}>Filter</p>
              <div className="flex flex-col gap-1.5 mb-4">
                {([["all","All Events"],["political","Political"],["governmental","Governmental"],["civic","Civic"]] as [FilterGroup,string][]).map(([g,label]) => (
                  <button key={g} onClick={() => applyFilterGroup(g)}
                    className="text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150"
                    style={filter === g
                      ? { background: g === "civic" ? CAT_COLOR.Civic : "#1a3a5c", color: "#fff" }
                      : { background: "rgba(26,58,92,0.05)", color: "#1a3a5c" }}>
                    {label}
                    {g === "political" && <span className="block text-[9px] font-normal mt-0.5 opacity-60">Elections · Legislature</span>}
                    {g === "governmental" && <span className="block text-[9px] font-normal mt-0.5 opacity-60">Courts · City Council · HISD</span>}
                    {g === "civic" && <span className="block text-[9px] font-normal mt-0.5 opacity-60">Clubs · TIRZ · Super Neighborhoods</span>}
                  </button>
                ))}
              </div>

              {/* Individual category toggles */}
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: "#9ca3af" }}>Categories</p>
              <div className="flex flex-col gap-1.5">
                {(["Elections","Legislature","Courts","City Council","HISD","Civic"] as Category[]).map(c => {
                  const on = cats.has(c);
                  return (
                    <button key={c} onClick={() => toggleCat(c)}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
                      style={{ background: on ? `${CAT_COLOR[c]}12` : "transparent", color: on ? CAT_COLOR[c] : "#9ca3af" }}>
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: on ? CAT_COLOR[c] : "#d1d5db" }}/>
                      {c}
                    </button>
                  );
                })}
              </div>

              {/* Civic map. Shows when Civic filter active */}
              {(filter === "civic" || cats.has("Civic")) && (
                <div className="mt-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: CAT_COLOR.Civic }}>
                    {MONTH_NAMES[month]} Civic Locations
                  </p>
                  <CivicMap events={civicMapEvents} />
                  <p className="text-[9px] mt-1.5" style={{ color: "#9ca3af" }}>
                    Showing {civicMapEvents.length} civic event{civicMapEvents.length !== 1 ? "s" : ""} this month
                  </p>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* ── Calendar grid ────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {/* Mobile month nav */}
          <div className="flex md:hidden items-center justify-between mb-4 gap-2 flex-wrap">
            <div className="flex items-center gap-3">
              <button onClick={prevMonth} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(26,58,92,0.08)" }}>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#1a3a5c" strokeWidth="2"><path d="M8 2L4 6l4 4"/></svg>
              </button>
              <p className="font-bold" style={{ color: "#1a3a5c", fontFamily: "var(--font-playfair), serif" }}>
                {MONTH_NAMES[month]} {year}
              </p>
              <button onClick={nextMonth} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(26,58,92,0.08)" }}>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#1a3a5c" strokeWidth="2"><path d="M4 2l4 4-4 4"/></svg>
              </button>
            </div>
            <button onClick={jumpToday} className="px-4 py-1.5 rounded-full text-xs font-bold" style={{ background: "rgba(26,58,92,0.08)", color: "#1a3a5c" }}>Today</button>
          </div>

          {/* Mobile filter pills */}
          <div className="flex md:hidden gap-2 mb-4 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {([["all","All"],["political","Political"],["governmental","Governmental"],["civic","Civic"]] as [FilterGroup,string][]).map(([g,label]) => (
              <button key={g} onClick={() => applyFilterGroup(g)}
                className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={filter === g
                  ? { background: g === "civic" ? CAT_COLOR.Civic : "#1a3a5c", color: "#fff" }
                  : { background: "rgba(26,58,92,0.08)", color: "#1a3a5c" }}>
                {label}
              </button>
            ))}
          </div>

          {/* Calendar */}
          <div className="rounded-2xl overflow-hidden ring-1 ring-black/8 mb-6"
            style={{ background: "#fff", boxShadow: "0 2px 8px rgba(26,58,92,0.07)" }}>
            {/* Day-of-week header */}
            <div className="grid grid-cols-7 border-b border-black/6">
              {DOW.map(d => (
                <div key={d} className="py-2.5 text-center text-[10px] font-bold uppercase tracking-[0.15em]"
                  style={{ color: "#9ca3af" }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Weeks */}
            {grid.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7" style={{ borderBottom: wi < grid.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none" }}>
                {week.map((cell) => {
                  const cellEvents = eventMap.get(cell.dateStr) ?? [];
                  const isSelected = selectedDate === cell.dateStr;
                  const hasHigh = cellEvents.some(e => e.importance === "high");

                  return (
                    <button
                      key={cell.dateStr}
                      onClick={() => setSelectedDate(isSelected ? null : cell.dateStr)}
                      className="relative min-h-[72px] sm:min-h-[80px] p-1.5 text-left transition-colors duration-150 flex flex-col"
                      style={{
                        background: isSelected ? "rgba(26,58,92,0.07)" : cell.isToday ? "rgba(37,99,168,0.05)" : "transparent",
                        borderRight: "1px solid rgba(0,0,0,0.04)",
                      }}
                    >
                      {/* Day number */}
                      <span
                        className="text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mb-1"
                        style={{
                          color: cell.isToday ? "#fff" : cell.isCurrentMonth ? "#1a3a5c" : "#d1d5db",
                          background: cell.isToday ? "#1a3a5c" : "transparent",
                          fontFamily: cell.isToday ? "var(--font-playfair), serif" : undefined,
                        }}
                      >
                        {cell.day}
                      </span>

                      {/* Event dots / chips */}
                      <div className="flex flex-col gap-0.5 w-full">
                        {cellEvents.slice(0, 3).map((e, i) => {
                          const isStart = e.date === cell.dateStr;
                          return (
                            <div key={i} className="hidden sm:flex items-center gap-1 rounded px-1 py-0.5 text-[9px] font-semibold leading-tight truncate"
                              style={{
                                background: `${CAT_COLOR[e.category]}18`,
                                color: CAT_COLOR[e.category],
                                borderLeft: `2px solid ${CAT_COLOR[e.category]}`,
                                opacity: isStart ? 1 : 0.6,
                              }}>
                              <span className="truncate">{e.title.split(": ")[0].split(": ")[0].slice(0, 20)}</span>
                            </div>
                          );
                        })}
                        {/* Mobile: just dots */}
                        <div className="flex sm:hidden gap-0.5 flex-wrap">
                          {cellEvents.slice(0, 4).map((e, i) => (
                            <span key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: CAT_COLOR[e.category] }}/>
                          ))}
                        </div>
                        {cellEvents.length > 3 && (
                          <span className="hidden sm:block text-[9px] font-semibold" style={{ color: "#9ca3af" }}>
                            +{cellEvents.length - 3}
                          </span>
                        )}
                      </div>

                      {/* High-importance accent dot */}
                      {hasHigh && !cell.isToday && (
                        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background: "#d97706" }}/>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Selected day events */}
          {selectedDate && (
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] mb-3" style={{ color: "#9ca3af" }}>
                {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              </p>
              {selectedEvents.length === 0 ? (
                <p className="text-sm text-center py-6" style={{ color: "#9ca3af" }}>No events on this date.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {selectedEvents.map(e => <EventDetail key={e.id} event={e} />)}
                </div>
              )}
            </div>
          )}

          {/* Legend */}
          {/* Mobile civic map */}
          {(filter === "civic" || cats.has("Civic")) && civicMapEvents.length > 0 && (
            <div className="md:hidden mt-4 mb-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: CAT_COLOR.Civic }}>
                Civic Locations: {MONTH_NAMES[month]}
              </p>
              <CivicMap events={civicMapEvents} />
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            {(["Elections","Legislature","Courts","City Council","HISD","Civic"] as Category[]).map(c => (
              <span key={c} className="flex items-center gap-1.5 text-xs" style={{ color: "#6b7280" }}>
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: CAT_COLOR[c] }}/>
                {c}
              </span>
            ))}
            <span className="flex items-center gap-1.5 text-xs" style={{ color: "#6b7280" }}>
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: "#d97706" }}/>
              Key Date
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
