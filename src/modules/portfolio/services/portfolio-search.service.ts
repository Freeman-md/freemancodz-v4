import "server-only";

import type { AssistantSource } from "@/contracts/assistant.contract";
import { stableKey } from "../data/portfolio.schema";
import { technologyLabels } from "../data/technology-labels";
import type { PublicPortfolioRepository } from "../repositories/public-portfolio.repository";

export type SearchDocument = {
  key: string;
  sourceKind: "project" | "experience" | "service" | "profile";
  sourceKey: string;
  title: string;
  excerpt: string;
};

export type EmbeddedDocument = SearchDocument & { embedding: readonly number[] };

export interface PortfolioSearchRepository {
  replace(documents: readonly EmbeddedDocument[]): Promise<void>;
  find(embedding: readonly number[], maxDistance: number, limit: number): Promise<SearchDocument[]>;
}

export interface PortfolioEmbedder {
  embed(inputs: readonly string[], signal?: AbortSignal): Promise<readonly (readonly number[])[]>;
}

const maxDistance = 0.62;

const maxResults = 4;

export class PortfolioSearchService {
  constructor(
    private readonly repository: Pick<PortfolioSearchRepository, "find">,
    private readonly embedder: PortfolioEmbedder,
  ) {}

  async search(query: string, signal: AbortSignal) {
    const [embedding] = await embedBatch(this.embedder, [query], signal);

    const matches = await this.repository.find(embedding, maxDistance, maxResults);

    return matches.slice(0, maxResults).flatMap((record) => {
      const source = portfolioSource(record);

      return source ? [{ excerpt: record.excerpt, source }] : [];
    });
  }
}

export class PortfolioIndexService {
  constructor(
    private readonly portfolio: Pick<
      PublicPortfolioRepository,
      "getProfile" | "listProjects" | "findProject" | "listExperienceStops" | "listServices"
    >,
    private readonly repository: Pick<PortfolioSearchRepository, "replace">,
    private readonly embedder: PortfolioEmbedder,
  ) {}

  async refresh(apply: boolean) {
    const [profile, projects, experience, services] = await Promise.all([
      this.portfolio.getProfile(),
      this.portfolio.listProjects(),
      this.portfolio.listExperienceStops(),
      this.portfolio.listServices(),
    ]);

    if (!profile || !projects.length || !experience.length || !services.length) {
      throw new Error("The published portfolio is incomplete.");
    }

    const publishedProjects = await Promise.all(
      projects.map(({ slug }) => this.portfolio.findProject(slug)),
    );

    if (publishedProjects.some((project) => !project)) {
      throw new Error("A published project could not be read.");
    }

    const documents = [
      ...publishedProjects.flatMap((project) => {
        if (!project) {
          return [];
        }

        const { study } = project;

        return [
          document("project", project.slug, project.title, [
            project.summary,
            project.company,
            project.category,
            study?.role,
            study?.problem,
            study?.contribution,
            study?.outcome,
            ...(study?.capabilities ?? []),
            ...(study?.technologyKeys.map((key) => technologyLabels[key]) ?? []),
          ]),
        ];
      }),
      ...experience.map((stop) =>
        document("experience", stop.key, stop.name, [stop.period, stop.role, ...stop.details]),
      ),
      ...services.map((service) =>
        document("service", service.key, service.title, [service.description, ...service.examples]),
      ),
      document("profile", profile.key, profile.name, [profile.headline]),
    ];

    if (apply) {
      const vectors = await embedBatch(
        this.embedder,
        documents.map(({ excerpt }) => excerpt),
      );

      await this.repository.replace(
        documents.map((record, index) => ({
          ...record,
          embedding: vectors[index],
        })),
      );
    }

    return documents.map(({ key }) => key);
  }
}

function document(
  sourceKind: SearchDocument["sourceKind"],
  sourceKey: string,
  title: string,
  facts: (string | undefined)[],
): SearchDocument {
  const label = {
    project: "Project case study",
    experience: "Work experience",
    service: "Service",
    profile: "Profile",
  }[sourceKind];

  return {
    key: `${sourceKind}:${sourceKey}`,
    sourceKind,
    sourceKey,
    title,
    excerpt: [`${label}: ${title}`, ...facts.filter(Boolean)].join("\n"),
  };
}

function portfolioSource(record: SearchDocument): AssistantSource | null {
  if (!stableKey.safeParse(record.sourceKey).success) {
    return null;
  }

  switch (record.sourceKind) {
    case "project":
      return {
        id: `project:${record.sourceKey}`,
        title: record.title,
        url: `/work/${record.sourceKey}`,
      };
    case "experience":
      return { id: "experience", title: "Experience", url: "/#experience" };
    case "service":
      return { id: "services", title: "Services", url: "/#services" };
    case "profile":
      return { id: "profile", title: "Profile", url: "/#top" };
    default:
      return null;
  }
}

async function embedBatch(
  embedder: PortfolioEmbedder,
  inputs: readonly string[],
  signal?: AbortSignal,
) {
  const result = await embedder.embed(inputs, signal);

  if (
    result.length !== inputs.length ||
    result.some(
      (vector) =>
        vector.length !== 1536 ||
        !vector.every(Number.isFinite) ||
        !vector.some((value) => value !== 0),
    )
  ) {
    throw new Error("The embedding batch did not match the portfolio search format.");
  }

  return result;
}
