"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { PARTY } from "@/lib/ratings";

const HEIGHT = 1.8;      // every figure is normalized to the same height
const FOV = 26;

/**
 * A full-body 3D figure on a lit stage: sways a little when idle, turns with a
 * horizontal drag (vertical drags still scroll the page), rests when off screen.
 */
export default function PlayerModel({ src, party, yaw = 0, onReady, onError }: {
  src: string;
  party: "D" | "R" | "NP";
  yaw?: number;
  onReady?: () => void;
  onError?: () => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const cb = useRef({ onReady, onError });
  useEffect(() => { cb.current = { onReady, onError }; }, [onReady, onError]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let raf = 0;
    let visible = false;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.touchAction = "pan-y";
    renderer.domElement.style.cursor = "grab";
    renderer.domElement.setAttribute("aria-hidden", "true");
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    scene.environmentIntensity = 0.55;

    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 50);
    // Aim a little below center so the feet clear the nameplate at the bottom of the card.
    const target = new THREE.Vector3(0, HEIGHT * 0.42, 0);
    let modelWidth = HEIGHT * 0.55;

    // Key from front-right, two rims behind: party color on one side, desk gold on the other.
    const key = new THREE.DirectionalLight(0xfff3e2, 2.4);
    key.position.set(2.2, 4.2, 3.6);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -1.2; key.shadow.camera.right = 1.2;
    key.shadow.camera.top = 2.4; key.shadow.camera.bottom = -0.4;
    key.shadow.camera.near = 1; key.shadow.camera.far = 12;
    key.shadow.bias = -0.0005;
    key.shadow.radius = 4;
    scene.add(key);
    const rimColor = party === "NP" ? 0xc9ccc4 : new THREE.Color(PARTY[party].color).getHex();
    const rimL = new THREE.DirectionalLight(rimColor, 2.2);
    rimL.position.set(-3, 2.6, -2.6);
    scene.add(rimL);
    const rimR = new THREE.DirectionalLight(0xe2b13c, 1.3);
    rimR.position.set(3.2, 2.2, -2.8);
    scene.add(rimR);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x0d2a21, 0.45));

    // Floor: a shadow catcher plus a soft pool of light under the feet.
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.ShadowMaterial({ opacity: 0.42 }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    const spotCanvas = document.createElement("canvas");
    spotCanvas.width = spotCanvas.height = 256;
    const g = spotCanvas.getContext("2d")!;
    const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    grad.addColorStop(0, "rgba(255,248,230,0.55)");
    grad.addColorStop(0.45, "rgba(226,177,60,0.16)");
    grad.addColorStop(1, "rgba(226,177,60,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 256, 256);
    const spotTex = new THREE.CanvasTexture(spotCanvas);
    const spot = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6),
      new THREE.MeshBasicMaterial({ map: spotTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    spot.rotation.x = -Math.PI / 2;
    spot.position.y = 0.002;
    scene.add(spot);

    const pivot = new THREE.Group();
    scene.add(pivot);

    function fit() {
      const w = host!.clientWidth, h = host!.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = w + "px";
      renderer.domElement.style.height = h + "px";
      camera.aspect = w / h;
      // Frame the whole figure with headroom, from slightly below eye level (a hero angle).
      const vHalf = THREE.MathUtils.degToRad(FOV / 2);
      const needV = (HEIGHT * 1.34) / 2 / Math.tan(vHalf);
      const needH = (modelWidth * 1.08) / 2 / (Math.tan(vHalf) * camera.aspect);
      const d = Math.max(needV, needH);
      camera.position.set(0, HEIGHT * 0.36, d);
      camera.lookAt(target);
      camera.updateProjectionMatrix();
    }
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(host);

    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    let loaded = false;
    loader.load(src, (gltf) => {
      if (disposed) return;
      const model = gltf.scene;
      model.traverse((o) => {
        const m = o as THREE.Mesh;
        if (!m.isMesh) return;
        m.castShadow = true;
        const mat = m.material as THREE.MeshStandardMaterial;
        // Generated meshes bake their lighting into color; keep them from reading as plastic.
        if (mat && "roughness" in mat) { mat.roughness = Math.max(mat.roughness ?? 1, 0.6); mat.metalness = Math.min(mat.metalness ?? 0, 0.1); }
      });
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const s = HEIGHT / size.y;
      model.scale.setScalar(s);
      box.setFromObject(model);
      const c = box.getCenter(new THREE.Vector3());
      model.position.set(-c.x, -box.min.y, -c.z);
      const fp = box.getSize(new THREE.Vector3());
      modelWidth = Math.hypot(fp.x, fp.z);   // widest it gets while turning
      fit();
      const inner = new THREE.Group();
      inner.add(model);
      inner.rotation.y = yaw;
      pivot.add(inner);
      loaded = true;
      renderer.render(scene, camera);
      cb.current.onReady?.();
    }, undefined, () => { if (!disposed) cb.current.onError?.(); });

    // Drag to turn. Horizontal only; the page keeps its vertical scroll.
    let angle = 0, vel = 0, dragging = false, lastX = 0, lastInput = -1e9;
    const el = renderer.domElement;
    const down = (e: PointerEvent) => { dragging = true; lastX = e.clientX; vel = 0; el.setPointerCapture(e.pointerId); el.style.cursor = "grabbing"; };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX; lastX = e.clientX;
      const d = dx * 0.012; angle += d; vel = d; lastInput = performance.now();
    };
    const up = (e: PointerEvent) => { dragging = false; lastInput = performance.now(); el.style.cursor = "grab"; try { el.releasePointerCapture(e.pointerId); } catch { /* already released */ } };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);

    const clock = new THREE.Clock();
    function tick() {
      raf = 0;
      if (disposed || !visible || document.hidden) return;
      const t = clock.getElapsedTime();
      if (!dragging) {
        angle += vel; vel *= 0.93;
        if (!still && performance.now() - lastInput > 2600 && Math.abs(vel) < 0.002) {
          // Drift back to facing front by the shortest way round, then sway.
          const home = Math.round(angle / (Math.PI * 2)) * Math.PI * 2;
          const sway = home + Math.sin(t * 0.42) * 0.38;
          angle += (sway - angle) * 0.025;
        }
      }
      pivot.rotation.y = angle;
      if (!still) pivot.scale.y = 1 + Math.sin(t * 1.7) * 0.0035;   // breathing
      if (loaded) renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    }
    const io = new IntersectionObserver(([en]) => {
      visible = en.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(tick);
    }, { rootMargin: "120px" });
    io.observe(host);
    const onVis = () => { if (!document.hidden && visible && !raf) raf = requestAnimationFrame(tick); };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      io.disconnect(); ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (!m.isMesh) return;
        m.geometry.dispose();
        const mats = Array.isArray(m.material) ? m.material : [m.material];
        for (const mat of mats) {
          for (const v of Object.values(mat)) if (v instanceof THREE.Texture) v.dispose();
          mat.dispose();
        }
      });
      spotTex.dispose(); envTex.dispose(); pmrem.dispose();
      renderer.dispose();
      el.remove();
    };
  }, [src, party, yaw]);

  return <div ref={hostRef} className="absolute inset-0" />;
}
