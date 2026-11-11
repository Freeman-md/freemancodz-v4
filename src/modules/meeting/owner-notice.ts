import "server-only";

import type { ResendClient, ResendEmailInput } from "@/infrastructure/resend/client";
import type { MeetingRecord } from "./types";

export class MeetingOwnerNotice {
  constructor(
    private readonly sender: Pick<ResendClient, "sendWithReceipt">,
    private readonly getConfig: () => { adminEmail: string; fromEmail: string },
  ) {}

  prepareMeetingNotice(meeting: MeetingRecord): ResendEmailInput {
    const config = this.getConfig();

    return {
      from: config.fromEmail,
      to: config.adminEmail,
      replyTo: meeting.email,
      idempotencyKey: `meeting-booked/${meeting.id}`,
      subject: `New meeting booked with ${meeting.name}`,
      text: [
        `Name: ${meeting.name}`,
        `Email: ${meeting.email}`,
        `Reason: ${meeting.reason}`,
        `Starts: ${meeting.startsAt.toISOString()}`,
        `Ends: ${meeting.endsAt.toISOString()}`,
        `Timezone: ${meeting.timezone}`,
        meeting.googleEventUrl ? `Calendar event: ${meeting.googleEventUrl}` : null,
      ]
        .filter((line) => line !== null)
        .join("\n"),
    };
  }

  sendMeetingNotice(notice: ResendEmailInput, signal: AbortSignal) {
    return this.sender.sendWithReceipt(notice, signal);
  }
}
