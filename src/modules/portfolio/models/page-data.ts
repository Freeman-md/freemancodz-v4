import type {
  ContentBlockNode,
  ExperienceWithIcons,
  ProfileWithCollections,
  ProjectWithCover,
} from "./portfolio-records";

export type HomePageData = {
  profile: ProfileWithCollections;
  contentBlocks: ContentBlockNode[];
  projects: ProjectWithCover[];
};

export type WorkPageData = HomePageData;

export type AboutPageData = {
  profile: ProfileWithCollections;
  contentBlocks: ContentBlockNode[];
  experiences: ExperienceWithIcons[];
};

export type AuditPageData = {
  contentBlocks: ContentBlockNode[];
  projects: ProjectWithCover[];
};
