import { z } from "zod";

import { assistantReplyOptionsSchema } from "@/contracts/assistant.contract";

export const askUserChoiceArgumentsSchema = z
  .object({ options: assistantReplyOptionsSchema })
  .strict();
