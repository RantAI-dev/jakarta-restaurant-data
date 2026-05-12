import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Inter loaded as the open-source fallback for SF Pro on non-Apple platforms,
// per DESIGN.md → "Note on Font Substitutes". The CSS stack puts
// `-apple-system, BlinkMacSystemFont, system-ui` first so macOS/iOS/Safari
// resolves to the real SF Pro Display / SF Pro Text.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dinas Pariwisata Jakarta — International Cuisine Directory",
  description:
    "A web-sourced register of restaurants and bars in Jakarta serving international food or beverages.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={inter.variable}
    >
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
