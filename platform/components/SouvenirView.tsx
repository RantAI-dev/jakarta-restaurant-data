"use client";

/**
 * ATLAS — Toko Suvenir Jakarta (sumber: TripAdvisor + verifikasi riset).
 *
 * Layout mengikuti section Atlas lain: hero strip + KPI, strip filter, lalu
 * split peta (kiri) + daftar (kanan). Peta pakai react-leaflet + CartoDB
 * Voyager, sama seperti komponen VenueMap di dashboard pariwisata.
 *
 * Catatan data: TripAdvisor memasukkan banyak usaha yang BUKAN toko suvenir
 * ke kategori "Gift & Specialty Shops". Filter Relevansi default = "Suvenir"
 * (Ya + Sebagian) supaya angka yang tampil tidak menyesatkan; pilih "Semua"
 * untuk melihat seluruh hasil crawl apa adanya.
 */
import { useMemo, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, useMap } from "react-leaflet";
import { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { ExportButton } from "@/components/atlas/ExportButton";
import {
  SOUVENIR_SHOPS,
  souvenirMapsUrl,
  type SouvenirShop,
} from "@/lib/souvenir";
import {
  type CsvColumn,
  type ExportFormat,
  dateStamp,
  downloadSpreadsheet,
} from "@/lib/export";

const ORANGE = "#ed6b23";
const GOLD = "#e6a900";
const MUTED = "#9aa3ad";

const RELEVANCE_FILTERS = ["Suvenir", "Ya", "Sebagian", "Tidak", "Semua"] as const;
type RelevanceFilter = (typeof RELEVANCE_FILTERS)[number];

const RELEVANCE_LABEL: Record<RelevanceFilter, string> = {
  Suvenir: "Toko suvenir",
  Ya: "Suvenir murni",
  Sebagian: "Sebagian suvenir",
  Tidak: "Bukan suvenir",
  Semua: "Semua listing",
};

/** Warna dot: emas = suvenir murni, oranye = sebagian, abu = bukan suvenir. */
function dotColor(s: SouvenirShop): string {
  if (s.relevance === "Ya") return GOLD;
  if (s.relevance === "Sebagian") return ORANGE;
  return MUTED;
}

function matchesRelevance(s: SouvenirShop, f: RelevanceFilter): boolean {
  if (f === "Semua") return true;
  if (f === "Suvenir") return s.relevance === "Ya" || s.relevance === "Sebagian";
  return s.relevance === f;
}

function FitBounds({ shops }: { shops: SouvenirShop[] }) {
  const map = useMap();
  useEffect(() => {
    const pts = shops
      .filter((s) => s.lat != null && s.lng != null)
      .map((s) => [s.lat as number, s.lng as number] as [number, number]);
    if (!pts.length) return;
    map.fitBounds(L.latLngBounds(pts), { padding: [30, 30], maxZoom: 14 });
  }, [map, shops]);
  return null;
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dd className="atlas-display-sm text-ink">{value}</dd>
      <dt className="atlas-mono text-ink-muted-48">{label}</dt>
    </div>
  );
}

