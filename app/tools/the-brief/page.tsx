"use client";
import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import ThreadsFeed from "@/components/ThreadsFeed";
import type { CouncilMeetingData, AgendaItem } from "@/app/api/city-hall/route";

/* ─── Shared types ───────────────────────────────────────────────────────── */
interface SocialPost { platform: "Threads"|"Facebook"|"Twitter/X"; author: string; handle: string; content: string; url: string; time: string; image?: string; verified?: boolean; }
interface Journalist { name: string; outlet: string; beat: string; handle: string; url: string; }
interface Hashtag { tag: string; desc: string; }
interface Track { label: string; desc: string; color: string; }
interface Official { name: string; title: string; district: string; party: "D"|"R"; slug?: string; photo: string; note?: string; }

/* ─── Level config ───────────────────────────────────────────────────────── */
type Level = "county" | "state" | "congress" | "city";

const COUNTY_OFFICIALS: Official[] = [
  { name: "Lina Hidalgo",   title: "County Judge (lame duck: open seat Nov. 2026)", district: "At-Large", party: "D", slug: "lina-hidalgo",   photo: "/politicians/lina-hidalgo.jpg" },
  { name: "Rodney Ellis",   title: "Commissioner", district: "Pct 1", party: "D", slug: "rodney-ellis",   photo: "/politicians/rodney-ellis.jpg" },
  { name: "Adrian Garcia",  title: "Commissioner", district: "Pct 2", party: "D", slug: "adrian-garcia",  photo: "/politicians/adrian-garcia.jpg" },
  { name: "Tom Ramsey",     title: "Commissioner", district: "Pct 3", party: "R", slug: "tom-ramsey",     photo: "/politicians/tom-ramsey.jpg" },
  { name: "Lesley Briones", title: "Commissioner", district: "Pct 4", party: "D", slug: "lesley-briones", photo: "/politicians/lesley-briones.webp" },
];
const STATE_OFFICIALS: Official[] = [
  { name: "Carol Alvarado",   title: "State Senator", district: "SD-6",  party: "D", slug: "carol-alvarado",   photo: "https://senate.texas.gov/members/d06/img/CA-2018_web.jpg" },
  { name: "Borris Miles",     title: "State Senator", district: "SD-13", party: "D", slug: "borris-miles",     photo: "https://senate.texas.gov/members/d13/img/Sen-Miles-2025-Headshot-web.jpg" },
  { name: "Joan Huffman",     title: "State Senator", district: "SD-17", party: "R", slug: "joan-huffman",     photo: "https://senate.texas.gov/members/d17/img/headshot.jpg" },
  { name: "Paul Bettencourt", title: "State Senator", district: "SD-7",  party: "R", slug: "paul-bettencourt", photo: "https://senate.texas.gov/members/d07/img/headshot.jpg" },
];
const CONGRESS_OFFICIALS: Official[] = [
  { name: "Seat Vacant (CD-18)", title: "D nominee: Christian Menefee. Seat vacant since Jul 2024", district: "CD-18", party: "D", photo: "" },
  { name: "Al Green",           title: "Retiring. Term ends Jan 2027",                               district: "CD-9",  party: "D", photo: "https://unitedstates.github.io/images/congress/450x550/G000553.jpg" },
  { name: "Lizzie Fletcher",    title: "Energy & Commerce Committee",                                district: "CD-7",  party: "D", photo: "https://unitedstates.github.io/images/congress/450x550/F000468.jpg" },
  { name: "Sylvia Garcia",      title: "House Judiciary Committee",                                  district: "CD-29", party: "D", photo: "https://unitedstates.github.io/images/congress/450x550/G000587.jpg" },
  { name: "Dan Crenshaw",       title: "House Armed Services",                                       district: "CD-2",  party: "R", photo: "https://unitedstates.github.io/images/congress/450x550/C001120.jpg" },
  { name: "Morgan Luttrell",    title: "North Harris & Montgomery",                                  district: "CD-8",  party: "R", photo: "https://unitedstates.github.io/images/congress/450x550/L000595.jpg" },
  { name: "Troy Nehls",         title: "Fort Bend & southwest Harris",                               district: "CD-22", party: "R", photo: "https://unitedstates.github.io/images/congress/450x550/N000026.jpg" },
  { name: "Brian Babin",        title: "East Harris & Ship Channel",                                 district: "CD-36", party: "R", photo: "https://unitedstates.github.io/images/congress/450x550/B001291.jpg" },
  { name: "Wesley Hunt",        title: "Leaving. Ran for Senate; term ends Jan 2027",               district: "CD-38", party: "R", photo: "https://unitedstates.github.io/images/congress/450x550/H001090.jpg" },
];

