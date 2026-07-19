import assert from "node:assert/strict";
import test from "node:test";
import type {
  ContentBlock,
  Experience,
  Principle,
  Project,
  Service,
} from "@/generated/prisma/client";
import {
  buildContentBlockDocuments,
  buildExperienceDocuments,
  buildPrincipleDocuments,
  buildProjectDocuments,
  buildServiceDocuments,
} from "@/features/search-indexing/builders";

const timestamp = new Date("2026-07-19T00:00:00.000Z");

test("buildProjectDocuments creates one deliberate search document", () => {
  const project = {
    id: "project-1",
    title: "Grounded Assistant",
    summary: "A customer-facing assistant grounded in trusted sources.",
    category: "AI Engineering",
    role: "Full-stack engineer",
    outcome: "Produced cited answers from portfolio content.",
    detail: "Implemented retrieval, context injection and answer generation.",
    future: null,
    collaboration: null,
    positioning: "A practical customer-facing assistant.",
    featured: true,
    position: 1,
    stacks: ["TypeScript", "Next.js", "Supabase"],
    links: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  } satisfies Project;

  assert.deepEqual(buildProjectDocuments(project), [
    {
      sourceType: "projects",
      sourceId: "project-1",
      documentIndex: 0,
      title: "Grounded Assistant",
      category: "AI Engineering",
      url: "/work",
      content: [
        "Summary: A customer-facing assistant grounded in trusted sources.",
        "Role: Full-stack engineer",
        "Outcome: Produced cited answers from portfolio content.",
        "Details: Implemented retrieval, context injection and answer generation.",
        "Positioning: A practical customer-facing assistant.",
        "Technologies: Next.js, Supabase, TypeScript",
      ].join("\n\n"),
      keywords: [
        "AI Engineering",
        "Full-stack engineer",
        "Next.js",
        "Supabase",
        "TypeScript",
      ],
    },
  ]);
});

test("project UI-only fields do not change search output", () => {
  const base = {
    id: "project-1",
    title: "Grounded Assistant",
    summary: "Summary",
    category: "AI Engineering",
    role: "Engineer",
    outcome: "Outcome",
    detail: "Detail",
    future: null,
    collaboration: null,
    positioning: null,
    featured: false,
    position: 0,
    stacks: ["TypeScript"],
    links: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  } satisfies Project;

  const changedUiFields = {
    ...base,
    featured: true,
    position: 99,
    links: [{ label: "Live", href: "https://example.com" }],
    updatedAt: new Date("2026-07-20T00:00:00.000Z"),
  } satisfies Project;

  assert.deepEqual(
    buildProjectDocuments(base),
    buildProjectDocuments(changedUiFields),
  );
});