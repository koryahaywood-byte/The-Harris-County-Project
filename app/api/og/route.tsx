import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { SITE_HOST } from "@/lib/site";

export const runtime = "edge";

/* Dynamic OG card. The image IS the data: someone seeing the preview in a
   group chat reads the result without clicking.

   Params:
   - tool, section, desc            — headline text
   - s=Label|Value  (×3)            — stat blocks
   - bar=DLabel|DPct|RLabel|RPct    — D-vs-R result bar (pcts are numbers 0-100)
   - duel=DName|DCash|RName|RCash   — cash duel bar (cash in raw dollars)
   - badge=Lean D                   — competitiveness chip next to the title
   bar/duel replace the desc block when present so the numbers stay big. */

const D_BLUE = "#3b82f6";
const R_RED = "#ef4444";

function fmtCash(n: number): string {
  if (!isFinite(n) || n <= 0) return "$0";
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${Math.round(n / 1e3)}K`;
  return `$${Math.round(n)}`;
}

function badgeColor(label: string): string {
  const l = label.toLowerCase();
  if (l.includes("toss")) return "#a855f7";
  if (l.endsWith("d")) return D_BLUE;
  if (l.endsWith("r")) return R_RED;
  return "#94a3b8";
}

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const tool = (p.get("tool") ?? "The Harris County Project").slice(0, 80);
  const section = (p.get("section") ?? "Civic Data").slice(0, 40);
  const desc = (p.get("desc") ?? "Civic data for Houston & Harris County.").slice(0, 200);
  const badge = p.get("badge")?.slice(0, 20);
  const stats = p.getAll("s").slice(0, 3).map(s => {
    const [label, value] = s.split("|");
    return { label: (label ?? "").slice(0, 30), value: (value ?? "").slice(0, 20) };
  }).filter(s => s.label && s.value);

  // Result bar: bar=Johnson (D)|61|Michna (R)|39
  let bar: { dLabel: string; dPct: number; rLabel: string; rPct: number } | null = null;
  const rawBar = p.get("bar");
  if (rawBar) {
    const [dLabel, dPctS, rLabel, rPctS] = rawBar.split("|");
    const dPct = Math.max(0, Math.min(100, parseFloat(dPctS ?? "")));
    const rPct = Math.max(0, Math.min(100, parseFloat(rPctS ?? "")));
    if (dLabel && rLabel && isFinite(dPct) && isFinite(rPct) && dPct + rPct > 0) {
      bar = { dLabel: dLabel.slice(0, 40), dPct, rLabel: rLabel.slice(0, 40), rPct };
    }
  }

  // Cash duel: duel=Fletcher|1750893|Hale|420000
  let duel: { dName: string; dCash: number; rName: string; rCash: number } | null = null;
  const rawDuel = p.get("duel");
  if (rawDuel) {
    const [dName, dCashS, rName, rCashS] = rawDuel.split("|");
    const dCash = parseFloat(dCashS ?? "");
    const rCash = parseFloat(rCashS ?? "");
    if (dName && rName && isFinite(dCash) && isFinite(rCash) && dCash + rCash > 0) {
      duel = { dName: dName.slice(0, 40), dCash, rName: rName.slice(0, 40), rCash };
    }
  }

  // Proportional widths with a floor so both labels stay readable.
  const split = (a: number, b: number) => {
    const total = a + b;
    const aw = total > 0 ? Math.round((a / total) * 100) : 50;
    return [Math.max(6, Math.min(94, aw)), 100 - Math.max(6, Math.min(94, aw))];
  };

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #1a3a5c 0%, #0f2540 55%, #1a3a5c 100%)",
          padding: "56px 72px", position: "relative",
        }}
      >
        <div style={{
          position: "absolute", inset: 0, display: "flex",
          background: "radial-gradient(ellipse 70% 80% at 80% 50%, rgba(37,99,168,0.45), transparent)",
        }} />
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(147,210,255,0.75)" }}>
            {`The Harris County Project · ${section}`}
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>
            {SITE_HOST}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 20 }}>
            <div style={{ fontSize: bar || duel ? 54 : 64, fontWeight: 700, color: "#ffffff", lineHeight: 1.1, letterSpacing: "-0.01em" }}>
              {tool}
            </div>
            {badge && (
              <div style={{
                display: "flex", fontSize: 22, fontWeight: 700, color: "#fff",
                background: badgeColor(badge), borderRadius: 10, padding: "8px 18px",
                textTransform: "uppercase", letterSpacing: "0.06em",
              }}>
                {badge}
              </div>
            )}
          </div>

          {!bar && !duel && (
            <div style={{ fontSize: 24, color: "rgba(255,255,255,0.7)", maxWidth: 760, lineHeight: 1.5 }}>
              {desc}
            </div>
          )}

          {bar && (() => {
            const [dw, rw] = split(bar.dPct, bar.rPct);
            return (
              <div style={{ display: "flex", flexDirection: "column", marginTop: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ display: "flex", fontSize: 26, fontWeight: 700, color: D_BLUE }}>
                    {`${bar.dLabel} · ${bar.dPct.toFixed(bar.dPct % 1 ? 1 : 0)}%`}
                  </div>
                  <div style={{ display: "flex", fontSize: 26, fontWeight: 700, color: R_RED }}>
                    {`${bar.rPct.toFixed(bar.rPct % 1 ? 1 : 0)}% · ${bar.rLabel}`}
                  </div>
                </div>
                <div style={{ display: "flex", width: "100%", height: 46, borderRadius: 12, overflow: "hidden" }}>
                  <div style={{ display: "flex", width: `${dw}%`, background: D_BLUE }} />
                  <div style={{ display: "flex", width: `${rw}%`, background: R_RED }} />
                </div>
              </div>
            );
          })()}

          {duel && (() => {
            const [dw, rw] = split(duel.dCash, duel.rCash);
            return (
              <div style={{ display: "flex", flexDirection: "column", marginTop: bar ? 26 : 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ display: "flex", fontSize: 24, fontWeight: 700, color: "#93c5fd" }}>
                    {`${duel.dName} · ${fmtCash(duel.dCash)} cash`}
                  </div>
                  <div style={{ display: "flex", fontSize: 24, fontWeight: 700, color: "#fca5a5" }}>
                    {`${fmtCash(duel.rCash)} cash · ${duel.rName}`}
                  </div>
                </div>
                <div style={{ display: "flex", width: "100%", height: 34, borderRadius: 10, overflow: "hidden", border: "1px solid rgba(255,255,255,0.18)" }}>
                  <div style={{ display: "flex", width: `${dw}%`, background: "rgba(59,130,246,0.75)" }} />
                  <div style={{ display: "flex", width: `${rw}%`, background: "rgba(239,68,68,0.75)" }} />
                </div>
              </div>
            );
          })()}

          {stats.length > 0 && (
            <div style={{ display: "flex", gap: 16, marginTop: 36 }}>
              {stats.map((s, i) => (
                <div key={i} style={{
                  display: "flex", flexDirection: "column",
                  background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.16)",
                  borderRadius: 14, padding: "16px 26px",
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(147,210,255,0.75)", marginBottom: 6 }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: 34, fontWeight: 700, color: "#fff" }}>{s.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          borderTop: "1px solid rgba(255,255,255,0.12)", paddingTop: 22,
        }}>
          <div style={{ fontSize: 18, color: "rgba(255,255,255,0.45)", fontWeight: 500 }}>
            {"Civic data for Houston & Harris County"}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "rgba(147,210,255,0.65)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Free · Open · Independent
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
