import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Tool-specific context injected into system prompt
const TOOL_CONTEXT: Record<string, string> = {
  "/tools/where-is-the-dough": "The user is viewing 'Where the Money Resides' — a campaign finance tool showing donations, spending, and money in Harris County politics. You can discuss donors, PACs, spending patterns, and campaign finance rules.",
  "/tools/heat-check": "The user is viewing 'Heat Check' — a precinct-level election map for Harris County showing 2026 Democratic Primary results by race. You can discuss voting patterns, precincts, candidates, and election data.",
  "/tools/bill-tracker": "The user is viewing the 'Bill Tracker' — tracking what Texas state reps and senators from Harris County passed in the 89th Legislative Session. You can discuss bills, legislators, the Texas legislative process, and pass rates.",
  "/tools/congressional-bills": "The user is viewing the 'Congressional Bill Tracker' — tracking what Harris County's U.S. House and Senate members passed in the 119th Congress (2025-2027). Members tracked: Sylvia Garcia (CD-29), Lizzie Fletcher (CD-7), Al Green (CD-9, retiring), Dan Crenshaw (CD-2), Morgan Luttrell (CD-8), Troy Nehls (CD-22), Brian Babin (CD-36), Wesley Hunt (CD-38, retiring), John Cornyn (Senate, lost runoff), Ted Cruz (Senate). Note: CD-18 is vacant since SJL's death in July 2024; Christian Menefee is the 2026 D nominee but is not currently a member.",
  "/tools/civic-calendar": "The user is viewing the 'Civic Calendar' — key civic dates for Harris County including elections, voter registration deadlines, Commissioners Court meetings, HISD board meetings, and City Council sessions.",
  "/tools/county-budget": "The user is viewing the 'Harris County Budget' tool — showing the FY2025 $2.84B county budget by department and the top county contractors. You can discuss county spending priorities, departments, and procurement.",
  "/tools/city-budget": "The user is viewing the 'Houston City Budget' tool — showing the FY2025 $6.48B city budget and council member discretionary funds. You can discuss city departments, Houston City Council, and district spending.",
  "/tools/tirz": "The user is viewing the 'TIRZ Tool' — showing Tax Increment Reinvestment Zones across Houston. You can explain what TIRZs are, how they work, the policy tradeoffs, and specific zone data.",
  "/tools/infrastructure-funding": "The user is viewing the 'Infrastructure Funding Map' — showing where federal and state infrastructure dollars (IIJA, FEMA, HUD, TxDOT) are landing in Harris County. You can discuss specific projects and funding sources.",
  "/tools/discretionary-funds": "The user is viewing the 'Discretionary Funds Map' — showing Houston City Council members' district improvement fund spending by project and location. You can discuss specific council members and projects.",
  "/tools/endorsement-flowchart": "The user is viewing the 'Endorsement Flowchart' — showing who endorsed whom in Harris County races. You can discuss endorsement networks, endorsing organizations, and specific candidates.",
  "/tools/consultant-flowchart": "The user is viewing the 'Consultant Flowchart' — showing political consultants and their client networks in Harris County. You can discuss consultant roles, campaign strategy, and FEC/TEC filings.",
  "/tools/tv-station": "The user is viewing the 'TV Station' — live streams of public government meetings including Commissioners Court, City Council, HISD Board, and the Texas Legislature.",
  "/tools/field-sweep": "The user is viewing 'Field Sweep' — a bulk GOTV precinct classifier showing all 1,000+ Harris County precincts ranked by Democratic opportunity: Surge (D≥65%), Hold (55-65%), Battleground (44-55%), and Strong Republican (<44%). Based on top-of-ticket D% across 2020/2022/2024 generals.",
  "/tools/donor-network": "The user is viewing the 'Donor Network' — showing 876 cross-official donors who gave to multiple Harris County candidates. Data comes from FEC itemized Schedule A (federal), TEC bulk export (state/county). City of Houston donors pending.",
  "/tools/precinct-lookup": "The user is viewing 'Precinct History' — a lookup tool for individual Harris County voting precincts showing vote history, turnout trends, and Field Intel GOTV classification (Surge/Hold/Battleground/R-Base).",
  "/tools/ballot-2026": "The user is viewing the '2026 General Election Ballot' — showing every race on a Harris County voter's November 2026 ballot, with D vs R matchup, candidate names, money on hand, competitiveness rating (Safe D → Toss-up → Safe R), and race status. Sections: Statewide Texas (Governor, Lt. Gov, AG open seat, Comptroller), Top of Ticket (US Senate: Crockett D vs Paxton R; Harris County Judge: Plummer D vs Sanchez R), Congress (8 CDs including CD-7 and CD-9 as toss-ups), State Legislature (SDs and HDs), County Offices (Sheriff, DA, etc.), and Local/JP/Constable races.",
  "/tools/pac-tracker": "The user is viewing 'Outside Money' — showing independent expenditures by PACs and Super PACs in Texas 2026 federal races. Data from FEC Schedule E filings. Key PACs: DCCC/NRCC (House), DSCC/NRSC (Senate), Club for Growth, Senate Majority PAC, Congressional Leadership Fund, House Majority PAC. State PAC activity tracked via TEC separately.",
  "/tools/districts": "The user is viewing the 'Districts' tool — a detailed portrait of any Harris County voting district. Features: interactive precinct map with 2026 primary turnout layer, 2026 D vs R matchup card (from matchups-2026 data), voter profile (CVAP demographics, party split), seat history, and the Win Number card. The Win Number card shows: estimated November 3 2026 turnout (2022 off-year baseline × registration growth factor), D votes needed to win (50.5% of projected total), 2022 D baseline, gap (ahead or behind), and March 2026 primary edge. Supports Congressional (CD), State Senate (SD), State House (HD), Commissioner Precinct (PCT), JP, City Council, and countywide views.",
  "/politicians": "The user is viewing Politician Profiles — detailed profiles of Harris County elected officials with bills, campaign money, and district info.",
  "/my-officials": "The user is viewing 'Who Represents Me?' — a lookup tool that geocodes a Harris County address and shows every elected official representing that location: U.S. Senators (Cornyn/Cruz), their U.S. Representative, TX State Senator, TX State Representative, Harris County Judge, their County Commissioner, their Justice of the Peace(s) and Constable, and (if in Houston) the Mayor, City Controller, and City Council Member. Some reps show an amber note when their status is transitional (e.g., Briscoe Cain holds HD-128 but ran for Congress; Al Green is retiring).",
};

