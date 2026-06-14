import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { POLITICIANS } from "@/lib/politicians";
import { computeStats } from "@/lib/politician-stats";
import { getFinanceByName, fmt } from "@/lib/campaign-finance";

export const runtime = "edge";

const GOLD = "#d4af37";
const GOLD_BRIGHT = "#fbbf24";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const pol = POLITICIANS.find(p => p.slug === slug);
  if (!pol) return new Response("Not found", { status: 404 });

  const origin = req.nextUrl.origin;
  const finance = getFinanceByName(pol.name);
  const stats = computeStats(pol, finance, 0, 0);
  const partyColor = pol.party === "D" ? "#3b82f6" : pol.party === "R" ? "#ef4444" : "#6b7280";
  const partyLabel = pol.party === "D" ? "Democrat" : pol.party === "R" ? "Republican" : "Nonpartisan";
  const yearsIn = pol.termStart ? 2026 - pol.termStart : null;
  const cash = finance?.cash ? fmt(finance.cash) : null;

  const photoUrl = pol.photo ? `${origin}${pol.photo}` : null;

  // Stat bar helper — returns a row of filled + empty blocks
  function StatBar({ value, label }: { value: number; label: string }) {
    const filled = Math.round((value / 99) * 10);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)" }}>
            {label}
          </span>
          <span style={{ fontSize: 14, fontWeight: 800, color: GOLD_BRIGHT }}>{value}</span>
        </div>
        <div style={{ display: "flex", gap: 3 }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 20,
                height: 5,
                borderRadius: 3,
                background: i < filled
                  ? `linear-gradient(90deg, ${GOLD}, ${GOLD_BRIGHT})`
                  : "rgba(255,255,255,0.08)",
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          background: "radial-gradient(ellipse 80% 90% at 30% 50%, #0f2540 0%, #060d16 60%, #020608 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* ambient gold glow behind card */}
        <div style={{
          position: "absolute",
          left: 90,
          top: "50%",
          width: 400,
          height: 600,
          transform: "translateY(-50%)",
          background: `radial-gradient(ellipse at center, ${GOLD}22 0%, transparent 70%)`,
          display: "flex",
        }} />

        {/* ── THE CARD ── centered left column */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          width: 330,
          marginLeft: 80,
          marginTop: 40,
          marginBottom: 40,
          borderRadius: 22,
          overflow: "hidden",
          background: "linear-gradient(150deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.045) 45%, rgba(212,175,55,0.07) 100%)",
          border: `1.5px solid ${GOLD}55`,
          boxShadow: `0 0 0 1px rgba(255,255,255,0.07), 0 32px 80px rgba(0,0,0,0.7), 0 0 60px ${GOLD}18`,
          padding: "20px 18px 16px",
          position: "relative",
        }}>
          {/* card top eyebrow */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>
              The Harris County Project
            </span>
            <span style={{
              fontSize: 8, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase",
              background: `${partyColor}28`, color: partyColor,
              border: `1px solid ${partyColor}60`,
              padding: "2px 8px", borderRadius: 20,
            }}>
              {partyLabel}
            </span>
          </div>

          {/* photo */}
          <div style={{ display: "flex", justifyContent: "center", marginTop: 14, position: "relative" }}>
            <div style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              overflow: "hidden",
              border: `2px solid ${GOLD}80`,
              boxShadow: `0 0 28px ${GOLD}35`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255,255,255,0.06)",
            }}>
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl} width={100} height={100} style={{ objectFit: "cover", objectPosition: "top" }} alt="" />
              ) : (
                <span style={{ fontSize: 28, fontWeight: 800, color: GOLD_BRIGHT }}>
                  {pol.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("")}
                </span>
              )}
            </div>
            {/* OVR badge */}
            <div style={{
              position: "absolute", bottom: -4, right: 96,
              width: 40, height: 40,
              borderRadius: 20,
              background: "rgba(6,13,22,0.95)",
              border: `1.5px solid ${GOLD_BRIGHT}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: GOLD_BRIGHT, lineHeight: 1 }}>{stats.ovr}</span>
              <span style={{ fontSize: 6, fontWeight: 700, letterSpacing: "0.18em", color: "rgba(255,255,255,0.45)" }}>OVR</span>
            </div>
          </div>

          {/* name + office */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 10 }}>
            <span style={{ fontSize: 19, fontWeight: 800, color: "#fff", textAlign: "center", lineHeight: 1.15 }}>
              {pol.name}
            </span>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 3, textAlign: "center" }}>
              {pol.office}
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, color: GOLD_BRIGHT, marginTop: 2, textAlign: "center" }}>
              {pol.district}
            </span>
          </div>

          {/* three stat cells */}
          <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
            {[
              { v: pol.termStart ? String(pol.termStart) : "—", l: "First elected" },
              { v: yearsIn !== null ? `${yearsIn} yrs` : "—", l: "In office" },
              { v: cash ?? "—", l: "Cash on hand" },
            ].map(({ v, l }) => (
              <div key={l} style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "8px 4px",
                borderRadius: 10,
                background: "rgba(255,255,255,0.05)",
              }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: l === "Cash on hand" ? GOLD_BRIGHT : "#fff" }}>{v}</span>
                <span style={{ fontSize: 7, fontWeight: 700, letterSpacing: "0.13em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{l}</span>
              </div>
            ))}
          </div>

          {/* bottom rule */}
          <div style={{ marginTop: 14, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 8, display: "flex", justifyContent: "center" }}>
            <span style={{ fontSize: 7, letterSpacing: "0.14em", color: "rgba(255,255,255,0.25)" }}>
              harriscounty.tools
            </span>
          </div>
        </div>

        {/* ── RIGHT PANEL — big name + stat bars ── */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          flex: 1,
          paddingLeft: 52,
          paddingRight: 72,
          gap: 0,
        }}>
          {/* eyebrow */}
          <div style={{
            fontSize: 12, fontWeight: 700, letterSpacing: "0.24em", textTransform: "uppercase",
            color: "#93d2ff", marginBottom: 14,
          }}>
            Official Card · The Harris County Project
          </div>

          {/* name */}
          <div style={{
            fontSize: 54,
            fontWeight: 900,
            color: "#fff",
            lineHeight: 1.0,
            marginBottom: 8,
          }}>
            {pol.name}
          </div>

          {/* office */}
          <div style={{ fontSize: 18, color: "rgba(255,255,255,0.55)", marginBottom: 4 }}>
            {pol.office}
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: GOLD_BRIGHT, marginBottom: 32 }}>
            {pol.district}
          </div>

          {/* OVR big number */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 24 }}>
            <span style={{ fontSize: 72, fontWeight: 900, color: GOLD_BRIGHT, lineHeight: 1 }}>{stats.ovr}</span>
            <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: "0.18em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>OVR</span>
          </div>

          {/* stat bars */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 440 }}>
            <StatBar value={stats.warChest} label="War Chest" />
            <StatBar value={stats.lawmaker} label="Lawmaker" />
            <StatBar value={stats.influence} label="Influence" />
            <StatBar value={stats.access} label="Access" />
            <StatBar value={stats.tenure} label="Tenure" />
          </div>
        </div>

        {/* party accent stripe — right edge */}
        <div style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: 6,
          background: `linear-gradient(180deg, transparent, ${partyColor}88, transparent)`,
          display: "flex",
        }} />
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
