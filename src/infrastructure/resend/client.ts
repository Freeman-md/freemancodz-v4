import "server-only";
import { z } from "zod";

export type ResendEmailInput = {
  from: string;
  to: string;
  replyTo: string;
  subject: string;
  text: string;
  idempotencyKey: string;
};

export type ResendConfig = {
  apiKey: string;
  fromEmail: string;
};

export class ResendClient {
  constructor(
    private readonly getConfig: () => ResendConfig,
    private readonly request: typeof fetch = fetch,
    private readonly timeoutMs = 5_000,
  ) {}

  async send(input: ResendEmailInput): Promise<void> {
    await this.requestEmail(input);
  }

  async sendWithReceipt(input: ResendEmailInput, signal: AbortSignal): Promise<string> {
    const response = await this.requestEmail(input, signal);

    return z.object({ id: z.string().min(1) }).parse(await response.json()).id;
  }

  private async requestEmail(input: ResendEmailInput, signal?: AbortSignal) {
    let config: ResendConfig;

    try {
      config = this.getConfig();
    } catch {
      throw new ResendClientError("configuration");
    }

    let response: Response;

    try {
      response = await this.request("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": input.idempotencyKey,
        },
        body: JSON.stringify({
          from: input.from,
          to: [input.to],
          reply_to: input.replyTo,
          subject: input.subject,
          text: input.text,
        }),
        signal: AbortSignal.any([AbortSignal.timeout(this.timeoutMs), ...(signal ? [signal] : [])]),
      });
    } catch {
      throw new ResendClientError("network");
    }

    if (!response.ok) {
      throw new ResendClientError(
        "provider",
        response.status === 429
          ? "retry"
          : response.status >= 500 || response.status === 408 || response.status === 409
            ? "uncertain"
            : "terminal",
      );
    }

    return response;
  }
}

export class ResendClientError extends Error {
  constructor(
    readonly category: "configuration" | "network" | "provider",
    readonly outcome: "retry" | "terminal" | "uncertain" = category === "configuration"
      ? "terminal"
      : "uncertain",
  ) {
    super("Owner notification could not be sent.");
    this.name = "ResendClientError";
  }
}
