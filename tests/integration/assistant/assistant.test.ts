import assert from "node:assert/strict";
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
  rateLimit,
}: {
  chunks?: SiteSearchResult[];
  embedding?: OpenAITransport["createEmbedding"];
  response?: (request: OpenAIResponseRequest) => ReturnType<OpenAITransport["streamResponse"]>;
  rateLimit?: Pick<RateLimitService, "consume">;
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
    search: async () => chunks,
  };

  const meetingService = {
    findAvailableSlots: async () => [meetingSlot],
    isSlotAvailable: async () => true,
    bookMeeting: async () => ({
      googleEventId: "event_test",
      googleEventUrl: null,
    }),
    reconcileMeeting: async () => ({
      googleEventId: "event_test",
      googleEventUrl: null,
    }),
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
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": "test-client",
    },
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
        { id: "short", limit: 40, windowMs: 10 * 60 * 1000 },
        { id: "daily", limit: 90, windowMs: 24 * 60 * 60 * 1000 },
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
            {
              type: "response.created",
              response: { id: "resp_workflow_active" },
            },
            {
              type: "response.output_text.delta",
              delta: "Which dates work for you?",
            },
            {
              type: "response.completed",
              response: { id: "resp_workflow_active" },
            },
          )
        : events(
            {
              type: "response.created",
              response: { id: "resp_workflow_start" },
            },
            {
              type: "response.output_item.done",
              item: {
                type: "function_call",
                call_id: "call_start",
                name: "start_workflow",
                arguments: '{"workflowId":"meeting-booking"}',
              },
            },
            {
              type: "response.completed",
              response: { id: "resp_workflow_start" },
            },
          ),
  });

  const output = await readChatResponse(
    await post(chatRequest({ message: "I would like to book a meeting." })),
  );

  assert.deepEqual(
    inputs[0]?.tools.map(({ name }) => name),
    ["present_ui", "search_website", "start_workflow"],
  );
  assert.match(inputs[0]?.instructions ?? "", /audit: Request a free review/);
  assert.match(JSON.stringify(inputs[0]?.tools[2]?.parameters), /"audit"/);
  assert.deepEqual(
    inputs[1]?.tools.map(({ name }) => name),
    ["present_ui", "search_website", "cancel_workflow", "switch_workflow", "find_meeting_slots"],
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
    ["present_ui", "search_website", "cancel_workflow", "switch_workflow", "update_audit_context"],
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

test("a different workflow request asks for a choice before cancelling and switching", async () => {
  const { inputs, post, workflowRepository, workflowService } = createAssistant({
    response: async (request) => {
      const toolNames = request.tools.map(({ name }) => name);

      if (request.instructions.includes("The visitor tried to start")) {
        return events(
          {
            type: "response.created",
            response: { id: "resp_workflow_choice" },
          },
          {
            type: "response.output_text.delta",
            delta: "Continue your message, or cancel it and switch to the audit?",
          },
          {
            type: "response.output_item.done",
            item: {
              type: "function_call",
              call_id: "choice",
              name: "present_ui",
              arguments: JSON.stringify({
                introduction: "Continue your message, or cancel it and start the audit?",
                heading: "Choose a workflow",
                operation: "workflow_choice",
                targetWorkflowId: "audit",
                controls: [
                  {
                    component: "OptionSelector",
                    field: "choice",
                    label: "Next step",
                    inputType: null,
                    options: [
                      { value: "continue", label: "Continue your message" },
                      { value: "switch", label: "Switch to audit" },
                    ],
                  },
                ],
              }),
            },
          },
          {
            type: "response.completed",
            response: { id: "resp_workflow_choice" },
          },
        );
      }

      if (toolNames.includes("update_audit_context")) {
        return events(
          { type: "response.created", response: { id: "resp_switched" } },
          {
            type: "response.output_text.delta",
            delta: "Let's start your audit.",
          },
          { type: "response.completed", response: { id: "resp_switched" } },
        );
      }

      if (toolNames.includes("switch_workflow")) {
        return events(
          {
            type: "response.created",
            response: { id: "resp_switch_workflow" },
          },
          {
            type: "response.output_item.done",
            item: {
              type: "function_call",
              call_id: "call_switch_workflow",
              name: "switch_workflow",
              arguments: '{"workflowId":"audit"}',
            },
          },
          {
            type: "response.completed",
            response: { id: "resp_switch_workflow" },
          },
        );
      }

      throw new Error(`Unexpected tools: ${toolNames.join(", ")}`);
    },
  });

  const active = await workflowService.start("contact", {
    originChannel: "web",
    originPage: "/",
    originEntry: "assistant-starter-contact",
  });

  const choiceOutput = await readChatResponse(
    await post(
      chatRequest({
        message: "I'd like to request a free audit.",
        workflowInstanceId: active.id,
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
    ["present_ui"],
  );
  assert.match(inputs[0]?.instructions ?? "", /workflow_choice/);
  assert.match(
    inputs[0]?.input[0]?.type === "user_message" ? inputs[0].input[0].content : "",
    /"activeWorkflowId":"contact","requestedWorkflowId":"audit"/,
  );
  assert.match(choiceOutput, /Continue your message/);
  assert.equal((await workflowRepository.findById(active.id))?.status, "active");
  assert.equal(await workflowRepository.findById("00000000-0000-4000-8000-000000000002"), null);

  const restoredChoiceOutput = await readChatResponse(
    await post(
      chatRequest({
        message: "Show the pending choice after refresh.",
        workflowInstanceId: active.id,
        previousResponseId: null,
      }),
    ),
  );

  assert.deepEqual(
    inputs.at(-1)?.tools.map(({ name }) => name),
    ["present_ui", "switch_workflow"],
  );
  assert.match(inputs.at(-1)?.instructions ?? "", /start audit while contact is active/);
  assert.match(restoredChoiceOutput, /"type":"interaction"/);

  const pending = JSON.parse(
    restoredChoiceOutput.split("\n").find((line) => line.includes('"type":"interaction"'))!,
  ).interaction;

  const switchedOutput = await readChatResponse(
    await post(
      chatRequest({
        interactionReply: {
          interactionId: pending.id,
          revision: pending.revision,
          values: { choice: "switch" },
        },
        workflowInstanceId: active.id,
      }),
    ),
  );

  const replacement = await workflowRepository.findById("00000000-0000-4000-8000-000000000002");

  assert.equal((await workflowRepository.findById(active.id))?.status, "cancelled");
  assert.equal(replacement?.workflowId, "audit");
  assert.equal(replacement?.status, "active");
  assert.match(switchedOutput, /"id":"00000000-0000-4000-8000-000000000002"/);
  assert.match(switchedOutput, /Let's start your audit\./);
});

test("presentation ends the tool batch; invalid replies skip the model and valid replies refresh progress", async () => {
  const presentation = {
    introduction: "I can help you leave a message. These details will let Freeman respond.",
    heading: "Your details",
    operation: "fields",
    targetWorkflowId: null,
    controls: [
      {
        component: "InputField",
        field: "email",
        label: "Email",
        inputType: "email",
        options: null,
      },
      {
        component: "TextArea",
        field: "message",
        label: "Message",
        inputType: null,
        options: null,
      },
    ],
  };

  const { post, inputs, workflowService, workflowRepository } = createAssistant({
    response: async (request) => {
      if (request.input[0]?.type === "function_call_output") {
        return events({
          type: "response.output_text.delta",
          delta: "Got it. What name should Freeman use?",
        });
      }

      if (
        request.input.some(
          (item) =>
            item.type === "user_message" && item.content.includes("chat-reply@example.test"),
        )
      ) {
        return events({
          type: "response.output_item.done",
          item: {
            type: "function_call",
            call_id: "chat-details",
            name: "update_contact_context",
            arguments: JSON.stringify({
              updates: [
                { field: "email", value: "chat-reply@example.test" },
                {
                  field: "message",
                  value: "A corrected enquiry from ordinary chat",
                },
              ],
            }),
          },
        });
      }

      if (
        request.input.some(
          (item) =>
            item.type === "user_message" && item.content.includes("Structured visitor answer"),
        )
      ) {
        return events({
          type: "response.output_text.delta",
          delta: "Review your details before sending.",
        });
      }

      return events(
        { type: "response.created", response: { id: "resp_form" } },
        {
          type: "response.output_item.done",
          item: {
            type: "function_call",
            call_id: "form",
            name: "present_ui",
            arguments: JSON.stringify(presentation),
          },
        },
        {
          type: "response.output_item.done",
          item: {
            type: "function_call",
            call_id: "cancel",
            name: "cancel_workflow",
            arguments: "{}",
          },
        },
      );
    },
  });

  const instance = await workflowService.start("contact", {
    originChannel: "web",
    originPage: null,
    originEntry: null,
  });

  const output = await readChatResponse(
    await post(chatRequest({ message: "Use a form", workflowInstanceId: instance.id })),
  );

  const pending = JSON.parse(
    output.split("\n").find((line) => line.includes('"type":"interaction"'))!,
  ).interaction;

  assert.equal(inputs.length, 1);
  assert.match(output, /I can help you leave a message/);
  assert.ok(output.indexOf('"type":"delta"') < output.indexOf('"type":"interaction"'));
  assert.equal((await workflowRepository.findById(instance.id))?.status, "active");
  assert.doesNotMatch(output, /resp_form/);
  const invalid = await readChatResponse(
    await post(
      chatRequest({
        workflowInstanceId: instance.id,
        interactionReply: {
          interactionId: pending.id,
          revision: pending.revision,
          values: { email: "invalid", message: "Enquiry" },
        },
      }),
    ),
  );

  assert.match(invalid, /"status":"invalid"/);
  assert.equal(inputs.length, 1);
  const accepted = await readChatResponse(
    await post(
      chatRequest({
        workflowInstanceId: instance.id,
        interactionReply: {
          interactionId: pending.id,
          revision: pending.revision,
          values: { email: "visitor@example.test", message: "Enquiry" },
        },
      }),
    ),
  );

  assert.match(accepted, /"status":"accepted"/);
  assert.match(accepted, /"key":"email","required":true,"value":"visitor@example.test"/);
  assert.match(accepted, /Review your details/);
  assert.equal(inputs.length, 2);
  const stale = await readChatResponse(
    await post(
      chatRequest({
        workflowInstanceId: instance.id,
        interactionReply: {
          interactionId: pending.id,
          revision: pending.revision,
          values: { email: "visitor@example.test", message: "Enquiry" },
        },
      }),
    ),
  );

  assert.match(stale, /"status":"stale"/);
  assert.equal(inputs.length, 2);

  const nextOutput = await readChatResponse(
    await post(
      chatRequest({
        message: "Show inputs again",
        workflowInstanceId: instance.id,
      }),
    ),
  );

  const next = nextOutput
    .trim()
    .split("\n")
    .map((line) => assistantStreamEventSchema.parse(JSON.parse(line)))
    .find((item) => item.type === "interaction");

  assert.ok(next?.type === "interaction");
  const textAnswer = await readChatResponse(
    await post(
      chatRequest({
        message:
          "My email is chat-reply@example.test and the message is A corrected enquiry from ordinary chat.",
        workflowInstanceId: instance.id,
        interactionContext: {
          ...next.interaction,
          question: "Which email and message should Freeman receive?",
        },
      }),
    ),
  );

  assert.match(textAnswer, /What name should Freeman use/);
  const saved = await workflowRepository.findById(instance.id);

  assert.ok(saved && saved.state && typeof saved.state === "object" && !Array.isArray(saved.state));
  assert.equal(saved.state.email, "chat-reply@example.test");
  assert.equal(saved.state.message, "A corrected enquiry from ordinary chat");
  const superseded = await readChatResponse(
    await post(
      chatRequest({
        workflowInstanceId: instance.id,
        interactionReply: {
          interactionId: next.interaction.id,
          revision: next.interaction.revision,
          values: { email: "old@example.test", message: "Old form values" },
        },
      }),
    ),
  );

  assert.match(superseded, /"status":"stale"/);
  assert.deepEqual(await workflowRepository.findById(instance.id), saved);
});

test("conversational inputs validate all supported controls and cannot mutate workflows", async () => {
  const presentation = {
    operation: "conversation",
    targetWorkflowId: null,
    introduction: "Let's explore your idea. These answers will help focus the comparison.",
    heading: "Tell me what would be useful, without starting a request.",
    controls: [
      {
        component: "InputField",
        field: "email",
        label: "Email",
        inputType: "email",
        options: null,
      },
      {
        component: "TextArea",
        field: "goal",
        label: "Goal",
        inputType: null,
        options: null,
      },
      {
        component: "OptionSelector",
        field: "focus",
        label: "Focus",
        inputType: null,
        options: [
          { value: "ai", label: "AI engineering" },
          { value: "web", label: "Web development" },
        ],
      },
    ],
  };

  const { post, inputs, workflowRepository, workflowService } = createAssistant({
    response: async (request) => {
      if (request.input.some((item) => item.type === "function_call_output")) {
        assert.ok(request.input.every((item) => item.type === "function_call_output"));
        assert.match(JSON.stringify(request.input), /unknown_tool/);

        return events({
          type: "response.output_text.delta",
          delta: "Here is a separate answer.",
        });
      }

      if (
        request.input.some(
          (item) =>
            item.type === "user_message" &&
            (item.content.includes("Structured visitor answers") ||
              item.content.includes("ordinary chat instead of submitting controls")),
        )
      ) {
        assert.ok(JSON.stringify(request.input).includes(presentation.introduction));
        assert.deepEqual(
          request.tools.map(({ name }) => name),
          ["present_ui", "search_website"],
        );

        return events(
          ...[
            "start_workflow",
            "cancel_workflow",
            "update_contact_context",
            "submit_contact",
            "submit_audit",
            "confirm_meeting",
          ].map((name) => ({
            type: "response.output_item.done",
            item: {
              type: "function_call",
              call_id: name,
              name,
              arguments: "{}",
            },
          })),
        );
      }

      return events({
        type: "response.output_item.done",
        item: {
          type: "function_call",
          call_id: "present",
          name: "present_ui",
          arguments: JSON.stringify(presentation),
        },
      });
    },
  });

  const presented = (
    await readChatResponse(await post(chatRequest({ message: "Ask me with controls" })))
  )
    .trim()
    .split("\n")
    .map((line) => assistantStreamEventSchema.parse(JSON.parse(line)));

  const event = presented.find((item) => item.type === "interaction");

  assert.ok(event?.type === "interaction");
  assert.equal(event.interaction.workflowInstanceId, null);
  assert.equal(workflowRepository.instances.size, 0);
  const reply = {
    interactionId: event.interaction.id,
    revision: 0,
    interaction: { ...event.interaction, question: presentation.introduction },
    values: { email: "bad", goal: "", focus: "forged" },
  };

  const invalid = await readChatResponse(await post(chatRequest({ interactionReply: reply })));

  assert.match(invalid, /"status":"invalid"/);
  assert.match(invalid, /"email":/);
  assert.match(invalid, /"goal":/);
  assert.match(invalid, /"focus":/);
  assert.equal(inputs.length, 1);

  for (const controls of [
    [...event.interaction.controls, event.interaction.controls[0]],
    event.interaction.controls.map((control) => ({
      ...control,
      maxLength: 9999,
    })),
    event.interaction.controls.map((control) => ({
      ...control,
      inputType: "text",
    })),
  ]) {
    const rejected = await readChatResponse(
      await post(
        chatRequest({
          interactionReply: {
            ...reply,
            interaction: { ...reply.interaction, controls },
          },
        }),
      ),
    );

    assert.match(rejected, /"status":"stale"/);
  }

  assert.equal(inputs.length, 1);
  const active = await workflowService.start("contact", {
    originChannel: "web",
    originPage: null,
    originEntry: null,
  });

  const before = await workflowRepository.findById(active.id);

  const output = await readChatResponse(
    await post(
      chatRequest({
        workflowInstanceId: active.id,
        interactionReply: {
          ...reply,
          values: {
            email: "visitor@example.test",
            goal: "Find relevant examples",
            focus: "ai",
          },
        },
      }),
    ),
  );

  const accepted = output
    .trim()
    .split("\n")
    .map((line) => assistantStreamEventSchema.parse(JSON.parse(line)))
    .find((item) => item.type === "interaction_result");

  assert.deepEqual(accepted, {
    type: "interaction_result",
    result: {
      interactionId: event.interaction.id,
      status: "accepted",
      summary: "Email: visitor@example.test\nGoal: Find relevant examples\nFocus: AI engineering",
    },
  });
  assert.match(output, /Here is a separate answer/);
  assert.doesNotMatch(output, /"type":"workflow_instance"/);
  assert.deepEqual(await workflowRepository.findById(active.id), before);
  assert.equal(workflowRepository.instances.size, 1);

  const typedAnswer = await readChatResponse(
    await post(
      chatRequest({
        message: "I would prefer to discuss web development in chat.",
        workflowInstanceId: active.id,
        interactionContext: reply.interaction,
      }),
    ),
  );

  assert.match(typedAnswer, /Here is a separate answer/);
  assert.doesNotMatch(typedAnswer, /"type":"workflow_instance"/);
  assert.deepEqual(await workflowRepository.findById(active.id), before);
  assert.equal(workflowRepository.instances.size, 1);
});

test("invalid presentation arguments fail safely and provider errors never log visitor details", async () => {
  const { post, errors, workflowService } = createAssistant({
    response: async (request) => {
      if (request.input[0]?.type === "function_call_output") {
        throw new Error("Private visitor@example.test provider payload");
      }

      return events({
        type: "response.output_item.done",
        item: {
          type: "function_call",
          call_id: "invalid",
          name: "present_ui",
          arguments: JSON.stringify({ heading: "Invalid", controls: [] }),
        },
      });
    },
  });

  const instance = await workflowService.start("contact", {
    originChannel: "web",
    originPage: null,
    originEntry: null,
  });

  const output = await readChatResponse(
    await post(
      chatRequest({
        message: "visitor@example.test",
        workflowInstanceId: instance.id,
      }),
    ),
  );

  assert.match(output, /The assistant could not respond/);
  assert.doesNotMatch(output, /Private|provider payload/);
  assert.doesNotMatch(JSON.stringify(errors), /visitor@example|Private|stack/);
});

test("continuing through a structured choice cannot confirm a prepared contact submission", async () => {
  const { post, workflowService, workflowRepository } = createAssistant({
    response: async (request) => {
      if (request.input[0]?.type === "function_call_output") {
        if (request.input[0].output.includes("Workflow choice applied")) {
          return events({
            type: "response.output_item.done",
            item: {
              type: "function_call",
              call_id: "send-after-choice",
              name: "submit_contact",
              arguments: "{}",
            },
          });
        }

        assert.match(request.input[0].output, /separate_confirmation_required/);

        return events({
          type: "response.output_text.delta",
          delta: "Please confirm sending in a separate message.",
        });
      }

      if (request.instructions.includes("The visitor tried to start")) {
        return events({
          type: "response.output_item.done",
          item: {
            type: "function_call",
            call_id: "continue-by-chat",
            name: "switch_workflow",
            arguments: '{"workflowId":"contact"}',
          },
        });
      }

      return events({
        type: "response.output_item.done",
        item: {
          type: "function_call",
          call_id: "send",
          name: "submit_contact",
          arguments: "{}",
        },
      });
    },
  });

  const instance = await workflowService.start("contact", {
    originChannel: "web",
    originPage: null,
    originEntry: null,
  });

  await workflowService.executeTool(instance.id, {
    name: "update_contact_context",
    rawArguments: JSON.stringify({
      updates: [
        { field: "name", value: "Visitor" },
        { field: "email", value: "visitor@example.test" },
        { field: "message", value: "An enquiry" },
      ],
    }),
    interactionId: "44444444-4444-4444-8444-444444444444",
  });
  await workflowService.executeTool(instance.id, {
    name: "prepare_contact_submission",
    rawArguments: "{}",
    interactionId: "44444444-4444-4444-8444-444444444444",
  });
  const pending = await workflowService.prepareInteraction(instance.id, {
    introduction: "Continue your message, or cancel it and start an audit?",
    heading: "Next step",
    operation: "workflow_choice",
    targetWorkflowId: "audit",
    controls: [
      {
        field: "choice",
        component: "OptionSelector",
        inputType: null,
        label: "Workflow",
        options: [
          { value: "continue", label: "Continue message" },
          { value: "switch", label: "Switch to audit" },
        ],
      },
    ],
  });

  const output = await readChatResponse(
    await post(
      chatRequest({
        workflowInstanceId: instance.id,
        interactionReply: {
          interactionId: pending.id,
          revision: pending.revision,
          values: { choice: "continue" },
        },
      }),
    ),
  );

  assert.match(output, /"status":"accepted"/);
  assert.match(output, /Please confirm sending in a separate message/);
  assert.equal((await workflowRepository.findById(instance.id))?.status, "active");

  await workflowService.prepareInteraction(instance.id, {
    introduction: "Continue your message, or cancel it and start an audit?",
    heading: "Next step",
    operation: "workflow_choice",
    targetWorkflowId: "audit",
    controls: [
      {
        field: "choice",
        component: "OptionSelector",
        inputType: null,
        label: "Workflow",
        options: [
          { value: "continue", label: "Continue message" },
          { value: "switch", label: "Cancel message and switch to audit" },
        ],
      },
    ],
  });
  const typedChoice = await readChatResponse(
    await post(
      chatRequest({
        message: "Continue my message, do not send it.",
        workflowInstanceId: instance.id,
      }),
    ),
  );

  assert.match(typedChoice, /Please confirm sending in a separate message/);
  assert.equal((await workflowRepository.findById(instance.id))?.status, "active");
  assert.equal((await workflowRepository.findById(instance.id))?.pendingInteraction, null);

  const typedControlAnswer = await readChatResponse(
    await post(
      chatRequest({
        message: "Yes",
        workflowInstanceId: instance.id,
        interactionContext: {
          ...pending,
          question: "Would you like to keep working on these details?",
        },
      }),
    ),
  );

  assert.match(typedControlAnswer, /Please confirm sending in a separate message/);
  assert.equal((await workflowRepository.findById(instance.id))?.status, "active");
});

test("resolving a workflow choice invalidates the remaining calls in that model batch", async () => {
  const presentation = {
    introduction: "Continue your message, or cancel it and start an audit?",
    heading: "Next step",
    operation: "workflow_choice" as const,
    targetWorkflowId: "audit",
    controls: [
      {
        field: "choice",
        component: "OptionSelector" as const,
        inputType: null,
        label: "Workflow",
        options: [
          { value: "continue", label: "Continue message" },
          { value: "switch", label: "Cancel message and start audit" },
        ],
      },
    ],
  };

  const { post, workflowService, workflowRepository, inputs } = createAssistant({
    response: async (request) => {
      if (request.input[0]?.type === "function_call_output") {
        const outputs = request.input.filter((item) => item.type === "function_call_output");

        assert.deepEqual(
          outputs.map(({ callId }) => callId),
          ["continue", "switch", "reopen"],
        );
        assert.match(outputs[0].output, /Workflow choice applied/);
        assert.match(outputs[1].output, /stale_workflow_choice/);
        assert.match(outputs[2].output, /stale_workflow_choice/);
        assert.doesNotMatch(request.instructions, /The visitor tried to start/);

        return events({
          type: "response.output_text.delta",
          delta: "We will keep your message.",
        });
      }

      return events(
        ...[
          {
            call_id: "continue",
            name: "switch_workflow",
            arguments: '{"workflowId":"contact"}',
          },
          {
            call_id: "switch",
            name: "switch_workflow",
            arguments: '{"workflowId":"audit"}',
          },
          {
            call_id: "reopen",
            name: "present_ui",
            arguments: JSON.stringify(presentation),
          },
        ].map((item) => ({
          type: "response.output_item.done",
          item: { type: "function_call", ...item },
        })),
      );
    },
  });

  const instance = await workflowService.start("contact", {
    originChannel: "web",
    originPage: null,
    originEntry: null,
  });

  const pending = await workflowService.prepareInteraction(instance.id, presentation);

  const output = await readChatResponse(
    await post(
      chatRequest({
        message: "Continue my message.",
        workflowInstanceId: instance.id,
        interactionContext: { ...pending, question: presentation.introduction },
      }),
    ),
  );

  assert.match(output, /We will keep your message/);
  assert.doesNotMatch(output, /"type":"interaction"|"type":"error"/);
  assert.equal(inputs.length, 2);
  assert.equal(workflowRepository.instances.size, 1);
  const saved = await workflowRepository.findById(instance.id);

  assert.equal(saved?.status, "active");
  assert.equal(saved?.pendingInteraction, null);
  assert.equal(saved?.revision, pending.revision + 1);
});

test("provider failure after a durable start still streams the safe active instance ID", async () => {
  const { errors, post } = createAssistant({
    response: async (request) =>
      request.input[0]?.type === "function_call_output"
        ? events({
            type: "response.failed",
            response: {
              error: { message: "provider unavailable after start" },
            },
          })
        : events(
            {
              type: "response.created",
              response: { id: "resp_workflow_start" },
            },
            {
              type: "response.output_item.done",
              item: {
                type: "function_call",
                call_id: "call_start",
                name: "start_workflow",
                arguments: '{"workflowId":"meeting-booking"}',
              },
            },
            {
              type: "response.completed",
              response: { id: "resp_workflow_start" },
            },
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
      chatRequest({
        message: "What times are available?",
        workflowInstanceId: instance.id,
      }),
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
        {
          type: "response.completed",
          response: { id: "resp_duplicate_start" },
        },
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

test("terminal workflow metadata clears the active surface without streaming private state", async () => {
  const { inputs, post, workflowService } = createAssistant({
    response: async (request) => {
      if (request.input[0]?.type !== "function_call_output") {
        return events(
          {
            type: "response.created",
            response: { id: "resp_confirmation_tool" },
          },
          {
            type: "response.output_item.done",
            item: {
              type: "function_call",
              call_id: "call_confirm",
              name: "confirm_meeting",
              arguments: "{}",
            },
          },
          {
            type: "response.completed",
            response: { id: "resp_confirmation_tool" },
          },
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
        {
          type: "response.output_text.delta",
          delta: "Your meeting is booked.",
        },
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
      "present_ui",
      "search_website",
      "cancel_workflow",
      "switch_workflow",
      "find_meeting_slots",
      "prepare_meeting",
      "confirm_meeting",
    ],
  );
  assert.deepEqual(
    inputs[1]?.tools.map(({ name }) => name),
    ["present_ui", "search_website", "cancel_workflow", "switch_workflow", "book_meeting"],
  );
  assert.deepEqual(
    inputs[2]?.tools.map(({ name }) => name),
    ["present_ui", "search_website"],
  );
  assert.match(output, /"status":"completed"/);
  assert.match(output, /"phase":"processing"/);
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
      events({
        type: "response.failed",
        response: { error: { message: "provider unavailable" } },
      }),
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
      limit: 40,
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
  assert.equal(response.headers.get("X-RateLimit-Limit"), "40");
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
      pendingInteraction: null,
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
      pendingInteraction: input.pendingInteraction ?? null,
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

test("active workflow fields cannot bypass validation through generic controls", async () => {
  const { post, workflowService, inputs } = createAssistant({
    response: async (request) => {
      if (request.input[0]?.type === "function_call_output") {
        assert.match(request.input[0].output, /unavailable_inputs/);
        assert.match(request.input[0].output, /belong to the active workflow/);

        return events({
          type: "response.output_text.delta",
          delta: "What name and email should I associate with the audit summary?",
        });
      }

      return events({
        type: "response.output_item.done",
        item: {
          type: "function_call",
          call_id: "generic-audit-fields",
          name: "present_ui",
          arguments: JSON.stringify({
            introduction: "What name and email should I associate with the audit summary?",
            heading: "Contact details",
            operation: "conversation",
            targetWorkflowId: null,
            controls: [
              {
                component: "InputField",
                field: "name",
                label: "Name",
                inputType: "text",
                options: null,
              },
              {
                component: "InputField",
                field: "email",
                label: "Email",
                inputType: "email",
                options: null,
              },
            ],
          }),
        },
      });
    },
  });

  const instance = await workflowService.start("audit", {
    originChannel: "test",
    originPage: null,
    originEntry: null,
  });

  const output = await readChatResponse(
    await post(
      chatRequest({
        message: "Ask for my contact details.",
        workflowInstanceId: instance.id,
      }),
    ),
  );

  assert.match(output, /What name and email/);
  assert.doesNotMatch(output, /"type":"interaction"|"type":"error"/);
  assert.equal(inputs.length, 2);
});
test("contact email controls recover from a mistaken target ID after a workflow switch", async () => {
  let calls = 0;

  const presentation = {
    introduction: "Thanks. Enter the email address to use for your message.",
    heading: "Email",
    operation: "fields",
    targetWorkflowId: "contact",
    controls: [
      {
        component: "InputField",
        field: "email",
        label: "Email",
        inputType: "email",
        options: null,
      },
    ],
  };

  const { post, workflowService, workflowRepository } = createAssistant({
    response: async (request) => {
      const call = calls++;

      if (call === 0) {
        return events({
          type: "response.output_text.delta",
          delta: "What would you like to tell Freeman?",
        });
      }

      if (call === 1) {
        return events({
          type: "response.output_item.done",
          item: {
            type: "function_call",
            call_id: "save-name",
            name: "update_contact_context",
            arguments: JSON.stringify({
              updates: [
                { field: "name", value: "Switch Test" },
                { field: "message", value: "Discuss an accessible website." },
              ],
            }),
          },
        });
      }

      if (call === 2) {
        return events({
          type: "response.output_text.delta",
          delta: "What email address should I use?",
        });
      }

      if (call === 5) {
        return events({
          type: "response.output_text.delta",
          delta: "Thanks, I have your email. Nothing has been sent.",
        });
      }

      assert.match(request.instructions, /operation fields, targetWorkflowId null/);
      assert.match(JSON.stringify(request.input), /inputFields/);
      if (call === 4) {
        const output = request.input.find((item) => item.type === "function_call_output");

        assert.ok(output && output.type === "function_call_output");
        assert.match(output.output, /targetWorkflowId must be null/);
        assert.match(output.output, /Retry present_ui/);
      }

      return events({
        type: "response.output_item.done",
        item: {
          type: "function_call",
          call_id: `email-${call}`,
          name: "present_ui",
          arguments: JSON.stringify({
            ...presentation,
            targetWorkflowId: call === 3 ? "contact" : null,
          }),
        },
      });
    },
  });

  const audit = await workflowService.start("audit", {
    originChannel: "test",
    originPage: null,
    originEntry: null,
  });

  const choice = await workflowService.prepareInteraction(audit.id, {
    introduction: "Switching cancels your audit and starts a message. Continue retains the audit.",
    heading: "Choose request",
    operation: "workflow_choice",
    targetWorkflowId: "contact",
    controls: [
      {
        component: "OptionSelector",
        field: "choice",
        label: "Request",
        inputType: null,
        options: [
          { value: "continue", label: "Continue audit" },
          { value: "switch", label: "Switch to message" },
        ],
      },
    ],
  });

  const switched = await readChatResponse(
    await post(
      chatRequest({
        workflowInstanceId: audit.id,
        interactionReply: {
          interactionId: choice.id,
          revision: choice.revision,
          values: { choice: "switch" },
        },
      }),
    ),
  );

  const switchedEvents = switched
    .trim()
    .split("\n")
    .map((line) => assistantStreamEventSchema.parse(JSON.parse(line)));

  const instance = switchedEvents.findLast((event) => event.type === "workflow_instance");

  assert.ok(instance && instance.type === "workflow_instance");
  assert.equal(instance.instance.workflowId, "contact");
  await readChatResponse(
    await post(
      chatRequest({
        workflowInstanceId: instance.instance.id,
        message: "My name is Switch Test. I want to discuss an accessible website.",
      }),
    ),
  );
  const output = await readChatResponse(
    await post(
      chatRequest({
        workflowInstanceId: instance.instance.id,
        message: "Render a UI for my email.",
      }),
    ),
  );

  const result = output
    .trim()
    .split("\n")
    .map((line) => assistantStreamEventSchema.parse(JSON.parse(line)));

  const interaction = result.find((event) => event.type === "interaction");

  assert.ok(interaction && interaction.type === "interaction");
  assert.deepEqual(
    interaction.interaction.controls.map(({ field }) => field),
    ["email"],
  );
  assert.equal(interaction.interaction.workflowInstanceId, instance.instance.id);
  assert.ok(
    result.some((event) => event.type === "delta" && event.delta === presentation.introduction),
  );
  assert.equal(
    result.some((event) => event.type === "error"),
    false,
  );
  assert.equal(calls, 5);
  await readChatResponse(
    await post(
      chatRequest({
        workflowInstanceId: instance.instance.id,
        interactionReply: {
          interactionId: interaction.interaction.id,
          revision: interaction.interaction.revision,
          values: { email: "switch@example.test" },
        },
      }),
    ),
  );
  const saved = await workflowRepository.findById(instance.instance.id);

  const state = contactStateSchema.parse(saved?.state);

  assert.equal(state.name, "Switch Test");
  assert.equal(state.email, "switch@example.test");
  assert.equal(saved?.status, "active");
  assert.equal(calls, 6);
});
