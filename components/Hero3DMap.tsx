"use client";

// Interactive 3D Harris County — the landing hero.
// Every one of the 1,172 precincts is hoverable: a raycast against a single
// hidden picking mesh (per-face precinct index) drives a live tooltip and a
// glowing highlight extrusion. Camera follows the cursor with soft parallax;
// the county breathes a slow rotation when idle and tilts away on scroll.
// Click anywhere on the map → the Districts tool.
//
// Height = 2026 primary ballots. Color = Heat Check partisan lean.
// Rendering stays cheap: 7 merged color-bucket meshes + 1 invisible picker.
// Plain three.js (R3F's reconciler doesn't initialize under Next 16).

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

function leanColor(dem: number, rep: number): string {
  const total = dem + rep;
  if (total < 10) return "#d6d3cd";
  const share = dem / total;
  if (share > 0.80) return "#1e3a8a";
  if (share > 0.65) return "#2563a8";
  if (share > 0.52) return "#7ea8d8";
  if (share > 0.48) return "#a78bfa";
  if (share > 0.35) return "#e58f8f";
  if (share > 0.20) return "#dc2626";
  return "#991b1b";
}
function leanLabel(dem: number, rep: number): string {
  const total = dem + rep;
  if (total < 10) return "Too few ballots";
  const share = dem / total;
  if (share > 0.65) return "Heavy Dem";
  if (share > 0.52) return "Lean Dem";
  if (share > 0.48) return "Split";
  if (share > 0.35) return "Lean Rep";
  return "Heavy Rep";
}

type Ring = [number, number][];
interface Feature { properties: { PREC: string }; geometry: { type: string; coordinates: Ring[] | Ring[][] } }
interface PrecMeta { prec: string; dem: number; rep: number; shape: THREE.Shape; height: number; color: string }

interface Built {
  visible: THREE.Group;
  picker: THREE.Mesh;
  facePrec: Uint16Array;        // face index → precinct meta index
  metas: PrecMeta[];
}

function buildCounty(features: Feature[], turnout: Record<string, { dem: number; rep: number }>): Built {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const f of features) {
    const polys = (f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates) as Ring[][];
    for (const [x, y] of polys[0][0]) {
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
  const scale = 90 / (maxX - minX);
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  const px = (x: number) => (x - cx) * scale;
  const py = (y: number) => (y - cy) * scale * 0.92;

  const maxBallots = Math.max(...Object.values(turnout).map(t => (t.dem ?? 0) + (t.rep ?? 0)), 1);
  const buckets = new Map<string, THREE.BufferGeometry[]>();
  const pickGeos: THREE.BufferGeometry[] = [];
  const faceOwner: number[] = [];
  const metas: PrecMeta[] = [];

  for (const f of features) {
    const t = turnout[f.properties.PREC] ?? { dem: 0, rep: 0 };
    const total = (t.dem ?? 0) + (t.rep ?? 0);
    const color = leanColor(t.dem ?? 0, t.rep ?? 0);
    const height = 0.3 + Math.sqrt(total / maxBallots) * 6;

    const polys = (f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates) as Ring[][];
    const ring = polys[0][0];
    if (ring.length < 4) continue;
    const shape = new THREE.Shape(ring.map(([x, y]) => new THREE.Vector2(px(x), py(y))));
    const metaIdx = metas.push({ prec: f.properties.PREC, dem: t.dem ?? 0, rep: t.rep ?? 0, shape, height, color }) - 1;

    const geo = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false, curveSegments: 1 });
    if (!buckets.has(color)) buckets.set(color, []);
    buckets.get(color)!.push(geo.clone());

    const faces = (geo.index ? geo.index.count : geo.attributes.position.count) / 3;
    for (let k = 0; k < faces; k++) faceOwner.push(metaIdx);
    pickGeos.push(geo);
  }

  const visible = new THREE.Group();
  for (const [color, geos] of buckets) {
    const merged = mergeGeometries(geos, false);
    geos.forEach(g => g.dispose());
    if (!merged) continue;
    visible.add(new THREE.Mesh(merged, new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.2, flatShading: true })));
  }

  const pickerGeo = mergeGeometries(pickGeos, false)!;
  pickGeos.forEach(g => g.dispose());
  const picker = new THREE.Mesh(pickerGeo, new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }));
  picker.renderOrder = -1;

  return { visible, picker, facePrec: Uint16Array.from(faceOwner), metas };
}

