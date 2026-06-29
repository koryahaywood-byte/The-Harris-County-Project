"use client";

// Follow an Official. Email capture on the profile hero.
// Alerts on: new finance filings, significant fundraising moves, bill movement.

import { useState } from "react";

export default function FollowButton({ slug, name }: { slug: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    try {
      const res = await fetch("/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, slug }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong."); setState("error"); return; }
      setState("done");
    } catch {
      setError("Network error: try again."); setState("error");
    }
  }

  if (state === "done") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
        style={{ background: "rgba(74,222,128,0.12)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.3)" }}>
        ✓ Following {name.split(" ")[0]}. Alerts on new filings & bill movement
      </span>
    );
  }

  return (
    <span className="relative inline-flex">
      <button onClick={() => setOpen(o => !o)}
        className="pressable inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
        style={{ background: "rgba(251,191,36,0.12)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.35)" }}>
        + Follow
      </button>
      {open && (
        <form onSubmit={submit}
          className="absolute top-full left-0 mt-2 z-30 p-3 rounded-2xl w-72"
          style={{ background: "rgba(10,22,40,0.97)", border: "1px solid rgba(255,255,255,0.14)", backdropFilter: "blur(20px)" }}>
          <p className="text-[10px] text-white/55 leading-relaxed mb-2">
            Get an email when {name} files a new campaign finance report, reports a major
            fundraising jump, or has a bill move in the legislature.
          </p>
          <div className="flex gap-1.5">
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 min-w-0 rounded-full px-3 py-1.5 text-xs outline-none"
              style={{ background: "rgba(255,255,255,0.92)", color: "#1a3a5c" }}
            />
            <button type="submit" disabled={state === "sending"}
              className="pressable rounded-full px-3.5 py-1.5 text-xs font-bold text-[#1a3a5c] disabled:opacity-60"
              style={{ background: "#fbbf24" }}>
              {state === "sending" ? "…" : "Follow"}
            </button>
          </div>
          {state === "error" && <p className="text-[10px] text-red-400 mt-1.5">{error}</p>}
          <p className="text-[9px] text-white/30 mt-1.5">Email only. No spam, unsubscribe in any alert.</p>
        </form>
      )}
    </span>
  );
}
