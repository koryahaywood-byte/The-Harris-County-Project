import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-6 text-center"
      style={{ background: "#f5f3ef" }}
    >
      {/* Big number */}
      <p
        className="text-[9rem] md:text-[12rem] font-bold leading-none select-none"
        style={{
          fontFamily: "var(--font-playfair, serif)",
          color: "transparent",
          WebkitTextStroke: "2px rgba(26,58,92,0.12)",
        }}
      >
        404
      </p>

      {/* Message */}
      <div className="-mt-4 mb-10">
        <h1
          className="text-2xl md:text-3xl font-bold text-[var(--accent)] mb-3"
          style={{ fontFamily: "var(--font-playfair, serif)" }}
        >
          This district doesn&apos;t exist
        </h1>
        <p className="text-[var(--muted)] text-sm max-w-sm mx-auto leading-relaxed">
          The page you&apos;re looking for isn&apos;t here — it may have moved,
          been renamed, or never existed.
        </p>
      </div>

      {/* CTAs */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-[var(--accent)] text-white font-bold rounded-full px-6 py-3 text-sm hover:bg-[var(--accent-light)] transition-colors duration-300"
        >
          ← Back to Toolbox
        </Link>
        <Link
          href="/politicians"
          className="inline-flex items-center gap-2 bg-white ring-1 ring-[var(--border)] text-[var(--accent)] font-semibold rounded-full px-6 py-3 text-sm hover:ring-[var(--accent)] transition-colors duration-300"
        >
          Officials Directory
        </Link>
        <Link
          href="/tools/heat-check"
          className="inline-flex items-center gap-2 bg-white ring-1 ring-[var(--border)] text-[var(--accent)] font-semibold rounded-full px-6 py-3 text-sm hover:ring-[var(--accent)] transition-colors duration-300"
        >
          Heat Check
        </Link>
      </div>

      {/* Subtle grid decoration */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(var(--accent) 1px, transparent 1px), linear-gradient(90deg, var(--accent) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
    </div>
  );
}