export default function Hero3DMap() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<{ x: number; y: number; prec: string; dem: number; rep: number } | null>(null);
  // All mutable interaction state lives on ONE ref shared by every effect
  // invocation (strict-mode double effects + HMR can otherwise split the
  // listener and render-loop into different closures).
  const st = useRef({ hovering: false, px: -2, py: -2, parX: 0, parY: 0, hoveredIdx: -1, scrollS: 0, built: null as Built | null }).current;

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    let disposed = false, raf = 0;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0f2540, 70, 160);
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 300);
    const camBase = new THREE.Vector3(0, 24, 74);
    camera.position.copy(camBase);

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(18, 34, 26); scene.add(key);
    const rim = new THREE.DirectionalLight(0x7dd3fc, 0.5); rim.position.set(-24, 8, -14); scene.add(rim);
    const under = new THREE.DirectionalLight(0xfbbf24, 0.12); under.position.set(0, -20, 10); scene.add(under);

    const county = new THREE.Group();
    county.rotation.x = -Math.PI / 2.6;
    county.position.y = -4;
    scene.add(county);

    let highlight: THREE.Mesh | null = null;
    const highlightCache = new Map<number, THREE.BufferGeometry>();

    Promise.all([
      fetch("/data/harris-precincts.geojson").then(r => r.json()),
      fetch("/data/precinct-turnout-2026.json").then(r => r.json()),
    ]).then(([geo, t]) => {
      if (disposed) return;
      st.built = st.built ?? buildCounty(geo.features, t.precincts);
      county.add(st.built.visible, st.built.picker);
    }).catch(e => console.error("[hero] build failed:", e));

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.domElement.style.display = "block";
    wrap.replaceChildren(renderer.domElement); // nuke any predecessor canvas

    const resize = () => {
      const w = wrap.clientWidth || 1, h = wrap.clientHeight || 1;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    // ── Interaction state (shared via st ref) ──
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2(-2, -2);

    const onMove = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      st.px = ((e.clientX - r.left) / r.width) * 2 - 1;
      st.py = -((e.clientY - r.top) / r.height) * 2 + 1;
      st.parX = st.px; st.parY = st.py;
      st.hovering = true;
    };
    const onLeave = () => { st.hovering = false; st.hoveredIdx = -1; setTip(null); if (highlight) highlight.visible = false; };
    const onClick = () => {
      if (st.hoveredIdx >= 0 && st.built) window.location.href = `/tools/districts`;
    };
    const surface = renderer.domElement;
    surface.addEventListener("pointermove", onMove);
    surface.addEventListener("pointerleave", onLeave);
    surface.addEventListener("click", onClick);

    const onScroll = () => {
      const h = window.innerHeight * 0.9;
      st.scrollS = Math.min(1, Math.max(0, window.scrollY / h));
      wrap.style.opacity = String(Math.max(0, 1 - st.scrollS * 1.1));
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const clock = new THREE.Clock();
    const loop = () => {
      if (disposed) return;
      raf = requestAnimationFrame(loop);
      if (st.scrollS >= 0.99) return;

      pointer.set(st.px, st.py);
      const built = st.built;

      // Idle drift pauses while the cursor explores
      const tEl = clock.getElapsedTime();
      const idle = reduced ? 0 : Math.sin(tEl * 0.12) * 0.22;
      county.rotation.z += ((st.hovering ? county.rotation.z : idle) - county.rotation.z) * 0.03;
      county.rotation.x = -Math.PI / 2.6 - st.scrollS * 0.7;
      county.position.y = -4 - st.scrollS * 26;
      county.scale.setScalar(1 - st.scrollS * 0.25);

      // Cursor parallax — the map leans toward the pointer
      camera.position.x += (camBase.x + st.parX * 7 - camera.position.x) * 0.05;
      camera.position.y += (camBase.y - st.parY * 5 - camera.position.y) * 0.05;
      camera.lookAt(0, -6, 0);

      // Raycast hover
      if (built && st.hovering) {
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObject(built.picker, false);
        if (hits.length && hits[0].faceIndex !== undefined) {
          const idx = built.facePrec[hits[0].faceIndex!];
          const world = wrap.getBoundingClientRect();
          if (idx !== st.hoveredIdx) {
            st.hoveredIdx = idx;
            const m = built.metas[idx];
            if (!highlightCache.has(idx)) {
              highlightCache.set(idx, new THREE.ExtrudeGeometry(m.shape, { depth: m.height + 0.35, bevelEnabled: false, curveSegments: 1 }));
            }
            if (!highlight) {
              highlight = new THREE.Mesh(undefined, new THREE.MeshStandardMaterial({
                color: "#fbbf24", emissive: new THREE.Color("#fbbf24"), emissiveIntensity: 0.55,
                roughness: 0.3, metalness: 0.1, flatShading: true,
              }));
              county.add(highlight);
            }
            highlight.geometry = highlightCache.get(idx)!;
            highlight.visible = true;
            setTip({ x: ((st.px + 1) / 2) * world.width, y: ((1 - st.py) / 2) * world.height, prec: m.prec, dem: m.dem, rep: m.rep });
          } else {
            setTip(t => t && { ...t, x: ((st.px + 1) / 2) * world.width, y: ((1 - st.py) / 2) * world.height });
          }
        } else if (st.hoveredIdx !== -1) {
          st.hoveredIdx = -1; setTip(null); if (highlight) highlight.visible = false;
        }
      }

      renderer.render(scene, camera);
    };
    loop();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      surface.removeEventListener("pointermove", onMove);
      surface.removeEventListener("pointerleave", onLeave);
      surface.removeEventListener("click", onClick);
      highlightCache.forEach(g => g.dispose());
      scene.traverse(o => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        if (m.material) (Array.isArray(m.material) ? m.material : [m.material]).forEach(mat => mat.dispose());
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div className="absolute inset-y-0 right-0 w-[58%] hidden md:block" aria-hidden="true">
      <div ref={wrapRef} className="absolute inset-0 cursor-crosshair" />
      {/* fade the map's left edge so the headline stays clean */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(90deg, var(--accent, #1a3a5c) 0%, rgba(26,58,92,0.55) 22%, transparent 52%)" }} />
      {/* live precinct tooltip */}
      {tip && (
        <div className="absolute pointer-events-none z-20 px-3 py-2 rounded-xl"
          style={{
            left: Math.min(tip.x + 14, 9999), top: tip.y - 10,
            background: "rgba(8,18,32,0.92)", border: "1px solid rgba(251,191,36,0.4)",
            backdropFilter: "blur(8px)",
          }}>
          <p className="text-[11px] font-bold text-white leading-tight">Precinct {tip.prec}</p>
          <p className="text-[10px] leading-tight mt-0.5" style={{ color: leanColor(tip.dem, tip.rep) === "#d6d3cd" ? "#9ca3af" : leanColor(tip.dem, tip.rep) }}>
            {leanLabel(tip.dem, tip.rep)} · {(tip.dem + tip.rep).toLocaleString()} primary ballots
          </p>
          <p className="text-[9px] text-white/40 leading-tight mt-0.5">click to open Districts</p>
        </div>
      )}
      {/* legend chip */}
      <div className="absolute bottom-5 right-5 pointer-events-none px-3 py-1.5 rounded-full"
        style={{ background: "rgba(8,18,32,0.65)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}>
        <p className="text-[9px] text-white/55 font-bold tracking-wide">HEIGHT = 2026 TURNOUT · COLOR = LEAN · HOVER ANY PRECINCT</p>
      </div>
    </div>
  );
}
