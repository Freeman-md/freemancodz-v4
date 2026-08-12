import "server-only";
import { randomUUID } from "node:crypto";
import type { ILogger } from "@/server/infrastructure/logging/logger.interface";
import type { IMediaBlockAdministrationRepository } from "../interfaces/media-block.repository.interface";
import type {
  IPortfolioMediaService,
  ReplacePortfolioMediaInput,
} from "../interfaces/portfolio-media.service.interface";
import type { IProfileAdministrationRepository } from "../interfaces/profile.repository.interface";
import type { IPortfolioMediaStorageProvider } from "../interfaces/supabase-storage.provider.interface";

const ALLOWED_MEDIA_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
]);

export const MAX_PORTFOLIO_MEDIA_BYTES = 8 * 1024 * 1024;

export class PortfolioMediaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PortfolioMediaError";
  }
}

export class PortfolioMediaService implements IPortfolioMediaService {
  constructor(
    private readonly storage: IPortfolioMediaStorageProvider,
    private readonly profiles: IProfileAdministrationRepository,
    private readonly media: IMediaBlockAdministrationRepository,
    private readonly logger: ILogger,
  ) {}

  async replaceMedia(input: ReplacePortfolioMediaInput) {
    this.validate(input);
    const previousSource = await this.getPreviousSource(input.owner);

    const folder = input.owner.type === "profile" ? "images/profile" : "media";

    const objectPath = `${folder}/${randomUUID()}.${input.fileExtension}`;

    const source = await this.storage.upload({
      objectPath,
      body: input.body,
      contentType: input.contentType,
    });

    try {
      if (input.owner.type === "profile") {
        await this.profiles.updateCoverImage(source);
      } else {
        await this.media.updateSource(input.owner.id, source);
      }
    } catch {
      await this.removeCompensatingObject(objectPath);
      throw new PortfolioMediaError("Media metadata could not be updated.");
    }

    const oldObjectPath = previousSource ? this.storage.getObjectPath(previousSource) : null;

    let cleanupWarning = false;

    if (oldObjectPath && oldObjectPath !== objectPath) {
      try {
        await this.storage.removeObject(oldObjectPath);
      } catch (error) {
        cleanupWarning = true;
        this.logger.error("portfolio.media.old_object_cleanup_failed", {
          objectPath: oldObjectPath,
          error: error instanceof Error ? error.message : "Unknown cleanup error",
        });
      }
    }

    return { source, cleanupWarning };
  }

  private validate(input: ReplacePortfolioMediaInput) {
    if (!ALLOWED_MEDIA_TYPES.has(input.contentType)) {
      throw new PortfolioMediaError("Unsupported media type.");
    }

    if (input.body.byteLength === 0 || input.body.byteLength > MAX_PORTFOLIO_MEDIA_BYTES) {
      throw new PortfolioMediaError("Media must be between 1 byte and 8 MB.");
    }

    if (!/^[a-z0-9]+$/.test(input.fileExtension)) {
      throw new PortfolioMediaError("Invalid media file extension.");
    }
  }

  private async getPreviousSource(owner: ReplacePortfolioMediaInput["owner"]) {
    if (owner.type === "profile") {
      return (await this.profiles.findSingleton()).coverImage;
    }

    const record = await this.media.findById(owner.id);

    if (!record) {
      throw new PortfolioMediaError("Media record was not found.");
    }

    return record.source;
  }

  private async removeCompensatingObject(objectPath: string) {
    try {
      await this.storage.removeObject(objectPath);
    } catch (error) {
      this.logger.error("portfolio.media.new_object_cleanup_failed", {
        objectPath,
        error: error instanceof Error ? error.message : "Unknown cleanup error",
      });
    }
  }
}
