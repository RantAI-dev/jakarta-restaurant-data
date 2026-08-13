"use client";

/**
 * Peta venue seni-pertunjukan (Leaflet) — gaya basemap Atlas (CartoDB Voyager).
 * Dot oranye = venue biasa (radius ∝ jumlah event). Dot EMAS + halo = venue yang
 * pernah menghadirkan artis Top-10 Global Chart terverifikasi (GBK/JIS).
 * Klik dot → info venue muncul di PANEL KANAN (peta di kiri, tak terhalang).
 */
import { useState, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type Venue = {
  venue: string;
  address: string;
  wilayah: string;
  lat: number;
  lon: number;
  eventCount: number;
  events: { nama_event: string; periode: string }[];
  gold: boolean;
  artists: string[];
};

const ORANGE = "#ed6b23";
const GOLD = "#e6a900";
const GOLD_DARK = "#8a6a00";
const AF = "-apple-system,BlinkMacSystemFont,system-ui,sans-serif";

if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: () => string })._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

const idOf = (v: Venue) => `${v.venue}|${v.lat}|${v.lon}`;

function FitBounds({ venues }: { venues: Venue[] }) {
  const map = useMap();
  useEffect(() => {
    if (!venues.length) return;
    const b = L.latLngBounds(venues.map((v) => [v.lat, v.lon]));
    map.fitBounds(b, { padding: [30, 30], maxZoom: 13 });
  }, [map, venues]);
  return null;
}

