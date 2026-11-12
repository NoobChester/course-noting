import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";

export const DEFAULT_ANTIGRAVITY_MODEL = "gemini-4-hydrogen-medium";

export const FALLBACK_ANTIGRAVITY_MODELS: { id: string; label: string }[] = [
  { id: "gemini-4-hydrogen-medium", label: "Gemini 4 Hydrogen Medium" },
  { id: "gemini-4-hydrogen-high", label: "Gemini 4 Hydrogen High" },
  { id: "gemini-4-hydrogen-low", label: "Gemini 4 Hydrogen Low" },
  { id: "gemini-4-argon-medium", label: "Gemini 4 Argon Medium" },
  { id: "gemini-3.8-flash-medium", label: "Gemini 3.8 Flash Medium" },
  { id: "gemini-3.8-flash-low", label: "Gemini 3.8 Flash Low" },
  { id: "claude-sonnet-5-5-medium", label: "Claude Sonnet 5.5 Medium" },
  { id: "claude-opus-5-5-medium", label: "Claude Opus 5.5 Medium" }
];

export interface AntigravityModelOption {
  id: string;
  label: string;
}

export interface RunAntigravityOptions {
  prompt: string;
  systemInstruction?: string;
  model?: string;
  workspaceDir?: string;
  schema?: Record<string, unknown>;
  timeoutMs?: number;
}

export interface AntigravityRunResult<T = unknown> {
  model: string;
  conversationId?: string;
  rawResponse: string;
  parsed: T;
  durationSeconds?: number;
}

export const LECTURE_DISTILLATION_JSON_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: {
    title: { type: "string" },
    outline: {
      type: "array",
      items: { type: "string" }
    },
    distilledContent: { type: "string" },
    insights: {
      type: "array",
      items: {
        type: "object",
        properties: {
          conceptSlug: { type: "string" },
          type: { type: "string", enum: ["intuition", "exam_warning", "nuance", "heuristic"] },
          title: { type: "string" },
          timestamp: { type: "string" },
          content: { type: "string" }
        },
        required: ["type", "title", "content"]
      }
    },
    questionHints: {
      type: "array",
      items: {
        type: "object",
        properties: {
          questionId: { type: "string" },
          timestamp: { type: "string" },
          hint: { type: "string" }
        },
        required: ["questionId", "hint"]
      }
    }
  },
  required: ["title", "outline", "distilledContent", "insights", "questionHints"]
};

export const PROOF_REVIEW_JSON_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: {
    verdict: {
      type: "string",
      enum: ["Rigorous Proof", "Correct with Minor Gaps", "Missing Hypotheses", "Flawed Logic"]
    },
    score: { type: "number" },
    summary: { type: "string" },
    missingHypotheses: { type: "array", items: { type: "string" } },
    logicalGaps: { type: "array", items: { type: "string" } },
    strengths: { type: "array", items: { type: "string" } },
    suggestedPatch: { type: "string" },
    alternativeMethodNotes: { type: "string" }
  },
  required: [
    "verdict",
    "score",
    "summary",
    "missingHypotheses",
    "logicalGaps",
    "strengths",
    "suggestedPatch"
  ]
};

/**
 * Resolves the on-disk directory for a course under `courses/` (handling uppercase/lowercase folders).
 */
export async function resolveCourseWorkspaceDir(
  courseId: string,
  baseDir: string = process.cwd()
): Promise<string | undefined> {
  const coursesRoot = path.join(baseDir, "courses");
  const clean = courseId.trim();
  if (!clean) return undefined;

  const candidates = [clean.toUpperCase(), clean.toLowerCase(), clean];
  for (const name of candidates) {
    const dir = path.join(coursesRoot, name);
    try {
      const st = await fs.stat(dir);
      if (st.isDirectory()) return dir;
    } catch {
      // Try next casing variant
    }
  }
  return undefined;
}

/**
 * Executes the local `agy` binary with stdin explicitly ignored so headless runs never stall waiting on input.
 */
