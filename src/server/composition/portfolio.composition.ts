import "server-only";

import { prisma } from "../infrastructure/database/prisma";
import { createSupabaseStorageClient } from "../infrastructure/supabase/supabase-storage.client";
import type { IAboutService } from "../modules/portfolio/interfaces/about.service.interface";
import type { IAuditService } from "../modules/portfolio/interfaces/audit.service.interface";
import type { IHomeService } from "../modules/portfolio/interfaces/home.service.interface";
import type { IPortfolioAdministrationService } from "../modules/portfolio/interfaces/portfolio-administration.service.interface";
import type { IPortfolioMediaService } from "../modules/portfolio/interfaces/portfolio-media.service.interface";
import type { IProfileService } from "../modules/portfolio/interfaces/profile.service.interface";
import type { IWorkService } from "../modules/portfolio/interfaces/work.service.interface";
import { SupabaseStorageProvider } from "../modules/portfolio/providers/supabase-storage.provider";
import { ActionBlockRepository } from "../modules/portfolio/repositories/action-block.repository";
import { ContentBlockRepository } from "../modules/portfolio/repositories/content-block.repository";
import { ExperienceRepository } from "../modules/portfolio/repositories/experience.repository";
import { IconBlockRepository } from "../modules/portfolio/repositories/icon-block.repository";
import { MediaBlockRepository } from "../modules/portfolio/repositories/media-block.repository";
import { ProfileRepository } from "../modules/portfolio/repositories/profile.repository";
import { ProjectRepository } from "../modules/portfolio/repositories/project.repository";
import { AboutService } from "../modules/portfolio/services/about.service";
import { AuditService } from "../modules/portfolio/services/audit.service";
import { HomeService } from "../modules/portfolio/services/home.service";
import { PortfolioAdministrationService } from "../modules/portfolio/services/portfolio-administration.service";
import { PortfolioMediaService } from "../modules/portfolio/services/portfolio-media.service";
import { ProfileService } from "../modules/portfolio/services/profile.service";
import { WorkService } from "../modules/portfolio/services/work.service";
import { logger } from "./logging.composition";

const contentBlockRepository = new ContentBlockRepository(prisma);

const experienceRepository = new ExperienceRepository(prisma);

const profileRepository = new ProfileRepository(prisma);

const projectRepository = new ProjectRepository(prisma);

const iconBlockRepository = new IconBlockRepository(prisma);

const mediaBlockRepository = new MediaBlockRepository(prisma);

const actionBlockRepository = new ActionBlockRepository(prisma);

const storageProvider = new SupabaseStorageProvider(createSupabaseStorageClient);

export const homeService: IHomeService = new HomeService(
  profileRepository,
  contentBlockRepository,
  projectRepository,
);
export const workService: IWorkService = new WorkService(
  profileRepository,
  contentBlockRepository,
  projectRepository,
);
export const aboutService: IAboutService = new AboutService(
  profileRepository,
  contentBlockRepository,
  experienceRepository,
);
export const profileService: IProfileService = new ProfileService(profileRepository);
export const auditService: IAuditService = new AuditService(contentBlockRepository, projectRepository);
export const portfolioAdministrationService: IPortfolioAdministrationService =
  new PortfolioAdministrationService(
    profileRepository,
    contentBlockRepository,
    iconBlockRepository,
    actionBlockRepository,
    mediaBlockRepository,
    projectRepository,
    experienceRepository,
  );
export const portfolioMediaService: IPortfolioMediaService = new PortfolioMediaService(
  storageProvider,
  profileRepository,
  mediaBlockRepository,
  projectRepository,
  logger,
);
