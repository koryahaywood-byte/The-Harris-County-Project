// Endorsements, consultant relationships, and major-donor data for The Network.
// Extracted from app/tools/the-network/page.tsx so the page stays presentational.

/* ─── Endorsement types & data ────────────────────────────────────────────── */
export type EndorserType = "Union" | "Elected Official" | "Party Org" | "Civic Org" | "Newspaper" | "Business Org";
export interface Endorsement { id: string; endorser: string; endorserType: EndorserType; candidate: string; race: string; year: number; notes?: string; }

export const ENDORSEMENTS: Endorsement[] = [
  { id: "e1",  endorser: "AFL-CIO Texas",              endorserType: "Union",            candidate: "Jasmine Crockett", race: "U.S. Senate 2026 (D Primary)", year: 2026 },
  { id: "e2",  endorser: "Texas AFT",                  endorserType: "Union",            candidate: "Jasmine Crockett", race: "U.S. Senate 2026 (D Primary)", year: 2026 },
  { id: "e3",  endorser: "SEIU Texas",                 endorserType: "Union",            candidate: "Jasmine Crockett", race: "U.S. Senate 2026 (D Primary)", year: 2026 },
  { id: "e4",  endorser: "Houston Chronicle",          endorserType: "Newspaper",        candidate: "Jasmine Crockett", race: "U.S. Senate 2026 (D Primary)", year: 2026 },
  { id: "e5",  endorser: "Sylvia Garcia",              endorserType: "Elected Official", candidate: "Jasmine Crockett", race: "U.S. Senate 2026 (D Primary)", year: 2026 },
  { id: "e6",  endorser: "Al Green",                   endorserType: "Elected Official", candidate: "Jasmine Crockett", race: "U.S. Senate 2026 (D Primary)", year: 2026 },
  { id: "e7",  endorser: "Sheila Jackson Lee Estate",  endorserType: "Elected Official", candidate: "Jasmine Crockett", race: "U.S. Senate 2026 (D Primary)", year: 2026, notes: "Family endorsement" },
  { id: "e9",  endorser: "Harris County Democrats",    endorserType: "Party Org",        candidate: "Jasmine Crockett", race: "U.S. Senate 2026 (D Primary)", year: 2026 },
  { id: "e31", endorser: "Texas Democratic Party",     endorserType: "Party Org",        candidate: "Jasmine Crockett", race: "U.S. Senate 2026 (D Primary)", year: 2026 },
  { id: "e32", endorser: "Texas NAACP",                endorserType: "Civic Org",        candidate: "Jasmine Crockett", race: "U.S. Senate 2026 (D Primary)", year: 2026 },
  { id: "e33", endorser: "Planned Parenthood Action",  endorserType: "Civic Org",        candidate: "Jasmine Crockett", race: "U.S. Senate 2026 (D Primary)", year: 2026 },
  { id: "e34", endorser: "CWA Texas",                  endorserType: "Union",            candidate: "Jasmine Crockett", race: "U.S. Senate 2026 (D Primary)", year: 2026, notes: "Communications Workers of America" },
  { id: "e35", endorser: "Lizzie Fletcher",            endorserType: "Elected Official", candidate: "Jasmine Crockett", race: "U.S. Senate 2026 (D Primary)", year: 2026 },
  { id: "e36", endorser: "Donald Trump",               endorserType: "Elected Official", candidate: "Ken Paxton",       race: "U.S. Senate 2026", year: 2026, notes: "Trump backed Paxton over Cornyn" },
  { id: "e37", endorser: "Texas Republican Party",     endorserType: "Party Org",        candidate: "Ken Paxton",       race: "U.S. Senate 2026", year: 2026 },
  { id: "e38", endorser: "NRA Political Victory Fund", endorserType: "Civic Org",        candidate: "Ken Paxton",       race: "U.S. Senate 2026", year: 2026 },
  { id: "e39", endorser: "Club for Growth",            endorserType: "Civic Org",        candidate: "Ken Paxton",       race: "U.S. Senate 2026", year: 2026 },
  { id: "e40", endorser: "Texas Republican Party",     endorserType: "Party Org",        candidate: "Orlando Sanchez",  race: "Harris County Judge 2026", year: 2026, notes: "Won May 2026 GOP runoff 85,304–49,367" },
  { id: "e41", endorser: "Harris County Republicans",  endorserType: "Party Org",        candidate: "Orlando Sanchez",  race: "Harris County Judge 2026", year: 2026 },
  { id: "e42", endorser: "AFL-CIO Texas",              endorserType: "Union",            candidate: "Letitia Plummer",  race: "Harris County Judge 2026", year: 2026 },
  { id: "e43", endorser: "Texas AFT",                  endorserType: "Union",            candidate: "Letitia Plummer",  race: "Harris County Judge 2026", year: 2026 },
  { id: "e44", endorser: "SEIU Texas",                 endorserType: "Union",            candidate: "Letitia Plummer",  race: "Harris County Judge 2026", year: 2026 },
  { id: "e45", endorser: "Emily's List",               endorserType: "Civic Org",        candidate: "Letitia Plummer",  race: "Harris County Judge 2026", year: 2026 },
  { id: "e46", endorser: "Harris County Democrats",    endorserType: "Party Org",        candidate: "Letitia Plummer",  race: "Harris County Judge 2026", year: 2026 },
  { id: "e48", endorser: "Houston Chronicle",          endorserType: "Newspaper",        candidate: "Letitia Plummer",  race: "Harris County Judge 2026", year: 2026 },
  { id: "e49", endorser: "Planned Parenthood Action",  endorserType: "Civic Org",        candidate: "Letitia Plummer",  race: "Harris County Judge 2026", year: 2026 },
  { id: "e50", endorser: "Sylvia Garcia",              endorserType: "Elected Official", candidate: "Letitia Plummer",  race: "Harris County Judge 2026", year: 2026 },
  { id: "e51", endorser: "Lizzie Fletcher",            endorserType: "Elected Official", candidate: "Letitia Plummer",  race: "Harris County Judge 2026", year: 2026 },
  { id: "e10", endorser: "Houston Chronicle",          endorserType: "Newspaper",        candidate: "Lina Hidalgo",     race: "Harris County Judge 2024", year: 2024 },
  { id: "e11", endorser: "AFL-CIO Texas",              endorserType: "Union",            candidate: "Lina Hidalgo",     race: "Harris County Judge 2024", year: 2024 },
  { id: "e12", endorser: "Texas AFT",                  endorserType: "Union",            candidate: "Lina Hidalgo",     race: "Harris County Judge 2024", year: 2024 },
  { id: "e13", endorser: "Emily's List",               endorserType: "Civic Org",        candidate: "Lina Hidalgo",     race: "Harris County Judge 2024", year: 2024 },
  { id: "e14", endorser: "Sylvia Garcia",              endorserType: "Elected Official", candidate: "Lina Hidalgo",     race: "Harris County Judge 2024", year: 2024 },
  { id: "e17", endorser: "AFL-CIO Texas",              endorserType: "Union",            candidate: "Adrian Garcia",    race: "County Commissioner Pct 2 2024", year: 2024 },
  { id: "e18", endorser: "Houston Chronicle",          endorserType: "Newspaper",        candidate: "Adrian Garcia",    race: "County Commissioner Pct 2 2024", year: 2024 },
  { id: "e19", endorser: "Sylvia Garcia",              endorserType: "Elected Official", candidate: "Adrian Garcia",    race: "County Commissioner Pct 2 2024", year: 2024 },
  { id: "e20", endorser: "Harris County Democrats",    endorserType: "Party Org",        candidate: "Adrian Garcia",    race: "County Commissioner Pct 2 2024", year: 2024 },
  { id: "e21", endorser: "AFL-CIO Texas",              endorserType: "Union",            candidate: "Amanda Edwards",   race: "TX-18 2024", year: 2024 },
  { id: "e22", endorser: "Houston Chronicle",          endorserType: "Newspaper",        candidate: "Amanda Edwards",   race: "TX-18 2024", year: 2024 },
  { id: "e23", endorser: "Emily's List",               endorserType: "Civic Org",        candidate: "Amanda Edwards",   race: "TX-18 2024", year: 2024 },
];

