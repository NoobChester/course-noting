import { NextResponse } from "next/server";
import { getAllConcepts } from "@/lib/file-service";

export async function GET() {
  try {
    const concepts = await getAllConcepts();
    return NextResponse.json(concepts);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch concepts" }, { status: 500 });
  }
}
