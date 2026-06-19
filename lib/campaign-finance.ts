import generatedRaw from "./campaign-finance-generated.json";

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
  { name: "Jasmine Crockett",      office: "U.S. Senate (D nominee)",        level: "federal",  party: "D", cash: 3800000,   raised: 5200000,  spent: 1400000,  asOf: "Mar 2026 est.", incumbent: false, filingUrl: "https://www.fec.gov/data/candidate/S6TX00338/" },
  { name: "John Cornyn",           office: "U.S. Senator (lost R runoff — term ends Jan 2027)", level: "federal", party: "R", cash: 8200000, raised: 9000000, spent: 15800000, asOf: "Apr 2026", incumbent: true, filingUrl: FEC("S0TX00999") },
  { name: "Ken Paxton",            office: "U.S. Senate (R nominee)",        level: "federal",  party: "R", cash: 2600000,   raised: 2200000,  spent: 3200000,  asOf: "Apr 2026", incumbent: false, filingUrl: FEC("S4TX00462") },
  { name: "Lizzie Fletcher",       office: "U.S. Rep CD-07",                 level: "federal",  party: "D", cash: 1750893,   asOf: "Apr 2026", incumbent: true,  filingUrl: FEC("H8TX07139") },
  { name: "Shaun Finnie",          office: "U.S. Rep CD-02 (D nominee)",     level: "federal",  party: "D", cash: 1543080,   asOf: "Apr 2026", incumbent: false, filingUrl: FEC("H4TX02177") },
  { name: "Al Green",              office: "CD-18 (lost D runoff — ran for CD-9 in 2024)", level: "federal",  party: "D", cash: 264570,    asOf: "Apr 2026", incumbent: false, filingUrl: FEC("H4TX09090") },
  { name: "Christian Menefee",     office: "U.S. Rep CD-18",                 level: "federal",  party: "D", cash: 255858,    asOf: "Apr 2026", incumbent: true,  filingUrl: FEC("H4TX18126") },
  { name: "Sylvia Garcia",         office: "U.S. Rep CD-29",                 level: "federal",  party: "D", cash: 175662,    asOf: "Apr 2026", incumbent: true,  filingUrl: FEC("H8TX29049") },
  // State
  { name: "Greg Abbott",           office: "Governor",                        level: "state",    party: "R", cash: 105700000, raised: 22700000, asOf: "Jan 2026", incumbent: true,  filingUrl: TEC("Greg Abbott") },
  { name: "Dan Patrick",          office: "Lt. Governor",                    level: "state",    party: "R", cash: 0,          asOf: "pending",  incumbent: true,  filingUrl: TEC("Dan Patrick") },
  { name: "Glenn Hegar",          office: "Comptroller",                     level: "state",    party: "R", cash: 0,          asOf: "pending",  incumbent: true,  filingUrl: TEC("Glenn Hegar") },
  { name: "Mayes Middleton",      office: "Attorney General (R nominee)",    level: "state",    party: "R", cash: 0,          asOf: "pending",  incumbent: false, filingUrl: TEC("Mayes Middleton") },
  { name: "Brandon Creighton",     office: "State Senator SD-4",             level: "state",    party: "R", cash: 0,          asOf: "pending",  incumbent: true,  filingUrl: TEC("Brandon Creighton") },
  { name: "Carol Alvarado",        office: "State Senator SD-6",             level: "state",    party: "D", cash: 1564381,   asOf: "Jan 2025", incumbent: true,  filingUrl: TEC("Carol Alvarado") },
  { name: "Borris Miles",          office: "State Senator SD-13",            level: "state",    party: "D", cash: 0,          asOf: "pending",  incumbent: true,  filingUrl: TEC("Borris Miles") },
  { name: "Joan Huffman",          office: "State Senator SD-17",            level: "state",    party: "R", cash: 0,          asOf: "pending",  incumbent: true,  filingUrl: TEC("Joan Huffman") },
  { name: "Lois Kolkhorst",        office: "State Senator SD-18",            level: "state",    party: "R", cash: 0,          asOf: "pending",  incumbent: true,  filingUrl: TEC("Lois Kolkhorst") },
  { name: "Senfronia Thompson",    office: "State Rep HD-141",               level: "state",    party: "D", cash: 1032927,   asOf: "Jan 2025", incumbent: true,  filingUrl: TEC("Senfronia Thompson") },
  { name: "Gina Hinojosa",         office: "Governor (D nominee)",            level: "state",    party: "D", cash: 1000000,   raised: 1300000, spent: 300000,   asOf: "Jan 2026 est.", incumbent: false, filingUrl: TEC("Gina Hinojosa") },
  { name: "Ann Johnson",           office: "State Rep HD-134",               level: "state",    party: "D", cash: 527021,    asOf: "Jan 2025", incumbent: true,  filingUrl: TEC("Ann Johnson") },
  { name: "Ana Hernandez",         office: "State Rep HD-143",               level: "state",    party: "D", cash: 448309,    asOf: "Jan 2025", incumbent: true,  filingUrl: TEC("Ana Hernandez") },
  { name: "Armando Walle",         office: "State Rep HD-140",               level: "state",    party: "D", cash: 267898,    asOf: "Jan 2025", incumbent: true,  filingUrl: TEC("Armando Walle") },
  { name: "Mary Ann Perez",        office: "State Rep HD-144",               level: "state",    party: "D", cash: 211703,    asOf: "Jan 2025", incumbent: true,  filingUrl: TEC("Mary Ann Perez") },
  { name: "Molly Cook",            office: "State Senator SD-15",            level: "state",    party: "D", cash: 155853,    asOf: "Jan 2025", incumbent: true,  filingUrl: TEC("Molly Cook") },
  { name: "Josh Flynn",            office: "State Rep HD-127",               level: "state",    party: "R", cash: 0,          asOf: "pending",  incumbent: true,  filingUrl: TEC("Josh Flynn") },
  { name: "Briscoe Cain",         office: "State Rep HD-128 (ran for CD-9)", level: "state",   party: "R", cash: 0,          asOf: "pending",  incumbent: true,  filingUrl: TEC("Briscoe Cain") },
  { name: "Mano DeAyala",         office: "State Rep HD-133",               level: "state",    party: "R", cash: 0,          asOf: "pending",  incumbent: true,  filingUrl: TEC("Mano DeAyala") },
  { name: "Valoree Swanson",      office: "State Rep HD-150",               level: "state",    party: "R", cash: 0,          asOf: "pending",  incumbent: true,  filingUrl: TEC("Valoree Swanson") },
  { name: "A'Yonna Kellum",       office: "State Rep HD-150 (D nominee)",   level: "state",    party: "D", cash: 0,          asOf: "pending",  incumbent: false, filingUrl: TEC("A'Yonna Kellum") },
  { name: "Darlene Breaux",        office: "State Rep HD-149 (D nominee)",   level: "state",    party: "D", cash: 0,         asOf: "pending",  incumbent: false, filingUrl: TEC("Darlene Breaux") },
  { name: "Shannon Dicely",        office: "State Senator SD-11 (D nominee)", level: "state",   party: "D", cash: 0,         asOf: "pending",  incumbent: false, filingUrl: TEC("Shannon Dicely") },
  { name: "Stefanie Bord",         office: "State Rep HD-126 (D nominee)",   level: "state",    party: "D", cash: 0,         asOf: "pending",  incumbent: false, filingUrl: TEC("Stefanie Bord") },
  { name: "Stan Stanart",          office: "State Rep HD-126 (R nominee)",   level: "state",    party: "R", cash: 0,         asOf: "pending",  incumbent: false, filingUrl: TEC("Stan Stanart") },
  { name: "Staci Childs",          office: "State Rep HD-131 (D nominee)",   level: "state",    party: "D", cash: 0,         asOf: "pending",  incumbent: false, filingUrl: TEC("Staci Childs") },
  // Federal 2026 nominees not yet in FEC system
  { name: "Alexander Hale",        office: "U.S. Rep CD-07 (R nominee)",     level: "federal",  party: "R", cash: 0,         asOf: "pending",  incumbent: false },
  { name: "Leticia Gutierrez",     office: "U.S. Rep CD-09 (D nominee)",     level: "federal",  party: "D", cash: 0,         asOf: "pending",  incumbent: false },
  { name: "Alex Mealer",           office: "U.S. Rep CD-09 (R nominee)",     level: "federal",  party: "R", cash: 0,         asOf: "pending",  incumbent: false },
  { name: "Melissa McDonough",     office: "U.S. Rep CD-38 (D nominee)",     level: "federal",  party: "D", cash: 0,         asOf: "pending",  incumbent: false },
  { name: "Jon Bonck",             office: "U.S. Rep CD-38 (R nominee)",     level: "federal",  party: "R", cash: 0,         asOf: "pending",  incumbent: false },
  // County
  { name: "Rodney Ellis",          office: "Commissioner PCT 1",             level: "county",   party: "D", cash: 7783681,   asOf: "Jan 2026", incumbent: true,  filingUrl: TEC("Rodney Ellis") },
  { name: "Lesley Briones",        office: "Commissioner PCT 4",             level: "county",   party: "D", cash: 4058292,   asOf: "Jan 2026", incumbent: true,  filingUrl: TEC("Lesley Briones") },
  { name: "Adrian Garcia",         office: "Commissioner PCT 2",             level: "county",   party: "D", cash: 2544776,   asOf: "Jan 2026", incumbent: true,  filingUrl: TEC("Adrian Garcia") },
  { name: "Tom Ramsey",            office: "Commissioner PCT 3",             level: "county",   party: "R", cash: 2032612,   asOf: "Jan 2026", incumbent: true,  filingUrl: TEC("Tom Ramsey") },
  { name: "Letitia Plummer",       office: "County Judge (D nominee)",       level: "county",   party: "D", cash: 420000,    asOf: "May 2026 est.", incumbent: false, filingUrl: TEC("Letitia Plummer") },
  { name: "Orlando Sanchez",       office: "County Judge (R nominee)",       level: "county",   party: "R", cash: 890000,    asOf: "May 2026 est.", incumbent: false, filingUrl: TEC("Orlando Sanchez") },
  { name: "Lina Hidalgo",          office: "County Judge (lame duck, not seeking reelection)", level: "county", party: "D", cash: 344873, asOf: "Jan 2026", incumbent: true, filingUrl: TEC("Lina Hidalgo") },
  { name: "Annise Parker",         office: "County Judge (lost D runoff)",   level: "county",   party: "D", cash: 332475,    asOf: "Jan 2026", incumbent: false, filingUrl: TEC("Annise Parker") },
  { name: "Abbie Kamin",           office: "County Attorney (D nominee)",    level: "county",   party: "D", cash: 572019,    asOf: "Jan 2026", incumbent: false, filingUrl: TEC("Abbie Kamin") },
  { name: "Warren Howell",         office: "County Judge (lost R runoff)",   level: "county",   party: "R", cash: 106156,    asOf: "Jan 2026", incumbent: false, filingUrl: TEC("Warren Howell") },
  { name: "Ed Gonzalez",           office: "Sheriff",                        level: "county",   party: "D", cash: 90573,     asOf: "Jan 2026", incumbent: true,  filingUrl: TEC("Ed Gonzalez") },
  { name: "Richard Vega",          office: "Commissioner PCT 2 (R general)", level: "county",   party: "R", cash: 59395,     asOf: "Jan 2026", incumbent: false, filingUrl: TEC("Richard Vega") },
  { name: "Marilyn Burgess",       office: "District Clerk",                 level: "county",   party: "D", cash: 26240,     asOf: "Jan 2026", incumbent: true,  filingUrl: TEC("Marilyn Burgess") },
  { name: "Teneshia Hudspeth",     office: "County Clerk",                   level: "county",   party: "D", cash: 17147,     asOf: "Jan 2026", incumbent: true,  filingUrl: TEC("Teneshia Hudspeth") },
  { name: "Sean Teare",            office: "District Attorney",              level: "county",   party: "D", cash: 14291,     asOf: "Jan 2026", incumbent: true,  filingUrl: TEC("Sean Teare") },
  { name: "Annette Ramirez",       office: "Tax Assessor-Collector",         level: "county",   party: "D", cash: 5775,      asOf: "Jan 2026", incumbent: true,  filingUrl: TEC("Annette Ramirez") },
  { name: "Carla Wyatt",           office: "County Treasurer",               level: "county",   party: "D", cash: 0,         asOf: "pending",  incumbent: true,  filingUrl: TEC("Carla Wyatt") },
  // Constables — file at ethics.harrisvotes.com
  { name: "Alan Rosen",            office: "Constable PCT 1",                level: "county",   party: "D", cash: 0,         asOf: "pending",  incumbent: true,  filingUrl: "https://ethics.harrisvotes.com/CampaignFinanceReports/COR.aspx" },
  { name: "Jerry Garcia",          office: "Constable PCT 2",                level: "county",   party: "D", cash: 0,         asOf: "pending",  incumbent: true,  filingUrl: "https://ethics.harrisvotes.com/CampaignFinanceReports/COR.aspx" },
  { name: "Sherman Eagleton",      office: "Constable PCT 3",                level: "county",   party: "D", cash: 0,         asOf: "pending",  incumbent: true,  filingUrl: "https://ethics.harrisvotes.com/CampaignFinanceReports/COR.aspx" },
  { name: "Mark Herman",           office: "Constable PCT 4",                level: "county",   party: "R", cash: 0,         asOf: "pending",  incumbent: true,  filingUrl: "https://ethics.harrisvotes.com/CampaignFinanceReports/COR.aspx" },
  { name: "Terry Allbritton",      office: "Constable PCT 5",                level: "county",   party: "R", cash: 0,         asOf: "pending",  incumbent: true,  filingUrl: "https://ethics.harrisvotes.com/CampaignFinanceReports/COR.aspx" },
  { name: "Silvia Trevino",        office: "Constable PCT 6",                level: "county",   party: "D", cash: 0,         asOf: "pending",  incumbent: true,  filingUrl: "https://ethics.harrisvotes.com/CampaignFinanceReports/COR.aspx" },
  { name: "James Phillips",        office: "Constable PCT 7",                level: "county",   party: "D", cash: 0,         asOf: "pending",  incumbent: true,  filingUrl: "https://ethics.harrisvotes.com/CampaignFinanceReports/COR.aspx" },
  { name: "Phil Sandlin",          office: "Constable PCT 8",                level: "county",   party: "R", cash: 0,         asOf: "pending",  incumbent: true,  filingUrl: "https://ethics.harrisvotes.com/CampaignFinanceReports/COR.aspx" },
  // City of Houston
  { name: "John Whitmire",         office: "Mayor",                          level: "houston",  party: "D", cash: 2741969,   asOf: "Jan 2026", incumbent: true,  filingUrl: TEC("John Whitmire") },
  { name: "Edward Pollard",        office: "City Council District J",        level: "houston",  party: "D", cash: 2197573,   asOf: "Jan 2026", incumbent: true,  filingUrl: TEC("Edward Pollard") },
  { name: "Willie Davis",          office: "City Council At-Large 2",        level: "houston",  party: "D", cash: 0,         asOf: "pending",  incumbent: true,  filingUrl: TEC("Willie Davis") },
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
  { name: "Joe Panzarella",        office: "City Council District C",        level: "houston",  party: "R", cash: 0,         asOf: "pending",  incumbent: true,  filingUrl: TEC("Joe Panzarella") },
  { name: "Mary Nan Huffman",      office: "City Council District G",        level: "houston",  party: "R", cash: 0,         asOf: "pending",  incumbent: true,  filingUrl: TEC("Mary Nan Huffman") },

  // Harris County Justice of the Peace — file at ethics.harrisvotes.com (same as commissioners)
  // Names verified from jp.hctx.net; cash populated by live HC scrape (page 4 of CFR PDF)
  { name: "Eric William Carter",   office: "Justice of the Peace PCT 1 PL 1", level: "county",   party: "R", cash: 0, asOf: "pending", incumbent: true,  filingUrl: "https://ethics.harrisvotes.com/CampaignFinanceReports/COR.aspx" },
  { name: "Steve Duble",           office: "Justice of the Peace PCT 1 PL 2", level: "county",   party: "R", cash: 0, asOf: "pending", incumbent: true,  filingUrl: "https://ethics.harrisvotes.com/CampaignFinanceReports/COR.aspx" },
  { name: "Jo Ann Delgado",        office: "Justice of the Peace PCT 2 PL 1", level: "county",   party: "D", cash: 0, asOf: "pending", incumbent: true,  filingUrl: "https://ethics.harrisvotes.com/CampaignFinanceReports/COR.aspx" },
  { name: "Dolores Lozano",        office: "Justice of the Peace PCT 2 PL 2", level: "county",   party: "D", cash: 0, asOf: "pending", incumbent: true,  filingUrl: "https://ethics.harrisvotes.com/CampaignFinanceReports/COR.aspx" },
  { name: "Joe Stephens",          office: "Justice of the Peace PCT 3 PL 1", level: "county",   party: "R", cash: 28399, raised: 23975, spent: 14017, asOf: "Jan 2026", incumbent: true,  filingUrl: "https://ethics.harrisvotes.com/CampaignFinanceReports/COR.aspx" },
  { name: "Lucia Bates",           office: "Justice of the Peace PCT 3 PL 2", level: "county",   party: "R", cash: 0, asOf: "pending", incumbent: true,  filingUrl: "https://ethics.harrisvotes.com/CampaignFinanceReports/COR.aspx" },
  { name: "Lincoln Goodwin",       office: "Justice of the Peace PCT 4 PL 1", level: "county",   party: "D", cash: 0, asOf: "pending", incumbent: true,  filingUrl: "https://ethics.harrisvotes.com/CampaignFinanceReports/COR.aspx" },
  { name: "Laryssa Korduba",       office: "Justice of the Peace PCT 4 PL 2", level: "county",   party: "D", cash: 0, asOf: "pending", incumbent: true,  filingUrl: "https://ethics.harrisvotes.com/CampaignFinanceReports/COR.aspx" },
  { name: "James Lombardino",      office: "Justice of the Peace PCT 5 PL 1", level: "county",   party: "R", cash: 0, asOf: "pending", incumbent: true,  filingUrl: "https://ethics.harrisvotes.com/CampaignFinanceReports/COR.aspx" },
  { name: "Bob Wolfe",             office: "JP PCT 5 PL 2 (current; lost R primary to Mark Fury)", level: "county", party: "R", cash: 0, asOf: "pending", incumbent: true,  filingUrl: "https://ethics.harrisvotes.com/CampaignFinanceReports/COR.aspx" },
  { name: "Mark Fury",             office: "Justice of the Peace PCT 5 PL 2 (R nominee)",    level: "county", party: "R", cash: 0, asOf: "pending", incumbent: false, filingUrl: "https://ethics.harrisvotes.com/CampaignFinanceReports/COR.aspx" },
  { name: "Lisa Jefferson",        office: "Justice of the Peace PCT 5 PL 2 (D nominee)",    level: "county", party: "D", cash: 0, asOf: "pending", incumbent: false, filingUrl: "https://ethics.harrisvotes.com/CampaignFinanceReports/COR.aspx" },
  { name: "Victor Treviño III",    office: "Justice of the Peace PCT 6 PL 1",                level: "county", party: "D", cash: 0, asOf: "pending", incumbent: true,  filingUrl: "https://ethics.harrisvotes.com/CampaignFinanceReports/COR.aspx" },
  { name: "Angela D. Rodriguez",   office: "Justice of the Peace PCT 6 PL 2", level: "county",   party: "D", cash: 0, asOf: "pending", incumbent: true,  filingUrl: "https://ethics.harrisvotes.com/CampaignFinanceReports/COR.aspx" },
  { name: "Wanda E. Adams",        office: "Justice of the Peace PCT 7 PL 1", level: "county",   party: "D", cash: 0, asOf: "pending", incumbent: true,  filingUrl: "https://ethics.harrisvotes.com/CampaignFinanceReports/COR.aspx" },
  { name: "Sharon M. Burney",      office: "JP PCT 7 PL 2 (lost D runoff to Melanie Miles)", level: "county", party: "D", cash: 0, asOf: "pending", incumbent: false, filingUrl: "https://ethics.harrisvotes.com/CampaignFinanceReports/COR.aspx" },
  { name: "Melanie Miles",         office: "Justice of the Peace PCT 7 PL 2 (D nominee)",    level: "county", party: "D", cash: 0, asOf: "pending", incumbent: false, filingUrl: "https://ethics.harrisvotes.com/CampaignFinanceReports/COR.aspx" },
  { name: "Holly Williamson",      office: "Justice of the Peace PCT 8 PL 1", level: "county",   party: "R", cash: 0, asOf: "pending", incumbent: true,  filingUrl: "https://ethics.harrisvotes.com/CampaignFinanceReports/COR.aspx" },
  { name: "Louie Ditta",           office: "Justice of the Peace PCT 8 PL 2", level: "county",   party: "R", cash: 0, asOf: "pending", incumbent: true,  filingUrl: "https://ethics.harrisvotes.com/CampaignFinanceReports/COR.aspx" },
];

