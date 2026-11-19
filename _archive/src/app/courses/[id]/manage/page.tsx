"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Layers,
  BookOpen,
  Upload,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowLeft,
  ArrowRight,
  Copy,
  Check,
  FileDown,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Trash2,
  AlertTriangle
} from "lucide-react";
import { getBasePath, deleteCourse } from "@/lib/pack-loader";

export default function CourseManagePage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const courseId = unwrappedParams.id;

  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [statusData, setStatusData] = useState<any>(null);
  const [activeDeltaWeek, setActiveDeltaWeek] = useState(7);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [copiedDirective, setCopiedDirective] = useState(false);

  // Delete State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleDeleteCourse = async () => {
    setIsDeleting(true);
    setDeleteError("");
    try {
      const res = await deleteCourse(courseId);
      if (!res.success) {
        setDeleteError(res.error || "Failed to delete course");
        setIsDeleting(false);
        return;
      }
      router.push("/courses");
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete course");
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    fetch(`/api/courses/status?course=${courseId}`)
      .then((res) => res.json())
      .then((data) => {
        setStatusData(data);
        if (data.meta?.currentWeek) {
          setActiveDeltaWeek(data.meta.currentWeek);
        }
      })
      .catch((err) => console.error("Error loading course status:", err))
      .finally(() => setLoading(false));
  }, [courseId]);

  const handleUploadDeltaFile = async (e: React.ChangeEvent<HTMLInputElement>, category: "sheet" | "transcript") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("course", courseId);
    formData.append("category", category);
    formData.append("file", file);
    formData.append("week", String(activeDeltaWeek));

    try {
      const res = await fetch("/api/courses/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.isZip && Array.isArray(data.filenames)) {
        setUploadedFiles((prev) => [
          ...prev,
          ...data.filenames.map((name: string) => `${category}: ${name}`)
        ]);
      } else {
        setUploadedFiles((prev) => [...prev, `${category}: ${file.name}`]);
      }
    } catch (err) {
      console.error("Upload error:", err);
    }
  };

  const directiveText = `/synthesize-course courses/${courseId.toUpperCase()} --week ${activeDeltaWeek}`;

  const handleCopyDirective = () => {
    navigator.clipboard.writeText(directiveText);
    setCopiedDirective(true);
    setTimeout(() => setCopiedDirective(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-zinc-400">
        Loading course dashboard...
      </div>
    );
  }

  const meta = statusData?.meta || {};
  const cleanCode = (meta.code || courseId).toUpperCase();

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div>
          <Link
            href="/courses"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Courses</span>
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white">{cleanCode} Management Dashboard</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
              In-Flight Term Engine
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            {meta.name || "University Course"} • {meta.term || "Current Term"} • {meta.institution || "UNSW"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/`}
            onClick={() => localStorage.setItem("math_active_course", courseId)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Open Study Cockpit</span>
          </Link>
        </div>
      </div>

      {/* Progress & Health Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1">
          <span className="text-zinc-500">Active Syllabus Week</span>
          <div className="text-lg font-bold text-white">Week {activeDeltaWeek} of {meta.totalWeeks || 10}</div>
        </div>
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1">
          <span className="text-zinc-500">Curriculum Questions</span>
          <div className="text-lg font-bold text-emerald-400">{statusData?.questionsCount || 0} Ready</div>
        </div>
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1">
          <span className="text-zinc-500">Concept Cheat Sheets</span>
          <div className="text-lg font-bold text-indigo-400">{statusData?.conceptsCount || 0} Definitions</div>
        </div>
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1">
          <span className="text-zinc-500">Staged Textbook PDFs</span>
          <div className="text-lg font-bold text-violet-400">{statusData?.stagedPdfsCount || 0} Standalone</div>
        </div>
      </div>

      {/* Syllabus Timeline Progression */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <span>Syllabus Timeline & Mid-Semester Progression</span>
          </h2>
          <span className="text-xs text-zinc-400">Non-Destructive Delta Sync Active</span>
        </div>

        {/* Timeline Grid */}
        <div className="space-y-3">
          {/* Chapter 1 */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-emerald-500/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <div className="font-bold text-white">Weeks 1--3: Metric & Topological Foundations</div>
                <div className="text-zinc-500 text-[11px]">Chapter 1 • 24 Questions • Standalone PDF Ready</div>
              </div>
            </div>
            <a
              href={`${getBasePath()}/courses/${courseId}/standalone/ch1.pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white flex items-center gap-1 text-[11px]"
            >
              <span>View Ch 1 PDF</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Chapter 2 */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-emerald-500/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <div className="font-bold text-white">Weeks 4--6: Measure Theory & Lebesgue Integration</div>
                <div className="text-zinc-500 text-[11px]">Chapter 2 • 18 Questions • Standalone PDF Ready</div>
              </div>
            </div>
            <a
              href={`${getBasePath()}/courses/${courseId}/standalone/ch2.pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white flex items-center gap-1 text-[11px]"
            >
              <span>View Ch 2 PDF</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Active Delta: Chapter 3 / Week 7 */}
          <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/40 space-y-4">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse" />
                <span className="font-bold text-indigo-200">
                  Weeks 7--8: Normed Spaces & Bounded Operators (Active Delta)
                </span>
              </div>
              <span className="text-[11px] text-indigo-400 font-semibold uppercase">Current Week</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-zinc-950/80 border border-zinc-800 space-y-2">
                <span className="font-semibold text-zinc-300">+ Drop Week 7 Problem Sheet</span>
                <label className="flex items-center justify-center gap-2 p-2.5 rounded-lg border border-dashed border-zinc-700 hover:border-indigo-400 text-zinc-400 hover:text-zinc-200 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Attach Sheet PDF / ZIP</span>
                  <input
                    type="file"
                    accept=".pdf,.zip"
                    onChange={(e) => handleUploadDeltaFile(e, "sheet")}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="p-3 rounded-lg bg-zinc-950/80 border border-zinc-800 space-y-2">
                <span className="font-semibold text-zinc-300">+ Drop Week 7 Transcripts / Audio</span>
                <label className="flex items-center justify-center gap-2 p-2.5 rounded-lg border border-dashed border-zinc-700 hover:border-indigo-400 text-zinc-400 hover:text-zinc-200 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Attach Transcript / ZIP</span>
                  <input
                    type="file"
                    accept=".txt,.vtt,.m4a,.zip"
                    onChange={(e) => handleUploadDeltaFile(e, "transcript")}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="text-[11px] text-zinc-400 space-y-1 bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                <span className="font-semibold text-zinc-300">Staged for Week {activeDeltaWeek}:</span>
                {uploadedFiles.map((f, i) => (
                  <div key={i} className="text-emerald-400">✓ {f}</div>
                ))}
              </div>
            )}

            {/* Directive */}
            <div className="flex items-center gap-2 pt-2">
              <code className="flex-1 px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-indigo-300">
                {directiveText}
              </code>
              <button
                type="button"
                onClick={handleCopyDirective}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                {copiedDirective ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedDirective ? "Copied" : "Copy Directive"}</span>
              </button>
            </div>
          </div>

          {/* Chapter 4 Stub */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between text-xs opacity-75">
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-zinc-600 shrink-0" />
              <div>
                <div className="font-bold text-zinc-400">Weeks 9--10: Hilbert Spaces & Solvability</div>
                <div className="text-zinc-600 text-[11px]">Chapter 4 • Upcoming Milestone</div>
              </div>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">Future Milestone</span>
          </div>

          {/* Danger Zone: Delete Course */}
          {cleanCode !== "SAMPLE1001" && (
            <div className="p-5 rounded-2xl bg-red-950/20 border border-red-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-red-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Danger Zone</span>
                </div>
                <p className="text-xs text-zinc-400">
                  Permanently delete <strong className="text-zinc-200">{cleanCode}</strong> and all associated course materials, notes, and problem sheets.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDeleteError("");
                  setShowDeleteModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-red-600/90 hover:bg-red-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0 shadow-md shadow-red-950/40 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Course</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Course Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md p-6 rounded-2xl bg-zinc-900 border border-red-500/50 shadow-2xl space-y-5">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">
                  Delete {cleanCode}?
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Are you sure you want to permanently delete <strong className="text-zinc-200">{cleanCode}</strong>? All staged lecture recordings, problem sheets, transcripts, and notes will be deleted.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-red-950/30 border border-red-900/40 text-[11px] text-red-300/90 leading-relaxed">
              ⚠️ This operation is permanent and cannot be undone.
            </div>

            {deleteError && (
              <div className="p-2.5 rounded-lg bg-red-950/80 border border-red-800 text-xs text-red-300 font-semibold">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteCourse}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-red-950/50 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? "Deleting..." : "Permanently Delete Course"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
