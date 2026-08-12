import type {
  AboutPageData,
  AuditPageData,
  HomePageData,
  WorkPageData,
} from "./page-data";
import type { ContentBlockNode } from "./portfolio-records";

export const PortfolioCacheTag = {
  page: (page: "home" | "work" | "about" | "audit") => `portfolio:page:${page}`,
  profile: "portfolio:profile",
  projects: "portfolio:projects",
  project: (slug: string) => `portfolio:project:${slug}`,
  experiences: "portfolio:experiences",
  experience: (id: string) => `portfolio:experience:${id}`,
  contentBlock: (id: string) => `portfolio:content-block:${id}`,
  iconBlock: (id: string) => `portfolio:icon-block:${id}`,
  mediaBlock: (id: string) => `portfolio:media-block:${id}`,
  actionBlock: (id: string) => `portfolio:action-block:${id}`,
} as const;

function collectContentBlockTags(blocks: ContentBlockNode[]) {
  const tags = new Set<string>();

  const visit = (block: ContentBlockNode) => {
    tags.add(PortfolioCacheTag.contentBlock(block.id));

    for (const relation of block.iconBlocks) {
      tags.add(PortfolioCacheTag.iconBlock(relation.iconBlockId));
    }

    for (const relation of block.mediaBlocks) {
      tags.add(PortfolioCacheTag.mediaBlock(relation.mediaBlockId));
      tags.add(PortfolioCacheTag.iconBlock(relation.mediaBlockId));
    }

    for (const relation of block.actionBlocks) {
      tags.add(PortfolioCacheTag.actionBlock(relation.actionBlockId));
      tags.add(PortfolioCacheTag.iconBlock(relation.actionBlockId));
    }

    for (const child of block.children) {
      visit(child.child);
    }
  };

  blocks.forEach(visit);

  return tags;
}

function addProfileTags(tags: Set<string>, data: HomePageData | WorkPageData | AboutPageData) {
  tags.add(PortfolioCacheTag.profile);
  data.profile.iconCollections.forEach(({ iconBlockId }) => {
    tags.add(PortfolioCacheTag.iconBlock(iconBlockId));
  });
}

function addProjectTags(tags: Set<string>, data: HomePageData | WorkPageData | AuditPageData) {
  tags.add(PortfolioCacheTag.projects);
  data.projects.forEach((project) => {
    tags.add(PortfolioCacheTag.project(project.slug));
    if (project.coverId) {
      tags.add(PortfolioCacheTag.mediaBlock(project.coverId));
      tags.add(PortfolioCacheTag.iconBlock(project.coverId));
    }
  });
}

export function getHomePageCacheTags(data: HomePageData) {
  const tags = collectContentBlockTags(data.contentBlocks);

  tags.add(PortfolioCacheTag.page("home"));
  addProfileTags(tags, data);
  addProjectTags(tags, data);

  return [...tags];
}

export function getWorkPageCacheTags(data: WorkPageData) {
  const tags = collectContentBlockTags(data.contentBlocks);

  tags.add(PortfolioCacheTag.page("work"));
  addProfileTags(tags, data);
  addProjectTags(tags, data);

  return [...tags];
}

export function getAboutPageCacheTags(data: AboutPageData) {
  const tags = collectContentBlockTags(data.contentBlocks);

  tags.add(PortfolioCacheTag.page("about"));
  addProfileTags(tags, data);
  tags.add(PortfolioCacheTag.experiences);

  data.experiences.forEach((experience) => {
    tags.add(PortfolioCacheTag.experience(experience.id));
    experience.iconBlocks.forEach(({ iconBlockId }) => {
      tags.add(PortfolioCacheTag.iconBlock(iconBlockId));
    });
  });

  return [...tags];
}

export function getAuditPageCacheTags(data: AuditPageData) {
  const tags = collectContentBlockTags(data.contentBlocks);

  tags.add(PortfolioCacheTag.page("audit"));
  addProjectTags(tags, data);

  return [...tags];
}
