import { kpiBeranda, wismanPerKawasan, readinessRingkas } from "@/lib/ch/marts";

export const dynamic = "force-dynamic";

function fmt(n: number): string {
  return new Intl.NumberFormat("id-ID").format(n);
}

export default async function Beranda() {
  let kpis: Awaited<ReturnType<typeof kpiBeranda>> | undefined;
  let kawasan: Awaited<ReturnType<typeof wismanPerKawasan>> | undefined;
  let readiness: Awaited<ReturnType<typeof readinessRingkas>> | undefined;
  let error: string | null = null;
  try {
    [kpis, kawasan, readiness] = await Promise.all([
      kpiBeranda(),
      wismanPerKawasan(),
      readinessRingkas(),
    ]);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  if (error) {
    return (
      <>
        <h1>Beranda</h1>
        <div className="err">Lakehouse tidak dapat dihubungi: {error}</div>
      </>
    );
  }

  const maxKawasan = Math.max(...kawasan!.map((k) => k.wisman), 1);
  const totalRead = readiness!.reduce((s, r) => s + r.jumlah, 0);

  return (
    <>
      <h1>Platform Data Pariwisata DKI</h1>
      <p className="sub">
        Dibangun di atas lakehouse — setiap angka dapat ditelusuri ke baris mentah di lapisan Bronze.
      </p>

      <div className="kpis">
        {kpis!.map((k) => (
          <div className="kpi" key={k.label}>
            <div className="n">{fmt(k.nilai)}</div>
            <div className="l">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2>Kunjungan wisman per kawasan</h2>
        <table>
          <thead>
            <tr><th>Kawasan</th><th className="num">Wisman</th><th style={{ width: "40%" }}></th></tr>
          </thead>
          <tbody>
            {kawasan!.map((k) => (
              <tr key={k.kawasan}>
                <td>{k.kawasan}</td>
                <td className="num">{fmt(k.wisman)}</td>
                <td><div className="bar" style={{ width: `${(k.wisman / maxKawasan) * 100}%` }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>Kesiapan indikator GCI/GPCI ({totalRead} indikator)</h2>
        <div style={{ display: "flex", gap: 10 }}>
          {readiness!.map((r) => (
            <span className={`pill ${r.readiness}`} key={r.readiness}>
              {r.readiness}: {r.jumlah}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
