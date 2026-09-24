"use client";

// Harris County in three dimensions: every 2024 precinct raised by the votes
// it cast and colored by who won it. Plain three.js (react-three-fiber does not
// initialize under Next 16).
//
// Mobile rules (reader feedback, Sep 2026): the model NEVER moves on its own,
// never follows the finger, and never traps page scroll. A tap selects a
// precinct; its numbers appear in a fixed panel below the canvas.
// Performance: builds only when scrolled near, renders on demand (no idle loop).

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

type Ring = [number, number][];
interface Feature { properties: { PREC: string }; geometry: { type: string; coordinates: Ring[] | Ring[][] } }
type Row = [number, number, number, number, number, number]; // d24, r24, d20, r20, turnout24, reg24
interface Data3D { county: { d24: number; r24: number; d20: number; r20: number }; precincts: Record<string, Row> }
interface Meta { prec: string; row: Row | null; shape: THREE.Shape; height: number }

// Same stops as the precinct map (components/HeatCheckHistoryMap.tsx)
const STOPS: [number, string][] = [[0.65, "#1A3A93"], [0.57, "#3F66CF"], [0.52, "#93AAE8"], [0.48, "#E6C35C"], [0.43, "#EC9C92"], [0.35, "#D2584B"], [-1, "#86211A"]];
const colorFor = (share: number | null) => share == null ? "#9AA19C" : STOPS.find(([t]) => share >= t)![1];
const share = (d: number, r: number) => (d + r > 0 ? d / (d + r) : null);
const norm = (p: string) => p.replace(/^0+/, "") || "0";

function build(features: Feature[], data: Data3D) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const f of features) {
    const ring = (f.geometry.type === "Polygon" ? (f.geometry.coordinates as Ring[])[0] : (f.geometry.coordinates as Ring[][])[0][0]);
    for (const [x, y] of ring) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
  }
  const scale = 90 / (maxX - minX), cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  const kx = Math.cos((cy * Math.PI) / 180); // longitude shrink at Houston's latitude
  const px = (x: number) => (x - cx) * scale * kx * 1.12, py = (y: number) => (y - cy) * scale;
  const rows = Object.fromEntries(Object.entries(data.precincts).map(([k, v]) => [norm(k), v]));
  const maxVotes = Math.max(...Object.values(data.precincts).map(r => r[0] + r[1]), 1);

  const buckets = new Map<string, THREE.BufferGeometry[]>();
  const picks: THREE.BufferGeometry[] = [];
  const owner: number[] = [];
  const metas: Meta[] = [];
  for (const f of features) {
    const polys = (f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates) as Ring[][];
    const row = rows[norm(f.properties.PREC)] ?? null;
    const votes = row ? row[0] + row[1] : 0;
    const height = 0.25 + Math.sqrt(votes / maxVotes) * 7;
    const color = colorFor(row ? share(row[0], row[1]) : null);
    for (const poly of polys) {
      const ring = poly[0];
      if (!ring || ring.length < 4) continue;
      const shape = new THREE.Shape(ring.map(([x, y]) => new THREE.Vector2(px(x), py(y))));
      const idx = metas.push({ prec: f.properties.PREC, row, shape, height }) - 1;
      const geo = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false, curveSegments: 1 });
      if (!buckets.has(color)) buckets.set(color, []);
      buckets.get(color)!.push(geo.clone());
      const faces = (geo.index ? geo.index.count : geo.attributes.position.count) / 3;
      for (let k = 0; k < faces; k++) owner.push(idx);
      picks.push(geo);
    }
  }
  const group = new THREE.Group();
  for (const [color, geos] of buckets) {
    const merged = mergeGeometries(geos, false);
    geos.forEach(g => g.dispose());
    if (merged) group.add(new THREE.Mesh(merged, new THREE.MeshStandardMaterial({ color, roughness: 0.62, metalness: 0.05, flatShading: true })));
  }
  const picker = new THREE.Mesh(mergeGeometries(picks, false)!, new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false, side: THREE.DoubleSide }));
  picks.forEach(g => g.dispose());
  return { group, picker, owner: Uint32Array.from(owner), metas };
}

interface Selected { prec: string; row: Row | null }

