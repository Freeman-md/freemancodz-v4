import type { MetadataRoute } from "next";
import { siteConfig } from "./_config/site-metadata";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteConfig.url.toString(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
