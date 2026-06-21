// Known November 2026 general-election matchups, keyed by district key
// ("CD-18", "SD-15", "HD-148", "JP-4", "COH-District C", "HC-Countywide").
// Source: Harris County March 2026 primary + May 2026 runoff results already
// embedded in Heat Check (public/heat-check.html). Statewide races note that
// Harris-only totals can't certify a statewide nominee.
// Money for each name resolves through FINANCE_DATA_MERGED at render time.

export interface MatchupSide {
  name: string;
  party: "D" | "R";
  incumbent: boolean;
  note?: string;
  gender?: "F" | "M";
}

export type RaceLean =
  | "safe-d" | "likely-d" | "lean-d"
  | "toss-up"
  | "lean-r" | "likely-r" | "safe-r"
  | "uncontested-d" | "uncontested-r";

export interface Matchup {
  office: string;
  sides: MatchupSide[];   // usually [D, R]
  status: "set" | "runoff-pending" | "partial";
  lean?: RaceLean;        // competitiveness rating for Harris County
  detail?: string;
}

export const MATCHUPS_2026: Record<string, Matchup> = {
  // ── Statewide Texas races ──────────────────────────────────────────────────
  "TX-Governor": {
    office: "Texas Governor",
    status: "set",
    lean: "safe-r",
    sides: [
      { name: "Gina Hinojosa", party: "D", incumbent: false, gender: "F", note: "Former State Rep HD-49 (Austin); won D primary" },
      { name: "Greg Abbott",   party: "R", incumbent: true,  gender: "M", note: "Seeking 3rd term" },
    ],
    detail: "Statewide race. Abbott has dominated Texas since 2014. Hinojosa is a former state representative from Austin who won the Democratic nomination.",
  },
  "TX-LtGov": {
    office: "Lt. Governor of Texas",
    status: "set",
    lean: "safe-r",
    sides: [
      { name: "Vikki Goodwin", party: "D", incumbent: false, gender: "F", note: "State Rep from Austin (HD-47); won May D runoff over Marcos Velez" },
      { name: "Dan Patrick",   party: "R", incumbent: true,  gender: "M", note: "Seeking 4th term; Patrick has $30M+ CoH and won March primary by widest margin in his tenure" },
    ],
    detail: "Dan Patrick seeks a 4th term with $30M+ in cash on hand and Trump's endorsement. D nominee Vikki Goodwin, a state rep from Austin, won the May runoff. The structural R lean of Texas statewide races makes this safe-R barring a major environment shift.",
  },
  "TX-AG": {
    office: "Texas Attorney General",
    status: "set",
    lean: "safe-r",
    sides: [
      { name: "Nathan Johnson",  party: "D", incumbent: false, gender: "M", note: "State Senator SD-16 (Dallas); won May D runoff over Joe Jaworski" },
      { name: "Mayes Middleton", party: "R", incumbent: false, gender: "M", note: "Won May R runoff (56%) over U.S. Rep. Chip Roy; former State Senator SD-11" },
    ],
    detail: "Open seat — Ken Paxton vacated to run for U.S. Senate. Middleton beat Chip Roy in the R runoff; Nathan Johnson (Dallas state senator) won the D runoff over Joe Jaworski. A nationalized race: Middleton ran as 'MAGA Mayes,' Roy as the Trump-skeptic establishment pick.",
  },
  "TX-Comptroller": {
    office: "Texas Comptroller",
    status: "set",
    lean: "safe-r",
    sides: [
      { name: "Sarah Eckhardt", party: "D", incumbent: false, gender: "F", note: "Won March D primary with 60%+; former Travis County Judge" },
      { name: "Don Huffines",   party: "R", incumbent: false, gender: "M", note: "Won R primary with 58% after Trump endorsement; former Dallas state senator" },
    ],
    detail: "Open seat — Glenn Hegar left office in July 2026 to become Chancellor of Texas A&M. Don Huffines won the R primary with 58% after Trump endorsed him over Abbott-backed Kelly Hancock. Sarah Eckhardt (former Travis County Judge) won the D primary with 60%.",
  },
  // ── Top of Ticket ──────────────────────────────────────────────────────────
  "US-Senate": {
    office: "U.S. Senate",
    status: "set",
    lean: "lean-d",
    sides: [
      { name: "James Talarico", party: "D", incumbent: false, gender: "M", note: "Won May runoff over Jasmine Crockett" },
      { name: "Ken Paxton",     party: "R", incumbent: false, gender: "M", note: "Won May runoff over John Cornyn" },
    ],
    detail: "Paxton beat Cornyn in the May runoff. Talarico beat Crockett in the Democratic runoff. Former state rep HD-52 (Austin area).",
  },
  "HC-Countywide": {
    office: "Harris County Judge",
    status: "set",
    lean: "lean-d",
    sides: [
      { name: "Letitia Plummer",  party: "D", incumbent: false, gender: "F", note: "Won May runoff over Annise Parker" },
      { name: "Orlando Sanchez",  party: "R", incumbent: false, gender: "M", note: "Won May runoff over Warren Howell" },
    ],
    detail: "Open seat — Lina Hidalgo did not seek reelection. Plummer beat Parker 57,893–55,395 in the Democratic runoff; Sanchez beat Howell 85,304–49,367 in the Republican runoff.",
  },
  "CD-18": {
    office: "U.S. Representative, District 18",
    status: "set",
    lean: "safe-d",
    sides: [
      { name: "Christian Menefee",       party: "D", incumbent: false, gender: "M", note: "Won May runoff over Al Green; currently serving as Harris County Attorney" },
      { name: "Ronald Dwayne Whitfield", party: "R", incumbent: false, gender: "M", note: "Won March primary" },
    ],
    detail: "Menefee beat Al Green 26,546–10,771 in the Democratic runoff. Heavily Democratic seat.",
  },
  "CD-2": {
    office: "U.S. Representative, District 2",
    status: "set",
    lean: "safe-r",
    sides: [
      { name: "Shaun Finnie",  party: "D", incumbent: false, gender: "M", note: "D nominee" },
      { name: "Dan Crenshaw",  party: "R", incumbent: true,  gender: "M" },
    ],
    detail: "Dan Crenshaw (R) has held CD-2 (NW Harris County into Montgomery Co.) since 2019. A former Navy SEAL and nationally prominent voice for the GOP, Crenshaw faces nominal D opposition in a safe-R district.",
  },
  "CD-7": {
    office: "U.S. Representative, District 7",
    status: "set",
    lean: "toss-up",
    sides: [
      { name: "Lizzie Fletcher", party: "D", incumbent: true,  gender: "F" },
      { name: "Alexander Hale",  party: "R", incumbent: false, gender: "M", note: "Won May runoff" },
    ],
    detail: "CD-7 (West Houston — Bellaire, River Oaks, Memorial, Katy) is the most competitive congressional seat in Harris County. Fletcher flipped it D in 2018 and has held on every cycle; Hale won the R runoff and is backed by national Republican money.",
  },
  "CD-8": {
    office: "U.S. Representative, District 8",
    status: "set",
    lean: "safe-r",
    sides: [
      { name: "Laura Jones",        party: "D", incumbent: false, gender: "F", note: "Won March D primary" },
      { name: "Jessica Steinmann",  party: "R", incumbent: false, gender: "F", note: "Former DOJ official (America First Policy Institute); won March R primary with 70% over Brett Jensen and 4 others; endorsed by Cruz, Luttrell, Dan Patrick" },
    ],
    detail: "Open seat — Morgan Luttrell (R) announced Sept 2025 he would not seek re-election. CD-8 covers NE Harris County (Kingwood, Lake Houston, Atascocita) into Montgomery and east Texas. Safe Republican territory. All-women general election matchup.",
  },
  "CD-9": {
    office: "U.S. Representative, District 9",
    status: "set",
    lean: "lean-r",
    sides: [
      { name: "Leticia Gutierrez", party: "D", incumbent: false, gender: "F", note: "Community organizer with Air Alliance Houston; won March D primary" },
      { name: "Alex Mealer",       party: "R", incumbent: false, gender: "F", note: "West Point grad, Army EOD officer; lost 2022 County Judge race to Hidalgo by 0.9 pts; won May runoff over Briscoe Cain" },
    ],
    detail: "Open seat — Al Green (D) vacated to run in CD-18 and lost. The district was redrawn by Republicans after the 2024 cycle to favor the GOP, adding deep-red Liberty County and drawing out many D-leaning voters. The new map makes this lean-R despite its majority-Hispanic CVAP. All-women general election matchup.",
  },
  "CD-22": {
    office: "U.S. Representative, District 22",
    status: "partial",
    lean: "safe-r",
    sides: [
      { name: "Marquette Greene-Scott", party: "D", incumbent: false, gender: "F", note: "Won March primary" },
      { name: "Troy Nehls",             party: "R", incumbent: true,  gender: "M", note: "Presumed nominee — primary outside Harris data" },
    ],
    detail: "CD-22 covers south Harris County (Pearland, Friendswood, Manvel, Missouri City) into Fort Bend and Brazoria counties. Troy Nehls (R) has held the seat since 2021; safe Republican district.",
  },
  "CD-29": {
    office: "U.S. Representative, District 29",
    status: "partial",
    lean: "safe-d",
    sides: [
      { name: "Sylvia Garcia", party: "D", incumbent: true, gender: "F", note: "Won March primary" },
    ],
    detail: "CD-29 covers northeast Houston (Galena Park, Jacinto City, Cloverleaf) and runs toward Pasadena. Sylvia Garcia (D) has held the seat since 2019; majority-Latino district. No Republican general opponent confirmed.",
  },
  "CD-36": {
    office: "U.S. Representative, District 36",
    status: "partial",
    lean: "safe-r",
    sides: [
      { name: "Rhonda Hart",  party: "D", incumbent: false, gender: "F", note: "Won March primary" },
      { name: "Brian Babin",  party: "R", incumbent: true,  gender: "M", note: "Presumed nominee — primary outside Harris data" },
    ],
    detail: "CD-36 covers far southeast Harris County (Baytown, La Marque, Deer Park) into Chambers, Hardin, Jefferson, and Orange counties. Brian Babin (R) has held the seat since 2015; safe Republican district.",
  },
  "CD-38": {
    office: "U.S. Representative, District 38",
    status: "set",
    lean: "lean-r",
    sides: [
      { name: "Melissa McDonough", party: "D", incumbent: false, gender: "F", note: "Won March primary" },
      { name: "Jon Bonck",         party: "R", incumbent: false, gender: "M", note: "Won May runoff" },
    ],
    detail: "Open seat — incumbent Wesley Hunt ran for U.S. Senate and lost the Republican primary.",
  },
  "SD-11": {
    office: "State Senator, District 11",
    status: "set",
    lean: "likely-r",
    sides: [
      { name: "Shannon Dicely", party: "D", incumbent: false, gender: "F", note: "Won March primary" },
      { name: "Dennis Paul",    party: "R", incumbent: false, gender: "M", note: "Won R primary; incumbent Mayes Middleton ran for AG" },
    ],
    detail: "Open seat — incumbent Mayes Middleton vacated to run for Attorney General. Dennis Paul won the R primary. Shannon Dicely is the D nominee. District covers Clear Lake, Friendswood, Pearland — Republican-leaning suburb SE of Houston.",
  },
  "SD-15": {
    office: "State Senator, District 15",
    status: "partial",
    lean: "safe-d",
    sides: [
      { name: "Molly Cook", party: "D", incumbent: true, gender: "F", note: "Won 2024 special election; seeking first full term" },
    ],
    detail: "Molly Cook won the 2024 special election to replace John Whitmire (who became Houston Mayor). SD-15 seat is on the 2026 ballot; Cook must win a full 4-year term. Heights, Montrose, Galleria corridor — heavily Democratic.",
  },
  "SD-4": {
    office: "State Senator, District 4",
    status: "set",
    lean: "safe-r",
    sides: [
      { name: "Brett Ligon", party: "R", incumbent: true,  gender: "M", note: "Won May 2026 special election after Creighton resigned to become TX Tech Chancellor" },
    ],
    detail: "Brandon Creighton resigned in early 2026 to become Chancellor of the Texas Tech University System. Brett Ligon, former Montgomery County DA, won the May 2, 2026 special election and holds the seat as incumbent for the November general.",
  },
  "SD-13": {
    office: "State Senator, District 13",
    status: "set",
    lean: "uncontested-d",
    sides: [
      { name: "Borris Miles", party: "D", incumbent: true, gender: "M", note: "Running unopposed — no R nominee emerged from primary" },
    ],
    detail: "Borris Miles has served SD-13 since 2006. The district covers Third Ward, Sunnyside, Hiram Clarke, Missouri City — a majority-Black district that is among the most heavily Democratic in Texas. No Republican filed, so Miles runs unopposed.",
  },
  "SD-18": {
    office: "State Senator, District 18",
    status: "partial",
    lean: "safe-r",
    sides: [
      { name: "Lois Kolkhorst", party: "R", incumbent: true, gender: "F", note: "Seeking reelection" },
    ],
    detail: "Lois Kolkhorst's SD-18 touches only the far northwestern corner of Harris County (Cypress/Katy area). D nominee TBD.",
  },
  "HD-126": {
    office: "State Representative, District 126",
    status: "set",
    lean: "lean-r",
    sides: [
      { name: "Stefanie Bord", party: "D", incumbent: false, gender: "F", note: "Won March primary" },
      { name: "Stan Stanart",  party: "R", incumbent: false, gender: "M", note: "Won May runoff" },
    ],
    detail: "Open seat — incumbent Sam Harless (R) did not seek reelection. District covers NW Houston (FM 1960, Willowbrook, Copperfield). R-leaning suburb but Stanart is a controversial figure (former Harris County Tax Assessor); Bord could overperform in an anti-MAGA environment.",
  },
  "HD-131": {
    office: "State Representative, District 131",
    status: "set",
    lean: "uncontested-d",
    sides: [
      { name: "Staci Childs", party: "D", incumbent: false, gender: "F", note: "Won May runoff over Lawrence Allen Jr." },
    ],
    detail: "Open seat — Alma Allen (D) retired after holding HD-131 since 2003. Childs won the Democratic runoff; district covers SW Houston (Fondren/Southwest area) and is overwhelmingly Democratic. No Republican filed.",
  },
  "HD-139": {
    office: "State Representative, District 139",
    status: "set",
    lean: "safe-d",
    sides: [
      { name: "Charlene Ward Johnson", party: "D", incumbent: true,  gender: "F", note: "Won March primary" },
      { name: "Kyle Harding",          party: "R", incumbent: false, gender: "M", note: "Won R primary" },
    ],
    detail: "Charlene Ward Johnson (HD-139, Fifth Ward / Trinity Gardens) has served since 2017. Heavily Democratic majority-Black district — one of the safest D seats in Harris County. R challenger Kyle Harding.",
  },
  "HD-142": {
    office: "State Representative, District 142",
    status: "set",
    lean: "safe-d",
    sides: [
      { name: "Harold Dutton Jr.", party: "D", incumbent: true,  gender: "M", note: "Won March primary outright; serving since 1985" },
      { name: "Heidi Hall",        party: "R", incumbent: false, gender: "F", note: "Won R primary" },
    ],
    detail: "Harold Dutton Jr. (HD-142, Kashmere Gardens / Trinity Gardens / NE Houston) has served since 1985 — one of the longest-serving members of the Texas House. Heavily Democratic majority-Black district. R challenger Heidi Hall.",
  },
  "HD-144": {
    office: "State Representative, District 144",
    status: "set",
    lean: "lean-d",
    sides: [
      { name: "Mary Ann Perez", party: "D", incumbent: true,  gender: "F", note: "Won March primary (over Emmanuel Guerrero and Michael Montemayor)" },
      { name: "David Flores",   party: "R", incumbent: false, gender: "M", note: "Won R primary" },
    ],
    detail: "Mary Ann Perez (HD-144, Galena Park / Pasadena / east Harris County) has served since 2017. Majority-Latino district on the Ship Channel's east side — lean-D but historically competitive. R challenger David Flores.",
  },
  "HD-149": {
    office: "State Representative, District 149",
    status: "set",
    lean: "lean-d",
    sides: [
      { name: "Darlene Breaux", party: "D", incumbent: false, gender: "F", note: "Won May runoff 1,623–1,053 over incumbent Hubert Vo" },
      { name: "Dave Bennett",   party: "R", incumbent: false, gender: "M", note: "R nominee; engineer and small business owner" },
    ],
    detail: "Darlene Breaux defeated incumbent Hubert Vo in the May Democratic runoff (1,623–1,053). The Alief / Westheimer / FM 1464 corridor district is lean-D but historically competitive.",
  },
  "HD-150": {
    office: "State Representative, District 150",
    status: "set",
    lean: "safe-r",
    sides: [
      { name: "A'Yonna Kellum", party: "D", incumbent: false, gender: "F", note: "Won March primary" },
      { name: "Mark Dorazio",   party: "R", incumbent: true,  gender: "M", note: "Seeking reelection" },
    ],
    detail: "Mark Dorazio has held HD-150 (Katy / Cinco Ranch / far west Harris County) since 2023, succeeding Valoree Swanson. Safe Republican district. A'Yonna Kellum won the D primary.",
  },
  "HD-127": {
    office: "State Representative, District 127",
    status: "set",
    lean: "safe-r",
    sides: [
      { name: "Michelle Williams",   party: "D", incumbent: false, gender: "F", note: "D nominee; won March primary" },
      { name: "Charles Cunningham",  party: "R", incumbent: true,  gender: "M", note: "Seeking reelection" },
    ],
    detail: "Charles Cunningham has held HD-127 (Kingwood / Atascocita / NE Harris County) since 2023. D challenger Michelle Williams faces a steep climb in this solidly Republican suburban district.",
  },
  "HD-128": {
    office: "State Representative, District 128",
    status: "set",
    lean: "safe-r",
    sides: [
      { name: "Desiree Klaus", party: "D", incumbent: false, gender: "F", note: "Won March primary" },
      { name: "Tom Butler",    party: "R", incumbent: false, gender: "M", note: "Won March primary" },
    ],
    detail: "Open seat — incumbent Briscoe Cain ran for CD-9 (lost May runoff to Alex Mealer). Deep-red Deer Park / La Porte / East Pasadena / Southeast Harris County district.",
  },
  "HD-129": {
    office: "State Representative, District 129",
    status: "set",
    lean: "safe-r",
    sides: [
      { name: "Albert Wittliff", party: "D", incumbent: false, gender: "M", note: "D nominee; uncontested in D primary" },
      { name: "Scott Bowen",     party: "R", incumbent: false, gender: "M", note: "Won R primary with 71.6% over Bob Mitchell" },
    ],
    detail: "Open seat — Dennis Paul vacated to run for SD-11. Scott Bowen won the R primary decisively (71.6%). Albert Wittliff is the D nominee. Clear Lake / Bay Area — solidly Republican.",
  },
  "HD-133": {
    office: "State Representative, District 133",
    status: "set",
    lean: "uncontested-r",
    sides: [
      { name: "Mano DeAyala", party: "R", incumbent: true, gender: "M", note: "Running unopposed — no D filed" },
    ],
    detail: "Mano DeAyala has held HD-133 (Memorial / Briargrove / West Houston) since 2021. No Democrat filed for 2026 — DeAyala runs unopposed.",
  },
  "HD-130": {
    office: "State Representative, District 130",
    status: "set",
    lean: "safe-r",
    sides: [
      { name: "Brett Robinson", party: "D", incumbent: false, gender: "M", note: "D nominee" },
      { name: "Tom Oliverson",  party: "R", incumbent: true,  gender: "M", note: "Seeking reelection" },
    ],
    detail: "Tom Oliverson has held HD-130 (Katy/Cypress NW) since 2017. D challenger Brett Robinson.",
  },
  "HD-132": {
    office: "State Representative, District 132",
    status: "set",
    lean: "lean-r",
    sides: [
      { name: "Sara McGee",     party: "D", incumbent: false, gender: "F", note: "Won March primary" },
      { name: "Mike Schofield", party: "R", incumbent: true,  gender: "M", note: "Seeking reelection" },
    ],
    detail: "Mike Schofield holds HD-132 (NW Harris County / Cypress). The district is competitive at the suburban margins — D challenger Sara McGee is the nominee.",
  },
  "HD-134": {
    office: "State Representative, District 134",
    status: "set",
    lean: "lean-d",
    sides: [
      { name: "Ann Johnson", party: "D", incumbent: true,  gender: "F", note: "Seeking reelection" },
      { name: "Mike Michna", party: "R", incumbent: false, gender: "M", note: "Won R primary over Carolyn B. Bryant" },
    ],
    detail: "Ann Johnson flipped HD-134 (Meyerland / Southampton / West U) from R to D in 2020 and has won each cycle since. She serves on Judiciary & Civil Jurisprudence and is a former ADA. R challenger Mike Michna defeated Carolyn B. Bryant in the primary.",
  },
  "HD-135": {
    office: "State Representative, District 135",
    status: "set",
    lean: "safe-d",
    sides: [
      { name: "Odus Evbagharu", party: "D", incumbent: false, gender: "M", note: "Former Chair Harris County Democrats; Rosenthal's former chief of staff" },
      { name: "Liz Ramos",      party: "R", incumbent: false, gender: "F", note: "Won March primary" },
    ],
    detail: "Open seat — Jon Rosenthal vacated to run for Texas Railroad Commissioner. Odus Evbagharu (D), former Chair of the Harris County Democratic Party and Rosenthal's chief of staff, won the March primary. First Black HCD chair. After 2021 redistricting, district (northwest Houston / Cypress / Jersey Village) is now considered safe Democratic.",
  },
  "HD-137": {
    office: "State Representative, District 137",
    status: "set",
    lean: "safe-d",
    sides: [
      { name: "Gene Wu",    party: "D", incumbent: true,  gender: "M", note: "Seeking reelection" },
      { name: "Helen Zhou", party: "R", incumbent: false, gender: "F", note: "R nominee" },
    ],
    detail: "Gene Wu (HD-137, Bellaire/Westbury area) has served since 2013. D+ district with diverse demographics — Asian American, Latino, and Black communities. R challenger Helen Zhou.",
  },
  "HD-138": {
    office: "State Representative, District 138",
    status: "set",
    lean: "lean-r",
    sides: [
      { name: "Tyler Smith", party: "D", incumbent: false, gender: "M", note: "Won March D primary" },
      { name: "Lacey Hull",  party: "R", incumbent: true,  gender: "F", note: "Seeking reelection" },
    ],
    detail: "Lacey Hull (HD-138, Spring Branch / Memorial) has held the seat since 2020 after a narrow win. D challenger Tyler Smith makes this one of the more competitive suburban matchups in Harris County.",
  },
  "HD-140": {
    office: "State Representative, District 140",
    status: "set",
    lean: "safe-d",
    sides: [
      { name: "Armando Walle",       party: "D", incumbent: true,  gender: "M", note: "Seeking reelection" },
      { name: "Laura Garcia DeLeon", party: "R", incumbent: false, gender: "F", note: "R nominee" },
    ],
    detail: "Armando Walle (HD-140, North Houston / Northside) has served since 2009. Heavily Latino district — safe D despite R challenger Laura Garcia DeLeon.",
  },
  "HD-141": {
    office: "State Representative, District 141",
    status: "set",
    lean: "safe-d",
    sides: [
      { name: "Senfronia Thompson", party: "D", incumbent: true,  gender: "F", note: "Dean of the Texas House — longest serving member" },
      { name: "Julie Hunt",         party: "R", incumbent: false, gender: "F", note: "R nominee" },
    ],
    detail: "Senfronia Thompson (HD-141, Sunnyside / Third Ward) has served continuously since 1973 — the longest-serving member of the Texas House. Heavily Democratic majority-Black district. R challenger Julie Hunt. All-women matchup.",
  },
  "HD-143": {
    office: "State Representative, District 143",
    status: "set",
    lean: "safe-d",
    sides: [
      { name: "Ana Hernandez",  party: "D", incumbent: true,  gender: "F", note: "Seeking reelection" },
      { name: "Frank Salazar",  party: "R", incumbent: false, gender: "M", note: "R nominee" },
    ],
    detail: "Ana Hernandez (HD-143, East End / Galena Park) has served since 2006. Majority-Latino district along the Ship Channel — heavily Democratic.",
  },
  "HD-145": {
    office: "State Representative, District 145",
    status: "set",
    lean: "safe-d",
    sides: [
      { name: "Christina Morales",  party: "D", incumbent: true,  gender: "F", note: "Seeking reelection; chairs the Texas House Democratic Campaign Committee" },
      { name: "Inocensia Moreno",   party: "R", incumbent: false, gender: "F", note: "Won R primary" },
    ],
    detail: "Christina Morales (HD-145, Gulfton / Sharpstown / SW Houston) has served since 2018. Majority-Latino district with the largest SSVR in Harris County. R challenger Inocensia Moreno. All-women matchup.",
  },
  "HD-146": {
    office: "State Representative, District 146",
    status: "set",
    lean: "safe-d",
    sides: [
      { name: "Lauren Ashley Simmons", party: "D", incumbent: true,  gender: "F", note: "Seeking reelection" },
      { name: "Alexandria Butler",     party: "R", incumbent: false, gender: "F", note: "R nominee" },
    ],
    detail: "Lauren Ashley Simmons (HD-146, Riverside / South Main / Greenway Plaza) has served since 2021. Safe Democratic district. R challenger Alexandria Butler. All-women matchup.",
  },
  "HD-147": {
    office: "State Representative, District 147",
    status: "set",
    lean: "safe-d",
    sides: [
      { name: "Jolanda Jones",   party: "D", incumbent: true,  gender: "F", note: "Returned to House in 2023 after prior House and Council service" },
      { name: "Theodis Daniel",  party: "R", incumbent: false, gender: "M", note: "Won R primary" },
    ],
    detail: "Jolanda Jones (HD-147, Montrose / Rice Military / University) returned to the Texas House in 2023 after prior service on Houston City Council. One of the most heavily Democratic districts in Harris County. R challenger Theodis Daniel.",
  },
  "HD-148": {
    office: "State Representative, District 148",
    status: "set",
    lean: "safe-d",
    sides: [
      { name: "Penny Morales Shaw", party: "D", incumbent: true,  gender: "F", note: "Seeking reelection" },
      { name: "Amanda LaBrie",      party: "R", incumbent: false, gender: "F", note: "Won R primary" },
    ],
    detail: "Penny Morales Shaw (HD-148, Midtown / Heights / Near NW) has served since 2019. Gentrifying urban district trending D. R challenger Amanda LaBrie. All-women matchup.",
  },
  "JP-2-PL2": {
    office: "Justice of the Peace PCT 2 PL 2",
    status: "partial",
    lean: "lean-d",
    sides: [
      { name: "Dolores Lozano", party: "D", incumbent: true, gender: "F", note: "Won March primary" },
    ],
    detail: "Dolores Lozano (incumbent Place 2, JP Precinct 2) won the Democratic primary. R nominee TBD.",
  },

  // Commissioner Precincts
  "PCT-1": {
    office: "Commissioner Precinct 1",
    status: "partial",
    lean: "uncontested-d",
    sides: [
      { name: "Rodney Ellis", party: "D", incumbent: true, gender: "M", note: "Incumbent — no R challenger filed" },
    ],
    detail: "Rodney Ellis has held PCT 1 since 2016. No Republican challenger filed by the June 2026 deadline.",
  },
  "PCT-2": {
    office: "Commissioner Precinct 2",
    status: "set",
    lean: "likely-d",
    sides: [
      { name: "Adrian Garcia",  party: "D", incumbent: true,  gender: "M", note: "Incumbent" },
      { name: "Richard Vega",   party: "R", incumbent: false, gender: "M", note: "R general candidate" },
    ],
    detail: "Contested general election. Garcia has held PCT 2 since 2016.",
  },
  "PCT-3": {
    office: "Commissioner Precinct 3",
    status: "partial",
    lean: "uncontested-r",
    sides: [
      { name: "Tom Ramsey", party: "R", incumbent: true, gender: "M", note: "Incumbent — no D challenger filed" },
    ],
    detail: "Tom Ramsey has held PCT 3 since 2021. No Democratic challenger filed by the June 2026 deadline.",
  },
  "PCT-4": {
    office: "Commissioner Precinct 4",
    status: "partial",
    lean: "uncontested-d",
    sides: [
      { name: "Lesley Briones", party: "D", incumbent: true, gender: "F", note: "Incumbent — no R challenger filed" },
    ],
    detail: "Lesley Briones has held PCT 4 since 2023. No Republican challenger filed by the June 2026 deadline.",
  },

  // Countywide offices — law enforcement & admin
  "HC-Sheriff": {
    office: "Harris County Sheriff",
    status: "set",
    lean: "uncontested-d",
    sides: [
      { name: "Ed Gonzalez", party: "D", incumbent: true, gender: "M", note: "Incumbent — no R opponent filed" },
    ],
    detail: "Ed Gonzalez has held the Sheriff's office since 2017. No Republican filed for the general election — running uncontested.",
  },
  "HC-DA": {
    office: "District Attorney",
    status: "set",
    lean: "uncontested-d",
    sides: [
      { name: "Sean Teare", party: "D", incumbent: true, gender: "M", note: "Incumbent — no R opponent filed" },
    ],
    detail: "Sean Teare has served as DA since 2022. No Republican filed for the general election — running uncontested.",
  },
  "HC-County-Attorney": {
    office: "County Attorney",
    status: "set",
    lean: "likely-d",
    sides: [
      { name: "Abbie Kamin",              party: "D", incumbent: false, gender: "F", note: "Won D primary over Audrie Lawton-Evans; open seat" },
      { name: "Jacqueline Lucci Smith",   party: "R", incumbent: false, gender: "F", note: "Narrowly lost to Menefee in 2024; won R primary unopposed" },
    ],
    detail: "Open seat — Christian Menefee vacated to run for CD-18 (won). Abbie Kamin, a former Houston City Council member, won the Democratic primary. Jacqueline Lucci Smith, who narrowly lost to Menefee in 2024, is the R nominee. All-women matchup.",
  },
  "HC-District-Clerk": {
    office: "District Clerk",
    status: "set",
    lean: "safe-d",
    sides: [
      { name: "Jose Maldonado",  party: "D", incumbent: false, gender: "M", note: "Won May D primary runoff over Darrell William Jordan" },
      { name: "Chris Daniel",    party: "R", incumbent: false, gender: "M", note: "Won R primary" },
    ],
    detail: "Open seat — Marilyn Burgess announced she would not seek reelection after commissioners denied her raise request. Jose Maldonado won the May Democratic runoff. Chris Daniel is the R nominee.",
  },
  "HC-County-Clerk": {
    office: "County Clerk",
    status: "set",
    lean: "safe-d",
    sides: [
      { name: "Teneshia Hudspeth", party: "D", incumbent: true,  gender: "F", note: "Incumbent; first Black woman to hold office" },
      { name: "Mike Wolfe",        party: "R", incumbent: false, gender: "M", note: "Won May runoff over Lynda Sanchez" },
    ],
    detail: "Teneshia Hudspeth has served as County Clerk since 2018 — the first Black woman to hold the office. R challenger Mike Wolfe defeated Lynda Sanchez in the Republican runoff.",
  },
  // HC-Tax-Assessor: Annette Ramirez won November 2024; term runs through December 2028 — NOT on 2026 ballot.
  "HC-County-Treasurer": {
    office: "County Treasurer",
    status: "set",
    lean: "safe-d",
    sides: [
      { name: "Carla Wyatt",   party: "D", incumbent: true,  gender: "F", note: "Incumbent since 2019" },
      { name: "Marc Cowart",   party: "R", incumbent: false, gender: "M", note: "Won R primary over Hayley Hagan" },
    ],
    detail: "Carla Wyatt has served as County Treasurer since 2019. R challenger Marc Cowart defeated Hayley Hagan in the Republican primary.",
  },

  // NOTE: All 8 Harris County constables (PCT 1-8) were elected in November 2024
  // with 4-year terms running through December 2028. None are on the 2026 ballot.

  // JP races with full matchups (others are partial — D only, R nominee TBD)
  "JP-5-PL2": {
    office: "Justice of the Peace PCT 5 PL 2",
    status: "set",
    lean: "toss-up",
    sides: [
      { name: "Lisa Jefferson", party: "D", incumbent: false, gender: "F", note: "Won March primary" },
      { name: "Mark Fury",      party: "R", incumbent: false, gender: "M", note: "Won March primary over incumbent Bob Wolfe" },
    ],
    detail: "Open competitive race — incumbent Bob Wolfe (R) lost his primary to Mark Fury.",
  },
  "JP-7-PL2": {
    office: "Justice of the Peace PCT 7 PL 2",
    status: "partial",
    lean: "likely-d",
    sides: [
      { name: "Melanie Miles", party: "D", incumbent: false, gender: "F", note: "Won May runoff over incumbent Sharon Burney" },
    ],
    detail: "Melanie Miles beat incumbent Sharon Burney in the Democratic runoff. R nominee TBD.",
  },
  "TX-RailroadCommission": {
    office: "Texas Railroad Commissioner",
    status: "set",
    lean: "safe-r",
    sides: [
      { name: "Jon Rosenthal", party: "D", incumbent: false, gender: "M", note: "Former State Rep HD-135; won March primary" },
      { name: "Bo French",     party: "R", incumbent: false, gender: "M", note: "Won May runoff over incumbent Jim Wright" },
    ],
    detail: "Open seat — Commissioner Jim Wright lost the Republican primary runoff to Bo French. Jon Rosenthal (4-term HD-135 state rep) is the first credible Democratic challenger for a Railroad Commission seat in years. A Democrat hasn't held a RRC seat since 1994. The RRC regulates oil, gas, and pipeline safety in Texas.",
  },

  // Harris County Probate Courts (all 4 on 2026 ballot)
  "Probate-1": {
    office: "Probate Court No. 1",
    status: "set",
    lean: "likely-d",
    sides: [
      { name: "Jerry Simoneaux", party: "D", incumbent: true,  gender: "M", note: "Seeking reelection; rematch of 2022 general" },
      { name: "Loyd Wright",     party: "R", incumbent: false, gender: "M", note: "Lost to Simoneaux in 2022; running again" },
    ],
    detail: "Jerry Simoneaux has held Probate Court No. 1 since 2019. Loyd Wright lost to him in 2022 and is back for a rematch. Probate courts handle wills, estates, guardianship, and mental health cases.",
  },
  "Probate-2": {
    office: "Probate Court No. 2",
    status: "set",
    lean: "likely-d",
    sides: [
      { name: "Pamela Medina", party: "D", incumbent: true,  gender: "F", note: "Seeking reelection" },
      { name: "Paul Shanklin", party: "R", incumbent: false, gender: "M", note: "R nominee; endorsed by HRBC" },
    ],
    detail: "Pamela Medina (D) has held Probate Court No. 2 since 2023. She faces R challenger Paul Shanklin, endorsed by the Houston Region Business Coalition.",
  },
  "Probate-3": {
    office: "Probate Court No. 3",
    status: "set",
    lean: "likely-d",
    sides: [
      { name: "Jason Cox",        party: "D", incumbent: true,  gender: "M", note: "Seeking reelection; openly LGBTQ+" },
      { name: "Ronald Schramm",   party: "R", incumbent: false, gender: "M", note: "R nominee; endorsed by HRBC" },
    ],
    detail: "Jason Cox (D) has held Probate Court No. 3 since 2019 — one of the few openly LGBTQ+ judges in Harris County. He won reelection in 2022 and faces R challenger Ronald Schramm in 2026.",
  },
  "Probate-4": {
    office: "Probate Court No. 4",
    status: "set",
    lean: "likely-d",
    sides: [
      { name: "James Horwitz",  party: "D", incumbent: true,  gender: "M", note: "Won March D primary over Lema Mousilli" },
      { name: "Kevin Fulton",   party: "R", incumbent: false, gender: "M", note: "R nominee" },
    ],
    detail: "James Horwitz (D) has held Probate Court No. 4 since 2019. He defeated a D primary challenger (Lema Mousilli) before facing Fulton in the general.",
  },

  // Harris County Criminal Courts at Law (countywide misdemeanor courts — all 15 on 2026 ballot)
  "CCL-1": {
    office: "County Criminal Court at Law No. 1",
    status: "set",
    lean: "likely-d",
    sides: [
      { name: "Alex Salgado",  party: "D", incumbent: true,  gender: "M", note: "Seeking reelection" },
      { name: "Erin Swanson",  party: "R", incumbent: false, gender: "F", note: "R nominee" },
    ],
    detail: "Salgado has held CCL #1 since 2019. All 15 Harris County Criminal Courts at Law are countywide races — making them bellwethers for county-level partisan lean. Democrats swept all these seats in 2018 and have held most since.",
  },
  "CCL-2": {
    office: "County Criminal Court at Law No. 2",
    status: "set",
    lean: "lean-d",
    sides: [
      { name: "Matthew Ruben Perez", party: "D", incumbent: false, gender: "M", note: "Won March primary; open seat" },
      { name: "Matt Alford",         party: "R", incumbent: false, gender: "M", note: "R nominee" },
    ],
    detail: "Open seat — Judge Paula Goodhart is not seeking reelection. Both nominees are newcomers to the bench in this D-leaning countywide race.",
  },
  "CCL-3": {
    office: "County Criminal Court at Law No. 3",
    status: "set",
    lean: "lean-d",
    sides: [
      { name: "Allison Mathis",    party: "D", incumbent: false, gender: "F", note: "Criminal defense attorney; won March primary" },
      { name: "Leslie R. Johnson", party: "R", incumbent: true,  gender: "F", note: "Seeking reelection" },
    ],
    detail: "Leslie Johnson holds CCL #3 as a Republican — one of the few R-held misdemeanor court seats in Harris County. D challenger Allison Mathis is a criminal defense attorney. All-women matchup in a county with a structural D lean.",
  },
  "CCL-4": {
    office: "County Criminal Court at Law No. 4",
    status: "set",
    lean: "likely-d",
    sides: [
      { name: "Shannon Baldwin",        party: "D", incumbent: true,  gender: "F", note: "Seeking reelection" },
      { name: "Rebecca Phillips Aceto", party: "R", incumbent: false, gender: "F", note: "R nominee" },
    ],
    detail: "Shannon Baldwin has held CCL #4 since the 2018 blue wave. An all-women matchup.",
  },
  "CCL-5": {
    office: "County Criminal Court at Law No. 5",
    status: "set",
    lean: "lean-d",
    sides: [
      { name: "David Fleischer", party: "D", incumbent: true,  gender: "M", note: "Seeking reelection" },
      { name: "Stella Stevens",  party: "R", incumbent: false, gender: "F", note: "Former Montgomery County prosecutor; defense attorney" },
    ],
    detail: "Fleischer holds CCL #5 (misdemeanor DWI, assault, theft cases). The court operates under a federal consent decree governing bail practices since 2019. Considered one of the more competitive CCL matchups given the R challenger's prosecutorial background.",
  },
  "CCL-6": {
    office: "County Criminal Court at Law No. 6",
    status: "set",
    lean: "likely-d",
    sides: [
      { name: "Kelley Andrews", party: "D", incumbent: true,  gender: "F", note: "Seeking reelection" },
      { name: "Josh Normand",   party: "R", incumbent: false, gender: "M", note: "R nominee" },
    ],
    detail: "Kelley Andrews has held CCL #6 since 2019.",
  },
  "CCL-7": {
    office: "County Criminal Court at Law No. 7",
    status: "set",
    lean: "likely-d",
    sides: [
      { name: "Andrew Wright",    party: "D", incumbent: true,  gender: "M", note: "Won March primary over two challengers" },
      { name: "Thomas Brodrick",  party: "R", incumbent: false, gender: "M", note: "Harris County DA prosecutor" },
    ],
    detail: "Wright survived a competitive D primary against Jorge Garcia Diaz and Rustin Foroutan. Thomas Brodrick (goes by Adam) is an assistant Harris County DA running as the R nominee.",
  },
  "CCL-8": {
    office: "County Criminal Court at Law No. 8",
    status: "set",
    lean: "likely-d",
    sides: [
      { name: "Erika Ramirez",  party: "D", incumbent: true,  gender: "F", note: "Seeking reelection" },
      { name: "Victor Flores",  party: "R", incumbent: false, gender: "M", note: "R nominee" },
    ],
    detail: "Erika Ramirez has held CCL #8 since 2019.",
  },
  "CCL-9": {
    office: "County Criminal Court at Law No. 9",
    status: "set",
    lean: "likely-d",
    sides: [
      { name: "Toria J. Finch", party: "D", incumbent: true,  gender: "F", note: "Seeking reelection" },
      { name: "Xavier Alfaro",  party: "R", incumbent: false, gender: "M", note: "R nominee" },
    ],
    detail: "Toria Finch has held CCL #9 since 2019.",
  },
  "CCL-10": {
    office: "County Criminal Court at Law No. 10",
    status: "set",
    lean: "likely-d",
    sides: [
      { name: "Juanita Jackson", party: "D", incumbent: true,  gender: "F", note: "Seeking reelection" },
      { name: "Bao Hoang",       party: "R", incumbent: false, gender: "M", note: "R nominee" },
    ],
    detail: "Juanita Jackson has held CCL #10 since 2019.",
  },
  "CCL-11": {
    office: "County Criminal Court at Law No. 11",
    status: "set",
    lean: "likely-d",
    sides: [
      { name: "Sedrick T. Walker II", party: "D", incumbent: true,  gender: "M", note: "Seeking reelection" },
      { name: "Liz Buss",            party: "R", incumbent: false, gender: "F", note: "R nominee" },
    ],
    detail: "Sedrick Walker has held CCL #11 since 2019.",
  },
  "CCL-12": {
    office: "County Criminal Court at Law No. 12",
    status: "set",
    lean: "likely-d",
    sides: [
      { name: "Ashley Mayes Guice", party: "D", incumbent: true,  gender: "F", note: "Appointed June 2025 after Genesis Draper left to lead HC Public Defenders' Office" },
      { name: "Anna Emmons",        party: "R", incumbent: false, gender: "F", note: "R nominee" },
    ],
    detail: "Ashley Mayes Guice was appointed by the Commissioners Court in June 2025 when Genesis Draper left the bench to lead the Harris County Public Defenders' Office. An all-women matchup.",
  },
  "CCL-13": {
    office: "County Criminal Court at Law No. 13",
    status: "set",
    lean: "likely-d",
    sides: [
      { name: "Raul Rodriguez", party: "D", incumbent: true,  gender: "M", note: "Seeking reelection" },
      { name: "Amber Cox",      party: "R", incumbent: false, gender: "F", note: "R nominee" },
    ],
    detail: "Raul Rodriguez has held CCL #13 since 2019.",
  },
  "CCL-14": {
    office: "County Criminal Court at Law No. 14",
    status: "set",
    lean: "toss-up",
    sides: [
      { name: "Yahaira Quezada",  party: "D", incumbent: false, gender: "F", note: "Won March D primary with 54.6% over James Hu" },
      { name: "Jessica N. Padilla", party: "R", incumbent: true,  gender: "F", note: "Republican incumbent seeking reelection" },
    ],
    detail: "One of the most interesting judicial matchups of 2026 — a D challenger faces a R incumbent judge in a county-level race where Democrats have structural advantage. Padilla assumed office Jan 1, 2023; Quezada defeated James Hu in the D primary with 55% of the vote. All-women matchup.",
  },
  "CCL-15": {
    office: "County Criminal Court at Law No. 15",
    status: "set",
    lean: "likely-d",
    sides: [
      { name: "Tonya Jones",       party: "D", incumbent: true,  gender: "F", note: "Seeking reelection" },
      { name: "Stephen St. Martin", party: "R", incumbent: false, gender: "M", note: "R nominee" },
    ],
    detail: "Tonya Jones has held CCL #15 since 2019.",
  },

  // ── Harris County Criminal District Courts (Felony, Countywide) ────────────
  "DC-180th": {
    office: "180th District Court",
    status: "set",
    lean: "likely-d",
    sides: [
      { name: "Stephanie Morales", party: "D", incumbent: false, gender: "F", note: "D nominee; incumbent DaSean Jones not seeking reelection" },
      { name: "Tami Pierce",       party: "R", incumbent: false, gender: "F", note: "R nominee" },
    ],
    detail: "Open seat — incumbent DaSean Jones did not seek reelection. All-women matchup in a county that has trended decisively D since 2018.",
  },
  "DC-182nd": {
    office: "182nd District Court",
    status: "set",
    lean: "likely-d",
    sides: [
      { name: "Danilo Lacayo", party: "D", incumbent: true,  gender: "M", note: "Seeking reelection" },
      { name: "Brent Haynes",  party: "R", incumbent: false, gender: "M", note: "R nominee" },
    ],
    detail: "Danilo Lacayo holds the 182nd as a Democratic incumbent seeking reelection.",
  },
  "DC-183rd": {
    office: "183rd District Court",
    status: "set",
    lean: "lean-d",
    sides: [
      { name: "Julia Maldonado", party: "D", incumbent: false, gender: "F", note: "D nominee; won March primary" },
      { name: "Lance Long",      party: "R", incumbent: true,  gender: "M", note: "Republican incumbent" },
    ],
    detail: "Lance Long holds the 183rd as one of the few Republican-held criminal district courts in Harris County. D challenger Julia Maldonado faces an uphill path but the county's D lean gives her structural advantage.",
  },
  "DC-184th": {
    office: "184th District Court",
    status: "set",
    lean: "likely-d",
    sides: [
      { name: "Katherine Thomas", party: "D", incumbent: false, gender: "F", note: "D nominee; incumbent Anastasio not seeking reelection" },
      { name: "Heather Hudson",   party: "R", incumbent: false, gender: "F", note: "R nominee" },
    ],
    detail: "Open seat — incumbent Abigail Anastasio did not seek reelection. All-women matchup.",
  },
  "DC-185th": {
    office: "185th District Court",
    status: "set",
    lean: "likely-d",
    sides: [
      { name: "Andrea Beall",  party: "D", incumbent: false, gender: "F", note: "D nominee; incumbent Jason Luong not seeking reelection" },
      { name: "Mark Goldberg", party: "R", incumbent: false, gender: "M", note: "R nominee" },
    ],
    detail: "185th District Court. Incumbent Jason Luong (D) did not seek reelection; Andrea Beall won the Democratic primary.",
  },
  "DC-208th": {
    office: "208th District Court",
    status: "set",
    lean: "likely-d",
    sides: [
      { name: "Beverly Armstrong", party: "D", incumbent: true,  gender: "F", note: "Seeking reelection" },
      { name: "Stephen Driver",    party: "R", incumbent: false, gender: "M", note: "R nominee" },
    ],
    detail: "Beverly Armstrong holds the 208th as a Democratic incumbent seeking reelection.",
  },
  "DC-209th": {
    office: "209th District Court",
    status: "partial",
    lean: "likely-d",
    sides: [
      { name: "Robert Johnson", party: "D", incumbent: false, gender: "M", note: "Won D primary over Ysidra Kyles and Brian Warren" },
      { name: "Tony Coveny",    party: "R", incumbent: false, gender: "M", note: "R nominee" },
    ],
    detail: "209th District Court. D primary had three candidates — Robert Johnson, Ysidra Kyles, and Brian Warren — with Johnson prevailing.",
  },
  "DC-228th": {
    office: "228th District Court",
    status: "set",
    lean: "lean-d",
    sides: [
      { name: "Alyson Almaguer", party: "D", incumbent: false, gender: "F", note: "Harris County ADA, Felony District Court Chief" },
      { name: "Caroline Dozier", party: "R", incumbent: true,  gender: "F", note: "Appointed by Gov. Abbott after Judge Frank Aguilar died" },
    ],
    detail: "R incumbent Caroline Dozier was appointed by Gov. Abbott after Judge Frank Aguilar died in office. D challenger Alyson Almaguer is a Felony District Court Chief at the HC DA's office. All-women matchup — competitive given the name recognition that comes with an Abbott appointment.",
  },
  "DC-230th": {
    office: "230th District Court",
    status: "set",
    lean: "likely-d",
    sides: [
      { name: "Chris Morton", party: "D", incumbent: true,  gender: "M", note: "Seeking reelection" },
      { name: "Megan Long",   party: "R", incumbent: false, gender: "F", note: "Harris County ADA, Felony District Court Chief" },
    ],
    detail: "Chris Morton holds the 230th as a Democratic incumbent. R challenger Megan Long is a Felony District Court Chief at the HC DA's office — a formidable opponent.",
  },
  "DC-232nd": {
    office: "232nd District Court",
    status: "set",
    lean: "likely-d",
    sides: [
      { name: "Josh Hill",       party: "D", incumbent: true,  gender: "M", note: "Defeated Fort Bend prosecutor Roderick Rodgers in D primary" },
      { name: "Chuck Silverman", party: "R", incumbent: false, gender: "M", note: "R nominee" },
    ],
    detail: "Josh Hill holds the 232nd as a Democratic incumbent; he survived a primary challenge from Fort Bend County prosecutor Roderick Rodgers.",
  },
  "DC-248th": {
    office: "248th District Court",
    status: "set",
    lean: "likely-d",
    sides: [
      { name: "Hilary Unger",   party: "D", incumbent: true,  gender: "F", note: "Seeking reelection" },
      { name: "David Overhuls", party: "R", incumbent: false, gender: "M", note: "R nominee" },
    ],
    detail: "Hilary Unger holds the 248th as a Democratic incumbent seeking reelection.",
  },
  "DC-262nd": {
    office: "262nd District Court",
    status: "set",
    lean: "likely-d",
    sides: [
      { name: "Lori Chambers Gray", party: "D", incumbent: true,  gender: "F", note: "Seeking reelection" },
      { name: "Nathan Moss",        party: "R", incumbent: false, gender: "M", note: "Harris County ADA, Homicide Bureau Division Chief" },
    ],
    detail: "Lori Chambers Gray holds the 262nd as a Democratic incumbent. R challenger Nathan Moss is a Division Chief in the HC DA's Homicide Bureau.",
  },
  "DC-263rd": {
    office: "263rd District Court",
    status: "set",
    lean: "likely-d",
    sides: [
      { name: "Melissa Morris", party: "D", incumbent: true,  gender: "F", note: "Seeking reelection" },
      { name: "Jason Campo",    party: "R", incumbent: false, gender: "M", note: "Harris County ADA, Homicide Bureau Felony Chief" },
    ],
    detail: "Melissa Morris holds the 263rd as a Democratic incumbent. R challenger Jason Campo is a Felony Chief in the HC DA's Homicide Bureau — among the most high-profile judicial matchups on the Harris County ballot.",
  },
  "DC-482nd": {
    office: "482nd District Court",
    status: "set",
    lean: "likely-d",
    sides: [
      { name: "Veronica Nelson", party: "D", incumbent: true,  gender: "F", note: "Seeking reelection" },
      { name: "Bryan Honeycutt", party: "R", incumbent: false, gender: "M", note: "Harris County ADA, Felony District Court Chief" },
    ],
    detail: "Veronica Nelson holds the 482nd as a Democratic incumbent seeking reelection. R challenger Bryan Honeycutt is a Felony District Court Chief at the HC DA's office.",
  },
  "DC-495th": {
    office: "495th District Court",
    status: "set",
    lean: "lean-d",
    sides: [
      { name: "Tiffany Hill",   party: "D", incumbent: false, gender: "F", note: "Criminal defense attorney; former Associate Judge" },
      { name: "Lori DeAngelo", party: "R", incumbent: true,  gender: "F", note: "Appointed by Gov. Abbott to newly-created court" },
    ],
    detail: "R incumbent Lori DeAngelo was appointed by Gov. Abbott when this court was newly created. D challenger Tiffany Hill is a criminal defense attorney and former Associate Judge. All-women matchup — competitive given the Abbott appointment factor.",
  },
  "DC-496th": {
    office: "496th District Court",
    status: "partial",
    lean: "likely-d",
    sides: [
      { name: "Michael Abner", party: "D", incumbent: false, gender: "M", note: "Harris County ADA, Felony Court Chief; won D primary over Ramona Franklin" },
      { name: "Dan Simons",    party: "R", incumbent: false, gender: "M", note: "R nominee" },
    ],
    detail: "Newly created court. D primary featured Michael Abner (HC ADA, Felony Court Chief) vs. Ramona Franklin (former 338th District Court judge, defeated in her own 2024 primary). Abner won the primary.",
  },
  "DC-497th": {
    office: "497th District Court",
    status: "set",
    lean: "likely-d",
    sides: [
      { name: "Breanna Schwartz", party: "D", incumbent: false, gender: "F", note: "D nominee" },
      { name: "Peyton Peebles",   party: "R", incumbent: false, gender: "M", note: "R nominee" },
    ],
    detail: "Newly created court — open seat with no incumbent. Schwartz is the D nominee in a county race with a strong D structural lean.",
  },
};

export function getMatchup(districtKey: string): Matchup | null {
  return MATCHUPS_2026[districtKey] ?? null;
}
