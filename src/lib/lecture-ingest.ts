import fs from "node:fs/promises";
import path from "node:path";
import {
  DEFAULT_ANTIGRAVITY_MODEL,
  LECTURE_DISTILLATION_JSON_SCHEMA,
  extractJsonFromText,
  runAntigravityPrompt
} from "./antigravity-client";
import {
  GeminiThinkingLevel,
  buildGeminiGenerationConfig,
  resolveGeminiModel
} from "./gemini-client";
import { loadCourseMaterialContext } from "./material-extractor";

export interface TranscriptSegment {
  index: number;
  total: number;
  text: string;
  startTime: string;
  endTime: string;
}

export interface DistillLongLectureParams {
  courseId: string;
  courseDir: string;
  mediaId?: string;
  week: number;
  lectureTitle: string;
  outlineTopic?: string;
  outlineDescription?: string;
  transcriptText: string;
  extraSlideText?: string;
  aiSettings: {
    provider: "antigravity" | "gemini" | "openai" | "anthropic" | "ollama";
    apiKey?: string;
    model?: string;
    thinkingLevel?: GeminiThinkingLevel;
    antigravityModel?: string;
    geminiModel?: string;
    openaiModel?: string;
    anthropicModel?: string;
    ollamaUrl?: string;
    ollamaModel?: string;
  };
}

export interface DistillLongLectureResult {
  title: string;
  outline: string[];
  distilledContent: string;
  insights: any[];
  questionHints: any[];
  aiModelUsed: string;
  partsProcessed: number;
  contextWarning?: string;
}

const PART_EXTRACTION_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: {
    sectionTitle: { type: "string" },
    outlineTopics: { type: "array", items: { type: "string" } },
    distilledMarkdown: { type: "string" },
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
  required: ["sectionTitle", "outlineTopics", "distilledMarkdown", "insights", "questionHints"]
};

/**
 * Normalizes VTT or `[hh:mm:ss]` transcripts, preserving time anchors while stripping stutter noise.
 */
export function preprocessTranscriptWithAnchors(rawText: string): string {
  const lines = (rawText || "").split(/\r?\n/);
  const cleaned: string[] = [];
  let prevCore = "";
  let pendingVttTs = "";

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    // Capture start timestamp from raw VTT cue arrows like "00:24:10.000 --> 00:24:15.000"
    const vttArrow = line.match(/^(\d{2}:\d{2}:\d{2})(?:\.\d+)?\s*-->/);
    if (vttArrow) {
      pendingVttTs = vttArrow[1];
      continue;
    }

    if (/^(WEBVTT|NOTE|STYLE|\d+)$/i.test(line)) continue;

    // Prefix orphaned VTT text lines with captured cue timestamp
    const existingTs = line.match(/^\[(\d{2}:\d{2}:\d{2})\]\s*(.*)$/);
    let normalized = line;
    let core = line;
    if (existingTs) {
      core = existingTs[2].trim();
    } else if (pendingVttTs) {
      normalized = `[${pendingVttTs}] ${line}`;
      pendingVttTs = "";
    }

    if (!core) continue;
    if (core.toLowerCase() === prevCore.toLowerCase()) continue;

    cleaned.push(normalized);
    prevCore = core;
  }

  return cleaned.join("\n");
}

function findFirstAndLastTimestamp(text: string): { startTime: string; endTime: string } {
  const matches = text.match(/\[(\d{2}:\d{2}:\d{2})\]/g) || [];
  const first = matches[0];
  const last = matches[matches.length - 1];
  if (!first || !last) return { startTime: "", endTime: "" };
  return {
    startTime: first.replace(/[\[\]]/g, ""),
    endTime: last.replace(/[\[\]]/g, "")
  };
}

/**
 * Splits long transcripts along newline boundaries with trailing overlap so concepts spanning hour boundaries aren't cut cleanly in half.
 */
