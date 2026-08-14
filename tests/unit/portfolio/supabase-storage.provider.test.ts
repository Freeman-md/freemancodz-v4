import assert from "node:assert/strict";
import test from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  PORTFOLIO_MEDIA_BUCKET,
  PortfolioStorageError,
  SupabaseStorageProvider,
} from "@/server/modules/portfolio/providers/supabase-storage.provider";

function client(
  options: {
    bucket?: { public: boolean } | null;
    bucketError?: string;
    uploadError?: string;
  } = {},
) {
  const uploads: unknown[] = [];

  const storage = {
    getBucket: async () => ({
      data: options.bucket === undefined ? { public: true } : options.bucket,
      error: options.bucketError ? { message: options.bucketError } : null,
    }),
    createBucket: async () => ({ error: null }),
    from: (bucket: string) => ({
      upload: async (...args: unknown[]) => {
        uploads.push(args);

        return { error: options.uploadError ? { message: options.uploadError } : null };
      },
      getPublicUrl: (path: string) => ({
        data: {
          publicUrl: `https://project.supabase.co/storage/v1/object/public/${bucket}/${path}`,
        },
      }),
    }),
  };

  return { client: { storage } as unknown as SupabaseClient, uploads };
}

test("storage provider verifies the public bucket and produces public URLs", async () => {
  const fake = client();

  const provider = new SupabaseStorageProvider(fake.client);

  await provider.ensurePublicBucket();
  assert.equal(
    provider.getPublicUrl("images/me"),
    `https://project.supabase.co/storage/v1/object/public/${PORTFOLIO_MEDIA_BUCKET}/images/me`,
  );
});

test("storage provider uploads typed admin assets and normalizes errors", async () => {
  const fake = client();

  const provider = new SupabaseStorageProvider(fake.client);

  await provider.upload({
    objectPath: "documents/example",
    body: new Uint8Array([1]),
    contentType: "application/pdf",
  });
  assert.equal(fake.uploads.length, 1);
  await assert.rejects(
    new SupabaseStorageProvider(client({ bucket: { public: false } }).client).ensurePublicBucket(),
    PortfolioStorageError,
  );
  await assert.rejects(
    new SupabaseStorageProvider(client({ uploadError: "secret provider detail" }).client).upload({
      objectPath: "images/me",
      body: new Uint8Array([1]),
      contentType: "image/jpeg",
    }),
    /Portfolio media upload failed/,
  );
});
