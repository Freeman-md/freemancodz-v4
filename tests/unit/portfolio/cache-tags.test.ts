import assert from "node:assert/strict";
import test from "node:test";
import type {
  ContentBlockNode,
  ExperienceWithIcons,
  ProfileWithCollections,
  ProjectWithCover,
} from "@/server/modules/portfolio/models/portfolio-records";
import {
  getAboutPageCacheTags,
  getAuditPageCacheTags,
  getHomePageCacheTags,
  getWorkPageCacheTags,
  PortfolioCacheTag,
} from "@/server/modules/portfolio/models/portfolio-cache-tag";

const now = new Date("2026-08-12T00:00:00.000Z");

const icon = {
  id: "6b4952f0-3033-44d5-bb92-d7469bd19a31", iconName: "Search", label: "Search",
  copy: null, colour: null, createdAt: now, updatedAt: now,
};

const content: ContentBlockNode = {
  id: "3f4b69ba-b61d-4870-a4d8-65b67790b4da", eyebrow: null, title: "Hero", copy: null,
  url: "/", order: 1, createdAt: now, updatedAt: now,
  iconBlocks: [{ contentBlockId: "3f4b69ba-b61d-4870-a4d8-65b67790b4da", iconBlockId: icon.id, order: 1, iconBlock: icon }],
  mediaBlocks: [], actionBlocks: [], children: [],
};

const profile: ProfileWithCollections = {
  id: "global", name: "Freeman", title: "Engineer", positioning: "Systems",
  email: "f@example.com", linkedInUrl: "https://linkedin.com", githubUrl: "https://github.com",
  coverImage: null, createdAt: now, updatedAt: now, iconCollections: [],
};

const project: ProjectWithCover = {
  id: "8da665e6-e92d-4a36-b9af-e31809229911", slug: "pay4me-withradius", title: "Pay4Me",
  category: "Fintech", problem: "Problem", solution: "Solution", outcome: null, coverId: null,
  externalLinks: [], featured: true, order: 1, markdown: null, visualBlock: "Pay4MeVisual",
  visualText: null, createdAt: now, updatedAt: now, cover: null,
};

const experience: ExperienceWithIcons = {
  id: "a8622835-824a-4625-b1d1-7437938b562c", title: "Experience", tag: null,
  copy: "Copy", insight: null, role: null, startDate: null, endDate: null, order: 1,
  createdAt: now, updatedAt: now, iconBlocks: [],
};

test("portfolio cache tags are stable, entity-scoped and page-scoped", () => {
  assert.equal(PortfolioCacheTag.page("home"), "portfolio:page:home");
  assert.equal(PortfolioCacheTag.project("pay4me-withradius"), "portfolio:project:pay4me-withradius");
  assert.equal(PortfolioCacheTag.contentBlock("block-id"), "portfolio:content-block:block-id");
  assert.notEqual(PortfolioCacheTag.mediaBlock("shared-id"), PortfolioCacheTag.iconBlock("shared-id"));
});

test("shared Project and entity dependencies register on every consuming cached page", () => {
  const projectTag = PortfolioCacheTag.project(project.slug);

  assert.equal(getHomePageCacheTags({ profile, contentBlocks: [content], projects: [project] }).includes(projectTag), true);
  assert.equal(getWorkPageCacheTags({ profile, contentBlocks: [content], projects: [project] }).includes(projectTag), true);
  assert.equal(getAuditPageCacheTags({ contentBlocks: [content], projects: [project] }).includes(projectTag), true);
  assert.equal(getAboutPageCacheTags({ profile, contentBlocks: [content], experiences: [experience] }).includes(projectTag), false);
});

test("page-only blocks remain entity-targeted while collection tags represent membership and order", () => {
  const homeTags = getHomePageCacheTags({ profile, contentBlocks: [content], projects: [project] });

  assert.equal(homeTags.includes(PortfolioCacheTag.contentBlock(content.id)), true);
  assert.equal(homeTags.includes(PortfolioCacheTag.iconBlock(icon.id)), true);
  assert.equal(homeTags.includes(PortfolioCacheTag.projects), true);
  assert.equal(homeTags.includes(PortfolioCacheTag.page("work")), false);
  assert.equal(homeTags.includes(PortfolioCacheTag.experiences), false);
});

test("public cache dependencies contain portfolio content identity only, never admin session identity", () => {
  const tags = getHomePageCacheTags({ profile, contentBlocks: [content], projects: [project] });

  assert.equal(tags.every((tag) => tag.startsWith("portfolio:")), true);
  assert.equal(tags.some((tag) => tag.includes(profile.email)), false);
  assert.equal(tags.some((tag) => /admin|auth|session/i.test(tag)), false);
});
