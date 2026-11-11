import type { ResponseStreamEvent } from "openai/resources/responses/responses";
import type { OpenAITransport } from "@/infrastructure/openai/types";

const selectedStart = "2099-06-15T11:00:00.000Z";

const selectedEnd = "2099-06-15T11:30:00.000Z";

export const fixtureModel: OpenAITransport = {
  async streamResponse({ input, tools, previousResponseId }) {
    const last = input.at(-1);

    const names = new Set(tools.map(({ name }) => name));

    const output = last?.type === "user_message" ? last.content : "";

    let reply = "Hello! How can I help?";

    let action: { name: string; args: object } | undefined;

    if (last?.type === "function_call_output") {
      switch (previousResponseId) {
        case "resp_start_workflow":
          reply = "Your meeting request is open.";
          break;
        case "resp_save_meeting_topic":
          reply = "I saved the topic.";
          break;
        case "resp_save_meeting_identity":
          reply = "I saved your details.";
          break;
        case "resp_find_meeting_slots":
          reply = "Available: 12:00 London time.";
          break;
        case "resp_select_meeting_slot":
          reply = "That time is saved for review.";
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
    } else if (/book a meeting/i.test(output) && names.has("start_workflow")) {
      action = { name: "start_workflow", args: { workflowId: "meeting-booking" } };
    } else if (/request services/i.test(output) && names.has("start_workflow")) {
      action = { name: "start_workflow", args: { workflowId: "request-services" } };
    } else if (output.startsWith("Brief: ") && names.has("save_service_brief")) {
      action = { name: "save_service_brief", args: { brief: output.slice(7) } };
    } else if (/Discuss|discuss/.test(output) && names.has("save_meeting_topic")) {
      action = { name: "save_meeting_topic", args: { reason: output } };
    } else if (output.includes("@") && names.has("save_meeting_identity")) {
      const [name, email] = output.split(", ");

      action = { name: "save_meeting_identity", args: { name, email } };
    } else if (/Show times/.test(output) && names.has("find_meeting_slots")) {
      action = {
        name: "find_meeting_slots",
        args: { startDate: "2099-06-15", endDate: "2099-06-15" },
      };
    } else if (/choose 12/.test(output) && names.has("select_meeting_slot")) {
      action = { name: "select_meeting_slot", args: { start: selectedStart } };
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
    const event = makeEvent(input);

    if (events.has(event.id)) {throw new Error("Unexpected duplicate Calendar insert.");}

    events.set(event.id, event);

    return event;
  },
};

export const fixtureAvailability = {
  async findAvailableSlots() {
    return [{ start: selectedStart, end: selectedEnd, timezone: "Europe/London" }];
  },
  async isSlotAvailable() {
    return true;
  },
};

export const fixtureNotice = {
  async sendWithReceipt(input: { idempotencyKey: string }) {
    return `fixture-${input.idempotencyKey}`;
  },
};
