"use client";

import { useState } from "react";
import Link from "next/link";

const NAVY = "#1a3a5c";
const BLUE = "#2563a8";
const GOLD = "#c9a227";

/* ─── Data ─────────────────────────────────────────────────────────────────── */
const OFFICES = [
  {
    group: "Harris County",
    offices: [
      { title: "County Commissioner", level: "County", term: "4 yrs", qualify: "Voter registered in Harris County. Texas resident.", filing: "Party primary", note: "4 precincts. Pcts 1 & 2 are D-leaning; Pcts 3 & 4 lean R." },
      { title: "County Judge", level: "County", term: "4 yrs", qualify: "Licensed TX attorney OR 4 years serving as judge or practicing law in TX.", filing: "Party primary", note: "Presides over Commissioners Court and serves as a court of law." },
      { title: "District Clerk / County Clerk / Treasurer", level: "County", term: "4 yrs", qualify: "Registered voter in Harris County.", filing: "Party primary", note: "" },
      { title: "Sheriff", level: "County", term: "4 yrs", qualify: "Age 18+. High school diploma or GED. US citizen. No felony conviction.", filing: "Party primary", note: "" },
      { title: "Tax Assessor-Collector", level: "County", term: "4 yrs", qualify: "Registered voter in Harris County.", filing: "Party primary", note: "" },
      { title: "Justice of the Peace / Constable", level: "Precinct", term: "4 yrs", qualify: "Registered voter in the specific precinct.", filing: "Party primary", note: "8 JP precincts in Harris County. Must live in the precinct you seek." },
    ],
  },
  {
    group: "Texas State",
    offices: [
      { title: "Texas State Representative", level: "State", term: "2 yrs", qualify: "TX citizen. Age 18+. 2-year resident of the district.", filing: "Party primary", note: "Houston has ~25 House districts. Filing fee ~$750 or petition alternative." },
      { title: "Texas State Senator", level: "State", term: "4 yrs", qualify: "TX citizen. Age 26+. 5-year TX resident. 1-year district resident.", filing: "Party primary", note: "Districts cover large areas. Filing fee ~$1,250 or petition alternative." },
    ],
  },
  {
    group: "Federal",
    offices: [
      { title: "U.S. Representative", level: "Federal", term: "2 yrs", qualify: "US citizen 7+ years. Age 25+. TX state resident at time of election.", filing: "Party primary", note: "Harris County spans ~9 congressional districts. FEC registration required." },
      { title: "U.S. Senator", level: "Federal", term: "6 yrs", qualify: "US citizen 9+ years. Age 30+. TX state resident at time of election.", filing: "Party primary", note: "Statewide race. FEC registration required." },
    ],
  },
  {
    group: "Houston City",
    offices: [
      { title: "Mayor", level: "City", term: "2 yrs", qualify: "Registered voter. City resident.", filing: "Non-partisan general", note: "Houston uses non-partisan elections. Top-2 runoff if no majority." },
      { title: "City Council Member (Districts A–K)", level: "City", term: "2 yrs", qualify: "Registered voter. Resident of the specific district.", filing: "Non-partisan general", note: "11 single-member districts + 5 at-large seats." },
    ],
  },
];

