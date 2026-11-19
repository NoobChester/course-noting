"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  BookOpen,
  FileText,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  Loader2,
  ExternalLink,
  Layers,
  ChevronRight,
  FolderGit2
} from "lucide-react";
import { getBasePath } from "@/lib/pack-loader";

export default function CourseSetupPage() {
  const router = useRouter();

  // Wizard Step (1 to 5)
  const [step, setStep] = useState(1);

  // Step 1: Course Details
  const [code, setCode] = useState("MATH3051");
  const [name, setName] = useState("Applied Real and Functional Analysis");
  const [term, setTerm] = useState("Term 3, 2026");
  const [institution, setInstitution] = useState("UNSW Sydney");
  const [weeks, setWeeks] = useState(10);
  const [preset, setPreset] = useState("calculus");

  // Step 2: Notes
  const [notesFile, setNotesFile] = useState<File | null>(null);
  const [notesUploaded, setNotesUploaded] = useState(false);
  const [chapterRanges, setChapterRanges] = useState([
    { ch: 1, title: "Metric & Topological Spaces", start: 1, end: 46 },
    { ch: 2, title: "Measure Theory & Integration", start: 47, end: 75 },
    { ch: 3, title: "Normed Spaces & Operators", start: 76, end: 110 },
    { ch: 4, title: "Hilbert Spaces & Solvability", start: 111, end: 142 }
  ]);

  // Step 3: Tutorial Sheets
  const [sheets, setSheets] = useState<Array<{ file: File; sheet: number; week: number }>>([]);

  // Step 4: Transcripts
  const [transcripts, setTranscripts] = useState<File[]>([]);

  // Step 5: Handoff & Status Polling
  const [isInitializing, setIsInitializing] = useState(false);
  const [taskSaved, setTaskSaved] = useState(false);
  const [copiedDirective, setCopiedDirective] = useState(false);
  const [isSynthesized, setIsSynthesized] = useState(false);
  const [synthesisStats, setSynthesisStats] = useState<{
    questions: number;
    concepts: number;
    stagedPdfs: number;
  } | null>(null);

  const cleanCourseId = code.toLowerCase().replace(/[^a-z0-9]/g, "");

  // Initialize course workspace on Step 1 -> Step 2 transition
  const handleInitWorkspace = async () => {
    setIsInitializing(true);
    try {
      await fetch("/api/courses/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          name,
          weeks,
          term,
          institution,
          preset
        })
      });
      setStep(2);
    } catch (err) {
      console.error("Init error:", err);
      setStep(2);
    } finally {
      setIsInitializing(false);
    }
  };

  // Upload Notes File
  const handleUploadNotes = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNotesFile(file);

    const formData = new FormData();
    formData.append("course", code);
    formData.append("category", "notes");
    formData.append("file", file);

    try {
      await fetch("/api/courses/upload", { method: "POST", body: formData });
      setNotesUploaded(true);
    } catch (err) {
      console.error("Notes upload failed:", err);
    }
  };

  // Upload Sheet
  const handleUploadSheet = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("course", code);
    formData.append("category", "sheet");
    formData.append("file", file);
    formData.append("week", String(sheets.length + 1));

    try {
      const res = await fetch("/api/courses/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.isZip && Array.isArray(data.filenames)) {
        const newSheets = data.filenames.map((name: string, idx: number) => {
          const match = name.match(/(?:week|wk|w|sheet|tut)[\s_-]*(\d+)/i);
          const num = match ? parseInt(match[1], 10) : sheets.length + 1 + idx;
          return { file: { name, size: 0 } as File, sheet: num, week: num };
        });
        setSheets((prev) => [...prev, ...newSheets]);
      } else {
        const nextSheetNum = sheets.length + 1;
        setSheets((prev) => [...prev, { file, sheet: nextSheetNum, week: nextSheetNum }]);
      }
    } catch (err) {
      console.error("Sheet upload failed:", err);
    }
  };

  // Upload Transcript
  const handleUploadTranscript = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("course", code);
    formData.append("category", "transcript");
    formData.append("file", file);

    try {
      const res = await fetch("/api/courses/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.isZip && Array.isArray(data.filenames)) {
        const newTranscripts = data.filenames.map((name: string) => ({ name, size: 0 } as File));
        setTranscripts((prev) => [...prev, ...newTranscripts]);
      } else {
        setTranscripts((prev) => [...prev, file]);
      }
    } catch (err) {
      console.error("Transcript upload failed:", err);
    }
  };

  // Save Task Contract on entering Step 5
  useEffect(() => {
    if (step === 5) {
      const taskPayload = {
        task: "synthesize_course",
        courseId: cleanCourseId,
        courseCode: code.toUpperCase(),
        status: "pending",
        createdAt: new Date().toISOString(),
        scope: {
          readyWeeks: [1, 2, 3, 4],
          targetChapters: [1, 2]
        },
        inputs: {
          lectureNotes: notesFile ? notesFile.name : "LectureNotes.pdf",
          chapterRanges,
          sheetsCount: sheets.length,
          transcriptsCount: transcripts.length
        }
      };

      fetch("/api/courses/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: cleanCourseId, task: taskPayload })
      }).then(() => setTaskSaved(true));
    }
  }, [step]);

  // Polling for Antigravity Completion in Step 5
  useEffect(() => {
    if (step !== 5 || isSynthesized) return;

    const interval = setInterval(() => {
      fetch(`/api/courses/status?course=${cleanCourseId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.isPackReady && data.questionsCount > 0) {
            setIsSynthesized(true);
            setSynthesisStats({
              questions: data.questionsCount,
              concepts: data.conceptsCount,
              stagedPdfs: data.stagedPdfsCount
            });
          }
        })
        .catch(() => {});
    }, 2000);

    return () => clearInterval(interval);
  }, [step, cleanCourseId, isSynthesized]);

  const directiveText = `/synthesize-course courses/${code.toUpperCase()}`;

  const handleCopyDirective = () => {
    navigator.clipboard.writeText(directiveText);
    setCopiedDirective(true);
    setTimeout(() => setCopiedDirective(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Stepper Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Link
            href="/courses"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Courses</span>
          </Link>
          <span className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">
            Turnkey Onboarding Engine
          </span>
        </div>

        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div>
            <h1 className="text-2xl font-black text-white">Course Setup Wizard</h1>
            <p className="text-xs text-zinc-400 mt-1">
              Set up your curriculum, upload PDFs and transcripts, and prepare for AI synthesis.
            </p>
          </div>
          <div className="text-xs font-mono text-zinc-500">Step {step} of 5</div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-indigo-600 h-full transition-all duration-300"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* STEP 1: Course Info */}
      {step === 1 && (
        <div className="space-y-6 bg-zinc-900/60 border border-zinc-800 p-6 rounded-2xl">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-indigo-400" />
            <span>Step 1: Course Information & Syllabus</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-zinc-300">Course Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. COMP3121 or MATH2011"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-zinc-300">Course Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Algorithms and Programming Techniques"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-zinc-300">Term / Year</label>
              <input
                type="text"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="e.g. Term 1, 2027"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-zinc-300">Institution</label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="e.g. UNSW Sydney"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-zinc-300">Total Syllabus Weeks</label>
              <input
                type="number"
                min={4}
                max={16}
                value={weeks}
                onChange={(e) => setWeeks(parseInt(e.target.value) || 10)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-zinc-300">Subject Discipline Preset</label>
              <select
                value={preset}
                onChange={(e) => setPreset(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100"
              >
                <option value="calculus">Pure / Applied Mathematics (Calculus, Analysis)</option>
                <option value="linear_algebra">Linear Algebra & Abstract Algebra</option>
                <option value="discrete_math_algorithms">Computer Science & Algorithms</option>
                <option value="physics">Physics & Engineering</option>
                <option value="general">General STEM</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={handleInitWorkspace}
              disabled={isInitializing || !code.trim() || !name.trim()}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              {isInitializing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Initialize & Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Course Notes */}
      {step === 2 && (
        <div className="space-y-6 bg-zinc-900/60 border border-zinc-800 p-6 rounded-2xl">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span>Step 2: Upload Lecture Notes & Chapter Boundaries</span>
          </h2>

          <div className="border-2 border-dashed border-zinc-800 hover:border-indigo-500/50 rounded-2xl p-6 text-center space-y-3 bg-zinc-950/40 transition">
            <FileText className="w-8 h-8 text-indigo-400 mx-auto" />
            <div className="text-xs text-zinc-200 font-semibold">
              {notesUploaded ? `✓ Uploaded: ${notesFile?.name}` : "Upload Course LectureNotes.pdf or Notes .zip"}
            </div>
            <p className="text-[11px] text-zinc-500">
              Drag & drop your primary course notes, textbook draft, lecture slides PDF, or notes archive (.zip).
            </p>
            <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Browse PDF or ZIP</span>
              <input
                type="file"
                accept=".pdf,.zip"
                onChange={handleUploadNotes}
                className="hidden"
              />
            </label>
          </div>

          {/* Chapter Page Range Adjuster */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-zinc-300">
              Smart Chapter Page-Range Mapping:
            </h3>
            <div className="space-y-2">
              {chapterRanges.map((ch, idx) => (
                <div
                  key={ch.ch}
                  className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs"
                >
                  <span className="font-semibold text-zinc-200">
                    Chapter {ch.ch}: {ch.title}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500">Pages:</span>
                    <input
                      type="number"
                      value={ch.start}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        const copy = [...chapterRanges];
                        copy[idx].start = val;
                        setChapterRanges(copy);
                      }}
                      className="w-12 text-center bg-zinc-900 border border-zinc-700 rounded py-0.5 text-xs font-mono"
                    />
                    <span className="text-zinc-500">to</span>
                    <input
                      type="number"
                      value={ch.end}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        const copy = [...chapterRanges];
                        copy[idx].end = val;
                        setChapterRanges(copy);
                      }}
                      className="w-12 text-center bg-zinc-900 border border-zinc-700 rounded py-0.5 text-xs font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-semibold"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2"
            >
              <span>Continue to Tutorial Sheets</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Tutorial Sheets */}
      {step === 3 && (
        <div className="space-y-6 bg-zinc-900/60 border border-zinc-800 p-6 rounded-2xl">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Step 3: Upload Tutorial Problem Sheets</span>
          </h2>

          <div className="border-2 border-dashed border-zinc-800 rounded-2xl p-6 text-center space-y-3 bg-zinc-950/40">
            <Upload className="w-8 h-8 text-indigo-400 mx-auto" />
            <div className="text-xs text-zinc-200 font-semibold">
              Add Problem Sheet PDFs or Tutorial Sheets Archive (.zip)
            </div>
            <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold cursor-pointer">
              <span>+ Add Sheet PDF / ZIP</span>
              <input
                type="file"
                accept=".pdf,.zip"
                onChange={handleUploadSheet}
                className="hidden"
              />
            </label>
          </div>

          {sheets.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-zinc-300">Staged Problem Sheets:</h3>
              {sheets.map((s, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs"
                >
                  <span className="font-mono text-zinc-300">{s.file.name}</span>
                  <span className="text-emerald-400 font-semibold">
                    Tagged: Sheet {s.sheet} (Week {s.week})
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-semibold"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(4)}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2"
            >
              <span>Continue to Transcripts</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Transcripts */}
      {step === 4 && (
        <div className="space-y-6 bg-zinc-900/60 border border-zinc-800 p-6 rounded-2xl">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Step 4: Upload Transcripts & Audio Recordings</span>
          </h2>

          <div className="border-2 border-dashed border-zinc-800 rounded-2xl p-6 text-center space-y-3 bg-zinc-950/40">
            <Upload className="w-8 h-8 text-indigo-400 mx-auto" />
            <div className="text-xs text-zinc-200 font-semibold">
              Drop Lecture Audio (.m4a, .mp3), Text Transcripts (.txt, .vtt), or Transcripts Archive (.zip)
            </div>
            <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold cursor-pointer">
              <span>+ Add Transcript / Audio / ZIP</span>
              <input
                type="file"
                accept=".txt,.vtt,.m4a,.mp3,.zip"
                onChange={handleUploadTranscript}
                className="hidden"
              />
            </label>
          </div>

          {transcripts.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-zinc-300">Staged Transcripts:</h3>
              {transcripts.map((t, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-300"
                >
                  <span>{t.name}</span>
                  <span className="text-emerald-400">✓ Ready</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-semibold"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(5)}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2"
            >
              <span>View Readiness Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Readiness Dashboard & Handoff */}
      {step === 5 && (
        <div className="space-y-6">
          {!isSynthesized ? (
            <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                    <span>Step 5: Readiness & Antigravity Handoff</span>
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1">
                    Your course materials are staged. Trigger Antigravity to synthesize the coursebook and study hub.
                  </p>
                </div>
                <div className="px-3 py-1 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 text-xs font-semibold">
                  ✓ Staged in courses/{code.toUpperCase()}/
                </div>
              </div>

              {/* Staged Checklist */}
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                  <span className="text-zinc-500">Course Notes</span>
                  <div className="font-bold text-white">
                    {notesUploaded ? "✓ Uploaded" : "Using Default"}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                  <span className="text-zinc-500">Tutorial Sheets</span>
                  <div className="font-bold text-white">{sheets.length} Staged</div>
                </div>
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                  <span className="text-zinc-500">Transcripts</span>
                  <div className="font-bold text-white">{transcripts.length} Staged</div>
                </div>
              </div>

              {/* Antigravity Directive Box */}
              <div className="p-5 rounded-xl bg-gradient-to-r from-indigo-950/40 via-zinc-950 to-zinc-950 border border-indigo-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-300">
                    Antigravity Synthesis Directive:
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    Task contract saved in .antigravity_task.json
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-xs text-indigo-200">
                    {directiveText}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyDirective}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    {copiedDirective ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedDirective ? "Copied!" : "Copy Directive"}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs text-zinc-400 pt-1">
                  <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                  <span>
                    Paste this directive into your Antigravity chat. Waiting for Antigravity to complete synthesis...
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Celebration Screen when Antigravity completes */
            <div className="bg-emerald-950/20 border border-emerald-500/30 p-8 rounded-2xl text-center space-y-5 animate-in fade-in duration-300">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>

              <div>
                <h2 className="text-2xl font-black text-white">Synthesis Complete!</h2>
                <p className="text-xs text-zinc-300 mt-1 max-w-md mx-auto">
                  Antigravity has synthesized the LaTeX coursebook, compiled PDFs, and loaded questions into the study cockpit.
                </p>
              </div>

              {synthesisStats && (
                <div className="grid grid-cols-3 gap-3 max-w-md mx-auto text-xs">
                  <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800">
                    <div className="text-zinc-500 text-[10px]">Questions</div>
                    <div className="text-lg font-bold text-white">
                      {synthesisStats.questions}
                    </div>
                  </div>
                  <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800">
                    <div className="text-zinc-500 text-[10px]">Concepts</div>
                    <div className="text-lg font-bold text-white">
                      {synthesisStats.concepts}
                    </div>
                  </div>
                  <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800">
                    <div className="text-zinc-500 text-[10px]">Staged PDFs</div>
                    <div className="text-lg font-bold text-white">
                      {synthesisStats.stagedPdfs}
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem("math_active_course", cleanCourseId);
                    window.location.href = `${getBasePath()}/`;
                  }}
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 inline-flex items-center gap-2 cursor-pointer transition"
                >
                  <span>Open Course in Study Cockpit</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
