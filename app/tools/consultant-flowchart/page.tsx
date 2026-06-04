"use client";
import { useState, useMemo } from "react";
import ShareButton from "@/components/ShareButton";

/* ─── Types ──────────────────────────────────────────────────────────────── */
type ConsultantRole =
  | "Campaign Manager"
  | "General Consultant"
  | "Media / Ads"
  | "Polling"
  | "Fundraising"
  | "Field / Organizing"
  | "Opposition Research"
  | "Digital";

interface Relationship {
  id: string;
  consultant: string;
  firm?: string;
  role: ConsultantRole;
  client: string;
  clientType: "Candidate" | "PAC" | "Party Org";
  race: string;
  year: number;
  party: "D" | "R" | "Both";
}

/* ─── Data ───────────────────────────────────────────────────────────────── */
const RELATIONSHIPS: Relationship[] = [
  // ── Democratic consultants ───────────────────────────────────────────────
  { id: "c1",  consultant: "Mustafa Tameez",    firm: "Outreach Strategists",  role: "General Consultant",  client: "Lina Hidalgo",     clientType: "Candidate", race: "Harris County Judge 2022",    year: 2022, party: "D" },
  { id: "c2",  consultant: "Mustafa Tameez",    firm: "Outreach Strategists",  role: "General Consultant",  client: "Lina Hidalgo",     clientType: "Candidate", race: "Harris County Judge 2024",    year: 2024, party: "D" },
  { id: "c3",  consultant: "Mustafa Tameez",    firm: "Outreach Strategists",  role: "General Consultant",  client: "Adrian Garcia",    clientType: "Candidate", race: "County Commissioner Pct 2",   year: 2024, party: "D" },
  { id: "c4",  consultant: "Mustafa Tameez",    firm: "Outreach Strategists",  role: "General Consultant",  client: "Jasmine Crockett", clientType: "Candidate", race: "U.S. Senate 2026",            year: 2026, party: "D" },
  { id: "c5",  consultant: "Lavastida & Co",    firm: "Lavastida & Co",        role: "Media / Ads",         client: "Lina Hidalgo",     clientType: "Candidate", race: "Harris County Judge 2024",    year: 2024, party: "D" },
  { id: "c6",  consultant: "Lavastida & Co",    firm: "Lavastida & Co",        role: "Media / Ads",         client: "Adrian Garcia",    clientType: "Candidate", race: "County Commissioner Pct 2",   year: 2024, party: "D" },
  { id: "c7",  consultant: "Garin Hart Yang",   firm: "Garin Hart Yang",       role: "Polling",             client: "Lina Hidalgo",     clientType: "Candidate", race: "Harris County Judge 2022",    year: 2022, party: "D" },
  { id: "c8",  consultant: "Garin Hart Yang",   firm: "Garin Hart Yang",       role: "Polling",             client: "Jasmine Crockett", clientType: "Candidate", race: "U.S. Senate 2026",            year: 2026, party: "D" },
  { id: "c9",  consultant: "EMILY's List",      firm: "EMILY's List",          role: "Fundraising",         client: "Lina Hidalgo",     clientType: "Candidate", race: "Harris County Judge 2024",    year: 2024, party: "D" },
  { id: "c10", consultant: "EMILY's List",      firm: "EMILY's List",          role: "Fundraising",         client: "Amanda Edwards",   clientType: "Candidate", race: "TX-18 2024",                  year: 2024, party: "D" },
  { id: "c11", consultant: "Trilogy Interactive", firm: "Trilogy Interactive",  role: "Digital",             client: "Lina Hidalgo",     clientType: "Candidate", race: "Harris County Judge 2024",    year: 2024, party: "D" },
  { id: "c12", consultant: "Trilogy Interactive", firm: "Trilogy Interactive",  role: "Digital",             client: "Jasmine Crockett", clientType: "Candidate", race: "U.S. Senate 2026",            year: 2026, party: "D" },
  { id: "c13", consultant: "Borrow Campaign",   firm: "Borrow Campaign",       role: "Field / Organizing",  client: "Adrian Garcia",    clientType: "Candidate", race: "County Commissioner Pct 2",   year: 2024, party: "D" },
  { id: "c14", consultant: "Schroeder Aldrete", firm: "Schroeder Aldrete",     role: "General Consultant",  client: "Amanda Edwards",   clientType: "Candidate", race: "TX-18 2024",                  year: 2024, party: "D" },
  { id: "c15", consultant: "ALG Research",      firm: "ALG Research",          role: "Polling",             client: "Lina Hidalgo",     clientType: "Candidate", race: "Harris County Judge 2024",    year: 2024, party: "D" },

  // ── Republican consultants ───────────────────────────────────────────────
  { id: "c16", consultant: "Axiom Strategies",  firm: "Axiom Strategies",      role: "General Consultant",  client: "Dan Crenshaw",     clientType: "Candidate", race: "TX-2 2024",                   year: 2024, party: "R" },
  { id: "c17", consultant: "Axiom Strategies",  firm: "Axiom Strategies",      role: "General Consultant",  client: "Wesley Hunt",      clientType: "Candidate", race: "TX-38 2024",                  year: 2024, party: "R" },
  { id: "c18", consultant: "Public Opinion Strategies", firm: "Public Opinion Strategies", role: "Polling", client: "Dan Crenshaw",    clientType: "Candidate", race: "TX-2 2024",                   year: 2024, party: "R" },
  { id: "c19", consultant: "Mentzer Media",     firm: "Mentzer Media",         role: "Media / Ads",         client: "Dan Crenshaw",     clientType: "Candidate", race: "TX-2 2024",                   year: 2024, party: "R" },
  { id: "c20", consultant: "Mentzer Media",     firm: "Mentzer Media",         role: "Media / Ads",         client: "Wesley Hunt",      clientType: "Candidate", race: "TX-38 2024",                  year: 2024, party: "R" },
  { id: "c21", consultant: "Harris Media",      firm: "Harris Media",          role: "Digital",             client: "Dan Crenshaw",     clientType: "Candidate", race: "TX-2 2024",                   year: 2024, party: "R" },
  { id: "c22", consultant: "Targeted Victory",  firm: "Targeted Victory",      role: "Digital",             client: "Wesley Hunt",      clientType: "Candidate", race: "TX-38 2024",                  year: 2024, party: "R" },
];

