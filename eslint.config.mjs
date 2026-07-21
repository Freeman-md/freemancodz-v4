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
    files: ["src/components/**/*.{ts,tsx}", "src/features/**/components/**/*.{ts,tsx}", "src/features/**/client.ts", "src/features/**/use-*.ts", "src/app/**/error.tsx"],
    rules: {
      "no-restricted-imports": ["error", { patterns: ["@/features/*/server/*", "@/lib/db", "@/lib/env", "@/lib/openai", "@/generated/prisma/*"] }],
    },
  },
];

export default config;
