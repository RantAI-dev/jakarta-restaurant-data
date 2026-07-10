import { NextResponse } from "next/server";
import { GCI_EVENTS } from "@/lib/events";

export async function GET() {
  return NextResponse.json({
    count: GCI_EVENTS.length,
    rows: GCI_EVENTS,
  });
}