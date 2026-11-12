import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);
const REPO_ROOT = process.cwd();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("course") || "math3051";
    const cleanCode = courseId.toUpperCase().replace(/[^A-Z0-9]/g, "");

    // Resolve course workspace (check courses/<CODE>, courses/<id>, or ../<id>)
    let wsDir = path.join(REPO_ROOT, "courses", cleanCode);
    let exists = false;
    try {
      await fs.access(wsDir);
      exists = true;
    } catch {
      // Check sibling folder (e.g. ../math3051)
      const siblingDir = path.join(REPO_ROOT, "..", courseId.toLowerCase());
      try {
        await fs.access(siblingDir);
        wsDir = siblingDir;
        exists = true;
      } catch {
        exists = false;
      }
    }

    // Check task status file
    let taskData: any = null;
    const taskPath = path.join(wsDir, ".antigravity_task.json");
    try {
      const taskRaw = await fs.readFile(taskPath, "utf-8");
      taskData = JSON.parse(taskRaw);
    } catch {
      // No task file
    }

    // Check course metadata
    let meta: any = null;
    const configPath = path.join(wsDir, "course.json");
    try {
      const configRaw = await fs.readFile(configPath, "utf-8");
      meta = JSON.parse(configRaw);
    } catch {
      meta = { id: courseId.toLowerCase(), code: cleanCode, name: cleanCode };
    }

    // Check staged public packs
    const basePackFile = path.join(REPO_ROOT, "public", "data", `${courseId.toLowerCase()}_base.json`);
    let isPackReady = false;
    let questionsCount = 0;
    let conceptsCount = 0;
    try {
      const baseRaw = await fs.readFile(basePackFile, "utf-8");
      const baseData = JSON.parse(baseRaw);
      isPackReady = true;
      questionsCount = baseData.questions?.length || 0;
      conceptsCount = baseData.concepts?.length || 0;
    } catch {
      isPackReady = false;
    }

    // Check staged PDFs
    const pdfDir = path.join(REPO_ROOT, "public", "courses", courseId.toLowerCase());
    let stagedPdfs: string[] = [];
    try {
      const files = await fs.readdir(pdfDir);
      stagedPdfs = files.filter((f) => f.endsWith(".pdf"));
    } catch {
      stagedPdfs = [];
    }

    return NextResponse.json({
      courseId: courseId.toLowerCase(),
      courseCode: cleanCode,
      workspacePath: wsDir,
      workspaceExists: exists,
      isPackReady,
      questionsCount,
      conceptsCount,
      stagedPdfsCount: stagedPdfs.length,
      stagedPdfs,
      meta,
      task: taskData
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch status" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { courseId, task } = body;
    if (!courseId || !task) {
      return NextResponse.json({ error: "courseId and task are required" }, { status: 400 });
    }

    const cleanCode = courseId.toUpperCase().replace(/[^A-Z0-9]/g, "");
    let wsDir = path.join(REPO_ROOT, "courses", cleanCode);
    try {
      await fs.access(wsDir);
    } catch {
      const siblingDir = path.join(REPO_ROOT, "..", courseId.toLowerCase());
      try {
        await fs.access(siblingDir);
        wsDir = siblingDir;
      } catch {
        await fs.mkdir(wsDir, { recursive: true });
      }
    }

    const taskPath = path.join(wsDir, ".antigravity_task.json");
    await fs.writeFile(taskPath, JSON.stringify(task, null, 2), "utf-8");

    return NextResponse.json({ success: true, taskPath });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to save task" }, { status: 500 });
  }
}
