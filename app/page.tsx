"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CompassRose } from "@/components/atlas/CompassRose";
import { RESTAURANTS } from "@/lib/restaurants";
import { GOLF_COURSES } from "@/lib/golf";
import {
  DEFAULT_LANG,
  STORAGE_KEY,
  translate,
  type Lang,
} from "@/lib/i18n";

export default function HomePage() {
  const [lang, setLang] = useState<Lang>(DEFAULT_LANG);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "id" || stored === "en") setLang(stored);
    } catch {}
  }, []);

  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(lang, key, vars);

  function onToggleLang() {
    const next: Lang = lang === "id" ? "en" : "id";
    setLang(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {}
  }

  const restaurantStats = {
    total: RESTAURANTS.length,
    curated: RESTAURANTS.filter((r) => r.source === "curated").length,
    cuisines: new Set(RESTAURANTS.map((r) => r.cuisine)).size,
  };

  const golfStats = {
    total: GOLF_COURSES.length,
    courses: GOLF_COURSES.filter((g) => g.kind === "Course").length,
    holes: GOLF_COURSES.reduce((s, g) => s + (g.holes ?? 0), 0),
  };

  return (
    <main className="min-h-screen flex flex-col">
      {/* ── HEADER STRIP — minimal masthead with brand and lang toggle ── */}
      <header className="border-b border-hairline">
        <div className="mx-auto max-w-[1320px] px-6 h-[56px] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-ink">
              <CompassRose size={26} />
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="atlas-mono text-ink">JAKARTA</span>
              <span className="atlas-italic text-[18px] leading-none text-ink">
                Atlas
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="atlas-mono text-ink-muted-48 hidden md:inline">
              Edition I · May 2026
            </span>
            <button
              onClick={onToggleLang}
              className="press-scale inline-flex items-center gap-1 rounded-full border border-hairline bg-canvas px-2.5 py-1.5 hover:border-ink-muted-48 transition-colors"
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
      </header>

      {/* ── MASTHEAD ── */}
      <section className="border-b border-hairline">
        <div className="mx-auto max-w-[1320px] px-6 pt-16 md:pt-24 pb-16 md:pb-24">
          <div className="flex items-center gap-3 appear">
            <span className="atlas-mono text-ink-muted-48">
              {t("home.eyebrow")}
            </span>
            <span className="flex-1 border-t border-hairline" />
            <span className="atlas-coord">-6.2088° S · 106.8456° E</span>
          </div>

          <h1
            className="atlas-display text-ink mt-8 appear"
            style={{ animationDelay: "120ms" }}
          >
            {t("home.title_a")}
            <br />
            <span className="atlas-italic text-[color:var(--accent)]">
              {t("home.title_b")}
            </span>
            <span className="text-ink-muted-48">.</span>
          </h1>

          <div
            className="mt-10 grid md:grid-cols-12 gap-6 appear"
            style={{ animationDelay: "240ms" }}
          >
            <p className="md:col-span-7 atlas-lead">
              {t("home.lead")}
            </p>

            <dl className="md:col-span-5 md:border-l md:border-hairline md:pl-6 grid grid-cols-3 gap-y-1">
              <Stat
                label={t("home.stat_venues")}
                value={String(restaurantStats.total + golfStats.total)}
              />
              <Stat
                label={t("home.stat_cuisines")}
                value={String(restaurantStats.cuisines)}
              />
              <Stat label={t("home.stat_courses")} value={String(golfStats.courses)} />
            </dl>
          </div>
        </div>
      </section>

      {/* ── TWO-VOLUME GATEWAY ── */}
      <section className="flex-1 grid md:grid-cols-2 border-b border-hairline">
        {/* VOL I — Restaurants */}
        <div data-section="restaurants" className="group">
          <SectionTile
            href="/restaurants"
            volume="I"
            kicker={t("home.vol1_kicker")}
            title={t("home.vol1_title")}
            subtitle={t("home.vol1_subtitle")}
            description={t("home.vol1_description")}
            stats={[
              { label: t("home.stat_venues"), value: String(restaurantStats.total) },
              { label: t("home.stat_curated"), value: String(restaurantStats.curated) },
              {
                label: t("home.stat_cuisines"),
                value: String(restaurantStats.cuisines),
              },
            ]}
            cta={t("home.vol1_cta")}
            accentVar="--accent"
            sectionClass="bg-paper-light"
            icon={<KnifeForkGlyph />}
          />
        </div>

        {/* VOL II — Golf */}
        <div
          data-section="golf"
          className="group border-t md:border-t-0 md:border-l border-hairline"
        >
          <SectionTile
            href="/golf"
            volume="II"
            kicker={t("home.vol2_kicker")}
            title={t("home.vol2_title")}
            subtitle={t("home.vol2_subtitle")}
            description={t("home.vol2_description")}
            stats={[
              { label: t("home.stat_venues"), value: String(golfStats.total) },
              { label: t("home.stat_courses"), value: String(golfStats.courses) },
              { label: t("home.stat_holes"), value: String(golfStats.holes) },
            ]}
            cta={t("home.vol2_cta")}
            accentVar="--accent"
            sectionClass="bg-paper-deep"
            icon={<GolfFlagGlyph />}
          />
        </div>
      </section>

      {/* ── COLOPHON / FOOTER ── */}
      <footer className="bg-paper">
        <div className="mx-auto max-w-[1320px] px-6 py-10 grid md:grid-cols-3 gap-6 atlas-caption">
          <p className="text-ink-muted-80 max-w-[44ch]">
            {t("home.footer_about")}
          </p>
          <div className="space-y-1.5">
            <p className="atlas-mono text-ink">{t("home.footer_inspect")}</p>
            <ul className="space-y-1">
              <li>
                <Link href="/api/restaurants" className="text-ink-muted-80 hover:text-ink underline decoration-hairline underline-offset-4">
                  /api/restaurants
                </Link>
              </li>
              <li>
                <Link href="/api/refresh" className="text-ink-muted-80 hover:text-ink underline decoration-hairline underline-offset-4">
                  /api/refresh
                </Link>
              </li>
            </ul>
          </div>
          <div className="md:text-right space-y-1">
            <p className="atlas-mono text-ink">{t("home.footer_colophon")}</p>
            <p className="text-ink-muted-80">
              <span className="atlas-italic">Newsreader</span> ·{" "}
              <span>Geist</span> ·{" "}
              <span className="font-mono">JetBrains Mono</span>
            </p>
            <p className="text-ink-muted-48 atlas-fine">
              © 2026 Jakarta Atlas
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}

/* ──────────────────  STAT INLINE  ────────────────── */

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="atlas-mono text-ink-muted-48">{label}</dt>
      <dd className="atlas-display-md text-ink tabular mt-0.5">{value}</dd>
    </div>
  );
}

