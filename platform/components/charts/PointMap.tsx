"use client";

/**
 * PointMap — peta Leaflet untuk indikator archetype "peta" (CE4, CI-TA, CI-WH, CI-MU).
 * Marker radius ∝ value. Center Jakarta. Tile OpenStreetMap.
 *
 * INGAT: kolom longitude/latitude di dataset obyek wisata TERBALIK — tukar
 * sebelum lempar ke component ini (lihat `_renderers.tsx:renderPeta`).
 *
 * Dipanggil dari server component via `PointMapClient.tsx` (dynamic + ssr:false).
 */

import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type MapPoint = { lat: number; lng: number; label: string; value: number };

/** Patch ikon default Leaflet — CDN unpkg (sama dengan pola Atlas MapView). */
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: () => string })._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

/** Auto-fit bounds ke titik yang ada. */
function FitBounds({ points }: { points: MapPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 13 });
  }, [map, points]);
  return null;
}

export function PointMap({ points }: { points: MapPoint[] }) {
  if (!points.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-[13px] text-slate-400">
        Tidak ada titik dengan koordinat valid.
      </div>
    );
  }

  // Radius marker ∝ value, dibatasi [4, 18].
  const maxV = Math.max(...points.map((p) => p.value), 1);
  const radiusFor = (v: number) => 4 + 14 * (v / maxV);

  return (
    <div className="rounded-xl overflow-hidden border border-slate-200 h-[420px]">
      <MapContainer
        center={[-6.2, 106.84]}
        zoom={11}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={points} />
        {points.map((p, i) => (
          <CircleMarker
            key={`${p.lat}-${p.lng}-${i}`}
            center={[p.lat, p.lng]}
            radius={radiusFor(p.value)}
            pathOptions={{ color: "#0f3d7a", fillColor: "#0f3d7a", fillOpacity: 0.5 }}
          >
            <Popup>
              <div style={{ fontSize: 12 }}>
                <strong>{p.label}</strong>
                <br />
                {p.value.toLocaleString("id-ID")} kunjungan
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}