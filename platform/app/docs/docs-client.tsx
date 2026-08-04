"use client";

import { useEffect, useRef, useState } from "react";

/* ============================================================
   Dokumentasi REST API — Platform Data Dispar DKI Jakarta.
   Satu halaman referensi: sidebar scroll-spy, contoh cURL +
   respons JSON dengan tombol salin, tabel parameter.
   ============================================================ */

const BASE_URL = "https://dispar.rantai.dev";

/* ---------- data endpoint (sumber kebenaran: app/api/**) ---------- */

type Param = {
  name: string;
  in: "path" | "query" | "header";
  type: string;
  required?: boolean;
  desc: string;
};

type Endpoint = {
  id: string;
  method: "GET" | "POST";
  altMethod?: "GET" | "POST";
  path: string;
  title: string;
  desc: string;
  auth?: string;
  cache?: string;
  params: Param[];
  curl: string;
  response: string;
  responseNote?: string;
  tryPath?: string;
  errors?: { code: string; when: string }[];
};

const ENDPOINTS: Endpoint[] = [
  {
    id: "katalog",
    method: "GET",
    path: "/api/sdi",
    title: "Katalog dataset",
    desc: "Mengembalikan katalog dataset primer Dinas Pariwisata & Ekonomi Kreatif yang terdaftar di Satu Data Indonesia (SDI) Jakarta. Default membaca dari database platform; jika kosong, jatuh ke snapshot statis.",
    cache: "CDN 24 jam · stale-while-revalidate 7 hari",
    params: [
      {
        name: "live",
        in: "query",
        type: "0 | 1",
        desc: "Jika 1, katalog diambil langsung dari API SDI (timeout 20 detik). Gagal → otomatis jatuh ke database/snapshot.",
      },
    ],
    curl: `curl ${BASE_URL}/api/sdi`,
    response: `{
  "source": "db",
  "count": 182,
  "datasets": [
    {
      "id": 3244,
      "title": "Data Jumlah Kunjungan Wisatawan Mancanegara",
      "description": "Dataset ini berisi jumlah kunjungan wisman …",
      "slug": "data-jumlah-kunjungan-wisatawan-mancanegara",
      "tags": ["pariwisata", "wisman"],
      "views": 1042,
      "datasetCount": 12,
      "createdAt": "2023-04-11T03:12:00.000Z",
      "updatedAt": "2025-11-02T08:40:00.000Z"
    }
  ]
}`,
    responseNote:
      "source bernilai db (database platform), snapshot (cadangan statis), atau live (langsung dari SDI).",
    tryPath: "/api/sdi",
  },
  {
    id: "detail",
    method: "GET",
    path: "/api/sdi/{slug}",
    title: "Detail & baris data",
    desc: "Metadata lengkap plus isi tabel satu dataset — terpaginasi (offset/limit) dan mendukung pencarian sisi server, sehingga dataset puluhan ribu baris tetap ringan. Dataset yang belum tersinkron di database akan di-fetch langsung dari SDI.",
    cache: "CDN 24 jam (dinonaktifkan saat memakai parameter q)",
    params: [
      {
        name: "slug",
        in: "path",
        type: "string",
        required: true,
        desc: "Slug dataset dari katalog, mis. data-jumlah-kunjungan-wisatawan-mancanegara.",
      },
      {
        name: "offset",
        in: "query",
        type: "integer ≥ 0",
        desc: "Baris pertama yang diambil. Default 0.",
      },
      {
        name: "limit",
        in: "query",
        type: "integer 1–200",
        desc: "Jumlah baris per halaman. Default 50, maksimum 200.",
      },
      {
        name: "q",
        in: "query",
        type: "string",
        desc: "Kata kunci pencarian — dicocokkan ke seluruh kolom (ILIKE) di sisi server.",
      },
    ],
    curl: `curl "${BASE_URL}/api/sdi/data-jumlah-kunjungan-wisatawan-mancanegara?offset=0&limit=50"`,
    response: `{
  "source": "db",
  "slug": "data-jumlah-kunjungan-wisatawan-mancanegara",
  "title": "Data Jumlah Kunjungan Wisatawan Mancanegara",
  "description": "Dataset ini berisi …",
  "sumberData": ["Dinas Pariwisata dan Ekonomi Kreatif"],
  "frekuensi": "Bulanan",
  "satuan": "Orang",
  "klasifikasi": "Terbuka",
  "kontak": "disparekraf@jakarta.go.id",
  "author": "Dinas Pariwisata dan Ekonomi Kreatif",
  "columns": [
    { "key": "periode_data", "desc": "Periode data", "type": "varchar" },
    { "key": "jumlah_kunjungan", "desc": "Jumlah kunjungan", "type": "bigint" }
  ],
  "rows": [
    { "periode_data": "2025-01", "jumlah_kunjungan": 186220 }
  ],
  "total": 3120,
  "count": 3120,
  "offset": 0,
  "limit": 50
}`,
    responseNote:
      "total = seluruh baris dataset; count = baris yang cocok dengan filter q (dipakai untuk paginasi).",
    tryPath: "/api/sdi/data-jumlah-kunjungan-wisatawan-mancanegara?limit=5",
    errors: [{ code: "502", when: "Dataset tidak ada di database dan fetch live ke SDI gagal." }],
  },
  {
    id: "export",
    method: "GET",
    path: "/api/sdi/{slug}/export",
    title: "Ekspor CSV / XLSX",
    desc: "Mengunduh seluruh baris satu dataset (tanpa paginasi) sebagai berkas CSV atau Excel. CSV disertai BOM UTF-8 agar karakter beraksen terbaca benar di Excel.",
    params: [
      {
        name: "slug",
        in: "path",
        type: "string",
        required: true,
        desc: "Slug dataset dari katalog.",
      },
      {
        name: "format",
        in: "query",
        type: "csv | xlsx",
        desc: "Format berkas. Default csv.",
      },
    ],
    curl: `curl -OJ "${BASE_URL}/api/sdi/data-jumlah-kunjungan-wisatawan-mancanegara/export?format=xlsx"`,
    response: `HTTP/1.1 200 OK
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="data-jumlah-kunjungan-wisatawan-mancanegara.xlsx"
Cache-Control: no-store`,
    responseNote: "Respons berupa berkas unduhan (attachment), bukan JSON.",
    errors: [{ code: "404", when: "Dataset tidak ditemukan / gagal diambil dari SDI." }],
  },
  {
    id: "sync",
    method: "POST",
    path: "/api/admin/sync",
    title: "Sinkronisasi dataset",
    desc: "Menarik ulang satu dataset (atau semua) dari API SDI ke database platform. Endpoint internal — membutuhkan secret sinkronisasi.",
    auth: "Header x-sync-secret wajib dan harus sama dengan env SYNC_SECRET.",
    params: [
      {
        name: "x-sync-secret",
        in: "header",
        type: "string",
        required: true,
        desc: "Secret sinkronisasi internal.",
      },
      {
        name: "slug",
        in: "query",
        type: "string | all",
        required: true,
        desc: "Slug dataset yang disinkron, atau all untuk seluruh katalog (durasi panjang — gunakan hati-hati).",
      },
    ],
    curl: `curl -X POST "${BASE_URL}/api/admin/sync?slug=data-jumlah-kunjungan-wisatawan-mancanegara" \\
  -H "x-sync-secret: $SYNC_SECRET"`,
    response: `{
  "synced": 1,
  "total": 1,
  "results": [
    { "slug": "data-jumlah-kunjungan-wisatawan-mancanegara", "rows": 3120 }
  ]
}`,
    errors: [
      { code: "400", when: "Parameter slug kosong." },
      { code: "401", when: "Header x-sync-secret salah atau tidak dikirim." },
    ],
  },
  {
    id: "report",
    method: "GET",
    altMethod: "POST",
    path: "/api/admin/report",
    title: "Bangun ulang report",
    desc: "Membangun ulang snapshot report (kesiapan indikator GCI/GPCI, ringkasan baris dataset) dari data mentah, lalu me-revalidate halaman /gci dan /gpci. Jalur berat yang sengaja dipisah dari request pengguna — dipanggil terjadwal atau manual.",
    auth: "Salah satu: Authorization: Bearer $CRON_SECRET (cron) atau header x-sync-secret (manual).",
    params: [
      {
        name: "Authorization",
        in: "header",
        type: "Bearer <token>",
        desc: "Token cron terjadwal (env CRON_SECRET).",
      },
      {
        name: "x-sync-secret",
        in: "header",
        type: "string",
        desc: "Alternatif otentikasi manual (env SYNC_SECRET).",
      },
    ],
    curl: `curl -X POST ${BASE_URL}/api/admin/report \\
  -H "x-sync-secret: $SYNC_SECRET"`,
    response: `{
  "ok": true,
  "indicators": 28,
  "rowSnapshots": 98
}`,
    errors: [
      { code: "401", when: "Tidak ada kredensial valid (cron maupun manual)." },
      { code: "500", when: "buildReports() gagal — detail di properti error." },
    ],
  },
];

