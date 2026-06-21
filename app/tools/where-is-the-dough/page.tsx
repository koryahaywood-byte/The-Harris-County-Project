"use client";
import { useState, useEffect } from "react";
import { FINANCE_DATA_MERGED, fmt, type CandidateFinance } from "@/lib/campaign-finance";
import ShareButton from "@/components/ShareButton";
import { MoneyTrailView } from "@/components/MoneyTrail";
import TerrainReport from "@/components/TerrainReport";
import { useUrlState, readUrlParams } from "@/lib/useUrlState";
import type { FECCandidate } from "@/app/api/finance/fec/route";
import type { TECCandidate } from "@/app/api/finance/tec/route";

type Candidate = CandidateFinance;

type Tab   = "story" | "leaderboard" | "trail" | "scanner" | "portal";
type Level = "all" | "federal" | "state" | "houston" | "county";
type CountyGroup = "all" | "commissioners" | "jp" | "courts" | "law" | "admin";

const LEVEL_LABELS: Record<Level, string> = {
  all: "All", federal: "Federal", state: "State", houston: "City of Houston", county: "County",
};

const COUNTY_GROUPS: Record<CountyGroup, string> = {
  all: "All County", commissioners: "Commissioners Court", jp: "Justices of the Peace",
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
  if (n == null) return "—";
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
          Paste a TEC or Harris County C/OH PDF URL — Claude reads it and extracts totals, top donors, and top expenses instantly.
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
          Search the Harris County or Houston COH campaign finance portals by name — no TEC number needed. Finds filings for any candidate, incumbent or challenger.
        </p>
      </div>

      {/* Search form */}
      <form onSubmit={search} className="space-y-3 mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Last, First  — e.g. Ellis, Rodney  or  Letitia Plummer"
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

export default function WhereIsTheDough() {
  const [tab, setTab]     = useState<Tab>("story");
  const [level, setLevel] = useState<Level>("all");
  const [countyGroup, setCountyGroup] = useState<CountyGroup>("all");
  const [party, setParty] = useState<"all" | "D" | "R">("all");
  const [search, setSearch] = useState("");
  const [fecData, setFecData]   = useState<FECCandidate[]>([]);
  const [tecData, setTecData]   = useState<TECCandidate[]>([]);
  const [fecFetchedAt, setFecFetchedAt] = useState<string>("");
  const [tecFetchedAt, setTecFetchedAt] = useState<string>("");

  // Hydrate filters from the URL once, then mirror them back so shared links restore the view
  useEffect(() => {
    const p = readUrlParams(["tab", "level", "group", "party", "q"]);
    if (p.tab === "story" || p.tab === "leaderboard" || p.tab === "trail" || p.tab === "scanner" || p.tab === "portal") setTab(p.tab as Tab);
    if (p.level && p.level in LEVEL_LABELS) setLevel(p.level as Level);
    if (p.group && p.group in COUNTY_GROUPS) setCountyGroup(p.group as CountyGroup);
    if (p.party === "D" || p.party === "R") setParty(p.party);
    if (p.q) setSearch(p.q);
  }, []);
  useUrlState(
    { tab, level, group: countyGroup, party, q: search },
    { tab: "story", level: "all", group: "all", party: "all", q: "" }
  );

  useEffect(() => {
    fetch("/api/finance/fec")
      .then(r => r.json())
      .then(({ results, fetchedAt }: { results: FECCandidate[]; fetchedAt: string }) => {
        setFecData(results.filter(r => r.dataSource === "live"));
        setFecFetchedAt(fetchedAt);
      })
      .catch(() => {});

    fetch("/api/finance/tec")
      .then(r => r.json())
      .then(({ results, fetchedAt }: { results: TECCandidate[]; fetchedAt: string }) => {
        setTecData(results.filter(r => r.dataSource === "live"));
        setTecFetchedAt(fetchedAt);
      })
      .catch(() => {});

  }, []);

  // Base is the pipeline-merged static data. Layer FEC + TEC live on top (both are
  // clean JSON APIs with no PDF scraping — fast and reliable).
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

  const withCash  = DATA.filter(d => d.cash > 0);
  const demTotal  = withCash.filter(d => d.party === "D").reduce((s, d) => s + d.cash, 0);
  const repTotal  = withCash.filter(d => d.party === "R").reduce((s, d) => s + d.cash, 0);
  const totalPool = demTotal + repTotal;

  const filtered = DATA
    .filter(d => level === "all" || d.level === level)
    .filter(d => level !== "county" || countyGroup === "all" || countyGroupOf(d.office) === countyGroup)
    .filter(d => party === "all" || d.party === party)
    .filter(d => !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.office.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      // Officials with no data sort to the bottom
      if ((a.cash > 0) !== (b.cash > 0)) return a.cash > 0 ? -1 : 1;
      return b.cash - a.cash;
    });

  const maxCash = filtered[0]?.cash ?? 1;

  const ellis    = DATA.find(d => d.name === "Rodney Ellis");
  const briones  = DATA.find(d => d.name === "Lesley Briones");
  const garcia   = DATA.find(d => d.name === "Adrian Garcia");
  const ramsey   = DATA.find(d => d.name === "Tom Ramsey");
  const cornyn   = DATA.find(d => d.name === "John Cornyn");
  const whitmire = DATA.find(d => d.name === "John Whitmire");
  const hollins  = DATA.find(d => d.name === "Chris Hollins");
  const pollard  = DATA.find(d => d.name === "Ed Pollard");

  return (
    <div className="bg-[var(--background)] min-h-screen">

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div className="bg-[var(--accent)] text-white px-6 py-16 md:py-24 relative overflow-hidden topo-dark">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_80%_50%,rgba(37,99,168,0.4),transparent)]"/>
        <div className="max-w-6xl mx-auto relative z-10">
          <p className="text-sky-300/80 text-[11px] font-bold uppercase tracking-[0.25em] mb-3">Money</p>
          <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-2" style={{ fontFamily: "var(--font-playfair), serif" }}>
            Where the Money Resides
          </h1>
          <p className="text-white/70 text-sm max-w-lg">
            Cash-on-hand for every Harris County official, candidate, and challenger. TEC &amp; FEC filings.
          </p>
          <ShareButton
            toolName="Where the Money Resides"
            section="Money"
            description="Cash-on-hand for every Harris County official, candidate, and challenger. TEC & FEC filings."
            summary={(() => {
              const scope = level === "all" ? "All levels"
                : level === "county" && countyGroup !== "all" ? `Harris County — ${COUNTY_GROUPS[countyGroup]}`
                : LEVEL_LABELS[level];
              const cash = filtered.reduce((s, d) => s + d.cash, 0);
              return `${scope}: ${filtered.length} filers, ${fmt(cash)} cash on hand — via The Harris County Project`;
            })()}
            stats={[
              { label: "Filers", value: String(filtered.length) },
              { label: "Cash on hand", value: fmt(filtered.reduce((s, d) => s + d.cash, 0)) },
              { label: "View", value: level === "county" && countyGroup !== "all" ? COUNTY_GROUPS[countyGroup] : LEVEL_LABELS[level] },
            ]}
          />
          {(fecData.length > 0 || tecData.length > 0) && (
            <p className="mt-2 text-[11px] text-sky-300/80 flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-sky-400 alive-pulse" />
              {[
                fecData.length > 0 ? "Federal: FEC" : null,
                tecData.length > 0 ? "State: TEC" : null,
              ].filter(Boolean).join(" · ")} &mdash; live data
              {fecFetchedAt && <span className="text-sky-300/50 ml-1">as of {new Date(fecFetchedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
            </p>
          )}
          <div className="mt-5 flex flex-wrap gap-3">
            {[
              { label: "Democrat Total",    val: fmt(demTotal),         color: "#93c5fd" },
              { label: "Republican Total",  val: fmt(repTotal),         color: "#fca5a5" },
              { label: "Biggest War Chest", val: ellis ? fmt(ellis.cash) : "—", color: "#fde68a" },
            ].map(({ label, val, color }) => (
              <div key={label} className="bg-white/10 ring-1 ring-white/20 rounded-2xl px-5 py-3">
                <p className="text-[9px] font-bold uppercase tracking-widest mb-0.5 text-white/50">{label}</p>
                <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-playfair), serif", color }}>{val}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab bar ───────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-[var(--background)]/90 backdrop-blur border-b border-[var(--border)] px-6 py-3">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center gap-3">
          {(["story","leaderboard","trail","portal","scanner"] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`text-xs font-bold uppercase tracking-[0.12em] px-4 py-2 rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                tab === t ? "bg-[var(--accent)] text-white" : "bg-white ring-1 ring-[var(--border)] text-[var(--muted)] hover:ring-[var(--accent-light)]"
              }`}>
              {t === "story" ? "The Story" : t === "trail" ? "Money Trail" : t === "scanner" ? "File Scanner" : t === "portal" ? "Portal Search" : "Leaderboard"}
            </button>
          ))}

          {tab === "leaderboard" && (
            <>
              <span className="text-[var(--border)] hidden sm:block">|</span>
              {(Object.entries(LEVEL_LABELS) as [Level, string][]).map(([l, label]) => (
                <button key={l} onClick={() => { setLevel(l); if (l !== "county") setCountyGroup("all"); }}
                  className={`text-xs font-bold uppercase tracking-[0.1em] px-3 py-1.5 rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                    level === l ? "bg-[var(--accent)] text-white" : "bg-white ring-1 ring-[var(--border)] text-[var(--muted)] hover:ring-[var(--accent-light)]"
                  }`}>
                  {label}
                </button>
              ))}
              <span className="text-[var(--border)] hidden sm:block">|</span>
              {([["all","Both"],["D","Dem"],["R","Rep"]] as [string, string][]).map(([v, lbl]) => (
                <button key={v} onClick={() => setParty(v as "all"|"D"|"R")}
                  className={`text-xs font-bold uppercase tracking-[0.1em] px-3 py-1.5 rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                    party === v
                      ? v === "D" ? "bg-blue-600 text-white" : v === "R" ? "bg-red-600 text-white" : "bg-[var(--accent)] text-white"
                      : "bg-white ring-1 ring-[var(--border)] text-[var(--muted)] hover:ring-[var(--accent-light)]"
                  }`}>
                  {lbl}
                </button>
              ))}
            </>
          )}
        </div>
        {tab === "leaderboard" && level === "county" && (
          <div className="max-w-6xl mx-auto flex flex-wrap items-center gap-2 mt-2.5">
            <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">Filter county:</span>
            {(Object.entries(COUNTY_GROUPS) as [CountyGroup, string][]).map(([g, label]) => (
              <button key={g} onClick={() => setCountyGroup(g)}
                className={`text-[10px] font-bold uppercase tracking-[0.08em] px-2.5 py-1 rounded-full transition-all duration-300 ${
                  countyGroup === g ? "bg-[var(--accent-light)] text-white" : "bg-white ring-1 ring-[var(--border)] text-[var(--muted)] hover:ring-[var(--accent-light)]"
                }`}>
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">

        {/* ── THE STORY ─────────────────────────────────────────────── */}
        {tab === "story" && (
          <div className="space-y-6">
            <div className="mb-8">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--muted)] mb-2">What the Money Says</p>
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--accent)] leading-tight max-w-2xl"
                style={{ fontFamily: "var(--font-playfair), serif" }}>
                Four money stories that tell you everything about 2026 Harris County politics.
              </h2>
            </div>

            {[
              {
                eyebrow: "County Power",
                color: "#2563eb",
                border: "#3b82f6",
                stat: ellis ? fmt(ellis.cash) : "—",
                statLabel: "Rodney Ellis · PCT 1",
                headline: "Rodney Ellis has more cash than every other commissioner combined.",
                body: `Commissioner Ellis's ${ellis ? fmt(ellis.cash) : "—"} war chest dwarfs his colleagues — Briones has ${briones ? fmt(briones.cash) : "—"}, Garcia ${garcia ? fmt(garcia.cash) : "—"}, Ramsey ${ramsey ? fmt(ramsey.cash) : "—"}. Ellis is up in 2026, and that pile signals to any challenger: this seat won't be cheap.`,
              },
              {
                eyebrow: "Senate Race",
                color: "#7c3aed",
                border: "#a78bfa",
                stat: cornyn ? fmt(cornyn.spent ?? 0) : "—",
                statLabel: "Cornyn · spent, and lost",
                headline: "Cornyn spent $15.8M defending his seat — and lost the runoff anyway.",
                body: `Four-term Senator John Cornyn burned ${cornyn ? fmt(cornyn.spent ?? 0) : "—"} and still lost the Republican nomination to Ken Paxton in May. November is now an open brawl: James Talarico (D) vs Ken Paxton (R) — the first Texas Senate race in 24 years without an incumbent on the ballot.`,
              },
              {
                eyebrow: "City Hall",
                color: "#059669",
                border: "#10b981",
                stat: whitmire ? fmt(whitmire.cash) : "—",
                statLabel: "Mayor Whitmire",
                headline: "The Mayor isn't up until 2027 — and he's sitting on nearly $3M.",
                body: `John Whitmire holds ${whitmire ? fmt(whitmire.cash) : "—"} with no election until 2027. City Controller Chris Hollins — widely viewed as a likely mayoral candidate — has banked ${hollins ? fmt(hollins.cash) : "—"}. Council member Ed Pollard holds ${pollard ? fmt(pollard.cash) : "—"}, the most of any council seat, and is also seen as a future citywide contender.`,
              },
            ].map(({ eyebrow, color, border, stat, statLabel, headline, body }) => (
              <div key={eyebrow} className="rounded-[1.75rem] bg-white/60 ring-1 ring-black/8 p-[6px] card-lift">
                <div className="rounded-[1.35rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] px-8 py-8"
                  style={{ borderLeft: `4px solid ${border}` }}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] mb-3" style={{ color }}>{eyebrow}</p>
                  <div className="flex flex-col md:flex-row md:items-start gap-6">
                    <div className="md:w-36 flex-shrink-0 text-center md:text-left">
                      <p className="text-4xl md:text-5xl font-bold leading-none" style={{ color, fontFamily: "var(--font-playfair), serif" }}>{stat}</p>
                      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--muted)] mt-1">{statLabel}</p>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-[var(--accent)] mb-2 leading-snug" style={{ fontFamily: "var(--font-playfair), serif" }}>{headline}</h3>
                      <p className="text-sm text-[var(--muted)] leading-relaxed">{body}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Monarch party split bar */}
            <div className="rounded-[1.75rem] bg-white/60 ring-1 ring-black/8 p-[6px]">
              <div className="rounded-[1.35rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] px-8 py-7">
                <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] mb-5">The Bank Split</p>
                {/* Labels */}
                <div className="flex justify-between items-end mb-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-600 mb-0.5">Democrats</p>
                    <p className="text-3xl font-bold text-blue-700"
                      style={{ fontFamily: "var(--font-playfair), serif" }}>{fmt(demTotal)}</p>
                    <p className="text-[10px] text-blue-500 mt-0.5">{((demTotal / totalPool) * 100).toFixed(0)}% of tracked cash</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-red-600 mb-0.5">Republicans</p>
                    <p className="text-3xl font-bold text-red-700"
                      style={{ fontFamily: "var(--font-playfair), serif" }}>{fmt(repTotal)}</p>
                    <p className="text-[10px] text-red-500 mt-0.5">{((repTotal / totalPool) * 100).toFixed(0)}% of tracked cash</p>
                  </div>
                </div>
                {/* Single split pill bar */}
                <div className="h-6 rounded-full overflow-hidden flex">
                  <div className="h-full bg-gradient-to-r from-blue-600 to-blue-500 transition-all duration-1000 rounded-l-full"
                    style={{ width: `${(demTotal / totalPool) * 100}%` }}/>
                  <div className="h-full bg-gradient-to-r from-red-500 to-red-600 flex-1 transition-all duration-1000 rounded-r-full"/>
                </div>
                <p className="text-[10px] text-[var(--muted)] mt-4">
                  Note: Abbott&rsquo;s $105M war chest dominates the Republican total. County-level Republican candidates hold substantially less.
                </p>
              </div>
            </div>

            <div className="flex justify-center pt-2">
              <button onClick={() => setTab("leaderboard")}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--accent)] text-white text-sm font-bold hover:bg-[var(--accent-light)] transition-colors">
                See Full Leaderboard
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            </div>
            <p className="text-xs text-[var(--muted)] text-center">Source: Texas Ethics Commission (TEC) semi-annual reports · FEC filings. Data as of Jan–Apr 2026.</p>
          </div>
        )}

        {/* ── MONEY TRAIL ───────────────────────────────────────────── */}
        {tab === "trail" && (
          <div className="space-y-8">
            <MoneyTrailView />
            <TerrainReport types={["money"]} compact />
          </div>
        )}

        {/* ── FILE SCANNER ──────────────────────────────────────────── */}
        {tab === "scanner" && <FinanceScanner />}
        {tab === "portal"  && <PortalSearch />}

        {/* ── LEADERBOARD ───────────────────────────────────────────── */}
        {tab === "leaderboard" && (
          <div>
            {/* Head-to-head duel bars — only when level filter would show both parties */}
            {party === "all" && !search && (() => {
              const levelData = DATA.filter(d => level === "all" || d.level === level)
                .filter(d => level !== "county" || countyGroup === "all" || countyGroupOf(d.office) === countyGroup);
              // Group by office, find matched pairs
              const byOffice = new Map<string, { d?: Candidate; r?: Candidate }>();
              for (const c of levelData) {
                const key = c.office.toLowerCase().trim();
                const entry = byOffice.get(key) ?? {};
                if (c.party === "D") entry.d = c;
                if (c.party === "R") entry.r = c;
                byOffice.set(key, entry);
              }
              const pairs = [...byOffice.values()].filter(p => p.d && p.r && (p.d.cash > 0 || p.r.cash > 0));
              if (pairs.length === 0) return null;
              pairs.sort((a, b) => (b.d!.cash + b.r!.cash) - (a.d!.cash + a.r!.cash));
              return (
                <div className="mb-6 rounded-[1.75rem] bg-white/60 ring-1 ring-black/8 p-[6px]">
                  <div className="rounded-[1.35rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] p-4">
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-4" style={{ color: "#9ca3af" }}>Head-to-head — cash on hand</p>
                    <div className="space-y-3">
                      {pairs.slice(0, 8).map((p, i) => {
                        const d = p.d!, r = p.r!;
                        const total = d.cash + r.cash || 1;
                        const dPct = Math.round(d.cash / total * 100);
                        return (
                          <div key={i}>
                            <p className="text-[10px] font-semibold mb-1 truncate" style={{ color: "#6b7280" }}>{d.office}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold w-24 truncate" style={{ color: "#2563a8" }}>{d.name.split(" ").pop()}</span>
                              <div className="flex-1 h-2 rounded-full overflow-hidden flex" style={{ background: "#e5e7eb" }}>
                                <div className="h-full" style={{ width: `${dPct}%`, background: "#2563a8" }} />
                                <div className="h-full" style={{ width: `${100 - dPct}%`, background: "#dc2626" }} />
                              </div>
                              <span className="text-[10px] font-bold w-24 truncate text-right" style={{ color: "#dc2626" }}>{r.name.split(" ").pop()}</span>
                            </div>
                            <div className="flex justify-between text-[9px] mt-0.5 px-0">
                              <span style={{ color: "#2563a8" }}>{fmt(d.cash)}</span>
                              <span style={{ color: "#dc2626" }}>{fmt(r.cash)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="mb-6">
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or office…"
                className="w-full max-w-sm px-4 py-2.5 rounded-full bg-white ring-1 ring-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:ring-[var(--accent)] focus:outline-none transition-all duration-300"
              />
            </div>

            <div className="rounded-[1.75rem] bg-white/60 ring-1 ring-black/8 p-[6px]">
              <div className="rounded-[1.35rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-2.5 border-b border-[var(--border)] bg-[var(--background)]">
                  <span className="w-8 flex-shrink-0 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] text-center">#</span>
                  <span className="flex-1 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Name / Office</span>
                  <span className="w-28 flex-shrink-0 hidden sm:block text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Cash Bar</span>
                  <span className="w-24 text-right flex-shrink-0 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Cash on Hand</span>
                  <span className="w-20 text-right flex-shrink-0 hidden md:block text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">As of</span>
                </div>

                {filtered.length === 0 ? (
                  countyGroup === "courts" ? (
                    <p className="p-10 text-center text-[var(--muted)] text-sm">
                      County court judges (Criminal Courts at Law, Civil Courts at Law, Probate) are being added —
                      their filings exist in the county portal and the roster is being verified. Justices of the Peace are under their own filter.
                    </p>
                  ) : (
                    <p className="p-10 text-center text-[var(--muted)] text-sm">No results found.</p>
                  )
                ) : filtered.map((c, i) => {
                  const isD = c.party === "D";
                  const pct = Math.min((c.cash / maxCash) * 100, 100);
                  const initials = c.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
                  const rankColor = i === 0 ? "text-amber-500" : i === 1 ? "text-gray-400" : i === 2 ? "text-amber-700" : "text-[var(--muted)]";
                  return (
                    <div key={`${c.name}-${i}`}
                      className="flex items-center gap-4 px-5 py-4 border-b border-[var(--border)] last:border-0 hover:bg-black/[0.018] transition-colors duration-200">
                      {/* Rank */}
                      <span className={`w-6 flex-shrink-0 text-center text-xs font-bold ${rankColor}`}>{c.cash > 0 ? i + 1 : "—"}</span>
                      {/* Avatar */}
                      <div
                        className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[11px] font-bold"
                        style={{ background: isD ? "#3b82f6" : "#ef4444" }}>
                        {initials}
                      </div>
                      {/* Name + bar */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                          <span className="font-semibold text-sm text-[var(--foreground)] leading-tight">{c.name}</span>
                          <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full ${isD ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}`}>{c.party}</span>
                          {c.incumbent && <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Inc</span>}
                        </div>
                        <p className="text-[10px] text-[var(--muted)] truncate mb-1">{c.office}</p>
                        {(c.raised != null || c.spent != null || c.loans != null) && (
                          <p className="tnum text-[10px] mb-2 flex flex-wrap gap-x-3" style={{ color: "#9ca3af" }}>
                            {c.raised != null && <span>Raised <strong style={{ color: "#4b5563" }}>{fmt(c.raised)}</strong></span>}
                            {c.spent != null && <span>Spent <strong style={{ color: "#4b5563" }}>{fmt(c.spent)}</strong></span>}
                            {c.loans != null && c.loans > 0 && <span>Loans <strong style={{ color: "#b45309" }}>{fmt(c.loans)}</strong></span>}
                          </p>
                        )}
                        {/* Proportional fill bar */}
                        <div className="h-[5px] bg-black/[0.06] rounded-full overflow-hidden max-w-xs hidden sm:block">
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, background: isD ? "#2563a8" : "#dc2626" }}/>
                        </div>
                      </div>
                      {/* Cash + date */}
                      <div className="flex-shrink-0 text-right">
                        {c.cash > 0 ? (
                          <>
                            <p className={`tnum text-xl font-bold ${isD ? "text-blue-700" : "text-red-700"}`}
                              style={{ fontFamily: "var(--font-playfair), serif" }}>{fmt(c.cash)}</p>
                            <p className="text-[10px] text-[var(--muted)] mt-0.5 hidden md:block">cash on hand · {c.asOf}</p>
                          </>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-gray-100 text-gray-400">Pending</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <p className="text-xs text-[var(--muted)] mt-4 text-center">
              Federal: FEC API (live). State: TEC semi-annual report (live). County: Harris County Clerk filings. City: Houston COH filings. Cash on hand as of most recent filing.{" "}
              <a href="/contact" className="text-[var(--accent-light)] underline underline-offset-2">Report an error →</a>
            </p>
          </div>
        )}

        {/* See also */}
        <div className="mt-10 pt-6 border-t border-black/8">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: "#9ca3af" }}>Go deeper</p>
          <div className="flex flex-wrap gap-2">
            {[
              { href: "/tools/districts",    label: "District vote history →" },
              { href: "/tools/heat-check",   label: "Precinct heat map →" },
              { href: "/my-officials",       label: "Who represents me →" },
              { href: "/tools/ballot-2026",  label: "2026 ballot →" },
            ].map(l => (
              <a key={l.href} href={l.href}
                className="text-[11px] font-semibold px-3 py-1.5 rounded-full border transition-colors hover:bg-[#1a3a5c] hover:text-white hover:border-[#1a3a5c]"
                style={{ color: "#374151", borderColor: "#e5e7eb", background: "#fff" }}>
                {l.label}
              </a>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
