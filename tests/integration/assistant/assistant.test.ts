import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import { createChatPostHandler } from "@/app/api/chat/route";
import type { Logger } from "@/infrastructure/logging/logger";
import type { OpenAITransport } from "@/infrastructure/openai/types";
import type { OpenAIResponseRequest } from "@/infrastructure/openai/types";
import type { SiteSearch, SiteSearchResult } from "@/modules/search-index/types";
import { AssistantService } from "@/modules/assistant/service";
import type { ConsumeRateLimitInput, RateLimitResult } from "@/modules/rate-limit/rate-limit.types";
import type { RateLimitService } from "@/modules/rate-limit/service";
import type { IWorkflowInstanceRepository } from "@/modules/workflow/interfaces";
import type { WorkflowInstance } from "@/generated/prisma/client";
import { MeetingBookingWorkflowDefinition } from "@/modules/workflow/definitions/meeting-booking/meeting-booking.definition";
import { MeetingBookingWorkflowProgressProjector } from "@/modules/workflow/definitions/meeting-booking/meeting-booking.progress";
import { AuditWorkflowDefinition } from "@/modules/workflow/definitions/audit/audit.definition";
import { AuditWorkflowProgressProjector } from "@/modules/workflow/definitions/audit/audit.progress";
import { ContactWorkflowDefinition } from "@/modules/workflow/definitions/contact/contact.definition";
import { contactStateSchema } from "@/modules/workflow/definitions/contact/contact.schema";
import { ContactWorkflowProgressProjector } from "@/modules/workflow/definitions/contact/contact.progress";
import { WorkflowDefinitionRegistry } from "@/modules/workflow/registry";
import type {
  CreateWorkflowInstanceInput,
  SaveWorkflowInstanceInput,
} from "@/modules/workflow/types";
import { WorkflowService } from "@/modules/workflow/service";
import { WorkflowInstanceStoreError } from "@/modules/workflow/errors";
import { assistantStreamEventSchema } from "@/contracts/assistant.contract";
import { CalendarAvailabilityError } from "@/infrastructure/google-calendar/types";
import type { CalendarClient, CreatedCalendarEvent } from "@/infrastructure/google-calendar/types";
import { MeetingService } from "@/modules/meeting/service";
import type { MeetingServiceClient, MeetingRecord } from "@/modules/meeting/types";

const source = {
  id: "project-1",
  title: "Grounded Assistant",
  url: "/work",
  content: "Freeman built a portfolio assistant with trusted sources.",
  category: "AI engineering",
  keywords: ["TypeScript", "Next.js"],
  similarity: 0.9,
} satisfies SiteSearchResult;

const meetingSlot = {
  start: "2099-09-15T11:00:00.000Z",
  end: "2099-09-15T11:30:00.000Z",
  timezone: "Europe/London",
};

async function read(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();

  const decoder = new TextDecoder();

  let output = "";

  for (;;) {
    const next = await reader.read();

    if (next.done) {
      return output;
    }

    output += decoder.decode(next.value);
  }
}

function events(...values: Array<Record<string, unknown>>) {
  return (async function* () {
    yield* values;
  })() as never;
}

function createAssistant({
  chunks = [source],
  embedding = async () => [0.1, 0.2],
  search = async () => chunks,
  response = async () =>
    events(
      { type: "response.created", response: { id: "resp_current" } },
      { type: "response.output_text.delta", delta: "A grounded answer." },
      { type: "response.completed", response: { id: "resp_current" } },
    ),
  rateLimit,
  meeting,
}: {
  chunks?: SiteSearchResult[];
  embedding?: OpenAITransport["createEmbedding"];
  search?: SiteSearch["search"];
  response?: (request: OpenAIResponseRequest) => ReturnType<OpenAITransport["streamResponse"]>;
  rateLimit?: Pick<RateLimitService, "consume">;
  meeting?: MeetingServiceClient;
} = {}) {
  const inputs: OpenAIResponseRequest[] = [];

  const rateLimitInputs: ConsumeRateLimitInput[] = [];

  const errors: Array<{ message: string; context: unknown }> = [];

  const logger: Logger = {
    info: () => undefined,
    error: (message, context) => errors.push({ message, context }),
  };

  const openai: OpenAITransport = {
    getEmbeddingModel: () => "test-model",
    createEmbedding: embedding,
    createEmbeddings: async () => [],
    streamResponse: async (request) => {
      inputs.push(request);

      return response(request);
    },
  };

  const siteSearch: SiteSearch = {
    search,
  };

  const meetingService = meeting ?? {
    findAvailableSlots: async () => [meetingSlot],
    isSlotAvailable: async () => true,
    bookMeeting: async () => ({ googleEventId: "event_test", googleEventUrl: null }),
    reconcileMeeting: async () => ({ googleEventId: "event_test", googleEventUrl: null }),
  };

  const workflowRepository = new MemoryWorkflowInstanceRepository();

  const workflowService = new WorkflowService(
    new WorkflowDefinitionRegistry([
      new AuditWorkflowDefinition(
        {
          submit: async (input) => ({
            id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
            ...input,
            createdAt: new Date("2026-08-20T10:00:00.000Z"),
          }),
        },
        new AuditWorkflowProgressProjector(),
      ),
      new ContactWorkflowDefinition(
        {
          submit: async (input) => ({
            id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
            ...input,
            createdAt: new Date("2026-08-20T10:00:00.000Z"),
          }),
        },
        new ContactWorkflowProgressProjector(),
      ),
      new MeetingBookingWorkflowDefinition(
        meetingService,
        new MeetingBookingWorkflowProgressProjector(),
      ),
    ]),
    workflowRepository,
    ["search_website"],
    { info() {}, error() {} },
  );

  const assistantService = new AssistantService(openai, siteSearch, logger, workflowService);

  const rateLimitService: Pick<RateLimitService, "consume"> = rateLimit ?? {
    consume: async (input) => {
      rateLimitInputs.push(input);

      return { allowed: true };
    },
  };

  return {
    errors,
    inputs,
    meetingService,
    post: createChatPostHandler({ assistantService, rateLimitService, logger }),
    rateLimitInputs,
    workflowRepository,
    workflowService,
  };
}

function chatRequest(body: unknown, signal?: AbortSignal) {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": "test-client" },
    body: JSON.stringify(body),
    signal,
  });
}

