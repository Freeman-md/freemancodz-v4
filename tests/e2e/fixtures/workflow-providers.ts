import type { ResponseStreamEvent } from "openai/resources/responses/responses";
import { z } from "zod";
import type { OpenAITransport } from "@/infrastructure/openai/types";

const selectedStart = "2099-06-15T11:00:00.000Z";

const selectedEnd = "2099-06-15T11:30:00.000Z";

const friday = "2099-06-19";

const fridaySlots = ["11:00", "11:30", "12:00"].map((time) => `${friday}T${time}:00.000Z`);

const slots = [
  { start: selectedStart, end: selectedEnd, timezone: "Europe/London" },
  { start: fridaySlots[0], end: fridaySlots[1], timezone: "Europe/London" },
  { start: fridaySlots[1], end: fridaySlots[2], timezone: "Europe/London" },
];

const slotResult = z.object({
  result: z.object({
    requestedTimeAvailable: z.boolean().optional(),
    slots: z.array(z.object({ start: z.string(), label: z.string() })),
  }),
});

const workflowInputSchema = z.object({
  message: z.string(),
  workflow: z.object({
    collected: z.array(z.object({ label: z.string(), value: z.string() })),
    missing: z.array(z.string()),
    confirmationLabel: z.string().optional(),
  }),
});

export const fixtureModel: OpenAITransport = {
  async streamResponse({ input, tools, previousResponseId }) {
    const last = input.at(-1);

    const names = new Set(tools.map(({ name }) => name));

    const content = last?.type === "user_message" ? last.content : "";

    const contextual = content.startsWith('{"message":')
      ? workflowInputSchema.parse(JSON.parse(content))
      : undefined;

    const output = contextual?.message ?? content;

    let reply = "Hello! How can I help?";

    let action: { name: string; args: object } | undefined;

    if (content.startsWith('{"confirmedRequest":')) {
      const result = z
        .object({ savedResult: z.string(), time: z.string().nullish() })
        .parse(JSON.parse(content));

      if (result.savedResult === "Brief received") {
        throw new Error("Fixture model unavailable after submission.");
      }

      reply = result.time
        ? `Your meeting with Freeman is confirmed for ${result.time}.`
        : result.savedResult;
    } else if (last?.type === "function_call_output") {
      switch (previousResponseId) {
        case "resp_start_workflow":
          reply = "Your meeting request is open.";
          break;
        case "resp_save_meeting_topic":
          reply = "I saved the topic.";
          break;
        case "resp_save_meeting_identity": {
          const { workflow } = z
            .object({ workflow: workflowInputSchema.shape.workflow })
            .parse(JSON.parse(last.output));

          if (workflow.collected.some(({ value }) => value === "moved@example.test")) {
            action = {
              name: "find_meeting_slots",
              args: {
                startDate: null,
                endDate: null,
                preferredTime: { date: friday, time: "12:30", timeZone: "Europe/London" },
              },
            };
          } else if (workflow.collected.some(({ value }) => value === "Updated Visitor")) {
            action = {
              name: "save_meeting_topic",
              args: { reason: "Discuss the booking marketplace." },
            };
          }

          reply = "I saved your details.";
          break;
        }

        case "resp_find_meeting_slots": {
          const { result } = slotResult.parse(JSON.parse(last.output));

          if (result.requestedTimeAvailable) {
            action = { name: "select_meeting_slot", args: { start: result.slots[0].start } };
          } else if (result.slots.length >= 2) {
            action = {
              name: "ask_user_choice",
              args: { options: result.slots.map(({ label }) => label) },
            };
          }

          break;
        }

        case "resp_select_meeting_slot":
          reply = "That time is saved for review.";
          break;
        case "resp_request_workflow_draft_discard":
          reply = "Confirm if you want to discard this draft.";
          break;
        case "resp_search_portfolio":
          reply = "Freeman built the JPScents storefront.";
          break;
        case "resp_ask_user_choice":
          reply = "Which would you prefer?";
          break;
        case "resp_save_service_brief":
          reply = "Your brief is ready to review.";
          break;
      }
    } else if (contextual && output === "What are my saved details?") {
      const { collected, missing, confirmationLabel } = contextual.workflow;

      reply = collected.map(({ label, value }) => `${label}: ${value}`).join(". ");
      reply += confirmationLabel
        ? `. Use ${confirmationLabel} to continue.`
        : `. Still needed: ${missing.join(", ")}.`;
    } else if (/cancel this draft/i.test(output) && names.has("request_workflow_draft_discard")) {
      action = { name: "request_workflow_draft_discard", args: {} };
    } else if (/book a meeting/i.test(output) && names.has("start_workflow")) {
      action = { name: "start_workflow", args: { workflowId: "meeting-booking" } };
    } else if (/request services/i.test(output) && names.has("start_workflow")) {
      action = { name: "start_workflow", args: { workflowId: "request-services" } };
    } else if (output.startsWith("Brief: ") && names.has("save_service_brief")) {
      action = { name: "save_service_brief", args: { brief: output.slice(7) } };
    } else if (output.startsWith("Change my name") && names.has("save_meeting_identity")) {
      action = {
        name: "save_meeting_identity",
        args: { name: "Updated Visitor", email: "updated@example.test" },
      };
    } else if (output.startsWith("Change my email") && names.has("save_meeting_identity")) {
      action = { name: "save_meeting_identity", args: { name: null, email: "moved@example.test" } };
    } else if (/Discuss|discuss/.test(output) && names.has("save_meeting_topic")) {
      action = { name: "save_meeting_topic", args: { reason: output } };
    } else if (output.includes("@") && names.has("save_meeting_identity")) {
      const [name, email] = output.split(", ");

      action = { name: "save_meeting_identity", args: { name, email } };
    } else if (
      (/Show times/.test(output) || output === "Friday") &&
      names.has("find_meeting_slots")
    ) {
      action = {
        name: "find_meeting_slots",
        args: { startDate: output === "Friday" ? friday : "2099-06-15", endDate: friday },
      };
    } else if (
      output.includes("19 Jun 2099") &&
      output.endsWith("12:00 London time") &&
      names.has("select_meeting_slot")
    ) {
      action = { name: "select_meeting_slot", args: { start: fridaySlots[0] } };
    } else if (/JPScents/.test(output) && names.has("search_portfolio")) {
      action = { name: "search_portfolio", args: { query: "JPScents" } };
    } else if (/give me options/i.test(output) && names.has("ask_user_choice")) {
      action = { name: "ask_user_choice", args: { options: ["Web app", "Mobile app"] } };
    }

    return (async function* () {
      if (action) {
        yield {
          type: "response.completed",
          response: {
            id: `resp_${action.name}`,
            output: [
              {
                type: "function_call",
                name: action.name,
                arguments: JSON.stringify(action.args),
                call_id: "fixture_call",
              },
            ],
          },
        } as unknown as ResponseStreamEvent;

        return;
      }

      yield { type: "response.output_text.delta", delta: reply } as unknown as ResponseStreamEvent;
      yield {
        type: "response.completed",
        response: { id: "resp_reply", output: [] },
      } as unknown as ResponseStreamEvent;
    })();
  },
};

