import Link from "next/link";
import { inArray } from "drizzle-orm";
import { INDICATORS } from "@/lib/gci/indicators";
import { IndexContext } from "./IndexContext";
import { db, schema } from "@/lib/db";

const HERO =
  "radial-gradient(900px 320px at 88% -25%, rgba(237,107,35,0.28), transparent 62%), linear-gradient(160deg, #2a2521 0%, #16130f 100%)";
const GOLD = "#f0a13a";

type Source = { slug: string; title: string };

/** Kerangka halaman detail indikator: title band (sumber clickable + tier) + konteks indeks. */
export async function IndicatorShell({
  code,
  source,
  sources = [],
  children,
}: {
  code: string;
  /** Fallback teks (indikator gap tanpa dataset). */
  source?: string;
  /** Dataset sumber yang dipakai (clickable ke katalog). Boleh > 1. */
  sources?: Source[];
  children: React.ReactNode;
}) {
  const ind = INDICATORS.find((i) => i.code === code);
  const fw = ind?.framework ?? "GCI";

  // Tier (primer/sekunder) tiap dataset dari tabel `dataset`.
  const tierMap = new Map<string, string>();
  if (sources.length) {
    try {
      const rows = await db
        .select({ slug: schema.dataset.slug, tier: schema.dataset.tier })
        .from(schema.dataset)
        .where(inArray(schema.dataset.slug, sources.map((s) => s.slug)));
      for (const r of rows) tierMap.set(r.slug, r.tier);
    } catch {
      /* DB belum siap → default primer */
    }
  }

  return (
    <main className="min-h-screen bg-[#faf6f2]">
      <section
        style={{ background: HERO }}
        className="text-white"
      >
        <div className="mx-auto max-w-[1320px] px-6 pt-7 pb-10">
          <Link
            href={`/${fw.toLowerCase()}`}
            className="text-[12px] font-mono uppercase tracking-widest text-white/60 hover:text-white"
          >
            ← {fw} · {ind?.dimension}
          </Link>
          <h1 className="mt-3 text-[26px] md:text-[32px] font-bold tracking-tight max-w-[30ch]">
            {ind?.name ?? code}
          </h1>
          {ind?.definition && (
            <p className="mt-2 text-white/75 max-w-[75ch] text-[14px]">
              {ind.definition}
            </p>
          )}

          {sources.length > 0 ? (
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[12px]">
              <span className="text-white/50">
                Sumber data{sources.length > 1 ? ` (${sources.length})` : ""}:
              </span>
              {sources.map((s) => (
                <Link
                  key={s.slug}
                  href={`/sdi/${s.slug}`}
                  className="inline-flex items-center gap-1.5 hover:underline"
                  style={{ color: GOLD }}
                >
                  {s.title}
                  <TierBadge tier={tierMap.get(s.slug) ?? "primer"} />
                  <span aria-hidden className="text-white/40">
                    ↗
                  </span>
                </Link>
              ))}
            </div>
          ) : source ? (
            <p className="mt-2 text-[12px]" style={{ color: GOLD }}>
              Sumber: {source}
            </p>
          ) : null}
        </div>
      </section>

      <section className="mx-auto max-w-[1320px] px-6 py-8 pb-20 space-y-8">
        <IndexContext code={code} />
        {children}
      </section>
    </main>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const primer = tier !== "sekunder";
  return (
    <span
      className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded"
      style={{
        background: primer ? "rgba(255,255,255,0.18)" : "rgba(240, 161, 58,0.28)",
        color: "#fff",
      }}
    >
      {primer ? "Primer" : "Sekunder"}
    </span>
  );
}

/** Judul sub-section di dalam halaman indikator. */
export function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-[15px] font-semibold text-slate-800 mb-3">{title}</h2>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">{children}</div>
    </div>
  );
}
