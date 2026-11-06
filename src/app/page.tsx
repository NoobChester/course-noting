"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { QuestionMeta, Concept } from "@/lib/types";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  Timer,
  FileDown,
  ArrowRight,
  Flame,
  Award,
  AlertCircle,
  Scissors
} from "lucide-react";

export default function DashboardPage() {
  const [questions, setQuestions] = useState<QuestionMeta[]>([]);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/questions").then((res) => res.json()),
      fetch("/api/concepts").then((res) => res.json())
    ])
      .then(([qData, cData]) => {
        setQuestions(qData);
        setConcepts(cData);
      })
      .catch((err) => console.error("Error loading dashboard data:", err))
      .finally(() => setLoading(false));
  }, []);

  const total = questions.length;
  const mastered = questions.filter((q) => q.status === "Mastered").length;
  const needsReview = questions.filter((q) => q.status === "Needs Review").length;
  const inProgress = questions.filter((q) => q.status === "In Progress").length;
  const unattempted = questions.filter((q) => q.status === "Unattempted").length;
  const masteredPercent = total > 0 ? Math.round((mastered / total) * 100) : 0;

  // Group by topic
  const topicsMap: { [key: string]: { total: number; mastered: number } } = {};
  questions.forEach((q) => {
    if (!topicsMap[q.topic]) {
      topicsMap[q.topic] = { total: 0, mastered: 0 };
    }
    topicsMap[q.topic].total += 1;
    if (q.status === "Mastered") {
      topicsMap[q.topic].mastered += 1;
    }
  });

  const nextQuestionToSolve =
    questions.find((q) => q.status === "In Progress") ||
    questions.find((q) => q.status === "Needs Review") ||
    questions.find((q) => q.status === "Unattempted") ||
    questions[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950 via-zinc-900 to-zinc-950 border border-indigo-900/50 p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold border border-indigo-500/20">
            <Flame className="w-3.5 h-3.5 text-indigo-400" />
            <span>UNSW MATH2621 • Higher Complex Analysis</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Master Every Contour, Singularity & Residue
          </h1>

          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
            All 131 problem sheet questions, connected theory cheat sheets, KaTeX solution workspace with handwritten image attachments, and timed mock exam preparation.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            {nextQuestionToSolve && (
              <Link
                href={`/questions/${nextQuestionToSolve.id}`}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition"
              >
                <span>Continue Solving: Q{nextQuestionToSolve.number}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}

            <Link
              href="/exam"
              className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-semibold text-sm border border-zinc-700/80 flex items-center gap-2 transition"
            >
              <Timer className="w-4 h-4 text-amber-400" />
              <span>Timed Practice</span>
            </Link>

            <Link
              href="/revision"
              className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-semibold text-sm border border-zinc-700/80 flex items-center gap-2 transition"
            >
              <FileDown className="w-4 h-4 text-emerald-400" />
              <span>Print Cheat Sheet</span>
            </Link>
          </div>
        </div>

        {/* Decorative background formula */}
        <div className="absolute right-6 -bottom-6 select-none opacity-10 text-indigo-300 font-serif text-9xl pointer-events-none hidden md:block">
          ∮ f(z)dz
        </div>
      </div>

      {/* Progress Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold">
            <span>TOTAL PROBLEMS</span>
            <BookOpen className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-zinc-100">{total}</span>
            <span className="text-xs text-zinc-500">problems</span>
          </div>
          <div className="mt-3 text-xs text-zinc-400 font-medium">Weeks 1 through 10</div>
        </div>

        <div className="p-5 rounded-xl bg-zinc-900/60 border border-emerald-900/40 flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold">
            <span>MASTERED</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-400">{mastered}</span>
            <span className="text-xs text-emerald-600 font-semibold">({masteredPercent}%)</span>
          </div>
          <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-3">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${masteredPercent}%` }}
            />
          </div>
        </div>

        <div className="p-5 rounded-xl bg-zinc-900/60 border border-amber-900/40 flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-400 text-xs font-semibold">
            <span>NEEDS REVIEW</span>
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-400">{needsReview}</span>
            <span className="text-xs text-zinc-500">flagged</span>
          </div>
          <Link
            href="/questions?status=Needs+Review"
            className="mt-3 text-xs text-amber-400 hover:underline font-medium"
          >
            Review tricky questions →
          </Link>
        </div>

        <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold">
            <span>UNATTEMPTED</span>
            <Clock className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-zinc-100">{unattempted}</span>
            <span className="text-xs text-zinc-500">remaining</span>
          </div>
          <div className="mt-3 text-xs text-zinc-400">Ready for practice</div>
        </div>
      </div>

      {/* Main Grid: Syllabus Progress & Quick Features */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Topic Breakdown (2 Columns) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-400" />
              <span>Syllabus Topics & Progress</span>
            </h2>
            <Link href="/questions" className="text-xs text-indigo-400 hover:underline font-semibold">
              View All Questions →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(topicsMap).map(([topic, stat]) => {
              const pct = stat.total > 0 ? Math.round((stat.mastered / stat.total) * 100) : 0;
              return (
                <Link
                  key={topic}
                  href={`/questions?topic=${encodeURIComponent(topic)}`}
                  className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-700 transition flex flex-col justify-between group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-sm text-zinc-200 group-hover:text-indigo-300 transition">
                      {topic}
                    </span>
                    <span className="text-xs font-mono font-medium text-zinc-400 shrink-0">
                      {stat.mastered}/{stat.total}
                    </span>
                  </div>
                  <div className="mt-3 w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Sidebar: Concepts Hub & Shortcuts */}
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <span>Theory Knowledge Base</span>
              </h2>
              <Link href="/concepts" className="text-xs text-indigo-400 hover:underline font-semibold">
                All Concepts →
              </Link>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Quickly review essential theorems and formulas before or while solving questions:
            </p>

            <div className="space-y-2">
              {concepts.slice(0, 5).map((concept) => (
                <Link
                  key={concept.slug}
                  href={`/concepts/${concept.slug}`}
                  className="block p-2.5 rounded-lg bg-zinc-800/50 hover:bg-indigo-950/40 hover:border-indigo-800 border border-transparent transition"
                >
                  <div className="text-xs font-semibold text-zinc-200">{concept.title}</div>
                  <div className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                    Week {concept.week} • {concept.category}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* PDF Snip & Ingestion Tool Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-zinc-900 border border-indigo-900/40 space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 text-sm font-bold">
              <Scissors className="w-4 h-4" />
              <span>In-App PDF Snipper</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Have lecture sheets or new past exam PDFs? Open our snipper tool to crop questions and import them directly into your question library.
            </p>
            <Link
              href="/import"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
            >
              <span>Launch PDF Snipper</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
