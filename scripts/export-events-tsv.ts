/**
 * Generate the GCI events deliverable TSV from lib/events.ts.
 *   bun scripts/export-events-tsv.ts
 * Writes: data-pertunjukan-GCI-jakarta-2025.tsv (paste-ready ke Google Sheet).
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { GCI_EVENTS } from "../lib/events";

const HEADERS = [
  "No.",
  "Nama Penyelenggara - Organizer",
  "Nama Pertunjukan - Name of Performance",
  "Tanggal Pertunjukan - Date of Performance",
  "Tempat Pertunjukan - Place of Performance",
  "Jenis Pertunjukan - Type of Performance",
  "Jumlah Pengunjung - Number of Visitor",
  "Keterangan - Notes",
  "Sumber",
];

const clean = (s: string) => s.replace(/\t/g, " ").replace(/\r?\n/g, " ").trim();

const rows = GCI_EVENTS.map((e, i) =>
  [
    String(i + 1),
    clean(e.organizer),
    clean(e.name),
    clean(e.date),
    clean(e.venue),
    clean(e.type),
    clean(e.visitors),
    clean(e.note),
    clean(e.source),
  ].join("\t")
);

const out = [HEADERS.join("\t"), ...rows].join("\n") + "\n";
const dest = resolve(new URL(".", import.meta.url).pathname, "..", "data-pertunjukan-GCI-jakarta-2025.tsv");
writeFileSync(dest, out, "utf8");
console.log(`✓ Wrote ${dest} — ${GCI_EVENTS.length} event`);
