import { NextResponse } from "next/server";
import {
  exportBackupData,
  exportBackupString,
  getUserCourseState,
  importBackupPayload,
  parseBackupString,
  resetAllUserData
} from "@/lib/user-service";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("course");
    const activeCourse = searchParams.get("activeCourse") || undefined;

    if (courseId) {
      const state = await getUserCourseState(courseId);
      return NextResponse.json({ success: true, courseId, state });
    }

    const payload = await exportBackupData(activeCourse);
    const saveString = await exportBackupString(activeCourse);

    // Calculate aggregated stats
    let totalQuestionsWithData = 0;
    let totalMastered = 0;
    let totalStarred = 0;
    let totalWithSolutions = 0;

    for (const course of Object.values(payload.courses)) {
      for (const q of Object.values(course.questions)) {
        totalQuestionsWithData += 1;
        if (q.status === "Mastered") totalMastered += 1;
        if (q.starred) totalStarred += 1;
        if (q.solution && q.solution.trim()) totalWithSolutions += 1;
      }
    }

    return NextResponse.json({
      success: true,
      exportedAt: payload.exportedAt,
      stats: {
        totalCourses: Object.keys(payload.courses).length,
        totalQuestionsWithData,
        totalMastered,
        totalStarred,
        totalWithSolutions
      },
      saveString,
      payload
    });
  } catch (err: any) {
    console.error("Error in GET /api/userdata:", err);
    return NextResponse.json({ error: err.message || "Failed to export user data" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body.action || "load";

    if (action === "reset") {
      const success = await resetAllUserData();
      return NextResponse.json({ success, message: "All user progress reset to clean slate" });
    }

    if (action === "load") {
      const mode = body.mode === "replace" ? "replace" : "merge";
      let payloadToImport;

      if (body.saveString && typeof body.saveString === "string") {
        payloadToImport = parseBackupString(body.saveString);
      } else if (body.payload && typeof body.payload === "object") {
        payloadToImport = body.payload;
      } else {
        return NextResponse.json(
          { error: "Missing required 'saveString' or 'payload' field." },
          { status: 400 }
        );
      }

      const result = await importBackupPayload(payloadToImport, mode);
      return NextResponse.json({
        success: true,
        message: `Successfully restored ${result.restoredQuestions} questions across ${result.restoredCourses} course(s).`,
        ...result
      });
    }

    return NextResponse.json({ error: `Unknown action '${action}'` }, { status: 400 });
  } catch (err: any) {
    console.error("Error in POST /api/userdata:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process user data request" },
      { status: 400 }
    );
  }
}
