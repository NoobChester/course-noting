import { NextResponse } from "next/server";
import { getAllQuestions, saveQuestion } from "@/lib/file-service";
import { Question } from "@/lib/types";

export async function GET() {
  try {
    const questions = await getAllQuestions();
    return NextResponse.json(questions);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body: Question = await req.json();
    if (!body.id || !body.title) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const success = await saveQuestion(body);
    if (!success) {
      return NextResponse.json({ error: "Failed to save question" }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: body.id });
  } catch (err) {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }
}
