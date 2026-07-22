# GCI Pariwisata Dashboards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the 3 `/gci/pariwisata/*` indicator pages from raw tables into visual dashboards (KPI + charts on top, collapsible raw table below), reusing the existing chart kit.

**Architecture:** Each page is a server component that reads rows via `rowsFor(slug)`, aggregates with `lib/agg`, and renders house chart components (`KpiStat`, `BarBreakdown`, `Donut`, `LineTrend`). New shared building blocks live in `components/pariwisata/DashboardKit.tsx` + `lib/pariwisata/parse.ts`. Raw `SdiTable` moves into a `<details>` disclosure.

**Tech Stack:** Next.js 15 App Router (RSC), TypeScript, echarts (via existing `components/charts/*`), Tailwind. No test runner — verify with `tsc --noEmit`, `next build`, and HTTP/content checks against a dev server bound to the self-host DB.

**Spec:** `docs/superpowers/specs/2026-07-22-gci-pariwisata-dashboards-design.md`

**Constraints:** branch `deploy/portainer-selfhost`; never touch `main`/Vercel; keep theme white+orange, links blue; keep `FrameworkView`; skip Museum; headline numbers (156 / 2.767.622 / 0) stay literal in `PariwisataShell` (not derived from aggregates).

---

## Verification harness (used by every task)

Dev server must be bound to the self-host Postgres (internal datasets are not in local Neon):

```bash
PW=$(grep -oE "DB_PASSWORD=.*" /tmp/dispar_secrets.env | cut -d= -f2-)
cd /home/shiro/rantai/Dinas-Pariwisata/platform
# already running in background as task bo8pw0sho on :3031 with this DATABASE_URL
# if not running:  DATABASE_URL="postgres://dispar:${PW}@192.168.18.187:5433/dispar" npx next dev -p 3031
```

Typecheck (run after every task): `cd platform && npx tsc --noEmit` → expect no output.

---

## Task 1: Shared building blocks (DashboardKit + parse helpers)

**Files:**
- Create: `platform/components/pariwisata/DashboardKit.tsx`
- Create: `platform/lib/pariwisata/parse.ts`

- [ ] **Step 1: Create `lib/pariwisata/parse.ts`**

```ts
/** Helper murni untuk agregasi dashboard pariwisata. */

const KOTA_RE =
  /JAKARTA\s+(SELATAN|PUSAT|BARAT|TIMUR|UTARA)|KEP(?:ULAUAN|\.)?\s+SERIBU/i;

/** Ambil nama kota administrasi Jakarta dari alamat venue panjang. */
export function kotaFromAddress(addr: unknown): string {
  const s = String(addr ?? "").toUpperCase();
  const m = s.match(KOTA_RE);
  if (!m) return "Lainnya";
  if (/SERIBU/.test(m[0])) return "Kepulauan Seribu";
  return "Jakarta " + m[1][0] + m[1].slice(1).toLowerCase();
}

const BULAN = ["", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

/** YYYYMM / YYYY-MM / MM → "Mmm 'YY" atau "Mmm". */
export function bulanLabel(periode: unknown): string {
  const s = String(periode ?? "").replace(/[^0-9]/g, "");
  if (s.length >= 6) {
    const y = s.slice(0, 4);
    const m = parseInt(s.slice(4, 6), 10);
    return `${BULAN[m] ?? s.slice(4, 6)} '${y.slice(2)}`;
  }
  const m = parseInt(s, 10);
  return BULAN[m] ?? s;
}
```

- [ ] **Step 2: Create `components/pariwisata/DashboardKit.tsx`**

```tsx
import { KpiStat } from "@/components/charts/KpiStat";
import { SdiTable } from "@/components/SdiTable";

/** Palet oranye bertingkat untuk seri chart (dipakai lintas dashboard). */
export const PALETTE = ["#ed6b23", "#f0a13a", "#c2410c", "#f4a672", "#9a3412", "#fb923c"];

