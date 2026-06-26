"use client";
import { useState } from "react";
import Link from "next/link";
import ShareButton from "@/components/ShareButton";
import { ALL_CONTACTS, type OfficialContact } from "@/lib/officials-contact";

// ── Routing model ───────────────────────────────────────────────────────────────
// A "route" is one concrete answer: who to call for a problem in a given place.

// A responder is one explicit entry under "who answers for it" — used when the right
// set isn't a clean jurisdiction+role filter (e.g. public safety spans city + county).
type Responder =
  | { match: string }                                                              // singleton contact, matched by office text
  | { find: string }                                                               // "find yours by address" CTA
  | { manual: { name: string; office: string; phone?: string; website?: string } }; // non-elected office (e.g. police chief)

type Route = {
  agency: string;                                   // who actually handles it
  detail: string;                                   // one plain-language line
  hotline?: { label: string; phone: string };       // the number to call, if there is one
  jurisdictions: OfficialContact["jurisdiction"][];  // whose elected officials to surface
  roles: OfficialContact["roleCategory"][];
  findLabel?: string;                                // CTA when the official depends on your address
  responders?: Responder[];                          // explicit override of the generic filter
};

// Public-safety chain, shown for crime regardless of city/county: the mayor and your
// council member, the police chief, the sheriff, and your constable.
const CRIME_RESPONDERS: Responder[] = [
  { match: "Mayor" },
  { find: "your city council member" },
  { manual: { name: "Houston Police Department", office: "Office of the Chief · non-emergency", phone: "713-884-3131", website: "https://www.houstontx.gov/police/" } },
  { match: "Harris County Sheriff" },
  { find: "your constable precinct" },
];

type Issue = {
  id: string;
  label: string;
  icon: string;
  locationDependent: boolean;   // does the answer change between city and unincorporated county?
  city?: Route;
  county?: Route;
  any?: Route;                  // used when location doesn't change the answer
};

