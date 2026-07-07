import { NextResponse } from "next/server";

// Deploy-drift beacon: exposes which commit this deployment was built from.
// Vercel injects VERCEL_GIT_COMMIT_SHA at build time; the daily routine
// compares this against origin/main and flags a stale deploy.
export async function GET() {
  return NextResponse.json({
    sha: process.env.VERCEL_GIT_COMMIT_SHA ?? "dev",
    builtFor: process.env.VERCEL_GIT_COMMIT_MESSAGE?.slice(0, 80) ?? null,
  });
}
