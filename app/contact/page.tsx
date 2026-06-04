"use client";

import { useState } from "react";

type FeedbackType = "data-error" | "suggest-tool" | "missing-date" | "general";

const TYPES: { value: FeedbackType; label: string; description: string }[] = [
  { value: "data-error", label: "Data Error", description: "Something on the site is wrong or outdated" },
  { value: "suggest-tool", label: "Suggest a Tool", description: "I have an idea for a new civic tool" },
  { value: "missing-date", label: "Missing Date", description: "A civic date is missing from the calendar" },
  { value: "general", label: "General", description: "Something else" },
];

export default function ContactPage() {
  const [type, setType] = useState<FeedbackType>("general");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // mailto fallback — opens email client with pre-filled content
    const subject = encodeURIComponent(`[Harris County Project — ${TYPES.find((t) => t.value === type)?.label}]`);
    const body = encodeURIComponent(`From: ${name || "Anonymous"}\n\n${message}`);
    window.location.href = `mailto:koryahaywood@gmail.com?subject=${subject}&body=${body}`;
    setLoading(false);
    setSubmitted(true);
  }

  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div className="bg-[var(--accent)] text-white px-6 py-16 md:py-24 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_80%_50%,rgba(37,99,168,0.4),transparent)]" />
        <div className="max-w-6xl mx-auto relative z-10">
          <p className="text-sky-300/80 text-[11px] font-bold uppercase tracking-[0.25em] mb-3">
            Community
          </p>
          <h1
            className="text-3xl md:text-4xl font-bold leading-tight mb-2"
            style={{ fontFamily: "var(--font-playfair), serif" }}
          >
            Contact & Feedback
          </h1>
          <p className="text-white/70 text-sm max-w-lg">
            Spot a data error, have an idea for a new tool, or missing a civic date? Let us know.
          </p>
        </div>
      </div>

      {/* ── Form ──────────────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-6 py-20">
        {submitted ? (
          <div className="rounded-[1.75rem] bg-white/60 ring-1 ring-black/8 p-[6px]">
            <div className="rounded-[1.35rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] p-12 text-center flex flex-col items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 ring-1 ring-emerald-200 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.5">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-[var(--accent)]" style={{ fontFamily: "var(--font-playfair), serif" }}>
                Your email client should open
              </h2>
              <p className="text-[var(--muted)] text-sm max-w-xs leading-relaxed">
                We pre-filled the message for you. If it didn&apos;t open, email us directly at{" "}
                <a href="mailto:koryahaywood@gmail.com" className="text-[var(--accent-light)] underline underline-offset-2">
                  koryahaywood@gmail.com
                </a>
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-2 text-xs font-semibold text-[var(--muted)] underline underline-offset-2"
              >
                Send another
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Type selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.15em] text-[var(--muted)] mb-3">
                What is this about?
              </label>
              <div className="grid grid-cols-2 gap-3">
                {TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(t.value)}
                    className={`rounded-[1.35rem] ring-1 p-[5px] text-left transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                      type === t.value
                        ? "ring-[var(--accent)] bg-[var(--accent)]/5"
                        : "ring-[var(--border)] bg-white/60 hover:ring-[var(--accent-light)]"
                    }`}
                  >
                    <div className="rounded-[1rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] px-4 py-3">
                      <p className={`text-sm font-bold leading-tight ${type === t.value ? "text-[var(--accent)]" : "text-[var(--foreground)]"}`} style={{ fontFamily: "var(--font-playfair), serif" }}>
                        {t.label}
                      </p>
                      <p className="text-xs text-[var(--muted)] mt-0.5 leading-snug">{t.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.15em] text-[var(--muted)] mb-2">
                Your name <span className="normal-case font-normal text-[var(--muted)]/60">(optional)</span>
              </label>
              <div className="rounded-[1.35rem] ring-1 ring-[var(--border)] bg-white/60 p-[5px] focus-within:ring-[var(--accent-light)] transition-all duration-500">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Anonymous"
                  className="w-full rounded-[1rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] px-4 py-3 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]/50"
                />
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.15em] text-[var(--muted)] mb-2">
                Message <span className="text-rose-400">*</span>
              </label>
              <div className="rounded-[1.35rem] ring-1 ring-[var(--border)] bg-white/60 p-[5px] focus-within:ring-[var(--accent-light)] transition-all duration-500">
                <textarea
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what you found, what's missing, or what you'd like to see..."
                  rows={5}
                  className="w-full rounded-[1rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] px-4 py-3 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]/50 resize-none"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !message.trim()}
              className="group self-start inline-flex items-center gap-3 bg-[var(--accent)] hover:bg-[var(--accent-light)] disabled:opacity-40 disabled:pointer-events-none text-white font-bold rounded-full px-7 py-4 text-sm transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-lg active:scale-[0.98]"
            >
              Send Feedback
              <span className="inline-flex w-7 h-7 rounded-full bg-white/15 items-center justify-center group-hover:translate-x-1 group-hover:-translate-y-px transition-transform duration-500">
                →
              </span>
            </button>

            <p className="text-xs text-[var(--muted)] -mt-2">
              This will open your email client with your message pre-filled.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
