import assert from "node:assert/strict";
import test from "node:test";

process.env.DATABASE_URL ??= "postgresql://postgres:postgres@127.0.0.1:5432/postgres";

test("reports a missing required content block by stable key", async () => {
  const { prisma } = await import("@/lib/prisma");
  const query = await import("@/features/portfolio/data/content-blocks.query");
  const original = prisma.contentBlock.findUnique;
  prisma.contentBlock.findUnique = (async () => null) as typeof prisma.contentBlock.findUnique;

  try {
    await assert.rejects(query.findRequiredContentBlockByKey("home.hero"), /Required content block not found: home\.hero/);
  } finally {
    prisma.contentBlock.findUnique = original;
  }
});

test("requests repeatable content blocks in stored position order", async () => {
  const { prisma } = await import("@/lib/prisma");
  const query = await import("@/features/portfolio/data/content-blocks.query");
  const original = prisma.contentBlock.findMany;
  let args: unknown;
  prisma.contentBlock.findMany = (async (value) => {
    args = value;
    return [];
  }) as typeof prisma.contentBlock.findMany;

  try {
    await query.findContentBlocksBySection("ABOUT", "ABOUT_INTRO");
    assert.deepEqual(args, { where: { page: "ABOUT", section: "ABOUT_INTRO" }, orderBy: { position: "asc" } });
  } finally {
    prisma.contentBlock.findMany = original;
  }
});
