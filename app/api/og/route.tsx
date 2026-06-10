import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

/* Dynamic OG card: /api/og?tool=...&section=...&desc=...&s=Label|Value&s=Label|Value */
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const tool = (p.get("tool") ?? "The Harris County Project").slice(0, 80);
  const section = (p.get("section") ?? "Civic Data").slice(0, 40);
  const desc = (p.get("desc") ?? "Civic data for Houston & Harris County.").slice(0, 200);
  const stats = p.getAll("s").slice(0, 3).map(s => {
    const [label, value] = s.split("|");
    return { label: (label ?? "").slice(0, 30), value: (value ?? "").slice(0, 20) };
  }).filter(s => s.label && s.value);

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
            the-harris-county-project.vercel.app
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 64, fontWeight: 700, color: "#ffffff", lineHeight: 1.1, marginBottom: 20, letterSpacing: "-0.01em" }}>
            {tool}
          </div>
          <div style={{ fontSize: 24, color: "rgba(255,255,255,0.7)", maxWidth: 760, lineHeight: 1.5 }}>
            {desc}
          </div>
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
