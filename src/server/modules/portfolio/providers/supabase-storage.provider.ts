import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  IPortfolioMediaStorageProvider,
  PortfolioMediaUpload,
} from "../interfaces/supabase-storage.provider.interface";

export const PORTFOLIO_MEDIA_BUCKET = "portfolio-media";

export class PortfolioStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PortfolioStorageError";
  }
}

export class SupabaseStorageProvider implements IPortfolioMediaStorageProvider {
  constructor(private readonly clientSource: SupabaseClient | (() => SupabaseClient)) {}

  private get client() {
    return typeof this.clientSource === "function" ? this.clientSource() : this.clientSource;
  }

  async ensurePublicBucket() {
    const { data, error } = await this.client.storage.getBucket(PORTFOLIO_MEDIA_BUCKET);

    if (error && !/not found/i.test(error.message)) {
      throw new PortfolioStorageError("Portfolio media bucket could not be checked.");
    }

    if (!data) {
      const result = await this.client.storage.createBucket(PORTFOLIO_MEDIA_BUCKET, {
        public: true,
      });

      if (result.error) {
        throw new PortfolioStorageError("Portfolio media bucket could not be created.");
      }

      return;
    }

    if (!data.public) {
      throw new PortfolioStorageError("Portfolio media bucket must be public.");
    }
  }

  async uploadIfMissing(asset: PortfolioMediaUpload) {
    const bucket = this.client.storage.from(PORTFOLIO_MEDIA_BUCKET);

    const existing = await bucket.download(asset.objectPath);

    if (!existing.error) {
      return this.getPublicUrl(asset.objectPath);
    }

    const result = await bucket.upload(asset.objectPath, asset.body, {
      contentType: asset.contentType,
      upsert: false,
    });

    if (result.error) {
      throw new PortfolioStorageError(`Portfolio media upload failed: ${asset.objectPath}`);
    }

    return this.getPublicUrl(asset.objectPath);
  }

  async upload(asset: PortfolioMediaUpload) {
    const result = await this.client.storage
      .from(PORTFOLIO_MEDIA_BUCKET)
      .upload(asset.objectPath, asset.body, { contentType: asset.contentType, upsert: false });

    if (result.error) {
      throw new PortfolioStorageError("Portfolio media upload failed.");
    }

    return this.getPublicUrl(asset.objectPath);
  }

  async removeObject(objectPath: string) {
    const result = await this.client.storage.from(PORTFOLIO_MEDIA_BUCKET).remove([objectPath]);

    if (result.error) {
      throw new PortfolioStorageError("Portfolio media cleanup failed.");
    }
  }

  getObjectPath(publicUrl: string) {
    const marker = `/storage/v1/object/public/${PORTFOLIO_MEDIA_BUCKET}/`;

    try {
      const url = new URL(publicUrl);

      const index = url.pathname.indexOf(marker);

      return index === -1 ? null : decodeURIComponent(url.pathname.slice(index + marker.length));
    } catch {
      return null;
    }
  }

  async hasObject(objectPath: string) {
    const result = await this.client.storage.from(PORTFOLIO_MEDIA_BUCKET).download(objectPath);

    return !result.error;
  }

  getPublicUrl(objectPath: string) {
    return this.client.storage.from(PORTFOLIO_MEDIA_BUCKET).getPublicUrl(objectPath).data.publicUrl;
  }
}
