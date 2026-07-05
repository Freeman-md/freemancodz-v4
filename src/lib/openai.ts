import OpenAI from "openai";
import { getEnv } from "@/lib/config/env";

export function createOpenAIClient() {
  const { openai } = getEnv();

  return new OpenAI({
    apiKey: openai.apiKey,
  });
}

export function getEmbeddingModel() {
  return getEnv().openai.embeddingModel;
}
