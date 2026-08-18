import type { PortfolioSnapshot } from "@/server/modules/search-index/mappers/portfolio-snapshot.mapper";

const CREATED_AT = new Date("2026-08-18T08:00:00.000Z");

type Profile = PortfolioSnapshot["home"]["profile"];
type IconBlock = Profile["iconCollections"][number]["iconBlock"];
type ContentBlock = PortfolioSnapshot["home"]["contentBlocks"][number];
type Project = PortfolioSnapshot["work"]["projects"][number];
type Experience = PortfolioSnapshot["about"]["experiences"][number];

function icon(id: string, label: string, copy: string | null = null): IconBlock {
  return {
    id,
    iconName: "CircleCheck",
    label,
    copy,
    colour: null,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  };
}

function contentBlock(
  id: string,
  input: Partial<
    Pick<ContentBlock, "eyebrow" | "title" | "copy" | "url" | "order" | "children">
  > = {},
): ContentBlock {
  return {
    id,
    eyebrow: input.eyebrow ?? null,
    title: input.title ?? "Customer journey section",
    copy: input.copy ?? "Clear customer-facing guidance.",
    url: input.url ?? "/#customer-journey",
    order: input.order ?? 1,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    iconBlocks: [],
    mediaBlocks: [],
    actionBlocks: [],
    children: input.children ?? [],
  };
}

function project(id: string, title: string, slug: string): Project {
  const coverIcon = icon(`${id}-cover`, `${title} cover`);

  return {
    id,
    slug,
    title,
    category: "Product engineering",
    problem: "Customers could not complete the workflow reliably.",
    solution: "A focused product and operational workflow solved the handoff.",
    outcome: "The process became clearer and more reliable.",
    coverId: coverIcon.id,
    cover: {
      id: coverIcon.id,
      type: "IMAGE",
      source: `https://storage.example/${slug}.jpg`,
      altText: `${title} product interface`,
      iconBlock: coverIcon,
    },
    externalLinks: [`https://example.com/${slug}`],
    featured: true,
    order: id === "project-1" ? 1 : 2,
    markdown:
      "Read the [case study](https://private.example/case) and https://private.example/raw for detail.",
    visualBlock: "InternalVisualComponent",
    visualText: "Customer action connects to a reliable operational response.",
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  };
}

function experience(): Experience {
  const detail = icon("experience-icon", "Systems thinking", "Connect product and operations.");

  return {
    id: "experience-1",
    title: "Product and systems work",
    tag: "Experience",
    copy: "Built customer-facing products and the workflows behind them.",
    insight: "The interface and the operation must work together.",
    role: "Engineer",
    startDate: new Date("2024-01-01T00:00:00.000Z"),
    endDate: null,
    order: 1,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    iconBlocks: [
      {
        experienceId: "experience-1",
        iconBlockId: detail.id,
        order: 1,
        iconBlock: detail,
      },
    ],
  };
}

export function createPortfolioSnapshotFixture(): PortfolioSnapshot {
  const audience = icon("profile-audience", "Product teams", "Improving customer journeys.");

  const profile: Profile = {
    id: "global",
    name: "Freeman Madudili",
    title: "Product-minded software engineer",
    positioning: "Customer-facing products and reliable operational workflows.",
    email: "freeman@example.com",
    linkedInUrl: "https://linkedin.example/freeman",
    githubUrl: "https://github.example/freeman",
    coverImage: "https://storage.example/profile.jpg",
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    iconCollections: [
      {
        profileId: "global",
        iconBlockId: audience.id,
        collection: "AUDIENCE",
        order: 1,
        iconBlock: audience,
      },
    ],
  };

  const child = contentBlock("content-child", {
    title: "Operational workflow",
    copy: "Reduce repetitive handoff work.",
    order: null,
  });

  const root = contentBlock("content-root", {
    children: [{ order: 1, child }],
  });

  const supportingIcon = icon("content-icon", "Clear next step", "Make action obvious.");

  const mediaIcon = icon("content-media", "Workflow illustration");

  const actionIcon = icon("content-action", "Ask about the work");

  root.iconBlocks.push({
    contentBlockId: root.id,
    iconBlockId: supportingIcon.id,
    order: 1,
    iconBlock: supportingIcon,
  });
  root.mediaBlocks.push({
    contentBlockId: root.id,
    mediaBlockId: mediaIcon.id,
    order: 1,
    mediaBlock: {
      id: mediaIcon.id,
      type: "IMAGE",
      source: "https://storage.example/internal-media.jpg",
      altText: "Customer action flowing into an operational handoff",
      iconBlock: mediaIcon,
    },
  });
  root.actionBlocks.push({
    contentBlockId: root.id,
    actionBlockId: actionIcon.id,
    order: 1,
    actionBlock: {
      id: actionIcon.id,
      variant: "PRIMARY",
      url: "/work",
      assistantMessage: "Tell me about the workflow behind this project.",
      iconBlock: actionIcon,
    },
  });

  const firstProject = project("project-1", "Portfolio Assistant", "portfolio-assistant");

  const secondProject = project("project-2", "Pay4Me", "pay4me-withradius");

  return {
    home: { profile, contentBlocks: [root], projects: [firstProject] },
    work: { profile, contentBlocks: [], projects: [firstProject, secondProject] },
    about: { profile, contentBlocks: [], experiences: [experience()] },
    audit: { contentBlocks: [], projects: [firstProject] },
  };
}
