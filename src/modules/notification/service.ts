import "server-only";

import type { ContactRequest } from "@/generated/prisma/client";
import type { Logger } from "@/infrastructure/logging/logger";

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

export class NotificationService {
  constructor(
    private readonly sender: EmailSender,
    private readonly getConfig: () => NotificationConfig,
    private readonly logger: Logger,
  ) {}

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
    kind: "contact-submitted",
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
