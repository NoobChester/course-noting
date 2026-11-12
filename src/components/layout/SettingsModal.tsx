"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Cpu,
  Sparkles,
  Eye,
  EyeOff
} from "lucide-react";
import { AIProvider, AISettings } from "@/lib/types";
import { isLocalStudio } from "@/lib/pack-loader";
import { testGeminiKey, listAvailableGeminiModels } from "@/lib/gemini-client";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_SETTINGS: AISettings = {
  provider: "gemini",
  antigravityModel: "gemini-4-hydrogen-medium",
  geminiKey: "",
  geminiModel: "gemini-2.5-flash",
  openaiKey: "",
  openaiModel: "gpt-4o-mini",
  anthropicKey: "",
  anthropicModel: "claude-3-5-sonnet-20241022",
  ollamaUrl: "http://localhost:11434",
  ollamaModel: "llama3"
};

const DEFAULT_ANTIGRAVITY_PRESETS = [
  { id: "gemini-4-hydrogen-medium", label: "Gemini 4 Hydrogen Medium" },
  { id: "gemini-4-hydrogen-high", label: "Gemini 4 Hydrogen High" },
  { id: "gemini-4-hydrogen-low", label: "Gemini 4 Hydrogen Low" },
  { id: "gemini-4-argon-medium", label: "Gemini 4 Argon Medium" },
  { id: "gemini-3.8-flash-medium", label: "Gemini 3.8 Flash Medium" },
  { id: "gemini-3.8-flash-low", label: "Gemini 3.8 Flash Low" },
  { id: "claude-sonnet-5-5-medium", label: "Claude Sonnet 5.5 Medium" },
  { id: "claude-opus-5-5-medium", label: "Claude Opus 5.5 Medium" }
];

