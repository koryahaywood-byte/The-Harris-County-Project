"use client";
import { useState } from "react";
import Link from "next/link";
import ThreadsFeed from "@/components/ThreadsFeed";

/* ─── Data ───────────────────────────────────────────────────────────────────── */
const COMMISSIONERS = [
  { name: "Lina Hidalgo",    title: "County Judge (lame duck — open seat Nov. 2026)", district: "At-Large", party: "D", slug: "lina-hidalgo",    photo: "/politicians/lina-hidalgo.jpg" },
  { name: "Rodney Ellis",    title: "Commissioner",        district: "Pct 1",    party: "D", slug: "rodney-ellis",    photo: "/politicians/rodney-ellis.jpg" },
  { name: "Adrian Garcia",   title: "Commissioner",        district: "Pct 2",    party: "D", slug: "adrian-garcia",   photo: "/politicians/adrian-garcia.jpg" },
  { name: "Tom Ramsey",      title: "Commissioner",        district: "Pct 3",    party: "R", slug: "tom-ramsey",      photo: "/politicians/tom-ramsey.jpg" },
  { name: "Lesley Briones",  title: "Commissioner",        district: "Pct 4",    party: "D", slug: "lesley-briones",  photo: "/politicians/lesley-briones.webp" },
];

// November 2026 marquee race: Letitia Plummer (D) vs. Orlando Sanchez (R) for County Judge
const COUNTY_JUDGE_RACE_2026 = {
  d: { name: "Letitia Plummer", note: "Won D runoff 57,893–55,395 over Annise Parker" },
  r: { name: "Orlando Sanchez", note: "Won R runoff 85,304–49,367 over Warren Howell" },
};

const TRACKS = [
  { label: "Commissioners Court",  desc: "Full court meets biweekly — Tuesdays at 10am. Votes on budget, contracts, flood control, and county policy.", color: "#1a3a5c" },
  { label: "Justice & Policing",   desc: "JPD oversight, constable offices, and the DA's office. Reform progress and critical incidents tracked here.", color: "#b91c1c" },
  { label: "Flood Control",        desc: "Harris County Flood Control District — bond projects, buyouts, detention ponds. Updated after each board meeting.", color: "#0891b2" },
  { label: "Budget & Contracts",   desc: "FY2027 county budget, major vendor contracts, and discretionary spending by precinct.", color: "#059669" },
];

interface SocialPost { platform: "Threads"|"Facebook"|"Twitter/X"; author: string; handle: string; content: string; url: string; time: string; image?: string; verified?: boolean; }
const JOURNALISTS = [
  { name: "Mike Morris",       outlet: "Houston Chronicle",    beat: "Harris County government",      handle: "@mmorrisHC",       url: "https://x.com/mmorrisHC" },
  { name: "Neena Satija",      outlet: "Houston Chronicle",    beat: "Constables & policing",         handle: "@NeenaSatija",     url: "https://x.com/NeenaSatija" },
  { name: "Dylan McGuinness",  outlet: "Houston Chronicle",    beat: "Houston politics",              handle: "@dylmcguinness",   url: "https://x.com/dylmcguinness" },
  { name: "Matt Dempsey",      outlet: "Houston Chronicle",    beat: "Data & accountability",         handle: "@mizzousundevil",  url: "https://x.com/mizzousundevil" },
  { name: "Jasper Scherer",    outlet: "Houston Chronicle",    beat: "Harris County politics",        handle: "@jaspscherer",     url: "https://x.com/jaspscherer" },
  { name: "Andrew Schneider",  outlet: "Houston Public Media", beat: "County government & courts",    handle: "@aschneider_hpm",  url: "https://x.com/aschneider_hpm" },
  { name: "Paul Cobler",       outlet: "Texas Tribune",        beat: "Houston / Harris County",       handle: "@paulcobler",      url: "https://x.com/paulcobler" },
];

const HASHTAGS = [
  { tag: "#HarrisCounty",     desc: "All county government coverage" },
  { tag: "#CommissionersCourt", desc: "Court votes, agendas, results" },
  { tag: "#HCFloodControl",   desc: "Bond projects, buyouts, Harvey recovery" },
  { tag: "#HarrisCountyDA",   desc: "District Attorney office coverage" },
  { tag: "#HCConstables",     desc: "8 constable precincts coverage" },
  { tag: "#HoustonChron",     desc: "Chronicle Houston coverage" },
];

