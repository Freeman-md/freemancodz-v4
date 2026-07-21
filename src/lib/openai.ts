import "server-only";

import OpenAI from "openai";
import { getOpenAIConfig } from "@/lib/env";

export function createOpenAIClient() {
  const openai = getOpenAIConfig();

  return new OpenAI({
    apiKey: openai.apiKey,
  });
}

export function getEmbeddingModel() {
  return getOpenAIConfig().embeddingModel;
}

export function getResponseModel() {
  return getOpenAIConfig().responseModel;
}
