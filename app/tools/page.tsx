import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Every tool · The Harris County Project",
  description: "The full index: race ratings, your ballot, campaign money, precinct maps, officials, budgets, bills and meetings in Harris County.",
};

// The directory. Organized by the question someone arrives with, not by how
// the tool was built. /tools/voter-search is private and never listed; parked
// tools (endorsement/consultant flowcharts, infrastructure funding) stay off.

interface Entry { href: string; name: string; does: string; live?: boolean }

const DESK: { head: string; note: string; items: Entry[] }[] = [
  { head: "The 2026 election", note: "Who's running, who's favored, and what's on your ballot", items: [
    { href: "/races", name: "The race board", does: "All 93 races on the Harris County ballot, rated from Safe D to Safe R, with money and the last result." },
    { href: "/tools/my-ballot", name: "Your ballot", does: "Your address in, your exact November ballot out. Printable for the booth." },
    { href: "/tools/tx-house", name: "Texas House board", does: "The county's state house seats ranked by competitiveness, and the swing seats that matter." },
    { href: "/tools/judges", name: "Know your judges", does: "The judicial races most voters skip: who holds each bench and who's challenging." },
    { href: "/tools/campaign-trail", name: "Campaign trail", does: "Block walks, phone banks and rallies from both parties, updated from live sources." },
    { href: "/tools/run-for-office", name: "Run for office", does: "What each office requires, the filing deadlines, and the steps to get on the ballot." },
  ] },
  { head: "Money", note: "Where campaign and public dollars come from and go", items: [
    { href: "/tools/where-is-the-dough", name: "Campaign cash", does: "Cash on hand, raised and spent for every official and challenger, from FEC, TEC and county filings.", live: true },
    { href: "/tools/donor-search", name: "Who gave", does: "Search top donors by name or employer and see every official they fund." },
    { href: "/tools/pac-tracker", name: "Outside money", does: "Independent expenditures by PACs and super PACs in Texas federal races.", live: true },
    { href: "/tools/donor-network", name: "Donor network", does: "The donors who give to more than one Harris County official, drawn as a network." },
    { href: "/tools/public-money", name: "Public money", does: "County and city budgets, TIRZ zones and discretionary funds in one place." },
    { href: "/tools/tax-receipt", name: "Your tax receipt", does: "Enter a home value and see your property tax bill line by line." },
  ] },
  { head: "Maps and results", note: "How places vote, precinct by precinct", items: [
    { href: "/tools/heat-check", name: "Precinct results", does: "Every precinct, every general since 2012, with partisan and swing views.", live: true },
    { href: "/tools/districts", name: "District portraits", does: "Vote history, demographics and the number of votes it takes to win any seat.", live: true },
    { href: "/tools/precinct-lookup", name: "Precinct history", does: "Any precinct's results across 2020, 2022, 2024 and 2026." },
    { href: "/tools/opportunity-map", name: "Opportunity map", does: "Turnout against registration by district: where votes are left on the table." },
    { href: "/tools/field-sweep", name: "Field sweep", does: "All precincts classified by turnout opportunity, exportable for field work." },
    { href: "/tools/early-vote", name: "Early vote tracker", does: "Who is showing up during early voting, by precinct and day." },
  ] },
  { head: "Government", note: "Who holds power and what they do with it", items: [
    { href: "/my-officials", name: "Who represents me", does: "Every official who answers to your address, justice of the peace to U.S. Senate." },
    { href: "/politicians", name: "Officials", does: "Profiles of Harris County's elected officials: record, money and committees." },
    { href: "/tools/court-votes", name: "Commissioners Court votes", does: "How each commissioner votes on recorded items and how often they agree." },
    { href: "/tools/bill-tracker", name: "Texas bills", does: "Bills filed by Harris County legislators, ranked by what became law.", live: true },
    { href: "/tools/congressional-bills", name: "Congress bills", does: "What the county's members of Congress sponsored and passed.", live: true },
    { href: "/tools/who-do-i-call", name: "Who do I call", does: "Potholes, flooding, trash, noise: the right office and number for each problem." },
    { href: "/tools/the-network", name: "The network", does: "Endorsements, consultants and major donors across Harris County races." },
  ] },
  { head: "The beat", note: "Meetings, calendars and coverage", items: [
    { href: "/tools/civic-calendar", name: "Civic calendar", does: "Election dates, filing deadlines and every public meeting worth knowing." },
    { href: "/tools/city-hall", name: "City Hall beat", does: "Houston City Council meetings summarized from the public record.", live: true },
    { href: "/tools/harris-county-beat", name: "Commissioners Court beat", does: "A digest of what the county's governing body is doing." },
    { href: "/tools/state-beat", name: "Austin beat", does: "What the Texas Legislature is doing that touches Harris County." },
    { href: "/tools/congress-beat", name: "Washington beat", does: "The county's members of Congress, in one feed." },
    { href: "/tools/the-brief", name: "The brief", does: "County, state, Congress and city on one page, with who covers each." },
    { href: "/tools/tv-station", name: "TV station", does: "Live and archived streams of Commissioners Court, City Council, HISD and the Legislature." },
    { href: "/blogs", name: "Journalists and voices", does: "The reporters and accounts that cover Harris County, by outlet." },
  ] },
  { head: "Reference", note: "How the desk works, and how to use its data", items: [
    { href: "/methodology", name: "How we rate races", does: "The rating scale, what goes into it, and how the accountability score is computed." },
    { href: "/tools/embeds", name: "Embed our widgets", does: "Put a race card or the election countdown on your own site." },
    { href: "/about", name: "About the project", does: "Who builds this and why." },
    { href: "/contact", name: "Report an error", does: "Found a wrong number or a missing race? Tell the desk." },
  ] },
];

