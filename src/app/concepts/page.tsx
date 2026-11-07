"use client";

import React, { useEffect, useState } from "react";
import { Concept, CourseMeta } from "@/lib/types";
import { ConceptCard } from "@/components/concepts/ConceptCard";
import { Sparkles } from "lucide-react";
import { getActiveCourseId, loadActiveCourseData } from "@/lib/pack-loader";

export default function ConceptsHubPage() {
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [courseMeta, setCourseMeta] = useState<CourseMeta | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const courseId = getActiveCourseId();
    fetch(`/api/concepts?course=${courseId}`, { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error("API not available");
        return res.json();
      })
      .then((data: Concept[]) => setConcepts(data))
      .catch(async () => {
        const merged = await loadActiveCourseData();
        if (merged) {
          setConcepts(merged.concepts);
          setCourseMeta(merged.course);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const courseCode = courseMeta?.code || "Course";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="border-b border-zinc-800 pb-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold border border-indigo-500/20 mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Core Theory & Reference</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
          <span>{courseCode} Concepts Knowledge Hub</span>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-800">
            {concepts.length} Modules
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Review core definitions, theorems, formulas, and essential techniques for {courseMeta ? `${courseMeta.code}: ${courseMeta.name}` : "your course"}.
        </p>
      </div>

      {/* Concepts Grid */}
      {loading ? (
        <div className="py-20 text-center text-zinc-500 text-sm animate-pulse">
          Loading {courseCode} concept guides...
        </div>
      ) : concepts.length === 0 ? (
        <div className="py-20 text-center text-zinc-500 text-sm bg-zinc-900/40 rounded-2xl border border-dashed border-zinc-800 p-8">
          No concepts found for this course yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {concepts.map((concept) => (
            <ConceptCard key={concept.slug} concept={concept} />
          ))}
        </div>
      )}
    </div>
  );
}
