import { NextRequest, NextResponse } from "next/server";

export const revalidate = 300; // cache 5 minutes

/* Kalshi prediction-market odds for November 2026 races.
   Uses the public elections API (no key needed). For each race we read the
   "margin of victory 1+ pts" market on each party's event. Its YES price is
   the market's implied probability that side wins at all.
   GET /api/kalshi?race=CD-18 | US-Senate | TX-Gov */

const RACE_EVENTS: Record<string, { d?: string; r?: string; label: string; url: string }> = {
  "US-Senate": { d: "KXMIDTERMMOV-TXSEND", r: "KXMIDTERMMOV-TXSENR", label: "Texas Senate", url: "https://kalshi.com/markets/kxmidtermmov" },
  "TX-Gov":    { d: "KXMIDTERMMOV-TXGOVD", r: "KXMIDTERMMOV-TXGOVR", label: "Texas Governor", url: "https://kalshi.com/markets/kxmidtermmov" },
  "CD-2":  { r: "KXMIDTERMMOV-TX02R", label: "TX-2",  url: "https://kalshi.com/markets/kxmidtermmov" },
  "CD-7":  { d: "KXMIDTERMMOV-TX07D", label: "TX-7",  url: "https://kalshi.com/markets/kxmidtermmov" },
  "CD-8":  { r: "KXMIDTERMMOV-TX08R", label: "TX-8",  url: "https://kalshi.com/markets/kxmidtermmov" },
  "CD-9":  { d: "KXMIDTERMMOV-TX09D", r: "KXMIDTERMMOV-TX09R", label: "TX-9", url: "https://kalshi.com/markets/kxmidtermmov" },
  "CD-18": { d: "KXMIDTERMMOV-TX18D", label: "TX-18", url: "https://kalshi.com/markets/kxmidtermmov" },
  "CD-22": { r: "KXMIDTERMMOV-TX22R", label: "TX-22", url: "https://kalshi.com/markets/kxmidtermmov" },
  "CD-29": { d: "KXMIDTERMMOV-TX29D", label: "TX-29", url: "https://kalshi.com/markets/kxmidtermmov" },
  "CD-36": { r: "KXMIDTERMMOV-TX36R", label: "TX-36", url: "https://kalshi.com/markets/kxmidtermmov" },
  "CD-38": { r: "KXMIDTERMMOV-TX38R", label: "TX-38", url: "https://kalshi.com/markets/kxmidtermmov" },
};

interface KalshiMarket {
  ticker: string;
  floor_strike?: number;
  last_price_dollars?: string;
  yes_bid_dollars?: string;
  yes_ask_dollars?: string;
  open_interest_fp?: string;
  status: string;
}

async function winProb(eventTicker: string): Promise<{ prob: number | null; volume: number }> {
  const res = await fetch(
    `https://api.elections.kalshi.com/trade-api/v2/markets?event_ticker=${eventTicker}&limit=20`,
    { next: { revalidate: 300 } }
  );
  if (!res.ok) return { prob: null, volume: 0 };
  const data = (await res.json()) as { markets?: KalshiMarket[] };
  // The lowest-strike market ("wins by 1+ pts" in competitive races, lowest
  // vote-share threshold in safe seats) is the closest proxy for win probability.
  const active = (data.markets ?? []).filter(m => m.status === "active" && m.floor_strike != null);
  if (active.length === 0) return { prob: null, volume: 0 };
  const p1 = active.reduce((a, b) => (a.floor_strike! <= b.floor_strike! ? a : b));
  // mid of bid/ask when both exist; else last trade
  const bid = parseFloat(p1.yes_bid_dollars ?? "");
  const ask = parseFloat(p1.yes_ask_dollars ?? "");
  const last = parseFloat(p1.last_price_dollars ?? "");
  let prob: number | null = null;
  if (!isNaN(bid) && !isNaN(ask) && ask > 0) prob = (bid + ask) / 2;
  else if (!isNaN(last)) prob = last;
  return { prob, volume: parseFloat(p1.open_interest_fp ?? "0") || 0 };
}

export async function GET(req: NextRequest) {
  const race = req.nextUrl.searchParams.get("race") ?? "";
  const cfg = RACE_EVENTS[race];
  if (!cfg) return NextResponse.json({ available: false });

  try {
    const [d, r] = await Promise.all([
      cfg.d ? winProb(cfg.d) : Promise.resolve({ prob: null, volume: 0 }),
      cfg.r ? winProb(cfg.r) : Promise.resolve({ prob: null, volume: 0 }),
    ]);

    let demProb: number | null = null;
    if (d.prob !== null && r.prob !== null) {
      const total = d.prob + r.prob;
      demProb = total > 0 ? d.prob / total : null; // normalize out the tie/other sliver
    } else if (d.prob !== null) demProb = d.prob;
    else if (r.prob !== null) demProb = 1 - r.prob;

    if (demProb === null) return NextResponse.json({ available: false });

    return NextResponse.json({
      available: true,
      label: cfg.label,
      demProb: Math.round(demProb * 100),
      repProb: 100 - Math.round(demProb * 100),
      volume: Math.round(d.volume + r.volume),
      url: cfg.url,
      fetchedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ available: false });
  }
}