const TRACKS: Record<Level, Track[]> = {
  county: [
    { label: "Commissioners Court",   desc: "Full court meets biweekly: Tuesdays at 10am. Votes on budget, contracts, flood control, and county policy.", color: "#1a3a5c" },
    { label: "Justice & Policing",    desc: "JPD oversight, constable offices, and the DA's office. Reform progress and critical incidents tracked here.",  color: "#b91c1c" },
    { label: "Flood Control",         desc: "Harris County Flood Control District. Bond projects, buyouts, detention ponds. Updated after each board meeting.", color: "#0891b2" },
    { label: "Budget & Contracts",    desc: "FY2027 county budget, major vendor contracts, and discretionary spending by precinct.",                         color: "#059669" },
  ],
  state: [
    { label: "Floor Votes",              desc: "Every vote by Harris County reps. Sorted by party-line splits and bipartisan wins.",                              color: "#4c1d95" },
    { label: "Committee Hearings",       desc: "Key hearings tracked with AI summary and bill status. Lobbyist filings cross-referenced.",                        color: "#7c3aed" },
    { label: "Property Tax & Schools",   desc: "HB 2, SB 4, and school finance bills directly impacting Harris County homeowners.",                              color: "#0891b2" },
    { label: "Lobbyist Map",             desc: "Who is paying whom to lobby in Austin on Harris County-related issues.",                                          color: "#b45309" },
  ],
  congress: [
    { label: "Floor Votes",      desc: "Every vote cast by Harris County's US delegation. Party-line, bipartisan, and notable splits.",                           color: "#991b1b" },
    { label: "Committee Work",   desc: "Hearings, markups, and chair positions. Fletcher (Energy & Commerce) and Babin (Science Chair) tracked closely.",         color: "#b91c1c" },
    { label: "Federal Funding",  desc: "FEMA disaster relief, Port of Houston grants, HUD housing dollars, and TxDOT highway money flowing to Harris County.",    color: "#0891b2" },
    { label: "Campaign Finance", desc: "FEC filings for all 9 reps. Donors, PAC money, and spending compared to district lean.",                                  color: "#b45309" },
  ],
  city: [],
};

const JOURNALISTS: Record<Level, Journalist[]> = {
  county: [
    { name: "Mike Morris",      outlet: "Houston Chronicle",    beat: "Harris County government",      handle: "@mmorrisHC",      url: "https://x.com/mmorrisHC" },
    { name: "Neena Satija",     outlet: "Houston Chronicle",    beat: "Constables & policing",         handle: "@NeenaSatija",    url: "https://x.com/NeenaSatija" },
    { name: "Dylan McGuinness", outlet: "Houston Chronicle",    beat: "Houston politics",              handle: "@dylmcguinness",  url: "https://x.com/dylmcguinness" },
    { name: "Jasper Scherer",   outlet: "Houston Chronicle",    beat: "Harris County politics",        handle: "@jaspscherer",    url: "https://x.com/jaspscherer" },
    { name: "Andrew Schneider", outlet: "Houston Public Media", beat: "County government & courts",   handle: "@aschneider_hpm", url: "https://x.com/aschneider_hpm" },
    { name: "Paul Cobler",      outlet: "Texas Tribune",        beat: "Houston / Harris County",       handle: "@paulcobler",     url: "https://x.com/paulcobler" },
  ],
  state: [
    { name: "Jeremy Wallace",    outlet: "Texas Tribune",     beat: "Texas Legislature & Austin politics",  handle: "@JeremySWallace",  url: "https://x.com/JeremySWallace" },
    { name: "Robert Downen",     outlet: "Houston Chronicle", beat: "Texas politics & Legislature",         handle: "@RobDownenChron",  url: "https://x.com/RobDownenChron" },
    { name: "Zach Despart",      outlet: "Houston Chronicle", beat: "Texas Legislature, Harris County",     handle: "@zachdespart",     url: "https://x.com/zachdespart" },
    { name: "Cassandra Pollock", outlet: "Texas Tribune",     beat: "Texas politics, governor's office",   handle: "@cassandrapollock", url: "https://x.com/cassandrapollock" },
    { name: "Paul Cobler",       outlet: "Texas Tribune",     beat: "Houston / Harris County",              handle: "@paulcobler",      url: "https://x.com/paulcobler" },
  ],
  congress: [
    { name: "Mike Morris",      outlet: "Houston Chronicle",    beat: "Harris County government & Congress", handle: "@mmorrisHC",      url: "https://x.com/mmorrisHC" },
    { name: "Dylan McGuinness", outlet: "Houston Chronicle",    beat: "Houston & Harris County politics",    handle: "@dylmcguinness",  url: "https://x.com/dylmcguinness" },
    { name: "Paul Cobler",      outlet: "Texas Tribune",        beat: "Houston / Harris County",             handle: "@paulcobler",     url: "https://x.com/paulcobler" },
    { name: "Andrew Schneider", outlet: "Houston Public Media", beat: "County government & federal funding", handle: "@aschneider_hpm", url: "https://x.com/aschneider_hpm" },
  ],
  city: [
    { name: "Dylan McGuinness", outlet: "Houston Chronicle",    beat: "Houston City Council & Mayor",              handle: "@dylmcguinness",  url: "https://x.com/dylmcguinness" },
    { name: "Abby Church",      outlet: "Houston Chronicle",    beat: "City Hall reporter. Budget, council, mayor", handle: "@abbychurch",     url: "https://x.com/abbychurch" },
    { name: "Jasper Scherer",   outlet: "Houston Chronicle",    beat: "Houston politics & City Hall",               handle: "@jaspscherer",    url: "https://x.com/jaspscherer" },
    { name: "Andrew Schneider", outlet: "Houston Public Media", beat: "City government, housing & transit",         handle: "@aschneider_hpm", url: "https://x.com/aschneider_hpm" },
    { name: "Paul Cobler",      outlet: "Texas Tribune",        beat: "Houston / Harris County accountability",     handle: "@paulcobler",     url: "https://x.com/paulcobler" },
    { name: "Courier Texas",    outlet: "Courier Texas",        beat: "Statewide + Houston politics and policy",    handle: "@CourierTexas",   url: "https://x.com/CourierTexas" },
  ],
};

