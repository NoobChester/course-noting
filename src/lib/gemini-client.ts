/**
 * src/lib/gemini-client.ts
 * Client-side Google Gemini integration for static GitHub Pages and offline study hubs.
 * Runs directly in the browser via Google AI Studio API without requiring a local Node backend.
 */

import { ProofReviewResult } from "./types";

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

export async function testGeminiKey(apiKey: string): Promise<{ success: boolean; latencyMs: number; error?: string }> {
  const startTime = Date.now();
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`,
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
      throw new Error(data.error?.message || "Invalid or restricted Gemini API Key");
    }

    const latencyMs = Date.now() - startTime;
    return { success: true, latencyMs };
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
}): Promise<ProofReviewResult> {
  const { prompt, official, conceptsContext, studentSolution, apiKey } = params;

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
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`,
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
