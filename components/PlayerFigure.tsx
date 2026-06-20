"use client";

import dynamic from "next/dynamic";

// Load the Three.js scene client-side only — no SSR (Canvas requires window)
const PlayerFigure3D = dynamic(() => import("./PlayerFigure3D"), {
  ssr: false,
  loading: () => (
    <div
      className="relative select-none"
      style={{ width: "100%", aspectRatio: "560/600", background: "#060d1c", borderRadius: "0.75rem" }}
    />
  ),
});

export default function PlayerFigure({
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
  return <PlayerFigure3D slug={slug} photo={photo} party={party} name={name} />;
}
