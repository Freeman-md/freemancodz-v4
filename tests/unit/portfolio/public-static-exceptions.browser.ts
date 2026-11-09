import assert from "node:assert/strict";
import test from "node:test";
import {
  portfolioIconRegistry,
  resolvePortfolioIcon,
} from "@/app/_portfolio/components/PortfolioIcon";

test("admin icon previews resolve registered icons and omit unrecognised values", () => {
  assert.equal(resolvePortfolioIcon("Search"), portfolioIconRegistry.Search);
  assert.equal(resolvePortfolioIcon("UnknownIcon"), null);
  assert.equal(resolvePortfolioIcon(null), null);
});
