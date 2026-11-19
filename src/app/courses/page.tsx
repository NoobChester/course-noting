"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Plus,
  CheckCircle2,
  Trash2,
  ArrowRight,
  FolderOpen,
  AlertTriangle,
  Link2
} from "lucide-react";
import { CourseMeta } from "@/lib/types";
import {
  deleteCourse,
  getActiveCourseId,
  getCourseCatalog,
  setActiveCourseId
} from "@/lib/pack-loader";

export default function CoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<CourseMeta[]>([]);
  const [activeId, setActiveId] = useState("sample1001");
  const [loading, setLoading] = useState(true);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [term, setTerm] = useState("Term 1, 2026");
  const [institution, setInstitution] = useState("UNSW");
  const [echo360SectionUrl, setEcho360SectionUrl] = useState("");
  const [creating, setCreating] = useState(false);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchCoursesList = useCallback(async (): Promise<CourseMeta[]> => {
    let list: CourseMeta[] = [];
    try {
      const res = await fetch("/api/courses", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as CourseMeta[];
        if (Array.isArray(data)) {
          list = data;
        }
      }
    } catch {
      // Fallback below
    }

    if (list.length === 0) {
      try {
        const catalog = await getCourseCatalog();
        list = catalog.map((c) => ({
          id: c.id,
          code: c.code,
          name: c.name,
          institution: c.institution || "",
          term: c.term || "",
          logoSymbol: c.logoSymbol || "📚",
          description: c.description
        }));
      } catch {
        list = [];
      }
    }
    return list;
  }, []);

  const loadCourses = useCallback(async () => {
    setLoading(true);
    const list = await fetchCoursesList();
    setCourses(list);
    setActiveId(getActiveCourseId() || "sample1001");
    setLoading(false);
  }, [fetchCoursesList]);

  useEffect(() => {
    let cancelled = false;
    fetchCoursesList().then((list) => {
      if (cancelled) return;
      setCourses(list);
      setActiveId(getActiveCourseId() || "sample1001");
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [fetchCoursesList]);

  const handleSelectCourse = (course: CourseMeta) => {
    setActiveCourseId(course.id);
    setActiveId(course.id);
    window.dispatchEvent(new CustomEvent("cn_active_course_change", { detail: { courseId: course.id } }));
    router.push(`/?course=${encodeURIComponent(course.id)}`);
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedCode = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    const trimmedName = name.trim();
    if (!trimmedCode || !trimmedName) {
      setStatusMessage({ type: "error", text: "Course code and title are required." });
      return;
    }

    setCreating(true);
    setStatusMessage(null);
    const courseId = trimmedCode.toLowerCase();

    const payload: CourseMeta = {
      id: courseId,
      code: trimmedCode,
      name: trimmedName,
      term: term.trim() || undefined,
      institution: institution.trim() || undefined,
      echo360SectionUrl: echo360SectionUrl.trim() || undefined,
      logoSymbol: "📚",
      description: `${trimmedName} (${trimmedCode})`
    };

    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create course");
      }

      const created: CourseMeta = data.course || payload;
      setActiveCourseId(created.id);
      setActiveId(created.id);
      setShowCreateForm(false);
      setCode("");
      setName("");
      setEcho360SectionUrl("");
      setStatusMessage({ type: "success", text: `Created course folder for ${created.code}.` });
      window.dispatchEvent(new CustomEvent("cn_active_course_change", { detail: { courseId: created.id } }));
      await loadCourses();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create course";
      setStatusMessage({ type: "error", text: msg });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCourse = async (course: CourseMeta) => {
    setDeletingId(course.id);
    setStatusMessage(null);
    const res = await deleteCourse(course.id);
    if (!res.success) {
      setStatusMessage({ type: "error", text: res.error || "Failed to delete course" });
      setDeletingId(null);
      return;
    }

    setConfirmDeleteId(null);
    setDeletingId(null);
    setStatusMessage({ type: "success", text: `Deleted course ${course.code}.` });
    window.dispatchEvent(new CustomEvent("cn_active_course_change", { detail: { courseId: getActiveCourseId() || "sample1001" } }));
    await loadCourses();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold border border-indigo-500/20 mb-2">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Courses</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Course Workspaces
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Select, create, or delete local course directories under <code className="text-zinc-300">courses/</code> for lecture ingestion.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateForm((v) => !v)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-indigo-600/25 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{showCreateForm ? "Close Form" : "New Course"}</span>
        </button>
      </div>

      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-medium flex items-center gap-2 ${
            statusMessage.type === "success"
              ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-200"
              : "bg-rose-950/60 border-rose-500/40 text-rose-200"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {showCreateForm && (
        <form
          onSubmit={handleCreateCourse}
          className="p-6 rounded-2xl bg-zinc-900 border border-indigo-500/40 space-y-4 shadow-2xl"
        >
          <div className="text-sm font-bold text-zinc-100">Create Local Course Folder</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300">Course Code *</label>
              <input
                type="text"
                required
                placeholder="e.g. MATH3701"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300">Course Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Higher Differential Geometry"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300">Term</label>
              <input
                type="text"
                placeholder="Term 1, 2026"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300">Institution</label>
              <input
                type="text"
                placeholder="UNSW"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-zinc-400" />
                <span>Echo360 Section URL (Optional)</span>
              </label>
              <input
                type="url"
                placeholder="https://echo360.net.au/section/<uuid>/home"
                value={echo360SectionUrl}
                onChange={(e) => setEcho360SectionUrl(e.target.value)}
                className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
            >
              {creating ? "Creating..." : "Create Course"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="p-12 text-center text-sm text-zinc-500">Loading courses...</div>
      ) : courses.length === 0 ? (
        <div className="p-12 rounded-2xl border border-zinc-800 bg-zinc-900/40 text-center space-y-2">
          <FolderOpen className="w-8 h-8 text-zinc-500 mx-auto" />
          <p className="text-sm text-zinc-300 font-semibold">No courses found</p>
          <p className="text-xs text-zinc-500">Create a course folder above to begin lecture ingestion.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map((course) => {
            const isActive = course.id.toLowerCase() === activeId.toLowerCase();
            const isProtected = course.id.toLowerCase() === "sample1001" || course.code.toUpperCase() === "SAMPLE1001";
            const confirmingDelete = confirmDeleteId === course.id;

            return (
              <div
                key={course.id}
                className={`p-5 rounded-2xl border transition flex flex-col justify-between gap-4 ${
                  isActive
                    ? "bg-indigo-950/25 border-indigo-500/60 shadow-lg shadow-indigo-950/20"
                    : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-mono text-sm shrink-0">
                        {course.logoSymbol || "📚"}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black text-white font-mono">
                            {course.code}
                          </span>
                          {isActive && (
                            <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-300 font-medium truncate">{course.name}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
                    {course.institution && <span>{course.institution}</span>}
                    {course.institution && course.term && <span>•</span>}
                    {course.term && <span>{course.term}</span>}
                    {course.echo360SectionUrl && (
                      <>
                        <span>•</span>
                        <span className="text-cyan-400">Echo360 linked</span>
                      </>
                    )}
                  </div>
                </div>

                {confirmingDelete ? (
                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 flex items-center justify-between gap-2 text-xs">
                    <span className="text-rose-200 font-medium">
                      Delete <code className="font-mono">{course.code}</code> from disk?
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={deletingId === course.id}
                        onClick={() => handleDeleteCourse(course)}
                        className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold cursor-pointer"
                      >
                        {deletingId === course.id ? "Deleting..." : "Confirm"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-800/80">
                    <button
                      type="button"
                      onClick={() => handleSelectCourse(course)}
                      className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <span>{isActive ? "Open Ingestion" : "Switch & Ingest"}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    {!isProtected && (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(course.id)}
                        className="p-2 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 transition cursor-pointer"
                        title={`Delete ${course.code}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
