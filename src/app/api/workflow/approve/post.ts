import { type NextRequest, NextResponse } from "next/server";
import { readChatVisitorKey, readRequestBody } from "../../chat/helpers";
import {
  workflowApprovalSchema,
  type AssistantActivity,
  type AssistantStreamEvent,
} from "@/contracts/assistant.contract";
import type { Logger } from "@/infrastructure/logging/logger";
import type { WorkflowService } from "@/modules/workflow/service";
import { isSameWorkflowOrigin } from "../origin";

export function createWorkflowApprovalPost(
  workflow: Pick<WorkflowService, "acceptReview" | "getApprovedResult">,
  logger: Logger,
  executeApprovedReview?: (
    reviewId: string,
    onActivity?: (activity: AssistantActivity) => void,
  ) => Promise<unknown>,
) {
  return async function POST(request: NextRequest) {
    const headers = { "Cache-Control": "no-store" };

    if (!isSameWorkflowOrigin(request)) {
      return NextResponse.json({ error: "Invalid request origin." }, { status: 403, headers });
    }

    const visitorKey = readChatVisitorKey(request);

    if (!visitorKey) {
      return NextResponse.json({ error: "Review unavailable." }, { status: 404, headers });
    }

    let value: unknown;

    try {
      const body = await readRequestBody(request);

      if (body === null) {
        return NextResponse.json({ error: "Request body is too large." }, { status: 413, headers });
      }

      value = JSON.parse(body);
    } catch {
      return NextResponse.json({ error: "Invalid confirmation." }, { status: 400, headers });
    }

    const parsed = workflowApprovalSchema.safeParse(value);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid confirmation." }, { status: 400, headers });
    }

    try {
      const result = await workflow.acceptReview(visitorKey, parsed.data);

      switch (result.status) {
        case "conflict":
          return NextResponse.json(
            { error: "The review changed. Check the latest details." },
            { status: 409, headers },
          );
        case "not_found":
          return NextResponse.json({ error: "Review unavailable." }, { status: 404, headers });
      }

      const { reviewId } = result;

      const execute = async (onActivity?: (activity: AssistantActivity) => void) => {
        try {
          await executeApprovedReview?.(reviewId, onActivity);
        } catch {
          logger.error("workflow.approved_run_interrupted", { reviewId });
        }

        const saved = await workflow.getApprovedResult(visitorKey, reviewId);

        if (!saved) {
          throw new Error("The approved run could not be restored.");
        }

        return saved;
      };

      if (request.headers.get("accept") === "application/x-ndjson") {
        let connected = true;

        const encoder = new TextEncoder();

        const body = new ReadableStream<Uint8Array>({
          async start(controller) {
            function send(event: AssistantStreamEvent) {
              if (connected) {
                controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
              }
            }

            try {
              const instance = await execute(send);

              send({ type: "workflow_instance", instance });
              send({ type: "done" });
            } catch {
              logger.error("workflow.approval_result_unavailable", { reviewId });
              send({ type: "error", error: "Could not read the saved progress." });
            } finally {
              if (connected) {
                controller.close();
              }
            }
          },
          cancel() {
            connected = false;
          },
        });

        return new NextResponse(body, {
          headers: {
            ...headers,
            "Cache-Control": "no-store, no-transform",
            "Content-Type": "application/x-ndjson; charset=utf-8",
            "X-Content-Type-Options": "nosniff",
          },
        });
      }

      const saved = await execute();

      return NextResponse.json(saved, { status: saved.status === "active" ? 202 : 200, headers });
    } catch {
      logger.error("workflow.approval_failed");

      return NextResponse.json(
        { error: "Could not confirm the request. Check its saved progress." },
        { status: 503, headers },
      );
    }
  };
}
