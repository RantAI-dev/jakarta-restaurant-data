import { NextResponse } from "next/server";

const BACKEND = "https://satudata.jakarta.go.id/backend/api/v2/satudata";

async function post(ep: string, body: unknown, signal?: AbortSignal) {
  const res = await fetch(`${BACKEND}/${ep}`, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${ep} ${res.status}`);
  return res.json();
}

type Komponen = {
  header_komponen: string;
  tipe_data_komponen?: string;
  desc_komponen?: string;
};

/**
 * Detail + isi tabel satu dataset SDI (Dinas Pariwisata).
 * Menggabungkan /detail (metadata + definisi kolom) dan /get-table-data (baris).
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);

  try {
    const detail = await post(
      "detail",
      {
        kategori: "dataset",
        page_url: slug,
        data_no: 1,
        per_page: 10,
        table_params: {
          page: 1,
          per_page: 10,
          sort_field: null,
          sort_order: null,
          filters: {},
        },
      },
      controller.signal
    );

    const table = await post(
      "get-table-data",
      {
        page_url: slug,
        kategori: "dataset",
        page: 1,
        per_page: 1000,
        sort_field: null,
        sort_order: "asc",
        filters: {},
      },
      controller.signal
    );
    clearTimeout(timer);

    const meta = detail?.data ?? {};
    const komponen: Komponen[] = Array.isArray(meta.komponen_data_table)
      ? meta.komponen_data_table
      : [];

    let tags: string[] = [];
    try {
      tags = JSON.parse(meta.tag || "[]");
    } catch {}

    return NextResponse.json({
      slug,
      title: meta.title ?? slug,
      description: meta.desc ?? "",
      sumberData: meta.sumber_data ?? [],
      frekuensi: meta.frekuensi_penerbitan ?? null,
      satuan: meta.satuan ?? null,
      klasifikasi: meta.klasifikasi_data ?? null,
      kontak: meta.kontak ?? null,
      author: meta.author ?? null,
      periodeData: detail?.periodeData ?? null,
      lastUpdate: detail?.lastUpdatefiledata ?? null,
      columns: komponen.map((k) => ({
        key: k.header_komponen,
        desc: k.desc_komponen ?? null,
        type: k.tipe_data_komponen ?? null,
      })),
      rows: Array.isArray(table?.data) ? table.data : [],
      total: table?.total ?? 0,
      files: detail?.filedata ?? [],
    });
  } catch (e) {
    clearTimeout(timer);
    return NextResponse.json(
      { error: "Gagal mengambil data dari SDI", detail: String(e) },
      { status: 502 }
    );
  }
}
