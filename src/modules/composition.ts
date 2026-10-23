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
import { PortfolioAdministrationService } from "./portfolio/services/administration.service";
import { PortfolioMediaService } from "./portfolio/services/media.service";
import { PortfolioReadService } from "./portfolio/services/read.service";
import { RateLimitRepository } from "./rate-limit/repository";
import { RateLimitService } from "./rate-limit/service";
import { SearchIndexJobRepository } from "./search-index/repositories/search-index-job.repository";
import { SiteChunkRepository } from "./search-index/repositories/site-chunk.repository";
import { SearchIndexService } from "./search-index/service";
import { SiteSearchService } from "./search-index/search";
import { AuditWorkflowDefinition } from "./workflow/definitions/audit/audit.definition";
import { AuditWorkflowProgressProjector } from "./workflow/definitions/audit/audit.progress";
import { ContactWorkflowDefinition } from "./workflow/definitions/contact/contact.definition";
import { ContactWorkflowProgressProjector } from "./workflow/definitions/contact/contact.progress";
import { MeetingBookingWorkflowDefinition } from "./workflow/definitions/meeting-booking/meeting-booking.definition";
import { MeetingBookingWorkflowProgressProjector } from "./workflow/definitions/meeting-booking/meeting-booking.progress";
import { WorkflowInstanceRepository } from "./workflow/repository";
import { WorkflowService } from "./workflow/service";
import { WorkflowDefinitionRegistry } from "./workflow/registry";

export { PortfolioAdministrationError } from "./portfolio/services/administration.service";

// Shared infrastructure
const openAIProvider = new OpenAIClient(createOpenAIClient, getEmbeddingModel, getResponseModel);

export { logger };

// Admin authentication
export const adminAuthService = new AdminAuthService(
  new SupabaseAuth(createSupabaseAuthClient, createSupabaseAdminAuthClient),
  getAdminEmail(),
  logger,
);

// Notifications
const resendClient = new ResendClient(getResendConfig);

const notificationService = new NotificationService(
  resendClient,
  () => ({ adminEmail: getAdminEmail(), fromEmail: getResendConfig().fromEmail }),
  logger,
);

// Audit, contact, and meetings
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

// Portfolio
const contentBlockRepository = new ContentBlockRepository(prisma);

const experienceRepository = new ExperienceRepository(prisma);

const profileRepository = new ProfileRepository(prisma);

const projectRepository = new ProjectRepository(prisma);

const iconBlockRepository = new IconBlockRepository(prisma);

const mediaBlockRepository = new MediaBlockRepository(prisma);

const actionBlockRepository = new ActionBlockRepository(prisma);

export const portfolioReadService = new PortfolioReadService(
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

// Search indexing
const chunkRepository = new SiteChunkRepository(prisma);

const jobRepository = new SearchIndexJobRepository(prisma);

export const searchIndexService = new SearchIndexService(
  portfolioReadService,
  chunkRepository,
  jobRepository,
  openAIProvider,
  logger,
);
export const siteSearchService = new SiteSearchService(chunkRepository);

// Workflows
const auditWorkflowProgress = new AuditWorkflowProgressProjector();

const contactWorkflowProgress = new ContactWorkflowProgressProjector();

const meetingBookingWorkflowProgress = new MeetingBookingWorkflowProgressProjector();

const workflowRegistry = new WorkflowDefinitionRegistry([
  new AuditWorkflowDefinition(auditRequestService, auditWorkflowProgress),
  new ContactWorkflowDefinition(contactService, contactWorkflowProgress),
  new MeetingBookingWorkflowDefinition(meetingService, meetingBookingWorkflowProgress),
]);

export const workflowService = new WorkflowService(
  workflowRegistry,
  new WorkflowInstanceRepository(prisma),
  GLOBAL_ASSISTANT_TOOLS.map(({ name }) => name),
  logger,
);

// Rate limiting
export const rateLimitService = new RateLimitService(
  new RateLimitRepository(prisma),
  getRateLimitHmacSecret,
);

// Assistant
export const assistantService = new AssistantService(
  openAIProvider,
  siteSearchService,
  logger,
  workflowService,
);
