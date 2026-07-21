type RequiredEnvName = "DATABASE_URL" | "OPENAI_API_KEY";

function requireEnv(name: RequiredEnvName) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getDatabaseUrl() {
  return requireEnv("DATABASE_URL");
}

export function getOpenAIConfig() {
  return {
    apiKey: requireEnv("OPENAI_API_KEY"),
    embeddingModel: process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",
    responseModel: process.env.OPENAI_MODEL || "gpt-4.1-mini",
  };
}

export function getSearchIndexWorkerSecret() {
  return process.env.SEARCH_INDEX_WORKER_SECRET || process.env.CRON_SECRET;
}
