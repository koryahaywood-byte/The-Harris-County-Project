// County/City FY2027 budget lines and TIRZ zone data for the Public Money tool.
// Extracted from app/tools/public-money/page.tsx so the page stays presentational.

/* ─── County Budget data ──────────────────────────────────────────────────── */
export interface BudgetLine { dept: string; category: string; amount: number; change: number; description: string; employees?: number; note?: string; }

export const COUNTY_BUDGET: BudgetLine[] = [
  { dept: "Sheriff / Law Enforcement",   category: "Public Safety",    amount: 524, change:  4.2, description: "Patrol, detention, court security, and emergency services" },
  { dept: "Debt Service",                category: "Debt",             amount: 298, change:  2.1, description: "Bond principal and interest payments on county debt" },
  { dept: "Road & Bridge",               category: "Infrastructure",   amount: 389, change:  6.8, description: "Roads, bridges, traffic signals, and right-of-way maintenance" },
  { dept: "Flood Control District",      category: "Infrastructure",   amount: 274, change: 12.3, description: "Bayou improvements, detention basins, and drainage projects" },
  { dept: "Public Health Services",      category: "Health",           amount: 238, change:  3.5, description: "Clinics, disease control, environmental health, and emergency prep" },
  { dept: "Juvenile Probation",          category: "Justice",          amount: 112, change:  1.8, description: "Juvenile detention, probation supervision, and rehabilitation" },
  { dept: "Facilities & Infrastructure", category: "Operations",       amount: 128, change:  5.4, description: "County buildings maintenance, utilities, and capital projects" },
  { dept: "Information Technology",      category: "Operations",       amount:  68, change:  8.1, description: "Systems, cybersecurity, digital services, and data infrastructure" },
  { dept: "Indigent Defense",            category: "Justice",          amount:  88, change:  6.2, description: "Public defenders and court-appointed counsel for low-income residents" },
  { dept: "District Clerk",              category: "Administration",   amount:  47, change:  2.0, description: "Court records, civil and criminal case management" },
  { dept: "County Clerk",               category: "Administration",   amount:  41, change:  1.5, description: "Elections, vital records, property deeds, and archives" },
  { dept: "Parks",                       category: "Quality of Life",  amount:  35, change:  3.2, description: "County parks, trails, and recreational facilities" },
  { dept: "Library",                     category: "Quality of Life",  amount:  29, change:  2.8, description: "Harris County Public Library branches and digital resources" },
  { dept: "Human Services",             category: "Health",           amount:  52, change:  4.1, description: "Community assistance, veterans services, and social programs" },
  { dept: "Other / Reserves",           category: "Other",            amount: 617, change:  1.2, description: "General fund reserves, contingencies, and miscellaneous departments" },
];

export const CITY_BUDGET: BudgetLine[] = [
  { dept: "Houston Police Department",   category: "Public Safety",   amount: 1250, change: 19.0, employees: 5400, description: "Patrol, investigations, special operations, and crime prevention", note: "Largest General Fund line item" },
  { dept: "Houston Fire Department",     category: "Public Safety",   amount:  900, change:  3.4, employees: 4100, description: "Fire suppression, emergency medical services, and rescue operations" },
  { dept: "Debt Service",               category: "Debt",            amount: 1140, change:  1.8,               description: "General obligation and revenue bond principal and interest" },
  { dept: "Public Works & Engineering", category: "Infrastructure",  amount:  850, change:  3.7, employees: 1200, description: "Streets, drainage, traffic management, and capital improvements" },
  { dept: "Housing & Community Dev",    category: "Housing",         amount:  300, change:  5.3, employees:  180, description: "Affordable housing, community block grants, and anti-displacement programs" },
  { dept: "Solid Waste Management",     category: "Operations",      amount:  134, change:    0, employees: 1100, description: "Moved to Combined Utility System in FY27", note: "Shifted to utility" },
  { dept: "Parks & Recreation",         category: "Quality of Life", amount:  175, change:  4.2, employees: 1800, description: "Parks, pools, recreation centers, trails, and youth programming" },
  { dept: "General Administration",     category: "Administration",  amount:  220, change:  2.3, employees: 1500, description: "Mayor's Office, City Council, legal, HR, and support services" },
  { dept: "Health & Human Services",    category: "Health",          amount:  155, change:  4.7, employees:  650, description: "Public health clinics, environmental health, and social services" },
  { dept: "Information Technology",     category: "Operations",      amount:  105, change:  7.1, employees:  420, description: "IT infrastructure, cybersecurity, 311, and digital government services" },
  { dept: "Houston Public Library",     category: "Quality of Life", amount:   68, change:  6.3, employees:  850, description: "44 library branches, digital resources, and community programs" },
  { dept: "Planning & Development",     category: "Administration",  amount:   50, change:  4.2, employees:  340, description: "Zoning, permitting, historic preservation, and urban planning" },
  { dept: "Aviation / Airport System", category: "Enterprise",      amount:  620, change:  6.9, employees: 1600, description: "IAH and Hobby airports. Self-funded from revenues" },
  { dept: "Other & Reserves",          category: "Other",           amount:  800, change:  1.2,               description: "Controller, municipal courts, fleet, and contingency reserves" },
];

