import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

const COURSES_DIR = path.join(process.cwd(), "courses");
const TRANSCRIPT_EXTS = new Set([".txt", ".vtt", ".srt"]);
const AUDIO_EXTS = new Set([".m4a", ".mp3", ".wav", ".aac", ".ogg"]);

function extractMediaIdFromFilename(filename: string): string {
  const match = filename.match(/^lecture_(.+)\.[^.]+$/i);
  if (match) return match[1];
  return path.basename(filename, path.extname(filename));
}

function countTimestampCues(text: string): number {
  return text.split(/\r?\n/).filter((line) => line.includes("[")).length;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawCourse = searchParams.get("course") || "sample1001";
    const cleanCourse = rawCourse.toUpperCase().replace(/[^A-Z0-9]/g, "") || "SAMPLE1001";
    const fileParam = searchParams.get("file");
    const extractedParam = searchParams.get("extracted");

    const rawDir = path.join(/*turbopackIgnore: true*/ COURSES_DIR, cleanCourse, "raw_files");

    if (fileParam) {
      const safeFile = path.basename(fileParam);
      if (!safeFile || safeFile === "." || safeFile === "..") {
        return NextResponse.json({ error: "Invalid file name" }, { status: 400 });
      }
      const targetPath = path.join(/*turbopackIgnore: true*/ rawDir, "transcripts", safeFile);
      try {
        const content = await fs.readFile(/*turbopackIgnore: true*/ targetPath, "utf-8");
        return NextResponse.json({
          success: true,
          courseId: cleanCourse,
          filename: safeFile,
          content,
          chars: content.length,
          cueCount: countTimestampCues(content)
        });
      } catch {
        return NextResponse.json(
          { error: `Transcript '${safeFile}' not found in courses/${cleanCourse}/raw_files/transcripts/` },
          { status: 404 }
        );
      }
    }

    if (extractedParam) {
      const safeFile = path.basename(extractedParam);
      if (!safeFile || safeFile === "." || safeFile === "..") {
        return NextResponse.json({ error: "Invalid extracted file name" }, { status: 400 });
      }
      const targetPath = path.join(/*turbopackIgnore: true*/ rawDir, "_extracted", safeFile);
      try {
        const content = await fs.readFile(/*turbopackIgnore: true*/ targetPath, "utf-8");
        return NextResponse.json({
          success: true,
          courseId: cleanCourse,
          filename: safeFile,
          content,
          chars: content.length
        });
      } catch {
        return NextResponse.json(
          { error: `Extracted text '${safeFile}' not found in courses/${cleanCourse}/raw_files/_extracted/` },
          { status: 404 }
        );
      }
    }

    const transcriptsDir = path.join(/*turbopackIgnore: true*/ rawDir, "transcripts");
    const audioDir = path.join(/*turbopackIgnore: true*/ rawDir, "audio");

    const transcripts: Array<{
      filename: string;
      mediaId: string;
      size: number;
      chars: number;
      cueCount: number;
      modifiedAt: string;
      preview: string;
    }> = [];

    try {
      const entries = await fs.readdir(/*turbopackIgnore: true*/ transcriptsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isFile()) continue;
        const ext = path.extname(entry.name).toLowerCase();
        if (!TRANSCRIPT_EXTS.has(ext)) continue;

        const fullPath = path.join(/*turbopackIgnore: true*/ transcriptsDir, entry.name);
        const [stat, content] = await Promise.all([
          fs.stat(/*turbopackIgnore: true*/ fullPath),
          fs.readFile(/*turbopackIgnore: true*/ fullPath, "utf-8")
        ]);
        const preview = content
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean)
          .slice(0, 4)
          .join("\n");

        transcripts.push({
          filename: entry.name,
          mediaId: extractMediaIdFromFilename(entry.name),
          size: stat.size,
          chars: content.length,
          cueCount: countTimestampCues(content),
          modifiedAt: stat.mtime.toISOString(),
          preview
        });
      }
    } catch {
      // Directory does not exist yet
    }

    const audioFiles: Array<{
      filename: string;
      mediaId: string;
      size: number;
      modifiedAt: string;
      audioUrl: string;
    }> = [];

    try {
      const entries = await fs.readdir(/*turbopackIgnore: true*/ audioDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isFile()) continue;
        if (entry.name.endsWith(".tmp") || entry.name.endsWith(".tmp.m4a")) continue;
        const ext = path.extname(entry.name).toLowerCase();
        if (!AUDIO_EXTS.has(ext)) continue;

        const fullPath = path.join(/*turbopackIgnore: true*/ audioDir, entry.name);
        const stat = await fs.stat(/*turbopackIgnore: true*/ fullPath);

        audioFiles.push({
          filename: entry.name,
          mediaId: extractMediaIdFromFilename(entry.name),
          size: stat.size,
          modifiedAt: stat.mtime.toISOString(),
          audioUrl: `/api/audio?course=${encodeURIComponent(cleanCourse)}&file=${encodeURIComponent(entry.name)}`
        });
      }
    } catch {
      // Directory does not exist yet
    }

    transcripts.sort((a, b) => a.filename.localeCompare(b.filename));
    audioFiles.sort((a, b) => a.filename.localeCompare(b.filename));

    return NextResponse.json({
      success: true,
      courseId: cleanCourse,
      transcripts,
      audioFiles
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to inspect raw lecture files";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
