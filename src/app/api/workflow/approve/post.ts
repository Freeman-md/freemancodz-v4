import { type NextRequest, NextResponse } from "next/server";
import { readChatVisitorKey, readRequestBody } from "../../chat/helpers";
import { workflowApprovalSchema } from "@/contracts/assistant.contract";
import type { Logger } from "@/infrastructure/logging/logger";
import type { WorkflowService } from "@/modules/workflow/service";

export function createWorkflowApprovalPost(
  workflow: Pick<WorkflowService, "approve">,
  logger: Logger,
) {
  return async function POST(request: NextRequest) {
    const headers = { "Cache-Control": "no-store" };

    const host = request.headers.get("host") ?? request.nextUrl.host;

    const protocol = process.env.VERCEL === "1" ? "https:" : request.nextUrl.protocol;

    // Next may use its bind address for nextUrl on a self-hosted production server.
    if (request.headers.get("origin") !== `${protocol}//${host}`) {
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
      const result = await workflow.approve(visitorKey, parsed.data);

      switch (result.status) {
        case "accepted":
          return NextResponse.json(result.workflow, { status: 202, headers });
        case "conflict":
          return NextResponse.json(
            { error: "The review changed. Check the latest details." },
            { status: 409, headers },
          );
        case "not_found":
          return NextResponse.json({ error: "Review unavailable." }, { status: 404, headers });
      }
    } catch {
      logger.error("workflow.approval_failed");

      return NextResponse.json(
        { error: "Could not confirm the request. Check its saved progress." },
        { status: 503, headers },
      );
    }
  };
}
