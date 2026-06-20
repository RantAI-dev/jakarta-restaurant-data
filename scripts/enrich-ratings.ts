/**
 * Rating enrichment — attaches a REAL rating + review count to every GCI
 * venue using the Google Places API (New). No ratings are ever fabricated:
 * a venue only gets a number if Google actually returns one.
 *
 * Requires an API key with the "Places API (New)" enabled and billing on:
 *   GOOGLE_PLACES_API_KEY=xxxx bun scripts/enrich-ratings.ts
 *
 * Behaviour:
 *  - Resumable: re-reads lib/gci-ratings.ts and skips venues already resolved.
 *  - Rate-limited (~12 req/s) and retries transient errors.
 *  - For each venue it does a Places searchText biased to the venue's
 *    coordinates, takes the top match, and records rating + userRatingCount.
 *  - Venues Google has no rating for are recorded as { found:false } so they
 *    are not retried forever and can be reported / sourced elsewhere.
 *
 * Cost: Places searchText (Essentials+Pro) ≈ USD 32 / 1000 calls. ~2.6k
 * venues ≈ USD 80 one-off (then resumes free on cached entries).
 */

import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { GCI_RESTAURANTS } from "../lib/gci";

const KEY =
  process.env.places_api_key ??
  process.env.PLACES_API_KEY ??
  process.env.GOOGLE_PLACES_API_KEY;
if (!KEY) {
  console.error(
    "✗ Set places_api_key in .env (Places API New, billing enabled)."
  );
  process.exit(1);
}

// Optional: `bun scripts/enrich-ratings.ts 3` resolves only the first 3 venues
// (cheap test run to verify the key before spending on the full ~2.5k batch).
const LIMIT = Number(process.argv[2]) || Infinity;

type Rating = {
  rating?: number;
  reviewCount?: number;
  source?: "Google";
  placeId?: string;
  found: boolean;
};

const OUT = resolve(new URL(".", import.meta.url).pathname, "../lib/gci-ratings.ts");

/** Load already-resolved ratings so the run is resumable. */
function loadExisting(): Record<string, Rating> {
  if (!existsSync(OUT)) return {};
  try {
    const txt = readFileSync(OUT, "utf8");
    const m = txt.match(/JSON\.parse\((".*")\)/s);
    if (m) return JSON.parse(JSON.parse(m[1]));
  } catch {}
  return {};
}

class QuotaStop extends Error {}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Haversine distance in metres. */
function distM(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Strict: matched name must contain the full query name (normalised). Used
 *  for coord-less entries where proximity can't disambiguate. */
function nameContains(query: string, matched: string): boolean {
  if (!matched) return false;
  return norm(matched).includes(norm(query));
}

/** True if query & matched name are plausibly the same place. Lenient: shares
 *  a token of length ≥4, or one string contains the other (normalised). */
function nameMatches(query: string, matched: string): boolean {
  if (!matched) return false;
  const a = norm(query);
  const b = norm(matched);
  if (!a || !b) return false;
  if (a.includes(b) || b.includes(a)) return true;
  const stop = new Set(["the", "restaurant", "resto", "cafe", "coffee", "hotel", "jakarta", "and", "dan", "bar", "kitchen", "house"]);
  const ta = new Set(a.split(" ").filter((w) => w.length >= 4 && !stop.has(w)));
  const tb = new Set(b.split(" ").filter((w) => w.length >= 4 && !stop.has(w)));
  for (const w of ta) if (tb.has(w)) return true;
  return false;
}

async function lookup(
  name: string,
  lat?: number,
  lng?: number,
  hint?: string
): Promise<Rating> {
  const body: Record<string, unknown> = {
    // hint = host hotel name, helps disambiguate in-hotel restaurants.
    textQuery: hint ? `${name} ${hint} Jakarta` : `${name} Jakarta`,
    maxResultCount: 1,
    languageCode: "id",
  };
  if (lat !== undefined && lng !== undefined) {
    body.locationBias = {
      circle: { center: { latitude: lat, longitude: lng }, radius: 400 },
    };
  }
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": KEY!,
        // displayName is needed for the mismatch guard; same Pro SKU, no extra cost.
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.location,places.rating,places.userRatingCount",
      },
      body: JSON.stringify(body),
    });
    if (res.status >= 500) {
      await sleep(1000 * (attempt + 1));
      continue;
    }
    // Quota / billing / key errors: STOP the run (don't mark venues as
    // unrated). Progress is already saved → just rerun later to resume.
    if (res.status === 429 || res.status === 403) {
      throw new QuotaStop(`HTTP ${res.status}: ${await res.text()}`);
    }
    if (!res.ok) {
      console.warn(`  ! ${name}: HTTP ${res.status} ${await res.text()}`);
      return { found: false };
    }
    const data = (await res.json()) as {
      places?: {
        id: string;
        displayName?: { text?: string };
        location?: { latitude: number; longitude: number };
        rating?: number;
        userRatingCount?: number;
      }[];
    };
    const p = data.places?.[0];
    if (!p || p.rating === undefined) return { found: false };
    const matched = p.displayName?.text ?? "";
    // Disambiguation: accept if the match sits at essentially the same spot as
    // the OSM venue (≤150 m → same physical place even if rebranded/renamed),
    // OR the names clearly correspond. Rejects same-named places elsewhere and
    // wrong nearby places. Keeps ratings accurate ("harus sesuai").
    const hasCoords = lat !== undefined && lng !== undefined && !!p.location;
    const d = hasCoords
      ? distM(lat!, lng!, p.location!.latitude, p.location!.longitude)
      : Infinity;
    // With coords: ≤150 m → same physical place (accept even if rebranded);
    // else a name match is only trusted within 600 m. Without coords (curated
    // entries): rely on the name match alone.
    const ok = hasCoords
      ? d <= 150 || (nameMatches(name, matched) && d <= 600)
      : nameContains(name, matched); // coord-less → require strict name containment
    if (!ok) {
      if (process.env.VERBOSE)
        console.log(`  ✗ "${name}" → "${matched}" (${Math.round(d)}m, rejected)`);
      return { found: false };
    }
    if (process.env.VERBOSE)
      console.log(`  ✓ "${name}" → "${matched}"  ${p.rating}★ (${p.userRatingCount}) ${Math.round(d)}m`);
    return {
      rating: p.rating,
      reviewCount: p.userRatingCount ?? 0,
      source: "Google",
      placeId: p.id,
      found: true,
    };
  }
  return { found: false };
}

