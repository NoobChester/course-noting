import { NextResponse } from "next/server";
import { getAllRegisteredCourses } from "@/lib/file-service";
import fs from "fs/promises";
import path from "path";
import { CourseMeta } from "@/lib/types";

const COURSES_BASE_DIR = path.join(process.cwd(), "courses");

export async function GET() {
  try {
    const courses = await getAllRegisteredCourses();
    return NextResponse.json(courses);
  } catch (err) {
    return NextResponse.json({ error: "Failed to load courses" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body: CourseMeta = await req.json();
    if (!body.code || !body.name) {
      return NextResponse.json({ error: "Code and name are required" }, { status: 400 });
    }

    const courseFolder = body.code.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const courseId = body.id || courseFolder.toLowerCase();

    const targetDir = path.join(COURSES_BASE_DIR, courseFolder);
    await fs.mkdir(path.join(targetDir, "questions"), { recursive: true });
    await fs.mkdir(path.join(targetDir, "concepts"), { recursive: true });
    await fs.mkdir(path.join(targetDir, "lectures"), { recursive: true });

    const newCourse: CourseMeta = {
      ...body,
      id: courseId,
      code: courseFolder,
      logoSymbol: body.logoSymbol || "📚",
      term: body.term || "T1, 2027",
      institution: body.institution || "UNSW"
    };

    const configPath = path.join(targetDir, "course.json");
    await fs.writeFile(configPath, JSON.stringify(newCourse, null, 2), "utf-8");

    return NextResponse.json({ success: true, course: newCourse });
  } catch (err) {
    console.error("Error creating course:", err);
    return NextResponse.json({ error: "Failed to create course" }, { status: 500 });
  }
}
