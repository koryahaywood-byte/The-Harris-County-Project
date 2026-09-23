"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// The season rail: where we are in the election calendar, on every page.
// Dates mirror lib/civic-events.ts (general-2026, vreg-general-2026,
// ev-general-2026, mail-ballot-deadline-2026). Computed in Central time on the
// client so statically rendered pages never show a stale countdown.

const ELECTION = "2026-11-03";
const REG = "2026-10-05";
const EV_START = "2026-10-19";
const EV_END = "2026-10-30";
const MAIL_APP = "2026-10-23";

function todayCentral(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b + "T12:00:00Z") - Date.parse(a + "T12:00:00Z")) / 86_400_000);
}
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;

interface Item { text: string; strong?: string; urgent?: boolean }

function itemsFor(today: string): { lead: Item; rest: Item[] } {
  const toElection = daysBetween(today, ELECTION);
  if (toElection < 0) {
    return { lead: { strong: "Nov 3", text: "general election is over" }, rest: [{ text: "Certified results post after the county canvass" }] };
  }
  if (toElection === 0) {
    return { lead: { strong: "Election Day", text: "polls open 7 a.m. to 7 p.m.", urgent: true }, rest: [{ text: "In line by 7 p.m.? You can vote." }] };
  }
  const lead: Item = { strong: plural(toElection, "day"), text: "to the Nov 3 general" };
  const rest: Item[] = [];
  const toReg = daysBetween(today, REG);
  if (toReg >= 0) rest.push({ text: toReg === 0 ? "Registration closes today" : `Register by Oct 5: ${plural(toReg, "day")} left`, urgent: toReg <= 7 });
  const toEv = daysBetween(today, EV_START);
  const evLeft = daysBetween(today, EV_END);
  if (toEv > 0) rest.push({ text: `Early voting Oct 19 to 30` });
  else if (evLeft >= 0) rest.push({ text: evLeft === 0 ? "Last day of early voting" : `Early voting open: ${plural(evLeft + 1, "day")} left`, urgent: true });
  const toMail = daysBetween(today, MAIL_APP);
  if (toMail >= 0) rest.push({ text: `Mail ballot applications due Oct 23` });
  return { lead, rest };
}

export default function SeasonRail() {
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => { setToday(todayCentral()); }, []);
  const { lead, rest } = itemsFor(today ?? "2026-09-23");

  return (
    <div className="board text-[12px] no-print" style={{ backgroundSize: "auto, 100% 100%" }}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-9 flex items-center gap-5 overflow-hidden">
        <p className="flex items-center gap-2 shrink-0" style={{ visibility: today ? "visible" : "hidden" }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--gold)" }} aria-hidden />
          <span className="font-bold num" style={{ color: "var(--gold)" }}>{lead.strong}</span>
          <span className="text-white/75">{lead.text}</span>
        </p>
        <ul className="hidden md:flex items-center gap-5 min-w-0" style={{ visibility: today ? "visible" : "hidden" }}>
          {rest.map(it => (
            <li key={it.text} className="flex items-center gap-5 whitespace-nowrap">
              <span className="w-px h-3 bg-white/15" aria-hidden />
              <span className={it.urgent ? "text-white font-semibold" : "text-white/60"}>{it.text}</span>
            </li>
          ))}
        </ul>
        <Link href="/tools/my-ballot" className="ml-auto shrink-0 font-semibold text-white/85 hover:text-white">
          Find your ballot <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  );
}
