// Kalshi prediction-market odds for November 2026 races (public elections
// API, no key). Server-only. Used by race cards, race pages, the race board,
// the Districts VS card and /api/kalshi.
//
// For each race we read the lowest-strike "margin of victory" market on each
// party's event; its YES price is the market's implied chance that side wins.
//
// LIQUIDITY RULE: a price is only shown when at least MIN_OPEN_INTEREST
// contracts are open. Thin markets quote prices nobody has traded (Sep 2026:
// TX-7 showed "D 93%" on zero open contracts while the race is a toss-up), and
// printing those next to a desk rating would mislead.

export const MIN_OPEN_INTEREST = 1000;

const MARKET_URL = "https://kalshi.com/markets/kxmidtermmov";

/** Keys match lib/matchups-2026.ts. */
export const KALSHI_EVENTS: Record<string, { d?: string; r?: string; label: string }> = {
  "US-Senate":   { d: "KXMIDTERMMOV-TXSEND", r: "KXMIDTERMMOV-TXSENR", label: "Texas Senate" },
  "TX-Governor": { d: "KXMIDTERMMOV-TXGOVD", r: "KXMIDTERMMOV-TXGOVR", label: "Texas Governor" },
  "CD-2":  { r: "KXMIDTERMMOV-TX02R", label: "TX-2" },
  "CD-7":  { d: "KXMIDTERMMOV-TX07D", label: "TX-7" },
  "CD-8":  { r: "KXMIDTERMMOV-TX08R", label: "TX-8" },
  "CD-9":  { d: "KXMIDTERMMOV-TX09D", r: "KXMIDTERMMOV-TX09R", label: "TX-9" },
  "CD-18": { d: "KXMIDTERMMOV-TX18D", label: "TX-18" },
  "CD-22": { r: "KXMIDTERMMOV-TX22R", label: "TX-22" },
  "CD-29": { d: "KXMIDTERMMOV-TX29D", label: "TX-29" },
  "CD-36": { r: "KXMIDTERMMOV-TX36R", label: "TX-36" },
  "CD-38": { r: "KXMIDTERMMOV-TX38R", label: "TX-38" },
};
/** Old key used by /api/kalshi callers. */
const ALIASES: Record<string, string> = { "TX-Gov": "TX-Governor" };

export interface MarketOdds {
  demProb: number;      // 0-100, implied chance the Democrat wins
  repProb: number;
  openInterest: number; // contracts open across the markets used
  label: string;
  url: string;
  fetchedAt: string;
}

interface KalshiMarket {
  floor_strike?: number;
  last_price_dollars?: string;
  yes_bid_dollars?: string;
  yes_ask_dollars?: string;
  open_interest_fp?: string;
  status: string;
}

async function sideProb(eventTicker: string): Promise<{ prob: number | null; oi: number }> {
  try {
    const res = await fetch(`https://api.elections.kalshi.com/trade-api/v2/markets?event_ticker=${eventTicker}&limit=20`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return { prob: null, oi: 0 };
    const data = (await res.json()) as { markets?: KalshiMarket[] };
    const active = (data.markets ?? []).filter(m => m.status === "active" && m.floor_strike != null);
    if (!active.length) return { prob: null, oi: 0 };
    const m = active.reduce((a, b) => (a.floor_strike! <= b.floor_strike! ? a : b));
    const bid = parseFloat(m.yes_bid_dollars ?? ""), ask = parseFloat(m.yes_ask_dollars ?? ""), last = parseFloat(m.last_price_dollars ?? "");
    const prob = !isNaN(bid) && !isNaN(ask) && ask > 0 ? (bid + ask) / 2 : !isNaN(last) ? last : null;
    return { prob, oi: parseFloat(m.open_interest_fp ?? "0") || 0 };
  } catch {
    return { prob: null, oi: 0 };
  }
}

/** Odds for one race, or null when there is no market or it is too thin to trust. */
export async function getMarketOdds(raceKey: string): Promise<MarketOdds | null> {
  const key = ALIASES[raceKey] ?? raceKey;
  const cfg = KALSHI_EVENTS[key];
  if (!cfg) return null;
  const [d, r] = await Promise.all([
    cfg.d ? sideProb(cfg.d) : Promise.resolve({ prob: null, oi: 0 }),
    cfg.r ? sideProb(cfg.r) : Promise.resolve({ prob: null, oi: 0 }),
  ]);
  const oi = d.oi + r.oi;
  if (oi < MIN_OPEN_INTEREST) return null;
  let dem: number | null = null;
  if (d.prob != null && r.prob != null) dem = d.prob + r.prob > 0 ? d.prob / (d.prob + r.prob) : null;
  else if (d.prob != null) dem = d.prob;
  else if (r.prob != null) dem = 1 - r.prob;
  if (dem == null) return null;
  const demProb = Math.round(dem * 100);
  return { demProb, repProb: 100 - demProb, openInterest: Math.round(oi), label: cfg.label, url: MARKET_URL, fetchedAt: new Date().toISOString() };
}

/** Odds for every race that has a liquid market, keyed by matchup key. */
export async function getAllMarketOdds(): Promise<Record<string, MarketOdds>> {
  const entries = await Promise.all(Object.keys(KALSHI_EVENTS).map(async k => [k, await getMarketOdds(k)] as const));
  return Object.fromEntries(entries.filter(([, v]) => v)) as Record<string, MarketOdds>;
}
