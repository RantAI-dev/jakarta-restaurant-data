import { NextResponse } from "next/server";
import { GCI_RESTAURANTS } from "@/lib/gci";

export async function GET() {
  return NextResponse.json({
    count: GCI_RESTAURANTS.length,
    rows: GCI_RESTAURANTS,
  });
}