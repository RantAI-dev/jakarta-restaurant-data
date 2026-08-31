"use client";

/**
 * ATLAS — GMTI (Jakarta Ramah Muslim), tampilan PETA.
 *
 * Dua lapis:
 *  1. Choropleth kepadatan fasilitas ibadah per kecamatan. Ini lapis utamanya
 *     — SIMAS tidak memuat koordinat, tapi setiap baris punya kecamatan, jadi
 *     sebaran seluruh 8.331 fasilitas tetap bisa dibaca jujur.
 *  2. Pin tempat ber-koordinat: masjid/mushalla signature yang berhasil
 *     ditelusuri titiknya + seluruh tempat dataset halal, diwarnai per pilar.
 *
 * Kecamatan yang tidak punya poligon di GeoJSON (Kepulauan Seribu) dicatat di
 * legenda, bukan dihilangkan diam-diam.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import L, { type Map as LeafletMap } from "leaflet";
import "leaflet.markercluster";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

import { AtlasNav } from "@/components/atlas/AtlasNav";
import { navLabel } from "@/components/GmtiView";
import { GMTI_AGG, GMTI_META, GMTI_PLACES } from "@/lib/gmti-data";
import {
  PILLARS,
  PILLAR_COLOR,
  PILLAR_LABEL,
  gmtiMapsUrl,
  idNum,
  type GmtiPlace,
  type Pillar,
} from "@/lib/gmti";

type IconDefaultProto = L.Icon.Default & { _getIconUrl?: unknown };
delete (L.Icon.Default.prototype as IconDefaultProto)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/** Skala choropleth hijau — gelap = makin padat. */
const RAMP = ["#e8f2f0", "#c3ded9", "#93c5bc", "#5aa79b", "#2d8b7c", "#0f7b6c"];

const geoKey = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");

type GeoFeature = {
  type: "Feature";
  properties: { name: string; kecamatan: string };
  geometry: { type: string; coordinates: unknown };
};
type GeoJson = { type: "FeatureCollection"; features: GeoFeature[] };

