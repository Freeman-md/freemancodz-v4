import assert from "node:assert/strict";
import test from "node:test";
import type { ILogger } from "@/server/infrastructure/logging/logger.interface";
import type { IMediaBlockAdministrationRepository } from "@/server/modules/portfolio/interfaces/media-block.repository.interface";
import type { IProfileAdministrationRepository } from "@/server/modules/portfolio/interfaces/profile.repository.interface";
import type { IPortfolioMediaStorageProvider } from "@/server/modules/portfolio/interfaces/supabase-storage.provider.interface";
import { PortfolioMediaService } from "@/server/modules/portfolio/services/portfolio-media.service";

const profile = { id: "global", name: "Freeman", title: "Engineer", positioning: "Systems", email: "f@example.com", linkedInUrl: "https://linkedin.com", githubUrl: "https://github.com", coverImage: "https://storage.test/storage/v1/object/public/portfolio-media/images/profile/old.webp", createdAt: new Date(), updatedAt: new Date(), iconCollections: [] };

function setup(databaseFails = false, oldCleanupFails = false) {
  const removed: string[] = [];

  const storage: IPortfolioMediaStorageProvider = { ensurePublicBucket: async () => undefined, hasObject: async () => true, uploadIfMissing: async () => "", getPublicUrl: (path) => `https://storage.test/storage/v1/object/public/portfolio-media/${path}`, upload: async ({ objectPath }) => `https://storage.test/storage/v1/object/public/portfolio-media/${objectPath}`, removeObject: async (path) => { removed.push(path); if (oldCleanupFails && path.includes("old.webp")) {throw new Error("cleanup");} }, getObjectPath: (url) => url.split("portfolio-media/")[1] || null };

  const profiles: IProfileAdministrationRepository = { findSingleton: async () => profile, updateSingleton: async () => undefined, updateCoverImage: async () => { if (databaseFails) {throw new Error("database");} }, replaceCollection: async () => undefined };

  const media: IMediaBlockAdministrationRepository = { findById: async () => null, findAll: async () => [], create: async () => "", update: async () => undefined, updateSource: async () => undefined, delete: async () => undefined };

  const errors: string[] = [];

 const logger: ILogger = { info: () => undefined, error: (message) => { errors.push(message); } };

  return { service: new PortfolioMediaService(storage, profiles, media, logger), removed, errors };
}

test("failed database metadata writes compensate by removing the newly uploaded object", async () => {
  const { service, removed } = setup(true);

  await assert.rejects(() => service.replaceMedia({ owner: { type: "profile" }, body: new Uint8Array([1]), contentType: "image/webp", fileExtension: "webp" }), /metadata/);
  assert.equal(removed.length, 1);
  assert.equal(removed[0].startsWith("images/profile/"), true);
});

test("old-object cleanup failure preserves the successful new source and reports a warning", async () => {
  const { service, removed, errors } = setup(false, true);

  const result = await service.replaceMedia({ owner: { type: "profile" }, body: new Uint8Array([1]), contentType: "image/webp", fileExtension: "webp" });

  assert.equal(result.cleanupWarning, true); assert.deepEqual(removed, ["images/profile/old.webp"]); assert.deepEqual(errors, ["portfolio.media.old_object_cleanup_failed"]);
});
