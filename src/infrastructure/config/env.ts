import "server-only";
import { verifyPortfolioTarget } from "./portfolio-database";

type RequiredEnvName = "DATABASE_URL" | "OPENAI_API_KEY" | "RATE_LIMIT_HMAC_SECRET";

function requireEnv(name: RequiredEnvName) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
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
    apiKey: requireEnvValue("RESEND_API_KEY"),
    fromEmail: requireEnvValue("RESEND_FROM_EMAIL"),
  };
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
