import { NextRequest, NextResponse } from "next/server";
import {
  wismanPerKawasan, wismanTopNegara, gciReadiness, kulinerPerWilayah, kunjunganDtw,
} from "@/lib/ch/marts";

export const dynamic = "force-dynamic";

/**
 * GET /api/marts?name=wisman|gci|kuliner|dtw
 * Bentuk respons dijaga stabil supaya kompatibel dengan konsumen eksternal.
 */
export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name") ?? "wisman";
  try {
    let data: unknown;
    switch (name) {
      case "wisman": data = { kawasan: await wismanPerKawasan(), negara: await wismanTopNegara(20) }; break;
      case "gci": data = await gciReadiness(); break;
      case "kuliner": data = await kulinerPerWilayah(); break;
      case "dtw": data = await kunjunganDtw(); break;
      default: return NextResponse.json({ error: `mart tidak dikenal: ${name}` }, { status: 400 });
    }
    return NextResponse.json({ name, data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 503 });
  }
}
