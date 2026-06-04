export default function CivicCalendar() {
  return (
    <div>
      {/* Hero — matches site design system */}
      <div className="bg-[var(--accent)] text-white px-6 py-10 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_80%_50%,rgba(37,99,168,0.4),transparent)]" />
        <div className="max-w-6xl mx-auto relative z-10">
          <p className="text-sky-300/80 text-[11px] font-bold uppercase tracking-[0.25em] mb-3">
            📋 Legislative
          </p>
          <h1
            className="text-3xl md:text-4xl font-bold leading-tight mb-2"
            style={{ fontFamily: "var(--font-playfair), serif" }}
          >
            Civic Calendar
          </h1>
          <p className="text-white/70 text-sm max-w-lg">
            Election days, voter registration deadlines, early voting windows, commissioners court meetings — every date that matters for your vote.
          </p>
        </div>
      </div>

      {/* Coming soon body */}
      <div className="max-w-4xl mx-auto px-6 py-24 text-center">
        {/* Double-bezel card */}
        <div className="rounded-[1.75rem] bg-white/60 ring-1 ring-black/8 p-[6px] max-w-md mx-auto">
          <div className="rounded-[1.35rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] p-12 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[var(--accent)]/8 flex items-center justify-center text-3xl">
              📅
            </div>
            <h2
              className="text-xl font-bold text-[var(--accent)]"
              style={{ fontFamily: "var(--font-playfair), serif" }}
            >
              Coming Soon
            </h2>
            <p className="text-[var(--muted)] text-sm leading-relaxed max-w-xs">
              We&apos;re building a calendar that lets you add any civic event directly to your Apple, Google, or Outlook calendar.
            </p>
          </div>
        </div>

        <p className="text-[var(--muted)] text-xs mt-8">
          Have a date we should add?{" "}
          <a href="mailto:koryahaywood@gmail.com" className="text-[var(--accent-light)] underline underline-offset-2">
            Send it our way →
          </a>
        </p>
      </div>
    </div>
  );
}
