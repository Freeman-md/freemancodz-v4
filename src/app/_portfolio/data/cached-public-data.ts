import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { portfolioReadService } from "@/modules/composition";
import {
  getAboutPageCacheTags,
  getAuditPageCacheTags,
  getHomePageCacheTags,
  getWorkPageCacheTags,
  PortfolioCacheTag,
} from "@/modules/portfolio/cache-tags";

const MAX_CACHE_TAGS_PER_CALL = 128;

export async function getCachedHomePageData() {
  "use cache";
  cacheLife("max");
  const data = await portfolioReadService.getHomePageData();

  registerCacheTagsInBatches(getHomePageCacheTags(data));

  return data;
}

export async function getCachedWorkPageData() {
  "use cache";
  cacheLife("max");
  const data = await portfolioReadService.getWorkPageData();

  registerCacheTagsInBatches(getWorkPageCacheTags(data));

  return data;
}

export async function getCachedAboutPageData() {
  "use cache";
  cacheLife("max");
  const data = await portfolioReadService.getAboutPageData();

  registerCacheTagsInBatches(getAboutPageCacheTags(data));

  return data;
}

export async function getCachedAuditPageData() {
  "use cache";
  cacheLife("max");
  const data = await portfolioReadService.getAuditPageData();

  registerCacheTagsInBatches(getAuditPageCacheTags(data));

  return data;
}

export async function getCachedPublicProfile() {
  "use cache";
  cacheLife("max");
  const profile = await portfolioReadService.getPublicProfile();

  cacheTag(PortfolioCacheTag.profile);

  return profile;
}

function registerCacheTagsInBatches(tags: string[]) {
  const uniqueTags = [...new Set(tags)];

  for (let index = 0; index < uniqueTags.length; index += MAX_CACHE_TAGS_PER_CALL) {
    cacheTag(...uniqueTags.slice(index, index + MAX_CACHE_TAGS_PER_CALL));
  }
}
