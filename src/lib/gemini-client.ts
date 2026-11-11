/**
 * src/lib/gemini-client.ts
 * Client-side Google Gemini integration for static GitHub Pages and offline study hubs.
 * Runs directly in the browser via Google AI Studio API without requiring a local Node backend.
 */

import { ProofReviewResult } from "./types";

let cachedGeminiModel: string | null = null;

/**
 * Dynamically resolves the best supported Gemini model for this API key,
 * or validates the user-selected model.
 */
export async function resolveGeminiModel(apiKey: string, preferredModel?: string): Promise<string> {
  if (preferredModel && preferredModel.trim() && preferredModel !== "auto") {
    return preferredModel.trim().replace(/^models\//, "");
  }

  if (cachedGeminiModel) return cachedGeminiModel;

  const key = apiKey.trim();
  const candidatePreferences = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash-8b",
    "gemini-1.5-flash",
    "gemini-2.5-pro",
    "gemini-1.5-pro",
    "gemini-1.5-pro-latest"
  ];

  try {
    const listRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`
    );
    if (listRes.ok) {
      const listData = await listRes.json();
      const availableModels: string[] = (listData.models || [])
        .filter((m: any) => m.supportedGenerationMethods?.includes("generateContent"))
        .map((m: any) => m.name.replace(/^models\//, ""));

      for (const pref of candidatePreferences) {
        if (availableModels.includes(pref)) {
          cachedGeminiModel = pref;
          return pref;
        }
      }
      if (availableModels.length > 0) {
        cachedGeminiModel = availableModels[0];
        return availableModels[0];
      }
    }
  } catch (err) {
    console.warn("Could not query Gemini ListModels dynamically:", err);
  }

  // Default fallback to 2.5-flash
  cachedGeminiModel = "gemini-2.5-flash";
  return "gemini-2.5-flash";
}

/**
 * Fetches all available generateContent models for a given Google Gemini API Key.
 */
export async function listAvailableGeminiModels(apiKey: string): Promise<string[]> {
  const key = apiKey.trim();
  if (!key) return [];
  try {
    const listRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`
    );
    if (listRes.ok) {
      const listData = await listRes.json();
      const models: string[] = (listData.models || [])
        .filter((m: any) => m.supportedGenerationMethods?.includes("generateContent"))
        .map((m: any) => m.name.replace(/^models\//, ""));
      if (models.length > 0) return models;
    }
  } catch (err) {
    console.warn("Could not list Gemini models:", err);
  }
  return [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash-latest",
    "gemini-2.5-pro",
    "gemini-1.5-pro"
  ];
}

const SYSTEM_AUDITOR_PROMPT = `You are an expert university mathematics professor and rigorous proof auditor.
Your job is to critically evaluate a university student's typed mathematical proof against the official lecturer benchmark and relevant mathematical definitions.

Be obsessive about mathematical rigor:
1. Check for missing hypotheses (e.g. did they verify boundedness, completeness, compactness, non-emptiness, continuity, or domain restrictions before invoking a theorem?).
2. Check for logical leaps or unjustified assertions (stating something is "obvious" when it requires justification).
3. Check for quantifier precision (confusing forall with exists, pointwise vs uniform).
4. If the student uses a valid alternative method different from the lecturer's, ACCEPT and PRAISE it if it is mathematically sound. Do NOT penalize the student just because their approach differs from the benchmark.
5. Provide constructive feedback and a suggested LaTeX patch demonstrating how to complete or fix any gaps.

CRITICAL: You must reply ONLY with a valid JSON object matching this schema:
{
  "verdict": "Rigorous Proof" | "Correct with Minor Gaps" | "Missing Hypotheses" | "Flawed Logic",
  "score": number (integer 0 to 10),
  "summary": "1-2 sentence high-level appraisal",
  "missingHypotheses": ["string"],
  "logicalGaps": ["string"],
  "strengths": ["string"],
  "suggestedPatch": "string containing LaTeX patch to fix gaps",
  "alternativeMethodNotes": "optional string or null"
}`;

export async function testGeminiKey(apiKey: string, modelOverride?: string): Promise<{ success: boolean; latencyMs: number; error?: string; model?: string }> {
  const startTime = Date.now();
  const key = apiKey.trim();
  try {
    const model = await resolveGeminiModel(key, modelOverride);
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Ping test. Respond with 'PONG'." }] }]
        })
      }
    );

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || `Invalid or restricted Gemini API Key (${res.status})`);
    }

    const latencyMs = Date.now() - startTime;
    return { success: true, latencyMs, model };
  } catch (err: any) {
    return { success: false, latencyMs: 0, error: err.message || "Failed to reach Google Gemini API" };
  }
}

export async function auditProofWithGemini(params: {
  prompt: string;
  official?: string;
  conceptsContext?: string;
  studentSolution: string;
  apiKey: string;
  model?: string;
}): Promise<ProofReviewResult> {
  const { prompt, official, conceptsContext, studentSolution, apiKey, model: userModel } = params;
  const key = apiKey.trim();
  const model = await resolveGeminiModel(key, userModel);

  const userPrompt = `[QUESTION PROMPT]
${prompt}

[OFFICIAL / BENCHMARK SOLUTION]
${official || "(No official solution provided; evaluate proof on pure mathematical rigor alone.)"}

[RELEVANT COURSE CONCEPTS & DEFINITIONS]
${conceptsContext || "(None provided)"}

[STUDENT'S PROOF TO AUDIT]
${studentSolution}

Audit the student's proof and output the JSON review:`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: `${SYSTEM_AUDITOR_PROMPT}\n\n${userPrompt}` }]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json"
        }
      })
    }
  );

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || "Gemini API request failed");
  }

  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  let cleaned = rawText.trim();
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  return JSON.parse(cleaned) as ProofReviewResult;
}
