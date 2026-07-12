"use client";

import { use, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  AtlasSection,
  type Row,
  type Col,
  type Segmented,
  type SelectFilter,
} from "@/components/atlas/AtlasSection";

// Sumber data = Jakarta Atlas app (live, CORS aktif) → jalan lokal & prod.
const ATLAS_BASE =
  process.env.NEXT_PUBLIC_ATLAS_BASE ?? "https://jakarta-restaurant-data.vercel.app";

const NAVY = "#0f3d7a";
const s = (r: Row, k: string) => String(r[k] ?? "");
const n = (r: Row, k: string) =>
  r[k] === undefined || r[k] === null ? undefined : Number(r[k]);
const fmtRating = (v?: number) => (v === undefined ? "—" : v.toFixed(1).replace(".", ","));
function gciMapsUrl(r: Row): string {
  if (r.placeId)
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${s(r, "name")} ${s(r, "area")}`)}&query_place_id=${r.placeId}`;
  if (r.lat !== undefined && r.lng !== undefined)
    return `https://www.google.com/maps/search/?api=1&query=${r.lat},${r.lng}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${s(r, "name")} ${s(r, "area")}`)}`;
}
const gciAddress = (r: Row) => (s(r, "address").trim() ? s(r, "address") : s(r, "area"));

function ExtLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="font-medium hover:underline"
      style={{ color: NAVY }}
    >
      {children}
    </a>
  );
}
function Badge({ text, bg, fg }: { text: string; bg: string; fg: string }) {
  return (
    <span
      className="inline-block rounded-full px-2.5 py-0.5 text-[11px] whitespace-nowrap"
      style={{ background: bg, color: fg }}
    >
      {text}
    </span>
  );
}

const TIER_BADGE: Record<string, { bg: string; fg: string }> = {
  "Hotel ★5": { bg: "rgba(26,58,90,0.12)", fg: "#1A3A5A" },
  "Hotel ★4": { bg: "rgba(14,124,66,0.12)", fg: "#0a5e32" },
  "Hotel ★3": { bg: "rgba(232,163,61,0.18)", fg: "#8a6d23" },
  Restoran: { bg: "rgba(15,23,42,0.06)", fg: "#334155" },
  Cafe: { bg: "rgba(139,90,43,0.14)", fg: "#8B5A2B" },
};

const CITY_ORDER = [
  "Jakarta Pusat",
  "Jakarta Selatan",
  "Jakarta Utara",
  "Jakarta Barat",
  "Jakarta Timur",
  "Kepulauan Seribu",
];
const EVENT_CATS = [
  "Konser Musik",
  "Festival Musik",
  "Seni Tari",
  "Teater / Musikal",
  "Orkestra / Klasik",
  "Seni Tradisional",
  "Seni Rupa",
  "Film",
  "Budaya",
  "Budaya Pop",
  "Fashion",
  "Fan Meeting",
];

type SectionCfg = {
  endpoint: string;
  eyebrow: string;
  title: string;
  titleAccent?: string;
  desc: string;
  stats: (rows: Row[]) => { label: string; value: string | number }[];
  search: (r: Row) => string;
  segmented?: Segmented;
  selects?: SelectFilter[];
  columns: Col[];
  footer?: string;
};

const SECTIONS: Record<string, SectionCfg> = {
  gci: {
    endpoint: "/api/gci",
    eyebrow: "GCI · Restoran",
    title: "Restoran",
    titleAccent: "GCI",
    desc: "Inventarisasi seluruh restoran & cafe di Jakarta beserta keberagaman kuliner internasional — termasuk restoran hotel bintang 3 & 4 — untuk Global City Index.",
    stats: (rows) => [
      { label: "TOTAL", value: rows.length },
      { label: "ADA RATING", value: rows.filter((r) => r.rating !== undefined && r.rating !== null).length },
      { label: "HOTEL", value: rows.filter((r) => s(r, "tier").startsWith("Hotel")).length },
      { label: "CAFE", value: rows.filter((r) => s(r, "tier") === "Cafe").length },
    ],
    search: (r) => `${s(r, "name")} ${s(r, "cuisine")} ${s(r, "area")} ${s(r, "address")} ${s(r, "hotel")}`,
    segmented: { options: ["Hotel ★4", "Hotel ★3", "Restoran", "Cafe"], match: (r, o) => s(r, "tier") === o },
    selects: [
      { label: "Semua kota", options: CITY_ORDER, match: (r, o) => s(r, "city") === o },
      {
        label: "Semua (rating)",
        options: ["Ada rating", "Belum ada rating"],
        match: (r, o) =>
          o === "Ada rating"
            ? r.rating !== undefined && r.rating !== null
            : r.rating === undefined || r.rating === null,
      },
    ],
    columns: [
      { header: "No.", align: "right", className: "w-12", cell: (_r, i) => <span className="text-slate-400">{i + 1}</span> },
      {
        header: "Nama",
        cell: (r) => (
          <div>
            <ExtLink href={gciMapsUrl(r)}>{s(r, "name")}</ExtLink>
            {s(r, "hotel") && <div className="text-[12px] text-slate-400 mt-0.5">{s(r, "hotel")}</div>}
          </div>
        ),
      },
      { header: "Jenis Cuisine", cell: (r) => <span className="text-slate-600">{s(r, "cuisine")}</span> },
      { header: "Alamat", className: "max-w-[280px]", cell: (r) => <span className="text-slate-600 text-[13px]">{gciAddress(r)}</span> },
      {
        header: "Harga",
        align: "center",
        cell: (r) => (
          <span className="text-slate-600 tabular-nums">
            {s(r, "priceLevel") || "—"}
            {r.priceSource === "editorial" && <span style={{ color: NAVY }}> *</span>}
          </span>
        ),
      },
      { header: "Rating", align: "right", cell: (r) => <span className="text-slate-800 font-medium">{fmtRating(n(r, "rating"))}</span> },
      { header: "Ulasan", align: "right", cell: (r) => <span className="text-slate-500">{n(r, "reviewCount")?.toLocaleString("id-ID") ?? "—"}</span> },
      { header: "Sumber", cell: (r) => <span className="text-slate-500 text-[13px]">{s(r, "ratingSource") || "—"}</span> },
      {
        header: "Tier",
        cell: (r) => {
          const t = s(r, "tier");
          const st = TIER_BADGE[t] ?? TIER_BADGE.Restoran;
          return <Badge text={t} bg={st.bg} fg={st.fg} />;
        },
      },
    ],
    footer: "Sumber: Wanderlog, TripAdvisor, situs hotel resmi (data Google). GCI — Disparekraf DKI Jakarta.",
  },

  restaurants: {
    endpoint: "/api/restaurants",
    eyebrow: "Direktori Restoran",
    title: "Direktori",
    titleAccent: "Restoran",
    desc: "Direktori restoran & kafe pilihan Jakarta dengan sumber sitasi publik yang terverifikasi.",
    stats: (rows) => [
      { label: "TOTAL", value: rows.length },
      { label: "KURASI", value: rows.filter((r) => r.source === "curated").length },
      { label: "CUISINE", value: new Set(rows.map((r) => s(r, "cuisine"))).size },
      { label: "AREA", value: new Set(rows.map((r) => s(r, "city"))).size },
    ],
    search: (r) => `${s(r, "name")} ${s(r, "cuisine")} ${s(r, "area")} ${s(r, "address")}`,
    segmented: { options: ["Food", "Beverage", "Food & Beverage"], match: (r, o) => s(r, "category") === o },
    selects: [{ label: "Semua kota", options: CITY_ORDER, match: (r, o) => s(r, "city") === o }],
    columns: [
      { header: "No.", align: "right", className: "w-12", cell: (_r, i) => <span className="text-slate-400">{i + 1}</span> },
      { header: "Nama", cell: (r) => (r.website ? <ExtLink href={s(r, "website")}>{s(r, "name")}</ExtLink> : <span className="font-medium text-slate-800">{s(r, "name")}</span>) },
      { header: "Cuisine", cell: (r) => <span className="text-slate-600">{s(r, "cuisine")}</span> },
      { header: "Kategori", cell: (r) => <span className="text-slate-600 text-[13px]">{s(r, "category")}</span> },
      { header: "Area", className: "max-w-[240px]", cell: (r) => <span className="text-slate-600 text-[13px]">{s(r, "area")}</span> },
      { header: "Harga", align: "center", cell: (r) => <span className="text-slate-600 tabular-nums">{s(r, "priceRange") || "—"}</span> },
      { header: "Rating", align: "right", cell: (r) => <span className="text-slate-800 font-medium">{fmtRating(n(r, "rating"))}</span> },
      { header: "Ulasan", align: "right", cell: (r) => <span className="text-slate-500">{n(r, "reviewCount")?.toLocaleString("id-ID") ?? "—"}</span> },
    ],
  },

  pertunjukan: {
    endpoint: "/api/events",
    eyebrow: "GCI · Pertunjukan",
    title: "Pertunjukan &",
    titleAccent: "Budaya",
    desc: "Pertunjukan musik internasional/nasional & acara budaya besar di Jakarta 2025–2026 — konser, festival, tari, teater, seni rupa, film — untuk Global City Index.",
    stats: (rows) => [
      { label: "TOTAL", value: rows.length },
      { label: "KONSER", value: rows.filter((r) => s(r, "category") === "Konser Musik").length },
      { label: "FESTIVAL", value: rows.filter((r) => s(r, "category") === "Festival Musik").length },
      { label: "BUDAYA", value: rows.filter((r) => s(r, "category") === "Budaya").length },
    ],
    search: (r) => `${s(r, "name")} ${s(r, "organizer")} ${s(r, "venue")} ${s(r, "type")} ${s(r, "date")} ${s(r, "note")}`,
    segmented: { options: EVENT_CATS, match: (r, o) => s(r, "category") === o },
    columns: [
      { header: "Nama Pertunjukan", cell: (r) => (r.source ? <ExtLink href={s(r, "source")}>{s(r, "name")}</ExtLink> : <span className="font-medium text-slate-800">{s(r, "name")}</span>) },
      { header: "Penyelenggara", cell: (r) => <span className="text-slate-600 text-[13px]">{s(r, "organizer") || "—"}</span> },
      { header: "Tanggal", cell: (r) => <span className="text-slate-600 text-[13px] whitespace-nowrap">{s(r, "date")}</span> },
      { header: "Tempat", className: "max-w-[220px]", cell: (r) => <span className="text-slate-600 text-[13px]">{s(r, "venue")}</span> },
      { header: "Jenis", cell: (r) => <span className="text-slate-600 text-[13px]">{s(r, "type")}</span> },
      { header: "Pengunjung", align: "right", cell: (r) => <span className="text-slate-600 tabular-nums">{s(r, "visitors") || "—"}</span> },
      { header: "Kategori", cell: (r) => <Badge text={s(r, "category")} bg="rgba(15,61,122,0.08)" fg={NAVY} /> },
    ],
    footer: "GCI — Disparekraf DKI Jakarta.",
  },

  golf: {
    endpoint: "/api/golf",
    eyebrow: "Lapangan Golf",
    title: "Lapangan",
    titleAccent: "Golf",
    desc: "Pendataan lapangan & driving range golf di Jakarta dan sekitarnya.",
    stats: (rows) => [
      { label: "TOTAL", value: rows.length },
      { label: "COURSE", value: rows.filter((r) => s(r, "kind") === "Course").length },
      { label: "RANGE", value: rows.filter((r) => s(r, "kind") !== "Course").length },
      { label: "HOLE", value: rows.reduce((a, r) => a + (n(r, "holes") ?? 0), 0) },
    ],
    search: (r) => `${s(r, "name")} ${s(r, "area")} ${s(r, "designer")} ${s(r, "membership")}`,
    segmented: { options: ["Course", "Driving Range", "Topgolf"], match: (r, o) => s(r, "kind") === o },
    columns: [
      { header: "Nama", cell: (r) => (r.website ? <ExtLink href={s(r, "website")}>{s(r, "name")}</ExtLink> : <span className="font-medium text-slate-800">{s(r, "name")}</span>) },
      { header: "Jenis", cell: (r) => <span className="text-slate-600">{s(r, "kind")}</span> },
      { header: "Hole", align: "right", cell: (r) => <span className="text-slate-600 tabular-nums">{n(r, "holes") ?? "—"}</span> },
      { header: "Par", align: "right", cell: (r) => <span className="text-slate-600 tabular-nums">{n(r, "par") ?? "—"}</span> },
      { header: "Desainer", cell: (r) => <span className="text-slate-600 text-[13px]">{s(r, "designer") || "—"}</span> },
      { header: "Akses", cell: (r) => <span className="text-slate-600 text-[13px]">{s(r, "membership") || "—"}</span> },
      { header: "Area", className: "max-w-[240px]", cell: (r) => <span className="text-slate-600 text-[13px]">{s(r, "area")}</span> },
    ],
  },
};

export default function AtlasSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = use(params);
  const cfg = SECTIONS[section];
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cfg) return;
    let alive = true;
    setLoading(true);
    setError(null);
    fetch(`${ATLAS_BASE}${cfg.endpoint}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((j) => {
        // Atlas API: /api/{gci,events,golf} pakai `rows`; /api/restaurants pakai `items`.
        const arr = Array.isArray(j.rows) ? j.rows : Array.isArray(j.items) ? j.items : [];
        if (alive) setRows(arr);
      })
      .catch((e) => alive && setError(`Gagal menarik data Atlas: ${e.message}`))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [cfg]);

  if (!cfg) {
    return (
      <main className="min-h-screen bg-[#f4f6fa] flex items-center justify-center p-10">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center max-w-md">
          <div className="text-[15px] font-semibold text-slate-700">Section tidak ditemukan</div>
          <p className="text-[13px] text-slate-500 mt-2">
            Section <code>{section}</code> tidak ada.
          </p>
          <Link href="/atlas" className="inline-block mt-4 text-[13px] font-medium" style={{ color: NAVY }}>
            ← Kembali ke Atlas
          </Link>
        </div>
      </main>
    );
  }

  return (
    <AtlasSection
      eyebrow={cfg.eyebrow}
      title={cfg.title}
      titleAccent={cfg.titleAccent}
      desc={cfg.desc}
      stats={cfg.stats(rows)}
      rows={rows}
      loading={loading}
      error={error}
      search={cfg.search}
      segmented={cfg.segmented}
      selects={cfg.selects}
      columns={cfg.columns}
      footer={cfg.footer}
    />
  );
}
