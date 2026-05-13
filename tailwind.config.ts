import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Plus Jakarta Sans for everything. "display" + "sans" alias to
        // the same family so existing class names still resolve.
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-sans)", "system-ui", "sans-serif"],
        wordmark: ["var(--font-wordmark)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        // — Surfaces (clean, light, civic-tech) —
        canvas: "#FFFFFF",
        paper: "#F8FAFC",
        "paper-deep": "#F1F5F9",
        "paper-light": "#FAFBFC",
        parchment: "#F8FAFC",
        pearl: "#FAFBFC",
        // — Inks —
        ink: "#0F172A",
        "ink-muted-80": "#1E293B",
        "ink-muted-48": "#64748B",
        "body-muted": "#94A3B8",
        // — Lines —
        hairline: "#E2E8F0",
        divider: "#F1F5F9",
        // — Section accents (DKI Jakarta civic blue for restaurants
        //   default; deep green for golf via data-section='golf') —
        "accent-rest": "#0E4DA4",
        "accent-rest-deep": "#093878",
        "accent-rest-soft": "#4980D4",
        "accent-golf": "#0E7C42",
        "accent-golf-deep": "#0A5E32",
        "accent-golf-soft": "#3FA972",
        gold: "#D4A53D",
        // — Back-compat aliases that resolve to the active section accent —
        primary: "var(--accent)",
        "primary-focus": "var(--accent-deep)",
        "primary-on-dark": "var(--accent-soft)",
        // — Dark tile (hero overlay if needed) —
        tile1: "#0F172A",
        tile2: "#1E293B",
      },
      letterSpacing: {
        tight2: "-0.005em",
        editorial: "-0.022em",
      },
      borderRadius: {
        apple_sm: "6px",
        apple_md: "10px",
        apple_lg: "12px",
      },
      boxShadow: {
        // Smart City card lift on hover
        card: "0 1px 2px rgba(15, 23, 42, 0.06)",
        "card-hover":
          "0 8px 24px rgba(15, 23, 42, 0.10), 0 2px 4px rgba(15, 23, 42, 0.04)",
        product: "0 8px 24px rgba(15, 23, 42, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
