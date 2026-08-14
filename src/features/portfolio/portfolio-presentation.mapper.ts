import { requiredPortfolioProjectSlugs } from "@/contracts/portfolio-presentation.contract";
import type {
  AboutPresentationData,
  AuditPresentationData,
  HomePresentationData,
  PortfolioExperience,
  PortfolioProject,
  PortfolioSection,
  WorkPresentationData,
} from "./models/portfolio-presentation";
import type {
  PortfolioContentSource,
  PortfolioExperienceSource,
  PortfolioProfileSource,
  PortfolioProjectSource,
} from "./models/portfolio-presentation-source";

const [
  pay4MeSlug,
  portfolioAssistantSlug,
  emailPaSlug,
  acrossTheHorizonSlug,
  shiftySlug,
  selfHealingSlug,
] = requiredPortfolioProjectSlugs;

class PortfolioPresentationError extends Error {
  constructor(identity: string) {
    super(`Required portfolio presentation content is unavailable: ${identity}`);
    this.name = "PortfolioPresentationError";
  }
}

function byOrder<T extends { order: number }>(items: T[]): T[] {
  return items.toSorted((left, right) => left.order - right.order);
}

function section(source: PortfolioContentSource): PortfolioSection {
  return {
    eyebrow: source.eyebrow ?? "",
    title: source.title ?? "",
    copy: source.copy ?? "",
    icons: byOrder(source.iconBlocks).map(({ iconBlock }) => iconBlock),
    media: byOrder(source.mediaBlocks).map(({ mediaBlock }) => ({
      ...mediaBlock.iconBlock,
      source: mediaBlock.source,
      altText: mediaBlock.altText,
      type: mediaBlock.type,
    })),
    actions: byOrder(source.actionBlocks).map(({ actionBlock }) => ({
      ...actionBlock.iconBlock,
      variant: actionBlock.variant,
      url: actionBlock.url,
      assistantMessage: actionBlock.assistantMessage,
    })),
  };
}

function rootAt(blocks: PortfolioContentSource[], url: string): PortfolioContentSource {
  const matches = blocks.filter((block) => block.url === url);

  if (matches.length !== 1) {
    throw new PortfolioPresentationError(url);
  }

  return matches[0];
}

function childAt(parent: PortfolioContentSource, order: number): PortfolioContentSource {
  const match = parent.children.find((item) => item.order === order)?.child;

  if (!match) {
    throw new PortfolioPresentationError(`${parent.url} child ${order}`);
  }

  return match;
}

function projectBySlug(projects: PortfolioProjectSource[], slug: string): PortfolioProject {
  const project = projects.find((item) => item.slug === slug);

  if (!project) {
    throw new PortfolioPresentationError(`project:${slug}`);
  }

  return { ...project };
}

function collection(
  profile: PortfolioProfileSource,
  name: PortfolioProfileSource["iconCollections"][number]["collection"],
) {
  return byOrder(profile.iconCollections.filter((item) => item.collection === name)).map(
    ({ iconBlock }) => iconBlock,
  );
}

function experience(source: PortfolioExperienceSource): PortfolioExperience {
  return {
    title: source.title,
    tag: source.tag,
    copy: source.copy,
    insight: source.insight,
    icons: byOrder(source.iconBlocks).map(({ iconBlock }) => iconBlock),
  };
}

export function createHomePresentationData(source: {
  profile: PortfolioProfileSource;
  contentBlocks: PortfolioContentSource[];
  projects: PortfolioProjectSource[];
}): HomePresentationData {
  const improve = rootAt(source.contentBlocks, "/#home-improve-heading");

  const audit = rootAt(source.contentBlocks, "/#home-audit-heading");

  return {
    profile: {
      name: source.profile.name,
      coverImage: source.profile.coverImage,
      audience: collection(source.profile, "AUDIENCE"),
    },
    hero: section(rootAt(source.contentBlocks, "/")),
    improve: {
      ...section(improve),
      customerJourney: section(childAt(improve, 1)),
      operationalWorkflow: section(childAt(improve, 2)),
    },
    relevantWork: section(rootAt(source.contentBlocks, "/#home-relevant-work-heading")),
    projects: {
      pay4Me: projectBySlug(source.projects, pay4MeSlug),
      portfolioAssistant: projectBySlug(source.projects, portfolioAssistantSlug),
      emailPa: projectBySlug(source.projects, emailPaSlug),
    },
    audit: {
      ...section(audit),
      problem: section(childAt(audit, 1)),
      improvement: section(childAt(audit, 2)),
    },
    closing: section(rootAt(source.contentBlocks, "/#home-closing-heading")),
  };
}

