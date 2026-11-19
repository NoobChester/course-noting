"use client";

import React from "react";
import Link from "next/link";
import { Concept } from "@/lib/types";
import { MathRenderer } from "../math/MathRenderer";
import { BookOpen, ArrowRight, Layers } from "lucide-react";

interface ConceptCardProps {
  concept: Concept;
}

export function ConceptCard({ concept }: ConceptCardProps) {
  const linkedCount = concept.linkedQuestionIds?.length || 0;

  return (
    <div className="flex flex-col justify-between p-5 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:border-indigo-500/50 hover:bg-zinc-900 transition-all group shadow-sm">
      <div>
        <div className="flex items-center justify-between text-xs mb-3">
          <span className="px-2.5 py-1 rounded-full font-semibold bg-indigo-950 text-indigo-400 border border-indigo-900/60">
            Week {concept.week}
          </span>
          <span className="text-zinc-500 font-medium">{concept.category}</span>
        </div>

        <h3 className="text-lg font-bold text-zinc-100 group-hover:text-indigo-300 transition mb-2 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>{concept.title}</span>
        </h3>

        {concept.summary && (
          <div className="text-xs text-zinc-400 line-clamp-3 mb-4 leading-relaxed">
            <MathRenderer content={concept.summary} />
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between mt-auto">
        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
          <Layers className="w-3.5 h-3.5 text-zinc-500" />
          <span>{linkedCount} practice questions</span>
        </div>

        <Link
          href={`/concepts/${concept.slug}`}
          className="text-xs font-semibold text-indigo-400 group-hover:text-indigo-300 flex items-center gap-1 hover:underline"
        >
          <span>Learn Concept</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
        </Link>
      </div>
    </div>
  );
}
