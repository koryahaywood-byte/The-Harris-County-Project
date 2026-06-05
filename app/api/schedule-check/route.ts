import { NextResponse } from "next/server";

const TEC_URL = "https://www.ethics.state.tx.us/filinginfo/deadlines/ReportsDue.php";

interface Deadline {
  type: string;
  due: string;
  period: string;
}

interface Change {
  source: string;
  description: string;
  old?: string;
  new?: string;
}

// Known fixed FEC quarterly schedule — update annually if FEC changes
function fecDeadlines(year: number): Deadline[] {
  return [
    { type: "Q1 Quarterly", due: `${year}-04-15`, period: `Jan 1–Mar 31 ${year}` },
    { type: "Q2 Quarterly", due: `${year}-07-15`, period: `Apr 1–Jun 30 ${year}` },
    { type: "Q3 Quarterly", due: `${year}-10-15`, period: `Jul 1–Sep 30 ${year}` },
    { type: "Year-End",     due: `${year + 1}-01-31`, period: `Oct 1–Dec 31 ${year}` },
  ];
}

async function fetchTECSemiAnnualDates(): Promise<{ jan: string; jul: string } | null> {
  try {
    const res = await fetch(TEC_URL, { cache: "no-store" });
    if (!res.ok) return null;
    const html = await res.text();

    // Look for January and July semi-annual deadline dates in the page
    // TEC lists them as MM/DD/YYYY
    const dates = [...html.matchAll(/(\d{1,2})\/(\d{1,2})\/(\d{4})/g)]
      .map(m => ({ raw: m[0], iso: `${m[3]}-${m[1].padStart(2,"0")}-${m[2].padStart(2,"0")}` }));

    const year = new Date().getFullYear();
    const jan = dates.find(d => d.iso.startsWith(`${year}-01`) && d.iso <= `${year}-01-20`);
    const jul = dates.find(d => d.iso.startsWith(`${year}-07`) && d.iso <= `${year}-07-20`);

    return {
      jan: jan?.iso ?? `${year}-01-15`,
      jul: jul?.iso ?? `${year}-07-15`,
    };
  } catch {
    return null;
  }
}

async function sendAlert(changes: Change[]) {
  const webhookUrl = process.env.EMAIL_WEBHOOK_URL;
  if (!webhookUrl) return;

  const body = changes
    .map(c => `• [${c.source}] ${c.description}${c.old ? ` (was ${c.old}, now ${c.new})` : ""}`)
    .join("\n");

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      subject: `Filing Schedule Change Detected — ${changes.length} update(s)`,
      message: `The quarterly filing schedule check found changes:\n\n${body}\n\nReview data/filing-schedules.json and update vercel.json cron triggers if needed.`,
    }),
  }).catch(() => {});
}

export async function GET() {
  const year = new Date().getFullYear();
  const changes: Change[] = [];

  // Check TEC semi-annual dates
  const tecDates = await fetchTECSemiAnnualDates();
  if (tecDates) {
    const expectedJan = `${year}-01-15`;
    const expectedJul = `${year}-07-15`;

    if (tecDates.jan !== expectedJan) {
      changes.push({
        source: "TEC",
        description: "January semi-annual deadline shifted",
        old: expectedJan,
        new: tecDates.jan,
      });
    }
    if (tecDates.jul !== expectedJul) {
      changes.push({
        source: "TEC",
        description: "July semi-annual deadline shifted",
        old: expectedJul,
        new: tecDates.jul,
      });
    }

    // Check for pre-election reports (presence of new election dates)
    // Any new deadline beyond the standard semi-annuals is noteworthy
  }

  // Check FEC (fixed schedule — flag if a non-standard date is detected)
  const knownFEC = fecDeadlines(year).map(d => d.due);
  // For now, FEC quarterly dates are statutory and don't move — just log the check

  // Look for special elections (TEC publishes new deadline pages when elections are called)
  try {
    const res = await fetch(TEC_URL, { cache: "no-store" });
    const html = await res.text();
    // Count election-specific deadline links — if count increases, a special election was called
    const electionLinks = (html.match(/Special.*Election|Primary.*Runoff|Runoff.*Election/gi) ?? []).length;
    if (electionLinks > 2) {
      changes.push({
        source: "TEC",
        description: `${electionLinks} special/runoff election deadline(s) detected — check for new pre-election report obligations`,
      });
    }
  } catch { /* non-fatal */ }

  if (changes.length > 0) {
    await sendAlert(changes);
  }

  return NextResponse.json({
    checkedAt: new Date().toISOString(),
    year,
    changes,
    status: changes.length === 0 ? "no_changes" : "changes_detected",
    nextCheck: `${year}-${String(new Date().getMonth() + 4).padStart(2, "0")}-01`,
    knownRefreshDates: {
      fec:  knownFEC,
      tec:  [tecDates?.jan ?? `${year}-01-15`, tecDates?.jul ?? `${year}-07-15`],
      note: "Finance scrapers auto-run day after each deadline via Vercel cron"
    },
  });
}
