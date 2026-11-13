import fs from "node:fs/promises";
import path from "node:path";
import { extractText } from "unpdf";

export const INSUFFICIENT_CONTEXT_CHARS = 300;

export interface CourseMaterialContextResult {
  text: string;
  files: string[];
  matchedCount: number;
  totalChars: number;
  isInsufficient: boolean;
}

export interface WeekCoverageInfo {
  chars: number;
  items: number;
  isInsufficient: boolean;
}

/**
 * Extracts clean plain/LaTeX/PDF text from an uploaded course material buffer.
 */
export async function extractMaterialText(buffer: Buffer, ext: string): Promise<string> {
  const lowerExt = ext.toLowerCase();

  if ([".md", ".txt", ".tex", ".latex", ".vtt", ".srt", ".csv", ".json", ".py"].includes(lowerExt)) {
    return buffer.toString("utf-8").trim();
  }

  if (lowerExt === ".ipynb") {
    try {
      const nb = JSON.parse(buffer.toString("utf-8"));
      const cells = Array.isArray(nb?.cells) ? nb.cells : [];
      return cells
        .map((c: any) => (Array.isArray(c?.source) ? c.source.join("") : String(c?.source || "")))
        .filter((s: string) => s.trim().length > 0)
        .join("\n\n")
        .trim();
    } catch {
      return buffer.toString("utf-8").trim();
    }
  }

  if (lowerExt === ".html" || lowerExt === ".htm") {
    return buffer
      .toString("utf-8")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  if (lowerExt === ".pdf") {
    try {
      const result = await extractText(new Uint8Array(buffer), { mergePages: false });
      const pages = Array.isArray(result.text) ? result.text : [String(result.text || "")];
      const total = result.totalPages || pages.length;
      const formatted = pages
        .map((pageText, idx) => {
          const clean = String(pageText || "").replace(/\u0000/g, "").trim();
          return clean ? `--- Page ${idx + 1} / ${total} ---\n${clean}` : "";
        })
        .filter(Boolean)
        .join("\n\n");
      return formatted.trim();
    } catch (err) {
      console.warn("unpdf extraction failed:", err);
      return "";
    }
  }

  return "";
}

/**
 * Persists full extracted material text into `raw_files/_extracted/<itemId>.txt` so manifests stay lightweight.
 */
export async function saveExtractedSidecar(
  courseDir: string,
  itemId: string,
  extractedText: string
): Promise<{ extractedPath?: string; extractedChars: number }> {
  const clean = (extractedText || "").trim();
  if (!clean) {
    return { extractedChars: 0 };
  }

  const extractedDir = path.join(/*turbopackIgnore: true*/ courseDir, "raw_files", "_extracted");
  await fs.mkdir(extractedDir, { recursive: true });
  const safeId = itemId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const outPath = path.join(/*turbopackIgnore: true*/ extractedDir, `${safeId}.txt`);
  await fs.writeFile(/*turbopackIgnore: true*/ outPath, clean, "utf-8");

  return {
    extractedPath: `raw_files/_extracted/${safeId}.txt`,
    extractedChars: clean.length
  };
}

/**
 * Re-extracts existing items in `course_content.json` that lack `_extracted` sidecars (e.g., legacy PDF uploads).
 */
export async function reindexCourseMaterials(courseDir: string): Promise<{
  total: number;
  reextracted: number;
  failed: number;
}> {
  const manifestPath = path.join(/*turbopackIgnore: true*/ courseDir, "course_content.json");
  let manifest: { items: any[]; lastUpdated?: string };
  try {
    const raw = await fs.readFile(/*turbopackIgnore: true*/ manifestPath, "utf-8");
    manifest = JSON.parse(raw);
  } catch {
    return { total: 0, reextracted: 0, failed: 0 };
  }

  const items = Array.isArray(manifest.items) ? manifest.items : [];
  let reextracted = 0;
  let failed = 0;

  for (const item of items) {
    if (!item?.relativePath || !item?.id) continue;

    // Check if an extracted sidecar already exists on disk
    let hasValidSidecar = false;
    if (item.extractedPath) {
      try {
        const st = await fs.stat(path.join(/*turbopackIgnore: true*/ courseDir, item.extractedPath));
        if (st.size > 0) hasValidSidecar = true;
      } catch {}
    }
    if (hasValidSidecar && typeof item.extractedChars === "number" && item.extractedChars > 0) {
      continue;
    }

    const sourcePath = path.join(/*turbopackIgnore: true*/ courseDir, item.relativePath);
    const ext = path.extname(item.originalName || item.savedFileName || item.relativePath) || "";
    try {
      const buffer = await fs.readFile(/*turbopackIgnore: true*/ sourcePath);
      const extracted = await extractMaterialText(buffer, ext);
      if (extracted) {
        const sidecar = await saveExtractedSidecar(courseDir, item.id, extracted);
        item.extractedPath = sidecar.extractedPath;
        item.extractedChars = sidecar.extractedChars;
        item.textSnippet = extracted.slice(0, 2500);
        reextracted++;
      }
    } catch {
      failed++;
    }
  }

  if (reextracted > 0) {
    manifest.lastUpdated = new Date().toISOString();
    await fs.writeFile(/*turbopackIgnore: true*/ manifestPath, JSON.stringify(manifest, null, 2), "utf-8");
  }

  return { total: items.length, reextracted, failed };
}

async function readManifest(courseDir: string): Promise<any[]> {
  try {
    const raw = await fs.readFile(
      path.join(/*turbopackIgnore: true*/ courseDir, "course_content.json"),
      "utf-8"
    );
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.items) ? parsed.items : [];
  } catch {
    return [];
  }
}

