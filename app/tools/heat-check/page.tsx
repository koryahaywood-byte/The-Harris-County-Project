export default function HeatCheck() {
  return (
    <div className="flex flex-col" style={{ minHeight: "calc(100dvh - 4rem)" }}>
      {/* Hero header — matches site design system */}
      <div className="bg-[var(--accent)] text-white px-6 py-10 relative overflow-hidden flex-shrink-0">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_80%_50%,rgba(37,99,168,0.4),transparent)]" />
        <div className="max-w-6xl mx-auto relative z-10">
          <p className="text-sky-300/80 text-[11px] font-bold uppercase tracking-[0.25em] mb-3">
            🗳️ Elections
          </p>
          <h1
            className="text-3xl md:text-4xl font-bold leading-tight mb-2"
            style={{ fontFamily: "var(--font-playfair), serif" }}
          >
            Heat Check
          </h1>
          <p className="text-white/70 text-sm max-w-lg">
            See how Harris County voted — precinct by precinct. Pick a race and watch the map light up.
          </p>
        </div>
      </div>

      {/* Full-height iframe */}
      <iframe
        src="/heat-check.html"
        className="flex-1 w-full border-0"
        style={{ minHeight: "600px" }}
        title="Heat Check — Harris County Precinct Map"
        allowFullScreen
      />
    </div>
  );
}
