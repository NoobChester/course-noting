"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Play,
  Pause,
  X,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Clock,
  BookOpen,
  Volume2,
  Maximize2,
  Minimize2
} from "lucide-react";
import { useBackgroundIngest } from "@/context/BackgroundIngestContext";

export function FloatingIngestDock() {
  const {
    session,
    isRunning,
    isPaused,
    dockOpen,
    setDockOpen,
    pauseQueue,
    resumeQueue,
    cancelQueue,
    clearSession
  } = useBackgroundIngest();

  const [showLectureList, setShowLectureList] = useState(false);

  if (!session) return null;

  const isCompleted = session.status === "completed";
  const isError = session.status === "error";
  const isDistilling = session.phase === "distilling";
  const isDownloading = session.phase === "downloading";
  const total = Math.max(1, session.totalCount);
  const done = session.completedCount;
  const percent = session.progressPercent ?? Math.round((done / total) * 100);

  // If dock is collapsed into a small floating pill
  if (!dockOpen) {
    return (
      <div className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-40 flex items-center shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200">
        <div
          onClick={() => setDockOpen(true)}
          role="button"
          tabIndex={0}
          className={`flex items-center gap-3 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full border cursor-pointer select-none transition-all duration-200 backdrop-blur-md shadow-xl ${
            isCompleted
              ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-200 hover:bg-emerald-900/90 shadow-emerald-950/50 shadow-lg"
              : isError
              ? "bg-rose-950/90 border-rose-500/50 text-rose-200 hover:bg-rose-900/90 shadow-rose-950/50 shadow-lg"
              : isPaused
              ? "bg-amber-950/90 border-amber-500/50 text-amber-200 hover:bg-amber-900/90 shadow-amber-950/50 shadow-lg"
              : "bg-zinc-900/95 border-indigo-500/40 text-zinc-100 hover:border-indigo-400/80 shadow-indigo-950/40 shadow-xl"
          }`}
        >
          {isCompleted ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : isPaused ? (
            <Pause className="w-4 h-4 text-amber-400 shrink-0" />
          ) : isDistilling ? (
            <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse shrink-0" />
          ) : isDownloading ? (
            <Volume2 className="w-4 h-4 text-cyan-400 animate-pulse shrink-0" />
          ) : (
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          )}

          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <span className="uppercase tracking-wider font-mono text-zinc-300">
                {session.courseId}
              </span>
              <span>•</span>
              <span>
                {isCompleted
                  ? "All Distilled!"
                  : isPaused
                  ? "Paused"
                  : `${done}/${total} (${percent}%)`}
              </span>
            </div>
            {!isCompleted && session.currentLectureTitle && (
              <span className="text-[10px] text-zinc-400 truncate max-w-[160px]">
                {session.currentLectureTitle}
              </span>
            )}
          </div>

          <div className="w-12 h-1.5 bg-zinc-800 rounded-full overflow-hidden shrink-0">
            <div
              className={`h-full transition-all duration-300 ${
                isCompleted
                  ? "bg-emerald-400"
                  : isPaused
                  ? "bg-amber-400"
                  : "bg-indigo-500"
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>

          <ChevronUp className="w-3.5 h-3.5 text-zinc-400 shrink-0 hover:text-white" />
        </div>
      </div>
    );
  }

  // Expanded Dock Card (Bottom Sheet on Mobile, Floating Card on Desktop)
  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div
        onClick={() => setDockOpen(false)}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs sm:hidden z-40 animate-in fade-in"
      />

      <div className="fixed inset-x-0 bottom-0 sm:inset-auto sm:bottom-5 sm:right-5 z-50 sm:w-96 flex flex-col bg-zinc-900/98 sm:bg-zinc-900/95 backdrop-blur-md border-t sm:border border-zinc-700/80 rounded-t-2xl sm:rounded-2xl shadow-2xl text-zinc-100 overflow-hidden max-h-[85vh] sm:max-h-none animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* Mobile Pull Bar */}
        <div className="sm:hidden pt-2 flex justify-center">
          <div className="w-10 h-1 bg-zinc-700 rounded-full" />
        </div>

        {/* Top Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-zinc-950/60 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          {isCompleted ? (
            <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          ) : (
            <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </span>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-indigo-300">
                {session.courseId}
              </span>
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                  isCompleted
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : isPaused
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : isRunning
                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 animate-pulse"
                    : "bg-zinc-800 text-zinc-400"
                }`}
              >
                {isCompleted
                  ? "Completed"
                  : isPaused
                  ? "Paused"
                  : isDistilling
                  ? "Distilling"
                  : "Downloading"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setDockOpen(false)}
            title="Minimize dock"
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <button
            onClick={clearSession}
            title={isCompleted ? "Dismiss" : "Cancel queue"}
            className="p-1 rounded-md text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="p-4 space-y-3">
        {isCompleted ? (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-xs leading-relaxed">
              <p className="font-semibold text-emerald-300 flex items-center gap-1.5 mb-1">
                <span>🎉</span> All {total} Lectures Ready!
              </p>
              High-yield intuitions, KaTeX formulas, and audio timestamps are synchronized. You can open them right now in the Lecture Studio.
            </div>

            <div className="flex gap-2">
              <Link
                href={`/lectures?course=${session.courseId}`}
                onClick={() => setDockOpen(false)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40 transition"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Open Notes & Audio
              </Link>
              <button
                onClick={clearSession}
                className="px-3 py-2 text-xs font-medium rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
              >
                Dismiss
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Active Lecture & Stage */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-zinc-200 truncate max-w-[220px]" title={session.currentLectureTitle}>
                  {session.currentLectureTitle || "Preparing queue..."}
                </span>
                <span className="text-zinc-400 font-mono text-[11px]">
                  {done} / {total} ({percent}%)
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isPaused ? "bg-amber-400" : "bg-gradient-to-r from-indigo-500 to-cyan-400"
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>

              <p className="text-[11px] text-zinc-400 mt-1.5 truncate">
                {session.currentStage || "Processing..."}
              </p>
            </div>

            {/* Lecture list toggle */}
            <div className="pt-1">
              <button
                onClick={() => setShowLectureList(!showLectureList)}
                className="flex items-center justify-between w-full text-[11px] text-zinc-400 hover:text-zinc-200 py-1 font-medium transition"
              >
                <span>Show lecture queue ({session.lectures.length})</span>
                {showLectureList ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              {showLectureList && (
                <div className="mt-2 max-h-36 overflow-y-auto space-y-1.5 pr-1 text-xs">
                  {session.lectures.map((l) => (
                    <div
                      key={l.lessonId}
                      className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-zinc-950/50 border border-zinc-800/60 text-[11px]"
                    >
                      <div className="flex items-center gap-2 truncate">
                        {l.status === "done" ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : l.status === "distilling" || l.status === "pulling" ? (
                          <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin shrink-0" />
                        ) : l.status === "media_ready" ? (
                          <Volume2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        ) : l.status === "error" ? (
                          <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        )}
                        <span className="truncate text-zinc-300">
                          {l.title}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500 shrink-0">
                        W{l.week}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Control buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/80">
              {isRunning && !isPaused ? (
                <button
                  onClick={pauseQueue}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-300 text-xs font-medium transition"
                >
                  <Pause className="w-3.5 h-3.5" />
                  Pause
                </button>
              ) : isPaused ? (
                <button
                  onClick={resumeQueue}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-900/30 transition"
                >
                  <Play className="w-3.5 h-3.5" />
                  Resume
                </button>
              ) : null}

              <Link
                href={`/lectures?course=${session.courseId}`}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Notes
              </Link>

              <button
                onClick={cancelQueue}
                className="px-2.5 py-1.5 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-zinc-800/80 text-xs font-medium transition"
                title="Cancel queue"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  </>
);
}
