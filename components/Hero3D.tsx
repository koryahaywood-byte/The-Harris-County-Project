"use client";

// Client-side loader for the 3D hero map: keeps three.js out of SSR and
// out of the initial bundle.

import dynamic from "next/dynamic";

const Hero3DMap = dynamic(() => import("./Hero3DMap"), { ssr: false });

export default function Hero3D() {
  return <Hero3DMap />;
}
