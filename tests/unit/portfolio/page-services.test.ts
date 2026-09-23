import assert from "node:assert/strict";
import test from "node:test";
import { PortfolioService } from "@/modules/portfolio/service";
import type {
  ContentBlockNode,
  ExperienceWithIcons,
  ProfileWithCollections,
  ProjectWithCover,
} from "@/modules/portfolio/types";

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

const contentBlocks = {
  findPageTree: async (page: "/" | "/work" | "/about" | "/audit") => {
    pages.push(page);

    return pageBlocks[page];
  },
};

const profiles = { findSingleton: async () => profile };

const projectRepository = {
  findAll: async () => projects,
  findFeatured: async () => [projects[0]!],
  findBySlug: async (slug: string) => projects.find((project) => project.slug === slug) ?? null,
  findBySlugs: async (slugs: string[]) => projects.filter((project) => slugs.includes(project.slug)),
};

const experienceRepository = { findAll: async () => experiences };

test("page services compose canonical independent records and ordered block trees", async () => {
  const service = new PortfolioService(profiles, contentBlocks, projectRepository, experienceRepository);

  const home = await service.getHomePageData();

  const work = await service.getWorkPageData();

  const about = await service.getAboutPageData();

  const audit = await service.getAuditPageData();

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
