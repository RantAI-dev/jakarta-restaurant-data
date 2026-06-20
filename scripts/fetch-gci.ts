/**
 * GCI bulk fetch — pulls EVERY restaurant and cafe inside the DKI Jakarta
 * administrative boundary from the OpenStreetMap Overpass API, plus hotels
 * rated 3 & 4 stars (their in-house dining). Unlike scripts/fetch-osm.ts this
 * does NOT filter to international cuisines — local Indonesian food is kept,
 * because the GCI brief asks for "semua restoran & cafe di Jakarta".
 *
 * Run with:  bun scripts/fetch-gci.ts
 * Writes:    lib/gci-osm.ts
 *
 * Area query (area["name"=...]) restricts results to the real DKI polygon,
 * so no rectangular-bbox trimming is needed.
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const QUERY = `[out:json][timeout:300];
area["name"="Daerah Khusus Ibukota Jakarta"]["admin_level"="4"]->.dki;
(
  node["amenity"="restaurant"](area.dki);
  way["amenity"="restaurant"](area.dki);
  node["amenity"="cafe"](area.dki);
  way["amenity"="cafe"](area.dki);
  node["tourism"="hotel"](area.dki);
  way["tourism"="hotel"](area.dki);
);
out center tags;`;

/** Classify a hotel as 3 or 4 star from its stars tag, else from a
 *  brand/name heuristic. Returns null for 5-star, budget, or unknown —
 *  those are excluded (GCI brief asks for hotel ★3 & ★4 only). */
function hotelStar(tags: Record<string, string>): 3 | 4 | null {
  const s = (tags.stars ?? "").replace(",", ".");
  if (s) {
    if (s.startsWith("3")) return 3;
    if (s.startsWith("4")) return 4;
    return null; // 1, 2, 5
  }
  const hay = `${tags.name ?? ""} ${tags.brand ?? ""} ${tags.operator ?? ""}`.toLowerCase();
  if (hay.includes("holiday inn express")) return 3;
  const FIVE = ["ritz", "pullman", "westin", "grand hyatt", "sheraton", "alila", "kempinski", "mandarin oriental", "mulia", "shangri", "four seasons", "jw marriott", "raffles", "fairmont", "st. regis", "st regis", "sofitel", "ayana", "langham", "hermitage", "dharmawangsa", "grand kemang", "borobudur", "aryaduta", "melia", "intercontinental", "doubletree", "double tree", "kimaya", "sahid jaya", "gran mahakam"];
  if (FIVE.some((b) => hay.includes(b))) return null;
  const BUDGET = ["reddoorz", "red doorz", "oyo", "ibis budget", "pop!", "pop hotel", "zenrooms", "zen rooms", "whiz ", "nida", "kuretake", "spot on", "airy", "koolkost", "collection o", "capital o", "townhouse", "sans hotel", "bobobox", "tinggal", "super oyo", "redliving", "urbanview"];
  if (BUDGET.some((b) => hay.includes(b))) return null;
  const FOUR = ["novotel", "mercure", "aston", "harris", "santika premiere", "holiday inn", "swiss-bel", "swiss bel", "grand mercure", "best western premier", "artotel", "four points", "horison", "oria", "morrissey", "royale", "grand whiz", "grand zuri", "fm7", "verse hotel", "ashley", "oakwood", "somerset", "fraser", "goodrich", "grand sahid", "sari pan", "redtop", "atlet century", "menara peninsula", "kristal"];
  if (FOUR.some((b) => hay.includes(b))) return 4;
  const THREE = ["ibis", "favehotel", "fave hotel", "neo ", "hotel neo", "all nite", "amaris", "grandhika", "yello", "citadines", "zest", "prime park", "santika", "whiz prime", "primahotel", "g sign", "batiqa", "max one", "maxone", "tjokro", "swiss-belinn", "swiss belinn"];
  if (THREE.some((b) => hay.includes(b))) return 3;
  return null;
}

type Element = {
  type: "node" | "way";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};
type OverpassResp = { elements: Element[] };

type Tier = "Hotel ★4" | "Hotel ★3" | "Restoran" | "Cafe";

type GciOsm = {
  id: string;
  osmId: string;
  name: string;
  cuisine: string;
  area: string;
  city: string; // Indonesian sub-region
  /** Street address composed from OSM addr:* tags ("" when OSM has none). */
  address: string;
  tier: Tier;
  hotel?: string;
  lat: number;
  lng: number;
};

