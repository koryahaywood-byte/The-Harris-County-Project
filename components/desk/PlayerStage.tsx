"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { playerModelFor } from "@/lib/player-models";

const PlayerModel = dynamic(() => import("@/components/desk/PlayerModel"), { ssr: false });

/**
 * Profile portrait. Officials with a generated model get a full-body 3D figure on a
 * lit stage (photo shown until it loads, and one tap away after); everyone else
 * gets the photo card.
 */
export default function PlayerStage({ slug, name, party, photo }: {
  slug: string; name: string; party: "D" | "R" | "NP"; photo?: string;
}) {
  const model = playerModelFor(slug);
  const [view, setView] = useState<"3d" | "photo">(model ? "3d" : "photo");
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const has3d = !!model && !failed;
  const show3d = has3d && view === "3d";
  const last = (name.split(" ").at(-1) ?? name).toUpperCase();
  const first = name.split(" ").slice(0, -1).join(" ").toUpperCase();
  const plate = party === "D" ? "#60a5fa" : party === "R" ? "#f87171" : "#cbd5e1";

  return (
    <div>
      <div className="relative rounded-2xl overflow-hidden select-none"
        style={{
          width: "100%",
          aspectRatio: has3d ? "3/4" : "560/600",
          background: has3d
            ? "radial-gradient(ellipse 62% 46% at 50% 30%, rgba(255,246,222,0.10), transparent 72%), linear-gradient(to bottom, var(--board-2), var(--board) 78%)"
            : "var(--board-2)",
        }}>
        {/* Photo: the only view without a model, the placeholder while one loads */}
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={name}
            className="absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-700"
            style={{ opacity: show3d && ready ? 0 : 1 }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-6xl font-bold text-white/25"
            style={{ fontFamily: "var(--font-playfair), serif", opacity: show3d && ready ? 0 : 1 }}>
            {name.split(" ").map(w => w[0]).slice(0, 2).join("")}
          </div>
        )}

        {has3d && (
          <div className="absolute inset-0 transition-opacity duration-700"
            style={{ opacity: show3d && ready ? 1 : 0, pointerEvents: show3d ? "auto" : "none" }}>
            <PlayerModel src={model.file} party={party} yaw={model.yaw}
              onReady={() => setReady(true)} onError={() => setFailed(true)} />
          </div>
        )}

        {has3d && (
          <div className="absolute top-2.5 right-2.5 flex rounded-full p-0.5 text-[10px] font-bold uppercase tracking-[0.14em]"
            style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(6px)" }} role="group" aria-label="Portrait view">
            {(["3d", "photo"] as const).map(v => (
              <button key={v} type="button" onClick={() => setView(v)} aria-pressed={view === v}
                className="px-2.5 py-1 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#E2B13C]"
                style={view === v ? { background: "#E2B13C", color: "#0D2A21" } : { color: "rgba(255,255,255,0.7)" }}>
                {v === "3d" ? "3D" : "Photo"}
              </button>
            ))}
          </div>
        )}
        {has3d && show3d && !ready && (
          <span className="absolute top-3 left-3 label" style={{ color: "rgba(255,255,255,0.55)", fontSize: 9 }}>Loading 3D…</span>
        )}

        <div className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{ background: "linear-gradient(to top, rgba(13,42,33,0.95) 0%, rgba(13,42,33,0.5) 55%, transparent 100%)", paddingBottom: "0.6rem", paddingTop: "2.5rem" }}>
          <p className="text-center font-black tracking-[0.32em] leading-none" style={{ color: plate, fontSize: "clamp(14px, 3vw, 20px)" }}>{last}</p>
          <p className="text-center font-bold tracking-[0.22em] mt-0.5 opacity-55 text-white" style={{ fontSize: "clamp(8px, 1.5vw, 10px)" }}>{first}</p>
        </div>
      </div>
      {has3d && (
        <p className="mt-2 text-[11px] leading-snug text-center" style={{ color: "rgba(255,255,255,0.42)" }}>
          AI-generated 3D likeness, built from the official portrait.{show3d ? " Drag to turn." : ""}
        </p>
      )}
    </div>
  );
}
