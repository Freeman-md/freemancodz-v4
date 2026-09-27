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
} from "@/app/_portfolio/data/presentation.mapper";
import type {
  PortfolioContentSource,
  PortfolioExperienceSource,
  PortfolioProfileSource,
  PortfolioProjectSource,
} from "@/app/_portfolio/data/types";
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
    iconBlocks: [
      { order: 2, iconBlock: icon(`${title} second`) },
      { order: 1, iconBlock: icon(`${title} first`) },
    ],
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
    block("/#home-cta", "Closing"),
    block("/#home-audit", "Audit", [block("/shared", "Problem"), block("/shared", "Improvement")]),
    block("/#home-work", "Relevant"),
    block("/#home-improve", "Improve", [block("/shared", "Journey"), block("/shared", "Workflow")]),
    block("/", "Hero"),
  ];

  const home = createHomePresentationData({ profile, contentBlocks: homeBlocks, projects });

  assert.equal(home.hero.title, "Hero");
  assert.equal(home.profile.title, profile.title);
  assert.equal(home.improve.operationalWorkflow.title, "Workflow");
  assert.deepEqual(
    home.hero.icons.map(({ label }) => label),
    ["Hero first", "Hero second"],
  );

  const workHero = block("/work", "Work hero", [
    block("/work", "Focus"),
    block("/work", "Approach"),
  ]);

  const connects = block("/work#work-connects", "Connects", [
    block("/work#work-connects", "Products"),
    block("/work#work-connects", "Experiences"),
    block("/work#work-connects", "Workflows"),
  ]);

  const work = createWorkPresentationData({
    profile,
    projects,
    contentBlocks: [
      block("/work#work-cta", "CTA"),
      connects,
      block("/work#work-additional", "Additional"),
      block("/work#work-relevant", "Relevant"),
      workHero,
    ],
  });

  assert.equal(work.hero.approach.title, "Approach");
  assert.equal(work.projects.selfHealing.title, "self-healing-backend-operations-system");

  const aboutHero = block("/about", "About hero");

  const closing = block("/about#about-cta", "Closing", [block("/about#about-cta", "Work")]);

  const experiences: PortfolioExperienceSource[] = ["Pay4Me", "Today"].map((title, order) => ({
    title,
    order,
    tag: null,
    copy: title,
    insight: null,
    iconBlocks: [],
  }));

  const about = createAboutPresentationData({
    profile,
    experiences,
    contentBlocks: [
      closing,
      block("/about#about-outside", "Outside"),
      block("/about#about-explore", "Explore"),
      block("/about#about-work", "Process"),
      block("/about#about-journey", "Journey"),
      aboutHero,
    ],
  });

  assert.equal(about.hero.title, "About hero");
  assert.deepEqual(
    about.experiences.map(({ title }) => title),
    ["Pay4Me", "Today"],
  );

  const process = block("/audit#audit-process", "Process", [
    block("/audit#audit-process", "Context"),
    block("/audit#audit-process", "Inspect"),
    block("/audit#audit-process", "Prioritise"),
    block("/audit#audit-process", "Action"),
  ]);

  const audit = createAuditPresentationData({
    projects,
    contentBlocks: [
      block("/audit#audit-cta", "CTA"),
      block("/audit#audit-proof", "Proof"),
      block("/audit#audit-why", "Symptoms"),
      process,
      block("/audit", "Hero"),
    ],
  });

  assert.equal(audit.process.title, "Process");
  assert.deepEqual(
    audit.process.stages.map(({ title }) => title),
    ["Context", "Inspect", "Prioritise", "Action"],
  );
});

test("page adapters fail closed when required section or project identity is unavailable", () => {
  assert.throws(
    () => createHomePresentationData({ profile, contentBlocks: [], projects }),
    /Required portfolio presentation content is unavailable: \/#home-improve/,
  );

  const homeBlocks = [
    block("/", "Hero"),
    block("/#home-improve", "Improve", [block("/shared", "Journey"), block("/shared", "Workflow")]),
    block("/#home-work", "Relevant"),
    block("/#home-audit", "Audit", [block("/shared", "Problem"), block("/shared", "Improvement")]),
    block("/#home-cta", "Closing"),
  ];

  assert.throws(
    () =>
      createHomePresentationData({
        profile,
        contentBlocks: homeBlocks,
        projects: projects.filter(({ slug }) => slug !== "portfolio-assistant"),
      }),
    /Required portfolio presentation content is unavailable: project:portfolio-assistant/,
  );

  const incompleteImprove = block("/#home-improve", "Improve", [block("/shared", "Journey")]);

  assert.throws(
    () =>
      createHomePresentationData({
        profile,
        contentBlocks: homeBlocks.map((item) =>
          item.url === incompleteImprove.url ? incompleteImprove : item,
        ),
        projects,
      }),
    /Required portfolio presentation content is unavailable: \/#home-improve child 2/,
  );
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
