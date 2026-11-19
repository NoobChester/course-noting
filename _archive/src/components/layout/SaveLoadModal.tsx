"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  CheckCircle2,
  SlidersHorizontal,
  FileDown,
  GraduationCap,
  BookOpen,
  Mic,
  PenTool,
  Clock,
  Layers,
  Wand2,
  Shield,
  Eye,
  CheckSquare,
  Square,
  Plus
} from "lucide-react";
import { getActiveCourseId, loadActiveCourseData } from "@/lib/pack-loader";
import { MergedCourseData, SelectiveExportOptions, ExportFormat, ExportedPackSummary } from "@/lib/types";
import {
  buildSelectiveExport,
  analyzeImportPack,
  applyImportPack,
  getPresetOptions,
  PRESET_CLASSMATE,
  PRESET_BLANK,
  PRESET_FULL
} from "@/lib/selective-export";

interface SaveLoadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SaveLoadModal({ isOpen, onClose }: SaveLoadModalProps) {
  const [activeTab, setActiveTab] = useState<"selective" | "save" | "load" | "reset" | "cnpack">("selective");
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
  const [copiedSelective, setCopiedSelective] = useState(false);
  const [inputString, setInputString] = useState("");
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Selective Export State
  const [activeCourseId, setActiveCourseId] = useState("sample1001");
  const [mergedData, setMergedData] = useState<MergedCourseData | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>(PRESET_CLASSMATE);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("json");
  const [selectiveOptions, setSelectiveOptions] = useState<SelectiveExportOptions>(
    getPresetOptions(PRESET_CLASSMATE, "sample1001")
  );

  // Dynamic Weeks Detection & Drag-Range Selection
  const [extraWeeks, setExtraWeeks] = useState(0);
  const [isDraggingWeek, setIsDraggingWeek] = useState(false);
  const [dragMode, setDragMode] = useState<"select" | "deselect">("select");

  // Fetch export string, course data, and stats whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setStatusMessage(null);
      setExtraWeeks(0);
      const courseId = getActiveCourseId();
      setActiveCourseId(courseId);
      setSelectiveOptions(getPresetOptions(PRESET_CLASSMATE, courseId));

      loadActiveCourseData().then((data) => {
        if (data) setMergedData(data);
      });

      fetch(`/api/userdata?activeCourse=${courseId}`)
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

