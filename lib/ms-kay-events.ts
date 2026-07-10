// Ms. Kay's Calendar: the Democratic social season in and around Harris
// County. SOURCE OF TRUTH: Ms. Kay's own calendar at ekayshepard.com/calendar,
// a published Google Sheet she updates near-daily. Fetch it as CSV:
//   https://docs.google.com/spreadsheets/d/e/2PACX-1vSZfJUVOA4fN6KnkVYHG0b2sM9vP1DNL0hPyeAie6mE7kGKkD4iBqJVHv44rCeG1ZS_YYlnIxb84TPo/pub?gid=0&single=true&output=csv
// The daily-freshness routine syncs this file from that sheet each morning.
//
// Sync rules:
// - The sheet is one rolling list starting May 2025, in rough chronological
//   order with loose column usage — read whole rows, and only sync rows from
//   today forward. When the printed weekday disagrees with the date, the date
//   and the club's real meeting pattern win (e.g. Tejano Dems meet Thursdays).
// - Additive: past events are never deleted or rewritten, and an event is
//   never removed just because it scrolled off the sheet.
//
// `channel` records where each host usually posts events, so readers know
// where to watch for updates: HCDP-affiliated clubs live on Facebook +
// Mobilize (mobilize.us/hcdp); campaigns on Mobilize; ticketed galas on
// Eventbrite; several clubs keep their own site calendars.

export type KayCategory =
  | "Club Meeting" | "Fundraiser" | "Organizing" | "Town Hall"
  | "Social" | "Gala" | "Service" | "Election Day";

export type KayChannel = "Facebook" | "Mobilize" | "Eventbrite" | "Website" | "RSVP";

export interface KayEvent {
  id: string;
  date: string;             // YYYY-MM-DD
  startTime?: string;       // 24h "18:30" — omitted when the listing has none
  endTime?: string;
  timeLabel: string;        // as printed: "6:30-7:30PM"
  title: string;
  host: string;
  venue?: string;
  address?: string;
  note?: string;
  rsvp?: string;            // email / phone / url from the listing
  category: KayCategory;
  channel: KayChannel[];    // where this host usually posts
  channelVerified?: boolean; // true only when we confirmed the host's active pages;
                             // the UI shows the "usually posts on" line only then
  recurring?: "weekly";     // projects onto the same weekday through Election Day
}

export const KAY_CAT_COLOR: Record<KayCategory, string> = {
  "Club Meeting": "#7c3aed",
  "Fundraiser":   "#be185d",
  "Organizing":   "#6d28d9",
  "Town Hall":    "#9333ea",
  "Social":       "#a855f7",
  "Gala":         "#b45309",
  "Service":      "#0d9488",
  "Election Day": "#c9a227",
};

// Who posts where. VERIFIED HOSTS ONLY: each entry below was confirmed
// against the host's live pages. Don't add a host here on inference; verify
// the page exists and has recent activity first.
export const KAY_GROUPS: { name: string; posts: string }[] = [
  { name: "Ms. Kay herself", posts: "ekayshepard.com — her full calendar, the source this page is kept in step with" },
  { name: "Greater Heights Democratic Club", posts: "greaterheightsdemocrats.com/calendar · Facebook (@greaterheightsdems) · Mobilize (mobilize.us/hcdp)" },
  { name: "Oak Forest Area Democrats", posts: "oakforestdems.org · Facebook" },
  { name: "Harris County Tejano Democrats", posts: "Facebook (@hctejanos) · Mobilize" },
  { name: "Bayou Blue Democrats", posts: "Facebook (@BayouBlueDems)" },
  { name: "Houston LGBTQ+ Political Caucus", posts: "thecaucus.org · Facebook (@thecaucus)" },
  { name: "HCDP club directory", posts: "harrisdemocrats.org/clubs lists every chartered club and its links" },
];

