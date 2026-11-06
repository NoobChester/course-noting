import { NextResponse } from "next/server";
import { getAllRegisteredCourses } from "@/lib/file-service";
import fs from "fs/promises";
import path from "path";
import { CourseMeta } from "@/lib/types";

const COURSES_FILE = path.join(process.cwd(), "content", "courses.json");
const CONTENT_DIR = path.join(process.cwd(), "content");

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

    const courseId = body.id || body.code.toLowerCase().replace(/[^a-z0-9]/g, "");
    const courses = await getAllRegisteredCourses();

    if (courses.some((c) => c.id === courseId)) {
      return NextResponse.json({ error: "Course already exists" }, { status: 400 });
    }

    const newCourse: CourseMeta = {
      ...body,
      id: courseId,
      logoSymbol: body.logoSymbol || "📚",
      term: body.term || "T1, 2027",
      institution: body.institution || "UNSW"
    };

    courses.push(newCourse);
    await fs.writeFile(COURSES_FILE, JSON.stringify(courses, null, 2), "utf-8");

    // Create course folders
    const courseDir = path.join(CONTENT_DIR, courseId);
    await fs.mkdir(path.join(courseDir, "questions"), { recursive: true });
    await fs.mkdir(path.join(courseDir, "concepts"), { recursive: true });
    await fs.writeFile(
      path.join(courseDir, "config.json"),
      JSON.stringify(newCourse, null, 2),
      "utf-8"
    );

    return NextResponse.json({ success: true, course: newCourse });
  } catch (err) {
    console.error("Error creating course:", err);
    return NextResponse.json({ error: "Failed to create course" }, { status: 500 });
  }
}
