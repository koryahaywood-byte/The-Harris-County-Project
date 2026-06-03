export default function BillTracker() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <p className="text-sky-700 text-sm font-semibold uppercase tracking-widest mb-3">Bill Tracker</p>
      <h1 className="text-4xl font-bold text-[var(--accent)] mb-4" style={{ fontFamily: "var(--font-playfair), serif" }}>
        What did your rep actually do?
      </h1>
      <p className="text-[var(--muted)] text-lg mb-10 max-w-2xl">
        Track bills filed, passed, and killed by your Texas House and Senate representatives — session by session.
      </p>

      {/* Bill tracker placeholder */}
      <div className="bg-white border border-[var(--border)] rounded-xl h-[400px] flex items-center justify-center text-[var(--muted)]">
        <p className="text-center">
          <span className="text-4xl block mb-4">📋</span>
          Bill tracker coming soon
        </p>
      </div>
    </div>
  );
}
