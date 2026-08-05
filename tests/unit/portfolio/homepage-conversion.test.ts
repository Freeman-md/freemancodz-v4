import assert from "node:assert/strict";
import test from "node:test";
import { PortfolioService } from "@/server/modules/portfolio/services/portfolio.service";

const blocks = {
  "home.hero": {
    key: "home.hero",
    page: "HOME",
    section: "HERO",
    content: {
      name: "Freeman Madudili",
      headline: "Headline",
      intro: "Intro",
      heroNote: "",
      primaryLabel: "Audit",
      primaryHref: "/audit",
      secondaryLabel: "Work",
      secondaryHref: "/work",
    },
  },
  "home.services-intro": {
    key: "home.services-intro",
    page: "HOME",
    section: "SERVICES_INTRO",
    content: { title: "Services", copy: "Copy" },
  },
  "home.proof-of-work": {
    key: "home.proof-of-work",
    page: "HOME",
    section: "PROOF_OF_WORK",
    content: {
      title: "Proof",
      copy: "Copy",
      items: [
        { projectKey: "first", action: null },
        { projectKey: "second", action: null },
      ],
    },
  },
  "home.audit-offer": {
    key: "home.audit-offer",
    page: "HOME",
    section: "AUDIT_OFFER",
    content: {
      label: "Audit",
      title: "Title",
      copy: "Copy",
      actionLabel: "Audit",
      actionHref: "/audit",
      checklist: ["One"],
    },
  },
  "home.final-cta": {
    key: "home.final-cta",
    page: "HOME",
    section: "FINAL_CTA",
    content: {
      title: "Title",
      primaryLabel: "Audit",
      primaryHref: "/audit",
      secondaryLabel: "Work",
      secondaryHref: "/work",
    },
  },
};

function createService(projects: Array<{ key: string; title: string; positioning: string | null }>) {
  return new PortfolioService(
    {
      findRequiredByKey: async (key) => blocks[key as keyof typeof blocks] as never,
      findBySection: async () => [],
    },
    { findAll: async () => [] },
    { findBySection: async () => [] },
    {
      findAll: async () =>
        projects.map((project) => ({
          ...project,
          summary: "Summary",
          category: "Category",
          role: "Role",
          outcome: "Outcome",
          detail: "Detail",
          future: null,
          collaboration: null,
          featured: false,
          position: 0,
          stacks: [],
          links: [],
        })) as never[],
      findFeatured: async () => [],
    },
    { findAll: async () => [] },
    { getPrivate: async () => null },
  );
}

test("homepage proof projects follow configured stable-key order", async () => {
  const home = await createService([
    { key: "second", title: "Second", positioning: "Problem" },
    { key: "first", title: "First", positioning: "Problem" },
  ]).getHomePageData();

  assert.deepEqual(
    home.proof.items.map((item) => item.project.key),
    ["first", "second"],
  );
});

test("homepage proof fails when a configured stable project key is absent", async () => {
  await assert.rejects(
    createService([{ key: "first", title: "First", positioning: "Problem" }]).getHomePageData(),
    /Required homepage proof project not found: second/,
  );
});
