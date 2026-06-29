// Field Notes review queue. Open community flags + the annotator roster.
// Unlinked + noindexed. Flags resolve by editing data/field-notes/flags.jsonl
// (status: open → resolved/dismissed) and committing: archive-first.

import type { Metadata } from "next";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

export const metadata: Metadata = { title: "Review Queue · Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

function readJsonl(p: string) {
  if (!existsSync(p)) return [];
  return readFileSync(p, "utf8").trim().split("\n").filter(Boolean).map(l => JSON.parse(l));
}

export default function ReviewQueue() {
  const dir = join(process.cwd(), "data/field-notes");
  const flags = readJsonl(join(dir, "flags.jsonl"));
  const notes = readJsonl(join(dir, "notes.jsonl"));
  const annotators = existsSync(join(dir, "annotators.json"))
    ? JSON.parse(readFileSync(join(dir, "annotators.json"), "utf8")).annotators
    : [];
  const open = flags.filter((f: { status: string }) => f.status === "open");

  return (
    <div style={{ background: "#f2f5f9", minHeight: "100vh", fontFamily: "var(--font-outfit,sans-serif)" }} className="px-5 py-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "#1a3a5c", fontFamily: "var(--font-playfair,serif)" }}>
          Field Notes Review Queue
        </h1>
        <p className="text-xs mb-6" style={{ color: "#6b7280" }}>
          {open.length} open flag{open.length !== 1 ? "s" : ""} · {notes.length} Field Notes posted · {annotators.length} verified annotators
        </p>

        <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-2" style={{ color: "#9ca3af" }}>Open flags</p>
        {open.length === 0 && <div className="hcp-card p-4 mb-6 text-sm" style={{ color: "#6b7280" }}>Queue clear.</div>}
        <div className="space-y-2.5 mb-8">
          {open.map((f: { target: string; reason: string; contact: string | null; at: string }, i: number) => (
            <div key={i} className="hcp-card p-4">
              <p className="text-[10px] font-mono font-bold" style={{ color: "#b45309" }}>{f.target}</p>
              <p className="text-sm mt-1" style={{ color: "#1f2937" }}>{f.reason}</p>
              <p className="text-[10px] mt-1.5" style={{ color: "#9ca3af" }}>
                {new Date(f.at).toLocaleString("en-US")}{f.contact ? ` · ${f.contact}` : " · anonymous"}
              </p>
            </div>
          ))}
        </div>

        <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-2" style={{ color: "#9ca3af" }}>Verified annotators</p>
        <div className="hcp-card p-4">
          {annotators.map((a: { name: string; affiliation: string; tier: string }, i: number) => (
            <p key={i} className="text-xs py-1" style={{ color: "#1f2937" }}>
              <strong>{a.name}</strong> · {a.affiliation} · <span className="uppercase text-[10px] font-bold" style={{ color: "#0f766e" }}>{a.tier}</span>
            </p>
          ))}
        </div>
        <p className="text-[10px] mt-4 leading-relaxed" style={{ color: "#9ca3af" }}>
          Resolve flags by setting status in data/field-notes/flags.jsonl and committing.
          Issue annotator keys by adding to annotators.json. Tiers: media, academic, community.
        </p>
      </div>
    </div>
  );
}
