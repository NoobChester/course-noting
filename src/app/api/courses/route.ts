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

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let courseId = searchParams.get("course") || searchParams.get("id");
    if (!courseId) {
      try {
        const body = await req.json();
        courseId = body?.courseId || body?.course || body?.id;
      } catch {}
    }

    if (!courseId) {
      return NextResponse.json({ error: "Course ID or code required" }, { status: 400 });
    }

    const cleanCode = courseId.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const cleanId = courseId.toLowerCase().replace(/[^a-z0-9]/g, "");

    // Protect default sample course from accidental deletion
    if (cleanId === "sample1001" || cleanCode === "SAMPLE1001") {
      return NextResponse.json(
        { error: "The default demo course (SAMPLE1001) is protected and cannot be deleted." },
        { status: 403 }
      );
    }

    // 1. Remove course directory from courses/
    let deletedDir = false;
    try {
      const entries = await fs.readdir(COURSES_BASE_DIR, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && (entry.name.toUpperCase() === cleanCode || entry.name.toLowerCase() === cleanId)) {
          await fs.rm(path.join(COURSES_BASE_DIR, entry.name), { recursive: true, force: true });
          deletedDir = true;
        }
      }
    } catch (e) {
      console.warn("Could not inspect courses directory:", e);
    }

    // 2. Remove public JSON bundles
    const publicDataDir = path.join(process.cwd(), "public", "data");
    try {
      await fs.unlink(path.join(publicDataDir, `${cleanId}_base.json`));
    } catch {}
    try {
      await fs.unlink(path.join(publicDataDir, `${cleanId}_lectures.json`));
    } catch {}

    // 3. Update catalog.json and catalog.local.json
    for (const catalogFile of ["catalog.json", "catalog.local.json"]) {
      const catPath = path.join(publicDataDir, catalogFile);
      try {
        const raw = await fs.readFile(catPath, "utf-8");
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          const filtered = list.filter((c: any) => c.id !== cleanId && c.code?.toUpperCase() !== cleanCode);
          await fs.writeFile(catPath, JSON.stringify(filtered, null, 2), "utf-8");
        }
      } catch {}
    }

    // 4. Clean up any Cookie Vault session for this course
    const vaultPath = path.join(process.cwd(), ".echo360_session", "vault.json");
    try {
      const raw = await fs.readFile(vaultPath, "utf-8");
      const vault = JSON.parse(raw);
      if (Array.isArray(vault)) {
        const filteredVault = vault.filter(
          (v: any) => v.courseCode?.toUpperCase() !== cleanCode && v.id?.toLowerCase() !== cleanId
        );
        await fs.writeFile(vaultPath, JSON.stringify(filteredVault, null, 2), "utf-8");
      }
    } catch {}

    return NextResponse.json({
      success: true,
      message: `Course ${cleanCode} has been deleted.`,
      courseId: cleanId,
      deletedDir
    });
  } catch (err: any) {
    console.error("Error deleting course:", err);
    return NextResponse.json({ error: err.message || "Failed to delete course" }, { status: 500 });
  }
}