const SOCIAL: SocialPost[] = [
  { platform: "Twitter/X", author: "Mike Morris",         handle: "@mmorrisHC",       content: "Commissioners Court approved the revised JPD oversight policy 3-2 today. Precincts 3 and 4 dissenting. Full story up now.",                                           url: "https://x.com/mmorrisHC",         time: "3h ago" },
  { platform: "Threads",   author: "Rodney Ellis",        handle: "@rodellis",         verified: true, image: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=800&q=70", content: "Pct 1 secured $12M for Sims Bayou improvements in today's court vote. Flood protection for 40,000+ residents. This is what investing in our communities looks like.", url: "https://www.threads.net/@rodellis", time: "5h ago" },
  { platform: "Twitter/X", author: "Jasper Scherer",      handle: "@jaspscherer",      content: "Commissioners Court deferred the third Ward road improvement contract again. Advocates say it's been tabled 6 times this year.",                                        url: "https://x.com/jaspscherer",       time: "6h ago" },
  { platform: "Twitter/X", author: "Paul Cobler",         handle: "@paulcobler",       content: "Commissioners Court 4-1 to expand the county public defender's office — largest expansion in Harris County history. Full roll call in the story.",                      url: "https://x.com/paulcobler",        time: "8h ago" },
  { platform: "Facebook",  author: "Harris County Dems",  handle: "fb/harriscountydems", content: "Flood control bond projects on track — 87 buyouts completed this quarter, 340 more pending. Real progress for our most vulnerable neighborhoods.",                  url: "https://www.facebook.com/groups/search/results/?q=harris+county+politics", time: "1d ago" },
  { platform: "Facebook",  author: "HC GOP Watch",        handle: "fb/hcgopwatch",     content: "Commissioner Ramsey calls out contract transparency failures at today's court session. Where is the accountability for Pct 2's construction overruns?",              url: "https://www.facebook.com/groups/search/results/?q=harris+county+republican", time: "1d ago" },
];


export default function HarrisCountyBeatPage() {
  const [tab, setTab] = useState<"overview"|"social"|"journalists">("overview");

  return (
    <div className="topo-light" style={{ background: "var(--background)", minHeight: "100vh" }}>

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ minHeight: 280 }}>
        <img src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1400&q=80"
          alt="Harris County Courthouse" className="absolute inset-0 w-full h-full object-cover" style={{ opacity: 0.35 }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg,#1a3a5c 0%,#0f2540 60%,#162e4a 100%)", opacity: 0.78 }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 80% at 80% 50%,rgba(37,99,168,0.25),transparent)" }} />
        <div className="relative max-w-5xl mx-auto px-5 pt-10 pb-0">
          <p className="text-sky-300 text-[10px] font-bold uppercase tracking-[0.25em] mb-3">The Beat · Harris County</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2" style={{ fontFamily: "var(--font-playfair), serif", lineHeight: 1.15 }}>
            Harris County Beat
          </h1>
          <p className="text-white/55 text-sm max-w-md mb-6">
            Commissioners Court, JPD, flood control, and county agencies — every meeting, every vote.
          </p>

          {/* Meeting info strip */}
          <div className="flex flex-wrap gap-4 mb-6">
            {[
              { label: "Next Court", value: "Tue · 10:00 AM" },
              { label: "Venue", value: "1001 Preston St, Houston" },
              { label: "Watch Live", value: "hcgovstreams.com" },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl px-4 py-2.5" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/40 mb-0.5">{label}</p>
                <p className="text-xs font-bold text-white">{value}</p>
              </div>
            ))}
          </div>

          {/* Tab bar */}
          <div className="flex gap-1">
            {([["overview","What We Track"],["social","Voices on Social"],["journalists","Who Covers It"]] as const).map(([k,l]) => (
              <button key={k} onClick={() => setTab(k)}
                className="px-4 py-2.5 text-xs font-bold uppercase tracking-[0.15em] rounded-t-lg transition-all cursor-pointer"
                style={tab === k
                  ? { background: "rgba(245,243,239,1)", color: "var(--accent)" }
                  : { color: "rgba(255,255,255,0.5)" }}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-5 py-8">

        {/* Overview tab */}
        {tab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
            <div>
              {/* 2026 County Judge race banner */}
              <div className="rounded-2xl mb-6 p-4 flex gap-4 items-start" style={{ background: "rgba(37,99,168,0.06)", border: "1px solid rgba(37,99,168,0.15)" }}>
                <div className="flex-shrink-0 w-2 h-2 mt-1.5 rounded-full bg-[var(--accent)]" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-1" style={{ color: "var(--accent)" }}>Open Seat · November 4, 2026</p>
                  <p className="text-xs font-semibold text-[var(--fg)] mb-0.5">Harris County Judge</p>
                  <p className="text-[11px] text-[var(--muted)]">
                    <span className="text-blue-700 font-bold">Letitia Plummer</span> (D) vs. <span className="text-red-700 font-bold">Orlando Sanchez</span> (R) — Lina Hidalgo did not seek reelection.
                  </p>
                </div>
              </div>

              {/* Commissioners */}
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] mb-4">The Court</p>
              <div className="flex flex-col gap-3 mb-10">
                {COMMISSIONERS.map(c => (
                  <Link key={c.slug} href={`/politicians/${c.slug}`}
                    className="flex items-center gap-4 rounded-2xl bg-white ring-1 ring-black/7 p-4 hover:shadow-md transition-all duration-200 cursor-pointer group">
                    <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 ring-2"
                      style={{ outline: `2px solid ${c.party === "D" ? "#1d4ed8" : "#dc2626"}`, outlineOffset: "2px" }}>
                      <img src={c.photo} alt={c.name} className="w-full h-full object-cover object-top"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-[var(--accent)] group-hover:text-[var(--accent-light)] transition-colors"
                        style={{ fontFamily: "var(--font-playfair), serif" }}>{c.name}</p>
                      <p className="text-[11px] text-[var(--muted)]">{c.title} · {c.district}</p>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${c.party === "D" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}`}>
                      {c.party === "D" ? "Dem" : "Rep"}
                    </span>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                      <path d="M5 3l4 4-4 4" />
                    </svg>
                  </Link>
                ))}
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
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)] mb-3">Related Tools</p>
                <div className="space-y-2">
                  {[
                    { label: "Heat Check", href: "/tools/heat-check", desc: "Precinct-level election results" },
                    { label: "Where the Money Resides", href: "/tools/where-is-the-dough", desc: "Commissioner campaign finance" },
                    { label: "Districts", href: "/tools/districts", desc: "Precinct & district explorer" },
                    { label: "Civic Calendar", href: "/tools/civic-calendar", desc: "All upcoming court dates" },
                  ].map(l => (
                    <Link key={l.href} href={l.href}
                      className="block rounded-xl p-3 hover:bg-[var(--accent)]/5 transition-colors group">
                      <p className="text-xs font-bold text-[var(--accent)] group-hover:text-[var(--accent-light)]">{l.label}</p>
                      <p className="text-[10px] text-[var(--muted)]">{l.desc}</p>
                    </Link>
                  ))}
                </div>
              </div>
              <div className="rounded-[1.5rem] p-5 text-center" style={{ background: "linear-gradient(135deg,#1a3a5c,#2563a8)" }}>
                <p className="text-xs font-bold text-white mb-1" style={{ fontFamily: "var(--font-playfair), serif" }}>Live Recap Coming</p>
                <p className="text-[10px] text-white/60 mb-3">AI-summarized Commissioners Court hearings — same pipeline as City Hall Beat.</p>
                <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.15em] text-sky-300">
                  <span className="relative flex h-2 w-2"><span className="alive-halo absolute inline-flex h-full w-full rounded-full bg-sky-400" /><span className="alive-pulse relative inline-flex h-2 w-2 rounded-full bg-sky-400" /></span>
                  In Development
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Social tab */}
        {tab === "social" && (
          <ThreadsFeed
            posts={SOCIAL}
            footer={
              <div className="rounded-2xl p-4 ring-1 ring-black/7 bg-white max-w-xl">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--muted)] mb-2">Find more</p>
                <div className="space-y-1.5">
                  {[
                    { label: "Twitter/X", q: "#HarrisCounty",        url: "https://twitter.com/search?q=%23HarrisCounty" },
                    { label: "Threads",   q: "#harriscounty",        url: "https://www.threads.net/search?q=harriscounty" },
                    { label: "Facebook",  q: "Harris County Politics", url: "https://www.facebook.com/groups/search/results/?q=harris+county+politics" },
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

        {/* Journalists tab */}
        {tab === "journalists" && (
          <div className="max-w-2xl space-y-8">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] mb-4">Reporters Who Cover This Beat</p>
              <div className="space-y-3">
                {JOURNALISTS.map(j => (
                  <a key={j.handle} href={j.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-4 rounded-2xl bg-white ring-1 ring-black/7 p-4 hover:shadow-md transition-all duration-200 group">
                    <div className="w-9 h-9 rounded-full bg-[var(--accent)] flex items-center justify-center flex-shrink-0">
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
                    className="flex flex-col rounded-2xl bg-white ring-1 ring-black/7 px-4 py-3 hover:shadow-md transition-all duration-200 hover:ring-[var(--accent-light)]">
                    <span className="text-sm font-bold text-[var(--accent)]">{h.tag}</span>
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