const ISSUES: Issue[] = [
  {
    id: "pothole",
    label: "Pothole or road damage",
    icon: "🛣️",
    locationDependent: true,
    city: {
      agency: "Houston Public Works",
      detail: "Report potholes and street damage on roads inside the city.",
      hotline: { label: "Houston 311", phone: "311" },
      jurisdictions: ["city"], roles: ["legislative"], findLabel: "your city council member",
    },
    county: {
      agency: "Your Harris County Commissioner",
      detail: "Commissioners maintain roads in unincorporated areas — each precinct runs its own road crews.",
      jurisdictions: ["county"], roles: ["legislative"], findLabel: "your county commissioner",
    },
  },
  {
    id: "flooding",
    label: "Flooding or drainage",
    icon: "🌊",
    locationDependent: true,
    city: {
      agency: "Houston Public Works — Drainage",
      detail: "Street flooding and clogged storm drains inside the city.",
      hotline: { label: "Houston 311", phone: "311" },
      jurisdictions: ["city"], roles: ["legislative"], findLabel: "your city council member",
    },
    county: {
      agency: "Harris County Flood Control District",
      detail: "Bayous, channels, and regional drainage across the county.",
      hotline: { label: "HCFCD", phone: "713-684-4000" },
      jurisdictions: ["county"], roles: ["legislative"], findLabel: "your county commissioner",
    },
  },
  {
    id: "crime",
    label: "Crime or public safety",
    icon: "🚨",
    locationDependent: true,
    city: {
      agency: "Houston Police Department",
      detail: "Non-emergency reports inside Houston. Always call 911 for an emergency in progress.",
      hotline: { label: "HPD non-emergency", phone: "713-884-3131" },
      jurisdictions: ["city"], roles: ["executive", "legislative"],
      responders: CRIME_RESPONDERS,
    },
    county: {
      agency: "Harris County Sheriff's Office",
      detail: "Law enforcement in unincorporated Harris County. Always call 911 for an emergency in progress.",
      hotline: { label: "Sheriff non-emergency", phone: "713-221-6000" },
      jurisdictions: ["county"], roles: ["law-enforcement"],
      responders: CRIME_RESPONDERS,
    },
  },
  {
    id: "trash",
    label: "Trash or bulk pickup",
    icon: "🗑️",
    locationDependent: false,
    any: {
      agency: "Houston Solid Waste Management",
      detail: "Garbage, recycling, and heavy/bulk pickup inside city limits.",
      hotline: { label: "Houston 311", phone: "311" },
      jurisdictions: ["city"], roles: ["executive", "legislative"], findLabel: "your city council member",
    },
  },
  {
    id: "schools",
    label: "Public schools",
    icon: "🏫",
    locationDependent: false,
    any: {
      agency: "Your local ISD school board",
      detail: "School boards set curriculum, facilities, and budgets. Trustees answer to the families in their district.",
      jurisdictions: ["school"], roles: ["school-board"], findLabel: "your school board trustee",
    },
  },
  {
    id: "property-taxes",
    label: "Property taxes or appraisal",
    icon: "🏠",
    locationDependent: false,
    any: {
      agency: "Harris Central Appraisal District (HCAD)",
      detail: "HCAD sets your appraised value — protest it here. Your county commissioners set the tax rate.",
      hotline: { label: "HCAD", phone: "713-957-7800" },
      jurisdictions: ["county"], roles: ["legislative"], findLabel: "your county commissioner",
    },
  },
  {
    id: "voting",
    label: "Voting or elections",
    icon: "🗳️",
    locationDependent: false,
    any: {
      agency: "Harris County Clerk — Elections",
      detail: "Voter registration, polling places, mail ballots, and official results.",
      hotline: { label: "Harris County Clerk", phone: "713-274-8683" },
      jurisdictions: ["county"], roles: ["clerk"],
    },
  },
  {
    id: "state-policy",
    label: "State law or policy",
    icon: "🏛️",
    locationDependent: false,
    any: {
      agency: "Your Texas Legislature delegation",
      detail: "Your state representative and state senator carry your issue to Austin.",
      jurisdictions: ["state"], roles: ["legislative"], findLabel: "your state rep & senator",
    },
  },
  {
    id: "county-services",
    label: "County government",
    icon: "🏢",
    locationDependent: false,
    any: {
      agency: "Harris County Commissioners Court",
      detail: "The County Judge and four commissioners set the county budget, services, and policy.",
      jurisdictions: ["county"], roles: ["legislative", "executive"], findLabel: "your county commissioner",
    },
  },
  {
    id: "city-policy",
    label: "City of Houston policy",
    icon: "🌆",
    locationDependent: false,
    any: {
      agency: "Houston City Hall",
      detail: "The Mayor and your district + at-large council members set ordinances and the city budget.",
      jurisdictions: ["city"], roles: ["legislative", "executive"], findLabel: "your city council member",
    },
  },
];

type Where = "city" | "county" | "both";

function routesFor(issue: Issue, where: Where): { place: string | null; route: Route }[] {
  if (!issue.locationDependent && issue.any) return [{ place: null, route: issue.any }];
  if (where === "city" && issue.city) return [{ place: "Inside Houston city limits", route: issue.city }];
  if (where === "county" && issue.county) return [{ place: "Unincorporated Harris County", route: issue.county }];
  // "both" / not sure — show each side
  const out: { place: string | null; route: Route }[] = [];
  if (issue.city) out.push({ place: "Inside Houston city limits", route: issue.city });
  if (issue.county) out.push({ place: "Unincorporated Harris County", route: issue.county });
  return out;
}

// Split matched officials into countywide/citywide singletons vs. address-specific seats.
function officialsForRoute(route: Route) {
  const matched = ALL_CONTACTS.filter(
    (c) => route.jurisdictions.includes(c.jurisdiction) && route.roles.includes(c.roleCategory)
  );
  const isSingleton = (c: OfficialContact) =>
    !c.district || c.district === "citywide" || c.district === "countywide";
  return {
    singletons: matched.filter(isSingleton).slice(0, 3),
    hasDistrictSeats: matched.some((c) => !isSingleton(c)),
  };
}

type ResolvedResponder =
  | { type: "contact"; c: OfficialContact }
  | { type: "manual"; m: { name: string; office: string; phone?: string; website?: string } }
  | { type: "find"; label: string };

function resolveResponders(responders: Responder[]): ResolvedResponder[] {
  return responders.flatMap((r): ResolvedResponder[] => {
    if ("find" in r) return [{ type: "find", label: r.find }];
    if ("manual" in r) return [{ type: "manual", m: r.manual }];
    const c = ALL_CONTACTS.find((x) => x.office.toLowerCase().includes(r.match.toLowerCase()));
    return c ? [{ type: "contact", c }] : [];
  });
}