const STEPS = [
  {
    n: 1,
    title: "Pick your office. Check the qualifications.",
    body: "Before anything else: verify you meet every requirement for the office you want. Age, residency, and registration rules vary by office. Some — like County Judge — require a law license. Get this wrong and your filing gets rejected.",
    warn: null,
    links: [{ label: "Harris County Clerk — Candidate Info", href: "https://www.harrisvotes.com/Candidates" }],
  },
  {
    n: 2,
    title: "Appoint a Campaign Treasurer — before you touch any money.",
    body: "This is the step most first-time candidates miss. Texas law prohibits accepting any contribution or making any expenditure until you file a Campaign Treasurer Appointment (CTA) with the Texas Ethics Commission. It does not matter if you're self-funding. The CTA must come first.",
    warn: "Filing the CTA is free and takes 10 minutes. Skipping it — or accepting even $1 before it's filed — is a TEC violation with civil penalties.",
    links: [
      { label: "TEC Form CTA — Campaign Treasurer Appointment", href: "https://www.ethics.state.tx.us/forms/CTA.pdf" },
      { label: "Texas Ethics Commission", href: "https://www.ethics.state.tx.us" },
    ],
  },
  {
    n: 3,
    title: "Register your candidacy with the appropriate authority.",
    body: "For state and county offices seeking a party primary: file your application with the county or state party chair during the filing window. For Houston city offices: file with the City Secretary. Federal offices: file with the relevant party committee and register with the FEC.",
    warn: null,
    links: [
      { label: "Harris County Democratic Party", href: "https://www.harriscountydemocrats.org" },
      { label: "Harris County Republican Party", href: "https://www.harriscountygop.com" },
      { label: "Houston City Secretary — Candidates", href: "https://www.houstontx.gov/citysec/elections" },
    ],
  },
  {
    n: 4,
    title: "Pay your filing fee — or collect petition signatures.",
    body: "Primary filing fees are set by the state or county party. You can avoid the fee by collecting petition signatures equal to 2% of the total votes cast in the last primary for that party in that district (minimum 50, maximum 500 for state offices). Signatures must be from registered voters who are members of your party.",
    warn: "Petition signature requirements are strict. Every signer must be a registered voter who did not vote in the other party's primary in the same election cycle. Verify each signature carefully.",
    links: [
      { label: "TX Election Code — Filing Fees (§172.024)", href: "https://statutes.capitol.texas.gov/Docs/EL/htm/EL.172.htm" },
    ],
  },
  {
    n: 5,
    title: "Set up your campaign finance reporting.",
    body: "After the CTA is filed, you must report contributions and expenditures on the TEC schedule. State and county candidates file with TEC. Federal candidates file with the FEC. Reports are due quarterly and more frequently near elections. Failure to file on time = fines.",
    warn: null,
    links: [
      { label: "TEC Campaign Finance Guide for Candidates", href: "https://www.ethics.state.tx.us/guides/Camp_guide.pdf" },
      { label: "FEC — Candidate Registration", href: "https://www.fec.gov/candidates-and-committees/candidates/" },
    ],
  },
  {
    n: 6,
    title: "Build your infrastructure. Start raising money.",
    body: "Open a dedicated campaign bank account in your campaign committee's name. Get a campaign phone number, a basic website, and a mailing address. Start with your personal network — warm asks outperform cold calls 10-to-1. Run your donor list through the TEC database to find who in your district is already giving.",
    warn: null,
    links: [
      { label: "Where Is the Dough — See who's already giving in Harris County", href: "/tools/where-is-the-dough" },
    ],
  },
  {
    n: 7,
    title: "Know your district. Study the numbers.",
    body: "Pull your district's voting history. Who voted in the last primary? What's the base turnout? Where does your party over- and under-perform? This tells you where to spend time and where to mail. Don't guess — the data exists.",
    warn: null,
    links: [
      { label: "Heat Check — Precinct-level voting history", href: "/tools/heat-check" },
      { label: "Districts — Full results by district", href: "/tools/districts" },
    ],
  },
  {
    n: 8,
    title: "File for the ballot during the official window.",
    body: "Texas primary candidates file with the party chair during a specific 2-week window. For the March 2026 primary, the filing period is December 9, 2025 – January 2, 2026. You must appear in person or submit materials by the deadline. No extensions.",
    warn: "The December 9 – January 2 filing window closes at 6 PM on January 2, 2026. Missing it by one hour means waiting two years.",
    links: [
      { label: "TX Secretary of State — 2026 Election Calendar", href: "https://www.sos.state.tx.us/elections/laws/2026-election-calendar.shtml" },
    ],
  },
];

