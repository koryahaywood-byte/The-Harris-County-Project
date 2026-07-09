"use client";

// Ms. Kay's Calendar: the Democratic social season, kept like a regency
// circular. Same bones as the Civic Calendar, dressed in wisteria and gold.

import { useMemo, useState } from "react";
import {
  KAY_EVENTS, KAY_CAT_COLOR, KAY_GROUPS,
  type KayEvent, type KayCategory,
} from "@/lib/ms-kay-events";

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const PLUM = "#4a1d6e", WISTERIA = "#7c3aed", GOLD = "#c9a227", BLUSH = "#faf7fd";
const SEASON_END = "2026-11-03"; // weekly standing events project through Election Day

/* ─── Grid helpers (same math as the civic grid) ─────────────────────────── */
function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function firstWeekday(y: number, m: number) { return new Date(y, m, 1).getDay(); }
function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
interface CalDay { dateStr: string; day: number; isCurrentMonth: boolean; isToday: boolean }
function buildGrid(year: number, month: number): CalDay[][] {
  const today = new Date().toISOString().split("T")[0];
  const firstWd = firstWeekday(year, month), dim = daysInMonth(year, month), prevDim = daysInMonth(year, month - 1);
  const cells: CalDay[] = [];
  for (let i = firstWd - 1; i >= 0; i--) {
    const d = prevDim - i, m2 = month === 0 ? 11 : month - 1, y2 = month === 0 ? year - 1 : year;
    const ds = toDateStr(y2, m2, d); cells.push({ dateStr: ds, day: d, isCurrentMonth: false, isToday: ds === today });
  }
  for (let d = 1; d <= dim; d++) {
    const ds = toDateStr(year, month, d); cells.push({ dateStr: ds, day: d, isCurrentMonth: true, isToday: ds === today });
  }
  const need = 42 - cells.length;
  for (let d = 1; d <= need; d++) {
    const m2 = month === 11 ? 0 : month + 1, y2 = month === 11 ? year + 1 : year;
    const ds = toDateStr(y2, m2, d); cells.push({ dateStr: ds, day: d, isCurrentMonth: false, isToday: ds === today });
  }
  const weeks: CalDay[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/* ─── Add-to-calendar (timed events, local wall-clock) ───────────────────── */
function icsStamp(date: string, time?: string) {
  return date.replace(/-/g, "") + "T" + (time ?? "09:00").replace(":", "") + "00";
}
function plusHour(time: string) {
  const [h, m] = time.split(":").map(Number);
  return `${String(Math.min(h + 1, 23)).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
function kayDescription(e: KayEvent) {
  return [e.host, e.timeLabel, e.note, e.rsvp ? `RSVP: ${e.rsvp}` : "",
    e.channelVerified ? `Usually posted on: ${e.channel.join(", ")}` : ""]
    .filter(Boolean).join(" · ");
}
function kayLocation(e: KayEvent) {
  return [e.venue, e.address].filter(Boolean).join(", ") || "Harris County, TX";
}
function googleUrl(e: KayEvent, date: string) {
  const start = e.startTime ?? "09:00";
  const end = e.endTime ?? plusHour(start);
  const params = new URLSearchParams({
    action: "TEMPLATE", text: e.title,
    dates: `${icsStamp(date, start)}/${icsStamp(date, end)}`,
    details: kayDescription(e), location: kayLocation(e), ctz: "America/Chicago",
  });
  return `https://calendar.google.com/calendar/r/eventedit?${params}`;
}
function downloadICS(e: KayEvent, date: string) {
  const start = e.startTime ?? "09:00";
  const end = e.endTime ?? plusHour(start);
  const ics = ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//The Harris County Project//Ms Kays Calendar//EN",
    "BEGIN:VEVENT",`UID:${e.id}-${date}@harriscountyproject`,
    `DTSTART:${icsStamp(date, start)}`,`DTEND:${icsStamp(date, end)}`,
    `SUMMARY:${e.title.replace(/,/g, "\\,")}`,
    `DESCRIPTION:${kayDescription(e).replace(/,/g, "\\,")}`,
    `LOCATION:${kayLocation(e).replace(/,/g, "\\,")}`,
    "END:VEVENT","END:VCALENDAR"].join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
  a.download = `${e.id}.ics`;
  a.click();
}

/* ─── Event card ─────────────────────────────────────────────────────────── */
function KayEventCard({ event, date }: { event: KayEvent; date: string }) {
  const today = new Date().toISOString().split("T")[0];
  const isPast = date < today;
  const cc = KAY_CAT_COLOR[event.category];
  const d = new Date(date + "T12:00:00");
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: `1px solid ${WISTERIA}22`, boxShadow: "0 2px 10px rgba(74,29,110,0.08)" }}>
      <div style={{ height: 3, background: `linear-gradient(90deg, ${cc}, ${GOLD})` }} />
      <div className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className="shrink-0 w-12 text-center rounded-xl py-2 px-1" style={{ background: `${cc}10` }}>
            <p className="text-[9px] font-bold uppercase tracking-widest leading-none mb-0.5" style={{ color: cc }}>
              {d.toLocaleDateString("en-US", { month: "short" })}
            </p>
            <p className="text-xl font-bold leading-none" style={{ color: cc, fontFamily: "var(--font-playfair), serif" }}>{d.getDate()}</p>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-1.5 mb-1">
              <span className="text-[9px] font-bold uppercase tracking-[0.15em] px-2 py-0.5 rounded-full" style={{ background: `${cc}15`, color: cc }}>
                {event.category}
              </span>
              {event.recurring && (
                <span className="text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: `${GOLD}20`, color: "#8a6d1a" }}>Weekly</span>
              )}
              {isPast && (
                <span className="text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: "#f3f4f6", color: "#6b7280" }}>Past</span>
              )}
            </div>
            <h3 className="font-bold text-sm leading-snug" style={{ color: PLUM, fontFamily: "var(--font-playfair), serif" }}>{event.title}</h3>
            <p className="text-[11px] mt-0.5" style={{ color: WISTERIA }}>{event.host}</p>
          </div>
        </div>
        <div className="text-xs leading-relaxed mb-3 space-y-0.5" style={{ color: "#6b7280" }}>
          <p><strong style={{ color: PLUM }}>{event.timeLabel}</strong>{event.venue ? ` · ${event.venue}` : ""}</p>
          {event.address && <p>{event.address}</p>}
          {event.note && <p className="italic">{event.note}</p>}
          {event.rsvp && <p>RSVP: <strong style={{ color: PLUM }}>{event.rsvp}</strong></p>}
          {event.channelVerified && (
            <p className="text-[10px]" style={{ color: "#9ca3af" }}>The host usually posts on {event.channel.join(" · ")}</p>
          )}
        </div>
        {!isPast && (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => downloadICS(event, date)}
              className="px-3 py-1.5 rounded-full text-[10px] font-bold transition-colors duration-150"
              style={{ background: PLUM, color: "#fff" }}>
              + Apple / iCal
            </button>
            <a href={googleUrl(event, date)} target="_blank" rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-full text-[10px] font-semibold transition-colors duration-150"
              style={{ background: "#fff", color: PLUM, border: `1px solid ${WISTERIA}40` }}>
              + Google Calendar
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main ───────────────────────────────────────────────────────────────── */
export default function MsKayCalendar({ switchBack }: { switchBack: () => void }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(now.toISOString().split("T")[0]);
  const [cats, setCats] = useState<Set<KayCategory>>(new Set(Object.keys(KAY_CAT_COLOR) as KayCategory[]));
  const [showGroups, setShowGroups] = useState(false);

  function prevMonth() { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); setSelectedDate(null); }
  function nextMonth() { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); setSelectedDate(null); }
  function jumpToday() { setYear(now.getFullYear()); setMonth(now.getMonth()); setSelectedDate(now.toISOString().split("T")[0]); }
  function toggleCat(c: KayCategory) {
    setCats(prev => { const n = new Set(prev); if (n.has(c)) n.delete(c); else n.add(c); return n; });
  }

  // date → events; weekly standing events project onto their weekday through Election Day
  const eventMap = useMemo(() => {
    const m = new Map<string, KayEvent[]>();
    const push = (ds: string, e: KayEvent) => { if (!m.has(ds)) m.set(ds, []); m.get(ds)!.push(e); };
    for (const e of KAY_EVENTS) {
      if (!cats.has(e.category)) continue;
      if (e.recurring === "weekly") {
        const cur = new Date(e.date + "T12:00:00");
        while (cur.toISOString().split("T")[0] <= SEASON_END) {
          push(cur.toISOString().split("T")[0], e);
          cur.setDate(cur.getDate() + 7);
        }
      } else {
        push(e.date, e);
      }
    }
    return m;
  }, [cats]);

  const grid = useMemo(() => buildGrid(year, month), [year, month]);
  const selectedEvents = selectedDate ? (eventMap.get(selectedDate) ?? []) : [];
  const today = now.toISOString().split("T")[0];
  const nextUp = [...eventMap.entries()]
    .filter(([ds]) => ds >= today)
    .sort(([a], [b]) => a.localeCompare(b))[0];

  return (
    <div style={{ background: BLUSH, minHeight: "100vh", fontFamily: "var(--font-outfit), sans-serif" }}>
      {/* Hero: wisteria and gold */}
      <section className="relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, #2e1065 0%, ${PLUM} 45%, #6d28d9 100%)`, paddingTop: "3rem", paddingBottom: "3rem" }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 70% 60% at 80% 40%, rgba(196,181,253,0.22) 0%, transparent 70%)" }} />
        <div className="relative max-w-6xl mx-auto px-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] mb-2" style={{ color: "#e9d5ff" }}>
                ❦ &nbsp;The Social Season · Harris County&nbsp; ❦
              </p>
              <h1 className="text-4xl md:text-5xl text-white mb-1" style={{ fontFamily: "var(--font-dancing), cursive" }}>
                Ms. Kay&apos;s Calendar
              </h1>
              <p className="text-white/60 text-sm max-w-lg mb-4" style={{ fontStyle: "italic" }}>
                Dearest reader: every club meeting, fundraiser, town hall, and gala of the
                season, gathered for your perusal.
              </p>
            </div>
            {/* Switch back */}
            <button onClick={switchBack}
              className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all duration-200"
              style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)", color: "#fff" }}>
              <span className="w-8 h-4 rounded-full relative" style={{ background: GOLD }}>
                <span className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full bg-white transition-all" />
              </span>
              Ms. Kay&apos;s · switch to Civic
            </button>
          </div>
          {nextUp && (
            <div className="inline-flex items-center gap-3 rounded-full px-4 py-2 text-xs"
              style={{ background: "rgba(255,255,255,0.10)", border: `1px solid ${GOLD}55` }}>
              <span className="relative flex h-2 w-2">
                <span className="alive-halo absolute inset-0 rounded-full" style={{ background: GOLD }} />
                <span className="alive-pulse relative h-2 w-2 rounded-full" style={{ background: GOLD }} />
              </span>
              <span className="font-semibold uppercase tracking-wider text-[10px]" style={{ color: "#e9d5ff" }}>Next Soirée</span>
              <span className="text-white font-semibold">{nextUp[1][0].title}</span>
              <span className="text-white/50">{new Date(nextUp[0] + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
            </div>
          )}
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-8 flex gap-6 items-start">
        {/* Sidebar */}
        <aside className="w-56 flex-shrink-0 hidden md:block sticky top-20">
          <div className="rounded-2xl mb-4 overflow-hidden" style={{ background: "#fff", border: `1px solid ${WISTERIA}22`, boxShadow: "0 1px 4px rgba(74,29,110,0.06)" }}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-1">
                <button onClick={prevMonth} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: `${WISTERIA}12` }}>
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke={PLUM} strokeWidth="2"><path d="M8 2L4 6l4 4"/></svg>
                </button>
                <div className="text-center">
                  <p className="font-bold text-sm" style={{ color: PLUM, fontFamily: "var(--font-playfair), serif" }}>{MONTH_NAMES[month]}</p>
                  <p className="text-xs" style={{ color: "#9ca3af" }}>{year}</p>
                </div>
                <button onClick={nextMonth} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: `${WISTERIA}12` }}>
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke={PLUM} strokeWidth="2"><path d="M4 2l4 4-4 4"/></svg>
                </button>
              </div>
              <button onClick={jumpToday} className="w-full mt-2 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.15em]"
                style={{ background: `${WISTERIA}12`, color: PLUM }}>
                Today
              </button>
            </div>
          </div>

          {/* Category filter */}
          <div className="rounded-2xl overflow-hidden mb-4" style={{ background: "#fff", border: `1px solid ${WISTERIA}22`, boxShadow: "0 1px 4px rgba(74,29,110,0.06)" }}>
            <div className="p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: "#9ca3af" }}>This Season</p>
              <div className="flex flex-col gap-1.5">
                {(Object.keys(KAY_CAT_COLOR) as KayCategory[]).map(c => {
                  const on = cats.has(c);
                  return (
                    <button key={c} onClick={() => toggleCat(c)}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
                      style={{ background: on ? `${KAY_CAT_COLOR[c]}12` : "transparent", color: on ? KAY_CAT_COLOR[c] : "#9ca3af" }}>
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: on ? KAY_CAT_COLOR[c] : "#d1d5db" }} />
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Where the hosts post */}
          <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: `1px solid ${WISTERIA}22`, boxShadow: "0 1px 4px rgba(74,29,110,0.06)" }}>
            <div className="p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: GOLD }}>Where the Ton Posts</p>
              {KAY_GROUPS.slice(0, 4).map(g => (
                <p key={g.name} className="text-[10px] leading-relaxed mb-2" style={{ color: "#6b7280" }}>
                  <strong style={{ color: PLUM }}>{g.name}</strong><br />{g.posts}
                </p>
              ))}
              <button onClick={() => setShowGroups(s => !s)} className="text-[10px] font-bold underline" style={{ color: WISTERIA }}>
                {showGroups ? "Show less" : "All hosts →"}
              </button>
              {showGroups && KAY_GROUPS.slice(4).map(g => (
                <p key={g.name} className="text-[10px] leading-relaxed mt-2" style={{ color: "#6b7280" }}>
                  <strong style={{ color: PLUM }}>{g.name}</strong><br />{g.posts}
                </p>
              ))}
            </div>
          </div>
        </aside>

        {/* Grid */}
        <div className="flex-1 min-w-0">
          {/* Mobile month nav */}
          <div className="flex md:hidden items-center justify-between mb-4 gap-2 flex-wrap">
            <div className="flex items-center gap-3">
              <button onClick={prevMonth} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: `${WISTERIA}14` }}>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke={PLUM} strokeWidth="2"><path d="M8 2L4 6l4 4"/></svg>
              </button>
              <p className="font-bold" style={{ color: PLUM, fontFamily: "var(--font-playfair), serif" }}>{MONTH_NAMES[month]} {year}</p>
              <button onClick={nextMonth} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: `${WISTERIA}14` }}>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke={PLUM} strokeWidth="2"><path d="M4 2l4 4-4 4"/></svg>
              </button>
            </div>
            <button onClick={jumpToday} className="px-4 py-1.5 rounded-full text-xs font-bold" style={{ background: `${WISTERIA}14`, color: PLUM }}>Today</button>
          </div>

          <div className="rounded-2xl overflow-hidden mb-6" style={{ background: "#fff", border: `1px solid ${WISTERIA}25`, boxShadow: "0 2px 8px rgba(74,29,110,0.08)" }}>
            <div className="grid grid-cols-7" style={{ borderBottom: `1px solid ${WISTERIA}15` }}>
              {DOW.map(d => (
                <div key={d} className="py-2.5 text-center text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: WISTERIA }}>{d}</div>
              ))}
            </div>
            {grid.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7" style={{ borderBottom: wi < grid.length - 1 ? `1px solid ${WISTERIA}0d` : "none" }}>
                {week.map(cell => {
                  const cellEvents = eventMap.get(cell.dateStr) ?? [];
                  const isSelected = selectedDate === cell.dateStr;
                  const hasElection = cellEvents.some(e => e.category === "Election Day");
                  return (
                    <button key={cell.dateStr} onClick={() => setSelectedDate(isSelected ? null : cell.dateStr)}
                      className="relative min-h-[72px] sm:min-h-[80px] p-1.5 text-left transition-colors duration-150 flex flex-col"
                      style={{
                        background: isSelected ? `${WISTERIA}10` : cell.isToday ? `${WISTERIA}08` : "transparent",
                        borderRight: `1px solid ${WISTERIA}08`,
                      }}>
                      <span className="text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mb-1"
                        style={{
                          color: cell.isToday ? "#fff" : cell.isCurrentMonth ? PLUM : "#ddd3ea",
                          background: cell.isToday ? PLUM : "transparent",
                          fontFamily: cell.isToday ? "var(--font-playfair), serif" : undefined,
                        }}>
                        {cell.day}
                      </span>
                      <div className="flex flex-col gap-0.5 w-full">
                        {cellEvents.slice(0, 3).map((e, i) => (
                          <div key={i} className="hidden sm:flex items-center gap-1 rounded px-1 py-0.5 text-[9px] font-semibold leading-tight truncate"
                            style={{
                              background: `${KAY_CAT_COLOR[e.category]}14`,
                              color: KAY_CAT_COLOR[e.category],
                              borderLeft: `2px solid ${KAY_CAT_COLOR[e.category]}`,
                            }}>
                            <span className="truncate">{e.title.slice(0, 20)}</span>
                          </div>
                        ))}
                        <div className="flex sm:hidden gap-0.5 flex-wrap">
                          {cellEvents.slice(0, 4).map((e, i) => (
                            <span key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: KAY_CAT_COLOR[e.category] }} />
                          ))}
                        </div>
                        {cellEvents.length > 3 && (
                          <span className="hidden sm:block text-[9px] font-semibold" style={{ color: "#9ca3af" }}>+{cellEvents.length - 3}</span>
                        )}
                      </div>
                      {hasElection && !cell.isToday && (
                        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background: GOLD }} />
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Selected day */}
          {selectedDate && (
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] mb-3" style={{ color: WISTERIA }}>
                ❦ &nbsp;{new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              </p>
              {selectedEvents.length === 0 ? (
                <p className="text-sm text-center py-6 italic" style={{ color: "#9ca3af" }}>
                  A quiet evening. The ton rests.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {selectedEvents.map(e => <KayEventCard key={`${e.id}-${selectedDate}`} event={e} date={selectedDate} />)}
                </div>
              )}
            </div>
          )}

          {/* Legend */}
          <div className="mt-6 flex flex-wrap gap-3">
            {(Object.keys(KAY_CAT_COLOR) as KayCategory[]).map(c => (
              <span key={c} className="flex items-center gap-1.5 text-xs" style={{ color: "#6b7280" }}>
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: KAY_CAT_COLOR[c] }} />
                {c}
              </span>
            ))}
          </div>

          {/* Mobile: where the hosts post */}
          <div className="md:hidden mt-6 rounded-2xl p-4" style={{ background: "#fff", border: `1px solid ${WISTERIA}22` }}>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: GOLD }}>Where the Ton Posts</p>
            {KAY_GROUPS.map(g => (
              <p key={g.name} className="text-[10px] leading-relaxed mb-2" style={{ color: "#6b7280" }}>
                <strong style={{ color: PLUM }}>{g.name}</strong><br />{g.posts}
              </p>
            ))}
          </div>

          <p className="mt-6 text-[10px] italic leading-relaxed" style={{ color: "#9ca3af" }}>
            Compiled from Ms. Kay&apos;s circulated list (July 8, 2026 edition). Details change;
            confirm with the host before setting out. Weekly standing events repeat through
            Election Day. Yours in civic devotion, The Harris County Project.
          </p>
        </div>
      </div>
    </div>
  );
}
