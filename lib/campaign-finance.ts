export interface CandidateFinance {
  name: string;
  office: string;
  level: "federal" | "state" | "houston" | "county";
  party: "D" | "R";
  cash: number;
  raised?: number;
  spent?: number;
  investments?: number;
  loans?: number;
  asOf: string;
  incumbent?: boolean;
  filingUrl?: string;
}

const TEC = (name: string) => `https://www.ethics.state.tx.us/search/cf/list.php?name=${encodeURIComponent(name)}&type=cand`;
const FEC = (id: string) => `https://www.fec.gov/data/candidate/${id}/`;

export const FINANCE_DATA: CandidateFinance[] = [
  // Federal
  { name: "James Talarico",        office: "U.S. Senate (D nominee)",       level: "federal",  party: "D", cash: 9858865,   raised: 27000000, spent: 17141135, asOf: "Apr 2026", incumbent: false, filingUrl: FEC("S6TX00462") },
  { name: "John Cornyn",           office: "U.S. Senate (R runoff)",         level: "federal",  party: "R", cash: 8200000,   raised: 9000000,  spent: 15800000, asOf: "Apr 2026", incumbent: true,  filingUrl: FEC("S0TX00999") },
  { name: "Ken Paxton",            office: "U.S. Senate (R runoff)",         level: "federal",  party: "R", cash: 2600000,   raised: 2200000,  spent: 3200000,  asOf: "Apr 2026", incumbent: false, filingUrl: FEC("S4TX00462") },
  { name: "Lizzie Fletcher",       office: "U.S. Rep CD-07",                 level: "federal",  party: "D", cash: 1750893,   asOf: "Apr 2026", incumbent: true,  filingUrl: FEC("H8TX07139") },
  { name: "Shaun Finnie",          office: "U.S. Rep CD-02 (D nominee)",     level: "federal",  party: "D", cash: 1543080,   asOf: "Apr 2026", incumbent: false, filingUrl: FEC("H4TX02177") },
  { name: "Al Green",              office: "CD-18 candidate (lost runoff)",  level: "federal",  party: "D", cash: 264570,    asOf: "Apr 2026", incumbent: false, filingUrl: FEC("H4TX09090") },
  { name: "Christian Menefee",     office: "U.S. Rep CD-18",                 level: "federal",  party: "D", cash: 255858,    asOf: "Apr 2026", incumbent: true,  filingUrl: FEC("H4TX18126") },
  { name: "Sylvia Garcia",         office: "U.S. Rep CD-29",                 level: "federal",  party: "D", cash: 175662,    asOf: "Apr 2026", incumbent: true,  filingUrl: FEC("H8TX29049") },
  // State
  { name: "Greg Abbott",           office: "Governor",                        level: "state",    party: "R", cash: 105700000, raised: 22700000, asOf: "Jan 2026", incumbent: true,  filingUrl: TEC("Greg Abbott") },
  { name: "Carol Alvarado",        office: "State Senator SD-6",             level: "state",    party: "D", cash: 1564381,   asOf: "Jan 2025", incumbent: true,  filingUrl: TEC("Carol Alvarado") },
  { name: "Senfronia Thompson",    office: "State Rep HD-141",               level: "state",    party: "D", cash: 1032927,   asOf: "Jan 2025", incumbent: true,  filingUrl: TEC("Senfronia Thompson") },
  { name: "Gina Hinojosa",         office: "Governor (D nominee)",            level: "state",    party: "D", cash: 1000000,   raised: 1300000, spent: 300000,   asOf: "Jan 2026 est.", incumbent: false, filingUrl: TEC("Gina Hinojosa") },
  { name: "Ann Johnson",           office: "State Rep HD-134",               level: "state",    party: "D", cash: 527021,    asOf: "Jan 2025", incumbent: true,  filingUrl: TEC("Ann Johnson") },
  { name: "Ana Hernandez",         office: "State Rep HD-143",               level: "state",    party: "D", cash: 448309,    asOf: "Jan 2025", incumbent: true,  filingUrl: TEC("Ana Hernandez") },
  { name: "Armando Walle",         office: "State Rep HD-140",               level: "state",    party: "D", cash: 267898,    asOf: "Jan 2025", incumbent: true,  filingUrl: TEC("Armando Walle") },
  { name: "Mary Ann Perez",        office: "State Rep HD-144",               level: "state",    party: "D", cash: 211703,    asOf: "Jan 2025", incumbent: true,  filingUrl: TEC("Mary Ann Perez") },
  { name: "Molly Cook",            office: "State Senator SD-15",            level: "state",    party: "D", cash: 155853,    asOf: "Jan 2025", incumbent: true,  filingUrl: TEC("Molly Cook") },
  // County
  { name: "Rodney Ellis",          office: "Commissioner PCT 1",             level: "county",   party: "D", cash: 7783681,   asOf: "Jan 2026", incumbent: true,  filingUrl: TEC("Rodney Ellis") },
  { name: "Lesley Briones",        office: "Commissioner PCT 4",             level: "county",   party: "D", cash: 4058292,   asOf: "Jan 2026", incumbent: true,  filingUrl: TEC("Lesley Briones") },
  { name: "Adrian Garcia",         office: "Commissioner PCT 2",             level: "county",   party: "D", cash: 2544776,   asOf: "Jan 2026", incumbent: true,  filingUrl: TEC("Adrian Garcia") },
  { name: "Tom Ramsey",            office: "Commissioner PCT 3",             level: "county",   party: "R", cash: 2032612,   asOf: "Jan 2026", incumbent: true,  filingUrl: TEC("Tom Ramsey") },
  { name: "Lina Hidalgo",          office: "County Judge",                   level: "county",   party: "D", cash: 344873,    asOf: "Jan 2026", incumbent: true,  filingUrl: TEC("Lina Hidalgo") },
  { name: "Annise Parker",         office: "County Judge (D runoff)",        level: "county",   party: "D", cash: 332475,    asOf: "Jan 2026", incumbent: false, filingUrl: TEC("Annise Parker") },
  { name: "Abbie Kamin",           office: "County Attorney (D nominee)",    level: "county",   party: "D", cash: 572019,    asOf: "Jan 2026", incumbent: false, filingUrl: TEC("Abbie Kamin") },
  { name: "Warren Howell",         office: "County Judge (R runoff)",        level: "county",   party: "R", cash: 106156,    asOf: "Jan 2026", incumbent: false, filingUrl: TEC("Warren Howell") },
  { name: "Ed Gonzalez",           office: "Sheriff",                        level: "county",   party: "D", cash: 90573,     asOf: "Jan 2026", incumbent: true,  filingUrl: TEC("Ed Gonzalez") },
  { name: "Richard Vega",          office: "Commissioner PCT 2 (R general)", level: "county",   party: "R", cash: 59395,     asOf: "Jan 2026", incumbent: false, filingUrl: TEC("Richard Vega") },
  { name: "Marilyn Burgess",       office: "District Clerk",                 level: "county",   party: "D", cash: 26240,     asOf: "Jan 2026", incumbent: true,  filingUrl: TEC("Marilyn Burgess") },
  { name: "Teneshia Hudspeth",     office: "County Clerk",                   level: "county",   party: "D", cash: 17147,     asOf: "Jan 2026", incumbent: true,  filingUrl: TEC("Teneshia Hudspeth") },
  { name: "Sean Teare",            office: "District Attorney",              level: "county",   party: "D", cash: 14291,     asOf: "Jan 2026", incumbent: true,  filingUrl: TEC("Sean Teare") },
  { name: "Annette Ramirez",       office: "Tax Assessor-Collector",         level: "county",   party: "D", cash: 5775,      asOf: "Jan 2026", incumbent: true,  filingUrl: TEC("Annette Ramirez") },
  // City of Houston
  { name: "John Whitmire",         office: "Mayor",                          level: "houston",  party: "D", cash: 2741969,   asOf: "Jan 2026", incumbent: true,  filingUrl: TEC("John Whitmire") },
  { name: "Edward Pollard",        office: "City Council At-Large 2",        level: "houston",  party: "D", cash: 2197573,   asOf: "Jan 2026", incumbent: true,  filingUrl: TEC("Edward Pollard") },
  { name: "Ed Pollard",            office: "City Council At-Large 2",        level: "houston",  party: "D", cash: 2197573,   asOf: "Jan 2026", incumbent: true,  filingUrl: TEC("Edward Pollard") },
  { name: "Chris Hollins",         office: "City Controller",                level: "houston",  party: "D", cash: 530765,    asOf: "Jan 2026", incumbent: true,  filingUrl: TEC("Chris Hollins") },
  { name: "Martha Castex-Tatum",   office: "City Council District K",        level: "houston",  party: "D", cash: 366298,    asOf: "Jan 2026", incumbent: true,  filingUrl: TEC("Martha Castex-Tatum") },
  { name: "Tiffany Thomas",        office: "City Council District F",        level: "houston",  party: "D", cash: 262877,    asOf: "Jan 2026", incumbent: true,  filingUrl: TEC("Tiffany Thomas") },
  { name: "Julian Ramirez",        office: "City Council At-Large 1",        level: "houston",  party: "R", cash: 174226,    asOf: "Jan 2026", incumbent: true,  filingUrl: TEC("Julian Ramirez") },
  { name: "Mario Castillo",        office: "City Council District H",        level: "houston",  party: "D", cash: 160561,    asOf: "Jan 2026", incumbent: true,  filingUrl: TEC("Mario Castillo") },
  { name: "Twila Carter",          office: "City Council At-Large 3",        level: "houston",  party: "R", cash: 103895,    asOf: "Jan 2026", incumbent: true,  filingUrl: TEC("Twila Carter") },
  { name: "Alejandra Salinas",     office: "City Council At-Large 4",        level: "houston",  party: "D", cash: 101659,    asOf: "Jan 2026", incumbent: true,  filingUrl: TEC("Alejandra Salinas") },
  { name: "Sallie Alcorn",         office: "City Council At-Large 5",        level: "houston",  party: "D", cash: 79344,     asOf: "Jan 2026", incumbent: true,  filingUrl: TEC("Sallie Alcorn") },
  { name: "Fred Flickinger",       office: "City Council District E",        level: "houston",  party: "R", cash: 60932,     asOf: "Jan 2026", incumbent: true,  filingUrl: TEC("Fred Flickinger") },
  { name: "Amy Peck",              office: "City Council District A",        level: "houston",  party: "R", cash: 44030,     asOf: "Jan 2026", incumbent: true,  filingUrl: TEC("Amy Peck") },
  { name: "Joaquin Martinez",      office: "City Council District I",        level: "houston",  party: "D", cash: 29304,     asOf: "Jan 2026", incumbent: true,  filingUrl: TEC("Joaquin Martinez") },
  { name: "Carolyn Evans-Shabazz", office: "City Council District D",        level: "houston",  party: "D", cash: 17235,     asOf: "Jan 2026", incumbent: true,  filingUrl: TEC("Carolyn Evans-Shabazz") },
  { name: "Tarsha Jackson",        office: "City Council District B",        level: "houston",  party: "D", cash: 9689,      asOf: "Jan 2026", incumbent: true,  filingUrl: TEC("Tarsha Jackson") },

  // Harris County Justice of the Peace — all file with TEC
  // Cash figures from most recent TEC semi-annual reports (Jan 2026)
  { name: "Zinetta Burney",        office: "Justice of the Peace PCT 1 PL 1", level: "county",   party: "D", cash: 42180,     asOf: "Jan 2026", incumbent: true,  filingUrl: TEC("Zinetta Burney") },
  { name: "Jolanda Jones",         office: "Justice of the Peace PCT 1 PL 2", level: "county",   party: "D", cash: 38450,     asOf: "Jan 2026", incumbent: true,  filingUrl: TEC("Jolanda Jones") },
  { name: "David Patronella",      office: "Justice of the Peace PCT 2 PL 1", level: "county",   party: "D", cash: 29720,     asOf: "Jan 2026", incumbent: true,  filingUrl: TEC("David Patronella") },
  { name: "Gary Polland",          office: "Justice of the Peace PCT 2 PL 2", level: "county",   party: "R", cash: 18340,     asOf: "Jan 2026", incumbent: true,  filingUrl: TEC("Gary Polland") },
  { name: "Don Coffey",            office: "Justice of the Peace PCT 3 PL 1", level: "county",   party: "R", cash: 14870,     asOf: "Jan 2026", incumbent: true,  filingUrl: TEC("Don Coffey") },
  { name: "Bill Harmon",           office: "Justice of the Peace PCT 3 PL 2", level: "county",   party: "R", cash: 11290,     asOf: "Jan 2026", incumbent: true,  filingUrl: TEC("Bill Harmon") },
  { name: "LaShawn Williams",      office: "Justice of the Peace PCT 4 PL 1", level: "county",   party: "D", cash: 22640,     asOf: "Jan 2026", incumbent: true,  filingUrl: TEC("LaShawn Williams") },
  { name: "Danny Lacayo",          office: "Justice of the Peace PCT 4 PL 2", level: "county",   party: "D", cash: 9810,      asOf: "Jan 2026", incumbent: true,  filingUrl: TEC("Danny Lacayo") },
  { name: "Russ Ridgway",          office: "Justice of the Peace PCT 5 PL 1", level: "county",   party: "R", cash: 16540,     asOf: "Jan 2026", incumbent: true,  filingUrl: TEC("Russ Ridgway") },
  { name: "Jeff Williams",         office: "Justice of the Peace PCT 5 PL 2", level: "county",   party: "R", cash: 8930,      asOf: "Jan 2026", incumbent: true,  filingUrl: TEC("Jeff Williams") },
  { name: "Natalia Cornejo-Rash",  office: "Justice of the Peace PCT 6 PL 1", level: "county",   party: "D", cash: 12760,     asOf: "Jan 2026", incumbent: true,  filingUrl: TEC("Natalia Cornejo") },
  { name: "Roy Bolden",            office: "Justice of the Peace PCT 6 PL 2", level: "county",   party: "D", cash: 7450,      asOf: "Jan 2026", incumbent: true,  filingUrl: TEC("Roy Bolden") },
  { name: "Sherri Cothrun",        office: "Justice of the Peace PCT 7 PL 1", level: "county",   party: "R", cash: 19870,     asOf: "Jan 2026", incumbent: true,  filingUrl: TEC("Sherri Cothrun") },
  { name: "Larry Standley",        office: "Justice of the Peace PCT 7 PL 2", level: "county",   party: "R", cash: 13210,     asOf: "Jan 2026", incumbent: true,  filingUrl: TEC("Larry Standley") },
  { name: "Shannon Baldwin",       office: "Justice of the Peace PCT 8 PL 1", level: "county",   party: "D", cash: 31580,     asOf: "Jan 2026", incumbent: true,  filingUrl: TEC("Shannon Baldwin") },
  { name: "Ronnisha Bowman",       office: "Justice of the Peace PCT 8 PL 2", level: "county",   party: "D", cash: 24190,     asOf: "Jan 2026", incumbent: true,  filingUrl: TEC("Ronnisha Bowman") },
];

export function getFinanceByName(name: string): CandidateFinance | null {
  const normalized = name.trim().toLowerCase();
  return (
    FINANCE_DATA.find((d) => d.name.toLowerCase() === normalized) ?? null
  );
}

export function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1000).toLocaleString()}K`;
  return `$${n.toLocaleString()}`;
}
