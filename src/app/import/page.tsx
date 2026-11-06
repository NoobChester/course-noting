"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Question } from "@/lib/types";
import { MathToolbar } from "@/components/math/MathToolbar";
import { MathRenderer } from "@/components/math/MathRenderer";
import { Scissors, Upload, Plus, CheckCircle, Image as ImageIcon } from "lucide-react";

export default function ImportPage() {
  const router = useRouter();

  // Image & Canvas Snipping
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [snipPreview, setSnipPreview] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [rect, setRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Question Form State
  const [title, setTitle] = useState("");
  const [number, setNumber] = useState(132);
  const [topic, setTopic] = useState("Residue Calculus");
  const [week, setWeek] = useState(8);
  const [difficulty, setDifficulty] = useState(3);
  const [prompt, setPrompt] = useState("");
  const [hints, setHints] = useState("");
  const [official, setOfficial] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // File upload for snipper
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      setImageSrc(src);
      const img = new Image();
      img.src = src;
      img.onload = () => {
        imgRef.current = img;
        drawBaseImage(img);
      };
    };
    reader.readAsDataURL(file);
  };

  const drawBaseImage = (img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const r = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / r.width;
    const scaleY = canvasRef.current.height / r.height;

    const x = (e.clientX - r.left) * scaleX;
    const y = (e.clientY - r.top) * scaleY;

    setStartPos({ x, y });
    setIsDrawing(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPos || !canvasRef.current || !imgRef.current) return;
    const r = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / r.width;
    const scaleY = canvasRef.current.height / r.height;

    const curX = (e.clientX - r.left) * scaleX;
    const curY = (e.clientY - r.top) * scaleY;

    const x = Math.min(startPos.x, curX);
    const y = Math.min(startPos.y, curY);
    const w = Math.abs(curX - startPos.x);
    const h = Math.abs(curY - startPos.y);

    setRect({ x, y, w, h });

    // Redraw image and bounding box
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(imgRef.current, 0, 0);
    ctx.strokeStyle = "#6366f1";
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = "rgba(99, 102, 241, 0.15)";
    ctx.fillRect(x, y, w, h);
  };

  const handleMouseUp = async () => {
    if (!isDrawing || !rect || rect.w < 10 || rect.h < 10 || !imgRef.current) {
      setIsDrawing(false);
      return;
    }
    setIsDrawing(false);

    // Create snippet canvas
    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = rect.w;
    cropCanvas.height = rect.h;
    const cropCtx = cropCanvas.getContext("2d");
    if (!cropCtx) return;

    cropCtx.drawImage(
      imgRef.current,
      rect.x,
      rect.y,
      rect.w,
      rect.h,
      0,
      0,
      rect.w,
      rect.h
    );

    cropCanvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `snip-${Date.now()}.png`, { type: "image/png" });
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData
        });
        const data = await res.json();
        setSnipPreview(data.url);
      } catch (err) {
        console.error("Failed to upload snippet:", err);
      }
    });
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !prompt) {
      alert("Please fill in question title and problem prompt.");
      return;
    }

    setIsSaving(true);
    const id = `q-${String(number).padStart(3, "0")}`;

    const newQuestion: Question = {
      id,
      number,
      title,
      week,
      topic,
      difficulty,
      status: "Unattempted",
      concepts: [],
      source: "Imported Question",
      snipUrl: snipPreview || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      rawBody: "",
      content: {
        prompt,
        hints,
        solution: "",
        official
      }
    };

    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newQuestion)
      });

      if (!res.ok) throw new Error("Failed to save");
      router.push(`/questions/${id}`);
    } catch (err) {
      alert("Error saving imported question");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Title */}
      <div className="border-b border-zinc-800 pb-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold border border-indigo-500/20 mb-3">
          <Scissors className="w-3.5 h-3.5" />
          <span>Question Intake & Snipper</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          In-App PDF / Image Question Snipper
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Upload problem sheets or exam pages, drag to crop questions directly into high-res images, and import them straight into your question bank.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Canvas Snipper */}
        <div className="p-6 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-indigo-400" />
              <span>1. Upload Sheet & Drag-to-Crop</span>
            </h2>
            <label className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm">
              <Upload className="w-3.5 h-3.5" />
              <span>Choose Sheet Image</span>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          </div>

          {imageSrc ? (
            <div className="space-y-3">
              <div className="text-[11px] text-zinc-400">
                Click and drag a box over any question below to snip it:
              </div>
              <div className="border border-zinc-700/80 rounded-xl overflow-auto max-h-[500px] bg-zinc-950 flex justify-center">
                <canvas
                  ref={canvasRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  className="cursor-crosshair max-w-full"
                />
              </div>
            </div>
          ) : (
            <div className="p-16 text-center rounded-xl border border-dashed border-zinc-800 bg-zinc-950/60 space-y-3">
              <Scissors className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                No problem sheet loaded. Click "Choose Sheet Image" above or take a screenshot of a tutorial question to crop it.
              </p>
            </div>
          )}

          {snipPreview && (
            <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-900/60 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Question Snipped Successfully!</span>
              </div>
              <div className="rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950 p-2">
                <img src={snipPreview} alt="Snippet" className="max-h-48 mx-auto object-contain" />
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Question Metadata & Content Form */}
        <form onSubmit={handleSaveQuestion} className="p-6 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-5">
          <h2 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
            <Plus className="w-4 h-4 text-indigo-400" />
            <span>2. Question Details & LaTeX Formulation</span>
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400">Question Number</label>
              <input
                type="number"
                value={number}
                onChange={(e) => setNumber(Number(e.target.value))}
                className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400">Course Week (1-10)</label>
              <input
                type="number"
                value={week}
                onChange={(e) => setWeek(Number(e.target.value))}
                className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-400">Title / Descriptor</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Laurent series expansion of rational function"
              className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-400">Topic Section</label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="Revision exercises">Revision exercises</option>
              <option value="Sets">Sets</option>
              <option value="Functions">Functions</option>
              <option value="Fractional linear transformations">Fractional linear transformations</option>
              <option value="Estimating the size of functions">Estimating the size of functions</option>
              <option value="Real and imaginary parts of functions">Real and imaginary parts of functions</option>
              <option value="Graphical representation of complex functions">Graphical representation of complex functions</option>
              <option value="Limits and continuity">Limits and continuity</option>
              <option value="Differentiation">Differentiation</option>
              <option value="Harmonic functions">Harmonic functions</option>
              <option value="Power series">Power series</option>
              <option value="Exponential and related functions">Exponential and related functions</option>
              <option value="Contour integrals">Contour integrals</option>
              <option value="Cauchy's integral formula">Cauchy's integral formula</option>
              <option value="Taylor series, Laurent series, and residues">Taylor series, Laurent series, and residues</option>
              <option value="Counting roots of equations">Counting roots of equations</option>
              <option value="Fourier and Laplace transforms">Fourier and Laplace transforms</option>
              <option value="Conformal mappings">Conformal mappings</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-400">Problem Statement (Prompt LaTeX)</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Type the question text or LaTeX formula ($...$ or $$...$$)..."
              rows={4}
              className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>

          {prompt && (
            <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
              <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block mb-1">
                Prompt Preview:
              </span>
              <MathRenderer content={prompt} />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-400">Official Answer / Solution Notes (Optional)</label>
            <textarea
              value={official}
              onChange={(e) => setOfficial(e.target.value)}
              placeholder="Optional answer from problem sheet..."
              rows={2}
              className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md transition disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? "Saving to Questions..." : "Create Question & Open Workspace"}
          </button>
        </form>
      </div>
    </div>
  );
}
