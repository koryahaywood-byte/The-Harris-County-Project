"use client";
import { useState } from "react";
import Link from "next/link";
import ThreadsFeed from "@/components/ThreadsFeed";

/* ─── Harris County TX delegation ───────────────────────────────────────────── */
const SENATORS = [
  { name: "Carol Alvarado",   district: "SD-6",  party: "D", slug: "carol-alvarado",   photo: "https://senate.texas.gov/members/d06/img/CA-2018_web.jpg" },
  { name: "Borris Miles",     district: "SD-13", party: "D", slug: "borris-miles",     photo: "https://senate.texas.gov/members/d13/img/Sen-Miles-2025-Headshot-web.jpg" },
  { name: "Joan Huffman",     district: "SD-17", party: "R", slug: "joan-huffman",     photo: "https://senate.texas.gov/members/d17/img/headshot.jpg" },
  { name: "Paul Bettencourt", district: "SD-7",  party: "R", slug: "paul-bettencourt", photo: "https://senate.texas.gov/members/d07/img/headshot.jpg" },
];

const SESSION = {
  name: "89th Texas Legislature",
  status: "Adjourned",
  start: "Jan 14, 2025",
  end: "Jun 2, 2025",
  bills_filed: "8,400+",
  laws_passed: "~1,200",
  next: "90th Legislature · Jan 2027",
};

const TRACKS = [
  { label: "Floor Votes",         desc: "Every vote by Harris County reps. Sorted by party-line splits and bipartisan wins.", color: "#4c1d95" },
  { label: "Committee Hearings",  desc: "Key hearings tracked with AI summary and bill status. Lobbyist filings cross-referenced.", color: "#7c3aed" },
  { label: "Property Tax & Schools", desc: "HB 2, SB 4, and school finance bills directly impacting Harris County homeowners.", color: "#0891b2" },
  { label: "Lobbyist Map",        desc: "Who is paying whom to lobby in Austin on Harris County-related issues.", color: "#b45309" },
];

const JOURNALISTS = [
  { name: "Jeremy Wallace",   outlet: "Texas Tribune",        beat: "Texas Legislature & Austin politics",    handle: "@JeremySWallace",  url: "https://x.com/JeremySWallace" },
  { name: "Robert Downen",    outlet: "Houston Chronicle",    beat: "Texas politics & Legislature",           handle: "@RobDownenChron",  url: "https://x.com/RobDownenChron" },
  { name: "Zach Despart",     outlet: "Houston Chronicle",    beat: "Texas Legislature, Harris County",       handle: "@zachdespart",     url: "https://x.com/zachdespart" },
  { name: "Cassandra Pollock",outlet: "Texas Tribune",        beat: "Texas politics, governor's office",      handle: "@cassandrapollock",url: "https://x.com/cassandrapollock" },
  { name: "Paul Cobler",      outlet: "Texas Tribune",        beat: "Houston / Harris County",                handle: "@paulcobler",      url: "https://x.com/paulcobler" },
  { name: "Jasper Scherer",   outlet: "Houston Chronicle",    beat: "Harris County, state politics",          handle: "@jaspscherer",     url: "https://x.com/jaspscherer" },
];

const HASHTAGS = [
  { tag: "#txlege",          desc: "Main hashtag for the Texas Legislature. Live floor votes, hearings, bills" },
  { tag: "#HarrisCounty",    desc: "County-level coverage, used alongside #txlege for local impact stories" },
  { tag: "#txedu",           desc: "Texas school voucher, HISD, and education policy debates" },
  { tag: "#txpolitics",      desc: "Broader Texas political conversation. Primaries, candidates, polling" },
  { tag: "#HoustonChron",    desc: "Houston Chronicle breaking news and investigations" },
  { tag: "#texastribune",    desc: "Texas Tribune non-partisan accountability journalism" },
];

