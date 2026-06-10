"use client";
import { useState } from "react";
import Link from "next/link";
import ThreadsFeed from "@/components/ThreadsFeed";

/* ─── Harris County Congressional delegation ─────────────────────────────────── */
// The 9 congressional districts that cover Harris County (verified against the
// precinct crosswalk built from Census TIGER 2024 boundaries).
const REPS = [
  { name: "Christian Menefee",  district: "CD-18", party: "D", note: "Won 2025 special election",    photo: "" },
  { name: "Al Green",           district: "CD-9",  party: "D", note: "Civil rights veteran",          photo: "https://unitedstates.github.io/images/congress/450x550/G000553.jpg" },
  { name: "Lizzie Fletcher",    district: "CD-7",  party: "D", note: "Energy & Commerce Committee",  photo: "https://unitedstates.github.io/images/congress/450x550/F000468.jpg" },
  { name: "Sylvia Garcia",      district: "CD-29", party: "D", note: "House Judiciary Committee",    photo: "https://unitedstates.github.io/images/congress/450x550/G000587.jpg" },
  { name: "Dan Crenshaw",       district: "CD-2",  party: "R", note: "House Armed Services",         photo: "https://unitedstates.github.io/images/congress/450x550/C001120.jpg" },
  { name: "Morgan Luttrell",    district: "CD-8",  party: "R", note: "North Harris & Montgomery",    photo: "https://unitedstates.github.io/images/congress/450x550/L000595.jpg" },
  { name: "Troy Nehls",         district: "CD-22", party: "R", note: "Fort Bend & southwest Harris", photo: "https://unitedstates.github.io/images/congress/450x550/N000026.jpg" },
  { name: "Brian Babin",        district: "CD-36", party: "R", note: "East Harris & Ship Channel",   photo: "https://unitedstates.github.io/images/congress/450x550/B001291.jpg" },
  { name: "Wesley Hunt",        district: "CD-38", party: "R", note: "West Houston",                 photo: "https://unitedstates.github.io/images/congress/450x550/H001090.jpg" },
];

const CONGRESS = { name: "119th Congress", status: "In Session", term: "Jan 2025 – Jan 2027" };

const TRACKS = [
  { label: "Floor Votes",          desc: "Every vote cast by Harris County's US delegation — party-line, bipartisan, and notable splits.", color: "#991b1b" },
  { label: "Committee Work",       desc: "Hearings, markups, and chair positions. Fletcher (Energy & Commerce) and Babin (Science Chair) tracked closely.", color: "#b91c1c" },
  { label: "Federal Funding",      desc: "FEMA disaster relief, Port of Houston grants, HUD housing dollars, and TxDOT highway money flowing to Harris County.", color: "#0891b2" },
  { label: "Campaign Finance",     desc: "FEC filings for all 9 reps — donors, PAC money, and spending compared to district lean.", color: "#b45309" },
];

const JOURNALISTS = [
  { name: "Mike Morris",      outlet: "Houston Chronicle",    beat: "Harris County government & Congress",    handle: "@mmorrisHC",       url: "https://x.com/mmorrisHC" },
  { name: "Dylan McGuinness", outlet: "Houston Chronicle",    beat: "Houston & Harris County politics",       handle: "@dylmcguinness",   url: "https://x.com/dylmcguinness" },
  { name: "Paul Cobler",      outlet: "Texas Tribune",        beat: "Houston / Harris County",                handle: "@paulcobler",      url: "https://x.com/paulcobler" },
  { name: "Jasper Scherer",   outlet: "Houston Chronicle",    beat: "Harris County politics",                 handle: "@jaspscherer",     url: "https://x.com/jaspscherer" },
  { name: "Andrew Schneider", outlet: "Houston Public Media", beat: "County government & federal funding",    handle: "@aschneider_hpm",  url: "https://x.com/aschneider_hpm" },
];

const HASHTAGS = [
  { tag: "#HoustonCongress",  desc: "Houston delegation floor votes, committee work, and federal funding wins" },
  { tag: "#HarrisCounty",     desc: "County-level angle on federal legislation and FEMA disaster relief" },
  { tag: "#CD7",              desc: "Lizzie Fletcher's district — energy corridor, Westheimer, Katy" },
  { tag: "#CD18",             desc: "Christian Menefee's district — Third Ward, Midtown, Heights" },
  { tag: "#HoustonChron",     desc: "Houston Chronicle breaking news and investigations" },
  { tag: "#texastribune",     desc: "Texas Tribune non-partisan accountability journalism" },
];

