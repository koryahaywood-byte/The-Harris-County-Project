"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import ShareButton from "@/components/ShareButton";
import { ALL_CONTACTS, type OfficialContact } from "@/lib/officials-contact";

const LocationMap = dynamic(() => import("@/components/LocationMap"), { ssr: false });

interface EnrichedOfficial {
  name: string;
  office: string;
  level: string;
  party: "D" | "R" | "NP";
  district: string;
  note?: string;
  slug?: string;
  photo?: string;
  phone?: string;
  districtPhone?: string;
  email?: string;
  website?: string;
  contactForm?: string;
}

interface LocResult {
  lat: number;
  lng: number;
  precinct: string;
  inHouston: boolean;
  districts: { cd?: string; sd?: string; hd?: string; jp?: string; council?: string; pct?: string };
  geometry?: GeoJSON.Geometry;
  officials: EnrichedOfficial[];
}

// Maps each "find your ___" slot to the matching official from a resolved location.
const FIND_PREDICATES: Record<string, (o: EnrichedOfficial) => boolean> = {
  // The district council member (not the 5 citywide at-large seats) is the one for a local issue.
  "your city council member": (o) => o.level === "City of Houston" && /council/i.test(o.office) && !/at-large/i.test(o.district),
  "your county commissioner": (o) => /commissioner/i.test(o.office),
  "your constable precinct": (o) => /constable/i.test(o.office),
  "your state rep & senator": (o) => o.level === "Texas Legislature",
  "your state representative": (o) => o.level === "Texas Legislature" && /representative/i.test(o.office),
  "your state senator": (o) => o.level === "Texas Legislature" && /senator/i.test(o.office),
};

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

