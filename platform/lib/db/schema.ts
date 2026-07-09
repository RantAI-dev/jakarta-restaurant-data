import {
  pgTable,
  serial,
  integer,
  text,
  jsonb,
  timestamp,
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