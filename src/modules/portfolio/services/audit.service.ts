import "server-only";
import type { IAuditService } from "../interfaces/audit.service.interface";
import type { IContentBlockRepository } from "../interfaces/content-block.repository.interface";
import type { IProjectRepository } from "../interfaces/project.repository.interface";
const AUDIT_PROJECTS = ["pay4me-withradius", "portfolio-assistant", "email-pa"];

export class AuditService implements IAuditService {
  constructor(
    private readonly contentBlocks: IContentBlockRepository,
    private readonly projects: IProjectRepository,
  ) {}

  async getPageData() {
    const [blocks, projects] = await Promise.all([
      this.contentBlocks.findPageTree("/audit"),
      this.projects.findBySlugs(AUDIT_PROJECTS),
    ]);

    return { contentBlocks: blocks, projects };
  }
}
