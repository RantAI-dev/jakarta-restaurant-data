const BACKEND = "https://satudata.jakarta.go.id/backend/api/v2/satudata";

async function post(ep: string, body: unknown, signal?: AbortSignal) {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`${BACKEND}/${ep}`, {
        method: "POST",
        signal,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(`${ep} ${res.status}`);
      try {
        return JSON.parse(text);
      } catch {
        throw new Error(`${ep} non-JSON (SDI maintenance?)`);
      }
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
    }
  }
  throw lastErr;
}

export type SdiColumn = {
  key: string;
  label: string | null;
  type: string | null;
  description: string | null;
};

export type SdiDetail = {
  slug: string;
  title: string;
  description: string;
  sumberData: string[];
  frekuensi: string | null;
  satuan: string | null;
  klasifikasi: string | null;
  kontak: string | null;
  author: string | null;
  columns: SdiColumn[];
  rows: Record<string, unknown>[];
  total: number;
};

/** Ambil metadata + kolom + seluruh baris satu dataset dari SDI. */
export async function fetchSdiDetail(
  slug: string,
  signal?: AbortSignal
): Promise<SdiDetail> {
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
    signal
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
    signal
  );

  const meta = detail?.data ?? {};
  const komponen: {
    header_komponen: string;
    tipe_data_komponen?: string;
    desc_komponen?: string;
  }[] = Array.isArray(meta.komponen_data_table)
    ? meta.komponen_data_table
    : [];

  return {
    slug,
    title: meta.title ?? slug,
    description: meta.desc ?? "",
    sumberData: meta.sumber_data ?? [],
    frekuensi: meta.frekuensi_penerbitan ?? null,
    satuan: meta.satuan ?? null,
    klasifikasi: meta.klasifikasi_data ?? null,
    kontak: meta.kontak ?? null,
    author: meta.author ?? null,
    columns: komponen.map((k) => ({
      key: k.header_komponen,
      label: null,
      type: k.tipe_data_komponen ?? null,
      description: k.desc_komponen ?? null,
    })),
    rows: Array.isArray(table?.data) ? table.data : [],
    total: table?.total ?? 0,
  };
}