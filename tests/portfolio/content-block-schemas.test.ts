import assert from "node:assert/strict";
import test from "node:test";
import { parseAboutHeaderContent } from "@/features/portfolio/schemas/content-blocks/about-header.schema";
import { parseCurrentDirectionContent } from "@/features/portfolio/schemas/content-blocks/current-direction.schema";
import { parseEducationContent } from "@/features/portfolio/schemas/content-blocks/education.schema";
import { parseOutsideEngineeringContent } from "@/features/portfolio/schemas/content-blocks/outside-engineering.schema";
import { parsePhilosophyContent } from "@/features/portfolio/schemas/content-blocks/philosophy.schema";

test("parses the home singleton payloads", () => {
  assert.deepEqual(parsePhilosophyContent({ philosophyQuestion: "Question" }, "home.philosophy"), { philosophyQuestion: "Question" });
  assert.deepEqual(
    parseCurrentDirectionContent({ currentDirection: "Direction", currentDirectionSupport: "Support" }, "home.current-direction"),
    { currentDirection: "Direction", currentDirectionSupport: "Support" },
  );
});

test("parses about singleton and repeatable payloads", () => {
  assert.deepEqual(parseAboutHeaderContent({ aboutHeadline: "About" }, "about.header"), { aboutHeadline: "About" });
  assert.deepEqual(
    parseEducationContent({ current: "Current", previous: "Previous", research: "Research", support: "Support" }, "about.education"),
    { current: "Current", previous: "Previous", research: "Research", support: "Support" },
  );
  assert.deepEqual(parseOutsideEngineeringContent({ title: "Strength", description: "Training" }, "block: about.outside-engineering.0"), { title: "Strength", description: "Training" });
});

test("identifies the affected block for malformed singleton payloads", () => {
  assert.throws(() => parseEducationContent({ current: "Current" }, "about.education"), /block: about\.education/);
});