export const TYPE_COLOR: Record<EndorserType, { bg: string; text: string }> = {
  "Union":            { bg: "#fef3c7", text: "#92400e" },
  "Elected Official": { bg: "#dbeafe", text: "#1d4ed8" },
  "Party Org":        { bg: "#f3e8ff", text: "#6d28d9" },
  "Civic Org":        { bg: "#d1fae5", text: "#065f46" },
  "Newspaper":        { bg: "#fce7f3", text: "#9d174d" },
  "Business Org":     { bg: "#f1f5f9", text: "#475569" },
};

/* ─── Consultant types & data ─────────────────────────────────────────────── */
export type ConsultantRole = "Campaign Manager" | "General Consultant" | "Media / Ads" | "Polling" | "Fundraising" | "Field / Organizing" | "Opposition Research" | "Digital";
export interface Relationship { id: string; consultant: string; firm?: string; role: ConsultantRole; client: string; race: string; year: number; party: "D" | "R" | "Both"; }

export const RELATIONSHIPS: Relationship[] = [
  { id: "c1",  consultant: "Mustafa Tameez",            firm: "Outreach Strategists",       role: "General Consultant", client: "Lina Hidalgo",     race: "Harris County Judge 2022", year: 2022, party: "D" },
  { id: "c2",  consultant: "Mustafa Tameez",            firm: "Outreach Strategists",       role: "General Consultant", client: "Lina Hidalgo",     race: "Harris County Judge 2024", year: 2024, party: "D" },
  { id: "c3",  consultant: "Mustafa Tameez",            firm: "Outreach Strategists",       role: "General Consultant", client: "Adrian Garcia",    race: "County Commissioner Pct 2", year: 2024, party: "D" },
  { id: "c4",  consultant: "Mustafa Tameez",            firm: "Outreach Strategists",       role: "General Consultant", client: "Jasmine Crockett", race: "U.S. Senate 2026", year: 2026, party: "D" },
  { id: "c31", consultant: "Mustafa Tameez",            firm: "Outreach Strategists",       role: "General Consultant", client: "Letitia Plummer",  race: "Harris County Judge 2026", year: 2026, party: "D" },
  { id: "c5",  consultant: "Lavastida & Co",            firm: "Lavastida & Co",             role: "Media / Ads",        client: "Lina Hidalgo",     race: "Harris County Judge 2024", year: 2024, party: "D" },
  { id: "c6",  consultant: "Lavastida & Co",            firm: "Lavastida & Co",             role: "Media / Ads",        client: "Adrian Garcia",    race: "County Commissioner Pct 2", year: 2024, party: "D" },
  { id: "c32", consultant: "Lavastida & Co",            firm: "Lavastida & Co",             role: "Media / Ads",        client: "Letitia Plummer",  race: "Harris County Judge 2026", year: 2026, party: "D" },
  { id: "c7",  consultant: "Garin Hart Yang",           firm: "Garin Hart Yang",            role: "Polling",            client: "Lina Hidalgo",     race: "Harris County Judge 2022", year: 2022, party: "D" },
  { id: "c8",  consultant: "Garin Hart Yang",           firm: "Garin Hart Yang",            role: "Polling",            client: "Jasmine Crockett", race: "U.S. Senate 2026", year: 2026, party: "D" },
  { id: "c9",  consultant: "EMILY's List",              firm: "EMILY's List",               role: "Fundraising",        client: "Lina Hidalgo",     race: "Harris County Judge 2024", year: 2024, party: "D" },
  { id: "c10", consultant: "EMILY's List",              firm: "EMILY's List",               role: "Fundraising",        client: "Amanda Edwards",   race: "TX-18 2024", year: 2024, party: "D" },
  { id: "c34", consultant: "EMILY's List",              firm: "EMILY's List",               role: "Fundraising",        client: "Letitia Plummer",  race: "Harris County Judge 2026", year: 2026, party: "D" },
  { id: "c11", consultant: "Trilogy Interactive",       firm: "Trilogy Interactive",        role: "Digital",            client: "Lina Hidalgo",     race: "Harris County Judge 2024", year: 2024, party: "D" },
  { id: "c12", consultant: "Trilogy Interactive",       firm: "Trilogy Interactive",        role: "Digital",            client: "Jasmine Crockett", race: "U.S. Senate 2026", year: 2026, party: "D" },
  { id: "c23", consultant: "SKDK",                     firm: "SKDK",                       role: "General Consultant", client: "Jasmine Crockett", race: "U.S. Senate 2026", year: 2026, party: "D" },
  { id: "c24", consultant: "Bully Pulpit Interactive",  firm: "Bully Pulpit Interactive",   role: "Digital",            client: "Jasmine Crockett", race: "U.S. Senate 2026", year: 2026, party: "D" },
  { id: "c25", consultant: "Anzalone Research",         firm: "Anzalone Research",          role: "Polling",            client: "Jasmine Crockett", race: "U.S. Senate 2026", year: 2026, party: "D" },
  { id: "c26", consultant: "JS2 Media",                 firm: "JS2 Media",                  role: "Media / Ads",        client: "Jasmine Crockett", race: "U.S. Senate 2026", year: 2026, party: "D" },
  { id: "c15", consultant: "ALG Research",              firm: "ALG Research",               role: "Polling",            client: "Lina Hidalgo",     race: "Harris County Judge 2024", year: 2024, party: "D" },
  { id: "c33", consultant: "ALG Research",              firm: "ALG Research",               role: "Polling",            client: "Letitia Plummer",  race: "Harris County Judge 2026", year: 2026, party: "D" },
  { id: "c16", consultant: "Axiom Strategies",          firm: "Axiom Strategies",           role: "General Consultant", client: "Dan Crenshaw",     race: "TX-2 2024", year: 2024, party: "R" },
  { id: "c17", consultant: "Axiom Strategies",          firm: "Axiom Strategies",           role: "General Consultant", client: "Wesley Hunt",      race: "TX-38 2024", year: 2024, party: "R" },
  { id: "c27", consultant: "Axiom Strategies",          firm: "Axiom Strategies",           role: "General Consultant", client: "Ken Paxton",       race: "U.S. Senate 2026", year: 2026, party: "R" },
  { id: "c35", consultant: "Axiom Strategies",          firm: "Axiom Strategies",           role: "General Consultant", client: "Orlando Sanchez",  race: "Harris County Judge 2026", year: 2026, party: "R" },
  { id: "c19", consultant: "Mentzer Media",             firm: "Mentzer Media",              role: "Media / Ads",        client: "Dan Crenshaw",     race: "TX-2 2024", year: 2024, party: "R" },
  { id: "c20", consultant: "Mentzer Media",             firm: "Mentzer Media",              role: "Media / Ads",        client: "Wesley Hunt",      race: "TX-38 2024", year: 2024, party: "R" },
  { id: "c36", consultant: "Mentzer Media",             firm: "Mentzer Media",              role: "Media / Ads",        client: "Orlando Sanchez",  race: "Harris County Judge 2026", year: 2026, party: "R" },
  { id: "c28", consultant: "Jamestown Associates",      firm: "Jamestown Associates",       role: "Media / Ads",        client: "Ken Paxton",       race: "U.S. Senate 2026", year: 2026, party: "R" },
  { id: "c29", consultant: "WPA Intelligence",          firm: "WPA Intelligence",           role: "Polling",            client: "Ken Paxton",       race: "U.S. Senate 2026", year: 2026, party: "R" },
  { id: "c21", consultant: "Harris Media",              firm: "Harris Media",               role: "Digital",            client: "Dan Crenshaw",     race: "TX-2 2024", year: 2024, party: "R" },
  { id: "c30", consultant: "Harris Media",              firm: "Harris Media",               role: "Digital",            client: "Ken Paxton",       race: "U.S. Senate 2026", year: 2026, party: "R" },
];

