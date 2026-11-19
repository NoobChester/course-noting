import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import JSZip from "jszip";

const REPO_ROOT = process.cwd();

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const course = formData.get("course") as string | null;
    const category = formData.get("category") as string | null; // "notes" | "sheet" | "transcript"
    const file = formData.get("file") as File | null;
    const week = formData.get("week") as string | null;

    if (!course || !category || !file) {
      return NextResponse.json({ error: "Missing required fields (course, category, file)" }, { status: 400 });
    }

    const cleanCode = course.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const courseDir = path.join(REPO_ROOT, "courses", cleanCode);

    let destDir = path.join(courseDir, "raw_files");
    let targetFileName = file.name;

    if (category === "notes") {
      destDir = path.join(courseDir, "raw_files");
      targetFileName = file.name.endsWith(".pdf") ? file.name : "LectureNotes.pdf";
    } else if (category === "sheet") {
      destDir = path.join(courseDir, "raw_files", "tut_sheets");
      const weekSuffix = week ? `_week${week}` : "";
      targetFileName = file.name;
    } else if (category === "transcript") {
      destDir = path.join(courseDir, "transcripts");
      targetFileName = file.name;
    }

    await fs.mkdir(destDir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());

    const isZip = file.name.toLowerCase().endsWith(".zip") || file.type.includes("zip");
    if (isZip) {
      const zip = await JSZip.loadAsync(buffer);
      const extractedFiles: string[] = [];

      for (const [relPath, zipEntry] of Object.entries(zip.files)) {
        if (zipEntry.dir) continue;
        if (relPath.startsWith("__MACOSX") || path.basename(relPath).startsWith(".")) continue;

        const entryExt = path.extname(zipEntry.name).toLowerCase();
        // Category filtering
        if (category === "notes" && !([".pdf", ".tex", ".latex", ".md", ".txt"].includes(entryExt))) continue;
        if (category === "sheet" && !([".pdf", ".tex", ".latex", ".md", ".txt"].includes(entryExt))) continue;
        if (category === "transcript" && !([".txt", ".vtt", ".srt", ".json", ".m4a", ".mp3"].includes(entryExt))) continue;

        const entryBuffer = await zipEntry.async("nodebuffer");
        const safeName = path.basename(zipEntry.name).replace(/[^a-zA-Z0-9._-]/g, "_");
        const entryDest = path.join(destDir, safeName);
        await fs.writeFile(entryDest, entryBuffer);
        extractedFiles.push(safeName);
      }

      return NextResponse.json({
        success: true,
        isZip: true,
        filenames: extractedFiles,
        count: extractedFiles.length,
        category,
        path: destDir
      });
    }

    const destination = path.join(destDir, targetFileName);
    await fs.writeFile(destination, buffer);

    return NextResponse.json({
      success: true,
      filename: targetFileName,
      category,
      path: destination
    });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: err.message || "Failed to upload file" }, { status: 500 });
  }
}
