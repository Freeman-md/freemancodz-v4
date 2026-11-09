import assert from "node:assert/strict";
import test from "node:test";
import {
  JsonPublicPortfolioRepository,
  type PublicPortfolioRepository,
} from "@/modules/portfolio/repositories/public-portfolio.repository";
import { PublicPortfolioService } from "@/modules/portfolio/services/public-portfolio.service";

test("the public catalogue has nine complete projects in the approved order", async () => {
  const repository = new JsonPublicPortfolioRepository();

  const service = new PublicPortfolioService(repository);

  const projects = await service.listProjects();

  assert.deepEqual(
    projects.map(({ slug }) => slug),
    [
      "jpscents",
      "debby-arts",
      "pay4me-withradius",
      "portfolio-assistant",
      "email-pa",
      "across-the-horizon",
      "interface-studies",
      "email-sequencer",
      "self-healing-backend-operations-system",
    ],
  );
  assert.equal(projects.filter(({ kind }) => kind === "real-project").length, 6);
  assert.equal(projects.filter(({ kind }) => kind === "exploration").length, 3);
  assert.deepEqual(
    (await service.listFeaturedProjects()).map(({ slug }) => slug),
    projects.slice(0, 3).map(({ slug }) => slug),
  );
  assert.equal(await service.findProject("missing-project"), null);
  assert.deepEqual(await service.findProject("jpscents"), projects[0]);
  assert.deepEqual(
    (await service.listExperienceStops()).map(({ name }) => name),
    ["Nigeria", "Pay4Me", "Novier Labs", "London, today"],
  );
});

test("the JSON boundary rejects duplicate slugs, unsupported keys, unsafe destinations and incomplete media", async () => {
  const [project] = await new JsonPublicPortfolioRepository().listProjects();

  const samples = [
    [project, project],
    [{ ...project, services: ["unknown-service"] }],
    [{ ...project, technologies: ["unknown-technology"] }],
    [{ ...project, links: [{ kind: "live-site", label: "Unsafe", url: "javascript:void(0)" }] }],
    [{ ...project, cover: { ...project.cover, source: "/images/../private.png" } }],
    [{ ...project, comparison: { title: "Incomplete", before: project.comparison?.before } }],
    [{ ...project, comparison: { ...project.comparison, after: { caption: "No poster" } } }],
  ];

  for (const input of samples) {
    assert.throws(() => new JsonPublicPortfolioRepository(input), { name: "ZodError" });
  }

  assert.throws(() => new JsonPublicPortfolioRepository([project], [{ name: "Incomplete" }]), {
    name: "ZodError",
  });
});

test("public service reads use the injected repository and its featured flags", async () => {
  const records = new JsonPublicPortfolioRepository();

  const [original, other] = await records.listProjects();

  const [originalStop] = await records.listExperienceStops();

  const featured = { ...original, title: "An alternate project", slug: "alternate" };

  const stops = [{ ...originalStop, name: "Alternate chapter" }];

  const unfeatured = { ...other, featured: undefined };

  const repository: PublicPortfolioRepository = {
    async listProjects() {
      return [unfeatured, featured];
    },
    async findProject(slug) {
      return slug === featured.slug ? featured : null;
    },
    async listExperienceStops() {
      return stops;
    },
  };

  const service = new PublicPortfolioService(repository);

  assert.deepEqual(await service.listProjects(), [unfeatured, featured]);
  assert.deepEqual(await service.listFeaturedProjects(), [featured]);
  assert.equal(await service.findProject("alternate"), featured);
  assert.equal(await service.findProject(original.slug), null);
  assert.equal(await service.listExperienceStops(), stops);
});
