# Update Schedule — The Harris County Project

Every data source on the site, what feeds it, and how often it must be refreshed.
Run `npm run check-freshness` to compare actual file timestamps against this schedule
(it reads the machine-readable copy in `data/update-schedule.json`).

## Daily
| Source | Feeds | File(s) / mechanism | How to update |
|---|---|---|---|
| News briefing feed | Dashboard, beat pages | `app/api/news/` (live RSS fetch) | Automatic at request time — verify feeds resolve |
| Election countdown | Dashboard | computed from dates in `lib/dashboard-data.ts` | No action unless an election date changes |
| Civic calendar events | `/tools/civic-calendar` | `lib/civic-events.ts`, `data/council-meetings/` | Add/confirm upcoming meetings |

## Quarterly
| Source | Feeds | File(s) | How to update |
|---|---|---|---|
| FEC federal campaign finance | Money tool (federal) | `app/api/finance/fec/route.ts` (live) + static fallbacks in `lib/campaign-finance.ts` | Verify live API returns non-zero; refresh static fallback numbers |
| TEC state campaign finance | Money tool (state) | `app/api/finance/tec/route.ts` (live) + static fallbacks | Same as FEC |

## Biannually
| Source | Feeds | File(s) | Due |
|---|---|---|---|
| Harris County campaign finance (county portal PDFs) | Money tool (county) | `npm run finance-fetch && finance-extract && finance-publish` → `lib/campaign-finance-generated.json` | July and January filings |
| City of Houston campaign finance | Money tool (city) | same pipeline, city portal | January 15 and July 15 |
| Voter registration totals | Districts tool | `public/data/cvap-districts.json` (CVAP) / harrisvotes.com totals | Jan / Jul |

## Annually
| Source | Feeds | File(s) | How to update |
|---|---|---|---|
| Census demographic data (ACS/CVAP) | Districts tool | `public/data/cvap-districts.json` | New CVAP special tab each fall — rerun extraction (`scripts/build-districts-data.mjs` notes) |
| District boundary files | Districts tool | `public/data/harris-precincts.geojson`, `lib/precinct-crosswalk.json` | Rerun `node scripts/build-districts-data.mjs` after redistricting or precinct changes |
| Officials roster audit | Politicians, beats, money | `lib/politicians.ts`, `data/finance-roster.json` | Verify every officeholder after each January swearing-in |
| County budget (county FY starts Oct 1) | `/tools/county-budget` | data in page | Refresh after Commissioners Court adopts budget |
| City budget (city FY starts Jul 1) | `/tools/city-budget` | data in page | Refresh after Council adopts budget |

## Election cycle (per election)
| Source | Feeds | File(s) | When |
|---|---|---|---|
| Heat Check results | `/tools/heat-check` | `public/heat-check.html` embedded consts | Election night + canvass |
| Precinct turnout | Districts "Who Votes" | `public/data/precinct-turnout-2026.json` | After each canvass |
| Endorsement flowchart | `/tools/endorsement-flowchart` | page data | As endorsements roll in |
| Consultant flowchart | `/tools/consultant-flowchart` | page data | As campaign filings reveal consultants |
| Early vote tracker | `/tools/early-vote` | page data | Daily during early vote |
| Remove lost candidates sitewide | matchups, money, beats | `lib/matchups-2026.ts`, `lib/campaign-finance.ts` | Within a week of canvass (primary, runoff, general) |
