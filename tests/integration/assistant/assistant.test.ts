import assert from "node:assert/strict";
import test from "node:test";

import { createChatPostHandler } from "@/app/api/chat/route";
import type { ILogger } from "@/server/infrastructure/logging/logger.interface";
import type { IOpenAIProvider } from "@/server/infrastructure/openai/interfaces/openai.provider.interface";
import type { OpenAIResponseRequest } from "@/server/infrastructure/openai/models/openai-response-request";
import type { ISiteSearchService, SiteSearchResult } from "@/server/modules/search-index/public";
import { AssistantService } from "@/server/modules/assistant/services/assistant.service";
import type { IWorkflowInstanceRepository } from "@/server/modules/workflow/interfaces/workflow-instance.repository.interface";
import { MeetingBookingWorkflowDefinition } from "@/server/modules/workflow/definitions/meeting-booking/meeting-booking-definition";
import { WorkflowDefinitionRegistry } from "@/server/modules/workflow/models/workflow-definition-registry";
import type {
  CreateWorkflowInstanceInput,
  SaveWorkflowInstanceInput,
  WorkflowInstance,
} from "@/server/modules/workflow/models/workflow-instance";
import { WorkflowService } from "@/server/modules/workflow/services/workflow.service";

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
  response = async () =>
    events(
      { type: "response.created", response: { id: "resp_current" } },
      { type: "response.output_text.delta", delta: "A grounded answer." },
      { type: "response.completed", response: { id: "resp_current" } },
    ),
}: {
  chunks?: SiteSearchResult[];
  embedding?: IOpenAIProvider["createEmbedding"];
  response?: (request: OpenAIResponseRequest) => ReturnType<IOpenAIProvider["streamResponse"]>;
} = {}) {
  const inputs: OpenAIResponseRequest[] = [];

  const errors: Array<{ message: string; context: unknown }> = [];

  const logger: ILogger = {
    info: () => undefined,
    error: (message, context) => errors.push({ message, context }),
  };

  const openai: IOpenAIProvider = {
    getEmbeddingModel: () => "test-model",
    createEmbedding: embedding,
    createEmbeddings: async () => [],
    streamResponse: async (request) => {
      inputs.push(request);

      return response(request);
    },
  };

  const siteSearch: ISiteSearchService = {
    search: async () => chunks,
  };

  const meetingService = {
    findAvailableSlots: async () => [meetingSlot],
    isSlotAvailable: async () => true,
    bookMeeting: async () => ({ googleEventId: "event_test", googleEventUrl: null }),
    reconcileMeeting: async () => ({ googleEventId: "event_test", googleEventUrl: null }),
  };

  const workflowRepository = new MemoryWorkflowInstanceRepository();

  const workflowService = new WorkflowService(
    new WorkflowDefinitionRegistry([new MeetingBookingWorkflowDefinition(meetingService)]),
    workflowRepository,
    ["search_website"],
  );

  const assistantService = new AssistantService(openai, siteSearch, logger, workflowService);

  return {
    errors,
    inputs,
    meetingService,
    post: createChatPostHandler({ assistantService }),
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

async function readChatResponse(response: Response) {
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Content-Type"), "application/x-ndjson; charset=utf-8");
  assert.ok(response.body);

  return read(response.body);
}

test("conversational response streams without mandatory retrieval", async () => {
  const { inputs, post } = createAssistant();

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
  assert.match(output, /A grounded answer\./);
  assert.match(output, /"sources":\[\]/);
  assert.match(output, /resp_current/);
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
    ["search_website", "start_workflow"],
  );
  assert.deepEqual(
    inputs[1]?.tools.map(({ name }) => name),
    ["search_website", "cancel_workflow", "find_meeting_slots"],
  );
  assert.doesNotMatch(inputs[0]?.instructions ?? "", /meeting-booking workflow/i);
  assert.match(inputs[1]?.instructions ?? "", /meeting-booking workflow/i);
  assert.equal(inputs[1]?.input[0]?.type, "function_call_output");
  assert.match(output, /Which dates work for you\?/);
  assert.match(output, /"type":"workflow_instance"/);
  assert.match(output, /"status":"active"/);
  assert.doesNotMatch(output, /availableSlots|pendingBooking|visitor@example\.com/);
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
        workflowInstanceId: "00000000-0000-4000-8000-000000000001",
      },
    },
  ]);
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
        workflowInstanceId: "00000000-0000-4000-8000-000000000001",
      },
    },
  ]);
});

