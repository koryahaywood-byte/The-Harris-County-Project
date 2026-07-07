import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Admin dashboards and JSON APIs aren't for crawlers; voter-search
        // results pages expose personal-record queries and shouldn't index.
        disallow: ["/admin/", "/api/", "/tools/voter-search"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
