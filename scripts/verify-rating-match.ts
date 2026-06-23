/**
 * Detect ratings that belong to the WRONG place (e.g. a restaurant showing the
 * mall/hotel/building's reviews). For each suspicious GCI venue we fetch the
 * placeId's real Google displayName (Place Details, Pro SKU — cheap, free cap)
 * and compare to the stored venue name. A clear mismatch ⇒ the rating is wrong.
 *
 *   places_api_key=xxxx bun scripts/verify-rating-match.ts
 *
 * Writes /tmp/gci-badrating.json = list of venue ids whose rating is misattached.
 * Does NOT modify the dataset (apply step is separate).
 */
import { writeFileSync } from "node:fs";
import { GCI_RESTAURANTS } from "../lib/gci";
import { GCI_RATINGS } from "../lib/gci-ratings";

const KEY = process.env.places_api_key ?? process.env.PLACES_API_KEY ?? process.env.GOOGLE_PLACES_API_KEY;
if (!KEY) { console.error("✗ Set places_api_key in .env"); process.exit(1); }
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const MALLWORD = /\bmall\b|plaza|emporium|lotte|central park|kasablanka|pondok indah mall|senayan city|gandaria city|pacific place|aeon|living world|lippo mall|grand indonesia|pluit village|thamrin city|fx sudirman|cilandak town|blok m plaza|tamani mall/i;

const STOP = new Set("restaurant resto cafe coffee the and jakarta indonesia kopi by at de di dan jl no".split(" "));
const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter(w => w && !STOP.has(w));
const set = (s: string) => new Set(norm(s));
function matches(a: string, b: string): boolean {
  const na = norm(a).join(""), nb = norm(b).join("");
  if (!na || !nb) return false;
  if (na.includes(nb) || nb.includes(na)) return true;
  const A = set(a), B = set(b); let inter = 0;
  for (const w of A) if (B.has(w)) inter++;
  const jac = inter / (A.size + B.size - inter || 1);
  return jac >= 0.34;
}

// suspicious set
const byPid = new Map<string, string[]>();
for (const [id, r] of Object.entries(GCI_RATINGS as Record<string, any>)) if (r?.placeId) { const a = byPid.get(r.placeId) ?? []; a.push(id); byPid.set(r.placeId, a); }
const dupIds = new Set<string>();
for (const [, ids] of byPid) if (ids.length > 1) ids.forEach(i => dupIds.add(i));

const susp = GCI_RESTAURANTS.filter(r => r.placeId && (
  ((r.reviewCount ?? 0) >= 10000 && (r.tier === "Restoran" || r.tier === "Cafe")) ||
  (MALLWORD.test(r.name) && (r.tier === "Restoran" || r.tier === "Cafe")) ||
  dupIds.has(r.id)
));

async function displayName(placeId: string): Promise<string | null> {
  for (let i = 0; i < 3; i++) {
    const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
      headers: { "X-Goog-Api-Key": KEY!, "X-Goog-FieldMask": "displayName" },
    });
    if (res.status >= 500) { await sleep(800 * (i + 1)); continue; }
    if (!res.ok) { console.warn(`  ! ${placeId}: HTTP ${res.status}`); return null; }
    const d = (await res.json()) as { displayName?: { text?: string } };
    return d.displayName?.text ?? null;
  }
  return null;
}

const bad: { id: string; name: string; got: string; reviews?: number }[] = [];
let ok = 0, err = 0;
for (const r of susp) {
  const dn = await displayName(r.placeId!);
  await sleep(70);
  if (dn === null) { err++; continue; }
  if (matches(r.name, dn)) { ok++; continue; }
  bad.push({ id: r.id, name: r.name, got: dn, reviews: r.reviewCount });
  console.log(`✗ "${r.name}"  →  Google: "${dn}"  (${r.reviewCount} reviews)`);
}
writeFileSync("/tmp/gci-badrating.json", JSON.stringify(bad, null, 2));
console.log(`\nChecked ${susp.length}: match ${ok} · MISMATCH ${bad.length} · error ${err}`);
console.log("Wrote /tmp/gci-badrating.json");
