"use client";

import dynamic from "next/dynamic";

const EventsView = dynamic(
  () => import("@/components/EventsView").then((m) => m.EventsView),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <div className="apple-caption text-ink-muted-48">Loading…</div>
      </div>
    ),
  }
);

export default function EventsPage() {
  return <EventsView />;
}
