import assert from "node:assert/strict";
import test from "node:test";
import type { Experience as ExperienceRecord } from "@/generated/prisma/client";
import { mapExperience } from "@/features/portfolio/server/mappers/portfolio.mapper";

test("maps a nullable database experience into optional UI location", () => {
  const record = {
    title: "Role", company: "Company", dates: "2026", location: null, category: "Category", focus: "Focus",
  } as unknown as ExperienceRecord;
  assert.deepEqual(mapExperience(record), {
    title: "Role", company: "Company", dates: "2026", location: undefined, category: "Category", focus: "Focus",
  });
});
