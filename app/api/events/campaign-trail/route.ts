import { NextResponse } from "next/server";

const TYPE_MAP: Record<string, string> = {
  CANVASS:             "Block Walk",
  PHONE_BANK:          "Phone Bank",
  TEXT_BANK:           "Text Bank",
  VOTER_REG:           "Voter Registration",
  MEETING:             "Meeting",
  TRAINING:            "Training",
  COMMUNITY:           "Community",
  FUNDRAISER:          "Fundraiser",
  RELATIONAL:          "Organizing",
  GOTV:                "GOTV",
  FRIEND_TO_FRIEND:    "Peer-to-Peer",
  TOWN_HALL:           "Town Hall",
  RALLY:               "Rally",
  SIGNATURE_GATHERING: "Petition",
  OTHER:               "Event",
};

export interface CampaignEvent {
  id:          string;
  title:       string;
  org:         string;
  party:       "D" | "R";
  type:        string;
  startDate:   string;
  endDate:     string | null;
  location:    string;
  isVirtual:   boolean;
  url:         string;
  description: string;
  district?: {
    congressional?: string;
    stateLeg?:      string;
    stateSenate?:   string;
  };
}

// ── Democrat events via Mobilize.us public API ────────────────────────────────
async function fetchDemEvents(): Promise<CampaignEvent[]> {
  const now = Math.floor(Date.now() / 1000);
  const url =
    `https://api.mobilize.us/v1/events` +
    `?zipcode=77002&max_dist=35&state=TX&per_page=150` +
    `&visibility=PUBLIC&timeslots_start_min=${now}`;

  try {
    const res = await fetch(url, { next: { revalidate: 7200 } });
    if (!res.ok) return [];
    const data = await res.json();

    return ((data.data ?? []) as any[])
      .filter((e) => e.timeslots?.length > 0)
      .map((e) => {
        const slot = e.timeslots[0];
        const loc  = e.location ?? {};
        const locationStr = e.is_virtual
          ? "Virtual"
          : [loc.address_lines?.[0], loc.locality, loc.region]
              .filter(Boolean).join(", ");

        return {
          id:          `mob-${e.id}`,
          title:       e.title ?? "",
          org:         e.sponsor?.name ?? "Texas Democrats",
          party:       "D" as const,
          type:        TYPE_MAP[e.event_type] ?? "Event",
          startDate:   new Date(slot.start_date * 1000).toISOString(),
          endDate:     slot.end_date ? new Date(slot.end_date * 1000).toISOString() : null,
          location:    locationStr,
          isVirtual:   e.is_virtual ?? false,
          url:         e.browser_url ?? "https://www.mobilize.us/",
          description: ((e.description ?? "") as string)
            .replace(/<[^>]+>/g, "").slice(0, 250),
          district: {
            congressional: loc.congressional_district || undefined,
            stateLeg:      loc.state_leg_district     || undefined,
            stateSenate:   loc.state_senate_district  || undefined,
          },
        };
      });
  } catch {
    return [];
  }
}

// ── Republican events — Harris County GOP WordPress site ──────────────────────
function inferType(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("block walk") || t.includes("blockwalk") || t.includes("canvass")) return "Block Walk";
  if (t.includes("phone bank") || t.includes("phonebank")) return "Phone Bank";
  if (t.includes("training")) return "Training";
  if (t.includes("fundrais") || t.includes("reception") || t.includes("dinner")) return "Fundraiser";
  if (t.includes("rally")) return "Rally";
  if (t.includes("town hall")) return "Town Hall";
  if (t.includes("voter reg")) return "Voter Registration";
  if (t.includes("meeting") || t.includes("club") || t.includes("pachyderm") ||
      t.includes("republican women") || t.includes("tea party")) return "Meeting";
  return "Event";
}

function parseIcalDate(s: string): Date | null {
  try {
    const clean = s.replace(/TZID=[^:]+:/, "").trim();
    if (clean.length === 8) {
      return new Date(`${clean.slice(0,4)}-${clean.slice(4,6)}-${clean.slice(6,8)}T00:00:00`);
    }
    return new Date(
      `${clean.slice(0,4)}-${clean.slice(4,6)}-${clean.slice(6,8)}` +
      `T${clean.slice(9,11)}:${clean.slice(11,13)}:${clean.slice(13,15)}`
    );
  } catch { return null; }
}

