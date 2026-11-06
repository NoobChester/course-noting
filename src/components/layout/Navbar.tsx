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
  Save
} from "lucide-react";
import { QuestionMeta, CourseMeta } from "@/lib/types";
import { SaveLoadModal } from "./SaveLoadModal";

export function Navbar() {
  const pathname = usePathname();
  const [courses, setCourses] = useState<CourseMeta[]>([]);
  const [activeCourse, setActiveCourse] = useState<CourseMeta>({
    id: "math2621",
    code: "MATH2621",
    name: "Higher Complex Analysis",
    logoSymbol: "∫dz"
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  const [stats, setStats] = useState<{ total: number; mastered: number; review: number }>({
    total: 0,
    mastered: 0,
    review: 0
  });

  useEffect(() => {
    const savedCourseId = localStorage.getItem("math_active_course") || "math2621";

    fetch("/api/courses")
      .then((res) => res.json())
      .then((courseList: CourseMeta[]) => {
        setCourses(courseList);
        const current = courseList.find((c) => c.id === savedCourseId) || courseList[0];
        if (current) setActiveCourse(current);
      })
      .catch((err) => console.error("Error loading courses:", err));
  }, []);

  useEffect(() => {
    const savedCourseId = localStorage.getItem("math_active_course") || "math2621";

    fetch(`/api/questions?course=${savedCourseId}`)
      .then((res) => res.json())
      .then((data: QuestionMeta[]) => {
        const total = data.length;
        const mastered = data.filter((q) => q.status === "Mastered").length;
        const review = data.filter((q) => q.status === "Needs Review").length;
        setStats({ total, mastered, review });
      })
      .catch((err) => console.error("Error fetching stats:", err));
  }, [pathname, activeCourse]);

  const switchCourse = (c: CourseMeta) => {
    localStorage.setItem("math_active_course", c.id);
    setActiveCourse(c);
    setIsDropdownOpen(false);
    window.location.reload();
  };

  const navLinks = [
    { href: "/", label: "Dashboard", icon: Compass },
    { href: "/questions", label: `Questions (${stats.total})`, icon: ListOrdered },
    { href: "/concepts", label: "Concepts Hub", icon: BookOpen },
    { href: "/exam", label: "Timed Exam", icon: Timer },
    { href: "/revision", label: "Revision Sheet", icon: FileDown },
    { href: "/import", label: "PDF Snipper", icon: Scissors },
    { href: "/courses", label: "Courses", icon: GraduationCap }
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand with Course Switcher Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-zinc-900 transition text-left cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-bold font-mono text-xs shadow-md group-hover:scale-105 transition">
              {activeCourse.logoSymbol || "📚"}
            </div>
            <div>
              <div className="text-sm font-black tracking-tight text-zinc-100 flex items-center gap-1.5">
                <span>{activeCourse.code}</span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-200 transition" />
              </div>
              <div className="text-[10px] text-zinc-400 font-medium line-clamp-1 max-w-[140px] sm:max-w-none">
                {activeCourse.name}
              </div>
            </div>
          </button>

          {/* Switcher Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl p-2 z-50 animate-in fade-in duration-150">
              <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                Switch Course Hub
              </div>
              <div className="space-y-1">
                {courses.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => switchCourse(c)}
                    className={`w-full text-left p-2.5 rounded-xl flex items-center gap-2.5 text-xs transition cursor-pointer ${
                      c.id === activeCourse.id
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
                ))}
              </div>

              <div className="pt-2 mt-2 border-t border-zinc-800">
                <Link
                  href="/courses"
                  onClick={() => setIsDropdownOpen(false)}
                  className="w-full p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Manage / Add Courses</span>
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

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
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

          <Link
            href="/questions"
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Practice</span>
          </Link>
        </div>
      </div>

      {/* Save & Load Progress Modal */}
      <SaveLoadModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
      />
    </header>
  );
}
