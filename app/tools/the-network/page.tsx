"use client";
import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";

/* ─── Endorsement types & data ────────────────────────────────────────────── */
type EndorserType = "Union" | "Elected Official" | "Party Org" | "Civic Org" | "Newspaper" | "Business Org";
interface Endorsement { id: string; endorser: string; endorserType: EndorserType; candidate: string; race: string; year: number; notes?: string; }

const ENDORSEMENTS: Endorsement[] = [
  { id: "e1",  endorser: "AFL-CIO Texas",              endorserType: "Union",            candidate: "Jasmine Crockett", race: "U.S. Senate 2026 (D Primary)", year: 2026 },
  { id: "e2",  endorser: "Texas AFT",                  endorserType: "Union",            candidate: "Jasmine Crockett", race: "U.S. Senate 2026 (D Primary)", year: 2026 },
  { id: "e3",  endorser: "SEIU Texas",                 endorserType: "Union",            candidate: "Jasmine Crockett", race: "U.S. Senate 2026 (D Primary)", year: 2026 },
  { id: "e4",  endorser: "Houston Chronicle",          endorserType: "Newspaper",        candidate: "Jasmine Crockett", race: "U.S. Senate 2026 (D Primary)", year: 2026 },
  { id: "e5",  endorser: "Sylvia Garcia",              endorserType: "Elected Official", candidate: "Jasmine Crockett", race: "U.S. Senate 2026 (D Primary)", year: 2026 },
  { id: "e6",  endorser: "Al Green",                   endorserType: "Elected Official", candidate: "Jasmine Crockett", race: "U.S. Senate 2026 (D Primary)", year: 2026 },
  { id: "e7",  endorser: "Sheila Jackson Lee Estate",  endorserType: "Elected Official", candidate: "Jasmine Crockett", race: "U.S. Senate 2026 (D Primary)", year: 2026, notes: "Family endorsement" },
  { id: "e9",  endorser: "Harris County Democrats",    endorserType: "Party Org",        candidate: "Jasmine Crockett", race: "U.S. Senate 2026 (D Primary)", year: 2026 },
  { id: "e31", endorser: "Texas Democratic Party",     endorserType: "Party Org",        candidate: "Jasmine Crockett", race: "U.S. Senate 2026 (D Primary)", year: 2026 },
  { id: "e32", endorser: "Texas NAACP",                endorserType: "Civic Org",        candidate: "Jasmine Crockett", race: "U.S. Senate 2026 (D Primary)", year: 2026 },
  { id: "e33", endorser: "Planned Parenthood Action",  endorserType: "Civic Org",        candidate: "Jasmine Crockett", race: "U.S. Senate 2026 (D Primary)", year: 2026 },
  { id: "e34", endorser: "CWA Texas",                  endorserType: "Union",            candidate: "Jasmine Crockett", race: "U.S. Senate 2026 (D Primary)", year: 2026, notes: "Communications Workers of America" },
  { id: "e35", endorser: "Lizzie Fletcher",            endorserType: "Elected Official", candidate: "Jasmine Crockett", race: "U.S. Senate 2026 (D Primary)", year: 2026 },
  { id: "e36", endorser: "Donald Trump",               endorserType: "Elected Official", candidate: "Ken Paxton",       race: "U.S. Senate 2026", year: 2026, notes: "Trump backed Paxton over Cornyn" },
  { id: "e37", endorser: "Texas Republican Party",     endorserType: "Party Org",        candidate: "Ken Paxton",       race: "U.S. Senate 2026", year: 2026 },
  { id: "e38", endorser: "NRA Political Victory Fund", endorserType: "Civic Org",        candidate: "Ken Paxton",       race: "U.S. Senate 2026", year: 2026 },
  { id: "e39", endorser: "Club for Growth",            endorserType: "Civic Org",        candidate: "Ken Paxton",       race: "U.S. Senate 2026", year: 2026 },
  { id: "e40", endorser: "Texas Republican Party",     endorserType: "Party Org",        candidate: "Orlando Sanchez",  race: "Harris County Judge 2026", year: 2026, notes: "Won May 2026 GOP runoff 85,304–49,367" },
  { id: "e41", endorser: "Harris County Republicans",  endorserType: "Party Org",        candidate: "Orlando Sanchez",  race: "Harris County Judge 2026", year: 2026 },
  { id: "e42", endorser: "AFL-CIO Texas",              endorserType: "Union",            candidate: "Letitia Plummer",  race: "Harris County Judge 2026", year: 2026 },
  { id: "e43", endorser: "Texas AFT",                  endorserType: "Union",            candidate: "Letitia Plummer",  race: "Harris County Judge 2026", year: 2026 },
  { id: "e44", endorser: "SEIU Texas",                 endorserType: "Union",            candidate: "Letitia Plummer",  race: "Harris County Judge 2026", year: 2026 },
  { id: "e45", endorser: "Emily's List",               endorserType: "Civic Org",        candidate: "Letitia Plummer",  race: "Harris County Judge 2026", year: 2026 },
  { id: "e46", endorser: "Harris County Democrats",    endorserType: "Party Org",        candidate: "Letitia Plummer",  race: "Harris County Judge 2026", year: 2026 },
  { id: "e48", endorser: "Houston Chronicle",          endorserType: "Newspaper",        candidate: "Letitia Plummer",  race: "Harris County Judge 2026", year: 2026 },
  { id: "e49", endorser: "Planned Parenthood Action",  endorserType: "Civic Org",        candidate: "Letitia Plummer",  race: "Harris County Judge 2026", year: 2026 },
  { id: "e50", endorser: "Sylvia Garcia",              endorserType: "Elected Official", candidate: "Letitia Plummer",  race: "Harris County Judge 2026", year: 2026 },
  { id: "e51", endorser: "Lizzie Fletcher",            endorserType: "Elected Official", candidate: "Letitia Plummer",  race: "Harris County Judge 2026", year: 2026 },
  { id: "e10", endorser: "Houston Chronicle",          endorserType: "Newspaper",        candidate: "Lina Hidalgo",     race: "Harris County Judge 2024", year: 2024 },
  { id: "e11", endorser: "AFL-CIO Texas",              endorserType: "Union",            candidate: "Lina Hidalgo",     race: "Harris County Judge 2024", year: 2024 },
  { id: "e12", endorser: "Texas AFT",                  endorserType: "Union",            candidate: "Lina Hidalgo",     race: "Harris County Judge 2024", year: 2024 },
  { id: "e13", endorser: "Emily's List",               endorserType: "Civic Org",        candidate: "Lina Hidalgo",     race: "Harris County Judge 2024", year: 2024 },
  { id: "e14", endorser: "Sylvia Garcia",              endorserType: "Elected Official", candidate: "Lina Hidalgo",     race: "Harris County Judge 2024", year: 2024 },
  { id: "e17", endorser: "AFL-CIO Texas",              endorserType: "Union",            candidate: "Adrian Garcia",    race: "County Commissioner Pct 2 2024", year: 2024 },
  { id: "e18", endorser: "Houston Chronicle",          endorserType: "Newspaper",        candidate: "Adrian Garcia",    race: "County Commissioner Pct 2 2024", year: 2024 },
  { id: "e19", endorser: "Sylvia Garcia",              endorserType: "Elected Official", candidate: "Adrian Garcia",    race: "County Commissioner Pct 2 2024", year: 2024 },
  { id: "e20", endorser: "Harris County Democrats",    endorserType: "Party Org",        candidate: "Adrian Garcia",    race: "County Commissioner Pct 2 2024", year: 2024 },
  { id: "e21", endorser: "AFL-CIO Texas",              endorserType: "Union",            candidate: "Amanda Edwards",   race: "TX-18 2024", year: 2024 },
  { id: "e22", endorser: "Houston Chronicle",          endorserType: "Newspaper",        candidate: "Amanda Edwards",   race: "TX-18 2024", year: 2024 },
  { id: "e23", endorser: "Emily's List",               endorserType: "Civic Org",        candidate: "Amanda Edwards",   race: "TX-18 2024", year: 2024 },
];

