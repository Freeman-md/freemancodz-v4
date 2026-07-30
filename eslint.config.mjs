import nextVitals from "eslint-config-next/core-web-vitals";

const config = [
  ...nextVitals,
  { ignores: ["src/generated/prisma/**"] },
  {
    files: ["src/features/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { patterns: ["@/app/*", "@/server/*"] }],
    },
  },
  {
    files: ["src/server/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { patterns: ["@/features/*", "@/app/*"] }],
    },
  },
  {
    files: ["src/app/api/**/*.{ts,tsx}", "src/server/entrypoints/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [
        "@/server/modules/*/repositories/*",
        "@/server/modules/*/providers/*",
        "@/server/modules/*/mappers/*",
        "@/server/modules/*/factories/*",
        "@/server/modules/*/services/*",
        "@/server/modules/*/models/*",
        "@/server/modules/*/schemas/*",
        "@/server/modules/*/prompts/*",
        "@/server/modules/*/*.constants"
      ] }],
    },
  },
  {
    files: ["src/shared/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { patterns: ["@/app/*", "@/features/*", "@/server/*"] }],
    },
  },
  {
    files: ["src/features/**/{components,hooks,api,state,models}/**/*.{ts,tsx}", "src/app/**/error.tsx"],
    rules: {
      "no-restricted-imports": ["error", { patterns: ["@/server/*", "@/generated/prisma/*", "@/lib/db", "@/lib/env", "@/lib/openai", "openai", "@vercel/blob", "server-only"] }],
    },
  },
];

export default config;
