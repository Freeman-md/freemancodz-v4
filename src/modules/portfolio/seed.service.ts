import "server-only";
import { seedPortfolioSchema } from "./data/portfolio.schema";
import type { PrismaPortfolioSeedRepository } from "./repositories/portfolio-seed.repository";
import { PortfolioSeedError } from "./seed.error";

export class PortfolioSeedService {
  constructor(private readonly repository: Pick<PrismaPortfolioSeedRepository, "run">) {}

  async run(input: unknown, apply: boolean) {
    const result = seedPortfolioSchema.safeParse(input);

    if (!result.success) {
      const paths = result.error.issues.map(({ path }) => path.join(".") || "portfolio");

      throw new PortfolioSeedError(`Invalid seed data at ${[...new Set(paths)].join(", ")}.`);
    }

    return this.repository.run(result.data, apply);
  }
}
