"use client";

// 3D force-directed donor network (react-force-graph-3d).
// Nodes: officials (party color) + donors (amber = funds 2+ officials).
// Edge width = contribution size. Loaded only when the user opts into 3D.

import { useMemo, useRef, useEffect, useState } from "react";
import ForceGraph3D from "react-force-graph-3d";
import type { DonorNetwork } from "./MoneyTrail";

function partyColor(p: string) { return p === "D" ? "#2563a8" : p === "R" ? "#dc2626" : "#6b7280"; }

export default function DonorGraph3D({ net }: { net: DonorNetwork }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  useEffect(() => {
    const measure = () => setWidth(wrapRef.current?.clientWidth ?? 600);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const data = useMemo(() => {
    const shared = net.donors.filter(d => d.recipients.length >= 2);
    const singles = net.donors.filter(d => d.recipients.length === 1).slice(0, 150);
    const donors = [...shared, ...singles];
    const officialNames = new Set(
      donors.flatMap(d => d.recipients.map(r => r.official))
    );
    const nodes = [
      ...net.officials.filter(o => officialNames.has(o.name)).map(o => ({
        id: o.name, kind: "official" as const,
        label: `${o.name}: ${o.office}`, color: partyColor(o.party), val: 14,
      })),
      ...donors.map(d => ({
        id: `donor:${d.name}`, kind: "donor" as const,
        label: `${d.name}${d.employer ? ` (${d.employer})` : ""}: $${d.total.toLocaleString()} across ${d.recipients.length} official(s)`,
        color: d.recipients.length >= 2 ? "#d97706" : "#9ca3af",
        val: 2 + Math.sqrt(d.total) / 40,
      })),
    ];
    const links = donors.flatMap(d => d.recipients.map(r => ({
      source: `donor:${d.name}`, target: r.official,
      width: Math.max(0.4, Math.sqrt(r.amount / 4000)),
    })));
    return { nodes, links };
  }, [net]);

  return (
    <div ref={wrapRef} className="rounded-xl overflow-hidden" style={{ background: "#0a1623" }}>
      <ForceGraph3D
        graphData={data}
        width={width}
        height={430}
        backgroundColor="#0a1623"
        nodeLabel={(n: any) => n.label ?? ""}
        nodeColor={(n: any) => n.color ?? "#9ca3af"}
        nodeVal={(n: any) => n.val ?? 2}
        nodeOpacity={0.92}
        linkColor={() => "#7ea8d8"}
        linkOpacity={0.25}
        linkWidth={(l: any) => l.width ?? 0.5}
        showNavInfo={false}
        warmupTicks={60}
        cooldownTicks={120}
      />
      <p className="text-[10px] px-3 py-2" style={{ color: "rgba(255,255,255,0.4)" }}>
        Drag to orbit · scroll to zoom · hover any node. Blue/red spheres are officials;
        amber donors fund more than one.
      </p>
    </div>
  );
}
