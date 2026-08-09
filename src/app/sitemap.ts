import type { MetadataRoute } from "next";
import { siteConfig } from "@/shared/config/site-metadata";

const routes = ["", "/work", "/about", "/audit"];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: new URL(route, siteConfig.url).toString(),
    lastModified: new Date(),
    changeFrequency: route === "" ? "monthly" : "yearly",
    priority: route === "" ? 1 : route === "/audit" ? 0.9 : 0.8,
  }));
}
