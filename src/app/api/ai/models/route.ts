import { NextRequest, NextResponse } from "next/server";
import { listAvailableGeminiModels } from "@/lib/gemini-client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const provider = searchParams.get("provider") || "gemini";
    const apiKey = searchParams.get("key") || "";
    const ollamaUrl = searchParams.get("url") || "http://localhost:11434";

    if (provider === "gemini") {
      const key = apiKey || process.env.GEMINI_API_KEY || "";
      const models = await listAvailableGeminiModels(key);
      return NextResponse.json({ success: true, provider: "gemini", models });
    }

    if (provider === "ollama") {
      try {
        const res = await fetch(`${ollamaUrl}/api/tags`);
        if (res.ok) {
          const data = await res.json();
          const models = (data.models || []).map((m: any) => m.name);
          return NextResponse.json({ success: true, provider: "ollama", models });
        }
      } catch (err: any) {
        console.warn("Could not query Ollama tags:", err);
      }
      return NextResponse.json({
        success: true,
        provider: "ollama",
        models: ["llama3", "qwen2.5:7b-instruct", "deepseek-r1:8b", "mistral", "phi3"]
      });
    }

    if (provider === "openai") {
      return NextResponse.json({
        success: true,
        provider: "openai",
        models: [
          "gpt-4o-mini",
          "gpt-4o",
          "o3-mini",
          "o1-mini",
          "o1-preview",
          "gpt-4-turbo"
        ]
      });
    }

    if (provider === "anthropic") {
      return NextResponse.json({
        success: true,
        provider: "anthropic",
        models: [
          "claude-3-5-sonnet-20241022",
          "claude-3-5-haiku-20241022",
          "claude-3-opus-20240229"
        ]
      });
    }

    return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to list models" }, { status: 500 });
  }
}
