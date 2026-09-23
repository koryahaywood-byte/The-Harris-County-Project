import Link from "next/link";

// Cross-tool strip at the foot of every tool so the site reads as one desk.
// Pass `current` to drop the self-link.
const TOOLS = [
  { href: "/races",                     label: "The race board" },
  { href: "/tools/my-ballot",           label: "Your ballot" },
  { href: "/tools/where-is-the-dough",  label: "Campaign cash" },
  { href: "/tools/heat-check",          label: "Precinct results" },
  { href: "/tools/districts",           label: "District portraits" },
  { href: "/my-officials",              label: "Who represents me" },
  { href: "/tools/donor-search",        label: "Who gave" },
  { href: "/tools/judges",              label: "Know your judges" },
  { href: "/tools/tx-house",            label: "Texas House board" },
  { href: "/tools/court-votes",         label: "Commissioners Court votes" },
  { href: "/tools/civic-calendar",      label: "Civic calendar" },
  { href: "/tools/campaign-trail",      label: "Campaign trail" },
  { href: "/tools/tax-receipt",         label: "Your tax receipt" },
  { href: "/tools/who-do-i-call",       label: "Who do I call" },
];

export default function RelatedTools({ current, className }: { current?: string; className?: string }) {
  const links = TOOLS.filter(t => t.href !== current);
  return (
    <nav className={className ?? "mt-12 pt-5 desk-head"} aria-label="More from the desk">
      <div className="flex items-baseline justify-between gap-4 mb-3">
        <p className="serif text-[19px] font-semibold" style={{ color: "var(--ink)" }}>More from the desk</p>
        <Link href="/tools" className="text-[13px] font-bold" style={{ color: "var(--brand)" }}>Every tool <span aria-hidden>→</span></Link>
      </div>
      <ul className="flex flex-wrap gap-x-5 gap-y-2">
        {links.map(l => (
          <li key={l.href}>
            <Link href={l.href} className="text-[14px] font-semibold hover:underline underline-offset-4" style={{ color: "#2F3632" }}>
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
