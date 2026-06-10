# Launch Audit — The Harris County Project
**Date:** June 10, 2026 (v3 — four-loop pass: share, districts, visual, maintenance)

---

## 1. What Was Fixed

### Share system (Loop 1)
- **Removed the screenshot-based share entirely** (html-to-image uninstalled). ShareButton is now a true dynamic share: Web Share API with the current URL, a live text summary of the exact view, clipboard fallback, and X intent — all using real URL state.
- **Filter state now lives in the URL** on the two filter-heavy tools: Money (`?tab&level&group&party&q`) and Districts (`?type&district&layer`). Shared links reproduce the exact view. Verified: `?level=county&group=jp` restores the JP view; `?type=hd&district=131` restores HD-131.
- **Dynamic OG images**: new `/api/og` edge route renders the share card server-side from query params (tool, section, description, up to 3 stats). Tested — returns a 1200×630 PNG.
- **Per-tool OG metadata** added via layout files for all 9 share-enabled tools, so links unfurl with tool-specific cards on X/Threads/Slack.
- Tested share on: where-is-the-dough, districts, city-budget (modal + OG render + live summary), and confirmed the remaining 5 tools (county-budget, bill-tracker, congressional-bills, consultant-flowchart, endorsement-flowchart, tirz) load the identical component with compatible props.

### Districts map (Loop 2)
- **Heat Check parity:** every precinct now keeps its data color at all times. Out-of-district precincts fade to 14% opacity instead of going flat grey — the county reads as one continuous colored surface with the selected district popped, plus a dark outline traced around the active district. No gaps, no cutouts. (The earlier "broken" look was out-of-district grey at 35% swallowing the map.)
- Map loading state is now a shimmer skeleton ("Loading 1,172 precincts…"); a failed boundary fetch shows a deliberate error card with a retry button instead of hanging on "Loading…".

### Stale election data (Loop 2)
The May 2026 runoff results were already embedded in Heat Check but the rest of the site predated them. Now reconciled:
- `lib/matchups-2026.ts` rebuilt from actual primary + runoff totals: 20 races keyed to the Districts tool, statuses set/partial, with vote margins in the detail strings.
- Dashboard November ballot: County Judge and U.S. Senate now show as open races with the real nominees.
- Money tool's Senate story card rewritten (was "Talarico outraising Cornyn" — both lost).

### Losers removed / flagged sitewide (Loop 2) — full log
**Removed from candidate framing:**
| Person | Lost | Action |
|---|---|---|
| James Talarico | D Senate primary (Crockett 190,615 — Talarico 170,564 in Harris) | Removed from money tool data + story card; roster label → "lost D primary" |
| Annise Parker | D County Judge runoff (55,395 vs Plummer 57,893) | Replaced in matchups by Plummer |
| Warren Howell | R County Judge runoff (49,367 vs Sanchez 85,304) | Replaced in matchups by Sanchez |
| Al Green | CD-18 D runoff (10,771 vs Menefee 26,546) | Already labeled "lost runoff" in money tool; CD-18 matchup resolved to Menefee vs Whitfield |
| John Cornyn | R Senate runoff (52,041 vs Paxton 93,872 in Harris) | Matchup → Paxton; money label → "lost runoff — term ends Jan 2027" (kept: sitting senator) |

**Flagged, not removed (still hold office until Jan 2027):**
| Person | Why flagged | Where |
|---|---|---|
| Al Green (CD-9) | Lost CD-18 runoff, didn't seek CD-9 reelection | Congress-beat note: "Retiring — lost CD-18 runoff" |
| Wesley Hunt (CD-38) | Lost R Senate primary, gave up seat | Congress-beat note: "Leaving — ran for Senate, lost primary" |
| Hubert Vo (HD-149) | Lost D runoff to Darlene Breaux 1,053–1,623 | Matchup detail; still listed as sitting rep in politicians/bill-tracker (factually correct) |
| Sharon Burney (JP 7-2), Bob Wolfe (JP 5-2) | Lost primary/runoff | Matchup notes; still sitting JPs |
| Lina Hidalgo | Didn't run (not a loss) | County Judge race marked open; she remains County Judge in officials lists |

**Kept (historical records, year-tagged):** endorsement-flowchart and consultant-flowchart entries for Talarico/Edwards/etc. — they document who endorsed/worked for whom in past races, not current candidacies.

