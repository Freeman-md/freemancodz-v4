import "server-only";

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
  ) {}

  async send(input: ResendEmailInput): Promise<void> {
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
      });
    } catch {
      throw new ResendClientError("network");
    }

    if (!response.ok) {
      throw new ResendClientError("provider");
    }
  }
}

export class ResendClientError extends Error {
  constructor(readonly category: "configuration" | "network" | "provider") {
    super("Owner notification could not be sent.");
    this.name = "ResendClientError";
  }
}
