/**
 * Address enrichment — attaches a REAL Google `formattedAddress` to every GCI
 * venue. No address is ever fabricated: a venue only gets one if Google returns
 * it for a match we trust (same place_id, or a name/coordinate match).
 *
 *   places_api_key=xxxx bun scripts/fetch-addresses.ts        # all venues
 *   places_api_key=xxxx bun scripts/fetch-addresses.ts 3      # cheap test run
 *
 * Cost-aware by design — we request ONLY the address field:
 *  - Venues WITH a cached place_id → Place Details, field mask "formattedAddress"
 *    = the **Essentials** SKU (cheapest; 10k free calls/month).
 *  - Venues WITHOUT a place_id → searchText biased to coordinates, field mask
 *    adds displayName for the match guard = the **Pro** SKU (5k free/month).
 *
 * Resumable: re-reads lib/gci-addresses.ts and skips venues already resolved.
 */

import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { GCI_RESTAURANTS } from "../lib/gci";

const KEY =
  process.env.places_api_key ??
  process.env.PLACES_API_KEY ??
  process.env.GOOGLE_PLACES_API_KEY;
if (!KEY) {
  console.error("✗ Set places_api_key in .env (Places API New, billing enabled).");
  process.exit(1);
}

const LIMIT = Number(process.argv[2]) || Infinity;
const OUT = resolve(new URL(".", import.meta.url).pathname, "../lib/gci-addresses.ts");

type Addr = { address?: string; found: boolean };
type Map_ = Record<string, Addr>;

const BODETABEK = /bogor|depok|tangerang|bekasi|karawang|cikarang|serpong|\bbsd\b/i;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
class QuotaStop extends Error {}

function loadExisting(): Map_ {
  if (!existsSync(OUT)) return {};
  try {
    const m = readFileSync(OUT, "utf8").match(/JSON\.parse\((".*")\)/s);
    if (m) return JSON.parse(JSON.parse(m[1]));
  } catch {}
  return {};
}

function distM(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
function norm(s: string): string {
  return s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
}
function nameContains(q: string, m: string): boolean {
  return !!m && norm(m).includes(norm(q));
}
function nameMatches(q: string, m: string): boolean {
  if (!m) return false;
  const a = norm(q), b = norm(m);
  if (!a || !b) return false;
  if (a.includes(b) || b.includes(a)) return true;
  const stop = new Set(["the", "restaurant", "resto", "cafe", "coffee", "hotel", "jakarta", "and", "dan", "bar", "kitchen", "house"]);
  const ta = new Set(a.split(" ").filter((w) => w.length >= 4 && !stop.has(w)));
  const tb = new Set(b.split(" ").filter((w) => w.length >= 4 && !stop.has(w)));
  for (const w of ta) if (tb.has(w)) return true;
  return false;
}
/** Reject addresses that resolve outside DKI (Bodetabek). */
function dkiOk(addr: string): boolean {
  return !BODETABEK.test(addr) && /jakarta/i.test(addr);
}

/** WITH place_id: Place Details, address-only (Essentials SKU). */
async function byPlaceId(placeId: string): Promise<Addr> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
      headers: { "X-Goog-Api-Key": KEY!, "X-Goog-FieldMask": "formattedAddress" },
    });
    if (res.status >= 500) { await sleep(1000 * (attempt + 1)); continue; }
    if (res.status === 429 || res.status === 403) throw new QuotaStop(`HTTP ${res.status}: ${await res.text()}`);
    if (!res.ok) { console.warn(`  ! placeId ${placeId}: HTTP ${res.status}`); return { found: false }; }
    const d = (await res.json()) as { formattedAddress?: string };
    const a = d.formattedAddress?.trim();
    if (a && dkiOk(a)) return { address: a, found: true };
    return { found: false };
  }
  return { found: false };
}