export default function County3D() {
  const wrap = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "nowebgl" | "error">("idle");
  const [sel, setSel] = useState<Selected | null>(null);
  const [summary, setSummary] = useState<{ d24: number; d20: number; dWon: number; total: number } | null>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    let cleanup: (() => void) | null = null;
    const io = new IntersectionObserver(entries => {
      if (!entries.some(e => e.isIntersecting)) return;
      io.disconnect();
      cleanup = start(el);
    }, { rootMargin: "400px" });
    io.observe(el);
    return () => { io.disconnect(); cleanup?.(); };

    function start(host: HTMLDivElement): () => void {
      const probe = document.createElement("canvas");
      if (!(probe.getContext("webgl2") || probe.getContext("webgl"))) { setState("nowebgl"); return () => {}; }
      setState("loading");
      let disposed = false;
      const coarse = window.matchMedia("(pointer: coarse)").matches;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 400);
      const camBase = new THREE.Vector3(0, -78, 92);
      camera.position.copy(camBase);
      camera.lookAt(0, -4, 0);
      scene.add(new THREE.HemisphereLight(0xffffff, 0x2a3a33, 1.1));
      const key = new THREE.DirectionalLight(0xffffff, 1.5); key.position.set(-40, -30, 80); scene.add(key);
      const fill = new THREE.DirectionalLight(0xe2b13c, 0.25); fill.position.set(50, 40, 20); scene.add(fill);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, coarse ? 1.5 : 2));
      renderer.domElement.style.display = "block";
      renderer.domElement.style.touchAction = "pan-y"; // page scroll always wins
      host.replaceChildren(renderer.domElement);

      let built: ReturnType<typeof build> | null = null;
      let highlight: THREE.Mesh | null = null;
      const hlCache = new Map<number, THREE.BufferGeometry>();
      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();
      const par = { x: 0, y: 0 };
      let parTarget = { x: 0, y: 0 }, raf = 0;

      const render = () => { if (!disposed) renderer.render(scene, camera); };
      const resize = () => {
        const w = host.clientWidth || 1, h = host.clientHeight || 1;
        renderer.setSize(w, h, false);
        renderer.domElement.style.width = "100%"; renderer.domElement.style.height = "100%";
        camera.aspect = w / h;
        const far = w < 420 ? 1.75 : w < 640 ? 1.45 : 1;
        camera.position.set(camBase.x, camBase.y * far, camBase.z * far);
        camera.lookAt(0, -4, 0);
        camera.updateProjectionMatrix();
        render();
      };
      const ro = new ResizeObserver(resize); ro.observe(host); resize();

      Promise.all([
        fetch("/data/harris-precincts.geojson").then(r => r.json()),
        fetch("/data/precinct-3d.json").then(r => r.json()),
      ]).then(([geo, data]: [{ features: Feature[] }, Data3D]) => {
        if (disposed) return;
        built = build(geo.features, data);
        scene.add(built.group, built.picker);
        const vals = Object.values(data.precincts);
        setSummary({
          d24: share(data.county.d24, data.county.r24)! * 100,
          d20: share(data.county.d20, data.county.r20)! * 100,
          dWon: vals.filter(r => r[0] > r[1]).length,
          total: vals.filter(r => r[0] + r[1] > 0).length,
        });
        setState("ready");
        render();
      }).catch(() => { if (!disposed) setState("error"); });

      function pick(clientX: number, clientY: number): number {
        if (!built) return -1;
        const r = host.getBoundingClientRect();
        pointer.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
        raycaster.setFromCamera(pointer, camera);
        const hit = raycaster.intersectObject(built.picker, false)[0];
        return hit?.faceIndex != null ? built.owner[hit.faceIndex] : -1;
      }
      function mark(idx: number) {
        if (!built) return;
        if (idx < 0) { if (highlight) highlight.visible = false; render(); return; }
        const m = built.metas[idx];
        if (!hlCache.has(idx)) hlCache.set(idx, new THREE.ExtrudeGeometry(m.shape, { depth: m.height + 2.2, bevelEnabled: false, curveSegments: 1 }));
        if (!highlight) {
          highlight = new THREE.Mesh(undefined, new THREE.MeshStandardMaterial({ color: "#E2B13C", emissive: new THREE.Color("#E2B13C"), emissiveIntensity: 0.7, roughness: 0.35, flatShading: true }));
          scene.add(highlight);
        }
        highlight.geometry = hlCache.get(idx)!;
        highlight.visible = true;
        render();
      }

      // Tap or click selects. Movement between down and up means the reader was scrolling.
      let down: { x: number; y: number } | null = null;
      const onDown = (e: PointerEvent) => { down = { x: e.clientX, y: e.clientY }; };
      const onUp = (e: PointerEvent) => {
        if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) { down = null; return; }
        down = null;
        const idx = pick(e.clientX, e.clientY);
        mark(idx);
        setSel(idx >= 0 && built ? { prec: built.metas[idx].prec, row: built.metas[idx].row } : null);
      };
      // Desktop only: a small lean toward the cursor, eased, and it stops when the mouse leaves.
      const onMove = (e: PointerEvent) => {
        if (coarse || e.pointerType !== "mouse") return;
        const r = host.getBoundingClientRect();
        parTarget = { x: ((e.clientX - r.left) / r.width - 0.5), y: ((e.clientY - r.top) / r.height - 0.5) };
        if (!raf) raf = requestAnimationFrame(ease);
      };
      const onLeave = () => { parTarget = { x: 0, y: 0 }; if (!raf) raf = requestAnimationFrame(ease); };
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      function ease() {
        raf = 0;
        if (reduced) return;
        par.x += (parTarget.x - par.x) * 0.12; par.y += (parTarget.y - par.y) * 0.12;
        camera.position.x = camBase.x + par.x * 14;
        camera.position.y = camBase.y + par.y * 8;
        camera.lookAt(0, -4, 0);
        render();
        if (Math.abs(parTarget.x - par.x) + Math.abs(parTarget.y - par.y) > 0.002) raf = requestAnimationFrame(ease);
      }
      const c = renderer.domElement;
      c.addEventListener("pointerdown", onDown);
      c.addEventListener("pointerup", onUp);
      c.addEventListener("pointermove", onMove);
      c.addEventListener("pointerleave", onLeave);

      return () => {
        disposed = true;
        cancelAnimationFrame(raf);
        ro.disconnect();
        c.removeEventListener("pointerdown", onDown);
        c.removeEventListener("pointerup", onUp);
        c.removeEventListener("pointermove", onMove);
        c.removeEventListener("pointerleave", onLeave);
        hlCache.forEach(g => g.dispose());
        scene.traverse(o => {
          const m = o as THREE.Mesh;
          m.geometry?.dispose();
          if (m.material) (Array.isArray(m.material) ? m.material : [m.material]).forEach(x => x.dispose());
        });
        renderer.dispose();
        c.remove();
      };
    }
  }, []);

  const sShare = sel?.row ? share(sel.row[0], sel.row[1]) : null;
  const sPrev = sel?.row ? share(sel.row[2], sel.row[3]) : null;
  const precNo = sel ? sel.prec.padStart(4, "0") : "";

  return (
    <div>
      <div className="relative rounded-xl overflow-hidden" style={{ background: "radial-gradient(ellipse 80% 70% at 50% 40%, #173F31 0%, #0D2A21 70%)" }}>
        <div ref={wrap} className="w-full h-[360px] sm:h-[460px] lg:h-[520px] cursor-pointer" aria-hidden="true" />
        {state !== "ready" && (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
            <p className="text-[14px] text-white/70">
              {state === "nowebgl" ? "This browser can’t draw the 3D county. The same results are on the precinct map."
                : state === "error" ? "The county model didn’t load. Try again, or use the precinct map."
                : "Building 1,172 precincts…"}
            </p>
          </div>
        )}
        <div className="absolute left-3 bottom-3 right-3 flex flex-wrap items-end justify-between gap-2 pointer-events-none">
          <div className="rounded-md px-2.5 py-2" style={{ background: "rgba(13,42,33,0.82)" }}>
            <div className="flex gap-[2px]">{STOPS.map(([, c]) => <span key={c} className="w-4 h-2 rounded-[1px]" style={{ background: c }} />)}</div>
            <p className="label mt-1 text-white/70" style={{ fontSize: 9 }}>Color: 2024 winner’s margin · Height: votes cast</p>
          </div>
          <p className="label text-white/60" style={{ fontSize: 9 }}>Select a precinct</p>
        </div>
      </div>

      {/* Numbers live here, below the model, never floating over it */}
      <div className="mt-3 min-h-[96px]" aria-live="polite">
        {sel ? (
          <div className="panel p-4 grid sm:grid-cols-[1fr_auto] gap-3 items-center">
            <div>
              <p className="label" style={{ color: "#6B726D", fontSize: 10 }}>Precinct {precNo} · 2024 presidential vote</p>
              {sShare != null && sel.row ? (
                <>
                  <div className="flex justify-between text-[15px] font-bold num mt-1">
                    <span style={{ color: "#2350C2" }}>Harris {(sShare * 100).toFixed(1)}%</span>
                    <span style={{ color: "#C0392E" }}>{((1 - sShare) * 100).toFixed(1)}% Trump</span>
                  </div>
                  <div className="flex h-2 rounded-full overflow-hidden mt-1" style={{ background: "#E4E6E0" }}>
                    <span style={{ width: `${sShare * 100}%`, background: "#2350C2" }} />
                    <span style={{ width: `${(1 - sShare) * 100}%`, background: "#C0392E" }} />
                  </div>
                  <p className="text-[13px] mt-1.5 num" style={{ color: "#4F5752" }}>
                    {(sel.row[0] + sel.row[1]).toLocaleString()} two-party votes
                    {sPrev != null && <> · {Math.abs((sShare - sPrev) * 100).toFixed(1)} pts {sShare >= sPrev ? "more" : "less"} Democratic than 2020</>}
                  </p>
                </>
              ) : <p className="text-[14px] mt-1" style={{ color: "#6B726D" }}>No 2024 votes recorded in this precinct.</p>}
            </div>
            <div className="flex sm:flex-col gap-2">
              <Link href={`/tools/heat-check?prec=${precNo}`} className="btn btn-ink !py-2 !text-[13px] justify-center">On the map</Link>
              <Link href={`/tools/precinct-lookup?p=${precNo}`} className="btn !py-2 !text-[13px] justify-center border" style={{ borderColor: "var(--rule-strong)", color: "var(--ink)" }}>Full history</Link>
            </div>
          </div>
        ) : summary ? (
          <p className="text-[15px] leading-relaxed" style={{ color: "#3C443F" }}>
            Harris voted {summary.d24.toFixed(1)}% Democratic in 2024, down from {summary.d20.toFixed(1)}% in 2020. Democrats carried {summary.dWon.toLocaleString()} of {summary.total.toLocaleString()} precincts;
            the tallest blocks cast the most votes. Select any precinct for its numbers.
          </p>
        ) : null}
      </div>
    </div>
  );
}
