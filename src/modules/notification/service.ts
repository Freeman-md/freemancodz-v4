import "server-only";

import type { ContactRequest } from "@/generated/prisma/client";
import type { Logger } from "@/infrastructure/logging/logger";
import type { MeetingRecord } from "@/modules/meeting/types";

type EmailSender = {
  send(input: {
    from: string;
    to: string;
    replyTo: string;
    subject: string;
    text: string;
    idempotencyKey: string;
  }): Promise<void>;
};

type NotificationConfig = {
  adminEmail: string;
  fromEmail: string;
};

export type PreparedOwnerNotice = Parameters<EmailSender["send"]>[0];

export class NotificationService {
  constructor(
    private readonly sender: EmailSender,
    private readonly getConfig: () => NotificationConfig,
    private readonly logger: Logger,
  ) {}

  notifyMeetingBooked(meeting: MeetingRecord): Promise<void> {
    return this.send("meeting-booked", meeting.id, meeting.email, this.meetingContent(meeting));
  }

  prepareMeetingNotice(meeting: MeetingRecord): PreparedOwnerNotice {
    const config = this.getConfig();

    return {
      from: config.fromEmail,
      to: config.adminEmail,
      replyTo: meeting.email,
      ...this.meetingContent(meeting),
      idempotencyKey: `meeting-booked/${meeting.id}`,
    };
  }

  sendPreparedNotice(notice: PreparedOwnerNotice): Promise<void> {
    return this.sender.send(notice);
  }

  private meetingContent(meeting: MeetingRecord) {
    return {
      subject: `New meeting booked with ${meeting.name}`,
      text: lines([
        `Name: ${meeting.name}`,
        `Email: ${meeting.email}`,
        `Reason: ${meeting.reason}`,
        `Starts: ${meeting.startsAt.toISOString()}`,
        `Ends: ${meeting.endsAt.toISOString()}`,
        `Timezone: ${meeting.timezone}`,
        meeting.googleEventUrl ? `Calendar event: ${meeting.googleEventUrl}` : null,
      ]),
    };
  }

  notifyContactSubmitted(request: ContactRequest): Promise<void> {
    return this.send("contact-submitted", request.id, request.email, {
      subject: `New message from ${request.name}`,
      text: lines([
        `Name: ${request.name}`,
        `Email: ${request.email}`,
        request.businessName ? `Business: ${request.businessName}` : null,
        `Message: ${request.message}`,
      ]),
    });
  }

  private async send(
    kind: "meeting-booked" | "contact-submitted",
    recordId: string,
    replyTo: string,
    content: { subject: string; text: string },
  ): Promise<void> {
    try {
      const config = this.getConfig();

      await this.sender.send({
        from: config.fromEmail,
        to: config.adminEmail,
        replyTo,
        subject: content.subject,
        text: content.text,
        idempotencyKey: `${kind}/${recordId}`,
      });
    } catch (error) {
      this.logger.error("notification.owner_email_failed", {
        kind,
        recordId,
        category: safeErrorCategory(error),
      });
    }
  }
}

function lines(values: Array<string | null>) {
  return values.filter((value): value is string => value !== null).join("\n");
}

function safeErrorCategory(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "category" in error &&
    ["configuration", "network", "provider"].includes(String(error.category))
  ) {
    return String(error.category);
  }

  return "unknown";
}
