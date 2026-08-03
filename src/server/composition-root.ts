import "server-only";
import { get } from "@vercel/blob";
import {
  getEmbeddingModel,
  getResponseModel,
  createOpenAIClient,
} from "./infrastructure/openai/openai.client";
import { OpenAIProvider } from "./infrastructure/openai/openai.provider";
import { prisma } from "./infrastructure/database/prisma";
import { ConsoleLogger } from "./infrastructure/logging/logger";
import type { ILogger } from "./infrastructure/logging/logger.interface";
import { AssistantService } from "./modules/assistant/services/assistant.service";
import type { IAssistantService } from "./modules/assistant/interfaces/assistant.service.interface";
import { ContentBlockRepository } from "./modules/portfolio/repositories/content-block.repository";
import { ExperienceRepository } from "./modules/portfolio/repositories/experience.repository";
import { PrincipleRepository } from "./modules/portfolio/repositories/principle.repository";
import { ProjectRepository } from "./modules/portfolio/repositories/project.repository";
import { PortfolioServiceRepository } from "./modules/portfolio/repositories/portfolio-service.repository";
import { PortfolioSeedRepository } from "./modules/portfolio/repositories/portfolio-seed.repository";
import { VercelBlobProvider } from "./modules/portfolio/providers/vercel-blob.provider";
import { PortfolioService } from "./modules/portfolio/services/portfolio.service";
import { PortfolioSeedService } from "./modules/portfolio/services/portfolio-seed.service";
import type { IPortfolioService } from "./modules/portfolio/interfaces/portfolio.service.interface";
import type { IPortfolioSeedService } from "./modules/portfolio/interfaces/portfolio-seed.service.interface";
import { SourceRecordRepository } from "./modules/search-index/repositories/source-record.repository";
import { SearchIndexJobRepository } from "./modules/search-index/repositories/search-index-job.repository";
import { SiteChunkRepository } from "./modules/search-index/repositories/site-chunk.repository";
import { SearchIndexService } from "./modules/search-index/services/search-index.service";
import { SiteSearchService } from "./modules/search-index/services/site-search.service";
import type { ISearchIndexService } from "./modules/search-index/interfaces/search-index.service.interface";
import type { ISiteSearchService } from "./modules/search-index/interfaces/site-search.service.interface";
import { GoogleCalendarProvider } from "./infrastructure/google-calendar/google-calendar.provider";
import { getGoogleCalendarConfig, getMeetingWorkflowSecret } from "./infrastructure/config/env";
import { MeetingRepository } from "./modules/meeting/repositories/meeting.repository";
import { MeetingService } from "./modules/meeting/services/meeting.service";
import type { IMeetingService } from "./modules/meeting/interfaces/meeting.service.interface";
import { MeetingWorkflowService } from "./modules/assistant/workflow/meeting-workflow.service";

const openai = new OpenAIProvider(createOpenAIClient(), getEmbeddingModel(), getResponseModel());

const contentBlocks = new ContentBlockRepository(prisma);

const experiences = new ExperienceRepository(prisma);

const principles = new PrincipleRepository(prisma);

const projects = new ProjectRepository(prisma);

const portfolioServices = new PortfolioServiceRepository(prisma);

const seedRepository = new PortfolioSeedRepository(prisma);

const sources = new SourceRecordRepository(prisma);

const chunks = new SiteChunkRepository(prisma);

const jobs = new SearchIndexJobRepository(prisma);

const meetingRepository = new MeetingRepository(prisma);

const googleCalendar = new GoogleCalendarProvider(getGoogleCalendarConfig);

const meetingWorkflow = new MeetingWorkflowService(getMeetingWorkflowSecret);

export const logger: ILogger = new ConsoleLogger();

export const searchIndexService: ISearchIndexService = new SearchIndexService(
  sources,
  chunks,
  jobs,
  openai,
  logger,
);
export const siteSearchService: ISiteSearchService = new SiteSearchService(chunks);
export const meetingService: IMeetingService = new MeetingService(
  googleCalendar,
  meetingRepository,
  logger,
);
export const assistantService: IAssistantService = new AssistantService(
  openai,
  siteSearchService,
  logger,
  meetingService,
  meetingWorkflow,
);
export const portfolioService: IPortfolioService = new PortfolioService(
  contentBlocks,
  experiences,
  principles,
  projects,
  portfolioServices,
  new VercelBlobProvider({ get }),
);
export const portfolioSeedService: IPortfolioSeedService = new PortfolioSeedService(seedRepository);
