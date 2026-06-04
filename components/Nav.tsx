"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const isToolPage =
    pathname.startsWith("/tools/") ||
    pathname.startsWith("/contact") ||
    pathname.startsWith("/blogs") ||
    pathname.startsWith("/politicians");

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // ── Tool / inner pages: slim static breadcrumb bar ──────────────────────
  if (isToolPage) {
    return (
      <header className="bg-[var(--accent)] text-white sticky top-0 z-40">
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
          <span className="text-white/60 text-xs font-medium" style={{ fontFamily: "var(--font-playfair), serif" }}>
            The Harris County Project
          </span>
        </div>
      </header>
    );
  }

  // ── Home / about pages: floating pill nav ───────────────────────────────
  return (
    <>
      <header className="fixed top-4 left-0 right-0 z-50 px-4 flex justify-center pointer-events-none">
        <div className="pointer-events-auto w-full max-w-2xl">
          <div
            className={`flex items-center justify-between text-white rounded-full px-5 py-3 ring-1 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
              scrolled
                ? "bg-[var(--accent)] backdrop-blur-xl ring-white/15 shadow-[0_8px_40px_rgba(26,58,92,0.45)]"
                : "bg-[var(--accent)]/90 backdrop-blur-xl ring-white/10 shadow-[0_4px_32px_rgba(26,58,92,0.25)]"
            }`}
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
                { href: "/#about", label: "About" },
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
        style={{ background: "rgba(10,24,48,0.97)", backdropFilter: "blur(20px)" }}
        onClick={() => setOpen(false)}
      >
        {[
          { href: "/#toolbox", label: "Toolbox", delay: "0.08s" },
          { href: "/politicians", label: "Officials", delay: "0.14s" },
          { href: "/blogs", label: "Media", delay: "0.20s" },
          { href: "/#about", label: "About", delay: "0.26s" },
          { href: "/contact", label: "Contact", delay: "0.32s" },
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
