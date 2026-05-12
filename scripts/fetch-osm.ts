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

// Greater Jakarta bounding box (DKI + Bodetabek): south, west, north, east.
const BBOX = "-6.5,106.55,-5.95,107.15";

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

function slug(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
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

    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (typeof lat !== "number" || typeof lng !== "number") continue;

    const name = rawName.trim();
    const dedupKey = `${slug(name)}|${lat.toFixed(3)}|${lng.toFixed(3)}`;
    if (seen.has(dedupKey)) continue;
    seen.add(dedupKey);

    out.push({
      id: `osm-${el.type[0]}-${el.id}`,
      osmId: `${el.type}/${el.id}`,
      name,
      cuisine,
      category: pickCategory(tags),
      area: pickArea(tags),
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