export default function ToolsIndex() {
  const count = DESK.reduce((n, s) => n + s.items.length, 0);
  return (
    <div>
      <header className="border-b" style={{ background: "var(--surface)", borderColor: "var(--rule)" }}>
        <div className="max-w-6xl mx-auto px-4 md:px-6 pt-10 pb-8">
          <p className="label" style={{ color: "var(--brand)" }}>The index</p>
          <h1 className="serif text-[40px] md:text-[52px] leading-[1.03] tracking-[-0.02em] font-semibold mt-2" style={{ color: "var(--ink)" }}>Every tool</h1>
          <p className="mt-3 max-w-2xl text-[17px] leading-relaxed" style={{ color: "#3C443F" }}>
            {`${count} tools for understanding Harris County politics, grouped by the question you're asking.`}
          </p>
          <nav className="mt-6 flex flex-wrap gap-2" aria-label="Jump to section">
            {DESK.map(s => (
              <a key={s.head} href={`#${s.head.toLowerCase().replace(/\W+/g, "-")}`} className="text-[13px] font-semibold px-3 py-1.5 rounded-full border hover:bg-[var(--paper)]"
                style={{ borderColor: "var(--rule-strong)", color: "var(--ink)" }}>{s.head}</a>
            ))}
          </nav>
        </div>
      </header>
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-10 space-y-12">
        {DESK.map(s => (
          <section key={s.head} id={s.head.toLowerCase().replace(/\W+/g, "-")} className="scroll-mt-20">
            <div className="desk-head flex items-baseline gap-3 flex-wrap mb-2">
              <h2 className="serif text-[26px] font-semibold" style={{ color: "var(--ink)" }}>{s.head}</h2>
              <p className="text-[14px]" style={{ color: "#6B726D" }}>{s.note}</p>
            </div>
            <ul className="grid md:grid-cols-2 gap-x-10">
              {s.items.map(t => (
                <li key={t.href} className="border-b" style={{ borderColor: "var(--rule)" }}>
                  <Link href={t.href} className="group flex items-start gap-4 py-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-[17px] font-bold flex items-center gap-2" style={{ color: "var(--ink)" }}>
                        <span className="group-hover:underline decoration-1 underline-offset-4">{t.name}</span>
                        {t.live && <span className="label inline-flex items-center gap-1" style={{ fontSize: 10, color: "var(--brand)" }}><span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--brand)" }} />Live data</span>}
                      </p>
                      <p className="text-[14px] leading-relaxed mt-0.5" style={{ color: "#4F5752" }}>{t.does}</p>
                    </div>
                    <span className="mt-1 text-[18px] transition-transform group-hover:translate-x-0.5" style={{ color: "#9AA19C" }} aria-hidden>→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
