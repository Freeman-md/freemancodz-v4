import assert from "node:assert/strict";
import test from "node:test";
import type { IContentBlockRepository } from "@/modules/portfolio/interfaces/content-block.repository.interface";
import type { IExperienceRepository } from "@/modules/portfolio/interfaces/experience.repository.interface";
import type { IProfileRepository } from "@/modules/portfolio/interfaces/profile.repository.interface";
import type { IProjectRepository } from "@/modules/portfolio/interfaces/project.repository.interface";
import { AboutService } from "@/modules/portfolio/services/about.service";
import { AuditService } from "@/modules/portfolio/services/audit.service";
import { HomeService } from "@/modules/portfolio/services/home.service";
import { WorkService } from "@/modules/portfolio/services/work.service";
import type {
  ContentBlockNode,
  ExperienceWithIcons,
  ProfileWithCollections,
  ProjectWithCover,
} from "@/modules/portfolio/models/portfolio-records";

const profile = {
  id: "global",
  iconCollections: [
    { collection: "AUDIENCE", order: 1, iconBlock: { label: "Founders" } },
    { collection: "OUTCOMES", order: 1, iconBlock: { label: "Make actions easier to take" } },
  ],
} as ProfileWithCollections;

function block(id: string, childId: string, relationLabel: string) {
  return {
    id,
    order: 1,
    iconBlocks: [{ order: 1, iconBlock: { label: relationLabel } }],
    mediaBlocks: [],
    actionBlocks: [],
    children: [
      {
        order: 1,
        child: {
          id: childId,
          iconBlocks: [],
          mediaBlocks: [],
          actionBlocks: [],
          children: [],
        },
      },
    ],
  } as unknown as ContentBlockNode;
}

const pageBlocks = {
  "/": [block("home.hero", "home.hero.child", "Home relation")],
  "/work": [block("work.hero", "work.hero.child", "Work relation")],
  "/about": [block("about.hero", "about.hero.child", "About relation")],
  "/audit": [
    {
      ...block("audit.process", "audit.process.context", "Audit relation"),
      children: [
        {
          order: 1,
          child: {
            ...block("audit.process.context", "audit.process.context.child", "Process relation"),
            order: null,
          },
        },
      ],
    } as ContentBlockNode,
  ],
} satisfies Record<string, ContentBlockNode[]>;

const projects = [
  "pay4me-withradius",
  "portfolio-assistant",
  "email-pa",
  "across-the-horizon",
  "shifty",
  "self-healing-backend-operations-system",
].map((slug, index) => ({ slug, order: index + 1 })) as ProjectWithCover[];

const experiences = ["Pay4Me", "The Hippodrome Casino", "Beyond the interface", "Today"].map(
  (title, index) => ({ title, order: index + 1, iconBlocks: [] }),
) as unknown as ExperienceWithIcons[];

const pages: string[] = [];

const contentBlocks: IContentBlockRepository = {
  findPageTree: async (page) => {
    pages.push(page);

    return pageBlocks[page];
  },
};

const profiles: IProfileRepository = { findSingleton: async () => profile };

const projectRepository: IProjectRepository = {
  findAll: async () => projects,
  findFeatured: async () => [projects[0]!],
  findBySlug: async (slug) => projects.find((project) => project.slug === slug) ?? null,
  findBySlugs: async (slugs) => projects.filter((project) => slugs.includes(project.slug)),
};

const experienceRepository: IExperienceRepository = { findAll: async () => experiences };

test("page services compose canonical independent records and ordered block trees", async () => {
  const home = await new HomeService(profiles, contentBlocks, projectRepository).getPageData();

  const work = await new WorkService(profiles, contentBlocks, projectRepository).getPageData();

  const about = await new AboutService(profiles, contentBlocks, experienceRepository).getPageData();

  const audit = await new AuditService(contentBlocks, projectRepository).getPageData();

  assert.deepEqual(
    home.projects.map(({ slug }) => slug),
    ["pay4me-withradius", "portfolio-assistant", "email-pa"],
  );
  assert.deepEqual(
    work.projects.map(({ slug }) => slug),
    projects.map(({ slug }) => slug),
  );
  assert.deepEqual(
    about.experiences.map(({ title }) => title),
    ["Pay4Me", "The Hippodrome Casino", "Beyond the interface", "Today"],
  );
  assert.deepEqual(
    audit.projects.map(({ slug }) => slug),
    ["pay4me-withradius", "portfolio-assistant", "email-pa"],
  );
  assert.deepEqual(pages, ["/", "/work", "/about", "/audit"]);
  assert.deepEqual(
    [home, work, about, audit].map(({ contentBlocks: result }) => result[0]?.id),
    ["home.hero", "work.hero", "about.hero", "audit.process"],
  );
  assert.equal(home.contentBlocks[0]?.children[0]?.child.id, "home.hero.child");
  assert.equal(audit.contentBlocks[0]?.children[0]?.child.id, "audit.process.context");
  assert.equal(about.contentBlocks[0]?.iconBlocks[0]?.iconBlock.label, "About relation");
  assert.equal(
    work.profile.iconCollections.some(({ collection }) => collection === "OUTCOMES"),
    true,
  );
  assert.equal(
    home.profile.iconCollections.some(({ collection }) => collection === "AUDIENCE"),
    true,
  );
});
