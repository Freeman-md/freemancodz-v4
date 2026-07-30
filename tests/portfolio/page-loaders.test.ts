import assert from "node:assert/strict";
import test from "node:test";

process.env.DATABASE_URL ??= "postgresql://postgres:postgres@127.0.0.1:5432/postgres";

const block = (key: string, page: "HOME" | "ABOUT", section: string, content: object) =>
  ({ key, page, section, content }) as never;

test("home loader composes validated home content and stored collections", async () => {
  const { prisma } = await import("@/server/infrastructure/database/prisma");
  const { getHomePageData } = await import("@/server/modules/portfolio/services/get-home-page-data.service");
  const originals = { findUnique: prisma.contentBlock.findUnique, service: prisma.service.findMany, principle: prisma.principle.findMany, project: prisma.project.findMany, experience: prisma.experience.findMany };
  prisma.contentBlock.findUnique = (async ({ where }) => ({
    "home.hero": block("home.hero", "HOME", "HERO", { name: "Freeman", headline: "Headline", intro: "Intro", heroNote: "Note" }),
    "home.philosophy": block("home.philosophy", "HOME", "PHILOSOPHY", { philosophyQuestion: "Question" }),
    "home.current-direction": block("home.current-direction", "HOME", "CURRENT_DIRECTION", { currentDirection: "Direction", currentDirectionSupport: "Support" }),
  })[where?.key as string] ?? null) as typeof prisma.contentBlock.findUnique;
  prisma.service.findMany = (async () => [{ title: "Service", lead: "Lead", description: "Description", cta: "CTA", assistantPrompt: null }]) as typeof prisma.service.findMany;
  prisma.principle.findMany = (async () => [{ title: "Principle", body: "Body" }]) as typeof prisma.principle.findMany;
  prisma.project.findMany = (async () => [{ title: "Project", summary: "Summary", category: "Category", role: "Role", outcome: "Outcome", detail: "Detail", future: null, collaboration: null, positioning: null, featured: true, stacks: ["TypeScript"], links: [] }]) as unknown as typeof prisma.project.findMany;
  prisma.experience.findMany = (async () => [{ title: "Experience", company: "Company", dates: "2026", location: null, category: "Category", focus: "Focus" }]) as typeof prisma.experience.findMany;
  try {
    const data = await getHomePageData();
    assert.equal(data.hero.name, "Freeman");
    assert.deepEqual(data.featuredProjects.map((project) => project.title), ["Project"]);
    assert.deepEqual(data.experiences.map((experience) => experience.title), ["Experience"]);
  } finally {
    prisma.contentBlock.findUnique = originals.findUnique;
    prisma.service.findMany = originals.service;
    prisma.principle.findMany = originals.principle;
    prisma.project.findMany = originals.project;
    prisma.experience.findMany = originals.experience;
  }
});

test("work loader preserves project order when grouping featured work", async () => {
  const { prisma } = await import("@/server/infrastructure/database/prisma");
  const { getWorkPageData } = await import("@/server/modules/portfolio/services/get-work-page-data.service");
  const original = prisma.project.findMany;
  prisma.project.findMany = (async () => [
    { title: "Featured", summary: "Summary", category: "Category", role: "Role", outcome: "Outcome", detail: "Detail", future: null, collaboration: null, positioning: null, featured: true, stacks: [], links: [] },
    { title: "Other", summary: "Summary", category: "Category", role: "Role", outcome: "Outcome", detail: "Detail", future: null, collaboration: null, positioning: null, featured: false, stacks: [], links: [] },
  ]) as unknown as typeof prisma.project.findMany;
  try {
    const data = await getWorkPageData();
    assert.deepEqual(data.featuredProjects.map((project) => project.title), ["Featured"]);
    assert.deepEqual(data.otherProjects.map((project) => project.title), ["Other"]);
  } finally {
    prisma.project.findMany = original;
  }
});

test("about loader composes required singleton and ordered section content", async () => {
  const { prisma } = await import("@/server/infrastructure/database/prisma");
  const { getAboutPageData } = await import("@/server/modules/portfolio/services/get-about-page-data.service");
  const originals = { findUnique: prisma.contentBlock.findUnique, findMany: prisma.contentBlock.findMany, principles: prisma.principle.findMany };
  prisma.contentBlock.findUnique = (async ({ where }) => ({
    "about.header": block("about.header", "ABOUT", "ABOUT_HEADER", { aboutHeadline: "About" }),
    "about.education": block("about.education", "ABOUT", "EDUCATION", { current: "Current", previous: "Previous", research: "Research", support: "Support" }),
  })[where?.key as string] ?? null) as typeof prisma.contentBlock.findUnique;
  prisma.contentBlock.findMany = (async ({ where }: { where?: { section?: string } }) => ({
    ABOUT_INTRO: [block("about.intro.0", "ABOUT", "ABOUT_INTRO", { body: "Intro" })],
    WORK_PROCESS: [block("about.work-process.0", "ABOUT", "WORK_PROCESS", { body: "Process" })],
    OUTSIDE_ENGINEERING: [block("about.outside-engineering.0", "ABOUT", "OUTSIDE_ENGINEERING", { title: "Strength", description: "Training" })],
  })[where?.section as string] ?? []) as unknown as typeof prisma.contentBlock.findMany;
  prisma.principle.findMany = (async () => [{ title: "Principle", body: "Body" }]) as typeof prisma.principle.findMany;
  try {
    const data = await getAboutPageData();
    assert.equal(data.header.aboutHeadline, "About");
    assert.deepEqual(data.intro.map((item) => item.body), ["Intro"]);
    assert.deepEqual(data.workProcess.map((item) => item.body), ["Process"]);
    assert.deepEqual(data.outsideEngineering.map((item) => item.title), ["Strength"]);
  } finally {
    prisma.contentBlock.findUnique = originals.findUnique;
    prisma.contentBlock.findMany = originals.findMany;
    prisma.principle.findMany = originals.principles;
  }
});

test("loader surfaces database failures instead of falling back to static data", async () => {
  const { prisma } = await import("@/server/infrastructure/database/prisma");
  const { getWorkPageData } = await import("@/server/modules/portfolio/services/get-work-page-data.service");
  const original = prisma.project.findMany;
  prisma.project.findMany = (async () => { throw new Error("database unavailable"); }) as typeof prisma.project.findMany;
  try {
    await assert.rejects(getWorkPageData(), /database unavailable/);
  } finally {
    prisma.project.findMany = original;
  }
});

test("work loader fails clearly when required projects are absent", async () => {
  const { prisma } = await import("@/server/infrastructure/database/prisma");
  const { getWorkPageData } = await import("@/server/modules/portfolio/services/get-work-page-data.service");
  const original = prisma.project.findMany;
  prisma.project.findMany = (async () => []) as unknown as typeof prisma.project.findMany;
  try {
    await assert.rejects(getWorkPageData(), /Required portfolio projects not found/);
  } finally {
    prisma.project.findMany = original;
  }
});
