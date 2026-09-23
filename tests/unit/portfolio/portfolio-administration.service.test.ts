import assert from "node:assert/strict";
import test from "node:test";
import { requiredPortfolioProjectSlugs } from "@/contracts/portfolio-presentation.contract";
import type { IActionBlockAdministrationRepository } from "@/modules/portfolio/interfaces/action-block.repository.interface";
import type { IContentBlockAdministrationRepository } from "@/modules/portfolio/interfaces/content-block.repository.interface";
import type { IExperienceAdministrationRepository } from "@/modules/portfolio/interfaces/experience.repository.interface";
import type { IIconBlockAdministrationRepository } from "@/modules/portfolio/interfaces/icon-block.repository.interface";
import type { IMediaBlockAdministrationRepository } from "@/modules/portfolio/interfaces/media-block.repository.interface";
import type { IProfileAdministrationRepository } from "@/modules/portfolio/interfaces/profile.repository.interface";
import type { IProjectAdministrationRepository } from "@/modules/portfolio/interfaces/project.repository.interface";
import { PortfolioAdministrationService } from "@/modules/portfolio/services/portfolio-administration.service";

const now = new Date("2026-08-12T00:00:00.000Z");

const canonicalProject = {
  id: "3f4b69ba-b61d-4870-a4d8-65b67790b4da",
  slug: "pay4me-withradius",
  title: "Pay4Me / WithRadius",
  category: "Fintech",
  problem: "Problem",
  solution: "Solution",
  outcome: null,
  coverId: null,
  externalLinks: [],
  featured: true,
  order: 1,
  markdown: null,
  visualBlock: "Pay4MeVisual",
  visualText: null,
  createdAt: now,
  updatedAt: now,
  cover: null,
};

function setup(references = 0, project = canonicalProject) {
  const deletedProjects: string[] = [];

  const updatedProjects: string[] = [];

  const deletedIcons: string[] = [];

  const profiles: IProfileAdministrationRepository = {
    findSingleton: async () => {
      throw new Error("unused");
    },
    updateSingleton: async () => undefined,
    updateCoverImage: async () => undefined,
    replaceCollection: async () => undefined,
  };

  const content: IContentBlockAdministrationRepository = {
    findPageTree: async () => [],
    update: async () => undefined,
    replaceChildren: async () => undefined,
    replaceIcons: async () => undefined,
    replaceMedia: async () => undefined,
    replaceActions: async () => undefined,
  };

  const icons: IIconBlockAdministrationRepository = {
    findById: async () => null,
    findAll: async () => [],
    create: async () => "icon",
    update: async () => undefined,
    delete: async (id) => {
      deletedIcons.push(id);
    },
    countReferences: async () => ({
      contentBlocks: references,
      profileCollections: 0,
      experiences: 0,
      projectCovers: 0,
    }),
  };

  const actions: IActionBlockAdministrationRepository = {
    findById: async () => null,
    findAll: async () => [],
    create: async () => "action",
    update: async () => undefined,
    delete: async () => undefined,
  };

  const media: IMediaBlockAdministrationRepository = {
    findById: async () => null,
    findAll: async () => [],
    countSourceReferences: async () => 0,
    create: async () => "media",
    update: async () => undefined,
    updateManagedMedia: async () => undefined,
    delete: async () => undefined,
  };

  const projects: IProjectAdministrationRepository = {
    findAll: async () => [project],
    findById: async () => project,
    findBySlug: async () => project,
    findBySlugs: async () => [project],
    findFeatured: async () => [project],
    create: async () => "project",
    update: async (id) => {
      updatedProjects.push(id);
    },
    delete: async (id) => {
      deletedProjects.push(id);
    },
  };

  const experiences: IExperienceAdministrationRepository = {
    findAll: async () => [],
    create: async () => "experience",
    update: async () => undefined,
    replaceIcons: async () => undefined,
    delete: async () => undefined,
  };

  return {
    service: new PortfolioAdministrationService(
      profiles,
      content,
      icons,
      actions,
      media,
      projects,
      experiences,
    ),
    deletedProjects,
    updatedProjects,
    deletedIcons,
  };
}

test("project updates preserve immutable slug identity and report targeted cache impact", async () => {
  const { service, updatedProjects, deletedProjects } = setup();

  const baseInput = {
    slug: canonicalProject.slug,
    title: canonicalProject.title,
    category: canonicalProject.category,
    problem: canonicalProject.problem,
    solution: canonicalProject.solution,
    outcome: null,
    externalLinks: [],
    featured: canonicalProject.featured,
    order: canonicalProject.order,
    markdown: null,
    visualBlock: "Pay4MeVisual" as const,
    visualText: null,
  };

  assert.deepEqual(await service.updateProject(canonicalProject.id, baseInput), {
    slug: canonicalProject.slug,
    collectionChanged: false,
  });
  assert.deepEqual(updatedProjects, [canonicalProject.id]);

  await assert.rejects(
    () => service.updateProject(canonicalProject.id, { ...baseInput, slug: "renamed" }),
    /immutable/,
  );
  assert.deepEqual(updatedProjects, [canonicalProject.id]);
  await assert.rejects(() => service.deleteProject(canonicalProject.id), /required/);
  assert.deepEqual(deletedProjects, []);
  assert.equal(
    (await service.updateProject(canonicalProject.id, { ...baseInput, order: 2 }))
      .collectionChanged,
    true,
  );
});

test("canonical project and referenced reusable deletion guards fail before repositories delete", async () => {
  const guarded = setup(1);

  await assert.rejects(() => guarded.service.deleteProject(canonicalProject.id), /required/);
  await assert.rejects(() => guarded.service.deleteIconBlock("icon-id"), /referenced/);
  assert.deepEqual(guarded.deletedProjects, []);
  assert.deepEqual(guarded.deletedIcons, []);

  const unreferenced = setup();

  await unreferenced.service.deleteIconBlock("icon-id");
  assert.deepEqual(unreferenced.deletedIcons, ["icon-id"]);
});

test("every Project required by a public adapter is protected from deletion", async () => {
  for (const slug of requiredPortfolioProjectSlugs) {
    const project = { ...canonicalProject, id: `${slug}-id`, slug };

    const guarded = setup(0, project);

    await assert.rejects(() => guarded.service.deleteProject(project.id), /required/);
    assert.deepEqual(guarded.deletedProjects, []);
  }

  const optionalProject = { ...canonicalProject, id: "optional-id", slug: "optional-project" };

  const unguarded = setup(0, optionalProject);

  await unguarded.service.deleteProject(optionalProject.id);
  assert.deepEqual(unguarded.deletedProjects, [optionalProject.id]);
});
