"use client";

import React, { useEffect, useState, use, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Question, QuestionStatus, ProofReviewResult, AISettings } from "@/lib/types";
import { MathRenderer } from "@/components/math/MathRenderer";
import { SplitEditor } from "@/components/math/SplitEditor";
import { ConceptDrawer } from "@/components/concepts/ConceptDrawer";
import { ScratchpadCanvas } from "@/components/canvas/ScratchpadCanvas";
import { EmbeddedPdfViewer } from "@/components/pdf/EmbeddedPdfViewer";
import { calculateNextSM2, getIntervalPreview, isDueToday } from "@/lib/sm2-service";
import { loadActiveCourseData, getActiveCourseId, isLocalStudio } from "@/lib/pack-loader";
import { auditProofWithGemini } from "@/lib/gemini-client";
import confetti from "canvas-confetti";
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Star,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  BookOpen,
  Eye,
  EyeOff,
  Flame,
  Sparkles,
  PenTool,
  Cpu,
  AlertTriangle,
  Check,
  Copy,
  ChevronDown,
  ChevronUp,
  Loader2,
  Calendar,
  Layers
} from "lucide-react";

export function QuestionWorkspaceClient({ id }: { id: string }) {
  const router = useRouter();

  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [isConceptDrawerOpen, setIsConceptDrawerOpen] = useState(false);

  // Tabs for Work Area
  const [activeTab, setActiveTab] = useState<"solution" | "hints" | "official">("solution");
  const [showOfficialAnswer, setShowOfficialAnswer] = useState(false);

  // Editable solution content & scratchpad state
  const [solutionText, setSolutionText] = useState("");
  const [hintsText, setHintsText] = useState("");
  const [canvasData, setCanvasData] = useState<string | undefined>(undefined);
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(false);
  const [isPdfViewerOpen, setIsPdfViewerOpen] = useState(false);

  // AI Proof Review State
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewResult, setReviewResult] = useState<ProofReviewResult | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(true);
  const [copiedPatch, setCopiedPatch] = useState(false);

  // SM-2 Flashcard notification
  const [sm2Notice, setSm2Notice] = useState("");

  const [allQuestionIds, setAllQuestionIds] = useState<string[]>([]);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    const courseId = localStorage.getItem("math_active_course") || "";
    if (courseId) {
      fetch(`/api/questions?course=${courseId}`, { cache: "no-store" })
        .then((res) => {
          if (!res.ok) throw new Error("API not available");
          return res.json();
        })
        .then((data: { id: string }[]) => {
          if (Array.isArray(data)) {
            setAllQuestionIds(data.map((q) => q.id));
          }
        })
        .catch(async () => {
          const merged = await loadActiveCourseData();
          if (merged?.questions) {
            setAllQuestionIds(merged.questions.map((q) => q.id));
          }
        });
    }
  }, []);

  useEffect(() => {
    const courseId = localStorage.getItem("math_active_course") || "";
    if (!courseId) return;
    fetch(`/api/questions/${id}?course=${courseId}`, { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data: Question) => {
        setQuestion(data);
        setSolutionText(data.content.solution || "");
        setHintsText(data.content.hints || "");
        setCanvasData(data.canvasData);
        if (data.lastProofReview) {
          setReviewResult(data.lastProofReview);
        }
      })
      .catch(async () => {
        // Fallback for static export / offline GitHub Pages
        const merged = await loadActiveCourseData();
        const found = merged?.questions.find((q) => q.id === id);
        if (found) {
          const localSaved = localStorage.getItem(`cn_progress_${courseId}_${id}`);
          const finalQ = localSaved ? { ...found, ...JSON.parse(localSaved) } : found;
          setQuestion(finalQ);
          setSolutionText(finalQ.content?.solution || "");
          setHintsText(finalQ.content?.hints || "");
          setCanvasData(finalQ.canvasData);
          if (finalQ.lastProofReview) {
            setReviewResult(finalQ.lastProofReview);
          }
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Debounced Autosave (1.5 seconds after you pause typing)
  useEffect(() => {
    if (isInitialLoad.current) {
      if (question) isInitialLoad.current = false;
      return;
    }

    const timer = setTimeout(() => {
      handleSave();
    }, 1500);

    return () => clearTimeout(timer);
  }, [solutionText, hintsText, canvasData]);

  // Ctrl + S Keyboard Shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [solutionText, hintsText, canvasData, question]);

  const handleSave = async (updatedFields?: Partial<Question>) => {
    if (!question) return;

    setSaving(true);
    setSaveMessage("Saving...");

    const courseId = getActiveCourseId();
    const updatedPayload: Question = {
      ...question,
      ...updatedFields,
      canvasData: updatedFields?.canvasData !== undefined ? updatedFields.canvasData : canvasData,
      content: {
        ...question.content,
        solution: solutionText,
        hints: hintsText
      }
    };

    try {
      const res = await fetch(`/api/questions/${id}?course=${courseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedPayload)
      });

      if (!res.ok) throw new Error("Failed to save via API");

      setQuestion(updatedPayload);
      setSaveMessage("Saved ✓");

      if (updatedFields?.status === "Mastered" && question.status !== "Mastered") {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.7 }
        });
      }

      setTimeout(() => setSaveMessage(""), 2500);
    } catch {
      // Offline / GitHub Pages fallback: Persist Layer 3 state into browser localStorage
      try {
        localStorage.setItem(`cn_progress_${courseId}_${id}`, JSON.stringify(updatedPayload));
        setQuestion(updatedPayload);
        setSaveMessage("Saved locally ✓");
        if (updatedFields?.status === "Mastered" && question.status !== "Mastered") {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.7 }
          });
        }
        setTimeout(() => setSaveMessage(""), 2500);
      } catch (storageErr) {
        setSaveMessage("Save failed");
        console.error(storageErr);
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleStar = async () => {
    if (!question) return;
    const newStarred = !question.starred;
    setQuestion({ ...question, starred: newStarred });

    try {
      const courseId = getActiveCourseId();
      await fetch(`/api/questions/${id}?course=${courseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...question, starred: newStarred })
      });
    } catch (err) {
      console.error(err);
    }
  };

  // SM-2 Review Rating Handler
  const handleSM2Rating = async (rating: "again" | "hard" | "good" | "easy") => {
    if (!question) return;
    const nextSM2 = calculateNextSM2(question.sm2, rating);

    // Map rating to recommended question status
    let newStatus = question.status;
    if (rating === "again") newStatus = "Needs Review";
    else if (rating === "hard") newStatus = "In Progress";
    else if (rating === "good" || rating === "easy") newStatus = "Mastered";

    const updated = {
      ...question,
      status: newStatus,
      sm2: nextSM2
    };

    setQuestion(updated);
    setSm2Notice(`Next review: ${nextSM2.dueDate} (in ${nextSM2.interval}d)`);
    setTimeout(() => setSm2Notice(""), 4000);

    await handleSave({ status: newStatus, sm2: nextSM2 });

    if (rating === "easy" || rating === "good") {
      confetti({ particleCount: 50, spread: 45, origin: { y: 0.7 } });
    }
  };

  // Run AI Proof Review
  const handleAIProofReview = async () => {
    if (!solutionText.trim()) {
      alert("Please write or type your proof first before requesting an AI audit!");
      return;
    }

    setIsReviewing(true);
    setReviewResult(null);

    try {
      const courseId = getActiveCourseId();

      // Load AI settings from localStorage
      let aiSettings: AISettings = { provider: "gemini" };
      try {
        const stored = localStorage.getItem("cn_ai_settings");
        if (stored) aiSettings = JSON.parse(stored);
      } catch {}

      const apiKey =
        aiSettings.provider === "gemini"
          ? aiSettings.geminiKey
          : aiSettings.provider === "openai"
          ? aiSettings.openaiKey
          : aiSettings.provider === "anthropic"
          ? aiSettings.anthropicKey
          : undefined;

      // On GitHub Pages (Static Mode)
      if (!isLocalStudio()) {
        if (aiSettings.provider === "ollama") {
          throw new Error(
            "Local Ollama requires Localhost Studio (http://localhost:3000). On static GitHub Pages, web browsers block connections to local endpoints (http://localhost:11434). Please switch to Google Gemini (Free Tier) in Settings, or run 'npm run dev' on your computer."
          );
        }

        if (aiSettings.provider === "gemini") {
          if (!apiKey || !apiKey.trim()) {
            throw new Error(
              "Please configure your Google Gemini API key in Settings (Gear icon in top navigation) first. You can get a free key instantly at aistudio.google.com."
            );
          }

          const result = await auditProofWithGemini({
            prompt: question?.content.prompt || "",
            official: question?.content.official,
            studentSolution: solutionText,
            apiKey: apiKey.trim(),
            model: aiSettings.geminiModel
          });

          setReviewResult(result);
          setIsReviewOpen(true);
          if (question) {
            setQuestion({ ...question, lastProofReview: result });
          }
          return;
        }

        throw new Error(
          `Direct browser execution for ${aiSettings.provider.toUpperCase()} is not available on static GitHub Pages. Please switch to Google Gemini (Free Tier) or run 'npm run dev' locally.`
        );
      }

      // Local Studio: Call local Node API proxy
      const chosenModel =
        aiSettings.provider === "gemini"
          ? aiSettings.geminiModel
          : aiSettings.provider === "openai"
          ? aiSettings.openaiModel
          : aiSettings.provider === "anthropic"
          ? aiSettings.anthropicModel
          : aiSettings.ollamaModel;

      const res = await fetch("/api/ai/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: id,
          courseId,
          studentSolution: solutionText,
          apiKey,
          provider: aiSettings.provider,
          model: chosenModel,
          geminiModel: aiSettings.geminiModel,
          openaiModel: aiSettings.openaiModel,
          anthropicModel: aiSettings.anthropicModel,
          ollamaUrl: aiSettings.ollamaUrl,
          ollamaModel: aiSettings.ollamaModel
        })
      });

      if (!res.ok) {
        let errorMsg = "Proof review request failed";
        try {
          const errData = await res.json();
          errorMsg = errData.error || errorMsg;
        } catch {}
        throw new Error(errorMsg);
      }

      const data = await res.json();
      setReviewResult(data.result);
      setIsReviewOpen(true);

      if (question) {
        setQuestion({ ...question, lastProofReview: data.result });
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to audit proof. Please check your AI settings.");
    } finally {
      setIsReviewing(false);
    }
  };

  const copySuggestedPatch = (patchText: string) => {
    navigator.clipboard.writeText(patchText);
    setCopiedPatch(true);
    setTimeout(() => setCopiedPatch(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-zinc-500 animate-pulse text-sm">
        Loading question workspace...
      </div>
    );
  }

  if (!question) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-zinc-200">Question not found</h2>
        <Link href="/questions" className="text-indigo-400 hover:underline text-sm font-semibold">
          Return to Question Bank →
        </Link>
      </div>
    );
  }

  const currentIndex = allQuestionIds.indexOf(id);
  const prevId = currentIndex > 0 ? allQuestionIds[currentIndex - 1] : null;
  const nextId = currentIndex >= 0 && currentIndex < allQuestionIds.length - 1 ? allQuestionIds[currentIndex + 1] : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/questions"
            className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition"
            title="Back to questions list"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-sm px-2.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                Q{question.number}
              </span>
              <h1 className="text-lg sm:text-xl font-bold text-zinc-100">{question.title}</h1>
              {question.isDifficult && (
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-950 text-amber-400 border border-amber-800 flex items-center gap-1">
                  <Flame className="w-3 h-3" />
                  <span>Hard (*)</span>
                </span>
              )}
            </div>
            <div className="text-xs text-zinc-400 mt-0.5">
              Week {question.week} • {question.topic} • {question.source}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Star Button */}
          <button
            type="button"
            onClick={toggleStar}
            className={`p-2 rounded-lg border transition cursor-pointer ${
              question.starred
                ? "bg-yellow-950/60 border-yellow-700/80 text-yellow-400"
                : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-yellow-400"
            }`}
            title={question.starred ? "Starred for revision" : "Star for revision"}
          >
            <Star className={`w-4 h-4 ${question.starred ? "fill-yellow-400" : ""}`} />
          </button>

          {/* Concepts Cheat Sheet Trigger */}
          <button
            type="button"
            onClick={() => setIsConceptDrawerOpen(true)}
            className="px-3 py-2 rounded-lg bg-indigo-950/70 border border-indigo-800/80 text-indigo-300 hover:bg-indigo-600 hover:text-white transition text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <BookOpen className="w-4 h-4" />
            <span>Concepts ({question.concepts.length})</span>
          </button>

          {/* Status Dropdown */}
          <select
            value={question.status}
            onChange={(e) => handleSave({ status: e.target.value as QuestionStatus })}
            className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="Unattempted">Status: Unattempted</option>
            <option value="In Progress">Status: In Progress</option>
            <option value="Needs Review">Status: Needs Review</option>
            <option value="Mastered">Status: Mastered ✓</option>
          </select>

          {/* Save Button */}
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer ${
              saveMessage.includes("✓")
                ? "bg-emerald-600 text-white"
                : "bg-indigo-600 hover:bg-indigo-500 text-white"
            }`}
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving..." : saveMessage || "Save (Ctrl+S)"}</span>
          </button>

          {/* Next & Previous Navigation */}
          <div className="flex items-center gap-1 border-l border-zinc-800 pl-2">
            {prevId ? (
              <Link
                href={`/questions/${prevId}`}
                className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition"
                title="Previous Question"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
            ) : (
              <span className="p-2 rounded-lg bg-zinc-900/40 text-zinc-700 border border-zinc-800/40 cursor-not-allowed">
                <ArrowLeft className="w-4 h-4" />
              </span>
            )}

            {nextId ? (
              <Link
                href={`/questions/${nextId}`}
                className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition"
                title="Next Question"
              >
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <span className="p-2 rounded-lg bg-zinc-900/40 text-zinc-700 border border-zinc-800/40 cursor-not-allowed">
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </div>
        </div>
      </div>

      {/* SM-2 Spaced Repetition Bar (Anki Style) */}
      <div className="p-3 sm:px-4 sm:py-2.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold text-zinc-300">Spaced Review:</span>
          {question.sm2 ? (
            <span className="text-xs text-zinc-400">
              Rep #{question.sm2.repetition} • Due:{" "}
              <span className={isDueToday(question.sm2.dueDate) ? "text-amber-400 font-bold" : "text-zinc-300"}>
                {question.sm2.dueDate} {isDueToday(question.sm2.dueDate) ? "(Due Today!)" : ""}
              </span>
            </span>
          ) : (
            <span className="text-xs text-zinc-500">Not yet scheduled</span>
          )}
          {sm2Notice && (
            <span className="text-xs text-emerald-400 font-semibold animate-pulse ml-2">
              {sm2Notice}
            </span>
          )}
        </div>

        {/* 4 Anki Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => handleSM2Rating("again")}
            className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-bold transition cursor-pointer"
            title="Needed solution / failed completely"
          >
            Again ({getIntervalPreview(question.sm2, "again")})
          </button>
          <button
            type="button"
            onClick={() => handleSM2Rating("hard")}
            className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 text-xs font-bold transition cursor-pointer"
            title="Struggled or had major gaps"
          >
            Hard ({getIntervalPreview(question.sm2, "hard")})
          </button>
          <button
            type="button"
            onClick={() => handleSM2Rating("good")}
            className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 text-xs font-bold transition cursor-pointer"
            title="Correct proof with reasonable effort"
          >
            Good ({getIntervalPreview(question.sm2, "good")})
          </button>
          <button
            type="button"
            onClick={() => handleSM2Rating("easy")}
            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 text-xs font-bold transition cursor-pointer"
            title="Instant recall / flawless proof"
          >
            Easy ({getIntervalPreview(question.sm2, "easy")})
          </button>
        </div>
      </div>

      {/* Question Prompt Display Box */}
      <div className="p-5 sm:p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 shadow-md space-y-4">
        <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold uppercase tracking-wider border-b border-zinc-800/60 pb-2">
          <span>Problem Statement</span>
          {question.snipUrl && (
            <span className="text-indigo-400">Cropped from problem sheet</span>
          )}
        </div>

        {question.snipUrl && (
          <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 max-w-xl mx-auto overflow-hidden">
            <img src={question.snipUrl} alt="Question snip" className="max-h-72 mx-auto rounded object-contain" />
          </div>
        )}

        <div className="text-zinc-100 text-base leading-relaxed">
          <MathRenderer content={question.content.prompt} />
        </div>
      </div>

      {/* Solution & Hints Workspace Area */}
      <div className="space-y-3">
        {/* Workspace Tab Switcher & Quick Actions */}
        <div className="flex flex-wrap items-center justify-between border-b border-zinc-800 pb-1 gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("solution")}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
                activeTab === "solution"
                  ? "border-indigo-500 text-indigo-400"
                  : "border-transparent text-zinc-400 hover:text-zinc-200"
              }`}
            >
              My Solution & Working
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("hints")}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
                activeTab === "hints"
                  ? "border-indigo-500 text-indigo-400"
                  : "border-transparent text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Hints & Key Steps
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("official")}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
                activeTab === "official"
                  ? "border-indigo-500 text-indigo-400"
                  : "border-transparent text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Official Answer / Notes
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Textbook PDF Button */}
            <button
              type="button"
              onClick={() => setIsPdfViewerOpen(!isPdfViewerOpen)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                isPdfViewerOpen
                  ? "bg-indigo-600 text-white border-indigo-500 shadow-sm"
                  : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800"
              }`}
              title="Toggle typeset textbook PDF reader side-by-side"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>{isPdfViewerOpen ? "Hide PDF" : "📖 Textbook PDF"}</span>
            </button>

            {/* Toggle Scratchpad Button */}
            <button
              type="button"
              onClick={() => setIsScratchpadOpen(!isScratchpadOpen)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                isScratchpadOpen
                  ? "bg-violet-600 text-white border-violet-500 shadow-sm"
                  : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800"
              }`}
              title="Toggle handwriting & chalkboard scratchpad"
            >
              <PenTool className="w-3.5 h-3.5 text-violet-400" />
              <span>{isScratchpadOpen ? "Hide Scratchpad" : "✍️ Scratchpad Canvas"}</span>
            </button>

            {/* AI Proof Reviewer Trigger */}
            <button
              type="button"
              onClick={handleAIProofReview}
              disabled={isReviewing || !solutionText.trim()}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm disabled:opacity-40 cursor-pointer"
              title="Audit typed proof against lecturer benchmark and flag missing hypotheses"
            >
              {isReviewing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>{isReviewing ? "Auditing Proof..." : "🤖 Audit Proof with AI"}</span>
            </button>
          </div>
        </div>

        {/* Embedded Side-by-Side PDF Viewer */}
        {isPdfViewerOpen && (
          <EmbeddedPdfViewer
            courseId={getActiveCourseId()}
            chapter={question?.chapter || question?.week || 1}
            chapterPdfPage={question?.chapterPdfPage || 1}
            onClose={() => setIsPdfViewerOpen(false)}
          />
        )}

        {/* Scratchpad Canvas Drawer */}
        {isScratchpadOpen && (
          <ScratchpadCanvas
            initialData={canvasData}
            onChange={(newCanvasData) => {
              setCanvasData(newCanvasData);
            }}
            onInsertImage={(imgMd) => {
              setSolutionText((prev) => prev + imgMd);
            }}
            onClose={() => setIsScratchpadOpen(false)}
          />
        )}

        {/* AI Proof Review Audit Card */}
        {reviewResult && (
          <div className="rounded-2xl bg-zinc-950 border border-violet-500/40 shadow-2xl overflow-hidden animate-in fade-in duration-200">
            {/* Card Header */}
            <div className="px-5 py-3.5 bg-violet-950/30 border-b border-violet-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-violet-600/30 border border-violet-500/40 flex items-center justify-center text-violet-300">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-zinc-100">AI Proof Auditor Report</h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${
                        reviewResult.verdict === "Rigorous Proof"
                          ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                          : reviewResult.verdict === "Correct with Minor Gaps"
                          ? "bg-blue-950 text-blue-300 border-blue-800"
                          : reviewResult.verdict === "Missing Hypotheses"
                          ? "bg-amber-950 text-amber-300 border-amber-800"
                          : "bg-rose-950 text-rose-300 border-rose-800"
                      }`}
                    >
                      {reviewResult.verdict}
                    </span>
                    <span className="text-xs font-mono font-bold text-violet-300 bg-violet-950/80 px-2 py-0.5 rounded border border-violet-800">
                      Score: {reviewResult.score}/10
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">{reviewResult.summary}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsReviewOpen(!isReviewOpen)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition"
              >
                {isReviewOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {/* Card Body */}
            {isReviewOpen && (
              <div className="p-5 space-y-4 text-xs">
                {/* Missing Hypotheses Callout */}
                {reviewResult.missingHypotheses && reviewResult.missingHypotheses.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-amber-400">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Missing Hypotheses & Unchecked Conditions</span>
                    </div>
                    <ul className="list-disc pl-5 space-y-1 text-zinc-300">
                      {reviewResult.missingHypotheses.map((item, idx) => (
                        <li key={idx}>
                          <MathRenderer content={item} />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Logical Gaps */}
                {reviewResult.logicalGaps && reviewResult.logicalGaps.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-rose-400">
                      <AlertCircle className="w-4 h-4" />
                      <span>Logical Leaps & Unjustified Assertions</span>
                    </div>
                    <ul className="list-disc pl-5 space-y-1 text-zinc-300">
                      {reviewResult.logicalGaps.map((item, idx) => (
                        <li key={idx}>
                          <MathRenderer content={item} />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Strengths */}
                {reviewResult.strengths && reviewResult.strengths.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Sound Deductions & Valid Reasoning</span>
                    </div>
                    <ul className="list-disc pl-5 space-y-1 text-zinc-300">
                      {reviewResult.strengths.map((item, idx) => (
                        <li key={idx}>
                          <MathRenderer content={item} />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Alternative Method Notes */}
                {reviewResult.alternativeMethodNotes && (
                  <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300">
                    <span className="font-bold text-indigo-400">Alternative Approach Note: </span>
                    {reviewResult.alternativeMethodNotes}
                  </div>
                )}

                {/* Suggested LaTeX Patch */}
                {reviewResult.suggestedPatch && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-300">Suggested Proof Patch & Rigorous Steps:</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => copySuggestedPatch(reviewResult.suggestedPatch)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-[11px] font-semibold cursor-pointer"
                        >
                          {copiedPatch ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedPatch ? "Copied!" : "Copy Patch"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSolutionText((prev) => `${prev}\n\n### Suggested Rigorous Patch\n${reviewResult.suggestedPatch}\n`);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold cursor-pointer"
                        >
                          <span>Append to Working</span>
                        </button>
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-zinc-200">
                      <MathRenderer content={reviewResult.suggestedPatch} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 1: Solution Split Editor */}
        {activeTab === "solution" && (
          <div className="space-y-3">
            <SplitEditor
              value={solutionText}
              onChange={setSolutionText}
              placeholder="Insert your mathematical proof or solution here using LaTeX ($...$ for inline, $$...$$ for display blocks). Click '✍️ Scratchpad Canvas' above to draw or write notes!"
              minHeight="480px"
            />
            <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
              <span>Supports typed LaTeX, scratchpad chalkboard vectors, and image attachments</span>
              <button
                type="button"
                onClick={() => handleSave()}
                className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold cursor-pointer transition"
              >
                Save Working
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Hints & Key Steps */}
        {activeTab === "hints" && (
          <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
            <h3 className="text-sm font-bold text-indigo-300">Method & Hint Checklist</h3>
            <textarea
              value={hintsText}
              onChange={(e) => setHintsText(e.target.value)}
              placeholder="Record hints, key steps, or method notes for this problem..."
              rows={6}
              className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 font-mono focus:outline-none focus:border-indigo-500"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => handleSave()}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
              >
                Save Hints
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Official Answer / Solution Notes */}
        {activeTab === "official" && (
          <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-zinc-100">Official Solution Notes & Answers</h3>
                <p className="text-xs text-zinc-400">Directly from the problem sheet</p>
              </div>

              <button
                type="button"
                onClick={() => setShowOfficialAnswer(!showOfficialAnswer)}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                {showOfficialAnswer ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showOfficialAnswer ? "Hide Answer" : "Reveal Answer"}</span>
              </button>
            </div>

            {showOfficialAnswer ? (
              <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80 text-zinc-200 text-sm leading-relaxed">
                {question.content.official ? (
                  <MathRenderer content={question.content.official} />
                ) : (
                  <span className="italic text-zinc-500">
                    No official answer given in the original problem sheet for this proof question.
                  </span>
                )}
              </div>
            ) : (
              <div className="p-10 rounded-xl bg-zinc-950 border border-dashed border-zinc-800 text-center space-y-2">
                <p className="text-xs text-zinc-400">
                  Official answer is hidden so you can attempt the solution first.
                </p>
                <button
                  type="button"
                  onClick={() => setShowOfficialAnswer(true)}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer"
                >
                  Reveal Official Answer
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Slide-out Concept Drawer */}
      <ConceptDrawer
        isOpen={isConceptDrawerOpen}
        onClose={() => setIsConceptDrawerOpen(false)}
        conceptSlugs={question.concepts}
      />
    </div>
  );
}
