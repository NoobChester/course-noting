"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { Concept, QuestionMeta } from "@/lib/types";
import { MathRenderer } from "@/components/math/MathRenderer";
import { ArrowLeft, BookOpen, Layers, CheckCircle2, Clock, AlertCircle, ArrowRight } from "lucide-react";

export default function ConceptDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const [concept, setConcept] = useState<Concept | null>(null);
  const [questions, setQuestions] = useState<QuestionMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/concepts/${slug}`).then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      }),
      fetch("/api/questions").then((res) => res.json())
    ])
      .then(([conceptData, questionsData]: [Concept, QuestionMeta[]]) => {
        setConcept(conceptData);
        const linked = questionsData.filter((q) => q.concepts.includes(slug));
        setQuestions(linked);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center text-zinc-500 animate-pulse text-sm">
        Loading concept guide...
      </div>
    );
  }

  if (!concept) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-zinc-200">Concept not found</h2>
        <Link href="/concepts" className="text-indigo-400 hover:underline text-sm font-semibold">
          Return to Concept Hub →
        </Link>
      </div>
    );
  }

  const masteredCount = questions.filter((q) => q.status === "Mastered").length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Navigation Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <Link
          href="/concepts"
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Concepts</span>
        </Link>

        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-800">
          Week {concept.week} • {concept.category}
        </span>
      </div>

      {/* Concept Hero */}
      <div className="space-y-3">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
          <BookOpen className="w-6 h-6 text-indigo-400 shrink-0" />
          <span>{concept.title}</span>
        </h1>

        {concept.summary && (
          <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-900/60 text-xs sm:text-sm text-indigo-200 leading-relaxed">
            <span className="font-bold text-indigo-300">Executive Summary: </span>
            <MathRenderer content={concept.summary} />
          </div>
        )}
      </div>

      {/* Main Theorem and Formulas Body */}
      <div className="p-6 sm:p-8 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 shadow-md">
        <div className="prose prose-invert max-w-none text-zinc-200 leading-relaxed">
          <MathRenderer content={concept.content} />
        </div>
      </div>

      {/* Linked Practice Questions */}
      <div className="space-y-4 pt-4 border-t border-zinc-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Practice Questions for this Concept</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              {questions.length} problems linked • {masteredCount} mastered
            </p>
          </div>
        </div>

        {questions.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-xs rounded-xl border border-zinc-800/80 bg-zinc-900/40">
            No questions currently tagged with this concept.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {questions.map((q) => (
              <Link
                key={q.id}
                href={`/questions/${q.id}`}
                className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:border-indigo-500/50 transition flex items-center justify-between group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-indigo-400">Q{q.number}</span>
                    <span className="text-xs font-semibold text-zinc-200 group-hover:text-indigo-300 transition line-clamp-1">
                      {q.title}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1">
                    Week {q.week} • {q.status}
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
