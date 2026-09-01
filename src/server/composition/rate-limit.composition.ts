import "server-only";

import { getRateLimitHmacSecret } from "../infrastructure/config/env";
import { prisma } from "../infrastructure/database/prisma";
import type { IRateLimitRepository } from "../modules/rate-limit/interfaces/rate-limit.repository.interface";
import type { IRateLimitService } from "../modules/rate-limit/public";
import { RateLimitRepository } from "../modules/rate-limit/repositories/rate-limit.repository";
import { RateLimitService } from "../modules/rate-limit/services/rate-limit.service";

const rateLimitRepository: IRateLimitRepository = new RateLimitRepository(prisma);

export const rateLimitService: IRateLimitService = new RateLimitService(
  rateLimitRepository,
  getRateLimitHmacSecret,
);
