import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { NextRequest } from "next/server";

import { createChatPostHandler } from "@/app/api/chat/route";
import { createWorkflowAccess } from "@/app/api/chat/helpers";
import type { Logger } from "@/infrastructure/logging/logger";
import type { OpenAITransport } from "@/infrastructure/openai/types";
import type { OpenAIResponseRequest } from "@/infrastructure/openai/types";
import { AssistantService } from "@/modules/assistant/service";
import type { ConsumeRateLimitInput, RateLimitResult } from "@/modules/rate-limit/rate-limit.types";
import type { RateLimitService } from "@/modules/rate-limit/service";
import type { IWorkflowInstanceRepository } from "@/modules/workflow/interfaces";
import type { WorkflowInstance } from "@/generated/prisma/client";
import { MeetingBookingWorkflowDefinition } from "@/modules/workflow/definitions/meeting-booking/meeting-booking.definition";
import { MeetingBookingWorkflowProgressProjector } from "@/modules/workflow/definitions/meeting-booking/meeting-booking.progress";
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

const testSecret = "workflow-access-test-secret";

const testSession = "A".repeat(43);

const testAccess = createWorkflowAccess(testSession, testSecret);

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
  response = async () =>
    events(
      { type: "response.created", response: { id: "resp_current" } },
      { type: "response.output_text.delta", delta: "A grounded answer." },
      { type: "response.completed", response: { id: "resp_current" } },
    ),
  rateLimit,
  meeting,
  portfolioSearch,
  onVercel = false,
}: {
  response?: (request: OpenAIResponseRequest) => ReturnType<OpenAITransport["streamResponse"]>;
  rateLimit?: Pick<RateLimitService, "consume">;
  meeting?: MeetingServiceClient;
  portfolioSearch?: ConstructorParameters<typeof AssistantService>[3];
  onVercel?: boolean;
} = {}) {
  const inputs: OpenAIResponseRequest[] = [];

  const rateLimitInputs: ConsumeRateLimitInput[] = [];

  const errors: Array<{ message: string; context: unknown }> = [];

  const logger: Logger = {
    info: () => undefined,
    error: (message, context) => errors.push({ message, context }),
  };

  const openai: OpenAITransport = {
    streamResponse: async (request) => {
      inputs.push(request);

      return response(request);
    },
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
      new MeetingBookingWorkflowDefinition(
        meetingService,
        new MeetingBookingWorkflowProgressProjector(),
      ),
    ]),
    workflowRepository,
    ["ask_user_choice"],
    { info() {}, error() {} },
  );

  const assistantService = new AssistantService(openai, logger, workflowService, portfolioSearch);

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
    post: createChatPostHandler({
      assistantService,
      rateLimitService,
      logger,
      getAccessSecret: () => testSecret,
      onVercel,
    }),
    rateLimitInputs,
    workflowRepository,
    workflowService,
  };
}

