"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { QuestionMeta, Question, QuestionStatus, CourseMeta } from "@/lib/types";
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
import { getActiveCourseId, loadActiveCourseData } from "@/lib/pack-loader";

export default function MockExamPage() {
  const [courseId, setCourseId] = useState<string>("sample1001");
  const [courseMeta, setCourseMeta] = useState<CourseMeta | null>(null);
  const [allQuestions, setAllQuestions] = useState<QuestionMeta[]>([]);
  const [fullQuestionsMap, setFullQuestionsMap] = useState<{ [id: string]: Question }>({});
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
    const activeId = getActiveCourseId();
    setCourseId(activeId);

    fetch(`/api/questions?course=${activeId}`)
      .then((res) => {
        if (!res.ok) throw new Error("API not available");
        return res.json();
      })
      .then((data: QuestionMeta[]) => setAllQuestions(data))
      .catch(async () => {
        const merged = await loadActiveCourseData();
        if (merged) {
          setAllQuestions(merged.questions);
          setCourseMeta(merged.course);
          const map: { [id: string]: Question } = {};
          merged.questions.forEach((q) => {
            map[q.id] = q;
          });
          setFullQuestionsMap(map);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const availableTopics = useMemo(() => {
    const set = new Set<string>();
    for (const q of allQuestions) {
      if (q.topic) set.add(q.topic);
    }
    return Array.from(set).sort();
  }, [allQuestions]);

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
      if (fullQuestionsMap[q.id]) {
        fullQuestions.push(fullQuestionsMap[q.id]);
      } else {
        try {
          const res = await fetch(`/api/questions/${q.id}?course=${courseId}`);
          if (res.ok) {
            fullQuestions.push(await res.json());
          }
        } catch {
          if (fullQuestionsMap[q.id]) fullQuestions.push(fullQuestionsMap[q.id]);
        }
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
      await fetch(`/api/questions/${id}?course=${courseId}`, {
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

  const courseCode = courseMeta?.code || courseId.toUpperCase();

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center text-zinc-500 animate-pulse text-sm">
        Loading {courseCode} exam simulator...
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
          <h1 className="text-3xl font-black text-white tracking-tight">{courseCode} Mock Exam</h1>
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
              <option value="All">Comprehensive (All Topics & Weeks)</option>
              {availableTopics.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Number of questions */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300">Number of Questions</label>
              <select
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-indigo-500"
              >
                <option value={2}>2 Questions (Quick Sprint)</option>
                <option value={4}>4 Questions (Standard Quiz)</option>
                <option value={6}>6 Questions (Full Section)</option>
                <option value={10}>10 Questions (Midterm Sim)</option>
              </select>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300">Time Limit</label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-indigo-500"
              >
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>60 Minutes</option>
                <option value={90}>90 Minutes</option>
                <option value={120}>120 Minutes (Full Exam)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-zinc-500">
              Pool available: {allQuestions.length} questions loaded from {courseCode}
            </span>
            <button
              type="button"
              onClick={startExam}
              disabled={allQuestions.length === 0}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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

    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Top Floating Exam Status Bar */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900 border border-zinc-800 shadow-md">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 font-bold text-xs border border-amber-500/20">
              Question {currentIdx + 1} of {examQuestions.length}
            </span>
            <span className="text-xs text-zinc-400 hidden sm:inline">{currentQ.title}</span>
          </div>

          {/* Countdown Clock */}
          <div className="flex items-center gap-2 font-mono text-lg font-bold text-amber-400 bg-amber-950/30 px-3 py-1 rounded-lg border border-amber-800/40">
            <Timer className="w-4 h-4 animate-pulse" />
            <span>{formatTime(secondsLeft)}</span>
          </div>

          <button
            type="button"
            onClick={finishExam}
            className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition cursor-pointer"
          >
            End & Submit
          </button>
        </div>

        {/* Question & Working Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left: Problem Prompt */}
          <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                {currentQ.topic || "Problem"} • Week {currentQ.week}
              </span>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Flame
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < currentQ.difficulty ? "text-amber-500 fill-amber-500" : "text-zinc-700"
                    }`}
                  />
                ))}
              </div>
            </div>

            <h2 className="text-lg font-bold text-white">{currentQ.title}</h2>

            <div className="text-zinc-200 text-sm leading-relaxed">
              <MathRenderer content={currentQ.content.prompt} />
            </div>

            <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800/80 text-[11px] text-zinc-500">
              🔒 Hints and official solutions are hidden during exam conditions.
            </div>
          </div>

          {/* Right: Working / Scratchpad */}
          <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4 shadow-xl flex flex-col h-[500px]">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Your Proof / Working (LaTeX & Plaintext)
              </span>
            </div>

            <textarea
              value={answers[currentQ.id] || ""}
              onChange={(e) =>
                setAnswers({
                  ...answers,
                  [currentQ.id]: e.target.value
                })
              }
              placeholder="Write your step-by-step solution here..."
              className="flex-1 w-full p-4 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 font-mono text-xs focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
            />

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                disabled={currentIdx === 0}
                className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-semibold disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>

              <div className="flex items-center gap-1">
                {examQuestions.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentIdx(idx)}
                    className={`w-7 h-7 rounded-md text-xs font-bold transition cursor-pointer ${
                      currentIdx === idx
                        ? "bg-indigo-600 text-white"
                        : answers[examQuestions[idx].id]?.trim()
                        ? "bg-zinc-700 text-emerald-400"
                        : "bg-zinc-800 text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              {currentIdx < examQuestions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentIdx((prev) => Math.min(examQuestions.length - 1, prev + 1))}
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 cursor-pointer"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={finishExam}
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 cursor-pointer"
                >
                  Submit All
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // SCREEN 3: Exam Results & Review
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
          <Award className="w-3.5 h-3.5" />
          <span>Exam Completed</span>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">Review Your Performance</h1>
        <p className="text-sm text-zinc-400">
          Compare your workings against official solutions and mark your mastery.
        </p>
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => {
            setIsFinished(false);
            setIsExamActive(false);
          }}
          className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-2 cursor-pointer transition border border-zinc-700"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Take Another Practice Exam</span>
        </button>
      </div>

      <div className="space-y-6">
        {examQuestions.map((q, idx) => (
          <div
            key={q.id}
            className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                Problem {idx + 1}: {q.title}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400">Status:</span>
                <select
                  value={q.status}
                  onChange={(e) => handleUpdateStatus(q.id, e.target.value as QuestionStatus)}
                  className={`text-xs px-2 py-1 rounded-md font-bold border ${
                    q.status === "Mastered"
                      ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                      : q.status === "Needs Review"
                      ? "bg-amber-950 text-amber-400 border-amber-800"
                      : "bg-zinc-800 text-zinc-300 border-zinc-700"
                  }`}
                >
                  <option value="Unattempted">Unattempted</option>
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
