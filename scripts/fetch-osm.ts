/**
 * One-shot dev script. Pulls every restaurant/bar/cafe/pub in the Greater
 * Jakarta bounding box that has a `cuisine` tag from the OpenStreetMap
 * Overpass API, normalises the tag values into the directory's cuisine
 * taxonomy, filters out local Indonesian cuisines, and writes the result
 * to `lib/restaurants-osm.ts` for the app to consume.
 *
 * Run with:  bun scripts/fetch-osm.ts
 *
 * The Overpass API is rate-limited but free and key-less. A single query
 * over Greater Jakarta typically returns in 20–90 seconds.
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

// DKI Jakarta bounding box only — 5 administrative cities plus the
// Kepulauan Seribu regency (the chain of islands north of the mainland,
// extending up to roughly -5.4° latitude).
// Format: south, west, north, east.
const BBOX = "-6.37,106.68,-5.40,106.97";

const QUERY = `[out:json][timeout:300];
(
  node["amenity"~"restaurant|bar|cafe|pub|fast_food"]["cuisine"](${BBOX});
  way["amenity"~"restaurant|bar|cafe|pub|fast_food"]["cuisine"](${BBOX});
);
out center tags;`;

// OSM cuisine tag → our directory taxonomy. Values not in this map (or in
// SKIP) are dropped. OSM tags are lower_snake_case; some entries use `;`
// to join multiple cuisines (e.g. "pizza;italian"); we take the first one
// that has a mapping.
const CUISINE_MAP: Record<string, string> = {
  // Italian family
  italian: "Italian",
  pizza: "Italian Pizza",
  pasta: "Italian",
  neapolitan: "Neapolitan Pizza",
  // French
  french: "French",
  bistro: "French Bistro",
  // Japanese family
  japanese: "Japanese",
  sushi: "Japanese (Sushi)",
  ramen: "Japanese (Ramen)",
  izakaya: "Japanese (Izakaya)",
  yakiniku: "Japanese (Yakiniku)",
  teppanyaki: "Japanese (Teppanyaki)",
  // Korean
  korean: "Korean BBQ",
  korean_bbq: "Korean BBQ",
  // Chinese family
  chinese: "Chinese",
  cantonese: "Chinese (Cantonese)",
  dim_sum: "Chinese (Dim Sum)",
  dimsum: "Chinese (Dim Sum)",
  szechuan: "Chinese (Sichuan)",
  sichuan: "Chinese (Sichuan)",
  hakka: "Chinese (Hakka)",
  taiwanese: "Chinese (Taiwanese)",
  hot_pot: "Chinese (Hot Pot)",
  // SE Asia
  thai: "Thai",
  vietnamese: "Vietnamese",
  pho: "Vietnamese",
  filipino: "Filipino",
  malaysian: "Malaysian",
  singaporean: "Singaporean",
  // S Asia
  indian: "Indian",
  pakistani: "Pakistani",
  // Latin
  mexican: "Mexican",
  brazilian: "Brazilian",
  argentinian: "Argentinian",
  peruvian: "Peruvian",
  // Europe (rest)
  spanish: "Spanish",
  tapas: "Spanish",
  german: "German",
  bavarian: "German (Bavarian)",
  greek: "Greek",
  mediterranean: "Mediterranean",
  british: "Modern British",
  irish: "Irish",
  belgian: "Belgian",
  swiss: "Swiss",
  scandinavian: "Scandinavian",
  // Middle East
  middle_eastern: "Middle Eastern",
  arab: "Middle Eastern (Arabic)",
  arabic: "Middle Eastern (Arabic)",
  lebanese: "Lebanese",
  turkish: "Turkish",
  persian: "Persian / Iranian",
  iranian: "Persian / Iranian",
  syrian: "Middle Eastern (Syrian)",
  yemeni: "Middle Eastern (Yemeni)",
  // Africa
  ethiopian: "Ethiopian",
  moroccan: "Moroccan",
  egyptian: "Egyptian",
  // Pacific
  hawaiian: "Hawaiian (Poke)",
  poke: "Hawaiian (Poke)",
  // American
  american: "American",
  burger: "American (Burgers)",
  burgers: "American (Burgers)",
  steakhouse: "American Steakhouse",
  steak_house: "American Steakhouse",
  steak: "American Steakhouse",
  bbq: "American BBQ",
  // Bars / drinks
  bar: "Bar",
  cocktail: "Cocktail Bar",
  cocktail_bar: "Cocktail Bar",
  wine_bar: "Wine Bar",
  pub: "Pub",
  beer: "Craft Beer",
  craft_beer: "Craft Beer",
  brewery: "Craft Beer",
  // Sweet / cafe (international)
  ice_cream: "Ice Cream",
  gelato: "Italian (Gelato)",
  bakery: "Bakery",
  patisserie: "French Bakery & Bistro",
  // Generic
  international: "International",
  fusion: "Fusion",
  asian: "Asian Fusion",
  pan_asian: "Asian Fusion",
  // Specialty
  vegetarian: "Vegetarian (International)",
  vegan: "Vegan (International)",
  seafood: "International Seafood",
  buffet: "International Buffet",
};

// Drop cuisines that are local Indonesian — out of scope for an
// "international cuisine" directory.
const SKIP_CUISINES = new Set([
  "indonesian",
  "padang",
  "sundanese",
  "javanese",
  "betawi",
  "minangkabau",
  "balinese",
  "manado",
  "manadonese",
  "aceh",
  "acehnese",
  "batak",
  "regional",
  "sate",
  "satay",
  "warung",
  "soto",
  "bakso",
  "rendang",
  "nasi_goreng",
  "nasi_uduk",
  "nasi_padang",
  "gado-gado",
  "gado_gado",
  "ayam",
  "ayam_goreng",
  "ikan_bakar",
  "pecel",
  "rumah_makan",
  "asian_indonesian",
  "indonesian_padang",
]);

type Element = {
  type: "node" | "way";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

type OverpassResp = { elements: Element[] };

type OsmRestaurant = {
  id: string;
  osmId: string;
  name: string;
  cuisine: string;
  category: "Food" | "Beverage" | "Food & Beverage";
  area: string;
  city: string;
  address?: string;
  lat: number;
  lng: number;
  phone?: string;
  website?: string;
};

function pickCuisine(tag: string | undefined): string | null {
  if (!tag) return null;
  const parts = tag
    .toLowerCase()
    .split(/[;,]/)
    .map((s) => s.trim());
  for (const p of parts) {
    if (SKIP_CUISINES.has(p)) return null;
  }
  for (const p of parts) {
    if (CUISINE_MAP[p]) return CUISINE_MAP[p];
  }
  return null;
}

/** Reject venues whose name signals Indonesian local cuisine even
 *  when their OSM cuisine tag is generic ("asian", "international").
 *  Padang, sate, soto, warung, warteg — these are local. */
