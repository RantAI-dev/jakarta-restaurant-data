import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: "#ed6b23", deep: "#c9531a" }, orange: { DEFAULT: "#ed6b23", deep: "#c9531a", soft: "#f4a06b" },
        gold: "#f0a13a",
        civic: "#0e7c42",
      },
      fontFamily: { sans: ["var(--font-sans)", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
} satisfies Config;