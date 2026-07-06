"use client";

// NBA2K-style 3D character figure. Replaces the SVG version.
// Uses React Three Fiber + Three.js (already in package.json).
// Toon/cel shading, arena court backdrop, idle breathe + sway animation,
// official headshot mapped onto the head sphere.

import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

const THEMES = {
  D:  { suit: "#1a3a5c", dark: "#0d1f30", tie: "#2f6bbf", accent: "#3b82f6", floor: "#2a4a7a", ring: "#60a5fa" },
  R:  { suit: "#5c1515", dark: "#330b0b", tie: "#b32020", accent: "#ef4444", floor: "#6a2020", ring: "#f87171" },
  NP: { suit: "#2e3a45", dark: "#1a2129", tie: "#64748b", accent: "#94a3b8", floor: "#3a4a58", ring: "#cbd5e1" },
};

function makeToon3() {
  const data = new Uint8Array([50, 50, 50, 255, 150, 150, 150, 255, 240, 240, 240, 255]);
  const tex = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  return tex;
}

function usePhotoTexture(url?: string) {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    if (!url) return;
    // Route through the same-origin proxy: most photo hosts send no CORS
    // headers, so loading them directly fails silently and the head goes blank.
    const src = url.startsWith("/") ? url : `/api/img-proxy?u=${encodeURIComponent(url)}`;
    const loader = new THREE.TextureLoader();
    loader.load(src, (t) => { t.needsUpdate = true; setTex(t); }, undefined, () => setTex(null));
  }, [url]);
  return tex;
}

// Toon material factory
function toon(color: string, grad: THREE.DataTexture) {
  return new THREE.MeshToonMaterial({ color, gradientMap: grad });
}

