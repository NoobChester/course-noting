import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const startTime = Date.now();
  try {
    const { provider, apiKey, ollamaUrl, ollamaModel } = await req.json();

    if (provider === "gemini") {
      const key = apiKey || process.env.GEMINI_API_KEY;
      if (!key) {
        return NextResponse.json({ error: "Missing Gemini API key" }, { status: 400 });
      }

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
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
        throw new Error(data.error?.message || "Gemini API rejected key");
      }

      const latencyMs = Date.now() - startTime;
      return NextResponse.json({
        success: true,
        model: "Gemini 1.5 Flash",
        latencyMs
      });
    }

    if (provider === "openai") {
      const key = apiKey || process.env.OPENAI_API_KEY;
      if (!key) {
        return NextResponse.json({ error: "Missing OpenAI API key" }, { status: 400 });
      }

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: "Ping test. Respond with 'PONG'." }],
          max_tokens: 10
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "OpenAI API rejected key");
      }

      const latencyMs = Date.now() - startTime;
      return NextResponse.json({
        success: true,
        model: "GPT-4o Mini",
        latencyMs
      });
    }

    if (provider === "anthropic") {
      const key = apiKey || process.env.ANTHROPIC_API_KEY;
      if (!key) {
        return NextResponse.json({ error: "Missing Anthropic API key" }, { status: 400 });
      }

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 10,
          messages: [{ role: "user", content: "Ping test. Respond with 'PONG'." }]
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Anthropic API rejected key");
      }

      const latencyMs = Date.now() - startTime;
      return NextResponse.json({
        success: true,
        model: "Claude 3.5 Sonnet",
        latencyMs
      });
    }

    if (provider === "ollama") {
      const targetUrl = (ollamaUrl || "http://localhost:11434").replace(/\/$/, "");
      const model = ollamaModel || "llama3";

      const res = await fetch(`${targetUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          prompt: "Ping test. Respond with 'PONG'.",
          stream: false
        })
      });

      if (!res.ok) {
        throw new Error(`Ollama server at ${targetUrl} returned HTTP ${res.status}`);
      }

      const latencyMs = Date.now() - startTime;
      return NextResponse.json({
        success: true,
        model: `Ollama (${model})`,
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
