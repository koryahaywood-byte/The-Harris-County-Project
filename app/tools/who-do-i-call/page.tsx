"use client";
import { useState } from "react";
import Link from "next/link";
import { ALL_CONTACTS, type OfficialContact } from "@/lib/officials-contact";

// ── Issue routing logic ────────────────────────────────────────────────────────

type Issue = {
  id: string;
  label: string;
  description: string;
  primaryJurisdictions: OfficialContact["jurisdiction"][];
  primaryRoles: OfficialContact["roleCategory"][];
  note?: string;
  hotline?: { label: string; phone: string };
};

const ISSUES: Issue[] = [
  {
    id: "pothole",
    label: "Pothole / road damage",
    description: "City streets: 311. County roads: your county commissioner.",
    primaryJurisdictions: ["city"],
    primaryRoles: ["legislative"],
    hotline: { label: "Houston 311", phone: "311" },
  },
  {
    id: "flooding",
    label: "Flooding / drainage",
    description: "Harris County Flood Control handles most bayous. City 311 for street flooding.",
    primaryJurisdictions: ["county"],
    primaryRoles: ["legislative"],
    hotline: { label: "HCFCD Emergency", phone: "713-684-4000" },
  },
  {
    id: "trash",
    label: "Trash / bulk pickup",
    description: "Houston Solid Waste handles pickup inside city limits.",
    primaryJurisdictions: ["city"],
    primaryRoles: ["executive"],
    hotline: { label: "Houston Solid Waste", phone: "311" },
  },
  {
    id: "crime",
    label: "Crime / public safety",
    description: "HPD for city. Harris County Sheriff for unincorporated areas.",
    primaryJurisdictions: ["city", "county"],
    primaryRoles: ["law-enforcement"],
    hotline: { label: "Non-emergency", phone: "713-884-3131" },
  },
  {
    id: "schools",
    label: "Public schools / education",
    description: "Your local ISD school board governs curriculum, facilities, and budget.",
    primaryJurisdictions: ["school"],
    primaryRoles: ["school-board"],
  },
  {
    id: "property-taxes",
    label: "Property taxes / appraisal",
    description: "HCAD handles appraisals (not elected). Your county commissioners set the tax rate.",
    primaryJurisdictions: ["county"],
    primaryRoles: ["legislative"],
    hotline: { label: "HCAD", phone: "713-957-7800" },
  },
  {
    id: "state-policy",
    label: "State legislation / policy",
    description: "Your Texas House member and state senator represent you in Austin.",
    primaryJurisdictions: ["state"],
    primaryRoles: ["legislative"],
  },
  {
    id: "voting",
    label: "Voting / elections",
    description: "Harris County Clerk handles voter registration, polling places, and results.",
    primaryJurisdictions: ["county"],
    primaryRoles: ["clerk"],
    hotline: { label: "Harris County Clerk", phone: "713-274-8683" },
  },
  {
    id: "county-services",
    label: "County government / services",
    description: "Harris County Commissioners Court sets the county budget and policy.",
    primaryJurisdictions: ["county"],
    primaryRoles: ["legislative", "executive"],
  },
  {
    id: "city-policy",
    label: "City of Houston policy",
    description: "Your city council member and the mayor set city ordinances and budgets.",
    primaryJurisdictions: ["city"],
    primaryRoles: ["legislative", "executive"],
  },
];

// ── Filter contacts for a given issue ─────────────────────────────────────────

function contactsForIssue(issue: Issue): OfficialContact[] {
  return ALL_CONTACTS.filter(
    (c) =>
      issue.primaryJurisdictions.includes(c.jurisdiction) &&
      issue.primaryRoles.some((r) => c.roleCategory === r)
  ).slice(0, 12);
}

// ── Contact card component ─────────────────────────────────────────────────────

