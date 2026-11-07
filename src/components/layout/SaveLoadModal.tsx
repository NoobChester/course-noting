"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Copy,
  Check,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  ShieldCheck,
  Sparkles,
  FileText,
  AlertTriangle,
  Bookmark,
  CheckCircle2
} from "lucide-react";
import { getActiveCourseId } from "@/lib/pack-loader";

interface SaveLoadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SaveLoadModal({ isOpen, onClose }: SaveLoadModalProps) {
  const [activeTab, setActiveTab] = useState<"save" | "load" | "reset">("save");
  const [saveString, setSaveString] = useState("");
  const [stats, setStats] = useState<{
    totalCourses: number;
    totalQuestionsWithData: number;
    totalMastered: number;
    totalStarred: number;
    totalWithSolutions: number;
  }>({
    totalCourses: 0,
    totalQuestionsWithData: 0,
    totalMastered: 0,
    totalStarred: 0,
    totalWithSolutions: 0
  });

  const [copied, setCopied] = useState(false);
  const [inputString, setInputString] = useState("");
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch export string and stats whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setStatusMessage(null);
      const activeCourse = getActiveCourseId();
      fetch(`/api/userdata?activeCourse=${activeCourse}`)
        .then((res) => {
          if (!res.ok) throw new Error("API not available");
          return res.json();
        })
        .then((data) => {
          if (data.success) {
            setSaveString(data.saveString || "");
            if (data.stats) setStats(data.stats);
          }
        })
        .catch(() => {
          // Client-side backup fallback for GitHub Pages
          try {
            const browserData: Record<string, any> = {};
            for (let i = 0; i < localStorage.length; i++) {
              const k = localStorage.key(i);
              if (k && (k.startsWith("cn_") || k.startsWith("math_"))) {
                browserData[k] = localStorage.getItem(k);
              }
            }
            const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(browserData))));
            setSaveString(encoded);
          } catch (e) {
            console.error("Local backup error:", e);
          }
        });
    }
  }, [isOpen]);

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!saveString) return;
    navigator.clipboard.writeText(saveString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    if (!saveString) return;
    try {
      fetch("/api/userdata")
        .then((res) => res.json())
        .then((data) => {
          const blob = new Blob([JSON.stringify(data.payload, null, 2)], {
            type: "application/json"
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          const date = new Date().toISOString().slice(0, 10);
          a.href = url;
          a.download = `course-noting-backup-${date}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        });
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setInputString(content);
      setActiveTab("load");
    };
    reader.readAsText(file);
  };

  const handleRestore = async () => {
    if (!inputString.trim()) {
      setStatusMessage({ type: "error", text: "Please paste a save string or select a backup file first." });
      return;
    }

    setLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/userdata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "load",
          saveString: inputString.trim(),
          mode: importMode
        })
      });

      if (!res.ok) throw new Error("API not available");
      const data = await res.json();

      if (data.activeCourse) {
        localStorage.setItem("math_active_course", data.activeCourse);
      }

      setStatusMessage({
        type: "success",
        text: `Success! Restored ${data.restoredQuestions} questions across ${data.restoredCourses} course(s). Reloading...`
      });

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch {
      // Client-side fallback for GitHub Pages
      try {
        let jsonStr = inputString.trim();
        if (!jsonStr.startsWith("{")) {
          jsonStr = decodeURIComponent(escape(atob(jsonStr)));
        }
        const parsed = JSON.parse(jsonStr);
        let count = 0;
        Object.entries(parsed).forEach(([k, v]) => {
          if (typeof v === "string") localStorage.setItem(k, v);
          else localStorage.setItem(k, JSON.stringify(v));
          count++;
        });
        setStatusMessage({
          type: "success",
          text: `Success! Restored ${count} data entries in browser storage. Reloading...`
        });
        setTimeout(() => window.location.reload(), 1200);
      } catch (err: any) {
        setStatusMessage({ type: "error", text: err.message || "Failed to restore state." });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm("Are you sure you want to reset all user progress? Your written solutions, mastery statuses, and stars in userdata/ will be cleared. (Make sure you copied your save string first!)")) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/userdata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" })
      });

      if (!res.ok) throw new Error("Failed to reset");

      setStatusMessage({
        type: "success",
        text: "Clean slate restored! All personal progress cleared for sharing. Reloading..."
      });

      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Reset failed." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <span>Save & Load Progress</span>
                <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                  Repo Safe
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                All personal working lives in <code className="text-zinc-300 font-mono">userdata/</code> so you can share the repo cleanly.
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

        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-800 bg-zinc-900/30 px-6 pt-2 shrink-0">
          <button
            onClick={() => setActiveTab("save")}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold transition border-b-2 cursor-pointer ${
              activeTab === "save"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Save / Export</span>
          </button>
          <button
            onClick={() => setActiveTab("load")}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold transition border-b-2 cursor-pointer ${
              activeTab === "load"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Load / Restore</span>
          </button>
          <button
            onClick={() => setActiveTab("reset")}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold transition border-b-2 cursor-pointer ${
              activeTab === "reset"
                ? "border-red-500 text-red-400"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clean Slate (For Sharing)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl text-xs font-medium border flex items-center gap-2.5 animate-in fade-in duration-150 ${
                statusMessage.type === "success"
                  ? "bg-emerald-950/60 border-emerald-800 text-emerald-200"
                  : "bg-red-950/60 border-red-800 text-red-200"
              }`}
            >
              {statusMessage.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* TAB 1: SAVE / EXPORT */}
          {activeTab === "save" && (
            <div className="space-y-4">
              {/* Progress Summary Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="text-[10px] text-zinc-400 font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Mastered</span>
                  </div>
                  <div className="text-xl font-black text-zinc-100 mt-1">{stats.totalMastered}</div>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="text-[10px] text-zinc-400 font-medium flex items-center gap-1.5">
                    <Bookmark className="w-3 h-3 text-amber-400" />
                    <span>Starred</span>
                  </div>
                  <div className="text-xl font-black text-zinc-100 mt-1">{stats.totalStarred}</div>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="text-[10px] text-zinc-400 font-medium flex items-center gap-1.5">
                    <FileText className="w-3 h-3 text-indigo-400" />
                    <span>My Solutions</span>
                  </div>
                  <div className="text-xl font-black text-zinc-100 mt-1">{stats.totalWithSolutions}</div>
                </div>
              </div>

              {/* Copy-Pasteable String */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-300 flex items-center justify-between">
                  <span>Copy-Pasteable Save String</span>
                  <span className="text-[10px] font-normal text-zinc-500">
                    Single token string • Paste into any browser
                  </span>
                </label>
                <div className="relative">
                  <textarea
                    readOnly
                    value={saveString}
                    rows={4}
                    className="w-full rounded-xl bg-zinc-900/90 border border-zinc-800 p-3 text-[11px] font-mono text-zinc-300 resize-none focus:outline-none focus:border-indigo-500 select-all"
                    onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                  />
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm ${
                      copied
                        ? "bg-emerald-600 text-white"
                        : "bg-indigo-600 hover:bg-indigo-500 text-white"
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy Save String</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownload}
                    className="py-2.5 px-4 rounded-xl font-bold text-xs flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition cursor-pointer"
                    title="Download as JSON file"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download .json</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LOAD / RESTORE */}
          {activeTab === "load" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-300">
                  Paste Save String or Load File
                </label>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-zinc-500">Mode:</span>
                  <button
                    type="button"
                    onClick={() => setImportMode("merge")}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                      importMode === "merge"
                        ? "bg-indigo-600 text-white"
                        : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    Merge
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportMode("replace")}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                      importMode === "replace"
                        ? "bg-amber-600 text-white"
                        : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    Replace
                  </button>
                </div>
              </div>

              <textarea
                value={inputString}
                onChange={(e) => setInputString(e.target.value)}
                placeholder="Paste your CNBACKUP string (or raw JSON backup) here..."
                rows={5}
                className="w-full rounded-xl bg-zinc-900 border border-zinc-800 p-3 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 resize-none"
              />

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={loading || !inputString.trim()}
                  onClick={handleRestore}
                  className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Restoring...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Restore Progress</span>
                    </>
                  )}
                </button>

                <label className="py-2.5 px-4 rounded-xl font-bold text-xs flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition cursor-pointer">
                  <FileText className="w-4 h-4" />
                  <span>Choose .json File</span>
                  <input
                    type="file"
                    accept=".json,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {/* TAB 3: CLEAN SLATE / RESET FOR SHARING */}
          {activeTab === "reset" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2 text-xs leading-relaxed text-zinc-300">
                <div className="font-bold text-zinc-100 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Sharing the Repository with Others?</span>
                </div>
                <p>
                  Because all your progress is dedicated to the <code className="text-indigo-400 font-mono">userdata/</code> directory (which is gitignored), anyone who clones or downloads this repository gets a fresh, clean course setup with all original problem sheets and solutions intact.
                </p>
                <p className="text-zinc-400">
                  If you want to clear your local working to test a clean installation or share a screen recording, you can reset your local progress here.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-900/60 text-xs text-amber-200 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Important:</strong> Make sure you go to the <strong>Save / Export</strong> tab and copy your Save String first so you can restore your progress at any time!
                </div>
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={handleReset}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white transition cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Resetting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Reset All User Progress to Clean Slate</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
