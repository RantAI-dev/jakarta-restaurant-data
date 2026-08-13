import { ringkasLapisan, ringkasTipe, contohInferensi, silsilahIndikator } from "@/lib/ch/lineage";

export const dynamic = "force-dynamic";

export default async function LineagePage() {
  let lapisan: Awaited<ReturnType<typeof ringkasLapisan>> | undefined;
  let tipe: Awaited<ReturnType<typeof ringkasTipe>> | undefined;
  let inferensi: Awaited<ReturnType<typeof contohInferensi>> | undefined;
  let error: string | null = null;
  try {
    [lapisan, tipe, inferensi] = await Promise.all([
      ringkasLapisan(),
      ringkasTipe(),
      contohInferensi(20),
    ]);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }
  if (error) return (<><h1>Lineage</h1><div className="err">Metadata tidak tersedia: {error}</div></>);

  const silsilah = silsilahIndikator();

  return (
    <>
      <h1>Silsilah Data (Lineage)</h1>
      <p className="sub">
        Bukan diagram statis — angka di halaman ini diambil dari metadata pipeline
        (<code>_silver_meta</code> + katalog), berubah sendiri saat pipeline jalan ulang.
      </p>

      <div className="kpis">
        {lapisan!.map((l) => (
          <div className="kpi" key={l.lapisan}>
            <div className="n">{l.jumlah_objek}</div>
            <div className="l"><b>{l.lapisan}</b> — {l.keterangan}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2>Silsilah indikator kunci: Gold ← Silver ← Bronze</h2>
        <table>
          <thead><tr><th>Indikator</th><th>Rantai</th></tr></thead>
          <tbody>
            {silsilah.map((s) => (
              <tr key={s.indikator}>
                <td><b>{s.indikator}</b></td>
                <td className="lin">
                  <b>{s.gold}</b> ← {s.silver} ← {s.bronze}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>Inferensi tipe otomatis Silver</h2>
        <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 0 }}>
          Distribusi:{" "}
          {tipe!.map((t) => `${t.tipe} ${t.jumlah}`).join(" · ")}. Kolom hanya
          dipromosikan bila ≥95% nilai terkonversi — sisanya tetap String.
        </p>
        <table>
          <thead>
            <tr><th>Tabel</th><th>Kolom</th><th>Tipe</th><th className="num">Rasio konversi</th></tr>
          </thead>
          <tbody>
            {inferensi!.map((r, i) => (
              <tr key={i}>
                <td className="lin">{r.tabel}</td>
                <td>{r.kolom}</td>
                <td><span className={`pill ${r.tipe === "angka" ? "ready" : "partial"}`}>{r.tipe}</span></td>
                <td className="num">{(r.rasio_sukses * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
