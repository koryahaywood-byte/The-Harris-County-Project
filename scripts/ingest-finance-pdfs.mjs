#!/usr/bin/env node
// Step 2 of the finance pipeline: extract totals from every PDF in
// data/finance-pdfs/ and write timestamped JSON + a human review table.
//
//   node scripts/ingest-finance-pdfs.mjs
//   ANTHROPIC_API_KEY=sk-... node scripts/ingest-finance-pdfs.mjs   # better extraction
//
// Extraction strategy (Texas C/OH form cover sheet, page 2-4 depending on variant):
//   1. pdf-parse text extraction + regex on the standard C/OH cover-sheet labels
//   2. If ANTHROPIC_API_KEY is set, Claude reads the PDF directly — far more
//      reliable on scanned/handwritten filings (same approach as the live
//      /api/finance/harris-county route)
//   3. Every record gets a confidence flag; low-confidence rows are called out
//      in REVIEW.md for eyeballing before publish
//
// Output:
//   data/finance-processed/<ISO-timestamp>.json
//   data/finance-processed/REVIEW.md   ← read this before running finance-publish

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT     = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PDF_DIR  = path.join(ROOT, "data/finance-pdfs");
const OUT_DIR  = path.join(ROOT, "data/finance-processed");
fs.mkdirSync(OUT_DIR, { recursive: true });

const pdfFiles = fs.readdirSync(PDF_DIR).filter(f => f.endsWith(".pdf"));
if (!pdfFiles.length) {
  console.error("No PDFs in data/finance-pdfs/ — run `npm run finance-fetch` first or drop PDFs in manually.");
  process.exit(1);
}

const HAS_CLAUDE = !!process.env.ANTHROPIC_API_KEY;
if (!HAS_CLAUDE) {
  console.log("ℹ ANTHROPIC_API_KEY not set — using text extraction only. Scanned/handwritten");
  console.log("  filings will come back low-confidence. Set the key for reliable extraction.\n");
}

// ── Strategy 1: text extraction + C/OH cover sheet regex ─────────────────────
async function extractViaText(buf) {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: new Uint8Array(buf) });
  const { text } = await parser.getText();
  await parser.destroy();

  const money = (label) => {
    // C/OH labels: "TOTAL CONTRIBUTIONS", "TOTAL EXPENDITURES",
    // "TOTAL CONTRIBUTIONS MAINTAINED" (= cash on hand)
    const re = new RegExp(`${label}[\\s\\S]{0,200}?\\$?\\s*([\\d,]+\\.?\\d{0,2})`, "i");
    const m = text.match(re);
    return m ? parseFloat(m[1].replace(/,/g, "")) : null;
  };

  const period = text.match(/period\s*(?:covered|from)?[\s:]*([\d/]+)\s*(?:through|to|-)\s*([\d/]+)/i);

  return {
    raised:    money("TOTAL\\s+(?:POLITICAL\\s+)?CONTRIBUTIONS(?!\\s+MAINTAINED)"),
    spent:     money("TOTAL\\s+(?:POLITICAL\\s+)?EXPENDITURES"),
    cash:      money("TOTAL\\s+CONTRIBUTIONS\\s+MAINTAINED") ?? money("CASH\\s+ON\\s+HAND"),
    loans:     money("TOTAL\\s+PRINCIPAL\\s+AMOUNT\\s+OF\\s+ALL\\s+OUTSTANDING\\s+LOANS"),
    period:    period ? `${period[1]} – ${period[2]}` : null,
    method:    "text-regex",
    textLength: text.length,
  };
}

// ── Strategy 2: Claude reads the PDF directly ─────────────────────────────────
async function extractViaClaude(buf, filename) {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic();
  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 500,
    messages: [{
      role: "user",
      content: [
        { type: "document", source: { type: "base64", media_type: "application/pdf", data: buf.toString("base64") } },
        { type: "text", text:
`This is a Texas C/OH campaign finance report. Find the COVER SHEET SUPPORT & TOTALS page (labeled "FORM C/OH SUPPORT & TOTALS COVER SHEET PG 2"). For Justice of the Peace filers this summary page is typically page 3 of the PDF; for city council and county officials it is usually page 2 or 4. Extract:
- candidateName
- office sought/held
- reportingPeriod (from–through dates on the cover sheet)
- totalRaised = field 2 "TOTAL POLITICAL CONTRIBUTIONS (OTHER THAN PLEDGES, LOANS...)"
- totalSpent = field 4 "TOTAL POLITICAL EXPENDITURES"
- cashOnHand = field 5 "TOTAL POLITICAL CONTRIBUTIONS MAINTAINED AS OF THE LAST DAY OF REPORTING PERIOD"
- outstandingLoans = field 6 "TOTAL PRINCIPAL AMOUNT OF ALL OUTSTANDING LOANS"
Respond ONLY with JSON: {"candidateName":"","office":"","reportingPeriod":"","totalRaised":0,"totalSpent":0,"cashOnHand":0,"outstandingLoans":0,"legible":true}
Use null for any value you cannot read. Set legible:false if the form is handwritten/scanned poorly.` },
      ],
    }],
  });
  const raw = msg.content.find(b => b.type === "text")?.text ?? "";
  const json = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? "{}");
  return {
    raised: json.totalRaised, spent: json.totalSpent, cash: json.cashOnHand, loans: json.outstandingLoans,
    period: json.reportingPeriod ?? null,
    candidateName: json.candidateName ?? null,
    officeOnForm:  json.office ?? null,
    legible: json.legible !== false,
    method: "claude",
  };
}