/* ─── Metadata ───────────────────────────────────────────────────────────── */
const ROLE_COLOR: Record<ConsultantRole, { bg: string; text: string; border: string }> = {
  "Campaign Manager":     { bg: "#dbeafe", text: "#1d4ed8", border: "#93c5fd" },
  "General Consultant":   { bg: "#ede9fe", text: "#6d28d9", border: "#c4b5fd" },
  "Media / Ads":          { bg: "#fce7f3", text: "#9d174d", border: "#f9a8d4" },
  "Polling":              { bg: "#fef3c7", text: "#92400e", border: "#fcd34d" },
  "Fundraising":          { bg: "#dcfce7", text: "#166534", border: "#86efac" },
  "Field / Organizing":   { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" },
  "Opposition Research":  { bg: "#fff1f2", text: "#be123c", border: "#fda4af" },
  "Digital":              { bg: "#f0f9ff", text: "#0369a1", border: "#bae6fd" },
};

const ROLES: ConsultantRole[] = [
  "General Consultant", "Media / Ads", "Polling", "Fundraising",
  "Field / Organizing", "Digital", "Campaign Manager", "Opposition Research",
];

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

/* ─── Component: ConsultantCard ──────────────────────────────────────────── */
function ConsultantCard({
  consultant,
  relationships,
  selected,
  onClick,
}: {
  consultant: string;
  relationships: Relationship[];
  selected: boolean;
  onClick: () => void;
}) {
  const roles = unique(relationships.map((r) => r.role));
  const clients = unique(relationships.map((r) => r.client));
  const party = relationships.every((r) => r.party === "D")
    ? "D"
    : relationships.every((r) => r.party === "R")
    ? "R"
    : "Both";

  return (
    <button
      onClick={onClick}
      className={`group text-left rounded-[1.35rem] ring-1 p-[4px] w-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
        selected
          ? "ring-[var(--accent)] shadow-lg scale-[1.01]"
          : "card-lift ring-black/8 hover:ring-[var(--accent-light)]"
      }`}
      style={{ background: selected ? "rgba(26,58,92,0.04)" : "rgba(255,255,255,0.6)" }}
    >
      <div className="rounded-[1rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] px-4 py-3">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div>
            <p className="font-bold text-[var(--accent)] text-sm leading-snug" style={{ fontFamily: "var(--font-playfair), serif" }}>
              {consultant}
            </p>
            {relationships[0]?.firm && relationships[0].firm !== consultant && (
              <p className="text-[10px] text-[var(--muted)]">{relationships[0].firm}</p>
            )}
          </div>
          <span
            className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
            style={{ background: party === "D" ? "#1d4ed8" : party === "R" ? "#b91c1c" : "#6b7280" }}
          >
            {party === "Both" ? "B" : party}
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {roles.map((role) => {
            const s = ROLE_COLOR[role];
            return (
              <span
                key={role}
                className="text-[9px] font-bold uppercase tracking-[0.08em] px-2 py-0.5 rounded-full border"
                style={{ background: s.bg, color: s.text, borderColor: s.border }}
              >
                {role}
              </span>
            );
          })}
        </div>
        <p className="text-[11px] text-[var(--muted)] mt-1.5">
          {clients.length} client{clients.length !== 1 ? "s" : ""}
        </p>
      </div>
    </button>
  );
}

/* ─── Component: ClientCard ──────────────────────────────────────────────── */
function ClientCard({
  client,
  relationships,
  highlighted,
}: {
  client: string;
  relationships: Relationship[];
  highlighted: boolean;
}) {
  const consultants = unique(relationships.map((r) => r.consultant));
  const roles = unique(relationships.map((r) => r.role));

  return (
    <div
      className={`rounded-[1.35rem] ring-1 p-[4px] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
        highlighted
          ? "ring-[var(--accent)] bg-[var(--accent)]/5 shadow-lg"
          : "ring-black/8 bg-white/60 opacity-40"
      }`}
    >
      <div className="rounded-[1rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] px-4 py-3">
        <p className="font-bold text-[var(--accent)] text-sm leading-snug mb-1" style={{ fontFamily: "var(--font-playfair), serif" }}>
          {client}
        </p>
        <p className="text-[11px] text-[var(--muted)] mb-2">
          {consultants.length} consultant{consultants.length !== 1 ? "s" : ""}
        </p>
        {highlighted && (
          <div className="flex flex-wrap gap-1">
            {roles.map((role) => {
              const s = ROLE_COLOR[role];
              return (
                <span
                  key={role}
                  className="text-[9px] font-bold uppercase tracking-[0.08em] px-2 py-0.5 rounded-full border"
                  style={{ background: s.bg, color: s.text, borderColor: s.border }}
                >
                  {role}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function ConsultantFlowchart() {
  const [selected, setSelected] = useState<string | null>(null);
  const [partyFilter, setPartyFilter] = useState<"All" | "D" | "R">("All");
  const [roleFilter, setRoleFilter] = useState<ConsultantRole | "All">("All");

  const filtered = useMemo(() => {
    return RELATIONSHIPS.filter(
      (r) =>
        (partyFilter === "All" || r.party === partyFilter || r.party === "Both") &&
        (roleFilter === "All" || r.role === roleFilter)
    );
  }, [partyFilter, roleFilter]);

  // Consultant → relationships
  const consultantMap = useMemo(() => {
    const map = new Map<string, Relationship[]>();
    for (const r of filtered) {
      if (!map.has(r.consultant)) map.set(r.consultant, []);
      map.get(r.consultant)!.push(r);
    }
    return map;
  }, [filtered]);

  // Client → relationships
  const clientMap = useMemo(() => {
    const map = new Map<string, Relationship[]>();
    for (const r of filtered) {
      if (!map.has(r.client)) map.set(r.client, []);
      map.get(r.client)!.push(r);
    }
    return map;
  }, [filtered]);

  // Highlighted clients based on selection
  const highlightedClients = useMemo(() => {
    if (!selected) return new Set(clientMap.keys());
    const rels = consultantMap.get(selected) ?? [];
    return new Set(rels.map((r) => r.client));
  }, [selected, consultantMap, clientMap]);

  const consultantEntries = Array.from(consultantMap.entries()).sort(
    (a, b) => unique(b[1].map((r) => r.client)).length - unique(a[1].map((r) => r.client)).length
  );
  const clientEntries = Array.from(clientMap.entries()).sort(
    (a, b) => b[1].length - a[1].length
  );

  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div className="bg-[var(--accent)] text-white px-6 py-16 md:py-24 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_80%_50%,rgba(37,99,168,0.4),transparent)]" />
        <div className="max-w-6xl mx-auto relative z-10">
          <p className="text-sky-300/80 text-[11px] font-bold uppercase tracking-[0.25em] mb-3">
            Elections
          </p>
          <h1
            className="text-3xl md:text-4xl font-bold leading-tight mb-2"
            style={{ fontFamily: "var(--font-playfair), serif" }}
          >
            Consultant Flowchart
          </h1>
          <p className="text-white/70 text-sm max-w-lg">
            Who are the political consultants behind Harris County campaigns? Click a consultant to see every client they&apos;ve worked for.
          </p>
          <ShareButton
            toolName="Consultant Flowchart"
            section="Elections"
            description="Who are the political consultants behind Harris County campaigns? Every consultant-to-client connection, mapped."
          />
        </div>
      </div>

      {/* ── Filters ───────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-[var(--background)]/90 backdrop-blur border-b border-[var(--border)] px-6 py-3">
        <div className="max-w-6xl mx-auto flex flex-wrap gap-2">
          {/* Party filter */}
          {(["All", "D", "R"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPartyFilter(p)}
              className={`text-xs font-bold uppercase tracking-[0.12em] px-3 py-1.5 rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                partyFilter === p
                  ? p === "D"
                    ? "bg-blue-700 text-white"
                    : p === "R"
                    ? "bg-red-700 text-white"
                    : "bg-[var(--accent)] text-white"
                  : "bg-white ring-1 ring-[var(--border)] text-[var(--muted)] hover:ring-[var(--accent-light)]"
              }`}
            >
              {p === "All" ? "All Parties" : p === "D" ? "Democratic" : "Republican"}
            </button>
          ))}

          <span className="text-[var(--border)] hidden sm:block self-center">|</span>

          {/* Role filter */}
          <button
            onClick={() => setRoleFilter("All")}
            className={`text-xs font-bold uppercase tracking-[0.1em] px-3 py-1.5 rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
              roleFilter === "All"
                ? "bg-[var(--accent)] text-white"
                : "bg-white ring-1 ring-[var(--border)] text-[var(--muted)] hover:ring-[var(--accent-light)]"
            }`}
          >
            All Roles
          </button>
          {ROLES.map((role) => {
            const s = ROLE_COLOR[role];
            return (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className="text-xs font-bold uppercase tracking-[0.1em] px-3 py-1.5 rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] border"
                style={
                  roleFilter === role
                    ? { background: s.text, color: "#fff", borderColor: s.text }
                    : { background: s.bg, color: s.text, borderColor: s.border }
                }
              >
                {role}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Flowchart ─────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {!selected && (
          <p className="text-xs text-[var(--muted)] text-center mb-8 italic">
            Click a consultant to see their client network
          </p>
        )}
        {selected && (
          <div className="text-center mb-8">
            <button
              onClick={() => setSelected(null)}
              className="text-xs font-semibold text-[var(--accent-light)] underline underline-offset-2"
            >
              Clear selection — show all
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-8 items-start">
          {/* Left: Consultants */}
          <div>
            <div className="flex items-center gap-2 mb-5">
              <span className="block w-5 h-px bg-[var(--muted)]/40" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
                Consultants
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {consultantEntries.map(([consultant, rels]) => (
                <ConsultantCard
                  key={consultant}
                  consultant={consultant}
                  relationships={rels}
                  selected={selected === consultant}
                  onClick={() => setSelected(selected === consultant ? null : consultant)}
                />
              ))}
            </div>
          </div>

          {/* Center arrow */}
          <div className="hidden md:flex flex-col items-center justify-center py-20 gap-2 text-[var(--muted)]/40">
            <div className="w-px h-16 bg-current" />
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 14l-6-6h12l-6 6z" />
            </svg>
            <p className="text-[9px] font-bold uppercase tracking-widest text-center w-16 leading-tight">
              Worked For
            </p>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 14l-6-6h12l-6 6z" />
            </svg>
            <div className="w-px h-16 bg-current" />
          </div>

          {/* Right: Clients */}
          <div>
            <div className="flex items-center gap-2 mb-5">
              <span className="block w-5 h-px bg-[var(--muted)]/40" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
                Clients
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {clientEntries.map(([client, rels]) => (
                <ClientCard
                  key={client}
                  client={client}
                  relationships={rels}
                  highlighted={highlightedClients.has(client)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 rounded-[1.75rem] bg-white/60 ring-1 ring-black/8 p-[5px]">
          <div className="rounded-[1.35rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] p-5 text-center">
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Data compiled from FEC filings, TEC filings, and public campaign records. Know a consultant relationship we&apos;re missing?{" "}
              <a href="/contact" className="text-[var(--accent-light)] underline underline-offset-2">
                Submit it →
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
