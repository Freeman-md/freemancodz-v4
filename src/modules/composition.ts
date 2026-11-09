import "server-only";

import {
  getNotificationOwnerEmail,
  getGoogleCalendarConfig,
  getRateLimitHmacSecret,
  getResendConfig,
} from "@/infrastructure/config/env";
import { createPrismaClient, prisma } from "@/infrastructure/database/prisma";
import { GoogleCalendarClient } from "@/infrastructure/google-calendar/client";
import { logger } from "@/infrastructure/logging/logger";
import { ResendClient } from "@/infrastructure/resend/client";
import { OpenAIClient, createOpenAIClient, getResponseModel } from "@/infrastructure/openai/client";
import { AssistantService } from "./assistant/service";
import { GLOBAL_ASSISTANT_TOOLS } from "./assistant/tools/definitions";
import { AuditRequestRepository } from "./audit/repository";
import { AuditService as AuditRequestService } from "./audit/service";
import { ContactRequestRepository } from "./contact/repository";
import { ContactService } from "./contact/service";
import { MeetingRepository } from "./meeting/repository";
import { MeetingService } from "./meeting/service";
import { NotificationService } from "./notification/service";
import { PrismaPublicPortfolioRepository } from "./portfolio/repositories/public-portfolio.repository";
import { PublicPortfolioService } from "./portfolio/services/public-portfolio.service";
import { PrismaPortfolioSeedRepository } from "./portfolio/repositories/portfolio-seed.repository";
import { PortfolioSeedService } from "./portfolio/seed.service";
import { RateLimitRepository } from "./rate-limit/repository";
import { RateLimitService } from "./rate-limit/service";
import { AuditWorkflowDefinition } from "./workflow/definitions/audit/audit.definition";
import { AuditWorkflowProgressProjector } from "./workflow/definitions/audit/audit.progress";
import { ContactWorkflowDefinition } from "./workflow/definitions/contact/contact.definition";
import { ContactWorkflowProgressProjector } from "./workflow/definitions/contact/contact.progress";
import { MeetingBookingWorkflowDefinition } from "./workflow/definitions/meeting-booking/meeting-booking.definition";
import { MeetingBookingWorkflowProgressProjector } from "./workflow/definitions/meeting-booking/meeting-booking.progress";
import { WorkflowInstanceRepository } from "./workflow/repository";
import { WorkflowService } from "./workflow/service";
import { WorkflowDefinitionRegistry } from "./workflow/registry";

// Shared infrastructure
const openAIProvider = new OpenAIClient(createOpenAIClient, getResponseModel);

export { logger };

// Notifications
const resendClient = new ResendClient(getResendConfig);

const notificationService = new NotificationService(
  resendClient,
  () => ({ adminEmail: getNotificationOwnerEmail(), fromEmail: getResendConfig().fromEmail }),
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
export const publicPortfolioService = new PublicPortfolioService(
  new PrismaPublicPortfolioRepository(prisma),
);

export function createPortfolioSeedSession(connection: string) {
  const client = createPrismaClient(connection);

  return {
    service: new PortfolioSeedService(new PrismaPortfolioSeedRepository(client)),
    disconnect: () => client.$disconnect(),
  };
}

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
export const assistantService = new AssistantService(openAIProvider, logger, workflowService);
