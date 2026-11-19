"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Pen,
  Highlighter,
  Eraser,
  Type,
  RotateCcw,
  RotateCw,
  Trash2,
  Download,
  ImagePlus,
  X,
  Maximize2,
  Minimize2,
  Loader2,
  Check
} from "lucide-react";

export interface CanvasPoint {
  x: number;
  y: number;
  pressure?: number;
}

export interface CanvasStroke {
  id: string;
  type: "pen" | "highlighter" | "eraser" | "text";
  color: string;
  width: number;
  points: CanvasPoint[];
  text?: string;
}

interface ScratchpadCanvasProps {
  initialData?: string; // JSON containing { strokes: CanvasStroke[] }
  onChange?: (canvasJson: string) => void;
  onInsertImage?: (markdownImg: string) => void;
  onClose?: () => void;
}

const PALETTE = [
  { name: "White", value: "#f8fafc" },
  { name: "Indigo", value: "#818cf8" },
  { name: "Amber", value: "#fbbf24" },
  { name: "Emerald", value: "#34d399" },
  { name: "Coral", value: "#f87171" },
  { name: "Cyan", value: "#38bdf8" }
];

const PEN_WIDTHS = [
  { label: "Fine", value: 2 },
  { label: "Medium", value: 4 },
  { label: "Bold", value: 7 }
];

