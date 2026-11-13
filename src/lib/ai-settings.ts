import { isLocalStudio } from "./pack-loader";
import { AIProvider, AISettings } from "./types";

export const DEFAULT_ANTIGRAVITY_MODEL_ID = "gemini-4-hydrogen-high";
export const DEFAULT_GEMINI_MODEL_ID = "gemini-4-hydrogen";
export const DEFAULT_BATCH_PROVIDER: AIProvider = "gemini";
export const DEFAULT_BATCH_MODEL_ID = "gemini-4-hydrogen";
export const DEFAULT_BATCH_THINKING_LEVEL = "low" as const;

export function getDefaultAiSettings(local: boolean = isLocalStudio()): AISettings {
  return {
    provider: local ? "antigravity" : "gemini",
    antigravityModel: DEFAULT_ANTIGRAVITY_MODEL_ID,
    geminiKey: "",
    geminiModel: DEFAULT_GEMINI_MODEL_ID,
    openaiKey: "",
    openaiModel: "gpt-4o-mini",
    anthropicKey: "",
    anthropicModel: "claude-3-5-sonnet-20241022",
    ollamaUrl: "http://localhost:11434",
    ollamaModel: "llama3",
    useBatchEngine: true,
    batchProvider: DEFAULT_BATCH_PROVIDER,
    batchModel: DEFAULT_BATCH_MODEL_ID,
    batchThinkingLevel: DEFAULT_BATCH_THINKING_LEVEL,
    batchOllamaModel: "qwen2.5:7b-instruct"
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
      provider: parsed.provider || defaults.provider,
      antigravityModel: parsed.antigravityModel || defaults.antigravityModel,
      batchThinkingLevel: parsed.batchThinkingLevel || defaults.batchThinkingLevel
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
      return settings.geminiModel || DEFAULT_GEMINI_MODEL_ID;
    case "openai":
      return settings.openaiModel || "gpt-4o-mini";
    case "anthropic":
      return settings.anthropicModel || "claude-3-5-sonnet-20241022";
    case "ollama":
      return settings.ollamaModel || "llama3";
  }
}

function getKeyForProvider(settings: AISettings, provider: AIProvider): string | undefined {
  if (provider === "gemini") return settings.geminiKey?.trim() || undefined;
  if (provider === "openai") return settings.openaiKey?.trim() || undefined;
  if (provider === "anthropic") return settings.anthropicKey?.trim() || undefined;
  return undefined;
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
 * Normalizes primary AI settings for Workspace-Aware tasks (Notebook synthesis, Q&A, Proof auditing).
 */
export function normalizeAiPayload(settings: AISettings) {
  return {
    provider: settings.provider,
    apiKey: getKeyForProvider(settings, settings.provider),
    geminiFallbackKey: settings.geminiKey?.trim() || undefined,
    model: getActiveAiModel(settings),
    antigravityModel: settings.antigravityModel || DEFAULT_ANTIGRAVITY_MODEL_ID,
    geminiModel: settings.geminiModel || DEFAULT_GEMINI_MODEL_ID,
    openaiModel: settings.openaiModel,
    anthropicModel: settings.anthropicModel,
    ollamaUrl: settings.ollamaUrl || "http://localhost:11434",
    ollamaModel: settings.ollamaModel || "qwen2.5:7b-instruct"
  };
}

/**
 * Resolves the Stage 1 Batch Lecture Engine payload.
 * When `useBatchEngine` is enabled and credentials for `batchProvider` (default Gemini API Hydrogen + `low` thinking)
 * exist, routes heavy multi-hour transcripts there while attaching `geminiFallbackKey` for `.m4a` audio fallback.
 */
export function normalizeBatchAiPayload(settings: AISettings) {
  const base = normalizeAiPayload(settings);
  if (settings.useBatchEngine === false) {
    return base;
  }

  const batchProvider = settings.batchProvider || DEFAULT_BATCH_PROVIDER;
  const batchKey = getKeyForProvider(settings, batchProvider);
  const needsKey = batchProvider === "gemini" || batchProvider === "openai" || batchProvider === "anthropic";

  // If batchProvider needs a key that isn't configured yet, gracefully fall back to primary configured provider
  if (needsKey && !batchKey) {
    return base;
  }

  const batchModel =
    batchProvider === "ollama"
      ? settings.batchOllamaModel || settings.ollamaModel || "qwen2.5:7b-instruct"
      : settings.batchModel || (batchProvider === "gemini" ? DEFAULT_BATCH_MODEL_ID : base.model);

  return {
    ...base,
    provider: batchProvider,
    apiKey: batchKey,
    model: batchModel,
    thinkingLevel: settings.batchThinkingLevel || DEFAULT_BATCH_THINKING_LEVEL,
    antigravityModel: batchProvider === "antigravity" ? batchModel : base.antigravityModel,
    geminiModel: batchProvider === "gemini" ? batchModel : base.geminiModel,
    openaiModel: batchProvider === "openai" ? batchModel : base.openaiModel,
    anthropicModel: batchProvider === "anthropic" ? batchModel : base.anthropicModel,
    ollamaModel: batchProvider === "ollama" ? batchModel : base.ollamaModel
  };
}