interface SocialPost { platform: "Threads"|"Facebook"|"Twitter/X"; author: string; handle: string; content: string; url: string; time: string; image?: string; verified?: boolean; }
const SOCIAL: SocialPost[] = [
  { platform: "Twitter/X", author: "Texas Tribune",     handle: "@texastribune",    verified: true, image: "https://images.unsplash.com/photo-1531218150217-54595bc2b934?auto=format&fit=crop&w=800&q=70", content: "Final day of the 89th Legislature: Here's everything that passed, failed, or got left on the table. With a Harris County filter. Big thread.",                        url: "https://twitter.com/TexasTribune",       time: "2h ago" },
  { platform: "Twitter/X", author: "Jeremy Wallace",    handle: "@JeremySWallace",  content: "#txlege: Harris County delegation split on property tax bill final passage. Alvarado, Miles voted no. Bettencourt, Huffman yes. Bill goes to governor.",              url: "https://twitter.com/JeremySWallace",     time: "4h ago" },
  { platform: "Threads",   author: "Texas Tribune",     handle: "@texastribune",    content: "The school voucher bill is heading to the governor's desk. Every Harris County Senate Democrat voted against it. What it means for HISD. Our explainer is live.", url: "https://www.threads.net/@texastribune",   time: "5h ago" },
  { platform: "Threads",   author: "Texas Signal",      handle: "@texassignal",     content: "#txlege wrap: Session ended with property tax relief smaller than promised. Harris County homeowners will see relief. But far less than what was advertised in January.", url: "https://www.threads.net/@texassignal",    time: "6h ago" },
  { platform: "Twitter/X", author: "Zach Despart",      handle: "@zachdespart",     content: "What the 89th Legislature actually delivered for Houston: flood relief funded, school choice passed, Harris County home rule blocked again.", url: "https://twitter.com/zachdespart",         time: "8h ago" },
  { platform: "Facebook",  author: "Texas Dems",        handle: "fb/txdemocrats",   content: "89th Legislature adjourned. Democrats fought hard on every front. Property taxes, public education, and voting rights. The fight continues in 2026.",                  url: "https://www.facebook.com/groups/search/results/?q=texas+democrats", time: "1d ago" },
  { platform: "Facebook",  author: "Texas GOP",         handle: "fb/texasgop",      content: "The 89th Legislature delivered: property tax relief, school choice, and border security. A historic session for Texas conservatives. Full recap on txgop.org",            url: "https://www.facebook.com/groups/search/results/?q=texas+republican", time: "1d ago" },
];


