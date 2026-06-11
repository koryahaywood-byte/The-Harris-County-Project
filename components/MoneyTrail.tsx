"use client";

// Money Trail — cross-official donor network.
// Data: public/data/donor-network.json (FEC itemized Schedule A, built by
// scripts/build-donor-network.mjs). Zero-dependency SVG network graph:
// officials anchored on a ring, donors positioned between the officials
// they fund, edge width = contribution size.
// (react-force-graph-3d upgrade slots in here once the dependency is approved.)

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";

const DonorGraph3D = dynamic(() => import("./DonorGraph3D"), {
  ssr: false,
  loading: () => <div className="skeleton h-[430px] rounded-xl" />,
});

const NAVY = "#1a3a5c";
const MUTED = "#9ca3af";

interface DonorRecipient { official: string; amount: number }
export interface Donor { name: string; employer: string | null; total: number; recipients: DonorRecipient[] }
export interface DonorNetwork {
  builtAt: string; coverage: string;
  officials: { name: string; office: string; party: string }[];
  donors: Donor[];
  sharedCount: number;
}

let cache: Promise<DonorNetwork> | null = null;
function loadNetwork(): Promise<DonorNetwork> {
  if (!cache) cache = fetch("/data/donor-network.json").then(r => r.json());
  return cache;
}

function fmtMoney(n: number) {
  return n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `$${Math.round(n / 1000)}K` : `$${n}`;
}

function partyColor(p: string) { return p === "D" ? "#2563a8" : p === "R" ? "#dc2626" : "#6b7280"; }

/* ── SVG network graph ──────────────────────────────────────────────────── */
function NetworkGraph({ net, donors, focus }: { net: DonorNetwork; donors: Donor[]; focus?: string }) {
  const layout = useMemo(() => {
    const W = 620, H = 380, cx = W / 2, cy = H / 2;
    const officials = net.officials.filter(o => donors.some(d => d.recipients.some(r => r.official === o.name)));
    const oPos = new Map(officials.map((o, i) => {
      const ang = (i / officials.length) * Math.PI * 2 - Math.PI / 2;
      return [o.name, { x: cx + Math.cos(ang) * (W / 2 - 90), y: cy + Math.sin(ang) * (H / 2 - 50), party: o.party, office: o.office }];
    }));
    const maxAmt = Math.max(...donors.map(d => d.total), 1);
    const dPos = donors.map((d, i) => {
      const anchors = d.recipients.map(r => oPos.get(r.official)).filter(Boolean) as { x: number; y: number }[];
      const ax = anchors.reduce((s, a) => s + a.x, 0) / (anchors.length || 1);
      const ay = anchors.reduce((s, a) => s + a.y, 0) / (anchors.length || 1);
      // deterministic jitter so single-recipient donors fan out
      const jang = (i * 2.399963) % (Math.PI * 2); // golden angle
      const jr = anchors.length > 1 ? 14 : 46 + (i % 5) * 9;
      return { donor: d, x: ax + Math.cos(jang) * jr, y: ay + Math.sin(jang) * jr, r: 3 + Math.sqrt(d.total / maxAmt) * 9 };
    });
    return { W, H, oPos, dPos };
  }, [net, donors]);

  return (
    <svg viewBox={`0 0 ${layout.W} ${layout.H}`} className="w-full rounded-xl" style={{ background: "#1a3a5c08" }}>
      {/* edges */}
      {layout.dPos.map(({ donor, x, y }) =>
        donor.recipients.map(r => {
          const o = layout.oPos.get(r.official);
          if (!o) return null;
          const isFocus = focus && (donor.name === focus);
          return <line key={`${donor.name}-${r.official}`} x1={x} y1={y} x2={o.x} y2={o.y}
            stroke={isFocus ? "#d97706" : NAVY} strokeOpacity={isFocus ? 0.8 : donor.recipients.length > 1 ? 0.3 : 0.1}
            strokeWidth={Math.max(0.6, Math.sqrt(r.amount / 8000))} />;
        })
      )}
      {/* donor nodes */}
      {layout.dPos.map(({ donor, x, y, r }) => (
        <circle key={donor.name} cx={x} cy={y} r={r}
          fill={donor.recipients.length > 1 ? "#d97706" : "#9ca3af"}
          fillOpacity={focus ? (donor.name === focus ? 1 : 0.25) : 0.75}>
          <title>{`${donor.name}${donor.employer ? ` (${donor.employer})` : ""} — ${fmtMoney(donor.total)} across ${donor.recipients.length} official(s)`}</title>
        </circle>
      ))}
      {/* official nodes */}
      {[...layout.oPos.entries()].map(([name, p]) => (
        <g key={name}>
          <circle cx={p.x} cy={p.y} r="14" fill={partyColor(p.party)} stroke="#fff" strokeWidth="2" />
          <text x={p.x} y={p.y + 27} textAnchor="middle" fontSize="10" fontWeight="700" fill={NAVY}>{name.split(" ").pop()}</text>
        </g>
      ))}
    </svg>
  );
}