export const fixturePortfolio = {
  async search() {
    return [
      {
        excerpt: "Freeman built the JPScents storefront.",
        source: { id: "jpscents", title: "JPScents", url: "/work/jpscents" },
      },
    ];
  },
};

type EventInput = {
  eventId: string;
  bookingOperationId: string;
  summary: string;
  description: string;
  attendeeEmail: string;
  start: Date;
  end: Date;
  timezone: string;
};

const events = new Map<string, ReturnType<typeof makeEvent>>();

function makeEvent(input: EventInput) {
  return {
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
}

export const fixtureCalendar = {
  getBusyPeriods: async () => [],
  findEvent: async (id: string) => events.get(id) ?? null,
  createEvent: async (input: EventInput) => {
    await new Promise((resolve) => setTimeout(resolve, 350));
    const event = makeEvent(input);

    if (events.has(event.id)) {
      throw new Error("Unexpected duplicate Calendar insert.");
    }

    events.set(event.id, event);

    return event;
  },
};

export const fixtureAvailability = {
  async findAvailableSlots({ startDate, endDate }: { startDate: string; endDate: string }) {
    return slots.filter(
      ({ start }) => start.slice(0, 10) >= startDate && start.slice(0, 10) <= endDate,
    );
  },
  async isSlotAvailable() {
    return true;
  },
};

export const fixtureNotice = {
  async sendWithReceipt(input: { idempotencyKey: string }) {
    await new Promise((resolve) => setTimeout(resolve, 1_000));

    return `fixture-${input.idempotencyKey}`;
  },
};
