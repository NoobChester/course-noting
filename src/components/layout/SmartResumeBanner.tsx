"use client";

import React from "react";
import { Play, X, RefreshCw, Sparkles, Volume2 } from "lucide-react";
import { useBackgroundIngest } from "@/context/BackgroundIngestContext";

export function SmartResumeBanner() {
  const {
    hasIncompleteSession,
    interruptedSession,
    isRunning,
    resumeInterruptedSession,
    dismissInterruptedSession
  } = useBackgroundIngest();

  if (!hasIncompleteSession || !interruptedSession || isRunning) {
    return null;
  }

  const selectedLectures = interruptedSession.lectures.filter((l) => l.selected);
  const total = selectedLectures.length;
  const done = interruptedSession.lectures.filter((l) => l.status === "done").length;
  const remaining = total - done;
  const isDistill = interruptedSession.phase === "distilling";

  return (
    <div className="w-full bg-gradient-to-r from-amber-950/80 via-zinc-900/90 to-amber-950/80 border-b border-amber-500/30 text-amber-100 px-3.5 sm:px-4 py-2.5 shadow-lg backdrop-blur-md z-40 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
        <div className="flex items-start sm:items-center gap-2.5">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 shrink-0 mt-0.5 sm:mt-0">
            {isDistill ? <Sparkles className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold text-amber-300">
              Interrupted Session Found:
            </span>
            <span>
              You were {isDistill ? "distilling" : "downloading"} notes for{" "}
              <strong className="font-mono text-white uppercase tracking-wider">
                {interruptedSession.courseId}
              </strong>
              .
            </span>
            <span className="text-zinc-400">
              ({done} of {total} completed, {remaining} remaining)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end sm:ml-auto">
          <button
            onClick={() => resumeInterruptedSession()}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-950/50 transition cursor-pointer min-h-[38px] sm:min-h-0"
          >
            <Play className="w-3 h-3 fill-white" />
            <span>Resume Where You Left Off</span>
          </button>

          <button
            onClick={dismissInterruptedSession}
            title="Dismiss session"
            className="p-2 sm:p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