function persist(map: Record<string, Rating>) {
  const header = `// Generated by scripts/enrich-ratings.ts — REAL Google ratings, never fabricated.
// Re-run \`GOOGLE_PLACES_API_KEY=... bun scripts/enrich-ratings.ts\` to refresh/continue.

export type GciRating = {
  rating?: number;
  reviewCount?: number;
  source?: "Google";
  placeId?: string;
  found: boolean;
};

export const GCI_RATINGS: Record<string, GciRating> = JSON.parse(${JSON.stringify(
    JSON.stringify(map)
  )});
`;
  writeFileSync(OUT, header);
}

async function main() {
  const map = loadExisting();
  // RETRY_EMPTY=1 re-attempts venues previously cached as not-found (e.g. after
  // improving the query). TIER=Hotel scopes the run to one tier prefix.
  const retryEmpty = !!process.env.RETRY_EMPTY;
  const tierScope = process.env.TIER;
  const todo = GCI_RESTAURANTS.filter((r) => {
    if (r.rating !== undefined) return false; // already rated (SEED or enriched)
    if (tierScope && !r.tier.startsWith(tierScope)) return false;
    const cached = map[r.id];
    if (cached && !(retryEmpty && !cached.found)) return false;
    return true;
  }).slice(0, LIMIT);
  console.log(
    `→ ${todo.length} venues to resolve${
      LIMIT !== Infinity ? ` (TEST limit ${LIMIT})` : ""
    }${tierScope ? ` [tier ${tierScope}]` : ""}${retryEmpty ? " [retry empties]" : ""} (${Object.keys(map).length} cached)`
  );

  let done = 0;
  let hit = 0;
  try {
    for (const r of todo) {
      // For hotel rows, pass the host hotel name (minus the "(★N)") as a hint.
      const hint = r.hotel?.replace(/\s*\(★\d\)\s*$/, "");
      const res = await lookup(r.name, r.lat, r.lng, hint);
      map[r.id] = res;
      if (res.found) hit++;
      done++;
      if (done % 50 === 0) {
        persist(map);
        console.log(`  …${done}/${todo.length} (${hit} rated) — saved`);
      }
      await sleep(80); // ~12 req/s, well under quota
    }
  } catch (e) {
    persist(map);
    if (e instanceof QuotaStop) {
      console.error(
        `\n⏸ Quota/billing limit hit after ${done} venues — progress saved.\n` +
          `  ${e.message}\n  Rerun the same command later to resume from here.`
      );
      process.exit(2);
    }
    throw e;
  }
  persist(map);
  console.log(`✓ Done. ${hit}/${todo.length} got a real Google rating.`);
  const missing = todo.length - hit;
  if (missing) {
    console.log(
      `  ${missing} venues have no Google rating — report or source from another platform.`
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
