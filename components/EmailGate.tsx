"use client";
import { useState, useEffect } from "react";

const STORAGE_KEY = "hcp_email_passed";

export default function EmailGate() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Only show if user has never submitted or dismissed
    const passed = localStorage.getItem(STORAGE_KEY);
    if (passed) return;
    // Delay appearance so it doesn't interrupt the landing
    const t = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(t);
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
    setShow(false);
  }

  function dismiss() {
    // Permanently dismissed — won't come back
    localStorage.setItem(STORAGE_KEY, "dismissed");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[9999] w-80 animate-[slideUp_0.4s_ease_forwards]"
      role="dialog"
      aria-label="Stay in the loop"
    >
      <div className="rounded-2xl shadow-2xl ring-1 ring-black/8 overflow-hidden"
        style={{ background: "var(--background, #fff)" }}>

        {/* Top accent bar */}
        <div className="h-1" style={{ background: "linear-gradient(90deg,#1a3a5c,#2563a8)" }} />

        <div className="px-5 py-4">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <p className="text-sm font-bold leading-tight" style={{ color: "#1a3a5c", fontFamily: "var(--font-playfair), serif" }}>
              Stay in the loop
            </p>
            <button
              onClick={dismiss}
              aria-label="Dismiss"
              className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 -mt-0.5"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 1l12 12M13 1L1 13"/>
              </svg>
            </button>
          </div>

          <p className="text-xs leading-relaxed mb-3" style={{ color: "#6b7280" }}>
            New tools and data drop regularly. Drop your email and we&apos;ll tell you when.
          </p>

          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 min-w-0 rounded-full border px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-[#2563a8]/30"
              style={{ borderColor: "#e5e7eb" }}
            />
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="rounded-full px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40 flex-shrink-0 transition-opacity"
              style={{ background: "#1a3a5c" }}
            >
              {loading ? "…" : "Join"}
            </button>
          </form>

          {error && <p className="mt-1.5 text-[10px] text-red-500">{error}</p>}

          <p className="mt-2 text-[10px]" style={{ color: "#9ca3af" }}>
            Free, always. No spam.
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
