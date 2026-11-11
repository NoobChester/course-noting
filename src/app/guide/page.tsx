"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Sparkles,
  Layers,
  Save,
  Cpu,
  PenTool,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Mic,
  FileText,
  Upload,
  ArrowRight,
  ShieldCheck,
  Terminal,
  FolderGit2,
  Copy,
  Check,
  Lightbulb,
  ExternalLink,
  ChevronRight,
  Volume2,
  Headphones
} from "lucide-react";

export default function GuidePage() {
  const [activeSection, setActiveSection] = useState<string>("overview");
  const [copiedCli, setCopiedCli] = useState(false);

  const copyCli = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  const sections = [
    { id: "overview", label: "Overview & Philosophy", icon: BookOpen },
    { id: "architecture", label: "3-Layer Save Engine", icon: Layers },
    { id: "solving", label: "Solving Problems & LaTeX", icon: PenTool },
    { id: "ai-review", label: "AI Proof Reviewer", icon: Cpu },
    { id: "spaced-repetition", label: "Spaced Repetition (SM-2)", icon: Flame },
    { id: "lectures", label: "Lecture Insights (Layer 2)", icon: Mic },
    { id: "save-load", label: "Save, Load & Backup", icon: Save },
    { id: "local-studio", label: "Local Studio & Adding Courses", icon: Terminal }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950 via-zinc-900 to-zinc-950 border border-indigo-900/50 p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold border border-indigo-500/20">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Interactive User Guide & Tutorial</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            How to Master Course Noting
          </h1>

          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
            Welcome to the Course Noting study engine — a privacy-first, context-aware university workspace designed for rigorous mathematics, physics, and computer science study. Learn how to leverage the 3-layer architecture, write LaTeX proofs, train with SM-2 spaced repetition, and add your own courses.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              href="/questions/q-001"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition"
            >
              <span>Try Practice Q1</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/lectures"
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-semibold text-xs border border-zinc-700/80 flex items-center gap-1.5 transition"
            >
              <Mic className="w-3.5 h-3.5 text-violet-400" />
              <span>Explore Lecture Insights</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Layout: Sidebar Navigation + Content Body */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-1">
          <div className="p-2 rounded-xl bg-zinc-900/60 border border-zinc-800 sticky top-20">
            <div className="px-3 py-2 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
              Tutorial Sections
            </div>
            {sections.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold text-left transition cursor-pointer ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-zinc-400"}`} />
                  <span className="truncate">{sec.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-8">
          {/* Section: Overview */}
          {activeSection === "overview" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
                  <BookOpen className="w-6 h-6 text-indigo-400" />
                  <span>The Course Noting Philosophy</span>
                </h2>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  Traditional university learning often forces students to juggle disconnected PDF problem sheets, disjointed lecture slides, official solution documents, and messy handwritten notebooks. Course Noting unifies all these into a single high-performance interactive workspace.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
                    1
                  </div>
                  <h3 className="text-sm font-bold text-zinc-100">Blank Slate Core</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    The engine is 100% open source and ships with zero proprietary materials. Real university courses stay private on your local PC.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center font-bold">
                    2
                  </div>
                  <h3 className="text-sm font-bold text-zinc-100">Active Recall First</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Never just passively read solutions. Type proofs in LaTeX, sketch on the scratchpad, and test yourself against automated AI review.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                    3
                  </div>
                  <h3 className="text-sm font-bold text-zinc-100">Spaced Repetition</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Integrated SuperMemo SM-2 spaced repetition automatically calculates review intervals so you master difficult exam problems before finals.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Section: Architecture */}
          {activeSection === "architecture" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
                  <Layers className="w-6 h-6 text-violet-400" />
                  <span>The 3-Layer Save Architecture</span>
                </h2>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  To prevent copyrighted university materials from ever leaking into public repositories while allowing full customization and personal study tracking, Course Noting separates state into three distinct layers:
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-zinc-900/80 border border-blue-900/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Layer 1</span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                      Static & Immutable
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">Base Curriculum Pack (<code>&lt;course&gt;_base.json</code>)</h3>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Contains the canonical question prompts, numerical answers, difficulty tiers, and foundational theory concept cheat sheets with KaTeX formatting. This layer represents the syllabus structure.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-zinc-900/80 border border-violet-900/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-violet-400">Layer 2</span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-800">
                      Toggleable Overlay
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">Lecture Insights Pack (<code>&lt;course&gt;_lectures.json</code>)</h3>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Created by distilling lecture recordings through speech-to-text and AI extraction. Overlays spoken intuitions (🎙️) and lecturer exam warnings (⚠️) directly into questions and concepts. Can be toggled on/off instantly via the navbar <strong>[🎙️ Lectures ON/OFF]</strong> button.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-zinc-900/80 border border-emerald-900/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Layer 3</span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                      100% Personal & Private
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">User Progress & Workspace State</h3>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Your personal written LaTeX proofs, stylus canvas strokes, starred problems, and SM-2 retention ratings. On GitHub Pages, this lives securely inside your browser&apos;s <code>localStorage</code>; in local studio mode, it is saved in <code>userdata/</code> (which is strictly gitignored).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Section: Solving Problems */}
          {activeSection === "solving" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
                  <PenTool className="w-6 h-6 text-amber-400" />
                  <span>Interactive Problem Workspace</span>
                </h2>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  Every problem page features a professional dual-pane editing environment built specifically for mathematical proof composition:
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span>Split LaTeX Editor with Live KaTeX Rendering</span>
                  </h3>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Write standard Markdown mixed with LaTeX math syntax (<code>$inline$</code> or <code>$$display$$</code>). As you type, the right pane renders formatted mathematical notation in real-time.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-400" />
                    <span>Quick-Insert Math Snippets Palette</span>
                  </h3>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Above the editor, click any snippet button (such as <code className="text-indigo-300 font-mono">∮_C</code>, <code className="text-indigo-300 font-mono">∂u/∂x</code>, <code className="text-indigo-300 font-mono">Av = λv</code>, or <code className="text-indigo-300 font-mono">a/b</code>) to inject LaTeX templates instantly into your cursor location.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <PenTool className="w-4 h-4 text-violet-400" />
                    <span>Handwritten Scratchpad Canvas</span>
                  </h3>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Need to draw a geometric curve, sketch a contour in the complex plane, or perform quick side calculations? Switch to the <strong>Scratchpad tab</strong> to draw with pen, highlighter, eraser, and color pickers. Strokes auto-save seamlessly.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Section: AI Proof Reviewer */}
          {activeSection === "ai-review" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
                  <Cpu className="w-6 h-6 text-indigo-400" />
                  <span>AI Proof Reviewer & Rigor Auditor</span>
                </h2>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  Get instant feedback on your mathematical proofs from leading LLMs without leaving the problem workspace.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-900/80 border border-indigo-900/50 space-y-4">
                <div className="flex items-center gap-2 text-indigo-400 text-sm font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>100% Client-Side API Key Storage</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Click <strong>Settings</strong> in the navigation bar to configure your preferred AI provider. Your API key is stored only in your local browser storage and is never committed to Git or sent to any intermediate server.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                    <div className="text-xs font-bold text-zinc-200 flex items-center justify-between">
                      <span>Google Gemini</span>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold border border-emerald-800">
                        Free Tier
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Recommended. Gemini 1.5 Flash offers 15 RPM for free via Google AI Studio. Excellent LaTeX understanding.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                    <div className="text-xs font-bold text-zinc-200">Anthropic Claude</div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Claude 3.5 Sonnet provides gold-standard rigorous mathematical critiques and edge-case detection.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                    <div className="text-xs font-bold text-zinc-200">OpenAI</div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      GPT-4o and GPT-4o-mini support for rapid proof step verification.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                    <div className="text-xs font-bold text-zinc-200 flex items-center justify-between">
                      <span>Local Ollama</span>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-blue-950 text-blue-400 font-bold border border-blue-800">
                        100% Offline
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Connect to your local Ollama instance (<code>qwen2.5:7b-instruct</code>, <code>llama3</code>) for zero-cost, private offline auditing.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section: Spaced Repetition */}
          {activeSection === "spaced-repetition" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
                  <Flame className="w-6 h-6 text-orange-400" />
                  <span>SM-2 Spaced Repetition Daily Review</span>
                </h2>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  Mastering mathematics requires revisiting difficult concepts right before you forget them. Course Noting embeds the battle-tested SuperMemo-2 (SM-2) retention algorithm:
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                  <h3 className="text-sm font-bold text-white">Retention Ratings (0 to 5)</h3>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Whenever you solve or review a problem, rate your recall performance:
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-900/40 text-xs">
                      <div className="font-bold text-red-400">Rating 1: Blankout</div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">Resets interval to 1 day.</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-900/40 text-xs">
                      <div className="font-bold text-amber-400">Rating 3: Struggled</div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">Correct with serious effort.</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-900/40 text-xs">
                      <div className="font-bold text-emerald-400">Rating 4: Good Recall</div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">Minor hesitation; interval expands.</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-900/40 text-xs">
                      <div className="font-bold text-indigo-400">Rating 5: Mastered</div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">Instant recall; triggers confetti 🎉.</div>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                  <h3 className="text-sm font-bold text-white">Daily Review Queue</h3>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Click <strong>Daily Review</strong> in the navbar or homepage. The app gathers all problems whose SM-2 schedule has matured today into an uninterrupted study queue.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Section: Lectures */}
          {activeSection === "lectures" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
                  <Mic className="w-6 h-6 text-violet-400" />
                  <span>Lecture Intelligence & Spoken Insights</span>
                </h2>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  Lecturers often drop invaluable verbal hints, geometric intuitions, and exam warnings that never appear on the lecture slides. Course Noting automatically bridges the gap between raw recordings and structured study notes.
                </p>
              </div>

              {/* 3-Step Ingestion Pipeline */}
              <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  <span>The 3-Step Ingestion & Distillation Pipeline</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-2">
                    <div className="font-bold text-violet-400 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-300 flex items-center justify-center text-[10px] font-mono">1</span>
                      <span>Source Ingest</span>
                    </div>
                    <p className="text-zinc-400 text-[11px] leading-relaxed">
                      Auto-download audio & transcripts via <code className="text-zinc-200">scripts/echo360_helper.py</code> or drop your own <code className="text-zinc-200">.vtt</code>/<code className="text-zinc-200">.txt</code> and <code className="text-zinc-200">.m4a</code> files into the Ingest modal.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-2">
                    <div className="font-bold text-amber-400 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-[10px] font-mono">2</span>
                      <span>AI Synthesis</span>
                    </div>
                    <p className="text-zinc-400 text-[11px] leading-relaxed">
                      AI correlates slide theorems with the spoken transcript to extract verbal intuitions (<span className="text-violet-300">🎙️</span>) and lecturer exam warnings (<span className="text-amber-300">⚠️</span>) with exact timestamps.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-2">
                    <div className="font-bold text-emerald-400 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[10px] font-mono">3</span>
                      <span>Layer 2 Injection</span>
                    </div>
                    <p className="text-zinc-400 text-[11px] leading-relaxed">
                      Click &ldquo;Push to Concept / Question&rdquo; to inject high-yield warnings right into problem sheet hints and theory cheat sheets. Toggle on/off globally with one click.
                    </p>
                  </div>
                </div>
              </div>

              {/* Echo360 Helper Guide */}
              <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  <span>Option A: Batch Auto-Process Entire Course (100% Browser GUI)</span>
                </h3>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  No terminal commands needed! Process an entire semester of lectures automatically in one go:
                </p>
                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-lg bg-zinc-950 text-[11px] text-zinc-300 border border-zinc-800 space-y-1.5">
                    <div>1. <strong>Connect Session:</strong> Open <a href="https://echo360.net.au" target="_blank" rel="noopener noreferrer" className="text-violet-300 underline font-mono">echo360.net.au</a>, open DevTools (<kbd className="px-1 py-0.5 rounded bg-zinc-800 text-[10px]">F12</kbd> &gt; Network tab), right-click any request and select <strong>Copy &gt; Copy as cURL</strong> (or Copy request headers), then paste into the GUI. <em>(Note: Echo360 tokens are HttpOnly so copying via Network tab is required instead of document.cookie)</em>.</div>
                    <div>2. <strong>Auto-Discover Syllabus:</strong> Paste your Echo360 course section URL (<code className="text-violet-300">https://echo360.net.au/section/.../home</code> or syllabus link, or click &ldquo;Try Demo 8-Week Course Syllabus&rdquo;) and click <strong>&ldquo;Auto-Discover All Lectures&rdquo;</strong>. The studio maps every lecture, week, and media stream across the entire semester!</div>
                    <div>3. <strong>1-Click Batch Processing:</strong> Click <strong>&ldquo;⚡ Start Batch Processing&rdquo;</strong>. The studio automatically processes each lecture sequentially: fetches clean transcripts, extracts audio streams via FFmpeg, distills AI definitions, intuitions, and exam warnings, and directly saves them into your course notes!</div>
                  </div>
                </div>
              </div>

              {/* Echo360 CLI Alternative */}
              <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-indigo-400" />
                  <span>Option B: Terminal CLI (Batch Scripting)</span>
                </h3>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  If you prefer batch scripting from your command line:
                </p>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-zinc-950 font-mono text-[11px] text-zinc-300 border border-zinc-800">
                    <div className="text-zinc-500"># 1. Authenticate once via Chrome SSO</div>
                    <div>python scripts/echo360_helper.py --login</div>
                    <div className="text-zinc-500 mt-1"># 2. Batch download all lectures in course section</div>
                    <div className="text-emerald-400">python scripts/echo360_helper.py --course &lt;CODE&gt; --url &quot;&lt;SECTION_URL&gt;&quot; --all --audio</div>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Transcripts land in <code className="text-zinc-300">courses/&lt;CODE&gt;/raw_files/transcripts/</code> and audio streams land in <code className="text-zinc-300">courses/&lt;CODE&gt;/raw_files/audio/</code>.
                  </p>
                </div>
              </div>

              {/* Local Audio Streaming */}
              <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-violet-400" />
                  <span>Option C: Local Audio HTTP 206 Streaming</span>
                </h3>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Have an existing recording file (<code className="text-zinc-200">.m4a</code> or <code className="text-zinc-200">.mp3</code>)? Place it in:
                </p>
                <div className="p-2.5 rounded-lg bg-zinc-950 font-mono text-[11px] text-violet-300 border border-zinc-800">
                  courses/&lt;COURSE_CODE&gt;/raw_files/audio/&lt;recording_name&gt;.m4a
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  When you add the filename to your lecture note, Course Noting provides instant in-app audio streaming with waveform seeking and timestamp sync!
                </p>
              </div>

              {/* Insights Types */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className="text-sm">🎙️</span>
                    <span>Spoken Intuitions</span>
                  </h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Captures informal metaphors, mental models, and geometric visualisations lecturers describe out loud that clarify abstract textbook definitions.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className="text-sm">⚠️</span>
                    <span>Lecturer Exam Warnings</span>
                  </h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Surfaces explicit pitfalls and common student errors the lecturer stressed will be penalized on midterms or final exams.
                  </p>
                </div>
              </div>

              {/* Layer 2 Toggle */}
              <div className="p-4 rounded-xl bg-violet-950/20 border border-violet-800/30 flex items-center justify-between gap-4">
                <div className="text-xs text-zinc-300">
                  <span className="font-bold text-violet-300">Global Toggle [🎙️ Lectures ON / OFF]:</span> Want pure mathematical theory without lecture overlays? Use the top navigation toggle at any time to hide or reveal all Layer 2 callouts across all courses.
                </div>
              </div>
            </div>
          )}

          {/* Section: Save & Load */}
          {activeSection === "save-load" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
                  <Save className="w-6 h-6 text-indigo-400" />
                  <span>Saving, Loading & Cross-Device Sync</span>
                </h2>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  How your progress is protected and how to transfer your work across devices:
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                  <h3 className="text-sm font-bold text-white">The Copy-Pasteable Save String</h3>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Click <strong>Save / Load</strong> in the navbar. The app compresses your entire study history (solutions, stars, mastery flags, SM-2 retention logs) into a single base64 string. Paste this string on your tablet, laptop, or phone to resume your session instantly.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                  <h3 className="text-sm font-bold text-white">JSON File Export</h3>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    You can download a full <code className="text-indigo-300 font-mono">course-noting-backup.json</code> file for permanent archival or periodic backups.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                  <h3 className="text-sm font-bold text-white">Clean Slate for Sharing</h3>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Want to share your study hub with a classmate without exposing your personal notes or progress? Use the <strong>Clean Slate (Reset)</strong> option in the Save/Load modal to clear personal progress while keeping the curriculum intact.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Section: Local Studio & Adding Courses */}
          {activeSection === "local-studio" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
                  <Terminal className="w-6 h-6 text-emerald-400" />
                  <span>Local Course Studio (For University Students)</span>
                </h2>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  If you want to use Course Noting for your own university courses (e.g. MATH2011, COMP3121, MATH2801), run the local studio on your PC:
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
                  <h3 className="text-sm font-bold text-white">Step 1: Clone & Run Locally</h3>
                  <div className="p-3 rounded-xl bg-zinc-950 font-mono text-xs text-emerald-400 flex items-center justify-between border border-zinc-800">
                    <span>git clone https://github.com/NoobChester/course-noting.git &amp;&amp; cd course-noting &amp;&amp; npm install &amp;&amp; npm run dev</span>
                    <button
                      onClick={() => copyCli("git clone https://github.com/NoobChester/course-noting.git && cd course-noting && npm install && npm run dev")}
                      className="p-1 rounded text-zinc-400 hover:text-white transition cursor-pointer"
                    >
                      {copiedCli ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
                  <h3 className="text-sm font-bold text-white">Step 2: Initialize a New Course</h3>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Run the interactive course generator CLI:
                  </p>
                  <div className="p-3 rounded-xl bg-zinc-950 font-mono text-xs text-indigo-400 border border-zinc-800">
                    python scripts/course_manager.py new COMP3121 &ldquo;Algorithms &amp; Programming Techniques&rdquo;
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    This automatically scaffolds <code className="text-zinc-300">courses/COMP3121/</code> with <code>course.json</code>, <code>concepts/</code>, <code>questions/</code>, and <code>lectures/</code>. Remember: all folders inside <code>courses/</code> are completely gitignored to protect your university&apos;s IP.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
                  <h3 className="text-sm font-bold text-white">Step 3: Ingest Questions with PDF Snipper</h3>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Open <Link href="/import" className="text-indigo-400 underline font-semibold">/import</Link> in your local browser to load lecture problem sheet PDFs, crop individual question diagrams, and auto-generate clean question cards in your library.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
