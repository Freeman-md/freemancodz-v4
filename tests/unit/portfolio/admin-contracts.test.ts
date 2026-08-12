import assert from "node:assert/strict";
import test from "node:test";
import { actionDestinationSchema, orderedRelationsSchema, upsertActionBlockSchema, upsertIconBlockSchema, upsertProjectSchema } from "@/contracts/portfolio-admin.contract";

test("admin schemas close stored presentation identifiers and colour values", () => {
  assert.equal(upsertIconBlockSchema.safeParse({ iconName: "Search", label: "Find", copy: null, colour: null }).success, true);
  assert.equal(upsertIconBlockSchema.safeParse({ iconName: "MadeUpIcon", label: "Find", copy: null, colour: null }).success, false);
  assert.equal(upsertIconBlockSchema.safeParse({ iconName: "Search", label: "Find", copy: null, colour: "purple" }).success, false);
  assert.equal(upsertProjectSchema.safeParse({ slug: "safe-project", title: "Safe", category: "Systems", problem: "P", solution: "S", outcome: null, externalLinks: [], featured: false, order: 1, markdown: null, visualBlock: "ArbitraryComponent", visualText: null }).success, false);
});

test("admin schemas reject ambiguous actions and duplicate relationship ordering", () => {
  assert.equal(upsertActionBlockSchema.safeParse({ iconName: null, label: "Open", copy: null, colour: null, variant: "PRIMARY", url: null, assistantMessage: null }).success, false);
  assert.equal(orderedRelationsSchema.safeParse([{ id: "3f4b69ba-b61d-4870-a4d8-65b67790b4da", order: 0 }, { id: "6b4952f0-3033-44d5-bb92-d7469bd19a31", order: 0 }]).success, false);
});

test("action destinations accept canonical site paths and safe HTTP URLs only", () => {
  for (const destination of ["/work", "/audit#claim", "https://withradius.com/work"]) {
    assert.equal(actionDestinationSchema.safeParse(destination).success, true, destination);
  }

  for (const destination of ["//evil.example/path", "javascript:alert(1)", "/work\\evil", "work"] ) {
    assert.equal(actionDestinationSchema.safeParse(destination).success, false, destination);
  }
});
