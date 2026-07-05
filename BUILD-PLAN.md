# Harris County Project — 3-Session Build Plan
_Target: premium paid-product standard for commissioners' offices and top political consultants._
_Written 2026-07-05 from a full codebase audit. Each session is a self-contained prompt: paste it into a fresh Claude Code session in `~/harris-county-project`._

---

## SESSION 1 — Critical fixes (trust + correctness)
**Model: Claude Sonnet 4.6** (mechanical, precise, high-volume edits; no taste judgment needed)

Paste this prompt:

> Fix every trust-breaking defect in the Harris County Project. Work through this list in order, commit after each item, run `npx tsc --noEmit` before each commit.
>
> 1. **Voter-privacy copy (legal/reputational).** The homepage Voter Search card says "See who voted, when, and how." Texas voter files record participation and which primary a voter pulled — never ballot choices. Change to "See who voted, in which elections, and which primary they pulled." Then grep the whole repo (`app/`, `lib/`, `components/`) for any other copy implying ballot-choice visibility ("how they voted", "how it voted" is fine for precincts — aggregate results are public; individual "how" is not) and fix each. Precinct-level "how it voted" language is correct and stays.
> 2. **The Brief serves raw AI refusal text.** `/api/city-hall` (app/api/city-hall/route.ts) asks Haiku for a 2-sentence lede; when the model lacks source material it returns "I don't have information about what actually happened…" and that string is rendered to users. Fix: validate the model output — if it contains first-person refusal markers (`I don't have`, `I'd need`, `I cannot`, `as an AI`) or is shorter than 40 chars, fall back to a deterministic lede built from the meeting title/date ("Houston City Council met on {date}. Read Emily Takes Notes' full recap."). Never render model output that fails validation. Add the same guard to every other route that renders LLM output (`/api/chat` is user-facing chat, fine; audit any other summarizers).
> 3. **PAC Tracker renders an empty shell.** `/api/finance/pac` currently returns `source:"unavailable"` with zero expenditures, and the tool shows zeros as if that were data. Add a real empty state to `app/tools/pac-tracker/page.tsx`: when `source === "unavailable"`, show "FEC independent-expenditure feed is unavailable right now" with a retry button and a link to fec.gov — never render $0 as if it were a fact. Then fix the API itself: the FEC endpoint needs `FEC_API_KEY` (free from api.data.gov) — read it from env, and document it in README + `.env.example`.
> 4. **Bill Tracker + Congress Bills 500 without LEGISCAN_API_KEY.** Both API routes throw. Add graceful degradation: return `{available:false, reason:"key"}` with HTTP 200, and have both tools render a proper "live bill data requires configuration" state instead of an error. Create `.env.example` documenting `LEGISCAN_API_KEY`, `ANTHROPIC_API_KEY`, `FEC_API_KEY`, and the voters.db requirement.
> 5. **Voter Search without voters.db.** `/api/voter-search` returns `{status:"no_data"}` when `data/voters.db` is absent (it's gitignored — 2.4M rows). The tool must detect that status and show "Voter file not loaded on this deployment" rather than an empty results table. Also: the API returns `dob_year`, `gender`, `estimated_race`, full address. Confirm the UI only shows what a Texas public voter file legally exposes, and add a small "This is public data under Texas Election Code §18.008" methodology note to the page.
> 6. **Single source of truth for race ratings.** `lib/dashboard-data.ts` has a hardcoded `BALLOT` array with its own competitiveness calls (Lean D / Toss-up) that can drift from `lib/matchups-2026.ts` (the real ratings store). Rewrite the dashboard ballot strip to derive from `MATCHUPS_2026` (pick the 6 marquee races by key). Same audit for `app/tools/tx-house/page.tsx` — its ratings should come from `MATCHUPS_2026.lean` with derivation from `district-races.json` only as fallback for unrated seats.
> 7. **Extract embedded data tables from components.** Move `NOTABLE_DAYS` out of `components/DashboardWidget.tsx` into `lib/notable-days.ts`. Move the hardcoded budget tables from `app/tools/public-money/page.tsx` into `lib/budget-data.ts`. Move endorsements/consultants data from `app/tools/the-network/page.tsx` into `lib/network-data.ts`. Pure moves — no behavior change; verify each page renders identically after.
> 8. **Headshot resilience.** `lib/politicians.ts` photo URLs point at 8+ external hosts (jp.hctx.net, wixstatic, squarespace-cdn, communityimpact…). Any can break silently. Add `onError` fallback to initials-avatar in every component that renders `photo` (OfficialCard, politicians pages, my-officials, leaderboard). Then write `scripts/check-photos.mjs` that HEADs every photo URL and prints failures, and add it as `npm run check-photos`.
> 9. Push everything.

**Definition of done:** no route serves raw LLM refusals, no tool renders fake zeros, all env dependencies documented and gracefully degraded, one ratings source, no privacy-false copy, `tsc` clean.

---

## SESSION 2 — Six core tools made exceptional
**Model: Claude Fable 5** (judgment-heavy: information design, editorial voice, data narrative)

Paste this prompt:

> Take the six core tools of the Harris County Project to the standard a county commissioner's chief of staff or a $5k/mo consultant would pay for. The bar for each tool: a professional opens it and learns something they'd otherwise have paid staff to compile. Work tool by tool, commit per tool, `npx tsc --noEmit` before each commit. Match existing visual language (navy #1a3a5c, serif display headers, uppercase-tracked labels).
>
> **1. Heat Check** (`/tools/heat-check`) — Add a persistent "insight rail": top 5 precincts by D-shift and R-shift since 2020, biggest turnout collapses, and flippable precincts (45–50% D with falling turnout). Every precinct popup gets a "→ full history" deep-link into Precinct History and a "→ district portrait" link. Make cycle-comparison a first-class control (2020 vs 2024 side-by-side or delta view), not buried.
> **2. Where the Money Resides** (`/tools/where-is-the-dough`) — Add a race-centric view: for every 2026 matchup in MATCHUPS_2026, a D-vs-R cash duel bar with burn rate (spent/raised) and days-of-runway. Add "biggest movers since last filing" using data/finance-history. Every candidate name deep-links to their politician page and their TEC/FEC filing.
> **3. Districts** (`/tools/districts`) — The portrait page becomes a true briefing: add "path to win" narrative synthesis (win number vs 2026 primary turnout gap, which precincts hold the margin), embed the top-10 highest-leverage precincts table for the selected district from the field-sweep classification, and a one-click "export district brief" (print stylesheet → PDF via browser).
> **4. Who Represents Me** (`/my-officials`) — After match, add "your ballot in November" section pulled from MATCHUPS_2026 filtered to the user's districts, with lean badges and money duels. Add per-official accountability chips: next election year, cash on hand, bills passed (when key present). Make the share card carry the user's district set, not the generic tool card.
> **5. 2026 Ballot** (`/tools/ballot-2026`) — Editorialize: lead each race group with the one-line stake ("The county judge race decides flood-bond execution"). Add a "what changed this week" strip (rating moves, new filings, money swings) sourced from finance-history diffs. Cross-link every legislative race to the TX House Board and district portrait.
> **6. TX House Board** (`/tools/tx-house`) — Add sorting (by margin, by cash gap, by rating), a "battleground only" toggle, per-seat sparkline of D% across cycles (data already in district-races.json), and a methodology footnote explaining the rating derivation. Add seat-flip scenario math: "D +2 seats → chamber at X-Y".
>
> **Cross-cutting for all six:** every number on screen must carry provenance on hover or footer (SourceBadge exists — use it consistently); every view state must round-trip through the URL (useUrlState exists — extend it to any filter not yet in the query string); kill any remaining "Explore"-style CTAs for specific verbs.

**Definition of done:** each of the six tools passes the test "would a Commissioners Court staffer screenshot this into a memo?" — and every screenshot-worthy view has a URL that reproduces it.

---

## SESSION 3 — Visual polish + live-data social shares
**Model: Claude Fable 5 with the `frontend-design` skill invoked at session start** (aesthetic judgment; the share spec is architecture + design combined)

Paste this prompt:

> Final polish pass on the Harris County Project. Invoke the frontend-design skill first. Two workstreams; commit per item.
>
> **A. Live-data social share images (the spec):**
> Share images must capture the actual data showing on screen — never the tool's generic landing card. The architecture (no screenshots, no headless browser):
> 1. Every tool already pushes filter state into the URL via useUrlState. Complete this: any control that changes what's on screen (selected district, cycle, tab, sort) must serialize to the query string.
> 2. Convert each core tool's `layout.tsx` metadata to `generateMetadata({ searchParams })` and build the `/api/og` URL from the same params the page renders from — district name, the actual D%/R% bar values, cash figures, rating. The OG endpoint runs on edge with ImageResponse: extend `app/api/og/route.tsx` to render (a) a horizontal D-vs-R result bar when `bar=D|R|dpct` params present, (b) a cash-duel bar when `duel=` present, (c) up to 3 stat blocks (existing). The image IS the data — a person seeing the card in a group chat reads the result without clicking.
> 3. ShareButton's copied link must be the fully-serialized URL so the platform's crawler hits generateMetadata with the exact view state. Verify end-to-end: `curl -s localhost:3000/tools/districts?type=hd&district=134 | grep og:image` must show HD-134's actual numbers in the og URL. Do this for: districts, tx-house, ballot-2026, heat-check, where-is-the-dough, my-officials (my-officials shares district set, never the address).
> 4. Politician card shares (`/politicians/[slug]/card`) already exist — align their OG to the same system.
>
> **B. Visual polish:**
> 1. Typography rhythm audit: one consistent scale for page title / section header / card label across all 23 tools (several tools freelance their own sizes). Fix outliers to the dominant pattern.
> 2. Empty/loading states: every fetch-dependent view gets a branded skeleton (navy shimmer) instead of spinners or layout jumps; every error state gets the Session-1 pattern (plain language + retry + source link).
> 3. Mobile pass on the six core tools: tables become card stacks under 640px, maps get touch-friendly controls, sticky headers don't eat viewport. Test at 380px.
> 4. Homepage: replace remaining Unsplash card photos with data-true previews for tools where a real preview is cheap (tx-house seat bar, heat-check map thumbnail, ballot lean strip) — the ImageRepository of a data product is its own data.
> 5. Print stylesheets for districts + ballot-2026 + tx-house ("export brief" from Session 2 depends on this).
> 6. Lighthouse: 90+ performance on homepage and the six core tools; lazy-load the 2.9MB heat-check payload and any three.js components (Hero3D et al.) that aren't above the fold.
>
> **Definition of done:** paste any filtered view's URL into iMessage/Slack/X and the preview card shows the actual numbers from that view; every tool looks intentional at 380px and 1440px; no spinner anywhere, only branded skeletons.

---

## Deferred / parked (do not touch)
- endorsement-flowchart, consultant-flowchart, donor-network, tirz, city-budget, county-budget, beats → redirect stubs into merged tools (by design)
- discretionary-funds + infrastructure-funding standalone routes → off-grid by design (embedded in Public Money tabs)
- Hidden tools rework (endorsement/consultant/infrastructure relisting) → separate future effort per project memory
