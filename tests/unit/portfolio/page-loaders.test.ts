import assert from "node:assert/strict";
import test from "node:test";
import { PortfolioService } from "@/server/modules/portfolio/services/portfolio.service";
import { audit } from "../../../content/portfolio/audit";
const required = async (key: string) =>
  ({
    "home.hero": {
      content: { name: "Freeman", headline: "Headline", intro: "Intro", heroNote: "Note" },
    },
    "home.philosophy": { content: { philosophyQuestion: "Question" } },
    "home.current-direction": {
      content: { currentDirection: "Direction", currentDirectionSupport: "Support" },
    },
  })[key] as never;

function service() {
  return new PortfolioService(
    { findRequiredByKey: required, findBySection: async () => [] },
    { findAll: async () => [] },
    { findBySection: async () => [] },
    {
      findAll: async () =>
        [
          {
            title: "Project",
            summary: "Summary",
            category: "Category",
            role: "Role",
            outcome: "Outcome",
            detail: "Detail",
            future: null,
            collaboration: null,
            positioning: null,
            featured: true,
            stacks: [],
            links: [],
          },
        ] as never[],
      findFeatured: async () => [],
    },
    { findAll: async () => [] },
    { getPrivate: async () => null },
  );
}

test("portfolio service preserves required page failures and work grouping", async () => {
  const instance = service();

  const work = await instance.getWorkPageData();

  assert.deepEqual(
    work.featuredProjects.map((project) => project.title),
    ["Project"],
  );
  await assert.rejects(
    new PortfolioService(
      { findRequiredByKey: required, findBySection: async () => [] },
      { findAll: async () => [] },
      { findBySection: async () => [] },
      { findAll: async () => [], findFeatured: async () => [] },
      { findAll: async () => [] },
      { getPrivate: async () => null },
    ).getWorkPageData(),
    /Required portfolio projects not found/,
  );
});
test("portfolio service maps missing and streamed assets", async () => {
  assert.deepEqual(await service().getAsset("missing"), { kind: "missing" });
  const result = await new PortfolioService(
    { findRequiredByKey: required, findBySection: async () => [] },
    { findAll: async () => [] },
    { findBySection: async () => [] },
    { findAll: async () => [], findFeatured: async () => [] },
    { findAll: async () => [] },
    {
      getPrivate: async () => ({
        stream: new ReadableStream(),
        blob: { contentType: "image/png" },
      }),
    },
  ).getAsset("asset");

  assert.equal(result.kind, "stream");
});

test("audit page data preserves configured proof-project order and fails for a missing project", async () => {
  const blocks = new Map(audit.map((block) => [block.key, { ...block, id: block.key }]));

  const projects = [
    { key: "pay4me-withradius", title: "Pay4Me / WithRadius", summary: "", category: "", role: "", outcome: "Payments", detail: "", future: null, collaboration: null, positioning: null, featured: false, stacks: [], links: [] },
    { key: "portfolio-assistant", title: "Portfolio Assistant", summary: "", category: "", role: "", outcome: "Guidance", detail: "", future: null, collaboration: null, positioning: null, featured: false, stacks: [], links: [] },
    { key: "email-pa", title: "Email PA", summary: "", category: "", role: "", outcome: "Reporting", detail: "", future: null, collaboration: null, positioning: null, featured: false, stacks: [], links: [] },
  ] as never[];

  const auditService = new PortfolioService(
    { findRequiredByKey: async (key: string) => blocks.get(key) as never, findBySection: async () => [] }, { findAll: async () => [] }, { findBySection: async () => [] }, { findAll: async () => projects, findFeatured: async () => [] }, { findAll: async () => [] }, { getPrivate: async () => null },
  );

  assert.deepEqual((await auditService.getAuditPageData()).proof.items.map((project) => project.key), ["pay4me-withradius", "portfolio-assistant", "email-pa"]);
  await assert.rejects(new PortfolioService(
    { findRequiredByKey: async (key: string) => blocks.get(key) as never, findBySection: async () => [] }, { findAll: async () => [] }, { findBySection: async () => [] }, { findAll: async () => projects.slice(0, 2), findFeatured: async () => [] }, { findAll: async () => [] }, { getPrivate: async () => null },
  ).getAuditPageData(), /Required audit proof project not found: email-pa/);
});