function nameLooksLocal(name: string): boolean {
  const n = name.toLowerCase();
  if (/\bpadang\b/.test(n)) return true;
  if (/\bwarung\b/.test(n)) return true;
  if (/\bwarteg\b/.test(n)) return true;
  if (/\bsate\b/.test(n)) return true;
  if (/\bsoto\b/.test(n)) return true;
  if (/\bmartabak\b/.test(n)) return true;
  if (/\bnasi goreng\b/.test(n)) return true;
  if (/\bgudeg\b/.test(n)) return true;
  if (/\brendang\b/.test(n)) return true;
  return false;
}

function pickCategory(tags: Record<string, string>): OsmRestaurant["category"] {
  const a = tags.amenity ?? "";
  if (a === "bar" || a === "pub") return "Beverage";
  if (a === "cafe") return "Food & Beverage";
  return "Food";
}

function pickAddress(tags: Record<string, string>): string | undefined {
  const street = tags["addr:street"];
  const housenum = tags["addr:housenumber"];
  const suburb = tags["addr:suburb"] ?? tags["addr:city_district"];
  const city = tags["addr:city"];
  const bits = [
    [street, housenum].filter(Boolean).join(" ").trim(),
    suburb,
    city,
  ]
    .filter(Boolean)
    .filter((s) => s && s !== "Jakarta")
    .join(", ");
  return bits || undefined;
}

function pickArea(tags: Record<string, string>): string {
  const suburb =
    tags["addr:suburb"] ??
    tags["addr:city_district"] ??
    tags["addr:neighbourhood"];
  const city = tags["addr:city"] ?? "Jakarta";
  if (suburb) return `${suburb}, ${city}`;
  return city;
}

/** Hard geographic gate — returns true only for coordinates that fall
 *  inside actual DKI Jakarta administrative boundaries. The Overpass
 *  bbox is a rectangle so it picks up neighbouring Tangerang/Bekasi/
 *  Depok corners; this function trims them.
 */