// Merge pipeline-generated data (from `npm run finance-publish`) over the static
// baseline. Generated records only win when they carry a non-zero cash value so
// a failed pipeline run never wipes out good static data.
const generated = (generatedRaw as { candidates?: Array<Partial<CandidateFinance> & { name: string }> }).candidates ?? [];
const generatedByName = new Map(generated.map(r => [r.name.toLowerCase(), r]));

export const FINANCE_DATA_MERGED: CandidateFinance[] = FINANCE_DATA.map(d => {
  const gen = generatedByName.get(d.name.toLowerCase());
  if (!gen || !(gen.cash != null && gen.cash > 0)) return d;
  return {
    ...d,
    cash:   gen.cash   ?? d.cash,
    raised: gen.raised ?? d.raised,
    spent:  gen.spent  ?? d.spent,
    loans:  (gen as { loans?: number }).loans ?? d.loans,
    asOf:   (gen as { asOf?: string }).asOf   ?? d.asOf,
  };
});

export function getFinanceByName(name: string): CandidateFinance | null {
  const normalized = name.trim().toLowerCase();
  return (
    FINANCE_DATA_MERGED.find((d) => d.name.toLowerCase() === normalized) ?? null
  );
}

export function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1000).toLocaleString()}K`;
  return `$${n.toLocaleString()}`;
}
