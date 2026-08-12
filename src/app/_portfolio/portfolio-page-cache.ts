import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import {
  aboutService,
  auditService,
  homeService,
  workService,
} from "@/server/composition-root";
import {
  getAboutPageCacheTags,
  getAuditPageCacheTags,
  getHomePageCacheTags,
  getWorkPageCacheTags,
} from "@/server/modules/portfolio/public";
import { registerPortfolioCacheTags } from "./register-portfolio-cache-tags";

export async function getCachedHomePageData() {
  "use cache";
  cacheLife("max");
  const data = await homeService.getPageData();

  registerPortfolioCacheTags(getHomePageCacheTags(data), cacheTag);

  return data;
}

export async function getCachedWorkPageData() {
  "use cache";
  cacheLife("max");
  const data = await workService.getPageData();

  registerPortfolioCacheTags(getWorkPageCacheTags(data), cacheTag);

  return data;
}

export async function getCachedAboutPageData() {
  "use cache";
  cacheLife("max");
  const data = await aboutService.getPageData();

  registerPortfolioCacheTags(getAboutPageCacheTags(data), cacheTag);

  return data;
}

export async function getCachedAuditPageData() {
  "use cache";
  cacheLife("max");
  const data = await auditService.getPageData();

  registerPortfolioCacheTags(getAuditPageCacheTags(data), cacheTag);

  return data;
}
