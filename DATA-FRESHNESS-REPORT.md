# Data Freshness Report
Generated: 2026-06-10 17:10 UTC
Summary: 15 sources — 15 current, 0 stale, 0 overdue, 0 missing.

| Status | Source | File | Last updated | Age (days) | Allowed (days) | Frequency |
|---|---|---|---|---|---|---|
| ✅ current | Civic calendar events | `lib/civic-events.ts` | 2026-06-10 | 0 | 7 | daily |
| ✅ current | Dashboard data (countdown/ballot) | `lib/dashboard-data.ts` | 2026-06-10 | 0 | 14 | daily |
| ✅ current | FEC static fallback | `lib/campaign-finance.ts` | 2026-06-10 | 0 | 100 | quarterly |
| ✅ current | TEC route fallback | `app/api/finance/tec/route.ts` | 2026-06-10 | 0 | 100 | quarterly |
| ✅ current | FEC route fallback | `app/api/finance/fec/route.ts` | 2026-06-10 | 0 | 100 | quarterly |
| ✅ current | County/city finance pipeline | `lib/campaign-finance-generated.json` | 2026-06-10 | 0 | 200 | biannual |
| ✅ current | Finance roster | `data/finance-roster.json` | 2026-06-10 | 0 | 200 | biannual |
| ✅ current | CVAP demographics | `public/data/cvap-districts.json` | 2026-06-10 | 0 | 400 | annual |
| ✅ current | Precinct boundaries | `public/data/harris-precincts.geojson` | 2026-06-10 | 0 | 400 | annual |
| ✅ current | Precinct-district crosswalk | `lib/precinct-crosswalk.json` | 2026-06-10 | 0 | 400 | annual |
| ✅ current | Officials roster | `lib/politicians.ts` | 2026-06-10 | 0 | 400 | annual |
| ✅ current | Heat Check results | `public/heat-check.html` | 2026-06-06 | 5 | 120 | election |
| ✅ current | Precinct turnout | `public/data/precinct-turnout-2026.json` | 2026-06-10 | 0 | 120 | election |
| ✅ current | Matchups (lost-candidate purge) | `lib/matchups-2026.ts` | 2026-06-10 | 0 | 120 | election |
| ✅ current | District seat info | `lib/districts-data.ts` | 2026-06-05 | 5 | 400 | annual |

> "stale" = past its window but under 1.5×. "overdue" = more than 1.5× past its window.
> File mtimes are a proxy — a git checkout resets them, so treat this as a prompt to verify, not gospel.
