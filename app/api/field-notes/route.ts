// Field Notes. Verified-annotator context layer + community flags.
//   GET  ?target=<id>           notes + open flag count for a data point
//   POST { key, target, note }  add a Field Note (verified annotators only)
//   POST { flag: true, target, reason, contact? }  community flag (any user)
//
// Targets are stable ids: "official:rodney-ellis", "district:CD-18",
// "precinct:0952", "donor:NAME", "signal:turnout-drop-2024".
// Store: append-only JSONL (archive-first); EMAIL_WEBHOOK_URL gets a copy of
// every submission so nothing is lost to Vercel's ephemeral filesystem.

import { NextRequest, NextResponse } from "next/server";
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "fs";
import { join } from "path";

const DIR = join(process.cwd(), "data/field-notes");
const NOTES = join(DIR, "notes.jsonl");
const FLAGS = join(DIR, "flags.jsonl");

function readJsonl(path: string) {
  if (!existsSync(path)) return [];
  return readFileSync(path, "utf8").trim().split("\n").filter(Boolean).map(l => JSON.parse(l));
}

function annotators(): { key: string; name: string; affiliation: string; tier: string }[] {
  try { return JSON.parse(readFileSync(join(DIR, "annotators.json"), "utf8")).annotators; }
  catch { return []; }
}

async function mirror(record: unknown) {
  if (!process.env.EMAIL_WEBHOOK_URL) return;
  try {
    await fetch(process.env.EMAIL_WEBHOOK_URL, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...(record as object), source: "The Harris County Project. Field Notes" }),
    });
  } catch { /* non-blocking */ }
}

export async function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get("target");
  if (!target) return NextResponse.json({ error: "Missing target" }, { status: 400 });
  const notes = readJsonl(NOTES).filter(n => n.target === target && !n.removed);
  const flags = readJsonl(FLAGS).filter(f => f.target === target && f.status === "open").length;
  return NextResponse.json({ notes, openFlags: flags });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const target = String(body.target ?? "").slice(0, 120);
  if (!target) return NextResponse.json({ error: "Missing target" }, { status: 400 });

  // Community flag: open to anyone
  if (body.flag) {
    const reason = String(body.reason ?? "").trim().slice(0, 600);
    if (reason.length < 10) return NextResponse.json({ error: "Tell us what looks wrong (10+ characters)." }, { status: 400 });
    const record = {
      target, reason, contact: body.contact ? String(body.contact).slice(0, 120) : null,
      status: "open", at: new Date().toISOString(),
    };
    mkdirSync(DIR, { recursive: true });
    appendFileSync(FLAGS, JSON.stringify(record) + "\n");
    await mirror({ type: "flag", ...record });
    return NextResponse.json({ ok: true, queued: "Review queue. Verified annotators triage flags at /admin/review." });
  }

  // Field Note: verified annotators only
  const who = annotators().find(a => a.key === body.key);
  if (!who) return NextResponse.json({ error: "Not a verified annotator key. Media, academic, and community-org credentials are issued via the contact page." }, { status: 403 });
  const note = String(body.note ?? "").trim().slice(0, 1200);
  if (note.length < 15) return NextResponse.json({ error: "Notes need substance (15+ characters)." }, { status: 400 });

  const record = {
    id: `fn-${Date.now().toString(36)}`,
    target, note,
    author: who.name, affiliation: who.affiliation, tier: who.tier,
    at: new Date().toISOString(),
  };
  mkdirSync(DIR, { recursive: true });
  appendFileSync(NOTES, JSON.stringify(record) + "\n");
  await mirror({ type: "field-note", ...record });
  return NextResponse.json({ ok: true, note: record });
}
