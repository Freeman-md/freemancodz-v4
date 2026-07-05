type RequiredEnvName =
  | "NEXT_PUBLIC_SUPABASE_URL"
  | "SUPABASE_SECRET_KEY"
  | "OPENAI_API_KEY";

function requireEnv(name: RequiredEnvName) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getEnv() {
  return {
    supabase: {
      url: requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
      publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      secretKey: requireEnv("SUPABASE_SECRET_KEY"),
    },
    openai: {
      apiKey: requireEnv("OPENAI_API_KEY"),
      embeddingModel:
        process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",
    },
  };
}