const TYPE_COLOR: Record<EndorserType, { bg: string; text: string }> = {
  "Union":            { bg: "#fef3c7", text: "#92400e" },
  "Elected Official": { bg: "#dbeafe", text: "#1d4ed8" },
  "Party Org":        { bg: "#f3e8ff", text: "#6d28d9" },
  "Civic Org":        { bg: "#d1fae5", text: "#065f46" },
  "Newspaper":        { bg: "#fce7f3", text: "#9d174d" },
  "Business Org":     { bg: "#f1f5f9", text: "#475569" },
};

/* ─── Consultant types & data ─────────────────────────────────────────────── */
type ConsultantRole = "Campaign Manager" | "General Consultant" | "Media / Ads" | "Polling" | "Fundraising" | "Field / Organizing" | "Opposition Research" | "Digital";
interface Relationship { id: string; consultant: string; firm?: string; role: ConsultantRole; client: string; race: string; year: number; party: "D" | "R" | "Both"; }

const RELATIONSHIPS: Relationship[] = [
  { id: "c1",  consultant: "Mustafa Tameez",            firm: "Outreach Strategists",       role: "General Consultant", client: "Lina Hidalgo",     race: "Harris County Judge 2022", year: 2022, party: "D" },
  { id: "c2",  consultant: "Mustafa Tameez",            firm: "Outreach Strategists",       role: "General Consultant", client: "Lina Hidalgo",     race: "Harris County Judge 2024", year: 2024, party: "D" },
  { id: "c3",  consultant: "Mustafa Tameez",            firm: "Outreach Strategists",       role: "General Consultant", client: "Adrian Garcia",    race: "County Commissioner Pct 2", year: 2024, party: "D" },
  { id: "c4",  consultant: "Mustafa Tameez",            firm: "Outreach Strategists",       role: "General Consultant", client: "Jasmine Crockett", race: "U.S. Senate 2026", year: 2026, party: "D" },
  { id: "c31", consultant: "Mustafa Tameez",            firm: "Outreach Strategists",       role: "General Consultant", client: "Letitia Plummer",  race: "Harris County Judge 2026", year: 2026, party: "D" },
  { id: "c5",  consultant: "Lavastida & Co",            firm: "Lavastida & Co",             role: "Media / Ads",        client: "Lina Hidalgo",     race: "Harris County Judge 2024", year: 2024, party: "D" },
  { id: "c6",  consultant: "Lavastida & Co",            firm: "Lavastida & Co",             role: "Media / Ads",        client: "Adrian Garcia",    race: "County Commissioner Pct 2", year: 2024, party: "D" },
  { id: "c32", consultant: "Lavastida & Co",            firm: "Lavastida & Co",             role: "Media / Ads",        client: "Letitia Plummer",  race: "Harris County Judge 2026", year: 2026, party: "D" },
  { id: "c7",  consultant: "Garin Hart Yang",           firm: "Garin Hart Yang",            role: "Polling",            client: "Lina Hidalgo",     race: "Harris County Judge 2022", year: 2022, party: "D" },
  { id: "c8",  consultant: "Garin Hart Yang",           firm: "Garin Hart Yang",            role: "Polling",            client: "Jasmine Crockett", race: "U.S. Senate 2026", year: 2026, party: "D" },
  { id: "c9",  consultant: "EMILY's List",              firm: "EMILY's List",               role: "Fundraising",        client: "Lina Hidalgo",     race: "Harris County Judge 2024", year: 2024, party: "D" },
  { id: "c10", consultant: "EMILY's List",              firm: "EMILY's List",               role: "Fundraising",        client: "Amanda Edwards",   race: "TX-18 2024", year: 2024, party: "D" },
  { id: "c34", consultant: "EMILY's List",              firm: "EMILY's List",               role: "Fundraising",        client: "Letitia Plummer",  race: "Harris County Judge 2026", year: 2026, party: "D" },
  { id: "c11", consultant: "Trilogy Interactive",       firm: "Trilogy Interactive",        role: "Digital",            client: "Lina Hidalgo",     race: "Harris County Judge 2024", year: 2024, party: "D" },
  { id: "c12", consultant: "Trilogy Interactive",       firm: "Trilogy Interactive",        role: "Digital",            client: "Jasmine Crockett", race: "U.S. Senate 2026", year: 2026, party: "D" },
  { id: "c23", consultant: "SKDK",                     firm: "SKDK",                       role: "General Consultant", client: "Jasmine Crockett", race: "U.S. Senate 2026", year: 2026, party: "D" },
  { id: "c24", consultant: "Bully Pulpit Interactive",  firm: "Bully Pulpit Interactive",   role: "Digital",            client: "Jasmine Crockett", race: "U.S. Senate 2026", year: 2026, party: "D" },
  { id: "c25", consultant: "Anzalone Research",         firm: "Anzalone Research",          role: "Polling",            client: "Jasmine Crockett", race: "U.S. Senate 2026", year: 2026, party: "D" },
  { id: "c26", consultant: "JS2 Media",                 firm: "JS2 Media",                  role: "Media / Ads",        client: "Jasmine Crockett", race: "U.S. Senate 2026", year: 2026, party: "D" },
  { id: "c15", consultant: "ALG Research",              firm: "ALG Research",               role: "Polling",            client: "Lina Hidalgo",     race: "Harris County Judge 2024", year: 2024, party: "D" },
  { id: "c33", consultant: "ALG Research",              firm: "ALG Research",               role: "Polling",            client: "Letitia Plummer",  race: "Harris County Judge 2026", year: 2026, party: "D" },
  { id: "c16", consultant: "Axiom Strategies",          firm: "Axiom Strategies",           role: "General Consultant", client: "Dan Crenshaw",     race: "TX-2 2024", year: 2024, party: "R" },
  { id: "c17", consultant: "Axiom Strategies",          firm: "Axiom Strategies",           role: "General Consultant", client: "Wesley Hunt",      race: "TX-38 2024", year: 2024, party: "R" },
  { id: "c27", consultant: "Axiom Strategies",          firm: "Axiom Strategies",           role: "General Consultant", client: "Ken Paxton",       race: "U.S. Senate 2026", year: 2026, party: "R" },
  { id: "c35", consultant: "Axiom Strategies",          firm: "Axiom Strategies",           role: "General Consultant", client: "Orlando Sanchez",  race: "Harris County Judge 2026", year: 2026, party: "R" },
  { id: "c19", consultant: "Mentzer Media",             firm: "Mentzer Media",              role: "Media / Ads",        client: "Dan Crenshaw",     race: "TX-2 2024", year: 2024, party: "R" },
  { id: "c20", consultant: "Mentzer Media",             firm: "Mentzer Media",              role: "Media / Ads",        client: "Wesley Hunt",      race: "TX-38 2024", year: 2024, party: "R" },
  { id: "c36", consultant: "Mentzer Media",             firm: "Mentzer Media",              role: "Media / Ads",        client: "Orlando Sanchez",  race: "Harris County Judge 2026", year: 2026, party: "R" },
  { id: "c28", consultant: "Jamestown Associates",      firm: "Jamestown Associates",       role: "Media / Ads",        client: "Ken Paxton",       race: "U.S. Senate 2026", year: 2026, party: "R" },
  { id: "c29", consultant: "WPA Intelligence",          firm: "WPA Intelligence",           role: "Polling",            client: "Ken Paxton",       race: "U.S. Senate 2026", year: 2026, party: "R" },
  { id: "c21", consultant: "Harris Media",              firm: "Harris Media",               role: "Digital",            client: "Dan Crenshaw",     race: "TX-2 2024", year: 2024, party: "R" },
  { id: "c30", consultant: "Harris Media",              firm: "Harris Media",               role: "Digital",            client: "Ken Paxton",       race: "U.S. Senate 2026", year: 2026, party: "R" },
];

