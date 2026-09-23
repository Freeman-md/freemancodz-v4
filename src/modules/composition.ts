import "server-only";

import {
  getAdminEmail,
  getGoogleCalendarConfig,
  getRateLimitHmacSecret,
  getResendConfig,
} from "@/infrastructure/config/env";
import { prisma } from "@/infrastructure/database/prisma";
import { GoogleCalendarClient } from "@/infrastructure/google-calendar/client";
import { logger } from "@/infrastructure/logging/logger";
import { ResendClient } from "@/infrastructure/resend/client";
import {
  OpenAIClient,
  createOpenAIClient,
  getEmbeddingModel,
  getResponseModel,
} from "@/infrastructure/openai/client";
import {
  createSupabaseAdminAuthClient,
  createSupabaseAuthClient,
  createSupabaseStorageClient,
} from "@/infrastructure/supabase/clients";
import { AdminAuthService } from "./admin-auth/service";
import { SupabaseAuth } from "@/infrastructure/supabase/auth";
import { AssistantService } from "./assistant/service";
import { GLOBAL_ASSISTANT_TOOLS } from "./assistant/tools/definitions";
import { AuditRequestRepository } from "./audit/repository";
import { AuditService as AuditRequestService } from "./audit/service";
import { ContactRequestRepository } from "./contact/repository";
import { ContactService } from "./contact/service";
import { MeetingRepository } from "./meeting/repository";
import { MeetingService } from "./meeting/service";
import { NotificationService } from "./notification/service";
import { ActionBlockRepository } from "./portfolio/repositories/action-block.repository";
import { ContentBlockRepository } from "./portfolio/repositories/content-block.repository";
import { ExperienceRepository } from "./portfolio/repositories/experience.repository";
import { IconBlockRepository } from "./portfolio/repositories/icon-block.repository";
import { MediaBlockRepository } from "./portfolio/repositories/media-block.repository";
import { ProfileRepository } from "./portfolio/repositories/profile.repository";
import { ProjectRepository } from "./portfolio/repositories/project.repository";
import { SupabaseStorageProvider } from "@/infrastructure/supabase/storage";
import { PortfolioAdministrationService } from "./portfolio/administration";
import { PortfolioMediaService } from "./portfolio/media";
import { PortfolioService } from "./portfolio/service";
import { RateLimitRepository } from "./rate-limit/repository";
import { RateLimitService } from "./rate-limit/service";
import { SearchIndexJobRepository } from "./search-index/repositories/search-index-job.repository";
import { SiteChunkRepository } from "./search-index/repositories/site-chunk.repository";
import { SearchIndexService } from "./search-index/service";
import { SiteSearchService } from "./search-index/search";
import { AuditWorkflowDefinition } from "./workflow/definitions/audit/audit.definition";
import { ContactWorkflowDefinition } from "./workflow/definitions/contact/contact.definition";
import { MeetingBookingWorkflowDefinition } from "./workflow/definitions/meeting-booking/meeting-booking.definition";
import { WorkflowInstanceRepository } from "./workflow/repository";
import { WorkflowService } from "./workflow/service";
import { WorkflowDefinitionRegistry } from "./workflow/registry";

const openAIProvider = new OpenAIClient(createOpenAIClient, getEmbeddingModel, getResponseModel);

export { logger };

export const adminAuthService = new AdminAuthService(
  new SupabaseAuth(createSupabaseAuthClient, createSupabaseAdminAuthClient),
  getAdminEmail(),
  logger,
);

const resendClient = new ResendClient(getResendConfig);

const notificationService = new NotificationService(
  resendClient,
  () => ({ adminEmail: getAdminEmail(), fromEmail: getResendConfig().fromEmail }),
  logger,
);

export const auditRequestService = new AuditRequestService(
  new AuditRequestRepository(prisma),
  notificationService,
);

export const contactService = new ContactService(
  new ContactRequestRepository(prisma),
  notificationService,
);

export const meetingService = new MeetingService(
  new GoogleCalendarClient(getGoogleCalendarConfig),
  new MeetingRepository(prisma),
  logger,
  notificationService,
);

const contentBlockRepository = new ContentBlockRepository(prisma);

const experienceRepository = new ExperienceRepository(prisma);

const profileRepository = new ProfileRepository(prisma);

const projectRepository = new ProjectRepository(prisma);

const iconBlockRepository = new IconBlockRepository(prisma);

const mediaBlockRepository = new MediaBlockRepository(prisma);

const actionBlockRepository = new ActionBlockRepository(prisma);

export const portfolioService = new PortfolioService(
  profileRepository,
  contentBlockRepository,
  projectRepository,
  experienceRepository,
);
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
  portfolioService,
  chunkRepository,
  jobRepository,
  openAIProvider,
  logger,
);
export const siteSearchService = new SiteSearchService(chunkRepository);

const workflowRegistry = new WorkflowDefinitionRegistry([
  new AuditWorkflowDefinition(auditRequestService),
  new ContactWorkflowDefinition(contactService),
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
