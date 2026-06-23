"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CompassRose } from "@/components/atlas/CompassRose";
import { RESTAURANTS } from "@/lib/restaurants";
import { GOLF_COURSES } from "@/lib/golf";
import { gciStats } from "@/lib/gci";
import { eventStats } from "@/lib/events";
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

  const gci = gciStats();
  const events = eventStats();

  return (
    <main className="min-h-screen flex flex-col bg-canvas">
      {/* ── HEADER ── */}
      <header className="border-b border-hairline bg-canvas">
        <div className="mx-auto max-w-[1320px] px-6 h-[60px] flex items-center justify-between">
          <Link href="/" className="compass-on-hover flex items-center gap-2.5">
            <span className="text-[color:var(--accent)]">
              <CompassRose size={26} />
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="atlas-mono text-ink">JAKARTA</span>
              <span className="atlas-italic text-[19px] leading-none text-ink">
                Atlas
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <nav className="hidden sm:flex items-center gap-5 apple-caption-strong">
              <Link href="/restaurants" className="text-ink-muted-80 hover:text-[color:var(--accent)] transition-colors">
                {t("nav.section_restaurants")}
              </Link>
              <Link href="/golf" className="text-ink-muted-80 hover:text-[color:var(--accent)] transition-colors">
                {t("nav.section_golf")}
              </Link>
              <Link href="/gci" className="text-ink-muted-80 hover:text-[color:var(--accent)] transition-colors">
                {t("nav.section_gci")}
              </Link>
              <Link href="/events" className="text-ink-muted-80 hover:text-[color:var(--accent)] transition-colors">
                {t("nav.section_events")}
              </Link>
            </nav>
            <button
              onClick={onToggleLang}
              className="press-scale inline-flex items-center gap-1 rounded-md border border-hairline bg-canvas px-2.5 py-1.5 hover:border-ink-muted-48 transition-colors"
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

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-canvas border-b border-hairline">
        {/* Subtle gradient backdrop — civic-tech feel */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 0%, var(--accent), transparent 50%), radial-gradient(circle at 80% 100%, var(--accent), transparent 50%)",
          }}
        />
        <div className="relative mx-auto max-w-[1320px] px-6 pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="flex items-center gap-3 appear">
            <span className="atlas-mono text-[color:var(--accent)]">
              {t("home.eyebrow")}
            </span>
            <span className="flex-1 border-t border-hairline" />
            <span className="atlas-coord">-6.2088° S · 106.8456° E</span>
          </div>

          <h1
            className="atlas-display text-ink mt-8 appear max-w-[18ch]"
            style={{ animationDelay: "100ms" }}
          >
            {t("home.title_a")}{" "}
            <span className="text-[color:var(--accent)]">
              {t("home.title_b")}
            </span>
          </h1>

          <p
            className="atlas-lead mt-6 max-w-[64ch] appear"
            style={{ animationDelay: "180ms" }}
          >
            {t("home.lead")}
          </p>

          <dl
            className="mt-10 grid grid-cols-3 gap-x-6 gap-y-2 max-w-[640px] appear"
            style={{ animationDelay: "260ms" }}
          >
            <HeroStat
              value={String(restaurantStats.total + golfStats.total)}
              label={t("home.stat_venues")}
            />
            <HeroStat
              value={String(restaurantStats.cuisines)}
              label={t("home.stat_cuisines")}
            />
            <HeroStat
              value={String(golfStats.courses)}
              label={t("home.stat_courses")}
            />
          </dl>
        </div>
      </section>

      {/* ── SECTION CARDS ── */}
      <section className="bg-paper py-14 md:py-20 border-b border-hairline">
        <div className="mx-auto max-w-[1320px] px-6">
          <p className="atlas-mono text-ink-muted-48 mb-6">
            {t("home.choose_section")}
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            <SectionCard
              href="/restaurants"
              accent="rest"
              icon={<KnifeForkGlyph />}
              kicker={t("home.vol1_kicker_short")}
              title={t("home.vol1_title")}
              description={t("home.vol1_description")}
              stats={[
                {
                  label: t("home.stat_venues"),
                  value: String(restaurantStats.total),
                },
                {
                  label: t("home.stat_curated"),
                  value: String(restaurantStats.curated),
                },
                {
                  label: t("home.stat_cuisines"),
                  value: String(restaurantStats.cuisines),
                },
              ]}
              cta={t("home.vol1_cta")}
            />
            <SectionCard
              href="/golf"
              accent="golf"
              icon={<GolfFlagGlyph />}
              kicker={t("home.vol2_kicker_short")}
              title={t("home.vol2_title")}
              description={t("home.vol2_description")}
              stats={[
                {
                  label: t("home.stat_venues"),
                  value: String(golfStats.total),
                },
                {
                  label: t("home.stat_courses"),
                  value: String(golfStats.courses),
                },
                {
                  label: t("home.stat_holes"),
                  value: String(golfStats.holes),
                },
              ]}
              cta={t("home.vol2_cta")}
            />
            <SectionCard
              href="/gci"
              accent="gci"
              icon={<GciGlyph />}
              kicker="GCI · GLOBAL CITY INDEX"
              title="Restoran GCI"
              description="Pendataan seluruh restoran & cafe se-Jakarta (termasuk restoran hotel bintang 3 & 4) untuk Global City Index. Ekspor langsung ke format Google Sheet."
              stats={[
                { label: "ENTRI", value: String(gci.total) },
                { label: "HOTEL", value: String(gci.hotel) },
                { label: "CAFE", value: String(gci.cafe) },
              ]}
              cta="Buka pendataan GCI"
            />
            <SectionCard
              href="/events"
              accent="events"
              icon={<EventsGlyph />}
              kicker="GCI · GLOBAL CITY INDEX"
              title="Pertunjukan & Budaya"
              description="Pendataan pertunjukan musik internasional & nasional serta acara budaya besar di Jakarta sepanjang 2025–2026 — konser, festival, tari, teater, seni rupa, film — untuk Global City Index."
              stats={[
                { label: "EVENT", value: String(events.total) },
                { label: "KONSER", value: String(events.konser) },
                { label: "BUDAYA", value: String(events.budaya) },
              ]}
              cta="Buka pendataan Pertunjukan"
            />
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-canvas">
        <div className="mx-auto max-w-[1320px] px-6 py-10 grid md:grid-cols-3 gap-8 atlas-caption">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[color:var(--accent)]">
                <CompassRose size={20} />
              </span>
              <div className="flex items-baseline gap-1">
                <span className="atlas-mono text-ink">JAKARTA</span>
                <span className="atlas-italic text-[14px] leading-none text-ink">
                  Atlas
                </span>
              </div>
            </div>
            <p className="text-ink-muted-80 max-w-[44ch]">
              {t("home.footer_about")}
            </p>
          </div>
          <div className="space-y-1.5">
            <p className="atlas-mono text-ink mb-2">{t("home.footer_inspect")}</p>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/api/restaurants"
                  className="text-ink-muted-80 hover:text-[color:var(--accent)]"
                >
                  /api/restaurants
                </Link>
              </li>
              <li>
                <Link
                  href="/api/refresh"
                  className="text-ink-muted-80 hover:text-[color:var(--accent)]"
                >
                  /api/refresh
                </Link>
              </li>
            </ul>
          </div>
          <div className="md:text-right space-y-1">
            <p className="atlas-mono text-ink mb-2">
              {t("home.footer_colophon")}
            </p>
            <p className="text-ink-muted-80">Plus Jakarta Sans · JetBrains Mono</p>
            <p className="text-ink-muted-48 atlas-fine">© 2026 Jakarta Atlas</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

