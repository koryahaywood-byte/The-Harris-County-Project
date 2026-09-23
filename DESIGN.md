# Design: the Election Desk (Sep 2026)

The site is an election desk, not a toolbox. It leads with the state of play
(every race, rated), gives every race a permanent page, and organizes the rest
around the questions people bring: what's on the ballot, what's on MY ballot,
who has the money, how places vote, who holds office, what's coming up.

## Principles

1. **Party-neutral brand.** Blue and red appear only in data (candidates,
   results, ratings). The brand is scoreboard green and gold. Navy was retired
   because it reads Democratic on a partisan data site.
2. **Every number traces to a record.** Show the filing date, the cycle, the
   source. Copy that states a number must be computed from data, not typed
   (see the Money page "What it shows" tab), so it cannot go stale.
3. **One rating vocabulary.** Colors, labels and the scale come from
   `lib/ratings.ts`; ratings themselves live only in `lib/matchups-2026.ts`.
4. **Link the system together.** Every candidate, rating chip and race mention
   links to its race page (`raceHref(key)` → `/races/<key-lowercase>`).
5. **Density with hierarchy.** Tables and rows over decorative cards. Section
   heads carry a heavy ink rule (`.desk-head`).

## Tokens (`app/globals.css`)

| Token | Value | Use |
|---|---|---|
| `--ink` | `#121714` | Text, primary buttons |
| `--paper` | `#F1F2EE` | Page background |
| `--surface` | `#FFFFFF` | Panels, headers |
| `--rule` / `--rule-strong` | `#DADCD5` / `#BFC2BA` | Dividers, borders |
| `--board` / `--board-2` | `#0D2A21` / `#143A2D` | Scoreboard surfaces (hero, rail, footer) |
| `--gold` / `--gold-ink` | `#E2B13C` / `#8A6408` | Toss-ups, countdown, active nav, CTAs on dark |
| `--brand` | `#0B6A4A` | Links and labels on light surfaces |
| Party (data only) | D `#2350C2`, R `#C0392E` | `PARTY` in `lib/ratings.ts` |

Rating colors: `RATING` in `lib/ratings.ts` (Safe D `#1F46B0` … Toss-up
`#E2B13C` … Safe R `#A92C22`). Legacy tokens (`--accent`, `--font-playfair`,
`--font-outfit`, Tailwind `sky-*`) are remapped so old tool pages inherit the
system without edits.

## Type

| Face | Role | Class |
|---|---|---|
| Source Serif 4 | Headlines, race names, editorial text | `.serif` |
| Overpass | UI and data. Highway Gothic lineage: the Texas freeway sign | body default, `.num` for tabular figures |
| Overpass Mono | Labels, district tags, dates | `.label` |
| Dancing Script | "Built With Wood" credit and Ms. Kay's calendar only | inline |

Gotchas:
- Overpass ships the middle dot (·) with zero width. `globals.css` borrows that
  one glyph from a system face via the `"HCP Dot"` font-face. Keep it first in
  every sans stack.
- Next 16's JSX compiler drops the leading space of text that follows an
  expression when that text contains an HTML entity (`{n} races you&apos;re`
  renders "23races"). Use real typographic characters (’ “ ”) instead of
  `&apos;`/`&ldquo;`, or build the sentence as one template string.

## Components (`components/desk/`)

- `BallotStrip`: the signature. One bar per race, segments sized by count,
  Safe D → Safe R, toss-ups tallest and gold at the center. Used on the front
  page (whole ballot) and Your Ballot (the voter's own races).
- `RaceTile`: rating-colored top rule, office, both candidates with photo and
  cash bar, stakes line, last result.
- `RatingChip`, `RatingScale`, `ResultBar`, `CashDuel`, `Face` (real photos
  only, initials fallback), `AddressForm`, `CopyLink`.
- `SeasonRail` (in `Nav`): countdown and next deadlines, computed client-side
  in Central time.

## Structure

- `/` front page: scoreboard + strip, top of the ticket, races to watch, desk
  log, calendar, war chests, headlines, go deeper.
- `/races` race board; `/races/[race]` one page per race (SSG, 93 pages).
- `/tools/my-ballot` address → personal ballot, races in play, printable sheet.
- `/tools/where-is-the-dough` campaign cash; `/tools` the full index.
- `lib/races.ts` is the single race model (ratings + candidates + photos +
  money + stakes + last result). `lib/desk-log.ts` is the dated change log.

## Motion

Sparse. The strip grows in once on load; panels lift slightly on hover.
Everything respects `prefers-reduced-motion`. No floating cards, no arena rings,
no bounce.
