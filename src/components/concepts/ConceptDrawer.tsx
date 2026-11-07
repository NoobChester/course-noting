"use client";

import React, { useEffect, useState } from "react";
import { Concept } from "@/lib/types";
import { MathRenderer } from "../math/MathRenderer";
import { X, BookOpen, ExternalLink, Sparkles } from "lucide-react";
import Link from "next/link";
import { getActiveCourseId, loadActiveCourseData } from "@/lib/pack-loader";

interface ConceptDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  conceptSlugs: string[];
}

export function ConceptDrawer({ isOpen, onClose, conceptSlugs }: ConceptDrawerProps) {
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeSlug, setActiveSlug] = useState<string>("");

  useEffect(() => {
    if (!isOpen || conceptSlugs.length === 0) return;

    setLoading(true);
    const courseId = getActiveCourseId();
    fetch(`/api/concepts?course=${courseId}`)
      .then((res) => {
        if (!res.ok) throw new Error("API not available");
        return res.json();
      })
      .then((data: Concept[]) => {
        const filtered = data.filter((c) => conceptSlugs.includes(c.slug));
        setConcepts(filtered);
        if (filtered.length > 0 && !activeSlug) {
          setActiveSlug(filtered[0].slug);
        } else if (filtered.length > 0 && !filtered.some((c) => c.slug === activeSlug)) {
          setActiveSlug(filtered[0].slug);
        }
      })
      .catch(async () => {
        const merged = await loadActiveCourseData();
        if (merged) {
          const filtered = merged.concepts.filter((c) => conceptSlugs.includes(c.slug));
          setConcepts(filtered);
          if (filtered.length > 0 && !activeSlug) {
            setActiveSlug(filtered[0].slug);
          } else if (filtered.length > 0 && !filtered.some((c) => c.slug === activeSlug)) {
            setActiveSlug(filtered[0].slug);
          }
        }
      })
      .finally(() => setLoading(false));
  }, [isOpen, conceptSlugs, activeSlug]);

  if (!isOpen) return null;

  const currentConcept = concepts.find((c) => c.slug === activeSlug) || concepts[0];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/60 backdrop-blur-xs transition-opacity">
      <div className="w-full max-w-xl bg-zinc-950 border-l border-zinc-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/90">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100">Needed Concepts Cheat Sheet</h2>
              <p className="text-xs text-zinc-400">Core Course Theory & Definitions</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Concept Selector Tabs */}
        {concepts.length > 1 && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900/50 border-b border-zinc-800 overflow-x-auto text-xs">
            {concepts.map((c) => (
              <button
                key={c.slug}
                type="button"
                onClick={() => setActiveSlug(c.slug)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition font-medium ${
                  activeSlug === c.slug
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {c.title}
              </button>
            ))}
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-zinc-500 text-sm animate-pulse">
              Loading concept notes...
            </div>
          ) : currentConcept ? (
            <div>
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
                <div>
                  <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                    Week {currentConcept.week} • {currentConcept.category}
                  </div>
                  <h3 className="text-xl font-bold text-zinc-100 mt-1">{currentConcept.title}</h3>
                </div>
                <Link
                  href={`/concepts/${currentConcept.slug}`}
                  target="_blank"
                  className="px-2.5 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs flex items-center gap-1 transition"
                  title="Open full concept page in new tab"
                >
                  <span>Full Guide</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>

              {currentConcept.summary && (
                <div className="p-3 bg-indigo-950/40 border border-indigo-900/50 rounded-lg text-xs text-indigo-200 mb-6 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-indigo-300">Quick Summary: </span>
                    <MathRenderer content={currentConcept.summary} />
                  </div>
                </div>
              )}

              <div className="prose prose-invert max-w-none text-sm">
                <MathRenderer content={currentConcept.content} />
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-zinc-500 text-sm">
              No specific concept attached to this question yet. You can add one by editing the question frontmatter or exploring the Concept Hub!
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-3 border-t border-zinc-800 bg-zinc-900/60 flex items-center justify-between text-xs text-zinc-400">
          <span>Tip: Review these theorems while drafting your solution</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition cursor-pointer"
          >
            Back to Solving
          </button>
        </div>
      </div>
    </div>
  );
}
