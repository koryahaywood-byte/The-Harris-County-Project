import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

export interface ScanResult {
  status: "ok" | "no_key" | "error";
  url?: string;
  filer?: string;
  period?: string;
  raised?: number | null;
  spent?: number | null;
  cash?: number | null;
  topContributors?: { name: string; amount: number; city?: string }[];
  topExpenses?: { payee: string; amount: number; purpose?: string }[];
  rawText?: string;
  error?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse<ScanResult>> {
  const { url } = await req.json().catch(() => ({})) as { url?: string };

  if (!url?.trim()) {
    return NextResponse.json({ status: "error", error: "No URL provided" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ status: "no_key" });
  }

  // Download the PDF
  let pdfBuf: ArrayBuffer;
  try {
    const res = await fetch(url.trim(), { headers: { "User-Agent": "HarrisCountyProject/1.0" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    pdfBuf = await res.arrayBuffer();
  } catch (e) {
    return NextResponse.json({ status: "error", error: `Could not download PDF: ${String(e)}` }, { status: 422 });
  }

  const b64 = Buffer.from(pdfBuf).toString("base64");

  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey });

  // The document block type is supported by the API but may not yet be in SDK types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const content: any[] = [
    {
      type: "document",
      source: { type: "base64", media_type: "application/pdf", data: b64 },
    },
    {
      type: "text",
      text: `Extract campaign finance data from this Texas C/OH filing. Return ONLY valid JSON with this shape:
{
  "filer": "<candidate name>",
  "period": "<reporting period, e.g. Jan 1 – Jun 30 2024>",
  "raised": <total contributions as number or null>,
  "spent": <total expenditures as number or null>,
  "cash": <cash on hand as number or null>,
  "topContributors": [{"name":"...","amount":0,"city":"..."}],
  "topExpenses": [{"payee":"...","amount":0,"purpose":"..."}]
}
Include up to 10 top contributors and 10 top expenses by amount. Numbers must be plain numbers, no $ or commas. If a field is not found, use null.`,
    },
  ];

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{ role: "user", content }],
  });

  const raw = message.content[0]?.type === "text" ? message.content[0].text : "";

  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json({
      status: "ok",
      url: url.trim(),
      filer: parsed.filer,
      period: parsed.period,
      raised: parsed.raised,
      spent: parsed.spent,
      cash: parsed.cash,
      topContributors: parsed.topContributors ?? [],
      topExpenses: parsed.topExpenses ?? [],
    });
  } catch {
    return NextResponse.json({ status: "error", error: "Could not parse extraction", rawText: raw }, { status: 500 });
  }
}
