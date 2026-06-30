import Link from "next/link";

// Cross-tool strip so the toolbox reads as one system, not separate pages.
// Pass `current` to drop the self-link from the row.
const TOOLS = [
  { href: "/tools/heat-check",          label: "Precinct heat map →" },
  { href: "/tools/districts",           label: "District vote history →" },
  { href: "/tools/where-is-the-dough",  label: "Follow the money →" },
  { href: "/my-officials",              label: "Who represents me →" },
  { href: "/tools/who-do-i-call",       label: "Who do I call? →" },
  { href: "/tools/ballot-2026",         label: "2026 ballot →" },
  { href: "/tools/tx-house",            label: "TX House board →" },
  { href: "/tools/opportunity-map",     label: "Opportunity map →" },
  { href: "/tools/the-brief",           label: "The Brief →" },
  { href: "/tools/public-money",        label: "Public money →" },
  { href: "/tools/the-network",         label: "The Network →" },
];

export default function RelatedTools({ current, className }: { current?: string; className?: string }) {
  const links = TOOLS.filter(t => t.href !== current);
  return (
    <div className={className ?? "mt-10 pt-6 border-t border-black/8"}>
      <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: "#9ca3af" }}>Go deeper</p>
      <div className="flex flex-wrap gap-2">
        {links.map(l => (
          <Link key={l.href} href={l.href}
            className="text-[11px] font-semibold px-3 py-1.5 rounded-full border transition-colors hover:bg-[#1a3a5c] hover:text-white hover:border-[#1a3a5c]"
            style={{ color: "#374151", borderColor: "#e5e7eb", background: "#fff" }}>
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