export const CAT_COLOR: Record<string, string> = {
  "Public Safety":   "#1d4ed8",
  "Debt":            "#6b7280",
  "Infrastructure":  "#0891b2",
  "Health":          "#16a34a",
  "Justice":         "#7c3aed",
  "Operations":      "#92400e",
  "Administration":  "#b45309",
  "Quality of Life": "#0f766e",
  "Housing":         "#15803d",
  "Enterprise":      "#9333ea",
  "Other":           "#9ca3af",
};

/* ─── TIRZ data (condensed) ──────────────────────────────────────────────── */
export interface TIRZ { id: number; name: string; neighborhood: string; created: number; expires: number; totalRevenueM: number; keyProject: string; boardAppointers: string[]; }
export const TIRZ_DATA: TIRZ[] = [
  { id:  1, name: "Main Street/Market Square", neighborhood: "Downtown",         created: 1995, expires: 2030, totalRevenueM: 142, keyProject: "Main Street Square redevelopment",          boardAppointers: ["Mayor", "District H (Mario Castillo)", "District I (Joaquin Martinez)"] },
  { id:  2, name: "Upper Kirby",               neighborhood: "Upper Kirby",      created: 1997, expires: 2032, totalRevenueM:  89, keyProject: "Kirby Drive streetscaping",                  boardAppointers: ["Mayor", "District G (Mary Nan Huffman)", "District C (Joe Panzarella)"] },
  { id:  3, name: "Old Spanish Trail",         neighborhood: "South Houston",    created: 1999, expires: 2034, totalRevenueM:  54, keyProject: "MacGregor Park improvements",                boardAppointers: ["Mayor", "District D (Carolyn Evans-Shabazz)"] },
  { id:  4, name: "Midtown",                   neighborhood: "Midtown",          created: 1999, expires: 2034, totalRevenueM: 198, keyProject: "Baldwin Park and Bagby corridor",            boardAppointers: ["Mayor", "District H (Mario Castillo)", "District D (Carolyn Evans-Shabazz)"] },
  { id:  5, name: "Memorial Heights",          neighborhood: "Memorial Heights", created: 2000, expires: 2035, totalRevenueM:  76, keyProject: "White Oak Bayou hike/bike trail",            boardAppointers: ["Mayor", "District H (Mario Castillo)", "District C (Joe Panzarella)"] },
  { id:  6, name: "Eastside",                  neighborhood: "East End",         created: 2001, expires: 2036, totalRevenueM:  48, keyProject: "Navigation Boulevard improvements",          boardAppointers: ["Mayor", "District I (Joaquin Martinez)"] },
  { id:  7, name: "Old Sixth Ward",            neighborhood: "Sixth Ward",       created: 2001, expires: 2036, totalRevenueM:  32, keyProject: "Victorian streetscaping project",            boardAppointers: ["Mayor", "District C (Joe Panzarella)"] },
  { id:  8, name: "Chinatown",                 neighborhood: "Chinatown",        created: 2003, expires: 2038, totalRevenueM:  58, keyProject: "Bellaire Blvd corridor improvements",        boardAppointers: ["Mayor", "District F (Tiffany Thomas)", "District G (Mary Nan Huffman)"] },
  { id:  9, name: "South Post Oak",            neighborhood: "Westwood",         created: 2003, expires: 2038, totalRevenueM:  44, keyProject: "Community park network",                     boardAppointers: ["Mayor", "District F (Tiffany Thomas)"] },
  { id: 10, name: "Lake Houston",              neighborhood: "Kingwood",         created: 2004, expires: 2039, totalRevenueM:  38, keyProject: "Town center redevelopment",                  boardAppointers: ["Mayor", "District E (Fred Flickinger)"] },
  { id: 14, name: "Fourth Ward",               neighborhood: "Freedmen's Town",  created: 2006, expires: 2041, totalRevenueM:  28, keyProject: "Historic preservation & affordable housing", boardAppointers: ["Mayor", "District H (Mario Castillo)", "District C (Joe Panzarella)"] },
  { id: 17, name: "Memorial City",             neighborhood: "Memorial City",    created: 2007, expires: 2042, totalRevenueM:  92, keyProject: "BRT transit and pedestrian grid",            boardAppointers: ["Mayor", "District G (Mary Nan Huffman)"] },
  { id: 21, name: "Hardy Yards",               neighborhood: "Near Northside",   created: 2012, expires: 2047, totalRevenueM:  22, keyProject: "Hardy mixed-use development",                boardAppointers: ["Mayor", "District H (Mario Castillo)"] },
  { id: 23, name: "Gulfgate/Pine Valley",      neighborhood: "Gulfgate",         created: 2014, expires: 2049, totalRevenueM:  18, keyProject: "Gulfgate center redesign",                   boardAppointers: ["Mayor", "District E (Fred Flickinger)"] },
  { id: 26, name: "Montrose",                  neighborhood: "Montrose",         created: 2017, expires: 2052, totalRevenueM:  34, keyProject: "Westheimer streetscaping phase 1",           boardAppointers: ["Mayor", "District C (Joe Panzarella)"] },
  { id: 27, name: "Houston Healthcare Innovation", neighborhood: "Medical Center", created: 2018, expires: 2053, totalRevenueM: 61, keyProject: "TMC3 campus infrastructure",              boardAppointers: ["Mayor", "District D (Carolyn Evans-Shabazz)", "District K (Martha Castex-Tatum)", "TMC Rep"] },
];
