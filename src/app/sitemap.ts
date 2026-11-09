import { publicPortfolioService } from "@/modules/composition";
import type { MetadataRoute } from "next";
import { siteConfig } from "./_config/site-metadata";

export const dynamic = "error";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await publicPortfolioService.listProjects();

  return [
    {
      url: siteConfig.url.toString(),
      changeFrequency: "monthly",
      priority: 1,
    },
    { url: new URL("/work", siteConfig.url).href },
    ...projects.map(({ slug }) => ({ url: new URL(`/work/${slug}`, siteConfig.url).href })),
  ];
}
