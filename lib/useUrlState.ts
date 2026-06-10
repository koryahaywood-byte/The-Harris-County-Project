"use client";
import { useEffect, useRef } from "react";

/* Keeps a tool's filter state mirrored into the URL query string so shared
   links reproduce the exact view. Values equal to their default are omitted.
   Uses history.replaceState — no Next.js navigation, no scroll reset. */
export function useUrlState(state: Record<string, string | null | undefined>, defaults: Record<string, string>) {
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const url = new URL(window.location.href);
    for (const [k, v] of Object.entries(state)) {
      if (v == null || v === defaults[k]) url.searchParams.delete(k);
      else url.searchParams.set(k, v);
    }
    window.history.replaceState(null, "", url.toString());
  }, [state, defaults]);
}

/* Read initial values from the query string (client-only; call inside useState initializers is unsafe with SSR — use in a mount effect). */
export function readUrlParams(keys: string[]): Record<string, string> {
  if (typeof window === "undefined") return {};
  const p = new URLSearchParams(window.location.search);
  const out: Record<string, string> = {};
  for (const k of keys) {
    const v = p.get(k);
    if (v !== null) out[k] = v;
  }
  return out;
}
