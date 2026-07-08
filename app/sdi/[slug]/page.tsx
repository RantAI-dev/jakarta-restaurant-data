"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";

const NAVY = "#0f3d7a";
const NAVY_DEEP = "#0a2b57";
const GOLD = "#e8a33d";

type Column = { key: string; desc: string | null; type: string | null };
type DatasetDetail = {
  slug: string;
  title: string;
  description: string;
  sumberData: string[];
  frekuensi: string | null;
  satuan: string | null;
  klasifikasi: string | null;
  kontak: string | null;
  author: string | null;
  columns: Column[];
  rows: Record<string, unknown>[];
  total: number;
};

// Kolom internal SDI yang disembunyikan (bukan data substansi).
const HIDDEN = new Set([
  "id",
  "user_id",
  "uid_upload",
  "batch_upload",
  "jadwal_rilis",
  "tanggal_upload",
  "tanggal_update",
  "created_at",
  "updated_at",
]);

function humanize(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function DatasetDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [data, setData] = useState<DatasetDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    let alive = true;
    fetch(`/api/sdi/${slug}`)
      .then((r) => r.json())
      .then((json) => {
        if (!alive) return;
        if (json.error) setError(json.error);
        else setData(json);
      })
      .catch(() => alive && setError("Gagal memuat data"));
    return () => {
      alive = false;
    };
  }, [slug]);

  // Kolom yang ditampilkan: pakai definisi komponen dari SDI; kalau kosong,
  // fallback ke kolom baris minus kolom internal.
  const columns = useMemo<Column[]>(() => {
    if (!data) return [];
    if (data.columns.length) return data.columns;
    const first = data.rows[0] ?? {};
    return Object.keys(first)
      .filter((k) => !HIDDEN.has(k))
      .map((k) => ({ key: k, desc: null, type: null }));
  }, [data]);

  const rows = useMemo(() => {
    if (!data) return [];
    const term = q.trim().toLowerCase();
    if (!term) return data.rows;
    return data.rows.filter((row) =>
      columns.some((c) =>
        String(row[c.key] ?? "").toLowerCase().includes(term)
      )
    );
  }, [data, q, columns]);

  return (
    <main className="min-h-screen bg-[#f4f6fa]">
      <header style={{ background: NAVY }} className="text-white">
        <div className="mx-auto max-w-[1320px] px-6 h-[76px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-jakarta.png"
              alt="Logo Jakarta"
              className="h-11 w-auto bg-white rounded-md p-1"
            />
            <div className="leading-tight">
              <div className="font-semibold tracking-tight text-[15px]">
                Dinas Pariwisata &amp; Ekonomi Kreatif
              </div>
              <div className="text-[12px] text-white/70">
                Provinsi DKI Jakarta · Dashboard Visualisasi Data
              </div>
            </div>
          </div>
          <Link
            href="/sdi"
            className="text-[13px] font-medium text-white/85 hover:text-white transition-colors"
          >
            ← Katalog Data
          </Link>
        </div>
      </header>

      <section
        style={{
          background: `linear-gradient(180deg, ${NAVY_DEEP} 0%, ${NAVY} 100%)`,
        }}
        className="text-white"
      >
        <div className="mx-auto max-w-[1320px] px-6 pt-7 pb-10">
          <Link
            href="/sdi"
            className="text-[12px] font-mono uppercase tracking-widest text-white/60 hover:text-white"
          >
            ← Katalog Pariwisata &amp; Ekraf
          </Link>
          <h1 className="mt-3 text-[26px] md:text-[32px] font-bold tracking-tight max-w-[30ch]">
            {data?.title ?? humanize(slug)}
          </h1>
          {data?.description && (
            <p className="mt-2 text-white/75 max-w-[75ch] text-[15px]">
              {data.description}
            </p>
          )}
          {data && (
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-white/80">
              <Meta label="Baris data" value={String(data.total)} />
              {data.satuan && <Meta label="Satuan" value={data.satuan} />}
              {data.frekuensi && (
                <Meta label="Frekuensi" value={data.frekuensi} />
              )}
              {data.sumberData?.length > 0 && (
                <Meta label="Sumber" value={data.sumberData.join(", ")} />
              )}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-[1320px] px-6 py-8 pb-20">
        {error && (
          <div className="bg-white rounded-xl border border-red-200 p-8 text-center text-red-600">
            {error}. Coba{" "}
            <a
              href={`https://satudata.jakarta.go.id/open-data/${slug}`}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              buka di portal SDI ↗
            </a>
            .
          </div>
        )}

        {!data && !error && (
          <div className="bg-white rounded-xl border border-slate-200 p-16 text-center text-slate-400">
            Memuat data dari Satu Data Jakarta…
          </div>
        )}

        {data && (
          <>
            <div className="flex items-center justify-between gap-3 mb-4">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cari di dalam data…"
                className="w-full max-w-sm rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-[14px] outline-none focus:border-[#0f3d7a] transition-colors"
              />
              <span className="text-[13px] text-slate-500 tabular-nums whitespace-nowrap">
                {rows.length} / {data.rows.length} baris
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
                      {columns.map((c) => (
                        <th
                          key={c.key}
                          className="px-4 py-3 font-semibold"
                          title={c.desc ?? undefined}
                        >
                          {humanize(c.key)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr
                        key={i}
                        className="border-t border-slate-100 hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-4 py-3 text-slate-400 tabular-nums">
                          {i + 1}
                        </td>
                        {columns.map((c) => (
                          <td
                            key={c.key}
                            className="px-4 py-3 text-slate-700 tabular-nums"
                          >
                            {fmtCell(row[c.key])}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {rows.length === 0 && (
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

            <p className="text-[12px] text-slate-400 mt-4">
              Sumber: Satu Data Indonesia — Jakarta ·{" "}
              <a
                href={`https://satudata.jakarta.go.id/open-data/${slug}`}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                lihat di portal ↗
              </a>
            </p>
          </>
        )}
      </section>
    </main>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <span>
      <span className="text-white/50 uppercase text-[11px] tracking-wider">
        {label}:{" "}
      </span>
      <span className="font-medium" style={{ color: GOLD }}>
        {value}
      </span>
    </span>
  );
}

function fmtCell(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  const s = String(v);
  // Format angka besar biar kebaca (mis. rupiah).
  if (/^\d{4,}$/.test(s)) {
    const n = Number(s);
    if (!isNaN(n) && s.length > 4) return n.toLocaleString("id-ID");
  }
  return s;
}
