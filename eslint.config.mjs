import stylistic from "@stylistic/eslint-plugin";
import nextVitals from "eslint-config-next/core-web-vitals";

const config = [
  ...nextVitals,

  {
    ignores: ["src/generated/prisma/**", "supabase/.temp/**"],
  },

  {
    plugins: {
      "@stylistic": stylistic,
    },

    rules: {
      // Require braces for if, else, loops, etc.
      curly: ["error", "all"],

      // Require a blank line between constructor and methods,
      // and between individual methods.
      "@stylistic/lines-between-class-members": [
        "error",
        "always",
        {
          exceptAfterSingleLine: false,
        },
      ],

      // Require useful separation inside function bodies.
      "@stylistic/padding-line-between-statements": [
        "error",

        // Keep consecutive declarations together.
        {
          blankLine: "any",
          prev: ["const", "let", "var"],
          next: ["const", "let", "var"],
        },

        // Add a blank line after the final declaration.
        {
          blankLine: "always",
          prev: ["const", "let", "var"],
          next: "*",
        },

        // Add a blank line before return.
        {
          blankLine: "always",
          prev: "*",
          next: "return",
        },

        // Do not require extra spacing between consecutive returns.
        {
          blankLine: "any",
          prev: "return",
          next: "return",
        },

        // Add a blank line after control-flow blocks.
        {
          blankLine: "always",
          prev: "block-like",
          next: "*",
        },
      ],
    },
  },

  {
    files: ["src/features/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: ["@/app/*", "@/server/*"],
        },
      ],
    },
  },

  {
    files: ["src/server/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: ["@/features/*", "@/app/*"],
        },
      ],
    },
  },

  {
    files: ["src/app/api/**/*.{ts,tsx}", "src/server/entrypoints/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            "@/server/modules/*/repositories/*",
            "@/server/modules/*/providers/*",
            "@/server/modules/*/mappers/*",
            "@/server/modules/*/factories/*",
            "@/server/modules/*/services/*",
            "@/server/modules/*/models/*",
            "@/server/modules/*/schemas/*",
            "@/server/modules/*/prompts/*",
            "@/server/modules/*/*.constants",
          ],
        },
      ],
    },
  },

  {
    files: ["src/shared/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: ["@/app/*", "@/features/*", "@/server/*"],
        },
      ],
    },
  },

  {
    files: [
      "src/features/**/{components,hooks,api,state,models}/**/*.{ts,tsx}",
      "src/app/**/error.tsx",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            "@/server/*",
            "@/generated/prisma/*",
            "@/lib/db",
            "@/lib/env",
            "@/lib/openai",
            "openai",
            "server-only",
          ],
        },
      ],
    },
  },
];

export default config;
