"use client";

import dynamic from "next/dynamic";

const GciView = dynamic(
  () => import("@/components/GciView").then((m) => m.GciView),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <div className="apple-caption text-ink-muted-48">Loading…</div>
      </div>
    ),
  }
);

export default function GciPage() {
  return <GciView />;
}
