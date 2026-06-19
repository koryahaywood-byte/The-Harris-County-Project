"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

const HeatCheckHistoryMap = dynamic(() => import("@/components/HeatCheckHistoryMap"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center" style={{ height: 620 }}>
      <div className="text-center">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent mx-auto mb-3 animate-spin"
          style={{ borderColor: "#2563a8", borderTopColor: "transparent" }} />
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "#9ca3af" }}>
          Loading map…
        </p>
      </div>
    </div>
  ),
});

const TABS = [
  { key: "2026", label: "2026 Detail", sub: "Primary & Runoff" },
  { key: "history", label: "Historical", sub: "2020 – 2024" },
];

export default function HeatCheck() {
  const [tab, setTab] = useState("2026");

  return (
    <div className="flex flex-col topo-light" style={{ minHeight: "calc(100dvh - 41px)", background: "var(--background)" }}>
      {/* Tab bar */}
      <div className="flex items-end gap-0 px-5 pt-5 border-b border-black/8"
        style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(12px)" }}>
        <div className="mr-auto pb-3">
          <h1 className="text-sm font-black uppercase tracking-[0.22em]" style={{ color: "var(--accent)" }}>
            Heat Check
          </h1>
          <p className="text-[10px]" style={{ color: "#9ca3af" }}>
            Harris County precinct-level results
          </p>
        </div>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="relative flex flex-col items-center px-5 pb-2.5 pt-1 transition-colors"
            style={{ borderBottom: tab === t.key ? "2px solid var(--accent)" : "2px solid transparent" }}>
            <span className="text-[12px] font-bold" style={{ color: tab === t.key ? "var(--accent)" : "#6b7280" }}>
              {t.label}
            </span>
            <span className="text-[9px] font-medium" style={{ color: tab === t.key ? "var(--accent)" : "#9ca3af" }}>
              {t.sub}
            </span>
          </button>
        ))}
      </div>

      {/* Panels */}
      <div className="flex-1 flex flex-col">
        {tab === "2026" ? (
          <iframe
            src="/heat-check.html"
            className="flex-1 w-full border-0"
            style={{ height: "calc(100dvh - 41px - 72px)" }}
            title="Heat Check — Harris County 2026 Primary"
            allowFullScreen
          />
        ) : (
          <div className="flex-1 overflow-auto">
            <HeatCheckHistoryMap />
          </div>
        )}
      </div>
    </div>
  );
}
