import type { NextRequest } from "next/server";
import { createWorkflowApprovalPost } from "./post";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  const { workflowService, workflowRunner, logger } = await import("@/modules/composition");

  return createWorkflowApprovalPost(workflowService, logger, (reviewId, onActivity) =>
    workflowRunner.runDue(reviewId, onActivity),
  )(request);
}
