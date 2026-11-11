import { type NextRequest, NextResponse } from "next/server";
import { workflowObservationSchema } from "@/contracts/assistant.contract";
import type { Logger } from "@/infrastructure/logging/logger";
import type { WorkflowService } from "@/modules/workflow/service";
import { readChatVisitorKey, readRequestBody } from "../../chat/helpers";
import { isSameWorkflowOrigin } from "../origin";

export function createWorkflowDiscardPost(
  workflow: Pick<WorkflowService, "discardDraft">,
  logger: Logger,
) {
  return async function POST(request: NextRequest) {
    const headers = { "Cache-Control": "no-store" };

    if (!isSameWorkflowOrigin(request)) {
      return NextResponse.json({ error: "Invalid request origin." }, { status: 403, headers });
    }

    const visitorKey = readChatVisitorKey(request);

    if (!visitorKey) {
      return NextResponse.json({ error: "Draft unavailable." }, { status: 404, headers });
    }

    let value: unknown;

    try {
      const body = await readRequestBody(request);

      if (body === null) {
        return NextResponse.json({ error: "Request body is too large." }, { status: 413, headers });
      }

      value = JSON.parse(body);
    } catch {
      return NextResponse.json({ error: "Invalid draft confirmation." }, { status: 400, headers });
    }

    const draft = workflowObservationSchema.safeParse(value);

    if (!draft.success) {
      return NextResponse.json({ error: "Invalid draft confirmation." }, { status: 400, headers });
    }

    try {
      if (await workflow.discardDraft(visitorKey, draft.data)) {
        return new NextResponse(null, { status: 204, headers });
      }

      return NextResponse.json(
        { error: "The draft changed or is unavailable." },
        { status: 409, headers },
      );
    } catch {
      logger.error("workflow.discard_failed");

      return NextResponse.json({ error: "Could not discard the draft." }, { status: 503, headers });
    }
  };
}
