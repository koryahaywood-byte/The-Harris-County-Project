import { NextResponse } from "next/server";

export const revalidate = 604800; // 7 days

const CENSUS_RACE_URL =
  "https://api.census.gov/data/2022/acs/acs5?get=NAME,B03002_001E,B03002_003E,B03002_004E,B03002_012E,B03002_006E&for=tract:*&in=state:48+county:201";

export async function GET() {
  try {
    const res = await fetch(CENSUS_RACE_URL, {
      next: { revalidate: 604800 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Census API failed", status: res.status }, { status: 502 });
    }

    const raw: string[][] = await res.json();
    const [header, ...rows] = raw;

    const nameIdx    = header.indexOf("NAME");
    const totalIdx   = header.indexOf("B03002_001E");
    const whiteIdx   = header.indexOf("B03002_003E");
    const blackIdx   = header.indexOf("B03002_004E");
    const hispanicIdx = header.indexOf("B03002_012E");
    const asianIdx   = header.indexOf("B03002_006E");
    const tractIdx   = header.indexOf("tract");

    const tracts = rows.map((row) => {
      const total     = parseInt(row[totalIdx]) || 1;
      const white     = parseInt(row[whiteIdx]) || 0;
      const black     = parseInt(row[blackIdx]) || 0;
      const hispanic  = parseInt(row[hispanicIdx]) || 0;
      const asian     = parseInt(row[asianIdx]) || 0;
      const other     = Math.max(0, total - white - black - hispanic - asian);

      return {
        tract: row[tractIdx],
        name: row[nameIdx],
        race: {
          white:    Math.round((white / total) * 100),
          black:    Math.round((black / total) * 100),
          hispanic: Math.round((hispanic / total) * 100),
          asian:    Math.round((asian / total) * 100),
          other:    Math.round((other / total) * 100),
        },
      };
    });

    return NextResponse.json({ tracts }, {
      headers: {
        "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    console.error("Demographics fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch demographics" }, { status: 500 });
  }
}
