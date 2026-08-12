import "server-only";
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
import { ProfileRepository } from "./modules/portfolio/repositories/profile.repository";
import { ProjectRepository } from "./modules/portfolio/repositories/project.repository";
import { IconBlockRepository } from "./modules/portfolio/repositories/icon-block.repository";
import { MediaBlockRepository } from "./modules/portfolio/repositories/media-block.repository";
import { ActionBlockRepository } from "./modules/portfolio/repositories/action-block.repository";
import { HomeService } from "./modules/portfolio/services/home.service";
import { WorkService } from "./modules/portfolio/services/work.service";
import { AboutService } from "./modules/portfolio/services/about.service";
import { AuditService } from "./modules/portfolio/services/audit.service";
import type { IHomeService } from "./modules/portfolio/interfaces/home.service.interface";
import type { IWorkService } from "./modules/portfolio/interfaces/work.service.interface";
import type { IAboutService } from "./modules/portfolio/interfaces/about.service.interface";
import type { IAuditService } from "./modules/portfolio/interfaces/audit.service.interface";
import { PortfolioAdministrationService } from "./modules/portfolio/services/portfolio-administration.service";
import type { IPortfolioAdministrationService } from "./modules/portfolio/interfaces/portfolio-administration.service.interface";
import { PortfolioMediaService } from "./modules/portfolio/services/portfolio-media.service";
import type { IPortfolioMediaService } from "./modules/portfolio/interfaces/portfolio-media.service.interface";
import { SupabaseStorageProvider } from "./modules/portfolio/providers/supabase-storage.provider";
import { createSupabaseStorageClient } from "./infrastructure/supabase/supabase-storage.client";
import { SourceRecordRepository } from "./modules/search-index/repositories/source-record.repository";
import { SearchIndexJobRepository } from "./modules/search-index/repositories/search-index-job.repository";
import { SiteChunkRepository } from "./modules/search-index/repositories/site-chunk.repository";
import { SearchIndexService } from "./modules/search-index/services/search-index.service";
import { SiteSearchService } from "./modules/search-index/services/site-search.service";
import type { ISearchIndexService } from "./modules/search-index/interfaces/search-index.service.interface";
import type { ISiteSearchService } from "./modules/search-index/interfaces/site-search.service.interface";
import { GoogleCalendarProvider } from "./infrastructure/google-calendar/google-calendar.provider";
import { getAdminEmail, getGoogleCalendarConfig, getWorkflowSecret } from "./infrastructure/config/env";
import { createSupabaseAuthClient } from "./infrastructure/supabase/supabase-auth.client";
import { SupabaseAuthProvider } from "./modules/admin-auth/providers/supabase-auth.provider";
import { AdminAuthService } from "./modules/admin-auth/services/admin-auth.service";
import type { IAdminAuthService } from "./modules/admin-auth/interfaces/admin-auth.service.interface";
import { MeetingRepository } from "./modules/meeting/repositories/meeting.repository";
import { MeetingService } from "./modules/meeting/services/meeting.service";
import type { IMeetingService } from "./modules/meeting/interfaces/meeting.service.interface";
import { WorkflowService } from "./modules/assistant/services/workflow.service";
import type { IWorkflowService } from "./modules/assistant/interfaces/workflow.service.interface";

const openai = new OpenAIProvider(createOpenAIClient(), getEmbeddingModel(), getResponseModel());

const contentBlocks = new ContentBlockRepository(prisma);

const experiences = new ExperienceRepository(prisma);

const profiles = new ProfileRepository(prisma);

const projects = new ProjectRepository(prisma);

export const iconBlockRepository = new IconBlockRepository(prisma);
export const mediaBlockRepository = new MediaBlockRepository(prisma);
export const actionBlockRepository = new ActionBlockRepository(prisma);

const sources = new SourceRecordRepository(prisma);

const chunks = new SiteChunkRepository(prisma);

const jobs = new SearchIndexJobRepository(prisma);

const meetingRepository = new MeetingRepository(prisma);

const googleCalendar = new GoogleCalendarProvider(getGoogleCalendarConfig);

const workflow: IWorkflowService = new WorkflowService(getWorkflowSecret);

const adminAuthProvider = new SupabaseAuthProvider(createSupabaseAuthClient);

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
  workflow,
);
export const homeService: IHomeService = new HomeService(profiles, contentBlocks, projects);
export const workService: IWorkService = new WorkService(profiles, contentBlocks, projects);
export const aboutService: IAboutService = new AboutService(profiles, contentBlocks, experiences);
export const auditService: IAuditService = new AuditService(contentBlocks, projects);
export const adminAuthService: IAdminAuthService = new AdminAuthService(
  adminAuthProvider,
  getAdminEmail(),
);
export const portfolioAdministrationService: IPortfolioAdministrationService =
  new PortfolioAdministrationService(
    profiles,
    contentBlocks,
    iconBlockRepository,
    actionBlockRepository,
    mediaBlockRepository,
    projects,
    experiences,
  );
export const portfolioMediaService: IPortfolioMediaService = new PortfolioMediaService(
  new SupabaseStorageProvider(createSupabaseStorageClient),
  profiles,
  mediaBlockRepository,
  projects,
  logger,
);
