"use client";

/**
 * Client wrapper untuk PointMap — Leaflet butuh `window`, jadi component ini
 * harus di-load via next/dynamic dengan ssr:false. Dipakai dari server component
 * (`_renderers.tsx`) yang render peta dari data Postgres.
 */

import dynamic from "next/dynamic";

export const PointMap = dynamic(
  () => import("./PointMap").then((m) => m.PointMap),
  {
    ssr: false,
    loading: () => (
      <div className="text-[13px] text-slate-400 py-6 text-center">
        Memuat peta…
      </div>
    ),
  }
);