/* ── Full tab view (Where the Money Resides) ────────────────────────────── */
export function MoneyTrailView() {
  const [net, setNet] = useState<DonorNetwork | null>(null);
  const [focus, setFocus] = useState<string | undefined>();
  const [mode, setMode] = useState<"2d" | "3d">("2d");
  const [err, setErr] = useState(false);
  useEffect(() => { loadNetwork().then(setNet).catch(() => setErr(true)); }, []);

  if (err) return null;
  if (!net) return <div className="skeleton h-64 rounded-[1.35rem]" />;

  const shared = net.donors.filter(d => d.recipients.length >= 2);
  const graphDonors = [...shared, ...net.donors.filter(d => d.recipients.length === 1).slice(0, 120)];

  return (
    <div className="space-y-5">
      <div className="hcp-card p-5 md:p-6">
        <div className="flex items-baseline justify-between flex-wrap gap-2 mb-1">
          <h3 className="text-lg font-bold" style={{ color: NAVY, fontFamily: "var(--font-playfair,serif)" }}>
            The Donor Network
          </h3>
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {(["2d", "3d"] as const).map(m => (
                <button key={m} onClick={() => setMode(m)}
                  className="text-[10px] font-bold px-2.5 py-1 rounded-full transition-all uppercase"
                  style={{
                    background: mode === m ? NAVY : "#fff", color: mode === m ? "#fff" : "#374151",
                    border: `1px solid ${mode === m ? NAVY : "#e5e7eb"}`,
                  }}>{m}</button>
              ))}
            </div>
            <p className="text-[10px]" style={{ color: MUTED }}>
              {net.donors.length} itemized donors · {shared.length} fund 2+ officials
            </p>
          </div>
        </div>
        <p className="text-xs leading-relaxed mb-4" style={{ color: "#374151" }}>
          Officials and the donors who fund them. <span style={{ color: "#d97706" }}>Amber</span> donors
          give to more than one tracked official — the connective tissue of Harris County money.
          Line weight is contribution size. Hover any node{mode === "3d" ? ", drag to orbit" : ""}.
        </p>
        {mode === "3d"
          ? <DonorGraph3D net={net} />
          : <NetworkGraph net={net} donors={graphDonors} focus={focus} />}
        <p className="text-[10px] mt-2 leading-relaxed" style={{ color: MUTED }}>{net.coverage}</p>
      </div>

      {shared.length > 0 && (
        <div className="hcp-card p-5 md:p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-3" style={{ color: MUTED }}>
            Donors funding multiple officials — click to trace
          </p>
          <div className="space-y-1.5">
            {shared.slice(0, 25).map(d => (
              <button key={d.name} onClick={() => setFocus(f => f === d.name ? undefined : d.name)}
                className="w-full text-left rounded-xl px-3.5 py-2.5 transition-all"
                style={{ background: focus === d.name ? "#d9770615" : "#00000004", border: `1px solid ${focus === d.name ? "#d9770640" : "transparent"}` }}>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-bold truncate" style={{ color: NAVY }}>{d.name}
                    {d.employer && <span className="font-normal text-[10px] ml-2" style={{ color: MUTED }}>{d.employer}</span>}
                  </p>
                  <p className="tnum text-sm font-bold flex-shrink-0" style={{ color: "#d97706" }}>{fmtMoney(d.total)}</p>
                </div>
                {focus === d.name && (
                  <div className="chip-row mt-2">
                    {d.recipients.sort((a, b) => b.amount - a.amount).map(r => (
                      <span key={r.official} className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                        style={{ background: "#1a3a5c10", color: NAVY }}>
                        {r.official} · {fmtMoney(r.amount)}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Profile Money-tab section ──────────────────────────────────────────── */
export function SharedDonors({ officialName }: { officialName: string }) {
  const [net, setNet] = useState<DonorNetwork | null>(null);
  useEffect(() => { loadNetwork().then(setNet).catch(() => {}); }, []);
  if (!net) return null;

  const mine = net.donors.filter(d => d.recipients.some(r => r.official === officialName));
  if (!mine.length) return null;
  const sharedMine = mine.filter(d => d.recipients.length >= 2);

  return (
    <div className="mt-6 rounded-[1.35rem] bg-white/70 ring-1 ring-black/8 p-[4px]">
      <div className="rounded-[1rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-1" style={{ color: MUTED }}>
          Money Trail · Top itemized donors
        </p>
        <p className="text-xs mb-3" style={{ color: "#374151" }}>
          {sharedMine.length
            ? `${sharedMine.length} of ${officialName.split(" ").pop()}'s top donors also fund other tracked officials.`
            : `Top itemized donors from the latest FEC filings.`}
        </p>
        <div className="space-y-1.5">
          {[...sharedMine, ...mine.filter(d => d.recipients.length === 1)].slice(0, 8).map(d => {
            const amt = d.recipients.find(r => r.official === officialName)?.amount ?? 0;
            const others = d.recipients.filter(r => r.official !== officialName);
            return (
              <div key={d.name} className="flex items-baseline justify-between gap-3 text-sm">
                <p className="truncate" style={{ color: NAVY }}>
                  <span className="font-bold">{d.name}</span>
                  {others.length > 0 && (
                    <span className="text-[10px] ml-2 font-bold" style={{ color: "#d97706" }}>
                      also funds {others.map(o => o.official.split(" ").pop()).join(", ")}
                    </span>
                  )}
                </p>
                <p className="tnum font-bold flex-shrink-0" style={{ color: NAVY }}>{fmtMoney(amt)}</p>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] mt-3" style={{ color: MUTED }}>
          FEC itemized receipts, 2026 cycle. Full network in{" "}
          <a href="/tools/where-is-the-dough?tab=trail" className="underline">Where the Money Resides</a>.
        </p>
      </div>
    </div>
  );
}
