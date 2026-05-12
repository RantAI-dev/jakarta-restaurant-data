import { NextResponse } from "next/server";
import { RESTAURANTS } from "@/lib/restaurants";

export async function GET() {
  return NextResponse.json({
    count: RESTAURANTS.length,
    items: RESTAURANTS,
  });
}
