import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { POLITICIANS } from "@/lib/politicians";
import { MATCHUPS_2026 } from "@/lib/matchups-2026";

// The growth channel is search ("HD 134 election results", "who represents me
// Houston") — enumerate every tool, politician, and district portrait.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const page = (path: string, priority = 0.6): MetadataRoute.Sitemap[number] => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: "daily",
    priority,
  });

  const tools = [
    "/", "/my-officials", "/politicians", "/politicians/leaderboard", "/blogs",
    "/methodology", "/contact", "/about",
    "/tools/heat-check", "/tools/where-is-the-dough", "/tools/districts",
    "/tools/ballot-2026", "/tools/tx-house", "/tools/field-sweep",
    "/tools/pac-tracker", "/tools/precinct-lookup",
    "/tools/early-vote", "/tools/opportunity-map", "/tools/civic-calendar",
    "/tools/bill-tracker", "/tools/congressional-bills", "/tools/the-brief",
    "/tools/public-money", "/tools/the-network", "/tools/tv-station",
    "/tools/who-do-i-call",
    "/tools/my-ballot", "/tools/judges", "/tools/donor-search",
    "/tools/tax-receipt", "/tools/court-votes", "/tools/embeds",
  ].map(p => page(p, p === "/" ? 1 : 0.8));

  const politicians = POLITICIANS.map(p => page(`/politicians/${p.slug}`, 0.6));

  const districts = Object.keys(MATCHUPS_2026)
    .map(key => {
      const m = key.match(/^(HD|SD|CD)-(\d+)$/);
      return m ? page(`/tools/districts?type=${m[1].toLowerCase()}&district=${m[2]}`, 0.7) : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  return [...tools, ...politicians, ...districts];
}
