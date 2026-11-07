"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CourseMeta, CourseBasePack, Question } from "@/lib/types";
import {
  GraduationCap,
  Plus,
  CheckCircle,
  ArrowRight,
  BookOpen,
  Sparkles,
  Layers,
  Wand2,
  Terminal,
  Globe,
  Upload
} from "lucide-react";
import {
  getCourseCatalog,
  isLocalStudio,
  saveCustomCourse,
  setActiveCourseId as setStoredActiveCourseId,
  getActiveCourseId,
  importCustomPack
} from "@/lib/pack-loader";

export default function CoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<CourseMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCourseId, setActiveCourseId] = useState("sample1001");
  const [isLocal, setIsLocal] = useState(false);

  // Creation Wizard Form
  const [showWizard, setShowWizard] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [term, setTerm] = useState("T1, 2027");
  const [institution, setInstitution] = useState("UNSW");
  const [preset, setPreset] = useState("calculus");
  const [pasteQuestions, setPasteQuestions] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [successBanner, setSuccessBanner] = useState("");

  useEffect(() => {
    setIsLocal(isLocalStudio());
    const saved = getActiveCourseId();
    setActiveCourseId(saved);

    getCourseCatalog()
      .then((catalog) => {
        const mapped: CourseMeta[] = catalog.map((c) => ({
          id: c.id,
          code: c.code,
          name: c.name,
          institution: c.institution || "",
          term: c.term || "",
          logoSymbol: c.logoSymbol || "📚",
          description: c.description
        }));
        setCourses(mapped);
      })
      .catch((err) => console.error("Error loading courses:", err))
      .finally(() => setLoading(false));
  }, []);

  const selectActiveCourse = (courseId: string) => {
    setStoredActiveCourseId(courseId);
    setActiveCourseId(courseId);
    window.location.href = "/";
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name) {
      alert("Please provide both course code and course title.");
      return;
    }

    setIsCreating(true);
    const courseId = code.toLowerCase().replace(/[^a-z0-9]/g, "");

    const newCourse: CourseMeta = {
      id: courseId,
      code: code.toUpperCase(),
      name,
      term,
      institution,
      preset,
      logoSymbol: "📚",
      description: `${name} (${code.toUpperCase()})`
    };

    // Parse any pasted questions
    const parsedQuestions: Question[] = [];
    if (pasteQuestions.trim()) {
      const blocks = pasteQuestions.split(/\n(?=(?:Question|Problem|\d+[\.\)]))/i);
      let qNum = 1;
      for (const block of blocks) {
        if (!block.trim()) continue;
        parsedQuestions.push({
          id: `q-${String(qNum).padStart(3, "0")}`,
          number: qNum,
          title: `Problem ${qNum}`,
          week: Math.min(10, Math.floor((qNum - 1) / 10) + 1),
          topic: "Problem Sheet",
          difficulty: 2,
          status: "Unattempted",
          concepts: [],
          source: `${code.toUpperCase()} Sheet`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          rawBody: block.trim(),
          content: {
            prompt: block.trim(),
            hints: "",
            solution: "",
            official: ""
          }
        });
        qNum++;
      }
    }

    const basePack: CourseBasePack = {
      version: "1.0",
      layer: "base",
      course: newCourse,
      concepts: [],
      questions: parsedQuestions
    };

    // If running in local dev with API available, attempt backend creation
    if (isLocal) {
      try {
        const res = await fetch("/api/courses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newCourse)
        });

        if (res.ok) {
          for (const q of parsedQuestions) {
            await fetch(`/api/questions?course=${courseId}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(q)
            }).catch(() => {});
          }
        }
      } catch (e) {
        console.warn("Backend creation failed, falling back to browser storage:", e);
      }
    }

    // Always persist to client-side localStorage as well (works seamlessly on GitHub Pages)
    saveCustomCourse(newCourse, basePack);
    setCourses((prev) => [newCourse, ...prev.filter((c) => c.id !== courseId)]);
    setStoredActiveCourseId(courseId);
    setActiveCourseId(courseId);
    setIsCreating(false);
    setShowWizard(false);
    setSuccessBanner(`Course ${newCourse.code} created successfully and activated!`);
    setTimeout(() => {
      window.location.href = "/";
    }, 1500);
  };

  const handleImportPackFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const res = importCustomPack(content);
        setSuccessBanner(`Successfully imported ${res.layer.toUpperCase()} pack for course ${res.courseId.toUpperCase()}! Switching course...`);
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (err: any) {
        alert(err.message || "Failed to import course pack.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold border border-indigo-500/20 mb-2">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Course Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Your University Courses
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Manage and switch between study hubs for all your degree subjects.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <label className="px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition flex items-center gap-2 border border-zinc-700 cursor-pointer shadow-sm">
            <Upload className="w-4 h-4 text-violet-400" />
            <span>Import Pack (.json)</span>
            <input type="file" accept=".json" onChange={handleImportPackFile} className="hidden" />
          </label>
          <button
            type="button"
            onClick={() => setShowWizard(!showWizard)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>{showWizard ? "Close Wizard" : "Create New Course Hub"}</span>
          </button>
        </div>
      </div>

      {successBanner && (
        <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Mode Indicator Banner */}
      {!isLocal ? (
        <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-800/40 flex items-start gap-3">
          <Globe className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div className="text-xs text-zinc-300 space-y-0.5">
            <span className="font-bold text-indigo-300">Online Browser Mode:</span> Courses created here are saved directly to your browser&apos;s local storage and can be exported as <code className="text-zinc-200">.json</code> packs. To persist permanent course folders on your PC filesystem, run in <Link href="/guide" className="text-indigo-400 underline font-semibold">Local Studio mode</Link>.
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/40 flex items-start gap-3">
          <Terminal className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs text-zinc-300">
            <span className="font-bold text-emerald-300">Local Studio Connected:</span> Courses created here are written directly to your local <code className="text-zinc-200">courses/</code> directory on disk.
          </div>
        </div>
      )}

      {/* Course Creation Wizard Form */}
      {showWizard && (
        <form onSubmit={handleCreateCourse} className="p-6 sm:p-8 rounded-2xl bg-zinc-900 border border-indigo-500/50 space-y-6 shadow-2xl animate-in fade-in duration-200">
          <div className="border-b border-zinc-800 pb-3 flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-zinc-100">Course Setup Wizard</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300">Course Code</label>
              <input
                type="text"
                required
                placeholder="e.g. MATH2011, MATH2801, COMP3121"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300">Course Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Several Variable Calculus"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300">Term / Year</label>
              <input
                type="text"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300">Institution</label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300">Subject Preset (Toolbars & Concepts)</label>
              <select
                value={preset}
                onChange={(e) => setPreset(e.target.value)}
                className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="calculus">Multivariable Calculus (∇f, ∬, Stokes)</option>
                <option value="linear_algebra">Linear Algebra (Ax=λx, det, eigenspaces)</option>
                <option value="complex_analysis">Complex Analysis (∮dz, Residues, CIF)</option>
                <option value="probability_statistics">Probability & Statistics (E[X], Var, Bayes)</option>
                <option value="discrete_math_algorithms">Algorithms & Discrete Math (O(n), Recurrences)</option>
                <option value="general">General Mathematics / Science</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
              <span>Optional: Paste Raw Questions / Problem Sheet Text</span>
              <span className="text-[11px] text-zinc-500">Auto-splits numbers 1., 2., 3., etc.</span>
            </label>
            <textarea
              value={pasteQuestions}
              onChange={(e) => setPasteQuestions(e.target.value)}
              placeholder="Paste questions here to automatically populate the question bank immediately (or add them later via PDF Snipper)..."
              rows={4}
              className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowWizard(false)}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md disabled:opacity-50"
            >
              {isCreating ? "Initializing Course..." : "Create Course & Switch"}
            </button>
          </div>
        </form>
      )}

      {/* Courses List */}
      {loading ? (
        <div className="py-20 text-center text-zinc-500 text-sm animate-pulse">
          Loading course library...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {courses.map((c) => {
            const isActive = c.id === activeCourseId;

            return (
              <div
                key={c.id}
                className={`p-6 rounded-2xl border transition-all flex flex-col justify-between ${
                  isActive
                    ? "bg-indigo-950/40 border-indigo-500/80 shadow-lg"
                    : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 font-mono font-bold text-sm flex items-center justify-center border border-indigo-500/30">
                        {c.logoSymbol || "📚"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-black text-zinc-100">{c.code}</h3>
                          {isActive && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              <span>Active</span>
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-zinc-400">{c.term} • {c.institution}</div>
                      </div>
                    </div>
                  </div>

                  <h4 className="text-lg font-bold text-zinc-100 mb-2">{c.name}</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
                    {c.description || `Study hub for ${c.code}.`}
                  </p>
                </div>

                <div className="pt-5 border-t border-zinc-800/80 flex items-center justify-between mt-4">
                  <span className="text-xs text-zinc-500 font-medium">Preset: {c.preset || "general"}</span>

                  {isActive ? (
                    <Link
                      href="/"
                      className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <span>Open Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => selectActiveCourse(c.id)}
                      className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition cursor-pointer"
                    >
                      Switch to Course
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