export function createWorkPresentationData(source: {
  profile: PortfolioProfileSource;
  contentBlocks: PortfolioContentSource[];
  projects: PortfolioProjectSource[];
}): WorkPresentationData {
  const hero = rootAt(source.contentBlocks, "/work");

  const connects = rootAt(source.contentBlocks, "/work#work-connection-heading");

  return {
    hero: {
      ...section(hero),
      focus: section(childAt(hero, 1)),
      approach: section(childAt(hero, 2)),
    },
    relevantWork: section(rootAt(source.contentBlocks, "/work#case-studies-heading")),
    additionalWork: section(rootAt(source.contentBlocks, "/work#additional-work-heading")),
    projects: {
      pay4Me: projectBySlug(source.projects, pay4MeSlug),
      portfolioAssistant: projectBySlug(source.projects, portfolioAssistantSlug),
      emailPa: projectBySlug(source.projects, emailPaSlug),
      acrossTheHorizon: projectBySlug(source.projects, acrossTheHorizonSlug),
      shifty: projectBySlug(source.projects, shiftySlug),
      selfHealing: projectBySlug(source.projects, selfHealingSlug),
    },
    connects: {
      ...section(connects),
      products: section(childAt(connects, 1)),
      experiences: section(childAt(connects, 2)),
      workflows: section(childAt(connects, 3)),
      outcomes: collection(source.profile, "OUTCOMES"),
    },
    closing: section(rootAt(source.contentBlocks, "/work#work-cta")),
  };
}

export function createAboutPresentationData(source: {
  profile: PortfolioProfileSource;
  contentBlocks: PortfolioContentSource[];
  experiences: PortfolioExperienceSource[];
}): AboutPresentationData {
  const hero = rootAt(source.contentBlocks, "/about");

  const thinking = rootAt(source.contentBlocks, "/about#product-thinking-heading");

  const closing = rootAt(source.contentBlocks, "/about#about-closing-heading");

  return {
    profile: {
      name: source.profile.name,
      title: source.profile.title,
      positioning: source.profile.positioning,
      coverImage: source.profile.coverImage,
      principles: collection(source.profile, "PRINCIPLES"),
      thinkingPrinciples: collection(source.profile, "THINKING_PRINCIPLES"),
      processPrinciples: collection(source.profile, "PROCESS_PRINCIPLES"),
      controlPrinciples: collection(source.profile, "CONTROL_PRINCIPLES"),
    },
    hero: {
      ...section(hero),
      customer: section(childAt(hero, 1)),
      system: section(childAt(hero, 2)),
    },
    journey: section(rootAt(source.contentBlocks, "/about#about-journey-heading")),
    experiences: byOrder(source.experiences).map(experience),
    thinking: {
      ...section(thinking),
      customer: section(childAt(thinking, 1)),
      workflow: section(childAt(thinking, 2)),
    },
    process: section(rootAt(source.contentBlocks, "/about#work-process-heading")),
    exploration: section(rootAt(source.contentBlocks, "/about#exploration-heading")),
    outsideEngineering: section(rootAt(source.contentBlocks, "/about#outside-engineering-heading")),
    closing: { ...section(closing), work: section(childAt(closing, 1)) },
  };
}

export function createAuditPresentationData(source: {
  contentBlocks: PortfolioContentSource[];
  projects: PortfolioProjectSource[];
}): AuditPresentationData {
  const beforeAfter = rootAt(source.contentBlocks, "/audit#friction-heading");

  const before = childAt(beforeAfter, 1);

  const after = childAt(beforeAfter, 2);

  return {
    hero: section(rootAt(source.contentBlocks, "/audit")),
    symptoms: section(rootAt(source.contentBlocks, "/audit#audit-symptoms-heading")),
    beforeAfter: {
      ...section(beforeAfter),
      before: {
        ...section(before),
        customer: section(childAt(before, 1)),
        workflow: section(childAt(before, 2)),
      },
      after: {
        ...section(after),
        customer: section(childAt(after, 1)),
        workflow: section(childAt(after, 2)),
      },
    },
    proof: section(rootAt(source.contentBlocks, "/audit#proof-heading")),
    projects: [pay4MeSlug, portfolioAssistantSlug, emailPaSlug].map((slug) =>
      projectBySlug(source.projects, slug),
    ),
    closing: section(rootAt(source.contentBlocks, "/audit#audit-cta-heading")),
  };
}
