import "server-only";
import { randomUUID } from "node:crypto";
import { MAX_PORTFOLIO_MEDIA_BYTES } from "@/contracts/portfolio-admin.contract";
import type { Logger } from "@/infrastructure/logging/logger";
import type { MediaBlockStore } from "../types";
import type { ProfileStore } from "../types";
import type { ProjectStore } from "../types";
import type { PortfolioMediaStorage } from "../types";
import type {
  CreatePortfolioMediaInput,
  CreatePortfolioMediaResult,
  ReplacePortfolioMediaInput,
  ReplacePortfolioMediaResult,
} from "../types";

const ALLOWED_MEDIA_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
]);

export class PortfolioMediaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PortfolioMediaError";
  }
}

export class PortfolioMediaService {
  constructor(
    private readonly storage: PortfolioMediaStorage,
    private readonly profiles: ProfileStore,
    private readonly media: MediaBlockStore,
    private readonly projects: ProjectStore,
    private readonly logger: Logger,
  ) {}

  async replaceMedia(input: ReplacePortfolioMediaInput): Promise<ReplacePortfolioMediaResult> {
    this.validate(input);
    if (input.owner.type !== "media-block" && !input.contentType.startsWith("image/")) {
      throw new PortfolioMediaError("Profile and Project covers must be images.");
    }

    const ownership = await this.getOwnership(input.owner);

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
      } else if (ownership.mediaBlockId) {
        await this.media.updateManagedMedia(
          ownership.mediaBlockId,
          source,
          this.mediaTypeFor(input.contentType),
        );
      } else {
        throw new PortfolioMediaError("Media ownership could not be resolved.");
      }
    } catch {
      await this.removeCompensatingObject(objectPath);
      throw new PortfolioMediaError("Media metadata could not be updated.");
    }

    const previousSource = ownership.previousSource;

    const oldObjectPath = previousSource ? this.storage.getObjectPath(previousSource) : null;

    let cleanupWarning = false;

    if (oldObjectPath && previousSource && oldObjectPath !== objectPath) {
      try {
        const remainingReferences = await this.media.countSourceReferences(previousSource);

        if (remainingReferences === 0) {
          await this.storage.removeObject(oldObjectPath);
        }
      } catch (error) {
        cleanupWarning = true;
        this.logger.error("portfolio.media.old_object_cleanup_failed", {
          objectPath: oldObjectPath,
          error: error instanceof Error ? error.message : "Unknown cleanup error",
        });
      }
    }

    return { source, cleanupWarning, projectSlug: ownership.projectSlug };
  }

  async createMediaBlock(input: CreatePortfolioMediaInput): Promise<CreatePortfolioMediaResult> {
    this.validate(input);
    const objectPath = `media/${randomUUID()}.${input.fileExtension}`;

    const source = await this.storage.upload({ objectPath, body: input.body, contentType: input.contentType });

    try {
      const id = await this.media.create({
        ...input.metadata,
        source,
        type: this.mediaTypeFor(input.contentType),
      });

      return { id, source, cleanupWarning: false };
    } catch {
      await this.removeCompensatingObject(objectPath);
      throw new PortfolioMediaError("Media metadata could not be created.");
    }
  }

  private validate(input: Pick<ReplacePortfolioMediaInput, "body" | "contentType" | "fileExtension">) {
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

  private mediaTypeFor(contentType: string) {
    return contentType.startsWith("image/") ? ("IMAGE" as const) : ("VIDEO" as const);
  }

  private async getOwnership(owner: ReplacePortfolioMediaInput["owner"]) {
    if (owner.type === "profile") {
      return { previousSource: (await this.profiles.findSingleton()).coverImage };
    }

    if (owner.type === "project-cover") {
      const project = await this.projects.findById(owner.id);

      if (!project?.cover) {
        throw new PortfolioMediaError("Project does not have a replaceable cover.");
      }

      return {
        previousSource: project.cover.source,
        mediaBlockId: project.cover.id,
        projectSlug: project.slug,
      };
    }

    const record = await this.media.findById(owner.id);

    if (!record) {
      throw new PortfolioMediaError("Media record was not found.");
    }

    return { previousSource: record.source, mediaBlockId: record.id };
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
