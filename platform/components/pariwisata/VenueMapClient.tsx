"use client";

/** Wrapper dynamic ssr:false — Leaflet butuh `window`. Dipakai dari server page. */
import dynamic from "next/dynamic";
import type { Venue } from "./VenueMap";

const Inner = dynamic(() => import("./VenueMap").then((m) => m.VenueMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-[460px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-[13px] text-slate-400">
      Memuat peta venue…
    </div>
  ),
});

export function VenueMapClient({ venues }: { venues: Venue[] }) {
  return <Inner venues={venues} />;
}
