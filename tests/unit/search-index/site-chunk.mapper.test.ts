import assert from "node:assert/strict";
import test from "node:test";

import {
  chunkText,
  prepareSiteChunks,
} from "@/modules/search-index/mappers/site-chunk.mapper";
import type { IndexDocument } from "@/modules/search-index/types";

const document: IndexDocument = {
  sourceType: "project",
  sourceId: "project-1",
  title: "Portfolio Assistant",
  category: "Project",
  url: "/work",
  keywords: ["TypeScript", "assistant", "TypeScript", ""],
  paragraphs: ["One useful paragraph.", "A second useful paragraph."],
};

test("prepares stable singular-source chunks and content hashes", () => {
  const first = prepareSiteChunks(document);

  const second = prepareSiteChunks(document);

  assert.deepEqual(first, second);
  assert.equal(first.length, 1);
  assert.equal(first[0]?.id, "project:project-1:0");
  assert.deepEqual(first[0]?.keywords, ["assistant", "TypeScript"]);
  assert.match(first[0]?.embeddingInput ?? "", /Record type: project/);
  assert.match(first[0]?.contentHash ?? "", /^[a-f0-9]{64}$/);

  const changed = prepareSiteChunks({ ...document, paragraphs: ["Changed content."] });

  assert.notEqual(changed[0]?.contentHash, first[0]?.contentHash);
});

test("keeps every deterministic chunk within the character limit", () => {
  const chunks = chunkText([
    "One paragraph.",
    "Two paragraphs.",
    "x".repeat(1_201),
    `A final ${"word ".repeat(400)}paragraph.`,
  ]);

  assert.ok(chunks.length > 2);
  assert.ok(chunks.every((chunk) => chunk.length <= 1_200));
  assert.deepEqual(chunkText([" ", "\n"]), []);
});