function isInsideDKI(lat: number, lng: number): boolean {
  // Kepulauan Seribu — islands extending north into the Java Sea.
  if (lat >= -5.95 && lat <= -5.30 && lng >= 106.40 && lng <= 106.80) {
    return true;
  }
  // Mainland DKI bbox (slightly tightened from 106.975 → 106.96 east).
  if (lat >= -6.37 && lat <= -6.04 && lng >= 106.72 && lng <= 106.96) {
    // Clip NW corner: PIK 2 / Dadap / Kosambi sit in Tangerang
    // Regency. Pier 503 at -6.089/106.73 → widen to 106.74.
    if (lat > -6.10 && lng < 106.74) return false;
    // Clip S strip: UI Depok / Kukusan / Pondok Cina / Tugu Cimanggis /
    // Burger Bangor at Tugu sits at lat < -6.34 in lng 106.80..106.88.
    if (lat < -6.34 && lng > 106.80 && lng < 106.88) return false;
    // Clip E strip: Bekasi west border (Bintara/Pekayon/Jakasampurna/
    // Pondok Gede). 106.93 cut in central lat band, 106.945 in north.
    if (lng > 106.93 && lat < -6.20 && lat > -6.30) return false;
    if (lng > 106.945 && lat < -6.15 && lat > -6.20) return false;
    // Clip SE corner: Cibubur/Setu/Ciangsana edge of DKI/Bekasi/Bogor.
    if (lat < -6.34 && lng > 106.945) return false;
    // Clip S-central: Cimanggis Depok extends north to -6.365 in
    // lng 106.86..106.90 range.
    if (lat < -6.365 && lng > 106.86 && lng < 106.90) return false;
    // Clip SW corner: Pondok Aren / Pondok Cabe / Bintaro Sektor /
    // Pamulang / Pondok Betung / Jurang Mangu — Tangerang Selatan.
    // Lebak Bulus (DKI) sits east at lng ~106.778.
    if (lat < -6.255 && lng < 106.77) return false;
    // Clip W strip: Cipadu / Larangan / Karang Mulya — Kota Tangerang.
    // Widened from 106.725 → 106.73 and lat band -6.18..-6.24 →
    // -6.17..-6.24 to catch McDonald's at Cipadu (-6.231/106.728).
    if (lng < 106.73 && lat > -6.24 && lat < -6.17) return false;
    return true;
  }
  return false;
}

/** Catches entries whose lat/lng land inside the DKI bbox but whose
 *  street/area/city tags clearly belong to neighbouring municipalities
 *  (Margonda → Depok, BSD → Tangerang, etc.). Returns the non-DKI
 *  label or null. */
function addressTagSaysNonDKI(tags: Record<string, string>): string | null {
  const blob = (
    (tags["addr:street"] ?? "") +
    " " + (tags["addr:city"] ?? "") +
    " " + (tags["addr:suburb"] ?? "") +
    " " + (tags["addr:full"] ?? "") +
    " " + (tags["addr:district"] ?? "")
  ).toLowerCase();
  if (
    blob.includes("margonda") ||
    blob.includes("depok") ||
    blob.includes("beji") ||
    blob.includes("cinere") ||
    blob.includes("kukusan") ||
    blob.includes("pondok cina") ||
    blob.includes("tanah baru, depok") ||
    blob.includes("cimanggis") ||
    blob.includes("tapos") ||
    blob.includes("sukmajaya")
  ) return "Depok";
  if (
    blob.includes("tangerang") ||
    blob.includes("tangsel") ||
    blob.includes("kosambi") ||
    blob.includes("bsd") ||
    blob.includes("bumi serpong") ||
    blob.includes("gading serpong") ||
    blob.includes("karawaci") ||
    blob.includes("alam sutera") ||
    blob.includes("pondok cabe") ||
    blob.includes("pamulang") ||
    blob.includes("ciputat") ||
    blob.includes("serpong") ||
    blob.includes("citra raya") ||
    blob.includes("pasar kemis") ||
    blob.includes("bintaro jaya") ||
    blob.includes("bintaro utama") ||
    blob.includes("bintaro sektor") ||
    blob.includes("pondok aren") ||
    blob.includes("cabe raya") ||
    blob.includes("universitas terbuka") ||
    blob.includes("rempoa") ||
    blob.includes("banten city") ||
    blob.includes("jurang mangu") ||
    blob.includes("pondok betung") ||
    blob.includes("pd. betung") ||
    blob.includes("pd betung") ||
    blob.includes("cipadu") ||
    blob.includes("larangan indah") ||
    blob.includes("larangan utara") ||
    blob.includes("larangan selatan") ||
    blob.includes("karang mulya") ||
    blob.includes("karang tengah") ||
    blob.includes("dadap")
  ) return "Tangerang";
  if (
    blob.includes("bekasi") ||
    blob.includes("cikarang") ||
    blob.includes("cibitung") ||
    blob.includes("pondok gede") ||
    blob.includes("jatibening") ||
    blob.includes("jatiwarna") ||
    blob.includes("jatiasih") ||
    blob.includes("jati asih") ||
    blob.includes("bintara") ||
    blob.includes("kranji") ||
    blob.includes("pekayon") ||
    blob.includes("harapan indah") ||
    blob.includes("galaxy bekasi") ||
    blob.includes("kemang pratama") ||
    blob.includes("radar auri") ||
    blob.includes("jatirahayu") ||
    blob.includes("pondok melati") ||
    blob.includes("jakasampurna") ||
    blob.includes("jaka sampurna") ||
    blob.includes("jaka mulya") ||
    blob.includes("jatimelati") ||
    blob.includes("jati melati") ||
    blob.includes("jaticempaka") ||
    blob.includes("jati cempaka") ||
    blob.includes("jatibening") ||
    blob.includes("jati bening")
  ) return "Bekasi";
  if (
    blob.includes("bogor") ||
    blob.includes("sentul") ||
    blob.includes("cibinong") ||
    blob.includes("ciangsana") ||
    blob.includes("cileungsi") ||
    blob.includes("gunung putri")
  ) return "Bogor";
  return null;
}

