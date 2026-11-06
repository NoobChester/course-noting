"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { QuestionMeta, QuestionStatus } from "@/lib/types";
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Star,
  ArrowRight,
  BookOpen,
  HelpCircle,
  Flame
} from "lucide-react";

function QuestionBankContent() {
  const searchParams = useSearchParams();
  const initialTopic = searchParams.get("topic") || "";
  const initialStatus = searchParams.get("status") || "";

  const [questions, setQuestions] = useState<QuestionMeta[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedTopic, setSelectedTopic] = useState(initialTopic);
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);
  const [selectedWeek, setSelectedWeek] = useState("");
  const [onlyDifficult, setOnlyDifficult] = useState(false);
  const [onlyStarred, setOnlyStarred] = useState(false);

  useEffect(() => {
    const courseId = localStorage.getItem("math_active_course") || "math2621";
    fetch(`/api/questions?course=${courseId}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data: QuestionMeta[]) => setQuestions(data))
      .catch((err) => console.error("Error fetching questions:", err))
      .finally(() => setLoading(false));
  }, []);

  // Update filters if URL search params change
  useEffect(() => {
    if (initialTopic) setSelectedTopic(initialTopic);
    if (initialStatus) setSelectedStatus(initialStatus);
  }, [initialTopic, initialStatus]);

  // Extract all unique topics
  const topics = useMemo(() => {
    const set = new Set<string>();
    questions.forEach((q) => set.add(q.topic));
    return Array.from(set);
  }, [questions]);

  // Filtered list
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (search) {
        const query = search.toLowerCase();
        const matchesTitle = q.title.toLowerCase().includes(query);
        const matchesNum = q.number.toString().includes(query);
        const matchesTopic = q.topic.toLowerCase().includes(query);
        const matchesConcepts = q.concepts.some((c) => c.toLowerCase().includes(query));
        if (!matchesTitle && !matchesNum && !matchesTopic && !matchesConcepts) {
          return false;
        }
      }

      if (selectedTopic && q.topic !== selectedTopic) return false;
      if (selectedStatus && q.status !== selectedStatus) return false;
      if (selectedWeek && q.week.toString() !== selectedWeek) return false;
      if (onlyDifficult && !q.isDifficult) return false;
      if (onlyStarred && !q.starred) return false;

      return true;
    });
  }, [questions, search, selectedTopic, selectedStatus, selectedWeek, onlyDifficult, onlyStarred]);

  const toggleStar = async (e: React.MouseEvent, q: QuestionMeta) => {
    e.preventDefault();
    e.stopPropagation();

    const updated = !q.starred;
    setQuestions((prev) =>
      prev.map((item) => (item.id === q.id ? { ...item, starred: updated } : item))
    );

    try {
      await fetch(`/api/questions/${q.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ starred: updated })
      });
    } catch (err) {
      console.error("Failed to update star:", err);
    }
  };

  const getStatusBadge = (status: QuestionStatus) => {
    switch (status) {
      case "Mastered":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
            <CheckCircle2 className="w-3 h-3" />
            <span>Mastered</span>
          </span>
        );
      case "Needs Review":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-950 text-amber-400 border border-amber-800">
            <AlertCircle className="w-3 h-3" />
            <span>Needs Review</span>
          </span>
        );
      case "In Progress":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-950 text-indigo-400 border border-indigo-800">
            <Clock className="w-3 h-3" />
            <span>In Progress</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
            <HelpCircle className="w-3 h-3" />
            <span>Unattempted</span>
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <span>Question Bank</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-800">
              {filteredQuestions.length} of {questions.length} Questions
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Browse, search, and solve problems from UNSW MATH2621 Weeks 1–10.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/exam"
            className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Start Practice Exam</span>
          </Link>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions by number (e.g. 79, 101), title, or keywords (e.g. contour, residue, Cauchy)..."
            className="w-full pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 text-xs">
          {/* Topic Dropdown */}
          <div className="col-span-2">
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Topics (22 Sections)</option>
              {topics.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="Unattempted">Unattempted</option>
              <option value="In Progress">In Progress</option>
              <option value="Needs Review">Needs Review</option>
              <option value="Mastered">Mastered</option>
            </select>
          </div>

          {/* Week Dropdown */}
          <div>
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Weeks</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((w) => (
                <option key={w} value={w.toString()}>
                  Week {w}
                </option>
              ))}
            </select>
          </div>

          {/* Checkboxes: Difficult & Starred */}
          <label className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-300 cursor-pointer hover:bg-zinc-900 transition">
            <input
              type="checkbox"
              checked={onlyDifficult}
              onChange={(e) => setOnlyDifficult(e.target.checked)}
              className="rounded bg-zinc-800 text-indigo-600 border-zinc-700"
            />
            <span className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Difficult (*)</span>
            </span>
          </label>

          <label className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-300 cursor-pointer hover:bg-zinc-900 transition">
            <input
              type="checkbox"
              checked={onlyStarred}
              onChange={(e) => setOnlyStarred(e.target.checked)}
              className="rounded bg-zinc-800 text-indigo-600 border-zinc-700"
            />
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
              <span>Starred</span>
            </span>
          </label>
        </div>
      </div>

      {/* Question Cards List */}
      {loading ? (
        <div className="py-20 text-center text-zinc-500 text-sm animate-pulse">
          Loading 131 MATH2621 questions...
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 space-y-3">
          <Filter className="w-8 h-8 mx-auto text-zinc-600" />
          <h3 className="text-base font-bold text-zinc-200">No questions match your current filters</h3>
          <p className="text-xs text-zinc-400">Try adjusting your search terms or clearing selected topic filters.</p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSelectedTopic("");
              setSelectedStatus("");
              setSelectedWeek("");
              setOnlyDifficult(false);
              setOnlyStarred(false);
            }}
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredQuestions.map((q) => (
            <Link
              key={q.id}
              href={`/questions/${q.id}`}
              className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-900 hover:border-indigo-500/50 transition flex flex-col justify-between group shadow-xs"
            >
              <div>
                {/* Card Top Row */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-md font-mono font-black text-xs bg-indigo-950 text-indigo-300 border border-indigo-800/80">
                      Q{q.number}
                    </span>
                    <span className="text-[11px] font-medium text-zinc-400">
                      Week {q.week} • {q.topic}
                    </span>
                    {q.isDifficult && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800" title="Difficult question in problem sheet">
                        * Hard
                      </span>
                    )}
                    {q.isNonExaminable && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-950 text-purple-400 border border-purple-800" title="Non-examinable extension topic">
                        † Extension
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => toggleStar(e, q)}
                      className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-yellow-400 transition"
                      title={q.starred ? "Unstar question" : "Star for revision"}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          q.starred ? "text-yellow-400 fill-yellow-400" : ""
                        }`}
                      />
                    </button>
                    {getStatusBadge(q.status)}
                  </div>
                </div>

                {/* Question Title */}
                <h3 className="text-sm font-bold text-zinc-100 group-hover:text-indigo-300 transition line-clamp-1 mb-2">
                  {q.title}
                </h3>

                {/* Concept Pills */}
                {q.concepts.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap my-2">
                    {q.concepts.map((c) => (
                      <span
                        key={c}
                        className="px-2 py-0.5 rounded text-[10px] bg-zinc-800/80 text-zinc-400 font-medium"
                      >
                        {c.replace(/-/g, " ")}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Card Bottom Row */}
              <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-500 mt-2">
                <span className="text-[11px]">{q.source}</span>
                <span className="font-semibold text-indigo-400 group-hover:text-indigo-300 flex items-center gap-1">
                  <span>Solve</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function QuestionBankPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-20 text-center text-zinc-500 text-sm">Loading questions...</div>}>
      <QuestionBankContent />
    </Suspense>
  );
}
