// Canonical site identity, one place to flip at launch.
// The official domain will be TheHarrisCountyProject.org (or .com). When it's
// registered and pointed at Vercel, set NEXT_PUBLIC_SITE_URL=https://theharriscountyproject.org
// in Vercel env and every share card, OG image, sitemap, and footer follows.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://the-harris-county-project.vercel.app";
export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, "");
export const SITE_NAME = "The Harris County Project";