### Mobile breaks (Loop 3)
- `/tools/tv-station`: content panel overflowed to 454px at a 375px viewport (remote + non-wrapping pane). Fixed with a mobile min-width that forces the wrap. Now exactly 375.
- `/tools/tirz`: sort bar overflowed to 379px. Converted to the shared chip-row. Now 375.
- **All 23 routes audited at 375px** via same-origin iframe sweep — every route now ≤375px scroll width.

---

## 2. What Was Added

### Voter data in Districts (Loop 2)
- **Real CVAP racial/ethnic composition** for every Congressional, State Senate, and State House district — extracted from the Census CVAP 2019–2023 special tabulation (the exact source you cited; the bulk CSV needs no API key). New file: `public/data/cvap-districts.json`. CD-18 example: 39% Black, 30% Hispanic, 23% White, 5% Asian of citizens of voting age.
- **"Who Actually Votes Here" panel** under the VS card: party split of actual 2026 primary voters (real ballots), primary turnout rate (ballots ÷ CVAP), CVAP race bars, and an honest provenance note on what still requires the voter file.
- VS card now resolves matchups for 20 races including all 9 Harris congressional districts, 7 state house seats, 3 JP precincts, SD-11, and County Judge.

### Maintenance system (Loop 4)
- `UPDATE-SCHEDULE.md` — every data source, grouped daily/quarterly/biannual/annual/election-cycle, with file paths and update commands.
- `data/update-schedule.json` — machine-readable version with `maxAgeDays` per source.
- `scripts/check-data-freshness.js` + `npm run check-freshness` — compares file mtimes vs the schedule, writes `DATA-FRESHNESS-REPORT.md` and `public/data/freshness.json`, exits non-zero when something is overdue (CI-friendly). Currently: 15/15 current.
- `/admin/freshness` — unlinked, noindexed dashboard rendering the freshness snapshot.
- `WEEKLY-CHECKLIST.md` — 10-minute Monday routine.

### Design system (Loop 3)
- New tokens + utilities in globals.css: `--radius-card`, `.hcp-card` (one card treatment), `.chip-row` (one filter-pill row treatment), `.tnum` (tabular numerals — applied to the money leaderboard), `.pressable` (button press micro-motion), `.skeleton` (shimmer loading), `.empty-state` (deliberate-looking empty states). Applied to districts controls, tirz sort bar, money leaderboard, map loading/error, admin table.

---

## 3. Decisions Made Autonomously
1. **Lame ducks stay listed as officeholders.** "Remove every official who lost" was interpreted as removal from forward-looking candidate contexts only — deleting the sitting senator/JPs/state rep from officials lists would make the site factually wrong. They're flagged "term ends Jan 2027" instead.
2. **Statewide nominees inferred from Harris-only data, with caveats.** Heat Check only holds Harris County totals. The Crockett and Paxton nominations are recorded as set, but each matchup's detail string says the basis is Harris results. (No Dem runoff existing for Senate implies an outright statewide winner; Harris had Crockett +5.5.)
3. **Endorsement/consultant flowcharts keep losing candidates** as year-tagged historical records.
4. **Per-tool OG metadata is static per tool; per-filter OG is via the share modal.** True per-URL OG tags would require converting 9 client pages to server-wrapper architecture — deferred, logged below.
5. **Chip rows wrap on mobile rather than horizontally scroll.** A swipeable row was tried; DOM measurements vs rendered output disagreed under the preview's emulation, and wrapping is deterministic and accessible. No route overflows.
6. **Design research done from knowledge, not live browsing** of Texas Tribune/Marshall Project/CityLab (the patterns applied — restrained type scale, one accent, tabular numerals, provenance lines, skeleton loading, micro-motion only — are their house idioms). Live side-by-side comparison wasn't worth the time cost.
7. **Freshness uses file mtimes** with an explicit caveat (git clones reset mtimes). True content-based staleness would need per-source "asOf" parsing — overkill for v1.
8. **Crockett added to money tool with $0/Pending** — her Senate committee finance isn't in any local data; FEC live route may fill it once her committee ID is added to the roster.

