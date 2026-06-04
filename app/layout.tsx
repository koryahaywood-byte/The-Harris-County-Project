import type { Metadata } from "next";
import { Playfair_Display, Dancing_Script, Outfit } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Nav from "@/components/Nav";
import EmailGate from "@/components/EmailGate";
import ChatWidget from "@/components/ChatWidget";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });
const dancing = Dancing_Script({ subsets: ["latin"], variable: "--font-dancing" });

export const metadata: Metadata = {
  title: "The Harris County Project",
  description: "Civic tools for Harris County residents. They stopped teaching civics — we didn't.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${playfair.variable} ${dancing.variable}`}>
      <body className="min-h-screen flex flex-col" style={{ fontFamily: "var(--font-outfit), sans-serif" }}>
        <EmailGate />
        <Nav />
        <main className="flex-1">{children}</main>
        <ChatWidget />
        <footer className="border-t border-[var(--border)] bg-[var(--accent)] text-white">
          {/* Top strip */}
          <div className="max-w-6xl mx-auto px-6 pt-14 pb-10 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-10">
            {/* Left — brand */}
            <div className="max-w-sm">
              <p style={{ fontFamily: "var(--font-dancing), cursive", fontSize: "2rem", lineHeight: 1.1 }} className="mb-3">
                Built With Wood
              </p>
              <p className="text-white/60 text-sm leading-relaxed">
                A free civic toolbox for Harris County residents. All data from public sources. Built to make local government legible.
              </p>
            </div>

            {/* Right — nav links */}
            <nav className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm text-white/70 self-start pt-1">
              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-1">Tools</p>
                <Link href="/#toolbox" className="hover:text-white transition-colors duration-300">Toolbox</Link>
                <Link href="/tools/heat-check" className="hover:text-white transition-colors duration-300">Heat Check</Link>
                <Link href="/tools/bill-tracker" className="hover:text-white transition-colors duration-300">Bill Tracker</Link>
                <Link href="/tools/county-budget" className="hover:text-white transition-colors duration-300">County Budget</Link>
                <Link href="/tools/civic-calendar" className="hover:text-white transition-colors duration-300">Civic Calendar</Link>
                <Link href="/tools/tv-station" className="hover:text-white transition-colors duration-300">TV Station</Link>
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-1">Site</p>
                <Link href="/politicians" className="hover:text-white transition-colors duration-300">Officials</Link>
                <Link href="/blogs" className="hover:text-white transition-colors duration-300">Media</Link>
                <Link href="/tools/endorsement-flowchart" className="hover:text-white transition-colors duration-300">Endorsements</Link>
                <Link href="/tools/tirz" className="hover:text-white transition-colors duration-300">TIRZs</Link>
                <Link href="/contact" className="hover:text-white transition-colors duration-300">Contact</Link>
              </div>
            </nav>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/10 px-6 py-4 max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-white/40 text-xs">
              The Harris County Project &mdash; Free, always. Data from public sources.
            </p>
            <p className="text-white/40 text-xs">
              Houston, TX &mdash; Built for the people
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
