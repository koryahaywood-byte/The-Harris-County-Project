# Monday Morning Checklist — The Harris County Project

~10 minutes. Run before the week starts.

## 1. Freshness sweep (2 min)
- [ ] `npm run check-freshness` — open DATA-FRESHNESS-REPORT.md
- [ ] Anything 🔴 overdue? Schedule the fix this week. ⚠️ stale? Verify the source actually changed.
- [ ] Glance at https://the-harris-county-project.vercel.app/admin/freshness (matches local?)

## 2. Live data spot-checks (3 min)
- [ ] Money tool: does the "live data" line under the hero show FEC/TEC with a recent date?
- [ ] Money tool → County → Justices of the Peace: rows still render (16 JPs)
- [ ] Dashboard: news briefing items are from this week, election countdown is right
- [ ] Civic calendar: this week's meetings are listed (Commissioners Court Tuesdays, Council Wednesdays)

## 3. News & roster (3 min)
- [ ] Any official resign / die / get appointed last week? → update `lib/politicians.ts` + finance roster
- [ ] Any candidate drop out or win something? → update `lib/matchups-2026.ts`
- [ ] Any journalist on the beat pages change outlets? → update beat "Who Covers It" tabs

## 4. Election windows only (when applicable)
- [ ] Early vote period: update early-vote tracker daily numbers
- [ ] Week after a canvass: purge lost candidates sitewide, refresh Heat Check + precinct turnout
- [ ] Filing deadlines (TEC Jan 15 / Jul 15; county/city same): run the finance pipeline
      `npm run finance-fetch && npm run finance-extract && npm run finance-publish`

## 5. Ship it (1 min)
- [ ] `npm run build` passes locally
- [ ] Commit + push (Vercel deploys main automatically)
