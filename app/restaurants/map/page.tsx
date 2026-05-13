"use client";

import dynamic from "next/dynamic";

const MapView = dynamic(
  () => import("@/components/MapView").then((m) => m.MapView),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="apple-caption text-ink-muted-48">Loading map…</div>
      </div>
    ),
  }
);

export default function RestaurantsMapPage() {
  return <MapView />;
}