export const ROLE_COLOR: Record<ConsultantRole, { bg: string; text: string }> = {
  "Campaign Manager":    { bg: "#dbeafe", text: "#1d4ed8" },
  "General Consultant":  { bg: "#ede9fe", text: "#6d28d9" },
  "Media / Ads":         { bg: "#fce7f3", text: "#9d174d" },
  "Polling":             { bg: "#fef3c7", text: "#92400e" },
  "Fundraising":         { bg: "#d1fae5", text: "#065f46" },
  "Field / Organizing":  { bg: "#cffafe", text: "#0e7490" },
  "Opposition Research": { bg: "#fee2e2", text: "#991b1b" },
  "Digital":             { bg: "#f0fdf4", text: "#166534" },
};

/* ─── Donor network ───────────────────────────────────────────────────────── */
export interface DonorEntry { donor: string; totalM: number; topRecipients: string[]; type: string; }
export const DONORS: DonorEntry[] = [
  { donor: "Texas Trial Lawyers Assoc", totalM: 4.2, topRecipients: ["Lina Hidalgo", "Jasmine Crockett", "Letitia Plummer"], type: "Legal" },
  { donor: "AFL-CIO Political Action", totalM: 3.8, topRecipients: ["Jasmine Crockett", "Letitia Plummer", "Adrian Garcia"],  type: "Union PAC" },
  { donor: "Texas Medical Assoc PAC",  totalM: 3.1, topRecipients: ["Dan Crenshaw", "Troy Nehls", "Joan Huffman"],           type: "Healthcare" },
  { donor: "Houston Energy PAC",        totalM: 2.9, topRecipients: ["Dan Crenshaw", "Wesley Hunt", "Morgan Luttrell"],      type: "Energy" },
  { donor: "Emily's List",              totalM: 2.7, topRecipients: ["Lina Hidalgo", "Amanda Edwards", "Letitia Plummer"],   type: "Women's PAC" },
  { donor: "Club for Growth PAC",       totalM: 2.4, topRecipients: ["Ken Paxton", "Dan Crenshaw"],                          type: "Conservative PAC" },
  { donor: "Texas AFT",                 totalM: 2.1, topRecipients: ["Jasmine Crockett", "Letitia Plummer", "Carol Alvarado"], type: "Education" },
  { donor: "NRA Political Victory Fund",totalM: 1.9, topRecipients: ["Ken Paxton", "Troy Nehls", "Brian Babin"],             type: "Gun Rights" },
  { donor: "SEIU Texas",                totalM: 1.7, topRecipients: ["Jasmine Crockett", "Letitia Plummer"],                 type: "Union" },
  { donor: "CenterPoint Energy PAC",    totalM: 1.5, topRecipients: ["Dan Crenshaw", "Morgan Luttrell", "Joan Huffman"],     type: "Utilities" },
];
