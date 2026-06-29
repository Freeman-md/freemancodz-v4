import type { Config } from "tailwindcss";
const config: Config = { content: ["./src/**/*.{ts,tsx}"], theme: { extend: { fontFamily: { sans: ["var(--font-inter)", "Inter", "sans-serif"], mono: ["var(--font-jetbrains)", "JetBrains Mono", "monospace"] }, colors: { ink: "#171717", muted: "#666666", line: "#EDEDED", surface: "#FAFAFA", accent: "#6366F1" }, boxShadow: { soft: "0 10px 30px -10px rgba(0,0,0,0.04)" } } }, plugins: [] };
export default config;