## 4. Still Outstanding — with reasons
1. **Census API key** (you): keyless access is fully shut off (verified again this session — HTTP "Missing Key" page). Without it: no age breakdowns, no ACS profile data for the Districts population layer. CVAP race data is in (bulk file needs no key). Get one at api.census.gov/data/key_signup.html → `.env.local` + Vercel as `CENSUS_API_KEY`.
2. **Harris County voter file with vote history** (you): the only source for age ranges of actual voters, turnout across the last 3 elections, and primary-vs-general participation. harrisvotes.com → Voter Registrar → Voter Registration Data Request. Format: CSV with precinct, birth year, gender, per-election vote history. The "Who Actually Votes Here" panel states these gaps in-product.
3. **FEC live route returns $0 for federal candidates** — still undiagnosed (likely missing/invalid FEC API key or dead committee IDs). Static fallbacks carry the page. Needs a session with the route's request/response.
4. **Jasmine Crockett's Senate committee ID + finance** — shows "Pending" in the money tool until her FEC committee is added to `data/finance-roster.json`.
5. **County court judges** — 24 portal filings found but filer names unparseable; needs the discovery-parser fix or a manual roster.
6. **Top-5 pending county officials** (Hidalgo, Ellis, Garcia, Gonzalez, Teare) — scanned PDFs exceed extraction limits; manual entry is the fast path.
7. **Per-URL OG tags** (filter state reflected in the unfurl image) — needs server-wrapper refactor per tool (decision #4).
8. **Social posts on beat pages are authored content** styled as a live feed — unchanged this session; still the site's biggest trust risk. Label them or wire real APIs.
9. **R-side nominees marked "presumed"** for CD-8/22/36 (primaries outside Harris data) and missing entirely for CD-29, SD-11, several HD/JP races — needs TX SOS statewide canvass.
10. **Heat Check is still an iframe** with its own branding — porting it into the app shell is a larger refactor.
11. **Election-night upload doesn't persist** across refresh (fine for v1; noted for election-night ops).
12. **Before/after screenshots** were captured through the preview harness during this session rather than saved as image files — the preview's screenshot scaling was unreliable (zoomed compositing), so verification leaned on DOM measurements (scroll widths, computed styles). If you want a screenshot archive, say so and I'll script Playwright captures.

---

## What I need from you
1. **Census API key** → `.env.local` + Vercel (`CENSUS_API_KEY`). Unlocks the population layer. 2 minutes.
2. **Request the voter file** from harrisvotes.com (format above). Unlocks true turnout demographics.
3. **An FEC API key** (free, api.data.gov) if you want the live federal numbers diagnosed — or just tell me to dig into the existing route.
4. **County court judge roster** (or green-light a parser-fix session).
5. Optional: statewide canvass source for the non-Harris R primaries (TX SOS results export) to upgrade "presumed" nominees.

---

## Addendum — June 10, 2026 (evening pass)

### Fixed
- **Congressional districts were pre-redistricting.** The crosswalk used Census TIGER 2024 (old 118th-Congress map). Rebuilt against the **2025 enacted plan PLANC2333** from the Texas Legislative Council (shapefile reprojected from Texas Lambert Conformal Conic): **574 of 1,172 precincts changed CD**. CD-18 is now the compact central-Houston district; CD-9 is east Harris. CVAP racial data for CDs was re-aggregated from ~4,000 block groups against the new boundaries (CD-18: 50% Black CVAP; CD-9: 55% Hispanic). State house/senate (unchanged by 2025 redistricting) still use TIGER 2024.
- Money leaderboard now shows **raised, spent, and loans** alongside cash on hand (where filings provide them); same figures added to the Districts VS card. The PDF pipeline + FEC merge now extract outstanding loans going forward (TEC C/OH cover-sheet field 6; FEC debts-owed).

### Added
- **Kalshi prediction markets in the VS card**: new `/api/kalshi` route (public elections API, no key, 5-min cache) maps races to Kalshi margin-of-victory events and derives implied win probability from the lowest-strike market. Live for: US Senate (61% R), TX-Gov, and CDs 2/7/8/9/18/22/29/36/38. Races without a Kalshi market simply don't show the strip.
- The internal freshness dashboard is at **/admin/freshness** (unlinked + noindexed; refresh with `npm run check-freshness`).

### Hidden (not deleted)
- Endorsement Flowchart, Consultant Flowchart, Infrastructure Funding removed from homepage toolbox + footer; pages still reachable by URL with an "in development, unlisted" banner and noindex. Revisit logged in assistant memory; card definitions recoverable from git history.

### New caveats
- CD CVAP figures are sums of block groups within the greater-Harris window — for districts extending beyond (CD-8, CD-36), figures cover the Harris-area portion only (noted in the JSON).
- Kalshi probabilities derive from margin markets, not head-to-head winner markets (Kalshi doesn't list those per-race yet); the lowest-strike market slightly understates true win probability.
- Loans show only for filers whose reports have been re-extracted; run the finance pipeline at the July filing deadline to populate loans across the roster.
