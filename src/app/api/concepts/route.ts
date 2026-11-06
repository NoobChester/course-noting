import { NextResponse } from "next/server";
import { getAllConcepts } from "@/lib/file-service";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("course") || "math2621";
    const concepts = await getAllConcepts(courseId);
    return NextResponse.json(concepts);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch concepts" }, { status: 500 });
  }
}
