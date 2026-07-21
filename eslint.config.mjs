import nextVitals from "eslint-config-next/core-web-vitals";

const config = [
  ...nextVitals,
  { ignores: ["src/generated/prisma/**"] },
  {
    files: ["src/features/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { patterns: ["@/app/*"] }],
    },
  },
  {
    files: ["src/features/**/components/**/*.{ts,tsx}", "src/features/**/client.ts", "src/features/**/use-*.ts"],
    rules: {
      "no-restricted-imports": ["error", { patterns: ["@/features/*/server/*", "@/lib/db", "@/lib/openai", "@/generated/prisma/*"] }],
    },
  },
];

export default config;
