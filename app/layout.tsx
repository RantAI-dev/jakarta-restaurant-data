import type { Metadata } from "next";
import {
  Plus_Jakarta_Sans,
  Newsreader,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";

// Plus Jakarta Sans — designed by Tokotype specifically for Jakarta city
// branding. Carries all UI typography in this app (headings + body).
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

// Newsreader kept ONLY for the "Atlas" italic in the wordmark. One word,
// loaded with style: italic + a single weight to minimise payload.
const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-wordmark",
  style: ["italic"],
  weight: ["500"],
  display: "swap",
});

// JetBrains Mono — coordinates, indices, tabular numerals.
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Jakarta Atlas — Restoran & Golf",
  description:
    "Direktori tempat di DKI Jakarta: restoran internasional dan lapangan golf, dengan koordinat dan sumber data publik.",
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
      className={`${jakarta.variable} ${newsreader.variable} ${jetbrains.variable}`}
    >
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
