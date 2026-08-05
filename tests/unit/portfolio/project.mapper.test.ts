import assert from "node:assert/strict";
import test from "node:test";
import type { Project as ProjectRecord } from "@/generated/prisma/client";
import { mapProject } from "@/server/modules/portfolio/mappers/portfolio-view.mapper";
import { parseStoredProjectLinks } from "@/server/modules/portfolio/schemas/content-block.schema";
import { projectLinksSchema } from "@/server/modules/portfolio/schemas/content-block.schema";

const project = {
  key: "example",
  title: "Example",
  summary: "Summary",
  category: "Category",
  role: "Role",
  outcome: "Outcome",
  detail: "Detail",
  future: null,
  collaboration: null,
  positioning: null,
  featured: true,
  stacks: ["TypeScript"],
  links: [{ label: "Live", href: "https://example.com" }],
} as unknown as ProjectRecord;

test("maps project nullable fields and stacks for the existing UI", () => {
  assert.deepEqual(mapProject(project), {
    key: "example",
    title: "Example",
    summary: "Summary",
    category: "Category",
    role: "Role",
    outcome: "Outcome",
    detail: "Detail",
    featured: true,
    stack: ["TypeScript"],
    links: [{ label: "Live", href: "https://example.com" }],
    future: undefined,
    collaboration: undefined,
    positioning: undefined,
  });
});

test("reports malformed project links with the affected project", () => {
  assert.throws(
    () => parseStoredProjectLinks([{ label: "Live" }], "Example"),
    /Invalid links stored for project: Example/,
  );
});

test("project link schema validates URLs and link entries", () => {
  assert.deepEqual(projectLinksSchema.parse([{ label: "Live", href: "https://example.com" }]), [
    { label: "Live", href: "https://example.com" },
  ]);
  assert.equal(projectLinksSchema.safeParse([{ label: "Live", href: "not-a-url" }]).success, false);
  assert.equal(projectLinksSchema.safeParse([{ href: "https://example.com" }]).success, false);
});
