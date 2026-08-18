import "server-only";

import { ConsoleLogger } from "../infrastructure/logging/logger";
import type { ILogger } from "../infrastructure/logging/logger.interface";

export const logger: ILogger = new ConsoleLogger();