// ── Parse metadata back out of the filename convention ────────────────────────
function parseFilename(fname) {
  // LASTNAME-FIRSTNAME-OFFICE-YYYY-MM-DD.pdf — office may contain hyphens, so
  // anchor on the trailing date.
  const m = fname.replace(/\.pdf$/i, "").match(/^([A-Z]+)-([A-Z-]+?)-(.+)-(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return { last: null, first: null, office: null, filingDate: null };
  const [, last, first, office, y, mo, d] = m;
  const title = (s) => s.split("-").map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(" ");
  return { last: title(last), first: title(first), office: title(office), filingDate: `${y}-${mo}-${d}` };
}

// ── Run ───────────────────────────────────────────────────────────────────────
console.log(`Extracting ${pdfFiles.length} PDFs (${HAS_CLAUDE ? "Claude + text fallback" : "text only"})…\n`);
const records = [];

for (const fname of pdfFiles) {
  const buf  = fs.readFileSync(path.join(PDF_DIR, fname));
  const meta = parseFilename(fname);
  let result, confidence;

  try {
    if (HAS_CLAUDE) {
      result = await extractViaClaude(buf, fname);
      confidence = !result.legible ? "low"
        : (result.raised == null || result.cash == null) ? "medium" : "high";
    } else {
      result = await extractViaText(buf);
      const got = [result.raised, result.spent, result.cash].filter(v => v != null).length;
      confidence = result.textLength < 500 ? "low"        // scanned image, no text layer
        : got === 3 ? "medium"                             // regex never gets "high"
        : got >= 1 ? "low" : "low";
    }
  } catch (err) {
    result = { method: "failed", error: String(err.message ?? err) };
    confidence = "failed";
  }

  records.push({
    file: fname,
    name: meta.first && meta.last ? `${meta.first} ${meta.last}` : (result.candidateName ?? "UNKNOWN"),
    office: meta.office ?? result.officeOnForm ?? "UNKNOWN",
    filingDate: meta.filingDate,
    reportingPeriod: result.period ?? null,
    raised: result.raised ?? null,
    spent:  result.spent ?? null,
    cash:   result.cash ?? null,
    loans:  result.loans ?? null,
    confidence,
    extractionMethod: result.method,
    error: result.error ?? null,
  });
  const icon = { high: "✓", medium: "~", low: "⚠", failed: "✗" }[confidence];
  console.log(`  ${icon} [${confidence.padEnd(6)}] ${fname}  cash=${result.cash ?? "?"}`);
}

// ── Write outputs ──────────────────────────────────────────────────────────────
const stamp   = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const outJson = path.join(OUT_DIR, `${stamp}.json`);
fs.writeFileSync(outJson, JSON.stringify({ extractedAt: new Date().toISOString(), records }, null, 2));

const fmt = (v) => v == null ? "—" : `$${Number(v).toLocaleString()}`;
const review = [
  `# Finance Extraction Review — ${stamp}`,
  "",
  "Eyeball every row before running `npm run finance-publish`. Open the source PDF",
  "for anything ⚠ low or ✗ failed and correct values directly in the JSON file:",
  `\`data/finance-processed/${stamp}.json\``,
  "",
  "| | Name | Office | Period | Raised | Spent | Cash on hand | Method |",
  "|---|---|---|---|---|---|---|---|",
  ...records
    .sort((a, b) => ({ failed: 0, low: 1, medium: 2, high: 3 })[a.confidence] - ({ failed: 0, low: 1, medium: 2, high: 3 })[b.confidence])
    .map(r => `| ${({ high: "✓", medium: "~", low: "⚠", failed: "✗" })[r.confidence]} | ${r.name} | ${r.office} | ${r.reportingPeriod ?? "—"} | ${fmt(r.raised)} | ${fmt(r.spent)} | ${fmt(r.cash)} | ${r.extractionMethod} |`),
  "",
  `Source PDFs: \`data/finance-pdfs/\` · ${records.filter(r => r.confidence === "high").length} high / ${records.filter(r => r.confidence === "medium").length} medium / ${records.filter(r => r.confidence === "low").length} low / ${records.filter(r => r.confidence === "failed").length} failed`,
].join("\n");
fs.writeFileSync(path.join(OUT_DIR, "REVIEW.md"), review);

console.log(`\n══ Extraction done ══`);
console.log(`  JSON:   data/finance-processed/${stamp}.json`);
console.log(`  Review: data/finance-processed/REVIEW.md  ← READ THIS before finance-publish`);
const bad = records.filter(r => r.confidence === "low" || r.confidence === "failed").length;
if (bad) console.log(`  ⚠ ${bad} record(s) need manual verification against the source PDF.`);
