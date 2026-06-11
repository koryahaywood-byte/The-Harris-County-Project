# IDEAS.md — Running Backlog
**Every feature ever requested, with status. Never delete entries — move them between sections.**
Last updated: June 11, 2026

---

## SHIPPED
- Where the Money Resides (cash/raised/spent/loans leaderboard, story tab, county sub-filters)
- Heat Check precinct map (primary + runoff toggle)
- Districts tool (precinct map, CD/SD/HD/JP/Commissioner/Council, VS card, Kalshi odds, CVAP, who-votes panel)
- Commissioner Precincts in Districts (real ArcGIS spatial join, June 11 2026)
- Bill Tracker (TX 89th) + Congressional Bills (119th)
- City Hall Story Engine (Emily Takes Notes + Claude ledes + archive)
- City Budget FY2027 (passed 15–1 June 10, amendments, vote badges) + County Budget FY2027
- TIRZ tool, Civic Calendar, TV Station, Early Vote Tracker, Discretionary Funds
- Politician profiles: Vitruvian Man, OVR stats, badges, Bills/Money/News/Social tabs
- NBA 2K-style OVR scoring (lib/politician-stats.ts) + 22-badge system
- Dynamic share system (URL state + OG images + Web Share)
- Dark navy VS card + leaderboard design pass (awsmd-inspired, June 11 2026)
- Threads-style beat feeds + community voices (Abby Church, Evan Mintz, Courier Texas, etc.)
- Data freshness system (/admin/freshness, check-freshness script)
- Finance pipeline: FEC + TEC + Harris County OCR + Houston COH postback

## SHIPPED June 11, 2026 (seven-feature session)
1. **Voter Lookup** — /my-officials: address → Census geocode → precinct → every official JP→Congress. Homepage card added.
2. **Officials Card View** — liquid-glass flip card (gold/white, backdrop-blur, SVG district map on back) + Card View toggle on profiles + shareable /politicians/[slug]/card with OG
3. **Data Moat Layer** — public/data/precinct-history.json: 2020/2022/2024 general returns re-tabulated on CURRENT precinct lines (TLC TED API, 1170/1172 join) + SSVR + turnout + 2020 Census VAP + 2026 primary. DistrictHistory panel (trend w/ projection, combined demo×turnout×performance scatter, SSVR-bucketed Cruz-vs-Trump surname analysis w/ embedded caveat) in Districts tool + every profile. Rebuild: `node scripts/build-precinct-history.mjs`
4. **Accountability Score** — lib/accountability.ts + /methodology + profile panel w/ breakdown + sortable /politicians index
5. **Follow an Official** — /api/follow + FollowButton + scripts/send-follow-alerts.mjs queue worker (email v1; delivery needs EMAIL_WEBHOOK_URL)
6. **Money Trail** — scripts/build-donor-network.mjs (FEC itemized Schedule A) + Money Trail tab in Where the Money Resides (SVG network graph, shared-donor tracer) + SharedDonors on profile Money tab. PARTIAL DATA: DEMO_KEY rate-limited; full coverage needs FEC_API_KEY. Found + worked around STALE FEC candidate IDs in finance-roster.json (likely cause of the $0 live-route bug — script resolves by name)
7. **Head to Head** — /compare/[slugA]/[slugB] with both cards + 7-category leader table + OG
8. **Quote of the day** — "Moment in time" Houston/Harris history (21 dated moments, nearest-anniversary picker) on the Briefing quote card

## BLOCKED ON DEPENDENCY APPROVAL (user must OK install)
- **3D landing hero** (R3F extruded precinct map: height=turnout, color=lean, rotate + scroll transition) — needs `three`, `@react-three/fiber`, `@react-three/drei`
- **Money Trail 3D force graph** — needs `react-force-graph-3d` (flat SVG network shipped in the meantime)

## KEPT BUT NOT DONE (do not lose these)
- **Hidden tools needing rework before relisting** (June 10): endorsement-flowchart, consultant-flowchart, infrastructure-funding — live at URLs with "unlisted" banner; restore cards from git history when reworked
- **OVR leaderboard page** — all 49 officials ranked by OVR, sortable per attribute (partial: /politicians/leaderboard exists, needs sort-by-attribute)
- **Heat Check port** — still an iframe with own branding; port into app shell
- **Per-URL OG tags** — filter state in the unfurl image needs server-wrapper refactor per tool
- **Social posts labeling** — beat-page posts are authored content styled as a feed; label or wire real APIs (biggest trust risk)
- **Election-night upload persistence** — doesn't survive refresh
- **Archive persistence on Vercel** — filesystem resets on deploy; needs Vercel KV or git-commit step
- **VAN API integration** — when user gets NGP VAN / EveryAction key: /api/van/demographics, precinct choropleth on profiles
- **Republican primary precinct data** — needs 2026 REP primary canvass CSV from harrisvotes.com
- **May runoff precinct CSV** — Heat Check runoff view uses derived data; real canvass pending
- **County court judges** — 24 portal filings, filer names unparseable; needs parser fix or manual roster
- **Top-5 county officials' scanned PDFs** — exceed extraction limits; manual entry is fast path
- **Jasmine Crockett FEC committee ID** — shows Pending until added to finance-roster.json
- **R-side nominees** for CD-8/22/36 marked "presumed"; missing for CD-29, SD-11, several HD/JP — needs TX SOS statewide canvass
- **2020-cycle precinct results** — Harris renumbered precincts in 2021 redistricting; needs old→new crosswalk before 2020 can join the trend series

## NEEDS FROM USER (blocking)
- Census API key → .env.local + Vercel (CENSUS_API_KEY) — population layer in Districts
- Harris County voter file w/ vote history (harrisvotes.com data request) — real turnout demographics
- FEC API key (api.data.gov) — diagnose live federal route, itemized donors for Money Trail
- EMAIL_WEBHOOK_URL in Vercel — activates email gate + Follow alerts delivery
- ANTHROPIC_API_KEY in Vercel — AI chatbox + City Hall ledes (already in .env.local locally)

## IDEAS PARKED (mentioned once, not committed)
- Playwright screenshot archive of before/after design states
- Real-time election night ops mode
- SMS alerts for Follow (v2 — email first)
