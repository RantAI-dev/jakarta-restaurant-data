import {
  pgTable,
  serial,
  integer,
  text,
  jsonb,
  timestamp,
  doublePrecision,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/** Definisi kolom bermakna sebuah dataset (dari komponen_data_table SDI). */
export const datasetColumn = pgTable(
  "dataset_column",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    key: text("key").notNull(),
    label: text("label"),
    type: text("type"),
    description: text("description"),
    ordinal: integer("ordinal").notNull().default(0),
  },
  (t) => ({
    slugKey: uniqueIndex("dataset_column_slug_key").on(t.slug, t.key),
  })
);

/** Satu baris data tabel sebuah dataset (isi mentah get-table-data). */
export const record = pgTable(
  "record",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    ordinal: integer("ordinal").notNull(),
    data: jsonb("data").notNull(),
    syncedAt: timestamp("synced_at").notNull().defaultNow(),
  },
  (t) => ({
    slugIdx: index("record_slug_idx").on(t.slug),
  })
);

/** Ringkasan status sync + metadata per dataset. */
export const datasetSync = pgTable("dataset_sync", {
  slug: text("slug").primaryKey(),
  title: text("title"),
  description: text("description"),
  satuan: text("satuan"),
  frekuensi: text("frekuensi"),
  klasifikasi: text("klasifikasi"),
  kontak: text("kontak"),
  author: text("author"),
  sumberData: jsonb("sumber_data").$type<string[]>().default([]),
  total: integer("total").notNull().default(0),
  syncedAt: timestamp("synced_at").notNull().defaultNow(),
});

/**
 * Data Atlas (sekunder — hasil pendataan lapangan GCI) di dalam DB platform.
 * Sumber tetap array in-code (lib/gci, lib/events, lib/golf, lib/restaurants);
 * tabel ini menyalin data itu agar bisa di-query bersama data primer SDI.
 * kind: 'gci' | 'events' | 'golf' | 'restaurants'.
 */
export const atlasRecord = pgTable(
  "atlas_record",
  {
    id: serial("id").primaryKey(),
    kind: text("kind").notNull(),
    extId: text("ext_id").notNull(),
    name: text("name").notNull(),
    category: text("category"),
    area: text("area"),
    city: text("city"),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    data: jsonb("data").notNull(),
    syncedAt: timestamp("synced_at").notNull().defaultNow(),
  },
  (t) => ({
    kindIdx: index("atlas_record_kind_idx").on(t.kind),
    kindExtId: uniqueIndex("atlas_record_kind_ext_id").on(t.kind, t.extId),
  })
);

/**
 * Snapshot laporan terprecompute (readiness, stat, dsb.) — diisi oleh job
 * terjadwal (cron) / setelah sync, dibaca murah oleh halaman. Menghindari
 * scan tabel `record` yang besar pada tiap request (hemat egress DB).
 */
export const report = pgTable("report", {
  key: text("key").primaryKey(),
  data: jsonb("data").notNull(),
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
});

/** Ringkasan per kind Atlas (untuk katalog & badge jumlah). */
export const atlasDataset = pgTable("atlas_dataset", {
  kind: text("kind").primaryKey(),
  title: text("title").notNull(),
  description: text("description").default(""),
  total: integer("total").notNull().default(0),
  syncedAt: timestamp("synced_at").notNull().defaultNow(),
});

/** Katalog dataset (untuk list /sdi). Primer = SDI; sekunder tetap statis. */
export const dataset = pgTable("dataset", {
  slug: text("slug").primaryKey(),
  sdiId: integer("sdi_id"),
  tier: text("tier").notNull(), // 'primer' | 'sekunder'
  title: text("title").notNull(),
  description: text("description").default(""),
  tags: jsonb("tags").$type<string[]>().default([]),
  source: text("source"),
  views: integer("views").notNull().default(0),
  datasetCount: integer("dataset_count").notNull().default(0),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});