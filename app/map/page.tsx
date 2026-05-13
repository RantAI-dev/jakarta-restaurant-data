"use client";

import dynamic from "next/dynamic";

// Leaflet manipulates the DOM directly and can't run in SSR; dynamic-import
// with ssr: false so it only loads in the browser. The wrapping page must
// itself be a client component (Next 15 restriction).
const MapView = dynamic(
  () => import("@/components/MapView").then((m) => m.MapView),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <div className="apple-caption text-ink-muted-48">Loading map…</div>
      </div>
    ),
  }
);

export default function MapPage() {
  return <MapView />;
}
