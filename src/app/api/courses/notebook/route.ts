import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import {
  DEFAULT_ANTIGRAVITY_MODEL,
  extractJsonFromText,
  resolveCourseWorkspaceDir,
  runAntigravityPrompt
} from "@/lib/antigravity-client";
import { buildGeminiGenerationConfig, resolveGeminiModel } from "@/lib/gemini-client";

const COURSES_DIR = path.join(process.cwd(), "courses");

function safeCourseCode(raw: string | null | undefined): string {
  return (raw || "sample1001").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function safeMatterStringify(content: string = "", frontmatter: Record<string, any> = {}): string {
  const cleanContent = String(content || "");
  const cleanFrontmatter: Record<string, any> = {};
  for (const [key, value] of Object.entries(frontmatter)) {
    if (value !== undefined) cleanFrontmatter[key] = value;
  }
  const fullyCleaned = JSON.parse(
    JSON.stringify(cleanFrontmatter, (_k, val) => (val === undefined ? undefined : val))
  );
  return matter.stringify(cleanContent, fullyCleaned);
}

interface LectureCorpusEntry {
  id: string;
  fileName: string;
  week: number;
  title: string;
  topics: string[];
  linkedConcepts: string[];
  linkedQuestions: string[];
  insightsSummary: string;
  bodyExcerpt: string;
}

interface CorpusSnapshot {
  courseId: string;
  distilledCount: number;
  rawTranscriptsCount: number;
  extractedMaterialsCount: number;
  conceptsCount: number;
  questionsCount: number;
  estimatedTokens: number;
  lectures: LectureCorpusEntry[];
  concepts: { slug: string; title: string; week?: number; summary: string }[];
  questions: { id: string; title: string; type?: string; week?: number }[];
  materials: { fileName: string; excerpt: string }[];
}

async function safeReadDir(dirPath: string): Promise<string[]> {
  try {
    return await fs.readdir(dirPath);
  } catch {
    return [];
  }
}

async function buildNotebookCorpus(courseDir: string, courseId: string): Promise<CorpusSnapshot> {
  const lecturesDir = path.join(/*turbopackIgnore: true*/ courseDir, "lectures");
  const rawDir = path.join(/*turbopackIgnore: true*/ lecturesDir, "raw_files");
  const extractedDir = path.join(/*turbopackIgnore: true*/ courseDir, "course_content", "_extracted");
  const conceptsDir = path.join(/*turbopackIgnore: true*/ courseDir, "concepts");
  const questionsDir = path.join(/*turbopackIgnore: true*/ courseDir, "questions");

  let totalChars = 0;

  // 1. Lectures
  const lectureFiles = (await safeReadDir(lecturesDir)).filter((f) => f.endsWith(".md"));
  const lectures: LectureCorpusEntry[] = [];
  for (const f of lectureFiles) {
    try {
      const raw = await fs.readFile(path.join(/*turbopackIgnore: true*/ lecturesDir, f), "utf-8");
      const { data, content } = matter(raw);
      totalChars += raw.length;

      const insights: any[] = Array.isArray(data.insights) ? data.insights : [];
      const insightsSummary = insights
        .slice(0, 12)
        .map(
          (ins) =>
            `- [${ins.timestamp || "00:00:00"}] (${ins.type || "note"}) ${ins.title || ""}: ${String(
              ins.summary || ""
            ).slice(0, 200)}`
        )
        .join("\n");

      lectures.push({
        id: data.id || f.replace(/\.md$/, ""),
        fileName: f,
        week: Number(data.week) || 1,
        title: data.title || f.replace(/\.md$/, ""),
        topics: Array.isArray(data.topics) ? data.topics : [],
        linkedConcepts: Array.isArray(data.linkedConcepts) ? data.linkedConcepts : [],
        linkedQuestions: Array.isArray(data.linkedQuestions) ? data.linkedQuestions : [],
        insightsSummary,
        bodyExcerpt: content.trim().slice(0, 3200)
      });
    } catch {}
  }
  lectures.sort((a, b) => a.week - b.week || a.title.localeCompare(b.title));

  // 2. Raw transcripts count
  const rawFiles = (await safeReadDir(rawDir)).filter((f) => f.endsWith(".txt") || f.endsWith(".vtt"));
  const rawTranscriptsCount = rawFiles.length;

  // 3. Extracted course materials
  const extractedFiles = (await safeReadDir(extractedDir)).filter((f) => f.endsWith(".txt"));
  const materials: { fileName: string; excerpt: string }[] = [];
  for (const f of extractedFiles) {
    try {
      const txt = await fs.readFile(path.join(/*turbopackIgnore: true*/ extractedDir, f), "utf-8");
      totalChars += txt.length;
      materials.push({
        fileName: f,
        excerpt: txt.trim().slice(0, 2600)
      });
    } catch {}
  }

  // 4. Concepts
  const conceptFiles = (await safeReadDir(conceptsDir)).filter((f) => f.endsWith(".md"));
  const concepts: { slug: string; title: string; week?: number; summary: string }[] = [];
  for (const f of conceptFiles) {
    try {
      const raw = await fs.readFile(path.join(/*turbopackIgnore: true*/ conceptsDir, f), "utf-8");
      const { data, content } = matter(raw);
      totalChars += Math.min(raw.length, 1500);
      concepts.push({
        slug: data.slug || f.replace(/\.md$/, ""),
        title: data.title || f.replace(/\.md$/, ""),
        week: data.week ? Number(data.week) : undefined,
        summary: content.trim().slice(0, 350)
      });
    } catch {}
  }

  // 5. Questions
  const questionFiles = (await safeReadDir(questionsDir)).filter((f) => f.endsWith(".md"));
  const questions: { id: string; title: string; type?: string; week?: number }[] = [];
  for (const f of questionFiles) {
    try {
      const raw = await fs.readFile(path.join(/*turbopackIgnore: true*/ questionsDir, f), "utf-8");
      const { data } = matter(raw);
      totalChars += Math.min(raw.length, 1000);
      questions.push({
        id: data.id || f.replace(/\.md$/, ""),
        title: data.title || f.replace(/\.md$/, ""),
        type: data.type,
        week: data.week ? Number(data.week) : undefined
      });
    } catch {}
  }

  return {
    courseId,
    distilledCount: lectures.length,
    rawTranscriptsCount,
    extractedMaterialsCount: materials.length,
    conceptsCount: concepts.length,
    questionsCount: questions.length,
    estimatedTokens: Math.ceil(totalChars / 4),
    lectures,
    concepts,
    questions,
    materials
  };
}

async function searchRawTranscriptSnippets(courseDir: string, query: string): Promise<string> {
  const rawDir = path.join(/*turbopackIgnore: true*/ courseDir, "lectures", "raw_files");
  const files = (await safeReadDir(rawDir)).filter((f) => f.endsWith(".txt"));
  if (files.length === 0) return "";

  const keywords = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4)
    .slice(0, 8);
  if (keywords.length === 0) return "";

  const snippets: string[] = [];
  for (const f of files.slice(0, 24)) {
    try {
      const txt = await fs.readFile(path.join(/*turbopackIgnore: true*/ rawDir, f), "utf-8");
      const lines = txt.split(/\r?\n/);
      let bestScore = 0;
      let bestIdx = -1;
      for (let i = 0; i < lines.length; i++) {
        const lower = lines[i].toLowerCase();
        let score = 0;
        for (const kw of keywords) {
          if (lower.includes(kw)) score++;
        }
        if (score > bestScore) {
          bestScore = score;
          bestIdx = i;
        }
      }
      if (bestScore > 0 && bestIdx >= 0) {
        const slice = lines.slice(Math.max(0, bestIdx - 3), bestIdx + 6).join("\n");
        snippets.push(`### Raw Transcript Match (${f}):\n${slice.slice(0, 900)}`);
      }
    } catch {}
    if (snippets.length >= 4) break;
  }
  return snippets.join("\n\n");
}