/** Compose a human address from OSM addr:* tags. Returns "" when OSM has no
 *  street-level data (Indonesian OSM coverage is patchy) so the consumer can
 *  fall back to the kawasan/city. Never invents data. */
function buildAddress(tags: Record<string, string>): string {
  const street = tags["addr:street"]?.trim();
  const hn = tags["addr:housenumber"]?.trim();
  const suburb = (
    tags["addr:suburb"] ??
    tags["addr:city_district"] ??
    tags["addr:neighbourhood"] ??
    ""
  ).trim();
  const city = tags["addr:city"]?.trim();
  const postcode = tags["addr:postcode"]?.trim();
  const parts: string[] = [];
  if (street) parts.push(hn ? `${street} No. ${hn}` : street);
  if (suburb) parts.push(suburb);
  if (city) parts.push(city);
  if (postcode) parts.push(postcode);
  // Require at least a street for it to count as an "address".
  return street ? parts.join(", ") : "";
}

/** Prettify a raw OSM cuisine tag → "Italian", "Sea Food" etc. Keeps the
 *  first listed cuisine; returns "—" when absent. */
function prettyCuisine(tag: string | undefined, amenity: string): string {
  if (!tag) return amenity === "cafe" ? "Cafe / Coffee" : "—";
  const first = tag.split(/[;,]/)[0].trim().replace(/_/g, " ");
  if (!first) return "—";
  return first
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
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

/** DKI sub-region in Indonesian, from addr:city then coordinate fallback. */
function pickCity(tags: Record<string, string>, lat: number, lng: number): string {
  const d = (tags["addr:city"] ?? tags["addr:city_district"] ?? "").toLowerCase();
  if (d.includes("kepulauan seribu") || d.includes("thousand")) return "Kepulauan Seribu";
  if (d.includes("selatan") || d.includes("south")) return "Jakarta Selatan";
  if (d.includes("utara") || d.includes("north")) return "Jakarta Utara";
  if (d.includes("pusat") || d.includes("central")) return "Jakarta Pusat";
  if (d.includes("barat") || d.includes("west")) return "Jakarta Barat";
  if (d.includes("timur") || d.includes("east")) return "Jakarta Timur";

  // Kepulauan Seribu — islands north of the mainland.
  if (lat > -6.04 && lng < 106.80) return "Kepulauan Seribu";
  // Coordinate fallback tuned to each city centre.
  if (lat > -6.16) {
    if (lng < 106.77) return "Jakarta Barat";
    return "Jakarta Utara";
  }
  if (lat > -6.22) {
    if (lng < 106.79) return "Jakarta Barat";
    if (lng > 106.89) return "Jakarta Timur";
    return "Jakarta Pusat";
  }
  if (lng < 106.78) return "Jakarta Barat";
  if (lng > 106.89) return "Jakarta Timur";
  return "Jakarta Selatan";
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

function normNameForDedup(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[‘’“”]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

async function main() {
  console.log("→ Querying Overpass for ALL restaurants + cafes + 3/4★ hotels in DKI…");
  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "jakarta-gci-data/1.0 (https://github.com/RantAI-dev/jakarta-restaurant-data)",
      Accept: "application/json",
    },
    body: "data=" + encodeURIComponent(QUERY),
  });
  if (!res.ok) throw new Error(`Overpass HTTP ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as OverpassResp;
  console.log(`← Overpass returned ${data.elements.length} elements`);

  // ── PASS 1: collect 3 & 4 star hotels (used only to CLASSIFY nearby
  //     restaurants/cafes — hotels themselves are never emitted as rows). ──
  type Hotel = { name: string; stars: 3 | 4; lat: number; lng: number };
  const hotels: Hotel[] = [];
  for (const el of data.elements) {
    const tags = el.tags ?? {};
    if (tags.tourism !== "hotel") continue;
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    const name = (tags["name:en"] ?? tags.name)?.trim();
    if (!name || lat === undefined || lng === undefined) continue;
    const stars = (tags.stars ?? "").replace(",", ".");
    hotels.push({ name, stars: stars.startsWith("4") ? 4 : 3, lat, lng });
  }

  // Haversine distance in metres.
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

  // A restaurant/cafe within this radius of a 3/4★ hotel is treated as the
  // hotel's in-house dining venue.
  const HOTEL_RADIUS_M = 90;
  function nearestHotel(lat: number, lng: number): Hotel | undefined {
    let best: Hotel | undefined;
    let bestD = HOTEL_RADIUS_M;
    for (const h of hotels) {
      const d = distM(lat, lng, h.lat, h.lng);
      if (d <= bestD) {
        bestD = d;
        best = h;
      }
    }
    return best;
  }

  // ── PASS 2: build venue rows from restaurants + cafes. A venue inside a
  //     3/4★ hotel is re-tiered as "Hotel ★N" and carries the host hotel. ──
  const seen = new Set<string>();
  const out: GciOsm[] = [];

  for (const el of data.elements) {
    const tags = el.tags ?? {};
    const amenity = tags.amenity ?? "";
    const tourism = tags.tourism ?? "";
    const isHotel = tourism === "hotel";
    if (amenity !== "restaurant" && amenity !== "cafe" && !isHotel) continue;
    const rawName = tags["name:en"] ?? tags.name;
    if (!rawName) continue; // skip unnamed venues
    const name = rawName.trim();

    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (lat === undefined || lng === undefined) continue;

    let tier: Tier;
    let hotel: string | undefined;
    let cuisine: string;
    if (isHotel) {
      // Hotel row: represents the hotel's in-house dining. Where the venue has
      // no separately-named restaurant, the HOTEL NAME stands in (per brief).
      const stars = hotelStar(tags);
      if (stars === null) continue; // not a 3/4-star hotel → skip
      tier = stars === 4 ? "Hotel ★4" : "Hotel ★3";
      hotel = `${name} (★${stars})`;
      cuisine = "Restoran Hotel";
    } else {
      // Bulk restaurant/cafe coverage. In-hotel restaurants are NOT inferred by
      // proximity (that mislabelled chains/warteg); named in-hotel restaurants
      // live as a curated list in lib/gci.ts.
      tier = amenity === "cafe" ? "Cafe" : "Restoran";
      cuisine = prettyCuisine(tags.cuisine, amenity);
    }

    // Dedup by normalised name + ~110 m coordinate bucket.
    const key = `${normNameForDedup(name)}@${lat.toFixed(3)},${lng.toFixed(3)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    out.push({
      id: `osm-${el.type[0]}-${el.id}`,
      osmId: `${el.type}/${el.id}`,
      name,
      cuisine,
      area: pickArea(tags),
      city: pickCity(tags, lat, lng),
      address: buildAddress(tags),
      tier,
      hotel,
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
    });
  }

  console.log(`  (${hotels.length} hotels ★3/★4 used for classification)`);

  // Sort: hotels first (★4, ★3), then restoran, then cafe; alpha within.
  const TIER_RANK: Record<Tier, number> = {
    "Hotel ★4": 0,
    "Hotel ★3": 1,
    Restoran: 2,
    Cafe: 3,
  };
  out.sort((a, b) =>
    TIER_RANK[a.tier] - TIER_RANK[b.tier] || a.name.localeCompare(b.name)
  );

  const byTier = out.reduce<Record<string, number>>((m, r) => {
    m[r.tier] = (m[r.tier] ?? 0) + 1;
    return m;
  }, {});
  console.log(`✓ ${out.length} venues after dedup:`, byTier);

  const header = `// Generated by scripts/fetch-gci.ts on ${new Date().toISOString()}
// Do not edit by hand. Re-run \`bun scripts/fetch-gci.ts\` to refresh.
// Source: OpenStreetMap Overpass API (https://overpass-api.de/) — © OSM contributors, ODbL.
// Scope: ALL restaurants + cafes in DKI Jakarta, plus 3 & 4 star hotels.

export type GciOsm = {
  id: string;
  osmId: string;
  name: string;
  cuisine: string;
  area: string;
  city: string;
  address: string;
  tier: "Hotel ★4" | "Hotel ★3" | "Restoran" | "Cafe";
  hotel?: string;
  lat: number;
  lng: number;
};

export const GCI_OSM_FETCHED_AT = ${JSON.stringify(new Date().toISOString())};
// Stored as a JSON string + JSON.parse so the ~2.5k-element array does not
// trip TypeScript's "union type too complex" limit (TS2590) on large literals.
export const GCI_OSM: GciOsm[] = JSON.parse(${JSON.stringify(JSON.stringify(out))});
`;

  // import.meta.dir is Bun-specific; use the URL form so tsc is happy too.
  const here = new URL(".", import.meta.url).pathname;
  const dest = resolve(here, "..", "lib", "gci-osm.ts");
  writeFileSync(dest, header, "utf8");
  console.log(`→ Wrote ${dest}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