/** Kartu detail venue untuk panel kanan (peta mini Google + info + link). */
function VenueCard({ v }: { v: Venue }) {
  const embed = `https://maps.google.com/maps?q=${v.lat},${v.lon}&z=16&output=embed`;
  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${v.lat},${v.lon}`;
  return (
    <div style={{ fontFamily: AF }} className="flex h-full flex-col">
      <iframe
        title={`Peta ${v.venue}`}
        src={embed}
        className="w-full shrink-0"
        height={170}
        loading="lazy"
        style={{ border: 0, display: "block" }}
        referrerPolicy="no-referrer-when-downgrade"
      />
      <div className="flex-1 overflow-y-auto px-4 py-3.5">
        <div className="flex items-center justify-between gap-2">
          <span
            style={{ color: v.gold ? GOLD_DARK : ORANGE }}
            className="text-[10px] font-bold uppercase tracking-[0.08em]"
          >
            {v.wilayah}
          </span>
          {v.gold && (
            <span
              style={{ color: GOLD_DARK, background: "rgba(230,169,0,0.16)", borderColor: "rgba(230,169,0,0.4)" }}
              className="rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.06em]"
            >
              ★ Top-10 Venue
            </span>
          )}
        </div>
        <div className="mt-1 text-[17px] font-semibold leading-tight text-[#1d1d1f]">{v.venue}</div>
        {v.address && <div className="mt-1 text-[12px] leading-snug text-[#7a7a7a]">{v.address}</div>}

        {v.gold && v.artists.length > 0 && (
          <div
            style={{ background: "rgba(230,169,0,0.1)", borderColor: "rgba(230,169,0,0.32)", color: "#5c4a00" }}
            className="mt-2.5 rounded-lg border px-2.5 py-2 text-[12px]"
          >
            <div className="mb-0.5 font-semibold">Artis Top-10 Global Chart:</div>
            {v.artists.map((a, i) => (
              <div key={i}>{a}</div>
            ))}
          </div>
        )}

        <div className="mt-2.5 text-[13px] text-[#1d1d1f]">
          <b>{v.eventCount}</b> event terdata
        </div>
        {v.events.length > 0 && (
          <ul className="mt-1 space-y-0.5">
            {v.events.map((e, j) => (
              <li key={j} className="text-[12px] leading-snug text-[#555]">
                • {e.nama_event}
                {e.periode ? <span className="text-[#9a9a9a]"> ({e.periode})</span> : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-[#ececec] px-4 py-2.5">
        <a href={mapsLink} target="_blank" rel="noreferrer" style={{ color: ORANGE }} className="text-[13px] font-medium">
          Buka di Maps ↗
        </a>
        <a
          href="https://satudata.jakarta.go.id/open-data/data-seni-pertunjukan-dan-visual"
          target="_blank"
          rel="noreferrer"
          className="text-[12px] text-[#9a9a9a]"
        >
          Sumber ↗
        </a>
      </div>
    </div>
  );
}

export function VenueMap({ venues }: { venues: Venue[] }) {
  const normal = venues.filter((v) => !v.gold);
  const gold = venues.filter((v) => v.gold);
  const [sel, setSel] = useState<Venue | null>(gold[0] ?? normal[0] ?? null);

  if (!venues.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-[13px] text-slate-400">
        Belum ada venue dengan koordinat.
      </div>
    );
  }
  const maxV = Math.max(...normal.map((v) => v.eventCount), 1);
  const radiusFor = (v: Venue) => 4 + 9 * (v.eventCount / maxV);
  const isSel = (v: Venue) => sel != null && idOf(sel) === idOf(v);

  return (
    <div className="flex flex-col gap-3 md:flex-row">
      {/* Peta (kiri) */}
      <div className="relative h-[380px] flex-1 overflow-hidden rounded-2xl border border-slate-200 shadow-sm md:h-[520px]">
        <MapContainer center={[-6.2, 106.85]} zoom={11} preferCanvas style={{ height: "100%", width: "100%" }} scrollWheelZoom>
          <TileLayer
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · © <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
            maxZoom={20}
          />
          <FitBounds venues={venues} />

          {normal.map((v, i) => (
            <CircleMarker
              key={`n${i}`}
              center={[v.lat, v.lon]}
              radius={radiusFor(v) + (isSel(v) ? 3 : 0)}
              eventHandlers={{ click: () => setSel(v) }}
              pathOptions={{
                color: isSel(v) ? "#1d1d1f" : "#fff",
                weight: isSel(v) ? 3 : 1,
                fillColor: ORANGE,
                fillOpacity: 0.85,
              }}
            />
          ))}
          {gold.map((v, i) => (
            <CircleMarker key={`h${i}`} center={[v.lat, v.lon]} radius={18} interactive={false} pathOptions={{ stroke: false, fillColor: GOLD, fillOpacity: 0.22 }} />
          ))}
          {gold.map((v, i) => (
            <CircleMarker
              key={`g${i}`}
              center={[v.lat, v.lon]}
              radius={isSel(v) ? 11 : 9}
              eventHandlers={{ click: () => setSel(v) }}
              pathOptions={{ color: isSel(v) ? "#1d1d1f" : GOLD_DARK, weight: isSel(v) ? 3 : 2, fillColor: GOLD, fillOpacity: 1 }}
            />
          ))}
        </MapContainer>

        {/* Legend */}
        <div className="absolute bottom-3 right-3 z-[1000] rounded-xl border border-slate-200 bg-white/95 px-3.5 py-2.5 text-[11px] shadow-md backdrop-blur">
          <div className="mb-1.5 flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full border border-white" style={{ background: ORANGE }} />
            <span className="text-slate-600">Venue event · radius ∝ jumlah</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-3.5 w-3.5 rounded-full border"
              style={{ background: GOLD, borderColor: GOLD_DARK, boxShadow: "0 0 0 3px rgba(230,169,0,0.25)" }}
            />
            <span className="font-medium text-slate-700">Pernah menghadirkan artis Top-10</span>
          </div>
        </div>
      </div>

      {/* Panel info (kanan) */}
      <aside className="h-[420px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:h-[520px] md:w-[340px] md:shrink-0">
        {sel ? (
          <VenueCard v={sel} />
        ) : (
          <div className="flex h-full items-center justify-center p-6 text-center text-[13px] text-slate-400">
            Klik titik venue di peta untuk melihat detail & peta lokasi.
          </div>
        )}
      </aside>
    </div>
  );
}
