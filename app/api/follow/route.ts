// Follow an Official: email-only v1.
// POST { email, slug }  → subscribe   |  GET → subscriber list (alert queue)
//
// Storage: append-only JSONL at data/follows/follows.jsonl (the repo's
// archive-first pattern). On Vercel the filesystem is ephemeral, so every
// follow is ALSO forwarded to EMAIL_WEBHOOK_URL (same channel as the email
// gate). The webhook sheet is the durable subscriber store until a KV is
// wired. The alert worker (scripts/send-follow-alerts.mjs) consumes the
// local file when run on a machine with the repo.

import { NextRequest, NextResponse } from "next/server";
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "fs";
import { join } from "path";
import { POLITICIANS } from "@/lib/politicians";

const DIR = join(process.cwd(), "data/follows");
const FILE = join(DIR, "follows.jsonl");

export async function POST(req: NextRequest) {
  const { email, slug } = await req.json();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  const pol = POLITICIANS.find(p => p.slug === slug);
  if (!pol) {
    return NextResponse.json({ error: "Unknown official." }, { status: 400 });
  }

  const record = {
    email: email.toLowerCase().trim(),
    slug,
    official: pol.name,
    followedAt: new Date().toISOString(),
    alerts: ["new-filing", "significant-donor", "bill-movement"],
  };

  // Local append-only store
  try {
    if (!existsSync(DIR)) mkdirSync(DIR, { recursive: true });
    appendFileSync(FILE, JSON.stringify(record) + "\n");
  } catch {
    // Ephemeral FS (Vercel). Webhook below is the durable copy
  }

  // Durable forward
  const webhookUrl = process.env.EMAIL_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...record, source: "The Harris County Project. Follow an Official" }),
      });
    } catch { /* don't block the user */ }
  }

  console.log(`[FOLLOW] ${record.email} → ${pol.name} (${slug})`);
  return NextResponse.json({ ok: true, official: pol.name });
}

// The alert queue reads this to know who to notify.
export async function GET() {
  try {
    if (!existsSync(FILE)) return NextResponse.json({ follows: [] });
    const follows = readFileSync(FILE, "utf8").trim().split("\n").filter(Boolean).map(l => JSON.parse(l));
    return NextResponse.json({ count: follows.length, follows });
  } catch {
    return NextResponse.json({ follows: [] });
  }
}
