"use client";

// Dev pipeline: walks every politician, mounts the 3D figure, waits for the
// head texture + first frames, snapshots the WebGL canvas, and POSTs the PNG
// to /api/save-render -> public/renders/<slug>.png. The roster serves those
// static renders so it never has to run 95 WebGL contexts at once.

import { useEffect, useRef, useState } from "react";
import { POLITICIANS } from "@/lib/politicians";
import PlayerFigure3D from "@/components/PlayerFigure3D";

const SETTLE_MS = 2600; // texture fetch through /api/img-proxy + toon shading settle

export default function RenderFigures() {
  const [i, setI] = useState(0);
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const stageRef = useRef<HTMLDivElement>(null);
  const pol = POLITICIANS[i];

  useEffect(() => {
    if (!running || !pol) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      if (cancelled) return;
      const canvas = stageRef.current?.querySelector("canvas");
      if (!canvas) { setLog(l => [`${pol.slug}: no canvas`, ...l]); setI(n => n + 1); return; }
      try {
        const png = canvas.toDataURL("image/png");
        const res = await fetch("/api/save-render", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug: pol.slug, png }),
        });
        setLog(l => [`${pol.slug}: ${res.ok ? "saved" : "save failed " + res.status}`, ...l].slice(0, 12));
      } catch (e) {
        setLog(l => [`${pol.slug}: snapshot failed (${String(e).slice(0, 60)})`, ...l].slice(0, 12));
      }
      setI(n => n + 1);
    }, SETTLE_MS);
    return () => { cancelled = true; clearTimeout(t); };
  }, [running, i, pol]);

  const done = i >= POLITICIANS.length;

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-lg font-bold mb-1">Figure pre-render pipeline</h1>
      <p className="text-xs text-gray-500 mb-3">
        {done ? `Done: ${POLITICIANS.length} figures processed.` : `${i} / ${POLITICIANS.length}${pol ? ` · ${pol.name}` : ""}`}
      </p>
      {!running && !done && (
        <button onClick={() => setRunning(true)} className="mb-3 px-4 py-2 rounded-lg bg-[#1a3a5c] text-white text-sm font-semibold">
          Start
        </button>
      )}
      {/* Fixed stage so every snapshot has identical dimensions */}
      <div ref={stageRef} style={{ width: 360 }}>
        {running && pol && (
          <PlayerFigure3D key={pol.slug} slug={pol.slug} photo={pol.photo} party={pol.party} name={pol.name} />
        )}
      </div>
      <pre className="mt-3 text-[10px] text-gray-500 whitespace-pre-wrap">{log.join("\n")}</pre>
    </div>
  );
}