test("audit/contact actions confirm saved summaries without invoking the model", async () => {
  for (const kind of ["audit", "contact"] as const) {
    const { post, inputs, workflowService } = createAssistant();

    const instance = await workflowService.start(kind, {
      originChannel: "test",
      originPage: null,
      originEntry: null,
    });

    const fields =
      kind === "audit"
        ? {
            name: "Visitor",
            email: "visitor@example.test",
            focus: "Orders",
            currentProcess: "Inbox",
            friction: "Slow replies",
            desiredOutcome: "Clear next step",
          }
        : { name: "Visitor", email: "visitor@example.test", message: "Discuss a project" };

    await workflowService.executeTool(instance.id, {
      name: `update_${kind}_context`,
      rawArguments: JSON.stringify({
        updates: Object.entries(fields).map(([field, value]) => ({ field, value })),
      }),
      interactionId: randomUUID(),
    });
    const prepared = await workflowService.executeTool(instance.id, {
      name: `prepare_${kind}_submission`,
      rawArguments: "{}",
      interactionId: randomUUID(),
    });

    const invalid = await post(
      chatRequest({
        action: `confirm_${kind}`,
        workflowInstanceId: instance.id,
        expectedRevision: prepared.instance.revision,
        message: "changed",
      }),
    );

    assert.equal(invalid.status, 400);
    const stale = await readChatResponse(
      await post(
        chatRequest({
          action: `confirm_${kind}`,
          workflowInstanceId: instance.id,
          expectedRevision: 0,
        }),
      ),
    );

    assert.match(stale, /details changed/);
    const output = await readChatResponse(
      await post(
        chatRequest({
          action: `confirm_${kind}`,
          workflowInstanceId: instance.id,
          expectedRevision: prepared.instance.revision,
        }),
      ),
    );

    assert.match(output, /"status":"completed"/);
    assert.equal(inputs.length, 0);
    const repeated = await readChatResponse(
      await post(
        chatRequest({
          action: `confirm_${kind}`,
          workflowInstanceId: instance.id,
          expectedRevision: prepared.instance.revision,
        }),
      ),
    );

    assert.match(repeated, /"status":"completed"/);

    const next = await workflowService.start(kind, {
      originChannel: "test",
      originPage: null,
      originEntry: null,
    });

    await workflowService.executeTool(next.id, {
      name: `update_${kind}_context`,
      rawArguments: JSON.stringify({
        updates: Object.entries(fields).map(([field, value]) => ({ field, value })),
      }),
      interactionId: randomUUID(),
    });
    const ready = await workflowService.executeTool(next.id, {
      name: `prepare_${kind}_submission`,
      rawArguments: "{}",
      interactionId: randomUUID(),
    });

    const controller = new AbortController();

    controller.abort();
    await readChatResponse(
      await post(
        chatRequest(
          {
            action: `confirm_${kind}`,
            workflowInstanceId: next.id,
            expectedRevision: ready.instance.revision,
          },
          controller.signal,
        ),
      ),
    );
    assert.equal(
      (await workflowService.getAssistantContext(next.id)).instance?.status,
      "completed",
    );
    assert.equal(inputs.length, 0);
  }
});

async function readChatResponse(response: Response) {
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Content-Type"), "application/x-ndjson; charset=utf-8");
  assert.ok(response.body);

  return read(response.body);
}

test("allowed chat requests consume the configured rules and stream without mandatory retrieval", async () => {
  const { inputs, post, rateLimitInputs } = createAssistant();

  const output = await readChatResponse(
    await post(
      chatRequest({
        message: "What assistant did Freeman build?",
        previousResponseId: null,
      }),
    ),
  );

  assert.equal(inputs[0]?.input.length, 1);
  assert.equal(inputs[0]?.previousResponseId, null);
  assert.deepEqual(rateLimitInputs, [
    {
      scope: "chat",
      identifier: "test-client",
      rules: [
        { id: "short", limit: 10, windowMs: 10 * 60 * 1000 },
        { id: "daily", limit: 30, windowMs: 24 * 60 * 60 * 1000 },
      ],
    },
  ]);
  assert.match(output, /A grounded answer\./);
  assert.match(output, /"sources":\[\]/);
  assert.match(output, /resp_current/);
  assert.deepEqual(
    output
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line) as unknown),
    [
      { type: "delta", delta: "A grounded answer." },
      { type: "sources", sources: [] },
      { type: "response_id", responseId: "resp_current" },
      { type: "done" },
    ],
  );
});

test("follow-up question preserves the previous response id and streams the new response", async () => {
  const { inputs, post } = createAssistant();

  const output = await readChatResponse(
    await post(
      chatRequest({
        message: "What technologies did it use?",
        previousResponseId: "resp_previous",
      }),
    ),
  );

  assert.equal(inputs[0]?.previousResponseId, "resp_previous");
  assert.match(output, /A grounded answer\./);
  assert.match(output, /"type":"done"/);
});

test(
  "concurrent requests keep workflow transitions, sources and response checkpoints isolated",
  { timeout: 5000 },
  async () => {
    let initialRequests = 0;

    let releaseInitial!: () => void;

    const initialBarrier = new Promise<void>((resolve) => {
      releaseInitial = resolve;
    });

    const { post, workflowService, workflowRepository, errors } = createAssistant({
      embedding: async (query) => [query === "Alpha" ? 1 : 2],
      search: async ([key]) => [
        {
          ...source,
          id: key === 1 ? "alpha-source" : "beta-source",
          title: key === 1 ? "Alpha evidence" : "Beta evidence",
        },
      ],
      response: async (request) => {
        if (request.input[0]?.type === "function_call_output") {
          const label = request.previousResponseId === "resp_Alpha_tools" ? "Alpha" : "Beta";

          assert.match(JSON.stringify(request.input), new RegExp(`${label} company`));
          assert.doesNotMatch(
            JSON.stringify(request.input),
            new RegExp(label === "Alpha" ? "Beta" : "Alpha"),
          );

          return events(
            { type: "response.output_text.delta", delta: `${label} answer.` },
            { type: "response.completed", response: { id: `resp_${label}_final` } },
          );
        }

        assert.equal(request.input[0]?.type, "user_message");
        const content = request.input[0]?.type === "user_message" ? request.input[0].content : "";

        const label = content.includes("Alpha request") ? "Alpha" : "Beta";

        assert.match(content, new RegExp(`${label} Visitor`));
        assert.doesNotMatch(
          content,
          new RegExp(label === "Alpha" ? "Beta Visitor" : "Alpha Visitor"),
        );
        initialRequests += 1;
        if (initialRequests === 2) {
          releaseInitial();
        }

        await initialBarrier;

        return events(
          { type: "response.created", response: { id: `resp_${label}_tools` } },
          { type: "response.output_text.delta", delta: `${label} searching.` },
          {
            type: "response.output_item.done",
            item: {
              type: "function_call",
              call_id: `${label}-update`,
              name: "update_contact_context",
              arguments: JSON.stringify({
                updates: [{ field: "businessName", value: `${label} company` }],
              }),
            },
          },
          {
            type: "response.output_item.done",
            item: {
              type: "function_call",
              call_id: `${label}-search`,
              name: "search_website",
              arguments: JSON.stringify({ query: label }),
            },
          },
        );
      },
    });

    const instances = [];

    for (const label of ["Alpha", "Beta"]) {
      const instance = await workflowService.start("contact", {
        originChannel: "test",
        originPage: null,
        originEntry: null,
      });

      await workflowService.executeTool(instance.id, {
        name: "update_contact_context",
        rawArguments: JSON.stringify({ updates: [{ field: "name", value: `${label} Visitor` }] }),
        interactionId: "33333333-3333-4333-8333-333333333333",
      });
      instances.push(instance);
    }

    const outputs = await Promise.all(
      instances.map(async (instance, index) =>
        readChatResponse(
          await post(
            chatRequest({
              message: `${index === 0 ? "Alpha" : "Beta"} request`,
              workflowInstanceId: instance.id,
            }),
          ),
        ),
      ),
    );

    for (const [index, output] of outputs.entries()) {
      const label = index === 0 ? "Alpha" : "Beta";

      const streamed = output
        .trim()
        .split("\n")
        .map((line) => assistantStreamEventSchema.parse(JSON.parse(line)));

      assert.deepEqual(
        streamed.map(({ type }) => type),
        [
          "delta",
          "workflow_instance",
          "delta",
          "sources",
          "response_id",
          "workflow_instance",
          "done",
        ],
      );
      assert.doesNotMatch(
        output,
        new RegExp(index === 0 ? "Beta|beta-source" : "Alpha|alpha-source"),
      );
      assert.deepEqual(
        streamed.find((event) => event.type === "response_id"),
        { type: "response_id", responseId: `resp_${label}_final` },
      );
      for (const event of streamed) {
        if (event.type === "workflow_instance") {
          assert.equal(event.instance.id, instances[index].id);
        }

        if (event.type === "sources") {
          assert.deepEqual(
            event.sources.map(({ id }) => id),
            [index === 0 ? "alpha-source" : "beta-source"],
          );
        }
      }

      const saved = await workflowRepository.findById(instances[index].id);

      assert.ok(saved?.state && typeof saved.state === "object" && !Array.isArray(saved.state));
      assert.equal(saved.state.businessName, `${label} company`);
    }

    assert.deepEqual(errors, []);
  },
);

