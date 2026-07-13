"use client";

import { use } from "react";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";

/**
 * Peta section Atlas. Saat ini hanya restaurants yang punya peta terpisah
 * (MapView membaca RESTAURANTS). Client-only (ssr:false) karena Leaflet butuh
 * `window`. Toggle List|Map ada di AtlasNav (dalam MapView/Dashboard).
 */
const MapView = dynamic(
  () => import("@/components/MapView").then((m) => m.MapView),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="apple-caption text-ink-muted-48">Memuat peta…</div>
      </div>
    ),
  }
);

export default function AtlasSectionMapPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = use(params);
  if (section === "restaurants") return <MapView />;
  notFound();
}
