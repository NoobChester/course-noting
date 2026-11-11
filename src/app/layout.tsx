import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { BackgroundIngestProvider } from "@/context/BackgroundIngestContext";
import { SmartResumeBanner } from "@/components/layout/SmartResumeBanner";
import { FloatingIngestDock } from "@/components/layout/FloatingIngestDock";

export const metadata: Metadata = {
  title: "Course Noting — Blank Slate Study Hub",
  description: "Interactive problem solver, concept library, lecture insights overlay, and revision cheat sheets.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100">
        <BackgroundIngestProvider>
          <Suspense fallback={<div className="h-16 border-b border-zinc-800 bg-zinc-950" />}>
            <Navbar />
          </Suspense>
          <SmartResumeBanner />
          <main className="flex-1">{children}</main>
          <FloatingIngestDock />
        </BackgroundIngestProvider>
      </body>
    </html>
  );
}
