"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
  return (
    <header style={{ background: NAVY }} className="text-white">
      <div className="mx-auto max-w-[1320px] px-6 h-[76px] flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3.5">
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
