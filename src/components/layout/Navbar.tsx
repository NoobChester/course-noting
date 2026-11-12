"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  ListOrdered,
  BookOpen,
  Timer,
  FileDown,
  Scissors,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  GraduationCap,
  Plus,
  Save,
  Settings,
  Flame,
  Mic,
  Layers,
  Menu,
  X
} from "lucide-react";
import { QuestionMeta, CourseMeta } from "@/lib/types";
import { isDueToday } from "@/lib/sm2-service";
import { isLayer2Enabled, setLayer2Enabled, isLocalStudio, getCourseCatalog, getBasePath, fetchBasePack } from "@/lib/pack-loader";
import { SaveLoadModal } from "./SaveLoadModal";
import { SettingsModal } from "./SettingsModal";

export function Navbar() {
  const pathname = usePathname();
  const [courses, setCourses] = useState<CourseMeta[]>([]);
  const [activeCourse, setActiveCourse] = useState<CourseMeta | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [layer2Active, setLayer2State] = useState(true);
  const [isLocal, setIsLocal] = useState(false);

  const [stats, setStats] = useState<{ total: number; mastered: number; review: number; dueToday: number }>({
    total: 0,
    mastered: 0,
    review: 0,
    dueToday: 0
  });

  useEffect(() => {
    setLayer2State(isLayer2Enabled());
    setIsLocal(isLocalStudio());
  }, []);

  const toggleLayer2 = () => {
    const nextState = !layer2Active;
    setLayer2State(nextState);
    setLayer2Enabled(nextState);
    window.dispatchEvent(new CustomEvent("cn_layer2_toggle", { detail: { enabled: nextState } }));
  };

  useEffect(() => {
    const savedCourseId = localStorage.getItem("math_active_course") || "";

    getCourseCatalog().then((catalog) => {
      if (catalog && catalog.length > 0) {
        const courseList: CourseMeta[] = catalog.map((c) => ({
          id: c.id,
          code: c.code,
          name: c.name,
          logoSymbol: c.logoSymbol || "📚",
          description: c.description
        }));
        setCourses(courseList);
        const current = savedCourseId ? (courseList.find((c) => c.id.toLowerCase() === savedCourseId.toLowerCase()) || null) : null;
        setActiveCourse(current);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const savedCourseId = localStorage.getItem("math_active_course");
    if (!savedCourseId) {
      setStats({ total: 0, mastered: 0, review: 0, dueToday: 0 });
      return;
    }

    fetch(`/api/questions?course=${savedCourseId}`)
      .then((res) => {
        if (!res.ok) throw new Error("API not available");
        return res.json();
      })
      .then((data: QuestionMeta[]) => {
        const total = data.length;
        const mastered = data.filter((q) => q.status === "Mastered").length;
        const review = data.filter((q) => q.status === "Needs Review").length;
        const dueToday = data.filter((q) => isDueToday(q.sm2?.dueDate)).length;
        setStats({ total, mastered, review, dueToday });
      })
      .catch(async () => {
        // Fallback to base pack (loads from localStorage for custom courses or static JSON for pre-bundled)
        const base = await fetchBasePack(savedCourseId);
        if (base) {
          const qs = base.questions || [];
          setStats({
            total: qs.length,
            mastered: qs.filter((q: any) => q.status === "Mastered").length,
            review: qs.filter((q: any) => q.status === "Needs Review").length,
            dueToday: qs.filter((q: any) => isDueToday(q.sm2?.dueDate)).length
          });
        }
      });
  }, [pathname, activeCourse]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const switchCourse = (c: CourseMeta) => {
    localStorage.setItem("math_active_course", c.id);
    setActiveCourse(c);
    setIsDropdownOpen(false);
    window.location.reload();
  };

  const navLinks = [
    { href: "/", label: "Dashboard", icon: Compass },
    { href: "/guide", label: "Guide & Tutorial", icon: Sparkles },
    { href: "/questions", label: `Questions (${stats.total})`, icon: ListOrdered },
    {
      href: "/daily-review",
      label: stats.dueToday > 0 ? `Daily (${stats.dueToday})` : "Daily Review",
      icon: Flame,
      badge: stats.dueToday > 0 ? stats.dueToday : undefined
    },
    { href: "/concepts", label: "Concepts Hub", icon: BookOpen },
    { href: "/lectures", label: "Lectures", icon: Mic },
    { href: "/exam", label: "Timed Exam", icon: Timer },
    { href: "/revision", label: "Revision Sheet", icon: FileDown },
    { href: "/import", label: "PDF Snipper", icon: Scissors, localOnly: true },
    { href: "/courses", label: "Courses", icon: GraduationCap }
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand with Course Switcher Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-zinc-900 transition text-left cursor-pointer group"
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold font-mono text-xs shadow-md group-hover:scale-105 transition ${
              activeCourse ? "bg-gradient-to-tr from-indigo-600 to-violet-500 text-white" : "bg-zinc-800 text-zinc-400 border border-zinc-700"
            }`}>
              {activeCourse?.logoSymbol || "📚"}
            </div>
            <div>
              <div className="text-sm font-black tracking-tight text-zinc-100 flex items-center gap-1.5">
                <span>{activeCourse ? activeCourse.code : "Select Course"}</span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-200 transition" />
              </div>
              <div className="text-[10px] text-zinc-400 font-medium line-clamp-1 max-w-[140px] sm:max-w-none">
                {activeCourse ? activeCourse.name : "No active course"}
              </div>
            </div>
          </button>

          {/* Switcher Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl p-2 z-50 animate-in fade-in duration-150">
              <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                Active Course Hub
              </div>
              <div className="space-y-1">
                {courses.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-zinc-500 italic">No courses added yet</div>
                ) : (
                  courses.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => switchCourse(c)}
                      className={`w-full text-left p-2.5 rounded-xl flex items-center gap-2.5 text-xs transition cursor-pointer ${
                        activeCourse && c.id === activeCourse.id
                          ? "bg-indigo-600 text-white font-bold"
                          : "text-zinc-300 hover:bg-zinc-800"
                      }`}
                    >
                      <span className="font-mono">{c.logoSymbol || "📚"}</span>
                      <div>
                        <div className="font-bold">{c.code}</div>
                        <div className="text-[10px] opacity-80 line-clamp-1">{c.name}</div>
                      </div>
                    </button>
                  ))
                )}
              </div>

              <div className="pt-2 mt-2 border-t border-zinc-800 space-y-1">
                <Link
                  href="/lectures?addCourse=true"
                  onClick={() => setIsDropdownOpen(false)}
                  className="w-full p-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add New Course (Auto-Discover)</span>
                </Link>
                <Link
                  href="/courses"
                  onClick={() => setIsDropdownOpen(false)}
                  className="w-full p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <span>Manage All Courses</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const isDimmed = (item as any).localOnly && !isLocal;

            return (
              <Link
                key={item.href}
                href={item.href}
                title={isDimmed ? "Local Studio Only: In-app PDF snipping requires local Node environment" : undefined}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-sm"
                    : isDimmed
                    ? "text-zinc-500 opacity-60 hover:opacity-100 hover:bg-zinc-900"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {isDimmed && (
                  <span
                    title="Local Studio Only: Ingesting local PDF files and saving to filesystem requires running locally (localhost:3000)"
                    className="text-[9px] px-1.5 py-0.5 rounded bg-amber-950/70 text-amber-300 font-mono font-medium border border-amber-800/50"
                  >
                    Local Studio
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Quick Progress Badge */}
        <div className="flex items-center gap-3">
          {stats.total > 0 && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-zinc-400 font-medium">Mastered:</span>
              <span className="font-bold text-zinc-200">
                {stats.mastered}/{stats.total}
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-emerald-400 font-mono font-semibold">
                {Math.round((stats.mastered / stats.total) * 100)}%
              </span>
            </div>
          )}

          {/* Layer 2 (Lecture Overlay) Toggle */}
          <button
            type="button"
            onClick={toggleLayer2}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer shadow-sm ${
              layer2Active
                ? "bg-violet-950/70 border-violet-500/50 text-violet-300 hover:bg-violet-900/80"
                : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-850"
            }`}
            title={
              layer2Active
                ? "Lecture Layer (Layer 2) ACTIVE: Showing lecturer intuitions & exam warnings"
                : "Lecture Layer (Layer 2) MUTED: Showing textbook theory only"
            }
          >
            <Layers className={`w-3.5 h-3.5 ${layer2Active ? "text-violet-400" : "text-zinc-500"}`} />
            <span className="hidden md:inline">Lectures {layer2Active ? "ON" : "OFF"}</span>
          </button>

          {/* Save / Load Progress Button */}
          <button
            type="button"
            onClick={() => setIsSaveModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-200 text-xs font-semibold transition cursor-pointer shadow-sm"
            title="Save & Load User Progress (Copy-pasteable string or .json)"
          >
            <Save className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Save / Load</span>
          </button>

          {/* AI Settings Button */}
          <button
            type="button"
            onClick={() => setIsSettingsModalOpen(true)}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-sm"
            title="AI Proof Reviewer & API Key Settings"
          >
            <Settings className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Settings</span>
          </button>

          <Link
            href="/questions"
            className="hidden sm:flex px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-sm items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Practice</span>
          </Link>

          {/* Mobile Hamburger Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-indigo-400" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </header>

      {/* Mobile Slide-Over Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Slide-over Sheet */}
          <div className="fixed inset-y-0 right-0 w-80 max-w-[85vw] bg-zinc-950 border-l border-zinc-800 shadow-2xl flex flex-col justify-between p-5 overflow-y-auto z-10 animate-in slide-in-from-right duration-200">
            <div className="space-y-5">
              {/* Top Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold font-mono text-xs shadow-md ${
                    activeCourse ? "bg-gradient-to-tr from-indigo-600 to-violet-500 text-white" : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                  }`}>
                    {activeCourse?.logoSymbol || "📚"}
                  </div>
                  <div>
                    <div className="text-sm font-black text-white flex items-center gap-1.5">
                      {activeCourse ? activeCourse.code : "Select Course"}
                    </div>
                    <div className="text-[10px] text-zinc-400 truncate max-w-[140px]">
                      {activeCourse ? activeCourse.name : "No active course"}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mastered Progress Bar on Mobile */}
              {stats.total > 0 && (
                <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400 font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Mastery
                    </span>
                    <span className="font-bold text-zinc-200">
                      {stats.mastered}/{stats.total} ({Math.round((stats.mastered / stats.total) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${Math.round((stats.mastered / stats.total) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Navigation Links */}
              <div className="space-y-1">
                <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider px-2 pb-1">
                  Navigation
                </div>
                {navLinks.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                  const isDimmed = (item as any).localOnly && !isLocal;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                        isActive
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/50"
                          : isDimmed
                          ? "text-zinc-500 opacity-60 hover:opacity-100 hover:bg-zinc-900"
                          : "text-zinc-300 hover:text-white hover:bg-zinc-900"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge ? (
                        <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold">
                          {item.badge}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Drawer Bottom Controls */}
            <div className="pt-4 border-t border-zinc-800 space-y-2 mt-4">
              {/* Layer 2 Toggle */}
              <button
                type="button"
                onClick={toggleLayer2}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition ${
                  layer2Active
                    ? "bg-violet-950/70 border-violet-500/50 text-violet-300"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Layers className={`w-4 h-4 ${layer2Active ? "text-violet-400" : "text-zinc-500"}`} />
                  <span>Lectures (Layer 2)</span>
                </div>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 font-bold">
                  {layer2Active ? "ON" : "OFF"}
                </span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                {/* Save / Load */}
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setIsSaveModalOpen(true);
                  }}
                  className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-medium transition cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Save/Load</span>
                </button>

                {/* AI Settings */}
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setIsSettingsModalOpen(true);
                  }}
                  className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-medium transition cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Settings</span>
                </button>
              </div>

              <Link
                href="/questions"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-xs shadow-md shadow-indigo-950/40"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Practice Questions</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Save & Load Progress Modal */}
      <SaveLoadModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
      />

      {/* AI Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </>
  );
}
