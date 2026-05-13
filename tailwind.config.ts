import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        // — Atlas surfaces —
        paper: "#F4EFE3",
        "paper-deep": "#EBE3D2",
        "paper-light": "#FAF7EE",
        canvas: "#FCFAF4",
        parchment: "#F4EFE3",
        pearl: "#FAF7EE",
        // — Inks —
        ink: "#0F1419",
        "ink-muted-80": "#2A2F35",
        "ink-muted-48": "#6E6E68",
        "body-muted": "#9C988F",
        // — Lines —
        hairline: "rgba(15, 20, 25, 0.14)",
        divider: "rgba(15, 20, 25, 0.06)",
        // — Section accents (compass-rose red for restaurants, fairway
        //   green for golf, gold neutral for the brand mark). The
        //   --accent CSS variable swaps per data-section in globals.css. —
        "accent-rest": "#A0392E",
        "accent-rest-deep": "#6B2018",
        "accent-rest-soft": "#D87A6F",
        "accent-golf": "#2E5D3C",
        "accent-golf-deep": "#15331F",
        "accent-golf-soft": "#7AAE85",
        gold: "#C8A14B",
        "gold-deep": "#9F7D34",
        // — Back-compat aliases that resolve to the active section accent —
        primary: "var(--accent)",
        "primary-focus": "var(--accent-deep)",
        "primary-on-dark": "var(--accent-soft)",
        // — Dark tile (used sparingly, e.g. hero accents) —
        tile1: "#1A1E22",
        tile2: "#222629",
      },
      letterSpacing: {
        tight2: "-0.005em",
        editorial: "-0.022em",
      },
      borderRadius: {
        apple_sm: "6px",
        apple_md: "10px",
        apple_lg: "14px",
      },
      boxShadow: {
        product: "0 8px 36px rgba(15, 20, 25, 0.10)",
      },
      backgroundImage: {
        grain:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.06 0 0 0 0 0.08 0 0 0 0 0.10 0 0 0 0.08 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
      },
    },
  },
  plugins: [],
};

export default config;
