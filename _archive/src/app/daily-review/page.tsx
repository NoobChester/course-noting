"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Question, QuestionMeta, SM2Rating } from "@/lib/types";
import { MathRenderer } from "@/components/math/MathRenderer";
import { ScratchpadCanvas } from "@/components/canvas/ScratchpadCanvas";
import { calculateNextSM2, getIntervalPreview, isDueToday } from "@/lib/sm2-service";
import { getActiveCourseId, loadActiveCourseData, isLocalStudio } from "@/lib/pack-loader";
import confetti from "canvas-confetti";
import {
  Flame,
  CheckCircle2,
  Calendar,
  Eye,
  EyeOff,
  PenTool,
  ArrowRight,
  RotateCcw,
  Sparkles,
  BookOpen,
  ArrowLeft,
  GraduationCap,
  Layers,
  ChevronRight,
  Check
} from "lucide-react";

export default function DailyReviewPage() {
  const [courseId, setCourseId] = useState<string>("");
  const [fullQuestionsMap, setFullQuestionsMap] = useState<{ [id: string]: Question }>({});
  const [loading, setLoading] = useState(true);
  const [allQuestions, setAllQuestions] = useState<QuestionMeta[]>([]);
  const [dueQueue, setDueQueue] = useState<QuestionMeta[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Active question details
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [showOfficial, setShowOfficial] = useState(false);
  const [showScratchpad, setShowScratchpad] = useState(false);
  const [workingText, setWorkingText] = useState("");
  const [sessionCompletedCount, setSessionCompletedCount] = useState(0);

  // Mode: "due_only" vs "all_review"
  const [mode, setMode] = useState<"due" | "all">("due");

  useEffect(() => {
    const saved = getActiveCourseId();
    if (!saved) {
      setLoading(false);
      return;
    }
    setCourseId(saved);

    fetch(`/api/questions?course=${saved}`)
      .then((res) => {
        if (!res.ok) throw new Error("API not available");
        return res.json();
      })
      .then((questions: QuestionMeta[]) => {
        setAllQuestions(questions);
        const due = questions.filter((q) => isDueToday(q.sm2?.dueDate));
        setDueQueue(due);
        if (due.length === 0) {
          const needsReview = questions.filter((q) => q.status === "Needs Review" || q.status === "Unattempted");
          setDueQueue(needsReview.slice(0, 10));
          setMode("all");
        }
      })
      .catch(async () => {
        const merged = await loadActiveCourseData();
        if (merged) {
          setAllQuestions(merged.questions);
          const map: { [id: string]: Question } = {};
          merged.questions.forEach((q) => {
            map[q.id] = q;
          });
          setFullQuestionsMap(map);
          const due = merged.questions.filter((q) => isDueToday(q.sm2?.dueDate));
          setDueQueue(due);
          if (due.length === 0) {
            const needsReview = merged.questions.filter((q) => q.status === "Needs Review" || q.status === "Unattempted");
            setDueQueue(needsReview.slice(0, 10));
            setMode("all");
          }
        }
      })
      .finally(() => setLoading(false));
  }, []);

  // Load full content when currentIndex changes
  useEffect(() => {
    if (dueQueue.length === 0 || currentIndex >= dueQueue.length) {
      setCurrentQuestion(null);
      return;
    }

    const qMeta = dueQueue[currentIndex];
    setLoadingQuestion(true);
    setShowOfficial(false);

    if (fullQuestionsMap[qMeta.id]) {
      setCurrentQuestion(fullQuestionsMap[qMeta.id]);
      setWorkingText(fullQuestionsMap[qMeta.id].content.solution || "");
      setLoadingQuestion(false);
      return;
    }

    fetch(`/api/questions/${qMeta.id}?course=${courseId}`)
      .then((res) => {
        if (!res.ok) throw new Error("API not available");
        return res.json();
      })
      .then((q: Question) => {
        setCurrentQuestion(q);
        setWorkingText(q.content.solution || "");
      })
      .catch(() => {
        if (fullQuestionsMap[qMeta.id]) {
          setCurrentQuestion(fullQuestionsMap[qMeta.id]);
          setWorkingText(fullQuestionsMap[qMeta.id].content.solution || "");
        }
      })
      .finally(() => setLoadingQuestion(false));
  }, [currentIndex, dueQueue, courseId, fullQuestionsMap]);

  // Handle rating a question
  const handleRate = async (rating: SM2Rating) => {
    if (!currentQuestion) return;

    const nextSM2 = calculateNextSM2(currentQuestion.sm2, rating);
    let newStatus = currentQuestion.status;
    if (rating === "again") newStatus = "Needs Review";
    else if (rating === "hard") newStatus = "In Progress";
    else if (rating === "good" || rating === "easy") newStatus = "Mastered";

    const updated: Question = {
      ...currentQuestion,
      status: newStatus,
      sm2: nextSM2,
      content: {
        ...currentQuestion.content,
        solution: workingText
      }
    };

    // Save to server or localStorage
    if (isLocalStudio()) {
      try {
        await fetch(`/api/questions/${currentQuestion.id}?course=${courseId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated)
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      try {
        const storedKey = `cn_user_q_${courseId}_${currentQuestion.id}`;
        localStorage.setItem(storedKey, JSON.stringify(updated));
      } catch {}
    }

    setSessionCompletedCount((prev) => prev + 1);

    // If "Again", re-insert into end of queue for this session
    if (rating === "again") {
      setDueQueue((prev) => [...prev, currentQuestion]);
    }

    // Advance to next
    if (currentIndex + 1 >= dueQueue.length && rating !== "again") {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    }

    setCurrentIndex((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center text-zinc-500 animate-pulse text-sm">
        Preparing today's review queue...
      </div>
    );
  }

  // Queue Completed State
  if (currentIndex >= dueQueue.length || dueQueue.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-zinc-100">Daily Review Complete!</h1>
          <p className="text-sm text-zinc-400">
            {sessionCompletedCount > 0
              ? `You reviewed ${sessionCompletedCount} questions in this session. The SM-2 spaced repetition scheduler has updated your review intervals.`
              : "No questions currently due for review today. Great work staying on top of your spaced repetition!"}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link
            href="/questions"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
          >
            <span>Browse All Questions</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-semibold transition"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const progressPct = Math.round((currentIndex / dueQueue.length) * 100);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/questions"
            className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-400" />
              <h1 className="text-lg font-bold text-zinc-100">SuperMemo SM-2 Daily Review</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                {courseId.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Card {currentIndex + 1} of {dueQueue.length} • Spaced Repetition Queue
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-48 space-y-1">
          <div className="flex justify-between text-[11px] text-zinc-400">
            <span>Progress</span>
            <span className="font-mono font-bold">{progressPct}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden border border-zinc-800">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {loadingQuestion || !currentQuestion ? (
        <div className="p-16 text-center text-zinc-500 text-sm animate-pulse">
          Loading question card...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Question Card */}
          <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-xs px-2.5 py-1 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                  Q{currentQuestion.number}
                </span>
                <span className="text-sm font-bold text-zinc-200">{currentQuestion.title}</span>
              </div>
              <div className="text-xs text-zinc-400">
                Week {currentQuestion.week} • {currentQuestion.topic}
              </div>
            </div>

            {/* Prompt */}
            <div className="text-zinc-100 text-base leading-relaxed py-2">
              <MathRenderer content={currentQuestion.content.prompt} />
            </div>

            {/* If has snip */}
            {currentQuestion.snipUrl && (
              <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 max-w-md mx-auto">
                <img src={currentQuestion.snipUrl} alt="Problem snip" className="max-h-60 mx-auto rounded object-contain" />
              </div>
            )}
          </div>

          {/* Quick Actions Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowScratchpad(!showScratchpad)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  showScratchpad
                    ? "bg-violet-600 text-white border-violet-500 shadow-sm"
                    : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                <PenTool className="w-3.5 h-3.5 text-violet-400" />
                <span>{showScratchpad ? "Hide Scratchpad" : "✍️ Scratchpad Chalkboard"}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowOfficial(!showOfficial)}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                {showOfficial ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showOfficial ? "Hide Official Benchmark" : "Reveal Benchmark"}</span>
              </button>
            </div>

            <Link
              href={`/questions/${currentQuestion.id}`}
              target="_blank"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              <span>Full Workspace</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Collapsible Scratchpad */}
          {showScratchpad && (
            <ScratchpadCanvas
              initialData={currentQuestion.canvasData}
              onChange={(newCanvas) => {
                currentQuestion.canvasData = newCanvas;
              }}
              onInsertImage={(imgMd) => {
                setWorkingText((prev) => prev + imgMd);
              }}
              onClose={() => setShowScratchpad(false)}
            />
          )}

          {/* Official Benchmark Solution */}
          {showOfficial && (
            <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3 animate-in fade-in duration-150">
              <div className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Official Benchmark Solution
              </div>
              <div className="text-zinc-200 text-sm leading-relaxed p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                {currentQuestion.content.official ? (
                  <MathRenderer content={currentQuestion.content.official} />
                ) : (
                  <span className="italic text-zinc-500">
                    No official solution available in problem sheet.
                  </span>
                )}
              </div>
            </div>
          )}

          {/* SM-2 Anki Rating Bar */}
          <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl space-y-4">
            <div className="text-center space-y-1">
              <p className="text-xs font-bold text-zinc-300">How well did you recall or prove this problem?</p>
              <p className="text-[11px] text-zinc-500">
                Selecting a grade calculates the next optimal review date using SuperMemo SM-2.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Again */}
              <button
                type="button"
                onClick={() => handleRate("again")}
                className="p-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 flex flex-col items-center justify-center gap-1 transition cursor-pointer group"
              >
                <span className="text-xs font-bold uppercase tracking-wider">Again</span>
                <span className="text-[11px] text-rose-400/80 font-mono">
                  {getIntervalPreview(currentQuestion.sm2, "again")}
                </span>
                <span className="text-[10px] text-zinc-500 text-center line-clamp-1">
                  Failed / needed solution
                </span>
              </button>

              {/* Hard */}
              <button
                type="button"
                onClick={() => handleRate("hard")}
                className="p-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 flex flex-col items-center justify-center gap-1 transition cursor-pointer group"
              >
                <span className="text-xs font-bold uppercase tracking-wider">Hard</span>
                <span className="text-[11px] text-amber-400/80 font-mono">
                  {getIntervalPreview(currentQuestion.sm2, "hard")}
                </span>
                <span className="text-[10px] text-zinc-500 text-center line-clamp-1">
                  Struggled / missed steps
                </span>
              </button>

              {/* Good */}
              <button
                type="button"
                onClick={() => handleRate("good")}
                className="p-3 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 flex flex-col items-center justify-center gap-1 transition cursor-pointer group"
              >
                <span className="text-xs font-bold uppercase tracking-wider">Good</span>
                <span className="text-[11px] text-indigo-400/80 font-mono">
                  {getIntervalPreview(currentQuestion.sm2, "good")}
                </span>
                <span className="text-[10px] text-zinc-500 text-center line-clamp-1">
                  Correct with effort
                </span>
              </button>

              {/* Easy */}
              <button
                type="button"
                onClick={() => handleRate("easy")}
                className="p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 flex flex-col items-center justify-center gap-1 transition cursor-pointer group"
              >
                <span className="text-xs font-bold uppercase tracking-wider">Easy</span>
                <span className="text-[11px] text-emerald-400/80 font-mono">
                  {getIntervalPreview(currentQuestion.sm2, "easy")}
                </span>
                <span className="text-[10px] text-zinc-500 text-center line-clamp-1">
                  Instant recall / flawless
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
