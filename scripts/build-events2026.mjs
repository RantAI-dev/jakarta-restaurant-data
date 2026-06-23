/**
 * Merge the 10 web-research JSON files (/tmp/events2026-*.json) into a clean,
 * deduped TS block of 2026 GciEvent rows, ready to inject into lib/events.ts.
 * No fabrication: only what the agents verified with a source URL.
 */
import { readFileSync, writeFileSync } from "node:fs";

const BULAN = { januari:1,februari:2,maret:3,april:4,mei:5,juni:6,juli:7,agustus:8,september:9,oktober:10,november:11,desember:12 };
const BL = Object.keys(BULAN).join("|");
const BODETABEK = /tangerang|bekasi|\bbsd\b|kosambi|serpong|depok|bogor|cikarang|greater jak/i;

const pad = (n) => String(n).padStart(2, "0");
const iso = (y,m,d) => `${y}-${pad(m)}-${pad(d)}`;

function normDate(raw) {
  if (!raw) return { date: "2026", ym: "2026-00" };
  let s = String(raw).trim();
  // already ISO (single or range with s/d)
  const isoHit = s.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoHit) return { date: s.replace(/\s*[–-]\s*/g, " s/d ").replace(/\s*s\/d\s*/,' s/d '), ym: `${isoHit[1]}-${isoHit[2]}` };
  const low = s.toLowerCase();
  // DD BulanA – DD BulanB YYYY  (cross-month)
  let m = low.match(new RegExp(`(\\d{1,2})\\s+(${BL})\\s*[–-]\\s*(\\d{1,2})\\s+(${BL})\\s+(\\d{4})`));
  if (m) { const y=m[5],m1=BULAN[m[2]],m2=BULAN[m[4]]; return { date:`${iso(y,m1,m[1])} s/d ${iso(y,m2,m[3])}`, ym:`${y}-${pad(m1)}` }; }
  // DD – DD Bulan YYYY (same month)
  m = low.match(new RegExp(`(\\d{1,2})\\s*[–-]\\s*(\\d{1,2})\\s+(${BL})\\s+(\\d{4})`));
  if (m) { const y=m[4],mo=BULAN[m[3]]; return { date:`${iso(y,mo,m[1])} s/d ${iso(y,mo,m[2])}`, ym:`${y}-${pad(mo)}` }; }
  // DD Bulan YYYY
  m = low.match(new RegExp(`(\\d{1,2})\\s+(${BL})\\s+(\\d{4})`));
  if (m) { const y=m[3],mo=BULAN[m[2]]; return { date:iso(y,mo,m[1]), ym:`${y}-${pad(mo)}` }; }
  // Bulan YYYY
  m = low.match(new RegExp(`(${BL})\\s+(\\d{4})`));
  if (m) { const mo=BULAN[m[1]], y=m[2]; const cap=m[1][0].toUpperCase()+m[1].slice(1); return { date:`${cap} ${y}`, ym:`${y}-${pad(mo)}` }; }
  // year only
  const y = s.match(/(20\d{2})/);
  if (y) return { date: y[1], ym: `${y[1]}-00` };
  return { date: s, ym: "2026-00" };
}

function normVisitors(v) {
  if (v === 0 || v === "0") return "";
  if (typeof v === "number") return v.toLocaleString("id-ID"); // 16500 -> "16.500"
  return String(v || "").trim();
}

const STOP = new Set("live in concert the jakarta world tour asia 2026 2025 fanmeeting fanmeet fancon fan meeting feat ft with konser tunggal solo a and x of de di".split(" "));
function normName(name) {
  return String(name).toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g,"")
    .replace(/[^a-z0-9 ]+/g," ").split(/\s+/).filter(w=>w && !STOP.has(w)).join("");
}

