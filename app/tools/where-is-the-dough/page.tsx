"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { FINANCE_DATA_MERGED, fmt, formatAsOf, type CandidateFinance } from "@/lib/campaign-finance";
import ShareButton from "@/components/ShareButton";
import RelatedTools from "@/components/RelatedTools";
import { MoneyTrailView } from "@/components/MoneyTrail";
import TerrainReport from "@/components/TerrainReport";
import { useUrlState, readUrlParams } from "@/lib/useUrlState";
import { MATCHUPS_2026 } from "@/lib/matchups-2026";
import { buildMoneyRaces } from "@/lib/money-races";
import { MoversStrip } from "@/components/MoneyDuel";
import { POLITICIANS } from "@/lib/politicians";
import { CANDIDATE_PHOTOS } from "@/lib/candidate-photos";
import { RATING, PARTY, raceHref } from "@/lib/ratings";
import { RatingChip } from "@/components/desk/Rating";
import { CashDuel } from "@/components/desk/Bars";
import Face from "@/components/desk/Face";

// Candidate name → the 2026 race they're on the ballot for.
const RACE_BY_NAME = new Map<string, string>(
  Object.entries(MATCHUPS_2026).flatMap(([key, m]) => m.sides.map(s => [s.name, key] as [string, string]))
);
const PHOTO_BY_NAME = new Map<string, string>([
  ...Object.entries(CANDIDATE_PHOTOS),
  ...POLITICIANS.filter(p => p.photo).map(p => [p.name, p.photo!] as [string, string]),
]);
import type { FECCandidate } from "@/app/api/finance/fec/route";
import type { TECCandidate } from "@/app/api/finance/tec/route";

type Candidate = CandidateFinance;

type Tab   = "leaderboard" | "races" | "story" | "trail" | "portal" | "scanner";
type Level = "all" | "federal" | "state" | "houston" | "county";
type CountyGroup = "all" | "commissioners" | "jp" | "courts" | "law" | "admin";

const LEVEL_LABELS: Record<Level, string> = {
  all: "Every level", federal: "Federal", state: "State", county: "Harris County", houston: "City of Houston",
};

const COUNTY_GROUPS: Record<CountyGroup, string> = {
  all: "All county offices", commissioners: "Commissioners Court", jp: "Justices of the Peace",
  courts: "County Courts", law: "Law Enforcement", admin: "Clerks & Admin",
};

function countyGroupOf(office: string): CountyGroup {
  const o = office.toLowerCase();
  if (o.includes("justice of the peace")) return "jp";
  if (o.includes("county judge") || o.includes("commissioner")) return "commissioners";
  if (o.includes("criminal court") || o.includes("civil court") || o.includes("probate") || o.includes("court at law")) return "courts";
  if (o.includes("sheriff") || o.includes("constable") || o.includes("district attorney")) return "law";
  return "admin";
}

/* ── Finance Scanner ─────────────────────────────────────────────────────── */
type ScanState = "idle" | "loading" | "done" | "error" | "no_key";
interface ScanResult {
  filer?: string; period?: string;
  raised?: number | null; spent?: number | null; cash?: number | null;
  topContributors?: { name: string; amount: number; city?: string }[];
  topExpenses?: { payee: string; amount: number; purpose?: string }[];
  error?: string;
}

function fmt$( n: number | null | undefined) {
  if (n == null) return "–";
  return "$" + n.toLocaleString();
}

