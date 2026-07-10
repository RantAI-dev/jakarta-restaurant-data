import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Nav } from "@/components/Nav";
import "./globals.css";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dashboard Data Pariwisata & Ekraf — DKI Jakarta",
  description:
    "Platform visualisasi data terkonsolidasi Dinas Pariwisata & Ekonomi Kreatif Provinsi DKI Jakarta.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={sans.variable}>
      <body>
        <Nav />
        {children}
      </body>
    </html>
  );
}