const esc = (s) => String(s ?? "").replace(/\\/g,"\\\\").replace(/"/g,'\\"');

// process order: concerts, festivals, orchestra, budaya, dance/theater, art/film, fashion, popculture, fanmeet
const ORDER = [1,2,3,5,6,4,7,8,9,10];
const raw = [];
for (const k of ORDER) {
  const arr = JSON.parse(readFileSync(`/tmp/events2026-${k}.json`,"utf8"));
  for (const e of arr) raw.push(e);
}

const dropped = { bodetabek: [], not2026: [], jfNights: [], dup: [] };
const seen = new Map();
const kept = [];
const jakartaFair = [];

for (const e of raw) {
  // Jakarta Fair handling
  if (/jakarta fair music concert/i.test(e.name)) { dropped.jfNights.push(e.name); continue; }
  if (/jakarta fair|pekan raya jakarta/i.test(e.name)) { jakartaFair.push(e); continue; }
  if (BODETABEK.test(e.venue || "")) { dropped.bodetabek.push(`${e.name} @ ${e.venue}`); continue; }
  const nd = normDate(e.date);
  if (!/2026/.test(nd.date) && nd.ym.slice(0,4) !== "2026") { dropped.not2026.push(`${e.name} (${e.date})`); continue; }
  const key = normName(e.name) + "|" + nd.ym;
  if (seen.has(key)) { dropped.dup.push(e.name); continue; }
  seen.set(key, true);
  kept.push({ ...e, _date: nd.date, _ym: nd.ym, visitors: normVisitors(e.visitors) });
}

// collapse Jakarta Fair into one Budaya row (max visitors)
if (jakartaFair.length) {
  let best = jakartaFair[0];
  const num = (e) => Number(String(e.visitors).replace(/[^0-9]/g,"")) || 0;
  for (const e of jakartaFair) if (num(e) > num(best)) best = e;
  const nd = normDate(best.date);
  kept.push({ ...best, category: "Budaya", _date: nd.date, _ym: nd.ym, visitors: normVisitors(best.visitors) });
  dropped.dup.push(...jakartaFair.filter(e=>e!==best).map(e=>e.name));
}

// sort by date, assign ids
function sortKey(d) {
  const m = d.match(/(\d{4})-(\d{2})-(\d{2})/); if (m) return Number(m[1]+m[2]+m[3]);
  const mm = d.toLowerCase().match(new RegExp(`(${BL})\\s+(\\d{4})`)); if (mm) return Number(`${mm[2]}${pad(BULAN[mm[1]])}00`);
  const y = d.match(/(\d{4})/); return y ? Number(`${y[1]}9999`) : 99999999;
}
kept.sort((a,b)=>sortKey(a._date)-sortKey(b._date));

const lines = kept.map((e,i) => {
  const id = `y26-${pad(i+1)}`;
  return `  { id: "${id}", organizer: "${esc(e.organizer)}", name: "${esc(e.name)}", date: "${esc(e._date)}", venue: "${esc(e.venue)}", type: "${esc(e.type)}", visitors: "${esc(e.visitors)}", note: "${esc(e.note)}", category: "${esc(e.category)}", source: "${esc(e.source)}" },`;
});

const block = `\n  // ═══════════════════════════════════════════════════════════════\n  //  TAHUN 2026 — dikumpulkan via riset web (subagent), DKI Jakarta\n  // ═══════════════════════════════════════════════════════════════\n${lines.join("\n")}\n`;
writeFileSync("/tmp/events2026-block.ts", block);

// stats
const byCat = {};
for (const e of kept) byCat[e.category] = (byCat[e.category]||0)+1;
const withVis = kept.filter(e=>e.visitors).length;
console.log(`KEPT: ${kept.length} events`);
console.log(`  with visitors/capacity: ${withVis} (${Math.round(withVis/kept.length*100)}%)`);
console.log(`  by category:`, JSON.stringify(byCat));
console.log(`DROPPED: bodetabek=${dropped.bodetabek.length} not2026=${dropped.not2026.length} jakartaFairNights=${dropped.jfNights.length} dup=${dropped.dup.length}`);
console.log(`\n-- bodetabek dropped --\n` + dropped.bodetabek.join("\n"));
console.log(`\n-- not-2026 dropped --\n` + dropped.not2026.join("\n"));
console.log(`\n-- dup dropped --\n` + dropped.dup.join("\n"));
