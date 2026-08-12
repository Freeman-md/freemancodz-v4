import assert from "node:assert/strict";
import test from "node:test";
import type { IActionBlockAdministrationRepository } from "@/server/modules/portfolio/interfaces/action-block.repository.interface";
import type { IContentBlockAdministrationRepository } from "@/server/modules/portfolio/interfaces/content-block.repository.interface";
import type { IExperienceAdministrationRepository } from "@/server/modules/portfolio/interfaces/experience.repository.interface";
import type { IIconBlockAdministrationRepository } from "@/server/modules/portfolio/interfaces/icon-block.repository.interface";
import type { IMediaBlockAdministrationRepository } from "@/server/modules/portfolio/interfaces/media-block.repository.interface";
import type { IProfileAdministrationRepository } from "@/server/modules/portfolio/interfaces/profile.repository.interface";
import type { IProjectAdministrationRepository } from "@/server/modules/portfolio/interfaces/project.repository.interface";
import { PortfolioAdministrationService } from "@/server/modules/portfolio/services/portfolio-administration.service";

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

function setup(references = 0) {
  const deletedProjects: string[] = [];

  const updatedProjects: string[] = [];

  const deletedIcons: string[] = [];

  const profiles: IProfileAdministrationRepository = {
    findSingleton: async () => { throw new Error("unused"); },
    updateSingleton: async () => undefined,
    updateCoverImage: async () => undefined,
    replaceCollection: async () => undefined,
  };

  const content: IContentBlockAdministrationRepository = {
    findPageTree: async () => [], update: async () => undefined,
    replaceChildren: async () => undefined, replaceIcons: async () => undefined,
    replaceMedia: async () => undefined, replaceActions: async () => undefined,
  };

  const icons: IIconBlockAdministrationRepository = {
    findById: async () => null, findAll: async () => [], create: async () => "icon",
    update: async () => undefined, delete: async (id) => { deletedIcons.push(id); },
    countReferences: async () => ({ contentBlocks: references, profileCollections: 0, experiences: 0, projectCovers: 0 }),
  };

  const actions: IActionBlockAdministrationRepository = {
    findById: async () => null, findAll: async () => [], create: async () => "action",
    update: async () => undefined, delete: async () => undefined,
  };

  const media: IMediaBlockAdministrationRepository = {
    findById: async () => null, findAll: async () => [], create: async () => "media",
    update: async () => undefined, updateSource: async () => undefined, delete: async () => undefined,
  };

  const projects: IProjectAdministrationRepository = {
    findAll: async () => [canonicalProject], findById: async () => canonicalProject,
    findBySlug: async () => canonicalProject, findBySlugs: async () => [canonicalProject],
    findFeatured: async () => [canonicalProject], create: async () => "project",
    update: async (id) => { updatedProjects.push(id); },
    delete: async (id) => { deletedProjects.push(id); },
  };

  const experiences: IExperienceAdministrationRepository = {
    findAll: async () => [], create: async () => "experience", update: async () => undefined,
    replaceIcons: async () => undefined, delete: async () => undefined,
  };

  return {
    service: new PortfolioAdministrationService(
      profiles, content, icons, actions, media, projects, experiences,
    ),
    deletedProjects,
    updatedProjects,
    deletedIcons,
  };
}

test("project updates preserve immutable slug identity and report targeted cache impact", async () => {
  const { service, updatedProjects, deletedProjects } = setup();

  const baseInput = {
    slug: canonicalProject.slug, title: canonicalProject.title, category: canonicalProject.category,
    problem: canonicalProject.problem, solution: canonicalProject.solution, outcome: null,
    externalLinks: [], featured: canonicalProject.featured, order: canonicalProject.order,
    markdown: null, visualBlock: "Pay4MeVisual" as const, visualText: null,
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
  assert.equal((await service.updateProject(canonicalProject.id, { ...baseInput, order: 2 })).collectionChanged, true);
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
