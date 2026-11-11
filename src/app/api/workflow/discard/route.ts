import type { NextRequest } from "next/server";
import { createWorkflowDiscardPost } from "./post";

export async function POST(request: NextRequest) {
  const { workflowService, logger } = await import("@/modules/composition");

  return createWorkflowDiscardPost(workflowService, logger)(request);
}
