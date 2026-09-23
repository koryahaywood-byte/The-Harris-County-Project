"use client";

import { useState } from "react";
import { PARTY } from "@/lib/ratings";

/** Candidate headshot in a party ring. Real photos only; initials when a photo is missing or broken. */
export default function Face({ name, party, photo, size = 44, dark = false }: { name: string; party: "D" | "R"; photo?: string; size?: number; dark?: boolean }) {
  const [failed, setFailed] = useState(false);
  const ring = PARTY[party].color;
  const initials = name.replace(/\b(Jr|Sr|III|II)\.?$/i, "").split(/\s+/).filter(Boolean).map(w => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <span className="relative inline-flex shrink-0 rounded-full overflow-hidden items-center justify-center"
      style={{ width: size, height: size, boxShadow: `0 0 0 2px ${dark ? "var(--board)" : "#fff"}, 0 0 0 ${size >= 56 ? 4 : 3.5}px ${ring}`, background: dark ? "rgba(255,255,255,0.08)" : PARTY[party].tint }}>
      {photo && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt="" loading="lazy" className="w-full h-full object-cover object-top" onError={() => setFailed(true)} />
      ) : (
        <span className="font-bold" style={{ fontSize: size * 0.36, color: dark ? "#fff" : ring }} aria-hidden>{initials}</span>
      )}
    </span>
  );
}
