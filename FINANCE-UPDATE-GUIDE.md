# Campaign Finance Update Guide

How to refresh the **Where the Money Resides** data. Total time per cycle: ~30–45 min, of which ~20 min is reviewing extracted numbers.

## The pipeline at a glance

```
npm run finance-fetch      # 1. Download newest filing PDFs from both portals
npm run finance-extract    # 2. Extract totals → JSON + REVIEW.md
   ── read REVIEW.md ──    # 3. YOU verify the numbers (the important part)
npm run finance-merge      # 4. Dry run: see the diff vs published data
npm run finance-publish    # 5. Write the unified dataset
git add -A && git commit -m "Finance data update" && git push   # 6. Deploy
```

`npm run update-finance` runs steps 1, 2, and 4 in sequence (it stops at the dry run on purpose — publishing always requires the explicit `finance-publish` after review).

## Filing calendar — when to run this

| Source | Schedule | Action |
|---|---|---|
| **Harris County** (ethics.harrisvotes.com) | Midyear report due **July 15**; end-of-year due **January 15**. Additional 30-day and 8-day pre-election reports during election cycles. | Run pipeline ~July 20 and ~January 20 (filings post a few days after the deadline) |
| **City of Houston** (cohweb.houstontx.gov) | Semi-annual reports due **January 15** and **July 15**. Additional bi-annual and pre-election reports during election cycles. | Same runs cover it |
| **TEC** (state legislators + district court judges) | Pulled live at merge time — no manual schedule | Automatic each run |
| **FEC** (federal) | Pulled live at merge time — no manual schedule | Automatic each run |

### Reminder checklist

- [ ] **~July 1** — calendar reminder: filings drop July 15, run `npm run update-finance` around July 20
- [ ] **~January 1** — same for the January 15 deadline, run around January 20
- [ ] **Election years**: starting 60 days before Election Day, check both portals monthly — 30-day and 8-day pre-election reports add new data
- [ ] After the **8-day report** window (8 days before any election with our officials on the ballot), run once more — that's the freshest pre-election snapshot

## Who's covered

The roster lives in **`data/finance-roster.json`** — the single source of truth. Four sections:

- `harrisCounty` — Commissioners Court, countywide officials, all 16 Justices of the Peace, and (once discovered/verified) County Criminal Courts at Law, County Civil Courts at Law, and Probate judges. All file at ethics.harrisvotes.com.
- `houston` — Mayor, Controller, all council members. File at cohweb.houstontx.gov.
- `tec` — State legislators **and state district court judges** (district judges file with the TEC, *not* the county — common mistake).
- `fec` — Federal candidates by FEC ID.

### Adding the remaining judges

Run discovery mode to find judge filers in the county portal:

```
npm run finance-fetch -- --discover
```

This searches the portal with office-title keywords and writes every filer name it finds to `data/finance-roster-discovered.json`. **Review that file by hand** — verify names/offices against jp.hctx.net and justex.net — then add confirmed entries to the `harrisCounty` section of the roster. Never auto-merge discovered names; portals return fuzzy matches.

District court judges: search the TEC filer database at https://ethics.state.tx.us manually, note the exact `tecName`, and add to the `tec` section.

## Step-by-step

### 1. Fetch (`npm run finance-fetch`)

Scrapes both portals (plain HTTP — no browser needed) and downloads the newest filing per official to `data/finance-pdfs/` as `LASTNAME-FIRSTNAME-OFFICE-YYYY-MM-DD.pdf`. Prints and logs (in `data/finance-pdfs/_fetch-log.json`):

- ✓ downloaded · ↺ already have it · ✗ not found · ⚠ error
- Officials with **multiple recent filings** (originals + amendments) — the newest is taken, which is correct because amendments supersede originals

Flags: `--county` or `--houston` to fetch one portal only.

**If an official is "not found":** their filer name in the portal probably differs from our `searchName` (treasurer's name, middle initial, maiden name). Search the portal manually in a browser, find the exact filer string, and update `searchName` in the roster. The fix is permanent.

**Manual fallback (always works):** if the scraper breaks — the portals are ASP.NET and occasionally change markup — download PDFs by hand from the portal and drop them in `data/finance-pdfs/` using the same filename convention. Steps 2–5 don't care how the PDFs got there.

**CAPTCHA/login walls:** the fetch script detects non-PDF responses and reports them as errors with "login wall?" — if this ever appears across the board, the portal added bot protection and the manual fallback is the path until the script is updated.

### 2. Extract (`npm run finance-extract`)

Reads every PDF and extracts: candidate name, office, reporting period, total raised, total spent, cash on hand. Two engines:

- **With `ANTHROPIC_API_KEY` set** (recommended): Claude reads each PDF — handles scanned and handwritten filings. Records get high/medium/low confidence.
- **Without the key**: text-layer regex on the standard C/OH cover sheet. Works on typed filings only; scanned filings come back low-confidence.

Outputs `data/finance-processed/<timestamp>.json` and **`data/finance-processed/REVIEW.md`**.

### 3. Review (the human step — don't skip)

Open `REVIEW.md`. It's sorted worst-first. For every ⚠ low or ✗ failed row:
1. Open the source PDF in `data/finance-pdfs/`
2. Read the cover sheet totals yourself
3. Correct the values directly in the timestamped JSON file

Spot-check a couple of ✓ high rows too. Wrong money numbers on a public site are worse than missing ones.

### 4–5. Merge and publish

`npm run finance-merge` is a **dry run**: it pulls live TEC + FEC data, merges with the reviewed PDF batch, and prints a diff against the currently published dataset (`NEW` / changed cash / `GONE`). Sanity-check the diff — a commissioner's cash dropping from $7M to $48 means a misparse, not a spending spree.

`npm run finance-publish` writes `lib/campaign-finance-generated.json`.

Dedup rule baked in: one record per official; when the same period has an original + amended filing, the amendment wins.

### 6. Deploy

```
git add -A && git commit -m "Finance data update — <period>" && git push
```

Vercel redeploys automatically. Verify on the live site: open Where the Money Resides, confirm the "as of" dates moved and spot-check two or three cash figures against REVIEW.md.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Everything "not found" on one portal | Portal markup changed; scraper selectors stale | Manual fallback now; update regexes in `scripts/finance-portals.mjs` later |
| "Response is not a PDF" errors | Login wall, CAPTCHA, or rate limiting | Wait an hour and retry; if persistent, manual download |
| Extraction all low-confidence | No `ANTHROPIC_API_KEY`, scanned PDFs | Set the key and re-run finance-extract |
| TEC fetch failed at merge | Deployed /api/finance/tec route down or TEC site down | Re-run later; merge keeps previous TEC values |
| FEC returning errors | `FEC_API_KEY` missing (DEMO_KEY is rate-limited) | Get a free key at api.open.fec.gov, export `FEC_API_KEY` |
| Official has $0 / null after publish | Extraction failed and wasn't corrected in review | Fix the JSON record, re-run finance-publish |
