import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const COURSES_DIR = path.join(process.cwd(), "courses");

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("course") || "math3701";
  const filename = searchParams.get("file");

  if (!filename) {
    return NextResponse.json({ error: "Missing 'file' parameter" }, { status: 400 });
  }

  // Sanitize path traversal
  const safeFilename = path.basename(filename);
  const cleanCourseId = courseId.toUpperCase().replace(/[^A-Z0-9]/g, "");

  // Search inside courses/<COURSE>/raw_files/audio/
  const audioPath = path.join(COURSES_DIR, cleanCourseId, "raw_files", "audio", safeFilename);

  if (!fs.existsSync(audioPath)) {
    return NextResponse.json({ error: "Audio file not found on disk" }, { status: 404 });
  }

  const stat = fs.statSync(audioPath);
  const fileSize = stat.size;
  const range = req.headers.get("range");

  // Determine mime type
  const ext = path.extname(safeFilename).toLowerCase();
  const mimeType = ext === ".mp3" ? "audio/mpeg" : ext === ".m4a" ? "audio/mp4" : "audio/aac";

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    const fileStream = fs.createReadStream(audioPath, { start, end });
    const stream = new ReadableStream({
      start(controller) {
        fileStream.on("data", (chunk) => controller.enqueue(chunk));
        fileStream.on("end", () => controller.close());
        fileStream.on("error", (err) => controller.error(err));
      }
    });

    return new NextResponse(stream, {
      status: 206,
      headers: {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": String(chunkSize),
        "Content-Type": mimeType
      }
    });
  } else {
    const fileStream = fs.createReadStream(audioPath);
    const stream = new ReadableStream({
      start(controller) {
        fileStream.on("data", (chunk) => controller.enqueue(chunk));
        fileStream.on("end", () => controller.close());
        fileStream.on("error", (err) => controller.error(err));
      }
    });

    return new NextResponse(stream, {
      status: 200,
      headers: {
        "Content-Length": String(fileSize),
        "Content-Type": mimeType,
        "Accept-Ranges": "bytes"
      }
    });
  }
}
