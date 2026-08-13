import { gciReadiness } from "@/lib/ch/marts";

export const dynamic = "force-dynamic";

export default async function GciPage() {
  let rows: Awaited<ReturnType<typeof gciReadiness>> | undefined;
  let error: string | null = null;
  try {
    rows = await gciReadiness();
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }
  if (error) return (<><h1>GCI/GPCI</h1><div className="err">Data belum tersedia: {error}</div></>);

  const gci = rows!.filter((r) => r.framework === "GCI");
  const gpci = rows!.filter((r) => r.framework === "GPCI");

  const tabel = (judul: string, data: typeof rows) => (
    <div className="card">
      <h2>{judul} ({data!.length} indikator)</h2>
      <table>
        <thead>
          <tr><th>Kode</th><th>Dimensi</th><th>Indikator</th><th>Kesiapan</th></tr>
        </thead>
        <tbody>
          {data!.map((r) => (
            <tr key={r.kode}>
              <td><b>{r.kode}</b></td>
              <td>{r.dimensi}</td>
              <td>{r.nama}</td>
              <td><span className={`pill ${r.readiness}`}>{r.readiness}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
      <h1>Kesiapan Indikator GCI / GPCI</h1>
      <p className="sub">
        Prioritas GCI (competitiveness) sesuai arahan MoM. Sumber: mart_gci_readiness ← dim_indikator.
      </p>
      {tabel("GCI — Global Cities Index", gci)}
      {tabel("GPCI — Global Power City Index", gpci)}
    </>
  );
}
