import { revalidateTag } from "next/cache";
import { adminAuthService, portfolioMediaService } from "@/server/composition-root";
import { handlePortfolioMediaUpload } from "./media-upload";

export async function POST(request: Request) {
  return handlePortfolioMediaUpload(request, {
    auth: adminAuthService,
    media: portfolioMediaService,
    revalidate: (tag) => revalidateTag(tag, "max"),
  });
}
