import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { mediaOwnerSchema } from "@/contracts/portfolio-admin.contract";
import { adminAuthService, portfolioMediaService } from "@/server/composition-root";
import { AdminAuthenticationError } from "@/server/modules/admin-auth/public";
import { PortfolioCacheTag } from "@/server/modules/portfolio/public";

const mediaExtensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
};

export async function POST(request: Request) {
  try {
    await adminAuthService.requireAdmin();
    const formData = await request.formData();

    const file = formData.get("file");

    const ownerValue = formData.get("owner");

    if (!(file instanceof File) || typeof ownerValue !== "string") {
      return NextResponse.json({ message: "Choose a media file and destination." }, { status: 400 });
    }

    const owner = mediaOwnerSchema.parse(JSON.parse(ownerValue));

    const fileExtension = mediaExtensions[file.type];

    if (!fileExtension) {
      return NextResponse.json({ message: "This media type is not supported." }, { status: 400 });
    }

    const result = await portfolioMediaService.replaceMedia({
      owner,
      body: new Uint8Array(await file.arrayBuffer()),
      contentType: file.type,
      fileExtension,
    });

    revalidateTag(
      owner.type === "profile" ? PortfolioCacheTag.profile : PortfolioCacheTag.mediaBlock(owner.id),
      "max",
    );

    return NextResponse.json(result, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    if (error instanceof AdminAuthenticationError) {
      return NextResponse.json(
        { message: error.code === "UNAUTHENTICATED" ? "Authentication required." : "Not authorised." },
        { status: error.code === "UNAUTHENTICATED" ? 401 : 403 },
      );
    }

    return NextResponse.json({ message: "Media could not be updated." }, { status: 400 });
  }
}
