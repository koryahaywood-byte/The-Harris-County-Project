"use client";
import { useState } from "react";

/* Headshot with initials fallback. politicians.ts photo URLs point at many
   external hosts (county sites, campaign CDNs); any can 404 without notice.
   Renders the img and swaps to an initials avatar on load error or missing src.
   Pass fallbackClassName/fallbackStyle to keep each call site's existing
   no-photo styling; they default to the img's own className/style. */
export default function Headshot({
  src, name, className, style, fallbackClassName, fallbackStyle,
}: {
  src?: string;
  name: string;
  className?: string;
  style?: React.CSSProperties;
  fallbackClassName?: string;
  fallbackStyle?: React.CSSProperties;
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    const initials = name.split(" ").map(n => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
    return (
      <div className={fallbackClassName ?? className} style={fallbackStyle ?? style} aria-label={name}>
        {initials}
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={name} className={className} style={style} onError={() => setFailed(true)} />;
}