const DEFAULT_GEMINI_PRESETS = [
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", badge: "Recommended", desc: "Latest high-speed multimodal model" },
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", badge: "Fast", desc: "Next-generation low-latency engine" },
  { id: "gemini-2.0-flash-lite", name: "Gemini 2.0 Flash Lite", badge: "Ultra Fast", desc: "Highest throughput, economical" },
  { id: "gemini-1.5-flash-latest", name: "Gemini 1.5 Flash", badge: "Stable", desc: "Proven 1.5 architecture" },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", badge: "Deep Reasoning", desc: "Complex mathematical proofs & derivations" },
  { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", badge: "Long Context", desc: "Exhaustive lecture analysis" }
];

const DEFAULT_OPENAI_PRESETS = [
  { id: "gpt-4o-mini", name: "GPT-4o Mini", badge: "Recommended", desc: "Fast and affordable" },
  { id: "gpt-4o", name: "GPT-4o", badge: "Flagship", desc: "Full multimodal intelligence" },
  { id: "o3-mini", name: "o3-mini", badge: "STEM Reasoning", desc: "Advanced step-by-step thinking" },
  { id: "o1-mini", name: "o1-mini", badge: "Math Reasoning", desc: "Focused mathematics reasoner" },
  { id: "gpt-4-turbo", name: "GPT-4 Turbo", badge: "Classic", desc: "High precision" }
];

const DEFAULT_ANTHROPIC_PRESETS = [
  { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet", badge: "Recommended", desc: "Top-tier STEM & rigorous proof auditing" },
  { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku", badge: "Fast", desc: "High throughput note distillation" },
  { id: "claude-3-opus-20240229", name: "Claude 3 Opus", badge: "Analytical", desc: "In-depth mathematical analysis" }
];

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [settings, setSettings] = useState<AISettings>(DEFAULT_SETTINGS);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isLocal, setIsLocal] = useState(true);

  // Dynamic model discovery states
  const [availableAntigravityModels, setAvailableAntigravityModels] = useState<
    { id: string; label: string }[]
  >(DEFAULT_ANTIGRAVITY_PRESETS);
  const [availableGeminiModels, setAvailableGeminiModels] = useState<string[]>(
    DEFAULT_GEMINI_PRESETS.map((p) => p.id)
  );
  const [availableOllamaModels, setAvailableOllamaModels] = useState<string[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [customModelMode, setCustomModelMode] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const local = isLocalStudio();
    setIsLocal(local);
    if (isOpen) {
      setTestResult(null);
      setSavedSuccess(false);
      const localDefaults: AISettings = {
        ...DEFAULT_SETTINGS,
        provider: local ? "antigravity" : "gemini"
      };
      try {
        const stored = localStorage.getItem("cn_ai_settings");
        if (stored) {
          setSettings({ ...localDefaults, ...JSON.parse(stored) });
        } else {
          setSettings(localDefaults);
        }
      } catch (err) {
        console.error("Failed to load AI settings:", err);
        setSettings(localDefaults);
      }

      if (local) {
        fetch("/api/ai/models?provider=antigravity")
          .then((r) => (r.ok ? r.json() : null))
          .then((data) => {
            if (data?.modelOptions && Array.isArray(data.modelOptions) && data.modelOptions.length > 0) {
              setAvailableAntigravityModels(data.modelOptions);
            } else if (Array.isArray(data?.models) && data.models.length > 0) {
              setAvailableAntigravityModels(data.models.map((id: string) => ({ id, label: id })));
            }
          })
          .catch(() => {
            // Keep default presets cleanly
          });
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = () => {
    try {
      localStorage.setItem("cn_ai_settings", JSON.stringify(settings));
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFetchAntigravityModels = async () => {
    setFetchingModels(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/ai/models?provider=antigravity");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to query agy CLI");

      const opts: { id: string; label: string }[] = Array.isArray(data.modelOptions)
        ? data.modelOptions
        : Array.isArray(data.models)
        ? data.models.map((id: string) => ({ id, label: id }))
        : [];

      if (opts.length > 0) {
        setAvailableAntigravityModels(opts);
        if (!opts.some((m) => m.id === (settings.antigravityModel || ""))) {
          setSettings((prev) => ({ ...prev, antigravityModel: opts[0].id }));
        }
        setTestResult({
          success: true,
          message: `Discovered ${opts.length} models from local Antigravity CLI!`
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Failed to fetch Antigravity models: ${err.message}`
      });
    } finally {
      setFetchingModels(false);
    }
  };

  const handleFetchGeminiModels = async () => {
    if (!settings.geminiKey?.trim()) {
      setTestResult({
        success: false,
        message: "Please enter your Gemini API key first to discover available models."
      });
      return;
    }
    setFetchingModels(true);
    setTestResult(null);
    try {
      const models = await listAvailableGeminiModels(settings.geminiKey.trim());
      if (models && models.length > 0) {
        setAvailableGeminiModels(models);
        if (!models.includes(settings.geminiModel || "")) {
          setSettings((prev) => ({ ...prev, geminiModel: models[0] }));
        }
        setTestResult({
          success: true,
          message: `Discovered ${models.length} available models for your Gemini API key!`
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Failed to fetch Gemini models: ${err.message}`
      });
    } finally {
      setFetchingModels(false);
    }
  };

  const handleFetchOllamaModels = async () => {
    setFetchingModels(true);
    setTestResult(null);
    try {
      const targetUrl = settings.ollamaUrl || "http://localhost:11434";
      const res = await fetch(`${targetUrl}/api/tags`);
      if (res.ok) {
        const data = await res.json();
        const models = (data.models || []).map((m: any) => m.name);
        if (models.length > 0) {
          setAvailableOllamaModels(models);
          if (!models.includes(settings.ollamaModel || "")) {
            setSettings((prev) => ({ ...prev, ollamaModel: models[0] }));
          }
          setTestResult({
            success: true,
            message: `Found ${models.length} local Ollama models installed!`
          });
          return;
        }
      }
      throw new Error("No installed models returned by Ollama server");
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Could not reach Ollama at ${settings.ollamaUrl}: ${err.message}`
      });
    } finally {
      setFetchingModels(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    const currentKey =
      settings.provider === "gemini"
        ? settings.geminiKey
        : settings.provider === "openai"
        ? settings.openaiKey
        : settings.provider === "anthropic"
        ? settings.anthropicKey
        : "";

    const currentModel =
      settings.provider === "antigravity"
        ? settings.antigravityModel
        : settings.provider === "gemini"
        ? settings.geminiModel
        : settings.provider === "openai"
        ? settings.openaiModel
        : settings.provider === "anthropic"
        ? settings.anthropicModel
        : settings.ollamaModel;

    if (settings.provider !== "ollama" && settings.provider !== "antigravity" && !currentKey?.trim()) {
      setTesting(false);
      setTestResult({
        success: false,
        message: `Please enter an API key for ${settings.provider.toUpperCase()} first.`
      });
      return;
    }

    // Client-side execution on GitHub Pages
    if (!isLocal) {
      if (settings.provider === "ollama") {
        setTesting(false);
        setTestResult({
          success: false,
          message:
            "Local Ollama is only available in Localhost Studio (http://localhost:3000). On static GitHub Pages, browsers block connections to local endpoints (http://localhost:11434). Please switch to Google Gemini (Free Tier) to use AI on GitHub Pages, or run 'npm run dev' on your computer."
        });
        return;
      }

      if (settings.provider === "antigravity") {
        setTesting(false);
        setTestResult({
          success: false,
          message:
            "Antigravity Local Bridge requires Localhost Studio ('npm run dev'). On static GitHub Pages, switch to Google Gemini (Free Tier) with an API key."
        });
        return;
      }

      if (settings.provider === "gemini") {
        const result = await testGeminiKey(currentKey?.trim() || "", currentModel);
        setTesting(false);
        if (result.success) {
          setTestResult({
            success: true,
            message: `Connection successful! ${result.model || "Google Gemini"} responded in ${result.latencyMs}ms directly in browser.`
          });
        } else {
          setTestResult({
            success: false,
            message: result.error || "Failed to reach Google Gemini API."
          });
        }
        return;
      }
    }

    // Local Studio Node API execution
    try {
      const res = await fetch("/api/ai/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: settings.provider,
          apiKey: currentKey?.trim(),
          model: currentModel,
          antigravityModel: settings.antigravityModel,
          geminiModel: settings.geminiModel,
          openaiModel: settings.openaiModel,
          anthropicModel: settings.anthropicModel,
          ollamaUrl: settings.ollamaUrl,
          ollamaModel: settings.ollamaModel
        })
      });

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error(
            settings.provider === "ollama"
              ? "Local Ollama requires Localhost Studio (npm run dev). On static GitHub Pages, there is no local backend to connect to http://localhost:11434. Please switch to Google Gemini (Free Tier) in Settings."
              : "API endpoint not found on static GitHub Pages. Please switch to Google Gemini (Free Tier) or run locally."
          );
        }
        let errMsg = "Connection test failed";
        try {
          const errData = await res.json();
          errMsg = errData.error || errMsg;
        } catch {}
        throw new Error(errMsg);
      }

      const data = await res.json();

      setTestResult({
        success: true,
        message: `Connection successful! ${data.model} responded in ${data.latencyMs}ms.`
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || "Failed to reach AI provider."
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30 flex items-center justify-center font-bold">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <span>AI Intelligence & Distillation Settings</span>
              </h2>
              <p className="text-xs text-zinc-400">
                Configure your AI model for proof auditing and lecture notes distillation.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Privacy Note */}
          <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-300 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong>100% Private & Repo Safe:</strong> Your API key and preferences are stored exclusively inside your local browser storage. They are never committed to Git.
            </div>
          </div>

          {/* Provider Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-300">Choose AI Provider</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSettings({ ...settings, provider: "antigravity" })}
                className={`p-3 rounded-xl border text-left transition cursor-pointer col-span-2 ${
                  settings.provider === "antigravity"
                    ? "bg-violet-600/20 border-violet-500 text-white shadow-xs"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <div className="text-xs font-bold flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span>🛸 Antigravity (Local Studio)</span>
                    <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-violet-950 text-violet-400 font-semibold border border-violet-800">
                      Zero API Key
                    </span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-medium">Workspace-Aware</span>
                </div>
                <div className="text-[10px] text-zinc-500 mt-1">
                  Routes lecture distillation and proof auditing through your authenticated local Antigravity CLI (`agy`) with read-only course workspace awareness.
                </div>
              </button>
              <button
                type="button"
                onClick={() => setSettings({ ...settings, provider: "gemini" })}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  settings.provider === "gemini"
                    ? "bg-indigo-600/15 border-indigo-500 text-white shadow-xs"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <span>Google Gemini</span>
                  <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 font-semibold border border-emerald-800">
                    Free Tier
                  </span>
                </div>
                <div className="text-[10px] text-zinc-500 mt-1">Gemini 2.5 / 2.0 Flash (Fast & accurate)</div>
              </button>

              <button
                type="button"
                onClick={() => setSettings({ ...settings, provider: "openai" })}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  settings.provider === "openai"
                    ? "bg-indigo-600/15 border-indigo-500 text-white shadow-xs"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <div className="text-xs font-bold">OpenAI</div>
                <div className="text-[10px] text-zinc-500 mt-1">GPT-4o / o3-mini / o1-mini</div>
              </button>

              <button
                type="button"
                onClick={() => setSettings({ ...settings, provider: "anthropic" })}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  settings.provider === "anthropic"
                    ? "bg-indigo-600/15 border-indigo-500 text-white shadow-xs"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <div className="text-xs font-bold">Anthropic Claude</div>
                <div className="text-[10px] text-zinc-500 mt-1">Claude 3.5 Sonnet / Haiku</div>
              </button>

              <button
                type="button"
                onClick={() => setSettings({ ...settings, provider: "ollama" })}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  settings.provider === "ollama"
                    ? "bg-indigo-600/15 border-indigo-500 text-white shadow-xs"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <span>Local Ollama</span>
                  <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 font-semibold">
                    Offline
                  </span>
                </div>
                <div className="text-[10px] text-zinc-500 mt-1">Local models (llama3 / qwen)</div>
              </button>
            </div>
          </div>

          {/* Provider Specific Input & Model Selector */}
          {settings.provider === "antigravity" && (
            <div className="space-y-3 p-4 rounded-xl bg-violet-950/20 border border-violet-500/30">
              <div className="flex items-center gap-2 text-violet-300 text-xs font-semibold">
                <Sparkles className="w-4 h-4 text-violet-400 shrink-0" />
                <span>Connected to Local Antigravity CLI (`agy`)</span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-relaxed">
                Uses your local Antigravity account for Echo360 transcript distillation, manual lecture enrichment, and mathematical proof auditing — with read-only access to staged course slides, dossiers, and LaTeX chapters.
              </p>

              {/* Antigravity Model Selector */}
              <div className="space-y-1.5 pt-2 border-t border-violet-500/20">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                    <span>Select Antigravity Model</span>
                  </label>
                  <button
                    type="button"
                    disabled={fetchingModels || !isLocal}
                    onClick={handleFetchAntigravityModels}
                    className="text-[11px] text-violet-400 hover:text-violet-300 flex items-center gap-1 font-semibold cursor-pointer disabled:opacity-40"
                    title="Query local agy CLI for live available models"
                  >
                    <RefreshCw className={`w-3 h-3 ${fetchingModels ? "animate-spin" : ""}`} />
                    <span>{fetchingModels ? "Discovering..." : "🔄 Discover CLI Models"}</span>
                  </button>
                </div>

                {customModelMode.antigravity ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={settings.antigravityModel || ""}
                      onChange={(e) => setSettings({ ...settings, antigravityModel: e.target.value })}
                      placeholder="e.g. gemini-4-hydrogen-medium"
                      className="flex-1 rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-hidden focus:border-violet-500"
                    />
                    <button
                      type="button"
                      onClick={() => setCustomModelMode((prev) => ({ ...prev, antigravity: false }))}
                      className="text-[11px] text-zinc-400 hover:text-zinc-200 px-2 py-1 underline cursor-pointer"
                    >
                      Presets
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <select
                      value={settings.antigravityModel || "gemini-4-hydrogen-medium"}
                      onChange={(e) => {
                        if (e.target.value === "__custom__") {
                          setCustomModelMode((prev) => ({ ...prev, antigravity: true }));
                        } else {
                          setSettings({ ...settings, antigravityModel: e.target.value });
                        }
                      }}
                      className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2.5 text-xs text-zinc-200 focus:outline-hidden focus:border-violet-500 cursor-pointer font-mono"
                    >
                      {availableAntigravityModels.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.label !== m.id ? `${m.label} (${m.id})` : m.id}
                        </option>
                      ))}
                      {!availableAntigravityModels.some(
                        (m) => m.id === (settings.antigravityModel || "gemini-4-hydrogen-medium")
                      ) && (
                        <option value={settings.antigravityModel || "gemini-4-hydrogen-medium"}>
                          {settings.antigravityModel || "gemini-4-hydrogen-medium"}
                        </option>
                      )}
                      <option value="__custom__">✍️ Enter Custom Model ID...</option>
                    </select>
                    <p className="text-[10px] text-zinc-500">
                      Active: <code className="text-violet-400">{settings.antigravityModel || "gemini-4-hydrogen-medium"}</code>
                    </p>
                  </div>
                )}
              </div>

              <div className="text-[10px] text-zinc-400 bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800 font-mono space-y-1">
                <div>✓ Zero external API keys required</div>
                <div>✓ Structured JSON schema output for transcripts & proofs</div>
                <div>✓ Read-only access to raw_files/, dossiers/, and LaTeX chapters</div>
              </div>
            </div>
          )}

          {settings.provider === "gemini" && (
            <div className="space-y-3 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-300">Gemini API Key</label>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                  >
                    <span>Get Free Key (Google AI Studio)</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="relative">
                  <input
                    type={showKey ? "text" : "password"}
                    value={settings.geminiKey || ""}
                    onChange={(e) => setSettings({ ...settings, geminiKey: e.target.value })}
                    placeholder="AIzaSy..."
                    className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-2.5 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-hidden focus:border-indigo-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Gemini Model Selector */}
              <div className="space-y-1.5 pt-2 border-t border-zinc-800/80">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Select Gemini Model</span>
                  </label>
                  <button
                    type="button"
                    disabled={fetchingModels || !settings.geminiKey?.trim()}
                    onClick={handleFetchGeminiModels}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold cursor-pointer disabled:opacity-40"
                    title="Inspect your Google AI Studio account for all authorized models"
                  >
                    <RefreshCw className={`w-3 h-3 ${fetchingModels ? "animate-spin" : ""}`} />
                    <span>{fetchingModels ? "Discovering..." : "🔄 Discover Account Models"}</span>
                  </button>
                </div>

                {customModelMode.gemini ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={settings.geminiModel || ""}
                      onChange={(e) => setSettings({ ...settings, geminiModel: e.target.value })}
                      placeholder="e.g. gemini-2.5-flash or gemini-2.5-pro"
                      className="flex-1 rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-hidden focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setCustomModelMode((prev) => ({ ...prev, gemini: false }))}
                      className="text-[11px] text-zinc-400 hover:text-zinc-200 px-2 py-1 underline cursor-pointer"
                    >
                      Presets
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <select
                      value={settings.geminiModel || "gemini-2.5-flash"}
                      onChange={(e) => {
                        if (e.target.value === "__custom__") {
                          setCustomModelMode((prev) => ({ ...prev, gemini: true }));
                        } else {
                          setSettings({ ...settings, geminiModel: e.target.value });
                        }
                      }}
                      className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2.5 text-xs text-zinc-200 focus:outline-hidden focus:border-indigo-500 cursor-pointer font-mono"
                    >
                      {availableGeminiModels.map((m) => {
                        const preset = DEFAULT_GEMINI_PRESETS.find((p) => p.id === m);
                        return (
                          <option key={m} value={m}>
                            {preset ? `${preset.name} — ${preset.badge}` : m}
                          </option>
                        );
                      })}
                      <option value="__custom__">✍️ Enter Custom Model Name...</option>
                    </select>
                    <p className="text-[10px] text-zinc-500">
                      Active: <code className="text-indigo-400">{settings.geminiModel || "gemini-2.5-flash"}</code>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {settings.provider === "openai" && (
            <div className="space-y-3 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-300">OpenAI API Key</label>
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                  >
                    <span>OpenAI API Keys</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="relative">
                  <input
                    type={showKey ? "text" : "password"}
                    value={settings.openaiKey || ""}
                    onChange={(e) => setSettings({ ...settings, openaiKey: e.target.value })}
                    placeholder="sk-..."
                    className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-2.5 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-hidden focus:border-indigo-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* OpenAI Model Selector */}
              <div className="space-y-1.5 pt-2 border-t border-zinc-800/80">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Select OpenAI Model</span>
                </label>
                {customModelMode.openai ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={settings.openaiModel || ""}
                      onChange={(e) => setSettings({ ...settings, openaiModel: e.target.value })}
                      placeholder="e.g. gpt-4o or o3-mini"
                      className="flex-1 rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-hidden focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setCustomModelMode((prev) => ({ ...prev, openai: false }))}
                      className="text-[11px] text-zinc-400 hover:text-zinc-200 px-2 py-1 underline cursor-pointer"
                    >
                      Presets
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <select
                      value={settings.openaiModel || "gpt-4o-mini"}
                      onChange={(e) => {
                        if (e.target.value === "__custom__") {
                          setCustomModelMode((prev) => ({ ...prev, openai: true }));
                        } else {
                          setSettings({ ...settings, openaiModel: e.target.value });
                        }
                      }}
                      className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2.5 text-xs text-zinc-200 focus:outline-hidden focus:border-indigo-500 cursor-pointer font-mono"
                    >
                      {DEFAULT_OPENAI_PRESETS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.badge})
                        </option>
                      ))}
                      <option value="__custom__">✍️ Enter Custom Model Name...</option>
                    </select>
                    <p className="text-[10px] text-zinc-500">
                      Active: <code className="text-indigo-400">{settings.openaiModel || "gpt-4o-mini"}</code>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {settings.provider === "anthropic" && (
            <div className="space-y-3 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-300">Anthropic API Key</label>
                  <a
                    href="https://console.anthropic.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                  >
                    <span>Anthropic Console</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="relative">
                  <input
                    type={showKey ? "text" : "password"}
                    value={settings.anthropicKey || ""}
                    onChange={(e) => setSettings({ ...settings, anthropicKey: e.target.value })}
                    placeholder="sk-ant-..."
                    className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-2.5 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-hidden focus:border-indigo-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Anthropic Model Selector */}
              <div className="space-y-1.5 pt-2 border-t border-zinc-800/80">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Select Claude Model</span>
                </label>
                {customModelMode.anthropic ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={settings.anthropicModel || ""}
                      onChange={(e) => setSettings({ ...settings, anthropicModel: e.target.value })}
                      placeholder="e.g. claude-3-5-sonnet-20241022"
                      className="flex-1 rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-hidden focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setCustomModelMode((prev) => ({ ...prev, anthropic: false }))}
                      className="text-[11px] text-zinc-400 hover:text-zinc-200 px-2 py-1 underline cursor-pointer"
                    >
                      Presets
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <select
                      value={settings.anthropicModel || "claude-3-5-sonnet-20241022"}
                      onChange={(e) => {
                        if (e.target.value === "__custom__") {
                          setCustomModelMode((prev) => ({ ...prev, anthropic: true }));
                        } else {
                          setSettings({ ...settings, anthropicModel: e.target.value });
                        }
                      }}
                      className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2.5 text-xs text-zinc-200 focus:outline-hidden focus:border-indigo-500 cursor-pointer font-mono"
                    >
                      {DEFAULT_ANTHROPIC_PRESETS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.badge})
                        </option>
                      ))}
                      <option value="__custom__">✍️ Enter Custom Model Name...</option>
                    </select>
                    <p className="text-[10px] text-zinc-500">
                      Active: <code className="text-indigo-400">{settings.anthropicModel || "claude-3-5-sonnet-20241022"}</code>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {settings.provider === "ollama" && (
            <div className="space-y-3 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
              {!isLocal && (
                <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/50 text-[11px] text-amber-300 space-y-1.5">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Localhost Studio Required for Ollama</span>
                  </div>
                  <p className="text-zinc-300 leading-relaxed">
                    You are viewing Course Noting on GitHub Pages. Web browsers block websites loaded over HTTPS from connecting to local unencrypted ports (<code className="text-amber-200">http://localhost:11434</code>).
                  </p>
                  <p className="text-zinc-400">
                    To use Local Ollama, run <code className="text-indigo-300">npm run dev</code> on your computer (http://localhost:3000), or switch to <strong>Google Gemini (Free Tier)</strong> which works directly in the browser!
                  </p>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300">Ollama Server Endpoint</label>
                <input
                  type="text"
                  value={settings.ollamaUrl || ""}
                  onChange={(e) => setSettings({ ...settings, ollamaUrl: e.target.value })}
                  placeholder="http://localhost:11434"
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-2.5 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              {/* Ollama Model Selector with Local Auto-Detection */}
              <div className="space-y-1.5 pt-2 border-t border-zinc-800/80">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Ollama Model</span>
                  </label>
                  <button
                    type="button"
                    disabled={fetchingModels}
                    onClick={handleFetchOllamaModels}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold cursor-pointer disabled:opacity-40"
                  >
                    <RefreshCw className={`w-3 h-3 ${fetchingModels ? "animate-spin" : ""}`} />
                    <span>{fetchingModels ? "Scanning..." : "🔄 Detect Local Models"}</span>
                  </button>
                </div>

                {availableOllamaModels.length > 0 && !customModelMode.ollama ? (
                  <div className="space-y-1">
                    <select
                      value={settings.ollamaModel || availableOllamaModels[0]}
                      onChange={(e) => {
                        if (e.target.value === "__custom__") {
                          setCustomModelMode((prev) => ({ ...prev, ollama: true }));
                        } else {
                          setSettings({ ...settings, ollamaModel: e.target.value });
                        }
                      }}
                      className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2.5 text-xs text-zinc-200 focus:outline-hidden focus:border-indigo-500 cursor-pointer font-mono"
                    >
                      {availableOllamaModels.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                      <option value="__custom__">✍️ Enter Custom Model Name...</option>
                    </select>
                    <p className="text-[10px] text-zinc-500">
                      Active: <code className="text-indigo-400">{settings.ollamaModel}</code>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <input
                      type="text"
                      value={settings.ollamaModel || ""}
                      onChange={(e) => setSettings({ ...settings, ollamaModel: e.target.value })}
                      placeholder="e.g. qwen2.5:7b-instruct, deepseek-r1:8b, llama3"
                      className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-2.5 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-hidden focus:border-indigo-500"
                    />
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {["qwen2.5:7b-instruct", "deepseek-r1:8b", "llama3", "mistral"].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setSettings({ ...settings, ollamaModel: tag })}
                          className="px-2 py-0.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-[10px] cursor-pointer"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Test Status feedback */}
          {testResult && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 border animate-in fade-in duration-150 ${
                testResult.success
                  ? "bg-emerald-950/60 border-emerald-800 text-emerald-200"
                  : "bg-red-950/60 border-red-800 text-red-200"
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/40 flex items-center justify-between shrink-0">
          <button
            type="button"
            disabled={testing}
            onClick={handleTestConnection}
            className="py-2 px-3.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 border border-zinc-700"
          >
            {testing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-400" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            )}
            <span>{testing ? "Testing..." : "Test Model Connection"}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className={`py-2 px-5 rounded-xl text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-indigo-950/50 cursor-pointer ${
                savedSuccess ? "bg-emerald-600" : "bg-indigo-600 hover:bg-indigo-500"
              }`}
            >
              {savedSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Settings</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