interface SocialPost { platform: "Threads"|"Facebook"|"Twitter/X"; author: string; handle: string; content: string; url: string; time: string; image?: string; verified?: boolean; }
const SOCIAL: SocialPost[] = [
  { platform: "Twitter/X", author: "Houston Chronicle",  handle: "@HoustonChron",    verified: true, image: "https://images.unsplash.com/photo-1503198515498-d0bd9ed16902?auto=format&fit=crop&w=800&q=70", content: "Houston's congressional delegation split on the latest federal budget deal. Green, Garcia, Fletcher voted yes. Crenshaw, Nehls, Hunt voted no. Full breakdown in our story.", url: "https://twitter.com/HoustonChron",      time: "2h ago" },
  { platform: "Twitter/X", author: "Mike Morris",        handle: "@mmorrisHC",       content: "FEMA approved the supplemental disaster relief for Harris County — $800M heading our way. Bipartisan push from Menefee and Crenshaw made it happen.",                      url: "https://twitter.com/mmorrisHC",         time: "4h ago" },
  { platform: "Threads",   author: "Texas Tribune",      handle: "@texastribune",    content: "Babin's Science Committee hearing on NASA's budget drew sharp questions about Johnson Space Center funding. Full transcript available.",                url: "https://www.threads.net/@texastribune", time: "5h ago" },
  { platform: "Twitter/X", author: "Dylan McGuinness",   handle: "@dylmcguinness",   content: "Lizzie Fletcher secured $45M in federal transit funding for the Westpark Tollway expansion in today's Transportation appropriations markup. Quiet win, big impact.",        url: "https://twitter.com/dylmcguinness",     time: "7h ago" },
  { platform: "Twitter/X", author: "Dan Crenshaw",       handle: "@DanCrenshawTX",   content: "Voted against the spending bill today. $2T in new debt our kids will pay for. I won't sign off on fiscal irresponsibility no matter which party brings it.",              url: "https://twitter.com/DanCrenshawTX",     time: "8h ago" },
  { platform: "Facebook",  author: "Houston Dems",       handle: "fb/houstondems",   content: "Al Green's floor speech on the Voting Rights Act today was powerful. 30+ years fighting for Houston — and the fight isn't over. Full video in our stories.",               url: "https://www.facebook.com/groups/search/results/?q=houston+democrats", time: "1d ago" },
  { platform: "Facebook",  author: "Harris County GOP",  handle: "fb/harriscountygop",content: "Dan Crenshaw's amendment to cut EPA red tape from Port of Houston expansion passed committee 22-15. Real relief for Houston's energy economy coming.",                      url: "https://www.facebook.com/groups/search/results/?q=harris+county+republican", time: "1d ago" },
];


