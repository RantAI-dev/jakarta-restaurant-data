import { wismanTopNegara } from "@/lib/ch/marts";

export const dynamic = "force-dynamic";
const fmt = (n: number) => new Intl.NumberFormat("id-ID").format(n);

export default async function WismanPage() {
  let rows: Awaited<ReturnType<typeof wismanTopNegara>> | undefined;
  let error: string | null = null;
  try {
    rows = await wismanTopNegara(15);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }
  if (error) return (<><h1>Wisman</h1><div className="err">Data belum tersedia: {error}</div></>);

  const maxV = Math.max(...rows!.map((r) => r.wisman), 1);
  return (
    <>
      <h1>Wisatawan Mancanegara</h1>
      <p className="sub">
        Per negara, klasifikasi BPS dibersihkan lewat <code>dim_negara</code> (CHINA→Tiongkok,
        NOPEMBER→November). Sumber: mart_wisman.
      </p>
      <div className="card">
        <h2>15 negara teratas</h2>
        <table>
          <thead>
            <tr><th>Negara</th><th>Kawasan</th><th className="num">Wisman</th><th style={{ width: "35%" }}></th></tr>
          </thead>
          <tbody>
            {rows!.map((r) => (
              <tr key={r.negara}>
                <td>{r.negara}</td>
                <td>{r.kawasan}</td>
                <td className="num">{fmt(r.wisman)}</td>
                <td><div className="bar" style={{ width: `${(r.wisman / maxV) * 100}%` }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
