import "server-only";

import { prisma } from "../infrastructure/database/prisma";
import type { ISearchIndexService } from "../modules/search-index/interfaces/search-index.service.interface";
import type { ISiteSearchService } from "../modules/search-index/interfaces/site-search.service.interface";
import { SearchIndexJobRepository } from "../modules/search-index/repositories/search-index-job.repository";
import { SiteChunkRepository } from "../modules/search-index/repositories/site-chunk.repository";
import { SearchIndexService } from "../modules/search-index/services/search-index.service";
import { SiteSearchService } from "../modules/search-index/services/site-search.service";
import { logger } from "./logging.composition";
import { openAIProvider } from "./openai.composition";
import { aboutService, auditService, homeService, workService } from "./portfolio.composition";

const chunkRepository = new SiteChunkRepository(prisma);

const jobRepository = new SearchIndexJobRepository(prisma);

export const searchIndexService: ISearchIndexService = new SearchIndexService(
  {
    home: homeService,
    work: workService,
    about: aboutService,
    audit: auditService,
  },
  chunkRepository,
  jobRepository,
  openAIProvider,
  logger,
);

export const siteSearchService: ISiteSearchService = new SiteSearchService(chunkRepository);