  // Window mouseup listener to end drag selection
  useEffect(() => {
    const handleMouseUp = () => setIsDraggingWeek(false);
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, []);

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Detect available weeks and item counts dynamically from active course data
  const detectedWeeksInfo = useMemo(() => {
    let max = 0;
    let hasGeneral = false;
    const weekCountMap: Record<number, number> = {};

    if (mergedData) {
      const allItems = [
        ...(mergedData.questions || []),
        ...(mergedData.concepts || []),
        ...(mergedData.lectures || [])
      ];

      for (const item of allItems) {
        const w = (item as any).week;
        if (w === undefined || w === null || isNaN(w) || w <= 0) {
          hasGeneral = true;
          weekCountMap[0] = (weekCountMap[0] || 0) + 1;
        } else {
          if (w > max) max = w;
          weekCountMap[w] = (weekCountMap[w] || 0) + 1;
        }
      }
    }

    const baseMax = Math.max(max, 10);
    return {
      maxWeek: baseMax,
      hasGeneral,
      weekCountMap
    };
  }, [mergedData]);

  const totalDisplayWeeks = detectedWeeksInfo.maxWeek + extraWeeks;
  const weekList = useMemo(() => {
    return Array.from({ length: totalDisplayWeeks }, (_, i) => i + 1);
  }, [totalDisplayWeeks]);

  const allAvailableWeeks = useMemo(() => {
    return [ ...(detectedWeeksInfo.hasGeneral ? [0] : []), ...weekList ];
  }, [detectedWeeksInfo.hasGeneral, weekList]);

  const isWeekSelected = (w: number) => {
    if (selectiveOptions.selectedWeeks === "all") return true;
    return selectiveOptions.selectedWeeks.includes(w);
  };

  const handleSelectAllWeeks = () => {
    setSelectedPreset("custom");
    setSelectiveOptions((prev) => ({
      ...prev,
      selectedWeeks: "all"
    }));
  };

  const handleClearWeeks = () => {
    setSelectedPreset("custom");
    setSelectiveOptions((prev) => ({
      ...prev,
      selectedWeeks: []
    }));
  };

  const handleWeekMouseDown = (w: number) => {
    setIsDraggingWeek(true);
    setSelectedPreset("custom");
    const currentlySelected = isWeekSelected(w);
    const mode = currentlySelected ? "deselect" : "select";
    setDragMode(mode);

    if (mode === "select") {
      if (selectiveOptions.selectedWeeks === "all") return;
      const current = Array.isArray(selectiveOptions.selectedWeeks) ? selectiveOptions.selectedWeeks : [];
      if (!current.includes(w)) {
        const next = [...current, w].sort((a, b) => a - b);
        if (allAvailableWeeks.every((x) => next.includes(x))) {
          setSelectiveOptions((prev) => ({ ...prev, selectedWeeks: "all" }));
        } else {
          setSelectiveOptions((prev) => ({ ...prev, selectedWeeks: next }));
        }
      }
    } else {
      if (selectiveOptions.selectedWeeks === "all") {
        setSelectiveOptions((prev) => ({
          ...prev,
          selectedWeeks: allAvailableWeeks.filter((x: number) => x !== w)
        }));
      } else {
        const cur = Array.isArray(selectiveOptions.selectedWeeks) ? selectiveOptions.selectedWeeks : allAvailableWeeks;
        setSelectiveOptions((prev) => ({
          ...prev,
          selectedWeeks: cur.filter((x: number) => x !== w)
        }));
      }
    }
  };

  const handleWeekMouseEnter = (w: number) => {
    if (!isDraggingWeek) return;
    setSelectedPreset("custom");

    if (dragMode === "select") {
      if (selectiveOptions.selectedWeeks === "all") return;
      const current = Array.isArray(selectiveOptions.selectedWeeks) ? selectiveOptions.selectedWeeks : [];
      if (!current.includes(w)) {
        const next = [...current, w].sort((a, b) => a - b);
        if (allAvailableWeeks.every((x) => next.includes(x))) {
          setSelectiveOptions((prev) => ({ ...prev, selectedWeeks: "all" }));
        } else {
          setSelectiveOptions((prev) => ({ ...prev, selectedWeeks: next }));
        }
      }
    } else {
      if (selectiveOptions.selectedWeeks === "all") {
        setSelectiveOptions((prev) => ({
          ...prev,
          selectedWeeks: allAvailableWeeks.filter((x: number) => x !== w)
        }));
      } else {
        const cur = Array.isArray(selectiveOptions.selectedWeeks) ? selectiveOptions.selectedWeeks : allAvailableWeeks;
        setSelectiveOptions((prev) => ({
          ...prev,
          selectedWeeks: cur.filter((x: number) => x !== w)
        }));
      }
    }
  };

  const isZeroWeeksSelected =
    Array.isArray(selectiveOptions.selectedWeeks) && selectiveOptions.selectedWeeks.length === 0;

  // Compute live selective export package
  const exportBundle = useMemo(() => {
    if (!mergedData) return null;
    return buildSelectiveExport(selectiveOptions, mergedData);
  }, [selectiveOptions, mergedData]);

  // Analyze import string live for preview card
  const importSummary = useMemo(() => {
    return analyzeImportPack(inputString);
  }, [inputString]);

  if (!isOpen) return null;

  const handleApplyPreset = (presetKey: string) => {
    setSelectedPreset(presetKey);
    setSelectiveOptions(getPresetOptions(presetKey, activeCourseId));
  };

  const handleToggleOption = (key: keyof SelectiveExportOptions) => {
    setSelectedPreset("custom");
    setSelectiveOptions((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleDownloadSelective = () => {
    if (!exportBundle || isZeroWeeksSelected) return;
    const date = new Date().toISOString().slice(0, 10);
    const code = mergedData?.course.code.toLowerCase() || activeCourseId;

    if (exportFormat === "json") {
      const blob = new Blob([JSON.stringify(exportBundle.jsonPayload, null, 2)], {
        type: "application/json"
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${code}_shared_pack_${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (exportFormat === "markdown") {
      const blob = new Blob([exportBundle.markdownText], {
        type: "text/markdown;charset=utf-8"
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${code}_notes_and_solutions_${date}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (exportFormat === "string") {
      navigator.clipboard.writeText(exportBundle.base64String);
      setCopiedSelective(true);
      setTimeout(() => setCopiedSelective(false), 2500);
    }
  };

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
        .then((res) => {
          if (!res.ok) throw new Error("API not available");
          return res.json();
        })
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
        })
        .catch(() => {
          const blob = new Blob([saveString], { type: "text/plain" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          const date = new Date().toISOString().slice(0, 10);
          a.href = url;
          a.download = `course-noting-backup-${date}.txt`;
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

    // Apply via client-side selective engine
    const res = applyImportPack(inputString, importMode);
    if (res.success) {
      setStatusMessage({ type: "success", text: `${res.message} Reloading...` });
      setTimeout(() => {
        window.location.reload();
      }, 1400);
    } else {
      setStatusMessage({ type: "error", text: res.message });
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (
      !window.confirm(
        "Are you sure you want to reset all user progress? Your written solutions, mastery statuses, and stars will be cleared."
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      await fetch("/api/userdata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" })
      }).catch(() => {});

      // Clear local browser storage
      const toRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith("cn_user_") || k.startsWith("cn_progress_") || k.startsWith("math_user_"))) {
          toRemove.push(k);
        }
      }
      toRemove.forEach((k) => localStorage.removeItem(k));

      setStatusMessage({
        type: "success",
        text: "Clean slate restored! All personal progress cleared. Reloading..."
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

  const handleImportCnpackFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setStatusMessage(null);
    try {
      const text = await file.text();
      const pack = JSON.parse(text);

      const res = await fetch("/api/courses/pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pack)
      });

      if (!res.ok) {
        throw new Error("Failed to unpack course archive");
      }

      const result = await res.json();
      setStatusMessage({
        type: "success",
        text: `Successfully imported ${result.code}! Unpacked ${result.questionsImported} questions and ${result.latexFilesWritten} raw LaTeX files. Reloading...`
      });

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || "Failed to import course pack."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <span>Save, Export & Classmate Sharing</span>
                <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                  {mergedData?.course.code || "Course"}
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Cherry-pick solutions and lecture insights to share cleanly with friends, or backup your entire workspace.
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
        <div className="flex border-b border-zinc-800 bg-zinc-900/30 px-6 pt-2 shrink-0 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab("selective")}
            className={`flex items-center gap-2 pb-3 px-3 transition border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === "selective"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Selective Export & Share</span>
          </button>
          <button
            onClick={() => setActiveTab("save")}
            className={`flex items-center gap-2 pb-3 px-3 transition border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === "save"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Quick Full Backup</span>
          </button>
          <button
            onClick={() => setActiveTab("load")}
            className={`flex items-center gap-2 pb-3 px-3 transition border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === "load"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import / Restore</span>
          </button>
          <button
            onClick={() => setActiveTab("reset")}
            className={`flex items-center gap-2 pb-3 px-3 transition border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === "reset"
                ? "border-red-500 text-red-400"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clean Slate</span>
          </button>
          <button
            onClick={() => setActiveTab("cnpack")}
            className={`flex items-center gap-2 pb-3 px-3 transition border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === "cnpack"
                ? "border-violet-500 text-violet-400"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span>Course Pack (.cnpack)</span>
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

          {/* TAB 1: SELECTIVE EXPORT (NEW!) */}
          {activeTab === "selective" && (
            <div className="space-y-6">
              {/* 1-Click Quick Presets Bar */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-300 flex items-center justify-between">
                  <span>1. Choose a Quick Preset</span>
                  <span className="text-[11px] text-zinc-500 font-normal">Click any preset to auto-set checkboxes</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleApplyPreset(PRESET_CLASSMATE)}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      selectedPreset === PRESET_CLASSMATE
                        ? "bg-indigo-950/50 border-indigo-500 text-white shadow-sm"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs flex items-center gap-1.5 text-indigo-300">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Share with Classmates</span>
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-1 leading-snug">
                        Notes, insights, & verified solutions. Excludes private repetition stats.
                      </div>
                    </div>
                    <span className="text-[9px] font-mono font-bold uppercase text-indigo-400 mt-2">Recommended</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyPreset(PRESET_BLANK)}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      selectedPreset === PRESET_BLANK
                        ? "bg-indigo-950/50 border-indigo-500 text-white shadow-sm"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs flex items-center gap-1.5 text-zinc-200">
                        <FileText className="w-3.5 h-3.5 text-amber-400" />
                        <span>Blank Worksheet Pack</span>
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-1 leading-snug">
                        Questions, hints & theorems only. Perfect for friends to practice from scratch.
                      </div>
                    </div>
                    <span className="text-[9px] font-mono font-bold uppercase text-zinc-500 mt-2">No Solutions</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyPreset(PRESET_FULL)}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      selectedPreset === PRESET_FULL
                        ? "bg-indigo-950/50 border-indigo-500 text-white shadow-sm"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs flex items-center gap-1.5 text-zinc-200">
                        <Shield className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Full Personal Backup</span>
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-1 leading-snug">
                        Everything including SM-2 intervals, mastery statuses, and raw scratchpads.
                      </div>
                    </div>
                    <span className="text-[9px] font-mono font-bold uppercase text-emerald-400 mt-2">100% Complete</span>
                  </button>
                </div>
              </div>

              {/* Scope & Week Filter (Dynamic & University-Agnostic with Drag-Range) */}
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-xs text-zinc-200 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-violet-400" />
                      <span>Target Week Scope</span>
                      <span className="text-[11px] font-normal text-zinc-400">
                        {selectiveOptions.selectedWeeks === "all"
                          ? "(All Weeks Included)"
                          : isZeroWeeksSelected
                          ? "(0 Weeks Selected)"
                          : `(${selectiveOptions.selectedWeeks.length} Weeks Selected)`}
                      </span>
                    </span>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Click to toggle, or click and drag across pills to sweep-select a range.
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={handleSelectAllWeeks}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition border ${
                        selectiveOptions.selectedWeeks === "all"
                          ? "bg-indigo-600/30 text-indigo-300 border-indigo-500/50"
                          : "bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700 hover:text-white"
                      }`}
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={handleClearWeeks}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700 hover:bg-zinc-700 transition"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Week Pills Grid */}
                <div className="flex flex-wrap items-center gap-1.5 select-none pt-1">
                  {/* General / Unassigned Pill */}
                  {(detectedWeeksInfo.hasGeneral || (detectedWeeksInfo.weekCountMap[0] || 0) > 0) && (
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleWeekMouseDown(0);
                      }}
                      onMouseEnter={() => handleWeekMouseEnter(0)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border flex items-center gap-1.5 cursor-pointer ${
                        isWeekSelected(0)
                          ? "bg-indigo-600 text-white border-indigo-500 shadow-sm shadow-indigo-600/30 font-bold"
                          : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200"
                      }`}
                    >
                      <span>General / Unassigned</span>
                      {detectedWeeksInfo.weekCountMap[0] !== undefined && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                            isWeekSelected(0) ? "bg-indigo-700/80 text-white" : "bg-zinc-800 text-zinc-400"
                          }`}
                        >
                          {detectedWeeksInfo.weekCountMap[0]}
                        </span>
                      )}
                    </button>
                  )}

                  {/* Dynamic Week Pills 1..N */}
                  {weekList.map((w) => {
                    const selected = isWeekSelected(w);
                    const count = detectedWeeksInfo.weekCountMap[w];

                    return (
                      <button
                        key={w}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleWeekMouseDown(w);
                        }}
                        onMouseEnter={() => handleWeekMouseEnter(w)}
                        className={`px-3 py-1.5 rounded-lg text-xs transition border flex items-center gap-1 cursor-pointer font-medium ${
                          selected
                            ? "bg-indigo-600 text-white border-indigo-400 shadow-sm shadow-indigo-600/30 font-bold"
                            : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200"
                        }`}
                      >
                        <span>W{w}</span>
                        {count !== undefined && count > 0 && (
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                              selected ? "bg-indigo-700/80 text-indigo-100" : "bg-zinc-800/90 text-zinc-500"
                            }`}
                          >
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}

                  {/* Add Week Extender Button */}
                  <button
                    type="button"
                    onClick={() => setExtraWeeks((prev) => prev + 1)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-indigo-300 border border-dashed border-zinc-700 hover:border-indigo-500/60 bg-zinc-950/50 hover:bg-indigo-950/30 transition flex items-center gap-1 cursor-pointer"
                    title="Add another week to the range (e.g. for 12, 14, or 16-week semesters)"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Week</span>
                  </button>
                </div>

                {/* Zero Weeks Selected Alert */}
                {isZeroWeeksSelected && (
                  <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-600/40 text-amber-300 text-xs flex items-center gap-2 animate-in fade-in">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>0 weeks selected — please select at least one week pill or click &quot;Select All&quot; to export questions/lectures.</span>
                  </div>
                )}
              </div>

              {/* Granular Checkboxes Grid */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-zinc-300">2. Customize Content & Privacy Checkboxes</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Category: Curriculum */}
                  <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-2.5">
                    <span className="font-bold text-zinc-200 uppercase tracking-wider text-[10px] text-indigo-400 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Curriculum & Base Problems</span>
                    </span>

                    <label className="flex items-center gap-2 cursor-pointer text-zinc-300 select-none">
                      <input
                        type="checkbox"
                        checked={selectiveOptions.includeQuestions}
                        onChange={() => handleToggleOption("includeQuestions")}
                        className="rounded bg-zinc-800 text-indigo-600 border-zinc-700"
                      />
                      <span>Question Prompts & Benchmark Answers</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-zinc-300 select-none">
                      <input
                        type="checkbox"
                        checked={selectiveOptions.includeConcepts}
                        onChange={() => handleToggleOption("includeConcepts")}
                        className="rounded bg-zinc-800 text-indigo-600 border-zinc-700"
                      />
                      <span>Core Theorems & Concept Guides</span>
                    </label>
                  </div>

                  {/* Category: Lecture Layer */}
                  <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-2.5">
                    <span className="font-bold text-zinc-200 uppercase tracking-wider text-[10px] text-violet-400 flex items-center gap-1.5">
                      <Mic className="w-3.5 h-3.5" />
                      <span>Lecture Intelligence Layer</span>
                    </span>

                    <label className="flex items-center gap-2 cursor-pointer text-zinc-300 select-none">
                      <input
                        type="checkbox"
                        checked={selectiveOptions.includeLectureNotes}
                        onChange={() => handleToggleOption("includeLectureNotes")}
                        className="rounded bg-zinc-800 text-indigo-600 border-zinc-700"
                      />
                      <span>Distilled Lecture Notes (KaTeX)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-zinc-300 select-none">
                      <input
                        type="checkbox"
                        checked={selectiveOptions.includeSpokenIntuitions}
                        onChange={() => handleToggleOption("includeSpokenIntuitions")}
                        className="rounded bg-zinc-800 text-indigo-600 border-zinc-700"
                      />
                      <span>🎙️ Spoken Intuitions & Metaphors</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-zinc-300 select-none">
                      <input
                        type="checkbox"
                        checked={selectiveOptions.includeExamWarnings}
                        onChange={() => handleToggleOption("includeExamWarnings")}
                        className="rounded bg-zinc-800 text-indigo-600 border-zinc-700"
                      />
                      <span>⚠️ Lecturer Exam Traps & Pitfalls</span>
                    </label>
                  </div>

                  {/* Category: Student Work */}
                  <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-2.5">
                    <span className="font-bold text-zinc-200 uppercase tracking-wider text-[10px] text-amber-400 flex items-center gap-1.5">
                      <PenTool className="w-3.5 h-3.5" />
                      <span>Student Work & Proofs</span>
                    </span>

                    <label className="flex items-center gap-2 cursor-pointer text-zinc-300 select-none">
                      <input
                        type="checkbox"
                        checked={selectiveOptions.includeWrittenSolutions}
                        onChange={() => handleToggleOption("includeWrittenSolutions")}
                        className="rounded bg-zinc-800 text-indigo-600 border-zinc-700"
                      />
                      <span className="font-semibold text-amber-300">My Typed LaTeX Proofs & Solutions</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-zinc-300 select-none">
                      <input
                        type="checkbox"
                        checked={selectiveOptions.includeCanvasScratchpads}
                        onChange={() => handleToggleOption("includeCanvasScratchpads")}
                        className="rounded bg-zinc-800 text-indigo-600 border-zinc-700"
                      />
                      <span>Freehand Canvas Scratchpads & Drawings</span>
                    </label>
                  </div>

                  {/* Category: Private Study Metrics */}
                  <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-2.5">
                    <span className="font-bold text-zinc-200 uppercase tracking-wider text-[10px] text-emerald-400 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" />
                      <span>Private Study Habits & Metrics</span>
                    </span>

                    <label className="flex items-center gap-2 cursor-pointer text-zinc-300 select-none">
                      <input
                        type="checkbox"
                        checked={selectiveOptions.includeSm2Stats}
                        onChange={() => handleToggleOption("includeSm2Stats")}
                        className="rounded bg-zinc-800 text-indigo-600 border-zinc-700"
                      />
                      <span>SM-2 Repetition Intervals & Due Dates</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-zinc-300 select-none">
                      <input
                        type="checkbox"
                        checked={selectiveOptions.includeMasteryStatus}
                        onChange={() => handleToggleOption("includeMasteryStatus")}
                        className="rounded bg-zinc-800 text-indigo-600 border-zinc-700"
                      />
                      <span>Question Mastery Status (Mastered / Review)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-zinc-300 select-none">
                      <input
                        type="checkbox"
                        checked={selectiveOptions.includeStarredFlags}
                        onChange={() => handleToggleOption("includeStarredFlags")}
                        className="rounded bg-zinc-800 text-indigo-600 border-zinc-700"
                      />
                      <span>Starred Favorites List</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Real-time Package Live Summary */}
              {exportBundle && (
                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-bold text-zinc-200">
                    <span>Export Package Summary:</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                        exportBundle.summary.hasPrivateMetrics
                          ? "bg-amber-950 text-amber-400 border border-amber-800"
                          : "bg-emerald-950 text-emerald-400 border border-emerald-800"
                      }`}
                    >
                      {exportBundle.summary.hasPrivateMetrics
                        ? "⚠️ Includes Personal Stats"
                        : "✓ Clean Classmate Share (No Personal Stats)"}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-zinc-400 text-[11px] pt-1">
                    <span>📚 {exportBundle.summary.questionCount} Questions</span>
                    <span>•</span>
                    <span>📖 {exportBundle.summary.conceptCount} Concepts</span>
                    <span>•</span>
                    <span>🎙️ {exportBundle.summary.lectureCount} Lectures</span>
                    <span>•</span>
                    <span>💡 {exportBundle.summary.insightCount} Insights</span>
                    <span>•</span>
                    <span className="font-semibold text-amber-300">
                      ✍️ {exportBundle.summary.writtenSolutionCount} Solutions
                    </span>
                  </div>
                </div>
              )}

              {/* Format Picker & Download Button */}
              <div className="space-y-3 pt-2 border-t border-zinc-800">
                <label className="text-xs font-bold text-zinc-300">3. Select Output Format & Export</label>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setExportFormat("json")}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border ${
                      exportFormat === "json"
                        ? "bg-indigo-600 text-white border-indigo-500 shadow-md"
                        : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200"
                    }`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Course Noting Pack (.json)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportFormat("markdown")}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border ${
                      exportFormat === "markdown"
                        ? "bg-indigo-600 text-white border-indigo-500 shadow-md"
                        : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200"
                    }`}
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>Formatted Markdown (.md)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportFormat("string")}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border ${
                      exportFormat === "string"
                        ? "bg-indigo-600 text-white border-indigo-500 shadow-md"
                        : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200"
                    }`}
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copyable Chat String</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadSelective}
                  disabled={!exportBundle || isZeroWeeksSelected}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed mt-2"
                >
                  {exportFormat === "json" ? (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Download Selected Course Pack (.json)</span>
                    </>
                  ) : exportFormat === "markdown" ? (
                    <>
                      <FileDown className="w-4 h-4" />
                      <span>Download Document (.md) for Obsidian / Notion</span>
                    </>
                  ) : (
                    <>
                      {copiedSelective ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedSelective ? "Copied String to Clipboard!" : "Copy Shareable String to Clipboard"}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: QUICK FULL BACKUP */}
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
                  <span>Full Raw Save String (All Courses & Progress)</span>
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

          {/* TAB 3: LOAD / RESTORE WITH IMPORT PREVIEW */}
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
                placeholder="Paste your shared classmate pack, save string, or raw JSON backup here..."
                rows={4}
                className="w-full rounded-xl bg-zinc-900 border border-zinc-800 p-3 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 resize-none"
              />

              {/* Dynamic Import Preview Card */}
              {importSummary && (
                <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-800/60 space-y-2.5 animate-in fade-in text-xs">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-indigo-300 flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4" />
                      <span>Pack Preview: {importSummary.courseCode}</span>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                        importSummary.hasPrivateMetrics
                          ? "bg-amber-950 text-amber-300 border border-amber-800"
                          : "bg-emerald-950 text-emerald-300 border border-emerald-800"
                      }`}
                    >
                      {importSummary.hasPrivateMetrics ? "Includes Personal Stats" : "Clean Classmate Pack"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                    <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800">
                      <div className="text-zinc-500">Questions</div>
                      <div className="font-bold text-zinc-200">{importSummary.questionCount}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800">
                      <div className="text-zinc-500">Lectures</div>
                      <div className="font-bold text-zinc-200">{importSummary.lectureCount}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800">
                      <div className="text-zinc-500">Insights</div>
                      <div className="font-bold text-zinc-200">{importSummary.insightCount}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800">
                      <div className="text-zinc-500">Solutions</div>
                      <div className="font-bold text-amber-300">{importSummary.writtenSolutionCount}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={loading || !inputString.trim()}
                  onClick={handleRestore}
                  className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition cursor-pointer shadow-md"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Importing Pack...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Confirm & Import Pack</span>
                    </>
                  )}
                </button>

                <label className="py-2.5 px-4 rounded-xl font-bold text-xs flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition cursor-pointer border border-zinc-700">
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

          {/* TAB 4: CLEAN SLATE / RESET FOR SHARING */}
          {activeTab === "reset" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2 text-xs leading-relaxed text-zinc-300">
                <div className="font-bold text-zinc-100 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Sharing the Repository with Others?</span>
                </div>
                <p>
                  Because all your progress is dedicated to the <code className="text-indigo-400 font-mono">userdata/</code> directory (which is gitignored), anyone who clones or downloads this repository gets a fresh, clean course setup with all original problem sheets intact.
                </p>
                <p className="text-zinc-400">
                  If you want to clear your local working to test a clean installation or share a screen recording, you can reset your local progress here.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-900/60 text-xs text-amber-200 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Important:</strong> Make sure you go to the <strong>Selective Export</strong> or <strong>Quick Backup</strong> tab and save a copy first so you can restore your progress at any time!
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

          {activeTab === "cnpack" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="p-4 rounded-xl bg-violet-950/20 border border-violet-500/30 space-y-2">
                <div className="flex items-center gap-2 text-violet-300 font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  <span>Portable Course Pack (.cnpack) Engine</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  A <code className="text-violet-300 font-mono">.cnpack</code> archive bundles everything for this course into a single shareable file: the interactive web questions, concept cheat sheets, compiled PDFs, <strong>plus the complete raw LaTeX source workspace</strong> (main.tex, preamble, macros, chapters, and analytical dossiers).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Export Card */}
                <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Download className="w-4 h-4 text-indigo-400" />
                      <span>Export Course Pack</span>
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Download a single package containing raw LaTeX source files and web study packs to share cleanly with classmates.
                    </p>
                  </div>

                  <a
                    href={`/api/courses/pack?course=${activeCourseId}`}
                    download={`${activeCourseId}_coursebook.cnpack`}
                    className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-indigo-600/30 text-center"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download .cnpack Archive</span>
                  </a>
                </div>

                {/* Import Card */}
                <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Upload className="w-4 h-4 text-emerald-400" />
                      <span>Import Course Pack</span>
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Load a classmate&apos;s .cnpack file to unpack both the interactive web hub and the local LaTeX textbook source.
                    </p>
                  </div>

                  <label className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm text-center">
                    <Upload className="w-4 h-4 text-emerald-400" />
                    <span>Select .cnpack File</span>
                    <input
                      type="file"
                      accept=".cnpack,.json"
                      onChange={handleImportCnpackFile}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
