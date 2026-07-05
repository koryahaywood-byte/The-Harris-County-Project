"use client";
import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { ENDORSEMENTS, TYPE_COLOR, RELATIONSHIPS, ROLE_COLOR, DONORS, type EndorserType, type ConsultantRole, type Endorsement, type Relationship } from "@/lib/network-data";


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
