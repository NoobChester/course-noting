import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);
const REPO_ROOT = process.cwd();

export async function POST(req: Request) {
  try {
    const { code, name, weeks = 10, term = "T1, 2027", institution = "UNSW", preset = "calculus" } = await req.json();

    if (!code || !name) {
      return NextResponse.json({ error: "Course code and title are required" }, { status: 400 });
    }

    const cleanCode = code.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const courseId = cleanCode.toLowerCase();
    const targetDir = path.join(REPO_ROOT, "courses", cleanCode);

    // Run python scripts/course_bridge.py init --workspace courses/<cleanCode> ...
    const bridgeScript = path.join(REPO_ROOT, "scripts", "course_bridge.py");
    try {
      await execFileAsync("python", [
        bridgeScript,
        "--workspace",
        targetDir,
        "init",
        "--code",
        cleanCode,
        "--name",
        name,
        "--weeks",
        String(weeks),
        "--term",
        term,
        "--institution",
        institution
      ]);
    } catch (e) {
      // Fallback: manually create basic structure if python is unavailable
      await fs.mkdir(path.join(targetDir, "raw_files", "tut_sheets"), { recursive: true });
      await fs.mkdir(path.join(targetDir, "transcripts"), { recursive: true });
      await fs.mkdir(path.join(targetDir, "dossiers"), { recursive: true });
      await fs.mkdir(path.join(targetDir, "textbook", "chapters"), { recursive: true });

      const meta = {
        id: courseId,
        code: cleanCode,
        name,
        institution,
        term,
        logoSymbol: "📚",
        totalWeeks: weeks,
        currentWeek: 1,
        chapters: []
      };
      await fs.writeFile(path.join(targetDir, "course.json"), JSON.stringify(meta, null, 2));
    }

    return NextResponse.json({
      success: true,
      courseId,
      courseCode: cleanCode,
      targetDir
    });
  } catch (err: any) {
    console.error("Error initializing course:", err);
    return NextResponse.json({ error: err.message || "Failed to initialize course" }, { status: 500 });
  }
}
