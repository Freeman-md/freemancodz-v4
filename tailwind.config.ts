import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
        mono: ["var(--font-jetbrains)", "JetBrains Mono", "monospace"],
        display: ["var(--font-display)", "Playfair Display", "serif"],
      },
      colors: {
        ink: "#171717",
        muted: "#666666",
        line: "#EDEDED",
        surface: "#FAFAFA",
        accent: "#6366F1",
        signal: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
        success: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
        },
      },
      boxShadow: {
        soft: "0 10px 30px -10px rgba(0,0,0,0.04)",
      },
      keyframes: {
        "signal-glow": {
          "0%, 100%": {
            boxShadow: "0 0 24px rgba(55, 48, 163, 0.24), 0 0 52px rgba(199, 210, 254, 0.5)",
            transform: "scale(1)",
          },
          "50%": {
            boxShadow: "0 0 36px rgba(55, 48, 163, 0.42), 0 0 84px rgba(199, 210, 254, 0.78)",
            transform: "scale(1.025)",
          },
        },
        "alert-glow": {
          "0%, 100%": {
            boxShadow: "0 0 16px rgba(248, 113, 113, 0.22)",
          },
          "50%": {
            boxShadow: "0 0 28px rgba(248, 113, 113, 0.5)",
          },
        },
        "success-glow": {
          "0%, 100%": {
            boxShadow: "0 0 16px rgba(52, 211, 153, 0.2)",
          },
          "50%": {
            boxShadow: "0 0 28px rgba(52, 211, 153, 0.48)",
          },
        },
        "signal-flow": {
          "0%": { strokeDashoffset: "32" },
          "100%": { strokeDashoffset: "0" },
        },
        "skeleton-shimmer": {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        "signal-glow": "signal-glow 2.6s ease-in-out infinite",
        "alert-glow": "alert-glow 2.4s ease-in-out infinite",
        "success-glow": "success-glow 2.4s ease-in-out infinite",
        "signal-flow": "signal-flow 2.8s linear infinite",
        "skeleton-shimmer": "skeleton-shimmer 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