async function readItemText(courseDir: string, item: any): Promise<string> {
  if (item?.extractedPath) {
    try {
      const full = await fs.readFile(
        path.join(/*turbopackIgnore: true*/ courseDir, item.extractedPath),
        "utf-8"
      );
      if (full.trim().length > 0) return full.trim();
    } catch {}
  }
  return String(item?.textSnippet || "").trim();
}

/**
 * Loads full matched course slides, notes, and problem sheets for a given week up to `maxChars`.
 */
export async function loadCourseMaterialContext(
  courseDir: string,
  week: number,
  maxChars: number = 45000
): Promise<CourseMaterialContextResult> {
  const items = await readManifest(courseDir);
  if (items.length === 0) {
    return {
      text: "",
      files: [],
      matchedCount: 0,
      totalChars: 0,
      isInsufficient: true
    };
  }

  const weekNum = Number(week);
  // Put week-exact materials before course-wide ("all" / unassigned) materials
  const weekSpecific = items.filter((item) => Number(item?.week) === weekNum);
  const globalItems = items.filter((item) => item?.week === "all" || !item?.week);
  const ordered = [...weekSpecific, ...globalItems];

  const blocks: string[] = [];
  const files: string[] = [];
  let usedChars = 0;

  for (const item of ordered) {
    const text = await readItemText(courseDir, item);
    if (!text) continue;

    if (item.extractedPath) files.push(item.extractedPath);
    else if (item.relativePath) files.push(item.relativePath);

    const header = `[${item.categoryName || item.category || "material"} - ${item.originalName || item.savedFileName} (${item.week && item.week !== "all" ? `Week ${item.week}` : "Course-wide"})]:\n`;
    const remaining = maxChars - usedChars;
    if (remaining <= header.length + 100) {
      // Still include filename index so workspace-aware agents can view_file the rest
      blocks.push(`${header}(Truncated in prompt; full text stored in ${item.extractedPath || item.relativePath})`);
      continue;
    }

    const sliceLen = remaining - header.length;
    const body = text.length > sliceLen ? `${text.slice(0, sliceLen)}\n...[continued in ${item.extractedPath || item.relativePath}]` : text;
    blocks.push(`${header}${body}`);
    usedChars += header.length + body.length + 2;
  }

  const combined = blocks.join("\n\n");
  return {
    text: combined,
    files,
    matchedCount: blocks.length,
    totalChars: combined.length,
    isInsufficient: combined.trim().length < INSUFFICIENT_CONTEXT_CHARS
  };
}

/**
 * Computes per-week material character counts so UI warns before batch distillation when slides/notes are missing.
 */
export async function checkCourseMaterialCoverage(
  courseDir: string,
  weeks: number[]
): Promise<{
  totalCourseItems: number;
  globalChars: number;
  byWeek: Record<number, WeekCoverageInfo>;
  insufficientWeeks: number[];
}> {
  const items = await readManifest(courseDir);
  let globalChars = 0;
  let globalCount = 0;
  const weekCharsMap = new Map<number, { chars: number; items: number }>();

  for (const item of items) {
    const len = typeof item?.extractedChars === "number" ? item.extractedChars : String(item?.textSnippet || "").length;
    if (item?.week === "all" || !item?.week) {
      globalChars += len;
      globalCount++;
    } else {
      const w = Number(item.week);
      if (!Number.isNaN(w)) {
        const cur = weekCharsMap.get(w) || { chars: 0, items: 0 };
        cur.chars += len;
        cur.items += 1;
        weekCharsMap.set(w, cur);
      }
    }
  }

  const byWeek: Record<number, WeekCoverageInfo> = {};
  const insufficientWeeks: number[] = [];

  for (const w of Array.from(new Set(weeks))) {
    const wk = weekCharsMap.get(w) || { chars: 0, items: 0 };
    const totalCharsForWeek = wk.chars + globalChars;
    const isInsufficient = totalCharsForWeek < INSUFFICIENT_CONTEXT_CHARS;
    byWeek[w] = {
      chars: totalCharsForWeek,
      items: wk.items + globalCount,
      isInsufficient
    };
    if (isInsufficient) insufficientWeeks.push(w);
  }

  return {
    totalCourseItems: items.length,
    globalChars,
    byWeek,
    insufficientWeeks
  };
}