const ROLE_COLOR: Record<ConsultantRole, { bg: string; text: string }> = {
  "Campaign Manager":    { bg: "#dbeafe", text: "#1d4ed8" },
  "General Consultant":  { bg: "#ede9fe", text: "#6d28d9" },
  "Media / Ads":         { bg: "#fce7f3", text: "#9d174d" },
  "Polling":             { bg: "#fef3c7", text: "#92400e" },
  "Fundraising":         { bg: "#d1fae5", text: "#065f46" },
  "Field / Organizing":  { bg: "#cffafe", text: "#0e7490" },
  "Opposition Research": { bg: "#fee2e2", text: "#991b1b" },
  "Digital":             { bg: "#f0fdf4", text: "#166534" },
};

/* ─── Donor network ───────────────────────────────────────────────────────── */
interface DonorEntry { donor: string; totalM: number; topRecipients: string[]; type: string; }
const DONORS: DonorEntry[] = [
  { donor: "Texas Trial Lawyers Assoc", totalM: 4.2, topRecipients: ["Lina Hidalgo", "Jasmine Crockett", "Letitia Plummer"], type: "Legal" },
  { donor: "AFL-CIO Political Action", totalM: 3.8, topRecipients: ["Jasmine Crockett", "Letitia Plummer", "Adrian Garcia"],  type: "Union PAC" },
  { donor: "Texas Medical Assoc PAC",  totalM: 3.1, topRecipients: ["Dan Crenshaw", "Troy Nehls", "Joan Huffman"],           type: "Healthcare" },
  { donor: "Houston Energy PAC",        totalM: 2.9, topRecipients: ["Dan Crenshaw", "Wesley Hunt", "Morgan Luttrell"],      type: "Energy" },
  { donor: "Emily's List",              totalM: 2.7, topRecipients: ["Lina Hidalgo", "Amanda Edwards", "Letitia Plummer"],   type: "Women's PAC" },
  { donor: "Club for Growth PAC",       totalM: 2.4, topRecipients: ["Ken Paxton", "Dan Crenshaw"],                          type: "Conservative PAC" },
  { donor: "Texas AFT",                 totalM: 2.1, topRecipients: ["Jasmine Crockett", "Letitia Plummer", "Carol Alvarado"], type: "Education" },
  { donor: "NRA Political Victory Fund",totalM: 1.9, topRecipients: ["Ken Paxton", "Troy Nehls", "Brian Babin"],             type: "Gun Rights" },
  { donor: "SEIU Texas",                totalM: 1.7, topRecipients: ["Jasmine Crockett", "Letitia Plummer"],                 type: "Union" },
  { donor: "CenterPoint Energy PAC",    totalM: 1.5, topRecipients: ["Dan Crenshaw", "Morgan Luttrell", "Joan Huffman"],     type: "Utilities" },
];