export const KAY_EVENTS: KayEvent[] = [
  { id: "mk-01", date: "2026-07-04", startTime: "12:00", endTime: "15:00", timeLabel: "12:00–3:00 PM",
    title: "Freedom Lunch: Honoring Aging Veterans", host: "Freedom Lunch", address: "4500 Travis St",
    note: "Volunteers needed", rsvp: "FreedomLunch2026.eventbrite.com", category: "Service", channel: ["Eventbrite"] },
  { id: "mk-02", date: "2026-07-06", startTime: "18:00", endTime: "20:00", timeLabel: "6:00–8:00 PM",
    title: "Sunday Night Dems", host: "Greater Heights Democratic Club",
    note: "RSVP for address", category: "Social", channel: ["Facebook", "Mobilize", "Website"], channelVerified: true },
  { id: "mk-03", date: "2026-07-07", startTime: "19:00", timeLabel: "7:00 PM",
    title: "Monthly Meeting", host: "Oak Forest Area Dems", venue: "Spaghetti Western Restaurant", address: "1951 W TC Jester Blvd",
    category: "Club Meeting", channel: ["Website", "Facebook"], channelVerified: true },
  { id: "mk-04", date: "2026-07-07", startTime: "19:00", endTime: "20:30", timeLabel: "7:00–8:30 PM",
    title: "Hinojosa for Governor Town Hall", host: "Gina Hinojosa campaign", venue: "Eldorado Ballroom", address: "2310 Elgin St",
    category: "Town Hall", channel: ["Mobilize"] },
  { id: "mk-05", date: "2026-07-10", startTime: "19:00", timeLabel: "7:00 PM",
    title: "Monthly Meeting", host: "Tejano Dems", venue: "Leonel Castillo Community Center", address: "2101 South St",
    category: "Club Meeting", channel: ["Facebook", "Mobilize"], channelVerified: true },
  { id: "mk-07", date: "2026-07-12", startTime: "10:00", endTime: "12:00", timeLabel: "10:00 AM–12:00 PM",
    title: "Democracy and Donuts", host: "West University Dems", venue: "West University Community Center", address: "6104 Auden St",
    category: "Social", channel: ["Facebook", "Mobilize"] },
  { id: "mk-08", date: "2026-07-12", startTime: "18:30", timeLabel: "6:30 PM",
    title: "Community Conversations for Talarico", host: "Viola & Agnes", address: "3659 Nasa Rd 1 #A, Seabrook",
    category: "Organizing", channel: ["Mobilize"] },
  { id: "mk-09", date: "2026-07-12", startTime: "09:00", timeLabel: "9:00 AM",
    title: "Community Conversations: Adrienne Bell for Brazoria County Clerk", host: "Adrienne Bell campaign",
    venue: "Hando Coffee Bar", address: "10237 Bailey Rd, Manvel", category: "Organizing", channel: ["Mobilize", "Facebook"] },
  { id: "mk-10", date: "2026-07-12", startTime: "17:00", endTime: "19:00", timeLabel: "5:00–7:00 PM",
    title: "Dr. Letitia Plummer Fundraiser", host: "Democracy Guardians", address: "2026 Persa Dr",
    rsvp: "Info@DRLETITIAPLUMMER.COM", category: "Fundraiser", channel: ["RSVP", "Facebook"] },
  { id: "mk-11", date: "2026-07-12", startTime: "15:00", timeLabel: "3:00 PM",
    title: "Karaoke Birthday Fundraiser · SBOE District 6", host: "Michelle Palmer, State Board of Education",
    venue: "Spotlight Karaoke", address: "5901 Westheimer Rd #P", category: "Fundraiser", channel: ["Mobilize", "Facebook"] },
  { id: "mk-12", date: "2026-07-14", startTime: "18:00", endTime: "20:00", timeLabel: "6:00–8:00 PM",
    title: "Monthly Meeting", host: "Baytown Area Democrats", note: "Address upon RSVP",
    category: "Club Meeting", channel: ["Facebook"] },
  { id: "mk-13", date: "2026-07-15", startTime: "18:00", endTime: "19:30", timeLabel: "6:00–7:30 PM",
    title: "Take Texas Back Tuesdays", host: "Texas Majority Project", venue: "Black Rock Coffee Bar",
    address: "9437 FM 1960 Bypass, Humble", note: "Every Tuesday", category: "Organizing", channel: ["Mobilize"], recurring: "weekly" },
  { id: "mk-14", date: "2026-07-14", startTime: "18:30", timeLabel: "6:30 PM",
    title: "Congressional District 9 Meeting", host: "CD-9 Democrats", venue: "Flukinger Community Center",
    address: "16003 Lorenzo St, Channelview", note: "New location", category: "Club Meeting", channel: ["Facebook", "Mobilize"] },
  { id: "mk-15", date: "2026-07-16", startTime: "18:00", endTime: "19:30", timeLabel: "6:00–7:30 PM",
    title: "Texas Together: Family & Friends Program", host: "Texas Majority Project", address: "4119 Montrose Blvd #400",
    note: "Every Wednesday", category: "Organizing", channel: ["Mobilize"], recurring: "weekly" },
  { id: "mk-39", date: "2026-07-17", startTime: "17:30", endTime: "20:00", timeLabel: "5:30–8:00 PM",
    title: "Board Installation Ceremony", host: "Harris County Tejano Democrats",
    venue: "Home of Janie & Frumencio Reyes", address: "502 Highland St",
    note: "Installing the 2026–2027 board — at the house where it all started",
    category: "Social", channel: ["Facebook", "Mobilize"], channelVerified: true },
  { id: "mk-16", date: "2026-07-19", startTime: "17:00", timeLabel: "5:00 PM",
    title: "Call to Action · Speaker Don Scott (Virginia)", host: "TX Conference Lay Organization",
    rsvp: "832.228.7929 (Claudia)", category: "Town Hall", channel: ["Facebook"] },
  { id: "mk-17", date: "2026-07-19", startTime: "10:00", timeLabel: "10:00 AM",
    title: "Club Gathering at 4th Wall Theatre", host: "Greater Heights Democratic Club", address: "1824 Spring St #101",
    category: "Social", channel: ["Facebook", "Mobilize", "Website"], channelVerified: true },
  { id: "mk-19", date: "2026-07-21", startTime: "19:00", timeLabel: "7:00 PM",
    title: "Monthly Meeting", host: "Braes Bayou Association", category: "Club Meeting", channel: ["Facebook"] },
  { id: "mk-20", date: "2026-07-21", startTime: "18:30", endTime: "20:00", timeLabel: "6:30–8:00 PM",
    title: "What Does the Future Hold for HCDP", host: "RoadWomen", venue: "St. Stephen's", address: "1800 Sul Ross St",
    category: "Club Meeting", channel: ["Facebook"] },
  { id: "mk-21", date: "2026-07-26", startTime: "19:00", timeLabel: "7:00 PM",
    title: "Black Excellence Awards", host: "Black Excellence Awards", address: "1415 Constitution Ave",
    category: "Gala", channel: ["Eventbrite"] },
  { id: "mk-22", date: "2026-07-26", startTime: "10:00", endTime: "14:00", timeLabel: "10:00 AM–2:00 PM",
    title: "Resource Fair", host: "Pure Justice", venue: "Shrine of the Black Madonna", address: "5309 MLK Blvd",
    category: "Service", channel: ["Facebook", "Website"] },
  { id: "mk-23", date: "2026-07-28", startTime: "18:30", timeLabel: "6:30 PM",
    title: "Monthly Meeting", host: "Texas Democratic Women", venue: "AFL-CIO Building", address: "2506 Sutherland St",
    category: "Club Meeting", channel: ["Facebook"] },
  { id: "mk-24", date: "2026-07-28", startTime: "18:00", timeLabel: "6:00 PM",
    title: "Meet & Greet · H-Town Bangladeshi American Community", host: "Letitia Plummer for County Judge",
    note: "RSVP for location", rsvp: "713.449.9532", category: "Organizing", channel: ["Mobilize", "RSVP"] },
  { id: "mk-25", date: "2026-07-28", startTime: "19:00", endTime: "21:00", timeLabel: "7:00–9:00 PM",
    title: "HC Communities Meeting", host: "Harris County Communities", venue: "Fallbrook Church Epic Center Room",
    address: "12512 Walters Rd, Entry 10", rsvp: "info@harriscountycm.org", category: "Club Meeting", channel: ["RSVP", "Facebook"] },
  { id: "mk-26", date: "2026-07-30", startTime: "18:00", timeLabel: "6:00 PM",
    title: "Monthly Meeting", host: "Fifth Ward Super Neighborhood", address: "4014 Market St",
    category: "Club Meeting", channel: ["Facebook"] },
  { id: "mk-27", date: "2026-07-30", startTime: "19:00", timeLabel: "7:00 PM",
    title: "Jon Rosenthal for Railroad Commissioner", host: "West U Dems & Precinct Chairs Shukla/Shields",
    address: "3821 Rice Blvd", category: "Organizing", channel: ["Mobilize", "Facebook"] },
  { id: "mk-28", date: "2026-08-09", startTime: "09:00", timeLabel: "9:00 AM",
    title: "Endorsement Meeting", host: "Houston LGBTQ+ Political Caucus", venue: "Metropolitan Community Church",
    address: "2025 W 11th St", category: "Club Meeting", channel: ["Website", "Facebook"], channelVerified: true },
  { id: "mk-29", date: "2026-08-09", startTime: "14:00", endTime: "16:00", timeLabel: "2:00–4:00 PM",
    title: "Brazoria County Organizing Rally", host: "Pearland Organizing Rally", address: "11801 Shadow Creek Pkwy, Pearland",
    category: "Organizing", channel: ["Mobilize"] },
  { id: "mk-30", date: "2026-08-13", startTime: "18:30", timeLabel: "6:30 PM",
    title: "Monthly Meeting", host: "Bayou Blue Democrats", venue: "St. Stephen's Church", address: "1800 Sul Ross St",
    category: "Club Meeting", channel: ["Facebook"], channelVerified: true },
  { id: "mk-31", date: "2026-08-19", startTime: "16:00", endTime: "19:00", timeLabel: "4:00–7:00 PM",
    title: "Volunteer Launch Party & Community Social", host: "League of Women Voters (nonpartisan)",
    note: "First location TBA; second location Kirby Ice House", category: "Social", channel: ["Website", "Facebook"] },
  { id: "mk-32", date: "2026-08-24", startTime: "10:30", timeLabel: "10:30 AM",
    title: "Luncheon Debate: Letitia Plummer / Orlando Sanchez", host: "Junior League of Houston",
    note: "Ticketed", rsvp: "ghwcc.org", category: "Town Hall", channel: ["Website"] },
  { id: "mk-33", date: "2026-08-26", startTime: "17:30", timeLabel: "5:30 PM",
    title: "Honoring Congresspersons Green & Garcia", host: "Democratic Lawyers Association", venue: "Bracewell LLP",
    address: "711 Louisiana St #2300", note: "Save the date", category: "Gala", channel: ["Facebook"] },
  { id: "mk-34", date: "2026-08-29", startTime: "07:00", timeLabel: "7:00 AM",
    title: "Wildcat Golf Tournament", host: "Constable Smokie Phillips", address: "12000 Almeda Rd",
    rsvp: "281.960.9217", category: "Fundraiser", channel: ["RSVP", "Eventbrite"] },
  { id: "mk-35", date: "2026-09-19", startTime: "11:00", endTime: "13:00", timeLabel: "11:00 AM–1:00 PM",
    title: "Women Making History", host: "Texas Democratic Women", venue: "DoubleTree Hotel", address: "8181 Airport Blvd",
    category: "Gala", channel: ["Facebook"] },
  { id: "mk-36", date: "2026-09-28", startTime: "18:30", endTime: "20:45", timeLabel: "6:30–8:45 PM",
    title: "Texas Criminal Record Relief Bill Town Hall", host: "Community town hall",
    venue: "Barbara Jordan–Mickey Leland School of Public Affairs", address: "3100 Cleburne St, Auditorium",
    rsvp: "713.538.0466 (Tangi)", category: "Town Hall", channel: ["Facebook"] },
  { id: "mk-37", date: "2026-11-03", startTime: "07:00", endTime: "19:00", timeLabel: "7:00 AM–7:00 PM",
    title: "ELECTION DAY", host: "Harris County", note: "The main event of the season. Polls open 7 to 7.",
    category: "Election Day", channel: ["Website"] },
  { id: "mk-38", date: "2026-12-12", startTime: "18:00", timeLabel: "6:00 PM",
    title: "Houston Area Urban League Gala", host: "Houston Area Urban League", venue: "Hilton Americas",
    address: "1600 Lamar St", note: "Save the date", category: "Gala", channel: ["Eventbrite", "Website"] },

  // ── Synced from ekayshepard.com July 10, 2026 ──────────────────────────────
  { id: "mk-41", date: "2026-07-10", startTime: "17:30", timeLabel: "5:30 PM",
    title: "No Buyouts — Save HCDP", host: "Community organizers",
    venue: "Julia C. Hester House", address: "2020 Solo St",
    category: "Organizing", channel: ["Facebook"] },
  { id: "mk-42", date: "2026-07-14", startTime: "18:00", endTime: "19:30", timeLabel: "6:00–7:30 PM",
    title: "Community Dinner · Christian Menefee", host: "CD-18 organizers",
    venue: "Mosiac on Almeda", rsvp: "RSVP CD 18",
    category: "Organizing", channel: ["Mobilize", "Facebook"] },
  { id: "mk-43", date: "2026-07-15", startTime: "18:30", timeLabel: "6:30 PM",
    title: "Monthly Meeting", host: "SW Dems & RoadWomen Clubs",
    venue: "St. Stephen's Church", address: "1800 Sul Ross St",
    category: "Club Meeting", channel: ["Facebook"] },
  { id: "mk-44", date: "2026-07-15", startTime: "18:00", endTime: "20:00", timeLabel: "6:00–8:00 PM",
    title: "HCDP 2026 Convention Planning Kickoff", host: "Harris County Democratic Party",
    address: "4400 Post Oak Pkwy",
    category: "Organizing", channel: ["Facebook", "Mobilize"] },
  { id: "mk-45", date: "2026-07-16", startTime: "18:00", timeLabel: "6:00 PM",
    title: "Candidate Recruitment Rally", host: "HCDP / Turn Texas Blue",
    venue: "Memorial West Community Center", address: "700 N Kirkwood Rd",
    category: "Organizing", channel: ["Facebook", "Mobilize"] },
  { id: "mk-46", date: "2026-07-17", startTime: "12:00", timeLabel: "Noon",
    title: "Meet Rep. James Talarico", host: "HCDP",
    venue: "Harris County Democratic Party HQ", address: "3302 Canal St",
    rsvp: "RSVP required", category: "Organizing", channel: ["Mobilize", "Facebook"] },
  { id: "mk-47", date: "2026-07-17", startTime: "18:30", endTime: "19:30", timeLabel: "6:30–7:30 PM",
    title: "Monthly Meeting · Speaker Harold Dutton", host: "East Houston Democrats",
    note: "Virtual", category: "Club Meeting", channel: ["Facebook"] },
  { id: "mk-48", date: "2026-07-17", startTime: "18:00", endTime: "21:00", timeLabel: "6:00–9:00 PM",
    title: "Politics & Pours", host: "HBAD (Harris County Black and African Descent Democrats)",
    venue: "Sneaks", address: "3030 Travis St",
    category: "Social", channel: ["Facebook"] },
  { id: "mk-49", date: "2026-07-17", startTime: "18:00", timeLabel: "6:00 PM",
    title: "Democratic Judges Town Hall — Serious About Safety", host: "Harris County Democratic Judges",
    address: "3710 McHard Rd",
    category: "Town Hall", channel: ["Facebook", "Mobilize"] },
  { id: "mk-50", date: "2026-07-19", startTime: "17:00", endTime: "20:00", timeLabel: "5:00–8:00 PM",
    title: "Day of Action / HATCH Youth", host: "HCDP",
    venue: "Montrose Center", address: "401 Branard St",
    category: "Organizing", channel: ["Facebook", "Mobilize"] },
  { id: "mk-51", date: "2026-07-19", startTime: "18:00", endTime: "21:00", timeLabel: "6:00–9:00 PM",
    title: "Vikki Goodwin for Lt. Governor", host: "Vikki Goodwin campaign",
    venue: "AxelRad Beer Garden", address: "1517 Alabama St",
    rsvp: "tinyurl.com/goodwin-houston", category: "Fundraiser", channel: ["Mobilize"] },
  { id: "mk-52", date: "2026-07-20", startTime: "16:00", endTime: "17:30", timeLabel: "4:00–5:30 PM",
    title: "Meet Vikki Goodwin for Lt. Governor", host: "Moms 4 Public Education",
    venue: "LaTapatia Sugar Land",
    category: "Organizing", channel: ["Facebook", "Mobilize"] },
  { id: "mk-53", date: "2026-07-20", startTime: "19:00", timeLabel: "7:00 PM",
    title: "Monthly Meeting", host: "Area 5 Democrats",
    note: "Pasadena", category: "Club Meeting", channel: ["Facebook"] },
  { id: "mk-54", date: "2026-07-21", startTime: "18:30", timeLabel: "6:30 PM",
    title: "Monthly Meeting · Speaker Vikki Goodwin", host: "Meyerland Dems",
    venue: "Faith Lutheran Church", address: "4600 Bellaire Blvd",
    category: "Club Meeting", channel: ["Facebook", "Mobilize"] },
  { id: "mk-55", date: "2026-07-21", startTime: "18:00", endTime: "19:30", timeLabel: "6:00–7:30 PM",
    title: "Community Dinner · Amanda Edwards", host: "CD-18 organizers",
    venue: "Mosiac on Almeda", rsvp: "RSVP CD 18",
    category: "Organizing", channel: ["Mobilize", "Facebook"] },
  { id: "mk-56", date: "2026-07-23", startTime: "18:00", timeLabel: "6:00 PM",
    title: "Petition Potluck", host: "Area 5 Democrats",
    note: "Pasadena", category: "Organizing", channel: ["Facebook"] },
  { id: "mk-57", date: "2026-07-24", startTime: "17:30", endTime: "20:00", timeLabel: "5:30–8:00 PM",
    title: "Phone Bank to Fight Back", host: "State Sen. Molly Cook",
    note: "Virtual", category: "Organizing", channel: ["Mobilize"] },
  { id: "mk-58", date: "2026-07-25", startTime: "18:30", timeLabel: "6:30 PM",
    title: "Virtual Town Hall · HD 146", host: "Rep. Lauren Ashley Simmons",
    note: "Virtual", rsvp: "713.234.6010",
    category: "Town Hall", channel: ["Facebook"] },
  { id: "mk-59", date: "2026-07-26", startTime: "11:00", timeLabel: "11:00 AM",
    title: "Redistricting Forum — Sen. Senfronia Thompson", host: "Congressional Redistricting Committee",
    venue: "U of H Student Center Room 220", address: "4455 University Dr",
    category: "Town Hall", channel: ["Facebook", "Mobilize"] },
  { id: "mk-60", date: "2026-07-28", startTime: "18:00", endTime: "19:30", timeLabel: "6:00–7:30 PM",
    title: "Community Dinner · Zoe Cadore", host: "CD-18 organizers",
    venue: "Mosiac on Almeda", rsvp: "RSVP CD 18",
    category: "Organizing", channel: ["Mobilize", "Facebook"] },
];
