import { NextRequest, NextResponse } from "next/server";
import { LectureInsight, QuestionHintInsight } from "@/lib/types";
import { resolveGeminiModel } from "@/lib/gemini-client";
import {
  DEFAULT_ANTIGRAVITY_MODEL,
  LECTURE_DISTILLATION_JSON_SCHEMA,
  resolveCourseWorkspaceDir,
  runAntigravityPrompt
} from "@/lib/antigravity-client";

function pruneTranscriptNoise(rawText: string): string {
  const lines = rawText.split("\n");
  const cleaned: string[] = [];
  let prevLine = "";

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    // Strip VTT timestamps like "00:01:23.000 --> 00:01:25.000"
    if (line.includes("-->")) continue;
    // Strip WEBVTT header and cue counters
    if (/^(WEBVTT|NOTE|STYLE|\d+)$/i.test(line)) continue;
    // Strip repetitive consecutive lines
    if (line.toLowerCase() === prevLine.toLowerCase()) continue;

    cleaned.push(line);
    prevLine = line;
  }

  return cleaned.join("\n");
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

export async function POST(req: NextRequest) {
  try {
    const {
      courseId = "math3701",
      week = 1,
      lectureTitle = "Lecture Notes",
      slideText = "",
      transcriptText = "",
      provider = "gemini",
      apiKey,
      model,
      antigravityModel,
      geminiModel,
      openaiModel,
      anthropicModel,
      ollamaUrl = "http://localhost:11434",
      ollamaModel = "qwen2.5:7b-instruct"
    } = await req.json();

    if (!transcriptText && !slideText) {
      return NextResponse.json(
        { error: "Please provide either transcript text or slide text." },
        { status: 400 }
      );
    }

    const prunedTranscript = pruneTranscriptNoise(transcriptText);

    const systemPrompt = `You are an expert university mathematics teaching assistant and mathematical note extractor.
Your job is to read raw lecture materials (slide deck notes + spoken speech-to-text transcript) and distill high-yield study notes formatted with LaTeX ($...$ inline, $$...$$ display).

DO NOT output conversational commentary. Output strictly valid JSON matching this schema:
{
  "title": "Concise descriptive lecture title",
  "outline": ["Topic 1", "Topic 2", "Topic 3"],
  "distilledContent": "Comprehensive Markdown study note formatted with KaTeX ($...$). Include definitions, formulas, and proof sketches.",
  "insights": [
    {
      "conceptSlug": "slug-name-or-empty",
      "type": "intuition",
      "title": "Title of intuition or analogy",
      "timestamp": "hh:mm:ss if mentioned or empty",
      "content": "KaTeX explanation of the spoken mental model or visual picture"
    },
    {
      "conceptSlug": "slug-name-or-empty",
      "type": "exam_warning",
      "title": "Title of warning",
      "timestamp": "hh:mm:ss if mentioned or empty",
      "content": "What mistake or trap the lecturer warned students about on exams"
    }
  ],
  "questionHints": [
    {
      "questionId": "q-001 or general-topic",
      "timestamp": "hh:mm:ss",
      "hint": "Spoken heuristic or problem-solving hint mentioned during the lecture"
    }
  ]
}`;

    const userPrompt = `Course: ${courseId.toUpperCase()} (Week ${week})
Lecture Candidate: ${lectureTitle}

--- SLIDE TEXT ---
${slideText.slice(0, 15000)}

--- SPOKEN TRANSCRIPT (PRUNED) ---
${prunedTranscript.slice(0, 25000)}

Extract the high-yield value JSON now:`;

    let parsedResult: any = null;

    if (provider === "antigravity") {
      const targetModel = antigravityModel || model || DEFAULT_ANTIGRAVITY_MODEL;
      const workspaceDir = await resolveCourseWorkspaceDir(courseId);
      const agyRes = await runAntigravityPrompt<any>({
        prompt: userPrompt,
        systemInstruction: systemPrompt,
        model: targetModel,
        workspaceDir,
        schema: LECTURE_DISTILLATION_JSON_SCHEMA,
        timeoutMs: 240000
      });
      parsedResult = agyRes.parsed;
    } else if (provider === "gemini") {
      const key = apiKey || process.env.GEMINI_API_KEY;
      if (!key) return NextResponse.json({ error: "Missing Gemini API key" }, { status: 400 });

      const targetModel = await resolveGeminiModel(key, geminiModel || model);
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
            generationConfig: { responseMimeType: "application/json" }
          })
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || `Gemini API failed for model ${targetModel}`);
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      parsedResult = extractJson(rawText);
    } else if (provider === "anthropic") {
      const key = apiKey || process.env.ANTHROPIC_API_KEY;
      if (!key) return NextResponse.json({ error: "Missing Anthropic API key" }, { status: 400 });

      const targetModel = anthropicModel || model || "claude-3-5-sonnet-20241022";
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
    } else if (provider === "openai") {
      const key = apiKey || process.env.OPENAI_API_KEY;
      if (!key) return NextResponse.json({ error: "Missing OpenAI API key" }, { status: 400 });

      const targetModel = openaiModel || model || "gpt-4o-mini";
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`
        },
        body: JSON.stringify({
          model: targetModel,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ]
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || `OpenAI API failed for model ${targetModel}`);
      const rawText = data.choices?.[0]?.message?.content || "{}";
      parsedResult = extractJson(rawText);
    } else {
      // Default: Ollama (Local)
      const targetModel = ollamaModel || model || "qwen2.5:7b-instruct";
      const res = await fetch(`${ollamaUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: targetModel,
          prompt: `${systemPrompt}\n\n${userPrompt}`,
          stream: false,
          format: "json",
          options: { temperature: 0.2 }
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Ollama API failed for model ${targetModel}`);
      parsedResult = extractJson(data.response);
    }

    return NextResponse.json({
      success: true,
      result: parsedResult
    });
  } catch (err: any) {
    console.error("Error in /api/lectures/enrich:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
