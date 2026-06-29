"use client";
import { useState, useEffect } from "react";

const STORAGE_KEY = "hcp_email_passed";
const SKIP_KEY = "hcp_email_skipped";

export default function EmailGate() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Only show on first visit. Check localStorage after mount
    const passed = localStorage.getItem(STORAGE_KEY);
    const skipped = sessionStorage.getItem(SKIP_KEY);
    if (!passed && !skipped) setShow(true);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/email-collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong");
        setLoading(false);
        return;
      }
    } catch {
      // Don't block on network error
    }

    localStorage.setItem(STORAGE_KEY, "1");
    // Fade out
    setShow(false);
  }

  function skipForNow() {
    // Skip for this browsing session. They'll see it again next visit
    sessionStorage.setItem(SKIP_KEY, "1");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
      style={{ background: "rgba(10,24,48,0.88)", backdropFilter: "blur(12px)" }}>

      {/* Card */}
      <div className="w-full max-w-md animate-[fadeUp_0.5s_ease_forwards]">
        <div className="rounded-[1.75rem] bg-[var(--accent)]/10 ring-1 ring-white/15 p-[6px]">
          <div className="rounded-[1.35rem] bg-[var(--background)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] p-8 md:p-10">

            {/* Logo mark */}
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent)] flex items-center justify-center mb-6">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-[var(--accent)] leading-tight mb-2"
              style={{ fontFamily: "var(--font-playfair), serif" }}>
              Get free access to<br />The Harris County Toolbox
            </h2>
            <p className="text-[var(--muted)] text-sm leading-relaxed mb-7">
              Drop your email and we&apos;ll let you know when new tools and data drop. No spam: just civic updates.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              {/* Email input: double bezel */}
              <div className="rounded-[1.35rem] ring-1 ring-[var(--border)] bg-white/60 p-[5px] focus-within:ring-[var(--accent-light)] transition-all duration-500">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full rounded-[1rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] px-4 py-3 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]/50"
                />
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="group inline-flex items-center justify-center gap-3 bg-[var(--accent)] hover:bg-[var(--accent-light)] disabled:opacity-40 disabled:pointer-events-none text-white font-bold rounded-full px-7 py-4 text-sm transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-lg active:scale-[0.98] w-full"
              >
                {loading ? "Signing up…" : "Get Access"}
                {!loading && (
                  <span className="inline-flex w-7 h-7 rounded-full bg-white/15 items-center justify-center group-hover:translate-x-1 group-hover:-translate-y-px transition-transform duration-500">
                    →
                  </span>
                )}
              </button>
            </form>

            <button
              onClick={skipForNow}
              className="mt-4 w-full text-center text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors duration-300"
            >
              Skip for now
            </button>

            <p className="mt-4 text-[10px] text-[var(--muted)]/70 text-center leading-relaxed">
              Free, always. No spam. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
