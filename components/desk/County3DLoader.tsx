"use client";

// Keeps three.js out of the front page's initial bundle and out of SSR.
import dynamic from "next/dynamic";

const County3D = dynamic(() => import("./County3D"), {
  ssr: false,
  loading: () => <div className="rounded-xl h-[360px] sm:h-[460px] lg:h-[520px]" style={{ background: "#0D2A21" }} aria-hidden />,
});

export default function County3DLoader() {
  return <County3D />;
}