test("a saved update or cancellation is streamed before a later tool failure", async () => {
  for (const cancelled of [false, true]) {
    const { post, workflowService, workflowRepository, errors } = createAssistant({
      embedding: async () => {
        const saved = await workflowRepository.findById(instance.id);

        assert.equal(saved?.status, cancelled ? "cancelled" : "active");
        assert.equal(saved?.revision, 1);
        throw new Error("private provider details");
      },
      response: async () =>
        events(
          { type: "response.created", response: { id: "resp_incomplete" } },
          {
            type: "response.output_item.done",
            item: {
              type: "function_call",
              call_id: "transition",
              name: cancelled ? "cancel_workflow" : "update_contact_context",
              arguments: cancelled
                ? "{}"
                : JSON.stringify({ updates: [{ field: "email", value: "saved@example.test" }] }),
            },
          },
          {
            type: "response.output_item.done",
            item: {
              type: "function_call",
              call_id: "search-after-save",
              name: "search_website",
              arguments: '{"query":"Relevant work"}',
            },
          },
        ),
    });

    const instance = await workflowService.start("contact", {
      originChannel: "test",
      originPage: null,
      originEntry: null,
    });

    const output = await readChatResponse(
      await post(chatRequest({ message: "Update this request", workflowInstanceId: instance.id })),
    );

    const streamed = output
      .trim()
      .split("\n")
      .map((line) => assistantStreamEventSchema.parse(JSON.parse(line)));

    assert.deepEqual(
      streamed.map(({ type }) => type),
      ["workflow_instance", "workflow_instance", "error"],
    );
    for (const event of streamed) {
      if (event.type !== "workflow_instance") {
        continue;
      }

      assert.equal(event.instance.id, instance.id);
      assert.equal(event.instance.status, cancelled ? "cancelled" : "active");
      if (!cancelled) {
        assert.equal(
          event.instance.progress.fields.find(({ key }) => key === "email")?.value,
          "saved@example.test",
        );
      }
    }

    assert.doesNotMatch(output, /private|provider details|resp_incomplete/);
    assert.deepEqual(errors, [
      {
        message: "assistant.response_failed",
        context: {
          category: "assistant_request_failed",
          operation: "tool_execution",
          workflowInstanceId: cancelled ? null : instance.id,
        },
      },
    ]);
  }
});

test("the bounded model loop stops before executing a fourth tool batch", async () => {
  let searches = 0;

  const { inputs, post } = createAssistant({
    embedding: async () => {
      searches += 1;

      return [0.1];
    },
    response: async () =>
      events({
        type: "response.output_item.done",
        item: {
          type: "function_call",
          call_id: "again",
          name: "search_website",
          arguments: '{"query":"Freeman"}',
        },
      }),
  });

  const output = await readChatResponse(await post(chatRequest({ message: "Find relevant work" })));

  assert.equal(inputs.length, 4);
  assert.equal(searches, 3);
  assert.deepEqual(
    output
      .trim()
      .split("\n")
      .map((line) => assistantStreamEventSchema.parse(JSON.parse(line)).type),
    ["error"],
  );
  assert.match(output, /The assistant could not respond/);
});

test("partial meeting details return after refresh without a model checkpoint", async () => {
  const { inputs, post, workflowService } = createAssistant();

  const instance = await workflowService.start("meeting-booking", {
    originChannel: "test",
    originPage: null,
    originEntry: null,
  });

  await workflowService.executeTool(instance.id, {
    name: "update_meeting_context",
    rawArguments: '{"updates":[{"field":"name","value":"Visitor"}]}',
    interactionId: "33333333-3333-4333-8333-333333333333",
  });
  const output = await readChatResponse(
    await post(chatRequest({ message: "Continue my booking", workflowInstanceId: instance.id })),
  );

  assert.equal(inputs[0].previousResponseId, null);
  assert.match(JSON.stringify(inputs[0].input), /Visitor/);
  assert.match(output, /Visitor/);
  assert.match(output, /"missingRequiredFields":\["email","reason","selectedSlot"\]/);
  await workflowService.executeTool(instance.id, {
    name: "update_meeting_context",
    rawArguments: '{"updates":[{"field":"email","value":"visitor@example.com"}]}',
    interactionId: "33333333-3333-4333-8333-333333333333",
  });
  const context = await workflowService.getAssistantContext(instance.id);

  assert.equal(context.instance?.progress.fields[0].value, "Visitor");
  assert.equal(context.instance?.progress.fields[1].value, "visitor@example.com");
});

