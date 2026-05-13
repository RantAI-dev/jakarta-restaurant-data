"use client";

import Link from "next/link";
import { CompassRose } from "./CompassRose";

export type Section = "restaurants" | "golf" | "home";
export type View = "list" | "map";

export function AtlasNav({
  section,
  view,
  langToggle,
  rightSlot,
  t,
}: {
  section: Section;
  /** Only restaurants + golf carry a list/map toggle. */
  view?: View;
  langToggle?: React.ReactNode;
  rightSlot?: React.ReactNode;
  t: (k: string) => string;
}) {
  return (
    <div className="sticky top-0 z-30 frosted border-b border-hairline">
      <div className="mx-auto max-w-[1320px] px-6 h-[56px] flex items-center gap-4">
        {/* Wordmark */}
        <Link
          href="/"
          className="compass-on-hover flex items-center gap-2.5 group"
        >
          <span className="text-ink">
            <CompassRose size={26} />
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="atlas-mono text-ink">JAKARTA</span>
            <span className="atlas-italic text-[18px] leading-none text-ink">
              Atlas
            </span>
          </div>
        </Link>

        {/* Section tabs */}
        <nav className="hidden sm:flex items-center ml-6">
          <SectionLink
            href="/restaurants"
            active={section === "restaurants"}
            label={t("nav.section_restaurants")}
          />
          <span className="mx-2 text-hairline" aria-hidden>
            ·
          </span>
          <SectionLink
            href="/golf"
            active={section === "golf"}
            label={t("nav.section_golf")}
          />
        </nav>

        {/* Right cluster */}
        <div className="ml-auto flex items-center gap-2.5">
          {view && (
            <div className="inline-flex p-0.5 bg-canvas border border-hairline rounded-full">
              <Link
                href={
                  section === "restaurants" ? "/restaurants" : "/golf"
                }
                className={`press-scale rounded-full px-3 py-1 apple-caption-strong ${
                  view === "list"
                    ? "bg-ink text-white"
                    : "text-ink-muted-80 hover:text-ink"
                }`}
              >
                {t("nav.view_list")}
              </Link>
              <Link
                href={
                  section === "restaurants"
                    ? "/restaurants/map"
                    : "/golf/map"
                }
                className={`press-scale rounded-full px-3 py-1 apple-caption-strong ${
                  view === "map"
                    ? "bg-ink text-white"
                    : "text-ink-muted-80 hover:text-ink"
                }`}
              >
                {t("nav.view_map")}
              </Link>
            </div>
          )}
          {rightSlot}
          {langToggle}
        </div>
      </div>
    </div>
  );
}

function SectionLink({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`atlas-mono px-1 py-1 transition-colors ${
        active
          ? "text-[color:var(--accent)]"
          : "text-ink-muted-48 hover:text-ink"
      }`}
    >
      {label}
    </Link>
  );
}

export function LangToggle({
  lang,
  onToggle,
  t,
}: {
  lang: "id" | "en";
  onToggle: () => void;
  t: (k: string) => string;
}) {
  return (
    <button
      onClick={onToggle}
      aria-label={`Switch language to ${t("nav.switch_to")}`}
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
  );
}
