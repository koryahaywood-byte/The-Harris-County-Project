// One-line stakes for the 2026 ballot, written from the facts already recorded
// in lib/matchups-2026.ts detail fields (open seats, primary upsets, runoff
// margins, appointments). Keyed two ways in the same record:
//   - race-group ids ("top", "statewide", "congress", "statelegis",
//     "countywide", "courts", "local") render as ledes under group headers
//   - matchup keys ("HC-Countywide", "CD-7", "HD-134", ...) render as ledes on
//     individual race cards.
// Style rules: concrete facts only, no em dashes, no "this race matters
// because" framing. If a line can't cite a fact from matchups-2026, it
// doesn't belong here.

export const STAKES: Record<string, string> = {
  // ── Group ledes ─────────────────────────────────────────────────────────────
  top: "Both top-of-ticket seats are open: Paxton beat Cornyn for the Senate nomination, and Hidalgo isn't running for county judge.",
  statewide: "Abbott and Patrick defend their offices. The attorney general and comptroller chairs are open after Paxton left for the Senate race and Hegar left to run Texas A&M.",
  congress: "Five of the county's nine congressional races have no incumbent running. CD-7 is the only toss-up.",
  statelegis: "Primary voters already retired one incumbent: Breaux beat Hubert Vo in the HD-149 runoff. The suburban seats, HD-126, 132 and 138, decide whether the county delegation shifts.",
  countywide: "No Republican filed against Sheriff Gonzalez or DA Teare. The fights are Precinct 4, where former commissioner Radack challenges Briones, and an open District Clerk chair.",
  courts: "Republicans hold five countywide benches on this ballot: CCL 3 and 14 plus the 183rd, 228th and 495th district courts, two of them Abbott appointees.",
  local: "Two JP incumbents fell in the primaries: Wolfe lost Precinct 5 Place 2 to Fury, and Burney lost the Precinct 7 runoff to Miles.",

  // ── Top of ticket ───────────────────────────────────────────────────────────
  "US-Senate": "No incumbent: Paxton beat Cornyn in the May Republican runoff, and Talarico beat Crockett in the Democratic one.",
  "HC-Countywide": "Hidalgo isn't running. Plummer won her runoff over Parker by 2,498 votes; Sanchez took his by 35,937.",

  // ── Statewide Texas ─────────────────────────────────────────────────────────
  "TX-Governor": "Abbott has run Texas since 2014 and wants a third term. Hinojosa, a former Austin state rep, won the Democratic primary.",
  "TX-LtGov": "Patrick wants a fourth term, sits on more than $30M, and won his March primary by the widest margin of his tenure.",
  "TX-AG": "Paxton's old job. Middleton beat Chip Roy 56-44 in the runoff after running as 'MAGA Mayes'; Dallas state senator Nathan Johnson won the D runoff over Jaworski.",
  "TX-Comptroller": "Hegar left in July to run Texas A&M. Trump's endorsement carried Huffines past Abbott-backed Hancock in the primary.",
  "TX-RailroadCommission": "Dunn and Wilks money, roughly $1M through the Texas Freedom Fund, took out incumbent Jim Wright in the runoff. Rosenthal is the first credible Democratic challenger for the seat since 1994.",

  // ── Congress ────────────────────────────────────────────────────────────────
  "CD-18": "Menefee beat Al Green 26,546 to 10,771 in the runoff and is running for his first full term after Sylvester Turner's death.",
  "CD-2": "Crenshaw was the first House incumbent to lose a primary this cycle: Toth beat him by 15 points with Cruz's endorsement.",
  "CD-7": "The county's only congressional toss-up. Fletcher flipped it in 2018 and has held on every cycle; Hale carries national Republican money.",
  "CD-8": "Luttrell isn't running again. Steinmann took the R primary with 70 percent; either way the seat elects a woman.",
  "CD-9": "Republicans redrew this majority-Hispanic seat after 2024, adding deep-red Liberty County. Mealer lost the 2022 county-judge race by 0.9 points.",
  "CD-22": "Troy Nehls is retiring; his identical twin Trever won the primary with Trump's endorsement.",
  "CD-29": "Garcia has held the seat since 2019. Fierro is on her third run after SD-6 in 2024 and HD-145 in 2020.",
  "CD-36": "Babin took 81 percent of his primary and has held the seat since 2015.",
  "CD-38": "Open because Wesley Hunt ran for U.S. Senate and lost his primary.",

  // ── State legislature ───────────────────────────────────────────────────────
  "SD-4": "Creighton resigned to run Texas Tech. Ligon, the former Montgomery County DA, won the May special and defends as an incumbent.",
  "SD-11": "Middleton left for the attorney general race; Dennis Paul gave up HD-129 to run for the seat.",
  "SD-15": "Cook won the 2024 special to replace Whitmire and needs this win for a full four-year term. Trahan lost to her 55-42 in 2024.",
  "HD-126": "Harless is out. Stanart, the polarizing former county tax assessor, gives Bord a target in an R-leaning suburb.",
  "HD-129": "Dennis Paul left for the SD-11 race; Bowen took the R primary with 71.6 percent.",
  "HD-131": "Alma Allen held the seat from 2003 until this year. Childs won the runoff and faces no Republican.",
  "HD-134": "Johnson flipped this seat from the GOP in 2020 and has defended it every cycle since.",
  "HD-135": "Rosenthal left to run for Railroad Commissioner. Evbagharu, his former chief of staff and the first Black chair of the county Democratic Party, won the primary.",
  "HD-141": "Thompson has served since 1973, longer than anyone in the Texas House.",
  "HD-149": "Breaux ended Hubert Vo's incumbency in the May runoff, 1,623 to 1,053.",

  // ── Harris County ───────────────────────────────────────────────────────────
  "PCT-4": "Radack ran neighboring Precinct 3 for 18 years. Now he wants Briones' lean-D seat.",
  "HC-County-Attorney": "Menefee left for Congress. Kamin, appointed interim on a 3-2 court vote in April, is the first woman in the job; Lucci Smith nearly beat Menefee in 2024.",
  "HC-District-Clerk": "Burgess walked after commissioners denied her raise request. Maldonado and Daniel both start fresh.",

  // ── Courts ──────────────────────────────────────────────────────────────────
  "CCL-3": "One of two Republican-held misdemeanor benches: Johnson defends against defense attorney Mathis.",
  "CCL-14": "The inversion race: R incumbent Padilla defends a countywide bench in a county Democrats have swept since 2018.",
  "DC-183rd": "Lance Long holds one of the few Republican criminal district benches in the county; Maldonado runs with the structural D lean behind her.",
  "DC-228th": "Dozier got the bench from Abbott after Judge Aguilar died in office. Almaguer is a felony district court chief at the DA's office.",
  "DC-495th": "Abbott appointed DeAngelo when this court was created. Hill is a former associate judge.",

  // ── JP & local ──────────────────────────────────────────────────────────────
  "JP-5-PL2": "Incumbent Bob Wolfe lost his own primary to Fury, so both names on the ballot are new. A genuine toss-up precinct.",
};
