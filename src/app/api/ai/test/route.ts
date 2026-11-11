import { NextResponse } from "next/server";
import { resolveGeminiModel } from "@/lib/gemini-client";

export async function POST(req: Request) {
  const startTime = Date.now();
  try {
    const {
      provider,
      apiKey,
      model,
      geminiModel,
      openaiModel,
      anthropicModel,
      ollamaUrl,
      ollamaModel
    } = await req.json();

    if (provider === "gemini") {
      const key = apiKey || process.env.GEMINI_API_KEY;
      if (!key) {
        return NextResponse.json({ error: "Missing Gemini API key" }, { status: 400 });
      }

      const targetModel = await resolveGeminiModel(key, geminiModel || model);
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${key}`,
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
        throw new Error(data.error?.message || `Gemini API rejected key for model ${targetModel}`);
      }

      const latencyMs = Date.now() - startTime;
      return NextResponse.json({
        success: true,
        model: `Google Gemini (${targetModel})`,
        latencyMs
      });
    }

    if (provider === "openai") {
      const key = apiKey || process.env.OPENAI_API_KEY;
      if (!key) {
        return NextResponse.json({ error: "Missing OpenAI API key" }, { status: 400 });
      }

      const targetModel = openaiModel || model || "gpt-4o-mini";
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`
        },
        body: JSON.stringify({
          model: targetModel,
          messages: [{ role: "user", content: "Ping test. Respond with 'PONG'." }],
          max_tokens: 10
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || `OpenAI API rejected key for model ${targetModel}`);
      }

      const latencyMs = Date.now() - startTime;
      return NextResponse.json({
        success: true,
        model: `OpenAI (${targetModel})`,
        latencyMs
      });
    }

    if (provider === "anthropic") {
      const key = apiKey || process.env.ANTHROPIC_API_KEY;
      if (!key) {
        return NextResponse.json({ error: "Missing Anthropic API key" }, { status: 400 });
      }

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
          max_tokens: 10,
          messages: [{ role: "user", content: "Ping test. Respond with 'PONG'." }]
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || `Anthropic API rejected key for model ${targetModel}`);
      }

      const latencyMs = Date.now() - startTime;
      return NextResponse.json({
        success: true,
        model: `Anthropic (${targetModel})`,
        latencyMs
      });
    }

    if (provider === "ollama") {
      const targetUrl = ollamaUrl || "http://localhost:11434";
      const targetModel = ollamaModel || model || "llama3";

      const res = await fetch(`${targetUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: targetModel,
          prompt: "Ping test. Respond with 'PONG'.",
          stream: false
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Ollama rejected model ${targetModel}`);
      }

      const latencyMs = Date.now() - startTime;
      return NextResponse.json({
        success: true,
        model: `Ollama (${targetModel})`,
        latencyMs
      });
    }

    return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to connect to AI provider" },
      { status: 500 }
    );
  }
}