test("a restored workflow supplies known progress to the model and public stream", async () => {
  const { inputs, post, workflowService } = createAssistant();

  const instance = await workflowService.start("contact", {
    originChannel: "web",
    originPage: "/",
    originEntry: "assistant-starter-contact",
  });

  await workflowService.executeTool(instance.id, {
    name: "update_contact_context",
    rawArguments: JSON.stringify({
      updates: [
        { field: "name", value: "Jonathan" },
        { field: "email", value: "jonathan@example.com" },
        { field: "message", value: "Audit" },
      ],
    }),
    interactionId: "33333333-3333-4333-8333-333333333333",
  });
  await workflowService.executeTool(instance.id, {
    name: "prepare_contact_submission",
    rawArguments: "{}",
    interactionId: "44444444-4444-4444-8444-444444444444",
  });

  const output = await readChatResponse(
    await post(
      chatRequest({
        message: "What details do you already have?",
        workflowInstanceId: instance.id,
      }),
    ),
  );

  const modelInput = inputs[0]?.input[0];

  assert.equal(modelInput?.type, "user_message");
  assert.match(modelInput?.type === "user_message" ? modelInput.content : "", /Jonathan/);
  assert.match(
    modelInput?.type === "user_message" ? modelInput.content : "",
    /jonathan@example\.com/,
  );
  assert.match(modelInput?.type === "user_message" ? modelInput.content : "", /Audit/);
  assert.match(
    modelInput?.type === "user_message" ? modelInput.content : "",
    /visitor-provided data/,
  );
  assert.match(output, /"missingRequiredFields":\[\]/);
  assert.match(output, /"phase":"awaiting_confirmation"/);
  assert.match(output, /jonathan@example\.com/);
  assert.doesNotMatch(output, /preparedInteractionId/);
});

test("website tool results are accumulated and supplied to the next response", async () => {
  const { inputs, post } = createAssistant({
    response: async (request) =>
      request.input[0]?.type === "function_call_output"
        ? events(
            { type: "response.created", response: { id: "resp_final" } },
            { type: "response.output_text.delta", delta: "A grounded answer." },
            { type: "response.completed", response: { id: "resp_final" } },
          )
        : events(
            { type: "response.created", response: { id: "resp_tool" } },
            {
              type: "response.output_item.done",
              item: {
                type: "function_call",
                call_id: "call_search",
                name: "search_website",
                arguments: '{"query":"Freeman assistant"}',
              },
            },
            { type: "response.completed", response: { id: "resp_tool" } },
          ),
  });

  const output = await readChatResponse(
    await post(
      chatRequest({
        message: "Tell me about Freeman's work.",
        previousResponseId: null,
      }),
    ),
  );

  assert.equal(inputs.length, 2);
  assert.equal(inputs[1]?.input[0]?.type, "function_call_output");
  assert.match(output, /Grounded Assistant/);
  assert.match(output, /A grounded answer\./);
});

test("starting a workflow changes instructions and tools on the next iteration in one request", async () => {
  const { inputs, post } = createAssistant({
    response: async (request) =>
      request.input[0]?.type === "function_call_output"
        ? events(
            { type: "response.created", response: { id: "resp_workflow_active" } },
            { type: "response.output_text.delta", delta: "Which dates work for you?" },
            { type: "response.completed", response: { id: "resp_workflow_active" } },
          )
        : events(
            { type: "response.created", response: { id: "resp_workflow_start" } },
            {
              type: "response.output_item.done",
              item: {
                type: "function_call",
                call_id: "call_start",
                name: "start_workflow",
                arguments: '{"workflowId":"meeting-booking"}',
              },
            },
            { type: "response.completed", response: { id: "resp_workflow_start" } },
          ),
  });

  const output = await readChatResponse(
    await post(chatRequest({ message: "I would like to book a meeting." })),
  );

  assert.deepEqual(
    inputs[0]?.tools.map(({ name }) => name),
    ["ask_user_choice", "search_website", "start_workflow"],
  );
  assert.match(inputs[0]?.instructions ?? "", /audit: Request a free review/);
  assert.match(JSON.stringify(inputs[0]?.tools[2]?.parameters), /"audit"/);
  assert.deepEqual(
    inputs[1]?.tools.map(({ name }) => name),
    [
      "ask_user_choice",
      "search_website",
      "cancel_workflow",
      "switch_workflow",
      "find_meeting_slots",
      "update_meeting_context",
    ],
  );
  assert.doesNotMatch(inputs[0]?.instructions ?? "", /meeting-booking workflow/i);
  assert.match(inputs[1]?.instructions ?? "", /meeting-booking workflow/i);
  assert.equal(inputs[1]?.input[0]?.type, "function_call_output");
  assert.match(output, /Which dates work for you\?/);
  assert.match(output, /"type":"workflow_instance"/);
  assert.match(output, /"status":"active"/);
  assert.match(output, /"phase":"collecting"/);
  assert.doesNotMatch(output, /availableSlots|pendingBooking|visitor@example\.com/);
});

test("an Audit CTA starts deterministically with bounded origin metadata", async () => {
  const { inputs, post, workflowRepository } = createAssistant();

  const output = await readChatResponse(
    await post(
      chatRequest({
        message: "I would like to claim my free customer journey and workflow audit.",
        workflowStart: {
          workflowId: "audit",
          originPage: "/",
          originEntry: "home-audit-cta",
        },
      }),
    ),
  );

  const stored = await workflowRepository.findById("00000000-0000-4000-8000-000000000001");

  assert.equal(stored?.workflowId, "audit");
  assert.equal(stored?.workflowVersion, 1);
  assert.equal(stored?.originChannel, "web");
  assert.equal(stored?.originPage, "/");
  assert.equal(stored?.originEntry, "home-audit-cta");
  assert.deepEqual(
    inputs[0]?.tools.map(({ name }) => name),
    [
      "ask_user_choice",
      "search_website",
      "cancel_workflow",
      "switch_workflow",
      "update_audit_context",
    ],
  );
  assert.match(inputs[0]?.instructions ?? "", /free customer journey and workflow Audit/);
  assert.match(output, /"workflowId":"audit"/);
});

test("an explicit start replaces a restored terminal workflow instance", async () => {
  const { post, workflowRepository, workflowService } = createAssistant();

  const finished = await workflowService.start("meeting-booking", {
    originChannel: "web",
    originPage: "/",
    originEntry: "assistant-starter-meeting",
  });

  await workflowService.cancel(finished.id);

  const output = await readChatResponse(
    await post(
      chatRequest({
        message: "I would like to request an audit.",
        workflowInstanceId: finished.id,
        workflowStart: {
          workflowId: "audit",
          originPage: "/",
          originEntry: "assistant-starter-audit",
        },
      }),
    ),
  );

  const started = await workflowRepository.findById("00000000-0000-4000-8000-000000000002");

  assert.equal(started?.workflowId, "audit");
  assert.equal(started?.status, "active");
  assert.match(output, /"id":"00000000-0000-4000-8000-000000000002"/);
  assert.match(output, /"status":"active"/);
});

