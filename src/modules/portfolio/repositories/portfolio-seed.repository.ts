import "server-only";
import { isDeepStrictEqual } from "node:util";
import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import type { PortfolioSeed } from "../data/portfolio.schema";
import { ProjectKind } from "@/generated/prisma/enums";
import { PortfolioSeedError } from "../seed.error";

type Change = "insert" | "update" | "skip";
type Row = Record<string, unknown>;
type ChangePlan = { key: string; change: Change; write: () => Promise<unknown> };
type Plan = Record<string, ChangePlan[]>;

function planRows<T extends Row>(
  desired: readonly T[],
  existing: readonly Row[],
  key: (row: Row) => string,
  write: (row: T) => Promise<unknown>,
): ChangePlan[] {
  const byKey = new Map(existing.map((row) => [key(row), row]));

  return desired.map((row) => {
    const id = key(row);

    const stored = byKey.get(id);

    const change = !stored ? "insert" : isDeepStrictEqual(stored, row) ? "skip" : "update";

    return { key: id, change, write: () => write(row) };
  });
}

function projectKey(row: Row) {
  return String(row.projectSlug);
}

function linkKey(row: Row) {
  return `${row.projectSlug}/${row.serviceKey}`;
}

export class PrismaPortfolioSeedRepository {
  constructor(private readonly db: PrismaClient) {}

  run(batch: PortfolioSeed, apply: boolean) {
    return this.db.$transaction(
      async (tx) => {
        if (!apply) {
          await tx.$executeRaw`SET TRANSACTION READ ONLY`;
        }

        const [profiles, projects, caseStudies, experience, services, links] = await Promise.all([
          tx.profile.findMany(),
          tx.project.findMany(),
          tx.projectCaseStudy.findMany(),
          tx.experience.findMany(),
          tx.service.findMany(),
          tx.projectService.findMany(),
        ]);

        const projectSlugs = new Set([...projects, ...batch.projects].map(({ slug }) => slug));

        const serviceKeys = new Set([...services, ...batch.services].map(({ key }) => key));

        for (const { projectSlug } of batch.caseStudies) {
          if (!projectSlugs.has(projectSlug)) {
            throw new PortfolioSeedError(
              `Case study ${projectSlug} references an unknown project.`,
            );
          }
        }

        const desiredLinks = batch.projects.flatMap(({ slug, serviceKeys: keys }) =>
          keys.map((serviceKey, index) => {
            if (!serviceKeys.has(serviceKey)) {
              throw new PortfolioSeedError(
                `Project ${slug} references unknown service ${serviceKey}.`,
              );
            }

            return { projectSlug: slug, serviceKey, position: index + 1 };
          }),
        );

        const editedLinks = new Set(desiredLinks.map(linkKey));

        const retainedPositions = new Set(
          links
            .filter((link) => !editedLinks.has(linkKey(link)))
            .map(({ projectSlug, position }) => `${projectSlug}/${position}`),
        );

        for (const { projectSlug, position } of desiredLinks) {
          if (retainedPositions.has(`${projectSlug}/${position}`)) {
            throw new PortfolioSeedError(
              `Project ${projectSlug} position ${position} is occupied by a retained link.`,
            );
          }
        }

        const projectRows = batch.projects.map(({ serviceKeys: _keys, ...row }) => ({
          ...row,
          kind: row.kind === "exploration" ? ProjectKind.EXPLORATION : ProjectKind.REAL_PROJECT,
          company: row.company ?? null,
          featured: row.featured ?? null,
        }));

        const studyRows = batch.caseStudies.map((row) => ({
          ...row,
          serviceOffer: row.serviceOffer ?? null,
        }));

        const byKey = (row: Row) => String(row.key);

        const plan: Plan = {
          profile: planRows([batch.profile], profiles, byKey, (data) =>
            tx.profile.upsert({ where: { key: data.key }, create: data, update: data }),
          ),
          experience: planRows(batch.experience, experience, byKey, (data) =>
            tx.experience.upsert({ where: { key: data.key }, create: data, update: data }),
          ),
          services: planRows(batch.services, services, byKey, (data) =>
            tx.service.upsert({ where: { key: data.key }, create: data, update: data }),
          ),
          projects: planRows(
            projectRows,
            projects,
            (row) => String(row.slug),
            (row) => {
              const data = { ...row, featured: row.featured ?? Prisma.DbNull };

              return tx.project.upsert({ where: { slug: data.slug }, create: data, update: data });
            },
          ),
          caseStudies: planRows(studyRows, caseStudies, projectKey, (row) => {
            const data = { ...row, serviceOffer: row.serviceOffer ?? Prisma.DbNull };

            return tx.projectCaseStudy.upsert({
              where: { projectSlug: data.projectSlug },
              create: data,
              update: data,
            });
          }),
          projectServices: planRows(
            desiredLinks,
            links,
            linkKey,
            ({ projectSlug, serviceKey, position }) =>
              tx.projectService.upsert({
                where: { projectSlug_serviceKey: { projectSlug, serviceKey } },
                create: { projectSlug, serviceKey, position },
                update: { position },
              }),
          ),
        };

        if (apply) {
          // A batch can swap two existing positions without deleting either link.
          await tx.$executeRaw`SET CONSTRAINTS portfolio_project_services_project_slug_position_key DEFERRED`;
          for (const { change, write } of Object.values(plan).flat()) {
            if (change !== "skip") {
              await write();
            }
          }
        }

        return Object.entries(plan).flatMap(([record, rows]) =>
          rows.map(({ key, change }) => ({ record, key, change })),
        );
      },
      {
        isolationLevel: apply
          ? Prisma.TransactionIsolationLevel.Serializable
          : Prisma.TransactionIsolationLevel.RepeatableRead,
      },
    );
  }
}
