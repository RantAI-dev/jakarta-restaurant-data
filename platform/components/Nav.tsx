"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAVY = "#0f3d7a";

const ITEMS = [
  { href: "/sdi", label: "Katalog" },
  { href: "/gci", label: "GCI" },
  { href: "/gpci", label: "GPCI" },
  { href: "/atlas", label: "Atlas" },
];

/**
 * Navigasi global 4-menu: Katalog · GCI · GPCI · Atlas.
 * Dipakai di semua halaman (idealnya via app/layout.tsx — lihat Plan 6 Task 1).
 */
export function Nav() {
  const path = usePathname() || "/";
  const router = useRouter();
  const showBack = path !== "/";
  return (
    <header style={{ background: NAVY }} className="text-white">
      <div className="mx-auto max-w-[1320px] px-6 h-[76px] flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          {/* Kembali — global, ke halaman sebelumnya. Sembunyi di beranda. */}
          {showBack && (
            <button
              onClick={() => router.back()}
              aria-label="Kembali ke halaman sebelumnya"
              className="shrink-0 inline-flex items-center gap-1.5 rounded-lg pl-1.5 pr-2.5 py-2 text-[13px] font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
              <span className="hidden sm:inline">Kembali</span>
            </button>
          )}
          <Link href="/" className="flex items-center gap-3.5 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-jakarta.png"
              alt="Logo Jakarta"
              className="h-11 w-auto bg-white rounded-md p-1"
            />
            <div className="leading-tight hidden sm:block">
              <div className="font-semibold tracking-tight text-[15px]">
                Dinas Pariwisata &amp; Ekonomi Kreatif
              </div>
              <div className="text-[12px] text-white/70">
                Provinsi DKI Jakarta · Platform Data
              </div>
            </div>
          </Link>
        </div>
        <nav className="flex items-center gap-1 text-[13px] font-medium">
          {ITEMS.map((it) => {
            const active =
              path === it.href || path.startsWith(it.href + "/");
            return (
              <Link
                key={it.href}
                href={it.href}
                className="px-3.5 py-2 rounded-lg transition-colors"
                style={
                  active
                    ? { background: "rgba(255,255,255,0.16)", color: "#fff" }
                    : { color: "rgba(255,255,255,0.82)" }
                }
              >
                {it.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
