import { RankedList } from "./RankedList";

export type MapPoint = { lat: number; lng: number; label: string; value: number };

/**
 * SCAFFOLD PointMap — sementara render daftar titik (fallback).
 * TODO (Plan 7 Task 3 Step 2): ganti dengan peta Leaflet asli
 *   npm i leaflet react-leaflet && npm i -D @types/leaflet
 *   render <MapContainer> center Jakarta [-6.2,106.84], marker radius ∝ value.
 *   INGAT: kolom longitude/latitude di dataset obyek wisata TERBALIK — tukar.
 */
export function PointMap({ points }: { points: MapPoint[] }) {
  const top = [...points].sort((a, b) => b.value - a.value).slice(0, 15);
  return (
    <div>
      <div className="rounded-xl border-2 border-dashed border-slate-300 bg-white/50 p-4 text-[12px] text-slate-500">
        🗺️ Peta Leaflet — TODO (Plan 7). {points.length} titik. Sementara ditampilkan sebagai daftar.
      </div>
      <div className="mt-3">
        <RankedList data={top.map((p) => ({ label: p.label, value: p.value }))} />
      </div>
    </div>
  );
}