const HASHTAGS: Record<Level, Hashtag[]> = {
  county: [
    { tag: "#HarrisCounty",      desc: "All county government coverage" },
    { tag: "#CommissionersCourt", desc: "Court votes, agendas, results" },
    { tag: "#HCFloodControl",    desc: "Bond projects, buyouts, Harvey recovery" },
    { tag: "#HarrisCountyDA",    desc: "District Attorney office coverage" },
  ],
  state: [
    { tag: "#txlege",      desc: "Main hashtag for the Texas Legislature. Live floor votes, hearings, bills" },
    { tag: "#HarrisCounty", desc: "County-level coverage, used alongside #txlege for local impact stories" },
    { tag: "#txedu",       desc: "Texas school voucher, HISD, and education policy debates" },
    { tag: "#txpolitics",  desc: "Broader Texas political conversation. Primaries, candidates, polling" },
  ],
  congress: [
    { tag: "#HoustonCongress", desc: "Houston delegation floor votes, committee work, and federal funding wins" },
    { tag: "#HarrisCounty",    desc: "County-level angle on federal legislation and FEMA disaster relief" },
    { tag: "#CD7",             desc: "Lizzie Fletcher's district. Energy corridor, Westheimer, Katy" },
    { tag: "#CD18",            desc: "CD-18 seat vacant; Menefee is the D nominee for November" },
  ],
  city: [
    { tag: "#HoustonCityCouncil", desc: "City Council votes, zoning, contracts, and mayoral proposals" },
    { tag: "#HTownPolitics",      desc: "Broad Houston political conversation. Elections, endorsements, debates" },
    { tag: "#HISD",               desc: "Houston ISD. School board votes, superintendent news, voucher impact" },
    { tag: "#HoustonBudget",      desc: "City of Houston budget process, property taxes, and bond elections" },
  ],
};

