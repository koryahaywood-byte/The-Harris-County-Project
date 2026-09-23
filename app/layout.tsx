import type { Metadata } from "next";
import { Source_Serif_4, Overpass, Overpass_Mono, Dancing_Script } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";
import Nav from "@/components/Nav";
import EmailGate from "@/components/EmailGate";
import ChatWidget from "@/components/ChatWidget";

const serif = Source_Serif_4({ subsets: ["latin"], variable: "--font-source-serif", axes: ["opsz"], display: "swap" });
const sans = Overpass({ subsets: ["latin"], variable: "--font-overpass", display: "swap" });
const mono = Overpass_Mono({ subsets: ["latin"], variable: "--font-overpass-mono", display: "swap" });
const signature = Dancing_Script({ subsets: ["latin"], variable: "--font-dancing", weight: ["700"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "The Harris County Project",
  description: "Every race on the Harris County ballot, rated. The money, the maps, and the officials behind them, from public records.",
};

const FOOTER: { head: string; links: [string, string][] }[] = [
  { head: "2026 election", links: [
    ["/races", "All races, rated"],
    ["/tools/my-ballot", "Your ballot"],
    ["/tools/tx-house", "Texas House board"],
    ["/tools/judges", "Know your judges"],
    ["/tools/civic-calendar", "Election calendar"],
  ] },
  { head: "Money", links: [
    ["/tools/where-is-the-dough", "Campaign cash"],
    ["/tools/donor-search", "Who gave"],
    ["/tools/pac-tracker", "Outside money"],
    ["/tools/public-money", "Public budgets"],
    ["/tools/tax-receipt", "Your tax receipt"],
  ] },
  { head: "Maps and results", links: [
    ["/tools/heat-check", "Precinct results"],
    ["/tools/districts", "District portraits"],
    ["/tools/precinct-lookup", "Precinct history"],
    ["/tools/field-sweep", "Field sweep"],
  ] },
  { head: "Government", links: [
    ["/my-officials", "Who represents me"],
    ["/politicians", "Officials"],
    ["/tools/court-votes", "Commissioners Court votes"],
    ["/tools/bill-tracker", "Bill tracker"],
    ["/tools/who-do-i-call", "Who do I call"],
  ] },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${mono.variable} ${signature.variable}`}>
      <body className="min-h-screen flex flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] btn btn-ink">Skip to content</a>
        <EmailGate />
        <Nav />
        <main id="main" className="flex-1">{children}</main>
        <ChatWidget />
        <footer className="board no-print" style={{ backgroundSize: "auto, 100% 100%" }}>
          <div className="max-w-7xl mx-auto px-4 md:px-6 pt-14 pb-10 grid gap-10 md:grid-cols-[1.3fr_repeat(4,1fr)]">
            <div className="max-w-xs">
              <p className="serif text-[22px] font-semibold leading-tight text-white">The Harris County Project</p>
              <p className="mt-3 text-[14px] leading-relaxed text-white/60">
                Every race on the Harris County ballot, rated, with the money and maps behind it. Built from public records: county canvass returns, FEC and Texas Ethics Commission filings, and Census data.
              </p>
              <p className="mt-5 label text-white/40">Free to use. Free to share.</p>
            </div>
            {FOOTER.map(col => (
              <nav key={col.head} aria-label={col.head}>
                <p className="label mb-3" style={{ color: "var(--gold)" }}>{col.head}</p>
                <ul className="space-y-2">
                  {col.links.map(([href, label]) => (
                    <li key={href}><Link href={href} className="text-[14px] text-white/70 hover:text-white">{label}</Link></li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
          <div className="border-t" style={{ borderColor: "var(--board-line)" }}>
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-5 flex flex-col sm:flex-row gap-3 sm:items-center justify-between text-[13px] text-white/45">
              <p className="flex flex-wrap gap-x-5 gap-y-1">
                <Link href="/methodology" className="hover:text-white">How we rate races</Link>
                <Link href="/about" className="hover:text-white">About</Link>
                <Link href="/contact" className="hover:text-white">Report an error</Link>
                <Link href="/tools" className="hover:text-white">Every tool</Link>
              </p>
              <a href="https://blackivystrategies.com" target="_blank" rel="noopener noreferrer" className="hover:text-white/80"
                style={{ fontFamily: "var(--font-dancing), cursive", fontSize: 20 }}>
                Built With Wood
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
