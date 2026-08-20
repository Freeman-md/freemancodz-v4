import assert from "node:assert/strict";
import test from "node:test";
import type { ILogger } from "@/server/infrastructure/logging/logger.interface";
import type { IMediaBlockAdministrationRepository } from "@/server/modules/portfolio/interfaces/media-block.repository.interface";
import type { IProfileAdministrationRepository } from "@/server/modules/portfolio/interfaces/profile.repository.interface";
import type { IProjectAdministrationRepository } from "@/server/modules/portfolio/interfaces/project.repository.interface";
import type { IPortfolioMediaStorageProvider } from "@/server/modules/portfolio/interfaces/supabase-storage.provider.interface";
import { PortfolioMediaService } from "@/server/modules/portfolio/services/portfolio-media.service";

const profile = {
  id: "global",
  name: "Freeman",
  title: "Engineer",
  positioning: "Systems",
  email: "f@example.com",
  linkedInUrl: "https://linkedin.com",
  githubUrl: "https://github.com",
  coverImage:
    "https://storage.test/storage/v1/object/public/portfolio-media/images/profile/old.webp",
  createdAt: new Date(),
  updatedAt: new Date(),
  iconCollections: [],
};

function setup(
  databaseFails = false,
  oldCleanupFails = false,
  remainingSourceReferences = 0,
  referenceCheckFails = false,
) {
  const removed: string[] = [];

  const updatedMedia: Array<{ id: string; source: string }> = [];

  const createdMedia: Array<{ source: string; type: "IMAGE" | "VIDEO" }> = [];

  const storage: IPortfolioMediaStorageProvider = {
    ensurePublicBucket: async () => undefined,
    getPublicUrl: (path) => `https://storage.test/storage/v1/object/public/portfolio-media/${path}`,
    upload: async ({ objectPath }) =>
      `https://storage.test/storage/v1/object/public/portfolio-media/${objectPath}`,
    removeObject: async (path) => {
      removed.push(path);
      if (oldCleanupFails && path.includes("old.webp")) {
        throw new Error("cleanup");
      }
    },
    getObjectPath: (url) => url.split("portfolio-media/")[1] || null,
  };

  const profiles: IProfileAdministrationRepository = {
    findSingleton: async () => profile,
    updateSingleton: async () => undefined,
    updateCoverImage: async () => {
      if (databaseFails) {
        throw new Error("database");
      }
    },
    replaceCollection: async () => undefined,
  };

  const media: IMediaBlockAdministrationRepository = {
    findById: async () => null,
    findAll: async () => [],
    countSourceReferences: async () => {
      if (referenceCheckFails) {
        throw new Error("reference check");
      }

      return remainingSourceReferences;
    },
    create: async (input) => {
      if (databaseFails) {
        throw new Error("database");
      }

      createdMedia.push({ source: input.source, type: input.type });

      return "new-media-id";
    },
    update: async () => undefined,
    updateManagedMedia: async (id, source) => {
      if (databaseFails) {
        throw new Error("database");
      }

      updatedMedia.push({ id, source });
    },
    delete: async () => undefined,
  };

  const project = {
    id: "3f4b69ba-b61d-4870-a4d8-65b67790b4da",
    slug: "pay4me-withradius",
    title: "Pay4Me",
    category: "Fintech",
    problem: "Problem",
    solution: "Solution",
    outcome: null,
    coverId: "6b4952f0-3033-44d5-bb92-d7469bd19a31",
    externalLinks: [],
    featured: true,
    order: 1,
    markdown: null,
    visualBlock: "Pay4MeVisual",
    visualText: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    cover: {
      id: "6b4952f0-3033-44d5-bb92-d7469bd19a31",
      type: "IMAGE" as const,
      source: "/images/work/withradius-hero.jpg",
      altText: "Pay4Me",
      iconBlock: {
        id: "6b4952f0-3033-44d5-bb92-d7469bd19a31",
        iconName: null,
        label: "Pay4Me cover",
        copy: null,
        colour: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
  };

  const projects: IProjectAdministrationRepository = {
    findAll: async () => [project],
    findById: async () => project,
    findBySlug: async () => project,
    findBySlugs: async () => [project],
    findFeatured: async () => [project],
    create: async () => "",
    update: async () => undefined,
    delete: async () => undefined,
  };

  const errors: string[] = [];

  const logger: ILogger = {
    info: () => undefined,
    error: (message) => {
      errors.push(message);
    },
  };

  return {
    service: new PortfolioMediaService(storage, profiles, media, projects, logger),
    removed,
    errors,
    updatedMedia,
    createdMedia,
  };
}

test("failed database metadata writes compensate by removing the newly uploaded object", async () => {
  const { service, removed } = setup(true);

  await assert.rejects(
    () =>
      service.replaceMedia({
        owner: { type: "profile" },
        body: new Uint8Array([1]),
        contentType: "image/webp",
        fileExtension: "webp",
      }),
    /metadata/,
  );
  assert.equal(removed.length, 1);
  assert.equal(removed[0].startsWith("images/profile/"), true);
});

test("file-backed MediaBlock creation stores the canonical source and derives its type from MIME", async () => {
  const { service, createdMedia } = setup();

  const result = await service.createMediaBlock({
    body: new Uint8Array([1]),
    contentType: "video/webm",
    fileExtension: "webm",
    metadata: { iconName: null, label: "Demo", copy: null, colour: null, altText: "Demo video" },
  });

  assert.equal(result.id, "new-media-id");
  assert.equal(createdMedia[0]?.source, result.source);
  assert.equal(createdMedia[0]?.type, "VIDEO");
});

test("old-object cleanup failure preserves the successful new source and reports a warning", async () => {
  const { service, removed, errors } = setup(false, true);

  const result = await service.replaceMedia({
    owner: { type: "profile" },
    body: new Uint8Array([1]),
    contentType: "image/webp",
    fileExtension: "webp",
  });

  assert.equal(result.cleanupWarning, true);
  assert.deepEqual(removed, ["images/profile/old.webp"]);
  assert.deepEqual(errors, ["portfolio.media.old_object_cleanup_failed"]);
});

test("shared managed sources remain stored while another portfolio owner references them", async () => {
  const { service, removed } = setup(false, false, 1);

  const result = await service.replaceMedia({
    owner: { type: "profile" },
    body: new Uint8Array([1]),
    contentType: "image/webp",
    fileExtension: "webp",
  });

  assert.equal(result.cleanupWarning, false);
  assert.deepEqual(removed, []);
});

test("reference-check failure preserves the old managed source and reports a cleanup warning", async () => {
  const { service, removed, errors } = setup(false, false, 0, true);

  const result = await service.replaceMedia({
    owner: { type: "profile" },
    body: new Uint8Array([1]),
    contentType: "image/webp",
    fileExtension: "webp",
  });

  assert.equal(result.cleanupWarning, true);
  assert.deepEqual(removed, []);
  assert.deepEqual(errors, ["portfolio.media.old_object_cleanup_failed"]);
});

test("project-cover replacement updates its owned MediaBlock and returns the canonical slug tag identity", async () => {
  const { service, updatedMedia, removed } = setup();

  const result = await service.replaceMedia({
    owner: { type: "project-cover", id: "3f4b69ba-b61d-4870-a4d8-65b67790b4da" },
    body: new Uint8Array([1]),
    contentType: "image/webp",
    fileExtension: "webp",
  });

  assert.equal(result.projectSlug, "pay4me-withradius");
  assert.equal(updatedMedia[0]?.id, "6b4952f0-3033-44d5-bb92-d7469bd19a31");
  assert.deepEqual(removed, []);
});

test("media validation rejects invalid MIME and files above the exact 8 MB boundary", async () => {
  const { service } = setup();

  await assert.rejects(
    () =>
      service.replaceMedia({
        owner: { type: "profile" },
        body: new Uint8Array([1]),
        contentType: "application/pdf",
        fileExtension: "pdf",
      }),
    /Unsupported/,
  );
  const exactBoundary = await service.replaceMedia({
    owner: { type: "profile" },
    body: new Uint8Array(8 * 1024 * 1024),
    contentType: "image/webp",
    fileExtension: "webp",
  });

  assert.match(exactBoundary.source, /images\/profile/);
  await assert.rejects(
    () =>
      service.replaceMedia({
        owner: { type: "profile" },
        body: new Uint8Array(8 * 1024 * 1024 + 1),
        contentType: "image/webp",
        fileExtension: "webp",
      }),
    /8 MB/,
  );
});
