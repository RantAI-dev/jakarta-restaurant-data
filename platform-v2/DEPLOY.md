# Deploy — Platform Data Dispar (Vercel)

Platform ini di-deploy sebagai **project Vercel terpisah** dari app Atlas, dari
repo yang sama (`RantAI-dev/jakarta-restaurant-data`) dengan **Root Directory =
`platform`**. Jadi dapet subdomain sendiri, beda dari Atlas.

- Nama project      : `dispar-data-platform` → `https://dispar-data-platform.vercel.app`
- Root Directory    : `platform`
- Framework         : Next.js (auto-detect)
- DB prod           : Neon (via Vercel Marketplace)
- CI/CD             : Vercel Git integration — push ke `main` = deploy production, tiap PR = preview URL

> Build **tidak** butuh DB (semua page yang query DB bersifat dynamic / di-fetch
> saat request). Jadi deploy pertama tetap sukses walau Neon belum ke-attach —
> page baru berfungsi setelah `DATABASE_URL` ke-set. Aman urutannya bebas.

---

## 1. Buat project Vercel ke-2 (sekali saja)

Repo sudah ke-link ke project Atlas. Buat project **kedua** dari repo yang sama:

1. Vercel Dashboard → **Add New… → Project**.
2. Pilih repo `RantAI-dev/jakarta-restaurant-data` (boleh dipakai ulang untuk >1 project).
3. **Project Name**: `dispar-data-platform`.
4. **Root Directory**: klik *Edit* → pilih **`platform`**. (WAJIB — kalau tidak, Vercel build root Atlas.)
5. Framework Preset: **Next.js** (harusnya auto). Build/Install command: biarkan default
   (`next build` / `npm install` — `.npmrc` sudah `legacy-peer-deps=true` untuk react-leaflet).
6. **Jangan Deploy dulu** — lanjut set DB & env di langkah 2–3, baru Deploy.

## 2. Pasang Neon (DB prod)

Di project `dispar-data-platform`:

1. Tab **Storage** (atau Integrations → Marketplace) → **Neon** → *Add / Connect*.
2. Buat database baru (region terdekat, mis. Singapore). Neon otomatis meng-inject
   env **`DATABASE_URL`** (dan `POSTGRES_*`) ke semua Environment (Production/Preview/Development).
3. Pastikan `DATABASE_URL` muncul di **Settings → Environment Variables**.

## 3. Env var tambahan

Settings → Environment Variables → tambah:

| Key           | Value                                  | Environment            |
|---------------|----------------------------------------|------------------------|
| `SYNC_SECRET` | string acak panjang (mis. `openssl rand -hex 24`) | Production (+ Preview) |

`DATABASE_URL` sudah dari Neon (langkah 2) — jangan diisi manual.

## 4. Deploy

**Deployments → Deploy** (atau cukup push ke `main`). Build ± 1–2 menit.

## 5. Isi data DB prod (sekali, setelah Neon aktif)

Tabel + data belum ada di Neon. Jalankan dari lokal, pakai connection string prod:

```bash
cd platform
vercel link                       # pilih project dispar-data-platform (sekali)
vercel env pull .env.production.local   # tarik DATABASE_URL dari Neon

# 1) buat semua tabel (schema.ts)
npx drizzle-kit push
# (drizzle-kit baca DATABASE_URL dari env; export dulu bila perlu:
#   export $(grep -v '^#' .env.production.local | xargs) )

# 2) seed katalog + data Atlas
npx tsx --env-file=.env.production.local scripts/db-seed-catalog.ts
npx tsx --env-file=.env.production.local scripts/db-seed-atlas.ts

# 3) sync data SDI (fetch API Satu Data Jakarta → tabel record). Agak lama.
npx tsx --env-file=.env.production.local scripts/db-sync-dataset.ts all
```

> `.env.production.local` sudah di-gitignore — jangan commit.

**Alternatif sync SDI via HTTP** (tanpa lokal), setelah `SYNC_SECRET` ke-set & deploy:

```bash
curl -X POST https://dispar-data-platform.vercel.app/api/admin/sync \
  -H "x-sync-secret: <SYNC_SECRET>"
```

## 6. CI/CD (otomatis, tak perlu konfigurasi lain)

Vercel Git integration aktif begitu project ke-link:

- Push / merge ke **`main`** → **Production deploy** otomatis.
- Buka **Pull Request** → **Preview deploy** dengan URL unik per PR.
- Rollback: Deployments → pilih deploy lama → *Promote to Production*.

Update data (SDI/atlas) tanpa ganti kode: cukup jalankan ulang langkah 5
(atau `curl` sync) — tidak perlu redeploy karena page DB bersifat dynamic.