test("terminal workflow metadata clears the active surface without streaming private state", async () => {
  const { inputs, post, workflowService } = createAssistant({
    response: async (request) => {
      if (request.input[0]?.type !== "function_call_output") {
        return events(
          { type: "response.created", response: { id: "resp_confirmation_tool" } },
          {
            type: "response.output_item.done",
            item: {
              type: "function_call",
              call_id: "call_confirm",
              name: "confirm_meeting",
              arguments: "{}",
            },
          },
          { type: "response.completed", response: { id: "resp_confirmation_tool" } },
        );
      }

      if (request.tools.some(({ name }) => name === "book_meeting")) {
        return events(
            { type: "response.created", response: { id: "resp_booking_tool" } },
            {
              type: "response.output_item.done",
              item: {
                type: "function_call",
                call_id: "call_book",
                name: "book_meeting",
                arguments: "{}",
              },
            },
            { type: "response.completed", response: { id: "resp_booking_tool" } },
          );
      }

      return events(
        { type: "response.created", response: { id: "resp_booking_done" } },
        { type: "response.output_text.delta", delta: "Your meeting is booked." },
        { type: "response.completed", response: { id: "resp_booking_done" } },
      );
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
        message: "Yes, confirm the prepared booking.",
        workflowInstanceId: instance.id,
      }),
    ),
  );

  assert.deepEqual(
    inputs[0]?.tools.map(({ name }) => name),
    [
      "search_website",
      "cancel_workflow",
      "find_meeting_slots",
      "prepare_meeting",
      "confirm_meeting",
    ],
  );
  assert.deepEqual(
    inputs[1]?.tools.map(({ name }) => name),
    ["search_website", "cancel_workflow", "book_meeting"],
  );
  assert.deepEqual(
    inputs[2]?.tools.map(({ name }) => name),
    ["search_website", "start_workflow"],
  );
  assert.match(output, /"status":"completed"/);
  assert.doesNotMatch(output, /availableSlots|pendingBooking|visitor@example\.com/);
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
      context: { category: "assistant_request_failed", workflowInstanceId: null },
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

test("invalid public request returns the current safe validation response", async () => {
  const { post } = createAssistant();

  const response = await post(chatRequest({ message: " ".repeat(501) }));

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "Message is required." });
});

test("rate-limited request receives the current limit response", async () => {
  const { post } = createAssistant();

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const response = await post(chatRequest({ message: "What has Freeman built?" }));

    assert.equal(response.status, 200);
  }

  const response = await post(chatRequest({ message: "What has Freeman built?" }));

  assert.equal(response.status, 429);
  assert.deepEqual(await response.json(), {
    error: "Too many messages. Please try again in a few minutes.",
  });
  assert.equal(response.headers.get("X-RateLimit-Limit"), "10");
  assert.equal(response.headers.get("X-RateLimit-Remaining"), "0");
  assert.ok(Number(response.headers.get("Retry-After")) >= 1);
});

class MemoryWorkflowInstanceRepository implements IWorkflowInstanceRepository {
  private readonly instances = new Map<string, WorkflowInstance>();

  private sequence = 0;

  async create(input: CreateWorkflowInstanceInput): Promise<WorkflowInstance> {
    this.sequence += 1;
    const id = `00000000-0000-4000-8000-${String(this.sequence).padStart(12, "0")}`;

    const timestamp = new Date("2026-08-20T10:00:00.000Z");

    const instance: WorkflowInstance = {
      id,
      ...input,
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
      status: input.status,
      state: input.state,
      completedAt: input.completedAt,
      updatedAt: new Date("2026-08-20T10:01:00.000Z"),
    };

    this.instances.set(saved.id, saved);

    return saved;
  }
}