// Bayous and channels are regional — your county commissioner runs the drainage projects,
// and flood policy/funding is set in Austin by your state representative.
const BAYOU_RESPONDERS: Responder[] = [
  { find: "your county commissioner" },
  { find: "your state representative" },
  { find: "your state senator" },
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
    id: "street-flooding",
    label: "Street / drainage flooding",
    icon: "🌧️",
    locationDependent: true,
    city: {
      agency: "Houston Public Works — Drainage",
      detail: "Street flooding and clogged storm drains inside the city.",
      hotline: { label: "Houston 311", phone: "311" },
      jurisdictions: ["city"], roles: ["legislative"], findLabel: "your city council member",
    },
    county: {
      agency: "Your Harris County Commissioner",
      detail: "Roadside ditches and local drainage in unincorporated areas.",
      jurisdictions: ["county"], roles: ["legislative"], findLabel: "your county commissioner",
    },
  },
  {
    id: "bayou-flooding",
    label: "Bayou / creek flooding",
    icon: "🌊",
    locationDependent: false,
    any: {
      agency: "Harris County Flood Control District",
      detail: "Bayous, creeks, and regional drainage — your county commissioner runs the projects, and your state representative sets flood policy and funding in Austin.",
      hotline: { label: "HCFCD", phone: "713-684-4000" },
      jurisdictions: ["county", "state"], roles: ["legislative"], findLabel: "your county commissioner",
      responders: BAYOU_RESPONDERS,
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

// A specific elected official resolved from a shared location — shown with their headshot.
function partyTint(party: string) {
  return party === "D" ? "#2563a8" : party === "R" ? "#dc2626" : "#6b7280";
}

function OfficialPersonCard({ o }: { o: EnrichedOfficial }) {
  const accent = partyTint(o.party);
  const initials = o.name.split(" ").map((w) => w[0]).slice(0, 2).join("");
  const phone = o.phone || o.districtPhone;
  return (
    <div className="hcp-card card-lift p-4 flex items-start gap-3 h-full">
      {o.photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={o.photo} alt={o.name} className="w-12 h-12 rounded-full object-cover flex-shrink-0"
          style={{ outline: `2px solid ${accent}`, outlineOffset: 1 }} />
      ) : (
        <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${accent}29, ${accent}0d)`, color: accent, border: `1.5px solid ${accent}33` }}>
          {initials}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {o.slug ? (
            <Link href={`/politicians/${o.slug}`} className="font-bold text-sm truncate hover:underline" style={{ color: "#1a3a5c" }}>{o.name}</Link>
          ) : (
            <p className="font-bold text-sm truncate" style={{ color: "#1a3a5c" }}>{o.name}</p>
          )}
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: `${accent}15`, color: accent }}>
            {o.party === "NP" ? "NP" : o.party}
          </span>
        </div>
        <p className="text-[11px] truncate" style={{ color: "#6b7280" }}>{o.office}</p>
        <div className="flex flex-col gap-0.5 mt-1.5 text-xs">
          {phone && <CallLink phone={phone}>{phone}</CallLink>}
          {o.email && (
            <a href={`mailto:${o.email}`} className="truncate hover:underline" style={{ color: "#2563a8" }}>{o.email}</a>
          )}
          {!phone && !o.email && o.contactForm && (
            <a href={o.contactForm} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: "#2563a8" }}>Contact form →</a>
          )}
          {!phone && !o.email && !o.contactForm && o.website && (
            <a href={o.website} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: "#2563a8" }}>Official site →</a>
          )}
        </div>
      </div>
    </div>
  );
}

// What to show under "who answers for it", resolving address-specific slots to the real
// officials once a location is shared.
type WhoItem =
  | { kind: "official"; o: EnrichedOfficial }
  | { kind: "contact"; c: OfficialContact }
  | { kind: "manual"; m: { name: string; office: string; phone?: string; website?: string } }
  | { kind: "find"; label: string };

function resolveWho(route: Route, loc: LocResult | null): WhoItem[] {
  if (route.responders) {
    return route.responders.flatMap((r): WhoItem[] => {
      if ("manual" in r) return [{ kind: "manual", m: r.manual }];
      if ("match" in r) {
        const fromLoc = loc?.officials.find((o) => o.office.toLowerCase().includes(r.match.toLowerCase()));
        if (fromLoc) return [{ kind: "official", o: fromLoc }];
        const c = ALL_CONTACTS.find((x) => x.office.toLowerCase().includes(r.match.toLowerCase()));
        return c ? [{ kind: "contact", c }] : [];
      }
      if (loc) {
        const pred = FIND_PREDICATES[r.find];
        const matches = pred ? loc.officials.filter(pred) : [];
        if (matches.length) return matches.map((o) => ({ kind: "official" as const, o }));
      }
      return [{ kind: "find", label: r.find }];
    });
  }

  const { singletons, hasDistrictSeats } = officialsForRoute(route);
  if (loc) {
    const items: WhoItem[] = [];
    if (route.findLabel) {
      const pred = FIND_PREDICATES[route.findLabel];
      (pred ? loc.officials.filter(pred) : []).forEach((o) => items.push({ kind: "official", o }));
    }
    singletons.forEach((c) => {
      const fromLoc = loc.officials.find((o) => o.name === c.name);
      items.push(fromLoc ? { kind: "official", o: fromLoc } : { kind: "contact", c });
    });
    if (items.length) return items;
  }

  const items: WhoItem[] = singletons.map((c) => ({ kind: "contact", c }));
  if (hasDistrictSeats && route.findLabel) items.push({ kind: "find", label: route.findLabel });
  return items;
}

// ── One concrete answer block ─────────────────────────────────────────────────────

function AnswerBlock({ place, route, issueIcon, loc }: { place: string | null; route: Route; issueIcon: string; loc: LocResult | null }) {
  const who = resolveWho(route, loc);
  const located = !!loc && who.some((w) => w.kind === "official");
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
        {who.length > 0 && (
          <div className="px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-3" style={{ color: "#9ca3af" }}>
              {located ? "Your electeds for this" : "Who answers for it"}
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {who.map((w, i) =>
                w.kind === "official" ? <OfficialPersonCard key={`o-${i}`} o={w.o} />
                : w.kind === "contact" ? <ContactCard key={`c-${i}`} c={w.c} />
                : w.kind === "manual" ? <ManualCard key={`m-${i}`} m={w.m} />
                : <FindCard key={`f-${i}`} label={w.label} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Location panel ──────────────────────────────────────────────────────────────

function DistrictChips({ districts }: { districts: LocResult["districts"] }) {
  const chips = [
    districts.cd && { label: `CD ${districts.cd}`, href: `/tools/districts?type=cd&district=${districts.cd}` },
    districts.sd && { label: `SD ${districts.sd}`, href: `/tools/districts?type=sd&district=${districts.sd}` },
    districts.hd && { label: `HD ${districts.hd}`, href: `/tools/districts?type=hd&district=${districts.hd}` },
    districts.pct && { label: `Commissioner Pct ${districts.pct}`, href: `/tools/districts?type=pct&district=${districts.pct}` },
    districts.jp && { label: `JP / Constable ${districts.jp}`, href: `/tools/districts?type=jp&district=${districts.jp}` },
    districts.council && { label: `Council ${districts.council}`, href: `/tools/districts?type=council&district=${districts.council}` },
  ].filter(Boolean) as { label: string; href: string }[];
  if (!chips.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((c) => (
        <Link key={c.href} href={c.href}
          className="text-[10px] font-bold px-2.5 py-1 rounded-full transition-colors hover:bg-blue-50"
          style={{ background: "rgba(37,99,168,0.08)", color: "#2563a8" }}>
          {c.label} →
        </Link>
      ))}
    </div>
  );
}

function LocationPanel({
  loc, locating, locError, onUse, compact,
}: {
  loc: LocResult | null;
  locating: boolean;
  locError: string | null;
  onUse: () => void;
  compact?: boolean;
}) {
  return (
    <div>
      <button onClick={onUse} disabled={locating}
        className="pressable inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold disabled:opacity-60"
        style={{ background: compact ? "var(--card)" : "#1a3a5c", color: compact ? "#1a3a5c" : "#fff", boxShadow: "var(--ring-card), 0 2px 8px rgba(26,58,92,0.08)" }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
        </svg>
        {locating ? "Locating…" : compact ? "See the districts you're in" : "Use my location"}
      </button>
      {locError && (
        <p className="text-[11px] mt-2" style={{ color: "#b91c1c" }}>{locError}</p>
      )}
      {loc && (
        <div className="hcp-card p-4 mt-3">
          <p className="text-sm font-bold mb-0.5" style={{ color: "#1a3a5c" }}>
            You&rsquo;re in {loc.inHouston ? "the City of Houston" : "unincorporated Harris County"}
          </p>
          <p className="text-[11px] mb-3" style={{ color: "#9ca3af" }}>Voting precinct {loc.precinct}</p>
          <LocationMap lat={loc.lat} lng={loc.lng} geometry={loc.geometry} />
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] mt-3 mb-2" style={{ color: "#9ca3af" }}>The districts you&rsquo;re in</p>
          <DistrictChips districts={loc.districts} />
        </div>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function WhoDoICallPage() {
  const [issue, setIssue] = useState<Issue | null>(null);
  const [where, setWhere] = useState<Where | null>(null);
  const [loc, setLoc] = useState<LocResult | null>(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

  // A shared location overrides the manual city/county pick (it's exact).
  const locWhere: Where | null = loc ? (loc.inHouston ? "city" : "county") : null;

  // Resolve: location-independent issues skip step 2; a shared location wins over a manual pick.
  const needsWhere = !!issue?.locationDependent;
  const resolvedWhere: Where | null = !issue ? null : needsWhere ? (locWhere ?? where) : "both";
  const answers = issue && resolvedWhere ? routesFor(issue, resolvedWhere) : [];

  function pickIssue(i: Issue) {
    setIssue(i.id === issue?.id ? null : i);
    setWhere(null);
  }
  function reset() { setIssue(null); setWhere(null); setLoc(null); setLocError(null); }

  function useMyLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocError("Your browser can't share location. Use the address lookup instead.");
      return;
    }
    setLocating(true);
    setLocError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(`/api/locate?lat=${latitude}&lng=${longitude}`);
          const data = await res.json();
          if (!res.ok) { setLocError(data.error ?? "Couldn't match your location."); return; }
          setLoc(data as LocResult);
        } catch {
          setLocError("Something went wrong matching your location — try again.");
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        setLocError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied. Pick a location below or look it up by address."
            : "Couldn't get your location — pick a location below instead."
        );
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 }
    );
  }

  return (
    <div style={{ background: "var(--background)", minHeight: "100vh", fontFamily: "var(--font-outfit,sans-serif)" }}>
      {/* Hero */}
      <section className="relative overflow-hidden topo-hero"
        style={{ background: "linear-gradient(180deg,#fbfbfd 0%,#f2f5f9 60%,#eef1f5 100%)", paddingTop: "3.75rem", paddingBottom: "3rem" }}>
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_45%_55%_at_82%_30%,rgba(37,99,168,0.10),transparent_70%)]" />
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_40%_45%_at_90%_75%,rgba(52,160,110,0.07),transparent_70%)]" />
        <div className="relative max-w-3xl mx-auto px-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] mb-4 flex items-center gap-2" style={{ color: "#64748b" }}>
            <span className="w-5 h-px" style={{ background: "#94a3b8" }} />
            Your Government · Take Action
          </p>
          <h1 className="text-4xl md:text-5xl font-bold mb-2" style={{ fontFamily: "var(--font-playfair,serif)" }}>
            <span style={{ color: "#aab4c0" }}>Who do I </span><span style={{ color: "#0f2540" }}>call?</span>
          </h1>
          <p className="text-sm max-w-lg mb-5" style={{ color: "#5b6470" }}>
            Two questions — what&rsquo;s wrong and where it is — and you&rsquo;ll have the right number to call and the official who answers for it.
          </p>
          <ShareButton
            toolName="Who Do I Call?"
            section="Government"
            description="Pick a problem and a location, get the right Harris County or Houston contact."
            summary="Who Do I Call? — pick your problem and location, get the right number to call in Harris County — via The Harris County Project"
            light={false}
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

            {/* Smart option: share location → exact precinct, districts, and city/county */}
            <div className="mb-4">
              <LocationPanel loc={loc} locating={locating} locError={locError} onUse={useMyLocation} />
            </div>

            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] mb-2" style={{ color: "#9ca3af" }}>
              {loc ? "Or pick manually" : "Or pick a location"}
            </p>
            <div className="grid sm:grid-cols-3 gap-2.5">
              {([
                { key: "city" as Where, label: "Inside Houston", sub: "City of Houston limits" },
                { key: "county" as Where, label: "Unincorporated county", sub: "Outside any city" },
                { key: "both" as Where, label: "Not sure", sub: "Show both answers" },
              ]).map((opt) => {
                const active = (locWhere ?? where) === opt.key;
                return (
                  <button key={opt.key} onClick={() => { setLoc(null); setWhere(opt.key); }}
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
            {!loc && (
              <p className="text-[11px] mt-2.5" style={{ color: "#9ca3af" }}>
                Not sure which one you&rsquo;re in?{" "}
                <Link href="/my-officials" className="font-semibold hover:underline" style={{ color: "#2563a8" }}>Look it up by address →</Link>
              </p>
            )}
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
              <AnswerBlock key={`${a.place ?? "any"}-${i}`} place={a.place} route={a.route} issueIcon={issue!.icon} loc={loc} />
            ))}

            {/* Location-independent issues: offer the map + districts as a bonus */}
            {issue && !needsWhere && (
              <div className="pt-1">
                <LocationPanel loc={loc} locating={locating} locError={locError} onUse={useMyLocation} compact />
              </div>
            )}
          </div>
        )}

        {/* Prompt to finish step 2 */}
        {issue && needsWhere && !where && !loc && (
          <p className="text-sm text-center py-4" style={{ color: "#9ca3af" }}>
            Share your location or pick a place above to see who to call.
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
