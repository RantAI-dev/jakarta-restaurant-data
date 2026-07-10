"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";

// =====================================================
// PANDUAN EXTEND (untuk yang baca kode ini nanti):
// =====================================================
// Tambah section baru (misal "hotel", "museum"):
//   1. SECTIONS di bawah (config endpoint + label + extras)
//   2. SECTIONS di /atlas/page.tsx (kartu di homepage Atlas)
//   3. Tambah API endpoint di root/app/api/<section>/route.ts
//
// Tambah field informative ke section existing (misal "phone", "email"):
//   → Tambah regex pattern di cfg.extraPatterns (section yang relevan).
//
// Rename field di data source (misal "cuisine" → "food_type"):
//   → Update regex di FRIENDLY_PATTERNS atau extraPatterns.
//
// Hapus field dari data source:
//   → find() return undefined, filter(Boolean) skip otomatis, no crash.
// =====================================================

const NAVY = "#0f3d7a";
const ATLAS_BASE = "http://localhost:3030";

// Pattern auto-detect 3 kolom "ramah" (sesuai Plan 6 spec):
// nama, kota/lokasi, kategori. Pakai \b word boundary supaya tidak
// match unintended field (misal "lastname" tidak match "name").
const FRIENDLY_PATTERNS = {
  name: /\b(name|nama|title|judul)\b/i,
  loc:  /\b(city|kota|alamat|address|area|wilayah|location|lokasi|venue)\b/i,
  cat:  /\b(category|kategori|jenis|kind|type|tier|tag)\b/i,
};

// Fallback untuk field teknis yang harus disembunyikan kalau core pattern
// gagal (misal dataset baru tanpa field "nama").
const TECHNICAL_RE = /^id|_id|created|updated|_at|_token|slug$/i;

type SectionConfig = {
  endpoint: string;
  label: string;
  // Extras = kolom informatif tambahan spesifik section ini (1-3 pola regex).
  extraPatterns: RegExp[];
};

const SECTIONS: Record<string, SectionConfig> = {
  restoran: {
    endpoint: "/api/gci",
    label: "Restoran & Kafe GCI",
    // Restoran: tampilkan cuisine (jenis masakan), rating, priceRange.
    extraPatterns: [/\bcuisine\b/i, /\brating\b/i, /\bpriceRange\b/i],
  },
  pertunjukan: {
    endpoint: "/api/events",
    label: "Pertunjukan & Budaya",
    // Pertunjukan: date (tanggal event) + visitors (jumlah pengunjung).
    extraPatterns: [/\bdate\b/i, /\bvisitors\b/i],
  },
  golf: {
    endpoint: "/api/golf",
    label: "Lapangan Golf",
    // Golf: holes (jumlah hole), par, designer.
    extraPatterns: [/\bholes\b/i, /\bpar\b/i, /\bdesigner\b/i],
  },
};

/**
 * Auto-detect kolom "ramah" + extras dari row pertama dataset.
 * - 3 core (nama, lokasi, kategori) selalu dicari duluan.
 * - Extras per section ditambahkan setelahnya.
 * - Fallback: kalau core tidak ketemu, pakai key non-teknis pertama.
 */
function pickFriendlyColumns(
  rows: Record<string, unknown>[],
  extraPatterns: RegExp[]
): string[] {
  if (!rows.length) return [];
  const keys = Object.keys(rows[0]);

  // Helper: cari key pertama yang match regex, fallback ke non-teknis pertama.
  const pickWithFallback = (re: RegExp): string | undefined => {
    const found = keys.find((k) => re.test(k));
    if (found) return found;
    return keys.find((k) => !TECHNICAL_RE.test(k));
  };

  // 3 core: nama, lokasi, kategori (urutan tetap sesuai spec).
  const name = pickWithFallback(FRIENDLY_PATTERNS.name);
  const loc = pickWithFallback(FRIENDLY_PATTERNS.loc);
  const cat = pickWithFallback(FRIENDLY_PATTERNS.cat);

  // Extras per section.
  const extras: string[] = [];
  for (const pat of extraPatterns) {
    const found = keys.find((k) => pat.test(k));
    if (found) extras.push(found);
  }

  // Rakit, drop undefined, drop duplikat (extras mungkin overlap dengan core).
  return Array.from(new Set([name, loc, cat, ...extras].filter(Boolean))) as string[];
}

