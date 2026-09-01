# Deploy — Web Buku Statistika Pariwisata Perkotaan

Ada dua jalur. **Vercel adalah yang aktif sekarang**; Portainer disiapkan untuk
pindah ke server sendiri nanti.

## Jalur A — Vercel (aktif)

| | |
|---|---|
| Project | `dispar-buku` (scope `kleopasevans-projects`) |
| URL | <https://dispar-buku.vercel.app> |
| Root directory | `buku` (folder ini yang di-*link*, bukan root repo) |
| Region | `sin1` |
| Database | tidak ada |

```bash
cd buku
vercel deploy --prod --yes     # sudah ter-link ke project dispar-buku
```

Dua hal yang membuat build Vercel ini berhasil, jangan diutak-atik tanpa alasan:

- `vercel.json` menyetel `framework: "nextjs"` — project dibuat lewat CLI,
  sehingga *framework preset*-nya tidak terdeteksi otomatis dan Vercel mencari
  direktori `public/`.
- `next.config.mjs` mematikan `output: 'standalone'` saat variabel `VERCEL` ada.
  Vercel menjalankan *output tracing* sendiri; dengan `standalone` build gagal
  dengan `ENOENT … next-server.js.nft.json`.

Isi buku sudah statis, jadi tidak ada env var yang perlu diset.

## Jalur B — Portainer (self-host)

Untuk memindahkan ke server Depok (`192.168.18.187`), sama seperti platform data
dan lakehouse. Tidak ada database.

| | |
|---|---|
| Stack Portainer | `buku` |
| Container | `buku-app` |
| Port host | `13035` → `3000` di container |
| Akses lokal | `http://192.168.18.187:13035` |
| Build | dari `Dockerfile` di folder ini |

Port lain yang sudah terpakai di server itu: `13030` & `13032` (lakehouse),
`13031` (platform), `15433`/`18123`/`18181`/`19000`/`19001`/`19440` (lakehouse).

### 1. Pastikan isi buku sudah ter-commit

Build Docker **tidak** membaca repo naskah — ia memakai `content/docs/` dan
`public/figures/` yang ada di dalam repo ini. Jadi sebelum deploy:

```bash
cd buku
npm run import:book
npm run build            # gagal di sini = naskah baru memecah MDX, perbaiki dulu
git add content public/figures
git commit -m "sinkronisasi naskah buku"
git push
```

### 2. Buat stack di Portainer (sekali saja)

1. Portainer → **Stacks → Add stack**.
2. Name: `buku`.
3. Build method: **Repository**.
4. Repository URL: repo ini; Reference: *branch* yang dipakai.
5. **Compose path**: `buku/compose.yaml`.
6. **Deploy the stack**.

Build pertama memakan beberapa menit (`npm ci` + `next build`). Setelah selesai,
cek `http://192.168.18.187:13035`.

### 3. Redeploy setelah naskah berubah

Portainer → Stacks → `buku` → **Update the stack** → centang
**Re-pull image and redeploy** / **Re-build**. Portainer menarik commit terbaru
lalu membangun ulang image.

Kalau webhook stack sudah diaktifkan, cukup panggil URL webhook-nya setelah
`git push`.

### 4. Akses dari internet

Server ini sudah menjalankan Cloudflare Tunnel untuk platform (container
`dispar-cloudflared`, mode `network_mode: host`). **Jangan** membuat tunnel
kedua — cukup tambahkan *public hostname* baru pada tunnel yang sama:

1. Cloudflare Zero Trust → **Networks → Tunnels** → pilih tunnel dispar →
   **Public Hostname → Add a public hostname**.
2. Subdomain: mis. `buku`; Domain: domain yang dipakai platform.
3. Service: **HTTP** → `localhost:13035`.
4. Save. Perubahan berlaku tanpa restart container.

Karena `cloudflared` berjalan di *host network*, `localhost:13035` di sisi
tunnel menunjuk ke port yang di-*publish* stack ini.

## Pemeriksaan cepat

```bash
# di server
docker ps --filter name=buku-app
docker logs --tail 50 buku-app
curl -sI http://localhost:13035 | head -1        # HTTP/1.1 200 OK
curl -s http://localhost:13035/docs | head -c 80
```

Healthcheck container memanggil `/` tiap 30 detik; status `unhealthy` di
Portainer berarti Next.js gagal start — cek `docker logs`.

## Kalau build gagal di server

Penyebab yang pernah muncul dan cara bacanya:

- **`Unexpected character … expected a character that can start a name`** —
  MDX menolak sebuah halaman naskah. Reproduksi dengan `npm run build` di lokal;
  biasanya karakter `<` dalam prosa yang belum tertangani importer.
- **Kehabisan memori saat `next build`** — server membangun 53 halaman statis.
  Batasi build bersamaan (jangan redeploy beberapa stack sekaligus).