type NetworkTab = "endorsements" | "consultants" | "donors";

/* ─── Inner page ──────────────────────────────────────────────────────────── */
function TheNetworkInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initTab = (searchParams.get("tab") as NetworkTab) ?? "endorsements";
  const [tab, setTab] = useState<NetworkTab>(initTab);

  // Endorsement filters
  const [eYear, setEYear]       = useState<number | "all">("all");
  const [eType, setEType]       = useState<EndorserType | "all">("all");
  const [eRace, setERace]       = useState<string>("all");
  const [eCandidate, setECand]  = useState<string>("all");

  // Consultant filters
  const [cYear, setCYear]       = useState<number | "all">("all");
  const [cParty, setCParty]     = useState<"D" | "R" | "all">("all");
  const [cConsultant, setCCons] = useState<string>("all");

  function switchTab(t: NetworkTab) {
    setTab(t);
    router.replace(`/tools/the-network?tab=${t}`, { scroll: false });
  }

  const eYears    = ["all", ...Array.from(new Set(ENDORSEMENTS.map(e => e.year))).sort((a,b)=>b-a).map(String)];
  const eTypes    = ["all", ...Array.from(new Set(ENDORSEMENTS.map(e => e.endorserType)))];
  const eRaces    = ["all", ...Array.from(new Set(ENDORSEMENTS.map(e => e.race))).sort()];
  const eCands    = ["all", ...Array.from(new Set(ENDORSEMENTS.map(e => e.candidate))).sort()];
  const cYears    = ["all", ...Array.from(new Set(RELATIONSHIPS.map(r => r.year))).sort((a,b)=>b-a).map(String)];
  const cConsList = ["all", ...Array.from(new Set(RELATIONSHIPS.map(r => r.consultant))).sort()];

  const filteredEndorsements = useMemo(() =>
    ENDORSEMENTS.filter(e =>
      (eYear === "all" || e.year === Number(eYear)) &&
      (eType === "all" || e.endorserType === eType) &&
      (eRace === "all" || e.race === eRace) &&
      (eCandidate === "all" || e.candidate === eCandidate)
    ), [eYear, eType, eRace, eCandidate]);

  const filteredRelationships = useMemo(() =>
    RELATIONSHIPS.filter(r =>
      (cYear === "all" || r.year === Number(cYear)) &&
      (cParty === "all" || r.party === cParty) &&
      (cConsultant === "all" || r.consultant === cConsultant)
    ), [cYear, cParty, cConsultant]);

  // Group endorsements by candidate
  const byCandidate = useMemo(() => {
    const grouped: Record<string, Endorsement[]> = {};
    filteredEndorsements.forEach(e => {
      (grouped[e.candidate] ??= []).push(e);
    });
    return Object.entries(grouped).sort((a, b) => b[1].length - a[1].length);
  }, [filteredEndorsements]);

  // Group consultant relationships by consultant
  const byConsultant = useMemo(() => {
    const grouped: Record<string, Relationship[]> = {};
    filteredRelationships.forEach(r => {
      (grouped[r.consultant] ??= []).push(r);
    });
    return Object.entries(grouped).sort((a, b) => b[1].length - a[1].length);
  }, [filteredRelationships]);

  const PILL = "px-3 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer select-none";

  return (
    <div style={{ background: "var(--background)", minHeight: "100vh" }}>
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(135deg,#1a3a5c 0%,#7c3aed 100%)", minHeight: 200 }}>
        <div className="relative max-w-5xl mx-auto px-5 pt-10 pb-6">
          <Link href="/" className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3 block" style={{ color: "rgba(255,255,255,0.45)" }}>← Harris County Project</Link>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-1" style={{ fontFamily: "var(--font-playfair), serif" }}>The Network</h1>
          <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,0.55)" }}>Who endorses whom, who runs whom, and who funds whom in Harris County politics.</p>
          <div className="flex gap-1">
            {(["endorsements", "consultants", "donors"] as NetworkTab[]).map(t => (
              <button key={t} onClick={() => switchTab(t)}
                className="px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] rounded-full transition-all cursor-pointer capitalize"
                style={tab === t
                  ? { background: "rgba(255,255,255,0.2)", color: "#fff", backdropFilter: "blur(8px)" }
                  : { color: "rgba(255,255,255,0.5)" }}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-5 py-8">

        {/* ── Endorsements ── */}
        {tab === "endorsements" && (
          <div>
            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-6">
              <select className={PILL} style={{ background: "#fff", color: "#374151", borderColor: "#e5e7eb" }}
                value={String(eYear)} onChange={e => setEYear(e.target.value === "all" ? "all" : Number(e.target.value))}>
                {eYears.map(y => <option key={y} value={y}>{y === "all" ? "All years" : y}</option>)}
              </select>
              <select className={PILL} style={{ background: "#fff", color: "#374151", borderColor: "#e5e7eb" }}
                value={eCandidate} onChange={e => setECand(e.target.value)}>
                {eCands.map(c => <option key={c} value={c}>{c === "all" ? "All candidates" : c}</option>)}
              </select>
              <select className={PILL} style={{ background: "#fff", color: "#374151", borderColor: "#e5e7eb" }}
                value={eType} onChange={e => setEType(e.target.value as EndorserType | "all")}>
                {eTypes.map(t => <option key={t} value={t}>{t === "all" ? "All endorser types" : t}</option>)}
              </select>
              <select className={PILL} style={{ background: "#fff", color: "#374151", borderColor: "#e5e7eb" }}
                value={eRace} onChange={e => setERace(e.target.value)}>
                {eRaces.map(r => <option key={r} value={r}>{r === "all" ? "All races" : r}</option>)}
              </select>
              <span className="px-3 py-1 text-[11px] font-bold" style={{ color: "#9ca3af" }}>
                {filteredEndorsements.length} endorsement{filteredEndorsements.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* By candidate */}
            <div className="space-y-6">
              {byCandidate.map(([candidate, endorsements]) => (
                <div key={candidate} className="rounded-2xl bg-white ring-1 ring-black/7 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg leading-tight" style={{ fontFamily: "var(--font-playfair), serif", color: "#1a3a5c" }}>{candidate}</h3>
                      <p className="text-[11px] mt-0.5" style={{ color: "#6b7280" }}>{endorsements[0].race}</p>
                    </div>
                    <span className="text-2xl font-black" style={{ color: "#1a3a5c", fontFamily: "var(--font-playfair), serif" }}>{endorsements.length}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {endorsements.map(e => {
                      const tc = TYPE_COLOR[e.endorserType];
                      return (
                        <div key={e.id} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold" style={{ background: tc.bg, color: tc.text }}>
                          <span>{e.endorser}</span>
                          {e.notes && <span className="opacity-60 text-[9px] font-normal">({e.notes})</span>}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {Array.from(new Set(endorsements.map(e => e.endorserType))).map(type => {
                      const cnt = endorsements.filter(e => e.endorserType === type).length;
                      const tc = TYPE_COLOR[type];
                      return (
                        <span key={type} className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: tc.bg, color: tc.text }}>
                          {cnt} {type}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
              {byCandidate.length === 0 && (
                <div className="text-center py-16" style={{ color: "#9ca3af" }}>No endorsements match these filters.</div>
              )}
            </div>
          </div>
        )}

        {/* ── Consultants ── */}
        {tab === "consultants" && (
          <div>
            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-6">
              <select className={PILL} style={{ background: "#fff", color: "#374151", borderColor: "#e5e7eb" }}
                value={String(cYear)} onChange={e => setCYear(e.target.value === "all" ? "all" : Number(e.target.value))}>
                {cYears.map(y => <option key={y} value={y}>{y === "all" ? "All years" : y}</option>)}
              </select>
              <select className={PILL} style={{ background: "#fff", color: "#374151", borderColor: "#e5e7eb" }}
                value={cConsultant} onChange={e => setCCons(e.target.value)}>
                {cConsList.map(c => <option key={c} value={c}>{c === "all" ? "All firms" : c}</option>)}
              </select>
              <div className="flex gap-1 bg-white rounded-full border border-[#e5e7eb] overflow-hidden">
                {(["all", "D", "R"] as const).map(p => (
                  <button key={p} onClick={() => setCParty(p)}
                    className={`px-3 py-1 text-[11px] font-bold cursor-pointer transition-colors ${cParty === p ? "bg-[#1a3a5c] text-white" : "text-[#374151]"}`}>
                    {p === "all" ? "Both" : p}
                  </button>
                ))}
              </div>
              <span className="px-3 py-1 text-[11px] font-bold" style={{ color: "#9ca3af" }}>
                {filteredRelationships.length} relationship{filteredRelationships.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* By consultant */}
            <div className="space-y-5">
              {byConsultant.map(([consultant, rels]) => {
                const firmName = rels[0].firm ?? consultant;
                const parties = Array.from(new Set(rels.map(r => r.party)));
                return (
                  <div key={consultant} className="rounded-2xl bg-white ring-1 ring-black/7 p-5">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div>
                        <h3 className="font-bold text-base leading-tight" style={{ fontFamily: "var(--font-playfair), serif", color: "#1a3a5c" }}>{firmName}</h3>
                        {firmName !== consultant && <p className="text-[11px]" style={{ color: "#6b7280" }}>{consultant}</p>}
                        <div className="flex gap-1 mt-1">
                          {parties.map(p => (
                            <span key={p} className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${p === "D" ? "bg-blue-100 text-blue-700" : p === "R" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                      <span className="text-2xl font-black flex-shrink-0" style={{ color: "#1a3a5c", fontFamily: "var(--font-playfair), serif" }}>{rels.length}</span>
                    </div>
                    <div className="space-y-2">
                      {rels.map(r => {
                        const rc = ROLE_COLOR[r.role];
                        return (
                          <div key={r.id} className="flex items-center gap-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 w-28 text-center" style={{ background: rc.bg, color: rc.text }}>{r.role}</span>
                            <span className="text-[11px] font-semibold" style={{ color: "#1a3a5c" }}>{r.client}</span>
                            <span className="text-[10px]" style={{ color: "#9ca3af" }}>· {r.race.replace("U.S. Senate 2026 (D Primary)", "Senate '26 D") .replace("Harris County Judge ", "HC Judge ").replace("County Commissioner Pct 2", "CC Pct 2")}</span>
                            <span className="text-[9px] font-bold ml-auto flex-shrink-0" style={{ color: "#9ca3af" }}>{r.year}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {byConsultant.length === 0 && (
                <div className="text-center py-16" style={{ color: "#9ca3af" }}>No consultant relationships match these filters.</div>
              )}
            </div>
          </div>
        )}

        {/* ── Donors ── */}
        {tab === "donors" && (
          <div>
            <p className="text-sm mb-6 leading-relaxed" style={{ color: "#6b7280" }}>
              Major PAC and organizational donors to Harris County-area candidates. Sourced from TEC filings and FEC records.
              <Link href="/tools/where-is-the-dough" className="ml-2 font-bold hover:underline" style={{ color: "#1a3a5c" }}>See individual candidate finance →</Link>
            </p>
            <div className="space-y-4">
              {DONORS.map((d, i) => (
                <div key={d.donor} className="rounded-2xl bg-white ring-1 ring-black/7 p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black w-6 flex-shrink-0" style={{ color: "#9ca3af" }}>#{i + 1}</span>
                      <div>
                        <h3 className="font-bold text-base" style={{ fontFamily: "var(--font-playfair), serif", color: "#1a3a5c" }}>{d.donor}</h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#f3f4f6", color: "#6b7280" }}>{d.type}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xl font-black" style={{ color: "#1a3a5c", fontFamily: "var(--font-playfair), serif" }}>${d.totalM.toFixed(1)}M</p>
                      <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "#9ca3af" }}>Total contributions</p>
                    </div>
                  </div>
                  <div className="h-1 rounded-full mb-3" style={{ background: `linear-gradient(90deg, #1a3a5c ${Math.min(100, (d.totalM / DONORS[0].totalM) * 100).toFixed(0)}%, #e5e7eb 0%)` }} />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] mb-1.5" style={{ color: "#9ca3af" }}>Top recipients</p>
                    <div className="flex flex-wrap gap-1.5">
                      {d.topRecipients.map(r => (
                        <Link key={r} href={`/tools/where-is-the-dough?q=${encodeURIComponent(r)}`}
                          className="text-[11px] font-semibold px-2.5 py-1 rounded-full hover:shadow-sm transition-all"
                          style={{ background: "#ede9fe", color: "#6d28d9" }}>
                          {r}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[11px] mt-6 text-center" style={{ color: "#9ca3af" }}>
              Sources: Texas Ethics Commission filings, FEC reports. Totals approximate. Cycle coverage varies by office.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TheNetworkPage() {
  return (
    <Suspense>
      <TheNetworkInner />
    </Suspense>
  );
}
