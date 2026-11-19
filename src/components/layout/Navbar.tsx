"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Download,
  ChevronDown,
  GraduationCap,
  Plus,
  Menu,
  X
} from "lucide-react";
import { CourseMeta } from "@/lib/types";
import { getCourseCatalog, setActiveCourseId } from "@/lib/pack-loader";

const DEFAULT_COURSE: CourseMeta = {
  id: "sample1001",
  code: "SAMPLE1001",
  name: "Linear Algebra & Multivariable Calculus",
  logoSymbol: "λ"
};

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [courses, setCourses] = useState<CourseMeta[]>([]);
  const [activeCourse, setActiveCourse] = useState<CourseMeta>(DEFAULT_COURSE);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const loadCourses = useCallback(async (preferredCourseId?: string) => {
    const queryCourse = searchParams.get("course");
    const savedCourseId =
      preferredCourseId ||
      queryCourse ||
      (typeof window !== "undefined" ? localStorage.getItem("math_active_course") : null) ||
      "sample1001";

    let list: CourseMeta[] = [];
    try {
      const res = await fetch("/api/courses", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as CourseMeta[];
        if (Array.isArray(data) && data.length > 0) {
          list = data;
        }
      }
    } catch {
      // Fallback to static catalog
    }

    if (list.length === 0) {
      try {
        const catalog = await getCourseCatalog();
        list = catalog.map((c) => ({
          id: c.id,
          code: c.code,
          name: c.name,
          logoSymbol: c.logoSymbol || "📚",
          description: c.description
        }));
      } catch {
        list = [DEFAULT_COURSE];
      }
    }

    setCourses(list);
    const matched =
      list.find((c) => c.id.toLowerCase() === savedCourseId.toLowerCase()) ||
      list.find((c) => c.code.toLowerCase() === savedCourseId.toLowerCase()) ||
      list[0];
    if (matched) {
      setActiveCourse(matched);
      setActiveCourseId(matched.id);
    }
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) {
        void loadCourses();
      }
    });
    return () => {
      cancelled = true;
    };
  }, [loadCourses, pathname]);

  useEffect(() => {
    const handleCourseEvent = (e: Event) => {
      const detail = (e as CustomEvent<{ courseId?: string }>).detail;
      void loadCourses(detail?.courseId);
    };
    window.addEventListener("cn_active_course_change", handleCourseEvent);
    return () => window.removeEventListener("cn_active_course_change", handleCourseEvent);
  }, [loadCourses]);

  const switchCourse = (c: CourseMeta) => {
    setActiveCourseId(c.id);
    setActiveCourse(c);
    setIsDropdownOpen(false);
    setMobileMenuOpen(false);
    window.dispatchEvent(new CustomEvent("cn_active_course_change", { detail: { courseId: c.id } }));
    if (pathname === "/") {
      router.replace(`/?course=${encodeURIComponent(c.id)}`);
    } else {
      router.push(`/?course=${encodeURIComponent(c.id)}`);
    }
  };

  const navLinks = [
    { href: "/", label: "Ingestion", icon: Download },
    { href: "/courses", label: "Courses", icon: GraduationCap }
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Course Switcher Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-zinc-900 transition text-left cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white flex items-center justify-center font-bold font-mono text-xs shadow-md group-hover:scale-105 transition">
                {activeCourse.logoSymbol || "📚"}
              </div>
              <div>
                <div className="text-sm font-black tracking-tight text-zinc-100 flex items-center gap-1.5">
                  <span>{activeCourse.code}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-200 transition" />
                </div>
                <div className="text-[10px] text-zinc-400 font-medium line-clamp-1 max-w-[160px] sm:max-w-xs">
                  {activeCourse.name}
                </div>
              </div>
            </button>

            {isDropdownOpen && (
              <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl p-2 z-50 animate-in fade-in duration-150">
                <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                  Switch Course
                </div>
                <div className="space-y-1 max-h-72 overflow-y-auto">
                  {courses.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => switchCourse(c)}
                      className={`w-full text-left p-2.5 rounded-xl flex items-center gap-2.5 text-xs transition cursor-pointer ${
                        c.id.toLowerCase() === activeCourse.id.toLowerCase()
                          ? "bg-indigo-600 text-white font-bold"
                          : "text-zinc-300 hover:bg-zinc-800"
                      }`}
                    >
                      <span className="font-mono">{c.logoSymbol || "📚"}</span>
                      <div className="min-w-0">
                        <div className="font-bold">{c.code}</div>
                        <div className="text-[10px] opacity-80 truncate">{c.name}</div>
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

          {/* Desktop Navigation */}
          <nav className="hidden sm:flex items-center gap-1.5">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
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

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-indigo-400" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 sm:hidden animate-in fade-in duration-200">
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div className="fixed inset-y-0 right-0 w-72 max-w-[85vw] bg-zinc-950 border-l border-zinc-800 shadow-2xl flex flex-col p-5 space-y-5 z-10">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="text-sm font-black text-white">{activeCourse.code}</div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                      isActive ? "bg-indigo-600 text-white" : "text-zinc-300 hover:text-white hover:bg-zinc-900"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