export function SouvenirView() {
  const [relevance, setRelevance] = useState<RelevanceFilter>("Suvenir");
  const [city, setCity] = useState("All");
  const [selected, setSelected] = useState<string | null>(null);

  const cityOptions = useMemo(() => {
    const set = new Set(
      SOUVENIR_SHOPS.map((s) => s.city).filter((c): c is string => !!c)
    );
    return ["All", ...[...set].sort()];
  }, []);

  const filtered = useMemo(
    () =>
      SOUVENIR_SHOPS.filter(
        (s) => matchesRelevance(s, relevance) && (city === "All" || s.city === city)
      ).sort((a, b) => (b.reviews ?? 0) - (a.reviews ?? 0)),
    [relevance, city]
  );

  const stats = useMemo(() => {
    const ya = SOUVENIR_SHOPS.filter((s) => s.relevance === "Ya").length;
    const sebagian = SOUVENIR_SHOPS.filter((s) => s.relevance === "Sebagian").length;
    const geo = SOUVENIR_SHOPS.filter((s) => s.lat != null).length;
    return { total: SOUVENIR_SHOPS.length, ya, sebagian, geo };
  }, []);

  const mapped = filtered.filter((s) => s.lat != null && s.lng != null);
  const active = filtered.find((s) => s.id === selected) ?? null;

  async function exportSouvenir(format: ExportFormat) {
    const columns: CsvColumn<SouvenirShop>[] = [
      { header: "No", value: (_s, i) => i + 1 },
      { header: "Nama", value: (s) => s.name },
      { header: "Kategori TripAdvisor", value: (s) => s.category },
      { header: "Relevan Suvenir", value: (s) => s.relevance },
      { header: "Produk Utama", value: (s) => s.product ?? "" },
      { header: "Alamat", value: (s) => s.address ?? "" },
      { header: "Kota Administrasi", value: (s) => s.city ?? "" },
      { header: "Kecamatan", value: (s) => s.district ?? "" },
      { header: "Lintang", value: (s) => s.lat ?? "" },
      { header: "Bujur", value: (s) => s.lng ?? "" },
      { header: "Sumber Koordinat", value: (s) => s.coordSource ?? "" },
      { header: "Telepon", value: (s) => s.phone ?? "" },
      { header: "Rating", value: (s) => s.rating ?? "" },
      { header: "Jumlah Ulasan", value: (s) => s.reviews ?? "" },
      { header: "Status", value: (s) => s.status ?? "" },
      { header: "Catatan", value: (s) => s.note ?? "" },
      { header: "URL TripAdvisor", value: (s) => s.url ?? "" },
    ];
    await downloadSpreadsheet(
      `jakarta-atlas-suvenir-${dateStamp()}`,
      filtered,
      columns,
      format,
      "Suvenir"
    );
  }

  return (
    <main data-section="souvenir" className="min-h-screen flex flex-col bg-paper">
      {/* HERO STRIP */}
      <section className="border-b border-hairline bg-paper">
        <div className="mx-auto max-w-[1320px] px-6 py-10 md:py-14">
          <div className="flex items-center gap-3">
            <span className="atlas-mono text-ink-muted-48">
              VOL. 05 · DAYA TARIK BELANJA
            </span>
            <span className="flex-1 border-t border-hairline" />
            <span className="atlas-coord">JAKARTA · GPCI CI-SH</span>
          </div>
          <div className="mt-6 grid md:grid-cols-12 gap-8 items-end">
            <h1 className="atlas-display text-ink md:col-span-7">
              Toko{" "}
              <span className="atlas-italic text-[color:var(--accent)]">
                Suvenir
              </span>
            </h1>
            <dl className="md:col-span-5 grid grid-cols-4 gap-x-4 gap-y-1 border-l-0 md:border-l md:border-hairline md:pl-6">
              <StatTile label="Listing" value={String(stats.total)} />
              <StatTile label="Suvenir murni" value={String(stats.ya)} />
              <StatTile label="Sebagian" value={String(stats.sebagian)} />
              <StatTile label="Berkoordinat" value={String(stats.geo)} />
            </dl>
          </div>
          <p className="mt-6 apple-caption text-ink-muted-80 max-w-[70ch]">
            Hasil crawl TripAdvisor (kategori Shopping) yang sudah diverifikasi.
            TripAdvisor memasukkan banyak usaha non-suvenir — money changer,
            service HP, toko elektronik — ke kategori &ldquo;Gift &amp; Specialty
            Shops&rdquo;, sehingga tiap baris ditandai relevansinya. Dari{" "}
            {stats.total} listing, hanya {stats.ya} yang benar-benar toko suvenir.
          </p>
        </div>
      </section>

      {/* FILTER STRIP */}
      <section className="frosted border-b border-hairline">
        <div className="mx-auto max-w-[1320px] px-6 py-3 flex flex-wrap items-center gap-3">
          <span className="atlas-mono text-ink-muted-48">FILTER ·</span>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="appearance-none press-scale bg-canvas border border-hairline rounded-full h-9 pl-4 pr-9 apple-caption text-ink-muted-80 hover:text-ink focus:outline-none cursor-pointer"
          >
            {cityOptions.map((c) => (
              <option key={c} value={c}>
                {c === "All" ? "Semua wilayah" : c}
              </option>
            ))}
          </select>
          <div className="inline-flex p-1 bg-canvas border border-hairline rounded-full">
            {RELEVANCE_FILTERS.map((r) => (
              <button
                key={r}
                onClick={() => setRelevance(r)}
                className={`press-scale rounded-full px-3 py-1 apple-caption ${
                  relevance === r
                    ? "bg-[color:var(--accent)] text-white"
                    : "text-ink-muted-80 hover:text-ink"
                }`}
              >
                {RELEVANCE_LABEL[r]}
              </button>
            ))}
          </div>
          <span className="ml-auto atlas-mono text-ink-muted-48">
            {filtered.length}/{SOUVENIR_SHOPS.length} · {mapped.length} titik
          </span>
          <ExportButton onExport={exportSouvenir} label="Unduh" />
        </div>
      </section>

      {/* SPLIT: peta + daftar */}
      <section className="flex-1 grid md:grid-cols-[1.5fr_1fr] min-h-0">
        <div className="relative border-b md:border-b-0 md:border-r border-hairline min-h-[420px]">
          <MapContainer
            center={[-6.2, 106.82]}
            zoom={11}
            scrollWheelZoom
            style={{ height: "100%", width: "100%", minHeight: 420 }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            <FitBounds shops={mapped} />
            {mapped.map((s) => {
              const isSel = s.id === selected;
              return (
                <CircleMarker
                  key={s.id}
                  center={[s.lat as number, s.lng as number]}
                  radius={isSel ? 13 : 7}
                  pathOptions={{
                    color: "#ffffff",
                    weight: isSel ? 3 : 2,
                    fillColor: dotColor(s),
                    fillOpacity: 0.92,
                  }}
                  eventHandlers={{ click: () => setSelected(s.id) }}
                />
              );
            })}
          </MapContainer>

          {/* Legenda */}
          <div className="absolute bottom-4 left-4 z-[500] rounded-apple_lg border border-hairline bg-canvas/95 px-3 py-2 space-y-1">
            {[
              { c: GOLD, l: "Toko suvenir" },
              { c: ORANGE, l: "Sebagian suvenir" },
              { c: MUTED, l: "Bukan toko suvenir" },
            ].map((x) => (
              <div key={x.l} className="flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ background: x.c }}
                />
                <span className="atlas-mono text-ink-muted-80">{x.l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Daftar */}
        <div className="overflow-y-auto max-h-[70vh] md:max-h-none">
          {active && (
            <div className="border-b border-hairline bg-canvas px-6 py-4">
              <div className="atlas-mono text-ink-muted-48">TERPILIH</div>
              <div className="apple-title text-ink mt-1">{active.name}</div>
              {active.note && (
                <p className="apple-caption text-ink-muted-80 mt-2">{active.note}</p>
              )}
              <a
                href={souvenirMapsUrl(active)}
                target="_blank"
                rel="noreferrer"
                className="inline-block mt-3 apple-caption text-[color:var(--accent)] hover:underline"
              >
                Buka di Google Maps →
              </a>
            </div>
          )}

          <ul>
            {filtered.map((s) => (
              <li
                key={s.id}
                onClick={() => setSelected(s.id)}
                className={`cursor-pointer border-b border-hairline px-6 py-4 hover:bg-canvas ${
                  s.id === selected ? "bg-canvas" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className="mt-1.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: dotColor(s) }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="apple-body text-ink">{s.name}</div>
                    <div className="apple-caption text-ink-muted-80 mt-0.5">
                      {[s.product, s.district, s.city].filter(Boolean).join(" · ")}
                    </div>
                    {s.address && (
                      <div className="apple-caption text-ink-muted-48 mt-0.5 truncate">
                        {s.address}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    {s.rating != null && (
                      <div className="apple-caption text-ink">
                        {s.rating.toFixed(1).replace(".", ",")}
                      </div>
                    )}
                    {s.reviews != null && (
                      <div className="atlas-mono text-ink-muted-48">
                        {s.reviews} ulasan
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {filtered.length === 0 && (
            <div className="px-6 py-10 apple-caption text-ink-muted-48">
              Tidak ada toko yang cocok dengan filter ini.
            </div>
          )}
        </div>
      </section>

      <footer className="border-t border-hairline px-6 py-4">
        <p className="atlas-mono text-ink-muted-48 mx-auto max-w-[1320px]">
          SUMBER · TRIPADVISOR (GEO G294229, KATEGORI SHOPPING C26) · VERIFIKASI
          RELEVANSI, WILAYAH &amp; KOORDINAT VIA PENELUSURAN SUMBER TERBUKA ·
          DIPERBARUI 29 JULI 2026
        </p>
      </footer>
    </main>
  );
}
