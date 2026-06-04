"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

export default function Nav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isToolPage = pathname.startsWith("/tools/") || pathname.startsWith("/contact");

  // ── Tool pages: slim static bar (no float, no overlap with iframe) ──
  if (isToolPage) {
    return (
      <header className="bg-[var(--accent)] text-white">
        <div className="max-w-7xl mx-auto px-5 py-3 flex items-center gap-3">
          <Link href="/" className="text-white/50 hover:text-white/80 text-xs transition-colors">
            ← Toolbox
          </Link>
          <span className="text-white/20 text-xs">/</span>
          <span className="text-white/70 text-xs font-medium" style={{ fontFamily: "var(--font-playfair), serif" }}>
            The Harris County Project
          </span>
        </div>
      </header>
    );
  }

  // ── Home / other pages: floating pill nav ──
  return (
    <>
      <header className="fixed top-4 left-0 right-0 z-50 px-4 flex justify-center pointer-events-none">
        <div className="pointer-events-auto w-full max-w-2xl">
          <div className="flex items-center justify-between bg-[var(--accent)]/95 backdrop-blur-xl text-white rounded-full px-5 py-3 ring-1 ring-white/10 shadow-[0_4px_32px_rgba(26,58,92,0.35)]">
            <Link
              href="/"
              className="text-sm font-bold tracking-wide leading-none"
              style={{ fontFamily: "var(--font-playfair), serif" }}
            >
              The Harris County Project
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              <Link href="/#toolbox" className="text-white/70 hover:text-white transition-colors duration-300">Toolbox</Link>
              <Link href="/politicians" className="text-white/70 hover:text-white transition-colors duration-300">Officials</Link>
              <Link href="/#about" className="text-white/70 hover:text-white transition-colors duration-300">About</Link>
              <Link href="/contact" className="text-white/70 hover:text-white transition-colors duration-300">Contact</Link>
            </nav>

            <button
              className="md:hidden text-white/80 hover:text-white p-1 relative w-6 h-6 transition-colors"
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
            >
              <span className={`block absolute h-0.5 bg-current w-5 left-0.5 transition-all duration-300 ${open ? "top-2.5 rotate-45" : "top-1.5"}`} />
              <span className={`block absolute h-0.5 bg-current w-5 left-0.5 top-2.5 transition-all duration-300 ${open ? "opacity-0" : ""}`} />
              <span className={`block absolute h-0.5 bg-current w-5 left-0.5 transition-all duration-300 ${open ? "top-2.5 -rotate-45" : "top-3.5"}`} />
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-[var(--accent)]/95 backdrop-blur-xl flex flex-col items-center justify-center gap-8 text-white"
          onClick={() => setOpen(false)}
        >
          <Link href="/#toolbox" onClick={() => setOpen(false)}
            className="text-3xl font-bold opacity-0 animate-[fadeUp_0.4s_0.1s_ease_forwards]"
            style={{ fontFamily: "var(--font-playfair), serif" }}>
            Toolbox
          </Link>
          <Link href="/politicians" onClick={() => setOpen(false)}
            className="text-3xl font-bold opacity-0 animate-[fadeUp_0.4s_0.15s_ease_forwards]"
            style={{ fontFamily: "var(--font-playfair), serif" }}>
            Officials
          </Link>
          <Link href="/#about" onClick={() => setOpen(false)}
            className="text-3xl font-bold opacity-0 animate-[fadeUp_0.4s_0.2s_ease_forwards]"
            style={{ fontFamily: "var(--font-playfair), serif" }}>
            About
          </Link>
          <Link href="/contact" onClick={() => setOpen(false)}
            className="text-3xl font-bold opacity-0 animate-[fadeUp_0.4s_0.25s_ease_forwards]"
            style={{ fontFamily: "var(--font-playfair), serif" }}>
            Contact
          </Link>
        </div>
      )}

      <div className="h-16" />

      <style jsx global>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
