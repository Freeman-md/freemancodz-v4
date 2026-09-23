import type {
  AboutPageData,
  AuditPageData,
  HomePageData,
  WorkPageData,
} from "@/modules/portfolio/public";
import type { IndexDocument } from "../models/index-document";

export type PortfolioSnapshot = {
  home: HomePageData;
  work: WorkPageData;
  about: AboutPageData;
  audit: AuditPageData;
};

type Profile = HomePageData["profile"];
type ContentBlock = HomePageData["contentBlocks"][number];
type Project = WorkPageData["projects"][number];
type Experience = AboutPageData["experiences"][number];

const PUBLIC_PROVENANCE_PATTERN = /^\/(?:(?:work|about|audit))?(?:#[A-Za-z0-9][A-Za-z0-9_-]*)?$/;

const PROFILE_COLLECTION_NAMES: Record<string, string> = {
  AUDIENCE: "Audience",
  PRINCIPLES: "Principles",
  THINKING_PRINCIPLES: "Thinking principles",
  PROCESS_PRINCIPLES: "Process principles",
  CONTROL_PRINCIPLES: "Control principles",
  OUTCOMES: "Outcomes",
};

const PROFILE_COLLECTION_ORDER: Record<string, number> = {
  AUDIENCE: 0,
  PRINCIPLES: 1,
  THINKING_PRINCIPLES: 2,
  PROCESS_PRINCIPLES: 3,
  CONTROL_PRINCIPLES: 4,
  OUTCOMES: 5,
};

function cleanText(value: string | null | undefined): string | null {
  const cleaned = value?.trim();

  return cleaned ? cleaned : null;
}

function uniqueKeywords(values: Array<string | null | undefined>): string[] {
  return [
    ...new Set(values.map((value) => cleanText(value)).filter((value): value is string => !!value)),
  ].sort((left, right) => left.localeCompare(right));
}

function publicProvenance(url: string): string {
  const cleaned = url.trim();

  if (!PUBLIC_PROVENANCE_PATTERN.test(cleaned)) {
    throw new Error("Portfolio indexing encountered invalid public provenance.");
  }

  return cleaned;
}

function addDocument(documents: Map<string, IndexDocument>, document: IndexDocument): void {
  if (!cleanText(document.sourceId) || !cleanText(document.title) || !document.paragraphs.length) {
    throw new Error("Portfolio indexing produced invalid document metadata.");
  }

  publicProvenance(document.url);

  const identity = `${document.sourceType}:${document.sourceId}`;

  const existing = documents.get(identity);

  if (existing && JSON.stringify(existing) !== JSON.stringify(document)) {
    throw new Error("Portfolio indexing encountered conflicting duplicate source identities.");
  }

  documents.set(identity, existing ?? document);
}

function iconMeaning(icon: { label: string; copy: string | null }): string | null {
  const label = cleanText(icon.label);

  const copy = cleanText(icon.copy);

  if (!label) {
    return copy;
  }

  return copy ? `${label}: ${copy}` : label;
}

function mapProfile(profile: Profile): IndexDocument {
  const name = cleanText(profile.name);

  const title = cleanText(profile.title);

  const positioning = cleanText(profile.positioning);

  if (profile.id !== "global" || !name || !title || !positioning) {
    throw new Error("Portfolio indexing encountered invalid public profile data.");
  }

  const paragraphs = [
    `Name: ${name}`,
    `Professional title: ${title}`,
    `Positioning: ${positioning}`,
  ];

  const keywords: Array<string | null | undefined> = [name, title];

  for (const relation of profile.iconCollections.toSorted((left, right) => {
    const collectionOrder =
      (PROFILE_COLLECTION_ORDER[left.collection] ?? Number.MAX_SAFE_INTEGER) -
      (PROFILE_COLLECTION_ORDER[right.collection] ?? Number.MAX_SAFE_INTEGER);

    return (
      collectionOrder ||
      left.order - right.order ||
      left.iconBlockId.localeCompare(right.iconBlockId)
    );
  })) {
    const meaning = iconMeaning(relation.iconBlock);

    if (!meaning) {
      continue;
    }

    const collection = PROFILE_COLLECTION_NAMES[relation.collection] ?? "Profile detail";

    paragraphs.push(`${collection}: ${meaning}`);
    keywords.push(relation.iconBlock.label);
  }

  return {
    sourceType: "profile",
    sourceId: "global",
    title: `${name} — ${title}`,
    category: "Profile",
    url: "/about",
    keywords: uniqueKeywords(keywords),
    paragraphs,
  };
}

function mapContentBlock(root: ContentBlock): IndexDocument {
  const paragraphs: string[] = [];

  const keywords: Array<string | null | undefined> = [];

  const visiting = new Set<string>();

  const visited = new Set<string>();

  const visit = (block: ContentBlock, depth: number): void => {
    if (visiting.has(block.id)) {
      throw new Error("Portfolio indexing encountered a cyclic content tree.");
    }

    if (visited.has(block.id)) {
      throw new Error("Portfolio indexing encountered a duplicated content-tree node.");
    }

    visiting.add(block.id);
    visited.add(block.id);

    const prefix = depth === 0 ? "Section" : "Subsection";

    const eyebrow = cleanText(block.eyebrow);

    const title = cleanText(block.title);

    const copy = cleanText(block.copy);

    if (eyebrow) {
      paragraphs.push(`${prefix} context: ${eyebrow}`);
      keywords.push(eyebrow);
    }

    if (title) {
      paragraphs.push(`${prefix}: ${title}`);
      keywords.push(title);
    }

    if (copy) {
      paragraphs.push(copy);
    }

    for (const relation of block.iconBlocks.toSorted(
      (left, right) =>
        left.order - right.order || left.iconBlockId.localeCompare(right.iconBlockId),
    )) {
      const meaning = iconMeaning(relation.iconBlock);

      if (meaning) {
        paragraphs.push(`Supporting point: ${meaning}`);
        keywords.push(relation.iconBlock.label);
      }
    }

    for (const relation of block.mediaBlocks.toSorted(
      (left, right) =>
        left.order - right.order || left.mediaBlockId.localeCompare(right.mediaBlockId),
    )) {
      const media = relation.mediaBlock;

      const altText = cleanText(media.altText);

      const meaning = iconMeaning(media.iconBlock);

      if (altText || meaning) {
        paragraphs.push(`Media meaning: ${[altText, meaning].filter(Boolean).join(" — ")}`);
      }

      keywords.push(media.iconBlock.label);
    }

    for (const relation of block.actionBlocks.toSorted(
      (left, right) =>
        left.order - right.order || left.actionBlockId.localeCompare(right.actionBlockId),
    )) {
      const action = relation.actionBlock;

      const label = cleanText(action.iconBlock.label);

      const copy = cleanText(action.iconBlock.copy);

      const assistantMessage = cleanText(action.assistantMessage);

      const details = [label, copy, assistantMessage].filter(Boolean);

      if (details.length) {
        paragraphs.push(`Available action: ${details.join(" — ")}`);
      }

      keywords.push(label);
    }

    for (const relation of block.children.toSorted(
      (left, right) => left.order - right.order || left.child.id.localeCompare(right.child.id),
    )) {
      visit(relation.child, depth + 1);
    }

    visiting.delete(block.id);
  };

  visit(root, 0);

  return {
    sourceType: "content_block",
    sourceId: root.id,
    title: cleanText(root.title) ?? cleanText(root.eyebrow) ?? "Portfolio section",
    category: "Portfolio section",
    url: publicProvenance(root.url),
    keywords: uniqueKeywords(keywords),
    paragraphs,
  };
}

export function stripMarkdownUrlDestinations(markdown: string): string {
  return markdown
    .replace(/^\s*\[[^\]]+\]:\s*(?:<[^>]+>|\S+)(?:\s+.*)?$/gm, "")
    .replace(/!\[([^\]]*)\]\([^\n)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^\n)]*\)/g, "$1")
    .replace(/!\[([^\]]*)\]\[[^\]]*\]/g, "$1")
    .replace(/\[([^\]]+)\]\[[^\]]*\]/g, "$1")
    .replace(/<https?:\/\/[^>\s]+>/gi, "")
    .replace(/\bhttps?:\/\/[^\s<>)\]]+/gi, "")
    .replace(/\bwww\.[^\s<>)\]]+/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function mapProject(project: Project): IndexDocument {
  const title = cleanText(project.title);

  const category = cleanText(project.category);

  const problem = cleanText(project.problem);

  const solution = cleanText(project.solution);

  if (!title || !category || !problem || !solution) {
    throw new Error("Portfolio indexing encountered invalid public project data.");
  }

  const markdown = project.markdown ? stripMarkdownUrlDestinations(project.markdown) : null;

  const paragraphs = [
    `Project: ${title}`,
    `Category: ${category}`,
    `Problem: ${problem}`,
    `Solution: ${solution}`,
  ];

  const outcome = cleanText(project.outcome);

  const visualText = cleanText(project.visualText);

  const coverAltText = cleanText(project.cover?.altText);

  if (outcome) {
    paragraphs.push(`Outcome: ${outcome}`);
  }

  if (markdown) {
    paragraphs.push(`Project details:\n${markdown}`);
  }

  if (visualText) {
    paragraphs.push(`Visual summary: ${visualText}`);
  }

  if (coverAltText) {
    paragraphs.push(`Cover description: ${coverAltText}`);
  }

  return {
    sourceType: "project",
    sourceId: project.id,
    title,
    category: "Project",
    url: "/work",
    keywords: uniqueKeywords([
      "project",
      project.title,
      project.category,
      project.slug,
      project.cover?.iconBlock.label,
    ]),
    paragraphs,
  };
}

