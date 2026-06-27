// Pipeline health — every ingestion job, its last run, and its failures,
// visible immediately. Unlinked + noindexed, same model as /admin/freshness.
// Refresh: node scripts/run-pipelines.mjs

import type { Metadata } from "next";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import Link from "next/link";

export const metadata: Metadata = { title: "Pipeline Health · Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

interface JobHealth {
  name: string; source: string; feeds: string[]; cadence: string;
  status: "ok" | "failed" | "blocked" | "skipped";
  detail: string | null; error: string | null; lastRun: string; durationMs: number;
}

const STATUS_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
  ok:      { bg: "#16a34a18", fg: "#15803d", label: "OK" },
  failed:  { bg: "#dc262618", fg: "#b91c1c", label: "FAILED" },
  blocked: { bg: "#d9770618", fg: "#b45309", label: "BLOCKED" },
  skipped: { bg: "#6b728018", fg: "#6b7280", label: "SKIPPED" },
};

export default function PipelinesAdmin() {
  const path = join(process.cwd(), "public/data/pipeline-health.json");
  const health = existsSync(path)
    ? JSON.parse(readFileSync(path, "utf8")) as { updatedAt: string; jobs: Record<string, JobHealth> }
    : null;

  const jobs = health ? Object.entries(health.jobs) : [];
  const failed = jobs.filter(([, j]) => j.status === "failed").length;
  const blocked = jobs.filter(([, j]) => j.status === "blocked").length;

  return (
    <div style={{ background: "#f2f5f9", minHeight: "100vh", fontFamily: "var(--font-outfit,sans-serif)" }} className="px-5 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-baseline justify-between flex-wrap gap-2 mb-1">
          <h1 className="text-2xl font-bold" style={{ color: "#1a3a5c", fontFamily: "var(--font-playfair,serif)" }}>
            Pipeline Health
          </h1>
          <Link href="/admin/freshness" className="text-xs underline" style={{ color: "#6b7280" }}>data freshness →</Link>
        </div>
        <p className="text-xs mb-6" style={{ color: "#6b7280" }}>
          {health
            ? `Last orchestrator run ${new Date(health.updatedAt).toLocaleString("en-US")} · ${jobs.length} jobs · ${failed} failed · ${blocked} blocked`
            : "No runs recorded yet — run `node scripts/run-pipelines.mjs`."}
        </p>

        <div className="space-y-3">
          {jobs.map(([id, j]) => {
            const s = STATUS_STYLE[j.status] ?? STATUS_STYLE.skipped;
            return (
              <div key={id} className="hcp-card p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.fg }}>{s.label}</span>
                      <p className="font-bold text-sm" style={{ color: "#1a3a5c" }}>{j.name}</p>
                      <span className="text-[10px] font-mono" style={{ color: "#9ca3af" }}>{id}</span>
                    </div>
                    <p className="text-[11px] mt-1" style={{ color: "#6b7280" }}>
                      {j.source} · {j.cadence} · feeds: {j.feeds.join(", ")}
                    </p>
                    {j.detail && <p className="text-[11px] mt-1" style={{ color: "#374151" }}>{j.detail}</p>}
                    {j.error && (
                      <p className="text-[11px] mt-1 font-mono rounded-lg px-2.5 py-1.5" style={{ background: "#dc262610", color: "#b91c1c" }}>
                        {j.error}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px]" style={{ color: "#9ca3af" }}>
                      {new Date(j.lastRun).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </p>
                    <p className="text-[10px]" style={{ color: "#9ca3af" }}>{(j.durationMs / 1000).toFixed(1)}s</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-[10px] mt-6 leading-relaxed" style={{ color: "#9ca3af" }}>
          Run all: <code>node scripts/run-pipelines.mjs</code> · one job: <code>--only fec-donors</code>.
          Logs append to data/pipeline-logs/. Vercel&apos;s filesystem is ephemeral — scheduled runs
          happen on a machine with the repo and commit their outputs (archive-first model).
        </p>
      </div>
    </div>
  );
}
