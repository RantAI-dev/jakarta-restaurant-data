"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import L, { type Map as LeafletMap } from "leaflet";
import "leaflet.markercluster";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

import {
  GOLF_COURSES,
  golfMapsUrl,
  golfMapsEmbedUrl,
  type GolfCourse,
} from "@/lib/golf";
import {
  DEFAULT_LANG,
  STORAGE_KEY,
  translate,
  type Lang,
} from "@/lib/i18n";

// Same Leaflet icon-path fix used in MapView.
type IconDefaultProto = L.Icon.Default & { _getIconUrl?: unknown };
delete (L.Icon.Default.prototype as IconDefaultProto)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const KIND_FILTERS = ["All", "Course", "Driving Range", "Topgolf"] as const;
type KindFilter = (typeof KIND_FILTERS)[number];

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function popupHTML(g: GolfCourse, t: (k: string) => string): string {
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;min-width:240px;max-width:280px;">
    <span style="font-size:10px;color:#0066cc;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;">${escapeHtml(
      g.kind
    )}${g.holes ? ` · ${g.holes} ${t("golf.holes")}` : ""}</span>
    <div style="font-size:17px;font-weight:600;color:#1d1d1f;margin-top:4px;line-height:1.2;">${escapeHtml(
      g.name
    )}</div>
    <div style="font-size:13px;color:#7a7a7a;margin-top:2px;">${escapeHtml(
      g.area
    )}</div>
    <a href="${golfMapsUrl(
      g
    )}" target="_blank" rel="noopener noreferrer" style="display:inline-block;margin-top:10px;color:#0066cc;font-size:13px;text-decoration:none;">${escapeHtml(
    t("card.open_maps")
  )} ↗</a>
  </div>`;
}

export function GolfView() {
  const [lang, setLang] = useState<Lang>(DEFAULT_LANG);
  const [city, setCity] = useState<string>("All");
  const [kind, setKind] = useState<KindFilter>("All");

  const mapHostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const clusterRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "id" || stored === "en") setLang(stored);
    } catch {}
  }, []);

  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(lang, key, vars);

  const cityOptions = useMemo(() => {
    const ORDER = [
      "Central Jakarta",
      "South Jakarta",
      "North Jakarta",
      "West Jakarta",
      "East Jakarta",
      "Kepulauan Seribu",
    ];
    const present = new Set<string>();
    GOLF_COURSES.forEach((g) => present.add(g.city));
    const ordered: string[] = [];
    for (const c of ORDER) if (present.has(c)) ordered.push(c);
    for (const c of [...present].sort()) {
      if (!ordered.includes(c)) ordered.push(c);
    }
    return ["All", ...ordered];
  }, []);

  const filtered = useMemo(
    () =>
      GOLF_COURSES.filter(
        (g) =>
          (city === "All" || g.city === city) &&
          (kind === "All" || g.kind === kind)
      ),
    [city, kind]
  );

  const stats = useMemo(() => {
    const courses = GOLF_COURSES.filter((g) => g.kind === "Course");
    const ranges = GOLF_COURSES.filter((g) => g.kind !== "Course");
    const totalHoles = courses.reduce((s, g) => s + (g.holes ?? 0), 0);
    return {
      total: GOLF_COURSES.length,
      courses: courses.length,
      ranges: ranges.length,
      totalHoles,
    };
  }, []);

  // Init overview map once.
  useEffect(() => {
    if (!mapHostRef.current || mapRef.current) return;
    const map = L.map(mapHostRef.current, {
      zoomControl: true,
      preferCanvas: true,
    }).setView([-6.2, 106.85], 11);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Re-cluster when filters change.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (clusterRef.current) {
      map.removeLayer(clusterRef.current);
      clusterRef.current = null;
    }
    type ClusterModule = typeof L & {
      markerClusterGroup: (opts?: Record<string, unknown>) => L.LayerGroup;
    };
    const cluster = (L as ClusterModule).markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 40,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
    });
    for (const g of filtered) {
      const m = L.marker([g.lat, g.lng]);
      m.bindPopup(popupHTML(g, t), { maxWidth: 300, autoPan: true });
      cluster.addLayer(m);
    }
    map.addLayer(cluster);
    clusterRef.current = cluster;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, lang]);

  function onToggleLang() {
    const next: Lang = lang === "id" ? "en" : "id";
    setLang(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {}
  }

  return (
    <main className="min-h-screen bg-canvas">
      {/* SUB-NAV */}
      <div className="sticky top-0 z-20 frosted border-b border-hairline">
        <div className="mx-auto max-w-[1280px] px-6 h-[52px] flex items-center justify-between gap-3">
          <Link
            href="/"
            className="apple-tagline text-ink truncate hover:text-primary transition-colors"
          >
            {t("golf.page_title")}
          </Link>
          <div className="flex items-center gap-2">
            <SectionTabs current="golf" t={t} />
            <button
              onClick={onToggleLang}
              className="press-scale inline-flex items-center gap-1 rounded-full border border-hairline bg-canvas px-2.5 py-1.5 hover:border-ink-muted-48 transition-colors"
              aria-label={`Switch to ${t("nav.switch_to")}`}
            >
              <span className="apple-caption-strong tabular text-ink uppercase tracking-wider">
                {lang.toUpperCase()}
              </span>
              <span className="apple-fine text-ink-muted-48">/</span>
              <span className="apple-fine tabular text-ink-muted-48 uppercase tracking-wider">
                {t("nav.switch_to")}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* HERO + STATS */}
      <section className="bg-canvas">
        <div className="mx-auto max-w-[1280px] px-6 py-[64px] md:py-[96px] text-center">
          <p className="apple-caption-strong text-ink-muted-80 appear">
            DKI JAKARTA · {t("golf.eyebrow")}
          </p>
          <h1
            className="apple-hero apple-title-tight mt-3 text-ink appear"
            style={{ animationDelay: "80ms" }}
          >
            {t("golf.title_a")}
            <br />
            <span className="text-ink-muted-48">{t("golf.title_b")}</span>
          </h1>
          <p
            className="apple-lead mt-5 max-w-[700px] mx-auto appear"
            style={{ animationDelay: "160ms" }}
          >
            {t("golf.lead_prefix")}{" "}
            <span className="text-ink">
              {t("golf.lead_count", {
                courses: stats.courses,
                ranges: stats.ranges,
              })}
            </span>{" "}
            {t("golf.lead_suffix")}
          </p>

          <dl className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-4 max-w-[900px] mx-auto">
            <Stat number={String(stats.total)} label={t("golf.stat_total")} />
            <Stat number={String(stats.courses)} label={t("golf.stat_courses")} />
            <Stat number={String(stats.ranges)} label={t("golf.stat_ranges")} />
            <Stat number={String(stats.totalHoles)} label={t("golf.stat_holes")} />
          </dl>
        </div>
      </section>

      {/* OVERVIEW MAP */}
      <section className="bg-parchment border-y border-hairline">
        <div className="mx-auto max-w-[1280px] px-6 py-10">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <p className="apple-caption-strong text-ink">
              {t("golf.map_heading")}
            </p>
            <div className="flex items-center gap-3">
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="appearance-none press-scale bg-canvas border border-hairline rounded-full h-9 pl-4 pr-9 apple-caption text-ink-muted-80 hover:text-ink focus:outline-none focus:border-primary-focus transition-colors cursor-pointer"
              >
                {cityOptions.map((c) => (
                  <option key={c} value={c}>
                    {c === "All" ? t("toolbar.city_all") : t(`city.${c}`)}
                  </option>
                ))}
              </select>
              <div className="inline-flex p-1 bg-canvas border border-hairline rounded-full">
                {KIND_FILTERS.map((k) => (
                  <button
                    key={k}
                    onClick={() => setKind(k)}
                    className={`press-scale rounded-full px-3 py-1 apple-caption ${
                      kind === k
                        ? "bg-primary text-white"
                        : "text-ink-muted-80 hover:text-ink"
                    }`}
                  >
                    {k === "All"
                      ? t("toolbar.cat.all")
                      : k === "Course"
                      ? t("golf.kind_course")
                      : k === "Driving Range"
                      ? t("golf.kind_range")
                      : t("golf.kind_topgolf")}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div
            ref={mapHostRef}
            className="w-full rounded-apple_lg border border-hairline bg-canvas overflow-hidden"
            style={{ height: "440px" }}
          />
          <p className="apple-fine text-ink-muted-48 mt-2">
            {filtered.length} {t("map.pins_label")}
          </p>
        </div>
      </section>

      {/* LIST */}
      <section className="bg-canvas">
        <div className="mx-auto max-w-[1280px] px-6 py-12 md:py-16">
          {filtered.length === 0 ? (
            <p className="apple-display-lg text-ink text-center">
              {t("empty.title")}
            </p>
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((g) => (
                <GolfCard key={g.id} g={g} t={t} />
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-parchment border-t border-hairline">
        <div className="mx-auto max-w-[1280px] px-6 py-10 apple-fine text-ink-muted-48 flex items-center justify-between flex-wrap gap-2">
          <span>{t("golf.footer_source")}</span>
          <span>{t("footer.typeface")}</span>
        </div>
      </footer>
    </main>
  );
}

function SectionTabs({
  current,
  t,
}: {
  current: "list" | "map" | "golf";
  t: (k: string) => string;
}) {
  const tabs: { id: typeof current; href: string; label: string }[] = [
    { id: "list", href: "/", label: t("nav.view_list") },
    { id: "map", href: "/map", label: t("nav.view_map") },
    { id: "golf", href: "/golf", label: t("nav.view_golf") },
  ];
  return (
    <div className="inline-flex p-0.5 bg-canvas border border-hairline rounded-full">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          className={`press-scale rounded-full px-3 py-1 apple-caption-strong ${
            current === tab.id
              ? "bg-ink text-white"
              : "text-ink-muted-80 hover:text-ink"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div>
      <div className="apple-hero apple-title-tight text-ink tabular">
        {number}
      </div>
      <p className="apple-caption text-ink-muted-80 mt-1">{label}</p>
    </div>
  );
}

