import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  // Forward to a webhook/Zapier/Make endpoint if configured
  const webhookUrl = process.env.EMAIL_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          source: "The Harris County Project — Email Gate",
          timestamp: new Date().toISOString(),
        }),
      });
    } catch {
      // Don't block the user if webhook fails
    }
  }

  // Log to console so Vercel logs capture it even without a webhook
  console.log(`[EMAIL GATE] New subscriber: ${email} at ${new Date().toISOString()}`);

  return NextResponse.json({ ok: true });
}
