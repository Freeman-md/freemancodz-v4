import "server-only";

export type Logger = {
  error(message: string, error?: unknown): void;
  info(message: string, context?: unknown): void;
};

export class ConsoleLogger implements Logger {
  error(message: string, error?: unknown) {
    console.error(message, error);
  }

  info(message: string, context?: unknown) {
    console.log(message, context);
  }
}

export const logger: Logger = new ConsoleLogger();
