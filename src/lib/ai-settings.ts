import { isLocalStudio } from "./pack-loader";
import { AISettings } from "./types";

export const DEFAULT_ANTIGRAVITY_MODEL_ID = "gemini-4-hydrogen-medium";

export function getDefaultAiSettings(local: boolean = isLocalStudio()): AISettings {
  return {
    provider: local ? "antigravity" : "gemini",
    antigravityModel: DEFAULT_ANTIGRAVITY_MODEL_ID,
    geminiKey: "",
    geminiModel: "gemini-2.5-flash",
    openaiKey: "",
    openaiModel: "gpt-4o-mini",
    anthropicKey: "",
    anthropicModel: "claude-3-5-sonnet-20241022",
    ollamaUrl: "http://localhost:11434",
    ollamaModel: "llama3"
  };
}

/**
 * Loads `cn_ai_settings` from browser storage, defaulting to Antigravity in Local Studio when unset.
 */
export function loadClientAiSettings(local: boolean = isLocalStudio()): AISettings {
  const defaults = getDefaultAiSettings(local);
  if (typeof window === "undefined") return defaults;

  try {
    const stored = localStorage.getItem("cn_ai_settings");
    if (!stored) return defaults;
    const parsed = JSON.parse(stored);
    if (!parsed || typeof parsed !== "object") return defaults;
    return {
      ...defaults,
      ...parsed,
      provider: parsed.provider || defaults.provider
    };
  } catch {
    return defaults;
  }
}

export function getActiveAiModel(settings: AISettings): string {
  switch (settings.provider) {
    case "antigravity":
      return settings.antigravityModel || DEFAULT_ANTIGRAVITY_MODEL_ID;
    case "gemini":
      return settings.geminiModel || "gemini-2.5-flash";
    case "openai":
      return settings.openaiModel || "gpt-4o-mini";
    case "anthropic":
      return settings.anthropicModel || "claude-3-5-sonnet-20241022";
    case "ollama":
      return settings.ollamaModel || "llama3";
  }
}

export function isAiSettingsConfigured(
  settings: AISettings | null | undefined,
  local: boolean = isLocalStudio()
): boolean {
  if (!settings) return local;
  return Boolean(
    settings.provider === "antigravity" ||
      settings.provider === "ollama" ||
      (settings.provider === "gemini" && settings.geminiKey?.trim()) ||
      (settings.provider === "openai" && settings.openaiKey?.trim()) ||
      (settings.provider === "anthropic" && settings.anthropicKey?.trim())
  );
}

/**
 * Normalizes stored AI settings into the unified payload consumed by Local Studio API routes.
 */
export function normalizeAiPayload(settings: AISettings) {
  const apiKey =
    settings.provider === "gemini"
      ? settings.geminiKey
      : settings.provider === "openai"
      ? settings.openaiKey
      : settings.provider === "anthropic"
      ? settings.anthropicKey
      : undefined;

  return {
    provider: settings.provider,
    apiKey: apiKey?.trim(),
    model: getActiveAiModel(settings),
    antigravityModel: settings.antigravityModel || DEFAULT_ANTIGRAVITY_MODEL_ID,
    geminiModel: settings.geminiModel,
    openaiModel: settings.openaiModel,
    anthropicModel: settings.anthropicModel,
    ollamaUrl: settings.ollamaUrl || "http://localhost:11434",
    ollamaModel: settings.ollamaModel || "qwen2.5:7b-instruct"
  };
}
