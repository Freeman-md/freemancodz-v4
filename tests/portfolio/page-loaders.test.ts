import assert from "node:assert/strict";
import test from "node:test";

process.env.DATABASE_URL ??= "postgresql://postgres:postgres@127.0.0.1:5432/postgres";

const block = (key: string, page: "HOME" | "ABOUT", section: string, content: object) =>
  ({ key, page, section, content }) as never;

test("home loader composes validated home content and stored collections", async () => {
  const { prisma } = await import("@/lib/prisma");
  const { getHomePageData } = await import("@/features/portfolio/loaders/home-page.loader");
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
  const { prisma } = await import("@/lib/prisma");
  const { getWorkPageData } = await import("@/features/portfolio/loaders/work-page.loader");
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

test("loader surfaces database failures instead of falling back to static data", async () => {
  const { prisma } = await import("@/lib/prisma");
  const { getWorkPageData } = await import("@/features/portfolio/loaders/work-page.loader");
  const original = prisma.project.findMany;
  prisma.project.findMany = (async () => { throw new Error("database unavailable"); }) as typeof prisma.project.findMany;
  try {
    await assert.rejects(getWorkPageData(), /database unavailable/);
  } finally {
    prisma.project.findMany = original;
  }
});
