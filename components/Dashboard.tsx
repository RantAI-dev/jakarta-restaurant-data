"use client";

import { useMemo, useState, useTransition } from "react";
import { type Restaurant, googleMapsUrl, mapsEmbedUrl } from "@/lib/restaurants";

type Props = { restaurants: Restaurant[] };

const CATEGORIES = ["All", "Food", "Beverage", "Food & Beverage"] as const;
type Category = (typeof CATEGORIES)[number];

const SORTS = [
  { id: "rating", label: "Top rated" },
  { id: "reviews", label: "Most reviewed" },
  { id: "name", label: "A–Z" },
] as const;
type SortId = (typeof SORTS)[number]["id"];

const PRICE_LABELS: Record<Restaurant["priceRange"], string> = {
  $: "Budget",
  $$: "Casual",
  $$$: "Premium",
  $$$$: "Fine dining",
};

function formatReviews(n?: number): string {
  if (n == null) return "";
  if (n >= 10000) return Math.round(n / 1000) + "k";
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return n.toLocaleString("en-US");
}

export function Dashboard({ restaurants }: Props) {
  const [query, setQuery] = useState("");
  const [cuisine, setCuisine] = useState<string>("All");
  const [category, setCategory] = useState<Category>("All");
  const [sort, setSort] = useState<SortId>("rating");
  const [refreshing, startRefresh] = useTransition();
  const [refreshResult, setRefreshResult] = useState<{
    checkedAt: string;
    totalSources: number;
    reachable: number;
    results: { url: string; ok: boolean; status: number }[];
  } | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Map every source URL → its first human label, so the details panel
  // shows "Wanderlog — Italian Jakarta" rather than the raw URL.
  const urlLabelMap = useMemo(() => {
    const m = new Map<string, string>();
    restaurants.forEach((r) =>
      r.sources.forEach((s) => {
        if (!m.has(s.url)) m.set(s.url, s.label);
      })
    );
    return m;
  }, [restaurants]);

  const cuisineOptions = useMemo(() => {
    const set = new Set<string>();
    restaurants.forEach((r) => set.add(r.cuisine));
    return ["All", ...Array.from(set).sort()];
  }, [restaurants]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = restaurants.filter((r) => {
      if (cuisine !== "All" && r.cuisine !== cuisine) return false;
      if (category !== "All" && r.category !== category) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.cuisine.toLowerCase().includes(q) ||
        r.area.toLowerCase().includes(q) ||
        (r.address?.toLowerCase().includes(q) ?? false) ||
        r.highlights.some((h) => h.toLowerCase().includes(q)) ||
        r.description.toLowerCase().includes(q)
      );
    });

    const sorted = [...list];
    if (sort === "rating") {
      sorted.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
    } else if (sort === "reviews") {
      sorted.sort((a, b) => (b.reviewCount ?? -1) - (a.reviewCount ?? -1));
    } else {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
    return sorted;
  }, [restaurants, query, cuisine, category, sort]);

  const stats = useMemo(() => {
    const cuisines = new Set(restaurants.map((r) => r.cuisine)).size;
    const rated = restaurants.filter((r) => r.rating != null);
    const avg =
      rated.length > 0
        ? rated.reduce((s, r) => s + (r.rating ?? 0), 0) / rated.length
        : 0;
    return {
      total: restaurants.length,
      cuisines,
      ratedCount: rated.length,
      avgRating: avg,
    };
  }, [restaurants]);

  function verify() {
    setRefreshError(null);
    startRefresh(async () => {
      try {
        const res = await fetch("/api/refresh", { cache: "no-store" });
        const data = await res.json();
        setRefreshResult({
          checkedAt: data.checkedAt,
          totalSources: data.totalSources,
          reachable: data.reachable,
          results: data.results ?? [],
        });
        setDetailsOpen(true);
      } catch {
        setRefreshError("Could not reach the verification endpoint.");
      }
    });
  }

  function formatRelativeCheck(iso: string): string {
    const diff = Math.max(0, Date.now() - new Date(iso).getTime());
    const s = Math.floor(diff / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    return `${h}h ago`;
  }

  return (
    <main className="min-h-screen bg-canvas">
      {/* ── SUB-NAV (frosted parchment) ── */}
      <div className="sticky top-0 z-20 frosted border-b border-hairline">
        <div className="mx-auto max-w-[1280px] px-6 h-[52px] flex items-center justify-between gap-3">
          <p className="apple-tagline text-ink truncate">International Cuisine Directory</p>
          <VerifyControl
            refreshing={refreshing}
            result={refreshResult}
            error={refreshError}
            detailsOpen={detailsOpen}
            onVerify={verify}
            onToggleDetails={() => setDetailsOpen((v) => !v)}
            formatRelative={formatRelativeCheck}
          />
        </div>

        {/* Details disclosure panel — slides open under sub-nav */}
        {detailsOpen && refreshResult && (
          <VerifyDetails
            result={refreshResult}
            urlLabelMap={urlLabelMap}
            onClose={() => setDetailsOpen(false)}
          />
        )}
      </div>

      {/* ── HERO TILE (white, full-bleed) ── */}
      <section className="bg-canvas">
        <div className="mx-auto max-w-[1280px] px-6 py-[80px] md:py-[120px] text-center">
          <p className="apple-caption-strong text-ink-muted-80 appear" style={{ animationDelay: "0ms" }}>
            DINAS PARIWISATA · DKI JAKARTA
          </p>
          <h1 className="apple-hero apple-title-tight mt-3 text-ink appear" style={{ animationDelay: "80ms" }}>
            International Cuisine.
            <br />
            <span className="text-ink-muted-48">Curated for you.</span>
          </h1>
          <p
            className="apple-lead mt-6 max-w-[760px] mx-auto appear"
            style={{ animationDelay: "160ms" }}
          >
            A web-sourced register of{" "}
            <span className="text-ink">{stats.total} restaurants and bars</span>{" "}
            in Jakarta serving international food or beverages. Every entry
            links to its public source — and to Google Maps.
          </p>
          <div
            className="mt-9 flex items-center justify-center gap-4 appear"
            style={{ animationDelay: "240ms" }}
          >
            <a href="#directory" className="press-scale pill-primary">
              Browse the directory
            </a>
            <a href="#sources" className="press-scale pill-secondary">
              How this was built
            </a>
          </div>
        </div>
      </section>

      {/* ── STATS TILE (parchment) ── */}
      <section className="bg-parchment border-y border-hairline">
        <div className="mx-auto max-w-[1280px] px-6 py-[64px] md:py-[80px] grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-6 text-center">
          <Stat number={String(stats.total)} label="Establishments" />
          <Stat number={String(stats.cuisines)} label="Cuisines covered" />
          <Stat
            number={stats.avgRating ? stats.avgRating.toFixed(2) : "—"}
            label="Average rating"
            small="/5"
          />
          <Stat number={String(stats.ratedCount)} label="Publicly rated" />
        </div>
      </section>

      {/* ── TOOLBAR (parchment frosted, sticky under sub-nav) ── */}
      <section
        id="filters"
        className="sticky top-[52px] z-10 frosted border-b border-hairline"
      >
        <div className="mx-auto max-w-[1280px] px-6 py-4 flex flex-col lg:flex-row gap-3 lg:items-center lg:gap-5">
          {/* Search pill */}
          <div className="flex-1 relative">
            <svg
              viewBox="0 0 24 24"
              className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted-48"
              aria-hidden
            >
              <path
                fill="currentColor"
                d="M10 18a8 8 0 1 1 5.293-1.707l4.207 4.207-1.414 1.414-4.207-4.207A7.96 7.96 0 0 1 10 18zm0-2a6 6 0 1 0 0-12 6 6 0 0 0 0 12z"
              />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Jakarta restaurants…"
              className="w-full bg-canvas/95 border border-hairline rounded-full pl-12 pr-16 h-11 text-[17px] placeholder:text-ink-muted-48 focus:outline-none focus:border-primary-focus focus:ring-2 focus:ring-primary/15 transition-all"
            />
            <span className="absolute right-5 top-1/2 -translate-y-1/2 apple-caption tabular text-ink-muted-48">
              {filtered.length}/{restaurants.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Pill
              renderAs="select"
              value={cuisine}
              options={cuisineOptions.map((c) => ({
                id: c,
                label: c === "All" ? "All cuisines" : c,
              }))}
              onChange={setCuisine}
            />
            <Segmented
              options={CATEGORIES.map((c) => ({
                id: c,
                label: c === "Food & Beverage" ? "Both" : c,
              }))}
              value={category}
              onChange={(v) => setCategory(v as Category)}
            />
            <Segmented
              options={SORTS.map((s) => ({ id: s.id, label: s.label }))}
              value={sort}
              onChange={(v) => setSort(v as SortId)}
            />
          </div>
        </div>
      </section>

      {/* ── DIRECTORY GRID (white) ── */}
      <section id="directory" className="bg-canvas">
        <div className="mx-auto max-w-[1280px] px-6 py-12 md:py-16">
          {filtered.length === 0 ? (
            <div className="py-24 text-center">
              <p className="apple-display-lg text-ink">No matches.</p>
              <p className="apple-lead mt-3 text-ink-muted-48">
                Try clearing a filter, or searching{" "}
                <span className="text-primary">Senopati</span>,{" "}
                <span className="text-primary">Menteng</span>, or{" "}
                <span className="text-primary">SCBD</span>.
              </p>
            </div>
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((r) => (
                <Card key={r.id} r={r} />
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* ── FOOTER (parchment) ── */}
      <footer id="sources" className="bg-parchment border-t border-hairline">
        <div className="mx-auto max-w-[1280px] px-6 py-16 grid md:grid-cols-12 gap-8">
          <div className="md:col-span-6">
            <p className="apple-caption-strong text-ink">About this directory</p>
            <p className="apple-body mt-3 text-ink-muted-80 max-w-[60ch]">
              Compiled from public aggregator pages (Wanderlog, TripAdvisor,
              Chope, What's New Indonesia, NOW! Jakarta) and Google reviews.
              Ratings and review counts are taken from those sources at the
              time of compilation. Every card carries citation links.
              Permanently-closed venues from those lists have been omitted.
            </p>
          </div>
          <div className="md:col-span-3">
            <p className="apple-caption-strong text-ink">Inspect</p>
            <ul className="mt-3 space-y-2.5 apple-body">
              <li>
                <a className="link-blue" href="/api/restaurants" target="_blank" rel="noopener noreferrer">
                  Raw JSON ↗
                </a>
              </li>
              <li>
                <a className="link-blue" href="/api/refresh" target="_blank" rel="noopener noreferrer">
                  Source liveness ↗
                </a>
              </li>
            </ul>
          </div>
          <div className="md:col-span-3">
            <p className="apple-caption-strong text-ink">Coverage</p>
            <ul className="mt-3 space-y-2.5 apple-body text-ink-muted-80">
              <li>{stats.total} establishments</li>
              <li>{stats.cuisines} cuisine labels</li>
              <li>{stats.ratedCount} with public ratings</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-hairline">
          <div className="mx-auto max-w-[1280px] px-6 py-5 apple-fine text-ink-muted-48 flex items-center justify-between">
            <span>© {new Date().getUTCFullYear()} Dinas Pariwisata DKI Jakarta — directory project.</span>
            <span>Set in SF Pro · Inter fallback.</span>
          </div>
        </div>
      </footer>
    </main>
  );
}

/* ────────────────────────  STAT  ──────────────────────── */

function Stat({
  number,
  label,
  small,
}: {
  number: string;
  label: string;
  small?: string;
}) {
  return (
    <div>
      <div className="apple-hero apple-title-tight text-ink tabular">
        {number}
        {small && (
          <span className="text-ink-muted-48 text-[0.4em] align-middle ml-1">
            {small}
          </span>
        )}
      </div>
      <p className="apple-caption text-ink-muted-80 mt-1">{label}</p>
    </div>
  );
}

/* ────────────────────────  CARD  ──────────────────────── */

function Card({ r }: { r: Restaurant }) {
  return (
    <li className="utility-card group bg-canvas border border-hairline rounded-apple_lg overflow-hidden flex flex-col">
      {/* Map preview — the "product image" slot per DESIGN.md store-utility-card. */}
      <a
        href={googleMapsUrl(r)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Open ${r.name} in Google Maps`}
        className="relative block bg-parchment border-b border-hairline overflow-hidden group/map"
      >
        <div className="aspect-[16/9] w-full">
          <iframe
            src={mapsEmbedUrl(r)}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full h-full pointer-events-none select-none"
            title={`Map of ${r.name}`}
            aria-hidden="true"
          />
        </div>
        {/* Click-through chip floats over the map */}
        <span className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 bg-canvas/95 backdrop-blur border border-hairline rounded-full px-2.5 py-1 apple-fine text-ink shadow-[0_2px_8px_rgba(0,0,0,0.06)] opacity-0 group-hover/map:opacity-100 transition-opacity duration-200">
          Open ↗
        </span>
      </a>

      <div className="p-6 flex flex-col flex-1">
      {/* Eyebrow */}
      <p className="apple-caption-strong text-primary tracking-[0.06em] text-[11px] uppercase">
        {r.cuisine}
      </p>

      {/* Name — the focal element. Tagline size (21/600/-0.022em), not display-lg. */}
      <h3 className="apple-tagline apple-title-tight text-ink mt-1.5 leading-[1.15]">
        {r.name}
      </h3>

      {/* Single line of contextual metadata: area · price */}
      <p className="apple-caption text-ink-muted-48 mt-1">
        {r.area}
        <span className="mx-1.5 text-ink-muted-48/60">·</span>
        <span className="text-ink-muted-80">{r.priceRange}</span>
        <span className="text-ink-muted-48"> {PRICE_LABELS[r.priceRange]}</span>
      </p>

      {/* Rating — small inline row, subordinate to the name */}
      {r.rating != null && (
        <p className="apple-caption mt-4 flex items-center gap-1.5 text-ink">
          <StarIcon />
          <span className="apple-caption-strong tabular">
            {r.rating.toFixed(1)}
          </span>
          {r.reviewCount != null && r.reviewCount > 0 && (
            <span className="text-ink-muted-48">
              · {formatReviews(r.reviewCount)} reviews
              {r.ratingSource && ` · ${r.ratingSource}`}
            </span>
          )}
        </p>
      )}

      {/* Description */}
      <p className="apple-caption text-ink-muted-80 mt-3 line-clamp-3">
        {r.description}
      </p>

      {/* Footer links */}
      <div className="mt-auto pt-5 flex items-center justify-between gap-4">
        <a
          href={googleMapsUrl(r)}
          target="_blank"
          rel="noopener noreferrer"
          className="press-scale link-blue apple-caption-strong inline-flex items-center gap-1"
        >
          Open in Maps
          <span aria-hidden>↗</span>
        </a>
        {r.sources[0] && (
          <a
            href={r.sources[0].url}
            target="_blank"
            rel="noopener noreferrer"
            className="press-scale link-blue apple-caption inline-flex items-center gap-1"
            title={r.sources[0].label}
          >
            Source
            <span aria-hidden>↗</span>
          </a>
        )}
      </div>
      </div>
    </li>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-primary" aria-hidden>
      <path
        fill="currentColor"
        d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"
      />
    </svg>
  );
}

/* ──────────────────  SEGMENTED CONTROL  ────────────────── */

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex p-1 bg-canvas border border-hairline rounded-full">
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={`press-scale rounded-full px-3.5 py-1.5 apple-caption ${
              active
                ? "bg-primary text-white"
                : "text-ink-muted-80 hover:text-ink"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* ──────────────────────  PILL SELECT  ──────────────────── */

function Pill({
  value,
  options,
  onChange,
}: {
  renderAs: "select";
  value: string;
  options: { id: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none press-scale bg-canvas border border-hairline rounded-full h-9 pl-4 pr-9 apple-caption text-ink-muted-80 hover:text-ink focus:outline-none focus:border-primary-focus transition-colors cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
      <svg
        viewBox="0 0 24 24"
        className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-ink-muted-48 pointer-events-none"
        aria-hidden
      >
        <path
          fill="currentColor"
          d="M7 10l5 5 5-5z"
        />
      </svg>
    </div>
  );
}

/* ──────────────────  VERIFY CONTROL  ──────────────────── */

type VerifyResult = {
  checkedAt: string;
  totalSources: number;
  reachable: number;
  results: { url: string; ok: boolean; status: number }[];
};

function VerifyControl({
  refreshing,
  result,
  error,
  detailsOpen,
  onVerify,
  onToggleDetails,
  formatRelative,
}: {
  refreshing: boolean;
  result: VerifyResult | null;
  error: string | null;
  detailsOpen: boolean;
  onVerify: () => void;
  onToggleDetails: () => void;
  formatRelative: (iso: string) => string;
}) {
  // Initial state: a single pill that runs the check.
  if (!refreshing && !result && !error) {
    return (
      <button
        onClick={onVerify}
        className="press-scale pill-primary text-[14px] py-2 px-4 inline-flex items-center gap-2"
      >
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-300" />
        Verify sources
      </button>
    );
  }

  // Verifying state: spinner + label.
  if (refreshing) {
    return (
      <div className="inline-flex items-center gap-2 pill-primary text-[14px] py-2 px-4 cursor-progress">
        <Spinner />
        Verifying sources…
      </div>
    );
  }

  // Error state.
  if (error) {
    return (
      <button
        onClick={onVerify}
        className="press-scale inline-flex items-center gap-2 rounded-full border border-hairline bg-canvas px-3 py-1.5 apple-caption text-ink hover:border-ink-muted-48 transition-colors"
      >
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose-500" />
        {error}
        <span className="text-primary">Retry ↗</span>
      </button>
    );
  }

  // Result state: pill summary + Details toggle + small "Re-check" affordance.
  const r = result!;
  const allOk = r.reachable === r.totalSources;
  const someFail = r.reachable < r.totalSources && r.reachable > 0;
  const dotClass = allOk
    ? "bg-emerald-500"
    : someFail
    ? "bg-amber-500"
    : "bg-rose-500";

  return (
    <div className="inline-flex items-center gap-2">
      <button
        onClick={onToggleDetails}
        aria-expanded={detailsOpen}
        className="press-scale inline-flex items-center gap-2 rounded-full bg-canvas border border-hairline pl-2.5 pr-2 py-1.5 hover:border-ink-muted-48 transition-colors"
      >
        <span className={`inline-block h-1.5 w-1.5 rounded-full ${dotClass}`} />
        <span className="apple-caption-strong tabular text-ink">
          {r.reachable}/{r.totalSources}
        </span>
        <span className="apple-caption text-ink-muted-48">sources live</span>
        <span className="apple-fine text-ink-muted-48">
          · {formatRelative(r.checkedAt)}
        </span>
        <Chevron open={detailsOpen} />
      </button>
      <button
        onClick={onVerify}
        title="Re-verify"
        className="press-scale inline-flex h-7 w-7 items-center justify-center rounded-full border border-hairline bg-canvas hover:border-ink-muted-48 transition-colors"
        aria-label="Re-verify sources"
      >
        <RotateIcon />
      </button>
    </div>
  );
}

function VerifyDetails({
  result,
  urlLabelMap,
  onClose,
}: {
  result: VerifyResult;
  urlLabelMap: Map<string, string>;
  onClose: () => void;
}) {
  const reachable = result.results.filter((x) => x.ok);
  const unreachable = result.results.filter((x) => !x.ok);
  return (
    <div className="border-t border-hairline bg-canvas/95">
      <div className="mx-auto max-w-[1280px] px-6 py-5">
        <div className="flex items-center justify-between mb-3">
          <p className="apple-caption-strong text-ink">
            Source liveness report
            <span className="ml-2 apple-caption text-ink-muted-48">
              checked {new Date(result.checkedAt).toLocaleString("en-GB", {
                hour12: false,
              })}
            </span>
          </p>
          <button
            onClick={onClose}
            aria-label="Close details"
            className="press-scale inline-flex h-7 w-7 items-center justify-center rounded-full border border-hairline bg-canvas hover:border-ink-muted-48 transition-colors apple-caption"
          >
            ✕
          </button>
        </div>

        <p className="apple-caption text-ink-muted-80">
          {result.reachable === result.totalSources ? (
            <>
              All <b className="text-ink">{result.totalSources}</b> source pages
              responded successfully.
            </>
          ) : (
            <>
              <b className="text-ink">{result.reachable}</b> of{" "}
              <b className="text-ink">{result.totalSources}</b> source pages
              responded. {unreachable.length} blocked or unreachable —
              typically TripAdvisor / RestaurantGuru, which refuse server-side
              bot fetches. Links still work in a browser.
            </>
          )}
        </p>

        <div className="mt-4 grid gap-1.5 max-h-[260px] overflow-y-auto pr-1">
          {[...reachable, ...unreachable].map((row) => {
            const label =
              urlLabelMap.get(row.url) ??
              new URL(row.url).hostname.replace(/^www\./, "");
            return (
              <a
                key={row.url}
                href={row.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group grid grid-cols-[16px_1fr_64px_64px] items-center gap-3 rounded-md px-2 py-1.5 hover:bg-parchment transition-colors"
              >
                <span
                  className={`inline-block h-2 w-2 rounded-full justify-self-center ${
                    row.ok
                      ? "bg-emerald-500"
                      : row.status >= 500 || row.status === 0
                      ? "bg-rose-500"
                      : "bg-amber-500"
                  }`}
                  aria-hidden
                />
                <span className="apple-caption text-ink truncate group-hover:text-primary transition-colors">
                  {label}
                </span>
                <span className="apple-fine text-ink-muted-48 tabular text-right">
                  {row.status || "—"}
                </span>
                <span className="apple-fine text-ink-muted-48 text-right">
                  {row.ok ? "OK" : "blocked"}
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 animate-spin" aria-hidden>
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        opacity="0.25"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-3 w-3 text-ink-muted-48 transition-transform ${
        open ? "rotate-180" : ""
      }`}
      aria-hidden
    >
      <path fill="currentColor" d="M7 10l5 5 5-5z" />
    </svg>
  );
}

function RotateIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-ink-muted-80" aria-hidden>
      <path
        fill="currentColor"
        d="M12 5V2L7 6l5 4V7c2.76 0 5 2.24 5 5a5 5 0 0 1-9.58 2H5.34A7 7 0 1 0 12 5z"
      />
    </svg>
  );
}
