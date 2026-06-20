"use client";

import dynamic from "next/dynamic";

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

export default function HeatCheck() {
  return (
    <div className="flex flex-col topo-light" style={{ minHeight: "calc(100dvh - 41px)", background: "var(--background)" }}>
      <div className="flex-1 overflow-auto">
        <HeatCheckHistoryMap />
      </div>
    </div>
  );
}
