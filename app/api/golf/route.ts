import { NextResponse } from "next/server";
import { GOLF_COURSES } from "@/lib/golf";

export async function GET() {
  return NextResponse.json({
    count: GOLF_COURSES.length,
    rows: GOLF_COURSES,
  });
}