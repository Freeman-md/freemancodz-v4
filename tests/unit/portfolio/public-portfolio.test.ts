import assert from "node:assert/strict";
import test from "node:test";
import profile from "../../../prisma/seed-data/profile.json";
import projects from "../../../prisma/seed-data/projects.json";
import caseStudies from "../../../prisma/seed-data/project-case-studies.json";
import experience from "../../../prisma/seed-data/experience.json";
import services from "../../../prisma/seed-data/services.json";
import { seedPortfolioSchema } from "@/modules/portfolio/data/portfolio.schema";
import {
  PortfolioConfigurationError,
  PublicPortfolioService,
} from "@/modules/portfolio/services/public-portfolio.service";
import { verifySeedTarget } from "@/infrastructure/config/portfolio-seed";

const input = { profile, projects, caseStudies, experience, services };

test("the five editable inputs carry the approved baseline and stable service ordering", () => {
  const seed = seedPortfolioSchema.parse(input);

  assert.deepEqual(
    seed.projects.map(({ title }) => title),
    [
      "JPScents",
      "Debby Art & Prints",
      "Pay4Me / WithRadius",
      "Portfolio Assistant",
      "Email PA",
      "Across the Horizon",
      "Interface Studies",
      "Email Sequencer",
      "Self-Healing Backend Ops",
    ],
  );
  assert.deepEqual(
    seed.projects.filter(({ featured }) => featured).map(({ slug }) => slug),
    ["jpscents", "debby-arts", "pay4me-withradius"],
  );
  assert.equal(seed.projects.filter(({ kind }) => kind === "real-project").length, 6);
  assert.deepEqual(
    seed.caseStudies.map(({ projectSlug }) => projectSlug),
    seed.projects.map(({ slug }) => slug),
  );
  assert.ok(
    seed.caseStudies.every(({ beforeUrl, afterUrl }) => beforeUrl === null && afterUrl === null),
  );
  assert.deepEqual(
    seed.experience.map(({ name }) => name),
    ["Nigeria", "Pay4Me", "Novier Labs", "London, today"],
  );
  assert.deepEqual(
    seed.services.map(({ title }) => title),
    ["Product development", "Automation + AI"],
  );
  assert.deepEqual(seed.projects[3].serviceKeys, ["product-development", "automation-ai"]);
  assert.equal(seed.profile.headline, "Software Engineer");
});

test("seed validation rejects duplicate stable keys, unsafe links, unknown technologies and incomplete clips", () => {
  const first = projects[0];

  const study = caseStudies[0];

  for (const changes of [
    { projects: [first, first] },
    { projects: [{ ...first, serviceKeys: ["product-development", "product-development"] }] },
    {
      projects: [
        {
          ...first,
          links: [{ kind: "live-site", label: "Invalid", url: "https://user:pwd@example.test" }],
        },
      ],
    },
    { caseStudies: [{ ...study, technologyKeys: ["imaginary-tool"] }] },
    { caseStudies: [{ ...study, beforeUrl: "/videos/before.webm" }] },
    {
      caseStudies: [
        { ...study, beforeUrl: "/videos/../before.webm", afterUrl: "/videos/after.webm" },
      ],
    },
  ]) {
    assert.equal(seedPortfolioSchema.safeParse({ ...input, ...changes }).success, false);
  }

  assert.equal(
    seedPortfolioSchema.safeParse({
      ...input,
      projects: [],
      caseStudies: [{ ...study, beforeUrl: "/videos/before.webm", afterUrl: "/videos/after.webm" }],
    }).success,
    true,
  );
});

test("a seed verifies the configured environment and effective endpoint before opening a database session", () => {
  const connection = "postgresql://local@127.0.0.1:5432/m24";

  const configuration = {
    DATABASE_URL: connection,
    PORTFOLIO_SEED_ENVIRONMENT: "development",
    PORTFOLIO_SEED_DATABASE: "127.0.0.1:5432/m24",
    PORTFOLIO_SEED_USER: "local",
  };

  assert.deepEqual(verifySeedTarget("development", configuration, {}), {
    connection,
    label: "development",
  });
  assert.throws(() => verifySeedTarget("production", configuration, {}), /expected production/);
  assert.throws(
    () => verifySeedTarget("development", configuration, { DATABASE_URL: connection + "-other" }),
    /Inherited/,
  );
  assert.throws(
    () =>
      verifySeedTarget("development", configuration, {
        DATABASE_URL: connection.replace("local@", "different@"),
      }),
    /Inherited/,
  );
  assert.throws(
    () => verifySeedTarget("development", { ...configuration, DATABASE_URL: undefined }, {}),
    /Missing/,
  );
  assert.throws(
    () =>
      verifySeedTarget(
        "development",
        { ...configuration, DATABASE_URL: connection + "?host=wrong.example" },
        {},
      ),
    /ambiguous/,
  );
  assert.throws(
    () => verifySeedTarget("development", configuration, { PGOPTIONS: "-c role=other" }),
    /expected development/,
  );
});

test("missing required homepage data and repository failures use a safe configuration error", async () => {
  const service = new PublicPortfolioService({
    getProfile: async () => null,
    listProjects: async () => [],
    findProject: async (slug) => {
      if (slug === "db-error") {
        throw new Error("private provider detail");
      }

      return null;
    },
    listExperienceStops: async () => [],
    listServices: async () => [],
  });

  await assert.rejects(service.getHomepage(), PortfolioConfigurationError);
  await assert.rejects(service.listProjects(), PortfolioConfigurationError);
  await assert.rejects(service.findProject("db-error"), {
    message: "Portfolio data could not be read. Check database access and portfolio migrations.",
  });
  assert.equal(await service.findProject("missing"), null);
});
