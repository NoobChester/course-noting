import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import { LectureNote } from "@/lib/types";

const COURSES_DIR = path.join(process.cwd(), "courses");

function safeMatterStringify(content: string = "", frontmatter: Record<string, any> = {}): string {
  const cleanContent = String(content || "");
  const cleanFrontmatter: Record<string, any> = {};
  for (const [key, value] of Object.entries(frontmatter)) {
    if (value !== undefined) {
      cleanFrontmatter[key] = value;
    }
  }
  const fullyCleaned = JSON.parse(
    JSON.stringify(cleanFrontmatter, (key, val) => (val === undefined ? undefined : val))
  );
  return matter.stringify(cleanContent, fullyCleaned);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = (searchParams.get("course") || "sample1001").toUpperCase().replace(/[^A-Z0-9]/g, "");

    const lecturesDir = path.join(COURSES_DIR, courseId, "lectures");

    try {
      await fs.access(lecturesDir);
    } catch {
      // If folder doesn't exist yet, return empty list
      return NextResponse.json([]);
    }

    const files = await fs.readdir(lecturesDir);
    const lectures: LectureNote[] = [];

    for (const f of files) {
      if (!f.endsWith(".md")) continue;
      const filePath = path.join(lecturesDir, f);
      const raw = await fs.readFile(filePath, "utf-8");
      const { data, content } = matter(raw);

      lectures.push({
        id: data.id || f.replace(/\.md$/, ""),
        week: Number(data.week) || 1,
        lectureNumber: data.lectureNumber || undefined,
        title: data.title || f.replace(/\.md$/, ""),
        date: data.date || "",
        echo360Url: data.echo360Url || "",
        topics: data.topics || [],
        sourceSlides: data.sourceSlides || "",
        sourceTranscript: data.sourceTranscript || "",
        sourceAudio: data.sourceAudio || "",
        linkedConcepts: data.linkedConcepts || [],
        linkedQuestions: data.linkedQuestions || [],
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
        content: content.trim(),
        insights: data.insights || [],
        questionHints: data.questionHints || []
      });
    }

    lectures.sort((a, b) => (a.week === b.week ? (a.lectureNumber || 0) - (b.lectureNumber || 0) : a.week - b.week));

    return NextResponse.json(lectures);
  } catch (err: any) {
    console.error("Error reading lectures:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { courseId = "sample1001", note } = body as { courseId: string; note: LectureNote };

    if (!note || !note.id) {
      return NextResponse.json({ error: "Missing lecture note payload" }, { status: 400 });
    }

    const cleanCourseId = courseId.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const lecturesDir = path.join(COURSES_DIR, cleanCourseId, "lectures");
    await fs.mkdir(lecturesDir, { recursive: true });

    const safeId = note.id.replace(/[^a-zA-Z0-9-_]/g, "");
    const filePath = path.join(lecturesDir, `${safeId}.md`);

    const frontmatter: any = {
      id: safeId,
      week: note.week,
      title: note.title,
      topics: note.topics || []
    };

    if (note.lectureNumber) frontmatter.lectureNumber = note.lectureNumber;
    if (note.date) frontmatter.date = note.date;
    if (note.echo360Url) frontmatter.echo360Url = note.echo360Url;
    if (note.sourceSlides) frontmatter.sourceSlides = note.sourceSlides;
    if (note.sourceTranscript) frontmatter.sourceTranscript = note.sourceTranscript;
    if (note.sourceAudio) frontmatter.sourceAudio = note.sourceAudio;
    if (note.linkedConcepts) frontmatter.linkedConcepts = note.linkedConcepts;
    if (note.linkedQuestions) frontmatter.linkedQuestions = note.linkedQuestions;
    if (note.insights) frontmatter.insights = note.insights;
    if (note.questionHints) frontmatter.questionHints = note.questionHints;
    frontmatter.createdAt = note.createdAt || new Date().toISOString();
    frontmatter.updatedAt = new Date().toISOString();

    const fileContent = safeMatterStringify(note.content, frontmatter);
    await fs.writeFile(filePath, fileContent, "utf-8");

    return NextResponse.json({ success: true, id: safeId });
  } catch (err: any) {
    console.error("Error writing lecture note:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
