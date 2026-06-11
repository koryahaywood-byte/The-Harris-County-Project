"use client";

// Field Notes — the community context layer. A toggle chip reveals verified
// annotations (media / academic / community-org tiers) attached to any data
// point, plus a flag form so anyone can report suspect data into the review
// queue. Notes are a distinct visual layer: off by default, never mixed into
// the platform's own data presentation.

import { useEffect, useState } from "react";

const TIER_STYLE: Record<string, { label: string; color: string }> = {
  media:     { label: "Media",     color: "#b45309" },
  academic:  { label: "Academic",  color: "#6d28d9" },
  community: { label: "Community", color: "#0f766e" },
};

interface Note { id: string; note: string; author: string; affiliation: string; tier: string; at: string }

export default function FieldNotes({ target, dark = false }: { target: string; dark?: boolean }) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [flags, setFlags] = useState(0);
  const [mode, setMode] = useState<"view" | "note" | "flag">("view");
  const [text, setText] = useState("");
  const [key, setKey] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!open || notes) return;
    fetch(`/api/field-notes?target=${encodeURIComponent(target)}`)
      .then(r => r.json())
      .then(d => { setNotes(d.notes ?? []); setFlags(d.openFlags ?? 0); })
      .catch(() => setNotes([]));
  }, [open, notes, target]);

  useEffect(() => { setKey(localStorage.getItem("hcp-annotator-key") ?? ""); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const body = mode === "flag"
      ? { flag: true, target, reason: text }
      : { key, target, note: text };
    const res = await fetch("/api/field-notes", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    const d = await res.json();
    if (!res.ok) { setMsg(d.error); return; }
    if (mode === "note") {
      localStorage.setItem("hcp-annotator-key", key);
      setNotes(n => [...(n ?? []), d.note]);
    }
    setMsg(mode === "flag" ? "Flagged — queued for annotator review." : "Field Note posted.");
    setText(""); setMode("view");
  }

  const fg = dark ? "rgba(255,255,255,0.55)" : "#6b7280";

  return (
    <div className="mt-3">
      <button onClick={() => setOpen(o => !o)}
        className="pressable inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] px-3 py-1.5 rounded-full transition-all"
        style={{
          background: open ? "#0f766e" : dark ? "rgba(255,255,255,0.08)" : "#0f766e12",
          color: open ? "#fff" : dark ? "rgba(255,255,255,0.6)" : "#0f766e",
          border: `1px solid ${open ? "#0f766e" : "#0f766e35"}`,
        }}>
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 2h8v6H5l-3 3V2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>
        Field Notes{notes ? ` · ${notes.length}` : ""}{open ? " — on" : ""}
      </button>

      {open && (
        <div className="mt-2.5 rounded-2xl p-4"
          style={{ background: dark ? "rgba(15,118,110,0.1)" : "#0f766e08", border: "1px dashed #0f766e45" }}>
          {notes === null ? (
            <p className="text-[11px]" style={{ color: fg }}>Loading…</p>
          ) : notes.length === 0 ? (
            <p className="text-[11px]" style={{ color: fg }}>
              No Field Notes on this data point yet. Verified annotators — media, academic, and
              community-org — can add the first one.
            </p>
          ) : (
            <div className="space-y-3">
              {notes.map(n => {
                const t = TIER_STYLE[n.tier] ?? TIER_STYLE.community;
                return (
                  <div key={n.id}>
                    <p className="text-[12px] leading-relaxed" style={{ color: dark ? "rgba(255,255,255,0.85)" : "#1f2937" }}>{n.note}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: fg }}>
                      <span className="font-bold px-1.5 py-0.5 rounded mr-1.5" style={{ background: `${t.color}18`, color: t.color }}>{t.label}</span>
                      {n.author} · {n.affiliation} · {new Date(n.at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {flags > 0 && (
            <p className="text-[10px] mt-3 font-bold" style={{ color: "#b45309" }}>
              ⚑ {flags} open community flag{flags > 1 ? "s" : ""} on this data point — under review.
            </p>
          )}

          {mode === "view" ? (
            <div className="flex gap-2 mt-3">
              <button onClick={() => { setMode("note"); setMsg(null); }} className="text-[10px] font-bold underline" style={{ color: "#0f766e" }}>
                Add a Field Note (verified)
              </button>
              <button onClick={() => { setMode("flag"); setMsg(null); }} className="text-[10px] font-bold underline" style={{ color: "#b45309" }}>
                Flag this data
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-3 space-y-2">
              {mode === "note" && (
                <input value={key} onChange={e => setKey(e.target.value)} placeholder="Annotator key"
                  className="w-full rounded-full px-3 py-1.5 text-[11px] outline-none"
                  style={{ background: "#fff", color: "#1a3a5c", border: "1px solid #e5e7eb" }} />
              )}
              <textarea value={text} onChange={e => setText(e.target.value)} rows={3}
                placeholder={mode === "note" ? "Context the data can't show — what's behind this number?" : "What looks wrong, and how do you know?"}
                className="w-full rounded-xl px-3 py-2 text-[11px] outline-none resize-none"
                style={{ background: "#fff", color: "#1a3a5c", border: "1px solid #e5e7eb" }} />
              <div className="flex items-center gap-2.5">
                <button type="submit" className="pressable text-[10px] font-bold px-4 py-1.5 rounded-full text-white"
                  style={{ background: mode === "note" ? "#0f766e" : "#b45309" }}>
                  {mode === "note" ? "Post Field Note" : "Submit flag"}
                </button>
                <button type="button" onClick={() => setMode("view")} className="text-[10px] underline" style={{ color: fg }}>cancel</button>
              </div>
            </form>
          )}
          {msg && <p className="text-[10px] mt-2 font-bold" style={{ color: msg.includes("posted") || msg.includes("queued") ? "#0f766e" : "#b91c1c" }}>{msg}</p>}
        </div>
      )}
    </div>
  );
}
