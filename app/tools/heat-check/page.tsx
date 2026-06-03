export default function HeatCheck() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <p className="text-sky-700 text-sm font-semibold uppercase tracking-widest mb-3">Heat Check</p>
      <h1 className="text-4xl font-bold text-[var(--accent)] mb-4" style={{ fontFamily: "var(--font-playfair), serif" }}>
        How did your precinct vote?
      </h1>
      <p className="text-[var(--muted)] text-lg mb-10 max-w-2xl">
        Select a race and see the results broken down precinct by precinct across Harris County.
      </p>

      {/* Map placeholder — wire in actual map component here */}
      <div className="bg-white border border-[var(--border)] rounded-xl h-[500px] flex items-center justify-center text-[var(--muted)]">
        <p className="text-center">
          <span className="text-4xl block mb-4">🗺️</span>
          Map component coming soon
        </p>
      </div>
    </div>
  );
}
