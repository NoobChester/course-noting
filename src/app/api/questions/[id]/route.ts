import { NextResponse } from "next/server";
import { getQuestionById, saveQuestion } from "@/lib/file-service";
import { Question } from "@/lib/types";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("course") || "math2621";
    const question = await getQuestionById(id, courseId);
    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }
    return NextResponse.json(question);
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("course") || "math2621";
    const body: Question = await req.json();

    const existing = await getQuestionById(id, courseId);
    if (!existing) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    const updated: Question = {
      ...existing,
      ...body,
      id,
      updatedAt: new Date().toISOString()
    };

    const success = await saveQuestion(updated, courseId);
    if (!success) {
      return NextResponse.json({ error: "Failed to update question" }, { status: 500 });
    }

    return NextResponse.json({ success: true, question: updated });
  } catch (err) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
