"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { QuestionMeta, Question, QuestionStatus } from "@/lib/types";
import { MathRenderer } from "@/components/math/MathRenderer";
import confetti from "canvas-confetti";
import {
  Timer,
  Play,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Flame,
  ArrowRight,
  Eye,
  Award
} from "lucide-react";

export default function MockExamPage() {
  const [allQuestions, setAllQuestions] = useState<QuestionMeta[]>([]);
  const [loading, setLoading] = useState(true);

  // Configuration State
  const [isExamActive, setIsExamActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState("All");
  const [questionCount, setQuestionCount] = useState(4);
  const [durationMinutes, setDurationMinutes] = useState(45);

  // Active Exam State
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<{ [id: string]: string }>({});
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    fetch("/api/questions")
      .then((res) => res.json())
      .then((data: QuestionMeta[]) => setAllQuestions(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // Timer countdown
  useEffect(() => {
    if (!isExamActive || isFinished || secondsLeft <= 0) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          finishExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isExamActive, isFinished, secondsLeft]);

  const startExam = async () => {
    let pool = allQuestions;
    if (selectedTopic !== "All") {
      pool = pool.filter((q) => q.topic === selectedTopic);
    }

    if (pool.length === 0) {
      alert("No questions found for the selected topic filter.");
      return;
    }

    // Shuffle and pick questionCount
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(questionCount, shuffled.length));

    // Fetch full question bodies
    const fullQuestions: Question[] = [];
    for (const q of selected) {
      const res = await fetch(`/api/questions/${q.id}`);
      if (res.ok) {
        fullQuestions.push(await res.json());
      }
    }

    setExamQuestions(fullQuestions);
    setCurrentIdx(0);
    setAnswers({});
    setSecondsLeft(durationMinutes * 60);
    setIsExamActive(true);
    setIsFinished(false);
  };

  const finishExam = () => {
    setIsFinished(true);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handleUpdateStatus = async (id: string, newStatus: QuestionStatus) => {
    try {
      await fetch(`/api/questions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      setExamQuestions((prev) =>
        prev.map((q) => (q.id === id ? { ...q, status: newStatus } : q))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center text-zinc-500 animate-pulse text-sm">
        Loading exam simulator...
      </div>
    );
  }

  // SCREEN 1: Setup Exam
  if (!isExamActive && !isFinished) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold border border-amber-500/20">
            <Timer className="w-3.5 h-3.5" />
            <span>Timed Practice & Exam Simulation</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">MATH2621 Mock Exam</h1>
          <p className="text-sm text-zinc-400 max-w-lg mx-auto">
            Simulate realistic exam conditions under timed pressure. Hints and answers remain locked until you submit.
          </p>
        </div>

        <div className="p-6 sm:p-8 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-6 shadow-xl">
          {/* Topic Select */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300">Target Topic / Scope</label>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="All">Comprehensive (All Weeks 1–10 Topics)</option>
              <option value="Residue Calculus">Residue Calculus & Contour Integrals</option>
              <option value="Cauchy's integral formula">Cauchy's Integral Formula</option>
              <option value="Taylor series, Laurent series, and residues">Taylor & Laurent Series</option>
              <option value="Counting roots of equations">Counting Roots & Rouché's Theorem</option>
              <option value="Fourier and Laplace transforms">Fourier & Laplace Transforms</option>
            </select>
          </div>

          {/* Question Count & Time Limit */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300">Number of Questions</label>
              <select
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-indigo-500"
              >
                <option value={2}>2 Questions (Quick Sprint)</option>
                <option value={4}>4 Questions (Standard Test - 45m)</option>
                <option value={6}>6 Questions (Midterm Length - 60m)</option>
                <option value={8}>8 Questions (Full Exam - 90m)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300">Time Limit</label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-indigo-500"
              >
                <option value={20}>20 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>60 Minutes</option>
                <option value={90}>90 Minutes</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-800 flex justify-end">
            <button
              type="button"
              onClick={startExam}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer transition"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Start Timed Exam</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SCREEN 2: Active Exam
  if (isExamActive && !isFinished) {
    const currentQ = examQuestions[currentIdx];
    const isUrgent = secondsLeft < 300; // < 5 mins

    return (
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Floating Timer & Exam Controls */}
        <div className="sticky top-20 z-30 flex items-center justify-between p-4 rounded-xl bg-zinc-900/95 border border-zinc-800 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-xs px-2.5 py-1 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
              Exam in Progress
            </span>
            <span className="text-xs font-semibold text-zinc-400">
              Question {currentIdx + 1} of {examQuestions.length}
            </span>
          </div>

          {/* Countdown Clock */}
          <div
            className={`flex items-center gap-2 font-mono font-black text-lg px-3 py-1 rounded-lg border ${
              isUrgent
                ? "bg-red-950/80 text-red-400 border-red-700 animate-pulse"
                : "bg-zinc-950 text-amber-400 border-zinc-800"
            }`}
          >
            <Timer className="w-5 h-5" />
            <span>{formatTime(secondsLeft)}</span>
          </div>

          <button
            type="button"
            onClick={finishExam}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer"
          >
            Submit & Review
          </button>
        </div>

        {/* Question Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {examQuestions.map((q, idx) => (
            <button
              key={q.id}
              type="button"
              onClick={() => setCurrentIdx(idx)}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                currentIdx === idx
                  ? "bg-indigo-600 text-white shadow-sm"
                  : answers[q.id]?.trim()
                  ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                  : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:bg-zinc-800"
              }`}
            >
              Q{q.number} {answers[q.id]?.trim() && "✓"}
            </button>
          ))}
        </div>

        {/* Question Prompt */}
        {currentQ && (
          <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold border-b border-zinc-800 pb-2">
              <span>Q{currentQ.number} • {currentQ.topic}</span>
              {currentQ.isDifficult && (
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <Flame className="w-3 h-3" /> Hard (*)
                </span>
              )}
            </div>

            <div className="text-zinc-100 text-base leading-relaxed">
              <MathRenderer content={currentQ.content.prompt} />
            </div>
          </div>
        )}

        {/* Working Area Textarea */}
        {currentQ && (
          <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
            <label className="text-xs font-bold text-zinc-400">Your Working & Answer (LaTeX or steps):</label>
            <textarea
              value={answers[currentQ.id] || ""}
              onChange={(e) =>
                setAnswers({ ...answers, [currentQ.id]: e.target.value })
              }
              placeholder="Record your solution steps, calculations, and final answer here..."
              rows={8}
              className="w-full p-4 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-mono text-zinc-200 focus:outline-none focus:border-indigo-500 leading-relaxed"
            />
          </div>
        )}

        {/* Navigation Bottom */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            disabled={currentIdx === 0}
            onClick={() => setCurrentIdx((prev) => prev - 1)}
            className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold disabled:opacity-40 transition"
          >
            ← Previous Question
          </button>

          {currentIdx < examQuestions.length - 1 ? (
            <button
              type="button"
              onClick={() => setCurrentIdx((prev) => prev + 1)}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
            >
              Next Question →
            </button>
          ) : (
            <button
              type="button"
              onClick={finishExam}
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm"
            >
              Finish Exam
            </button>
          )}
        </div>
      </div>
    );
  }

  // SCREEN 3: Post-Exam Review & Self-Scoring
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div className="p-6 rounded-2xl bg-emerald-950/40 border border-emerald-900/60 flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <CheckCircle className="w-5 h-5" />
            <span>Exam Completed!</span>
          </div>
          <p className="text-xs text-zinc-300">
            Compare your working against the official solutions below and update your mastery status.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsExamActive(false);
            setIsFinished(false);
          }}
          className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold flex items-center gap-1.5 transition"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Take Another Exam</span>
        </button>
      </div>

      <div className="space-y-6">
        {examQuestions.map((q, idx) => (
          <div key={q.id} className="p-6 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <span className="font-bold text-sm text-zinc-200">
                Problem {idx + 1}: Q{q.number} ({q.topic})
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400">Mark Status:</span>
                <select
                  value={q.status}
                  onChange={(e) => handleUpdateStatus(q.id, e.target.value as QuestionStatus)}
                  className="px-2.5 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-semibold text-zinc-200 focus:outline-none"
                >
                  <option value="Needs Review">Needs Review</option>
                  <option value="Mastered">Mastered ✓</option>
                  <option value="In Progress">In Progress</option>
                </select>
              </div>
            </div>

            {/* Prompt */}
            <div className="text-zinc-200 text-sm">
              <MathRenderer content={q.content.prompt} />
            </div>

            {/* Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Your Working:</span>
                <div className="text-zinc-300 text-xs font-mono whitespace-pre-wrap">
                  {answers[q.id]?.trim() || <span className="italic text-zinc-600">No working recorded.</span>}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-900/50 space-y-2">
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Official Answer:</span>
                <div className="text-zinc-200 text-xs">
                  <MathRenderer content={q.content.official || "See lecture reference notes."} />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Link
                href={`/questions/${q.id}`}
                className="text-xs font-semibold text-indigo-400 hover:underline flex items-center gap-1"
              >
                <span>Open in Full Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
