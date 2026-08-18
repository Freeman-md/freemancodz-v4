import "server-only";

import {
  createOpenAIClient,
  getEmbeddingModel,
  getResponseModel,
} from "../infrastructure/openai/openai.client";
import { OpenAIProvider } from "../infrastructure/openai/openai.provider";

export const openAIProvider = new OpenAIProvider(
  createOpenAIClient(),
  getEmbeddingModel(),
  getResponseModel(),
);