export function ScratchpadCanvas({
  initialData,
  onChange,
  onInsertImage,
  onClose
}: ScratchpadCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [tool, setTool] = useState<"pen" | "highlighter" | "eraser" | "text">("pen");
  const [color, setColor] = useState<string>("#f8fafc");
  const [lineWidth, setLineWidth] = useState<number>(4);
  const [strokes, setStrokes] = useState<CanvasStroke[]>([]);
  const [redoStack, setRedoStack] = useState<CanvasStroke[][]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<CanvasStroke | null>(null);

  const [textInputPos, setTextInputPos] = useState<{ x: number; y: number } | null>(null);
  const [textInputValue, setTextInputValue] = useState("");

  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Initialize strokes from initialData
  useEffect(() => {
    if (initialData) {
      try {
        const parsed = JSON.parse(initialData);
        if (Array.isArray(parsed.strokes)) {
          setStrokes(parsed.strokes);
        }
      } catch (err) {
        console.error("Failed to parse initial canvas strokes:", err);
      }
    }
  }, [initialData]);

  // Adjust canvas size to container
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Set display size
    const width = rect.width;
    const height = isFullscreen ? window.innerHeight - 120 : 380;

    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // Set actual resolution
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);

    redrawAll(strokes, dpr);
  }, [strokes, isFullscreen]);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [resizeCanvas]);

  // Redraw all strokes onto canvas
  const redrawAll = useCallback(
    (strokesList: CanvasStroke[], dprOverride?: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = dprOverride || window.devicePixelRatio || 1;

      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(dpr, dpr);

      for (const stroke of strokesList) {
        drawSingleStroke(ctx, stroke);
      }

      ctx.restore();
    },
    []
  );

  const drawSingleStroke = (ctx: CanvasRenderingContext2D, stroke: CanvasStroke) => {
    if (stroke.type === "text") {
      if (stroke.points.length > 0 && stroke.text) {
        ctx.save();
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = stroke.color;
        ctx.font = "bold 15px monospace";
        ctx.fillText(stroke.text, stroke.points[0].x, stroke.points[0].y);
        ctx.restore();
      }
      return;
    }

    if (stroke.points.length < 2) return;

    ctx.save();
    if (stroke.type === "pen") {
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    } else if (stroke.type === "highlighter") {
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width * 4;
      ctx.lineCap = "square";
      ctx.lineJoin = "round";
    } else if (stroke.type === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
      ctx.lineWidth = stroke.width * 4;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }

    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }
    ctx.stroke();
    ctx.restore();
  };

  // Trigger changes to parent
  const notifyChange = (updatedStrokes: CanvasStroke[]) => {
    if (onChange) {
      onChange(JSON.stringify({ strokes: updatedStrokes }));
    }
  };

  // Pointer event handlers
  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>): CanvasPoint => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      pressure: e.pressure
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const pt = getCoordinates(e);

    if (tool === "text") {
      setTextInputPos({ x: pt.x, y: pt.y });
      setTextInputValue("");
      return;
    }

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.setPointerCapture(e.pointerId);
    }

    const newStroke: CanvasStroke = {
      id: `stroke-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: tool,
      color: tool === "highlighter" ? "#fef08a" : color,
      width: lineWidth,
      points: [pt]
    };

    setIsDrawing(true);
    setCurrentStroke(newStroke);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentStroke) return;

    const pt = getCoordinates(e);
    const updatedPoints = [...currentStroke.points, pt];
    const updated = { ...currentStroke, points: updatedPoints };
    setCurrentStroke(updated);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.save();
    ctx.scale(dpr, dpr);

    // Draw immediate segment
    const len = updatedPoints.length;
    if (len >= 2) {
      const p1 = updatedPoints[len - 2];
      const p2 = updatedPoints[len - 1];

      if (updated.type === "pen") {
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = updated.color;
        ctx.lineWidth = updated.width;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      } else if (updated.type === "highlighter") {
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = updated.color;
        ctx.lineWidth = updated.width * 4;
        ctx.lineCap = "square";
        ctx.lineJoin = "round";
      } else if (updated.type === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
        ctx.strokeStyle = "rgba(0,0,0,1)";
        ctx.lineWidth = updated.width * 4;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      }

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
    ctx.restore();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentStroke) return;

    const canvas = canvasRef.current;
    if (canvas && canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }

    const nextStrokes = [...strokes, currentStroke];
    setStrokes(nextStrokes);
    setRedoStack([]);
    setIsDrawing(false);
    setCurrentStroke(null);

    notifyChange(nextStrokes);
    redrawAll(nextStrokes);
  };

  const handleTextSubmit = () => {
    if (!textInputPos || !textInputValue.trim()) {
      setTextInputPos(null);
      setTextInputValue("");
      return;
    }

    const textStroke: CanvasStroke = {
      id: `text-${Date.now()}`,
      type: "text",
      color,
      width: lineWidth,
      points: [textInputPos],
      text: textInputValue.trim()
    };

    const nextStrokes = [...strokes, textStroke];
    setStrokes(nextStrokes);
    setRedoStack([]);
    setTextInputPos(null);
    setTextInputValue("");

    notifyChange(nextStrokes);
    redrawAll(nextStrokes);
  };

  // Undo / Redo
  const handleUndo = () => {
    if (strokes.length === 0) return;
    const last = strokes[strokes.length - 1];
    const remaining = strokes.slice(0, -1);
    setStrokes(remaining);
    setRedoStack((prev) => [[last], ...prev]);
    notifyChange(remaining);
    redrawAll(remaining);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const [toRestore, ...rest] = redoStack;
    const updated = [...strokes, ...toRestore];
    setStrokes(updated);
    setRedoStack(rest);
    notifyChange(updated);
    redrawAll(updated);
  };

  const handleClear = () => {
    if (strokes.length === 0) return;
    if (!window.confirm("Clear all canvas drawings?")) return;
    setRedoStack((prev) => [strokes, ...prev]);
    setStrokes([]);
    notifyChange([]);
    redrawAll([]);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in text input
      if ((e.target as HTMLElement).tagName === "INPUT" || (e.target as HTMLElement).tagName === "TEXTAREA") {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedo();
        return;
      }

      switch (e.key.toLowerCase()) {
        case "p":
          setTool("pen");
          break;
        case "h":
          setTool("highlighter");
          break;
        case "e":
          setTool("eraser");
          break;
        case "t":
          setTool("text");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [strokes, redoStack]);

  // Export to PNG and Attach to Solution
  const handleExportAndInsert = async () => {
    if (strokes.length === 0) {
      alert("Canvas is empty. Draw or write something first!");
      return;
    }

    setIsExporting(true);
    setExportSuccess(false);

    try {
      const sourceCanvas = canvasRef.current;
      if (!sourceCanvas) throw new Error("Canvas element not found");

      // Create an offscreen canvas with solid chalkboard dark background
      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = sourceCanvas.width;
      exportCanvas.height = sourceCanvas.height;
      const expCtx = exportCanvas.getContext("2d");
      if (!expCtx) throw new Error("Could not create canvas context");

      // Draw dark background (#09090b)
      expCtx.fillStyle = "#09090b";
      expCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

      // Draw subtle grid lines
      expCtx.strokeStyle = "rgba(255, 255, 255, 0.03)";
      expCtx.lineWidth = 1;
      const gridSize = 32 * (window.devicePixelRatio || 1);
      for (let x = 0; x < exportCanvas.width; x += gridSize) {
        expCtx.beginPath();
        expCtx.moveTo(x, 0);
        expCtx.lineTo(x, exportCanvas.height);
        expCtx.stroke();
      }
      for (let y = 0; y < exportCanvas.height; y += gridSize) {
        expCtx.beginPath();
        expCtx.moveTo(0, y);
        expCtx.lineTo(exportCanvas.width, y);
        expCtx.stroke();
      }

      // Draw strokes
      const dpr = window.devicePixelRatio || 1;
      expCtx.scale(dpr, dpr);
      for (const stroke of strokes) {
        drawSingleStroke(expCtx, stroke);
      }

      // Convert to blob
      const blob = await new Promise<Blob | null>((resolve) => {
        exportCanvas.toBlob((b) => resolve(b), "image/png");
      });

      if (!blob) throw new Error("Failed to export image blob");

      const file = new File([blob], `scratchpad-${Date.now()}.png`, { type: "image/png" });
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      if (onInsertImage && data.url) {
        onInsertImage(`\n\n![Scratchpad Handwritten Working](${data.url})\n\n`);
      }

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 2500);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to attach drawing to solution.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-2xl bg-zinc-950 border border-zinc-800 shadow-xl overflow-hidden flex flex-col transition-all ${
        isFullscreen ? "fixed inset-4 z-50 h-[calc(100vh-2rem)]" : "mb-4"
      }`}
    >
      {/* Top Controls Toolbar */}
      <div className="px-4 py-2.5 bg-zinc-900/90 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3 backdrop-blur-sm">
        {/* Tool Selector */}
        <div className="flex items-center gap-1 bg-zinc-950/80 p-1 rounded-xl border border-zinc-800">
          <button
            type="button"
            onClick={() => setTool("pen")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              tool === "pen"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
            }`}
            title="Pen Tool (P)"
          >
            <Pen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pen</span>
          </button>

          <button
            type="button"
            onClick={() => setTool("highlighter")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              tool === "highlighter"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
            }`}
            title="Highlighter Tool (H)"
          >
            <Highlighter className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Highlight</span>
          </button>

          <button
            type="button"
            onClick={() => setTool("eraser")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              tool === "eraser"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
            }`}
            title="Eraser (E)"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Eraser</span>
          </button>

          <button
            type="button"
            onClick={() => setTool("text")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              tool === "text"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
            }`}
            title="Click to place text label (T)"
          >
            <Type className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Text</span>
          </button>
        </div>

        {/* Colors & Width (Visible for Pen / Text) */}
        {tool !== "eraser" && (
          <div className="flex items-center gap-2">
            {/* Color Palette */}
            <div className="flex items-center gap-1.5 bg-zinc-950/80 px-2 py-1 rounded-xl border border-zinc-800">
              {PALETTE.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`w-5 h-5 rounded-full transition cursor-pointer ${
                    color === c.value
                      ? "ring-2 ring-offset-2 ring-offset-zinc-900 ring-white scale-110"
                      : "opacity-70 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
            </div>

            {/* Stroke Width */}
            <div className="hidden sm:flex items-center gap-1 bg-zinc-950/80 p-1 rounded-xl border border-zinc-800">
              {PEN_WIDTHS.map((w) => (
                <button
                  key={w.label}
                  type="button"
                  onClick={() => setLineWidth(w.value)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                    lineWidth === w.value
                      ? "bg-zinc-800 text-zinc-100"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Actions: Undo, Redo, Clear, Attach to Solution */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleUndo}
            disabled={strokes.length === 0}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
            title="Redo (Ctrl+Y)"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleClear}
            disabled={strokes.length === 0}
            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
            title="Clear Scratchpad"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-zinc-800 mx-1 hidden sm:block" />

          {/* Attach PNG to Solution */}
          <button
            type="button"
            onClick={handleExportAndInsert}
            disabled={isExporting || strokes.length === 0}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer ${
              exportSuccess
                ? "bg-emerald-600 text-white"
                : "bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:pointer-events-none"
            }`}
            title="Render chalkboard drawing to PNG and insert markdown into your working"
          >
            {isExporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : exportSuccess ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <ImagePlus className="w-3.5 h-3.5" />
            )}
            <span>{exportSuccess ? "Attached!" : "Insert into Working"}</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition cursor-pointer hidden md:block"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Canvas"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition cursor-pointer"
              title="Close Scratchpad"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Canvas Drawing Area */}
      <div className="relative flex-1 bg-zinc-950 overflow-hidden cursor-crosshair select-none touch-none">
        {/* Subtle grid pattern background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle, #4f46e5 1px, transparent 1px)`,
            backgroundSize: "24px 24px"
          }}
        />

        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="block w-full touch-none relative z-10"
        />

        {/* Floating Text Input Box when clicking canvas with Text tool */}
        {textInputPos && (
          <div
            className="absolute z-20 bg-zinc-900 border border-indigo-500/50 rounded-xl p-2 shadow-2xl flex items-center gap-2"
            style={{ left: Math.min(textInputPos.x, (containerRef.current?.clientWidth || 300) - 220), top: textInputPos.y }}
          >
            <input
              type="text"
              autoFocus
              value={textInputValue}
              onChange={(e) => setTextInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTextSubmit();
                if (e.key === "Escape") setTextInputPos(null);
              }}
              placeholder="Type note & hit Enter..."
              className="bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500 w-48 font-mono"
            />
            <button
              type="button"
              onClick={handleTextSubmit}
              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setTextInputPos(null)}
              className="p-1 text-zinc-400 hover:text-zinc-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Empty state hint */}
        {strokes.length === 0 && !isDrawing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-zinc-600 text-xs gap-1">
            <Pen className="w-6 h-6 stroke-1 text-zinc-700 mb-1" />
            <p className="font-semibold text-zinc-500">Handwriting & Scratchpad Canvas</p>
            <p className="text-[11px] text-zinc-600">
              Draw math with tablet stylus, sketch diagrams with mouse, or press <kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">T</kbd> for text.
            </p>
          </div>
        )}
      </div>

      {/* Footer Status */}
      <div className="px-4 py-1.5 bg-zinc-900/60 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500">
        <div className="flex items-center gap-3">
          <span>Strokes: {strokes.length}</span>
          <span>•</span>
          <span>Shortcuts: P (Pen), H (Highlight), E (Eraser), T (Text), Ctrl+Z (Undo)</span>
        </div>
        <div>
          <span>Auto-saves vector strokes to your question profile</span>
        </div>
      </div>
    </div>
  );
}
