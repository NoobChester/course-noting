import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

const REPO_ROOT = process.cwd();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("course") || "math3051";
    const cleanCode = courseId.toUpperCase().replace(/[^A-Z0-9]/g, "");

    // Resolve workspace
    let wsDir = path.join(REPO_ROOT, "courses", cleanCode);
    try {
      await fs.access(wsDir);
    } catch {
      const siblingDir = path.join(REPO_ROOT, "..", courseId.toLowerCase());
      try {
        await fs.access(siblingDir);
        wsDir = siblingDir;
      } catch {
        // Use repo root
      }
    }

    // Read Web Packs
    let basePack: any = null;
    let lecturesPack: any = null;
    try {
      const baseRaw = await fs.readFile(
        path.join(REPO_ROOT, "public", "data", `${courseId.toLowerCase()}_base.json`),
        "utf-8"
      );
      basePack = JSON.parse(baseRaw);
    } catch {}

    try {
      const lecRaw = await fs.readFile(
        path.join(REPO_ROOT, "public", "data", `${courseId.toLowerCase()}_lectures.json`),
        "utf-8"
      );
      lecturesPack = JSON.parse(lecRaw);
    } catch {}

    // Read Raw LaTeX Files
    const rawLatexWorkspace: Record<string, string> = {};
    const textbookDir = path.join(wsDir, "textbook");

    for (const filename of ["preamble.sty", "macros.tex", "main.tex", "build.ps1"]) {
      try {
        const content = await fs.readFile(path.join(textbookDir, filename), "utf-8");
        rawLatexWorkspace[filename] = content;
      } catch {}
    }

    // Read Chapters
    const chaptersDir = path.join(textbookDir, "chapters");
    try {
      const chapterFiles = await fs.readdir(chaptersDir);
      for (const chFile of chapterFiles) {
        if (chFile.endsWith(".tex")) {
          const content = await fs.readFile(path.join(chaptersDir, chFile), "utf-8");
          rawLatexWorkspace[`chapters/${chFile}`] = content;
        }
      }
    } catch {}

    // Read Dossiers
    const dossiersDir = path.join(wsDir, "dossiers");
    try {
      const dossierFiles = await fs.readdir(dossiersDir);
      for (const dFile of dossierFiles) {
        const content = await fs.readFile(path.join(dossiersDir, dFile), "utf-8");
        rawLatexWorkspace[`dossiers/${dFile}`] = content;
      }
    } catch {}

    const cnpack = {
      formatVersion: "2.0.0",
      exportedAt: new Date().toISOString(),
      courseMeta: basePack?.course || {
        id: courseId.toLowerCase(),
        code: cleanCode,
        name: cleanCode
      },
      webPacks: {
        base: basePack,
        lectures: lecturesPack
      },
      rawLatexWorkspace,
      pdfManifest: {
        staged: true
      }
    };

    return new NextResponse(JSON.stringify(cnpack, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${cleanCode}_coursebook.cnpack"`
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to export cnpack" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const pack = await req.json();
    if (!pack || !pack.courseMeta || !pack.courseMeta.code) {
      return NextResponse.json({ error: "Invalid cnpack format" }, { status: 400 });
    }

    const cleanCode = pack.courseMeta.code.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const courseId = pack.courseMeta.id || cleanCode.toLowerCase();
    const targetDir = path.join(REPO_ROOT, "courses", cleanCode);
    const textbookDir = path.join(targetDir, "textbook");
    const chaptersDir = path.join(textbookDir, "chapters");
    const dossiersDir = path.join(targetDir, "dossiers");

    await fs.mkdir(chaptersDir, { recursive: true });
    await fs.mkdir(dossiersDir, { recursive: true });

    // Unpack Raw LaTeX
    if (pack.rawLatexWorkspace) {
      for (const [relPath, content] of Object.entries(pack.rawLatexWorkspace)) {
        const fullDest = path.join(textbookDir, relPath);
        await fs.mkdir(path.dirname(fullDest), { recursive: true });
        await fs.writeFile(fullDest, content as string, "utf-8");
      }
    }

    // Write Web Packs
    if (pack.webPacks?.base) {
      const baseDest = path.join(REPO_ROOT, "public", "data", `${courseId}_base.json`);
      await fs.writeFile(baseDest, JSON.stringify(pack.webPacks.base, null, 2), "utf-8");
    }

    if (pack.webPacks?.lectures) {
      const lecDest = path.join(REPO_ROOT, "public", "data", `${courseId}_lectures.json`);
      await fs.writeFile(lecDest, JSON.stringify(pack.webPacks.lectures, null, 2), "utf-8");
    }

    // Update catalog
    const catalogFile = path.join(REPO_ROOT, "public", "data", "catalog.local.json");
    let catalog: any[] = [];
    try {
      const catRaw = await fs.readFile(catalogFile, "utf-8");
      catalog = JSON.parse(catRaw);
    } catch {
      catalog = [];
    }

    catalog = catalog.filter((c) => c.id !== courseId);
    catalog.push({
      id: courseId,
      code: cleanCode,
      name: pack.courseMeta.name,
      institution: pack.courseMeta.institution || "University",
      term: pack.courseMeta.term || "Current Term",
      logoSymbol: pack.courseMeta.logoSymbol || "📚",
      totalQuestions: pack.webPacks?.base?.questions?.length || 0,
      totalConcepts: pack.webPacks?.base?.concepts?.length || 0
    });

    await fs.writeFile(catalogFile, JSON.stringify(catalog, null, 2), "utf-8");

    return NextResponse.json({
      success: true,
      courseId,
      code: cleanCode,
      questionsImported: pack.webPacks?.base?.questions?.length || 0,
      latexFilesWritten: Object.keys(pack.rawLatexWorkspace || {}).length
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to import cnpack" }, { status: 500 });
  }
}
