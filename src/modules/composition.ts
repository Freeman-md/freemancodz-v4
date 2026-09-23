import "server-only";

import { getAdminEmail, getGoogleCalendarConfig, getRateLimitHmacSecret } from "@/infrastructure/config/env";
import { prisma } from "@/infrastructure/database/prisma";
import { GoogleCalendarProvider } from "@/infrastructure/google-calendar/google-calendar.provider";
import { logger } from "@/infrastructure/logging/logger";
import { createOpenAIClient, getEmbeddingModel, getResponseModel } from "@/infrastructure/openai/openai.client";
import { OpenAIProvider } from "@/infrastructure/openai/openai.provider";
import { createSupabaseAdminAuthClient } from "@/infrastructure/supabase/supabase-admin-auth.client";
import { createSupabaseAuthClient } from "@/infrastructure/supabase/supabase-auth.client";
import { createSupabaseStorageClient } from "@/infrastructure/supabase/supabase-storage.client";
import { AdminAuthService } from "./admin-auth/service";
import { SupabaseAuth } from "@/infrastructure/supabase/auth";
import { AssistantService } from "./assistant/service";
import { GLOBAL_ASSISTANT_TOOLS } from "./assistant/tools/definitions";
import { AuditRequestRepository } from "./audit/repository";
import { AuditService as AuditRequestService } from "./audit/service";
import { MeetingRepository } from "./meeting/repository";
import { MeetingService } from "./meeting/service";
import { ActionBlockRepository } from "./portfolio/repositories/action-block.repository";
import { ContentBlockRepository } from "./portfolio/repositories/content-block.repository";
import { ExperienceRepository } from "./portfolio/repositories/experience.repository";
import { IconBlockRepository } from "./portfolio/repositories/icon-block.repository";
import { MediaBlockRepository } from "./portfolio/repositories/media-block.repository";
import { ProfileRepository } from "./portfolio/repositories/profile.repository";
import { ProjectRepository } from "./portfolio/repositories/project.repository";
import { SupabaseStorageProvider } from "./portfolio/providers/supabase-storage.provider";
import { AboutService } from "./portfolio/services/about.service";
import { AuditService } from "./portfolio/services/audit.service";
import { HomeService } from "./portfolio/services/home.service";
import { PortfolioAdministrationService } from "./portfolio/services/portfolio-administration.service";
import { PortfolioMediaService } from "./portfolio/services/portfolio-media.service";
import { ProfileService } from "./portfolio/services/profile.service";
import { WorkService } from "./portfolio/services/work.service";
import { RateLimitRepository } from "./rate-limit/repository";
import { RateLimitService } from "./rate-limit/service";
import { SearchIndexJobRepository } from "./search-index/repositories/search-index-job.repository";
import { SiteChunkRepository } from "./search-index/repositories/site-chunk.repository";
import { SearchIndexService } from "./search-index/services/search-index.service";
import { SiteSearchService } from "./search-index/services/site-search.service";
import { AuditWorkflowDefinition } from "./workflow/definitions/audit/audit.definition";
import { MeetingBookingWorkflowDefinition } from "./workflow/definitions/meeting-booking/meeting-booking.definition";
import { WorkflowInstanceRepository } from "./workflow/repositories/workflow-instance.repository";
import { WorkflowService } from "./workflow/services/workflow.service";
import { WorkflowDefinitionRegistry } from "./workflow/workflow-definition.registry";

const openAIProvider = new OpenAIProvider(createOpenAIClient, getEmbeddingModel, getResponseModel);

export { logger };

export const adminAuthService = new AdminAuthService(
  new SupabaseAuth(createSupabaseAuthClient, createSupabaseAdminAuthClient),
  getAdminEmail(),
  logger,
);

export const auditRequestService = new AuditRequestService(new AuditRequestRepository(prisma));

export const meetingService = new MeetingService(
  new GoogleCalendarProvider(getGoogleCalendarConfig),
  new MeetingRepository(prisma),
  logger,
);

const contentBlockRepository = new ContentBlockRepository(prisma);
const experienceRepository = new ExperienceRepository(prisma);
const profileRepository = new ProfileRepository(prisma);
const projectRepository = new ProjectRepository(prisma);
const iconBlockRepository = new IconBlockRepository(prisma);
const mediaBlockRepository = new MediaBlockRepository(prisma);
const actionBlockRepository = new ActionBlockRepository(prisma);

export const homeService = new HomeService(
  profileRepository,
  contentBlockRepository,
  projectRepository,
);
export const workService = new WorkService(
  profileRepository,
  contentBlockRepository,
  projectRepository,
);
export const aboutService = new AboutService(
  profileRepository,
  contentBlockRepository,
  experienceRepository,
);
export const profileService = new ProfileService(profileRepository);
export const auditService = new AuditService(contentBlockRepository, projectRepository);
export const portfolioAdministrationService = new PortfolioAdministrationService(
  profileRepository,
  contentBlockRepository,
  iconBlockRepository,
  actionBlockRepository,
  mediaBlockRepository,
  projectRepository,
  experienceRepository,
);
export const portfolioMediaService = new PortfolioMediaService(
  new SupabaseStorageProvider(createSupabaseStorageClient),
  profileRepository,
  mediaBlockRepository,
  projectRepository,
  logger,
);

const chunkRepository = new SiteChunkRepository(prisma);
const jobRepository = new SearchIndexJobRepository(prisma);

export const searchIndexService = new SearchIndexService(
  { home: homeService, work: workService, about: aboutService, audit: auditService },
  chunkRepository,
  jobRepository,
  openAIProvider,
  logger,
);
export const siteSearchService = new SiteSearchService(chunkRepository);

const workflowRegistry = new WorkflowDefinitionRegistry([
  new AuditWorkflowDefinition(auditRequestService),
  new MeetingBookingWorkflowDefinition(meetingService),
]);
export const workflowService = new WorkflowService(
  workflowRegistry,
  new WorkflowInstanceRepository(prisma),
  GLOBAL_ASSISTANT_TOOLS.map(({ name }) => name),
);

export const rateLimitService = new RateLimitService(
  new RateLimitRepository(prisma),
  getRateLimitHmacSecret,
);

export const assistantService = new AssistantService(
  openAIProvider,
  siteSearchService,
  logger,
  workflowService,
);