function esc(v: string): string {
  return v.replace(/[&<>"]/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&quot;"
  );
}

function pinIcon(p: GmtiPlace): L.DivIcon {
  return L.divIcon({
    html: `<div style="width:16px;height:16px;border-radius:50%;background:${
      PILLAR_COLOR[p.pillar]
    };border:2.5px solid #fff;box-shadow:0 3px 10px rgba(15,20,25,.35)"></div>`,
    className: "",
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

function popupHTML(p: GmtiPlace): string {
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;min-width:200px">
      <div style="font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:${
        PILLAR_COLOR[p.pillar]
      }">${esc(PILLAR_LABEL[p.pillar])}</div>
      <div style="font-weight:600;font-size:14px;color:#111;margin-top:2px">${esc(
        p.name
      )}</div>
      <div style="font-size:12px;color:#5b6470;margin-top:2px">${esc(p.kind)}</div>
      ${
        p.address
          ? `<div style="font-size:12px;color:#8b939d;margin-top:4px">${esc(
              p.address
            )}</div>`
          : ""
      }
      ${
        p.cert
          ? `<div style="font-size:11px;color:#8b939d;margin-top:4px">Sertifikat: ${esc(
              p.cert
            )}</div>`
          : ""
      }
      <a href="${gmtiMapsUrl(
        p
      )}" target="_blank" rel="noreferrer" style="display:inline-block;margin-top:8px;font-size:12px;color:#0b62d1">Buka di Maps ↗</a>
    </div>`;
}

export function GmtiMapView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const choroRef = useRef<L.GeoJSON | null>(null);
  const clusterRef = useRef<L.LayerGroup | null>(null);

  const [showChoro, setShowChoro] = useState(true);
  const [active, setActive] = useState<Set<Pillar>>(new Set(PILLARS));
  const [geo, setGeo] = useState<GeoJson | null>(null);
  const [geoError, setGeoError] = useState(false);

  /** kecamatan (tanpa spasi, huruf kecil) → agregat. */
  const byKec = useMemo(() => {
    const m = new Map<string, (typeof GMTI_AGG)[number]>();
    for (const a of GMTI_AGG) m.set(a.geoKey, a);
    return m;
  }, []);

  /** Ambang skala: kuantil sederhana dari total per kecamatan. */
  const breaks = useMemo(() => {
    const vals = GMTI_AGG.map((a) => a.total).sort((x, y) => x - y);
    if (!vals.length) return [];
    return RAMP.slice(1).map(
      (_, i) => vals[Math.floor(((i + 1) / RAMP.length) * (vals.length - 1))]
    );
  }, []);

  const colorFor = useMemo(
    () => (total: number) => {
      let i = 0;
      while (i < breaks.length && total > breaks[i]) i++;
      return RAMP[Math.min(i, RAMP.length - 1)];
    },
    [breaks]
  );

  const pins = useMemo(
    () =>
      GMTI_PLACES.filter(
        (p) => p.lat != null && p.lon != null && active.has(p.pillar)
      ),
    [active]
  );

  useEffect(() => {
    let cancelled = false;
    fetch("/geo/dki-jakarta.geojson")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((j: GeoJson) => {
        if (!cancelled) setGeo(j);
      })
      .catch(() => {
        if (!cancelled) setGeoError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Init peta sekali.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [-6.2, 106.82],
      zoom: 11,
      scrollWheelZoom: true,
    });
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      {
        maxZoom: 20,
        subdomains: "abcd",
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · © <a href="https://carto.com/attributions">CARTO</a>',
      }
    ).addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Lapis choropleth.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (choroRef.current) {
      map.removeLayer(choroRef.current);
      choroRef.current = null;
    }
    if (!geo || !showChoro) return;

    const layer = L.geoJSON(geo as unknown as GeoJSON.GeoJsonObject, {
      style: (f) => {
        const kec = (f?.properties as { kecamatan?: string })?.kecamatan ?? "";
        const agg = byKec.get(geoKey(kec));
        return {
          fillColor: agg ? colorFor(agg.total) : "#f1f3f5",
          fillOpacity: 0.72,
          color: "#ffffff",
          weight: 1.2,
        };
      },
      onEachFeature: (f, lyr) => {
        const props = f.properties as { kecamatan?: string; name?: string };
        const kec = props.kecamatan ?? "";
        const agg = byKec.get(geoKey(kec));
        lyr.bindPopup(
          `<div style="font-family:-apple-system,system-ui,sans-serif;min-width:180px">
            <div style="font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#0f7b6c">${esc(
              props.name ?? ""
            )}</div>
            <div style="font-weight:600;font-size:14px;color:#111;margin-top:2px">${esc(
              kec
            )}</div>
            ${
              agg
                ? `<div style="font-size:12px;color:#5b6470;margin-top:6px">
                     ${idNum(agg.total)} fasilitas ibadah<br/>
                     ${idNum(agg.masjid)} masjid · ${idNum(agg.mushalla)} mushalla
                   </div>`
                : `<div style="font-size:12px;color:#8b939d;margin-top:6px">Tidak ada data SIMAS untuk kecamatan ini</div>`
            }
          </div>`,
          { maxWidth: 280 }
        );
      },
    });
    layer.addTo(map);
    layer.bringToBack();
    choroRef.current = layer;
  }, [geo, showChoro, byKec, colorFor]);

  // Lapis pin.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (clusterRef.current) {
      map.removeLayer(clusterRef.current);
      clusterRef.current = null;
    }
    type ClusterModule = typeof L & {
      markerClusterGroup: (opts?: Record<string, unknown>) => L.LayerGroup;
    };
    const cluster = (L as ClusterModule).markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 46,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
    });
    for (const p of pins) {
      const m = L.marker([p.lat as number, p.lon as number], { icon: pinIcon(p) });
      m.bindPopup(popupHTML(p), { maxWidth: 300, autoPan: true });
      cluster.addLayer(m);
    }
    map.addLayer(cluster);
    clusterRef.current = cluster;
  }, [pins]);

  const togglePillar = (p: Pillar) =>
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });

  return (
    <main className="min-h-screen flex flex-col bg-paper">
      <AtlasNav section="gmti" view="map" t={navLabel} />

      {/* FILTER STRIP */}
      <div className="frosted border-b border-hairline z-10">
        <div className="mx-auto max-w-[1280px] px-6 py-3 flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowChoro((v) => !v)}
            className={`press-scale rounded-full px-3 py-1.5 apple-caption border ${
              showChoro
                ? "bg-ink text-white border-ink"
                : "bg-canvas text-ink-muted-80 border-hairline hover:text-ink"
            }`}
          >
            Kepadatan kecamatan
          </button>
          <span className="hidden md:inline-block h-5 w-px bg-hairline" />
          <div className="flex flex-wrap items-center gap-1.5">
            {PILLARS.map((p) => (
              <button
                key={p}
                onClick={() => togglePillar(p)}
                className={`press-scale rounded-full px-3 py-1 apple-caption border transition-colors ${
                  active.has(p)
                    ? "text-white border-transparent"
                    : "bg-canvas text-ink-muted-80 border-hairline hover:text-ink"
                }`}
                style={active.has(p) ? { background: PILLAR_COLOR[p] } : undefined}
              >
                {PILLAR_LABEL[p]}
              </button>
            ))}
          </div>
          <span className="ml-auto apple-caption tabular text-ink-muted-48">
            {idNum(pins.length)} titik
          </span>
        </div>
      </div>

      {/* MAP */}
      <div className="flex-1 relative" style={{ minHeight: "70vh" }}>
        <div ref={containerRef} className="absolute inset-0" />

        <div className="absolute bottom-4 left-4 z-[400] bg-canvas/95 backdrop-blur border border-hairline rounded-apple_lg p-3 max-w-[280px] shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
          <p className="apple-fine text-ink-muted-80 uppercase tracking-wider">
            Fasilitas ibadah per kecamatan
          </p>
          <div className="mt-2 flex items-center gap-1">
            {RAMP.map((c) => (
              <span
                key={c}
                className="h-2.5 flex-1 first:rounded-l-full last:rounded-r-full"
                style={{ background: c }}
              />
            ))}
          </div>
          <div className="mt-1 flex justify-between apple-fine text-ink-muted-48 tabular">
            <span>sedikit</span>
            <span>{idNum(GMTI_AGG[0]?.total ?? 0)}</span>
          </div>

          <div className="mt-3 pt-3 border-t border-hairline space-y-1.5">
            {PILLARS.filter((p) => active.has(p)).map((p) => (
              <div key={p} className="flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ background: PILLAR_COLOR[p] }}
                />
                <span className="apple-fine text-ink-muted-80">{PILLAR_LABEL[p]}</span>
              </div>
            ))}
          </div>

          <p className="apple-fine text-ink-muted-48 mt-3 pt-3 border-t border-hairline leading-relaxed">
            {idNum(GMTI_META.ibadahNonSignature)} fasilitas lingkungan (Masjid Jami &
            Mushalla Perumahan) tidak dipetakan sebagai titik — tetap dihitung di
            kepadatan kecamatan.
            {GMTI_META.kecamatanTanpaPoligon.length > 0 && (
              <>
                {" "}
                {GMTI_META.kecamatanTanpaPoligon.join(" & ")} belum punya poligon di
                peta dasar.
              </>
            )}
          </p>

          {geoError && (
            <p className="apple-fine text-ink mt-2">
              Lapis kepadatan gagal dimuat — pin tetap tampil.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
