import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Apple's recommended stack: SF Pro on Apple devices, Inter elsewhere.
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "var(--font-inter)",
          "Helvetica Neue",
          "sans-serif",
        ],
        display: [
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "var(--font-inter)",
          "Helvetica Neue",
          "sans-serif",
        ],
      },
      colors: {
        // — Brand / accent —
        primary: "#0066cc",
        "primary-focus": "#0071e3",
        "primary-on-dark": "#2997ff",
        // — Ink —
        ink: "#1d1d1f",
        "ink-muted-80": "#333333",
        "ink-muted-48": "#7a7a7a",
        "body-muted": "#cccccc",
        // — Surfaces —
        canvas: "#ffffff",
        parchment: "#f5f5f7",
        pearl: "#fafafc",
        tile1: "#272729",
        tile2: "#2a2a2c",
        tile3: "#252527",
        // — Lines —
        hairline: "#e0e0e0",
        divider: "#f0f0f0",
      },
      letterSpacing: {
        tight2: "-0.005em",
        appletight: "-0.0067em",  // ~ -0.374px @ 56px
        applehero: "-0.005em",
      },
      borderRadius: {
        apple_sm: "8px",
        apple_md: "11px",
        apple_lg: "18px",
      },
      boxShadow: {
        // The single product-shadow from DESIGN.md — used sparingly.
        product: "0 5px 30px rgba(0, 0, 0, 0.22)",
      },
    },
  },
  plugins: [],
};

export default config;