function formatCorpusForPrompt(corpus: CorpusSnapshot, maxChars: number = 95000): string {
  const sections: string[] = [];

  sections.push(
    `COURSE: ${corpus.courseId}\nSTATS: ${corpus.distilledCount} distilled lectures, ${corpus.extractedMaterialsCount} extracted course PDFs, ${corpus.conceptsCount} concepts, ${corpus.questionsCount} questions.`
  );

  if (corpus.concepts.length > 0) {
    sections.push(
      `CONCEPTS IN VAULT:\n` +
        corpus.concepts
          .slice(0, 80)
          .map((c) => `- ${c.slug} (${c.title}${c.week ? `, Wk ${c.week}` : ""}): ${c.summary.replace(/\s+/g, " ")}`)
          .join("\n")
    );
  }

  if (corpus.questions.length > 0) {
    sections.push(
      `QUESTIONS IN VAULT:\n` +
        corpus.questions
          .slice(0, 80)
          .map((q) => `- ${q.id} (${q.title}${q.week ? `, Wk ${q.week}` : ""}${q.type ? `, ${q.type}` : ""})`)
          .join("\n")
    );
  }

  if (corpus.materials.length > 0) {
    sections.push(
      `EXTRACTED COURSE MATERIALS / PDFs:\n` +
        corpus.materials
          .slice(0, 20)
          .map((m) => `### ${m.fileName}\n${m.excerpt}`)
          .join("\n\n")
    );
  }

  if (corpus.lectures.length > 0) {
    sections.push(
      `DISTILLED LECTURES:\n` +
        corpus.lectures
          .map(
            (l) =>
              `## [Week ${l.week}] ${l.title} (id: ${l.id})\nTopics: ${l.topics.join(", ") || "N/A"}\nTimestamped Insights:\n${
                l.insightsSummary || "(None)"
              }\nNotes Excerpt:\n${l.bodyExcerpt}`
          )
          .join("\n\n---\n\n")
    );
  }

  const combined = sections.join("\n\n====================\n\n");
  return combined.length > maxChars ? `${combined.slice(0, maxChars)}\n\n[...corpus condensed at char budget...]` : combined;
}