// ── Contact card ────────────────────────────────────────────────────────────────

function CallLink({ phone, children }: { phone: string; children: React.ReactNode }) {
  return (
    <a href={`tel:${phone.replace(/[^\d]/g, "")}`} className="flex items-center gap-1.5 font-semibold tnum hover:underline"
      style={{ color: "#2563a8" }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.21 2 2 0 012 .01h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z" />
      </svg>
      {children}
    </a>
  );
}

function ContactCard({ c }: { c: OfficialContact }) {
  const verified = c.lastVerified !== "pending-scrape" && c.lastVerified !== "";
  return (
    <div className="hcp-card p-4 flex flex-col gap-2">
      <div>
        <div className="font-bold text-sm" style={{ color: "#1a3a5c" }}>{c.name}</div>
        <div className="text-xs mt-0.5" style={{ color: "#6b7280" }}>
          {c.office}
          {c.district && c.district !== "citywide" && c.district !== "countywide" ? ` · ${c.district}` : ""}
        </div>
      </div>
      <div className="flex flex-col gap-1 text-xs">
        {c.phone && <CallLink phone={c.phone}>{c.phone}</CallLink>}
        {c.districtPhone && (
          <CallLink phone={c.districtPhone}>
            {c.districtPhone} <span style={{ color: "#9ca3af" }}>(district)</span>
          </CallLink>
        )}
        {c.email && (
          <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 truncate hover:underline" style={{ color: "#2563a8" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            {c.email}
          </a>
        )}
        {c.contactForm && (
          <a href={c.contactForm} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:underline" style={{ color: "#2563a8" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            Contact form
          </a>
        )}
        {c.website && !c.contactForm && (
          <a href={c.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:underline" style={{ color: "#2563a8" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
            </svg>
            Official website
          </a>
        )}
      </div>
      {!verified && (
        <div className="text-[10px] mt-0.5 px-1.5 py-0.5 rounded w-fit" style={{ background: "rgba(217,119,6,0.1)", color: "#b45309" }}>
          Pending verification
        </div>
      )}
    </div>
  );
}

// Non-elected office (e.g. the police chief) — same card shape, no verification badge.
function ManualCard({ m }: { m: { name: string; office: string; phone?: string; website?: string } }) {
  return (
    <div className="hcp-card p-4 flex flex-col gap-2">
      <div>
        <div className="font-bold text-sm" style={{ color: "#1a3a5c" }}>{m.name}</div>
        <div className="text-xs mt-0.5" style={{ color: "#6b7280" }}>{m.office}</div>
      </div>
      <div className="flex flex-col gap-1 text-xs">
        {m.phone && <CallLink phone={m.phone}>{m.phone}</CallLink>}
        {m.website && (
          <a href={m.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:underline" style={{ color: "#2563a8" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
            </svg>
            Official website
          </a>
        )}
      </div>
    </div>
  );
}

function FindCard({ label }: { label: string }) {
  return (
    <Link href="/my-officials"
      className="hcp-card card-lift p-4 flex flex-col justify-center items-start gap-1 group"
      style={{ background: "rgba(37,99,168,0.05)" }}>
      <span className="text-xs font-bold" style={{ color: "#1a3a5c" }}>Find {label} →</span>
      <span className="text-[11px]" style={{ color: "#6b7280" }}>
        This seat depends on your address — look it up by entering it.
      </span>
    </Link>
  );
}

// ── One concrete answer block ─────────────────────────────────────────────────────

function AnswerBlock({ place, route, issueIcon }: { place: string | null; route: Route; issueIcon: string }) {
  const { singletons, hasDistrictSeats } = officialsForRoute(route);
  const responders = route.responders ? resolveResponders(route.responders) : null;
  const showWho = responders ? responders.length > 0 : singletons.length > 0 || hasDistrictSeats;
  return (
    <div className="rounded-[1.35rem] bg-white/70 ring-1 ring-black/8 p-[5px]">
      <div className="rounded-[1.1rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] overflow-hidden">
        {/* Headline answer */}
        <div className="px-5 py-4" style={{ background: "linear-gradient(135deg,#1a3a5c,#0f2540)" }}>
          {place && (
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-1.5" style={{ color: "#7aaee8" }}>{place}</p>
          )}
          <div className="flex items-start gap-3">
            <span className="text-2xl leading-none mt-0.5" aria-hidden>{issueIcon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-lg leading-tight" style={{ fontFamily: "var(--font-playfair,serif)" }}>{route.agency}</p>
              <p className="text-white/55 text-xs mt-1 leading-relaxed">{route.detail}</p>
            </div>
          </div>
          {route.hotline && (
            <a href={`tel:${route.hotline.phone.replace(/[^\d]/g, "")}`}
              className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-full text-sm font-bold pressable"
              style={{ background: "#fbbf24", color: "#1a3a5c" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.21 2 2 0 012 .01h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z" />
              </svg>
              Call {route.hotline.label} · {route.hotline.phone}
            </a>
          )}
        </div>

        {/* Who to hold accountable */}
        {showWho && (
          <div className="px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-3" style={{ color: "#9ca3af" }}>
              Who answers for it
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {responders
                ? responders.map((r, i) =>
                    r.type === "contact" ? <ContactCard key={`c-${i}`} c={r.c} />
                    : r.type === "manual" ? <ManualCard key={`m-${i}`} m={r.m} />
                    : <FindCard key={`f-${i}`} label={r.label} />
                  )
                : (
                  <>
                    {singletons.map((c, i) => <ContactCard key={c.slug ?? `${c.name}-${i}`} c={c} />)}
                    {hasDistrictSeats && route.findLabel && <FindCard label={route.findLabel} />}
                  </>
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function WhoDoICallPage() {
  const [issue, setIssue] = useState<Issue | null>(null);
  const [where, setWhere] = useState<Where | null>(null);

  // Resolve: location-independent issues skip step 2 entirely.
  const needsWhere = !!issue?.locationDependent;
  const resolvedWhere: Where | null = !issue ? null : needsWhere ? where : "both";
  const answers = issue && resolvedWhere ? routesFor(issue, resolvedWhere) : [];

  function pickIssue(i: Issue) {
    setIssue(i.id === issue?.id ? null : i);
    setWhere(null);
  }
  function reset() { setIssue(null); setWhere(null); }

  return (
    <div style={{ background: "var(--background)", minHeight: "100vh", fontFamily: "var(--font-outfit,sans-serif)" }}>
      {/* Hero */}
      <section className="relative overflow-hidden topo-dark"
        style={{ background: "linear-gradient(135deg,#1a3a5c 0%,#0f2540 60%,#162e4a 100%)", paddingTop: "3.5rem", paddingBottom: "3rem" }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 70% 60% at 80% 40%,rgba(37,99,168,0.18) 0%,transparent 70%)" }} />
        <div className="relative max-w-3xl mx-auto px-5">
          <p className="text-sky-300 text-xs font-bold uppercase tracking-[0.22em] mb-3">Your Government · Take Action</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2" style={{ fontFamily: "var(--font-playfair,serif)" }}>
            Who Do I Call?
          </h1>
          <p className="text-white/55 text-sm max-w-lg mb-5">
            Two questions — what&rsquo;s wrong and where it is — and you&rsquo;ll have the right number to call and the official who answers for it.
          </p>
          <ShareButton
            toolName="Who Do I Call?"
            section="Government"
            description="Pick a problem and a location, get the right Harris County or Houston contact."
            summary="Who Do I Call? — pick your problem and location, get the right number to call in Harris County — via The Harris County Project"
          />
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-5 py-8">
        {/* Step 1 — the problem */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-bold text-white" style={{ background: "#1a3a5c" }}>1</span>
          <h2 className="text-sm font-bold uppercase tracking-[0.16em]" style={{ color: "#1a3a5c" }}>What&rsquo;s the problem?</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-8">
          {ISSUES.map((i) => {
            const active = issue?.id === i.id;
            return (
              <button key={i.id} onClick={() => pickIssue(i)}
                className="pressable text-left rounded-[1rem] p-3.5 transition-all duration-150 flex flex-col gap-1.5"
                style={{
                  background: active ? "#1a3a5c" : "var(--card)",
                  boxShadow: active ? "0 8px 22px rgba(26,58,92,0.22)" : "var(--ring-card), 0 2px 8px rgba(26,58,92,0.05)",
                  outline: active ? "none" : undefined,
                }}>
                <span className="text-xl leading-none" aria-hidden>{i.icon}</span>
                <span className="text-[13px] font-semibold leading-tight" style={{ color: active ? "#fff" : "#1a3a5c" }}>
                  {i.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Step 2 — where (only when it changes the answer) */}
        {issue && needsWhere && (
          <div className="mb-8 animate-in visible">
            <div className="flex items-baseline gap-2 mb-3">
              <span className="flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-bold text-white" style={{ background: "#1a3a5c" }}>2</span>
              <h2 className="text-sm font-bold uppercase tracking-[0.16em]" style={{ color: "#1a3a5c" }}>Where is it?</h2>
            </div>
            <div className="grid sm:grid-cols-3 gap-2.5">
              {([
                { key: "city" as Where, label: "Inside Houston", sub: "City of Houston limits" },
                { key: "county" as Where, label: "Unincorporated county", sub: "Outside any city" },
                { key: "both" as Where, label: "Not sure", sub: "Show both answers" },
              ]).map((opt) => {
                const active = where === opt.key;
                return (
                  <button key={opt.key} onClick={() => setWhere(opt.key)}
                    className="pressable text-left rounded-[1rem] px-4 py-3 transition-all duration-150"
                    style={{
                      background: active ? "#2563a8" : "var(--card)",
                      boxShadow: active ? "0 8px 22px rgba(37,99,168,0.25)" : "var(--ring-card), 0 2px 8px rgba(26,58,92,0.05)",
                    }}>
                    <div className="text-[13px] font-bold" style={{ color: active ? "#fff" : "#1a3a5c" }}>{opt.label}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: active ? "rgba(255,255,255,0.7)" : "#9ca3af" }}>{opt.sub}</div>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] mt-2.5" style={{ color: "#9ca3af" }}>
              Not sure which one you&rsquo;re in?{" "}
              <Link href="/my-officials" className="font-semibold hover:underline" style={{ color: "#2563a8" }}>Look it up by address →</Link>
            </p>
          </div>
        )}

        {/* The answer */}
        {answers.length > 0 && (
          <div className="space-y-4 animate-in visible">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "#9ca3af" }}>
                {answers.length > 1 ? "Here are both answers" : "Here's who to contact"}
              </p>
              <button onClick={reset} className="text-[11px] font-semibold hover:underline" style={{ color: "#2563a8" }}>
                Start over
              </button>
            </div>
            {answers.map((a, i) => (
              <AnswerBlock key={`${a.place ?? "any"}-${i}`} place={a.place} route={a.route} issueIcon={issue!.icon} />
            ))}
          </div>
        )}

        {/* Prompt to finish step 2 */}
        {issue && needsWhere && !where && (
          <p className="text-sm text-center py-4" style={{ color: "#9ca3af" }}>
            Pick a location above to see who to call.
          </p>
        )}

        {/* Empty state */}
        {!issue && (
          <div className="empty-state mt-2">
            <span className="text-3xl mb-1" aria-hidden>📞</span>
            <p className="text-sm font-semibold" style={{ color: "#374151" }}>Pick a problem to get started</p>
            <p className="text-xs">We&rsquo;ll point you to the right office in two taps.</p>
          </div>
        )}

        {/* Go deeper */}
        <div className="mt-10 pt-6 border-t border-black/8">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: "#9ca3af" }}>Go deeper</p>
          <div className="flex flex-wrap gap-2">
            {[
              { href: "/my-officials", label: "Who represents me? →" },
              { href: "/tools/districts", label: "District vote history →" },
              { href: "/tools/where-is-the-dough", label: "Campaign finance →" },
              { href: "/tools/heat-check", label: "Precinct heat map →" },
              { href: "/tools/ballot-2026", label: "2026 ballot →" },
            ].map((l) => (
              <Link key={l.href} href={l.href}
                className="text-[11px] font-semibold px-3 py-1.5 rounded-full border transition-colors hover:bg-[#1a3a5c] hover:text-white hover:border-[#1a3a5c]"
                style={{ color: "#374151", borderColor: "#e5e7eb", background: "#fff" }}>
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
