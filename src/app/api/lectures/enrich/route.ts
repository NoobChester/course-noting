import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { distillLongLecture } from "@/lib/lecture-ingest";
import { LectureInsight, QuestionHintInsight } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const {
      courseId = "math3701",
      week = 1,
      lectureTitle = "Lecture Notes",
      slideText = "",
      transcriptText = "",
      provider = "gemini",
      apiKey,
      model,
      thinkingLevel,
      antigravityModel,
      geminiModel,
      openaiModel,
      anthropicModel,
      ollamaUrl = "http://localhost:11434",
      ollamaModel = "qwen2.5:7b-instruct"
    } = await req.json();

    if (!transcriptText && !slideText) {
      return NextResponse.json(
        { error: "Please provide either transcript text or slide text." },
        { status: 400 }
      );
    }

    const cleanCourse = String(courseId).toUpperCase().replace(/[^A-Z0-9]/g, "");
    const courseDir = path.join(process.cwd(), "courses", cleanCourse);

    const distilled = await distillLongLecture({
      courseId: cleanCourse,
      courseDir,
      week: Number(week) || 1,
      lectureTitle,
      transcriptText: transcriptText || "",
      extraSlideText: slideText || "",
      aiSettings: {
        provider,
        apiKey,
        model,
        thinkingLevel,
        antigravityModel,
        geminiModel,
        openaiModel,
        anthropicModel,
        ollamaUrl,
        ollamaModel
      }
    });

    const enrichedInsights: LectureInsight[] = (distilled.insights || []).map((ins: any, idx: number) => ({
      id: `ins-${week}-${idx}-${Date.now()}`,
      conceptSlug: ins.conceptSlug || undefined,
      type: ins.type || "intuition",
      title: ins.title || "Lecture Insight",
      timestamp: ins.timestamp || undefined,
      content: ins.content || ""
    }));

    const questionHints: QuestionHintInsight[] = (distilled.questionHints || []).map((q: any) => ({
      questionId: q.questionId || "general",
      timestamp: q.timestamp || undefined,
      hint: q.hint || ""
    }));

    return NextResponse.json({
      success: true,
      result: {
        title: distilled.title || lectureTitle,
        outline: distilled.outline || [],
        distilledContent: distilled.distilledContent || "",
        insights: enrichedInsights,
        questionHints,
        partsProcessed: distilled.partsProcessed,
        contextWarning: distilled.contextWarning,
        aiModelUsed: distilled.aiModelUsed
      }
    });
  } catch (err: any) {
    console.error("Enrich Lecture API Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to enrich lecture materials" },
      { status: 500 }
    );
  }
}
