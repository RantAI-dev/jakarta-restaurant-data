/**
 * Deliverable address column — adds a new "Alamat" column to
 * `data-restoran-GCI-jakarta.tsv` (the 84-row Google-Sheet submission) with a
 * REAL Google address for each venue. The existing "Area" (kawasan) column is
 * KEPT — Alamat is inserted right after it.
 *
 *   places_api_key=xxxx bun scripts/address-tsv.ts
 *
 * Sourcing, cheapest-first, never fabricated:
 *  1. Reuse an address already resolved in lib/gci-addresses.ts (free) when the
 *     venue name matches a row there.
 *  2. Otherwise a Places searchText (Pro SKU) by "name, area", guarded to DKI
 *     and to a plausible name match. Unresolved venues keep an empty Alamat.
 *
 * Resumable via scripts/.address-tsv-cache.json.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { GCI_RESTAURANTS, gciAddress } from "../lib/gci";

const KEY =
  process.env.places_api_key ?? process.env.PLACES_API_KEY ?? process.env.GOOGLE_PLACES_API_KEY;
if (!KEY) {
  console.error("✗ Set places_api_key in .env (Places API New, billing enabled).");
  process.exit(1);
}

const here = new URL(".", import.meta.url).pathname;
const TSV = resolve(here, "..", "data-restoran-GCI-jakarta.tsv");
const CACHE = resolve(here, ".address-tsv-cache.json");

const BODETABEK = /bogor|depok|tangerang|bekasi|karawang|cikarang|serpong|\bbsd\b/i;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function norm(s: string): string {
  return s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
}
function nameContains(q: string, m: string): boolean {
  if (!m) return false;
  const a = norm(q), b = norm(m);
  return a.includes(b) || b.includes(a);
}
function dkiOk(addr: string): boolean {
  return !BODETABEK.test(addr) && /jakarta/i.test(addr);
}

// Address map from the already-enriched website dataset (free reuse).
const KNOWN = new Map<string, string>();
for (const r of GCI_RESTAURANTS) {
  if (!r.address) continue;
  const k = norm(r.name);
  if (!KNOWN.has(k)) KNOWN.set(k, gciAddress(r));
}
function reuse(name: string): string | undefined {
  const k = norm(name);
  if (KNOWN.has(k)) return KNOWN.get(k);
  for (const [kk, v] of KNOWN) if (kk.length > 4 && (kk.includes(k) || k.includes(kk))) return v;
  return undefined;
}

const cache: Record<string, string | null> = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, "utf8")) : {};

async function search(name: string, area: string): Promise<string | null> {
  const body = { textQuery: `${name}, ${area}`, maxResultCount: 1, languageCode: "id" };
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": KEY!,
        "X-Goog-FieldMask": "places.displayName,places.formattedAddress",
      },
      body: JSON.stringify(body),
    });
    if (res.status >= 500) { await sleep(1000 * (attempt + 1)); continue; }
    if (!res.ok) { console.warn(`  ! ${name}: HTTP ${res.status} ${await res.text()}`); return null; }
    const data = (await res.json()) as { places?: { displayName?: { text?: string }; formattedAddress?: string }[] };
    const p = data.places?.[0];
    const addr = p?.formattedAddress?.trim();
    if (!p || !addr) return null;
    if (!nameContains(name, p.displayName?.text ?? "") || !dkiOk(addr)) {
      if (process.env.VERBOSE) console.log(`  ✗ "${name}" → "${p.displayName?.text}" / ${addr} rejected`);
      return null;
    }
    return addr;
  }
  return null;
}

async function main() {
  const lines = readFileSync(TSV, "utf8").replace(/\r\n/g, "\n").trim().split("\n");
  const header = lines[0].split("\t");
  const iName = header.findIndex((h) => /nama/i.test(h));
  const iArea = header.findIndex((h) => /^area$/i.test(h));
  if (iName < 0 || iArea < 0) throw new Error("Could not find Nama / Area columns");
  if (header.some((h) => /alamat/i.test(h))) { console.log("Alamat column already present — nothing to do."); return; }

  let reused = 0, searched = 0, miss = 0;
  const outRows: string[] = [];
  for (const line of lines.slice(1)) {
    const cols = line.split("\t");
    const name = cols[iName]?.trim();
    const area = cols[iArea]?.trim() ?? "";
    let addr: string | null = null;
    if (name) {
      const r = reuse(name);
      if (r) { addr = r; reused++; }
      else if (name in cache) { addr = cache[name]; }
      else {
        addr = await search(name, area);
        cache[name] = addr;
        writeFileSync(CACHE, JSON.stringify(cache, null, 2));
        await sleep(120);
        if (addr) searched++; else miss++;
      }
    }
    if (addr) console.log(`✓ ${name}\n    ${addr}`);
    else if (name) console.log(`· ${name} — no address`);
    // Insert Alamat right after Area.
    cols.splice(iArea + 1, 0, addr ?? "");
    outRows.push(cols.join("\t"));
  }
  header.splice(iArea + 1, 0, "Alamat");
  writeFileSync(TSV, [header.join("\t"), ...outRows].join("\n") + "\n", "utf8");
  console.log(`\n✓ Wrote ${TSV}\n  reused ${reused} · searched ${searched} · no-address ${miss}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