test("a repeated deterministic start reuses the active workflow instance", async () => {
  const { post, workflowRepository, workflowService } = createAssistant();

  const active = await workflowService.start("contact", {
    originChannel: "web",
    originPage: "/",
    originEntry: "assistant-starter-contact",
  });

  const output = await readChatResponse(
    await post(
      chatRequest({
        message: "I'd like to leave Freeman a message.",
        workflowInstanceId: active.id,
        workflowStart: {
          workflowId: "contact",
          originPage: "/",
          originEntry: "assistant-starter-contact",
        },
      }),
    ),
  );

  assert.equal(await workflowRepository.findById("00000000-0000-4000-8000-000000000002"), null);
  assert.match(output, new RegExp(active.id));
  assert.match(output, /"workflowId":"contact"/);
});

const choice = {
  question: "Keep your message, or cancel it and start an audit?",
  options: ["Continue my message", "Cancel my message and start an audit"],
};

function toolResponse(id: string, ...calls: Array<{ name: string; arguments: string }>) {
  return events(
    { type: "response.created", response: { id } },
    ...calls.map((call, index) => ({
      type: "response.output_item.done",
      item: { type: "function_call", call_id: `call_${index}`, ...call },
    })),
    { type: "response.completed", response: { id } },
  );
}

function textResponse(id: string, text = "Please choose how to proceed.") {
  return events(
    { type: "response.output_text.delta", delta: text },
    { type: "response.completed", response: { id } },
  );
}

test("choice resolves every tool call before publishing a completed checkpoint; no later mutation runs", async () => {
  const { inputs, post, workflowService, workflowRepository } = createAssistant({
    response: async (request) => {
      if (request.tools.length === 0) {
        assert.equal(request.previousResponseId, "resp_choice_tools");
        assert.equal(request.input.length, 4);
        const outputs = request.input.filter((item) => item.type === "function_call_output");

        assert.deepEqual(
          outputs.map((item) => item.callId),
          ["call_0", "call_1", "call_2"],
        );
        assert.match(outputs[0]!.output, /Continue my message/);
        assert.match(outputs[1]!.output, /skipped/);
        assert.match(outputs[2]!.output, /skipped/);

        return textResponse("resp_choice_ready");
      }

      if (request.previousResponseId === "resp_choice_ready") {
        assert.match(JSON.stringify(request.input), /Continue my message/);

        return textResponse("resp_followup", "Let's continue your message.");
      }

      return toolResponse(
        "resp_choice_tools",
        { name: "ask_user_choice", arguments: JSON.stringify(choice) },
        { name: "cancel_workflow", arguments: "{}" },
        { name: "ask_user_choice", arguments: JSON.stringify({ ...choice, question: "Ignored?" }) },
      );
    },
  });

  const instance = await workflowService.start("contact", {
    originChannel: "web",
    originPage: null,
    originEntry: null,
  });

  const before = await workflowRepository.findById(instance.id);

  const output = await readChatResponse(
    await post(chatRequest({ message: "Help me choose", workflowInstanceId: instance.id })),
  );

  const parsed = output
    .trim()
    .split("\n")
    .map((line) => assistantStreamEventSchema.parse(JSON.parse(line)));

  assert.deepEqual(
    parsed.filter((event) => event.type === "choice"),
    [{ type: "choice", choice }],
  );
  assert.ok(output.indexOf('"responseId":"resp_choice_ready"') < output.indexOf('"type":"choice"'));
  assert.doesNotMatch(output, /resp_choice_tools/);
  assert.equal(
    parsed.some((event) => event.type === "delta"),
    false,
    "The choice panel owns the question, without duplicate continuation text or fallback",
  );
  assert.equal(inputs.length, 2);
  assert.deepEqual(await workflowRepository.findById(instance.id), before);
  await readChatResponse(
    await post(
      chatRequest({
        message: choice.options[0],
        previousResponseId: "resp_choice_ready",
        workflowInstanceId: instance.id,
      }),
    ),
  );
  assert.equal(inputs.at(-1)?.previousResponseId, "resp_choice_ready");
  assert.equal((await workflowRepository.findById(instance.id))?.status, "active");
});

test("initial workflow conflict cannot mutate; an ordinary switch reply creates one replacement", async () => {
  let turn = 0;

  const { post, inputs, workflowService, workflowRepository } = createAssistant({
    response: async () => {
      turn++;
      if (turn === 1) {
        return toolResponse(
          "resp_conflict",
          { name: "switch_workflow", arguments: '{"workflowId":"audit"}' },
          { name: "ask_user_choice", arguments: JSON.stringify(choice) },
        );
      }

      if (turn === 2) {
        return textResponse("resp_conflict_ready");
      }

      if (turn === 3) {
        return toolResponse(
          "resp_switch",
          { name: "switch_workflow", arguments: '{"workflowId":"audit"}' },
          { name: "submit_contact", arguments: "{}" },
        );
      }

      return textResponse("resp_switched", "What would you like the audit to help with?");
    },
  });

  const current = await workflowService.start("contact", {
    originChannel: "web",
    originPage: null,
    originEntry: null,
  });

  const output = await readChatResponse(
    await post(
      chatRequest({
        message: "I'd like an audit",
        workflowInstanceId: current.id,
        workflowStart: {
          workflowId: "audit",
          originPage: "/",
          originEntry: "assistant-starter-audit",
        },
      }),
    ),
  );

  assert.deepEqual(
    inputs[0]?.tools.map(({ name }) => name),
    ["ask_user_choice"],
  );
  assert.match(JSON.stringify(inputs[1]?.input), /choice_required/);
  assert.match(output, /"type":"choice"/);
  assert.equal(workflowRepository.instances.size, 1);
  assert.equal((await workflowRepository.findById(current.id))?.status, "active");
  const switched = await readChatResponse(
    await post(
      chatRequest({
        message: choice.options[1],
        previousResponseId: "resp_conflict_ready",
        workflowInstanceId: current.id,
      }),
    ),
  );

  assert.match(JSON.stringify(inputs[3]?.input), /skipped/);
  assert.equal(workflowRepository.instances.size, 2);
  assert.equal((await workflowRepository.findById(current.id))?.status, "cancelled");
  const replacement = [...workflowRepository.instances.values()].find(
    (instance) => instance.id !== current.id,
  );

  assert.equal(replacement?.workflowId, "audit");
  assert.equal(replacement?.status, "active");
  assert.match(switched, /"phase":"collecting"/);
});

