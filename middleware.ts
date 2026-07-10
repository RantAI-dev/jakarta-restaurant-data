import { NextResponse, type NextRequest } from "next/server";

// NOTE: Untuk production, ganti "*" dengan domain spesifik Platform
// (misal "https://platform.dispar.go.id"). Saat dev di localhost, "*" cukup.
// Lihat Plan 6 Task 5.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function middleware(request: NextRequest) {
  // Tangani preflight OPTIONS — browser kirim ini sebelum request sebenarnya
  // kalau cross-origin + non-simple headers.
  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
  }
  // Tambahkan CORS headers ke response
  const response = NextResponse.next();
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

// Cakupan: SEMUA endpoint di /api/* (Atlas existing + Platform-fetched)
export const config = {
  matcher: "/api/:path*",
};