import type { MetadataRoute } from "next";
import { siteConfig } from "@/shared/config/site-metadata";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteConfig.url.toString(),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