function execAgy(
  agyBin: string,
  args: string[],
  options: { cwd?: string; timeoutMs: number }
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(agyBin, args, {
      cwd: options.cwd,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true
    });

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill("SIGTERM");
      reject(new Error(`Antigravity CLI timed out after ${Math.round(options.timeoutMs / 1000)}s`));
    }, options.timeoutMs);

    child.stdout?.on("data", (chunk: Buffer) => stdoutChunks.push(chunk));
    child.stderr?.on("data", (chunk: Buffer) => stderrChunks.push(chunk));

    child.on("error", (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(err);
    });

    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      const stdout = Buffer.concat(stdoutChunks).toString("utf8");
      const stderr = Buffer.concat(stderrChunks).toString("utf8");
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        const detail = (stderr || stdout).trim().slice(0, 400);
        reject(new Error(`Antigravity CLI exited with code ${code}${detail ? `: ${detail}` : ""}`));
      }
    });
  });
}

/**
 * Resolves the local `agy` executable path, checking env overrides and standard Windows/Unix install locations.
 */
export async function resolveAgyPath(): Promise<string> {
  const envBin = process.env.ANTIGRAVITY_BIN?.trim();
  if (envBin) return envBin;

  if (process.platform === "win32") {
    const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local");
    const candidate = path.join(localAppData, "agy", "bin", "agy.exe");
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // Fall back to PATH lookup
    }
  }

  return "agy";
}

/**
 * Strips markdown code fences and extracts the outermost JSON object from text.
 */
export function extractJsonFromText<T = any>(raw: string): T {
  const cleaned = raw
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1)) as T;
    }
    throw new Error(`Antigravity returned non-JSON output: ${cleaned.slice(0, 220)}`);
  }
}

/**
 * Queries the local `agy models` CLI for available Antigravity models.
 */
export async function listAntigravityModels(): Promise<AntigravityModelOption[]> {
  const agyBin = await resolveAgyPath();
  const { stdout } = await execAgy(agyBin, ["models"], { timeoutMs: 15000 });

  const models: AntigravityModelOption[] = [];
  for (const rawLine of stdout.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const parts = line.split(/\t+/);
    const id = parts[0]?.trim();
    const label = (parts[1] || parts[0])?.trim();
    if (id && !id.includes(" ")) {
      models.push({ id, label });
    }
  }

  if (models.length === 0) {
    return FALLBACK_ANTIGRAVITY_MODELS;
  }

  // Put preferred default first if present while preserving CLI ordering otherwise
  const defaultIdx = models.findIndex((m) => m.id === DEFAULT_ANTIGRAVITY_MODEL);
  if (defaultIdx > 0) {
    const [preferred] = models.splice(defaultIdx, 1);
    models.unshift(preferred);
  }
  return models;
}

/**
 * Summarizes the existing course workspace folders so the read-only headless agent knows what it can cross-reference.
 */
export async function describeCourseWorkspace(courseDir: string): Promise<string> {
  try {
    const stat = await fs.stat(courseDir);
    if (!stat.isDirectory()) return "";
  } catch {
    return "";
  }

  const sections: string[] = [];
  const checkDirs = ["raw_files", "dossiers", "textbook/chapters", "lectures"];
  for (const rel of checkDirs) {
    const target = path.join(/*turbopackIgnore: true*/ courseDir, rel);
    try {
      const entries = await fs.readdir(/*turbopackIgnore: true*/ target);
      if (entries.length > 0) {
        const preview = entries.slice(0, 12).join(", ");
        const suffix = entries.length > 12 ? ` (+${entries.length - 12} more)` : "";
        sections.push(`- ${rel}/: ${preview}${suffix}`);
      }
    } catch {
      // Folder may not exist yet for new courses
    }
  }

  try {
    await fs.access(path.join(courseDir, "course_content.json"));
    sections.push("- course_content.json (compiled course questions, concepts, and syllabus metadata)");
  } catch {
    // Optional
  }

  if (sections.length === 0) return "";
  return `Available course workspace context in ${courseDir}:\n${sections.join("\n")}`;
}

/**
 * Runs a headless read-only (`--mode plan`) Antigravity agent turn with optional structured JSON schema output.
 */
