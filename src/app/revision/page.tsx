"use client";

import React, { useEffect, useState } from "react";
import { Question, Concept, CourseMeta } from "@/lib/types";
import { MathRenderer } from "@/components/math/MathRenderer";
import { Printer, Star, AlertCircle, BookOpen, Filter, Flame } from "lucide-react";
import { getActiveCourseId, loadActiveCourseData } from "@/lib/pack-loader";

export default function RevisionExporterPage() {
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [courseMeta, setCourseMeta] = useState<CourseMeta | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [onlyStarred, setOnlyStarred] = useState(false);
  const [onlyNeedsReview, setOnlyNeedsReview] = useState(true);
  const [onlyDifficult, setOnlyDifficult] = useState(false);
  const [includeTheorems, setIncludeTheorems] = useState(true);

  useEffect(() => {
    const courseId = getActiveCourseId();

    Promise.all([
      fetch(`/api/concepts?course=${courseId}`).then((res) => {
        if (!res.ok) throw new Error("API not available");
        return res.json();
      }),
      fetch(`/api/questions?course=${courseId}`).then((res) => {
        if (!res.ok) throw new Error("API not available");
        return res.json();
      })
    ])
      .then(async ([cData, qMeta]) => {
        setConcepts(cData);

        // Fetch full question content for revision export
        const fullQ: Question[] = [];
        for (const q of qMeta) {
          if (q.status === "Needs Review" || q.starred || q.isDifficult) {
            const res = await fetch(`/api/questions/${q.id}?course=${courseId}`);
            if (res.ok) fullQ.push(await res.json());
          }
        }
        setQuestions(fullQ);
      })
      .catch(async () => {
        const merged = await loadActiveCourseData();
        if (merged) {
          setCourseMeta(merged.course);
          setConcepts(merged.concepts);
          setQuestions(merged.questions);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const filteredQuestions = questions.filter((q) => {
    if (onlyStarred && !q.starred) return false;
    if (onlyNeedsReview && q.status !== "Needs Review") return false;
    if (onlyDifficult && !q.isDifficult) return false;
    return true;
  });

  const courseCode = courseMeta?.code || "Course";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Control Bar (Hidden on print) */}
      <div className="no-print p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Printer className="w-5 h-5 text-indigo-400" />
              <span>{courseCode} Printable Revision Sheet</span>
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Export formulas, core definitions, and flagged practice questions to clean PDF or A4 printout.
            </p>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save as PDF</span>
          </button>
        </div>

        {/* Filter Checkboxes */}
        <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-zinc-800 text-xs">
          <span className="text-zinc-500 font-semibold flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter Content:
          </span>

          <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300">
            <input
              type="checkbox"
              checked={includeTheorems}
              onChange={(e) => setIncludeTheorems(e.target.checked)}
              className="rounded bg-zinc-800 text-indigo-600 border-zinc-700"
            />
            <span>Include Core Theorems / Concepts</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300">
            <input
              type="checkbox"
              checked={onlyNeedsReview}
              onChange={(e) => setOnlyNeedsReview(e.target.checked)}
              className="rounded bg-zinc-800 text-indigo-600 border-zinc-700"
            />
            <span className="text-amber-400 font-semibold">Needs Review Only</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300">
            <input
              type="checkbox"
              checked={onlyDifficult}
              onChange={(e) => setOnlyDifficult(e.target.checked)}
              className="rounded bg-zinc-800 text-indigo-600 border-zinc-700"
            />
            <span>Hard Problems Only (*)</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300">
            <input
              type="checkbox"
              checked={onlyStarred}
              onChange={(e) => setOnlyStarred(e.target.checked)}
              className="rounded bg-zinc-800 text-indigo-600 border-zinc-700"
            />
            <span className="font-semibold text-yellow-400">Starred Only</span>
          </label>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-zinc-500 text-sm animate-pulse">
          Generating {courseCode} printable revision sheet...
        </div>
      ) : (
        <div className="space-y-10 print:space-y-6">
          {/* Section 1: Core Theorems Summary */}
          {includeTheorems && concepts.length > 0 && (
            <div className="space-y-4">
              <div className="border-b-2 border-indigo-500/60 pb-2 flex items-center justify-between">
                <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2 print:text-black">
                  <BookOpen className="w-5 h-5 text-indigo-400" />
                  <span>{courseCode} Essential Formulas & Theorems</span>
                </h2>
                <span className="text-xs text-zinc-400 font-mono print:text-gray-600">
                  {courseMeta ? `${courseMeta.name}${courseMeta.institution ? ` • ${courseMeta.institution}` : ""}` : "Essential Formula Summary"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2">
                {concepts.map((concept) => (
                  <div
                    key={concept.slug}
                    className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 print:border-gray-300 print:bg-white print:text-black break-inside-avoid space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between font-bold text-indigo-300 print:text-indigo-900">
                      <span>{concept.title}</span>
                      <span className="font-mono text-[10px] text-zinc-500 print:text-gray-500">W{concept.week}</span>
                    </div>
                    {concept.summary && (
                      <div className="text-zinc-300 print:text-gray-700 leading-relaxed font-sans">
                        <MathRenderer content={concept.summary} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Tricky & Review Problems */}
          <div className="space-y-4 pt-4">
            <div className="border-b-2 border-amber-500/60 pb-2 flex items-center justify-between">
              <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2 print:text-black">
                <AlertCircle className="w-5 h-5 text-amber-400" />
                <span>Selected Tricky & Review Problems ({filteredQuestions.length})</span>
              </h2>
              <span className="text-xs text-zinc-400 print:text-gray-600">With hints and official answers</span>
            </div>

            {filteredQuestions.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-xs rounded-xl border border-zinc-800">
                No questions match your current revision filters. Try unchecking some filters above!
              </div>
            ) : (
              <div className="space-y-4">
                {filteredQuestions.map((q) => (
                  <div
                    key={q.id}
                    className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/40 print:border-gray-300 print:bg-white print:text-black break-inside-avoid space-y-3 text-xs"
                  >
                    <div className="flex items-center justify-between border-b border-zinc-800/80 print:border-gray-200 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 print:bg-gray-100 print:text-black border border-indigo-800 print:border-gray-300">
                          Q{q.number}
                        </span>
                        <span className="font-bold text-sm text-zinc-100 print:text-black">{q.title}</span>
                        {q.isDifficult && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800 print:border-black print:text-black">
                            * Hard
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-zinc-400 print:text-gray-500">{q.topic}</span>
                    </div>

                    {/* Question Prompt */}
                    <div className="text-zinc-200 print:text-black font-sans leading-relaxed text-sm">
                      <MathRenderer content={q.content.prompt} />
                    </div>

                    {/* Hints / Key Method */}
                    {q.content.hints && (
                      <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800 print:border-gray-200 print:bg-gray-50 space-y-1">
                        <span className="font-bold text-indigo-400 print:text-indigo-800 uppercase tracking-wider text-[10px]">
                          Key Method / Steps:
                        </span>
                        <div className="text-zinc-300 print:text-black">
                          <MathRenderer content={q.content.hints} />
                        </div>
                      </div>
                    )}

                    {/* Official Answer */}
                    {q.content.official && (
                      <div className="p-3 rounded-lg bg-indigo-950/30 border border-indigo-900/50 print:border-gray-200 print:bg-gray-50 space-y-1">
                        <span className="font-bold text-emerald-400 print:text-emerald-800 uppercase tracking-wider text-[10px]">
                          Answer / Result:
                        </span>
                        <div className="text-zinc-200 print:text-black">
                          <MathRenderer content={q.content.official} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