const SOCIAL: Record<Level, SocialPost[]> = {
  county: [
    { platform: "Twitter/X", author: "Mike Morris",      handle: "@mmorrisHC",       content: "Commissioners Court approved the revised JPD oversight policy 3-2 today. Precincts 3 and 4 dissenting. Full story up now.",                                           url: "https://x.com/mmorrisHC",         time: "3h ago" },
    { platform: "Threads",   author: "Rodney Ellis",     handle: "@rodellis",         verified: true, image: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=800&q=70", content: "Pct 1 secured $12M for Sims Bayou improvements in today's court vote. Flood protection for 40,000+ residents.", url: "https://www.threads.net/@rodellis", time: "5h ago" },
    { platform: "Twitter/X", author: "Jasper Scherer",   handle: "@jaspscherer",      content: "Commissioners Court deferred the Third Ward road improvement contract again. Advocates say it's been tabled 6 times this year.",                                      url: "https://x.com/jaspscherer",       time: "6h ago" },
    { platform: "Twitter/X", author: "Paul Cobler",      handle: "@paulcobler",       content: "Commissioners Court 4-1 to expand the county public defender's office. Largest expansion in Harris County history.",                                                   url: "https://x.com/paulcobler",        time: "8h ago" },
  ],
  state: [
    { platform: "Twitter/X", author: "Texas Tribune",    handle: "@texastribune",    verified: true, image: "https://images.unsplash.com/photo-1531218150217-54595bc2b934?auto=format&fit=crop&w=800&q=70", content: "Final day of the 89th Legislature: Here's everything that passed, failed, or got left on the table. With a Harris County filter.", url: "https://twitter.com/TexasTribune",  time: "2h ago" },
    { platform: "Twitter/X", author: "Jeremy Wallace",   handle: "@JeremySWallace",  content: "#txlege: Harris County delegation split on property tax bill final passage. Alvarado, Miles voted no. Bettencourt, Huffman yes. Bill goes to governor.",              url: "https://twitter.com/JeremySWallace", time: "4h ago" },
    { platform: "Threads",   author: "Texas Tribune",    handle: "@texastribune",    content: "The school voucher bill is heading to the governor's desk. Every Harris County Senate Democrat voted against it. What it means for HISD. Our explainer is live.", url: "https://www.threads.net/@texastribune", time: "5h ago" },
    { platform: "Twitter/X", author: "Zach Despart",     handle: "@zachdespart",     content: "What the 89th Legislature actually delivered for Houston: flood relief funded, school choice passed, Harris County home rule blocked again.",                         url: "https://twitter.com/zachdespart",  time: "8h ago" },
  ],
  congress: [
    { platform: "Twitter/X", author: "Houston Chronicle", handle: "@HoustonChron",   verified: true, image: "https://images.unsplash.com/photo-1503198515498-d0bd9ed16902?auto=format&fit=crop&w=800&q=70", content: "Houston's congressional delegation split on the latest federal budget deal. Green, Garcia, Fletcher voted yes. Crenshaw, Nehls, Hunt voted no.", url: "https://twitter.com/HoustonChron", time: "2h ago" },
    { platform: "Twitter/X", author: "Mike Morris",       handle: "@mmorrisHC",      content: "FEMA approved supplemental disaster relief for Harris County: $800M incoming. Bipartisan push led by Crenshaw and Garcia cleared the committee hurdle.",              url: "https://twitter.com/mmorrisHC",    time: "4h ago" },
    { platform: "Twitter/X", author: "Dylan McGuinness",  handle: "@dylmcguinness",  content: "Lizzie Fletcher secured $45M in federal transit funding for the Westpark Tollway expansion in today's Transportation appropriations markup.",                         url: "https://twitter.com/dylmcguinness", time: "7h ago" },
    { platform: "Twitter/X", author: "Dan Crenshaw",      handle: "@DanCrenshawTX",  content: "Voted against the spending bill today. $2T in new debt our kids will pay for. I won't sign off on fiscal irresponsibility no matter which party brings it.",          url: "https://twitter.com/DanCrenshawTX", time: "8h ago" },
  ],
  city: [
    { platform: "Twitter/X", author: "Abby Church",         handle: "@abbychurch",           content: "Houston City Council passes Mayor Whitmire's $7.5B budget 15-1. Ed Pollard the lone no vote. The $5/month trash fee starts in July.",                      url: "https://x.com/abbychurch",                time: "25m ago" },
    { platform: "Threads",   author: "Andrew Schneider",    handle: "@aschneider_hpm",       content: "Sat in on today's council meeting. The budget line items on public safety drew the sharpest debate. Here's what officials actually said.",                   url: "https://www.threads.net/@aschneider_hpm", time: "3h ago" },
    { platform: "Threads",   author: "Shea Jordan Smith",   handle: "@sheajordansmith",      content: "City Hall again dragging its feet on the Third Ward development proposal. Community voices were clear. Watch what they actually vote on vs what they say.", url: "https://www.threads.net/@sheajordansmith", time: "4h ago" },
    { platform: "Twitter/X", author: "Courier Texas",       handle: "@CourierTexas",         content: "Houston becomes the last major Texas city to adopt a garbage fee. The $5/month charge. It's been 40 years of 'low taxes, low services.'",                    url: "https://x.com/CourierTexas",              time: "4h ago" },
    { platform: "Twitter/X", author: "Evan Mintz",          handle: "@EvanMintz",            content: "The trash fee isn't really about trash. It's about whether Houston can stop bleeding money from a general fund that's run deficits every year since 2009.", url: "https://x.com/EvanMintz",                 time: "5h ago" },
  ],
};

const LEVEL_META: Record<Level, {
  label: string; subtitle: string; gradient: string; accentColor: string; photoColor: string;
  statusChips: { label: string; value: string }[];
  officialLabel: string; officialGrid?: boolean;
  billsLink?: { href: string; label: string };
  partyBar?: { d: number; r: number };
}> = {
  county: {
    label: "County", subtitle: "Harris County Government", gradient: "linear-gradient(135deg,#0f2540 0%,#1a3a5c 100%)", accentColor: "#1a3a5c", photoColor: "#38bdf8",
    statusChips: [{ label: "Next Court", value: "Tue · 10:00 AM" }, { label: "Venue", value: "1001 Preston St" }, { label: "Watch Live", value: "hcgovstreams.com" }],
    officialLabel: "The Court",
  },
  state: {
    label: "State", subtitle: "89th Texas Legislature", gradient: "linear-gradient(135deg,#3b0764 0%,#4c1d95 100%)", accentColor: "#4c1d95", photoColor: "#a78bfa",
    statusChips: [{ label: "Session", value: "89th Legislature" }, { label: "Status", value: "Adjourned" }, { label: "Next", value: "90th · Jan 2027" }],
    officialLabel: "Harris County Senate Delegation",
    billsLink: { href: "/tools/bill-tracker", label: "State Bills →" },
  },
  congress: {
    label: "Congress", subtitle: "119th Congress", gradient: "linear-gradient(135deg,#7f1d1d 0%,#991b1b 100%)", accentColor: "#991b1b", photoColor: "#fca5a5",
    statusChips: [{ label: "Congress", value: "119th" }, { label: "Status", value: "In Session" }, { label: "Term", value: "Jan 2025–Jan 2027" }],
    officialLabel: "Harris County Delegation", officialGrid: true, partyBar: { d: 4, r: 5 },
    billsLink: { href: "/tools/congressional-bills", label: "Federal Bills →" },
  },
  city: {
    label: "City", subtitle: "Houston City Council", gradient: "linear-gradient(135deg,#164e63 0%,#0891b2 100%)", accentColor: "#0891b2", photoColor: "#67e8f9",
    statusChips: [],
    officialLabel: "Council",
  },
};

/* ─── City Hall meeting components (ported from city-hall/page.tsx) ──────── */
const SIG_COLOR = { high: "#b91c1c", medium: "#d97706", low: "#6b7280" } as const;
const SIG_LABEL = { high: "Major", medium: "Notable", low: "Procedural" } as const;
const CAT_META: Record<string, string> = { Budget: "#0f766e", Development: "#7c3aed", "Public Safety": "#1d4ed8", Transportation: "#0891b2", Housing: "#b45309", Environment: "#15803d", Personnel: "#6b7280", Other: "#4b5563" };
const cc = (c: string) => CAT_META[c] ?? "#1a3a5c";

function TimelineItem({ item, index }: { item: AgendaItem; index: number }) {
  const [open, setOpen] = useState(false);
  const sc = SIG_COLOR[item.significance];
  const catC = cc(item.category);
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center flex-shrink-0 w-5">
        <div className="w-2.5 h-2.5 rounded-full mt-1 ring-2 ring-white" style={{ background: sc }} />
        <div className="w-px flex-1 mt-1" style={{ background: `${sc}25`, minHeight: 20 }} />
      </div>
      <div className="flex-1 mb-4 cursor-pointer rounded-2xl transition-all hover:shadow-md"
        style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.06)" }} onClick={() => setOpen(v => !v)}>
        <div className="h-0.5 rounded-t-2xl" style={{ background: `linear-gradient(90deg,${sc},${catC})` }} />
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                <span className="text-[9px] font-bold uppercase tracking-[0.14em] px-2 py-0.5 rounded-full" style={{ background: `${catC}15`, color: catC }}>{item.category}</span>
                <span className="text-[9px] font-bold uppercase tracking-[0.14em] px-2 py-0.5 rounded-full" style={{ background: `${sc}12`, color: sc }}>{SIG_LABEL[item.significance]}</span>
                {item.newsHits.length > 0 && <span className="text-[9px] font-bold" style={{ color: "#2563a8" }}>{item.newsHits.length} article{item.newsHits.length !== 1 ? "s" : ""}</span>}
              </div>
              <h3 className="text-sm font-bold leading-snug" style={{ fontFamily: "var(--font-playfair), serif", color: "#1a3a5c" }}>{item.title}</h3>
              <p className="text-xs leading-relaxed mt-1" style={{ color: "#6b7280" }}>{item.summary}</p>
            </div>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#9ca3af" strokeWidth="1.5" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0, marginTop: 4 }}>
              <path d="M3 5l4 4 4-4" />
            </svg>
          </div>
          {open && item.newsHits.length > 0 && (
            <div className="mt-3 pt-3 border-t border-black/5 space-y-1.5">
              {item.newsHits.slice(0, 3).map((hit, i) => (
                <a key={i} href={hit.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                  className="flex items-baseline gap-2 text-[11px] hover:underline" style={{ color: "#2563a8" }}>
                  <span className="text-[9px] font-bold uppercase tracking-wide shrink-0" style={{ color: "#9ca3af" }}>{hit.source || "News"}</span>
                  <span className="line-clamp-1">{hit.title}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-components ──────────────────────────────────────────────────────── */
function OfficialCard({ official, grid }: { official: Official; grid?: boolean }) {
  const inner = (
    <div className={`flex items-center gap-3 rounded-2xl bg-white ring-1 ring-black/7 p-${grid ? "3.5" : "4"} hover:shadow-md transition-all group cursor-pointer`}>
      <div className={`${grid ? "w-10 h-10" : "w-12 h-12"} rounded-full overflow-hidden flex-shrink-0`}
        style={{ outline: `2px solid ${official.party === "D" ? "#1d4ed8" : "#dc2626"}`, outlineOffset: "2px" }}>
        <img src={official.photo} alt={official.name} className="w-full h-full object-cover object-top"
          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm group-hover:text-[var(--accent-light)] transition-colors truncate" style={{ fontFamily: "var(--font-playfair), serif", color: "#1a3a5c" }}>{official.name}</p>
        <p className="text-[10px]" style={{ color: "#6b7280" }}>{official.title}{official.district ? ` · ${official.district}` : ""}</p>
      </div>
      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${official.party === "D" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}`}>{official.party}</span>
    </div>
  );
  return official.slug ? <Link href={`/politicians/${official.slug}`}>{inner}</Link> : inner;
}

function JournalistsList({ level }: { level: Level }) {
  const list = JOURNALISTS[level];
  const tags = HASHTAGS[level];
  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] mb-4" style={{ color: "#9ca3af" }}>Reporters Who Cover This Beat</p>
        <div className="space-y-3">
          {list.map(j => (
            <a key={j.handle} href={j.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-4 rounded-2xl bg-white ring-1 ring-black/7 p-4 hover:shadow-md transition-all group">
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: LEVEL_META[level].accentColor }}>
                <span className="text-white text-xs font-bold">{j.name.split(" ").map(w => w[0]).join("").slice(0, 2)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-[var(--accent)] group-hover:text-[var(--accent-light)]">{j.name}</p>
                <p className="text-[10px]" style={{ color: "#6b7280" }}>{j.outlet} · {j.beat}</p>
              </div>
              <span className="text-[10px] font-bold shrink-0" style={{ color: "#0ea5e9" }}>{j.handle}</span>
            </a>
          ))}
        </div>
      </div>
      {tags.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] mb-4" style={{ color: "#9ca3af" }}>Hashtags to Follow</p>
          <div className="flex flex-wrap gap-2">
            {tags.map(h => (
              <a key={h.tag} href={`https://x.com/search?q=${encodeURIComponent(h.tag)}`} target="_blank" rel="noopener noreferrer"
                className="flex flex-col rounded-2xl bg-white ring-1 ring-black/7 px-4 py-3 hover:shadow-md transition-all">
                <span className="text-sm font-bold" style={{ color: LEVEL_META[level].accentColor }}>{h.tag}</span>
                <span className="text-[10px] mt-0.5" style={{ color: "#6b7280" }}>{h.desc}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Inner page (needs useSearchParams, wrapped in Suspense) ────────────── */
function TheBriefInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initLevel = (searchParams.get("level") as Level) ?? "county";
  const [level, setLevel] = useState<Level>(initLevel);
  const [tab, setTab] = useState<string>(searchParams.get("tab") ?? (initLevel === "city" ? "meeting" : "overview"));

  // City Hall live data
  const [cityData, setCityData] = useState<CouncilMeetingData | null>(null);
  const [cityLoading, setCityLoading] = useState(false);
  const [cityError, setCityError] = useState<string | null>(null);
  const [cityFilter, setCityFilter] = useState<"all"|"high"|"medium"|"low">("all");

  useEffect(() => {
    if (level === "city" && !cityData && !cityLoading) {
      setCityLoading(true);
      fetch("/api/city-hall")
        .then(r => r.json()).then(d => { if (d.error) throw new Error(d.error); setCityData(d); })
        .catch(e => setCityError(e.message)).finally(() => setCityLoading(false));
    }
  }, [level, cityData, cityLoading]);

  function switchLevel(l: Level) {
    setLevel(l);
    setTab(l === "city" ? "meeting" : "overview");
    router.replace(`/tools/the-brief?level=${l}`, { scroll: false });
  }

  const meta = LEVEL_META[level];
  const officials = level === "county" ? COUNTY_OFFICIALS : level === "state" ? STATE_OFFICIALS : level === "congress" ? CONGRESS_OFFICIALS : [];

  const cityItems = useMemo(() => {
    if (!cityData) return [];
    return cityFilter === "all" ? cityData.items : cityData.items.filter(i => i.significance === cityFilter);
  }, [cityData, cityFilter]);

  const cityTabs = [{ key: "meeting", label: "Meeting Recap" }, { key: "social", label: "Social" }, { key: "journalists", label: "Who Covers It" }];
  const otherTabs = [{ key: "overview", label: "Overview" }, { key: "social", label: "Social" }, { key: "journalists", label: "Who Covers It" }];
  const tabs = level === "city" ? cityTabs : otherTabs;

  const LEVEL_TABS: Level[] = ["county", "state", "congress", "city"];

  return (
    <div className="topo-light" style={{ background: "var(--background)", minHeight: "100vh" }}>

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ minHeight: 240 }}>
        <div className="absolute inset-0" style={{ background: meta.gradient, opacity: 0.92 }} />
        <div className="relative max-w-5xl mx-auto px-5 pt-10 pb-0">
          <Link href="/" className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3 block" style={{ color: "rgba(255,255,255,0.45)" }}>← Harris County Project</Link>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-1" style={{ fontFamily: "var(--font-playfair), serif" }}>The Brief</h1>
          <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,0.55)" }}>{meta.subtitle}</p>

          {/* Level switcher */}
          <div className="flex gap-1 mb-4">
            {LEVEL_TABS.map(l => (
              <button key={l} onClick={() => switchLevel(l)}
                className="px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] rounded-full transition-all cursor-pointer"
                style={level === l
                  ? { background: "rgba(255,255,255,0.2)", color: "#fff", backdropFilter: "blur(8px)" }
                  : { color: "rgba(255,255,255,0.5)" }}>
                {LEVEL_META[l].label}
              </button>
            ))}
          </div>

          {/* Status chips */}
          {meta.statusChips.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-4">
              {meta.statusChips.map(c => (
                <div key={c.label} className="rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
                  <p className="text-[9px] font-bold uppercase tracking-[0.18em] mb-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{c.label}</p>
                  <p className="text-xs font-bold text-white">{c.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* City Hall significance filter in hero */}
          {level === "city" && cityData && tab === "meeting" && (
            <div className="flex items-stretch gap-px overflow-hidden rounded-t-2xl mt-4">
              {(["high", "medium", "low"] as const).map(s => {
                const cnt = cityData.items.filter(i => i.significance === s).length;
                return (
                  <button key={s} onClick={() => setCityFilter(f => f === s ? "all" : s)}
                    className="flex-1 py-3 text-center transition-all cursor-pointer"
                    style={{ background: cityFilter === s ? SIG_COLOR[s] : `${SIG_COLOR[s]}18`, borderTop: `2px solid ${SIG_COLOR[s]}` }}>
                    <p className="text-xl font-black" style={{ color: cityFilter === s ? "#fff" : SIG_COLOR[s], fontFamily: "var(--font-playfair), serif" }}>{cnt}</p>
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: cityFilter === s ? "rgba(255,255,255,0.8)" : SIG_COLOR[s] }}>{SIG_LABEL[s]}</p>
                  </button>
                );
              })}
            </div>
          )}

          {/* Sub-tab bar */}
          {!(level === "city" && tab === "meeting" && cityData) && (
            <div className="flex gap-1 mt-2">
              {tabs.map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className="px-4 py-2.5 text-xs font-bold uppercase tracking-[0.15em] rounded-t-lg transition-all cursor-pointer"
                  style={tab === t.key ? { background: "rgba(245,243,239,1)", color: "var(--accent)" } : { color: "rgba(255,255,255,0.5)" }}>
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Sticky sub-tabs for city meeting view */}
      {level === "city" && (
        <div className="sticky top-0 z-20 border-b border-[var(--border)]" style={{ background: "rgba(245,243,239,0.95)", backdropFilter: "blur(12px)" }}>
          <div className="max-w-5xl mx-auto px-5 flex gap-1 pt-2">
            {cityTabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className="px-4 py-2.5 text-xs font-bold uppercase tracking-[0.15em] rounded-t-lg transition-all cursor-pointer"
                style={tab === t.key ? { background: "#fff", color: "var(--accent)", boxShadow: "0 -1px 0 0 var(--accent) inset" } : { color: "var(--muted)" }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-5 py-8">

        {/* ── Overview / delegation tab ── */}
        {tab === "overview" && level !== "city" && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-8">
            <div>
              {/* County-specific: open seat banner */}
              {level === "county" && (
                <div className="rounded-2xl mb-6 p-4 flex gap-4 items-start" style={{ background: "rgba(37,99,168,0.06)", border: "1px solid rgba(37,99,168,0.15)" }}>
                  <div className="flex-shrink-0 w-2 h-2 mt-1.5 rounded-full" style={{ background: "#1a3a5c" }} />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-1" style={{ color: "#1a3a5c" }}>Open Seat · November 3, 2026</p>
                    <p className="text-xs font-semibold text-[var(--fg)] mb-0.5">Harris County Judge</p>
                    <p className="text-[11px]" style={{ color: "#6b7280" }}><span className="text-blue-700 font-bold">Letitia Plummer</span> (D) vs. <span className="text-red-700 font-bold">Orlando Sanchez</span> (R). Lina Hidalgo did not seek reelection.</p>
                  </div>
                </div>
              )}

              {/* Congress: party split bar */}
              {level === "congress" && meta.partyBar && (
                <div className="rounded-2xl bg-white ring-1 ring-black/7 p-4 mb-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-2" style={{ color: "#9ca3af" }}>Party Split · 119th Congress</p>
                  <div className="flex h-3 rounded-full overflow-hidden gap-px">
                    <div className="rounded-l-full bg-blue-500" style={{ flex: meta.partyBar.d }} />
                    <div className="rounded-r-full bg-red-500" style={{ flex: meta.partyBar.r }} />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[10px] font-bold text-blue-600">{meta.partyBar.d} Democrats</span>
                    <span className="text-[10px] font-bold text-red-600">{meta.partyBar.r} Republicans</span>
                  </div>
                </div>
              )}

              <p className="text-[10px] font-bold uppercase tracking-[0.22em] mb-4" style={{ color: "#9ca3af" }}>{meta.officialLabel}</p>
              <div className={`${meta.officialGrid ? "grid grid-cols-1 sm:grid-cols-2 gap-3" : "flex flex-col gap-3"} mb-10`}>
                {officials.map(o => <OfficialCard key={o.name} official={o} grid={meta.officialGrid} />)}
              </div>

              <p className="text-[10px] font-bold uppercase tracking-[0.22em] mb-4" style={{ color: "#9ca3af" }}>Coverage Pipeline</p>
              <div className="space-y-3">
                {TRACKS[level].map(t => (
                  <div key={t.label} className="rounded-2xl bg-white ring-1 ring-black/7 p-4 flex gap-4">
                    <div className="w-1 rounded-full flex-shrink-0" style={{ background: t.color, minHeight: 40 }} />
                    <div>
                      <p className="font-bold text-sm mb-1" style={{ fontFamily: "var(--font-playfair), serif", color: "#1a3a5c" }}>{t.label}</p>
                      <p className="text-xs leading-relaxed" style={{ color: "#6b7280" }}>{t.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
              <div className="rounded-[1.5rem] bg-white ring-1 ring-black/7 p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: "#9ca3af" }}>Related Tools</p>
                <div className="space-y-2">
                  {[
                    { label: "Heat Check", href: "/tools/heat-check", desc: "Precinct-level election results" },
                    { label: "Where the Money Resides", href: "/tools/where-is-the-dough", desc: "Campaign finance for every official" },
                    { label: "Opportunity Map", href: "/tools/opportunity-map", desc: "Where D votes are being left on the table" },
                    ...(meta.billsLink ? [{ label: meta.billsLink.label, href: meta.billsLink.href, desc: "Bills filed by HC delegation" }] : []),
                  ].map(l => (
                    <Link key={l.href} href={l.href} className="block rounded-xl p-3 hover:bg-black/4 transition-colors group">
                      <p className="text-xs font-bold text-[var(--accent)] group-hover:text-[var(--accent-light)]">{l.label}</p>
                      <p className="text-[10px]" style={{ color: "#6b7280" }}>{l.desc}</p>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── City Hall Meeting Recap ── */}
        {tab === "meeting" && level === "city" && (
          <>
            {cityLoading && (
              <div className="flex items-center gap-3 py-20 justify-center">
                <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" /><span className="relative inline-flex h-3 w-3 rounded-full bg-sky-400" /></span>
                <span className="text-sm" style={{ color: "#6b7280" }}>Fetching latest council meeting...</span>
              </div>
            )}
            {cityError && (
              <div className="rounded-xl ring-1 ring-red-200 p-5 mb-8" style={{ background: "#fef2f2", color: "#7f1d1d" }}>
                <p className="font-semibold text-sm mb-1">Could not load latest meeting</p>
                <p className="text-xs opacity-70">{cityError}</p>
              </div>
            )}
            {!cityLoading && cityData && (
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-8">
                <div>
                  <p className="text-2xl md:text-3xl font-bold leading-snug mb-6" style={{ fontFamily: "var(--font-playfair), serif", color: "#1a3a5c" }}>
                    {cityData.lede || cityData.meetingTitle}
                  </p>
                  <div className="flex gap-2 mb-6 flex-wrap">
                    {(["all", "high", "medium", "low"] as const).map(f => {
                      const cnt = f === "all" ? cityData.items.length : cityData.items.filter(i => i.significance === f).length;
                      const col = f === "all" ? "#1a3a5c" : SIG_COLOR[f];
                      return (
                        <button key={f} onClick={() => setCityFilter(f)} className="px-3 py-1 rounded-full text-[11px] font-bold capitalize transition-all cursor-pointer"
                          style={cityFilter === f ? { background: col, color: "#fff" } : { background: `${col}10`, color: col, border: `1px solid ${col}30` }}>
                          {f === "all" ? `All (${cnt})` : `${SIG_LABEL[f]} (${cnt})`}
                        </button>
                      );
                    })}
                  </div>
                  <div>{cityItems.map((item, i) => <TimelineItem key={item.id} item={item} index={i} />)}</div>
                  <p className="text-[10px] text-center mt-4" style={{ color: "#9ca3af" }}>Summarized by Claude Haiku · News via Google News RSS</p>
                </div>
                <div className="space-y-5">
                  <div className="rounded-[1.5rem] bg-white ring-1 ring-black/7 p-5 text-center">
                    <p className="text-xs font-bold mb-1" style={{ fontFamily: "var(--font-playfair), serif", color: "#1a3a5c" }}>Past Meetings</p>
                    <p className="text-[10px] mb-3" style={{ color: "#6b7280" }}>Every council recap archived here.</p>
                    <a href="https://emilytakesnotes.com" target="_blank" rel="noopener noreferrer" className="text-[11px] font-bold hover:underline" style={{ color: "#0891b2" }}>emilytakesnotes.com →</a>
                  </div>
                  <div className="rounded-[1.5rem] bg-white ring-1 ring-black/7 p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: "#9ca3af" }}>Related Tools</p>
                    {[
                      { label: "City Budget", href: "/tools/public-money?tab=city", desc: "FY2027 Houston budget" },
                      { label: "TIRZ Tool", href: "/tools/public-money?tab=tirz", desc: "27 tax increment zones" },
                      { label: "Discretionary Funds", href: "/tools/public-money?tab=discretionary", desc: "Council member spending" },
                    ].map(l => (
                      <Link key={l.href} href={l.href} className="block rounded-xl p-3 hover:bg-black/4 transition-colors group">
                        <p className="text-xs font-bold text-[var(--accent)] group-hover:text-[var(--accent-light)]">{l.label}</p>
                        <p className="text-[10px]" style={{ color: "#6b7280" }}>{l.desc}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Social tab ── */}
        {tab === "social" && (
          <ThreadsFeed posts={SOCIAL[level]}
            footer={
              <div className="rounded-2xl p-4 ring-1 ring-black/7 bg-white max-w-xl">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-2" style={{ color: "#9ca3af" }}>Find more</p>
                <div className="space-y-1.5">
                  {HASHTAGS[level].slice(0, 3).map(h => (
                    <a key={h.tag} href={`https://x.com/search?q=${encodeURIComponent(h.tag)}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-[11px] hover:underline" style={{ color: "#2563a8" }}>
                      <span className="text-[9px] font-bold uppercase tracking-wide w-14 shrink-0" style={{ color: "#9ca3af" }}>Twitter/X</span>
                      <span className="font-medium">{h.tag}</span>
                    </a>
                  ))}
                </div>
              </div>
            }
          />
        )}

        {/* ── Journalists tab ── */}
        {tab === "journalists" && <JournalistsList level={level} />}
      </div>
    </div>
  );
}

export default function TheBriefPage() {
  return (
    <Suspense>
      <TheBriefInner />
    </Suspense>
  );
}
