import assert from "node:assert/strict";
import test from "node:test";

import {
  portfolioIconNameSchema,
  projectVisualNameSchema,
} from "@/contracts/portfolio-presentation.contract";
import {
  createAboutPresentationData,
  createAuditPresentationData,
  createHomePresentationData,
  createWorkPresentationData,
} from "@/features/portfolio/models/presentation-adapters";
import type {
  PortfolioContentSource,
  PortfolioExperienceSource,
  PortfolioProfileSource,
  PortfolioProjectSource,
} from "@/features/portfolio/models/portfolio-source";
import {
  experienceSeeds,
  iconSeeds,
  mediaSeeds,
  profileCollections,
} from "../../../prisma/portfolio-seed-data";

const icon = (label: string, iconName = "Search") => ({ iconName, label, copy: null });

function block(
  url: string,
  title: string,
  children: PortfolioContentSource[] = [],
): PortfolioContentSource {
  return {
    url,
    order: 1,
    eyebrow: `${title} eyebrow`,
    title,
    copy: `${title} copy`,
    iconBlocks: [{ order: 2, iconBlock: icon(`${title} second`) }, { order: 1, iconBlock: icon(`${title} first`) }],
    mediaBlocks: [],
    actionBlocks: [],
    children: children.map((child, index) => ({ order: index + 1, child })),
  };
}

const profile: PortfolioProfileSource = {
  name: "Freeman",
  title: "Software engineer",
  positioning: "Products · Workflows",
  coverImage: "/portrait.jpg",
  iconCollections: [
    { collection: "OUTCOMES", order: 1, iconBlock: icon("Outcome") },
    { collection: "AUDIENCE", order: 1, iconBlock: icon("Founders", "Users") },
    { collection: "PRINCIPLES", order: 1, iconBlock: icon("Principle") },
    { collection: "THINKING_PRINCIPLES", order: 1, iconBlock: icon("Thinking") },
    { collection: "PROCESS_PRINCIPLES", order: 1, iconBlock: icon("Process") },
    { collection: "CONTROL_PRINCIPLES", order: 1, iconBlock: icon("Control") },
  ],
};

const projectSlugs = [
  "pay4me-withradius",
  "portfolio-assistant",
  "email-pa",
  "across-the-horizon",
  "shifty",
  "self-healing-backend-operations-system",
];

const projects: PortfolioProjectSource[] = projectSlugs.map((slug) => ({
  slug,
  title: slug,
  category: "Category",
  problem: "Problem",
  solution: "Solution",
  outcome: null,
  externalLinks: [],
  visualBlock: slug === "email-pa" ? "EmailWorkflowVisual" : null,
  visualText: "Visual",
  cover: null,
}));

test("page adapters use URL and hierarchy identities instead of root array position", () => {
  const homeBlocks = [
    block("/#home-closing-heading", "Closing"),
    block("/#home-audit-heading", "Audit", [block("/shared", "Problem"), block("/shared", "Improvement")]),
    block("/#home-relevant-work-heading", "Relevant"),
    block("/#home-improve-heading", "Improve", [block("/shared", "Journey"), block("/shared", "Workflow")]),
    block("/", "Hero"),
  ];

  const home = createHomePresentationData({ profile, contentBlocks: homeBlocks, projects });

  assert.equal(home.hero.title, "Hero");
  assert.equal(home.improve.operationalWorkflow.title, "Workflow");
  assert.deepEqual(home.hero.icons.map(({ label }) => label), ["Hero first", "Hero second"]);

  const workHero = block("/work", "Work hero", [block("/work", "Focus"), block("/work", "Approach")]);

  const connects = block("/work#work-connection-heading", "Connects", [block("/work#work-connection-heading", "Products"), block("/work#work-connection-heading", "Experiences"), block("/work#work-connection-heading", "Workflows")]);

  const work = createWorkPresentationData({
    profile,
    projects,
    contentBlocks: [block("/work#work-cta", "CTA"), connects, block("/work#additional-work-heading", "Additional"), block("/work#case-studies-heading", "Relevant"), workHero],
  });

  assert.equal(work.hero.approach.title, "Approach");
  assert.equal(work.projects.selfHealing.title, "self-healing-backend-operations-system");

  const aboutHero = block("/about", "About hero", [block("/about", "Customer"), block("/about", "System")]);

  const thinking = block("/about#product-thinking-heading", "Thinking", [block("/about#product-thinking-heading", "Customer"), block("/about#product-thinking-heading", "Workflow")]);

  const closing = block("/about#about-closing-heading", "Closing", [block("/about#about-closing-heading", "Work")]);

  const experiences: PortfolioExperienceSource[] = ["Pay4Me", "Today"].map((title, order) => ({ title, order, tag: null, copy: title, insight: null, iconBlocks: [] }));

  const about = createAboutPresentationData({
    profile,
    experiences,
    contentBlocks: [closing, block("/about#outside-engineering-heading", "Outside"), block("/about#exploration-heading", "Explore"), block("/about#work-process-heading", "Process"), thinking, block("/about#about-journey-heading", "Journey"), aboutHero],
  });

  assert.equal(about.hero.system.title, "System");
  assert.deepEqual(about.experiences.map(({ title }) => title), ["Pay4Me", "Today"]);

  const before = block("/audit#friction-heading", "Before", [block("/audit#friction-heading", "Before customer"), block("/audit#friction-heading", "Before workflow")]);

  const after = block("/audit#friction-heading", "After", [block("/audit#friction-heading", "After customer"), block("/audit#friction-heading", "After workflow")]);

  const audit = createAuditPresentationData({
    projects,
    contentBlocks: [block("/audit#audit-cta-heading", "CTA"), block("/audit#proof-heading", "Proof"), block("/audit#friction-heading", "Before after", [before, after]), block("/audit#audit-symptoms-heading", "Symptoms"), block("/audit", "Hero")],
  });

  assert.equal(audit.beforeAfter.after.workflow.title, "After workflow");
});

test("icon and project visual registries accept only approved stored identifiers", () => {
  assert.equal(portfolioIconNameSchema.safeParse("Search").success, true);
  assert.equal(portfolioIconNameSchema.safeParse("UnknownIcon").success, false);
  assert.equal(projectVisualNameSchema.safeParse("Pay4MeVisual").success, true);
  assert.equal(projectVisualNameSchema.safeParse("../../arbitrary-component").success, false);

  const storedIconNames = [
    ...iconSeeds,
    ...mediaSeeds,
    ...profileCollections.flatMap(({ items }) => items),
    ...experienceSeeds.flatMap(({ icons }) => icons),
  ].flatMap(({ iconName }) => (iconName ? [iconName] : []));

  assert.deepEqual(
    storedIconNames.filter((name) => !portfolioIconNameSchema.safeParse(name).success),
    [],
  );
});