/* ──────────────────  SECTION TILE  ────────────────── */

function SectionTile({
  href,
  volume,
  kicker,
  title,
  subtitle,
  description,
  stats,
  cta,
  sectionClass,
  icon,
}: {
  href: string;
  volume: string;
  kicker: string;
  title: string;
  subtitle: string;
  description: string;
  stats: { label: string; value: string }[];
  cta: string;
  accentVar: string;
  sectionClass: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`relative block px-6 md:px-12 py-14 md:py-20 transition-colors hover:[--accent-bg:rgba(15,20,25,0.04)] hover:bg-[var(--accent-bg)] ${sectionClass}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="atlas-mono text-ink-muted-48">{kicker}</span>
        <span className="atlas-mono text-ink-muted-48">
          VOL.&nbsp;
          <span className="text-[color:var(--accent)]">{volume}</span>
        </span>
      </div>

      <div className="mt-8 mb-6 text-[color:var(--accent)]">{icon}</div>

      <h2 className="atlas-display text-ink leading-[0.95]">
        {title}
        <br />
        <span className="atlas-italic text-ink-muted-48">{subtitle}</span>
      </h2>

      <p className="atlas-lead mt-6 max-w-[42ch]">{description}</p>

      <dl className="mt-8 grid grid-cols-3 gap-x-4 border-t border-hairline pt-5 max-w-[440px]">
        {stats.map((s) => (
          <div key={s.label}>
            <dt className="atlas-mono text-ink-muted-48">{s.label}</dt>
            <dd className="atlas-display-md text-ink tabular mt-1">
              {s.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-10 flex items-center gap-3">
        <span className="pill-primary press-scale">
          {cta}
          <span aria-hidden>→</span>
        </span>
      </div>
    </Link>
  );
}

/* ──────────────────  GLYPHS  ────────────────── */

function KnifeForkGlyph() {
  return (
    <svg viewBox="0 0 40 40" width="48" height="48" aria-hidden="true">
      {/* Fork */}
      <line
        x1="11"
        y1="6"
        x2="11"
        y2="22"
        stroke="currentColor"
        strokeWidth="1.2"
        opacity="0.6"
      />
      <line x1="8" y1="6" x2="8" y2="13" stroke="currentColor" strokeWidth="1" />
      <line x1="11" y1="6" x2="11" y2="13" stroke="currentColor" strokeWidth="1" />
      <line x1="14" y1="6" x2="14" y2="13" stroke="currentColor" strokeWidth="1" />
      <path
        d="M8 13 Q8 16 11 16 Q14 16 14 13"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="none"
      />
      <line
        x1="11"
        y1="16"
        x2="11"
        y2="34"
        stroke="currentColor"
        strokeWidth="2"
      />
      {/* Knife */}
      <path
        d="M28 6 Q24 14 24 24 L28 24 L28 6 Z"
        fill="currentColor"
        opacity="0.85"
      />
      <line
        x1="28"
        y1="24"
        x2="28"
        y2="34"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function GolfFlagGlyph() {
  return (
    <svg viewBox="0 0 40 40" width="48" height="48" aria-hidden="true">
      {/* Pole */}
      <line
        x1="14"
        y1="4"
        x2="14"
        y2="32"
        stroke="currentColor"
        strokeWidth="2"
      />
      {/* Flag */}
      <path
        d="M14 6 L30 9 L26 12 L30 15 L14 18 Z"
        fill="currentColor"
        opacity="0.85"
      />
      {/* Ground line + ball */}
      <line
        x1="6"
        y1="32"
        x2="34"
        y2="32"
        stroke="currentColor"
        strokeWidth="0.6"
        opacity="0.5"
      />
      <circle cx="22" cy="30" r="2" fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}
