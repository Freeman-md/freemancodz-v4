import { createHash, timingSafeEqual } from "node:crypto";
import type { Logger } from "@/infrastructure/logging/logger";
import type { WorkflowRunner } from "@/modules/workflow/runner";

function hash(value: string) {
  return createHash("sha256").update(value).digest();
}

export function createWorkflowRunnerPost(
  getSecret: () => string | null,
  runner: Pick<WorkflowRunner, "runDue">,
  logger: Logger,
) {
  return async function POST(request: Request) {
    const secret = getSecret();

    const authorization = request.headers.get("authorization");

    if (
      !secret ||
      !authorization ||
      authorization.length > 1024 ||
      !timingSafeEqual(hash(authorization), hash(`Bearer ${secret}`))
    ) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    try {
      return Response.json(await runner.runDue(), { headers: { "Cache-Control": "no-store" } });
    } catch {
      logger.error("workflow.runner_unavailable");

      return Response.json({ error: "Workflow runner unavailable." }, { status: 503 });
    }
  };
}
