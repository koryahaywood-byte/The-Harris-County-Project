"use client";

import { useState, useMemo, useEffect } from "react";
import type { CampaignEvent } from "@/app/api/events/campaign-trail/route";

const TYPE_COLORS: Record<string, string> = {
  "Block Walk":        "#16a34a",
  "Phone Bank":        "#2563a8",
  "Text Bank":         "#0891b2",
  "Voter Registration":"#0d9c6c",
  "Meeting":           "#6b7280",
  "Training":          "#7c3aed",
  "Fundraiser":        "#b45309",
  "GOTV":              "#9333ea",
  "Rally":             "#dc2626",
  "Town Hall":         "#0f2540",
  "Organizing":        "#1d4ed8",
  "Community":         "#0e7490",
  "Peer-to-Peer":      "#854d0e",
  "Petition":          "#374151",
  "Event":             "#4b5563",
};

const ALL_TYPES = Object.keys(TYPE_COLORS);

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function fmtDateHeader(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function dayKey(iso: string) {
  return new Date(iso).toISOString().slice(0, 10);
}

interface Props {
  initialEvents: CampaignEvent[];
  counts: { D: number; R: number; total: number };
  fetchedAt: string;
}

export default function CampaignTrailClient({ initialEvents, counts, fetchedAt }: Props) {
  const [party, setParty]     = useState<"all" | "D" | "R">("all");
  const [type, setType]       = useState<string>("all");
  const [search, setSearch]   = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const activeTypes = useMemo(() => {
    const src = party === "all" ? initialEvents
      : initialEvents.filter(e => e.party === party);
    return Array.from(new Set(src.map(e => e.type))).sort();
  }, [initialEvents, party]);

  const filtered = useMemo(() => {
    return initialEvents.filter(e => {
      if (party !== "all" && e.party !== party) return false;
      if (type !== "all" && e.type !== type) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!e.title.toLowerCase().includes(q) &&
            !e.org.toLowerCase().includes(q) &&
            !e.location.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [initialEvents, party, type, search]);

  // Group by day
  const grouped = useMemo(() => {
    const map = new Map<string, CampaignEvent[]>();
    for (const e of filtered) {
      const k = dayKey(e.startDate);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(e);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="max-w-4xl mx-auto px-4 pb-20">

      {/* Stats strip */}
      <div className="flex items-center gap-6 py-6 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="text-center">
          <p className="text-2xl font-bold" style={{ color: "var(--accent)", fontFamily: "var(--font-playfair)" }}>{counts.total}</p>
          <p className="text-[11px] text-[var(--muted)] uppercase tracking-wide">Events</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold" style={{ color: "#2563a8", fontFamily: "var(--font-playfair)" }}>{counts.D}</p>
          <p className="text-[11px] text-[var(--muted)] uppercase tracking-wide">Democrat</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold" style={{ color: "#dc2626", fontFamily: "var(--font-playfair)" }}>{counts.R}</p>
          <p className="text-[11px] text-[var(--muted)] uppercase tracking-wide">Republican</p>
        </div>
        <p className="ml-auto text-[11px]" style={{ color: "var(--muted)" }}>
          Updated {new Date(fetchedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
        </p>
      </div>

      {/* Filters */}
      <div className="py-5 flex flex-col gap-3 border-b" style={{ borderColor: "var(--border)" }}>
        {/* Party toggle */}
        <div className="flex items-center gap-2">
          {(["all", "D", "R"] as const).map(p => (
            <button
              key={p}
              onClick={() => { setParty(p); setType("all"); }}
              className="px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200"
              style={{
                background: party === p
                  ? p === "D" ? "#2563a8" : p === "R" ? "#dc2626" : "var(--accent)"
                  : "var(--background)",
                color: party === p ? "#fff" : "var(--muted)",
                border: `1.5px solid ${party === p ? "transparent" : "var(--border)"}`,
              }}
            >
              {p === "all" ? "All Parties" : p === "D" ? "Democrat" : "Republican"}
            </button>
          ))}
        </div>

        {/* Type chips */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setType("all")}
            className="px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200"
            style={{
              background: type === "all" ? "var(--accent)" : "var(--background)",
              color: type === "all" ? "#fff" : "var(--muted)",
              border: `1px solid ${type === "all" ? "transparent" : "var(--border)"}`,
            }}
          >
            All Types
          </button>
          {activeTypes.map(t => (
            <button
              key={t}
              onClick={() => setType(t)}
              className="px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200"
              style={{
                background: type === t ? (TYPE_COLORS[t] ?? "var(--accent)") : "var(--background)",
                color: type === t ? "#fff" : "var(--foreground)",
                border: `1px solid ${type === t ? "transparent" : "var(--border)"}`,
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search events, orgs, locations..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-sm rounded-xl px-4 py-2 text-sm outline-none"
          style={{
            background: "var(--background)",
            border: "1.5px solid var(--border)",
            color: "var(--foreground)",
          }}
        />
      </div>

      {/* Event list grouped by day */}
      {grouped.length === 0 ? (
        <div className="py-20 text-center" style={{ color: "var(--muted)" }}>
          {initialEvents.length === 0
            ? <>
                <p className="text-base font-semibold mb-1">No upcoming events found.</p>
                <p className="text-sm">Mobilize.us and Harris County GOP events refresh every 2 hours.</p>
              </>
            : "No events match your filters."}
        </div>
      ) : (
        <div className="pt-6 flex flex-col gap-8">
          {grouped.map(([day, events]) => (
            <div key={day}>
              {/* Day header */}
              <p className="text-xs font-bold uppercase tracking-widest mb-3"
                style={{ color: "var(--muted)" }}>
                {fmtDateHeader(events[0].startDate)}
              </p>

              <div className="flex flex-col gap-3">
                {events.map(e => {
                  const isD = e.party === "D";
                  const partyColor = isD ? "#2563a8" : "#dc2626";
                  const typeColor  = TYPE_COLORS[e.type] ?? "#4b5563";
                  const isOpen     = expanded.has(e.id);

                  return (
                    <div
                      key={e.id}
                      className="rounded-2xl overflow-hidden"
                      style={{
                        background: "var(--background)",
                        border: "1px solid var(--border)",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                      }}
                    >
                      {/* Party accent bar */}
                      <div style={{ height: 3, background: partyColor }} />

                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          {/* Time column */}
                          <div className="flex-shrink-0 w-14 text-center">
                            <p className="text-xs font-bold" style={{ color: partyColor }}>
                              {fmtTime(e.startDate)}
                            </p>
                          </div>

                          {/* Main content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-sm leading-snug" style={{ color: "var(--foreground)" }}>
                                  {e.title}
                                </h3>
                                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                                  {e.org}
                                </p>
                              </div>

                              {/* Badges */}
                              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                  style={{ background: typeColor + "18", color: typeColor }}>
                                  {e.type}
                                </span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                  style={{ background: partyColor + "14", color: partyColor }}>
                                  {isD ? "Dem" : "GOP"}
                                </span>
                              </div>
                            </div>

                            {/* Location */}
                            <div className="flex items-center gap-1.5 mt-2">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--muted)", flexShrink: 0 }}>
                                {e.isVirtual
                                  ? <><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/></>
                                  : <><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></>
                                }
                              </svg>
                              <span className="text-xs truncate" style={{ color: "var(--muted)" }}>
                                {e.location}
                              </span>
                            </div>

                            {/* District chips */}
                            {(e.district?.congressional || e.district?.stateLeg) && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {e.district.congressional && (
                                  <a href={`/tools/districts?type=cd&district=${e.district.congressional}`}
                                    className="text-[10px] px-2 py-0.5 rounded-full hover:opacity-80 transition-opacity"
                                    style={{ background: "rgba(37,99,168,0.08)", color: "#2563a8" }}>
                                    CD-{e.district.congressional}
                                  </a>
                                )}
                                {e.district.stateLeg && (
                                  <a href={`/tools/districts?type=hd&district=${e.district.stateLeg}`}
                                    className="text-[10px] px-2 py-0.5 rounded-full hover:opacity-80 transition-opacity"
                                    style={{ background: "rgba(37,99,168,0.08)", color: "#2563a8" }}>
                                    HD-{e.district.stateLeg}
                                  </a>
                                )}
                                {e.district.stateSenate && (
                                  <a href={`/tools/districts?type=sd&district=${e.district.stateSenate}`}
                                    className="text-[10px] px-2 py-0.5 rounded-full hover:opacity-80 transition-opacity"
                                    style={{ background: "rgba(37,99,168,0.08)", color: "#2563a8" }}>
                                    SD-{e.district.stateSenate}
                                  </a>
                                )}
                              </div>
                            )}

                            {/* Description (expandable) */}
                            {e.description && (
                              <div className="mt-2">
                                {isOpen && (
                                  <p className="text-xs leading-relaxed mb-2" style={{ color: "var(--muted)" }}>
                                    {e.description}
                                  </p>
                                )}
                                <button
                                  onClick={() => toggleExpand(e.id)}
                                  className="text-[11px] font-semibold"
                                  style={{ color: "var(--accent)" }}>
                                  {isOpen ? "Less" : "Details"}
                                </button>
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center gap-3 mt-3">
                              <a
                                href={e.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-bold px-4 py-1.5 rounded-full transition-opacity hover:opacity-80"
                                style={{ background: partyColor, color: "#fff" }}
                              >
                                {isD ? "Register on Mobilize" : "View on HCGOP"} →
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
