"use client";

import dynamic from "next/dynamic";

const GolfView = dynamic(
  () => import("@/components/GolfView").then((m) => m.GolfView),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <div className="apple-caption text-ink-muted-48">Loading…</div>
      </div>
    ),
  }
);

export default function GolfPage() {
  return <GolfView />;
}
