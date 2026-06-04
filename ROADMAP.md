# The Harris County Project — Roadmap

## Live at
https://the-harris-county-project.vercel.app

## Stack
Next.js 16 + TypeScript + Tailwind, deployed on Vercel, repo at github.com/koryahaywood-byte/The-Harris-County-Project

---

## Navigation / Site Structure

The site is organized around **The Toolbox** — not individual nav tabs per tool. Tools are grouped by category inside the Toolbox:

- **MONEY** — Where Is the Dough, Discretionary Funds Map, Contractor Leaderboard, Houston Budget, Congressional/County funding maps
- **ELECTIONS** — Heat Check (precinct map), Politician Profiles
- **LEGISLATIVE** — Bill Tracker, Congressional Bills, Endorsement Flowchart, Consultant Flowchart
- **MEDIA** — TV Station (live streams), Blogs & Influencers
- **COMMUNITY** — Civic Calendar, Contact/Feedback

HISD electeds are woven throughout all relevant tools (money, bills, profiles).

---

## Bugs to Fix (Immediate)

1. **Where Is the Dough** — iframe not loading at all, nothing rendering
2. **Bill Tracker filter** — changing the filter doesn't update displayed data
3. **Bill Tracker filter design** — replace ugly arrow dropdowns with clean styled filter
4. **Bill Tracker counts** — numbers (bills passed, etc.) don't appear until you click a rep name; should pre-load
5. **Bill Tracker math** — counts may be wrong (someone shows 2 out of committee but 16 into law — logic error)
6. **Bill Tracker** — add pass percentage per rep
7. **Site title** — must read "The Harris County Project" not "Harris County Project"

---

## Phase 1 — Active Sprint

### Toolbox Landing Page Reorganization
- Group tools into MONEY / ELECTIONS / LEGISLATIVE / MEDIA / COMMUNITY sections
- Toolbox is the hub — not individual nav items per tool
- Intuitive, clean layout

### Mobile Responsive Redesign
- Full site needs to work beautifully on mobile
- Touch-friendly filters, readable tables, responsive maps

### Social Media Share / Screenshot Feature
- Every tool page gets a Share button
- Generates a clean screenshot of the current view (chart, map, table)
- User can download or upload directly to their social media
- Works seamlessly on mobile

### Bill Tracker Fixes (see bugs above)

### Where Is the Dough — Fix + Expand
- Fix iframe / data loading
- Add: donor list, how they spend, lobby money
- Add: Dem party and Republican party Harris County bank totals
- Add: Dem and Republican club bank totals
- Add: spending graphs, funding sources
- Record a skill for auto-pulling campaign finance data so it stays current

### Politician Profile Page
- Pull up any elected official (state, county, city, HISD)
- Photo, district map, website, socials, salary
- Tabs: Money (donors, spending), Bills passed, Compare to others
- "Da Vinci style" — rich, detailed, beautiful
- Includes HISD electeds

---

## Phase 2

### Civic Calendar
- All election dates, filing deadlines, Commissioners Court meetings, HISD board meetings, City Council meetings, TX Legislature dates
- Each event: user can tap "Add to Apple Calendar / Google Calendar / Outlook"
- Works on mobile

### Heat Check Expansion
- Add runoff and primary election data to precinct map
- Charts overlaid on or alongside map (vote share graphs, turnout %)

### Congressional Bill Tracker
- What did Harris County US reps actually pass in Congress?

### Endorsement Flowchart Tool
- Visual flowchart of who endorsed whom in a given race

### Consultant Flowchart Tool
- Visual flowchart of who the political consultants are and which candidates/orgs they work for

### Contact / Feedback Page
- Users can report data errors or suggest new tools
- Form goes to project owner

---

## Phase 3

### TV Station Tool
- One page with live stream tabs: City Council, Commissioners Court, HISD Board, TX Legislature, US Congress (where available)
- Streams pulled from their official websites
- Stretch: ability to clip a portion of a stream to share on socials

### Discretionary Funds Map
- How each City Council member is spending their discretionary funds
- Projects shown on a map by location

### Congressional / Infrastructure Funding Map
- Where federal community development and infrastructure money is landing in Harris County
- Map view

### County Budget + Contractor Leaderboard
- County budget breakdown with project-level detail
- Contractor leaderboard: who is getting the most contracts and for how much
- Map of where projects are

### Houston City Budget Breakdown
- Budget breakdown with analysis by department / program
- Charts and narrative

### TIRZ Tool
- What are TIRZs, which ones exist in Harris County
- Where is the money going, who controls it

---

## Phase 4 — Launch Prep

### Email Collection Gate
- Users enter email before accessing the Toolbox
- Collected for outreach, updates, future data use
- Save until site is finished and ready for full launch

### Chatbox (AI)
- Answers questions about the data shown on each tool page
- Context-aware (knows which tool the user is on)

### Blogs & Influencers Page
- Curated list of blogs and social media accounts to follow for Harris County civic content
- Clean directory-style layout

### Auto Campaign Finance Pull
- Record a Claude Code skill that automates pulling campaign finance data
- Keeps Where Is the Dough current without manual updates

---

## Design Skills Installed
- ui-ux-pro-max, emil-design-eng, brandkit, minimalist-ui, high-end-visual-design
- design-taste-frontend, industrial-brutalist-ui, stitch-design-taste
- redesign-existing-projects, gpt-taste, image-to-code
- imagegen-frontend-web/mobile, full-output-enforcement

---

## Commands

Run locally:
```
export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh" && cd /Users/dapr/harris-county-project && npm run dev
```

Push:
```
source ~/.config/envman/PATH.env && cd /Users/dapr/harris-county-project && git add -A && git commit -m "msg" && git push
```