export function segmentTranscript(
  cleanedText: string,
  targetChunkChars: number = 32000,
  overlapChars: number = 1500
): TranscriptSegment[] {
  const trimmed = (cleanedText || "").trim();
  if (!trimmed) {
    return [{ index: 1, total: 1, text: "", startTime: "", endTime: "" }];
  }

  if (trimmed.length <= targetChunkChars) {
    const ts = findFirstAndLastTimestamp(trimmed);
    return [{ index: 1, total: 1, text: trimmed, ...ts }];
  }

  const lines = trimmed.split("\n");
  const rawChunks: string[] = [];
  let buffer: string[] = [];
  let bufferLen = 0;

  for (const line of lines) {
    const nextLen = bufferLen + line.length + 1;
    if (nextLen > targetChunkChars && buffer.length > 0) {
      rawChunks.push(buffer.join("\n"));

      // Carry tail lines forward as overlap context
      const overlapLines: string[] = [];
      let overlapLen = 0;
      for (let i = buffer.length - 1; i >= 0; i--) {
        if (overlapLen + buffer[i].length + 1 > overlapChars) break;
        overlapLines.unshift(buffer[i]);
        overlapLen += buffer[i].length + 1;
      }
      buffer = overlapLines;
      bufferLen = overlapLen;
    }
    buffer.push(line);
    bufferLen += line.length + 1;
  }

  if (buffer.length > 0) {
    rawChunks.push(buffer.join("\n"));
  }

  const total = rawChunks.length;
  return rawChunks.map((chunkText, idx) => ({
    index: idx + 1,
    total,
    text: chunkText,
    ...findFirstAndLastTimestamp(chunkText)
  }));
}

async function loadExistingCourseTaxonomy(courseDir: string): Promise<string> {
  const parts: string[] = [];

  for (const folder of ["concepts", "questions"] as const) {
    const dir = path.join(/*turbopackIgnore: true*/ courseDir, folder);
    try {
      const entries = await fs.readdir(/*turbopackIgnore: true*/ dir);
      const ids = entries
        .filter((f) => f.endsWith(".md"))
        .map((f) => f.replace(/\.md$/, ""))
        .slice(0, 60);
      if (ids.length > 0) {
        parts.push(`Existing ${folder} IDs: ${ids.join(", ")}`);
      }
    } catch {
      // Optional folder
    }
  }

  return parts.join("\n");
}

function isRetryableError(err: any): boolean {
  const msg = String(err?.message || "").toLowerCase();
  return (
    msg.includes("429") ||
    msg.includes("rate limit") ||
    msg.includes("quota") ||
    msg.includes("resource exhausted") ||
    msg.includes("timed out") ||
    msg.includes("econnreset") ||
    msg.includes("503")
  );
}

async function withRetry<T>(fn: () => Promise<T>, maxAttempts: number = 3): Promise<T> {
  const delaysMs = [8000, 20000, 35000];
  let lastErr: any;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      if (attempt === maxAttempts || !isRetryableError(err)) {
        throw err;
      }
      await new Promise((r) => setTimeout(r, delaysMs[attempt - 1] || 20000));
    }
  }
  throw lastErr;
}