/** Maps DKI Jakarta sub-region from address tags or geographic coords. */
function pickCity(tags: Record<string, string>, lat: number, lng: number): string {
  // Address-text blacklist first — catches venues whose coords squeeze
  // inside the DKI bbox but whose street name says Depok/Tangerang/etc.
  const adminOverride = addressTagSaysNonDKI(tags);
  if (adminOverride) return adminOverride;

  // Coordinate-first gate — overrides any wrong addr:city tags such as
  // PIK 2 venues that mistakenly carry addr:city = "Jakarta".
  if (!isInsideDKI(lat, lng)) {
    if (lat > -6.08 && lng < 106.72) return "Tangerang (PIK 2 / Kosambi)";
    if (lng < 106.715) return "Tangerang";
    if (lat < -6.37) return "Tangerang Selatan / Depok";
    if (lng > 106.975) return "Bekasi";
    return "Outside DKI";
  }

  const direct = (tags["addr:city"] ?? tags["addr:city_district"] ?? "").toLowerCase();
  if (direct.includes("kepulauan seribu") || direct.includes("thousand")) {
    return "Kepulauan Seribu";
  }
  if (direct.includes("jakarta selatan") || direct.includes("south jakarta")) {
    return "South Jakarta";
  }
  if (direct.includes("jakarta utara") || direct.includes("north jakarta")) {
    return "North Jakarta";
  }
  if (direct.includes("jakarta pusat") || direct.includes("central jakarta")) {
    return "Central Jakarta";
  }
  if (direct.includes("jakarta barat") || direct.includes("west jakarta")) {
    return "West Jakarta";
  }
  if (direct.includes("jakarta timur") || direct.includes("east jakarta")) {
    return "East Jakarta";
  }
  // Outside DKI but within Greater Jakarta bbox.
  if (direct.includes("tangerang")) return "Tangerang";
  if (direct.includes("bekasi")) return "Bekasi";
  if (direct.includes("depok")) return "Depok";
  if (direct.includes("bogor")) return "Bogor";

  // Fall back to lat/lng classification when addr:city is generic ("Jakarta")
  // or missing. Boundaries below are approximate and tuned to the centre
  // of each DKI Jakarta administrative city.
  if (lat > -6.05) return lng > 106.85 ? "North Jakarta" : "North Jakarta";
  if (lat > -6.16) {
    if (lng < 106.77) return "West Jakarta";
    if (lng > 106.90) return "North Jakarta";
    return "North Jakarta";
  }
  if (lat > -6.22) {
    if (lng < 106.79) return "West Jakarta";
    if (lng > 106.89) return "East Jakarta";
    return "Central Jakarta";
  }
  // Southern half.
  if (lng < 106.78) return "West Jakarta";
  if (lng > 106.89) return "East Jakarta";
  return "South Jakarta";
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Aggressive name normalisation for dedup — collapses smart-quote
 *  variants ("McDonald's" vs "McDonald’s"), spacing variants
 *  ("Mc Donald's"), and case differences ("MIXUE" vs "mixue") to a
 *  single canonical key. Used together with coordinate proximity. */
function normNameForDedup(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[‘’“”]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

async function main() {
  console.log("→ Querying Overpass…");
  const body = "data=" + encodeURIComponent(QUERY);
  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      // Overpass returns 406 to default Bun/curl UAs — needs a real-looking
      // User-Agent identifying the project.
      "User-Agent":
        "jakarta-restaurant-data/1.0 (https://github.com/RantAI-dev/jakarta-restaurant-data)",
      Accept: "application/json",
    },
    body,
  });
  if (!res.ok) {
    throw new Error(`Overpass HTTP ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as OverpassResp;
  console.log(`← Overpass returned ${data.elements.length} elements`);

  const seen = new Set<string>();
  const out: OsmRestaurant[] = [];

  for (const el of data.elements) {
    const tags = el.tags ?? {};
    const rawName = tags["name:en"] ?? tags.name;
    if (!rawName) continue;

    const cuisine = pickCuisine(tags.cuisine);
    if (!cuisine) continue;

    // Drop venues with clearly-local names regardless of cuisine tag.
    if (nameLooksLocal(rawName)) continue;

    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (typeof lat !== "number" || typeof lng !== "number") continue;

    const name = rawName.trim();
    const city = pickCity(tags, lat, lng);
    // Real duplicate detection: same restaurant tagged twice. Match by
    // aggressively-normalised name (catches smart-quote and spacing
    // variants like 'McDonald’s' vs 'Mc Donald's' vs 'McDonalds') at
    // ~111m coordinate proximity (3-decimal lat/lng rounding). Distinct
    // chain branches at different locations stay separate.
    const dedupKey = `${normNameForDedup(name)}|${lat.toFixed(3)}|${lng.toFixed(3)}`;
    if (seen.has(dedupKey)) continue;
    seen.add(dedupKey);

    out.push({
      id: `osm-${el.type[0]}-${el.id}`,
      osmId: `${el.type}/${el.id}`,
      name,
      cuisine,
      category: pickCategory(tags),
      area: pickArea(tags),
      city,
      address: pickAddress(tags),
      lat,
      lng,
      phone: tags.phone ?? tags["contact:phone"],
      website: tags.website ?? tags["contact:website"],
    });
  }

  // Stable order — by cuisine then name — so diffs are small across runs.
  out.sort((a, b) =>
    a.cuisine === b.cuisine
      ? a.name.localeCompare(b.name)
      : a.cuisine.localeCompare(b.cuisine)
  );

  const cuisineCounts = new Map<string, number>();
  for (const r of out) {
    cuisineCounts.set(r.cuisine, (cuisineCounts.get(r.cuisine) ?? 0) + 1);
  }

  console.log(`✓ Kept ${out.length} OSM entries across ${cuisineCounts.size} cuisines`);
  const topCuisines = [...cuisineCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12);
  console.log("Top cuisines:");
  for (const [c, n] of topCuisines) console.log(`  ${n.toString().padStart(4)}  ${c}`);

  // `import.meta.dir` is Bun-specific; fall back via fileURLToPath for TS.
  const here = new URL(".", import.meta.url).pathname;
  const outPath = resolve(here, "..", "lib", "restaurants-osm.ts");
  const generatedAt = new Date().toISOString();
  const file = `// Generated by scripts/fetch-osm.ts on ${generatedAt}
// Do not edit by hand. Re-run \`bun scripts/fetch-osm.ts\` to refresh.
// Source: OpenStreetMap Overpass API (https://overpass-api.de/) — © OSM contributors.

export type OsmRestaurant = {
  id: string;
  osmId: string;
  name: string;
  cuisine: string;
  category: "Food" | "Beverage" | "Food & Beverage";
  area: string;
  city: string;
  address?: string;
  lat: number;
  lng: number;
  phone?: string;
  website?: string;
};

export const OSM_FETCHED_AT = ${JSON.stringify(generatedAt)};
export const OSM_RESTAURANTS: OsmRestaurant[] = ${JSON.stringify(out, null, 2)};
`;
  writeFileSync(outPath, file);
  console.log(`✓ Wrote ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
