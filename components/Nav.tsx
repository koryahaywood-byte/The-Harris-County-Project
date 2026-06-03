"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const tools = [
  { href: "/tools/heat-check", label: "Heat Check" },
  { href: "/tools/where-is-the-dough", label: "Where Is the Dough" },
  { href: "/tools/civic-calendar", label: "Civic Calendar" },
  { href: "/tools/bill-tracker", label: "Bill Tracker" },
];

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-[var(--accent)] text-white">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold tracking-wide" style={{ fontFamily: "var(--font-playfair), serif" }}>
          Harris County Project
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {tools.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={`transition-colors hover:text-sky-200 ${pathname === t.href ? "text-sky-300 underline underline-offset-4" : "text-white/80"}`}
            >
              {t.label}
            </Link>
          ))}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-white p-1"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {open
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-white/20 px-6 pb-4 flex flex-col gap-3 text-sm font-medium">
          {tools.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              onClick={() => setOpen(false)}
              className={`py-1 transition-colors hover:text-sky-200 ${pathname === t.href ? "text-sky-300" : "text-white/80"}`}
            >
              {t.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