function formatDate(value: Date | null): string | null {
  return value ? value.toISOString().slice(0, 10) : null;
}

function mapExperience(experience: Experience): IndexDocument {
  const title = cleanText(experience.title);

  const copy = cleanText(experience.copy);

  if (!title || !copy) {
    throw new Error("Portfolio indexing encountered invalid public experience data.");
  }

  const paragraphs = [`Experience: ${title}`];

  const tag = cleanText(experience.tag);

  const role = cleanText(experience.role);

  const insight = cleanText(experience.insight);

  const dates = [formatDate(experience.startDate), formatDate(experience.endDate)].filter(Boolean);

  const keywords: Array<string | null | undefined> = ["experience", title, tag, role];

  if (tag) {
    paragraphs.push(`Context: ${tag}`);
  }

  if (role) {
    paragraphs.push(`Role: ${role}`);
  }

  if (dates.length) {
    paragraphs.push(`Dates: ${dates.join(" to ")}`);
  }

  paragraphs.push(copy);

  if (insight) {
    paragraphs.push(`Insight: ${insight}`);
  }

  for (const relation of experience.iconBlocks.toSorted(
    (left, right) => left.order - right.order || left.iconBlockId.localeCompare(right.iconBlockId),
  )) {
    const meaning = iconMeaning(relation.iconBlock);

    if (meaning) {
      paragraphs.push(`Experience detail: ${meaning}`);
      keywords.push(relation.iconBlock.label);
    }
  }

  return {
    sourceType: "experience",
    sourceId: experience.id,
    title,
    category: "Experience",
    url: "/about#about-journey",
    keywords: uniqueKeywords(keywords),
    paragraphs,
  };
}

export function mapPortfolioSnapshot(snapshot: PortfolioSnapshot): IndexDocument[] {
  const documents = new Map<string, IndexDocument>();

  for (const profile of [snapshot.home.profile, snapshot.work.profile, snapshot.about.profile]) {
    addDocument(documents, mapProfile(profile));
  }

  for (const pageBlocks of [
    snapshot.home.contentBlocks,
    snapshot.work.contentBlocks,
    snapshot.about.contentBlocks,
    snapshot.audit.contentBlocks,
  ]) {
    for (const block of pageBlocks) {
      addDocument(documents, mapContentBlock(block));
    }
  }

  for (const pageProjects of [
    snapshot.work.projects,
    snapshot.home.projects,
    snapshot.audit.projects,
  ]) {
    for (const project of pageProjects) {
      addDocument(documents, mapProject(project));
    }
  }

  for (const experience of snapshot.about.experiences) {
    addDocument(documents, mapExperience(experience));
  }

  if (!documents.size) {
    throw new Error("Portfolio indexing produced an empty document snapshot.");
  }

  return [...documents.values()];
}