function parseIcal(text: string): CampaignEvent[] {
  const events: CampaignEvent[] = [];
  const now = new Date();
  const blocks = text.split("BEGIN:VEVENT").slice(1);

  for (const block of blocks) {
    const get = (key: string) => {
      const m = block.match(new RegExp(`(?:^|\\n)${key}[^:\\n]*:([^\\n]+)`, "m"));
      return m?.[1]?.trim()
        .replace(/\\n/g, " ").replace(/\\,/g, ",").replace(/\\;/g, ";") ?? "";
    };

    const summary     = get("SUMMARY");
    const dtstart     = get("DTSTART");
    const url         = get("URL");
    const location    = get("LOCATION");
    const description = get("DESCRIPTION").slice(0, 250);

    if (!summary || !dtstart) continue;
    const startDate = parseIcalDate(dtstart);
    if (!startDate || startDate < now) continue;

    events.push({
      id:          `gop-${Buffer.from(url || summary).toString("base64").slice(0, 16)}`,
      title:       summary,
      org:         "Harris County GOP",
      party:       "R",
      type:        inferType(summary),
      startDate:   startDate.toISOString(),
      endDate:     null,
      location:    location || "Harris County, TX",
      isVirtual:   false,
      url:         url || "https://www.harriscountygop.com/events/",
      description,
    });
  }

  return events;
}

async function fetchRepEvents(): Promise<CampaignEvent[]> {
  const HEADERS = { "User-Agent": "harriscountyproject.org/events-aggregator" };

  // Try iCal feeds (WordPress/The Events Calendar, Modern Events Calendar)
  const icalUrls = [
    "https://www.harriscountygop.com/events/?ical=1&eventDisplay=upcoming",
    "https://www.harriscountygop.com/?mec-ical=1&mec_format=default",
  ];

  for (const icalUrl of icalUrls) {
    try {
      const res = await fetch(icalUrl, { next: { revalidate: 7200 }, headers: HEADERS });
      if (res.ok) {
        const text = await res.text();
        if (text.includes("VCALENDAR") && text.includes("VEVENT")) {
          const events = parseIcal(text);
          if (events.length > 0) return events;
        }
      }
    } catch { /* try next */ }
  }

  // Fall back to HTML — extract structured event data from Modern Events Calendar markup
  try {
    const res = await fetch("https://www.harriscountygop.com/events/", {
      next: { revalidate: 7200 }, headers: HEADERS,
    });
    if (!res.ok) return [];
    const html = await res.text();
    return parseGOPHtml(html);
  } catch {
    return [];
  }
}

function parseGOPHtml(html: string): CampaignEvent[] {
  const events: CampaignEvent[] = [];
  const now = new Date();

  // Modern Events Calendar renders events with data attributes and structured markup.
  // Match event article blocks: <article ... class="...mec-event...">
  const articleRe = /<article[^>]+class="[^"]*mec-event[^"]*"[^>]*>([\s\S]*?)<\/article>/gi;
  let articleMatch: RegExpExecArray | null;

  while ((articleMatch = articleRe.exec(html)) !== null) {
    const block = articleMatch[1];

    const titleM    = block.match(/class="[^"]*mec-event-title[^"]*"[^>]*>[\s\S]*?<a[^>]*>([^<]+)/);
    const linkM     = block.match(/href="([^"]+)"/);
    const dateM     = block.match(/datetime="([^"]+)"/);
    const locationM = block.match(/class="[^"]*mec-event-loc[^"]*"[^>]*>([^<]+)/);

    const title = titleM?.[1]?.trim();
    const url   = linkM?.[1]?.trim();
    const rawDate = dateM?.[1]?.trim();

    if (!title || !rawDate) continue;

    const startDate = new Date(rawDate);
    if (isNaN(startDate.getTime()) || startDate < now) continue;

    events.push({
      id:          `gop-html-${Buffer.from(url || title).toString("base64").slice(0, 16)}`,
      title,
      org:         "Harris County GOP",
      party:       "R",
      type:        inferType(title),
      startDate:   startDate.toISOString(),
      endDate:     null,
      location:    locationM?.[1]?.trim() || "Harris County, TX",
      isVirtual:   false,
      url:         url || "https://www.harriscountygop.com/events/",
      description: "",
    });
  }

  return events;
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function GET() {
  const [demEvents, repEvents] = await Promise.all([
    fetchDemEvents(),
    fetchRepEvents(),
  ]);

  const all = [...demEvents, ...repEvents].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  return NextResponse.json({
    events:    all,
    counts:    { D: demEvents.length, R: repEvents.length, total: all.length },
    fetchedAt: new Date().toISOString(),
  });
}