test("continuing reuses the prepared workflow and cannot confirm a submission in the same turn", async () => {
  let turn = 0;

  const { post, workflowService, workflowRepository } = createAssistant({
    response: async () => {
      turn++;
      if (turn === 1) {
        return toolResponse("resp_continue", {
          name: "switch_workflow",
          arguments: '{"workflowId":"contact"}',
        });
      }

      if (turn === 2) {
        return toolResponse("resp_unwanted_submit", { name: "submit_contact", arguments: "{}" });
      }

      return textResponse("resp_wait", "Please confirm the prepared message when ready.");
    },
  });

  const instance = await workflowService.start("contact", {
    originChannel: "web",
    originPage: null,
    originEntry: null,
  });

  await workflowService.executeTool(instance.id, {
    name: "update_contact_context",
    interactionId: "11111111-1111-4111-8111-111111111111",
    rawArguments: JSON.stringify({
      updates: [
        { field: "name", value: "James" },
        { field: "email", value: "james@example.test" },
        { field: "message", value: "Hello Freeman" },
      ],
    }),
  });
  await workflowService.executeTool(instance.id, {
    name: "prepare_contact_submission",
    rawArguments: "{}",
    interactionId: "22222222-2222-4222-8222-222222222222",
  });
  const output = await readChatResponse(
    await post(chatRequest({ message: "Continue my message", workflowInstanceId: instance.id })),
  );

  assert.equal(workflowRepository.instances.size, 1);
  assert.equal((await workflowRepository.findById(instance.id))?.status, "active");
  assert.doesNotMatch(output, /"status":"completed"/);
});

test("invalid choice arguments are recoverable; a choice works with no workflow", async () => {
  let turn = 0;

  const { post, inputs, workflowRepository } = createAssistant({
    response: async () => {
      turn++;
      if (turn === 1) {
        return toolResponse("resp_invalid", {
          name: "ask_user_choice",
          arguments: '{"question":"Next?","options":["One","One"]}',
        });
      }

      if (turn === 2) {
        return toolResponse("resp_valid", {
          name: "ask_user_choice",
          arguments: JSON.stringify(choice),
        });
      }

      return textResponse("resp_ready");
    },
  });

  const output = await readChatResponse(await post(chatRequest({ message: "Help me choose" })));

  assert.match(JSON.stringify(inputs[1]?.input), /invalid_arguments/);
  assert.equal(workflowRepository.instances.size, 0);
  assert.match(output, /"type":"choice"/);
});

test("failed or unfinished choice continuation exposes neither choice nor unresolved checkpoint", async () => {
  for (const failure of ["throw", "unfinished", "tool"]) {
    const { post, errors, inputs } = createAssistant({
      response: async (request) => {
        if (request.tools.length) {
          return toolResponse("resp_pending", {
            name: "ask_user_choice",
            arguments: JSON.stringify(choice),
          });
        }

        if (failure === "throw") {
          throw new Error("provider failure containing visitor@example.test");
        }

        if (failure === "tool") {
          return toolResponse("resp_bad", { name: "cancel_workflow", arguments: "{}" });
        }

        return events({ type: "response.created", response: { id: "resp_incomplete" } });
      },
    });

    const output = await readChatResponse(await post(chatRequest({ message: "Ask me something" })));

    assert.match(output, /"type":"error"/);
    assert.doesNotMatch(output, /"type":"choice"|"type":"response_id"/);
    assert.doesNotMatch(JSON.stringify(errors), /visitor@example.test/);
    assert.equal(inputs.length, 2);
  }
});

test("provider failure after a durable start still streams the safe active instance ID", async () => {
  const { errors, post } = createAssistant({
    response: async (request) =>
      request.input[0]?.type === "function_call_output"
        ? events({
            type: "response.failed",
            response: { error: { message: "provider unavailable after start" } },
          })
        : events(
            { type: "response.created", response: { id: "resp_workflow_start" } },
            {
              type: "response.output_item.done",
              item: {
                type: "function_call",
                call_id: "call_start",
                name: "start_workflow",
                arguments: '{"workflowId":"meeting-booking"}',
              },
            },
            { type: "response.completed", response: { id: "resp_workflow_start" } },
          ),
  });

  const output = await readChatResponse(
    await post(chatRequest({ message: "I would like to book a meeting." })),
  );

  assert.match(output, /"type":"workflow_instance"/);
  assert.match(output, /"id":"00000000-0000-4000-8000-000000000001"/);
  assert.match(output, /"status":"active"/);
  assert.match(output, /The assistant could not respond\. Please try again\./);
  assert.doesNotMatch(output, /availableSlots|pendingBooking|visitor@example\.com/);
  assert.deepEqual(errors, [
    {
      message: "assistant.response_failed",
      context: {
        category: "assistant_request_failed",
        operation: "provider_response",
        workflowInstanceId: "00000000-0000-4000-8000-000000000001",
      },
    },
  ]);
});

test("Calendar availability failure produces a useful reply without inventing slots", async () => {
  const { post, workflowService, workflowRepository, meetingService, errors } = createAssistant({
    response: async (request) => {
      if (request.input[0]?.type === "function_call_output") {
        assert.match(request.input[0].output, /meeting_availability_unavailable/);
        assert.doesNotMatch(request.input[0].output, /OAuth|private|refresh|unauthorized_client/);

        return events({
          type: "response.output_text.delta",
          delta: "Meeting availability is temporarily unavailable. Please try again later.",
        });
      }

      return events({
        type: "response.output_item.done",
        item: {
          type: "function_call",
          call_id: "find-slots",
          name: "find_meeting_slots",
          arguments: '{"startDate":"2099-09-15","endDate":"2099-09-15"}',
        },
      });
    },
  });

  meetingService.findAvailableSlots = async () => {
    throw new CalendarAvailabilityError(new Error("private OAuth refresh credentials"));
  };

  const instance = await workflowService.start("meeting-booking", {
    originChannel: "web",
    originPage: null,
    originEntry: null,
  });

  const output = await readChatResponse(
    await post(
      chatRequest({ message: "What times are available?", workflowInstanceId: instance.id }),
    ),
  );

  assert.match(output, /Meeting availability is temporarily unavailable/);
  assert.doesNotMatch(output, /"type":"error"|OAuth|private|refresh|credentials/);
  const saved = await workflowRepository.findById(instance.id);

  assert.ok(saved?.state && typeof saved.state === "object" && !Array.isArray(saved.state));
  assert.equal(saved.status, "active");
  assert.equal(saved.state.selectedSlot, null);
  assert.deepEqual(saved.state.availableSlots, []);
  assert.deepEqual(errors, []);
});

test("a later workflow-call failure in one model batch does not orphan a persisted start", async () => {
  const { errors, post } = createAssistant({
    response: async () =>
      events(
        { type: "response.created", response: { id: "resp_duplicate_start" } },
        {
          type: "response.output_item.done",
          item: {
            type: "function_call",
            call_id: "call_start_one",
            name: "start_workflow",
            arguments: '{"workflowId":"meeting-booking"}',
          },
        },
        {
          type: "response.output_item.done",
          item: {
            type: "function_call",
            call_id: "call_start_two",
            name: "start_workflow",
            arguments: '{"workflowId":"meeting-booking"}',
          },
        },
        { type: "response.completed", response: { id: "resp_duplicate_start" } },
      ),
  });

  const output = await readChatResponse(
    await post(chatRequest({ message: "I would like to book a meeting." })),
  );

  assert.match(output, /"type":"workflow_instance"/);
  assert.match(output, /"id":"00000000-0000-4000-8000-000000000001"/);
  assert.match(output, /"status":"active"/);
  assert.match(output, /The assistant could not respond\. Please try again\./);
  assert.deepEqual(errors, [
    {
      message: "assistant.response_failed",
      context: {
        category: "assistant_request_failed",
        operation: "tool_execution",
        workflowInstanceId: "00000000-0000-4000-8000-000000000001",
      },
    },
  ]);
});