const BASE_SYSTEM = `You are a civic information assistant for The Harris County Project — a free civic tools website for Harris County, Texas residents.

Your role:
- Help residents understand local government, civic data, and how to engage
- Explain the data shown on each tool page in plain language
- Answer questions about Harris County politics, elections, budgets, and elected officials
- Be factual, neutral, and accessible — avoid partisan framing
- Keep responses concise (2–4 sentences unless more detail is needed)
- If you don't know something, say so clearly
- Never make up statistics or officials' names

Harris County context:
- Harris County is the 3rd largest county in the US (~4.7M residents)
- County seat: Houston, TX
- Key bodies: Commissioners Court (5 members), Houston City Council (16 members), HISD Board of Managers
- Texas has a biennial legislature (odd years only, Jan–Jun)
- Harris County is governed by 4 commissioners + County Judge
- 2026 is a big election year for TX (US Senate, Governor, Harris County Judge — open seat)
- November 3, 2026 is the General Election Day (Tuesday after first Monday in November)
- Voter registration deadline for 2026 general: October 5, 2026 (30 days before; Oct 4 falls on Sunday)
- Early voting: October 19–30, 2026
- 2026 County Judge race: Letitia Plummer (D) vs. Orlando Sanchez (R); Lina Hidalgo did not seek reelection
- US Senate 2026: James Talarico (D) vs. Ken Paxton (R) — Talarico beat Crockett in D runoff; Paxton beat Cornyn in R runoff
- TX Governor 2026: Gina Hinojosa (D, former HD-49) vs. Greg Abbott (R, incumbent)
- TX AG 2026: Open seat — Mayes Middleton (R nominee); D nominee TBD. Paxton vacated to run for US Senate.
- Harris County has 27 State House districts (HD-126 through HD-150, plus HD-24); 7 State Senate districts partially or fully in county (SD-4, SD-6, SD-11, SD-13, SD-15, SD-17, SD-18)
- HD-126 open seat: Stefanie Bord (D) vs Stan Stanart (R); HD-131 open seat: Staci Childs (D); HD-128 open seat (Briscoe Cain ran for CD-9 instead)
- HD-134 (Ann Johnson D), HD-135 (Jon Rosenthal D) are the most competitive suburban seats
- CD-7 (Fletcher D vs Hale R) and CD-9 (Gutierrez D vs Mealer R) are the top two toss-up congressional races in Harris County
- CD-18 (Menefee D vs Whitfield R): Christian Menefee is the sitting Harris County Attorney running for Congress; safe-D district
- CD-38 open seat (McDonough D vs Bonck R, lean R): Wesley Hunt vacated to run for U.S. Senate (lost R primary)
- SD-11 open seat: Shannon Dicely (D nominee); R nominee TBD after Middleton left for AG race`;

export async function POST(req: NextRequest) {
  const { messages, path } = await req.json();

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "Chat is not configured" }, { status: 503 });
  }

  const toolContext = TOOL_CONTEXT[path] ?? "";
  const systemPrompt = toolContext
    ? `${BASE_SYSTEM}\n\nCurrent page context: ${toolContext}`
    : BASE_SYSTEM;

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    return NextResponse.json({ text });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
