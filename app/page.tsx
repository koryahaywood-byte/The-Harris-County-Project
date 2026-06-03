import Link from "next/link";

const tools = [
  {
    href: "/tools/heat-check",
    name: "Heat Check",
    description: "See how Harris County voted — precinct by precinct. Pick a race and watch the map light up.",
    icon: "🗺️",
  },
  {
    href: "/tools/where-is-the-dough",
    name: "Where Is the Dough",
    description: "Follow Harris County's money. Where does it come from, where does it go, and who decided.",
    icon: "💰",
  },
  {
    href: "/tools/civic-calendar",
    name: "Civic Calendar",
    description: "Election dates, filing deadlines, commissioners court meetings, and every date that matters for your vote.",
    icon: "📅",
  },
  {
    href: "/tools/bill-tracker",
    name: "Bill Tracker",
    description: "See what your Texas state rep and senator actually passed — or didn't — this legislative session.",
    icon: "📋",
  },
];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-[var(--accent)] text-white py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-sky-300 text-sm font-semibold uppercase tracking-widest mb-4">Harris County Project</p>
          <h1
            className="text-4xl md:text-6xl font-bold leading-tight mb-6"
            style={{ fontFamily: "var(--font-playfair), serif" }}
          >
            They stopped teaching civics.
            <br />
            <span className="text-sky-300">We didn&apos;t.</span>
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl leading-relaxed">
            A free toolbox built for Harris County residents who want to understand their government —
            how it votes, where it spends, and when it decides.
          </p>
        </div>
      </section>

      {/* Tools grid */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-[var(--accent)] mb-10" style={{ fontFamily: "var(--font-playfair), serif" }}>
            The Toolbox
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {tools.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="bg-white border border-[var(--border)] rounded-xl p-6 hover:shadow-md hover:border-[var(--accent-light)] transition-all group"
              >
                <div className="text-3xl mb-3">{tool.icon}</div>
                <h3 className="text-lg font-bold text-[var(--accent)] mb-2 group-hover:text-[var(--accent-light)]">
                  {tool.name}
                </h3>
                <p className="text-[var(--muted)] text-sm leading-relaxed">{tool.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* About strip */}
      <section className="bg-white border-t border-[var(--border)] py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-xl font-bold text-[var(--accent)] mb-4" style={{ fontFamily: "var(--font-playfair), serif" }}>
            Built for Harris County. Free, always.
          </h2>
          <p className="text-[var(--muted)] leading-relaxed">
            This project exists because civic engagement shouldn&apos;t require a lobbyist or a law degree.
            All data comes from public sources. All tools are free to use and share.
          </p>
        </div>
      </section>
    </div>
  );
}
