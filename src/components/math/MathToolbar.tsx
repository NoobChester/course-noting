"use client";

import React from "react";
import { MATH_SNIPPETS, MathSnippet } from "@/lib/math-snippets";

interface MathToolbarProps {
  onInsert: (snippet: string) => void;
  onUploadImageClick: () => void;
}

export function MathToolbar({ onInsert, onUploadImageClick }: MathToolbarProps) {
  const categories: MathSnippet["category"][] = [
    "Integrals",
    "Residues",
    "Calculus",
    "Fractions",
    "Symbols"
  ];

  return (
    <div className="flex flex-wrap items-center gap-1.5 p-2 bg-zinc-900 border-b border-zinc-800 text-xs text-zinc-300">
      <span className="font-semibold text-zinc-400 mr-1 flex items-center gap-1">
        <span>⚡ Quick Insert:</span>
      </span>

      {MATH_SNIPPETS.map((snippet) => (
        <button
          key={snippet.label}
          type="button"
          onClick={() => onInsert(`$${snippet.template}$`)}
          title={`Insert ${snippet.template}`}
          className="px-2 py-1 rounded bg-zinc-800 hover:bg-indigo-600 hover:text-white transition font-mono border border-zinc-700/60 cursor-pointer shadow-sm"
        >
          {snippet.label}
        </button>
      ))}

      <div className="h-4 w-px bg-zinc-700 mx-1" />

      <button
        type="button"
        onClick={() => onInsert("$$\n\n$$")}
        className="px-2 py-1 rounded bg-zinc-800 hover:bg-indigo-600 hover:text-white transition font-mono border border-zinc-700/60 cursor-pointer text-indigo-300 font-bold"
        title="Insert Display Math Block"
      >
        $$ Block $$
      </button>

      <button
        type="button"
        onClick={onUploadImageClick}
        className="px-2.5 py-1 rounded bg-indigo-950/80 text-indigo-300 hover:bg-indigo-600 hover:text-white transition border border-indigo-700/50 cursor-pointer font-medium flex items-center gap-1 ml-auto"
        title="Upload photo of handwritten working"
      >
        <span>📷 Attach Handwritten Work</span>
      </button>
    </div>
  );
}
