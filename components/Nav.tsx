"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import SeasonRail from "@/components/SeasonRail";

// Masthead. One navigation for the whole site, organized by the questions
// people bring: what's on the ballot, what's on MY ballot, who has the money,
// how places vote, who holds office, what's coming up.

const SECTIONS: { href: string; label: string; match: string[] }[] = [
  { href: "/races",                    label: "Races",       match: ["/races", "/tools/ballot-2026", "/tools/tx-house", "/tools/judges"] },
  { href: "/tools/my-ballot",          label: "Your ballot", match: ["/tools/my-ballot", "/my-officials"] },
  { href: "/tools/where-is-the-dough", label: "Money",       match: ["/tools/where-is-the-dough", "/tools/donor", "/tools/pac-tracker", "/tools/public-money"] },
  { href: "/tools/heat-check",         label: "Maps",        match: ["/tools/heat-check", "/tools/districts", "/tools/precinct-lookup", "/tools/field-sweep", "/tools/opportunity-map", "/tools/early-vote"] },
  { href: "/politicians",              label: "Officials",   match: ["/politicians", "/compare"] },
  { href: "/tools/civic-calendar",     label: "Calendar",    match: ["/tools/civic-calendar", "/tools/campaign-trail"] },
];

export default function Nav() {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const isActive = (s: typeof SECTIONS[number]) => s.match.some(m => pathname === m || pathname.startsWith(m + "/") || pathname.startsWith(m));
  if (pathname.startsWith("/embed")) return null;

  return (
    <>
      <SeasonRail />
      <header className="sticky top-0 z-40 no-print" style={{ background: "rgba(255,255,255,0.94)", backdropFilter: "saturate(1.4) blur(12px)", WebkitBackdropFilter: "saturate(1.4) blur(12px)", borderBottom: "1px solid var(--rule)" }}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 shrink-0" aria-label="The Harris County Project, front page">
            <Mark />
            <span className="serif text-[19px] leading-none font-semibold tracking-[-0.01em]" style={{ color: "var(--ink)" }}>
              The Harris County Project
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1 ml-2" aria-label="Sections">
            {SECTIONS.map(s => {
              const active = isActive(s);
              return (
                <Link key={s.href} href={s.href}
                  aria-current={active ? "page" : undefined}
                  className="relative px-3 py-2 text-[14px] font-semibold rounded-md transition-colors"
                  style={{ color: active ? "var(--ink)" : "#4A524D" }}>
                  {s.label}
                  <span className="absolute left-3 right-3 -bottom-[9px] h-[3px] rounded-full transition-opacity"
                    style={{ background: "var(--gold)", opacity: active ? 1 : 0 }} aria-hidden />
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link href="/tools" className="hidden md:inline-flex items-center gap-1.5 text-[13px] font-semibold px-3 py-1.5 rounded-md border transition-colors hover:bg-[var(--paper)]"
              style={{ borderColor: "var(--rule)", color: "var(--ink)" }}>
              <GridIcon /> All tools
            </Link>
            <button className="lg:hidden inline-flex items-center justify-center w-10 h-10 -mr-2 rounded-md"
              aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(o => !o)}>
              <span className="relative block w-5 h-3">
                <span className="absolute left-0 right-0 h-[2px] bg-[var(--ink)] transition-transform" style={{ top: 0, transform: open ? "translateY(5px) rotate(45deg)" : "none" }} />
                <span className="absolute left-0 right-0 h-[2px] bg-[var(--ink)] transition-transform" style={{ bottom: 0, transform: open ? "translateY(-5px) rotate(-45deg)" : "none" }} />
              </span>
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 top-[92px] z-30 lg:hidden overflow-y-auto" style={{ background: "var(--surface)" }}>
          <nav className="px-4 py-2" aria-label="Sections">
            {SECTIONS.map(s => (
              <Link key={s.href} href={s.href} className="flex items-center justify-between py-4 border-b text-[20px] serif font-semibold"
                style={{ borderColor: "var(--rule)", color: "var(--ink)" }}>
                {s.label}
                <span aria-hidden style={{ color: isActive(s) ? "var(--gold-ink)" : "#9AA19C" }}>→</span>
              </Link>
            ))}
            <Link href="/tools" className="flex items-center justify-between py-4 text-[16px] font-semibold" style={{ color: "var(--brand)" }}>
              Every tool, A to Z <span aria-hidden>→</span>
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}

/* The mark: a ballot square, half inked. */
function Mark() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden>
      <rect x="1" y="1" width="20" height="20" rx="3" fill="var(--board)" />
      <path d="M6 11.5l3.2 3.2L16 7.8" fill="none" stroke="var(--gold)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" aria-hidden fill="currentColor">
      <rect x="0" y="0" width="5.5" height="5.5" rx="1" /><rect x="7.5" y="0" width="5.5" height="5.5" rx="1" />
      <rect x="0" y="7.5" width="5.5" height="5.5" rx="1" /><rect x="7.5" y="7.5" width="5.5" height="5.5" rx="1" />
    </svg>
  );
}
