import {
  MAX_PORTFOLIO_MEDIA_REQUEST_BYTES,
  mediaMetadataSchema,
  mediaOwnerSchema,
} from "@/contracts/portfolio-admin.contract";
import {
  AdminAuthenticationError,
  type AdminAuthService,
} from "@/modules/admin-auth/service";
import type { PortfolioMedia } from "@/modules/portfolio/types";
import { PortfolioCacheTag } from "@/modules/portfolio/cache";

const mediaExtensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
};

class MediaRequestTooLargeError extends Error {}

export type MediaUploadDependencies = {
  auth: Pick<AdminAuthService, "requireAdmin">;
  media: PortfolioMedia;
  revalidate: (tag: string) => void;
};

function getOwnerCacheTag(
  owner: Parameters<PortfolioMedia["replaceMedia"]>[0]["owner"],
  projectSlug?: string,
) {
  if (projectSlug) {
    return PortfolioCacheTag.project(projectSlug);
  }

  if (owner.type === "profile") {
    return PortfolioCacheTag.profile;
  }

  return PortfolioCacheTag.mediaBlock(owner.id);
}

async function readBoundedMultipart(request: Request) {
  const contentType = request.headers.get("content-type");

  if (!contentType?.toLowerCase().startsWith("multipart/form-data;")) {
    throw new Error("Invalid media request.");
  }

  const contentLength = Number(request.headers.get("content-length"));

  if (Number.isFinite(contentLength) && contentLength > MAX_PORTFOLIO_MEDIA_REQUEST_BYTES) {
    throw new MediaRequestTooLargeError();
  }

  if (!request.body) {
    throw new Error("Invalid media request.");
  }

  const reader = request.body.getReader();

  const chunks: Uint8Array[] = [];

  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    totalBytes += value.byteLength;

    if (totalBytes > MAX_PORTFOLIO_MEDIA_REQUEST_BYTES) {
      await reader.cancel();
      throw new MediaRequestTooLargeError();
    }

    chunks.push(value);
  }

  const body = new Uint8Array(totalBytes);

  let offset = 0;

  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new Response(body, { headers: { "content-type": contentType } }).formData();
}

export async function handlePortfolioMediaUpload(
  request: Request,
  dependencies: MediaUploadDependencies,
) {
  try {
    await dependencies.auth.requireAdmin();
    const formData = await readBoundedMultipart(request);

    const file = formData.get("file");

    const ownerValue = formData.get("owner");

    const metadataValue = formData.get("metadata");

    if (
      !(file instanceof File) ||
      (typeof ownerValue !== "string" && typeof metadataValue !== "string")
    ) {
      return Response.json({ message: "Choose a media file and destination." }, { status: 400 });
    }

    const fileExtension = mediaExtensions[file.type];

    if (!fileExtension) {
      return Response.json({ message: "This media type is not supported." }, { status: 400 });
    }

    const upload = {
      body: new Uint8Array(await file.arrayBuffer()),
      contentType: file.type,
      fileExtension,
    };

    if (typeof metadataValue === "string") {
      const result = await dependencies.media.createMediaBlock({
        ...upload,
        metadata: mediaMetadataSchema.parse(JSON.parse(metadataValue)),
      });

      dependencies.revalidate(PortfolioCacheTag.mediaBlock(result.id));

      return Response.json(result, { headers: { "Cache-Control": "private, no-store" } });
    }

    const owner = mediaOwnerSchema.parse(JSON.parse(String(ownerValue)));

    const result = await dependencies.media.replaceMedia({ owner, ...upload });

    dependencies.revalidate(getOwnerCacheTag(owner, result.projectSlug));

    return Response.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof AdminAuthenticationError) {
      return Response.json(
        {
          message:
            error.code === "UNAUTHENTICATED" ? "Authentication required." : "Not authorised.",
        },
        { status: error.code === "UNAUTHENTICATED" ? 401 : 403 },
      );
    }

    if (error instanceof MediaRequestTooLargeError) {
      return Response.json(
        { message: "Media request exceeds the 8 MB file boundary." },
        { status: 413 },
      );
    }

    return Response.json({ message: "Media could not be updated." }, { status: 400 });
  }
}
