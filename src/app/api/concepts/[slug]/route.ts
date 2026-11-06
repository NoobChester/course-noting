import { NextResponse } from "next/server";
import { getConceptBySlug } from "@/lib/file-service";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const concept = await getConceptBySlug(slug);
    if (!concept) {
      return NextResponse.json({ error: "Concept not found" }, { status: 404 });
    }
    return NextResponse.json(concept);
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
