"use client";

import React, { useState } from "react";
import {
  BookOpen,
  ExternalLink,
  X,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  FileText,
  AlertCircle
} from "lucide-react";
import { getBasePath } from "@/lib/pack-loader";

interface EmbeddedPdfViewerProps {
  courseId: string;
  chapter?: number;
  chapterPdfPage?: number;
  onClose?: () => void;
  isSideBySide?: boolean;
}

export function EmbeddedPdfViewer({
  courseId,
  chapter = 1,
  chapterPdfPage = 1,
  onClose,
  isSideBySide = false
}: EmbeddedPdfViewerProps) {
  const [selectedDoc, setSelectedDoc] = useState<"chapter" | "master">("chapter");
  const [currentPage, setCurrentPage] = useState<number>(chapterPdfPage);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const cleanCourseId = courseId.toLowerCase();
  const basePath = getBasePath();

  // Construct PDF URL
  const chapterPdfUrl = `${basePath}/courses/${cleanCourseId}/standalone/ch${chapter}.pdf#page=${currentPage}`;
  const masterPdfUrl = `${basePath}/courses/${cleanCourseId}/${cleanCourseId}-textbook.pdf#page=${currentPage}`;
  const activeUrl = selectedDoc === "chapter" ? chapterPdfUrl : masterPdfUrl;

  return (
    <div
      className={`flex flex-col bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl transition-all duration-200 ${
        isFullscreen
          ? "fixed inset-4 z-50"
          : isSideBySide
          ? "w-full h-full min-h-[600px]"
          : "w-full h-[650px] my-4"
      }`}
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 text-xs shrink-0 select-none">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-zinc-100 font-bold">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span>Typeset Coursebook</span>
          </div>

          {/* Doc Switcher Toggle */}
          <div className="flex items-center bg-zinc-950 p-0.5 rounded-lg border border-zinc-800">
            <button
              type="button"
              onClick={() => setSelectedDoc("chapter")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                selectedDoc === "chapter"
                  ? "bg-indigo-600 text-white font-semibold shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Chapter {chapter} Standalone
            </button>
            <button
              type="button"
              onClick={() => setSelectedDoc("master")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                selectedDoc === "master"
                  ? "bg-indigo-600 text-white font-semibold shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Master Textbook
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Page Indicator */}
          <div className="flex items-center gap-1 bg-zinc-950 px-2 py-1 rounded-lg border border-zinc-800 text-[11px] text-zinc-400">
            <span>Page</span>
            <input
              type="number"
              min={1}
              max={300}
              value={currentPage}
              onChange={(e) => setCurrentPage(parseInt(e.target.value) || 1)}
              className="w-10 text-center bg-zinc-900 text-zinc-100 rounded border border-zinc-700 py-0.5 text-xs font-mono"
            />
          </div>

          {/* Pop out into new tab */}
          <a
            href={activeUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open in new window / dual monitor"
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition"
          >
            <ExternalLink className="w-4 h-4" />
          </a>

          {/* Fullscreen toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Close button if provided */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              title="Close PDF Viewer"
              className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main PDF Display Body */}
      <div className="flex-1 w-full h-full relative bg-zinc-900">
        <object
          data={activeUrl}
          type="application/pdf"
          className="w-full h-full border-none"
        >
          {/* Fallback iframe or error banner */}
          <iframe
            src={activeUrl}
            className="w-full h-full border-none"
            title="Coursebook PDF Preview"
          >
            <div className="p-8 text-center text-zinc-400 space-y-3">
              <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
              <p className="text-sm font-semibold text-zinc-200">
                PDF Preview Unavailable or Compiling
              </p>
              <p className="text-xs text-zinc-500 max-w-md mx-auto">
                If you have not compiled this chapter yet, run{" "}
                <code className="text-indigo-400 font-mono">
                  python scripts/course_bridge.py compile-tex
                </code>{" "}
                or use the Antigravity synthesis workflow.
              </p>
              <a
                href={activeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition"
              >
                <span>Download / Open PDF directly</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </iframe>
        </object>
      </div>
    </div>
  );
}
