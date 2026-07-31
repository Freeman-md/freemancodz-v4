import "server-only";

import type { ILogger } from "./logger.interface";

export class ConsoleLogger implements ILogger {
  error(message: string, error?: unknown) {
    console.error(message, error);
  }
  info(message: string, context?: unknown) {
    console.log(message, context);
  }
}

export const logger: ILogger = new ConsoleLogger();
