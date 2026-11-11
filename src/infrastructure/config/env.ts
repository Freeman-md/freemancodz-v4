import "server-only";
import { verifyPortfolioTarget } from "./portfolio-database";

function requireEnv(name: string, { trim = false } = {}) {
  const value = process.env[name];

  if (!value?.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return trim ? value.trim() : value;
}

export function getDatabaseUrl() {
  if (process.env.VERCEL_ENV === "preview") {
    return verifyPortfolioTarget("development", process.env, {}).connection;
  }

  return requireEnv("DATABASE_URL");
}

export function getOpenAIConfig() {
  return {
    apiKey: requireEnv("OPENAI_API_KEY"),
    responseModel: process.env.OPENAI_MODEL || "gpt-4.1-mini",
  };
}

export function getRateLimitHmacSecret() {
  return requireEnv("RATE_LIMIT_HMAC_SECRET");
}

export function getNotificationOwnerEmail() {
  return (process.env.ADMIN_EMAIL || "freemanmadudili@gmail.com").trim().toLowerCase();
}

export function getResendConfig() {
  return {
    apiKey: requireEnv("RESEND_API_KEY", { trim: true }),
    fromEmail: requireEnv("RESEND_FROM_EMAIL", { trim: true }),
  };
}

export function getGoogleCalendarConfig() {
  return {
    clientId: requireEnv("GOOGLE_CLIENT_ID", { trim: true }),
    clientSecret: requireEnv("GOOGLE_CLIENT_SECRET", { trim: true }),
    refreshToken: requireEnv("GOOGLE_REFRESH_TOKEN", { trim: true }),
    calendarId: requireEnv("GOOGLE_CALENDAR_ID", { trim: true }),
  };
}

export function getWorkflowRunnerSecret() {
  const secret = process.env.WORKFLOW_RUNNER_SECRET;

  return secret && secret.length >= 32 ? secret : null;
}