/** WITHOUT place_id: searchText biased to coords (Pro SKU — adds displayName). */
async function bySearch(name: string, lat?: number, lng?: number, hint?: string): Promise<Addr> {
  const body: Record<string, unknown> = {
    textQuery: hint ? `${name} ${hint} Jakarta` : `${name} Jakarta`,
    maxResultCount: 1,
    languageCode: "id",
  };
  if (lat !== undefined && lng !== undefined) {
    body.locationBias = { circle: { center: { latitude: lat, longitude: lng }, radius: 400 } };
  }
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": KEY!,
        "X-Goog-FieldMask": "places.displayName,places.location,places.formattedAddress",
      },
      body: JSON.stringify(body),
    });
    if (res.status >= 500) { await sleep(1000 * (attempt + 1)); continue; }
    if (res.status === 429 || res.status === 403) throw new QuotaStop(`HTTP ${res.status}: ${await res.text()}`);
    if (!res.ok) { console.warn(`  ! ${name}: HTTP ${res.status}`); return { found: false }; }
    const data = (await res.json()) as {
      places?: { displayName?: { text?: string }; location?: { latitude: number; longitude: number }; formattedAddress?: string }[];
    };
    const p = data.places?.[0];
    const addr = p?.formattedAddress?.trim();
    if (!p || !addr) return { found: false };
    const matched = p.displayName?.text ?? "";
    const hasCoords = lat !== undefined && lng !== undefined && !!p.location;
    const d = hasCoords ? distM(lat!, lng!, p.location!.latitude, p.location!.longitude) : Infinity;
    const ok = hasCoords ? d <= 150 || (nameMatches(name, matched) && d <= 600) : nameContains(name, matched);
    if (!ok || !dkiOk(addr)) {
      if (process.env.VERBOSE) console.log(`  ✗ "${name}" → "${matched}" (${Math.round(d)}m / ${addr}) rejected`);
      return { found: false };
    }
    if (process.env.VERBOSE) console.log(`  ✓ "${name}" → ${addr}`);
    return { address: addr, found: true };
  }
  return { found: false };
}

function persist(map: Map_) {
  writeFileSync(
    OUT,
    `// Generated by scripts/fetch-addresses.ts — REAL Google formattedAddress, never fabricated.
// Re-run \`places_api_key=... bun scripts/fetch-addresses.ts\` to refresh/continue.

export type GciAddress = { address?: string; found: boolean };

export const GCI_ADDRESSES: Record<string, GciAddress> = JSON.parse(${JSON.stringify(JSON.stringify(map))});
`
  );
}

async function main() {
  const map = loadExisting();
  const retryEmpty = !!process.env.RETRY_EMPTY;
  const todo = GCI_RESTAURANTS.filter((r) => {
    const cached = map[r.id];
    if (cached && !(retryEmpty && !cached.found)) return false;
    return true;
  }).slice(0, LIMIT);
  const withPid = todo.filter((r) => r.placeId).length;
  console.log(`→ ${todo.length} venues to resolve (${withPid} via place_id / ${todo.length - withPid} via search) — ${Object.keys(map).length} cached`);

  let done = 0, hit = 0;
  try {
    for (const r of todo) {
      const hint = r.hotel?.replace(/\s*\(★\d\)\s*$/, "");
      const res = r.placeId ? await byPlaceId(r.placeId) : await bySearch(r.name, r.lat, r.lng, hint);
      map[r.id] = res;
      if (res.found) hit++;
      done++;
      if (done % 50 === 0) { persist(map); console.log(`  …${done}/${todo.length} (${hit} found) — saved`); }
      await sleep(80);
    }
  } catch (e) {
    persist(map);
    if (e instanceof QuotaStop) {
      console.error(`\n⏸ Quota/billing limit after ${done} venues — progress saved. Rerun to resume.\n  ${(e as Error).message}`);
      process.exit(2);
    }
    throw e;
  }
  persist(map);
  console.log(`✓ Done. ${hit}/${todo.length} got a real Google address.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