async function invokeStructuredModel<T = any>(params: {
  courseId: string;
  courseDir: string;
  systemPrompt: string;
  userPrompt: string;
  schema: Record<string, unknown>;
  aiSettings: DistillLongLectureParams["aiSettings"];
}): Promise<{ parsed: T; modelUsed: string }> {
  const { courseDir, systemPrompt, userPrompt, schema, aiSettings } = params;
  const provider = aiSettings.provider || "gemini";

  if (provider === "antigravity") {
    const targetModel = aiSettings.antigravityModel || aiSettings.model || DEFAULT_ANTIGRAVITY_MODEL;
    const agyRes = await runAntigravityPrompt<T>({
      prompt: userPrompt,
      systemInstruction: systemPrompt,
      model: targetModel,
      workspaceDir: courseDir,
      schema,
      timeoutMs: 240000
    });
    return {
      parsed: agyRes.parsed,
      modelUsed: `Antigravity (${agyRes.model})`
    };
  }

  if (provider === "gemini") {
    const key = aiSettings.apiKey || process.env.GEMINI_API_KEY;
    if (!key) throw new Error("Missing Google Gemini API key. Configure your key in AI Settings.");

    const targetModel = await resolveGeminiModel(key, aiSettings.geminiModel || aiSettings.model);
    const generationConfig = buildGeminiGenerationConfig({
      model: targetModel,
      temperature: 0.2,
      responseMimeType: "application/json",
      thinkingLevel: aiSettings.thinkingLevel
    });

    const parsed = await withRetry(async () => {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
            generationConfig
          })
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || `Gemini API returned status ${res.status}`);
      }
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      return extractJsonFromText<T>(rawText);
    });

    return {
      parsed,
      modelUsed: `Google Gemini (${targetModel}${aiSettings.thinkingLevel ? `:${aiSettings.thinkingLevel}` : ""})`
    };
  }

  if (provider === "openai") {
    const key = aiSettings.apiKey || process.env.OPENAI_API_KEY;
    if (!key) throw new Error("Missing OpenAI API key.");
    const targetModel = aiSettings.openaiModel || aiSettings.model || "gpt-4o-mini";

    const parsed = await withRetry(async () => {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`
        },
        body: JSON.stringify({
          model: targetModel,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.2
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || `OpenAI API failed for model ${targetModel}`);
      return extractJsonFromText<T>(data.choices?.[0]?.message?.content || "{}");
    });

    return { parsed, modelUsed: `OpenAI (${targetModel})` };
  }

  if (provider === "anthropic") {
    const key = aiSettings.apiKey || process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error("Missing Anthropic API key.");
    const targetModel = aiSettings.anthropicModel || aiSettings.model || "claude-3-5-sonnet-20241022";

    const parsed = await withRetry(async () => {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: targetModel,
          max_tokens: 4096,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
          temperature: 0.2
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || `Anthropic API failed for model ${targetModel}`);
      return extractJsonFromText<T>(data.content?.[0]?.text || "{}");
    });

    return { parsed, modelUsed: `Anthropic (${targetModel})` };
  }

  if (provider === "ollama") {
    const ollamaUrl = aiSettings.ollamaUrl || "http://localhost:11434";
    const targetModel = aiSettings.ollamaModel || aiSettings.model || "qwen2.5:7b-instruct";
    const res = await fetch(`${ollamaUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: targetModel,
        format: "json",
        stream: false,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Ollama API failed for model ${targetModel}`);
    return {
      parsed: extractJsonFromText<T>(data.message?.content || "{}"),
      modelUsed: `Ollama (${targetModel})`
    };
  }

  throw new Error(`Unsupported AI provider: ${provider}`);
}

/**
 * Distills a complete (1–2+ hour) lecture transcript + course slides without silent truncation,
 * using checkpointed Map-Reduce for long seminars and warning on sparse materials.
 */
export async function distillLongLecture(
  params: DistillLongLectureParams
): Promise<DistillLongLectureResult> {
  const {
    courseId,
    courseDir,
    mediaId,
    week,
    lectureTitle,
    outlineTopic,
    outlineDescription,
    transcriptText,
    extraSlideText = "",
    aiSettings
  } = params;

  const provider = aiSettings.provider || "gemini";
  const materialBudget = provider === "ollama" ? 12000 : 45000;
  const chunkTargetChars = provider === "ollama" ? 18000 : provider === "gemini" ? 42000 : 30000;

  const [materialCtx, taxonomy] = await Promise.all([
    loadCourseMaterialContext(courseDir, week, materialBudget),
    loadExistingCourseTaxonomy(courseDir)
  ]);

  const combinedMaterialText = [extraSlideText.trim(), materialCtx.text]
    .filter(Boolean)
    .join("\n\n");

  const isInsufficient = materialCtx.isInsufficient && extraSlideText.trim().length < 300;
  const contextWarning = isInsufficient
    ? `Course materials for Week ${week} are missing or sparse (${materialCtx.totalChars} extracted chars). Notation in spoken VTT speech could not be verified against uploaded slides/notes.`
    : undefined;

  const cleanedTranscript = preprocessTranscriptWithAnchors(transcriptText);
  const segments = segmentTranscript(cleanedTranscript, chunkTargetChars, 1500);

  let parsedResult: any;
  let aiModelUsed = "";

  if (segments.length === 1) {
    const systemPrompt = `You are an expert university mathematics teaching assistant and mathematical note extractor.
Your job is to read raw lecture materials (spoken speech-to-text transcript + uploaded course materials like problem sheets, slides, and syllabus outline) and distill high-yield study notes formatted with LaTeX ($...$ inline, $$...$$ display).
${taxonomy ? `\nWhen populating conceptSlug or questionId, prefer matching an exact existing ID when applicable:\n${taxonomy}\n` : ""}
DO NOT output conversational commentary. Output strictly valid JSON matching the schema.`;

    const userPrompt = `Course: ${courseId.toUpperCase()} (Week ${week})
Lecture Candidate: ${lectureTitle}${outlineTopic ? ` — Outline Topic: ${outlineTopic}` : ""}
${outlineDescription ? `Syllabus Schedule Note: ${outlineDescription}` : ""}

--- UPLOADED COURSE MATERIALS CONTEXT (Slides, Problem Sheets, Notes) ---
${combinedMaterialText || "(No uploaded course materials found for this week; rely carefully on the spoken transcript and flag ambiguous verbal symbols.)"}

--- SPOKEN TRANSCRIPT (FULL, TIME-ANCHORED) ---
${segments[0].text || "(No spoken transcript recorded)"}

Distill the complete high-yield study note JSON now:`;

    const res = await invokeStructuredModel({
      courseId,
      courseDir,
      systemPrompt,
      userPrompt,
      schema: LECTURE_DISTILLATION_JSON_SCHEMA,
      aiSettings
    });
    parsedResult = res.parsed;
    aiModelUsed = res.modelUsed;
  } else {
    // Checkpointed multi-part Map -> Reduce for long 2-hour recordings
    const checkpointsDir = path.join(/*turbopackIgnore: true*/ courseDir, "raw_files", "_checkpoints");
    await fs.mkdir(checkpointsDir, { recursive: true });
    const safeCheckpointKey = (mediaId || `w${week}-${lectureTitle}`).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 48);

    const partResults: any[] = [];
    const partFilesCreated: string[] = [];

    for (const seg of segments) {
      const partPath = path.join(/*turbopackIgnore: true*/ checkpointsDir, `${safeCheckpointKey}.part${seg.index}.json`);
      partFilesCreated.push(partPath);

      let partJson: any = null;
      try {
        const cached = await fs.readFile(/*turbopackIgnore: true*/ partPath, "utf-8");
        partJson = JSON.parse(cached);
      } catch {}

      if (!partJson) {
        const rangeLabel =
          seg.startTime && seg.endTime ? `[${seg.startTime} -> ${seg.endTime}]` : `Part ${seg.index}/${seg.total}`;
        const partSystemPrompt = `You are distilling Part ${seg.index} of ${seg.total} (${rangeLabel}) of a long university mathematics lecture into structured Markdown + KaTeX ($...$ inline, $$...$$ display).
Preserve exact mathematical definitions, proof sketches, worked examples, and spoken [hh:mm:ss] timestamps! Do not summarize away rigor.
${taxonomy ? `\nPrefer existing IDs when matching insights/hints:\n${taxonomy}\n` : ""}
Output strictly valid JSON matching the schema.`;

        const partUserPrompt = `Course: ${courseId.toUpperCase()} (Week ${week}) — ${lectureTitle}
Segment: Part ${seg.index}/${seg.total} ${rangeLabel}

--- COURSE MATERIALS REFERENCE ---
${combinedMaterialText.slice(0, Math.min(25000, materialBudget)) || "(None uploaded)"}

--- TRANSCRIPT SEGMENT ${seg.index}/${seg.total} ---
${seg.text}

Extract structured JSON for this segment now:`;

        const res = await invokeStructuredModel({
          courseId,
          courseDir,
          systemPrompt: partSystemPrompt,
          userPrompt: partUserPrompt,
          schema: PART_EXTRACTION_SCHEMA,
          aiSettings
        });
        partJson = res.parsed;
        aiModelUsed = res.modelUsed;
        await fs.writeFile(/*turbopackIgnore: true*/ partPath, JSON.stringify(partJson, null, 2), "utf-8");
      }

      partResults.push({
        part: seg.index,
        range: seg.startTime && seg.endTime ? `${seg.startTime}–${seg.endTime}` : `Part ${seg.index}`,
        ...partJson
      });
    }

    // Reduce/Merge pass combining chronological parts into one cohesive lecture note
    const mergeSystemPrompt = `You are merging ${segments.length} chronological distilled parts of a single lecture into ONE cohesive, cleanly structured Markdown study note with KaTeX ($...$, $$...$$).
Preserve ALL distinct definitions, formulas, proofs, intuitions, exam warnings, and [hh:mm:ss] timestamps across Parts 1..${segments.length}; remove only duplicate overlap text.
Output strictly valid JSON matching the schema.`;

    const mergeUserPrompt = `Course: ${courseId.toUpperCase()} (Week ${week})
Lecture Candidate: ${lectureTitle}${outlineTopic ? ` — Outline Topic: ${outlineTopic}` : ""}
${outlineDescription ? `Syllabus Schedule Note: ${outlineDescription}` : ""}

--- DISTILLED CHRONOLOGICAL PARTS ---
${JSON.stringify(partResults, null, 2)}

Produce the single unified lecture JSON now:`;

    const merged = await invokeStructuredModel({
      courseId,
      courseDir,
      systemPrompt: mergeSystemPrompt,
      userPrompt: mergeUserPrompt,
      schema: LECTURE_DISTILLATION_JSON_SCHEMA,
      aiSettings
    });

    parsedResult = merged.parsed;
    aiModelUsed = merged.modelUsed;

    // Clean up segment checkpoints after successful merge
    await Promise.all(partFilesCreated.map((p) => fs.unlink(/*turbopackIgnore: true*/ p).catch(() => {})));
  }

  const topicHeading = outlineTopic ? `${lectureTitle} — ${outlineTopic}` : parsedResult?.title || lectureTitle;
  const outlineCallout = outlineDescription
    ? `> [!NOTE] 🎯 Official UNSW Course Outline — Week ${week}: ${outlineTopic || lectureTitle}\n> ${outlineDescription}\n\n`
    : "";

  const contextCallout = contextWarning
    ? `> [!WARNING] ⚠️ Sparse Course Materials for Week ${week}\n> ${contextWarning}\n\n`
    : combinedMaterialText.length > 0
    ? `> [!TIP] 📚 Uploaded Course Context Integrated\n> Distilled across ${segments.length > 1 ? `${segments.length} full-length segments` : "full transcript"} with uploaded slides, problem sheets, and course notes.\n\n`
    : "";

  return {
    title: topicHeading,
    outline: Array.isArray(parsedResult?.outline) && parsedResult.outline.length > 0 ? parsedResult.outline : [topicHeading],
    distilledContent: `${outlineCallout}${contextCallout}${parsedResult?.distilledContent || ""}`,
    insights: Array.isArray(parsedResult?.insights) ? parsedResult.insights : [],
    questionHints: Array.isArray(parsedResult?.questionHints) ? parsedResult.questionHints : [],
    aiModelUsed: aiModelUsed || `${provider}`,
    partsProcessed: segments.length,
    contextWarning
  };
}