/* ---------- sorotan sintaks ringan (escape dulu, lalu regex) ---------- */

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function hlJson(code: string) {
  return esc(code)
    .replace(/"([^"]*)"(\s*:)/g, "<span class='tok-key'>\"$1\"</span>$2")
    .replace(/:(\s*)"([^"]*)"/g, ":$1<span class='tok-str'>\"$2\"</span>")
    .replace(/\[(\s*)"([^"]*)"/g, "[$1<span class='tok-str'>\"$2\"</span>")
    .replace(/,(\s*)"([^"]*)"(?!\s*:)/g, ",$1<span class='tok-str'>\"$2\"</span>")
    .replace(/: (-?\d[\d.]*)/g, ": <span class='tok-num'>$1</span>")
    .replace(/\b(true|false|null)\b/g, "<span class='tok-num'>$1</span>");
}

function hlShell(code: string) {
  return esc(code)
    .replace(/^curl/gm, "<span class='tok-cmd'>curl</span>")
    .replace(/ (-[A-Za-z]+|--[a-z-]+)/g, " <span class='tok-flag'>$1</span>")
    .replace(/"([^"]*)"/g, "<span class='tok-str'>\"$1\"</span>")
    .replace(/\$[A-Z_]+/g, "<span class='tok-num'>$&</span>")
    .replace(/(https?:\/\/[^\s"'<]+)/g, "<span class='tok-url'>$1</span>");
}

function hlHttp(code: string) {
  return esc(code)
    .replace(/^(HTTP\/[\d.]+) (\d+) (.*)$/m, "<span class='tok-cmd'>$1</span> <span class='tok-num'>$2 $3</span>")
    .replace(/^([A-Za-z-]+):/gm, "<span class='tok-key'>$1</span>:");
}

/* ---------- komponen kecil ---------- */

function MethodBadge({ method, small }: { method: "GET" | "POST"; small?: boolean }) {
  const get = method === "GET";
  return (
    <span
      className={`inline-flex items-center rounded-md font-semibold tracking-wide ${
        small ? "px-1.5 py-0.5 text-[10px]" : "px-2.5 py-1 text-[12px]"
      }`}
      style={
        get
          ? { background: "rgba(22,128,90,0.1)", color: "#0f7a54", border: "1px solid rgba(22,128,90,0.25)" }
          : { background: "var(--accent-bg)", color: "var(--accent-deep)", border: "1px solid var(--accent-ring)" }
      }
    >
      {method}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        });
      }}
      aria-label="Salin ke clipboard"
      className="press-scale inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium transition-colors"
      style={{ color: copied ? "#7fd6ab" : "#a89c8d", background: "rgba(255,255,255,0.06)" }}
    >
      {copied ? (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M20 6L9 17l-5-5" /></svg>
          Tersalin
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
          Salin
        </>
      )}
    </button>
  );
}