/** Strip KPI di bawah hero. */
export function KpiRow({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{children}</div>;
}

/** Satu KPI dengan opsi tren berwarna (▲ hijau / ▼ merah). */
export function Kpi({
  label,
  value,
  sub,
  delta,
}: {
  label: string;
  value: string | number;
  sub?: string;
  delta?: number | null;
}) {
  let subNode = sub;
  if (delta != null && Number.isFinite(delta)) {
    const up = delta >= 0;
    subNode = `${up ? "▲" : "▼"} ${Math.abs(delta).toLocaleString("id-ID", { maximumFractionDigits: 1 })}% ${sub ?? ""}`.trim();
  }
  return <KpiStat label={label} value={value} sub={subNode} />;
}

/** Kartu putih pembungkus satu grafik. */
export function ChartCard({
  title,
  sub,
  children,
  className = "",
}: {
  title: string;
  sub?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`utility-card p-5 transition-shadow hover:shadow-md ${className}`}>
      <div className="mb-3 border-l-2 pl-2.5" style={{ borderColor: "#ed6b23" }}>
        <div className="text-[14px] font-semibold text-ink">{title}</div>
        {sub && <div className="apple-fine text-ink-muted-48">{sub}</div>}
      </div>
      {children}
    </div>
  );
}

/** Grid penata ChartCard. */
export function ChartGrid({
  children,
  cols = 3,
}: {
  children: React.ReactNode;
  cols?: 2 | 3;
}) {
  return (
    <div className={`grid gap-4 ${cols === 2 ? "md:grid-cols-2" : "md:grid-cols-2 lg:grid-cols-3"}`}>
      {children}
    </div>
  );
}