function GolfCard({
  g,
  t,
}: {
  g: GolfCourse;
  t: (k: string, vars?: Record<string, string | number>) => string;
}) {
  return (
    <li className="utility-card group bg-canvas border border-hairline rounded-apple_lg overflow-hidden flex flex-col">
      <a
        href={golfMapsUrl(g)}
        target="_blank"
        rel="noopener noreferrer"
        className="relative block bg-parchment border-b border-hairline overflow-hidden group/map"
      >
        <div className="aspect-[16/9] w-full">
          <iframe
            src={golfMapsEmbedUrl(g)}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full h-full pointer-events-none select-none"
            title={`Map — ${g.name}`}
            aria-hidden="true"
          />
        </div>
        <span className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 bg-canvas/95 backdrop-blur border border-hairline rounded-full px-2.5 py-1 apple-fine text-ink opacity-0 group-hover/map:opacity-100 transition-opacity">
          {t("card.open_chip")}
        </span>
      </a>

      <div className="p-6 flex flex-col flex-1">
        <p className="apple-caption-strong text-primary tracking-[0.06em] text-[11px] uppercase">
          {g.kind === "Course"
            ? `${t("golf.kind_course")}${g.holes ? ` · ${g.holes} ${t("golf.holes")}` : ""}${g.par ? ` · Par ${g.par}` : ""}`
            : g.kind === "Driving Range"
            ? t("golf.kind_range")
            : t("golf.kind_topgolf")}
        </p>
        <h3 className="apple-tagline apple-title-tight text-ink mt-1.5 leading-[1.15]">
          {g.name}
        </h3>
        <p className="apple-caption text-ink-muted-48 mt-1">
          {g.area}
          {g.membership && (
            <>
              <span className="mx-1.5 text-ink-muted-48/60">·</span>
              <span className="text-ink-muted-80">
                {g.membership === "Public"
                  ? t("golf.access_public")
                  : g.membership === "Members"
                  ? t("golf.access_members")
                  : g.membership === "Semi-private"
                  ? t("golf.access_semi")
                  : t("golf.access_resort")}
              </span>
            </>
          )}
        </p>

        {g.designer && (
          <p className="apple-caption mt-3 text-ink">
            <span className="text-ink-muted-48">{t("golf.designer")}: </span>
            {g.designer}
            {g.established && (
              <span className="text-ink-muted-48"> · {t("golf.est")} {g.established}</span>
            )}
          </p>
        )}

        {g.description && (
          <p className="apple-caption text-ink-muted-80 mt-3 line-clamp-3">
            {g.description}
          </p>
        )}

        <div className="mt-auto pt-5 flex items-center justify-between gap-4">
          <a
            href={golfMapsUrl(g)}
            target="_blank"
            rel="noopener noreferrer"
            className="press-scale link-blue apple-caption-strong inline-flex items-center gap-1"
          >
            {t("card.open_maps")}
            <span aria-hidden>↗</span>
          </a>
          {g.website && (
            <a
              href={g.website}
              target="_blank"
              rel="noopener noreferrer"
              className="press-scale link-blue apple-caption inline-flex items-center gap-1"
            >
              {t("golf.website")}
              <span aria-hidden>↗</span>
            </a>
          )}
        </div>
      </div>
    </li>
  );
}
