import "server-only";

type RequiredEnvName = "DATABASE_URL" | "OPENAI_API_KEY" | "MEETING_WORKFLOW_SECRET";

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

export function getSearchIndexWorkerBatchLimit() {
  return process.env.SEARCH_INDEX_BATCH_LIMIT;
}

export function getMeetingWorkflowSecret() {
  return requireEnv("MEETING_WORKFLOW_SECRET");
}

export function getGoogleCalendarConfig() {
  return {
    clientId: requireEnvValue("GOOGLE_CLIENT_ID"),
    clientSecret: requireEnvValue("GOOGLE_CLIENT_SECRET"),
    refreshToken: requireEnvValue("GOOGLE_REFRESH_TOKEN"),
    calendarId: requireEnvValue("GOOGLE_CALENDAR_ID"),
  };
}

function requireEnvValue(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value!.trim();
}