/** Disclosure tabel data mentah (tertutup default). */
export function RawDataDisclosure({
  slug,
  title,
  count,
  columns,
}: {
  slug: string;
  title: string;
  count: number;
  columns?: string[];
}) {
  return (
    <details className="group rounded-xl border border-hairline bg-white/60">
      <summary className="cursor-pointer list-none px-5 py-3.5 text-[13px] font-semibold text-ink-muted-48 hover:text-ink">
        <span className="mr-1 inline-block transition-transform group-open:rotate-90">▸</span>
        Lihat data mentah · {title} ({count.toLocaleString("id-ID")} baris)
      </summary>
      <div className="border-t border-hairline p-5">
        <SdiTable slug={slug} columns={columns} />
      </div>
    </details>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `cd platform && npx tsc --noEmit`
Expected: no output.

- [ ] **Step 4: Commit**

```bash
cd /home/shiro/rantai/Dinas-Pariwisata
git add platform/components/pariwisata/DashboardKit.tsx platform/lib/pariwisata/parse.ts
git commit -m "feat(gci-pariwisata): dashboard building blocks (KpiRow, ChartCard, disclosure, parse)"
```

---

## Task 2: Seni Visual & Pertunjukan dashboard

**Files:**
- Modify: `platform/app/gci/pariwisata/seni-pertunjukan/page.tsx` (add dashboard above existing Section A/B; move raw table into disclosure)

- [ ] **Step 1: Add aggregation + KPI/charts at the top of the page**

Keep the existing `PariwisataShell` hero and the Section B artist matrix. Replace the Section A `SdiTable` usage with charts + a `RawDataDisclosure`. Add these imports and computations at the top of the component:

```tsx
import { rowsFor } from "@/lib/indicator-data";
import { groupCount, byPeriod, topN } from "@/lib/agg";
import { kotaFromAddress } from "@/lib/pariwisata/parse";
import { KpiRow, Kpi, ChartCard, ChartGrid, RawDataDisclosure, PALETTE } from "@/components/pariwisata/DashboardKit";
import { BarBreakdown } from "@/components/charts/BarBreakdown";
import { Donut } from "@/components/charts/Donut";

// inside the async component, before return:
let seni: Record<string, unknown>[] = [];
try { seni = (await rowsFor("data-seni-pertunjukan-dan-visual")) as Record<string, unknown>[]; }
catch { seni = []; }

const perTahun = byPeriod(seni, "periode_data");
const topVenue = topN(groupCount(seni, "nama_venue"), 10);
const perWilayah = groupCount(
  seni.map((r) => ({ wil: kotaFromAddress(r.lokasi_venue) })),
  "wil"
).sort((a, b) => b.value - a.value);
const venueUnik = new Set(seni.map((r) => r.nama_venue).filter(Boolean)).size;
```

- [ ] **Step 2: Render dashboard section (place directly after `<PariwisataShell ...>` opening, before Section A)**

```tsx
<section>
  <KpiRow>
    <Kpi label="Karya / kegiatan (resmi)" value="156" sub="jakarta.go.id · 2024" />
    <Kpi label="Event terdata (SDI)" value={seni.length} sub="data pendukung Dispar" />
    <Kpi label="Venue unik" value={venueUnik} />
    <Kpi label="Tahun tercakup" value={perTahun.length} />
  </KpiRow>
  <div className="mt-4">
    <ChartGrid>
      <ChartCard title="Event per tahun" sub="dari data pendukung SDI">
        <BarBreakdown data={perTahun} />
      </ChartCard>
      <ChartCard title="Top 10 venue tersibuk">
        <BarBreakdown data={topVenue} color={PALETTE[1]} />
      </ChartCard>
      <ChartCard title="Event per wilayah Jakarta">
        <Donut data={perWilayah} />
      </ChartCard>
    </ChartGrid>
  </div>
</section>
```

- [ ] **Step 3: Replace Section A `<SdiTable .../>` with disclosure**

Change the Section A body from the inline `<SdiTable slug="data-seni-pertunjukan-dan-visual" .../>` to:

```tsx
<RawDataDisclosure
  slug="data-seni-pertunjukan-dan-visual"
  title="Seni Visual & Pertunjukan"
  count={seni.length}
  columns={["nama_event", "nama_venue", "lokasi_venue", "periode_data"]}
/>
```

Keep the supporting-dataset links block and the entire Section B (artist matrix) unchanged.

- [ ] **Step 4: Typecheck**

Run: `cd platform && npx tsc --noEmit`
Expected: no output.

- [ ] **Step 5: Verify render (dev server on self-host DB)**

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3031/gci/pariwisata/seni-pertunjukan
curl -s http://localhost:3031/gci/pariwisata/seni-pertunjukan | grep -oE "Event per tahun|Top 10 venue|Event per wilayah|Venue unik|Billboard Year-End Top Artists" | sort | uniq -c
```
Expected: `200`, and all chart titles + the artist matrix heading present.

- [ ] **Step 6: Commit**

```bash
cd /home/shiro/rantai/Dinas-Pariwisata
git add platform/app/gci/pariwisata/seni-pertunjukan/page.tsx
git commit -m "feat(gci-pariwisata): seni-pertunjukan visual dashboard (KPI + charts + raw disclosure)"
```

---

## Task 3: Wisatawan Internasional dashboard

**Files:**
- Rewrite: `platform/app/gci/pariwisata/wisatawan-internasional/page.tsx`

- [ ] **Step 1: Rewrite the page as a dashboard**

```tsx
import { PariwisataShell, Section } from "@/components/pariwisata/PariwisataShell";
import { rowsFor } from "@/lib/indicator-data";
import { groupSum, byPeriod, topN, idNum } from "@/lib/agg";
import { KpiRow, Kpi, ChartCard, ChartGrid, RawDataDisclosure, PALETTE } from "@/components/pariwisata/DashboardKit";
import { BarBreakdown } from "@/components/charts/BarBreakdown";
import { Donut } from "@/components/charts/Donut";
import { LineTrend } from "@/components/charts/LineTrend";

export const revalidate = 86400;

const SLUG_NEGARA = "data-jumlah-wisatawan-mancanegara-berdasarkan-kebangsaan";
const SLUG_BULAN = "data-jumlah-kunjungan-dan-pertumbuhan-wisatawan-mancanegara-ke-indonesia-berdasarkan-bulan";
const SLUG_PINTU = "data-jumlah-kunjungan-wisman-ke-indonesia-berdasarkan-pintu-masuk-di-dki-jakarta";

export default async function WisatawanInternasionalPage() {
  const safe = async (s: string) => { try { return (await rowsFor(s)) as Record<string, unknown>[]; } catch { return []; } };
  const [negara, pintu] = await Promise.all([safe(SLUG_NEGARA), safe(SLUG_PINTU)]);

  const tren = byPeriod(negara, "periode_data", "jumlah_kunjungan");
  const topNegara = topN(groupSum(negara, "kebangsaan", "jumlah_kunjungan"), 10);
  const perPintu = groupSum(pintu, "pintu_masuk", "jumlah").sort((a, b) => b.value - a.value);
  const yoyVals = negara.map((r) => idNum(String(r.perbandingan_tahun_sebelumnya).replace(",", "."))).filter((n): n is number => n != null);
  const yoy = yoyVals.length ? yoyVals.reduce((a, b) => a + b, 0) / yoyVals.length : null;

  return (
    <PariwisataShell
      eyebrow="Cultural Experience · Wisatawan Internasional"
      title="Wisatawan Internasional"
      nilai="2.767.622"
      satuan="Wisatawan"
      tahun="2025"
      pj="Dinas Pariwisata & Ekraf"
      sumber="jakarta.bps.go.id"
      sumberHref="https://jakarta.bps.go.id"
    >
      <section>
        <KpiRow>
          <Kpi label="Wisman (resmi)" value="2.767.622" sub="BPS · 2025" />
          <Kpi label="Negara asal terbanyak" value={topNegara[0]?.label ?? "—"} sub={topNegara[0] ? topNegara[0].value.toLocaleString("id-ID") + " kunjungan" : undefined} />
          <Kpi label="Pintu masuk utama" value={perPintu[0]?.label ?? "—"} />
          <Kpi label="Rata-rata Δ YoY" value={yoy != null ? `${yoy.toFixed(1)}%` : "—"} delta={yoy} sub="antar-negara" />
        </KpiRow>
        <div className="mt-4">
          <ChartGrid>
            <ChartCard title="Tren bulanan kunjungan" sub="wisman per kebangsaan"><LineTrend data={tren} /></ChartCard>
            <ChartCard title="Top 10 negara asal"><BarBreakdown data={topNegara} unit=" kunjungan" /></ChartCard>
            <ChartCard title="Share per pintu masuk"><Donut data={perPintu} /></ChartCard>
          </ChartGrid>
        </div>
      </section>

      <Section title="Data mentah" desc="Sumber katalog SDI — Dinas Pariwisata & Ekraf.">
        <div className="space-y-3">
          <RawDataDisclosure slug={SLUG_NEGARA} title="Wisman per kebangsaan" count={negara.length} />
          <RawDataDisclosure slug={SLUG_BULAN} title="Wisman per bulan" count={480} />
          <RawDataDisclosure slug={SLUG_PINTU} title="Wisman per pintu masuk" count={pintu.length} />
        </div>
      </Section>
    </PariwisataShell>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `cd platform && npx tsc --noEmit`
Expected: no output.

- [ ] **Step 3: Verify render**

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3031/gci/pariwisata/wisatawan-internasional
curl -s http://localhost:3031/gci/pariwisata/wisatawan-internasional | grep -oE "Tren bulanan kunjungan|Top 10 negara asal|Share per pintu masuk|2.767.622" | sort | uniq -c
```
Expected: `200` and all three chart titles + headline present.

- [ ] **Step 4: Commit**

```bash
cd /home/shiro/rantai/Dinas-Pariwisata
git add platform/app/gci/pariwisata/wisatawan-internasional/page.tsx
git commit -m "feat(gci-pariwisata): wisatawan-internasional visual dashboard"
```

---

## Task 4: Kuliner (Michelin) dashboard

**Files:**
- Rewrite: `platform/app/gci/pariwisata/kuliner-michelin/page.tsx`

- [ ] **Step 1: Rewrite the page as a dashboard**

```tsx
import { PariwisataShell, Section } from "@/components/pariwisata/PariwisataShell";
import { rowsFor } from "@/lib/indicator-data";
import { groupCount, groupSum, topN } from "@/lib/agg";
import { KpiRow, Kpi, ChartCard, ChartGrid, RawDataDisclosure, PALETTE } from "@/components/pariwisata/DashboardKit";
import { BarBreakdown } from "@/components/charts/BarBreakdown";
import { Donut } from "@/components/charts/Donut";

export const revalidate = 86400;

const SLUG_RESTO = "data-resto-cafe-dan-cakes";
const SLUG_KEL = "jumlah-restoran-per-kelurahan";

export default async function KulinerMichelinPage() {
  const safe = async (s: string) => { try { return (await rowsFor(s)) as Record<string, unknown>[]; } catch { return []; } };
  const [resto, perKel] = await Promise.all([safe(SLUG_RESTO), safe(SLUG_KEL)]);

  const perWilayah = groupCount(resto, "wilayah").sort((a, b) => b.value - a.value);
  const topKec = topN(groupCount(resto, "kecamatan"), 10);
  const perWilAgg = groupSum(perKel, "wilayah", "jumlah").sort((a, b) => b.value - a.value);
  const kelurahanTercakup = new Set(resto.map((r) => r.kelurahan).filter(Boolean)).size;

  return (
    <PariwisataShell
      eyebrow="Cultural Experience · Penawaran Kuliner"
      title="Penawaran Kuliner (Michelin)"
      nilai="0"
      satuan="Restoran Michelin"
      tahun="2025"
      pj="Dinas Pariwisata & Ekraf"
      catatan="Belum ada Michelin Star di Jakarta (2025). Panduan Michelin belum masuk Indonesia; angka indikator = 0. Data pendukung di bawah menggambarkan basis kuliner Jakarta."
      sumber="Michelin Guide"
      sumberHref="https://guide.michelin.com"
    >
      <section>
        <KpiRow>
          <Kpi label="Restoran Michelin" value="0" sub="Michelin Guide · 2025" />
          <Kpi label="Resto terdata (SDI)" value={resto.length} sub="basis kuliner Jakarta" />
          <Kpi label="Kelurahan tercakup" value={kelurahanTercakup} />
          <Kpi label="Wilayah terpadat" value={perWilayah[0]?.label ?? "—"} />
        </KpiRow>
        <div className="mt-4">
          <ChartGrid>
            <ChartCard title="Resto per wilayah"><BarBreakdown data={perWilayah} /></ChartCard>
            <ChartCard title="Top 10 kecamatan"><BarBreakdown data={topKec} color={PALETTE[1]} /></ChartCard>
            <ChartCard title="Jumlah resto per wilayah" sub="dataset agregat kelurahan"><Donut data={perWilAgg} /></ChartCard>
          </ChartGrid>
        </div>
      </section>

      <Section title="Data mentah" desc="Sumber katalog SDI — Dinas Pariwisata & Ekraf.">
        <div className="space-y-3">
          <RawDataDisclosure slug={SLUG_RESTO} title="Restoran, Cafe & Cakes" count={resto.length} />
          <RawDataDisclosure slug={SLUG_KEL} title="Jumlah restoran per kelurahan" count={perKel.length} />
        </div>
      </Section>
    </PariwisataShell>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `cd platform && npx tsc --noEmit`
Expected: no output.

- [ ] **Step 3: Verify render**

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3031/gci/pariwisata/kuliner-michelin
curl -s http://localhost:3031/gci/pariwisata/kuliner-michelin | grep -oE "Resto per wilayah|Top 10 kecamatan|Jumlah resto per wilayah|Restoran Michelin" | sort | uniq -c
```
Expected: `200` and all three chart titles + the Michelin KPI present.

- [ ] **Step 4: Commit**

```bash
cd /home/shiro/rantai/Dinas-Pariwisata
git add platform/app/gci/pariwisata/kuliner-michelin/page.tsx
git commit -m "feat(gci-pariwisata): kuliner-michelin visual dashboard"
```

---

## Task 5: Final verification

- [ ] **Step 1: Production build**

Run: `cd platform && DATABASE_URL="postgres://dispar:${PW}@192.168.18.187:5433/dispar" npx next build`
Expected: build succeeds; all `/gci/pariwisata/*` routes compiled without errors.

- [ ] **Step 2: All pages 200 + card links intact**

```bash
for p in /gci /gci/pariwisata/seni-pertunjukan /gci/pariwisata/wisatawan-internasional /gci/pariwisata/kuliner-michelin; do
  echo "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3031$p)  $p"; done
curl -s http://localhost:3031/gci | grep -oE "/gci/pariwisata/(seni-pertunjukan|wisatawan-internasional|kuliner-michelin)" | sort -u
```
Expected: four `200`s; three card links present; Museum still unlinked.

- [ ] **Step 3: Manual visual check in browser** (user): open the 3 pages, confirm KPI strip, ≥3 charts each, artist matrix on seni, disclosures expand to show the raw table.

---

## Self-review notes

- **Spec coverage:** KpiRow/ChartCard/ChartGrid/RawDataDisclosure/PALETTE (Task 1) ✓; parse helpers (Task 1) ✓; seni charts + kept matrix + disclosure (Task 2) ✓; wisman LineTrend/top-negara/pintu (Task 3) ✓; kuliner wilayah/kecamatan/donut + 0-Michelin callout via KPI+catatan (Task 4) ✓; verify (Task 5) ✓.
- **Types:** all chart components consume `Point[]` from `@/lib/agg`; `groupCount`/`groupSum`/`byPeriod`/`topN` return `Point[]`; `kotaFromAddress`/`bulanLabel` return `string`; `Kpi` wraps `KpiStat`.
- **No unit tests** by design (no runner); verification is typecheck + build + HTTP/content checks.
- **Headline numbers** stay literal in `PariwisataShell`, never derived from aggregates (spec constraint).
