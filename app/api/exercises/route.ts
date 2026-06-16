import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { listExercises, searchParamsToQuery } from "@/lib/exercises";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const result = await listExercises(searchParamsToQuery(req.nextUrl.searchParams));
    return NextResponse.json(result);
  } catch (error) {
    console.error("LIST EXERCISES ERROR:", error);
    return NextResponse.json(
      { message: "Failed to load exercises" },
      { status: 500 }
    );
  }
}