for (const failure of ["lost_calendar_response", "meeting_save", "response_disconnect"] as const) {
  test(`booking route with real services recovers ${failure} without another Calendar insert`, async () => {
    const providerEvents = new Map<string, CreatedCalendarEvent>();

    const meetings = new Map<string, MeetingRecord>();

    let inserts = 0;

    let failSave = failure === "meeting_save";

    const abort = new AbortController();

    const calendar: CalendarClient = {
      getBusyPeriods: async () =>
        [...providerEvents.values()].map(() => ({
          start: new Date(meetingSlot.start),
          end: new Date(meetingSlot.end),
        })),
      findEvent: async (id) => providerEvents.get(id) ?? null,
      createEvent: async (input) => {
        inserts++;
        const event: CreatedCalendarEvent = {
          id: input.eventId,
          htmlLink: null,
          payload: {
            id: input.eventId,
            status: "confirmed",
            summary: input.summary,
            description: input.description,
            attendees: [{ email: input.attendeeEmail }],
            start: { dateTime: input.start.toISOString(), timeZone: input.timezone },
            end: { dateTime: input.end.toISOString(), timeZone: input.timezone },
            extendedProperties: { private: { bookingOperationId: input.bookingOperationId } },
          },
        };

        providerEvents.set(event.id, event);
        if (failure === "response_disconnect") {
          abort.abort();
        }

        if (failure === "lost_calendar_response") {
          throw new Error("Response lost after provider committed");
        }

        return event;
      },
    };

    const meeting = new MeetingService(
      calendar,
      {
        findMeetingByGoogleEventId: async (id) => meetings.get(id) ?? null,
        createMeeting: async (record) => {
          if (failSave) {
            throw new Error("Database temporarily unavailable");
          }

          if (meetings.has(record.googleEventId)) {
            throw new Error("Unique event ID");
          }

          const saved: MeetingRecord = {
            ...record,
            rawProviderPayload: {},
            id: "meeting-1",
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          meetings.set(record.googleEventId, saved);

          return saved;
        },
        updateMeeting: async () => {
          throw new Error("Must not overwrite bookings");
        },
      },
      { info() {}, error() {} },
      { notifyMeetingBooked: async () => {} },
    );

    const { post, workflowService, inputs, rateLimitInputs } = createAssistant({
      meeting,
      response: async () => {
        throw new Error("Narration unavailable");
      },
    });

    const instance = await workflowService.start("meeting-booking", {
      originChannel: "test",
      originPage: null,
      originEntry: null,
    });

    await workflowService.executeTool(instance.id, {
      name: "find_meeting_slots",
      rawArguments: '{"startDate":"2099-09-15","endDate":"2099-09-15"}',
      interactionId: "11111111-1111-4111-8111-111111111111",
    });
    await workflowService.executeTool(instance.id, {
      name: "prepare_meeting",
      rawArguments: JSON.stringify({
        name: "Visitor",
        email: "visitor@example.com",
        reason: "Discuss a project",
        selectedSlot: { start: meetingSlot.start, end: meetingSlot.end },
      }),
      interactionId: "11111111-1111-4111-8111-111111111111",
    });
    const prepared = (await workflowService.getAssistantContext(instance.id)).instance!;

    const stale = await readChatResponse(
      await post(
        chatRequest({
          action: "confirm_booking",
          workflowInstanceId: instance.id,
          expectedRevision: prepared.revision - 1,
        }),
      ),
    );

    assert.match(stale, /Review the updated summary/);
    assert.equal(inserts, 0);
    await readChatResponse(
      await post(
        chatRequest(
          {
            action: "confirm_booking",
            workflowInstanceId: instance.id,
            expectedRevision: prepared.revision,
          },
          abort.signal,
        ),
      ),
    );
    if (failSave) {
      assert.equal(
        (await workflowService.getAssistantContext(instance.id)).instance?.confirmationAction,
        "retry",
      );
      failSave = false;
      const recovered = await readChatResponse(
        await post(chatRequest({ action: "retry_booking", workflowInstanceId: instance.id })),
      );

      assert.match(recovered, /"status":"completed"/);
    }

    assert.equal(
      (await workflowService.getAssistantContext(instance.id)).instance?.status,
      "completed",
    );
    assert.equal(providerEvents.size, 1);
    assert.equal(inserts, 1);
    assert.equal(meetings.size, 1);
    assert.equal(inputs.length, 0, "Booking completion is independent of narration availability");
    assert.ok(rateLimitInputs.length >= 2);
  });
}

test("terminal workflow metadata clears the active surface without streaming private state", async () => {
  const { inputs, post, workflowService } = createAssistant({
    response: async () => {
      throw new Error("Booking must not depend on model narration");
    },
  });

  const instance = await workflowService.start("meeting-booking", {
    originChannel: "test",
    originPage: null,
    originEntry: null,
  });

  await workflowService.executeTool(instance.id, {
    name: "find_meeting_slots",
    rawArguments: '{"startDate":"2099-09-15","endDate":"2099-09-15"}',
    interactionId: "33333333-3333-4333-8333-333333333333",
  });
  await workflowService.executeTool(instance.id, {
    name: "prepare_meeting",
    rawArguments: JSON.stringify({
      name: "Visitor",
      email: "visitor@example.com",
      reason: "Discuss a project",
      selectedSlot: { start: meetingSlot.start, end: meetingSlot.end },
    }),
    interactionId: "33333333-3333-4333-8333-333333333333",
  });

  const output = await readChatResponse(
    await post(
      chatRequest({
        action: "confirm_booking",
        expectedRevision: (await workflowService.getAssistantContext(instance.id)).instance!
          .revision,
        workflowInstanceId: instance.id,
      }),
    ),
  );

  assert.deepEqual(inputs, [], "Booking must not require model authorization or narration");
  assert.match(output, /"status":"completed"/);
  assert.match(output, /"phase":"completed"/);
  assert.match(output, /visitor@example\.com/);
  assert.doesNotMatch(
    output,
    /availableSlots|availabilityCheckedAt|preparedInteractionId|pendingBooking|googleEvent|rawProviderPayload/,
  );
});

test("a search with no results still lets the model respond", async () => {
  const { post } = createAssistant({
    chunks: [],
  });

  const output = await readChatResponse(
    await post(
      chatRequest({
        message: "What is Freeman's favourite planet?",
        previousResponseId: null,
      }),
    ),
  );

  assert.match(output, /A grounded answer\./);
});

test("retrieval failure returns the existing safe stream error", async () => {
  const { post } = createAssistant({
    embedding: async () => {
      throw new Error("embedding unavailable");
    },
    response: async () =>
      events(
        { type: "response.created", response: { id: "resp_tool" } },
        {
          type: "response.output_item.done",
          item: {
            type: "function_call",
            call_id: "call_search",
            name: "search_website",
            arguments: '{"query":"Freeman projects"}',
          },
        },
        { type: "response.completed", response: { id: "resp_tool" } },
      ),
  });

  const output = await readChatResponse(
    await post(
      chatRequest({
        message: "What has Freeman built?",
        previousResponseId: null,
      }),
    ),
  );

  assert.match(output, /The assistant could not respond\. Please try again\./);
});

test("OpenAI streaming failure returns the existing safe stream error", async () => {
  const { errors, post } = createAssistant({
    response: async () =>
      events({ type: "response.failed", response: { error: { message: "provider unavailable" } } }),
  });

  const output = await readChatResponse(
    await post(
      chatRequest({
        message: "What has Freeman built?",
        previousResponseId: null,
      }),
    ),
  );

  assert.match(output, /The assistant could not respond\. Please try again\./);
  assert.deepEqual(errors, [
    {
      message: "assistant.response_failed",
      context: {
        category: "assistant_request_failed",
        operation: "provider_response",
        workflowInstanceId: null,
      },
    },
  ]);
});

test("workflow persistence failure is safely distinguished from a provider failure", async () => {
  const { errors, inputs, post, workflowRepository } = createAssistant();

  workflowRepository.create = async () => {
    throw new WorkflowInstanceStoreError("unavailable", "private database failure", {
      cause: new Error("private database details"),
    });
  };

  const output = await readChatResponse(
    await post(
      chatRequest({
        message: "Leave a message",
        workflowStart: {
          workflowId: "contact",
          originPage: "/",
          originEntry: "assistant-starter-contact",
        },
      }),
    ),
  );

  assert.equal(inputs.length, 0);
  assert.match(output, /The assistant could not respond\. Please try again\./);
  assert.doesNotMatch(output, /private database/);
  assert.deepEqual(errors, [
    {
      message: "assistant.response_failed",
      context: {
        category: "assistant_request_failed",
        operation: "workflow_start",
        workflowInstanceId: null,
      },
    },
  ]);
});

test("aborted request stops without emitting a response", async () => {
  const controller = new AbortController();

  controller.abort();
  const { post } = createAssistant();

  const response = await post(
    chatRequest(
      {
        message: "Stop this request.",
        previousResponseId: null,
      },
      controller.signal,
    ),
  );

  const output = await readChatResponse(response);

  assert.equal(output, "");
});

test("aborting after a streamed delta skips later tools and final events", async () => {
  const controller = new AbortController();

  let searches = 0;

  const { post, inputs, errors } = createAssistant({
    embedding: async () => {
      searches += 1;

      return [0.1];
    },
    response: async () =>
      (async function* () {
        yield { type: "response.output_text.delta", delta: "Partial answer." };
        controller.abort();
        yield {
          type: "response.output_item.done",
          item: {
            type: "function_call",
            call_id: "after-abort",
            name: "search_website",
            arguments: '{"query":"Freeman"}',
          },
        };
      })() as never,
  });

  const output = await readChatResponse(
    await post(chatRequest({ message: "Show me the work" }, controller.signal)),
  );

  assert.deepEqual(
    output
      .trim()
      .split("\n")
      .map((line) => assistantStreamEventSchema.parse(JSON.parse(line))),
    [{ type: "delta", delta: "Partial answer." }],
  );
  assert.equal(inputs.length, 1);
  assert.equal(searches, 0);
  assert.deepEqual(errors, []);
});

test("invalid public request returns the current safe validation response", async () => {
  const { post } = createAssistant();

  const response = await post(chatRequest({ message: " ".repeat(501) }));

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "Message is required." });
});