export async function runAntigravityPrompt<T = any>(
  options: RunAntigravityOptions
): Promise<AntigravityRunResult<T>> {
  const {
    prompt,
    systemInstruction,
    model = DEFAULT_ANTIGRAVITY_MODEL,
    workspaceDir,
    schema,
    timeoutMs = 240000
  } = options;

  const agyBin = await resolveAgyPath();
  const targetModel = model?.trim() || DEFAULT_ANTIGRAVITY_MODEL;
  const runId = crypto.randomBytes(6).toString("hex");
  const tempRoot = path.join(os.tmpdir(), "course-noting-agy");
  await fs.mkdir(tempRoot, { recursive: true });

  let resolvedWorkspace: string | undefined;
  if (workspaceDir) {
    try {
      const st = await fs.stat(workspaceDir);
      if (st.isDirectory()) resolvedWorkspace = workspaceDir;
    } catch {
      resolvedWorkspace = undefined;
    }
  }

  const workspaceSummary = resolvedWorkspace
    ? await describeCourseWorkspace(resolvedWorkspace)
    : "";

  const fullPromptParts = [
    systemInstruction?.trim() ? `## System Role\n${systemInstruction.trim()}` : "",
    workspaceSummary ? `## Course Workspace Index (Read-Only)\n${workspaceSummary}\nYou may use read-only file tools (view_file, grep_search, list_dir, find_by_name) when helpful to verify terminology, theorem names, notation, or textbook sections. Do not run shell commands or modify files.` : "",
    prompt.trim()
  ].filter(Boolean);

  const combinedPrompt = fullPromptParts.join("\n\n");

  const tempFiles: string[] = [];
  let schemaPath: string | undefined;
  let promptArg: string;

  try {
    if (schema) {
      schemaPath = path.join(tempRoot, `schema-${runId}.json`);
      await fs.writeFile(schemaPath, JSON.stringify(schema, null, 2), "utf8");
      tempFiles.push(schemaPath);
    }

    // Windows CreateProcess enforces a ~32k command-line limit; stage large prompts in a file read via view_file.
    if (combinedPrompt.length >= 6000) {
      const promptFilePath = path.join(tempRoot, `prompt-${runId}.md`);
      await fs.writeFile(promptFilePath, combinedPrompt, "utf8");
      tempFiles.push(promptFilePath);
      promptArg =
        `Read ${promptFilePath} using view_file for your complete task instructions, transcript/input payload, and output format. ` +
        `Follow all instructions inside that file, use read-only workspace tools if helpful to cross-reference course files, ` +
        `do not run shell commands or write/edit files, and return strictly the requested JSON.`;
    } else {
      promptArg = combinedPrompt;
    }

    const printTimeoutSec = Math.max(30, Math.ceil((timeoutMs - 10000) / 1000));
    const args: string[] = [
      "--output-format",
      "json",
      "--disable-slash-commands",
      "--mode",
      "plan",
      "--model",
      targetModel,
      "--print-timeout",
      `${printTimeoutSec}s`
    ];

    if (schemaPath) {
      args.push("--json-schema", schemaPath);
    }

    if (tempFiles.some((f) => f.endsWith(".md"))) {
      args.push("--add-dir", tempRoot);
    }

    if (resolvedWorkspace) {
      args.push("--add-dir", resolvedWorkspace);
    }

    // `-p=` attaches the prompt directly so flag arguments are never misparsed as the prompt
    args.push(`-p=${promptArg}`);

    const { stdout, stderr } = await execAgy(agyBin, args, {
      cwd: resolvedWorkspace || process.cwd(),
      timeoutMs
    });

    let envelope: any;
    try {
      envelope = extractJsonFromText<any>(stdout);
    } catch (parseErr: any) {
      throw new Error(
        `Antigravity CLI returned unreadable output: ${parseErr?.message || parseErr}. ${stderr ? `Stderr: ${stderr.slice(0, 300)}` : ""}`
      );
    }

    if (envelope?.status && envelope.status !== "SUCCESS") {
      throw new Error(envelope.error || `Antigravity CLI status: ${envelope.status}`);
    }

    const responseText =
      typeof envelope?.response === "string"
        ? envelope.response
        : typeof envelope?.result === "string"
        ? envelope.result
        : stdout;

    const parsed =
      schema && envelope?.structured_output !== undefined
        ? (envelope.structured_output as T)
        : schema
        ? extractJsonFromText<T>(responseText)
        : (responseText as unknown as T);

    return {
      model: targetModel,
      conversationId: envelope?.conversation_id,
      rawResponse: responseText,
      parsed,
      durationSeconds: typeof envelope?.duration_seconds === "number" ? envelope.duration_seconds : undefined
    };
  } finally {
    await Promise.all(
      tempFiles.map((filePath) =>
        fs.unlink(filePath).catch(() => {
          // Ignore cleanup errors
        })
      )
    );
  }
}
