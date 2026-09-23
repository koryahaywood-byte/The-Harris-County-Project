"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Address entry that hands off to My Ballot. Used on the front page, race pages and the rail. */
export default function AddressForm({ dark = false, initial = "", onSubmit }: { dark?: boolean; initial?: string; onSubmit?: (address: string) => void }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [locating, setLocating] = useState(false);

  function go(e: React.FormEvent) {
    e.preventDefault();
    const a = value.trim();
    if (!a) return;
    if (onSubmit) onSubmit(a);
    else router.push(`/tools/my-ballot?address=${encodeURIComponent(a)}`);
  }

  function locate() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      p => router.push(`/tools/my-ballot?lat=${p.coords.latitude.toFixed(5)}&lng=${p.coords.longitude.toFixed(5)}`),
      () => setLocating(false),
      { timeout: 10_000 },
    );
  }

  return (
    <form onSubmit={go} role="search" aria-label="Find your ballot by address">
      <label htmlFor="addr" className="sr-only">Street address in Harris County</label>
      <div className="flex gap-2">
        <input id="addr" value={value} onChange={e => setValue(e.target.value)} autoComplete="street-address"
          placeholder="1001 Preston St, Houston"
          className="min-w-0 flex-1 rounded-md px-3.5 py-2.5 text-[15px] outline-none focus:ring-2"
          style={dark
            ? { background: "#fff", color: "var(--ink)", border: "1px solid transparent", ["--tw-ring-color" as string]: "var(--gold)" }
            : { background: "#fff", color: "var(--ink)", border: "1px solid var(--rule-strong)", ["--tw-ring-color" as string]: "var(--brand)" }} />
        <button type="submit" className={`btn ${dark ? "btn-gold" : "btn-ink"} shrink-0`}>See ballot</button>
      </div>
      <button type="button" onClick={locate} className={`mt-2.5 text-[13px] font-semibold ${dark ? "text-white/70 hover:text-white" : ""}`}
        style={dark ? undefined : { color: "var(--brand)" }}>
        {locating ? "Finding you…" : "Use my location instead"}
      </button>
    </form>
  );
}
