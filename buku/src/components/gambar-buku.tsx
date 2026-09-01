interface Props {
  /** "Grafik" atau "Tabel", mengikuti penomoran naskah. */
  tipe: string;
  /** Nomor visual, mis. "4.5.1". */
  id: string;
  src: string;
  lebar: number;
  tinggi: number;
  /** Deskripsi dari naskah — jadi teks alternatif untuk pembaca layar. */
  alt: string;
}

/**
 * Figure resmi dari naskah, dipakai apa adanya.
 *
 * Keterangan dan sumber sudah tercetak di dalam gambar (dirender oleh skrip
 * matplotlib di repo naskah), jadi di sini tidak diulang — cukup nomor visual
 * di atasnya. Latar putih dipertahankan pada mode gelap karena gambarnya memang
 * dibuat untuk kertas; membalik warnanya akan merusak kontras di dalam grafik.
 */
export function GambarBuku({ tipe, id, src, lebar, tinggi, alt }: Props) {
  return (
    <figure className="my-8 not-prose">
      <p className="mb-2 text-sm font-medium text-fd-primary">
        {tipe} {id}
      </p>
      <div className="overflow-hidden rounded-xl border border-fd-border bg-white p-2 sm:p-4">
        <img
          src={src}
          alt={alt}
          width={lebar}
          height={tinggi}
          loading="lazy"
          decoding="async"
          className="h-auto w-full"
        />
      </div>
    </figure>
  );
}