/* ──────────────────  HERO STAT  ────────────────── */

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dt className="atlas-mono text-ink-muted-48">{label}</dt>
      <dd className="atlas-display-md text-ink tabular mt-1.5">{value}</dd>
    </div>
  );
}

/* ──────────────────  SECTION CARD  ────────────────── */

function SectionCard({
  href,
  accent,
  icon,
  kicker,
  title,
  description,
  stats,
  cta,
}: {
  href: string;
  accent: "rest" | "golf" | "gci" | "events";
  icon: React.ReactNode;
  kicker: string;
  title: string;
  description: string;
  stats: { label: string; value: string }[];
  cta: string;
}) {
  return (
    <Link
      href={href}
      data-section={
        accent === "rest"
          ? "restaurants"
          : accent === "golf"
          ? "golf"
          : accent === "events"
          ? "events"
          : "gci"
      }
      className="group utility-card relative block p-7 md:p-9 hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="text-[color:var(--accent)]">{icon}</div>
        <span className="atlas-mono text-ink-muted-48">{kicker}</span>
      </div>

      <h2 className="atlas-display-lg text-ink">{title}</h2>

      <p className="apple-body mt-3 text-ink-muted-80 max-w-[42ch]">
        {description}
      </p>

      <dl className="mt-7 grid grid-cols-3 gap-x-4 pt-5 border-t border-hairline">
        {stats.map((s) => (
          <div key={s.label}>
            <dt className="atlas-mono text-ink-muted-48">{s.label}</dt>
            <dd className="atlas-display-md text-ink tabular mt-1">
              {s.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-8 flex items-center justify-between gap-3">
        <span className="apple-caption-strong text-[color:var(--accent)] inline-flex items-center gap-1.5 group-hover:gap-2 transition-all">
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
    <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
      <rect x="0" y="0" width="40" height="40" rx="10" fill="currentColor" opacity="0.10" />
      <line x1="11" y1="11" x2="11" y2="22" stroke="currentColor" strokeWidth="1.4" />
      <line x1="11" y1="11" x2="11" y2="16" stroke="currentColor" strokeWidth="1.2" />
      <line x1="8" y1="11" x2="8" y2="16" stroke="currentColor" strokeWidth="1.2" />
      <line x1="14" y1="11" x2="14" y2="16" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8 16 Q8 19 11 19 Q14 19 14 16" stroke="currentColor" strokeWidth="1.4" fill="none" />
      <line x1="11" y1="19" x2="11" y2="32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M28 11 Q24 16 24 25 L28 25 L28 11 Z" fill="currentColor" />
      <line x1="28" y1="25" x2="28" y2="32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function GciGlyph() {
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
      <rect x="0" y="0" width="40" height="40" rx="10" fill="currentColor" opacity="0.10" />
      <circle cx="20" cy="20" r="11" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M20 9 a11 11 0 0 1 0 22" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <line x1="9" y1="20" x2="31" y2="20" stroke="currentColor" strokeWidth="1.2" />
      <path d="M20 9 q5 11 0 22 q-5 -11 0 -22" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M14 24 l3.5 -4 2.5 2.5 4 -5.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EventsGlyph() {
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
      <rect x="0" y="0" width="40" height="40" rx="10" fill="currentColor" opacity="0.10" />
      {/* music note */}
      <path d="M17 11 L28 9 L28 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="14" cy="26" r="3.4" fill="currentColor" />
      <circle cx="25" cy="24" r="3.4" fill="currentColor" />
      <line x1="17" y1="11" x2="17" y2="26" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      {/* spark / event accent */}
      <path d="M10 12 l1 2.5 2.5 1 -2.5 1 -1 2.5 -1 -2.5 -2.5 -1 2.5 -1 z" fill="currentColor" opacity="0.7" />
    </svg>
  );
}

function GolfFlagGlyph() {
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
      <rect x="0" y="0" width="40" height="40" rx="10" fill="currentColor" opacity="0.10" />
      <line x1="13" y1="9" x2="13" y2="30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M13 11 L28 14 L25 17 L28 20 L13 22 Z" fill="currentColor" />
      <line x1="7" y1="30" x2="33" y2="30" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
      <circle cx="22" cy="29" r="2" fill="currentColor" opacity="0.6" />
    </svg>
  );
}
