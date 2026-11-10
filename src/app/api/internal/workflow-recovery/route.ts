import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getWorkflowRecoveryConfig } from "@/infrastructure/config/env";

export function createWorkflowRecoveryPost(
  config: typeof getWorkflowRecoveryConfig,
  run: (adoptLegacy: boolean) => Promise<{ handled: number }>,
) {
  return async function POST(request: Request) {
    const settings = config();

    const bearer = request.headers.get("authorization");

    if (
      !settings ||
      !bearer?.startsWith("Bearer ") ||
      bearer.length > 1024 ||
      !timingSafeEqual(digest(bearer.slice(7)), digest(settings.secret))
    ) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    try {
      return NextResponse.json(await run(settings.adoptLegacy), {
        headers: { "Cache-Control": "no-store" },
      });
    } catch {
      return NextResponse.json({ error: "Recovery is temporarily unavailable." }, { status: 503 });
    }
  };
}

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

export function POST(request: Request) {
  return createWorkflowRecoveryPost(getWorkflowRecoveryConfig, async (adoptLegacy) => {
    const { workflowService, workflowExecutionService } = await import("@/modules/composition");

    if (adoptLegacy) {
      await workflowService.adoptLegacyApprovals();
    }

    return workflowExecutionService.runDue();
  })(request);
}
