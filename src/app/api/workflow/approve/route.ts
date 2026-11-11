import type { NextRequest } from "next/server";
import { createWorkflowApprovalPost } from "./post";

export async function POST(request: NextRequest) {
  const { workflowService, logger } = await import("@/modules/composition");

  return createWorkflowApprovalPost(workflowService, logger)(request);
}