function CodeBlock({
  label,
  code,
  html,
}: {
  label: string;
  code: string;
  html: string;
}) {
  return (
    <div className="docs-code overflow-hidden rounded-xl" style={{ background: "#1f1a15", border: "1px solid #2e2721" }}>
      <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: "1px solid #2e2721" }}>
        <span className="atlas-mono" style={{ color: "#8d8172" }}>{label}</span>
        <CopyButton text={code} />
      </div>
      <pre className="overflow-x-auto px-4 py-3.5 text-[12.5px] leading-[1.7]" style={{ fontFamily: "var(--font-mono)", color: "#e8e0d4" }}>
        <code dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </div>
  );
}

const IN_LABEL: Record<Param["in"], string> = {
  path: "path",
  query: "query",
  header: "header",
};

function ParamTable({ params }: { params: Param[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-hairline bg-canvas">
      <table className="w-full text-left text-[13px]">
        <thead>
          <tr className="border-b border-hairline">
            <th className="px-4 py-2.5 font-semibold text-ink">Parameter</th>
            <th className="px-4 py-2.5 font-semibold text-ink">Letak</th>
            <th className="px-4 py-2.5 font-semibold text-ink">Tipe</th>
            <th className="px-4 py-2.5 font-semibold text-ink">Keterangan</th>
          </tr>
        </thead>
        <tbody>
          {params.map((p) => (
            <tr key={p.name + p.in} className="border-b border-divider last:border-0 align-top">
              <td className="px-4 py-3 whitespace-nowrap">
                <code className="rounded-md px-1.5 py-0.5 text-[12px]" style={{ fontFamily: "var(--font-mono)", background: "var(--paper-deep)", color: "var(--ink)" }}>
                  {p.name}
                </code>
                {p.required && (
                  <span className="ml-2 text-[10.5px] font-semibold uppercase tracking-wide" style={{ color: "var(--accent-deep)" }}>
                    wajib
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-ink-muted-48 whitespace-nowrap">{IN_LABEL[p.in]}</td>
              <td className="px-4 py-3 whitespace-nowrap" style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-muted-80)" }}>{p.type}</td>
              <td className="px-4 py-3 text-ink-muted-80">{p.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- halaman ---------- */

const NAV_SECTIONS = [
  { id: "pengantar", label: "Pengantar" },
  ...ENDPOINTS.map((e) => ({ id: e.id, label: e.title })),
  { id: "status", label: "Kode status" },
];

export function DocsClient() {
  const [active, setActive] = useState("pengantar");
  const spyRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const sections = NAV_SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => !!el
    );
    const visible = new Map<string, number>();
    spyRef.current = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (en.isIntersecting) visible.set(en.target.id, en.boundingClientRect.top);
          else visible.delete(en.target.id);
        }
        if (visible.size) {
          const top = [...visible.entries()].sort((a, b) => a[1] - b[1])[0][0];
          setActive(top);
        }
      },
      { rootMargin: "-96px 0px -55% 0px", threshold: 0 }
    );
    sections.forEach((el) => spyRef.current?.observe(el));
    return () => spyRef.current?.disconnect();
  }, []);

  return (
    <main className="min-h-screen bg-paper">
      <style>{`
        .tok-key { color: #f4a06b; }
        .tok-str { color: #d9c98f; }
        .tok-num { color: #8fd3b6; }
        .tok-cmd { color: #f4a06b; font-weight: 600; }
        .tok-flag { color: #b8ab99; }
        .tok-url { color: #9fc4e8; }
      `}</style>

      {/* ===== Hero gelap dengan aksen oranye ===== */}
      <section className="bg-hero text-white">
        <div className="mx-auto max-w-[1320px] px-6 pt-14 pb-16">
          <div className="atlas-mono mb-5" style={{ color: "var(--accent-soft)" }}>
            Dokumentasi · REST API · v1
          </div>
          <h1 className="atlas-display max-w-[720px]">
            API Data Pariwisata <span className="atlas-italic" style={{ color: "var(--accent-soft)" }}>&amp; Ekonomi Kreatif</span>
          </h1>
          <p className="atlas-lead mt-5 max-w-[640px]" style={{ color: "rgba(255,255,255,0.72)" }}>
            Akses terprogram ke katalog dataset Dinas Pariwisata &amp; Ekonomi Kreatif
            Provinsi DKI Jakarta — katalog, isi tabel terpaginasi, pencarian, dan
            ekspor CSV/XLSX. Seluruh respons berformat JSON.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <div
              className="flex items-center gap-3 rounded-xl px-4 py-2.5"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)" }}
            >
              <span className="atlas-mono" style={{ color: "#8d8172" }}>Base URL</span>
              <code className="text-[13.5px]" style={{ fontFamily: "var(--font-mono)", color: "#f0e9df" }}>
                {BASE_URL}
              </code>
              <CopyButton text={BASE_URL} />
            </div>
            {[
              "5 endpoint",
              "JSON",
              "Baca publik tanpa autentikasi",
            ].map((t) => (
              <span
                key={t}
                className="rounded-full px-3.5 py-1.5 text-[12px] font-medium"
                style={{ background: "rgba(237,107,35,0.16)", border: "1px solid rgba(237,107,35,0.35)", color: "#f7c39e" }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Isi: sidebar + konten ===== */}
      <div className="mx-auto max-w-[1320px] px-6 py-12 lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
        {/* Sidebar */}
        <aside className="mb-10 lg:mb-0">
          <nav className="lg:sticky lg:top-[98px] flex flex-row flex-wrap gap-1 lg:flex-col">
            <div className="atlas-mono mb-2 hidden w-full lg:block" style={{ color: "var(--body-muted)" }}>
              Di halaman ini
            </div>
            {NAV_SECTIONS.map((s) => {
              const ep = ENDPOINTS.find((e) => e.id === s.id);
              const isActive = active === s.id;
              return (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] transition-colors"
                  style={
                    isActive
                      ? { background: "var(--accent-bg)", color: "var(--accent-deep)", fontWeight: 600 }
                      : { color: "var(--ink-muted-48)" }
                  }
                >
                  {ep && <MethodBadge method={ep.method} small />}
                  {s.label}
                </a>
              );
            })}
            <a
              href="/sdi"
              className="mt-4 hidden items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium lg:flex"
              style={{ color: "var(--link)" }}
            >
              Jelajahi katalog
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </a>
          </nav>
        </aside>

        {/* Konten */}
        <div className="min-w-0 space-y-14">
          {/* Pengantar */}
          <section id="pengantar" className="scroll-mt-[98px]">
            <h2 className="atlas-display-md text-ink">Pengantar</h2>
            <div className="apple-body mt-4 max-w-[760px] space-y-4 text-ink-muted-80">
              <p>
                API ini menyajikan data yang sama dengan yang tampil di platform —
                bersumber dari <strong className="text-ink">Satu Data Indonesia (SDI) Jakarta</strong> dan
                dataset sekunder internal Dinas, tersinkron ke database platform.
                Semua endpoint baca bersifat <strong className="text-ink">publik tanpa autentikasi</strong>;
                hanya endpoint <code className="rounded px-1 py-0.5 text-[13px]" style={{ fontFamily: "var(--font-mono)", background: "var(--paper-deep)" }}>/api/admin/*</code> yang
                membutuhkan secret internal.
              </p>
              <p>
                Respons katalog dan detail di-cache di CDN selama 24 jam
                (<code className="text-[13px]" style={{ fontFamily: "var(--font-mono)" }}>s-maxage=86400</code>,{" "}
                <code className="text-[13px]" style={{ fontFamily: "var(--font-mono)" }}>stale-while-revalidate=604800</code>) —
                gunakan seperlunya dan hindari polling agresif. Setiap respons
                menyertakan bidang <code className="text-[13px]" style={{ fontFamily: "var(--font-mono)" }}>source</code> yang
                menunjukkan asal data: <em>db</em>, <em>snapshot</em>, atau <em>live</em>.
              </p>
            </div>
            <div className="mt-6">
              <CodeBlock
                label="Contoh tercepat"
                code={`curl ${BASE_URL}/api/sdi | jq ".count"`}
                html={hlShell(`curl ${BASE_URL}/api/sdi | jq ".count"`)}
              />
            </div>
          </section>

          {/* Endpoint */}
          {ENDPOINTS.map((ep) => (
            <section key={ep.id} id={ep.id} className="scroll-mt-[98px]">
              <div className="flex flex-wrap items-center gap-3">
                <MethodBadge method={ep.method} />
                {ep.altMethod && <MethodBadge method={ep.altMethod} />}
                <code className="text-[15px] font-semibold text-ink" style={{ fontFamily: "var(--font-mono)" }}>
                  {ep.path}
                </code>
              </div>
              <h2 className="atlas-display-md mt-3 text-ink">{ep.title}</h2>
              <p className="apple-body mt-3 max-w-[760px] text-ink-muted-80">{ep.desc}</p>

              {(ep.auth || ep.cache) && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {ep.auth && (
                    <div
                      className="flex items-start gap-2 rounded-xl px-3.5 py-2.5 text-[13px]"
                      style={{ background: "var(--accent-bg)", border: "1px solid var(--accent-ring)", color: "var(--accent-deep)" }}
                    >
                      <svg className="mt-0.5 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                      <span><strong>Autentikasi.</strong> {ep.auth}</span>
                    </div>
                  )}
                  {ep.cache && (
                    <div className="flex items-center gap-2 rounded-xl border border-hairline bg-canvas px-3.5 py-2.5 text-[13px] text-ink-muted-48">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                      Cache: {ep.cache}
                    </div>
                  )}
                </div>
              )}

              {ep.params.length > 0 && (
                <div className="mt-6">
                  <div className="apple-caption-strong mb-2.5 text-ink">Parameter</div>
                  <ParamTable params={ep.params} />
                </div>
              )}

              <div className="mt-6 grid gap-4 xl:grid-cols-2">
                <CodeBlock label="Permintaan" code={ep.curl} html={hlShell(ep.curl)} />
                <CodeBlock
                  label={ep.id === "export" ? "Respons (header)" : "Respons 200"}
                  code={ep.response}
                  html={ep.id === "export" ? hlHttp(ep.response) : hlJson(ep.response)}
                />
              </div>
              {ep.responseNote && (
                <p className="apple-caption mt-3 max-w-[760px]">{ep.responseNote}</p>
              )}

              {ep.errors && ep.errors.length > 0 && (
                <div className="mt-5 overflow-hidden rounded-xl border border-hairline bg-canvas">
                  {ep.errors.map((er) => (
                    <div key={er.code} className="flex items-start gap-3 border-b border-divider px-4 py-2.5 text-[13px] last:border-0">
                      <code className="mt-px shrink-0 rounded-md px-1.5 py-0.5 text-[12px] font-semibold" style={{ fontFamily: "var(--font-mono)", background: "rgba(190,40,40,0.08)", color: "#b03030" }}>
                        {er.code}
                      </code>
                      <span className="text-ink-muted-80">{er.when}</span>
                    </div>
                  ))}
                </div>
              )}

              {ep.tryPath && (
                <a
                  href={ep.tryPath}
                  target="_blank"
                  rel="noreferrer"
                  className="press-scale mt-5 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold text-white"
                  style={{ background: "var(--accent)" }}
                >
                  Coba di browser
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M7 17L17 7M7 7h10v10" /></svg>
                </a>
              )}
            </section>
          ))}

          {/* Kode status */}
          <section id="status" className="scroll-mt-[98px]">
            <h2 className="atlas-display-md text-ink">Kode status</h2>
            <p className="apple-body mt-3 max-w-[760px] text-ink-muted-80">
              API memakai kode status HTTP standar. Galat selalu dikembalikan sebagai
              JSON dengan properti <code className="text-[13px]" style={{ fontFamily: "var(--font-mono)" }}>error</code>{" "}
              (dan <code className="text-[13px]" style={{ fontFamily: "var(--font-mono)" }}>detail</code> bila tersedia).
            </p>
            <div className="mt-5 overflow-hidden rounded-xl border border-hairline bg-canvas">
              {[
                ["200", "Berhasil."],
                ["400", "Parameter tidak valid atau kurang (mis. slug kosong pada sync)."],
                ["401", "Kredensial admin salah / tidak dikirim."],
                ["404", "Dataset tidak ditemukan (ekspor)."],
                ["500", "Kesalahan internal saat membangun report."],
                ["502", "Sumber data hulu (SDI) tidak dapat dijangkau."],
              ].map(([code, when]) => (
                <div key={code} className="flex items-start gap-3 border-b border-divider px-4 py-2.5 text-[13px] last:border-0">
                  <code className="mt-px w-10 shrink-0 rounded-md px-1.5 py-0.5 text-center text-[12px] font-semibold" style={{ fontFamily: "var(--font-mono)", background: code === "200" ? "rgba(22,128,90,0.1)" : "rgba(190,40,40,0.08)", color: code === "200" ? "#0f7a54" : "#b03030" }}>
                    {code}
                  </code>
                  <span className="text-ink-muted-80">{when}</span>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <CodeBlock
                label="Bentuk galat"
                code={`{
  "error": "Gagal mengambil data dari SDI",
  "detail": "AbortError: The operation was aborted"
}`}
                html={hlJson(`{
  "error": "Gagal mengambil data dari SDI",
  "detail": "AbortError: The operation was aborted"
}`)}
              />
            </div>
          </section>

          {/* Footer kecil */}
          <footer className="border-t border-hairline pt-6 pb-2 text-[12.5px] text-body-muted">
            Dinas Pariwisata &amp; Ekonomi Kreatif Provinsi DKI Jakarta · Sumber data:{" "}
            <a href="https://satudata.jakarta.go.id" target="_blank" rel="noreferrer" className="text-link">
              Satu Data Indonesia — Jakarta
            </a>
          </footer>
        </div>
      </div>
    </main>
  );
}
