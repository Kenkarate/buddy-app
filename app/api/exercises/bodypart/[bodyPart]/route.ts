import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { listExercises, searchParamsToQuery } from "@/lib/exercises";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ bodyPart: string }> }
) {
  try {
    const { bodyPart } = await params;
    await connectDB();
    const query = { ...searchParamsToQuery(req.nextUrl.searchParams), bodyPart };
    return NextResponse.json(await listExercises(query));
  } catch (error) {
    console.error("LIST EXERCISES ERROR:", error);
    return NextResponse.json(
      { message: "Failed to load exercises" },
      { status: 500 }
    );
  }
}
