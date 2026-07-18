import assert from "node:assert/strict";
import test from "node:test";
import { buildContentBlockDocuments } from "@/lib/rag/builders/content-block.builder";
import { buildProjectDocuments } from "@/lib/rag/builders/project.builder";

test("project builder excludes UI-only fields", () => {
  const project = { id: "id", title: "Project", summary: "Summary", category: "Web", role: "Engineer", outcome: "Outcome", detail: "Detail", future: null, collaboration: null, positioning: null, featured: true, position: 4, stacks: ["TypeScript"], links: [{ label: "Secret", href: "/secret" }], createdAt: new Date(), updatedAt: new Date() };
  const [result] = buildProjectDocuments(project);
  assert.match(result.content, /Summary/); assert.doesNotMatch(result.content, /Secret|featured|position/i);
});

test("unknown content block identity is deliberately not indexed", () => {
  const block = { id: "id", key: "future.unknown", page: "HOME" as const, section: "HERO" as const, position: 0, content: { arbitrary: "raw JSON" }, createdAt: new Date(), updatedAt: new Date() };
  assert.deepEqual(buildContentBlockDocuments(block), []);
});
