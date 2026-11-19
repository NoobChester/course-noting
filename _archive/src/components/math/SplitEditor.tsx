"use client";

import React, { useState, useRef } from "react";
import { MathToolbar } from "./MathToolbar";
import { MathRenderer } from "./MathRenderer";
import { Columns, Eye, Edit3, ImagePlus } from "lucide-react";

interface SplitEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export function SplitEditor({
  value,
  onChange,
  placeholder = "Write your solution in Markdown + LaTeX ($...$ or $$...$$)...",
  minHeight = "400px"
}: SplitEditorProps) {
  const [viewMode, setViewMode] = useState<"split" | "edit" | "preview">("split");
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInsert = (textToInsert: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange(value + "\n" + textToInsert);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = value.substring(0, start) + textToInsert + value.substring(end);
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + textToInsert.length, start + textToInsert.length);
    }, 0);
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      const imageMarkdown = `\n\n![Handwritten Solution](${data.url})\n\n`;
      handleInsert(imageMarkdown);
    } catch (err) {
      alert("Failed to upload image. Please try again.");
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          uploadFile(file);
          break;
        }
      }
    }
  };

  return (
    <div className="flex flex-col border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950 shadow-xl">
      {/* View Mode Header & Math Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-zinc-900/90 border-b border-zinc-800 text-xs">
        <span className="font-semibold text-zinc-400">LaTeX Solution Editor</span>
        <div className="flex items-center gap-1 bg-zinc-800/80 p-0.5 rounded-lg border border-zinc-700/50">
          <button
            type="button"
            onClick={() => setViewMode("edit")}
            className={`px-2 py-1 rounded flex items-center gap-1 cursor-pointer transition ${
              viewMode === "edit" ? "bg-indigo-600 text-white font-medium" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Editor</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("split")}
            className={`px-2 py-1 rounded flex items-center gap-1 cursor-pointer transition ${
              viewMode === "split" ? "bg-indigo-600 text-white font-medium" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Split View</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("preview")}
            className={`px-2 py-1 rounded flex items-center gap-1 cursor-pointer transition ${
              viewMode === "preview" ? "bg-indigo-600 text-white font-medium" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview</span>
          </button>
        </div>
      </div>

      <MathToolbar
        onInsert={handleInsert}
        onUploadImageClick={() => fileInputRef.current?.click()}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {isUploading && (
        <div className="px-4 py-2 bg-indigo-950/60 text-indigo-300 text-xs border-b border-indigo-800 animate-pulse flex items-center gap-2">
          <ImagePlus className="w-4 h-4 animate-spin" />
          <span>Uploading and attaching handwritten note image...</span>
        </div>
      )}

      {/* Editor Body */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-zinc-800" style={{ minHeight }}>
        {/* Left: Input Textarea */}
        {(viewMode === "edit" || viewMode === "split") && (
          <div className={`${viewMode === "edit" ? "col-span-2" : "col-span-1"} flex flex-col bg-zinc-950 p-3`}>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onPaste={handlePaste}
              placeholder={placeholder}
              className="w-full flex-1 bg-transparent text-zinc-200 font-mono text-sm resize-none focus:outline-none focus:ring-0 leading-relaxed placeholder:text-zinc-600"
              style={{ minHeight }}
            />
          </div>
        )}

        {/* Right: KaTeX Live Preview */}
        {(viewMode === "preview" || viewMode === "split") && (
          <div className={`${viewMode === "preview" ? "col-span-2" : "col-span-1"} flex flex-col bg-zinc-900/40 p-4 overflow-y-auto`} style={{ minHeight }}>
            <div className="text-xs uppercase tracking-wider text-zinc-500 font-semibold mb-2">Live Math Preview</div>
            {value.trim() ? (
              <MathRenderer content={value} />
            ) : (
              <div className="text-zinc-600 italic text-sm mt-8 text-center">
                Type your solution or click quick formulas above to see live rendered LaTeX here.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
