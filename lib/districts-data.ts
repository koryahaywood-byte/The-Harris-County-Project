// Seat history and district geography descriptions for the Districts portrait tool.
// "key" format: "HD-148", "SD-6", "CD-7", "CC-D", "JP-1"

export interface SeatHolder {
  name: string;
  years: string;
  party: "D" | "R" | "NP";
}

export interface DistrictInfo {
  description: string;      // geographic character of the seat
  seatHistory: SeatHolder[]; // chronological, oldest first
}

export const DISTRICT_INFO: Record<string, DistrictInfo> = {
  // ── Congressional Districts ───────────────────────────────────────────────
  "CD-2": {
    description: "NW Harris County into Montgomery County — The Woodlands, Spring, Cypress, Katy. Safe Republican. Dan Crenshaw lost the March 2026 R primary to Steve Toth.",
    seatHistory: [
      { name: "Jack Fields", years: "1981–1997", party: "R" },
      { name: "Ted Poe", years: "2005–2019", party: "R" },
      { name: "Dan Crenshaw", years: "2019–2026", party: "R" },
      { name: "Steve Toth (R nominee)", years: "2027–present", party: "R" },
    ],
  },
  "CD-7": {
    description: "West Houston — River Oaks, Bellaire, Memorial, Westheimer, Katy. Most competitive congressional seat in Harris County.",
    seatHistory: [
      { name: "Bill Archer", years: "1971–2001", party: "R" },
      { name: "John Culberson", years: "2001–2019", party: "R" },
      { name: "Lizzie Fletcher", years: "2019–present", party: "D" },
    ],
  },
  "CD-8": {
    description: "NE Harris County (Kingwood, Humble, Atascocita) into Montgomery, San Jacinto, and east Texas. Safe Republican.",
    seatHistory: [
      { name: "Jack Fields", years: "1981–1997", party: "R" },
      { name: "Kevin Brady", years: "1997–2023", party: "R" },
      { name: "Morgan Luttrell", years: "2023–2026", party: "R" },
    ],
  },
  "CD-9": {
    description: "SE Houston and suburbs — Pearland, Sunnyside, Missouri City, Third Ward. Open seat 2026 — Al Green ran for CD-18 and lost. Leticia Gutierrez (D) vs. Alex Mealer (R) for the full term starting Jan 2027.",
    seatHistory: [
      { name: "Jack Brooks / Craig Washington", years: "1953–1995", party: "D" },
      { name: "Nick Lampson", years: "1997–2005", party: "D" },
      { name: "Al Green", years: "2005–2027", party: "D" },
      { name: "Leticia Gutierrez or Alex Mealer (2026 General)", years: "2027–present", party: "D" },
    ],
  },
  "CD-18": {
    description: "Houston urban core — Third Ward, Midtown, Montrose, Heights, Near Northside. Sheila Jackson Lee held this seat for 29 years until her death in July 2024. Erica Lee Carter (SJL's daughter) won the Nov 2024 special election for the 118th Congress remainder. Christian Menefee won the 2026 D primary runoff and is the Democratic nominee for the 119th Congress. Safe Democratic.",
    seatHistory: [
      { name: "Craig Washington", years: "1989–1995", party: "D" },
      { name: "Sheila Jackson Lee", years: "1995–2024", party: "D" },
      { name: "Erica Lee Carter", years: "2024–2025", party: "D" },
      { name: "Christian Menefee", years: "2027–present", party: "D" },
    ],
  },
  "CD-22": {
    description: "South Harris County, Pearland, Fort Bend, Brazoria. Safe Republican since Tom DeLay era.",
    seatHistory: [
      { name: "Tom DeLay", years: "1985–2006", party: "R" },
      { name: "Nick Lampson (D, special)", years: "2007–2009", party: "D" },
      { name: "Pete Olson", years: "2009–2021", party: "R" },
      { name: "Troy Nehls", years: "2021–2026", party: "R" },
    ],
  },
  "CD-29": {
    description: "NE Houston — Galena Park, Pasadena, Jacinto City. Heavily Hispanic and Democratic. No R opponent 2026.",
    seatHistory: [
      { name: "Gene Green", years: "1993–2019", party: "D" },
      { name: "Sylvia Garcia", years: "2019–present", party: "D" },
    ],
  },
  "CD-36": {
    description: "SE Harris County into Liberty, Hardin, and deep east Texas. Safe Republican.",
    seatHistory: [
      { name: "Steve Stockman", years: "1995–1997; 2013–2015", party: "R" },
      { name: "Brian Babin", years: "2015–present", party: "R" },
    ],
  },
  "CD-38": {
    description: "SW Harris County, Katy, Fort Bend — created in 2023 redistricting. Open seat 2026 — Wesley Hunt ran for U.S. Senate (lost R primary).",
    seatHistory: [
      { name: "Wesley Hunt", years: "2023–2027", party: "R" },
      { name: "TBD (2026 General — Bonck R vs McDonough D)", years: "2027–present", party: "R" },
    ],
  },

  // ── TX State Senate ──────────────────────────────────────────────────────
  "SD-4": {
    description: "North Houston suburbs — The Woodlands, Spring, Humble. Brandon Creighton resigned in early 2026 to become TX Tech Chancellor. Brett Ligon won the May 2026 special election.",
    seatHistory: [
      { name: "Tommy Williams", years: "2003–2014", party: "R" },
      { name: "Brandon Creighton", years: "2015–2026", party: "R" },
      { name: "Brett Ligon", years: "2026–present", party: "R" },
    ],
  },
  "SD-6": {
    description: "East Houston, Pasadena, Baytown — heavily Hispanic",
    seatHistory: [
      { name: "Mario Gallegos Jr.", years: "1995–2012", party: "D" },
      { name: "Sylvia Garcia", years: "2013–2019", party: "D" },
      { name: "Carol Alvarado", years: "2019–present", party: "D" },
    ],
  },
  "SD-7": {
    description: "West Houston, Katy, Memorial — affluent suburban",
    seatHistory: [
      { name: "Jon Lindsay", years: "1991–2002", party: "R" },
      { name: "Kyle Janek", years: "2003–2014", party: "R" },
      { name: "Paul Bettencourt", years: "2015–present", party: "R" },
    ],
  },
  "SD-11": {
    description: "Southeast Harris County, Galveston, Brazoria. Open seat 2026 — Mayes Middleton did not seek reelection (ran for Texas AG). Dennis Paul (R) vs. Shannon Dicely (D) in November 2026.",
    seatHistory: [
      { name: "Kent Caperton", years: "1975–1991", party: "D" },
      { name: "Buster Brown", years: "1992–2012", party: "R" },
      { name: "Larry Taylor", years: "2013–2022", party: "R" },
      { name: "Mayes Middleton", years: "2023–2026", party: "R" },
      { name: "Dennis Paul or Shannon Dicely (2026 General)", years: "2027–present", party: "R" },
    ],
  },
  "SD-13": {
    description: "South and Southwest Houston — Fifth Ward, Third Ward, Stafford",
    seatHistory: [
      { name: "Chet Brooks", years: "1967–1991", party: "D" },
      { name: "Gene Green", years: "1985–1992", party: "D" },
      { name: "Rodney Ellis", years: "1991–2016", party: "D" },
      { name: "Borris Miles", years: "2017–present", party: "D" },
    ],
  },
  "SD-15": {
    description: "Midtown, Montrose, Heights, Neartown, Galleria corridor",
    seatHistory: [
      { name: "John Whitmire", years: "1983–2023", party: "D" },
      { name: "Molly Cook", years: "2024–present", party: "D" },
    ],
  },
  "SD-17": {
    description: "Fort Bend, Sugar Land, River Oaks, upper Kirby",
    seatHistory: [
      { name: "Kyle Janek", years: "2003–2014", party: "R" },
      { name: "Joan Huffman", years: "2009–present", party: "R" },
    ],
  },
  "SD-18": {
    description: "Brenham, Bay City, Victoria, Wharton — rural corridor west and south of Harris County",
    seatHistory: [
      { name: "Buster Brown", years: "1979–1992", party: "R" },
      { name: "David Sibley", years: "1993–2002", party: "R" },
      { name: "Glenn Hegar", years: "2003–2014", party: "R" },
      { name: "Lois Kolkhorst", years: "2015–present", party: "R" },
    ],
  },

  // ── TX State House ───────────────────────────────────────────────────────
  "HD-126": {
    description: "Northwest Houston — FM 1960, Willowbrook, Copperfield. Open seat 2026: Stan Stanart (R) vs. Stefanie Bord (D).",
    seatHistory: [
      { name: "Patricia Harless", years: "2007–2018", party: "R" },
      { name: "Sam Harless", years: "2019–2026", party: "R" },
    ],
  },
  "HD-127": {
    description: "Atascocita, Humble, Kingwood — northeast Harris County",
    seatHistory: [
      { name: "Dan Huberty", years: "2011–2022", party: "R" },
      { name: "Charles Cunningham", years: "2023–present", party: "R" },
    ],
  },
  "HD-128": {
    description: "Pasadena, Deer Park, La Porte — Southeast industrial. Open seat 2026: Tom Butler (R) vs. Desiree Klaus (D). Briscoe Cain vacated to run for CD-9 (lost runoff).",
    seatHistory: [
      { name: "John Davis", years: "2003–2016", party: "R" },
      { name: "Briscoe Cain", years: "2017–2026", party: "R" },
    ],
  },
  "HD-129": {
    description: "Clear Lake, Friendswood, Seabrook — NASA/JSC corridor. Open seat 2026 — Dennis Paul vacated to run for SD-11. Scott Bowen (R) won the primary.",
    seatHistory: [
      { name: "John Davis", years: "1995–2002", party: "R" },
      { name: "Dennis Paul", years: "2015–2026", party: "R" },
      { name: "Scott Bowen (R nominee)", years: "2027–present", party: "R" },
    ],
  },
  "HD-130": {
    description: "Cypress, Jersey Village, northwest Harris County",
    seatHistory: [
      { name: "Corbin Van Arsdale", years: "2003–2008", party: "R" },
      { name: "Tom Oliverson", years: "2017–present", party: "R" },
    ],
  },
  "HD-131": {
    description: "South Park, Sunnyside, South Houston — historically Black community. Open seat 2026 — Alma Allen retired. Staci Childs (D) won the runoff and runs uncontested — no Republican filed.",
    seatHistory: [
      { name: "Al Edwards", years: "1979–2009", party: "D" },
      { name: "Alma Allen", years: "2005–2026", party: "D" },
      { name: "Staci Childs", years: "2027–present", party: "D" },
    ],
  },
  "HD-132": {
    description: "Bear Creek, Copperfield, west Harris County suburbs",
    seatHistory: [
      { name: "Bill Callegari", years: "2001–2012", party: "R" },
      { name: "Mike Schofield", years: "2013–present", party: "R" },
    ],
  },
  "HD-133": {
    description: "Tanglewood, River Oaks, Greenway Plaza, West University",
    seatHistory: [
      { name: "Beverly Woolley", years: "1993–2006", party: "R" },
      { name: "Jim Murphy", years: "2007–2022", party: "R" },
      { name: "Mano DeAyala", years: "2023–present", party: "R" },
    ],
  },
  "HD-134": {
    description: "Memorial, Hunters Creek, Piney Point, West Houston inner loop",
    seatHistory: [
      { name: "Martha Wong", years: "2003–2006", party: "R" },
      { name: "Ellen Cohen", years: "2007–2012", party: "D" },
      { name: "Sarah Davis", years: "2011–2020", party: "R" },
      { name: "Ann Johnson", years: "2021–present", party: "D" },
    ],
  },
  "HD-135": {
    description: "Cypress-Fairbanks, Spring Branch — diverse northwest corridor",
    seatHistory: [
      { name: "Gary Elkins", years: "1995–2018", party: "R" },
      { name: "Jon Rosenthal", years: "2019–2026", party: "D" },
      { name: "Odus Evbagharu (D nominee)", years: "2027–present", party: "D" },
    ],
  },
  "HD-137": {
    description: "Bellaire, Sharpstown, Westwood — Southwest Houston",
    seatHistory: [
      { name: "Scott Hochberg", years: "1993–2012", party: "D" },
      { name: "Gene Wu", years: "2013–present", party: "D" },
    ],
  },
  "HD-138": {
    description: "Spring Branch, Memorial City, Energy Corridor west",
    seatHistory: [
      { name: "Dwayne Bohac", years: "2003–2018", party: "R" },
      { name: "Lacey Hull", years: "2021–present", party: "R" },
    ],
  },
  "HD-139": {
    description: "Independence Heights, Acres Homes, Kashmere Gardens — North Houston",
    seatHistory: [
      { name: "Sylvester Turner", years: "1989–2016", party: "D" },
      { name: "Jarvis Johnson", years: "2017–2022", party: "D" },
      { name: "Charlene Ward Johnson", years: "2023–present", party: "D" },
    ],
  },
  "HD-140": {
    description: "Near Northside, Aldine, Northside Village — North Houston Hispanic",
    seatHistory: [
      { name: "Kevin Bailey", years: "1989–2002", party: "D" },
      { name: "Armando Walle", years: "2009–present", party: "D" },
    ],
  },
  "HD-141": {
    description: "Fifth Ward, Settegast, Pleasantville — historically Black northeast Houston",
    seatHistory: [
      { name: "Craig Washington", years: "1973–1983", party: "D" },
      { name: "Senfronia Thompson", years: "1973–present", party: "D" },
    ],
  },
  "HD-142": {
    description: "Kashmere Gardens, Trinity/Houston Gardens — Northeast Houston",
    seatHistory: [
      { name: "Wilhelmina Delco", years: "1975–1985", party: "D" },
      { name: "Harold Dutton Jr.", years: "1985–present", party: "D" },
    ],
  },
  "HD-143": {
    description: "East End, Magnolia Park — heavily Hispanic East Houston",
    seatHistory: [
      { name: "Rick Noriega", years: "1999–2008", party: "D" },
      { name: "Ana Hernandez", years: "2007–present", party: "D" },
    ],
  },
  "HD-144": {
    description: "South Houston, Galena Park, Channelview — Ship Channel corridor",
    seatHistory: [
      { name: "Robert Talton", years: "1993–2010", party: "R" },
      { name: "Mary Ann Perez", years: "2013–present", party: "D" },
    ],
  },
  "HD-145": {
    description: "Second Ward, Midtown, EaDo — near east Houston",
    seatHistory: [
      { name: "Jessica Farrar", years: "1994–2018", party: "D" },
      { name: "Christina Morales", years: "2019–present", party: "D" },
    ],
  },
  "HD-146": {
    description: "Riverside Terrace, MacGregor, South Main — Third Ward south",
    seatHistory: [
      { name: "Garnet Coleman", years: "1991–2022", party: "D" },
      { name: "Lauren Ashley Simmons", years: "2023–present", party: "D" },
    ],
  },
  "HD-147": {
    description: "Third Ward, Midtown, Museum District — historically Black",
    seatHistory: [
      { name: "Ron Wilson", years: "1977–2004", party: "D" },
      { name: "Garnet Coleman", years: "1991–2022", party: "D" },
      { name: "Jolanda Jones", years: "2023–present", party: "D" },
    ],
  },
  "HD-148": {
    description: "Heights, Montrose, Washington Avenue — urban core west of downtown",
    seatHistory: [
      { name: "Jessica Farrar", years: "1994–2018", party: "D" },
      { name: "Penny Morales Shaw", years: "2019–present", party: "D" },
    ],
  },
  "HD-149": {
    description: "Alief, Westwood — Southwest Houston, diverse immigrant communities",
    seatHistory: [
      { name: "Martha Wong", years: "1991–2002", party: "R" },
      { name: "Hubert Vo", years: "2005–2027", party: "D" },
      { name: "Darlene Breaux", years: "2027–present", party: "D" },
    ],
  },
  "HD-150": {
    description: "Katy, Cinco Ranch — far west Harris County. Mark Dorazio (R, incumbent) vs. A'Yonna Kellum (D) in November 2026.",
    seatHistory: [
      { name: "Debbie Riddle", years: "2003–2016", party: "R" },
      { name: "Valoree Swanson", years: "2017–2022", party: "R" },
      { name: "Mark Dorazio", years: "2023–present", party: "R" },
    ],
  },

  // ── Harris County ────────────────────────────────────────────────────────
  "HC-Countywide": {
    description: "Harris County — 4.7 million residents, 3rd largest county in the US. County Judge 2026: Letitia Plummer (D) vs. Orlando Sanchez (R). Lina Hidalgo did not seek reelection.",
    seatHistory: [
      { name: "Ed Emmett", years: "2007–2018", party: "R" },
      { name: "Lina Hidalgo", years: "2019–2026", party: "D" },
      { name: "Letitia Plummer or Orlando Sanchez (2026 General)", years: "2027–present", party: "D" },
    ],
  },
  "HC-Precinct 1": {
    description: "South and southeast Houston — Third Ward, Sunnyside, South Main",
    seatHistory: [
      { name: "El Franco Lee", years: "1985–2016", party: "D" },
      { name: "Gene Locke (interim)", years: "2016", party: "D" },
      { name: "Rodney Ellis", years: "2017–present", party: "D" },
    ],
  },
  "HC-Precinct 2": {
    description: "East Harris County — Pasadena, Deer Park, Galena Park",
    seatHistory: [
      { name: "Sylvia Garcia", years: "2001–2010", party: "D" },
      { name: "Jack Morman", years: "2011–2018", party: "R" },
      { name: "Adrian Garcia", years: "2019–present", party: "D" },
    ],
  },
  "HC-Precinct 3": {
    description: "Northwest Harris County — Katy, Cypress, Jersey Village",
    seatHistory: [
      { name: "Steve Radack", years: "1989–2020", party: "R" },
      { name: "Tom Ramsey", years: "2021–present", party: "R" },
    ],
  },
  "HC-Precinct 4": {
    description: "North Harris County — The Woodlands, Spring, Tomball",
    seatHistory: [
      { name: "Jerry Eversole", years: "1995–2011", party: "R" },
      { name: "Jack Cagle", years: "2011–2022", party: "R" },
      { name: "Lesley Briones", years: "2023–present", party: "D" },
    ],
  },

  // ── City of Houston ──────────────────────────────────────────────────────
  "COH-Citywide": {
    description: "City of Houston — 2.3 million residents, 4th largest city in the US",
    seatHistory: [
      { name: "Sylvester Turner", years: "2016–2024", party: "D" },
      { name: "John Whitmire", years: "2024–present", party: "D" },
    ],
  },
  "COH-District A": {
    description: "Northwest Houston — Spring Branch, Garden Oaks, Oak Forest",
    seatHistory: [
      { name: "Helena Brown", years: "2012–2013", party: "R" },
      { name: "Brenda Stardig", years: "2014–2019", party: "R" },
      { name: "Amy Peck", years: "2019–present", party: "R" },
    ],
  },
  "COH-District B": {
    description: "Northeast Houston — Northside, Acres Homes, Kashmere",
    seatHistory: [
      { name: "Jarvis Johnson", years: "2004–2012", party: "D" },
      { name: "Jerry Davis", years: "2012–2019", party: "D" },
      { name: "Tarsha Jackson", years: "2020–present", party: "D" },
    ],
  },
  "COH-District C": {
    description: "West Houston — Rice Military, Memorial, Tanglewood",
    seatHistory: [
      { name: "Anne Clutterbuck", years: "2008–2012", party: "R" },
      { name: "Ellen Cohen", years: "2013–2019", party: "D" },
      { name: "Abbie Kamin", years: "2020–2023", party: "D" },
      { name: "Joe Panzarella", years: "2024–present", party: "D" },
    ],
  },
  "COH-District D": {
    description: "South Houston — Sunnyside, South Park, OST/South Union",
    seatHistory: [
      { name: "Wanda Adams", years: "2004–2014", party: "D" },
      { name: "Dwight Boykins", years: "2014–2020", party: "D" },
      { name: "Carolyn Evans-Shabazz", years: "2020–present", party: "D" },
    ],
  },
  "COH-District E": {
    description: "Southeast Houston — Clear Lake, Friendswood, Gulfgate",
    seatHistory: [
      { name: "Mike Sullivan", years: "2008–2013", party: "R" },
      { name: "Dave Martin", years: "2013–2023", party: "R" },
      { name: "Fred Flickinger", years: "2024–present", party: "R" },
    ],
  },
  "COH-District F": {
    description: "Southwest Houston — Alief, Westchase, Sharpstown",
    seatHistory: [
      { name: "Al Hoang", years: "2010–2014", party: "R" },
      { name: "Steve Le", years: "2014–2020", party: "R" },
      { name: "Tiffany Thomas", years: "2020–present", party: "D" },
    ],
  },
  "COH-District G": {
    description: "West Houston — Memorial, Energy Corridor, Westside",
    seatHistory: [
      { name: "Joe Tully", years: "1995–2002", party: "R" },
      { name: "Melissa Noriega", years: "2006–2009", party: "D" },
      { name: "Oliver Pennington", years: "2010–2014", party: "R" },
      { name: "Greg Travis", years: "2014–2023", party: "R" },
      { name: "Mary Nan Huffman", years: "2024–present", party: "R" },
    ],
  },
  "COH-District H": {
    description: "East Houston — Second Ward, East End, Harrisburg",
    seatHistory: [
      { name: "Adrian Garcia", years: "2002–2008", party: "D" },
      { name: "Ed Gonzalez", years: "2010–2017", party: "D" },
      { name: "Karla Cisneros", years: "2017–2021", party: "D" },
      { name: "Isabel Longoria", years: "2021–2022", party: "D" },
      { name: "Mario Castillo", years: "2023–present", party: "D" },
    ],
  },
  "COH-District I": {
    description: "Near Northside, Lindale Park, Greater Heights east",
    seatHistory: [
      { name: "James Rodriguez", years: "2014–2020", party: "D" },
      { name: "Robert Gallegos", years: "2014–2023", party: "D" },
      { name: "Joaquin Martinez", years: "2024–present", party: "D" },
    ],
  },
  "COH-District J": {
    description: "Westpark, Gulfton, Braeswood — highly diverse Southwest",
    seatHistory: [
      { name: "Mike Laster", years: "2010–2020", party: "D" },
      { name: "Ed Pollard", years: "2020–present", party: "D" },
    ],
  },
  "COH-District K": {
    description: "South Main, Braeswood, Fondren Southwest",
    seatHistory: [
      { name: "Larry Green", years: "2004–2014", party: "D" },
      { name: "Martha Castex-Tatum", years: "2016–present", party: "D" },
    ],
  },
};

// Maps the district type + number to a district info key
export function getDistrictKey(districtType: string, districtNumber: string): string {
  if (districtType === "TX State House") return `HD-${districtNumber}`;
  if (districtType === "TX State Senate") return `SD-${districtNumber}`;
  if (districtType === "Harris County JP") return `HC-JP${districtNumber}`;
  if (districtType === "City Council") {
    if (districtNumber.startsWith("At-Large")) return `COH-${districtNumber}`;
    return `COH-District ${districtNumber}`;
  }
  if (districtType === "U.S. Congressional") return `CD-${districtNumber}`;
  return "";
}

// Synthetic precinct-to-district assignment for types without Census TIGER crosswalk.
// Uses deterministic modulo bucketing — approximate geographic distribution only.
export function syntheticDistrictForPrecinct(
  precinctId: string,
  districtType: string,
  districtOptions: string[]
): string {
  const n = parseInt(precinctId, 10) || 0;
  const idx = n % districtOptions.length;
  return districtOptions[idx];
}
