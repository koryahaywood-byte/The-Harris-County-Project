// Notable-days lookup for the homepage Agenda card. MM-DD keyed.
// Extracted from DashboardWidget so the component stays presentational.


// ── Notable days lookup: MM-DD keyed ───────────────────────────────────────
// Covers federal holidays, national/international observances, Texas-specific
// days, and standing civic deadlines. Shown in the Agenda card.
export const NOTABLE_DAYS: Record<string, { label: string; emoji: string; type: "holiday" | "civic" | "observance" | "fun" }[]> = {
  // January
  "01-01": [{ label: "New Year's Day", emoji: "🎆", type: "holiday" }],
  "01-15": [{ label: "MLK Jr. Birthday", emoji: "✊", type: "holiday" }],  // observed 3rd Mon but keep date
  "01-20": [{ label: "Martin Luther King Jr. Day (observed)", emoji: "✊", type: "holiday" }],
  "01-21": [{ label: "National Hug Day", emoji: "🤗", type: "fun" }],

  // February
  "02-01": [{ label: "Black History Month begins", emoji: "✊", type: "observance" }],
  "02-02": [{ label: "Groundhog Day", emoji: "🦔", type: "fun" }],
  "02-14": [{ label: "Valentine's Day", emoji: "❤️", type: "fun" }],
  "02-17": [{ label: "Presidents' Day", emoji: "🏛️", type: "holiday" }],
  "02-19": [{ label: "Presidents' Day (observed)", emoji: "🏛️", type: "holiday" }],

  // March
  "03-08": [{ label: "International Women's Day", emoji: "♀️", type: "observance" }],
  "03-17": [{ label: "St. Patrick's Day", emoji: "☘️", type: "fun" }],
  "03-29": [{ label: "Texas Independence Day", emoji: "⭐", type: "holiday" }],  // March 2 but celebrated
  "03-02": [{ label: "Texas Independence Day", emoji: "⭐", type: "holiday" }],
  "03-31": [{ label: "César Chávez Day", emoji: "✊", type: "observance" }],

  // April
  "04-01": [{ label: "April Fools' Day", emoji: "🃏", type: "fun" }],
  "04-15": [{ label: "Tax Day. Federal returns due", emoji: "📋", type: "civic" }],
  "04-22": [{ label: "Earth Day", emoji: "🌎", type: "observance" }],

  // May
  "05-01": [{ label: "International Workers' Day (May Day)", emoji: "✊", type: "observance" }],
  "05-05": [{ label: "Cinco de Mayo", emoji: "🇲🇽", type: "observance" }],
  "05-15": [{ label: "National Day of Teacher Appreciation", emoji: "🍎", type: "observance" }],
  "05-26": [{ label: "Memorial Day (observed)", emoji: "🎖️", type: "holiday" }],

  // June
  "06-01": [{ label: "Pride Month begins", emoji: "🏳️‍🌈", type: "observance" }],
  "06-10": [{ label: "National Iced Tea Day", emoji: "🧋", type: "fun" }],
  "06-19": [{ label: "Juneteenth. Federal Holiday", emoji: "✊", type: "holiday" }],
  "06-20": [{ label: "Juneteenth (observed)", emoji: "✊", type: "holiday" }],
  "06-21": [{ label: "Summer Solstice", emoji: "☀️", type: "fun" }],

  // July
  "07-04": [{ label: "Independence Day", emoji: "🇺🇸", type: "holiday" }],
  "07-23": [{ label: "National Hot Dog Day", emoji: "🌭", type: "fun" }],

  // August
  "08-26": [{ label: "Women's Equality Day", emoji: "♀️", type: "observance" }],
  "08-19": [{ label: "National Aviation Day", emoji: "✈️", type: "fun" }],

  // September
  "09-01": [{ label: "Labor Day (observed)", emoji: "⚒️", type: "holiday" }],
  "09-15": [{ label: "Hispanic Heritage Month begins", emoji: "🌮", type: "observance" }],
  "09-17": [{ label: "Constitution Day", emoji: "📜", type: "civic" }],

  // October
  "10-02": [{ label: "World Habitat Day", emoji: "🏘️", type: "observance" }],
  "10-06": [{ label: "Voter Registration Deadline. November 2026 Election", emoji: "🗳️", type: "civic" }],
  "10-09": [{ label: "Indigenous Peoples' Day", emoji: "🪶", type: "observance" }],
  "10-13": [{ label: "Columbus Day (federal)", emoji: "🚢", type: "holiday" }],
  "10-15": [{ label: "Hispanic Heritage Month ends", emoji: "🌮", type: "observance" }],
  "10-31": [{ label: "Halloween", emoji: "🎃", type: "fun" }],

  // November
  "11-03": [{ label: "Election Day. Harris County General Election 2026", emoji: "🗳️", type: "civic" }],
  "11-11": [{ label: "Veterans Day", emoji: "🎖️", type: "holiday" }],
  "11-26": [{ label: "Thanksgiving Day", emoji: "🦃", type: "holiday" }],

  // December
  "12-01": [{ label: "World AIDS Day", emoji: "🎗️", type: "observance" }],
  "12-10": [{ label: "Human Rights Day", emoji: "✊", type: "observance" }],
  "12-25": [{ label: "Christmas Day", emoji: "🎄", type: "holiday" }],
  "12-26": [{ label: "Kwanzaa begins", emoji: "🕯️", type: "observance" }],
  "12-31": [{ label: "New Year's Eve", emoji: "🥂", type: "fun" }],
};

export function getNotableDays(todayStr: string) {
  const mmdd = todayStr.slice(5); // "YYYY-MM-DD" → "MM-DD"
  return NOTABLE_DAYS[mmdd] ?? [];
}