const TREASURER_RULES = [
  "The CTA (Campaign Treasurer Appointment) must be filed with TEC before accepting any contribution or making any expenditure — including from your own pocket.",
  "Your treasurer must be a Texas resident. You can appoint yourself as your own treasurer.",
  "Once appointed, your treasurer's name and address become public record on TEC's website.",
  "If you replace your treasurer, file a new CTA. The old treasurer remains liable for reports during their period.",
  "If you close your campaign, file Form COH (Certificate of Dissolution) with TEC after distributing remaining funds per Texas law. Remaining funds cannot go to personal use.",
  "All bank accounts must be in the committee's name, not your personal name.",
];

const DEADLINES_2026 = [
  { label: "Party primary filing opens", date: "Dec 9, 2025", party: null, important: false },
  { label: "Party primary filing closes", date: "Jan 2, 2026 (6 PM)", party: null, important: true },
  { label: "Voter registration deadline (Primary)", date: "Feb 2, 2026", party: null, important: false },
  { label: "Early voting begins (Primary)", date: "Feb 17, 2026", party: null, important: false },
  { label: "Primary Election Day", date: "Mar 3, 2026", party: null, important: true },
  { label: "Runoff filing (if needed)", date: "Check with party chair", party: null, important: false },
  { label: "Primary Runoff Election Day", date: "May 26, 2026", party: null, important: false },
  { label: "Independent filing deadline", date: "~May/June 2026", party: null, important: false },
  { label: "General Election Day", date: "Nov 3, 2026", party: null, important: true },
];