export default function AtlasSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = use(params);
  const cfg = SECTIONS[section];

  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

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
      .then((json) => {
        if (!alive) return;
        setRows(Array.isArray(json.rows) ? json.rows : []);
      })
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [cfg]);

  // Auto-detect kolom "ramah" (3 core + extras) sekali per data load.
  const columns = useMemo(() => {
    if (!cfg) return [];
    return pickFriendlyColumns(rows, cfg.extraPatterns);
  }, [rows, cfg]);

  // Search: pakai kolom yang ditampilkan (supaya konsisten dengan yang visible).
  const filtered = useMemo(() => {
    if (!cfg) return [];
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((r) =>
      columns.some((k) => String(r[k] ?? "").toLowerCase().includes(term))
    );
  }, [rows, q, columns]);

  if (!cfg) {
    return (
      <main className="min-h-screen bg-[#f4f6fa] flex items-center justify-center p-10">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center max-w-md">
          <div className="text-[15px] font-semibold text-slate-700">
            Section tidak ditemukan
          </div>
          <p className="text-[13px] text-slate-500 mt-2">
            Section <code>{section}</code> tidak ada. Pilih dari katalog Atlas.
          </p>
          <Link
            href="/atlas"
            className="inline-block mt-4 text-[13px] font-medium"
            style={{ color: NAVY }}
          >
            ← Kembali ke Atlas
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f6fa]">
      <section
        style={{
          background: `linear-gradient(180deg, #0a2b57 0%, ${NAVY} 100%)`,
        }}
        className="text-white"
      >
        <div className="mx-auto max-w-[1320px] px-6 pt-8 pb-10">
          <Link
            href="/atlas"
            className="text-[12px] font-mono uppercase tracking-widest text-white/60 hover:text-white"
          >
            ← Jakarta Atlas
          </Link>
          <h1 className="mt-3 text-[28px] md:text-[36px] font-bold tracking-tight">
            {cfg.label}
          </h1>
          <p className="mt-2 text-white/70 max-w-[80ch] text-[14px]">
            Data sekunder pendataan lapangan, ditarik langsung dari Jakarta Atlas
            (<code>{ATLAS_BASE}{cfg.endpoint}</code>).
          </p>
          <div className="mt-4 text-[13px] text-white/80 tabular-nums">
            {loading
              ? "Memuat…"
              : `${filtered.length} / ${rows.length} baris · ${columns.length} kolom`}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1320px] px-6 py-8 pb-20">
        {error && (
          <div className="bg-white rounded-xl border border-red-200 p-8 text-center text-red-600">
            Gagal menarik data dari Atlas: {error}. Pastikan{" "}
            <code>{ATLAS_BASE}</code> jalan (<code>npm run dev</code> di root).
          </div>
        )}

        {!error && (
          <>
            <div className="flex items-center justify-between gap-3 mb-4">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={`Cari di ${cfg.label.toLowerCase()}…`}
                className="w-full max-w-sm rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-[14px] outline-none focus:border-[#0f3d7a] transition-colors"
              />
              <span className="text-[11px] text-slate-400">
                Kolom: {columns.map(humanize).join(" · ")}
              </span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-[14px] border-collapse">
                  <thead>
                    <tr
                      style={{ background: NAVY }}
                      className="text-white text-left text-[12px] uppercase tracking-wider"
                    >
                      <th className="px-4 py-3 font-semibold w-12">#</th>
                      {columns.map((k) => (
                        <th key={k} className="px-4 py-3 font-semibold">
                          {humanize(k)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r, i) => (
                      <tr
                        key={i}
                        className="border-t border-slate-100 hover:bg-slate-50 transition-colors align-top"
                      >
                        <td className="px-4 py-3 text-slate-400 tabular-nums">
                          {i + 1}
                        </td>
                        {columns.map((k) => (
                          <td
                            key={k}
                            className="px-4 py-3 text-slate-700"
                          >
                            {fmtCell(r[k])}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {!loading && filtered.length === 0 && (
                      <tr>
                        <td
                          colSpan={columns.length + 1}
                          className="px-4 py-12 text-center text-slate-400"
                        >
                          Tidak ada baris data.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function humanize(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function fmtCell(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (Array.isArray(v)) return v.join(", ");
  return String(v);
}