test("denied chat requests return the current limit response without invoking the assistant", async () => {
  const rateLimit: Pick<RateLimitService, "consume"> = {
    consume: async (): Promise<RateLimitResult> => ({
      allowed: false,
      limit: 10,
      remaining: 0,
      resetAt: Date.now() + 60_000,
    }),
  };

  const { inputs, post } = createAssistant({ rateLimit });

  const response = await post(chatRequest({ message: "What has Freeman built?" }));

  assert.equal(response.status, 429);
  assert.deepEqual(await response.json(), {
    error: "Too many messages. Please try again in a few minutes.",
  });
  assert.equal(response.headers.get("X-RateLimit-Limit"), "10");
  assert.equal(response.headers.get("X-RateLimit-Remaining"), "0");
  assert.ok(Number(response.headers.get("Retry-After")) >= 1);
  assert.equal(inputs.length, 0);
});

test("rate-limit failures return a generic unavailable response without invoking the assistant", async () => {
  const rateLimit: Pick<RateLimitService, "consume"> = {
    consume: async () => {
      throw new Error("database unavailable");
    },
  };

  const { errors, inputs, post } = createAssistant({ rateLimit });

  const response = await post(chatRequest({ message: "What has Freeman built?" }));

  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    error: "Service temporarily unavailable. Please try again later.",
  });
  assert.equal(inputs.length, 0);
  assert.deepEqual(errors, [
    {
      message: "chat.rate_limit_failed",
      context: { category: "rate_limit_failure", scope: "chat" },
    },
  ]);
});

class MemoryWorkflowInstanceRepository implements IWorkflowInstanceRepository {
  readonly instances = new Map<string, WorkflowInstance>();

  private sequence = 0;

  async create(input: CreateWorkflowInstanceInput): Promise<WorkflowInstance> {
    this.sequence += 1;
    const id = `00000000-0000-4000-8000-${String(this.sequence).padStart(12, "0")}`;

    const timestamp = new Date("2026-08-20T10:00:00.000Z");

    const instance: WorkflowInstance = {
      id,
      ...input,
      revision: 0,
      status: "active",
      startedAt: timestamp,
      completedAt: null,
      updatedAt: timestamp,
    };

    this.instances.set(id, instance);

    return instance;
  }

  async findById(id: string): Promise<WorkflowInstance | null> {
    return this.instances.get(id) ?? null;
  }

  async save(input: SaveWorkflowInstanceInput): Promise<WorkflowInstance> {
    const current = this.instances.get(input.id);

    if (!current || current.status !== "active") {
      throw new Error("Workflow instance is unavailable.");
    }

    const saved: WorkflowInstance = {
      ...current,
      revision: current.revision + 1,
      status: input.status,
      state: input.state,
      completedAt: input.completedAt,
      updatedAt: new Date("2026-08-20T10:01:00.000Z"),
    };

    this.instances.set(saved.id, saved);

    if (input.replacement) {
      return this.create(input.replacement);
    }

    return saved;
  }
}
