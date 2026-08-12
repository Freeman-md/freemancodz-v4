import assert from "node:assert/strict";
import test from "node:test";
import { siteAssetLinks } from "@/shared/config/links";

const publicAssetPaths = [
  [siteAssetLinks.heroImage, "/storage/v1/object/public/portfolio-media/images/me"],
  [
    siteAssetLinks.outsideImages.Strength,
    "/storage/v1/object/public/portfolio-media/images/strength-training",
  ],
  [
    siteAssetLinks.outsideImages.Endurance,
    "/storage/v1/object/public/portfolio-media/images/running",
  ],
  [
    siteAssetLinks.outsideImages.Community,
    "/storage/v1/object/public/portfolio-media/images/community",
  ],
  [
    siteAssetLinks.outsideImages["Continuous Learning"],
    "/storage/v1/object/public/portfolio-media/images/learning",
  ],
  [siteAssetLinks.cv, "/storage/v1/object/public/portfolio-media/documents/cv"],
] as const;

test("live portfolio asset links use the public Supabase bucket", () => {
  for (const [source, expectedPath] of publicAssetPaths) {
    const url = new URL(source);

    assert.equal(url.pathname, expectedPath);
    assert.ok(url.protocol === "http:" || url.protocol === "https:");
    assert.doesNotMatch(source, /\/api\/blob/);
  }
});
