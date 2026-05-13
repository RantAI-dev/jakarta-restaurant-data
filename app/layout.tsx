import type { Metadata } from "next";
import { Newsreader, Geist, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Newsreader: variable serif by Production Type — opsz from 6 → 72,
// italic with character. Carries the entire editorial voice.
const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-display",
  style: ["normal", "italic"],
  display: "swap",
  axes: ["opsz"],
});

// Geist: workhorse modern grotesque for body UI.
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  adjustFontFallback: false,
});

// JetBrains Mono: coordinates, indices, tabular numerals.
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Jakarta Atlas — Restaurants & Golf",
  description:
    "A cartographic register of restaurants serving international cuisine and golf courses inside the borders of DKI Jakarta.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${newsreader.variable} ${geist.variable} ${jetbrains.variable}`}
    >
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
