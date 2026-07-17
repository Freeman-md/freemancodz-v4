import assert from "node:assert/strict";
import test from "node:test";
import type { Project as ProjectRecord } from "@/generated/prisma/client";
import { mapProject } from "@/features/portfolio/mappers/portfolio.mapper";
import { parseProjectLinks } from "@/features/portfolio/schemas/project-links.schema";

const project = {
  title: "Example", summary: "Summary", category: "Category", role: "Role", outcome: "Outcome", detail: "Detail",
  future: null, collaboration: null, positioning: null, featured: true, stacks: ["TypeScript"],
  links: [{ label: "Live", href: "https://example.com" }],
} as unknown as ProjectRecord;

test("maps project nullable fields and stacks for the existing UI", () => {
  assert.deepEqual(mapProject(project), {
    title: "Example", summary: "Summary", category: "Category", role: "Role", outcome: "Outcome", detail: "Detail",
    featured: true, stack: ["TypeScript"], links: [{ label: "Live", href: "https://example.com" }],
    future: undefined, collaboration: undefined, positioning: undefined,
  });
});

test("reports malformed project links with the affected project", () => {
  assert.throws(() => parseProjectLinks([{ label: "Live" }], "Example"), /Invalid links stored for project: Example/);
});
