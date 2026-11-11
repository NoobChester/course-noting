import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const BASE_DIR = process.cwd();
const COURSES_BASE_DIR = path.join(BASE_DIR, "courses");

function extractTextFromBuffer(buffer: Buffer, ext: string): string {
  const lowerExt = ext.toLowerCase();
  if ([".md", ".txt", ".tex", ".latex", ".vtt", ".srt", ".csv", ".json"].includes(lowerExt)) {
    return buffer.toString("utf-8");
  }

  if (lowerExt === ".pdf") {
    // Basic extraction of readable text streams from PDF without native dependencies
    const raw = buffer.toString("latin1");
    const matches: string[] = [];
    const textStreamRegex = /\(([^)]+)\)\s*Tj/g;
    let match;
    while ((match = textStreamRegex.exec(raw)) !== null) {
      if (match[1] && match[1].trim().length > 1) {
        matches.push(match[1]);
      }
    }
    if (matches.length > 0) {
      return matches.join(" ");
    }
    // Fallback: extract ASCII runs of 4+ characters
    const asciiMatches = raw.match(/[A-Za-z0-9\s.,;:?!'"()$+=/\\-]{4,}/g) || [];
    return asciiMatches.slice(0, 1000).join(" ");
  }

  return "";
}

// GET: List all uploaded course content for a course
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("course") || "sample1001";
    const cleanCourse = courseId.toUpperCase().replace(/[^A-Z0-9]/g, "");

    const manifestPath = path.join(COURSES_BASE_DIR, cleanCourse, "course_content.json");
    try {
      const raw = await fs.readFile(manifestPath, "utf-8");
      const manifest = JSON.parse(raw);
      return NextResponse.json({ success: true, courseId: cleanCourse, manifest });
    } catch {
      return NextResponse.json({
        success: true,
        courseId: cleanCourse,
        manifest: { items: [], lastUpdated: new Date().toISOString() }
      });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Upload a file for a specific category and optional week
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const courseId = (formData.get("courseId") as string) || "sample1001";
    const category = (formData.get("category") as string) || "other";
    const categoryName = (formData.get("categoryName") as string) || category;
    const weekVal = formData.get("week");
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const cleanCourse = courseId.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const safeCategory = category.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
    const targetDir = path.join(COURSES_BASE_DIR, cleanCourse, "raw_files", safeCategory);
    await fs.mkdir(targetDir, { recursive: true });

    // Determine week
    let week: number | "all" = "all";
    if (weekVal && weekVal !== "all") {
      const parsedWeek = parseInt(String(weekVal), 10);
      if (!isNaN(parsedWeek) && parsedWeek >= 1 && parsedWeek <= 12) {
        week = parsedWeek;
      }
    }

    // Try auto-detecting week from filename if week is not explicitly set
    if (week === "all") {
      const weekMatch = file.name.match(/(?:week|wk|w)[\s_-]*(\d+)/i);
      if (weekMatch) {
        week = parseInt(weekMatch[1], 10);
      }
    }

    const ext = path.extname(file.name) || ".txt";
    const safeBaseName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
    const targetFileName = `${safeBaseName}_${Date.now()}${ext}`;
    const targetFilePath = path.join(targetDir, targetFileName);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(targetFilePath, buffer);

    const extractedText = extractTextFromBuffer(buffer, ext);

    // Update course_content.json manifest
    const manifestPath = path.join(COURSES_BASE_DIR, cleanCourse, "course_content.json");
    let manifest: { items: any[]; lastUpdated: string } = { items: [], lastUpdated: new Date().toISOString() };
    try {
      const raw = await fs.readFile(manifestPath, "utf-8");
      manifest = JSON.parse(raw);
    } catch {}

    const newItem = {
      id: `content-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      originalName: file.name,
      savedFileName: targetFileName,
      relativePath: path.relative(path.join(COURSES_BASE_DIR, cleanCourse), targetFilePath).replace(/\\/g, "/"),
      category: safeCategory,
      categoryName,
      week,
      size: file.size,
      mimeType: file.type || "application/octet-stream",
      uploadedAt: new Date().toISOString(),
      textSnippet: extractedText ? extractedText.slice(0, 5000) : ""
    };

    manifest.items.push(newItem);
    manifest.lastUpdated = new Date().toISOString();
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");

    return NextResponse.json({
      success: true,
      item: newItem,
      totalCount: manifest.items.length
    });
  } catch (err: any) {
    console.error("Error in /api/courses/content POST:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
