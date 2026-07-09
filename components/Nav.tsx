"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export default function Nav() {
  const [open, setOpen]       = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const isToolPage =
    pathname.startsWith("/tools/") ||
    pathname.startsWith("/contact") ||
    pathname.startsWith("/blogs") ||
    pathname.startsWith("/politicians");

  // Only these tools pull live data. Everything else is static
  const LIVE_TOOLS = [
    "/tools/heat-check",
    "/tools/precinct-lookup",
    "/tools/voter-search",
    "/tools/where-is-the-dough",
    "/tools/bill-tracker",
    "/tools/congressional-bills",
    "/tools/districts",
    "/tools/city-hall",
    "/tools/pac-tracker",
    "/tools/ballot-2026",
    "/tools/my-ballot",
  ];
  const isLive = LIVE_TOOLS.some((t) => pathname.startsWith(t));

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  /* ── Inner pages: liquid glass bar ─────────────────────────────────────── */
  if (isToolPage) {
    return (
      <header
        className="sticky top-0 z-40"
        style={{
          background: "rgba(26,58,92,0.75)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.10)",
          boxShadow: "0 1px 0 rgba(255,255,255,0.06) inset, 0 4px 24px rgba(26,58,92,0.22)",
        }}
      >
        <div className="max-w-7xl mx-auto px-5 py-3 flex items-center gap-3">
          <Link
            href="/"
            className="group flex items-center gap-1.5 text-white/50 hover:text-white/90 text-xs font-semibold transition-colors duration-300"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"
              className="group-hover:-translate-x-0.5 transition-transform duration-300">
              <path d="M7.5 2L3.5 6l4 4"/>
            </svg>
            Toolbox
          </Link>
          <span className="text-white/20 text-xs">/</span>
          <span className="text-white/55 text-xs font-medium" style={{ fontFamily: "var(--font-playfair), serif" }}>
            The Harris County Project
          </span>

          {/* Live / Static indicator */}
          <span className="ml-auto flex items-center gap-1.5">
            {isLive ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="alive-halo absolute inline-flex h-full w-full rounded-full bg-emerald-400" />
                  <span className="alive-pulse relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                <span className="text-[10px] font-semibold text-white/35 uppercase tracking-[0.18em]">Live</span>
              </>
            ) : (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-white/20" />
                </span>
                <span className="text-[10px] font-semibold text-white/25 uppercase tracking-[0.18em]">Static</span>
              </>
            )}
          </span>
        </div>
      </header>
    );
  }

  /* ── Home: floating pill nav ────────────────────────────────────────────── */
  return (
    <>
      <header className="fixed top-4 left-0 right-0 z-50 px-4 flex justify-center pointer-events-none">
        <div className="pointer-events-auto w-full max-w-2xl">
          <div
            className="flex items-center justify-between text-white rounded-full px-5 py-3 ring-1 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
            style={{
              background: scrolled
                ? "rgba(26,58,92,0.92)"
                : "rgba(26,58,92,0.78)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              boxShadow: scrolled
                ? "0 8px 40px rgba(26,58,92,0.45), 0 1px 0 rgba(255,255,255,0.12) inset"
                : "0 4px 32px rgba(26,58,92,0.25), 0 1px 0 rgba(255,255,255,0.08) inset",
              border: scrolled
                ? "1px solid rgba(255,255,255,0.14)"
                : "1px solid rgba(255,255,255,0.09)",
            }}
          >
            <Link
              href="/"
              className="text-sm font-bold tracking-wide leading-none hover:text-sky-200 transition-colors duration-500"
              style={{ fontFamily: "var(--font-playfair), serif" }}
            >
              The Harris County Project
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              {[
                { href: "/#toolbox", label: "Toolbox" },
                { href: "/politicians", label: "Officials" },
                { href: "/blogs", label: "Media" },
                { href: "/about", label: "About" },
                { href: "/contact", label: "Contact" },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="text-white/70 hover:text-white transition-colors duration-300 relative group"
                >
                  {label}
                  <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-sky-300 group-hover:w-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]" />
                </Link>
              ))}
            </nav>

            <button
              className="md:hidden text-white/80 hover:text-white p-1 relative w-7 h-7 flex flex-col justify-center items-center gap-1.5 transition-colors"
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
            >
              <span className={`block h-0.5 bg-current w-5 transition-all duration-400 ease-[cubic-bezier(0.32,0.72,0,1)] origin-center ${open ? "rotate-45 translate-y-2" : ""}`} />
              <span className={`block h-0.5 bg-current w-5 transition-all duration-400 ease-[cubic-bezier(0.32,0.72,0,1)] ${open ? "opacity-0 scale-x-0" : ""}`} />
              <span className={`block h-0.5 bg-current w-5 transition-all duration-400 ease-[cubic-bezier(0.32,0.72,0,1)] origin-center ${open ? "-rotate-45 -translate-y-2" : ""}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-40 flex flex-col items-center justify-center gap-7 text-white transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        style={{ background: "rgba(10,24,48,0.97)", backdropFilter: "blur(24px)" }}
        onClick={() => setOpen(false)}
      >
        {[
          { href: "/#toolbox", label: "Toolbox",  delay: "0.08s" },
          { href: "/politicians", label: "Officials", delay: "0.14s" },
          { href: "/blogs",    label: "Media",     delay: "0.20s" },
          { href: "/about",   label: "About",     delay: "0.26s" },
          { href: "/contact",  label: "Contact",   delay: "0.32s" },
        ].map(({ href, label, delay }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className="text-3xl font-bold text-white/90 hover:text-sky-300 transition-all duration-500"
            style={{
              fontFamily: "var(--font-playfair), serif",
              opacity: open ? 1 : 0,
              transform: open ? "translateY(0)" : "translateY(16px)",
              transition: `opacity 0.45s ${delay} ease, transform 0.45s ${delay} cubic-bezier(0.32,0.72,0,1), color 0.3s ease`,
            }}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="h-16" />
    </>
  );
}
