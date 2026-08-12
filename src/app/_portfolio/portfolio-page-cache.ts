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

export async function getCachedHomePageData() {
  "use cache";
  cacheLife("max");
  const data = await homeService.getPageData();

  cacheTag(...getHomePageCacheTags(data));

  return data;
}

export async function getCachedWorkPageData() {
  "use cache";
  cacheLife("max");
  const data = await workService.getPageData();

  cacheTag(...getWorkPageCacheTags(data));

  return data;
}

export async function getCachedAboutPageData() {
  "use cache";
  cacheLife("max");
  const data = await aboutService.getPageData();

  cacheTag(...getAboutPageCacheTags(data));

  return data;
}

export async function getCachedAuditPageData() {
  "use cache";
  cacheLife("max");
  const data = await auditService.getPageData();

  cacheTag(...getAuditPageCacheTags(data));

  return data;
}