/* ─── Components ─────────────────────────────────────────────────────────── */
function StepCard({ step, isOpen, onToggle }: {
  step: typeof STEPS[0];
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-2xl overflow-hidden ring-1 ring-black/8 transition-all duration-200"
      style={{ background: "#fff", boxShadow: isOpen ? "0 4px 16px rgba(26,58,92,0.10)" : "0 1px 4px rgba(26,58,92,0.06)" }}>
      <button onClick={onToggle} className="w-full text-left p-5 flex items-start gap-4">
        <span className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-black"
          style={{ background: isOpen ? NAVY : `${NAVY}12`, color: isOpen ? "#fff" : NAVY }}>
          {step.n}
        </span>
        <div className="flex-1">
          <h3 className="font-bold text-sm leading-snug" style={{ color: NAVY, fontFamily: "var(--font-playfair), serif" }}>
            {step.title}
          </h3>
        </div>
        <svg className="shrink-0 mt-0.5 transition-transform duration-200" width="14" height="14"
          viewBox="0 0 12 12" fill="none" stroke={NAVY} strokeWidth="2"
          style={{ transform: isOpen ? "rotate(180deg)" : "none" }}>
          <path d="M2 4l4 4 4-4"/>
        </svg>
      </button>
      {isOpen && (
        <div className="px-5 pb-5">
          <div className="ml-13 pl-0" style={{ paddingLeft: "3.25rem" }}>
            <p className="text-sm leading-relaxed mb-3" style={{ color: "#374151" }}>{step.body}</p>
            {step.warn && (
              <div className="rounded-xl p-3 mb-3 flex gap-2"
                style={{ background: "#fef3c7", border: "1px solid #f59e0b44" }}>
                <span className="shrink-0 text-amber-600">⚠</span>
                <p className="text-xs leading-relaxed" style={{ color: "#92400e" }}>{step.warn}</p>
              </div>
            )}
            {step.links.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {step.links.map(l => (
                  <a key={l.href} href={l.href}
                    target={l.href.startsWith("/") ? undefined : "_blank"}
                    rel={l.href.startsWith("/") ? undefined : "noopener noreferrer"}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors duration-150"
                    style={{ background: `${BLUE}12`, color: BLUE }}>
                    {l.label}
                    {!l.href.startsWith("/") && (
                      <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M7 1h4v4M11 1L5 7M3 3H1v8h8V9"/>
                      </svg>
                    )}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────────────────────────── */
export default function RunForOffice() {
  const [openStep, setOpenStep] = useState<number | null>(1);
  const [officeGroup, setOfficeGroup] = useState<string>("Harris County");

  return (
    <div style={{ background: "#f2f5f9", minHeight: "100vh", fontFamily: "var(--font-outfit), sans-serif" }}>

      {/* Hero */}
      <section className="relative overflow-hidden"
        style={{ background: `linear-gradient(135deg,${NAVY} 0%,#0f2540 60%,#162e4a 100%)`, paddingTop: "3rem", paddingBottom: "3.5rem" }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 70% 60% at 80% 40%,rgba(37,99,168,0.18) 0%,transparent 70%)" }}/>
        <div className="relative max-w-4xl mx-auto px-5">
          <p className="text-sky-300 text-xs font-bold uppercase tracking-[0.22em] mb-3">Toolbox</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3"
            style={{ fontFamily: "var(--font-playfair), serif" }}>
            Run for Office in Harris County
          </h1>
          <p className="text-white/60 text-sm max-w-xl mb-6">
            What each office requires, when to file, treasurer rules, and the literal steps to get on the ballot. Every deadline is real. Every rule is Texas law.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="#steps" className="px-5 py-2.5 rounded-full text-sm font-bold text-white transition-all duration-200 hover:scale-[1.02]"
              style={{ background: BLUE }}>
              Start the checklist →
            </a>
            <a href="#treasurer" className="px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200"
              style={{ background: "rgba(255,255,255,0.12)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)" }}>
              Treasurer rules first
            </a>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-12">

        {/* Key Deadlines */}
        <section>
          <h2 className="text-lg font-bold mb-4" style={{ color: NAVY, fontFamily: "var(--font-playfair), serif" }}>
            2026 Election Deadlines
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {DEADLINES_2026.map(d => (
              <div key={d.label} className="rounded-xl p-4 ring-1"
                style={{
                  background: d.important ? "#fff" : "#fff",
                  border: d.important ? `1px solid ${GOLD}55` : "1px solid rgba(0,0,0,0.08)",
                  boxShadow: d.important ? `0 0 0 1px ${GOLD}22` : "none",
                }}>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-1"
                  style={{ color: d.important ? GOLD : "#9ca3af" }}>
                  {d.important ? "⭐ Key Date" : "Deadline"}
                </p>
                <p className="font-bold text-sm leading-snug mb-1" style={{ color: NAVY }}>{d.label}</p>
                <p className="text-xs font-semibold" style={{ color: d.important ? BLUE : "#6b7280" }}>{d.date}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Treasurer Rules */}
        <section id="treasurer">
          <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: `2px solid ${GOLD}55`, boxShadow: `0 4px 20px ${GOLD}18` }}>
            <div className="p-5 pb-4" style={{ background: `linear-gradient(135deg,${NAVY},#0f2540)` }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">⚠️</span>
                <h2 className="text-base font-bold text-white" style={{ fontFamily: "var(--font-playfair), serif" }}>
                  Campaign Treasurer Rules — Read Before Anything Else
                </h2>
              </div>
              <p className="text-white/60 text-xs">Texas Election Code. Violations carry civil penalties up to $5,000 per offense.</p>
            </div>
            <div className="p-5">
              <ul className="space-y-3">
                {TREASURER_RULES.map((r, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black mt-0.5"
                      style={{ background: `${NAVY}12`, color: NAVY }}>{i + 1}</span>
                    <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>{r}</p>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-wrap gap-2">
                <a href="https://www.ethics.state.tx.us/forms/CTA.pdf" target="_blank" rel="noopener noreferrer"
                  className="px-4 py-2 rounded-full text-xs font-bold text-white"
                  style={{ background: NAVY }}>
                  Download Form CTA (Campaign Treasurer Appointment)
                </a>
                <a href="https://www.ethics.state.tx.us" target="_blank" rel="noopener noreferrer"
                  className="px-4 py-2 rounded-full text-xs font-semibold"
                  style={{ background: `${NAVY}10`, color: NAVY }}>
                  Texas Ethics Commission →
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Step-by-step */}
        <section id="steps">
          <h2 className="text-lg font-bold mb-1" style={{ color: NAVY, fontFamily: "var(--font-playfair), serif" }}>
            Step-by-Step: How to Get on the Ballot
          </h2>
          <p className="text-sm mb-5" style={{ color: "#6b7280" }}>
            Click each step to expand. These apply to Texas party primaries — the path most Harris County candidates take.
          </p>
          <div className="space-y-3">
            {STEPS.map(s => (
              <StepCard
                key={s.n}
                step={s}
                isOpen={openStep === s.n}
                onToggle={() => setOpenStep(openStep === s.n ? null : s.n)}
              />
            ))}
          </div>
        </section>

        {/* Office requirements */}
        <section id="offices">
          <h2 className="text-lg font-bold mb-2" style={{ color: NAVY, fontFamily: "var(--font-playfair), serif" }}>
            What Each Office Requires
          </h2>
          {/* Group tabs */}
          <div className="flex flex-wrap gap-2 mb-5">
            {OFFICES.map(g => (
              <button key={g.group} onClick={() => setOfficeGroup(g.group)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150"
                style={officeGroup === g.group
                  ? { background: NAVY, color: "#fff" }
                  : { background: "rgba(26,58,92,0.08)", color: NAVY }}>
                {g.group}
              </button>
            ))}
          </div>
          {OFFICES.filter(g => g.group === officeGroup).map(g => (
            <div key={g.group} className="space-y-3">
              {g.offices.map(o => (
                <div key={o.title} className="rounded-2xl p-5 ring-1 ring-black/8"
                  style={{ background: "#fff", boxShadow: "0 1px 4px rgba(26,58,92,0.06)" }}>
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-sm" style={{ color: NAVY, fontFamily: "var(--font-playfair), serif" }}>
                      {o.title}
                    </h3>
                    <div className="flex gap-2 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-[0.12em] px-2 py-0.5 rounded-full"
                        style={{ background: `${BLUE}12`, color: BLUE }}>{o.level}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(26,58,92,0.07)", color: "#6b7280" }}>
                        {o.term} term
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="font-bold uppercase tracking-[0.1em] text-[9px] mb-1" style={{ color: "#9ca3af" }}>Qualifications</p>
                      <p style={{ color: "#374151" }}>{o.qualify}</p>
                    </div>
                    <div>
                      <p className="font-bold uppercase tracking-[0.1em] text-[9px] mb-1" style={{ color: "#9ca3af" }}>How to File</p>
                      <p style={{ color: "#374151" }}>{o.filing}</p>
                    </div>
                  </div>
                  {o.note && (
                    <p className="mt-2 text-[11px] italic leading-relaxed" style={{ color: "#9ca3af" }}>{o.note}</p>
                  )}
                </div>
              ))}
            </div>
          ))}
        </section>

        {/* Related tools */}
        <section className="rounded-2xl p-6" style={{ background: NAVY }}>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>
            Before you file — know the landscape
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { href: "/tools/heat-check", label: "Heat Check", desc: "See precinct-level Dem/GOP performance in every race" },
              { href: "/tools/where-is-the-dough", label: "Where Is the Dough", desc: "Track who's already raised money in your race" },
              { href: "/tools/districts", label: "Districts", desc: "Full voting history and win numbers by district" },
            ].map(t => (
              <Link key={t.href} href={t.href}
                className="rounded-xl p-4 block hover:scale-[1.02] transition-transform duration-150"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
                <p className="font-bold text-sm text-white mb-1">{t.label}</p>
                <p className="text-[11px] leading-snug" style={{ color: "rgba(255,255,255,0.55)" }}>{t.desc}</p>
              </Link>
            ))}
          </div>
        </section>

        <p className="text-[11px] text-center italic pb-6" style={{ color: "#9ca3af" }}>
          Deadlines and fees are subject to change. Verify all dates with the Texas Secretary of State, Texas Ethics Commission,
          and the relevant party chair. Nothing here is legal advice.
        </p>
      </div>
    </div>
  );
}
