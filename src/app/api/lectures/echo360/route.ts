import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import matter from "gray-matter";
import { fetchUNSWCourseOutline } from "../../courses/outline/route";
import { resolveGeminiModel } from "@/lib/gemini-client";

const execAsync = promisify(exec);

const BASE_DIR = process.cwd();
const SESSION_DIR = path.join(BASE_DIR, ".echo360_session");
const COOKIES_FILE = path.join(SESSION_DIR, "cookies.json");
const VAULT_FILE = path.join(SESSION_DIR, "vault.json");
const COURSES_DIR = path.join(BASE_DIR, "courses");

export function safeMatterStringify(content: string = "", frontmatter: Record<string, any> = {}): string {
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

export function parseCookiesFromAnyInput(raw: string): string {
  if (!raw || !raw.trim()) return "";
  let text = raw.trim();

  // 1. JSON array of cookie objects: [{"name": "...", "value": "..."}]
  if (text.startsWith("[") && text.endsWith("]")) {
    try {
      const arr = JSON.parse(text);
      if (Array.isArray(arr)) {
        return arr.map((c: any) => `${c.name}=${c.value}`).join("; ");
      }
    } catch {}
  }

  // 2. cURL command (Chrome/Edge/Firefox: Copy as cURL, including Windows ^" and \")
  const curlCookieMatch = text.match(/(?:-H|--header)\s+[\^"']*(?:cookie|Cookie):\s*([\s\S]*?)(?:[\^"']\s*(?:-H|--header|\^|$))/i);
  if (curlCookieMatch) {
    let extracted = curlCookieMatch[1].trim();
    // Clean Windows cmd caret escaping (e.g. ^& -> &, ^% -> %)
    extracted = extracted.replace(/\^([&%<>\^|])/g, "$1");
    // Strip trailing quotes or carets
    extracted = extracted.replace(/[\^"']+$/, "").trim();
    return extracted;
  }

  // 3. Fallback: match Cookie: line
  const lineCookieMatch = text.match(/^cookie:\s*(.+)$/im);
  if (lineCookieMatch) {
    return lineCookieMatch[1].trim();
  }

  // 4. Prefix with "Cookie: "
  if (/^cookie:\s*/i.test(text)) {
    return text.replace(/^cookie:\s*/i, "").trim();
  }

  return text.trim();
}

export function extractUrlFromInput(raw: string): string {
  if (!raw || !raw.trim()) return "";
  const text = raw.trim();
  const curlUrlMatch = text.match(/curl(?:\.exe)?\s+["']?(https?:\/\/[^\s"']+)/i);
  if (curlUrlMatch) return curlUrlMatch[1];
  const urlMatch = text.match(/(https?:\/\/[^\s"'>]+)/);
  if (urlMatch && (urlMatch[1].includes("echo360") || urlMatch[1].includes("lesson") || urlMatch[1].includes("section"))) {
    return urlMatch[1];
  }
  return text;
}

function extractMediaId(htmlOrUrl: string): string | null {
  // Check regex for mediaId inside HTML: "mediaId":"c979bf63-..." or mediaId: "..."
  const mediaIdMatch = htmlOrUrl.match(/mediaId["']?\s*:\s*["']([0-9a-fA-F-]{36})["']/i);
  if (mediaIdMatch) return mediaIdMatch[1];

  // Check URL uuid pattern: .../media/c979bf63-... or .../lesson/c979bf63-...
  const urlUuidMatch = htmlOrUrl.match(/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/i);
  if (urlUuidMatch) return urlUuidMatch[1];

  return null;
}

function parseEcho360Transcript(json: any): { lines: string[]; fullText: string; cueCount: number } {
  let cues: any[] = [];
  function findCues(obj: any) {
    if (!obj) return;
    if (Array.isArray(obj)) {
      for (const item of obj) findCues(item);
    } else if (typeof obj === "object") {
      if (Array.isArray(obj.cues)) {
        cues = obj.cues;
        return;
      }
      for (const val of Object.values(obj)) {
        findCues(val);
        if (cues.length > 0) return;
      }
    }
  }
  findCues(json);

  const formattedLines: string[] = [];
  let prevText = "";

  for (const cue of cues) {
    const rawContent = (cue.content || cue.text || "").trim();
    if (!rawContent || rawContent.toLowerCase() === prevText.toLowerCase()) continue;

    let timestampPrefix = "";
    if (typeof cue.start === "number") {
      const totalSec = Math.floor(cue.start > 10000 ? cue.start / 1000 : cue.start);
      const hrs = String(Math.floor(totalSec / 3600)).padStart(2, "0");
      const mins = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
      const secs = String(totalSec % 60).padStart(2, "0");
      timestampPrefix = `[${hrs}:${mins}:${secs}] `;
    }

    formattedLines.push(`${timestampPrefix}${rawContent}`);
    prevText = rawContent;
  }

  return {
    lines: formattedLines,
    fullText: formattedLines.join("\n"),
    cueCount: formattedLines.length
  };
}



function detectYearsAndTerms(dates: string[], sectionName: string = ""): {
  year: string;
  term: string;
  availableYears: string[];
  availableTerms: string[];
} {
  const yearsSet = new Set<string>();
  const termsSet = new Set<string>();

  // Check section name for 4-digit year (e.g. 2024, 2025, 2026, 2027)
  const yearInName = sectionName.match(/\b(202\d)\b/);
  if (yearInName) {
    yearsSet.add(yearInName[1]);
  }

  // Check section name for T1, T2, T3 or Term 1, Term 2, Term 3
  const termMatches = sectionName.match(/\b(T[123]|Term\s*[123])\b/gi) || [];
  for (const t of termMatches) {
    const raw = t.toUpperCase();
    if (raw.includes("1")) termsSet.add("Term 1");
    else if (raw.includes("2")) termsSet.add("Term 2");
    else if (raw.includes("3")) termsSet.add("Term 3");
  }

  // Inspect dates from lessons
  for (const d of dates) {
    if (!d) continue;
    const parsed = new Date(d);
    if (!isNaN(parsed.getTime())) {
      yearsSet.add(parsed.getFullYear().toString());
      const month = parsed.getMonth(); // 0 = Jan, 11 = Dec
      if (month >= 0 && month <= 4) termsSet.add("Term 1");
      else if (month >= 5 && month <= 7) termsSet.add("Term 2");
      else if (month >= 8 && month <= 11) termsSet.add("Term 3");
    }
  }

  const availableYears = Array.from(yearsSet).sort().reverse();
  const availableTerms = Array.from(termsSet).sort();

  const currentYear = new Date().getFullYear().toString();
  const year = availableYears[0] || (yearInName ? yearInName[1] : currentYear);
  const term = availableTerms[0] || "Term 1";

  return {
    year,
    term,
    availableYears: availableYears.length > 0 ? availableYears : [year],
    availableTerms: availableTerms.length > 0 ? availableTerms : [term]
  };
}

function parseSyllabusLessons(json: any, echoHost: string) {
  const items: any[] = [];
  const rawList = Array.isArray(json) ? json : (json?.data || json?.lessons || json?.classes || []);

  rawList.forEach((entry: any, index: number) => {
    const l = entry.lesson?.lesson || entry.lesson || entry;
    const lessonId = l.id || entry.id || `lesson-${index + 1}`;
    const name = l.name || l.title || entry.name || `Lecture ${index + 1}`;

    let mediaId: string | null = null;
    if (Array.isArray(l.medias) && l.medias.length > 0) {
      const vid = l.medias.find((m: any) => m.mediaType === "Video" || m.type === "Video") || l.medias[0];
      mediaId = vid.id || vid.mediaId;
    } else if (l.mediaId) {
      mediaId = l.mediaId;
    } else if (l.id) {
      mediaId = l.id;
    }

    const startTime = l.startTimeUtc || l.timing?.start || l.createdAt || "";
    let week = 1;
    const weekMatch = name.match(/week\s*(\d+)/i) || name.match(/w(\d+)/i);
    if (weekMatch) {
      week = parseInt(weekMatch[1], 10);
    } else {
      week = Math.floor(index / 2) + 1;
    }

    const dateStr = startTime
      ? new Date(startTime).toLocaleDateString("en-AU", { month: "short", day: "numeric" })
      : `Lecture ${index + 1}`;

    items.push({
      lessonId,
      mediaId: mediaId || lessonId,
      title: name,
      week,
      date: dateStr,
      rawStartTime: startTime,
      lessonUrl: `${echoHost}/lesson/${lessonId}/classroom`,
      hasVideo: Boolean(l.hasVideo || mediaId || (l.medias && l.medias.length > 0)),
      status: "queued"
    });
  });

  return items;
}

function extractLessonsFromHtml(html: string, echoHost: string) {
  const items: any[] = [];
  const lessonMatches = [...html.matchAll(/(?:lesson|media)\/([0-9a-fA-F-]{36})/g)];
  const seen = new Set<string>();

  lessonMatches.forEach((m) => {
    const id = m[1];
    if (seen.has(id)) return;
    seen.add(id);

    items.push({
      lessonId: id,
      mediaId: id,
      title: `Echo360 Lesson ${items.length + 1}`,
      week: Math.floor(items.length / 2) + 1,
      date: `Lecture ${items.length + 1}`,
      rawStartTime: "",
      lessonUrl: `${echoHost}/lesson/${id}/classroom`,
      hasVideo: true,
      status: "queued"
    });
  });

  return items;
}

function synthesizeNotesFromTranscript(
  rawTranscript: string,
  title: string,
  week: number,
  outlineTopic?: string,
  outlineDescription?: string,
  courseContext?: string
) {
  const lines = (rawTranscript || "").split("\n").filter((l) => l.trim().length > 0);
  const insights: any[] = [];
  const questionHints: any[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const timeMatch = line.match(/\[(\d{2}:\d{2}:\d{2})\]/);
    const ts = timeMatch ? timeMatch[1] : "";
    const cleanText = line.replace(/\[\d{2}:\d{2}:\d{2}\]/, "").trim();

    if (/exam|warning|mistake|trap|careful|penalty|don't forget|beware/i.test(cleanText)) {
      if (insights.filter((x) => x.type === "exam_warning").length < 3) {
        insights.push({
          type: "exam_warning",
          title: `Exam Warning (Week ${week})`,
          timestamp: ts,
          content: cleanText
        });
      }
    } else if (/think of|intuition|analogy|picture|geometrically|meaning|reason/i.test(cleanText)) {
      if (insights.filter((x) => x.type === "intuition").length < 3) {
        insights.push({
          type: "intuition",
          title: `Spoken Intuition (${title.slice(0, 30)})`,
          timestamp: ts,
          content: cleanText
        });
      }
    } else if (/problem|sheet|question|tutorial|homework|exercise/i.test(cleanText)) {
      if (questionHints.length < 3) {
        questionHints.push({
          questionId: `week-${week}`,
          timestamp: ts,
          hint: cleanText
        });
      }
    }
  }

  const topicHeading = outlineTopic ? `${title} — ${outlineTopic}` : title;
  const outlineCallout = outlineDescription
    ? `> [!NOTE] 🎯 Official UNSW Course Outline — Week ${week}: ${outlineTopic || title}\n> ${outlineDescription}\n\n`
    : "";

  const courseContextCallout = courseContext && courseContext.trim().length > 0
    ? `> [!TIP] 📚 Uploaded Course Materials Context (Problem Sheets & Slides)\n> ${courseContext.slice(0, 400).replace(/\n/g, " ")}...\n\n`
    : "";

  const outline = outlineTopic ? [outlineTopic, `Lecture: ${title}`] : (lines.length > 0 ? [`Topic: ${title}`] : []);

  const distilledContent = lines.length > 0
    ? `${outlineCallout}${courseContextCallout}### Spoken Transcript Highlights: ${topicHeading}

**Week ${week}**

${lines.slice(0, 30).join("\n")}
`
    : `${outlineCallout}${courseContextCallout}### Lecture Notes: ${topicHeading}

**Week ${week}**

*No spoken transcript was available on Echo360 for this recording.*
`;

  return {
    title: topicHeading,
    outline,
    distilledContent,
    insights,
    questionHints
  };
}

function extractJson(text: string): any {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  return JSON.parse(cleaned);
}

function pruneTranscriptNoise(rawText: string): string {
  const lines = (rawText || "").split("\n");
  const cleaned: string[] = [];
  let prevLine = "";

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    if (line.includes("-->")) continue;
    if (/^(WEBVTT|NOTE|STYLE|\d+)$/i.test(line)) continue;
    if (line.toLowerCase() === prevLine.toLowerCase()) continue;
    cleaned.push(line);
    prevLine = line;
  }
  return cleaned.join("\n");
}

async function enrichLessonsWithDiskState(lessons: any[], cleanCourse: string): Promise<void> {
  const courseDir = path.join(COURSES_DIR, cleanCourse);
  const rawAudioDir = path.join(courseDir, "raw_files", "audio");
  const rawTranscriptsDir = path.join(courseDir, "raw_files", "transcripts");
  const lecturesDir = path.join(courseDir, "lectures");

  // Clean up any stale .tmp files from previous interrupted downloads
  try {
    const audioFiles = await fs.readdir(rawAudioDir);
    for (const f of audioFiles) {
      if (f.endsWith(".tmp")) {
        try { await fs.unlink(path.join(rawAudioDir, f)); } catch {}
      }
    }
  } catch {}

  let lectureFiles: string[] = [];
  try {
    lectureFiles = await fs.readdir(lecturesDir);
  } catch {}

  for (const l of lessons) {
    const safeId = (l.mediaId || l.lessonId || "").replace(/[^a-zA-Z0-9-_]/g, "");
    if (!safeId) continue;

    const audioFile = path.join(rawAudioDir, `lecture_${safeId}.m4a`);
    const transcriptFile = path.join(rawTranscriptsDir, `lecture_${safeId}.txt`);

    let noteExists = false;
    let existingNoteId = "";
    const shortId = safeId.slice(0, 8);
    const matchNote = lectureFiles.find((f) => f.includes(shortId) && f.endsWith(".md"));
    if (matchNote) {
      noteExists = true;
      existingNoteId = matchNote.replace(/\.md$/, "");
    }

    let hasAudio = false;
    try {
      const stat = await fs.stat(audioFile);
      if (stat.size > 20000) hasAudio = true;
    } catch {}

    let hasTranscript = false;
    try {
      const stat = await fs.stat(transcriptFile);
      if (stat.size > 0) hasTranscript = true;
    } catch {}

    if (noteExists) {
      l.status = "done";
      l.progressPercent = 100;
      l.progressStage = "Ingested";
      l.hasTranscript = true;
      l.audioDownloaded = hasAudio;
      l.noteId = existingNoteId;
    } else if (hasAudio && hasTranscript) {
      l.status = "media_ready";
      l.progressPercent = 100;
      l.progressStage = "✓ Audio & transcript ready";
      l.hasTranscript = true;
      l.audioDownloaded = true;
    } else if (hasTranscript) {
      l.status = "queued";
      l.progressPercent = 25;
      l.progressStage = "Transcript ready (audio pending)";
      l.hasTranscript = true;
      l.audioDownloaded = false;
    }
  }
}

async function distillLectureWithAI(params: {
  courseId: string;
  week: number;
  lectureTitle: string;
  outlineTopic?: string;
  outlineDescription?: string;
  courseContext: string;
  transcriptText: string;
  aiSettings: {
    provider: "gemini" | "openai" | "anthropic" | "ollama";
    apiKey?: string;
    model?: string;
    geminiModel?: string;
    openaiModel?: string;
    anthropicModel?: string;
    ollamaUrl?: string;
    ollamaModel?: string;
  };
}): Promise<{
  title: string;
  outline: string[];
  distilledContent: string;
  insights: any[];
  questionHints: any[];
  aiModelUsed: string;
}> {
  const {
    courseId,
    week,
    lectureTitle,
    outlineTopic,
    outlineDescription,
    courseContext,
    transcriptText,
    aiSettings
  } = params;

  const prunedTranscript = pruneTranscriptNoise(transcriptText);

  const systemPrompt = `You are an expert university mathematics teaching assistant and mathematical note extractor.
Your job is to read raw lecture materials (spoken speech-to-text transcript + uploaded course materials like problem sheets, slides, and syllabus outline) and distill high-yield study notes formatted with LaTeX ($...$ inline, $$...$$ display).

DO NOT output conversational commentary. Output strictly valid JSON matching this schema:
{
  "title": "Concise descriptive lecture title",
  "outline": ["Topic 1", "Topic 2", "Topic 3"],
  "distilledContent": "Comprehensive Markdown study note formatted with KaTeX ($...$). Include definitions, formulas, and proof sketches. Integrate concepts from both the lecture transcript and uploaded course materials.",
  "insights": [
    {
      "type": "intuition",
      "title": "Title of intuition or analogy",
      "timestamp": "hh:mm:ss if mentioned or empty",
      "content": "KaTeX explanation of the spoken mental model or visual picture"
    },
    {
      "type": "exam_warning",
      "title": "Title of warning",
      "timestamp": "hh:mm:ss if mentioned or empty",
      "content": "What mistake or trap the lecturer warned students about on exams"
    }
  ],
  "questionHints": [
    {
      "questionId": "week-${week}",
      "timestamp": "hh:mm:ss",
      "hint": "Spoken heuristic or problem-solving hint mentioned during the lecture"
    }
  ]
}`;

  const userPrompt = `Course: ${courseId.toUpperCase()} (Week ${week})
Lecture Candidate: ${lectureTitle}${outlineTopic ? ` — Outline Topic: ${outlineTopic}` : ""}
${outlineDescription ? `Syllabus Schedule Note: ${outlineDescription}` : ""}

--- UPLOADED COURSE MATERIALS CONTEXT (Slides, Problem Sheets, Notes) ---
${courseContext ? courseContext.slice(0, 15000) : "(No extra uploaded materials for this week)"}

--- SPOKEN TRANSCRIPT (PRUNED) ---
${prunedTranscript ? prunedTranscript.slice(0, 25000) : "(No spoken transcript recorded)"}

Distill the high-yield study note JSON now:`;

  const provider = aiSettings.provider || "gemini";
  let parsedResult: any = null;
  let modelName = "";

  if (provider === "gemini") {
    const key = aiSettings.apiKey || process.env.GEMINI_API_KEY;
    if (!key) throw new Error("Missing Google Gemini API key. Please configure your key in AI Settings.");

    const targetModel = await resolveGeminiModel(key, aiSettings.geminiModel || aiSettings.model);
    modelName = `Google Gemini (${targetModel})`;
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json"
          }
        })
      }
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || `Gemini API returned status ${res.status}`);
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    parsedResult = extractJson(rawText);
  } else if (provider === "openai") {
    const key = aiSettings.apiKey || process.env.OPENAI_API_KEY;
    if (!key) throw new Error("Missing OpenAI API key.");
    const targetModel = aiSettings.openaiModel || aiSettings.model || "gpt-4o-mini";
    modelName = `OpenAI (${targetModel})`;
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
    const rawText = data.choices?.[0]?.message?.content || "{}";
    parsedResult = extractJson(rawText);
  } else if (provider === "anthropic") {
    const key = aiSettings.apiKey || process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error("Missing Anthropic API key.");
    const targetModel = aiSettings.anthropicModel || aiSettings.model || "claude-3-5-sonnet-20241022";
    modelName = `Claude (${targetModel})`;
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: targetModel,
        max_tokens: 3000,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }]
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || `Anthropic API failed for model ${targetModel}`);
    const rawText = data.content?.[0]?.text || "{}";
    parsedResult = extractJson(rawText);
  } else if (provider === "ollama") {
    const ollamaUrl = aiSettings.ollamaUrl || "http://localhost:11434";
    const targetModel = aiSettings.ollamaModel || aiSettings.model || "qwen2.5:7b-instruct";
    modelName = `Ollama (${targetModel})`;
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
    const rawText = data.message?.content || "{}";
    parsedResult = extractJson(rawText);
  } else {
    throw new Error(`Unsupported AI provider: ${provider}`);
  }

  const topicHeading = outlineTopic ? `${lectureTitle} — ${outlineTopic}` : (parsedResult.title || lectureTitle);
  const outlineCallout = outlineDescription
    ? `> [!NOTE] 🎯 Official UNSW Course Outline — Week ${week}: ${outlineTopic || lectureTitle}\n> ${outlineDescription}\n\n`
    : "";

  const courseContextCallout = courseContext && courseContext.trim().length > 0
    ? `> [!TIP] 📚 Uploaded Course Context Integrated\n> Distilled using staged course slides, problem sheets, and spoken transcript.\n\n`
    : "";

  return {
    title: topicHeading,
    outline: parsedResult.outline || [topicHeading],
    distilledContent: `${outlineCallout}${courseContextCallout}${parsedResult.distilledContent || ""}`,
    insights: Array.isArray(parsedResult.insights) ? parsedResult.insights : [],
    questionHints: Array.isArray(parsedResult.questionHints) ? parsedResult.questionHints : [],
    aiModelUsed: modelName
  };
}

export interface VaultSessionItem {
  id: string;
  courseCode: string;
  courseTitle: string;
  term?: string | null;
  sectionId?: string | null;
  sectionUrl?: string | null;
  userEmail?: string | null;
  savedAt: string;
  cookieHeader: string;
  rawInput?: string;
}

export async function getVaultSessions(): Promise<VaultSessionItem[]> {
  try {
    const raw = await fs.readFile(VAULT_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveVaultSession(item: VaultSessionItem): Promise<VaultSessionItem[]> {
  await fs.mkdir(SESSION_DIR, { recursive: true });
  const current = await getVaultSessions();
  const filtered = current.filter((s) => s.courseCode !== item.courseCode && s.id !== item.id);
  filtered.unshift(item);
  await fs.writeFile(VAULT_FILE, JSON.stringify(filtered, null, 2), "utf-8");
  return filtered;
}

export async function deleteVaultSession(id: string): Promise<VaultSessionItem[]> {
  const current = await getVaultSessions();
  const filtered = current.filter((s) => s.id !== id && s.courseCode !== id.toUpperCase());
  await fs.writeFile(VAULT_FILE, JSON.stringify(filtered, null, 2), "utf-8");
  return filtered;
}

export async function clearVault(): Promise<void> {
  try {
    await fs.unlink(VAULT_FILE);
  } catch {}
}

async function getSavedCookieHeader(): Promise<string> {
  try {
    const raw = await fs.readFile(COOKIES_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((c) => `${c.name}=${c.value}`).join("; ");
    } else if (typeof parsed === "object" && parsed.cookieHeader) {
      return parseCookiesFromAnyInput(parsed.cookieHeader);
    } else if (typeof parsed === "string") {
      return parseCookiesFromAnyInput(parsed);
    }
    return "";
  } catch {
    return "";
  }
}

export async function resolveActiveCookie(
  req: NextRequest,
  clientCookie?: string | null,
  courseId?: string | null
): Promise<string> {
  // 1. Direct body cookie
  if (clientCookie && clientCookie.trim().length > 10) {
    return parseCookiesFromAnyInput(clientCookie);
  }

  // 2. Request header (e.g. from sessionStorage)
  const headerCookie = req.headers.get("x-echo-cookie");
  if (headerCookie && headerCookie.trim().length > 10) {
    return parseCookiesFromAnyInput(headerCookie);
  }

  // 3. Saved disk cookie (if user checked "Save cookie to disk")
  const savedDisk = await getSavedCookieHeader();
  if (savedDisk && savedDisk.trim().length > 10) {
    return savedDisk;
  }

  // 4. Cookie Vault (match courseId or fallback to newest)
  try {
    const vault = await getVaultSessions();
    if (vault && vault.length > 0) {
      if (courseId) {
        const clean = courseId.toUpperCase().replace(/[^A-Z0-9]/g, "");
        const matched = vault.find((v) => v.courseCode?.toUpperCase() === clean);
        if (matched && matched.cookieHeader && matched.cookieHeader.trim().length > 10) {
          return parseCookiesFromAnyInput(matched.cookieHeader);
        }
      }
      const firstValid = vault.find((v) => v.cookieHeader && v.cookieHeader.trim().length > 10);
      if (firstValid) {
        return parseCookiesFromAnyInput(firstValid.cookieHeader);
      }
    }
  } catch {}

  return "";
}

export function extractSessionMetadata(text: string): {
  courseCode: string | null;
  courseTitle: string | null;
  term: string | null;
  sectionId: string | null;
  sectionUrl: string | null;
  userEmail: string | null;
} {
  let courseCode: string | null = null;
  let courseTitle: string | null = null;
  let term: string | null = null;
  let sectionId: string | null = null;
  let userEmail: string | null = null;

  if (!text) return { courseCode, courseTitle, term, sectionId, sectionUrl: null, userEmail };

  // Unescape Windows carets (e.g. ^&, %^28, etc.)
  const clean = text.replace(/\^/g, "");

  // 1. contextTitle inside PLAY_SESSION
  const titleMatch = clean.match(/contextTitle=([^&;\^\"'\s]+)/i);
  if (titleMatch) {
    try {
      courseTitle = decodeURIComponent(titleMatch[1].replace(/\+/g, " "));
      const codeMatch = courseTitle.match(/\b([A-Za-z]{4}\s*\d{4})\b/);
      if (codeMatch) courseCode = codeMatch[1].toUpperCase().replace(/\s+/g, "");
      const termMatch = courseTitle.match(/\(?(\d{4}\s*T\d)\)?/i);
      if (termMatch) term = termMatch[1];
    } catch {}
  }

  // 2. Section ID from URL or Referer
  const secMatch = clean.match(/section\/([0-9a-fA-F-]{36}|[0-9a-zA-Z_-]+)/i);
  if (secMatch) sectionId = secMatch[1];

  // 3. ECHO_JWT
  const jwtMatch = clean.match(/ECHO_JWT=([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/);
  if (jwtMatch) {
    try {
      const parts = jwtMatch[1].split(".");
      const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf8"));
      if (payload.sub || payload.ssoId) userEmail = payload.sub || payload.ssoId;
    } catch {}
  }

  const sectionUrl = sectionId ? `https://echo360.net.au/section/${sectionId}/home` : null;

  return { courseCode, courseTitle, term, sectionId, sectionUrl, userEmail };
}

// GET: Check session status (supports ephemeral header or saved vault/file)
export async function GET(req: NextRequest) {
  try {
    const headerCookie = req.headers.get("x-echo-cookie") || "";
    const headerSectionUrl = req.headers.get("x-echo-section-url") || "";
    const cookieHeader = headerCookie ? parseCookiesFromAnyInput(headerCookie) : (await getSavedCookieHeader());
    let fileStat = null;
    let rawContent = "";
    try {
      fileStat = await fs.stat(COOKIES_FILE);
      rawContent = await fs.readFile(COOKIES_FILE, "utf-8");
    } catch {}

    const vault = await getVaultSessions();
    const hasSession = Boolean(cookieHeader && cookieHeader.trim().length > 10);
    const count = hasSession ? cookieHeader.split(";").filter((c) => c.trim()).length : 0;

    const sourceText = headerCookie || rawContent || cookieHeader;
    const meta = hasSession && sourceText ? extractSessionMetadata(sourceText) : {
      courseCode: null,
      courseTitle: null,
      term: null,
      sectionId: null,
      sectionUrl: null,
      userEmail: null
    };

    if (headerSectionUrl && !meta.sectionUrl) {
      meta.sectionUrl = headerSectionUrl;
      const m = headerSectionUrl.match(/section\/([0-9a-fA-F-]{36}|[0-9a-zA-Z_-]+)/i);
      if (m) meta.sectionId = m[1];
    }

    // Auto-restore sectionUrl from courses/<courseCode>/course.json if missing
    if (!meta.sectionUrl && meta.courseCode) {
      try {
        const configPath = path.join(COURSES_DIR, meta.courseCode.toUpperCase(), "course.json");
        const cfg = JSON.parse(await fs.readFile(configPath, "utf-8"));
        if (cfg.echo360SectionUrl) {
          meta.sectionUrl = cfg.echo360SectionUrl;
          const m = cfg.echo360SectionUrl.match(/section\/([0-9a-fA-F-]{36}|[0-9a-zA-Z_-]+)/i);
          if (m) meta.sectionId = m[1];
        }
      } catch {}
    }

    return NextResponse.json({
      hasSession,
      isEphemeral: Boolean(headerCookie && !rawContent),
      cookieCount: count,
      lastUpdated: fileStat ? fileStat.mtime.toISOString() : null,
      courseCode: meta.courseCode,
      courseTitle: meta.courseTitle,
      term: meta.term,
      sectionId: meta.sectionId,
      sectionUrl: meta.sectionUrl,
      userEmail: meta.userEmail,
      vault
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Actions (save-session, list-vault, delete-vault-item, clear-vault, pull)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    // ACTION: Save Session (Ephemeral by default, or persistent to Vault if persistToDisk=true)
    if (action === "save-session") {
      const { cookies, cookieString, persistToDisk = false } = body;
      let cleanedCookies = "";
      let rawText = "";

      if (Array.isArray(cookies)) {
        cleanedCookies = cookies.map((c: any) => `${c.name}=${c.value}`).join("; ");
        rawText = JSON.stringify(cookies);
      } else if (cookieString && typeof cookieString === "string") {
        cleanedCookies = parseCookiesFromAnyInput(cookieString);
        rawText = cookieString;
        if (!cleanedCookies) {
          return NextResponse.json({ error: "Could not parse valid cookies from the provided input." }, { status: 400 });
        }
      } else {
        return NextResponse.json({ error: "Missing cookie content to save" }, { status: 400 });
      }

      const meta = extractSessionMetadata(rawText || cleanedCookies);
      const count = cleanedCookies.split(";").filter((c: string) => c.trim()).length;

      // Auto-save discovered section link directly to course.json
      if (meta.courseCode && meta.sectionUrl) {
        try {
          const courseDir = path.join(COURSES_DIR, meta.courseCode.toUpperCase());
          await fs.mkdir(courseDir, { recursive: true });
          const configPath = path.join(courseDir, "course.json");
          let config: any = {};
          try {
            config = JSON.parse(await fs.readFile(configPath, "utf-8"));
          } catch {}
          config.echo360SectionUrl = meta.sectionUrl;
          await fs.writeFile(configPath, JSON.stringify(config, null, 2), "utf-8");
        } catch (err) {
          console.warn("Could not auto-save echo360SectionUrl to course.json:", err);
        }
      }

      let vault: VaultSessionItem[] = [];
      if (persistToDisk) {
        await fs.mkdir(SESSION_DIR, { recursive: true });
        const toSave = { cookieHeader: cleanedCookies, rawInput: rawText };
        await fs.writeFile(COOKIES_FILE, JSON.stringify(toSave, null, 2), "utf-8");

        const sessionItem: VaultSessionItem = {
          id: (meta.courseCode || `session-${Date.now()}`).toLowerCase(),
          courseCode: meta.courseCode || "GENERAL",
          courseTitle: meta.courseTitle || `${meta.courseCode || "Echo360"} Session`,
          term: meta.term || null,
          sectionId: meta.sectionId || null,
          sectionUrl: meta.sectionUrl || null,
          userEmail: meta.userEmail || null,
          savedAt: new Date().toISOString(),
          cookieHeader: cleanedCookies,
          rawInput: rawText
        };
        vault = await saveVaultSession(sessionItem);
      } else {
        vault = await getVaultSessions();
      }

      return NextResponse.json({
        success: true,
        persisted: Boolean(persistToDisk),
        message: persistToDisk
          ? `Persisted ${meta.courseCode || "Echo360"} session to Cookie Vault`
          : "Session active in current browser tab only (ephemeral)",
        cookieHeader: cleanedCookies,
        cookieCount: count,
        courseCode: meta.courseCode,
        courseTitle: meta.courseTitle,
        term: meta.term,
        sectionId: meta.sectionId,
        sectionUrl: meta.sectionUrl,
        userEmail: meta.userEmail,
        vault
      });
    }

    // ACTION: List Vault
    if (action === "list-vault") {
      const vault = await getVaultSessions();
      return NextResponse.json({ success: true, vault });
    }

    // ACTION: Delete Vault Item
    if (action === "delete-vault-item") {
      const { id } = body;
      const vault = await deleteVaultSession(id);
      return NextResponse.json({ success: true, message: `Removed session ${id} from vault`, vault });
    }

    // ACTION: Clear Entire Vault & Session
    if (action === "clear-vault" || action === "clear-session") {
      await clearVault();
      try {
        await fs.unlink(COOKIES_FILE);
      } catch {}
      return NextResponse.json({ success: true, message: "Cleared all saved cookies from vault", vault: [] });
    }

    // ACTION: Discover Section Syllabus & Lectures
    if (action === "discover-section") {
      let { courseId = "math3701", sectionUrl, cookieHeader: clientCookieHeader } = body;
      const headerCookie = req.headers.get("x-echo-cookie");
      if (!clientCookieHeader && headerCookie) {
        clientCookieHeader = headerCookie;
      }
      let cleanCourse = (courseId || "math3701").toUpperCase().replace(/[^A-Z0-9]/g, "");

      let rawInput = (sectionUrl || "").trim();

      // Check if user entered a course code directly (e.g. "MATH3701")
      const isInputUrl =
        rawInput.startsWith("http://") ||
        rawInput.startsWith("https://") ||
        rawInput.includes("echo360") ||
        rawInput.includes("/");

      const directCodeMatch = rawInput.match(/\b([A-Za-z]{4}\s*\d{4})\b/);
      if (directCodeMatch) {
        cleanCourse = directCodeMatch[1].toUpperCase().replace(/\s+/g, "");
      } else if (!isInputUrl && rawInput) {
        cleanCourse = rawInput.toUpperCase().replace(/[^A-Z0-9]/g, "");
      }

      const headerSectionUrl = req.headers.get("x-echo-section-url");

      // Check for saved or active section URL in priority order:
      // 1. Check if course has a saved echo360SectionUrl in course.json
      let savedSectionUrl = "";
      try {
        const configRaw = await fs.readFile(path.join(COURSES_DIR, cleanCourse, "course.json"), "utf-8");
        const config = JSON.parse(configRaw);
        if (config.echo360SectionUrl) {
          savedSectionUrl = config.echo360SectionUrl;
        }
      } catch {
        try {
          const configRaw = await fs.readFile(path.join(COURSES_DIR, cleanCourse.toLowerCase(), "course.json"), "utf-8");
          const config = JSON.parse(configRaw);
          if (config.echo360SectionUrl) {
            savedSectionUrl = config.echo360SectionUrl;
          }
        } catch {}
      }

      // 2. Check headerSectionUrl
      if (!savedSectionUrl && headerSectionUrl) {
        savedSectionUrl = headerSectionUrl;
      }

      // 2. Check active session cookie metadata
      let sessionSource = clientCookieHeader || "";
      if (!sessionSource) {
        try {
          const fileRaw = await fs.readFile(COOKIES_FILE, "utf-8");
          const parsed = JSON.parse(fileRaw);
          sessionSource = parsed.rawInput || parsed.cookieHeader || "";
        } catch {}
      }
      const activeMeta = extractSessionMetadata(sessionSource);

      // If active session has a sectionUrl and matches this course (or user didn't specify a different code)
      if (!savedSectionUrl && activeMeta.sectionUrl) {
        if (!activeMeta.courseCode || activeMeta.courseCode === cleanCourse || !rawInput) {
          savedSectionUrl = activeMeta.sectionUrl;
          if (activeMeta.courseCode) cleanCourse = activeMeta.courseCode;
        }
      }

      // 3. Check Vault for this course
      if (!savedSectionUrl) {
        const vault = await getVaultSessions();
        const vaultItem = vault.find((v) => v.courseCode === cleanCourse || v.id === cleanCourse.toLowerCase());
        if (vaultItem && (vaultItem.sectionUrl || vaultItem.sectionId)) {
          savedSectionUrl = vaultItem.sectionUrl || `https://echo360.net.au/section/${vaultItem.sectionId}/home`;
          if (!clientCookieHeader && vaultItem.cookieHeader) {
            clientCookieHeader = vaultItem.cookieHeader;
          }
        }
      }

      if (!isInputUrl && savedSectionUrl) {
        rawInput = savedSectionUrl;
      }

      // If still not a URL, fetch and return the UNSW course outline immediately!
      if (!rawInput || (!rawInput.startsWith("http") && !rawInput.includes("echo360") && !rawInput.includes("/"))) {
        const outlineResult = await fetchUNSWCourseOutline(cleanCourse);
        if (!outlineResult.outline) {
          return NextResponse.json({
            error: outlineResult.error || `Course "${cleanCourse}" not found in UNSW Course Outlines. Please check the course code or paste an Echo360 Section URL.`,
            courseOutline: null,
            lectures: []
          }, { status: 404 });
        }
        return NextResponse.json({
          success: true,
          count: 0,
          courseId: cleanCourse,
          sectionTitle: `${cleanCourse} (UNSW Course Outline)`,
          lectures: [],
          courseOutline: outlineResult.outline,
          availableYears: outlineResult.availableYears,
          availableTerms: outlineResult.availableTerms,
          detectedYear: outlineResult.outline.year,
          detectedTerm: outlineResult.outline.term,
          needsSectionUrl: true,
          activeSessionCourse: activeMeta.courseCode || null,
          activeSessionSectionUrl: activeMeta.sectionUrl || null,
          message: activeMeta.courseCode && activeMeta.courseCode !== cleanCourse
            ? `Connected Echo360 session is for ${activeMeta.courseCode}. To link recordings for ${cleanCourse}, paste your ${cleanCourse} Echo360 Section URL or connect your ${cleanCourse} Moodle session.`
            : `UNSW Course Outline for ${cleanCourse} loaded. Paste the Echo360 Section URL once to link lecture recordings.`
        });
      }

      const urls = rawInput.match(/https?:\/\/[^\s"',]+/g) || [];

      // Multi-URL batch paste
      if (urls.length > 1) {
        const items = urls.map((u: string, idx: number) => {
          const mediaId = extractMediaId(u) || `media-item-${idx + 1}`;
          const week = Math.floor(idx / 2) + 1;
          return {
            lessonId: `lesson-${idx + 1}`,
            mediaId,
            title: `Lecture ${idx + 1}`,
            week,
            date: `Lecture ${idx + 1}`,
            lessonUrl: u,
            hasVideo: true,
            status: "queued"
          };
        });

        // Fetch course outline
        const outlineResult = await fetchUNSWCourseOutline(cleanCourse);
        const scheduleLectures = (outlineResult.outline?.schedule || []).filter((s) => s.type === "Lecture");
        items.forEach((l: any) => {
          const match = scheduleLectures.find((s: any) => s.week === l.week);
          if (match) {
            (l as any).outlineTopic = match.topic;
            (l as any).outlineDescription = match.description;
            (l as any).outlineDateRange = match.dateRange;
          }
        });

        await enrichLessonsWithDiskState(items, cleanCourse);

        return NextResponse.json({
          success: true,
          count: items.length,
          courseId: cleanCourse,
          sectionTitle: `Batch URL Import (${items.length} Lectures)`,
          lectures: items,
          courseOutline: outlineResult.outline || null
        });
      }

      // Single URL: Check if section URL
      const cleanUrl = extractUrlFromInput(rawInput);
      const secMatch = cleanUrl.match(/section\/([0-9a-fA-F-]{36}|[0-9a-zA-Z_-]+)/i);

      if (secMatch) {
        const sectionId = secMatch[1];
        let echoHost = "https://echo360.net.au";
        try {
          const uObj = new URL(cleanUrl);
          echoHost = uObj.origin;
        } catch {}

        let activeCookie = await resolveActiveCookie(req, clientCookieHeader, cleanCourse);
        if (!activeCookie) {
          const outlineResult = await fetchUNSWCourseOutline(cleanCourse);
          return NextResponse.json(
            {
              error: "No Echo360 session cookie found. Please connect your Echo360 session in Step 1 first.",
              courseOutline: outlineResult.outline || null
            },
            { status: 401 }
          );
        }

        const syllabusUrl = `${echoHost}/section/${sectionId}/syllabus`;
        let discoveredLessons: any[] = [];
        let sectionTitle = `Echo360 Section (${sectionId.slice(0, 8)})`;

        try {
          const sylRes = await fetch(syllabusUrl, {
            headers: {
              Cookie: activeCookie,
              Accept: "application/json, text/plain, */*",
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
          });

          if (sylRes.ok) {
            const sylJson = await sylRes.json();
            discoveredLessons = parseSyllabusLessons(sylJson, echoHost);
            if (sylJson.sectionName) sectionTitle = sylJson.sectionName;
          }
        } catch (sylErr) {
          console.warn("Failed querying /syllabus JSON:", sylErr);
        }

        // Fallback: Query section home HTML to parse lesson / media IDs
        if (discoveredLessons.length === 0) {
          try {
            const homeUrl = `${echoHost}/section/${sectionId}/home`;
            const homeRes = await fetch(homeUrl, {
              headers: {
                Cookie: activeCookie,
                Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
              }
            });

            if (homeRes.ok) {
              const html = await homeRes.text();
              discoveredLessons = extractLessonsFromHtml(html, echoHost);
            }
          } catch (homeErr) {
            console.warn("Failed querying /home HTML:", homeErr);
          }
        }

        if (discoveredLessons.length > 0) {
          // Detect actual course code from Echo360 section title or lesson titles!
          let detectedCourseMatch = sectionTitle.match(/\b([A-Za-z]{4}\s*\d{4})\b/);
          if (!detectedCourseMatch) {
            for (const l of discoveredLessons) {
              const m = (l.title || "").match(/\b([A-Za-z]{4}\s*\d{4})\b/);
              if (m) {
                detectedCourseMatch = m;
                break;
              }
            }
          }

          if (detectedCourseMatch) {
            cleanCourse = detectedCourseMatch[1].toUpperCase().replace(/\s+/g, "");
          } else if (activeMeta.courseCode) {
            cleanCourse = activeMeta.courseCode.toUpperCase().replace(/[^A-Z0-9]/g, "");
          }

          // Detect Year and Term from Echo360 section & lessons
          const dates = discoveredLessons.map((l) => l.rawStartTime).filter(Boolean);
          const detection = detectYearsAndTerms(dates, sectionTitle);

          // Save section URL to course.json for this specific detected course
          try {
            const courseDir = path.join(COURSES_DIR, cleanCourse);
            await fs.mkdir(courseDir, { recursive: true });
            const configPath = path.join(courseDir, "course.json");
            let config: any = {};
            try {
              const configRaw = await fs.readFile(configPath, "utf-8");
              config = JSON.parse(configRaw);
            } catch {}
            if (config.echo360SectionUrl !== cleanUrl) {
              config.echo360SectionUrl = cleanUrl;
              await fs.writeFile(configPath, JSON.stringify(config, null, 2), "utf-8");
            }

            // Also update Vault entry if it exists for this course
            const vault = await getVaultSessions();
            const idx = vault.findIndex((v) => v.courseCode === cleanCourse);
            if (idx >= 0 && (!vault[idx].sectionUrl || !vault[idx].sectionId)) {
              vault[idx].sectionUrl = cleanUrl;
              vault[idx].sectionId = sectionId;
              await fs.writeFile(VAULT_FILE, JSON.stringify(vault, null, 2), "utf-8");
            }
          } catch {}

          // Query official UNSW Course Outline for the ACTUAL detected course!
          const outlineResult = await fetchUNSWCourseOutline(cleanCourse, detection.year, detection.term);

          // Pair each lecture's week to the course outline schedule
          const scheduleLectures = (outlineResult.outline?.schedule || []).filter((s) => s.type === "Lecture");
          discoveredLessons.forEach((l) => {
            const match = scheduleLectures.find((s) => s.week === l.week);
            if (match) {
              l.outlineTopic = match.topic;
              l.outlineDescription = match.description;
              l.outlineDateRange = match.dateRange;
            }
          });

          await enrichLessonsWithDiskState(discoveredLessons, cleanCourse);

          return NextResponse.json({
            success: true,
            count: discoveredLessons.length,
            sectionId,
            sectionUrl: cleanUrl,
            sectionTitle,
            courseId: cleanCourse,
            lectures: discoveredLessons,
            courseOutline: outlineResult.outline || null,
            detectedYear: detection.year,
            detectedTerm: detection.term,
            isClosestMatch: outlineResult.isClosestMatch,
            closestYear: outlineResult.closestYear,
            availableYears: detection.availableYears,
            availableTerms: detection.availableTerms
          });
        } else {
          return NextResponse.json(
            {
              error: `Could not load recordings for Echo360 section (${sectionId.slice(0, 8)}). Your Echo360 session may have expired or is unauthorized for this section. Please reconnect your session in Step 1.`,
              courseOutline: null,
              lectures: []
            },
            { status: 401 }
          );
        }
      }

      // If single lesson URL provided:
      const mediaId = extractMediaId(cleanUrl);
      if (mediaId) {
        const outlineResult = await fetchUNSWCourseOutline(cleanCourse);
        const singleItems = [
          {
            lessonId: mediaId,
            mediaId,
            title: `Echo360 Lecture (${mediaId.slice(0, 8)})`,
            week: 1,
            date: "Lesson 1",
            lessonUrl: cleanUrl,
            hasVideo: true,
            status: "queued"
          }
        ];
        await enrichLessonsWithDiskState(singleItems, cleanCourse);

        return NextResponse.json({
          success: true,
          count: 1,
          sectionTitle: "Single Lecture",
          courseId: cleanCourse,
          courseOutline: outlineResult.outline || null,
          availableYears: outlineResult.availableYears,
          availableTerms: outlineResult.availableTerms,
          lectures: singleItems
        });
      }

      return NextResponse.json(
        { error: `Could not discover lectures or course data from the provided URL. Please verify the section link or ensure your Echo360 session is active.` },
        { status: 404 }
      );
    }

    // ACTION: Quick Fetch Transcript for Queue
    if (action === "fetch-transcript-quick") {
      const { mediaId, lessonUrl, cookieHeader: clientCookieHeader } = body;
      const safeMediaId = (mediaId || "").replace(/[^a-zA-Z0-9-_]/g, "");
      if (!safeMediaId) {
        return NextResponse.json({ error: "Missing mediaId" }, { status: 400 });
      }

      let activeCookie = await resolveActiveCookie(req, clientCookieHeader, body.courseId);
      if (!activeCookie) {
        return NextResponse.json({ error: "Missing Echo360 session cookie" }, { status: 401 });
      }

      let echoHost = "https://echo360.net.au";
      if (lessonUrl) {
        try {
          echoHost = new URL(lessonUrl).origin;
        } catch {}
      }

      const transcriptUrl = `${echoHost}/api/ui/echoplayer/media/${safeMediaId}/transcript`;
      try {
        const trRes = await fetch(transcriptUrl, {
          headers: {
            Cookie: activeCookie,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
          }
        });

        if (trRes.ok) {
          const trJson = await trRes.json();
          const parsed = parseEcho360Transcript(trJson);
          return NextResponse.json({
            success: true,
            hasTranscript: parsed.cueCount > 0,
            cueCount: parsed.cueCount,
            preview: parsed.lines.slice(0, 5).join("\n"),
            fullText: parsed.fullText
          });
        }
      } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, hasTranscript: false, cueCount: 0 });
    }

    // ACTION: Auto-Ingest Single Lecture in Batch Queue (Supports two-phase pipeline)
    if (action === "auto-ingest") {
      let {
        courseId = "math3701",
        phase = "all", // "download-media" | "distill-note" | "all"
        lessonId,
        mediaId,
        title,
        week = 1,
        date,
        lessonUrl,
        downloadAudio = true,
        autoDistill = true,
        outlineTopic,
        outlineDescription,
        cookieHeader: clientCookieHeader
      } = body;

      const cleanCourse = courseId.toUpperCase().replace(/[^A-Z0-9]/g, "");
      const courseDir = path.join(COURSES_DIR, cleanCourse);
      const lecturesDir = path.join(courseDir, "lectures");
      const rawDir = path.join(courseDir, "raw_files");
      const transcriptsDir = path.join(rawDir, "transcripts");
      const audioDir = path.join(rawDir, "audio");

      await fs.mkdir(lecturesDir, { recursive: true });
      await fs.mkdir(transcriptsDir, { recursive: true });
      await fs.mkdir(audioDir, { recursive: true });

      const safeMediaId = (mediaId || lessonId || "lecture").replace(/[^a-zA-Z0-9-_]/g, "");

      if (safeMediaId.includes("demo") || (lessonUrl && lessonUrl.includes("demo"))) {
        return NextResponse.json(
          { error: "Synthetic demo ingestion is disabled. Please provide an authentic Echo360 recording." },
          { status: 400 }
        );
      }

      const audioFileName = `lecture_${safeMediaId}.m4a`;
      const audioOutPath = path.join(audioDir, audioFileName);
      const transcriptOutPath = path.join(transcriptsDir, `lecture_${safeMediaId}.txt`);

      let echoHost = "https://echo360.net.au";
      if (lessonUrl) {
        try {
          echoHost = new URL(lessonUrl).origin;
        } catch {}
      }

      let transcriptText = "";
      let cueCount = 0;
      let audioDownloaded = false;

      // Check if media already downloaded on disk
      try {
        const audioStat = await fs.stat(audioOutPath);
        if (audioStat.size > 20000) audioDownloaded = true;
      } catch {}

      try {
        transcriptText = await fs.readFile(transcriptOutPath, "utf-8");
        cueCount = transcriptText.split("\n").filter((l) => l.includes("[")).length;
      } catch {}

      // If media download is required
      if (phase === "download-media" || phase === "all") {
        let activeCookie = await resolveActiveCookie(req, clientCookieHeader, cleanCourse);
        if (!activeCookie) {
          return NextResponse.json({ error: "Missing Echo360 session authentication. Please connect your session in Step 1." }, { status: 401 });
        }

        // Fetch transcript if not already saved
        if (!transcriptText) {
          const transcriptUrl = `${echoHost}/api/ui/echoplayer/media/${safeMediaId}/transcript`;
          try {
            const trRes = await fetch(transcriptUrl, {
              headers: {
                Cookie: activeCookie,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
              }
            });
            if (trRes.ok) {
              const trJson = await trRes.json();
              const parsed = parseEcho360Transcript(trJson);
              transcriptText = parsed.fullText;
              cueCount = parsed.cueCount;
              if (transcriptText) {
                await fs.writeFile(transcriptOutPath, transcriptText, "utf-8");
              }
            }
          } catch (trErr) {
            console.warn("Could not fetch transcript:", trErr);
          }
        }

        // Download audio stream via ffmpeg into temporary file first, then atomically commit
        const audioTmpPath = `${audioOutPath}.tmp`;
        try { await fs.unlink(audioTmpPath); } catch {}

        if (downloadAudio && !audioDownloaded && lessonUrl) {
          try {
            const pageRes = await fetch(lessonUrl, {
              headers: {
                Cookie: activeCookie,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
              }
            });
            if (pageRes.ok) {
              const pageHtml = await pageRes.text();
              const m3u8Match = pageHtml.match(/URI="([^"]*s0q\d+\.m3u8[^"]*)"/i) || pageHtml.match(/https?:\/\/[^"'\s\\]+?\.m3u8[^"'\s\\]*/i);
              if (m3u8Match) {
                const m3u8Url = m3u8Match[1] || m3u8Match[0];
                const cookieArg = activeCookie ? `-headers "Cookie: ${activeCookie}\r\n"` : "";
                const cmd = `ffmpeg -y ${cookieArg} -i "${m3u8Url}" -vn -c:a copy "${audioTmpPath}"`;
                await execAsync(cmd);
                
                // Verify tmp file exists and is healthy (>20KB) before committing
                const stat = await fs.stat(audioTmpPath);
                if (stat.size > 20000) {
                  await fs.rename(audioTmpPath, audioOutPath);
                  audioDownloaded = true;
                } else {
                  try { await fs.unlink(audioTmpPath); } catch {}
                  console.warn("Downloaded audio was truncated or empty (<20KB)");
                }
              }
            }
          } catch (audioErr) {
            console.warn("Audio stream download error:", audioErr);
            try { await fs.unlink(audioTmpPath); } catch {}
          }
        }

        if (phase === "download-media") {
          return NextResponse.json({
            success: true,
            phase: "download-media",
            mediaReady: true,
            cueCount,
            audioDownloaded,
            hasTranscript: transcriptText.length > 0,
            transcriptFile: `lecture_${safeMediaId}.txt`,
            audioFile: audioDownloaded ? audioFileName : null,
            message: `Media downloaded for ${title || safeMediaId}`
          });
        }
      }

      // Phase: "distill-note" or "all"
      // Read course content manifest for uploaded slides, problem sheets, notes
      let courseContext = "";
      try {
        const manifestRaw = await fs.readFile(path.join(courseDir, "course_content.json"), "utf-8");
        const manifest = JSON.parse(manifestRaw);
        const matchingItems = (manifest.items || []).filter(
          (item: any) => item.week === Number(week) || item.week === "all" || !item.week
        );
        courseContext = matchingItems
          .map((m: any) => `[${m.categoryName || m.category} - ${m.originalName}]: ${m.textSnippet || ""}`)
          .join("\n\n");
      } catch {}

      const { aiSettings, requireAi = true } = body;

      let synthesized: any = null;
      let aiModelUsed: string | null = null;

      const hasAiConfigured = aiSettings && (
        aiSettings.provider === "ollama" ||
        (aiSettings.provider === "gemini" && (aiSettings.apiKey?.trim() || process.env.GEMINI_API_KEY)) ||
        (aiSettings.provider === "openai" && (aiSettings.apiKey?.trim() || process.env.OPENAI_API_KEY)) ||
        (aiSettings.provider === "anthropic" && (aiSettings.apiKey?.trim() || process.env.ANTHROPIC_API_KEY))
      );

      if (hasAiConfigured) {
        try {
          const aiResult = await distillLectureWithAI({
            courseId: cleanCourse,
            week: Number(week) || 1,
            lectureTitle: title || `Lecture (Week ${week})`,
            outlineTopic,
            outlineDescription,
            courseContext,
            transcriptText,
            aiSettings
          });
          synthesized = aiResult;
          aiModelUsed = aiResult.aiModelUsed;
        } catch (aiErr: any) {
          console.error("AI Distillation error:", aiErr);
          return NextResponse.json(
            { error: `AI Distillation error: ${aiErr.message || "Failed to distill note"}` },
            { status: 500 }
          );
        }
      } else {
        // If user requested AI distillation but has not provided an AI key/provider
        if (requireAi && autoDistill) {
          return NextResponse.json(
            {
              error: "No AI provider configured. Please open AI Settings to enter a Google Gemini API key or connect Ollama to distill notes.",
              needsAiConfig: true
            },
            { status: 400 }
          );
        }

        // Fallback: User explicitly requested raw transcript outline without AI
        synthesized = synthesizeNotesFromTranscript(
          transcriptText,
          title || `Lecture (Week ${week})`,
          Number(week) || 1,
          outlineTopic,
          outlineDescription,
          courseContext
        );
      }

      const noteId = `lecture-w${String(week).padStart(2, "0")}-${safeMediaId.slice(0, 8)}`;
      const notePath = path.join(lecturesDir, `${noteId}.md`);

      const frontmatter: Record<string, any> = {
        id: noteId,
        week: Number(week) || 1,
        title: title || synthesized.title,
        date: date || new Date().toISOString().split("T")[0],
        echo360Url: lessonUrl || `${echoHost}/media/${safeMediaId}`,
        sourceTranscript: `lecture_${safeMediaId}.txt`,
        topics: synthesized.outline || [],
        insights: synthesized.insights || [],
        questionHints: synthesized.questionHints || [],
        aiDistilled: Boolean(aiModelUsed),
        aiModel: aiModelUsed || "None (Raw Transcript Outline)",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      if (outlineTopic) {
        frontmatter.outlineTopic = outlineTopic;
      }
      if (audioDownloaded && audioFileName) {
        frontmatter.sourceAudio = audioFileName;
      }

      const mdContent = safeMatterStringify(synthesized.distilledContent, frontmatter);
      await fs.writeFile(notePath, mdContent, "utf-8");

      return NextResponse.json({
        success: true,
        phase: phase === "distill-note" ? "distill-note" : "all",
        noteId,
        title: frontmatter.title,
        week: frontmatter.week,
        cueCount,
        audioDownloaded,
        aiDistilled: Boolean(aiModelUsed),
        aiModel: aiModelUsed,
        insightsCount: synthesized.insights.length,
        message: `Saved ${frontmatter.title} (${synthesized.insights.length} insights)`
      });
    }

    // ACTION: Pull Lecture (Auto-Pull via GUI)
    if (action === "pull") {
      let {
        courseId = "math3701",
        url,
        cookieHeader: clientCookieHeader,
        downloadAudio = true,
        week = 1,
        title = ""
      } = body;

      if (!url || typeof url !== "string" || !url.trim()) {
        return NextResponse.json({ error: "Please enter a valid Echo360 Lecture or Classroom URL." }, { status: 400 });
      }

      const trimmed = url.trim();
      const isUrl =
        trimmed.startsWith("http://") ||
        trimmed.startsWith("https://") ||
        trimmed.includes("echo360") ||
        trimmed.includes("/");

      if (!isUrl) {
        return NextResponse.json(
          { error: `"${trimmed}" is not a valid URL. Please paste the full Echo360 lecture recording or classroom link.` },
          { status: 400 }
        );
      }

      url = extractUrlFromInput(trimmed);

      const cleanCourse = courseId.toUpperCase().replace(/[^A-Z0-9]/g, "");
      const rawDir = path.join(COURSES_DIR, cleanCourse, "raw_files");
      const transcriptsDir = path.join(rawDir, "transcripts");
      const audioDir = path.join(rawDir, "audio");

      await fs.mkdir(transcriptsDir, { recursive: true });
      await fs.mkdir(audioDir, { recursive: true });

      // Check session
      let activeCookie = await resolveActiveCookie(req, clientCookieHeader, body.courseId);
      if (!activeCookie || activeCookie.trim().length < 5) {
        return NextResponse.json(
          {
            error: "No active Echo360 session found. Please paste your Echo360 session cookie in Step 1 to authenticate."
          },
          { status: 401 }
        );
      }

      // 1. Fetch lesson / media page
      const pageRes = await fetch(url, {
        headers: {
          Cookie: activeCookie,
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        }
      });

      if (!pageRes.ok) {
        return NextResponse.json(
          {
            error: `Echo360 returned HTTP ${pageRes.status} (${pageRes.statusText}). Your session cookie may have expired. Please re-copy your cookies.`
          },
          { status: pageRes.status }
        );
      }

      const pageHtml = await pageRes.text();
      const mediaId = extractMediaId(pageHtml) || extractMediaId(url);

      if (!mediaId) {
        return NextResponse.json(
          {
            error:
              "Could not locate Media ID on the Echo360 page. Verify the URL points to a specific lesson or video player."
          },
          { status: 400 }
        );
      }

      // Determine Echo360 Host domain (e.g. echo360.net.au, echo360.org.au, or echo360.org)
      const urlObj = new URL(url);
      const echoHost = urlObj.origin;

      // 2. Fetch Transcript
      let transcriptText = "";
      let cueCount = 0;
      const transcriptUrl = `${echoHost}/api/ui/echoplayer/media/${mediaId}/transcript`;

      try {
        const trRes = await fetch(transcriptUrl, {
          headers: {
            Cookie: activeCookie,
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          }
        });

        if (trRes.ok) {
          const trJson = await trRes.json();
          const parsed = parseEcho360Transcript(trJson);
          transcriptText = parsed.fullText;
          cueCount = parsed.cueCount;

          if (transcriptText) {
            const txtPath = path.join(transcriptsDir, `lecture_${mediaId}.txt`);
            await fs.writeFile(txtPath, transcriptText, "utf-8");
          }
        }
      } catch (err) {
        console.warn("Failed fetching transcript:", err);
      }

      // 3. Audio Stream Extraction (if requested)
      let audioDownloaded = false;
      const audioFileName = `lecture_${mediaId}.m4a`;
      const audioOutPath = path.join(audioDir, audioFileName);

      if (downloadAudio) {
        // Search HTML for m3u8 audio streams
        const m3u8Match =
          pageHtml.match(/URI="([^"]*s0q\d+\.m3u8[^"]*)"/i) ||
          pageHtml.match(/https?:\/\/[^"'\s\\]+?\.m3u8[^"'\s\\]*/i);

        if (m3u8Match) {
          const m3u8Url = m3u8Match[1] || m3u8Match[0];
          try {
            // Download audio-only stream via ffmpeg
            const cookieArg = activeCookie ? `-headers "Cookie: ${activeCookie}\r\n"` : "";
            const cmd = `ffmpeg -y ${cookieArg} -i "${m3u8Url}" -vn -c:a copy "${audioOutPath}"`;
            await execAsync(cmd);
            audioDownloaded = true;
          } catch (ffmpegErr) {
            console.warn("FFmpeg audio download error:", ffmpegErr);
          }
        }
      }

      return NextResponse.json({
        success: true,
        mediaId,
        suggestedTitle: title || `Echo360 Lecture (${mediaId.slice(0, 8)})`,
        week: Number(week) || 1,
        transcriptText,
        cueCount,
        audioFile: audioDownloaded ? audioFileName : undefined,
        audioDownloaded,
        message: `Auto-pulled transcript (${cueCount} cues)${audioDownloaded ? " and audio stream" : ""} successfully!`
      });
    }

    return NextResponse.json({ error: `Unknown action '${action}'` }, { status: 400 });
  } catch (err: any) {
    console.error("Echo360 Auto-Pull error:", err);
    return NextResponse.json({ error: err.message || "Auto-pull failed" }, { status: 500 });
  }
}