function chatRequest(body: unknown, signal?: AbortSignal) {
  const payload =
    typeof body === "object" && body && "workflowInstanceId" in body &&
    typeof body.workflowInstanceId === "string"
      ? { ...body, workflowInstanceId: testAccess.encode(body.workflowInstanceId) }
      : body;

  return new NextRequest("http://localhost/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: `portfolio-chat=${testSession}` },
    body: JSON.stringify(payload),
    signal,
  });
}

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
      identifier: "anonymous",
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
  "concurrent requests keep workflow transitions and response checkpoints isolated",
  { timeout: 5000 },
  async () => {
    let initialRequests = 0;

    let releaseInitial!: () => void;

    const initialBarrier = new Promise<void>((resolve) => {
      releaseInitial = resolve;
    });

    const { post, workflowService, workflowRepository, errors } = createAssistant({
      response: async (request) => {
        if (request.input[0]?.type === "function_call_output") {
          const label = request.previousResponseId === "resp_Alpha_tools" ? "Alpha" : "Beta";

          assert.match(JSON.stringify(request.input), new RegExp(`${label} topic`));
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
          { type: "response.output_text.delta", delta: `${label} updating.` },
          {
            type: "response.output_item.done",
            item: {
              type: "function_call",
              call_id: `${label}-update`,
              name: "update_meeting_context",
              arguments: JSON.stringify({
                updates: [{ field: "reason", value: `${label} topic` }],
              }),
            },
          },
          { type: "response.completed", response: { id: `resp_${label}_tools` } },
        );
      },
    });

    const instances = [];

    for (const label of ["Alpha", "Beta"]) {
      const instance = await workflowService.start("meeting-booking", {
        originChannel: "test",
        originPage: null,
        originEntry: null,
      });

      await workflowService.executeTool(instance.id, {
        name: "update_meeting_context",
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
      assert.doesNotMatch(output, new RegExp(index === 0 ? "Beta" : "Alpha"));
      assert.deepEqual(
        streamed.find((event) => event.type === "response_id"),
        { type: "response_id", responseId: `resp_${label}_final` },
      );
      for (const event of streamed) {
        if (event.type === "workflow_instance") {
          assert.ok(event.instance);
          assert.equal(event.instance.id, testAccess.encode(instances[index].id));
        }

        if (event.type === "sources") {
          assert.deepEqual(event.sources, []);
        }
      }

      const saved = await workflowRepository.findById(instances[index].id);

      assert.ok(saved?.state && typeof saved.state === "object" && !Array.isArray(saved.state));
      assert.equal(saved.state.reason, `${label} topic`);
    }

    assert.deepEqual(errors, []);
  },
);

test("a saved update or cancellation is streamed before a provider continuation fails", async () => {
  for (const cancelled of [false, true]) {
    const { post, workflowService, workflowRepository, errors } = createAssistant({
      response: async (request) => {
        if (request.input[0]?.type === "function_call_output") {
          const saved = await workflowRepository.findById(instance.id);

          assert.equal(saved?.status, cancelled ? "cancelled" : "active");
          assert.equal(saved?.revision, 1);
          throw new Error("private provider details");
        }

        return events(
          { type: "response.created", response: { id: "resp_transition" } },
          {
            type: "response.output_item.done",
            item: {
              type: "function_call",
              call_id: "transition",
              name: cancelled ? "cancel_workflow" : "update_meeting_context",
              arguments: cancelled
                ? "{}"
                : JSON.stringify({ updates: [{ field: "email", value: "saved@example.test" }] }),
            },
          },
          { type: "response.completed", response: { id: "resp_transition" } },
        );
      },
    });

    const instance = await workflowService.start("meeting-booking", {
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

      assert.ok(event.instance);
      assert.equal(event.instance.id, testAccess.encode(instance.id));
      assert.equal(event.instance.status, cancelled ? "cancelled" : "active");
      if (!cancelled) {
        assert.equal(
          event.instance.progress.fields.find(({ key }) => key === "email")?.value,
          "saved@example.test",
        );
      }
    }

    assert.doesNotMatch(output, /private|provider details|resp_transition/);
    assert.deepEqual(errors, [
      {
        message: "assistant.response_failed",
        context: {
          category: "assistant_request_failed",
          operation: "provider_response",
          workflowInstanceId: cancelled ? null : instance.id,
        },
      },
    ]);
  }
});

test("the bounded model loop stops before executing a fourth tool batch", async () => {
  const { inputs, post } = createAssistant({
    response: async () =>
      toolResponse("resp_again", { name: "unknown_tool", arguments: "{}" }),
  });

  const output = await readChatResponse(await post(chatRequest({ message: "Find relevant work" })));

  assert.equal(inputs.length, 4);
  assert.ok(inputs.slice(1).every(({ input }) => input[0]?.type === "function_call_output"));
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

function portfolioCall(query: string | null, id = "call_search", workflowRequested = false) {
  return {
    type: "response.output_item.done",
    item: {
      type: "function_call",
      call_id: id,
      name: "search_portfolio",
      arguments: JSON.stringify({ query, workflowRequested }),
    },
  };
}

for (const [message, query, title, url] of [
  ["What was your role there?", "Freeman's role on JPScents", "JPScents", "/work/jpscents"],
  ["Where has Freeman worked?", "Freeman work experience", "Experience", "/#experience"],
  [
    "Can Freeman automate a process?",
    "Freeman process automation services",
    "Services",
    "/#services",
  ],
]) {
  test(`portfolio search grounds the answer to: ${message}`, async () => {
    const searched: string[] = [];

    const excerpt = `Published evidence for ${title}`;

    const { inputs, post } = createAssistant({
      portfolioSearch: {
        search: async (value) => {
          searched.push(value);

          return [{ excerpt, source: { id: title, title, url } }];
        },
      },
      response: async (request) => {
        if (request.input[0]?.type === "function_call_output") {
          assert.ok(JSON.stringify(request.input).includes(excerpt));
          assert.ok(request.tools.every(({ name }) => name !== "search_portfolio"));

          return events(
            { type: "response.output_text.delta", delta: "[[GROUND" },
            { type: "response.output_text.delta", delta: "ED]]" },
            { type: "response.output_text.delta", delta: excerpt },
            { type: "response.completed", response: { id: "resp_answer" } },
          );
        }

        assert.equal(request.requireTool, true);
        assert.equal(request.previousResponseId, "resp_prior");
        assert.ok(request.tools.some(({ name }) => name === "search_portfolio"));

        return events(
          { type: "response.output_text.delta", delta: "Discard this preamble" },
          portfolioCall(query),
          portfolioCall(query, "duplicate"),
          { type: "response.completed", response: { id: "resp_search" } },
        );
      },
    });

    const output = await readChatResponse(
      await post(chatRequest({ message, previousResponseId: "resp_prior" })),
    );

    assert.deepEqual(searched, [query]);
    assert.equal(inputs.length, 2);
    assert.ok(output.includes(excerpt));
    assert.ok(output.includes(url));
    assert.doesNotMatch(output, /Discard this preamble/);
  });
}

for (const unavailable of [false, true]) {
  test(`portfolio search returns a safe limitation when ${unavailable ? "unavailable" : "empty"}`, async () => {
    const { post, workflowService } = createAssistant({
      portfolioSearch: {
        search: async () => {
          if (unavailable) {
            throw new Error("private provider error");
          }

          return [];
        },
      },
      response: async (request) => {
        assert.notEqual(
          request.input[0]?.type,
          "function_call_output",
          "No provider continuation is needed for a search failure",
        );

        return events(portfolioCall("Freeman astronaut missions"), {
          type: "response.completed",
          response: { id: "resp_unanswered_call" },
        });
      },
    });

    const active = unavailable
      ? await workflowService.start("meeting-booking", {
          originChannel: "web",
          originPage: null,
          originEntry: null,
        })
      : null;

    const output = await readChatResponse(
      await post(
        chatRequest({
          message: "What astronaut missions did Freeman do?",
          previousResponseId: "resp_prior",
          workflowInstanceId: active?.id,
        }),
      ),
    );

    assert.match(output, unavailable ? /couldn’t search/ : /enough/);
    assert.match(output, /"sources":\[\]/);
    assert.doesNotMatch(output, /Unsupported claim|private provider error/);
    assert.match(output, /"responseId":"resp_prior"/);
    assert.doesNotMatch(output, /resp_unanswered_call/);
    if (active) {
      assert.ok(output.includes(active.id));
      assert.equal(
        (await workflowService.getAssistantContext(active.id)).instance?.status,
        "active",
      );
    }
  });
}

test("a direct completion cannot bypass the required portfolio routing step", async () => {
  const { post } = createAssistant({
    portfolioSearch: {
      search: async () => {
        throw new Error("Search was not called");
      },
    },
    response: async (request) => {
      assert.equal(request.requireTool, true);

      return events(
        { type: "response.output_text.delta", delta: "Freeman built a fictional perfume formula." },
        { type: "response.completed", response: { id: "resp_unsupported_direct_answer" } },
      );
    },
  });

  const output = await readChatResponse(
    await post(chatRequest({ message: "What did Freeman build for JPScents?" })),
  );

  assert.doesNotMatch(output, /fictional perfume|resp_unsupported_direct_answer/);
  assert.match(output, /"sources":\[\]/);
  assert.match(output, /"type":"done"/);
});

test("ordinary conversation can continue without calling the embedding provider", async () => {
  let queries = 0;

  const { post } = createAssistant({
    portfolioSearch: {
      search: async () => {
        queries += 1;

        return [];
      },
    },
    response: async (request) => {
      if (request.requireTool) {
        assert.deepEqual(
          request.tools.map(({ name }) => name),
          ["search_portfolio"],
        );

        return events(portfolioCall(null), {
          type: "response.completed",
          response: { id: "resp_route" },
        });
      }

      assert.match(JSON.stringify(request.input), /no_portfolio_facts_needed/);

      return events(
        { type: "response.output_text.delta", delta: "Hello! How can I help?" },
        { type: "response.completed", response: { id: "resp_hello" } },
      );
    },
  });

  const output = await readChatResponse(await post(chatRequest({ message: "Hello!" })));

  assert.equal(queries, 0);
  assert.match(output, /Hello! How can I help/);
  assert.match(output, /"sources":\[\]/);
});

test("an ungrounded answer drops unrelated matches even if the model writes a limitation", async () => {
  const { post } = createAssistant({
    portfolioSearch: {
      search: async () => [
        {
          excerpt: "Work experience: Pay4Me and Novier Labs.",
          source: { id: "experience", title: "Experience", url: "/#experience" },
        },
      ],
    },
    response: async (request) => {
      if (request.requireTool) {
        return events(portfolioCall("Microsoft employment history"), {
          type: "response.completed",
          response: { id: "resp_search" },
        });
      }

      assert.match(request.instructions, /GROUNDED/);

      return events(
        { type: "response.output_text.delta", delta: "I couldn’t find Microsoft in the snippets." },
        { type: "response.output_text.delta", delta: " The Experience page is worth a look." },
        { type: "response.completed", response: { id: "resp_unsupported" } },
      );
    },
  });

  const output = await readChatResponse(
    await post(chatRequest({ message: "How long did Freeman work at Microsoft?" })),
  );

  assert.match(output, /couldn’t find enough/);
  assert.match(output, /"sources":\[\]/);
  assert.doesNotMatch(output, /Microsoft in the snippets|worth a look|\/#experience/);
});

test("a mixed Meeting turn keeps the search limitation if the workflow continuation fails", async () => {
  const { post } = createAssistant({
    portfolioSearch: {
      search: async () => {
        throw new Error("provider offline");
      },
    },
    response: async (request) => {
      if (request.requireTool) {
        return events(portfolioCall("JPScents", "call_search", true), {
          type: "response.completed",
          response: { id: "resp_search" },
        });
      }

      if (request.tools.some(({ name }) => name === "start_workflow")) {
        return toolResponse("resp_start_meeting", {
          name: "start_workflow",
          arguments: '{"workflowId":"meeting-booking"}',
        });
      }

      throw new Error("continuation offline");
    },
  });

  const output = await readChatResponse(
    await post(
      chatRequest({
        message: "I want to book a meeting. Also, what did Freeman build for JPScents?",
      }),
    ),
  );

  assert.equal(output.match(/couldn’t search the portfolio/g)?.length, 1);
  assert.match(output, /"workflowId":"meeting-booking"/);
  assert.match(output, /couldn’t continue the request/);
  assert.match(output, /"type":"done"/);
  assert.doesNotMatch(output, /"type":"error"|provider offline|continuation offline/);
});

test("a portfolio limitation remains after a Meeting choice clears earlier text", async () => {
  const choice = {
    question: "What is the meeting about?",
    options: ["Software consulting", "Collaboration"],
  };

  const { post } = createAssistant({
    portfolioSearch: { search: async () => [] },
    response: async (request) => {
      if (request.requireTool) {
        return events(portfolioCall("Apollo 11 lunar module pilot", "call_search", true), {
          type: "response.completed",
          response: { id: "resp_search" },
        });
      }

      if (request.tools.some(({ name }) => name === "start_workflow")) {
        return toolResponse("resp_start_meeting", {
          name: "start_workflow",
          arguments: '{"workflowId":"meeting-booking"}',
        });
      }

      if (request.tools.length) {
        return toolResponse("resp_options", {
          name: "ask_user_choice",
          arguments: JSON.stringify(choice),
        });
      }

      return textResponse("resp_choice_ready", "Duplicate workflow copy that should stay hidden");
    },
  });

  const output = await readChatResponse(
    await post(
      chatRequest({
        message: "Did Freeman pilot Apollo 11? I also want to book a meeting.",
      }),
    ),
  );

  const parsed = output
    .trim()
    .split("\n")
    .map((line) => assistantStreamEventSchema.parse(JSON.parse(line)));

  const choiceIndex = parsed.findIndex((event) => event.type === "choice");

  assert.ok(choiceIndex >= 0);
  assert.deepEqual(parsed[choiceIndex], { type: "choice", choice });
  assert.deepEqual(parsed[choiceIndex + 1], {
    type: "delta",
    delta: "I couldn’t find enough information in the portfolio to answer that.",
  });
  assert.match(output, /"sources":\[\]/);
  assert.doesNotMatch(output, /Duplicate workflow copy/);
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
    ["ask_user_choice", "start_workflow"],
  );
  assert.doesNotMatch(inputs[0]?.instructions ?? "", /audit: Request a free review/);
  assert.match(
    JSON.stringify(inputs[0]?.tools.find(({ name }) => name === "start_workflow")?.parameters),
    /"enum":\["meeting-booking"\]/,
  );
  assert.deepEqual(
    inputs[1]?.tools.map(({ name }) => name),
    [
      "ask_user_choice",
      "cancel_workflow",
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

test("chat on Vercel uses only the platform IP header and falls back to anonymous", async () => {
  const { post, rateLimitInputs } = createAssistant({ onVercel: true });

  const headers = {
    "x-forwarded-for": "192.0.2.20",
    "x-real-ip": "192.0.2.21",
    "cf-connecting-ip": "192.0.2.22",
  };

  for (const ip of ["2001:db8::4", "invalid", undefined]) {
    const response = await post(
      new NextRequest("https://portfolio.example/api/chat", {
        method: "POST",
        body: JSON.stringify({ message: "Hello" }),
        headers: ip ? { ...headers, "x-vercel-forwarded-for": ip } : headers,
      }),
    );

    assert.equal(response.status, 200);
  }

  assert.deepEqual(
    rateLimitInputs.map(({ identifier }) => identifier),
    ["2001:db8::4", "anonymous", "anonymous"],
  );
});

test("a workflow reference resumes only in the browser session that received it", async () => {
  const { post, inputs, workflowRepository } = createAssistant({
    onVercel: true,
    response: async (request) =>
      request.tools.some(({ name }) => name === "start_workflow")
        ? toolResponse("resp_start", {
            name: "start_workflow",
            arguments: '{"workflowId":"meeting-booking"}',
          })
        : textResponse("resp_ready"),
  });

  const send = (body: unknown, cookie?: string) =>
    post(
      new NextRequest("https://portfolio.example/api/chat", {
        method: "POST",
        body: JSON.stringify(body),
        headers: cookie ? { cookie } : {},
      }),
    );

  const first = await send({ message: "Book a meeting" });

  const setCookie = first.headers.get("set-cookie") ?? "";

  assert.ok(/^__Host-portfolio-chat=[A-Za-z0-9_-]{43};/.test(setCookie));
  assert.ok(/; Path=\/(?:;|$)/i.test(setCookie));
  assert.ok(/; HttpOnly/i.test(setCookie));
  assert.ok(/; Secure/i.test(setCookie));
  assert.ok(/; SameSite=Strict/i.test(setCookie));
  const cookie = setCookie.split(";", 1)[0];

  const started = (await readChatResponse(first))
    .trim()
    .split("\n")
    .map((line) => assistantStreamEventSchema.parse(JSON.parse(line)))
    .find((event) => event.type === "workflow_instance");

  assert.ok(started?.instance);
  const reference = started.instance.id;

  const resumed = await readChatResponse(
    await send({ message: "Continue my booking", workflowInstanceId: reference }, cookie),
  );

  assert.ok(resumed.includes(reference));
  const other = await send({ message: "Hello" });

  const otherCookie = other.headers.get("set-cookie")?.split(";", 1)[0];

  await readChatResponse(other);
  assert.ok(otherCookie);
  const modelCalls = inputs.length;

  for (const body of [
    { message: "Continue my booking", workflowInstanceId: reference },
    { action: "confirm_booking", workflowInstanceId: reference, expectedRevision: 0 },
    { action: "retry_booking", workflowInstanceId: reference },
  ]) {
    const denied = await send(body, otherCookie);

    assert.equal(denied.status, 403);
    assert.deepEqual(await denied.json(), {
      error: "This workflow is unavailable in this browser session.",
      code: "workflow_access_denied",
    });
  }

  assert.equal((await send({ message: "Continue", workflowInstanceId: reference })).status, 403);
  assert.equal(inputs.length, modelCalls);
  assert.equal(workflowRepository.instances.size, 2);
});

test("retired contact actions and explicit workflow starts return 400 before invoking the model", async () => {
  const { inputs, post, workflowRepository } = createAssistant();

  const workflowInstanceId = "11111111-1111-4111-8111-111111111111";

  for (const payload of [
    { action: "confirm_contact", workflowInstanceId, expectedRevision: 1 },
    { action: "retry_contact", workflowInstanceId },
    {
      message: "Book a meeting",
      workflowStart: {
        workflowId: "meeting-booking",
        originPage: "/",
        originEntry: "assistant-starter-meeting",
      },
    },
    { message: "Book a meeting", workflowStart: null },
    {
      message: "Leave a message",
      workflowStart: {
        workflowId: "contact",
        originPage: "/",
        originEntry: "assistant-starter-contact",
      },
    },
  ]) {
    assert.equal((await post(chatRequest(payload))).status, 400);
  }

  assert.equal(inputs.length, 0);
  assert.equal(workflowRepository.instances.size, 0);
});

test("a saved contact workflow is cleared without exposing or changing its stored state", async () => {
  const { inputs, post, workflowRepository } = createAssistant({
    response: async (request) => {
      const input = request.input[0];

      if (input?.type === "user_message" && input.content === "Book a meeting") {
        return toolResponse("resp_start_meeting", {
          name: "start_workflow",
          arguments: '{"workflowId":"meeting-booking"}',
        });
      }

      return textResponse("resp_current");
    },
  });

  const retired = await workflowRepository.create({
    workflowId: "contact",
    workflowVersion: 1,
    state: { message: "Private saved enquiry" },
    originChannel: "web",
    originPage: "/",
    originEntry: null,
  });

  const output = await readChatResponse(
    await post(
      chatRequest({
        message: "Hello",
        workflowInstanceId: retired.id,
        previousResponseId: "resp_retired",
      }),
    ),
  );

  assert.match(output, /"type":"workflow_instance","instance":null/);
  assert.match(output, /"type":"done"/);
  assert.doesNotMatch(output, /Private saved enquiry|resp_retired|"type":"error"/);
  assert.equal(inputs[0]?.previousResponseId, null);
  assert.deepEqual(inputs[0]?.input, [{ type: "user_message", content: "Hello" }]);
  assert.deepEqual(await workflowRepository.findById(retired.id), retired);

  const booking = await readChatResponse(
    await post(
      chatRequest({
        message: "Book a meeting",
        workflowInstanceId: retired.id,
        previousResponseId: "resp_retired",
      }),
    ),
  );

  assert.equal(inputs[1]?.previousResponseId, null);
  assert.match(booking, /"workflowId":"meeting-booking"/);
  assert.deepEqual(await workflowRepository.findById(retired.id), retired);
});

test("a booking message with an active Meeting continues that instance", async () => {
  const { inputs, post, workflowRepository, workflowService } = createAssistant();

  const active = await workflowService.start("meeting-booking", {
    originChannel: "web",
    originPage: "/",
    originEntry: "assistant-starter-meeting",
  });

  const output = await readChatResponse(
    await post(
      chatRequest({
        message: "I'd like to book a meeting with Freeman.",
        workflowInstanceId: active.id,
      }),
    ),
  );

  assert.equal(workflowRepository.instances.size, 1);
  assert.equal(inputs[0]?.tools.some(({ name }) => name === "start_workflow"), false);
  assert.match(output, new RegExp(active.id));
  assert.match(output, /"workflowId":"meeting-booking"/);
});

const choice = {
  question: "Keep booking this meeting or cancel it?",
  options: ["Continue booking", "Cancel the meeting request"],
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
        assert.match(outputs[0]!.output, /Continue booking/);
        assert.match(outputs[1]!.output, /skipped/);
        assert.match(outputs[2]!.output, /skipped/);

        return textResponse("resp_choice_ready");
      }

      if (request.previousResponseId === "resp_choice_ready") {
        assert.match(JSON.stringify(request.input), /Continue booking/);

        return textResponse("resp_followup", "Let's continue booking.");
      }

      return toolResponse(
        "resp_choice_tools",
        { name: "ask_user_choice", arguments: JSON.stringify(choice) },
        { name: "cancel_workflow", arguments: "{}" },
        { name: "ask_user_choice", arguments: JSON.stringify({ ...choice, question: "Ignored?" }) },
      );
    },
  });

  const instance = await workflowService.start("meeting-booking", {
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
  assert.match(output, /"id":"00000000-0000-4000-8000-000000000001\.[A-Za-z0-9_-]{43}"/);
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

        return textResponse(
          "resp_availability_unavailable",
          "Meeting availability is temporarily unavailable. Please try again later.",
        );
      }

      return toolResponse("resp_find_slots", {
        name: "find_meeting_slots",
        arguments: '{"startDate":"2099-09-15","endDate":"2099-09-15"}',
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
  assert.match(output, /"id":"00000000-0000-4000-8000-000000000001\.[A-Za-z0-9_-]{43}"/);
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
  const { errors, inputs, post, workflowRepository } = createAssistant({
    response: async () => toolResponse("resp_start_meeting", {
      name: "start_workflow",
      arguments: '{"workflowId":"meeting-booking"}',
    }),
  });

  workflowRepository.create = async () => {
    throw new WorkflowInstanceStoreError("unavailable", "private database failure", {
      cause: new Error("private database details"),
    });
  };

  const output = await readChatResponse(await post(chatRequest({ message: "Book a meeting" })));

  assert.equal(inputs.length, 1);
  assert.match(output, /The assistant could not respond\. Please try again\./);
  assert.doesNotMatch(output, /private database/);
  assert.deepEqual(errors, [
    {
      message: "assistant.response_failed",
      context: {
        category: "assistant_request_failed",
        operation: "tool_execution",
        workflowInstanceId: null,
      },
    },
  ]);
});

test("unfinished model turns cannot execute tools or publish a checkpoint", async () => {
  for (const completion of ["eof", "incomplete"]) {
    const providerEvents = [
      { type: "response.created", response: { id: "resp_unfinished" } },
      { type: "response.output_text.delta", delta: "I’ll check availability." },
      {
        type: "response.output_item.done",
        item: {
          type: "function_call",
          call_id: "start-before-completion",
          name: "start_workflow",
          arguments: '{"workflowId":"meeting-booking"}',
        },
      },
    ];

    if (completion === "incomplete") {
      providerEvents.push({ type: "response.incomplete", response: { id: "resp_unfinished" } });
    }

    const { post, inputs, workflowRepository } = createAssistant({
      response: async () => events(...providerEvents),
    });

    const output = await readChatResponse(
      await post(chatRequest({ message: "Book a meeting", previousResponseId: "resp_prior" })),
    );

    assert.match(output, /"type":"error"/);
    assert.doesNotMatch(output, /"type":"response_id"|"type":"workflow_instance"|"type":"done"/);
    assert.equal(inputs.length, 1);
    assert.equal(workflowRepository.instances.size, 0);
  }
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

  const { post, inputs, errors } = createAssistant({
    response: async () =>
      (async function* () {
        yield { type: "response.output_text.delta", delta: "Partial answer." };
        controller.abort();
        yield {
          type: "response.output_item.done",
          item: {
            type: "function_call",
            call_id: "after-abort",
            name: "ask_user_choice",
            arguments: "{}",
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
  assert.deepEqual(errors, []);
});

test("oversized chunked UTF-8 bodies return 413 before the limiter or assistant runs", async () => {
  const { post, inputs, rateLimitInputs } = createAssistant();

  const encoder = new TextEncoder();

  let cancelled = false;

  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode('{"message":"' + "é".repeat(4000)));
      controller.enqueue(encoder.encode("é".repeat(100) + '"}'));
    },
    cancel() {
      cancelled = true;
    },
  });

  const init = { method: "POST", body, duplex: "half" } as const;

  const response = await post(new NextRequest("http://localhost/api/chat", init));

  assert.equal(response.status, 413);
  assert.deepEqual(await response.json(), { error: "Request body is too large." });
  assert.equal(cancelled, true);
  assert.equal(rateLimitInputs.length, 0);
  assert.equal(inputs.length, 0);
});

test("the body limit accepts valid JSON at 8 KiB and preserves the malformed JSON response", async () => {
  const { post, rateLimitInputs } = createAssistant();

  const body = JSON.stringify({ message: "Hello" }).padEnd(8 * 1024);

  const makeRequest = (body: string) =>
    new NextRequest("http://localhost/api/chat", { method: "POST", body });

  const output = await readChatResponse(await post(makeRequest(body)));

  assert.match(output, /A grounded answer/);
  const invalid = await post(makeRequest('{"message":'));

  assert.equal(invalid.status, 400);
  assert.deepEqual(await invalid.json(), { error: "Invalid JSON body." });
  assert.equal(rateLimitInputs.length, 1);
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

  claimMeetingBooking(input: SaveWorkflowInstanceInput): Promise<WorkflowInstance> {
    return this.save(input);
  }
}