async function runWorkspaceAwareAi<T>(opts: {
  courseId: string;
  systemInstruction: string;
  prompt: string;
  schema: Record<string, unknown>;
  aiSettings?: any;
}): Promise<{ data: T; provider: string; model: string }> {
  const ai = opts.aiSettings || {};
  const provider: string = ai.provider || "antigravity";

  if (provider === "antigravity" || !ai.apiKey) {
    const model = ai.antigravityModel || ai.model || DEFAULT_ANTIGRAVITY_MODEL;
    const workspaceDir = await resolveCourseWorkspaceDir(opts.courseId);
    const result = await runAntigravityPrompt<T>({
      prompt: opts.prompt,
      systemInstruction: opts.systemInstruction,
      model,
      workspaceDir,
      schema: opts.schema,
      timeoutMs: 180000
    });
    return { data: result.parsed, provider: "antigravity", model: result.model || model };
  }

  if (provider === "gemini") {
    const resolvedModel = await resolveGeminiModel(ai.apiKey, ai.geminiModel || ai.model || "gemini-4-hydrogen");
    const genConfig = buildGeminiGenerationConfig({
      model: resolvedModel,
      temperature: 0.25,
      responseMimeType: "application/json",
      thinkingLevel: "high"
    });
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${resolvedModel}:generateContent?key=${ai.apiKey.trim()}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: opts.systemInstruction }] },
          contents: [{ role: "user", parts: [{ text: opts.prompt }] }],
          generationConfig: genConfig
        })
      }
    );
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error?.message || `Gemini API failed (${res.status})`);
    }
    const raw = json.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return { data: extractJsonFromText<T>(raw), provider: "gemini", model: resolvedModel };
  }

  if (provider === "openai") {
    const model = ai.openaiModel || ai.model || "gpt-4o";
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ai.apiKey.trim()}`
      },
      body: JSON.stringify({
        model,
        response_format: { type: "json_object" },
        temperature: 0.25,
        messages: [
          { role: "system", content: opts.systemInstruction },
          { role: "user", content: opts.prompt }
        ]
      })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || "OpenAI API failed");
    const raw = json.choices?.[0]?.message?.content || "";
    return { data: extractJsonFromText<T>(raw), provider: "openai", model };
  }

  if (provider === "anthropic") {
    const model = ai.anthropicModel || ai.model || "claude-3-5-sonnet-20241022";
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ai.apiKey.trim(),
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        temperature: 0.25,
        system: opts.systemInstruction,
        messages: [{ role: "user", content: opts.prompt }]
      })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || "Anthropic API failed");
    const raw = json.content?.[0]?.text || "";
    return { data: extractJsonFromText<T>(raw), provider: "anthropic", model };
  }

  // Ollama fallback
  const ollamaUrl = (ai.ollamaUrl || "http://localhost:11434").replace(/\/$/, "");
  const model = ai.ollamaModel || ai.model || "llama3";
  const res = await fetch(`${ollamaUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      format: "json",
      stream: false,
      messages: [
        { role: "system", content: opts.systemInstruction },
        { role: "user", content: opts.prompt }
      ]
    })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Ollama request failed");
  const raw = json.message?.content || "";
  return { data: extractJsonFromText<T>(raw), provider: "ollama", model };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = safeCourseCode(searchParams.get("course"));
    const courseDir = path.join(/*turbopackIgnore: true*/ COURSES_DIR, courseId);

    const corpus = await buildNotebookCorpus(courseDir, courseId);
    const masterMdPath = path.join(/*turbopackIgnore: true*/ courseDir, "notebook_master.md");
    const masterJsonPath = path.join(/*turbopackIgnore: true*/ courseDir, "notebook_master.json");

    let markdown = "";
    let meta: any = null;
    try {
      markdown = await fs.readFile(masterMdPath, "utf-8");
    } catch {}
    try {
      meta = JSON.parse(await fs.readFile(masterJsonPath, "utf-8"));
    } catch {}

    return NextResponse.json({
      success: true,
      courseId,
      stats: {
        distilledCount: corpus.distilledCount,
        rawTranscriptsCount: corpus.rawTranscriptsCount,
        extractedMaterialsCount: corpus.extractedMaterialsCount,
        conceptsCount: corpus.conceptsCount,
        questionsCount: corpus.questionsCount,
        estimatedTokens: corpus.estimatedTokens
      },
      notebook: markdown
        ? {
            markdown,
            compiledAt: meta?.compiledAt || null,
            provider: meta?.provider || null,
            model: meta?.model || null,
            weeklyArc: meta?.weeklyArc || [],
            crossLinks: meta?.crossLinks || []
          }
        : null
    });
  } catch (err: any) {
    console.error("GET /api/courses/notebook failed:", err);
    return NextResponse.json({ error: err.message || "Failed to load course notebook" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const courseId = safeCourseCode(body.courseId || body.course);
    const action: "compile" | "ask" = body.action === "ask" ? "ask" : "compile";
    const courseDir = path.join(/*turbopackIgnore: true*/ COURSES_DIR, courseId);

    await fs.mkdir(courseDir, { recursive: true });
    const corpus = await buildNotebookCorpus(courseDir, courseId);

    if (corpus.distilledCount === 0 && corpus.extractedMaterialsCount === 0) {
      return NextResponse.json(
        {
          error:
            "No distilled lectures or extracted course materials exist yet for this course. Distill at least one lecture or upload PDF materials first."
        },
        { status: 400 }
      );
    }

    const corpusText = formatCorpusForPrompt(corpus);

    if (action === "compile") {
      const systemInstruction = `You are a workspace-aware university STEM curriculum architect synthesizing an entire semester's lectures, PDF slides, concepts, and practice questions for ${courseId}.
You must output ONLY valid JSON matching the requested schema.
Every mathematical expression MUST use clean KaTeX LaTeX ($...$ inline, $$...$$ display).
Ground every synthesis statement in actual timestamps ([Week X @ hh:mm:ss]), lecture IDs, PDF files, concept slugs, or question IDs present in the provided corpus. Never invent theorems or syllabus weeks not in the corpus.`;

      const prompt = `Compile the Master Course Notebook for ${courseId} across the entire provided corpus.

Requirements for "markdown":
1. **Course Overview & Narrative Arc**: High-level map of how weeks build on one another.
2. **Weekly Progression & Topic Evolution**: Chronological synthesis with explicit [Week X @ hh:mm:ss] references linking concepts across lectures.
3. **Core Definitions, Theorems & Proof Techniques**: Unified cheat-sheet comparing definitions and hypotheses across lectures and PDFs, referencing concept slugs from CONCEPTS IN VAULT.
4. **Exam Traps & Question Patterns**: How concepts map onto practice/exam questions in QUESTIONS IN VAULT.

Also emit:
- "weeklyArc": concise array of weekly theme summaries with existing concept slugs and lecture IDs.
- "crossLinks": array mapping each distilled lecture ID to matching existing concept slugs (from CONCEPTS IN VAULT) and existing question IDs (from QUESTIONS IN VAULT).

COURSE CORPUS:
${corpusText}`;

      const schema = {
        type: "object",
        properties: {
          markdown: { type: "string" },
          weeklyArc: {
            type: "array",
            items: {
              type: "object",
              properties: {
                week: { type: "number" },
                theme: { type: "string" },
                keyConcepts: { type: "array", items: { type: "string" } },
                lectureIds: { type: "array", items: { type: "string" } }
              },
              required: ["week", "theme", "keyConcepts", "lectureIds"]
            }
          },
          crossLinks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                lectureId: { type: "string" },
                linkedConcepts: { type: "array", items: { type: "string" } },
                linkedQuestions: { type: "array", items: { type: "string" } }
              },
              required: ["lectureId", "linkedConcepts", "linkedQuestions"]
            }
          }
        },
        required: ["markdown", "weeklyArc", "crossLinks"]
      };

      const aiResult = await runWorkspaceAwareAi<{
        markdown: string;
        weeklyArc: { week: number; theme: string; keyConcepts: string[]; lectureIds: string[] }[];
        crossLinks: { lectureId: string; linkedConcepts: string[]; linkedQuestions: string[] }[];
      }>({
        courseId,
        systemInstruction,
        prompt,
        schema,
        aiSettings: body.aiSettings
      });

      const compiledAt = new Date().toISOString();
      const markdown = aiResult.data?.markdown || `# ${courseId} Master Course Notebook\n\n(No content returned.)`;
      const weeklyArc = Array.isArray(aiResult.data?.weeklyArc) ? aiResult.data.weeklyArc : [];
      const crossLinks = Array.isArray(aiResult.data?.crossLinks) ? aiResult.data.crossLinks : [];

      await fs.writeFile(path.join(/*turbopackIgnore: true*/ courseDir, "notebook_master.md"), markdown, "utf-8");
      await fs.writeFile(
        path.join(/*turbopackIgnore: true*/ courseDir, "notebook_master.json"),
        JSON.stringify(
          {
            courseId,
            compiledAt,
            provider: aiResult.provider,
            model: aiResult.model,
            weeklyArc,
            crossLinks
          },
          null,
          2
        ),
        "utf-8"
      );

      // Update linkedConcepts and linkedQuestions in matching lecture markdown frontmatter
      const validConcepts = new Set(corpus.concepts.map((c) => c.slug));
      const validQuestions = new Set(corpus.questions.map((q) => q.id));
      const lecturesDir = path.join(/*turbopackIgnore: true*/ courseDir, "lectures");

      for (const link of crossLinks) {
        const lectureEntry = corpus.lectures.find((l) => l.id === link.lectureId);
        if (!lectureEntry) continue;
        try {
          const lecPath = path.join(/*turbopackIgnore: true*/ lecturesDir, lectureEntry.fileName);
          const raw = await fs.readFile(lecPath, "utf-8");
          const parsed = matter(raw);
          const mergedConcepts = Array.from(
            new Set([
              ...(Array.isArray(parsed.data.linkedConcepts) ? parsed.data.linkedConcepts : []),
              ...(link.linkedConcepts || []).filter((s) => validConcepts.has(s))
            ])
          );
          const mergedQuestions = Array.from(
            new Set([
              ...(Array.isArray(parsed.data.linkedQuestions) ? parsed.data.linkedQuestions : []),
              ...(link.linkedQuestions || []).filter((q) => validQuestions.has(q))
            ])
          );
          parsed.data.linkedConcepts = mergedConcepts;
          parsed.data.linkedQuestions = mergedQuestions;
          parsed.data.updatedAt = compiledAt;
          await fs.writeFile(lecPath, safeMatterStringify(parsed.content, parsed.data), "utf-8");
        } catch {}
      }

      return NextResponse.json({
        success: true,
        courseId,
        provider: aiResult.provider,
        model: aiResult.model,
        compiledAt,
        markdown,
        weeklyArc,
        crossLinks
      });
    }

    // action === "ask"
    const question = String(body.question || "").trim();
    if (!question) {
      return NextResponse.json({ error: "Question cannot be empty" }, { status: 400 });
    }

    const historyText = Array.isArray(body.history)
      ? body.history
          .slice(-6)
          .map((m: any) => `${m.role === "assistant" ? "Assistant" : "Student"}: ${String(m.content || "").slice(0, 600)}`)
          .join("\n")
      : "";

    const rawMatches = await searchRawTranscriptSnippets(courseDir, question);

    const systemInstruction = `You are a workspace-aware university STEM tutor answering questions strictly grounded in the student's ${courseId} course repository (distilled lecture notes, raw transcripts, extracted PDFs, concepts, and questions).
Output ONLY valid JSON matching the requested schema.
Use clean KaTeX LaTeX ($...$ inline, $$...$$ display).
For every claim taken from a lecture, include an entry in "citations" with the exact "lectureId", "title", "week", "timestamp" ("hh:mm:ss" if available, else "00:00:00"), "source" ("lecture" | "pdf" | "concept" | "question"), and brief "excerpt".
If the repository lacks the requested information, state that explicitly in "unverifiedGap" rather than guessing.`;

    const prompt = `${historyText ? `CONVERSATION HISTORY:\n${historyText}\n\n` : ""}STUDENT QUESTION:
${question}

${rawMatches ? `MATCHED RAW TRANSCRIPT EXCERPTS:\n${rawMatches}\n\n` : ""}COURSE CORPUS:
${corpusText}`;

    const schema = {
      type: "object",
      properties: {
        answer: { type: "string" },
        citations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              lectureId: { type: "string" },
              title: { type: "string" },
              week: { type: "number" },
              timestamp: { type: "string" },
              source: { type: "string", enum: ["lecture", "pdf", "concept", "question"] },
              excerpt: { type: "string" }
            },
            required: ["lectureId", "title", "week", "timestamp", "source"]
          }
        },
        unverifiedGap: { type: "string" }
      },
      required: ["answer", "citations"]
    };

    const aiResult = await runWorkspaceAwareAi<{
      answer: string;
      citations: {
        lectureId: string;
        title: string;
        week: number;
        timestamp: string;
        source: "lecture" | "pdf" | "concept" | "question";
        excerpt?: string;
      }[];
      unverifiedGap?: string;
    }>({
      courseId,
      systemInstruction,
      prompt,
      schema,
      aiSettings: body.aiSettings
    });

    return NextResponse.json({
      success: true,
      courseId,
      provider: aiResult.provider,
      model: aiResult.model,
      answer: aiResult.data?.answer || "",
      citations: Array.isArray(aiResult.data?.citations) ? aiResult.data.citations : [],
      unverifiedGap: aiResult.data?.unverifiedGap || ""
    });
  } catch (err: any) {
    console.error("POST /api/courses/notebook failed:", err);
    return NextResponse.json({ error: err.message || "Notebook operation failed" }, { status: 500 });
  }
}
