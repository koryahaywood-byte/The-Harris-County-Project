"use client";

// 3D extruded Harris County precinct map for the landing hero — plain three.js
// (no react-three-fiber: its custom reconciler initializes unreliably against
// Next 16's bundled React, so the renderer is managed imperatively).
// Height = 2026 primary ballots cast. Color = partisan lean (Heat Check scale).
// Slow rotation on load; tilts and sinks toward the toolbox on scroll.
// All 1,172 extrusions merged into one mesh per color bucket (7 draw calls).

import { useEffect, useRef } from "react";
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

type Ring = [number, number][];
interface Feature { properties: { PREC: string }; geometry: { type: string; coordinates: Ring[] | Ring[][] } }

function buildCounty(features: Feature[], turnout: Record<string, { dem: number; rep: number }>): THREE.Group {
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

  for (const f of features) {
    const t = turnout[f.properties.PREC] ?? { dem: 0, rep: 0 };
    const total = (t.dem ?? 0) + (t.rep ?? 0);
    const color = leanColor(t.dem ?? 0, t.rep ?? 0);
    const height = 0.25 + Math.sqrt(total / maxBallots) * 5.5;

    const polys = (f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates) as Ring[][];
    for (const poly of polys) {
      const ring = poly[0];
      if (ring.length < 4) continue;
      const shape = new THREE.Shape(ring.map(([x, y]) => new THREE.Vector2(px(x), py(y))));
      const geo = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false, curveSegments: 1 });
      if (!buckets.has(color)) buckets.set(color, []);
      buckets.get(color)!.push(geo);
    }
  }

  const group = new THREE.Group();
  for (const [color, geos] of buckets) {
    const merged = mergeGeometries(geos, false);
    geos.forEach(g => g.dispose());
    if (!merged) continue;
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.15, flatShading: true });
    group.add(new THREE.Mesh(merged, mat));
  }
  return group;
}

export default function Hero3DMap() {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    let disposed = false;
    let renderer: THREE.WebGLRenderer | null = null;
    let raf = 0;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 300);
    camera.position.set(0, 24, 74);
    camera.lookAt(0, -6, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(18, 30, 24);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x7dd3fc, 0.35);
    rim.position.set(-20, -10, 10);
    scene.add(rim);

    let county: THREE.Group | null = null;

    Promise.all([
      fetch("/data/harris-precincts.geojson").then(r => r.json()),
      fetch("/data/precinct-turnout-2026.json").then(r => r.json()),
    ]).then(([geo, t]) => {
      if (disposed) return;
      county = buildCounty(geo.features, t.precincts);
      county.rotation.x = -Math.PI / 2.6;
      county.position.y = -4;
      scene.add(county);
    }).catch(() => { /* hero quietly stays 2D if data fails */ });

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    renderer.domElement.style.display = "block";
    wrap.appendChild(renderer.domElement);

    const resize = () => {
      if (!renderer) return;
      const w = wrap.clientWidth || 1, h = wrap.clientHeight || 1;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    let scrollS = 0;
    const onScroll = () => {
      const h = window.innerHeight * 0.9;
      scrollS = Math.min(1, Math.max(0, window.scrollY / h));
      wrap.style.opacity = String(Math.max(0, 1 - scrollS * 1.1));
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const clock = new THREE.Clock();
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (scrollS >= 0.99) return; // fully past the hero — skip rendering
      if (county) {
        county.rotation.z = reduced ? 0 : clock.getElapsedTime() * 0.045;
        county.rotation.x = -Math.PI / 2.6 - scrollS * 0.7;
        county.position.y = -4 - scrollS * 26;
        const s = 1 - scrollS * 0.25;
        county.scale.setScalar(s);
      }
      renderer!.render(scene, camera);
    };
    loop();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      scene.traverse(o => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        if (m.material) (Array.isArray(m.material) ? m.material : [m.material]).forEach(mat => mat.dispose());
      });
      renderer?.dispose();
      renderer?.domElement.remove();
      renderer = null;
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 w-[58%] hidden md:block" aria-hidden="true">
      <div ref={wrapRef} className="absolute inset-0" />
      {/* fade the map's left edge so the headline stays clean */}
      <div className="absolute inset-0"
        style={{ background: "linear-gradient(90deg, var(--accent, #1a3a5c) 0%, rgba(26,58,92,0.55) 22%, transparent 52%)" }} />
    </div>
  );
}
