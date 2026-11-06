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
  Sparkles
} from "lucide-react";
import { QuestionMeta } from "@/lib/types";

export function Navbar() {
  const pathname = usePathname();
  const [stats, setStats] = useState<{ total: number; mastered: number; review: number }>({
    total: 0,
    mastered: 0,
    review: 0
  });

  useEffect(() => {
    fetch("/api/questions")
      .then((res) => res.json())
      .then((data: QuestionMeta[]) => {
        const total = data.length;
        const mastered = data.filter((q) => q.status === "Mastered").length;
        const review = data.filter((q) => q.status === "Needs Review").length;
        setStats({ total, mastered, review });
      })
      .catch((err) => console.error("Error fetching question stats:", err));
  }, [pathname]);

  const navLinks = [
    { href: "/", label: "Dashboard", icon: Compass },
    { href: "/questions", label: "Questions (131)", icon: ListOrdered },
    { href: "/concepts", label: "Concepts Hub", icon: BookOpen },
    { href: "/exam", label: "Timed Exam", icon: Timer },
    { href: "/revision", label: "Revision Sheet", icon: FileDown },
    { href: "/import", label: "PDF Snipper", icon: Scissors }
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-bold font-mono text-sm shadow-md group-hover:scale-105 transition">
            ∫dz
          </div>
          <div>
            <div className="text-sm font-black tracking-tight text-zinc-100 flex items-center gap-1.5">
              <span>MATH2621</span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800">
                Hub
              </span>
            </div>
            <div className="text-[10px] text-zinc-400 font-medium">Higher Complex Analysis</div>
          </div>
        </Link>

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

          <Link
            href="/questions"
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Practice</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
