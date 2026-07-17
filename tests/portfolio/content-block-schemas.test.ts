import assert from "node:assert/strict";
import test from "node:test";
import { aboutHeaderContentSchema } from "@/features/portfolio/schemas/content-blocks/about-header.schema";
import { currentDirectionContentSchema } from "@/features/portfolio/schemas/content-blocks/current-direction.schema";
import { educationContentSchema } from "@/features/portfolio/schemas/content-blocks/education.schema";
import { heroContentSchema } from "@/features/portfolio/schemas/content-blocks/hero.schema";
import { outsideEngineeringContentSchema } from "@/features/portfolio/schemas/content-blocks/outside-engineering.schema";
import { philosophyContentSchema } from "@/features/portfolio/schemas/content-blocks/philosophy.schema";
import { textBlockContentSchema } from "@/features/portfolio/schemas/content-blocks/text-block.schema";

const schemas = [
  [heroContentSchema, { name: "Freeman", headline: "Headline", intro: "Intro", heroNote: "Note" }],
  [philosophyContentSchema, { philosophyQuestion: "Question" }],
  [currentDirectionContentSchema, { currentDirection: "Direction", currentDirectionSupport: "Support" }],
  [aboutHeaderContentSchema, { aboutHeadline: "About" }],
  [educationContentSchema, { current: "Current", previous: "Previous", research: "Research", support: "Support" }],
  [textBlockContentSchema, { body: "Body" }],
  [outsideEngineeringContentSchema, { title: "Strength", description: "Training" }],
] as const;

test("content block schemas accept valid seeded payload shapes", () => {
  for (const [schema, payload] of schemas) {
    assert.deepEqual(schema.parse(payload), payload);
  }
});

test("content block schemas reject missing required fields", () => {
  for (const [schema] of schemas) {
    assert.equal(schema.safeParse({}).success, false);
  }
});

test("content block schemas reject incorrect field types", () => {
  for (const [schema, payload] of schemas) {
    const [field] = Object.keys(payload);
    assert.equal(schema.safeParse({ ...payload, [field]: 1 }).success, false);
  }
});
