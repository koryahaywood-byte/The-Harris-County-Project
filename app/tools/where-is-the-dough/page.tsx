export default function WhereIsTheDough() {
  return (
    <div className="flex flex-col" style={{ minHeight: "calc(100dvh - 4rem)" }}>
      {/* Thin breadcrumb strip — iframe has its own functional header */}
      <div className="bg-[var(--accent)] text-white px-6 py-3 flex items-center gap-3 flex-shrink-0">
        <a href="/" className="text-white/50 hover:text-white/80 text-xs transition-colors">← Toolbox</a>
        <span className="text-white/20 text-xs">/</span>
        <span className="text-sky-300/80 text-[11px] font-bold uppercase tracking-[0.2em]">💰 Money · Where Is the Dough</span>
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
