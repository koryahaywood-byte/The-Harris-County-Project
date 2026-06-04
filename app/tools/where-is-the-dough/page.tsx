export default function WhereIsTheDough() {
  return (
    <div className="flex flex-col" style={{ minHeight: "calc(100dvh - 4rem)" }}>
      {/* Hero header — matches site design system */}
      <div className="bg-[var(--accent)] text-white px-6 py-10 relative overflow-hidden flex-shrink-0">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_80%_50%,rgba(37,99,168,0.4),transparent)]" />
        <div className="max-w-6xl mx-auto relative z-10">
          <p className="text-sky-300/80 text-[11px] font-bold uppercase tracking-[0.25em] mb-3">
            💰 Money
          </p>
          <h1
            className="text-3xl md:text-4xl font-bold leading-tight mb-2"
            style={{ fontFamily: "var(--font-playfair), serif" }}
          >
            Where Is the Dough
          </h1>
          <p className="text-white/70 text-sm max-w-lg">
            Follow the money. Who's funding Harris County politicians, how much they've raised, and where it goes.
          </p>
        </div>
      </div>

      {/* Full-height iframe */}
      <iframe
        src="/wheres-the-dough.html"
        className="flex-1 w-full border-0"
        style={{ minHeight: "600px" }}
        title="Where Is the Dough — Harris County Campaign Finance"
        allowFullScreen
      />
    </div>
  );
}
