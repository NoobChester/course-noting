"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Question, QuestionMeta, CourseMeta } from "@/lib/types";
import { MathToolbar } from "@/components/math/MathToolbar";
import { MathRenderer } from "@/components/math/MathRenderer";
import {
  Scissors,
  Upload,
  Plus,
  CheckCircle,
  Image as ImageIcon,
  Info,
  Terminal,
  Globe,
  HardDrive,
  HelpCircle,
  ArrowRight
} from "lucide-react";
import {
  isLocalStudio,
  getActiveCourseId,
  loadActiveCourseData,
  saveQuestionToCustomCourse
} from "@/lib/pack-loader";

export default function ImportPage() {
  const router = useRouter();
  const [isLocal, setIsLocal] = useState(true);
  const [courseId, setCourseId] = useState("sample1001");
  const [courseMeta, setCourseMeta] = useState<CourseMeta | null>(null);
  const [existingQuestions, setExistingQuestions] = useState<QuestionMeta[]>([]);

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
  const [number, setNumber] = useState(1);
  const [topic, setTopic] = useState("General Practice");
  const [week, setWeek] = useState(1);
  const [difficulty, setDifficulty] = useState(3);
  const [prompt, setPrompt] = useState("");
  const [hints, setHints] = useState("");
  const [official, setOfficial] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setIsLocal(isLocalStudio());
    const active = getActiveCourseId();
    setCourseId(active);

    fetch(`/api/questions?course=${active}`)
      .then((res) => {
        if (!res.ok) throw new Error("API not available");
        return res.json();
      })
      .then((data: QuestionMeta[]) => {
        setExistingQuestions(data);
        if (data.length > 0) {
          setNumber(data.length + 1);
          if (data[data.length - 1].topic) setTopic(data[data.length - 1].topic);
          if (data[data.length - 1].week) setWeek(data[data.length - 1].week);
        }
      })
      .catch(async () => {
        const merged = await loadActiveCourseData();
        if (merged) {
          setCourseMeta(merged.course);
          setExistingQuestions(merged.questions);
          if (merged.questions.length > 0) {
            setNumber(merged.questions.length + 1);
            const last = merged.questions[merged.questions.length - 1];
            if (last.topic) setTopic(last.topic);
            if (last.week) setWeek(last.week);
          }
        }
      });
  }, []);

  const availableTopics = useMemo(() => {
    const set = new Set<string>();
    existingQuestions.forEach((q) => {
      if (q.topic) set.add(q.topic);
    });
    return Array.from(set).sort();
  }, [existingQuestions]);

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

    setIsDrawing(true);
    setStartPos({ x, y });
    setRect({ x, y, w: 0, h: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPos || !canvasRef.current || !imgRef.current) return;

    const r = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / r.width;
    const scaleY = canvasRef.current.height / r.height;

    const curX = (e.clientX - r.left) * scaleX;
    const curY = (e.clientY - r.top) * scaleY;

    const w = curX - startPos.x;
    const h = curY - startPos.y;

    const currentRect = {
      x: w < 0 ? curX : startPos.x,
      y: h < 0 ? curY : startPos.y,
      w: Math.abs(w),
      h: Math.abs(h)
    };
    setRect(currentRect);

    // Redraw base image and highlight rectangle
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.drawImage(imgRef.current, 0, 0);

    // Selection box overlay
    ctx.strokeStyle = "#6366f1";
    ctx.lineWidth = 3;
    ctx.strokeRect(currentRect.x, currentRect.y, currentRect.w, currentRect.h);

    ctx.fillStyle = "rgba(99, 102, 241, 0.2)";
    ctx.fillRect(currentRect.x, currentRect.y, currentRect.w, currentRect.h);
  };

  const handleMouseUp = () => {
    if (!isDrawing || !rect || rect.w < 10 || rect.h < 10 || !imgRef.current) {
      setIsDrawing(false);
      return;
    }
    setIsDrawing(false);

    // Create a temporary canvas for cropped region
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

    if (isLocal) {
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
        } catch {
          // Fallback to data URL
          setSnipPreview(cropCanvas.toDataURL("image/png"));
        }
      });
    } else {
      // In browser / GitHub Pages: Save as data URL
      setSnipPreview(cropCanvas.toDataURL("image/png"));
    }
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

    if (isLocal) {
      try {
        const res = await fetch(`/api/questions?course=${courseId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newQuestion)
        });

        if (!res.ok) throw new Error("API post failed");
        router.push(`/questions/${id}`);
      } catch (err) {
        console.warn("API write failed, saving to local custom course:", err);
        saveQuestionToCustomCourse(courseId, newQuestion);
        router.push(`/questions/${id}`);
      } finally {
        setIsSaving(false);
      }
    } else {
      saveQuestionToCustomCourse(courseId, newQuestion);
      setIsSaving(false);
      router.push(`/questions/${id}`);
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
          Upload problem sheets or exam pages, drag to crop questions directly into high-res images, and import them straight into {courseMeta ? courseMeta.code : "your question bank"}.
        </p>
      </div>

      {/* Local Studio vs GitHub Pages Notice Banner */}
      <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <span>Why does PDF Snipper say</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 font-mono font-medium border border-amber-800/40">
                  Local Studio
                </span>
                <span>in the navigation bar?</span>
              </h3>
              <p className="text-xs text-zinc-400">
                Understanding what works in your browser vs running on your local machine.
              </p>
            </div>
          </div>

          <Link
            href="/guide#local-studio"
            className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition border border-zinc-700 shrink-0"
          >
            <Terminal className="w-3.5 h-3.5 text-indigo-400" />
            <span>Local Studio Guide</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-zinc-800/80 text-xs">
          <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-1">
            <div className="font-bold text-amber-400 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              <span>On GitHub Pages (Static Web App)</span>
            </div>
            <p className="text-zinc-400 leading-relaxed text-[11px]">
              Runs 100% client-side in your browser without a backend. You can upload or paste screenshot images right here; cropped snippets and imported questions are saved into browser <code className="text-zinc-300">localStorage</code> and can be exported via the Save/Backup manager.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-1">
            <div className="font-bold text-indigo-400 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5" />
              <span>On Localhost Studio (Your Computer)</span>
            </div>
            <p className="text-zinc-400 leading-relaxed text-[11px]">
              Running <code className="text-indigo-300">npm run dev</code> unlocks direct filesystem storage: automatically renders multi-page PDF problem sheets, saves cropped PNG files to <code className="text-zinc-300">public/uploads/</code>, and creates persistent Markdown question files on your hard drive.
            </p>
          </div>
        </div>
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
                No problem sheet loaded. Click &quot;Choose Sheet Image&quot; above or take a screenshot of a tutorial question to crop it.
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
              placeholder="e.g. Eigenvalue computation & characteristic polynomial"
              className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-400">Topic Section</label>
            <input
              type="text"
              list="topic-options"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Type or select a topic..."
              className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-indigo-500"
            />
            <datalist id="topic-options">
              {availableTopics.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
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
