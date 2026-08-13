import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Platform Data Dispar v2 — Lakehouse",
  description: "Dashboard membaca lapisan Gold lakehouse (ClickHouse)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <header className="top">
          <div className="wrap">
            <div className="brand">
              Dispar<span>·</span>Data <span style={{ fontWeight: 400, fontSize: 12 }}>v2 · lakehouse</span>
            </div>
            <nav>
              <Link href="/">Beranda</Link>
              <Link href="/wisman">Wisman</Link>
              <Link href="/gci">GCI/GPCI</Link>
              <Link href="/lineage">Lineage</Link>
            </nav>
          </div>
        </header>
        <main className="wrap">{children}</main>
        <footer className="wrap">
          Sumber: lapisan Gold lakehouse (ClickHouse · database <code>serving</code>).
          Data ditarik dari Satu Data Jakarta + sumber sekunder melalui Bronze→Silver→Gold.
        </footer>
      </body>
    </html>
  );
}
