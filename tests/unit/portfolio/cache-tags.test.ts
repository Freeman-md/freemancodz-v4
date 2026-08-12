import assert from "node:assert/strict";
import test from "node:test";
import { PortfolioCacheTag } from "@/server/modules/portfolio/models/portfolio-cache-tag";

test("portfolio cache tags are stable, entity-scoped and page-scoped", () => {
  assert.equal(PortfolioCacheTag.page("home"), "portfolio:page:home");
  assert.equal(PortfolioCacheTag.project("pay4me-withradius"), "portfolio:project:pay4me-withradius");
  assert.equal(PortfolioCacheTag.contentBlock("block-id"), "portfolio:content-block:block-id");
  assert.notEqual(PortfolioCacheTag.mediaBlock("shared-id"), PortfolioCacheTag.iconBlock("shared-id"));
});