function FinanceScanner() {
  const [url, setUrl] = useState("");
  const [state, setState] = useState<ScanState>("idle");
  const [result, setResult] = useState<ScanResult | null>(null);

  async function scan(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setState("loading");
    setResult(null);
    try {
      const res = await fetch("/api/finance/scan-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (data.status === "no_key") { setState("no_key"); return; }
      if (data.status === "error") { setState("error"); setResult({ error: data.error }); return; }
      setState("done");
      setResult(data);
    } catch (err) {
      setState("error");
      setResult({ error: String(err) });
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-1" style={{ color: "var(--accent)", fontFamily: "var(--font-playfair), serif" }}>
          Finance File Scanner
        </h2>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Paste a TEC or Harris County C/OH PDF URL. Claude reads it and extracts totals, top donors, and top expenses instantly.
        </p>
      </div>

      <form onSubmit={scan} className="flex gap-2 mb-6">
        <input
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://ethics.state.tx.us/data/search/cf/2024/…/12345.pdf"
          className="flex-1 px-4 py-2.5 rounded-full text-sm bg-white ring-1 ring-[var(--border)] focus:ring-[var(--accent)] focus:outline-none"
          required
        />
        <button type="submit" disabled={state === "loading"}
          className="px-5 py-2.5 rounded-full text-sm font-bold text-white transition-all duration-300 disabled:opacity-50"
          style={{ background: "var(--accent)" }}>
          {state === "loading" ? "Scanning…" : "Scan"}
        </button>
      </form>

      {state === "loading" && (
        <div className="flex items-center gap-3 py-10 justify-center">
          <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
          <p className="text-sm" style={{ color: "var(--muted)" }}>Reading the filing with Claude…</p>
        </div>
      )}

      {state === "no_key" && (
        <div className="rounded-2xl p-8 text-center" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
          <p className="font-bold mb-1" style={{ color: "var(--accent)" }}>ANTHROPIC_API_KEY not set</p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Add <code className="px-1 rounded text-xs" style={{ background: "#f3f4f6" }}>ANTHROPIC_API_KEY</code> to your Vercel environment variables to enable PDF extraction.
          </p>
        </div>
      )}

      {state === "error" && (
        <div className="rounded-2xl p-6" style={{ background: "#fff7f7", border: "1px solid #fca5a5" }}>
          <p className="font-bold text-red-700 mb-1">Error</p>
          <p className="text-sm text-red-600">{result?.error ?? "Unknown error"}</p>
        </div>
      )}

      {state === "done" && result && (
        <div className="space-y-4">
          {/* Header card */}
          <div className="rounded-2xl p-6 ring-1 ring-[var(--border)]" style={{ background: "#fff" }}>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-1" style={{ color: "var(--muted)" }}>Filing</p>
            <h3 className="text-lg font-bold mb-0.5" style={{ color: "var(--accent)", fontFamily: "var(--font-playfair), serif" }}>
              {result.filer ?? "Unknown filer"}
            </h3>
            {result.period && <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>{result.period}</p>}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Raised", val: result.raised },
                { label: "Spent", val: result.spent },
                { label: "Cash on Hand", val: result.cash },
              ].map(({ label, val }) => (
                <div key={label} className="rounded-xl p-3" style={{ background: "rgba(37,99,168,0.06)" }}>
                  <p className="text-[9px] font-bold uppercase tracking-[0.15em] mb-1" style={{ color: "var(--muted)" }}>{label}</p>
                  <p className="text-lg font-bold" style={{ color: "var(--accent)", fontFamily: "var(--font-playfair), serif" }}>
                    {fmt$(val)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Contributors */}
          {(result.topContributors?.length ?? 0) > 0 && (
            <div className="rounded-2xl p-6 ring-1 ring-[var(--border)]" style={{ background: "#fff" }}>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-4" style={{ color: "var(--muted)" }}>Top Contributors</p>
              <div className="space-y-2">
                {result.topContributors!.map((c, i) => (
                  <div key={i} className="flex items-center justify-between gap-4 py-1.5 border-b border-black/5 last:border-0">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{c.name}</p>
                      {c.city && <p className="text-[11px]" style={{ color: "var(--muted)" }}>{c.city}</p>}
                    </div>
                    <p className="text-sm font-bold flex-shrink-0" style={{ color: "var(--accent)" }}>{fmt$(c.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expenses */}
          {(result.topExpenses?.length ?? 0) > 0 && (
            <div className="rounded-2xl p-6 ring-1 ring-[var(--border)]" style={{ background: "#fff" }}>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-4" style={{ color: "var(--muted)" }}>Top Expenditures</p>
              <div className="space-y-2">
                {result.topExpenses!.map((e, i) => (
                  <div key={i} className="flex items-center justify-between gap-4 py-1.5 border-b border-black/5 last:border-0">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{e.payee}</p>
                      {e.purpose && <p className="text-[11px]" style={{ color: "var(--muted)" }}>{e.purpose}</p>}
                    </div>
                    <p className="text-sm font-bold flex-shrink-0" style={{ color: "#b45309" }}>{fmt$(e.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Portal Search ───────────────────────────────────────────────────────── */
type PortalChoice = "harris-county" | "houston" | "both";
type SearchState  = "idle" | "loading" | "done" | "no_results" | "error";

interface PortalFiling { date: string; label: string; url: string; portal: string; }

function PortalSearch() {
  const [name,    setName]    = useState("");
  const [portal,  setPortal]  = useState<PortalChoice>("both");
  const [state,   setState]   = useState<SearchState>("idle");
  const [filings, setFilings] = useState<PortalFiling[]>([]);
  const [errMsg,  setErrMsg]  = useState("");

  // Inline scan state for a selected filing
  const [scanUrl,    setScanUrl]    = useState<string | null>(null);
  const [scanState,  setScanState]  = useState<ScanState>("idle");
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setState("loading");
    setFilings([]);
    setScanUrl(null);
    setScanResult(null);
    try {
      const res  = await fetch("/api/finance/portal-search", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name: name.trim(), portal }),
      });
      const data = await res.json();
      if (data.status === "error") { setState("error"); setErrMsg(data.error ?? "Unknown error"); return; }
      if (data.status === "no_results") { setState("no_results"); return; }
      setFilings(data.filings ?? []);
      setState("done");
    } catch (err) {
      setState("error");
      setErrMsg(String(err));
    }
  }

  async function scanFiling(url: string) {
    setScanUrl(url);
    setScanState("loading");
    setScanResult(null);
    try {
      const res  = await fetch("/api/finance/scan-pdf", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ url }),
      });
      const data = await res.json();
      if (data.status === "no_key") { setScanState("no_key"); return; }
      if (data.status === "error")  { setScanState("error");  setScanResult({ error: data.error }); return; }
      setScanState("done");
      setScanResult(data);
    } catch (err) {
      setScanState("error");
      setScanResult({ error: String(err) });
    }
  }

  const PORTAL_LABELS: Record<PortalChoice, string> = {
    "harris-county": "Harris County",
    "houston":       "City of Houston",
    "both":          "Both portals",
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-1" style={{ color: "var(--accent)", fontFamily: "var(--font-playfair), serif" }}>
          Portal Search
        </h2>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Search the Harris County or Houston COH campaign finance portals by name. No TEC number needed. Finds filings for any candidate, incumbent or challenger.
        </p>
      </div>

      {/* Search form */}
      <form onSubmit={search} className="space-y-3 mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Last, First : e.g. Ellis, Rodney  or  Letitia Plummer"
            className="flex-1 px-4 py-2.5 rounded-full text-sm bg-white ring-1 ring-[var(--border)] focus:ring-[var(--accent)] focus:outline-none"
            required
          />
          <button type="submit" disabled={state === "loading"}
            className="px-5 py-2.5 rounded-full text-sm font-bold text-white transition-all disabled:opacity-50"
            style={{ background: "var(--accent)" }}>
            {state === "loading" ? "Searching…" : "Search"}
          </button>
        </div>
        {/* Portal selector */}
        <div className="flex gap-2">
          {(["both", "harris-county", "houston"] as PortalChoice[]).map(p => (
            <button key={p} type="button" onClick={() => setPortal(p)}
              className="px-3 py-1 rounded-full text-xs font-semibold border transition-all"
              style={{
                background:   portal === p ? "var(--accent)" : "#fff",
                color:        portal === p ? "#fff" : "var(--muted)",
                borderColor:  portal === p ? "var(--accent)" : "var(--border)",
              }}>
              {PORTAL_LABELS[p]}
            </button>
          ))}
        </div>
        <p className="text-[11px]" style={{ color: "var(--muted)" }}>
          Harris County portal: county officials, JPs, constables. Houston COH portal: mayor, city council, controller.
        </p>
      </form>

      {/* States */}
      {state === "loading" && (
        <div className="flex items-center gap-3 py-10 justify-center">
          <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
          <p className="text-sm" style={{ color: "var(--muted)" }}>Searching portal…</p>
        </div>
      )}

      {state === "no_results" && (
        <div className="rounded-2xl p-8 text-center" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
          <p className="font-bold mb-1" style={{ color: "var(--accent)" }}>No filings found</p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Try a different spelling, or use "Last, First" format for Harris County searches.
          </p>
        </div>
      )}

      {state === "error" && (
        <div className="rounded-2xl p-6" style={{ background: "#fff7f7", border: "1px solid #fca5a5" }}>
          <p className="font-bold text-red-700 mb-1">Portal search failed</p>
          <p className="text-sm text-red-600">{errMsg}</p>
        </div>
      )}

      {/* Filing list */}
      {state === "done" && filings.length > 0 && (
        <div className="space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
            {filings.length} filing{filings.length !== 1 ? "s" : ""} found
          </p>
          <div className="rounded-2xl overflow-hidden ring-1 ring-[var(--border)]" style={{ background: "#fff" }}>
            {filings.map((f, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-b border-black/5 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>{f.label}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px]" style={{ color: "var(--muted)" }}>{f.date}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                      style={{ background: f.portal === "houston" ? "#ede9fe" : "#dbeafe", color: f.portal === "houston" ? "#6d28d9" : "#1d4ed8" }}>
                      {f.portal === "houston" ? "Houston COH" : "Harris County"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <a href={f.url} target="_blank" rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all hover:opacity-80"
                    style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
                    Open PDF
                  </a>
                  {f.url !== "https://cohweb.houstontx.gov/CampaignFinanceWeb/CFRwebsiteSimpleSearchResult.aspx" && (
                    <button onClick={() => scanFiling(f.url)}
                      disabled={scanState === "loading" && scanUrl === f.url}
                      className="px-3 py-1.5 rounded-full text-xs font-bold text-white transition-all disabled:opacity-50"
                      style={{ background: "var(--accent)" }}>
                      {scanState === "loading" && scanUrl === f.url ? "Scanning…" : "Scan with Claude"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Inline scan result */}
          {scanUrl && (
            <div className="mt-4">
              {scanState === "loading" && (
                <div className="flex items-center gap-3 py-8 justify-center rounded-2xl" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
                  <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
                  <p className="text-sm" style={{ color: "var(--muted)" }}>Reading the filing with Claude…</p>
                </div>
              )}
              {scanState === "no_key" && (
                <div className="rounded-2xl p-6 text-center" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
                  <p className="font-bold mb-1" style={{ color: "var(--accent)" }}>ANTHROPIC_API_KEY not set</p>
                  <p className="text-sm" style={{ color: "var(--muted)" }}>Add the key in Vercel environment variables to enable Claude PDF extraction.</p>
                </div>
              )}
              {scanState === "error" && (
                <div className="rounded-2xl p-6" style={{ background: "#fff7f7", border: "1px solid #fca5a5" }}>
                  <p className="font-bold text-red-700 mb-1">Scan error</p>
                  <p className="text-sm text-red-600">{scanResult?.error ?? "Unknown error"}</p>
                </div>
              )}
              {scanState === "done" && scanResult && (
                <div className="space-y-4">
                  <div className="rounded-2xl p-6 ring-1 ring-[var(--border)]" style={{ background: "#fff" }}>
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-1" style={{ color: "var(--muted)" }}>Extracted</p>
                    <h3 className="text-lg font-bold mb-0.5" style={{ color: "var(--accent)", fontFamily: "var(--font-playfair), serif" }}>
                      {scanResult.filer ?? "Unknown filer"}
                    </h3>
                    {scanResult.period && <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>{scanResult.period}</p>}
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "Raised",        val: scanResult.raised },
                        { label: "Spent",         val: scanResult.spent  },
                        { label: "Cash on Hand",  val: scanResult.cash   },
                      ].map(({ label, val }) => (
                        <div key={label} className="rounded-xl p-3" style={{ background: "rgba(37,99,168,0.06)" }}>
                          <p className="text-[9px] font-bold uppercase tracking-[0.15em] mb-1" style={{ color: "var(--muted)" }}>{label}</p>
                          <p className="text-lg font-bold" style={{ color: "var(--accent)", fontFamily: "var(--font-playfair), serif" }}>
                            {fmt$(val)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  {(scanResult.topContributors?.length ?? 0) > 0 && (
                    <div className="rounded-2xl p-6 ring-1 ring-[var(--border)]" style={{ background: "#fff" }}>
                      <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-4" style={{ color: "var(--muted)" }}>Top Contributors</p>
                      <div className="space-y-2">
                        {scanResult.topContributors!.map((c, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-4 py-1.5 border-b border-black/5 last:border-0">
                            <div>
                              <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{c.name}</p>
                              {c.city && <p className="text-[11px]" style={{ color: "var(--muted)" }}>{c.city}</p>}
                            </div>
                            <p className="text-sm font-bold flex-shrink-0" style={{ color: "var(--accent)" }}>{fmt$(c.amount)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {(scanResult.topExpenses?.length ?? 0) > 0 && (
                    <div className="rounded-2xl p-6 ring-1 ring-[var(--border)]" style={{ background: "#fff" }}>
                      <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-4" style={{ color: "var(--muted)" }}>Top Expenditures</p>
                      <div className="space-y-2">
                        {scanResult.topExpenses!.map((e, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-4 py-1.5 border-b border-black/5 last:border-0">
                            <div>
                              <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{e.payee}</p>
                              {e.purpose && <p className="text-[11px]" style={{ color: "var(--muted)" }}>{e.purpose}</p>}
                            </div>
                            <p className="text-sm font-bold flex-shrink-0" style={{ color: "#b45309" }}>{fmt$(e.amount)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const TABS: { id: Tab; label: string }[] = [
  { id: "leaderboard", label: "Leaderboard" },
  { id: "races", label: "2026 races" },
  { id: "story", label: "What it shows" },
  { id: "trail", label: "Donor trail" },
  { id: "portal", label: "Search county filings" },
  { id: "scanner", label: "Read a filing" },
];

const STATEWIDE = /governor|comptroller|attorney general|railroad|u\.s\. senat/i;

export default function WhereIsTheDough() {
  const [tab, setTab]     = useState<Tab>("leaderboard");
  const [level, setLevel] = useState<Level>("all");
  const [countyGroup, setCountyGroup] = useState<CountyGroup>("all");
  const [party, setParty] = useState<"all" | "D" | "R">("all");
  const [search, setSearch] = useState("");
  const [fecData, setFecData]   = useState<FECCandidate[]>([]);
  const [tecData, setTecData]   = useState<TECCandidate[]>([]);

  // Hydrate filters from the URL once, then mirror them back so shared links restore the view.
  useEffect(() => {
    const p = readUrlParams(["tab", "view", "level", "group", "party", "q"]);
    if (p.view === "races" || p.tab === "races") setTab("races");
    else if (TABS.some(t => t.id === p.tab)) setTab(p.tab as Tab);
    if (p.level && p.level in LEVEL_LABELS) setLevel(p.level as Level);
    if (p.group && p.group in COUNTY_GROUPS) setCountyGroup(p.group as CountyGroup);
    if (p.party === "D" || p.party === "R") setParty(p.party);
    if (p.q) setSearch(p.q);
  }, []);
  useUrlState(
    { tab, level, group: countyGroup, party, q: search },
    { tab: "leaderboard", level: "all", group: "all", party: "all", q: "" }
  );

  useEffect(() => {
    fetch("/api/finance/fec").then(r => r.json())
      .then(({ results }: { results: FECCandidate[] }) => setFecData(results.filter(r => r.dataSource === "live")))
      .catch(() => {});
    fetch("/api/finance/tec").then(r => r.json())
      .then(({ results }: { results: TECCandidate[] }) => setTecData(results.filter(r => r.dataSource === "live")))
      .catch(() => {});
  }, []);

  // Pipeline-merged static data with FEC + TEC live figures layered on top.
  const DATA: Candidate[] = FINANCE_DATA_MERGED.map(d => {
    if (d.level === "federal") {
      const live = fecData.find(l => l.name === d.name);
      if (!live || !(live.cash > 0)) return d;
      return { ...d, cash: live.cash, raised: live.raised, spent: live.spent, asOf: live.asOf };
    }
    if (d.level === "state") {
      const live = tecData.find(l => l.name === d.name);
      if (!live || !(live.cash > 0)) return d;
      return { ...d, cash: live.cash, asOf: live.asOf };
    }
    return d;
  });

  const moneyRaces = buildMoneyRaces(DATA);
  const withCash  = DATA.filter(d => d.cash > 0);
  const total     = withCash.reduce((s, d) => s + d.cash, 0);
  const biggest   = withCash.reduce<Candidate | null>((m, d) => (!m || d.cash > m.cash ? d : m), null);
  const localOnly = withCash.filter(d => d.level === "county" || d.level === "houston");
  const biggestLocal = localOnly.reduce<Candidate | null>((m, d) => (!m || d.cash > m.cash ? d : m), null);

  const filtered = DATA
    .filter(d => level === "all" || d.level === level)
    .filter(d => level !== "county" || countyGroup === "all" || countyGroupOf(d.office) === countyGroup)
    .filter(d => party === "all" || d.party === party)
    .filter(d => !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.office.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => ((a.cash > 0) !== (b.cash > 0) ? (a.cash > 0 ? -1 : 1) : b.cash - a.cash));
  const maxCash = filtered[0]?.cash || 1;
  const filteredCash = filtered.reduce((s, d) => s + d.cash, 0);

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="border-b" style={{ background: "var(--surface)", borderColor: "var(--rule)" }}>
        <div className="max-w-6xl mx-auto px-4 md:px-6 pt-10 pb-7">
          <p className="label" style={{ color: "var(--brand)" }}>Money · Campaign finance</p>
          <h1 className="serif text-[40px] md:text-[52px] leading-[1.03] tracking-[-0.02em] font-semibold mt-2" style={{ color: "var(--ink)" }}>Campaign cash</h1>
          <p className="mt-3 max-w-2xl text-[17px] leading-relaxed" style={{ color: "#3C443F" }}>
            What {withCash.length} Harris County officials and 2026 candidates report having in the bank, and what they raised and spent to get there.
            From FEC, Texas Ethics Commission, county and city filings.
          </p>
          <dl className="mt-7 grid grid-cols-2 md:grid-cols-4 gap-px rounded-lg overflow-hidden" style={{ background: "var(--rule)", border: "1px solid var(--rule)" }}>
            {[
              ["Cash on hand, all filers", fmt(total), `${withCash.length} filers with money reported`],
              ["Biggest war chest", biggest ? fmt(biggest.cash) : "None", biggest ? `${biggest.name}, ${biggest.office.replace(/\s*\(.*\)/, "")}` : ""],
              ["Biggest local war chest", biggestLocal ? fmt(biggestLocal.cash) : "None", biggestLocal ? `${biggestLocal.name}, ${biggestLocal.office.replace(/\s*\(.*\)/, "")}` : ""],
              ["2026 races with money on both sides", String(moneyRaces.races.filter(r => (r.d.fin?.cash ?? 0) > 0 && (r.r.fin?.cash ?? 0) > 0).length), `of ${moneyRaces.raceCount} with any filing`],
            ].map(([k, v, sub]) => (
              <div key={k} className="bg-white px-4 py-3.5">
                <dt className="label" style={{ color: "#6B726D", fontSize: 10 }}>{k}</dt>
                <dd className="text-[26px] font-extrabold num leading-tight mt-1" style={{ color: "var(--ink)" }}>{v}</dd>
                <dd className="text-[12px] mt-0.5 truncate" style={{ color: "#6B726D" }}>{sub}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-[12px] flex items-center gap-2" style={{ color: "#6B726D" }}>
            {(fecData.length > 0 || tecData.length > 0) && <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--brand)" }} aria-hidden />}
            {fecData.length > 0 || tecData.length > 0
              ? `Live from ${[fecData.length && "the FEC", tecData.length && "the TEC"].filter(Boolean).join(" and ")}; county and city figures from the latest filing period.`
              : "Figures from each filer's most recent report."}
          </p>
        </div>

        {/* Tabs */}
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <nav className="flex gap-6 overflow-x-auto -mb-px" style={{ scrollbarWidth: "none" }} aria-label="Views">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} aria-current={tab === t.id ? "page" : undefined}
                className="shrink-0 py-3 text-[14px] font-semibold border-b-[3px] transition-colors"
                style={{ borderColor: tab === t.id ? "var(--gold)" : "transparent", color: tab === t.id ? "var(--ink)" : "#5B635E" }}>
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">

        {/* ── LEADERBOARD ───────────────────────────────────────────── */}
        {tab === "leaderboard" && (
          <div>
            <div className="flex flex-col gap-3 mb-5">
              <div className="flex flex-wrap items-center gap-2">
                <Segmented value={level} onChange={v => { setLevel(v as Level); if (v !== "county") setCountyGroup("all"); }}
                  options={(Object.entries(LEVEL_LABELS) as [Level, string][]).map(([id, label]) => ({ id, label }))} />
                <Segmented value={party} onChange={v => setParty(v as "all" | "D" | "R")}
                  options={[{ id: "all", label: "Both parties" }, { id: "D", label: "Democrats" }, { id: "R", label: "Republicans" }]} />
                <label className="relative ml-auto w-full sm:w-64">
                  <span className="sr-only">Search by name or office</span>
                  <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search a name or office"
                    className="w-full rounded-md border px-3 py-2 text-[14px] outline-none focus:ring-2"
                    style={{ borderColor: "var(--rule-strong)", background: "var(--surface)", ["--tw-ring-color" as string]: "var(--brand)" }} />
                </label>
              </div>
              {level === "county" && (
                <div className="flex flex-wrap gap-1.5">
                  {(Object.entries(COUNTY_GROUPS) as [CountyGroup, string][]).map(([g, label]) => (
                    <button key={g} onClick={() => setCountyGroup(g)} aria-pressed={countyGroup === g}
                      className="px-3 py-1.5 rounded-full text-[13px] font-semibold border"
                      style={countyGroup === g ? { background: "var(--board)", color: "#fff", borderColor: "var(--board)" } : { background: "var(--surface)", color: "#3C443F", borderColor: "var(--rule-strong)" }}>
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-baseline justify-between mb-2">
              <p className="text-[14px]" style={{ color: "#4F5752" }}>
                <strong className="num" style={{ color: "var(--ink)" }}>{filtered.length}</strong> filers{" · "}<strong className="num" style={{ color: "var(--ink)" }}>{fmt(filteredCash)}</strong> on hand
              </p>
              <ShareButton toolName="Campaign cash" section="Money" light={false}
                description="Cash on hand for every Harris County official and 2026 candidate."
                summary={`${LEVEL_LABELS[level]}: ${filtered.length} filers, ${fmt(filteredCash)} cash on hand. Via The Harris County Project`}
                stats={[{ label: "Filers", value: String(filtered.length) }, { label: "Cash on hand", value: fmt(filteredCash) }]} />
            </div>

            <ol className="panel overflow-hidden divide-y" style={{ borderColor: "var(--rule)" }}>
              {filtered.length === 0 && (
                <li className="p-10 text-center">
                  <p className="serif text-[19px] font-semibold" style={{ color: "var(--ink)" }}>No filers match.</p>
                  <p className="text-[14px] mt-1" style={{ color: "#6B726D" }}>Try a last name or an office such as “commissioner”.</p>
                </li>
              )}
              {filtered.map((c, i) => {
                const raceKey = RACE_BY_NAME.get(c.name);
                const lean = raceKey ? MATCHUPS_2026[raceKey]?.lean : undefined;
                const asOf = formatAsOf(c.asOf);
                return (
                  <li key={`${c.name}-${i}`} className="grid grid-cols-[28px_40px_1fr_auto] md:grid-cols-[28px_40px_minmax(0,1fr)_minmax(0,220px)_120px] gap-x-3 items-center px-4 py-3" style={{ borderColor: "var(--rule)" }}>
                    <span className="text-[13px] font-bold num text-right" style={{ color: "#8A918C" }}>{c.cash > 0 ? i + 1 : ""}</span>
                    <Face name={c.name} party={c.party} photo={PHOTO_BY_NAME.get(c.name)} size={36} />
                    <div className="min-w-0">
                      <p className="text-[15px] font-bold leading-tight flex items-center gap-2 flex-wrap" style={{ color: "var(--ink)" }}>
                        {c.name}
                        {c.incumbent && <span className="label" style={{ fontSize: 9, color: "#6B726D" }}>Inc.</span>}
                        {raceKey && <Link href={raceHref(raceKey)} className="inline-flex"><RatingChip lean={lean} className="!text-[9px] !px-1.5 !py-[1px]" /></Link>}
                      </p>
                      <p className="text-[13px] truncate" style={{ color: "#5B635E" }}>{c.office}</p>
                      <p className="text-[12px] mt-0.5 flex flex-wrap gap-x-3 md:hidden num" style={{ color: "#8A918C" }}>
                        {c.raised != null && <span>Raised {fmt(c.raised)}</span>}
                        {c.spent != null && <span>Spent {fmt(c.spent)}</span>}
                      </p>
                    </div>
                    <div className="hidden md:block">
                      <div className="h-2 rounded-full" style={{ background: "#EEEFEA" }}>
                        <div className="h-2 rounded-full" style={{ width: `${Math.max((c.cash / maxCash) * 100, c.cash > 0 ? 1 : 0)}%`, background: PARTY[c.party].color }} />
                      </div>
                      <p className="text-[12px] mt-1 num" style={{ color: "#8A918C" }}>
                        {[c.raised != null && `Raised ${fmt(c.raised)}`, c.spent != null && `spent ${fmt(c.spent)}`, (c.loans ?? 0) > 0 && `loans ${fmt(c.loans!)}`].filter(Boolean).join(", ") || " "}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[17px] font-extrabold num" style={{ color: c.cash > 0 ? "var(--ink)" : "#A7ADA8" }}>{c.cash > 0 ? fmt(c.cash) : "Pending"}</p>
                      <p className="text-[11px]" style={{ color: "#8A918C" }}>
                        {asOf ?? ""}
                        {c.filingUrl && <> · <a href={c.filingUrl} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline" style={{ color: "var(--brand)" }}>Filing</a></>}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
            <p className="text-[12px] mt-3" style={{ color: "#8A918C" }}>
              Federal: FEC. State: Texas Ethics Commission semiannual reports. County: Harris County clerk filings. City: Houston city secretary filings. Cash on hand as of each filer’s most recent report. <Link href="/contact" className="link">Report an error</Link>.
            </p>
          </div>
        )}

        {/* ── 2026 RACES ────────────────────────────────────────────── */}
        {tab === "races" && (
          <div>
            <div className="max-w-3xl mb-6">
              <h2 className="serif text-[28px] font-semibold leading-tight" style={{ color: "var(--ink)" }}>
                {moneyRaces.raceCount} November matchups have money on file: {fmt(moneyRaces.totalTracked)} between them.
              </h2>
              <p className="text-[15px] mt-2" style={{ color: "#4F5752" }}>Each race, head to head by cash on hand. Bars scale to the larger war chest.</p>
            </div>
            <MoversStrip />
            <div className="space-y-10 mt-8">
              {moneyRaces.groups.map(({ group, races }) => (
                <section key={group}>
                  <div className="desk-head flex items-baseline gap-3 mb-4">
                    <h3 className="serif text-[22px] font-semibold" style={{ color: "var(--ink)" }}>{group === "JP" ? "Justice of the Peace" : group === "Legislature" ? "Texas Legislature" : group === "County" ? "Harris County" : group}</h3>
                    <span className="text-[13px]" style={{ color: "#6B726D" }}>{races.length} races · {fmt(races.reduce((s, r) => s + r.totalCash, 0))} combined</span>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    {races.map(rc => (
                      <Link key={rc.key} href={raceHref(rc.key)} className="group panel panel-hover p-4 block" style={{ borderTop: `4px solid ${rc.lean ? RATING[rc.lean].color : "#C9CCC4"}` }}>
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <p className="serif text-[17px] font-semibold leading-snug group-hover:underline decoration-1 underline-offset-4" style={{ color: "var(--ink)" }}>{rc.office}</p>
                          <RatingChip lean={rc.lean} />
                        </div>
                        <CashDuel d={rc.d.fin?.cash ?? 0} r={rc.r.fin?.cash ?? 0} dName={rc.d.name} rName={rc.r.name} />
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>
            {moneyRaces.noFilingCount > 0 && (
              <p className="text-[12px] mt-8" style={{ color: "#8A918C" }}>{moneyRaces.noFilingCount} set races have no filing on record for either candidate and are not shown.</p>
            )}
          </div>
        )}

        {/* ── WHAT IT SHOWS (computed from the data on screen) ───────── */}
        {tab === "story" && <Findings data={DATA} moneyRaces={moneyRaces} onLeaderboard={() => setTab("leaderboard")} />}

        {tab === "trail" && (
          <div className="space-y-8">
            <MoneyTrailView />
            <TerrainReport types={["money"]} compact />
          </div>
        )}
        {tab === "scanner" && <FinanceScanner />}
        {tab === "portal"  && <PortalSearch />}

        <RelatedTools current="/tools/where-is-the-dough" />
      </div>
    </div>
  );
}

function Segmented({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { id: string; label: string }[] }) {
  return (
    <div className="inline-flex rounded-md p-0.5 border overflow-x-auto max-w-full" style={{ borderColor: "var(--rule-strong)", background: "var(--surface)" }}>
      {options.map(o => (
        <button key={o.id} onClick={() => onChange(o.id)} aria-pressed={value === o.id}
          className="shrink-0 px-3 py-1.5 text-[13px] font-semibold rounded-[5px] transition-colors"
          style={value === o.id ? { background: "var(--ink)", color: "#fff" } : { color: "#3C443F" }}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* Every sentence here is computed from the filings on screen, so it can never
   go stale the way hand-written copy does. A finding renders only when its
   inputs exist. */
function Findings({ data, moneyRaces, onLeaderboard }: { data: Candidate[]; moneyRaces: ReturnType<typeof buildMoneyRaces>; onLeaderboard: () => void }) {
  const by = (n: string) => data.find(d => d.name === n);
  const ratio = (a: number, b: number) => (b > 0 ? a / b : null);
  const times = (x: number) => (x >= 10 ? `${Math.round(x)} times` : `${x.toFixed(1)} times`);
  const out: { k: string; stat: string; head: string; body: string; href: string; cta: string }[] = [];

  // 1. Top of the ticket
  const sen = moneyRaces.races.find(r => r.key === "US-Senate");
  if (sen?.d.fin && sen.r.fin) {
    const [lead, trail] = sen.d.fin.cash >= sen.r.fin.cash ? [sen.d, sen.r] : [sen.r, sen.d];
    const x = ratio(lead.fin!.cash, trail.fin!.cash);
    if (x) out.push({
      k: "U.S. Senate", stat: fmt(lead.fin!.cash),
      head: `${lead.name} has ${times(x)} as much cash as ${trail.name}.`,
      body: `${lead.name} reports ${fmt(lead.fin!.cash)} on hand to ${trail.name}'s ${fmt(trail.fin!.cash)}${lead.fin!.raised ? `, after raising ${fmt(lead.fin!.raised)}` : ""}.`,
      href: raceHref("US-Senate"), cta: "The Senate race",
    });
  }

  // 2. Commissioners Court
  const court = data.filter(d => /^Commissioner PCT \d$/.test(d.office) && d.cash > 0).sort((a, b) => b.cash - a.cash);
  if (court.length >= 3) {
    const [top, ...rest] = court;
    const restSum = rest.reduce((s, d) => s + d.cash, 0);
    out.push({
      k: "Commissioners Court", stat: fmt(top.cash),
      head: top.cash > restSum
        ? `${top.name} holds more than the other ${rest.length} commissioners combined.`
        : `${top.name} leads Commissioners Court in cash on hand.`,
      body: `${court.map(c => `${c.name.split(" ").slice(-1)[0]} ${fmt(c.cash)}`).join(", ")}.`,
      href: "/tools/where-is-the-dough?level=county&group=commissioners", cta: "Commissioners' filings",
    });
  }

  // 3. Biggest gap in a race that's actually in play
  const gaps = moneyRaces.races
    .filter(r => r.lean && RATING[r.lean].competitive && (r.d.fin?.cash ?? 0) > 0 && (r.r.fin?.cash ?? 0) > 0)
    .map(r => {
      const d = r.d.fin!.cash, rr = r.r.fin!.cash;
      return { r, x: Math.max(d, rr) / Math.min(d, rr), lead: d >= rr ? r.d : r.r, trail: d >= rr ? r.r : r.d };
    })
    .sort((a, b) => b.x - a.x);
  if (gaps[0]) {
    const g = gaps[0];
    out.push({
      k: "Competitive races", stat: `${times(g.x).replace(" times", "x")}`,
      head: `The widest cash gap in a competitive race is ${g.r.office}.`,
      body: `${g.lead.name} reports ${fmt(g.lead.fin!.cash)} to ${g.trail.name}'s ${fmt(g.trail.fin!.cash)} in a race the desk rates ${RATING[g.r.lean!].long.toLowerCase()}.`,
      href: raceHref(g.r.key), cta: "See the race",
    });
  }

  // 4. Party split, with and without statewide war chests
  const cash = data.filter(d => d.cash > 0);
  const share = (rows: Candidate[]) => {
    const dd = rows.filter(r => r.party === "D").reduce((s, r) => s + r.cash, 0);
    const t = rows.reduce((s, r) => s + r.cash, 0);
    return t > 0 ? Math.round((dd / t) * 100) : null;
  };
  const all = share(cash), local = share(cash.filter(d => !STATEWIDE.test(d.office)));
  if (all != null && local != null) {
    const topR = cash.filter(d => STATEWIDE.test(d.office)).sort((a, b) => b.cash - a.cash)[0];
    out.push({
      k: "The party split", stat: `${local}% D`,
      head: `Set aside statewide war chests and Democrats hold ${local}% of tracked cash.`,
      body: `Counting everyone, Democrats hold ${all}%.${topR ? ` Statewide accounts like ${topR.name}'s ${fmt(topR.cash)} tilt the overall total.` : ""}`,
      href: "/tools/where-is-the-dough?level=county", cta: "County filers only",
    });
  }

  // 5. Races where one side is broke
  const broke = moneyRaces.races.filter(r => (r.d.fin?.cash ?? 0) === 0 || (r.r.fin?.cash ?? 0) === 0);
  if (broke.length) out.push({
    k: "Unfunded challengers", stat: String(broke.length),
    head: `In ${broke.length} of ${moneyRaces.raceCount} set races, one candidate reports no cash at all.`,
    body: "A candidate with no money on hand has little way to reach voters beyond the party label on the ballot.",
    href: "/tools/where-is-the-dough?tab=races", cta: "All 2026 duels",
  });

  return (
    <div>
      <h2 className="serif text-[28px] font-semibold leading-tight max-w-3xl" style={{ color: "var(--ink)" }}>What the filings show</h2>
      <p className="text-[15px] mt-2 max-w-2xl" style={{ color: "#4F5752" }}>Each finding below is calculated from the current filings, so it updates when new reports land.</p>
      <div className="mt-6 divide-y border-t border-b" style={{ borderColor: "var(--rule)" }}>
        {out.map(f => (
          <article key={f.k} className="grid md:grid-cols-[180px_1fr] gap-4 md:gap-8 py-6" style={{ borderColor: "var(--rule)" }}>
            <div>
              <p className="label" style={{ color: "var(--brand)" }}>{f.k}</p>
              <p className="text-[34px] font-extrabold num leading-none mt-2" style={{ color: "var(--ink)" }}>{f.stat}</p>
            </div>
            <div>
              <h3 className="serif text-[22px] font-semibold leading-snug" style={{ color: "var(--ink)" }}>{f.head}</h3>
              <p className="text-[15px] leading-relaxed mt-2" style={{ color: "#3C443F" }}>{f.body}</p>
              <Link href={f.href} className="inline-block mt-3 text-[14px] font-bold" style={{ color: "var(--brand)" }}>{f.cta} <span aria-hidden>→</span></Link>
            </div>
          </article>
        ))}
      </div>
      <button onClick={onLeaderboard} className="btn btn-ink mt-6">See every filer</button>
    </div>
  );
}