export default function StateBeatPage() {
  const [tab, setTab] = useState<"overview"|"social"|"journalists">("overview");

  return (
    <div className="topo-light" style={{ background: "var(--background)", minHeight: "100vh" }}>

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ minHeight: 280 }}>
        <img src="https://images.unsplash.com/photo-1531218150217-54595bc2b934?auto=format&fit=crop&w=1400&q=80"
          alt="Texas State Capitol" className="absolute inset-0 w-full h-full object-cover" style={{ opacity: 0.35 }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg,#3b0764 0%,#4c1d95 55%,#5b21b6 100%)", opacity: 0.78 }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 80% at 80% 50%,rgba(124,58,237,0.25),transparent)" }} />
        <div className="relative max-w-5xl mx-auto px-5 pt-10 pb-0">
          <p className="text-violet-300 text-[10px] font-bold uppercase tracking-[0.25em] mb-3">The Beat · Austin</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2" style={{ fontFamily: "var(--font-playfair), serif", lineHeight: 1.15 }}>
            State House Beat
          </h1>
          <p className="text-white/55 text-sm max-w-md mb-6">
            The Texas Legislature through a Harris County lens. Bills, votes, hearings, and who's lobbying whom.
          </p>

          {/* Session status */}
          <div className="flex flex-wrap gap-3 mb-6">
            {[
              { label: "Session", value: SESSION.name },
              { label: "Status",  value: SESSION.status },
              { label: "Bills Filed", value: SESSION.bills_filed },
              { label: "Laws Passed", value: SESSION.laws_passed },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl px-4 py-2.5" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/40 mb-0.5">{label}</p>
                <p className="text-xs font-bold text-white">{value}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-1">
            {([["overview","What We Track"],["social","Voices on Social"],["journalists","Who Covers It"]] as const).map(([k,l]) => (
              <button key={k} onClick={() => setTab(k)}
                className="px-4 py-2.5 text-xs font-bold uppercase tracking-[0.15em] rounded-t-lg transition-all cursor-pointer"
                style={tab === k ? { background: "rgba(245,243,239,1)", color: "var(--accent)" } : { color: "rgba(255,255,255,0.5)" }}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-5 py-8">

        {tab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
            <div>
              {/* Senate delegation */}
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] mb-4">Harris County Senate Delegation</p>
              <div className="flex flex-col gap-3 mb-8">
                {SENATORS.map(s => (
                  <Link key={s.slug} href={`/politicians/${s.slug}`}
                    className="flex items-center gap-4 rounded-2xl bg-white ring-1 ring-black/7 p-4 hover:shadow-md transition-all cursor-pointer group">
                    <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0"
                      style={{ outline: `2px solid ${s.party === "D" ? "#1d4ed8" : "#dc2626"}`, outlineOffset: "2px" }}>
                      <img src={s.photo} alt={s.name} className="w-full h-full object-cover object-top"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm text-[var(--accent)] group-hover:text-[var(--accent-light)] transition-colors"
                        style={{ fontFamily: "var(--font-playfair), serif" }}>{s.name}</p>
                      <p className="text-[11px] text-[var(--muted)]">State Senator · {s.district}</p>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${s.party === "D" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}`}>
                      {s.party === "D" ? "Dem" : "Rep"}
                    </span>
                  </Link>
                ))}
              </div>

              {/* Hashtag banner */}
              <div className="rounded-2xl p-5 mb-8 flex items-center gap-4" style={{ background: "linear-gradient(135deg,#4c1d95,#7c3aed)" }}>
                <div className="text-4xl font-black text-white/20" style={{ fontFamily: "var(--font-playfair), serif" }}>#</div>
                <div>
                  <p className="text-white font-bold text-lg" style={{ fontFamily: "var(--font-playfair), serif" }}>#txlege</p>
                  <p className="text-white/60 text-xs">The main hashtag on X/Threads for Texas Legislature coverage. Follow it for live floor updates.</p>
                </div>
                <a href="https://twitter.com/search?q=%23txlege" target="_blank" rel="noopener noreferrer"
                  className="ml-auto text-[10px] font-bold text-violet-200 hover:text-white transition-colors whitespace-nowrap">
                  Follow on X →
                </a>
              </div>

              {/* Coverage tracks */}
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] mb-4">Coverage Pipeline</p>
              <div className="space-y-3">
                {TRACKS.map(t => (
                  <div key={t.label} className="rounded-2xl bg-white ring-1 ring-black/7 p-4 flex gap-4">
                    <div className="w-1 rounded-full flex-shrink-0" style={{ background: t.color, minHeight: 40 }} />
                    <div>
                      <p className="font-bold text-sm text-[var(--accent)] mb-1" style={{ fontFamily: "var(--font-playfair), serif" }}>{t.label}</p>
                      <p className="text-xs text-[var(--muted)] leading-relaxed">{t.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
              <div className="rounded-[1.5rem] bg-white ring-1 ring-black/7 p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)] mb-1">Next Session</p>
                <p className="text-2xl font-black text-[var(--accent)] mb-1" style={{ fontFamily: "var(--font-playfair), serif" }}>Jan 2027</p>
                <p className="text-xs text-[var(--muted)] mb-4">90th Texas Legislature</p>
                <div className="h-px bg-[var(--border)] mb-4" />
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)] mb-3">Related Tools</p>
                <div className="space-y-2">
                  {[
                    { label: "Bill Tracker", href: "/tools/bill-tracker" },
                    { label: "Congress Bills", href: "/tools/congressional-bills" },
                    { label: "Politicians", href: "/politicians" },
                  ].map(l => (
                    <Link key={l.href} href={l.href}
                      className="block rounded-xl px-3 py-2 text-xs font-bold text-[var(--accent)] hover:bg-[var(--accent)]/5 transition-colors">
                      {l.label} →
                    </Link>
                  ))}
                </div>
              </div>
              <div className="rounded-[1.5rem] p-5 text-center" style={{ background: "linear-gradient(135deg,#4c1d95,#7c3aed)" }}>
                <p className="text-xs font-bold text-white mb-1" style={{ fontFamily: "var(--font-playfair), serif" }}>Live Bill Tracking</p>
                <p className="text-[10px] text-white/60 mb-3">Vote-by-vote coverage of the 90th Legislature: launches January 2027.</p>
                <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.15em] text-violet-300">
                  <span className="relative flex h-2 w-2"><span className="alive-halo absolute inline-flex h-full w-full rounded-full bg-violet-400" /><span className="alive-pulse relative inline-flex h-2 w-2 rounded-full bg-violet-400" /></span>
                  In Development
                </span>
              </div>
            </div>
          </div>
        )}

        {tab === "social" && (
          <ThreadsFeed
            posts={SOCIAL}
            footer={
              <div className="rounded-2xl p-4 ring-1 ring-black/7 bg-white max-w-xl">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--muted)] mb-2">Find more</p>
                <div className="space-y-1.5">
                  {[
                    { label: "Twitter/X", q: "#txlege",        url: "https://twitter.com/search?q=%23txlege" },
                    { label: "Threads",   q: "#txlege",        url: "https://www.threads.net/search?q=txlege" },
                    { label: "Facebook",  q: "Texas Politics", url: "https://www.facebook.com/groups/search/results/?q=texas+politics" },
                    { label: "Facebook",  q: "Texas Democrats",url: "https://www.facebook.com/groups/search/results/?q=texas+democrats" },
                  ].map((item, i) => (
                    <a key={i} href={item.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-[11px] hover:underline" style={{ color: "#2563a8" }}>
                      <span className="text-[9px] font-bold uppercase tracking-wide w-14 shrink-0" style={{ color: "#9ca3af" }}>{item.label}</span>
                      <span className="font-medium">{item.q}</span>
                    </a>
                  ))}
                </div>
              </div>
            }
          />
        )}

        {tab === "journalists" && (
          <div className="max-w-2xl space-y-8">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] mb-4">Reporters Who Cover This Beat</p>
              <div className="space-y-3">
                {JOURNALISTS.map(j => (
                  <a key={j.handle} href={j.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-4 rounded-2xl bg-white ring-1 ring-black/7 p-4 hover:shadow-md transition-all duration-200 group">
                    <div className="w-9 h-9 rounded-full bg-[#4c1d95] flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">{j.name.split(" ").map(w => w[0]).join("").slice(0,2)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-[var(--accent)] group-hover:text-[var(--accent-light)]">{j.name}</p>
                      <p className="text-[10px] text-[var(--muted)]">{j.outlet} · {j.beat}</p>
                    </div>
                    <span className="text-[10px] font-bold text-sky-600 shrink-0">{j.handle}</span>
                  </a>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] mb-4">Hashtags to Follow</p>
              <div className="flex flex-wrap gap-2">
                {HASHTAGS.map(h => (
                  <a key={h.tag} href={`https://x.com/search?q=${encodeURIComponent(h.tag)}`} target="_blank" rel="noopener noreferrer"
                    className="flex flex-col rounded-2xl bg-white ring-1 ring-black/7 px-4 py-3 hover:shadow-md transition-all duration-200 hover:ring-[#7c3aed]">
                    <span className="text-sm font-bold text-[#4c1d95]">{h.tag}</span>
                    <span className="text-[10px] text-[var(--muted)] mt-0.5">{h.desc}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
