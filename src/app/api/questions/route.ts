import { NextResponse } from "next/server";
import { getAllQuestions, createOrUpdateMasterQuestion } from "@/lib/file-service";
import { Question } from "@/lib/types";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("course") || "sample1001";
    const questions = await getAllQuestions(courseId);
    return NextResponse.json(questions);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("course") || "sample1001";
    const body: Question = await req.json();
    if (!body.id || !body.title) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const success = await createOrUpdateMasterQuestion(body, courseId);
    if (!success) {
      return NextResponse.json({ error: "Failed to save question" }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: body.id });
  } catch (err) {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }
}
