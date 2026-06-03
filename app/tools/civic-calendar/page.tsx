export default function CivicCalendar() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <p className="text-sky-700 text-sm font-semibold uppercase tracking-widest mb-3">Civic Calendar</p>
      <h1 className="text-4xl font-bold text-[var(--accent)] mb-4" style={{ fontFamily: "var(--font-playfair), serif" }}>
        Every date that matters.
      </h1>
      <p className="text-[var(--muted)] text-lg mb-10 max-w-2xl">
        Election days, voter registration deadlines, early voting windows, commissioners court meetings — all in one place.
      </p>

      {/* Calendar placeholder */}
      <div className="bg-white border border-[var(--border)] rounded-xl h-[400px] flex items-center justify-center text-[var(--muted)]">
        <p className="text-center">
          <span className="text-4xl block mb-4">📅</span>
          Calendar coming soon
        </p>
      </div>
    </div>
  );
}