function ContactCard({ c }: { c: OfficialContact }) {
  const verified = c.lastVerified !== "pending-scrape" && c.lastVerified !== "";
  return (
    <div
      className="rounded-lg border p-4 flex flex-col gap-2"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div>
        <div className="font-semibold text-sm" style={{ color: "var(--fg)" }}>
          {c.name}
        </div>
        <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
          {c.office}
          {c.district && c.district !== "citywide" && c.district !== "countywide"
            ? ` · ${c.district}`
            : ""}
        </div>
      </div>

      <div className="flex flex-col gap-1 text-xs">
        {c.phone && (
          <a
            href={`tel:${c.phone.replace(/[^\d]/g, "")}`}
            className="flex items-center gap-1.5 font-mono"
            style={{ color: "var(--link)" }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.21 2 2 0 012 .01h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z" />
            </svg>
            {c.phone}
          </a>
        )}
        {c.districtPhone && (
          <a
            href={`tel:${c.districtPhone.replace(/[^\d]/g, "")}`}
            className="flex items-center gap-1.5 font-mono"
            style={{ color: "var(--link)" }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.21 2 2 0 012 .01h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z" />
            </svg>
            {c.districtPhone} <span style={{ color: "var(--muted)" }}>(district)</span>
          </a>
        )}
        {c.email && (
          <a
            href={`mailto:${c.email}`}
            className="flex items-center gap-1.5 truncate"
            style={{ color: "var(--link)" }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            {c.email}
          </a>
        )}
        {c.contactForm && (
          <a
            href={c.contactForm}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5"
            style={{ color: "var(--link)" }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            Contact form
          </a>
        )}
        {c.website && !c.contactForm && (
          <a
            href={c.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5"
            style={{ color: "var(--link)" }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
            </svg>
            Official website
          </a>
        )}
      </div>

      {!verified && (
        <div
          className="text-[10px] mt-1 px-1.5 py-0.5 rounded w-fit"
          style={{ background: "rgba(239,168,0,0.1)", color: "#b45309" }}
        >
          Pending verification
        </div>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function WhoDoICallPage() {
  const [selected, setSelected] = useState<Issue | null>(null);

  const contacts = selected ? contactsForIssue(selected) : [];

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--background)", color: "var(--fg)" }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-10 border-b px-4 py-3"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold tracking-tight">Who Do I Call?</h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
              Find the right official for your issue — Harris County &amp; Houston
            </p>
          </div>
          <Link
            href="/my-officials"
            className="text-xs px-3 py-1.5 rounded font-medium"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            Who represents me?
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Issue picker */}
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>
            What&rsquo;s the issue?
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ISSUES.map((issue) => (
              <button
                key={issue.id}
                onClick={() => setSelected(selected?.id === issue.id ? null : issue)}
                className="text-left rounded-lg border px-4 py-3 transition-all"
                style={{
                  background:
                    selected?.id === issue.id ? "var(--accent)" : "var(--surface)",
                  borderColor:
                    selected?.id === issue.id ? "var(--accent)" : "var(--border)",
                  color: selected?.id === issue.id ? "#fff" : "var(--fg)",
                }}
              >
                <div className="font-semibold text-sm">{issue.label}</div>
                <div
                  className="text-xs mt-0.5 line-clamp-1"
                  style={{
                    color: selected?.id === issue.id ? "rgba(255,255,255,0.75)" : "var(--muted)",
                  }}
                >
                  {issue.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {selected && (
          <div>
            <div
              className="rounded-lg border px-4 py-3 mb-5"
              style={{ background: "rgba(37,99,168,0.06)", borderColor: "var(--border)" }}
            >
              <p className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
                {selected.label}
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                {selected.description}
              </p>
              {selected.hotline && (
                <a
                  href={`tel:${selected.hotline.phone.replace(/[^\d]/g, "")}`}
                  className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold px-3 py-1.5 rounded"
                  style={{ background: "var(--accent)", color: "#fff" }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.21 2 2 0 012 .01h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z" />
                  </svg>
                  {selected.hotline.label} · {selected.hotline.phone}
                </a>
              )}
            </div>

            {contacts.length > 0 ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>
                  Elected officials for this issue
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {contacts.map((c, i) => (
                    <ContactCard key={c.slug ?? `${c.name}-${i}`} c={c} />
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                No contact records matched for this issue yet — use the hotline above or{" "}
                <Link href="/my-officials" style={{ color: "var(--link)" }}>
                  find your representatives
                </Link>
                .
              </p>
            )}
          </div>
        )}

        {/* Empty state */}
        {!selected && (
          <div className="mt-2 text-center py-10" style={{ color: "var(--muted)" }}>
            <svg
              className="mx-auto mb-3 opacity-30"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.21 2 2 0 012 .01h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z" />
            </svg>
            <p className="text-sm">Pick an issue above to find the right contact</p>
          </div>
        )}

        {/* Footer: related tools */}
        <div
          className="mt-10 pt-5 border-t text-xs"
          style={{ borderColor: "var(--border)", color: "var(--muted)" }}
        >
          <p className="font-semibold uppercase tracking-widest mb-2">Related tools</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/my-officials" style={{ color: "var(--link)" }}>Who represents me?</Link>
            <Link href="/tools/districts" style={{ color: "var(--link)" }}>District maps</Link>
            <Link href="/tools/where-is-the-dough" style={{ color: "var(--link)" }}>Campaign finance</Link>
            <Link href="/tools/heat-check" style={{ color: "var(--link)" }}>Election results map</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
