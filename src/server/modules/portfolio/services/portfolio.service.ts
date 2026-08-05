import "server-only";
import type { IContentBlockRepository } from "../interfaces/content-block.repository.interface";
import type { IExperienceRepository } from "../interfaces/experience.repository.interface";
import type { IPortfolioServiceRepository } from "../interfaces/portfolio-service.repository.interface";
import type { IPortfolioService } from "../interfaces/portfolio.service.interface";
import type { IPrincipleRepository } from "../interfaces/principle.repository.interface";
import type { IProjectRepository } from "../interfaces/project.repository.interface";
import type { IVercelBlobProvider } from "../interfaces/vercel-blob.provider.interface";
import {
  mapAboutHeaderBlock,
  mapEducationBlock,
  mapHomeAuditOfferBlock,
  mapHomeFinalCtaBlock,
  mapHomeProofOfWorkBlock,
  mapHomeServicesIntroBlock,
  mapHeroBlock,
  mapOutsideEngineeringBlock,
  mapTextBlock,
} from "../mappers/content-block.mapper";
import { mapPrinciple, mapProject, mapService } from "../mappers/portfolio-view.mapper";
import type { PortfolioAsset } from "../models/portfolio-asset";
import type { AboutPageData, HomePageData, WorkPageData } from "../models/portfolio-view";

export class PortfolioService implements IPortfolioService {
  constructor(
    private readonly contentBlocks: IContentBlockRepository,
    private readonly experiences: IExperienceRepository,
    private readonly principles: IPrincipleRepository,
    private readonly projects: IProjectRepository,
    private readonly services: IPortfolioServiceRepository,
    private readonly blob: IVercelBlobProvider,
  ) {}

  async getHomePageData(): Promise<HomePageData> {
    const [hero, servicesIntro, proofBlock, auditOffer, finalCta, services, projects] =
      await Promise.all([
        this.contentBlocks.findRequiredByKey("home.hero"),
        this.contentBlocks.findRequiredByKey("home.services-intro"),
        this.contentBlocks.findRequiredByKey("home.proof-of-work"),
        this.contentBlocks.findRequiredByKey("home.audit-offer"),
        this.contentBlocks.findRequiredByKey("home.final-cta"),
        this.services.findAll(),
        this.projects.findAll(),
      ]);

    const proofContent = mapHomeProofOfWorkBlock(proofBlock);

    const projectsByKey = new Map(
      projects.map(mapProject).map((project) => [project.key, project]),
    );

    const proof = {
      title: proofContent.title,
      copy: proofContent.copy,
      items: proofContent.items.map((item) => {
        const project = projectsByKey.get(item.projectKey);

        if (!project || !project.positioning) {
          throw new Error(`Required homepage proof project not found: ${item.projectKey}`);
        }

        return {
          action: item.action,
          project: {
            key: project.key,
            title: project.title,
            category: project.category,
            problem: project.positioning,
            whatIBuilt: project.detail,
            outcome: project.outcome,
          },
        };
      }),
    };

    return {
      hero: mapHeroBlock(hero),
      servicesIntro: mapHomeServicesIntroBlock(servicesIntro),
      proof,
      auditOffer: mapHomeAuditOfferBlock(auditOffer),
      finalCta: mapHomeFinalCtaBlock(finalCta),
      services: services.map(mapService),
    };
  }

  async getWorkPageData(): Promise<WorkPageData> {
    const projects = (await this.projects.findAll()).map(mapProject);

    if (!projects.length) {
      throw new Error("Required portfolio projects not found");
    }

    return {
      featuredProjects: projects.filter((project) => project.featured),
      otherProjects: projects.filter((project) => !project.featured),
    };
  }

  async getAboutPageData(): Promise<AboutPageData> {
    const [header, education, intro, workProcess, outsideEngineering, principles] =
      await Promise.all([
        this.contentBlocks.findRequiredByKey("about.header"),
        this.contentBlocks.findRequiredByKey("about.education"),
        this.contentBlocks.findBySection("ABOUT", "ABOUT_INTRO"),
        this.contentBlocks.findBySection("ABOUT", "WORK_PROCESS"),
        this.contentBlocks.findBySection("ABOUT", "OUTSIDE_ENGINEERING"),
        this.principles.findBySection("about"),
      ]);

    return {
      header: mapAboutHeaderBlock(header),
      education: mapEducationBlock(education),
      intro: intro.map(mapTextBlock),
      workProcess: workProcess.map(mapTextBlock),
      outsideEngineering: outsideEngineering.map(mapOutsideEngineeringBlock),
      principles: principles.map(mapPrinciple),
    };
  }

  async getAsset(pathname: string): Promise<PortfolioAsset> {
    const result = await this.blob.getPrivate(pathname);

    return result === null || result.stream === null
      ? { kind: "missing" }
      : { kind: "stream", stream: result.stream, contentType: result.blob.contentType ?? null };
  }
}
