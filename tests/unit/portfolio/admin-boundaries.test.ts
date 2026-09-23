import assert from "node:assert/strict";
import test from "node:test";
import { MAX_PORTFOLIO_MEDIA_REQUEST_BYTES } from "@/contracts/portfolio-admin.contract";
import { runAuthorizedAdminMutation } from "@/app/admin/admin-action-boundary";
import { invalidateProjectUpdate } from "@/app/admin/project-cache-invalidation";
import { invalidateReusableBlockUpdate } from "@/app/admin/reusable-block-cache-invalidation";
import { handlePortfolioMediaUpload } from "@/app/api/admin/media/media-upload";
import { AdminAuthenticationError } from "@/modules/admin-auth/public";
import type { IPortfolioMediaService } from "@/modules/portfolio/interfaces/portfolio-media.service.interface";

test("direct admin mutation boundary rejects before executing a write", async () => {
  let writes = 0;

  await assert.rejects(
    () =>
      runAuthorizedAdminMutation(
        async () => {
          throw new AdminAuthenticationError("Authentication is required.", "UNAUTHENTICATED");
        },
        async () => {
          writes += 1;
        },
      ),
    AdminAuthenticationError,
  );
  assert.equal(writes, 0);

  await runAuthorizedAdminMutation(
    async () => ({ id: "admin" }),
    async () => {
      writes += 1;
    },
  );
  assert.equal(writes, 1);
});

test("admin authorization is evaluated for every mutation and never reused as public cache state", async () => {
  let authorizationChecks = 0;

  const requireAdmin = async () => {
    authorizationChecks += 1;

    return { id: `admin-${authorizationChecks}` };
  };

  await runAuthorizedAdminMutation(requireAdmin, async () => "first");
  await runAuthorizedAdminMutation(requireAdmin, async () => "second");

  assert.equal(authorizationChecks, 2);
});

test("project field invalidation is slug-targeted while membership changes add the collection tag", () => {
  const tags: string[] = [];

  invalidateProjectUpdate({ slug: "pay4me-withradius", collectionChanged: false }, (tag) =>
    tags.push(tag),
  );
  assert.deepEqual(tags, ["portfolio:project:pay4me-withradius"]);

  tags.length = 0;
  invalidateProjectUpdate({ slug: "pay4me-withradius", collectionChanged: true }, (tag) =>
    tags.push(tag),
  );
  assert.deepEqual(tags, ["portfolio:project:pay4me-withradius", "portfolio:projects"]);
});

test("Action and Media metadata updates invalidate subtype and shared IconBlock identities", () => {
  const tags: string[] = [];

  invalidateReusableBlockUpdate("action", "action-id", (tag) => tags.push(tag));
  invalidateReusableBlockUpdate("media", "media-id", (tag) => tags.push(tag));

  assert.deepEqual(tags, [
    "portfolio:action-block:action-id",
    "portfolio:icon-block:action-id",
    "portfolio:media-block:media-id",
    "portfolio:icon-block:media-id",
  ]);
});

test("media route boundary rejects unauthorised and over-limit requests before media writes", async () => {
  let writes = 0;

  const media: IPortfolioMediaService = {
    createMediaBlock: async () => ({ id: "media-id", source: "https://storage.test/new.webp", cleanupWarning: false }),
    replaceMedia: async () => {
      writes += 1;

      return { source: "https://storage.test/new.webp", cleanupWarning: false };
    },
  };

  const unauthorised = await handlePortfolioMediaUpload(
    new Request("https://portfolio.test/api/admin/media", { method: "POST" }),
    {
      auth: {
        requireAdmin: async () => {
          throw new AdminAuthenticationError("Authentication is required.", "UNAUTHENTICATED");
        },
      },
      media,
      revalidate: () => undefined,
    },
  );

  assert.equal(unauthorised.status, 401);
  assert.equal(writes, 0);

  const forbidden = await handlePortfolioMediaUpload(
    new Request("https://portfolio.test/api/admin/media", { method: "POST" }),
    {
      auth: {
        requireAdmin: async () => {
          throw new AdminAuthenticationError("Not authorised.", "FORBIDDEN");
        },
      },
      media,
      revalidate: () => undefined,
    },
  );

  assert.equal(forbidden.status, 403);
  assert.equal(writes, 0);

  const tooLarge = await handlePortfolioMediaUpload(
    new Request("https://portfolio.test/api/admin/media", {
      method: "POST",
      headers: {
        "content-type": "multipart/form-data; boundary=bounded-test",
        "content-length": String(MAX_PORTFOLIO_MEDIA_REQUEST_BYTES + 1),
      },
      body: "bounded-test",
    }),
    {
      auth: { requireAdmin: async () => ({ id: "admin", email: "freemanmadudili@gmail.com" }) },
      media,
      revalidate: () => undefined,
    },
  );

  assert.equal(tooLarge.status, 413);
  assert.equal(writes, 0);

  const streamedTooLarge = await handlePortfolioMediaUpload(
    new Request("https://portfolio.test/api/admin/media", {
      method: "POST",
      headers: { "content-type": "multipart/form-data; boundary=bounded-test" },
      body: new Uint8Array(MAX_PORTFOLIO_MEDIA_REQUEST_BYTES + 1),
    }),
    {
      auth: { requireAdmin: async () => ({ id: "admin", email: "freemanmadudili@gmail.com" }) },
      media,
      revalidate: () => undefined,
    },
  );

  assert.equal(streamedTooLarge.status, 413);
  assert.equal(writes, 0);
});

test("authorised media route writes once and revalidates the owning Project slug", async () => {
  const form = new FormData();

  form.set("file", new File([new Uint8Array([1, 2, 3])], "cover.webp", { type: "image/webp" }));
  form.set(
    "owner",
    JSON.stringify({
      type: "project-cover",
      id: "3f4b69ba-b61d-4870-a4d8-65b67790b4da",
    }),
  );
  const tags: string[] = [];

  let writes = 0;

  const response = await handlePortfolioMediaUpload(
    new Request("https://portfolio.test/api/admin/media", {
      method: "POST",
      body: form,
    }),
    {
      auth: { requireAdmin: async () => ({ id: "admin", email: "freemanmadudili@gmail.com" }) },
      media: {
        createMediaBlock: async () => ({ id: "media-id", source: "https://storage.test/new.webp", cleanupWarning: false }),
        replaceMedia: async () => {
          writes += 1;

          return {
            source: "https://storage.test/new.webp",
            cleanupWarning: false,
            projectSlug: "pay4me-withradius",
          };
        },
      },
      revalidate: (tag) => tags.push(tag),
    },
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.equal(writes, 1);
  assert.deepEqual(tags, ["portfolio:project:pay4me-withradius"]);
});
