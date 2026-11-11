import assert from "node:assert/strict";
import test from "node:test";

import type { ContactRequest, Prisma } from "@/generated/prisma/client";
import { ResendClient } from "@/infrastructure/resend/client";
import { ContactService } from "@/modules/contact/service";
import { MeetingOwnerNotice } from "@/modules/meeting/owner-notice";
import type { MeetingRecord } from "@/modules/meeting/types";
import { NotificationService } from "@/modules/notification/service";

const contact: ContactRequest = {
  id: "contact-1",
  workflowInstanceId: "22222222-2222-4222-8222-222222222222",
  name: "Contact Visitor",
  email: "contact@example.com",
  message: "Could we collaborate?",
  businessName: null,
  createdAt: new Date("2026-09-23T11:00:00.000Z"),
};

const meeting: MeetingRecord = {
  id: "meeting-1",
  googleEventId: "event-1",
  name: "Meeting Visitor",
  email: "meeting@example.com",
  timezone: "Europe/London",
  reason: "Discuss a project",
  startsAt: new Date("2026-10-01T10:00:00.000Z"),
  endsAt: new Date("2026-10-01T10:30:00.000Z"),
  status: "confirmed",
  googleEventUrl: "https://calendar.example/event-1",
  rawProviderPayload: {} as Prisma.JsonValue,
  createdAt: new Date("2026-09-23T12:00:00.000Z"),
  updatedAt: new Date("2026-09-23T12:00:00.000Z"),
};

test("recovered contact records must match before owner notification", async () => {
  let notifications = 0;

  const contactService = new ContactService(
    { createOrFind: async () => contact, list: async () => [] },
    {
      notifyContactSubmitted: async () => {
        notifications++;
      },
    },
  );

  const { id: _contactId, createdAt: _contactDate, ...contactInput } = contact;

  await assert.rejects(
    contactService.submit({ ...contactInput, message: "Different" }),
    /does not match/,
  );
  assert.equal(notifications, 0);
  await contactService.submit(contactInput);
  assert.equal(notifications, 1);
});

test("Resend client uses the current Email API request shape without exposing response bodies", async () => {
  let capturedUrl = "";

  let capturedInit: RequestInit | undefined;

  const request = (async (input: string | URL | Request, init?: RequestInit) => {
    capturedUrl = String(input);
    capturedInit = init;

    return new Response(JSON.stringify({ id: "email-1" }), { status: 200 });
  }) as typeof fetch;

  const client = new ResendClient(
    () => ({ apiKey: "test-api-key", fromEmail: "Portfolio <from@example.com>" }),
    request,
  );

  await client.send({
    from: "Portfolio <from@example.com>",
    to: "owner@example.com",
    replyTo: "visitor@example.com",
    subject: "New message",
    text: "Message body",
    idempotencyKey: "contact-submitted/contact-1",
  });

  assert.equal(capturedUrl, "https://api.resend.com/emails");
  assert.equal(
    new Headers(capturedInit?.headers).get("Idempotency-Key"),
    "contact-submitted/contact-1",
  );
  assert.ok(capturedInit?.signal instanceof AbortSignal);
  assert.deepEqual(JSON.parse(String(capturedInit?.body)), {
    from: "Portfolio <from@example.com>",
    to: ["owner@example.com"],
    reply_to: "visitor@example.com",
    subject: "New message",
    text: "Message body",
  });
});

test("Resend client bounds stalled provider requests", async () => {
  const request = ((_input: string | URL | Request, init?: RequestInit) =>
    new Promise<Response>((_resolve, reject) => {
      const keepAlive = setTimeout(() => undefined, 1_000);

      init?.signal?.addEventListener(
        "abort",
        () => {
          clearTimeout(keepAlive);
          reject(init.signal?.reason);
        },
        { once: true },
      );
    })) as typeof fetch;

  const client = new ResendClient(
    () => ({ apiKey: "test-api-key", fromEmail: "Portfolio <from@example.com>" }),
    request,
    5,
  );

  await assert.rejects(
    client.send({
      from: "Portfolio <from@example.com>",
      to: "owner@example.com",
      replyTo: "visitor@example.com",
      subject: "New message",
      text: "Message body",
      idempotencyKey: "contact-submitted/contact-1",
    }),
    (error: unknown) =>
      error instanceof Error && "category" in error && error.category === "network",
  );
});

test("owner notifications use configured addressing, useful content, reply-to and stable keys", async () => {
  const sent: Array<{
    from: string;
    to: string;
    replyTo: string;
    subject: string;
    text: string;
    idempotencyKey: string;
  }> = [];

  const service = new NotificationService(
    { send: async (input) => void sent.push(input) },
    () => ({ adminEmail: "owner@example.com", fromEmail: "Portfolio <from@example.com>" }),
    { info: () => undefined, error: () => undefined },
  );

  const notice = new MeetingOwnerNotice(
    {
      sendWithReceipt: async (input) => {
        sent.push(input);

        return "test-receipt";
      },
    },
    () => ({ adminEmail: "owner@example.com", fromEmail: "Portfolio <from@example.com>" }),
  );

  await notice.sendMeetingNotice(
    notice.prepareMeetingNotice(meeting),
    new AbortController().signal,
  );
  await service.notifyContactSubmitted(contact);

  assert.deepEqual(
    sent.map(({ from, to, replyTo, idempotencyKey }) => ({
      from,
      to,
      replyTo,
      idempotencyKey,
    })),
    [
      {
        from: "Portfolio <from@example.com>",
        to: "owner@example.com",
        replyTo: meeting.email,
        idempotencyKey: "meeting-booked/meeting-1",
      },
      {
        from: "Portfolio <from@example.com>",
        to: "owner@example.com",
        replyTo: contact.email,
        idempotencyKey: "contact-submitted/contact-1",
      },
    ],
  );
  assert.match(sent[0]!.text, /calendar\.example/);
  assert.equal(sent[0]!.text.includes("rawProviderPayload"), false);
  assert.match(sent[1]!.text, /Could we collaborate/);
});

test("notification failure is safely logged without failing a durable Contact submission", async () => {
  const errors: Array<{ message: string; context: unknown }> = [];

  const notifications = new NotificationService(
    {
      send: async () => {
        throw Object.assign(new Error("private provider response"), { category: "provider" });
      },
    },
    () => ({ adminEmail: "owner@example.com", fromEmail: "from@example.com" }),
    { info: () => undefined, error: (message, context) => errors.push({ message, context }) },
  );

  const order: string[] = [];

  const contactService = new ContactService(
    {
      createOrFind: async () => {
        order.push("contact-persisted");

        return contact;
      },
      list: async () => [],
    },
    notifications,
  );

  assert.equal(
    await contactService.submit({
      workflowInstanceId: contact.workflowInstanceId,
      name: contact.name,
      email: contact.email,
      message: contact.message,
      businessName: contact.businessName,
    }),
    contact,
  );
  assert.deepEqual(order, ["contact-persisted"]);
  assert.deepEqual(errors, [
    {
      message: "notification.owner_email_failed",
      context: { kind: "contact-submitted", recordId: "contact-1", category: "provider" },
    },
  ]);
});
