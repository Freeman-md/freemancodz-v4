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
    private readonly timeoutMs = 5_000,
  ) {}

  async send(input: ResendEmailInput, signal?: AbortSignal): Promise<void> {
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
        signal: signal
          ? AbortSignal.any([signal, AbortSignal.timeout(this.timeoutMs)])
          : AbortSignal.timeout(this.timeoutMs),
      });
    } catch {
      throw new ResendClientError("network");
    }

    if (!response.ok) {
      throw new ResendClientError(
        "provider",
        response.status === 408 ||
          response.status === 409 ||
          response.status === 429 ||
          response.status >= 500,
      );
    }
  }
}

export class ResendClientError extends Error {
  constructor(
    readonly category: "configuration" | "network" | "provider",
    readonly retryable = category === "network",
  ) {
    super("Owner notification could not be sent.");
    this.name = "ResendClientError";
  }
}
