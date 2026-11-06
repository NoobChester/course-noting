"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Question, QuestionStatus } from "@/lib/types";
import { MathRenderer } from "@/components/math/MathRenderer";
import { SplitEditor } from "@/components/math/SplitEditor";
import { ConceptDrawer } from "@/components/concepts/ConceptDrawer";
import confetti from "canvas-confetti";
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Star,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  BookOpen,
  Eye,
  EyeOff,
  Flame,
  Sparkles
} from "lucide-react";

export default function QuestionWorkspacePage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [isConceptDrawerOpen, setIsConceptDrawerOpen] = useState(false);

  // Tabs for Work Area
  const [activeTab, setActiveTab] = useState<"solution" | "hints" | "official">("solution");
  const [showOfficialAnswer, setShowOfficialAnswer] = useState(false);

  // Editable solution content
  const [solutionText, setSolutionText] = useState("");
  const [hintsText, setHintsText] = useState("");

  useEffect(() => {
    fetch(`/api/questions/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data: Question) => {
        setQuestion(data);
        setSolutionText(data.content.solution || "");
        setHintsText(data.content.hints || "");
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async (updatedStatus?: QuestionStatus) => {
    if (!question) return;

    setSaving(true);
    setSaveMessage("");

    const newStatus = updatedStatus || question.status;
    const updatedPayload: Question = {
      ...question,
      status: newStatus,
      content: {
        ...question.content,
        solution: solutionText,
        hints: hintsText
      }
    };

    try {
      const res = await fetch(`/api/questions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedPayload)
      });

      if (!res.ok) throw new Error("Failed to save");

      setQuestion(updatedPayload);
      setSaveMessage("Saved!");

      if (newStatus === "Mastered" && question.status !== "Mastered") {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.7 }
        });
      }

      setTimeout(() => setSaveMessage(""), 3000);
    } catch (err) {
      alert("Failed to save question");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const toggleStar = async () => {
    if (!question) return;
    const newStarred = !question.starred;
    setQuestion({ ...question, starred: newStarred });

    try {
      await fetch(`/api/questions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...question, starred: newStarred })
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-zinc-500 animate-pulse text-sm">
        Loading question workspace...
      </div>
    );
  }

  if (!question) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-zinc-200">Question not found</h2>
        <Link href="/questions" className="text-indigo-400 hover:underline text-sm font-semibold">
          Return to Question Bank →
        </Link>
      </div>
    );
  }

  // Next / Prev numbers
  const prevId = question.number > 1 ? `q-${String(question.number - 1).padStart(3, "0")}` : null;
  const nextId = question.number < 131 ? `q-${String(question.number + 1).padStart(3, "0")}` : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/questions"
            className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition"
            title="Back to questions list"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-sm px-2.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                Q{question.number}
              </span>
              <h1 className="text-lg sm:text-xl font-bold text-zinc-100">{question.title}</h1>
              {question.isDifficult && (
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-950 text-amber-400 border border-amber-800 flex items-center gap-1">
                  <Flame className="w-3 h-3" />
                  <span>Hard (*)</span>
                </span>
              )}
            </div>
            <div className="text-xs text-zinc-400 mt-0.5">
              Week {question.week} • {question.topic} • {question.source}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Star Button */}
          <button
            type="button"
            onClick={toggleStar}
            className={`p-2 rounded-lg border transition cursor-pointer ${
              question.starred
                ? "bg-yellow-950/60 border-yellow-700/80 text-yellow-400"
                : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-yellow-400"
            }`}
            title={question.starred ? "Starred for revision" : "Star for revision"}
          >
            <Star className={`w-4 h-4 ${question.starred ? "fill-yellow-400" : ""}`} />
          </button>

          {/* Needed Concepts Cheat Sheet Trigger */}
          <button
            type="button"
            onClick={() => setIsConceptDrawerOpen(true)}
            className="px-3 py-2 rounded-lg bg-indigo-950/70 border border-indigo-800/80 text-indigo-300 hover:bg-indigo-600 hover:text-white transition text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <BookOpen className="w-4 h-4" />
            <span>Concept Cheat Sheet ({question.concepts.length})</span>
          </button>

          {/* Status Dropdown */}
          <select
            value={question.status}
            onChange={(e) => handleSave(e.target.value as QuestionStatus)}
            className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="Unattempted">Status: Unattempted</option>
            <option value="In Progress">Status: In Progress</option>
            <option value="Needs Review">Status: Needs Review</option>
            <option value="Mastered">Status: Mastered ✓</option>
          </select>

          {/* Save Button */}
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving..." : saveMessage || "Save"}</span>
          </button>

          {/* Next & Previous Navigation */}
          <div className="flex items-center gap-1 border-l border-zinc-800 pl-2">
            {prevId ? (
              <Link
                href={`/questions/${prevId}`}
                className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition"
                title="Previous Question"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
            ) : (
              <span className="p-2 rounded-lg bg-zinc-900/40 text-zinc-700 border border-zinc-800/40 cursor-not-allowed">
                <ArrowLeft className="w-4 h-4" />
              </span>
            )}

            {nextId ? (
              <Link
                href={`/questions/${nextId}`}
                className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition"
                title="Next Question"
              >
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <span className="p-2 rounded-lg bg-zinc-900/40 text-zinc-700 border border-zinc-800/40 cursor-not-allowed">
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Question Prompt Display Box */}
      <div className="p-5 sm:p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 shadow-md space-y-4">
        <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold uppercase tracking-wider border-b border-zinc-800/60 pb-2">
          <span>Problem Statement</span>
          {question.snipUrl && (
            <span className="text-indigo-400">Cropped from problem sheet</span>
          )}
        </div>

        {/* If question has a cropped screenshot from the problem sheet */}
        {question.snipUrl && (
          <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 max-w-xl mx-auto overflow-hidden">
            <img src={question.snipUrl} alt="Question snip" className="max-h-72 mx-auto rounded object-contain" />
          </div>
        )}

        <div className="text-zinc-100 text-base leading-relaxed">
          <MathRenderer content={question.content.prompt} />
        </div>
      </div>

      {/* Solution & Hints Workspace Area */}
      <div className="space-y-3">
        {/* Workspace Tab Switcher */}
        <div className="flex items-center justify-between border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("solution")}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
                activeTab === "solution"
                  ? "border-indigo-500 text-indigo-400"
                  : "border-transparent text-zinc-400 hover:text-zinc-200"
              }`}
            >
              My Solution & Working
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("hints")}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
                activeTab === "hints"
                  ? "border-indigo-500 text-indigo-400"
                  : "border-transparent text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Hints & Key Steps
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("official")}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
                activeTab === "official"
                  ? "border-indigo-500 text-indigo-400"
                  : "border-transparent text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Official Answer / Notes
            </button>
          </div>

          <div className="text-xs text-zinc-500">
            {saveMessage && <span className="text-emerald-400 font-semibold">{saveMessage}</span>}
          </div>
        </div>

        {/* Tab 1: Solution Split Editor */}
        {activeTab === "solution" && (
          <div className="space-y-3">
            <SplitEditor
              value={solutionText}
              onChange={setSolutionText}
              placeholder="Insert your mathematical proof or solution here using LaTeX ($...$ for inline, $$...$$ for display blocks). Click 'Attach Handwritten Work' or paste clipboard images if you worked on pen and paper!"
              minHeight="480px"
            />
            <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
              <span>Supports both typed LaTeX and direct handwritten photo uploads</span>
              <button
                type="button"
                onClick={() => handleSave()}
                className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold cursor-pointer transition"
              >
                Save Working
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Hints & Key Steps */}
        {activeTab === "hints" && (
          <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
            <h3 className="text-sm font-bold text-indigo-300">Method & Hint Checklist</h3>
            <textarea
              value={hintsText}
              onChange={(e) => setHintsText(e.target.value)}
              placeholder="Record hints, key steps, or method notes for this problem..."
              rows={6}
              className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 font-mono focus:outline-none focus:border-indigo-500"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => handleSave()}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
              >
                Save Hints
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Official Answer / Solution Notes */}
        {activeTab === "official" && (
          <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-zinc-100">Official Solution Notes & Answers</h3>
                <p className="text-xs text-zinc-400">Directly from the UNSW MATH2621 problem sheet</p>
              </div>

              <button
                type="button"
                onClick={() => setShowOfficialAnswer(!showOfficialAnswer)}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                {showOfficialAnswer ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showOfficialAnswer ? "Hide Answer" : "Reveal Answer"}</span>
              </button>
            </div>

            {showOfficialAnswer ? (
              <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80 text-zinc-200 text-sm leading-relaxed">
                {question.content.official ? (
                  <MathRenderer content={question.content.official} />
                ) : (
                  <span className="italic text-zinc-500">
                    No official answer given in the original problem sheet for this proof question.
                  </span>
                )}
              </div>
            ) : (
              <div className="p-10 rounded-xl bg-zinc-950 border border-dashed border-zinc-800 text-center space-y-2">
                <p className="text-xs text-zinc-400">
                  Official answer is hidden so you can attempt the solution first.
                </p>
                <button
                  type="button"
                  onClick={() => setShowOfficialAnswer(true)}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer"
                >
                  Reveal Official Answer
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Slide-out Concept Drawer */}
      <ConceptDrawer
        isOpen={isConceptDrawerOpen}
        onClose={() => setIsConceptDrawerOpen(false)}
        conceptSlugs={question.concepts}
      />
    </div>
  );
}
