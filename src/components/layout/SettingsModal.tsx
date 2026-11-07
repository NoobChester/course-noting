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

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_SETTINGS: AISettings = {
  provider: "gemini",
  geminiKey: "",
  openaiKey: "",
  anthropicKey: "",
  ollamaUrl: "http://localhost:11434",
  ollamaModel: "llama3"
};

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [settings, setSettings] = useState<AISettings>(DEFAULT_SETTINGS);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTestResult(null);
      setSavedSuccess(false);
      try {
        const stored = localStorage.getItem("cn_ai_settings");
        if (stored) {
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
        }
      } catch (err) {
        console.error("Failed to load AI settings:", err);
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

    if (settings.provider !== "ollama" && !currentKey?.trim()) {
      setTesting(false);
      setTestResult({
        success: false,
        message: `Please enter an API key for ${settings.provider.toUpperCase()} first.`
      });
      return;
    }

    try {
      const res = await fetch("/api/ai/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: settings.provider,
          apiKey: currentKey?.trim(),
          ollamaUrl: settings.ollamaUrl,
          ollamaModel: settings.ollamaModel
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Connection test failed");

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30 flex items-center justify-center font-bold">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <span>AI Proof Reviewer Settings</span>
              </h2>
              <p className="text-xs text-zinc-400">
                Configure your API key for automated proof auditing.
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
        <div className="p-6 space-y-5">
          {/* Privacy Note */}
          <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-300 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong>100% Private & Repo Safe:</strong> Your API key is stored only inside your local browser storage. It is never saved on a server or committed to Git.
            </div>
          </div>

          {/* Provider Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-300">Choose AI Provider</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSettings({ ...settings, provider: "gemini" })}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  settings.provider === "gemini"
                    ? "bg-indigo-600/15 border-indigo-500 text-white"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <span>Google Gemini</span>
                  <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 font-semibold border border-emerald-800">
                    Free Tier
                  </span>
                </div>
                <div className="text-[10px] text-zinc-500 mt-1">Gemini 1.5 Flash (Fast & accurate)</div>
              </button>

              <button
                type="button"
                onClick={() => setSettings({ ...settings, provider: "openai" })}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  settings.provider === "openai"
                    ? "bg-indigo-600/15 border-indigo-500 text-white"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <div className="text-xs font-bold">OpenAI</div>
                <div className="text-[10px] text-zinc-500 mt-1">GPT-4o / GPT-4o-mini</div>
              </button>

              <button
                type="button"
                onClick={() => setSettings({ ...settings, provider: "anthropic" })}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  settings.provider === "anthropic"
                    ? "bg-indigo-600/15 border-indigo-500 text-white"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <div className="text-xs font-bold">Anthropic Claude</div>
                <div className="text-[10px] text-zinc-500 mt-1">Claude 3.5 Sonnet</div>
              </button>

              <button
                type="button"
                onClick={() => setSettings({ ...settings, provider: "ollama" })}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  settings.provider === "ollama"
                    ? "bg-indigo-600/15 border-indigo-500 text-white"
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

          {/* Provider Specific Input */}
          {settings.provider === "gemini" && (
            <div className="space-y-2">
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
                  className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3.5 py-2.5 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 pr-10"
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
          )}

          {settings.provider === "openai" && (
            <div className="space-y-2">
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
                  className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3.5 py-2.5 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 pr-10"
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
          )}

          {settings.provider === "anthropic" && (
            <div className="space-y-2">
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
                  className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3.5 py-2.5 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 pr-10"
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
          )}

          {settings.provider === "ollama" && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300">Ollama Server Endpoint</label>
                <input
                  type="text"
                  value={settings.ollamaUrl || ""}
                  onChange={(e) => setSettings({ ...settings, ollamaUrl: e.target.value })}
                  placeholder="http://localhost:11434"
                  className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3.5 py-2.5 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300">Model Name</label>
                <input
                  type="text"
                  value={settings.ollamaModel || ""}
                  onChange={(e) => setSettings({ ...settings, ollamaModel: e.target.value })}
                  placeholder="llama3 or qwen2.5-math"
                  className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3.5 py-2.5 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Test Status feedback */}
          {testResult && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start gap-2 border animate-in fade-in duration-150 ${
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
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/40 flex items-center justify-between">
          <button
            type="button"
            disabled={testing}
            onClick={handleTestConnection}
            className="py-2 px-3.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
          >
            {testing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Testing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Test Connection</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-3.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm transition cursor-pointer"
            >
              {savedSuccess ? "Saved ✓" : "Save Settings"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
