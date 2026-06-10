# Launch Audit — The Harris County Project
**Date:** June 10, 2026 (v2 — post Districts rebuild)

---

## 1. Shipped This Session

### Where the Money Resides
- JPs and all county officials now render (pending ones sort to bottom with a badge).
- New **county sub-filter**: All County / Commissioners Court / Justices of the Peace / County Courts / Law Enforcement / Clerks & Admin — isolates JPs against their peers.
- Real PDF-pipeline numbers merged in: Whitmire $2.74M, Korduba $79.7K, Lozano $66.6K, Stephens $28.4K (user-verified), Treviño, Rodriguez, Lombardino.
- Share button (native share / clipboard).

### Beat pages (all four)
- **Threads-style social feed** — single clean column, real avatars (pulled from X via unavatar), name + handle + time, post photos supported, action-icon row, thread connector lines.
- "Who Covers It" tab: journalist directory + hashtag library per beat.
- Houston Landing scrubbed everywhere (closed 2026); blogs page marks it Closed.
- **Congressional delegation corrected**: was 8 members including Pete Olson (left office 2021) and McCaul CD-10 (not a Harris district). Now the verified 9: Crenshaw 2, Fletcher 7, Luttrell 8, Green 9, Menefee 18, Nehls 22, Garcia 29, Babin 36, Hunt 38.

### Districts tool — full rebuild
- **Heat Check-style precinct map**: same precinct shapes as Heat Check (extracted from county results data), continuous fills across the whole county, white hairline borders, out-of-district precincts dimmed warm-gray. No more scattered "cutout" precincts.
- **Real district assignment**: built `lib/precinct-crosswalk.json` by point-in-polygon of all 1,172 precinct centroids against Census TIGER 2024 (Congress, State Senate, State House) and Harris County GIS (JP/Constable precincts) + City of Houston GIS (council districts). The old code was assigning precincts by `precinct number % district count` — literally random.
- **"Who Votes" layer (real)**: March 2026 primary ballots cast per precinct (D vs R, from the county results), choropleth + per-precinct tooltips + district-level aggregate in the sidebar.
- **"Population Demographics" layer (pending — see Data Needs)**.
- **Election Night layer**: upload a CSV (`precinct,Candidate A,Candidate B,…`) and the map colors every precinct by who leads, with margins in tooltips. Re-upload as counts update.
- **VS card under the map**: incumbent vs challenger for November 2026 with cash-on-hand bars (Talarico/Cornyn, Hidalgo/Howell w/ runoff badge, Menefee/Green runoff, Finnie/Crenshaw). Seats without confirmed challengers show "awaiting filings."
- Removed all fake seeded-random demographics from the old tool.

---

## 2. Data You Need to Provide (exact asks)

1. **Census API key** — free, instant: https://api.census.gov/data/key_signup.html (the API now rejects keyless requests). Set it as `CENSUS_API_KEY` in `.env.local` and Vercel. Unlocks: population race/ethnicity/age + citizen-voting-age population (CVAP) per district → fills the Districts "Population" layer automatically.
2. **Harris County voter file with vote history** — request from harrisvotes.com (Voter Registrar → Voter Registration Data Request). Needed format: CSV with at minimum `precinct, birth year, gender, vote history per election`. This is the only public source for *who actually shows up* demographics (race is modeled from surname/geography; age + gender are direct).
3. **2026 county-court judge roster** — the county portal shows 24 filings under "Judge" searches but the scraper can't parse filer names from that result page. Until verified names are added to `data/finance-roster.json`, the "County Courts" money filter shows an explainer instead of rows.

---

## 3. Launch-Readiness Audit — Every Weakness, Direct

### Trust problems (fix before promoting the site)
1. **FEC live data returns $0 for all six federal candidates** — the leaderboard silently falls back to static numbers. If those static numbers are stale, you're showing wrong money with a "live" badge elsewhere on the page. Diagnose the FEC route or remove the badge.
2. **Beat-page social posts are authored content, not real posts.** They read as if they're live pulls from X/Threads with timestamps ("2h ago") but they're hand-written. A journalist will notice in seconds. Either label the section "What the conversation looks like" or wire a real feed.
3. **14 county officials still show "Pending" money** — including Hidalgo, Ellis, Garcia, Gonzalez, Teare. These are the most-watched officials in the county; the tool's headline promise ("cash for every official") is unmet. Their scanned PDFs exceeded extraction limits; manual entry of the 5 biggest names would close most of the gap.
4. **JP money is from mixed filing periods** — Korduba's number is a 2021 filing, Treviño's is 2014 (most recent in the portal). The "as of" strings show it, but a casual reader compares them as if contemporaneous. Consider greying values older than 2024.
5. **Seat-history lists in Districts contain unverified older entries** (e.g., pre-2000 holders). Spot-check before press attention.

### Data gaps
6. **No congressional members or JPs in `lib/politicians.ts`** — Districts VS cards show initials instead of photos for federal seats; JP seats have no "current rep" card. 53 politicians exist; adding ~25 (9 House + 16 JPs) completes coverage.
7. **No county-court judges anywhere on the site** (politicians, money, districts).
8. **`DISTRICT_INFO` lacks descriptions/history for CD-8, CD-36, CD-38, and all JP precincts** — sidebar shows a bare header for those.
9. **Constables absent from harris-county-beat sidebar** despite being added to finance data.
10. **Bob Wolfe and Louie Ditta (JPs)** — no portal filings found; confirm whether they file under different names.

### Design inconsistencies
11. **Three different hero styles** across tools (gradient+photo on beats, flat navy on money, navy gradient on districts). Pick one system.
12. **Two different tab-bar styles** (rounded pills on money tool vs. rounded-top tabs on beats vs. sticky bar on city-hall).
13. **Heat Check is an iframe with its own header/branding** — feels like leaving the site. Long-term: port it into the app shell like Districts now is.
14. **Card radius/ring treatments vary** (1.75rem/1.35rem/2xl/3xl across tools).
15. **Share button exists only on the money tool** — components/ShareButton.tsx exists but isn't used on beats/districts/heat-check.

### Missing functionality
16. **No URL state** on leaderboard or districts — filters can't be shared/bookmarked (your share button copies a URL that loses the current view).
17. **Districts "Population" layer is an empty state** until the Census key arrives.
18. **No mobile pass done this session** — the districts control rows (type pills + up to 24 district chips + layer toggle) will wrap heavily on a phone; the VS card grid likely cramps below ~360px. Needs a real device check.
19. **Election-night upload doesn't persist** — refresh loses the results file (fine for v1, worth noting for election night ops).
20. **No loading/error UI if `/data/harris-precincts.geojson` fails** — map just stays in "Loading…".

### Done-but-verify (hot-reloaded on your local dev server now)
- Money tool: County → "Justices of the Peace" chip should list 16 JPs.
- Beats: Voices on Social tab should look like a Threads column with avatars; first post has a photo.
- Districts: pick Congress → 18; map should fill the whole county with the district in color, everything else dimmed; VS card under the map shows Menefee vs Al Green runoff.

---

## 4. Finance pipeline state
- Pipeline: fetch ✓ (25 PDFs) → extract ✓ (7 high-confidence) → publish ✓ → merged into site ✓.
- Discovery mode found judge filings but needs a parser fix for filer names (`scripts/fetch-finance-pdfs.mjs` discovery result page handling).