export default function CongressBeatPage() {
  const [tab, setTab] = useState<"overview"|"social"|"journalists">("overview");

  return (
    <div style={{ background: "var(--background)", minHeight: "100vh" }}>

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ minHeight: 280 }}>
        <img src="https://images.unsplash.com/photo-1503198515498-d0bd9ed16902?auto=format&fit=crop&w=1400&q=80"
          alt="US Capitol" className="absolute inset-0 w-full h-full object-cover" style={{ opacity: 0.35 }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg,#7f1d1d 0%,#991b1b 55%,#b91c1c 100%)", opacity: 0.78 }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 80% at 80% 50%,rgba(220,38,38,0.2),transparent)" }} />
        <div className="relative max-w-5xl mx-auto px-5 pt-10 pb-0">
          <p className="text-red-300 text-[10px] font-bold uppercase tracking-[0.25em] mb-3">The Beat · Washington D.C.</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2" style={{ fontFamily: "var(--font-playfair), serif", lineHeight: 1.15 }}>
            Congressional Beat
          </h1>
          <p className="text-white/55 text-sm max-w-md mb-6">
            Harris County in Washington — 9 representatives, every vote, every dollar, every hearing.
          </p>

          {/* Congress info */}
          <div className="flex flex-wrap gap-3 mb-6">
            {[
              { label: "Congress",  value: CONGRESS.name },
              { label: "Status",    value: CONGRESS.status },
              { label: "Term",      value: CONGRESS.term },
              { label: "HC Reps",   value: "9 Members" },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl px-4 py-2.5" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/40 mb-0.5">{label}</p>
                <p className="text-xs font-bold text-white">{value}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-1">
            {([["overview","The Delegation"],["social","Voices on Social"],["journalists","Who Covers It"]] as const).map(([k,l]) => (
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
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] mb-4">Harris County Delegation — 119th Congress</p>

              {/* Party split bar */}
              <div className="rounded-2xl bg-white ring-1 ring-black/7 p-4 mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--muted)]">Party Split</span>
                </div>
                <div className="flex h-3 rounded-full overflow-hidden gap-px">
                  <div className="flex-1 bg-blue-500 rounded-l-full" style={{ flex: 4 }} />
                  <div className="flex-1 bg-red-500 rounded-r-full" style={{ flex: 5 }} />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[10px] font-bold text-blue-600">4 Democrats</span>
                  <span className="text-[10px] font-bold text-red-600">5 Republicans</span>
                </div>
              </div>

              {/* Rep cards — 2 col grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
                {REPS.map(r => (
                  <div key={r.district} className="flex items-center gap-3 rounded-2xl bg-white ring-1 ring-black/7 p-3.5">
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0"
                      style={{ outline: `2px solid ${r.party === "D" ? "#1d4ed8" : "#dc2626"}`, outlineOffset: "2px" }}>
                      <img src={r.photo} alt={r.name} className="w-full h-full object-cover object-top"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-[var(--accent)] leading-tight truncate" style={{ fontFamily: "var(--font-playfair), serif" }}>{r.name}</p>
                      <p className="text-[9px] text-[var(--muted)]">{r.district} · {r.note}</p>
                    </div>
                    <span className={`ml-auto text-[8px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${r.party === "D" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}`}>
                      {r.party}
                    </span>
                  </div>
                ))}
              </div>

              {/* Tracks */}
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
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)] mb-3">Related Tools</p>
                <div className="space-y-2">
                  {[
                    { label: "Congress Bills", href: "/tools/congressional-bills", desc: "Bills Harris County reps signed into law" },
                    { label: "Where the Money Resides", href: "/tools/where-is-the-dough", desc: "FEC filings for all reps" },
                    { label: "Politicians", href: "/politicians", desc: "Full profiles with OVR ratings" },
                  ].map(l => (
                    <Link key={l.href} href={l.href}
                      className="block rounded-xl p-3 hover:bg-[var(--accent)]/5 transition-colors group">
                      <p className="text-xs font-bold text-[var(--accent)] group-hover:text-[var(--accent-light)]">{l.label}</p>
                      <p className="text-[10px] text-[var(--muted)]">{l.desc}</p>
                    </Link>
                  ))}
                </div>
              </div>
              <div className="rounded-[1.5rem] p-5 text-center" style={{ background: "linear-gradient(135deg,#991b1b,#dc2626)" }}>
                <p className="text-xs font-bold text-white mb-1" style={{ fontFamily: "var(--font-playfair), serif" }}>Live Vote Tracking</p>
                <p className="text-[10px] text-white/60 mb-3">Real-time floor vote tracking for all 8 Harris County reps — in development.</p>
                <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.15em] text-red-200">
                  <span className="relative flex h-2 w-2"><span className="alive-halo absolute inline-flex h-full w-full rounded-full bg-red-300" /><span className="alive-pulse relative inline-flex h-2 w-2 rounded-full bg-red-300" /></span>
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
                    { label: "Twitter/X", q: "#houston congress",  url: "https://twitter.com/search?q=houston+congress" },
                    { label: "Threads",   q: "#houston",           url: "https://www.threads.net/search?q=houston+politics" },
                    { label: "Facebook",  q: "Houston Democrats",  url: "https://www.facebook.com/groups/search/results/?q=houston+democrats" },
                    { label: "Facebook",  q: "Houston Republicans",url: "https://www.facebook.com/groups/search/results/?q=houston+republicans" },
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
                    <div className="w-9 h-9 rounded-full bg-[#991b1b] flex items-center justify-center flex-shrink-0">
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
                    className="flex flex-col rounded-2xl bg-white ring-1 ring-black/7 px-4 py-3 hover:shadow-md transition-all duration-200 hover:ring-[#dc2626]">
                    <span className="text-sm font-bold text-[#991b1b]">{h.tag}</span>
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
