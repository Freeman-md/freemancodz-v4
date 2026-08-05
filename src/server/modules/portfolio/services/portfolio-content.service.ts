import "server-only";

import type { PortfolioContentScope } from "../../../../../content/portfolio";
import type { IPortfolioContentRepository } from "../interfaces/portfolio-content.repository.interface";
import type {
  IPortfolioContentService,
  PortfolioContentSyncResult,
} from "../interfaces/portfolio-content.service.interface";
import { validatePortfolioContentScopes } from "../schemas/portfolio-content.schema";

export class PortfolioContentService implements IPortfolioContentService {
  constructor(private readonly repository: IPortfolioContentRepository) {}

  async sync(scopes: PortfolioContentScope[]): Promise<PortfolioContentSyncResult> {
    validatePortfolioContentScopes(scopes);
    const result = { scopes, inserted: 0, updated: 0, unchanged: 0 };

    for (const scope of scopes) {
      const counts = await this.repository.sync(scope);

      result.inserted += counts.inserted;
      result.updated += counts.updated;
      result.unchanged += counts.unchanged;
    }

    return result;
  }
}
