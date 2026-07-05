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

export function getResponseModel() {
  return process.env.OPENAI_MODEL || "gpt-4.1-mini";
}