function SuitCharacter({ photo, party }: { photo?: string; party: string }) {
  const th = THEMES[(party === "D" || party === "R" ? party : "NP") as keyof typeof THEMES];
  const root   = useRef<THREE.Group>(null!);
  const body   = useRef<THREE.Group>(null!);
  const photoTex = usePhotoTexture(photo);
  const grad   = useMemo(() => makeToon3(), []);

  const mSuit  = useMemo(() => toon(th.suit, grad), [th.suit, grad]);
  const mDark  = useMemo(() => toon(th.dark, grad), [th.dark, grad]);
  const mTie   = useMemo(() => toon(th.tie,  grad), [th.tie,  grad]);
  const mShirt = useMemo(() => toon("#f0f0ef", grad), [grad]);
  const mShoe  = useMemo(() => toon("#0b0b0b", grad), [grad]);
  const mSkin  = useMemo(() => toon("#c8956c", grad), [grad]);
  const mHead  = useMemo(() => {
    if (!photoTex) return toon("#c8956c", grad);
    photoTex.wrapS = THREE.ClampToEdgeWrapping;
    photoTex.wrapT = THREE.ClampToEdgeWrapping;
    photoTex.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshBasicMaterial({ map: photoTex, side: THREE.DoubleSide });
  }, [photoTex, grad]);

  useFrame(({ clock }) => {
    const e = clock.elapsedTime;
    body.current.position.y  = Math.sin(e * 1.55) * 0.016;  // breathe
    root.current.rotation.y  = Math.sin(e * 0.28) * 0.14;   // sway
  });

  return (
    <group ref={root}>
      <group ref={body}>

        {/* HEAD: toon skull + photo mapped onto the front face cap only,
            so the portrait reads as a face instead of wrapping the sphere */}
        <mesh position={[0, 1.67, 0]} castShadow>
          <sphereGeometry args={[0.178, 32, 32]} />
          <primitive attach="material" object={photoTex ? mDark : mHead} />
        </mesh>
        {photoTex && (
          <mesh position={[0, 1.67, 0]}>
            {/* phi window ~78° centered on +Z (camera side), theta ~86°: face cap */}
            <sphereGeometry args={[0.181, 32, 32, Math.PI / 2 - 0.68, 1.36, 0.72, 1.5]} />
            <primitive attach="material" object={mHead} />
          </mesh>
        )}

        {/* NECK */}
        <mesh position={[0, 1.5, 0]} castShadow>
          <cylinderGeometry args={[0.058, 0.068, 0.14, 16]} />
          <primitive attach="material" object={mSkin} />
        </mesh>

        {/* SHIRT FRONT */}
        <mesh position={[0, 1.26, 0.103]}>
          <boxGeometry args={[0.13, 0.28, 0.008]} />
          <primitive attach="material" object={mShirt} />
        </mesh>
        {/* LEFT COLLAR */}
        <mesh position={[-0.045, 1.42, 0.103]} rotation={[0, 0, -0.55]}>
          <boxGeometry args={[0.08, 0.1, 0.007]} />
          <primitive attach="material" object={mShirt} />
        </mesh>
        {/* RIGHT COLLAR */}
        <mesh position={[0.045, 1.42, 0.103]} rotation={[0, 0, 0.55]}>
          <boxGeometry args={[0.08, 0.1, 0.007]} />
          <primitive attach="material" object={mShirt} />
        </mesh>

        {/* TIE */}
        <mesh position={[0, 1.22, 0.108]}>
          <boxGeometry args={[0.052, 0.38, 0.007]} />
          <primitive attach="material" object={mTie} />
        </mesh>

        {/* TORSO */}
        <mesh position={[0, 1.19, 0]} castShadow>
          <boxGeometry args={[0.44, 0.53, 0.21]} />
          <primitive attach="material" object={mSuit} />
        </mesh>

        {/* LEFT LAPEL */}
        <mesh position={[-0.08, 1.34, 0.105]} rotation={[0, 0, -0.26]}>
          <boxGeometry args={[0.14, 0.22, 0.008]} />
          <primitive attach="material" object={mDark} />
        </mesh>
        {/* RIGHT LAPEL */}
        <mesh position={[0.08, 1.34, 0.105]} rotation={[0, 0, 0.26]}>
          <boxGeometry args={[0.14, 0.22, 0.008]} />
          <primitive attach="material" object={mDark} />
        </mesh>

        {/* POCKET SQUARE */}
        <mesh position={[-0.15, 1.32, 0.112]}>
          <boxGeometry args={[0.055, 0.038, 0.004]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>

        {/* ACCENT PIN */}
        <mesh position={[-0.11, 1.25, 0.112]}>
          <sphereGeometry args={[0.012, 8, 8]} />
          <meshBasicMaterial color={th.accent} />
        </mesh>

        {/* JACKET BUTTON */}
        <mesh position={[0.016, 1.06, 0.107]}>
          <sphereGeometry args={[0.011, 8, 8]} />
          <meshBasicMaterial color={th.accent} />
        </mesh>

        {/* WAIST */}
        <mesh position={[0, 0.87, 0]} castShadow>
          <boxGeometry args={[0.41, 0.16, 0.19]} />
          <primitive attach="material" object={mDark} />
        </mesh>

        {/* LEFT ARM: upper */}
        <mesh position={[-0.28, 1.14, 0.02]} rotation={[0.06, 0, 0.18]} castShadow>
          <capsuleGeometry args={[0.067, 0.24, 8, 16]} />
          <primitive attach="material" object={mSuit} />
        </mesh>
        {/* LEFT ARM: forearm */}
        <mesh position={[-0.32, 0.87, 0.05]} rotation={[0.16, 0, 0.07]} castShadow>
          <capsuleGeometry args={[0.057, 0.21, 8, 16]} />
          <primitive attach="material" object={mSuit} />
        </mesh>

        {/* RIGHT ARM: upper */}
        <mesh position={[0.28, 1.14, 0.02]} rotation={[0.06, 0, -0.18]} castShadow>
          <capsuleGeometry args={[0.067, 0.24, 8, 16]} />
          <primitive attach="material" object={mSuit} />
        </mesh>
        {/* RIGHT ARM: forearm */}
        <mesh position={[0.32, 0.87, 0.05]} rotation={[0.16, 0, -0.07]} castShadow>
          <capsuleGeometry args={[0.057, 0.21, 8, 16]} />
          <primitive attach="material" object={mSuit} />
        </mesh>

        {/* LEFT THIGH */}
        <mesh position={[-0.12, 0.63, 0]} castShadow>
          <capsuleGeometry args={[0.087, 0.26, 8, 16]} />
          <primitive attach="material" object={mDark} />
        </mesh>
        {/* LEFT CALF */}
        <mesh position={[-0.12, 0.31, 0]} castShadow>
          <capsuleGeometry args={[0.07, 0.23, 8, 16]} />
          <primitive attach="material" object={mDark} />
        </mesh>
        {/* LEFT SHOE */}
        <mesh position={[-0.12, 0.075, 0.054]} castShadow>
          <boxGeometry args={[0.115, 0.068, 0.24]} />
          <primitive attach="material" object={mShoe} />
        </mesh>

        {/* RIGHT THIGH */}
        <mesh position={[0.12, 0.63, 0]} castShadow>
          <capsuleGeometry args={[0.087, 0.26, 8, 16]} />
          <primitive attach="material" object={mDark} />
        </mesh>
        {/* RIGHT CALF */}
        <mesh position={[0.12, 0.31, 0]} castShadow>
          <capsuleGeometry args={[0.07, 0.23, 8, 16]} />
          <primitive attach="material" object={mDark} />
        </mesh>
        {/* RIGHT SHOE */}
        <mesh position={[0.12, 0.075, 0.054]} castShadow>
          <boxGeometry args={[0.115, 0.068, 0.24]} />
          <primitive attach="material" object={mShoe} />
        </mesh>

      </group>
    </group>
  );
}

function ArenaCourt({ accent, ring }: { accent: string; ring: string }) {
  const glowRef = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (glowRef.current) {
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.06 + Math.sin(clock.elapsedTime * 1.8) * 0.04;
    }
  });

  return (
    <group>
      {/* Hardwood floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <circleGeometry args={[2.6, 64]} />
        <meshStandardMaterial color="#5C3A1E" roughness={0.38} metalness={0.06} />
      </mesh>

      {/* Court center ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.008, 0]}>
        <ringGeometry args={[0.58, 0.64, 64]} />
        <meshBasicMaterial color={ring} transparent opacity={0.85} />
      </mesh>

      {/* Pulsing glow fill */}
      <mesh ref={glowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.007, 0]}>
        <circleGeometry args={[0.57, 64]} />
        <meshBasicMaterial color={accent} transparent opacity={0.07} />
      </mesh>

      {/* Underfoot shadow blob */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.006, 0]}>
        <circleGeometry args={[0.22, 32]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.42} />
      </mesh>

      {/* Lane lines */}
      {[-0.5, 0.5].map((x, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, -0.007, 0.6]}>
          <planeGeometry args={[0.025, 1.8]} />
          <meshBasicMaterial color={ring} transparent opacity={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function SceneSetup() {
  const { scene, gl } = useThree();
  useMemo(() => {
    scene.background = new THREE.Color("#060d1c");
    scene.fog = new THREE.FogExp2("#060d1c", 0.055); // subtle depth haze; 0.5 fogged the figure to black at camera distance
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFShadowMap;
  }, [scene, gl]);
  return null;
}

export default function PlayerFigure3D({
  slug,
  photo,
  party,
  name,
}: {
  slug: string;
  photo?: string;
  party: string;
  name: string;
}) {
  const th = THEMES[(party === "D" || party === "R" ? party : "NP") as keyof typeof THEMES];
  const lastName  = name.split(" ").at(-1) ?? name;
  const firstName = name.split(" ").slice(0, -1).join(" ");

  return (
    <div className="relative select-none" style={{ width: "100%", aspectRatio: "560/600" }}>
      <Canvas
        camera={{ position: [0, 1.05, 2.45], fov: 44 }}
        shadows
        gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true }}
        style={{ display: "block" }}
      >
        <SceneSetup />

        {/* KEY. Warm, upper-left, hard + shadow */}
        <directionalLight
          position={[-2.5, 5, 3.5]} intensity={2.4} color="#fff4e8"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-near={0.5}
          shadow-camera-far={20}
          shadow-camera-left={-3}
          shadow-camera-right={3}
          shadow-camera-top={4}
          shadow-camera-bottom={-2}
        />
        {/* FILL. Cool from right */}
        <directionalLight position={[3, 2, -0.5]} intensity={0.55} color="#b8ccff" />
        {/* RIM. Accent from behind */}
        <pointLight position={[0, 1.5, -2.2]} intensity={1.1} color={th.ring} distance={6} />
        {/* FLOOR GLOW. Accent from below */}
        <pointLight position={[0, 0.15, 0.5]} intensity={0.7} color={th.accent} distance={3.5} />
        {/* AMBIENT */}
        <ambientLight intensity={0.75} color="#93a3ba" />
        {/* FRONT + BACK FILL: autoRotate orbits the camera, so light both sides */}
        <directionalLight position={[0, 1.6, 4]} intensity={1.6} color="#dbe6f5" />
        <directionalLight position={[0, 1.6, -4]} intensity={1.1} color="#c2d0e4" />
        {/* SPOT from above */}
        <spotLight
          position={[0, 5.5, 1.2]} angle={0.38} penumbra={0.35}
          intensity={1.8} color="#ffffff" castShadow
          shadow-mapSize-width={512}
        />

        <ArenaCourt accent={th.accent} ring={th.ring} />
        <SuitCharacter photo={photo} party={party} />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 3.5}
          maxPolarAngle={Math.PI / 2.2}
          target={[0, 1.0, 0]}
        />
      </Canvas>

      {/* NBA2K-style name plate at bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{
          background: "linear-gradient(to top, rgba(4,10,22,0.95) 0%, rgba(4,10,22,0.6) 55%, transparent 100%)",
          paddingBottom: "0.6rem",
          paddingTop: "2.5rem",
        }}
      >
        <p className="text-center font-black tracking-[0.32em] leading-none"
          style={{ color: th.ring, fontSize: "clamp(14px, 3vw, 20px)", textShadow: `0 0 18px ${th.accent}88` }}>
          {lastName.toUpperCase()}
        </p>
        {firstName && (
          <p className="text-center font-bold tracking-[0.22em] mt-0.5 opacity-55"
            style={{ color: "#ffffff", fontSize: "clamp(8px, 1.5vw, 10px)" }}>
            {firstName.toUpperCase()}
          </p>
        )}
      </div>

      {/* Drag hint. Disappears after first interaction */}
      <p className="absolute top-2 left-0 right-0 text-center text-[9px] font-bold tracking-[0.18em] opacity-35 pointer-events-none"
        style={{ color: "#ffffff" }}>
        DRAG TO ROTATE
      </p>
    </div>
  );
}
