import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { portfolioService } from "@/modules/composition";
import {
  getAboutPageCacheTags,
  getAuditPageCacheTags,
  getHomePageCacheTags,
  getWorkPageCacheTags,
  PortfolioCacheTag,
} from "@/modules/portfolio/cache";
import { registerPortfolioCacheTags } from "./register-portfolio-cache-tags";

export async function getCachedHomePageData() {
  "use cache";
  cacheLife("max");
  const data = await portfolioService.getHomePageData();

  registerPortfolioCacheTags(getHomePageCacheTags(data), cacheTag);

  return data;
}

export async function getCachedWorkPageData() {
  "use cache";
  cacheLife("max");
  const data = await portfolioService.getWorkPageData();

  registerPortfolioCacheTags(getWorkPageCacheTags(data), cacheTag);

  return data;
}

export async function getCachedAboutPageData() {
  "use cache";
  cacheLife("max");
  const data = await portfolioService.getAboutPageData();

  registerPortfolioCacheTags(getAboutPageCacheTags(data), cacheTag);

  return data;
}

export async function getCachedAuditPageData() {
  "use cache";
  cacheLife("max");
  const data = await portfolioService.getAuditPageData();

  registerPortfolioCacheTags(getAuditPageCacheTags(data), cacheTag);

  return data;
}

export async function getCachedPublicProfile() {
  "use cache";
  cacheLife("max");
  const profile = await portfolioService.getPublicProfile();

  cacheTag(PortfolioCacheTag.profile);

  return profile;
}
