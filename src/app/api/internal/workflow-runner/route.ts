import { getWorkflowRunnerSecret } from "@/infrastructure/config/env";
import { createWorkflowRunnerPost } from "./post";

export const maxDuration = 30;

export async function POST(request: Request) {
  const { workflowRunner, logger } = await import("@/modules/composition");

  return createWorkflowRunnerPost(getWorkflowRunnerSecret, workflowRunner, logger)(request);
}
