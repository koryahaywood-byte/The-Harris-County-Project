export interface CandidateFinance {
  name: string;
  office: string;
  level: "federal" | "state" | "houston" | "county";
  party: "D" | "R";
  cash: number;
  raised?: number;
  spent?: number;
  asOf: string;
  incumbent?: boolean;
}

export const FINANCE_DATA: CandidateFinance[] = [
  // Federal
  { name: "James Talarico",        office: "U.S. Senate (D nominee)",       level: "federal",  party: "D", cash: 9858865,   raised: 27000000, spent: 17141135, asOf: "Apr 2026", incumbent: false },
  { name: "John Cornyn",           office: "U.S. Senate (R runoff)",         level: "federal",  party: "R", cash: 8200000,   raised: 9000000,  spent: 15800000, asOf: "Apr 2026", incumbent: true  },
  { name: "Ken Paxton",            office: "U.S. Senate (R runoff)",         level: "federal",  party: "R", cash: 2600000,   raised: 2200000,  spent: 3200000,  asOf: "Apr 2026", incumbent: false },
  { name: "Lizzie Fletcher",       office: "U.S. Rep CD-07",                 level: "federal",  party: "D", cash: 1750893,   asOf: "Apr 2026", incumbent: true  },
  { name: "Shaun Finnie",          office: "U.S. Rep CD-02 (D nominee)",     level: "federal",  party: "D", cash: 1543080,   asOf: "Apr 2026", incumbent: false },
  { name: "Al Green",              office: "U.S. Rep CD-18 (runoff)",        level: "federal",  party: "D", cash: 264570,    asOf: "Apr 2026", incumbent: true  },
  { name: "Christian Menefee",     office: "U.S. Rep CD-18 (runoff)",        level: "federal",  party: "D", cash: 255858,    asOf: "Apr 2026", incumbent: false },
  { name: "Sylvia Garcia",         office: "U.S. Rep CD-29",                 level: "federal",  party: "D", cash: 175662,    asOf: "Apr 2026", incumbent: true  },
  // State
  { name: "Greg Abbott",           office: "Governor",                        level: "state",    party: "R", cash: 105700000, raised: 22700000, asOf: "Jan 2026", incumbent: true  },
  { name: "Carol Alvarado",        office: "State Senator SD-6",             level: "state",    party: "D", cash: 1564381,   asOf: "Jan 2025", incumbent: true  },
  { name: "Senfronia Thompson",    office: "State Rep HD-141",               level: "state",    party: "D", cash: 1032927,   asOf: "Jan 2025", incumbent: true  },
  { name: "Gina Hinojosa",         office: "Governor (D nominee)",            level: "state",    party: "D", cash: 1000000,   raised: 1300000, spent: 300000,   asOf: "Jan 2026 est.", incumbent: false },
  { name: "Ann Johnson",           office: "State Rep HD-134",               level: "state",    party: "D", cash: 527021,    asOf: "Jan 2025", incumbent: true  },
  { name: "Ana Hernandez",         office: "State Rep HD-143",               level: "state",    party: "D", cash: 448309,    asOf: "Jan 2025", incumbent: true  },
  { name: "Armando Walle",         office: "State Rep HD-140",               level: "state",    party: "D", cash: 267898,    asOf: "Jan 2025", incumbent: true  },
  { name: "Mary Ann Perez",        office: "State Rep HD-144",               level: "state",    party: "D", cash: 211703,    asOf: "Jan 2025", incumbent: true  },
  { name: "Molly Cook",            office: "State Senator SD-15",            level: "state",    party: "D", cash: 155853,    asOf: "Jan 2025", incumbent: true  },
  // County
  { name: "Rodney Ellis",          office: "Commissioner PCT 1",             level: "county",   party: "D", cash: 7783681,   asOf: "Jan 2026", incumbent: true  },
  { name: "Lesley Briones",        office: "Commissioner PCT 4",             level: "county",   party: "D", cash: 4058292,   asOf: "Jan 2026", incumbent: true  },
  { name: "Adrian Garcia",         office: "Commissioner PCT 2",             level: "county",   party: "D", cash: 2544776,   asOf: "Jan 2026", incumbent: true  },
  { name: "Tom Ramsey",            office: "Commissioner PCT 3",             level: "county",   party: "R", cash: 2032612,   asOf: "Jan 2026", incumbent: true  },
  { name: "Lina Hidalgo",          office: "County Judge",                   level: "county",   party: "D", cash: 344873,    asOf: "Jan 2026", incumbent: true  },
  { name: "Annise Parker",         office: "County Judge (D runoff)",        level: "county",   party: "D", cash: 332475,    asOf: "Jan 2026", incumbent: false },
  { name: "Abbie Kamin",           office: "County Attorney (D nominee)",    level: "county",   party: "D", cash: 572019,    asOf: "Jan 2026", incumbent: false },
  { name: "Warren Howell",         office: "County Judge (R runoff)",        level: "county",   party: "R", cash: 106156,    asOf: "Jan 2026", incumbent: false },
  { name: "Ed Gonzalez",           office: "Sheriff",                        level: "county",   party: "D", cash: 90573,     asOf: "Jan 2026", incumbent: true  },
  { name: "Richard Vega",          office: "Commissioner PCT 2 (R general)", level: "county",   party: "R", cash: 59395,     asOf: "Jan 2026", incumbent: false },
  { name: "Marilyn Burgess",       office: "District Clerk",                 level: "county",   party: "D", cash: 26240,     asOf: "Jan 2026", incumbent: true  },
  { name: "Teneshia Hudspeth",     office: "County Clerk",                   level: "county",   party: "D", cash: 17147,     asOf: "Jan 2026", incumbent: true  },
  { name: "Sean Teare",            office: "District Attorney",              level: "county",   party: "D", cash: 14291,     asOf: "Jan 2026", incumbent: true  },
  { name: "Annette Ramirez",       office: "Tax Assessor-Collector",         level: "county",   party: "D", cash: 5775,      asOf: "Jan 2026", incumbent: true  },
  // City of Houston
  { name: "John Whitmire",         office: "Mayor",                          level: "houston",  party: "D", cash: 2741969,   asOf: "Jan 2026", incumbent: true  },
  { name: "Edward Pollard",        office: "City Council At-Large 2",        level: "houston",  party: "D", cash: 2197573,   asOf: "Jan 2026", incumbent: true  },
  { name: "Ed Pollard",            office: "City Council At-Large 2",        level: "houston",  party: "D", cash: 2197573,   asOf: "Jan 2026", incumbent: true  },
  { name: "Chris Hollins",         office: "City Controller",                level: "houston",  party: "D", cash: 530765,    asOf: "Jan 2026", incumbent: true  },
  { name: "Martha Castex-Tatum",   office: "City Council District K",        level: "houston",  party: "D", cash: 366298,    asOf: "Jan 2026", incumbent: true  },
  { name: "Tiffany Thomas",        office: "City Council District F",        level: "houston",  party: "D", cash: 262877,    asOf: "Jan 2026", incumbent: true  },
  { name: "Julian Ramirez",        office: "City Council At-Large 1",        level: "houston",  party: "R", cash: 174226,    asOf: "Jan 2026", incumbent: true  },
  { name: "Mario Castillo",        office: "City Council District H",        level: "houston",  party: "D", cash: 160561,    asOf: "Jan 2026", incumbent: true  },
  { name: "Twila Carter",          office: "City Council At-Large 3",        level: "houston",  party: "R", cash: 103895,    asOf: "Jan 2026", incumbent: true  },
  { name: "Alejandra Salinas",     office: "City Council At-Large 4",        level: "houston",  party: "D", cash: 101659,    asOf: "Jan 2026", incumbent: true  },
  { name: "Sallie Alcorn",         office: "City Council At-Large 5",        level: "houston",  party: "D", cash: 79344,     asOf: "Jan 2026", incumbent: true  },
  { name: "Fred Flickinger",       office: "City Council District E",        level: "houston",  party: "R", cash: 60932,     asOf: "Jan 2026", incumbent: true  },
  { name: "Amy Peck",              office: "City Council District A",        level: "houston",  party: "R", cash: 44030,     asOf: "Jan 2026", incumbent: true  },
  { name: "Joaquin Martinez",      office: "City Council District I",        level: "houston",  party: "D", cash: 29304,     asOf: "Jan 2026", incumbent: true  },
  { name: "Carolyn Evans-Shabazz", office: "City Council District D",        level: "houston",  party: "D", cash: 17235,     asOf: "Jan 2026", incumbent: true  },
  { name: "Tarsha Jackson",        office: "City Council District B",        level: "houston",  party: "D", cash: 9689,      asOf: "Jan 2026", incumbent: true  },
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
