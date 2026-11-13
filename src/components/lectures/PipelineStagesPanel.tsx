"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  FileText,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Volume2,
  Sparkles,
  Play,
  RotateCcw,
  Library,
  Search,
  Key,
  Layers,
  Clock,
  ChevronRight,
  FolderSync
} from "lucide-react";
import {
  useBackgroundIngest,
  IngestLectureItem
} from "@/context/BackgroundIngestContext";
import {
  loadClientAiSettings,
  normalizeBatchAiPayload
} from "@/lib/ai-settings";

interface CourseManifestItem {
  id: string;
  title: string;
  category: string;
  categoryName: string;
  week: number | "all";
  relativePath: string;
  extractedChars?: number;
  sizeBytes?: number;
}

interface CoverageInfo {
  totalCourseItems: number;
  globalChars: number;
  byWeek: Record<number, number>;
  insufficientWeeks: number[];
}

interface PipelineStagesPanelProps {
  courseId: string;
  isLocal: boolean;
  discoveredLectures: IngestLectureItem[];
  setDiscoveredLectures: React.Dispatch<React.SetStateAction<IngestLectureItem[]>>;
  sectionUrl: string;
  setSectionUrl: (url: string) => void;
  echoSessionStatus: {
    hasSession: boolean;
    courseCode?: string | null;
    sectionUrl?: string | null;
    userEmail?: string | null;
  } | null;
  discoveringSection: boolean;
  discoveryError: string | null;
  onDiscoverLectures: (overrideInput?: string) => Promise<void>;
  onOpenEchoSessionSetup: () => void;
  onOpenSettings: () => void;
  onOpenNotebookTab: () => void;
  onRefreshCourseData: () => void;
  settingsOpen?: boolean;
}

export function PipelineStagesPanel({
  courseId,
  isLocal,
  discoveredLectures,
  setDiscoveredLectures,
  sectionUrl,
  setSectionUrl,
  echoSessionStatus,
  discoveringSection,
  discoveryError,
  onDiscoverLectures,
  onOpenEchoSessionSetup,
  onOpenSettings,
  onOpenNotebookTab,
  onRefreshCourseData,
  settingsOpen
}: PipelineStagesPanelProps) {
  const {
    session,
    isRunning,
    startBatchDownload,
    startDistillationQueue,
    retryFailedItems,
    subscribeToNoteUpdates
  } = useBackgroundIngest();

  // Stage 1: Course PDFs & Extraction state
  const [manifestItems, setManifestItems] = useState<CourseManifestItem[]>([]);
  const [coverage, setCoverage] = useState<CoverageInfo | null>(null);
  const [uploadCategory, setUploadCategory] = useState<string>("slides");
  const [uploadWeek, setUploadWeek] = useState<number | "all">("all");
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [reextracting, setReextracting] = useState(false);
  const [stage1Message, setStage1Message] = useState<string | null>(null);
  const [showAllFiles, setShowAllFiles] = useState(false);

  // Stage 2 & Disk sync state
  const [ffmpegAvailable, setFfmpegAvailable] = useState<boolean | null>(null);
  const [syncingDisk, setSyncingDisk] = useState(false);
  const [uploadingMediaLessonId, setUploadingMediaLessonId] = useState<string | null>(null);
  const [mediaUploadMessage, setMediaUploadMessage] = useState<string | null>(null);

  // Stage 3 options & AI preflight banner
  const [autoUpgradePdfOnly, setAutoUpgradePdfOnly] = useState(true);
  const [requireAi, setRequireAi] = useState(true);
  const [batchAiPreview, setBatchAiPreview] = useState<{
    provider: string;
    model: string;
    thinkingLevel?: string;
    hasApiKey: boolean;
  } | null>(null);

  // Stage 4 readiness summary
  const [notebookStats, setNotebookStats] = useState<{
    distilledCount: number;
    rawTranscriptsCount: number;
    extractedMaterialsCount: number;
    estimatedTokens: number;
  } | null>(null);

  const hydratedCourseRef = useRef<string | null>(null);
  const latestLecturesRef = useRef<IngestLectureItem[]>(discoveredLectures);
  latestLecturesRef.current = discoveredLectures;

  const refreshAiBanner = useCallback(() => {
    try {
      const settings = loadClientAiSettings(isLocal);
      const resolved = normalizeBatchAiPayload(settings) as any;
      setBatchAiPreview({
        provider: resolved.provider || settings.provider,
        model: resolved.model || "",
        thinkingLevel: resolved.thinkingLevel,
        hasApiKey: Boolean(resolved.apiKey || resolved.geminiFallbackKey)
      });
    } catch {
      // ignore on SSR
    }
  }, [isLocal]);

  useEffect(() => {
    refreshAiBanner();
  }, [refreshAiBanner, settingsOpen]);

  const syncStage1AndStage4 = useCallback(
    async (lessonsForWeeks: IngestLectureItem[] = latestLecturesRef.current) => {
      if (!courseId || !isLocal) return;
      try {
        const weeks = Array.from(
          new Set(lessonsForWeeks.map((l) => l.week || 1).concat([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]))
        ).sort((a, b) => a - b);

        const [contentRes, nbRes] = await Promise.all([
          fetch(`/api/courses/content?course=${encodeURIComponent(courseId)}&checkWeeks=${weeks.join(",")}`),
          fetch(`/api/courses/notebook?course=${encodeURIComponent(courseId)}`)
        ]);

        if (contentRes.ok) {
          const contentData = await contentRes.json();
          setManifestItems(contentData.manifest?.items || []);
          setCoverage(contentData.coverage || null);
        }

        if (nbRes.ok) {
          const nbData = await nbRes.json();
          if (nbData.stats) {
            setNotebookStats(nbData.stats);
          }
        }
      } catch {
        // non-fatal
      }
    },
    [courseId, isLocal]
  );

  const syncDiskStatus = useCallback(
    async (targetLessons?: IngestLectureItem[]) => {
      if (!courseId || !isLocal) return;
      const lessonsToCheck = targetLessons ?? latestLecturesRef.current;
      setSyncingDisk(true);
      try {
        await syncStage1AndStage4(lessonsToCheck);

        const res = await fetch("/api/lectures/echo360", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "pipeline-status",
            courseId,
            lessons: lessonsToCheck
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (typeof data.ffmpegAvailable === "boolean") {
            setFfmpegAvailable(data.ffmpegAvailable);
          }
          if (Array.isArray(data.lectures) && data.lectures.length > 0) {
            const byLessonId = new Map<string, any>(
              data.lectures.map((l: any) => [l.lessonId, l])
            );
            setDiscoveredLectures((prev) =>
              prev.map((l) => {
                const disk = byLessonId.get(l.lessonId);
                if (!disk) return l;
                const keepActive =
                  l.status === "pulling" || l.status === "distilling";
                return {
                  ...l,
                  ...disk,
                  status: keepActive
                    ? l.status
                    : l.status === "error" && !disk.hasTranscript && !disk.audioDownloaded
                    ? "error"
                    : disk.status,
                  error:
                    disk.hasTranscript || disk.audioDownloaded
                      ? disk.status === "done"
                        ? undefined
                        : l.error
                      : l.error,
                  allowPdfOnly: l.allowPdfOnly,
                  selected: l.selected
                };
              })
            );
          }
        }
      } catch {
        // ignore transient errors
      } finally {
        setSyncingDisk(false);
      }
    },
    [courseId, isLocal, setDiscoveredLectures, syncStage1AndStage4]
  );

  // Hydrate persisted queue items from localStorage on course change & immediately sync with disk
  useEffect(() => {
    if (!courseId) return;
    hydratedCourseRef.current = courseId;

    let initialLessons: IngestLectureItem[] = latestLecturesRef.current;
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(`cn_discovered_lectures_${courseId.toLowerCase()}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0 && latestLecturesRef.current.length === 0) {
            initialLessons = parsed;
            setDiscoveredLectures(parsed);
          }
        }
      } catch {}
    }

    syncDiskStatus(initialLessons);
  }, [courseId, setDiscoveredLectures, syncDiskStatus]);

  // Persist discoveredLectures to localStorage whenever updated for the active course
  useEffect(() => {
    if (!courseId || hydratedCourseRef.current !== courseId) return;
    if (typeof window === "undefined" || discoveredLectures.length === 0) return;
    try {
      localStorage.setItem(
        `cn_discovered_lectures_${courseId.toLowerCase()}`,
        JSON.stringify(discoveredLectures)
      );
    } catch {}
  }, [courseId, discoveredLectures]);

  // Re-sync Stage 1-4 stats whenever a background note finishes
  useEffect(() => {
    const unsub = subscribeToNoteUpdates(() => {
      syncDiskStatus();
    });
    return unsub;
  }, [subscribeToNoteUpdates, syncDiskStatus]);

  // Stage 1: Upload course PDF / notes
  const handleUploadStage1Files = async (files: FileList | null) => {
    if (!files || files.length === 0 || !courseId) return;
    setUploadingPdf(true);
    setStage1Message(null);
    let uploaded = 0;

    try {
      const categoryLabel =
        uploadCategory === "problem_sheets"
          ? "Problem Sheet"
          : uploadCategory === "slides"
          ? "Lecture Slides"
          : uploadCategory === "course_notes"
          ? "Course Notes"
          : "Past Papers";

      for (let i = 0; i < files.length; i++) {
        const fd = new FormData();
        fd.append("courseId", courseId);
        fd.append("category", uploadCategory);
        fd.append("categoryName", categoryLabel);
        fd.append("week", String(uploadWeek));
        fd.append("file", files[i]);

        const res = await fetch("/api/courses/content", {
          method: "POST",
          body: fd
        });
        if (res.ok) uploaded++;
      }

      await syncStage1AndStage4();
      onRefreshCourseData();
      setStage1Message(`✓ Uploaded and extracted ${uploaded}/${files.length} file(s).`);
    } catch (err: any) {
      setStage1Message(`⚠️ Upload error: ${err.message || "Failed"}`);
    } finally {
      setUploadingPdf(false);
    }
  };

  // Stage 1: Re-extract all PDFs using unpdf
  const handleReextractAllPdfs = async () => {
    if (!courseId || !isLocal) return;
    setReextracting(true);
    setStage1Message(null);
    try {
      const res = await fetch("/api/courses/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Re-extraction failed");

      await syncStage1AndStage4();
      setStage1Message(
        `✓ Re-extracted ${data.updatedCount ?? data.totalCount ?? 0} document(s) cleanly.`
      );
    } catch (err: any) {
      setStage1Message(`⚠️ ${err.message || "PDF re-extraction failed"}`);
    } finally {
      setReextracting(false);
    }
  };

  // Stage 2: Manual per-lecture .m4a / .mp3 / .vtt / .srt / .txt upload
  const handleManualMediaUpload = async (
    item: IngestLectureItem,
    files: FileList | null
  ) => {
    if (!files || files.length === 0 || !courseId) return;
    setUploadingMediaLessonId(item.lessonId);
    setMediaUploadMessage(null);
    try {
      const fd = new FormData();
      fd.append("courseId", courseId);
      fd.append("mediaId", item.mediaId);
      fd.append("lessonId", item.lessonId);
      fd.append("file", files[0]);

      const res = await fetch("/api/lectures/echo360", {
        method: "POST",
        body: fd
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Manual upload failed");

      setDiscoveredLectures((prev) =>
        prev.map((l) =>
          l.lessonId === item.lessonId
            ? {
                ...l,
                status: l.status === "done" && !l.pdfOnly ? "done" : "media_ready",
                error: undefined,
                needsMedia: false,
                hasTranscript: data.kind === "transcript" ? true : l.hasTranscript,
                audioDownloaded: data.kind === "audio" ? true : l.audioDownloaded,
                transcriptCueCount: data.cueCount ?? l.transcriptCueCount,
                transcriptStatus: data.kind === "transcript" ? "ready" : l.transcriptStatus,
                progressStage:
                  data.kind === "audio"
                    ? `✓ Uploaded ${files[0].name}`
                    : `✓ Uploaded transcript (${data.cueCount || 0} cues)`
              }
            : l
        )
      );
      setMediaUploadMessage(`✓ Attached ${files[0].name} to ${item.title}.`);
      await syncDiskStatus();
    } catch (err: any) {
      setMediaUploadMessage(`⚠️ ${err.message || "Media upload failed"}`);
    } finally {
      setUploadingMediaLessonId(null);
    }
  };

  // Stage 2 batch actions
  const handlePullMissingMedia = async () => {
    if (!courseId) return;
    const queueList = discoveredLectures.map((l) => ({
      ...l,
      selected: !l.hasTranscript && !l.audioDownloaded
    }));
    const count = queueList.filter((l) => l.selected).length;
    if (count === 0) return;
    setDiscoveredLectures(queueList);
    await startBatchDownload(courseId, queueList, true);
  };

  const handlePullSingleMedia = async (item: IngestLectureItem) => {
    if (!courseId) return;
    const singleQueue = discoveredLectures.map((l) => ({
      ...l,
      selected: l.lessonId === item.lessonId,
      status: l.lessonId === item.lessonId ? ("queued" as const) : l.status,
      error: l.lessonId === item.lessonId ? undefined : l.error
    }));
    await startBatchDownload(courseId, singleQueue, true);
  };

  // Stage 3 batch & per-row distillation actions
  const isReadyForDistill = (l: IngestLectureItem) =>
    Boolean(l.hasTranscript || l.audioDownloaded || l.allowPdfOnly);

  const needsDistillation = (l: IngestLectureItem) =>
    l.status !== "done" || Boolean(autoUpgradePdfOnly && l.pdfOnly);

  const handleDistillReadyLectures = async () => {
    if (!courseId) return;
    refreshAiBanner();
    const aiPayload = normalizeBatchAiPayload(loadClientAiSettings(isLocal));
    const prepared = discoveredLectures.map((l) => {
      const canRun = isReadyForDistill(l) && needsDistillation(l);
      return {
        ...l,
        selected: canRun,
        status: canRun && l.status === "done" && l.pdfOnly ? ("media_ready" as const) : l.status,
        error: canRun ? undefined : l.error
      };
    });
    if (!prepared.some((l) => l.selected)) return;
    setDiscoveredLectures(prepared);
    await startDistillationQueue(courseId, prepared, requireAi, aiPayload, true);
  };

  const handleDistillSingleLecture = async (item: IngestLectureItem) => {
    if (!courseId) return;
    refreshAiBanner();
    const aiPayload = normalizeBatchAiPayload(loadClientAiSettings(isLocal));
    const singleQueue = discoveredLectures.map((l) =>
      l.lessonId === item.lessonId
        ? {
            ...l,
            selected: true,
            status: (l.hasTranscript || l.audioDownloaded ? "media_ready" : "queued") as IngestLectureItem["status"],
            error: undefined
          }
        : { ...l, selected: false }
    );
    await startDistillationQueue(courseId, singleQueue, requireAi, aiPayload, true);
  };

  const handleRetryStageFailed = async (mode: "download" | "distill") => {
    if (!courseId) return;
    const sessionFailed = session && session.courseId.toLowerCase() === courseId.toLowerCase() && session.lectures.some((l) => l.status === "error");
    if (sessionFailed) {
      await retryFailedItems();
      return;
    }
    const retryList = discoveredLectures.map((l) => ({
      ...l,
      selected: l.status === "error",
      status: l.status === "error" ? ("queued" as const) : l.status,
      error: l.status === "error" ? undefined : l.error
    }));
    if (!retryList.some((l) => l.selected)) return;
    if (mode === "download") {
      await startBatchDownload(courseId, retryList, true);
    } else {
      const aiPayload = normalizeBatchAiPayload(loadClientAiSettings(isLocal));
      await startDistillationQueue(courseId, retryList, requireAi, aiPayload, true);
    }
  };

  // Computed Stage metrics
  const completeTranscriptBackedCount = discoveredLectures.filter(
    (l) => l.status === "done" && !l.pdfOnly
  ).length;
  const pdfOnlyUpgradeCount = discoveredLectures.filter((l) => l.pdfOnly).length;
  const mediaReadyCount = discoveredLectures.filter(
    (l) => l.hasTranscript || l.audioDownloaded
  ).length;
  const missingMediaCount = discoveredLectures.filter(
    (l) => !l.hasTranscript && !l.audioDownloaded
  ).length;
  const failedLecturesCount = discoveredLectures.filter(
    (l) => l.status === "error"
  ).length;
  const readyToDistillCount = discoveredLectures.filter(
    (l) => isReadyForDistill(l) && needsDistillation(l)
  ).length;
  const zeroCharPdfs = manifestItems.filter((m) => (m.extractedChars || 0) === 0).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Pipeline Overview Header */}
      <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-violet-400" />
            <h2 className="text-base sm:text-lg font-black text-white">
              {courseId.toUpperCase()} — Resumable 4-Stage Pipeline
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Each stage writes directly to disk. If any recording fails, fix only that item and resume without restarting the batch.
          </p>
        </div>

        <button
          type="button"
          onClick={() => syncDiskStatus()}
          disabled={syncingDisk}
          className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-60 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 border border-zinc-700 transition cursor-pointer shrink-0"
        >
          <FolderSync className={`w-3.5 h-3.5 text-cyan-400 ${syncingDisk ? "animate-spin" : ""}`} />
          <span>{syncingDisk ? "Syncing Disk..." : "Refresh Disk State"}</span>
        </button>
      </div>

      {/* STAGE 1: Course PDFs & Extraction */}
      <section className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3.5">
          <div className="flex items-center gap-2.5">
            <span className="px-2 py-0.5 rounded-md bg-violet-500/15 border border-violet-500/30 text-violet-300 font-mono text-[11px] font-bold">
              STAGE 1
            </span>
            <div>
              <h3 className="text-sm font-bold text-white">
                Course PDFs &amp; Text Extraction
              </h3>
              <p className="text-[11px] text-zinc-400">
                Grounds Stage 3 distillation and Stage 4 Q&amp;A in your actual slides, notes, and problem sheets.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-300">
              {manifestItems.length} doc(s) • {((coverage?.globalChars || 0) / 1000).toFixed(1)}k chars
            </span>
            {zeroCharPdfs > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-300 text-[11px] font-semibold">
                {zeroCharPdfs} empty extraction(s)
              </span>
            )}
            <button
              type="button"
              onClick={handleReextractAllPdfs}
              disabled={reextracting || manifestItems.length === 0}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 border border-zinc-700 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${reextracting ? "animate-spin" : ""}`} />
              <span>{reextracting ? "Re-extracting..." : "Re-extract All PDFs"}</span>
            </button>
          </div>
        </div>

        {/* Upload bar + coverage pills */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
          <div className="lg:col-span-7 flex flex-wrap items-center gap-2 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800">
            <select
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-zinc-200"
            >
              <option value="slides">Lecture Slides</option>
              <option value="course_notes">Full Course Notes</option>
              <option value="problem_sheets">Problem Sheet</option>
              <option value="past_papers">Past Papers</option>
            </select>

            <select
              value={String(uploadWeek)}
              onChange={(e) =>
                setUploadWeek(e.target.value === "all" ? "all" : Number(e.target.value))
              }
              className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-zinc-200"
            >
              <option value="all">All Weeks</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((w) => (
                <option key={w} value={w}>
                  Week {w}
                </option>
              ))}
            </select>

            <label className="flex-1 min-w-[180px] flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/40 text-violet-200 text-xs font-semibold cursor-pointer transition">
              <Upload className="w-3.5 h-3.5" />
              <span>{uploadingPdf ? "Extracting PDF..." : "Upload Course PDFs / Notes"}</span>
              <input
                type="file"
                multiple
                accept=".pdf,.md,.txt,.tex"
                className="hidden"
                onChange={(e) => handleUploadStage1Files(e.target.files)}
                disabled={uploadingPdf}
              />
            </label>
          </div>

          <div className="lg:col-span-5 flex flex-wrap items-center gap-1.5">
            {coverage && coverage.insufficientWeeks.length > 0 ? (
              <div className="w-full p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-[11px] flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Low/missing extracted PDFs for Week(s){" "}
                  <strong>{coverage.insufficientWeeks.join(", ")}</strong>. Upload slides/notes above or click Re-extract.
                </span>
              </div>
            ) : manifestItems.length > 0 ? (
              <div className="w-full p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-200 text-[11px] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Course materials extracted and ready for Stage 3 grounding.</span>
              </div>
            ) : (
              <div className="w-full p-2.5 rounded-xl bg-zinc-950/50 border border-zinc-800 text-zinc-400 text-[11px]">
                No course PDFs uploaded yet for {courseId.toUpperCase()}.
              </div>
            )}
          </div>
        </div>

        {stage1Message && (
          <p className="text-xs text-cyan-300 bg-cyan-950/30 border border-cyan-500/30 px-3 py-2 rounded-xl">
            {stage1Message}
          </p>
        )}

        {manifestItems.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setShowAllFiles((v) => !v)}
              className="text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1 font-medium cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>
                {showAllFiles ? "Hide" : "Show"} extracted course documents ({manifestItems.length})
              </span>
            </button>
            {showAllFiles && (
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                {manifestItems.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-zinc-950/70 border border-zinc-800 text-xs"
                  >
                    <div className="truncate">
                      <p className="text-zinc-200 font-medium truncate">{m.title}</p>
                      <p className="text-[10px] text-zinc-500 font-mono">
                        {m.categoryName} • {m.week === "all" ? "All Weeks" : `W${m.week}`}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-md shrink-0 ${
                        (m.extractedChars || 0) > 200
                          ? "bg-emerald-950/60 text-emerald-300 border border-emerald-500/30"
                          : "bg-amber-950/60 text-amber-300 border border-amber-500/30"
                      }`}
                    >
                      {(m.extractedChars || 0).toLocaleString()} chars
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* STAGE 2: Echo360 Transcripts & Audio Pull */}
      <section className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3.5">
          <div className="flex items-center gap-2.5">
            <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-mono text-[11px] font-bold">
              STAGE 2
            </span>
            <div>
              <h3 className="text-sm font-bold text-white">
                Echo360 VTT Transcripts &amp; Audio Pull
              </h3>
              <p className="text-[11px] text-zinc-400">
                Resolves <code className="text-cyan-300">G_</code> lesson IDs, pulls free VTT captions first, checks{" "}
                <code className="text-cyan-300">ffmpeg</code>, and lets you drop per-lecture{" "}
                <code className="text-cyan-300">.m4a/.vtt</code> files manually.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {ffmpegAvailable === true ? (
              <span className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono">
                ffmpeg Ready (.m4a enabled)
              </span>
            ) : ffmpegAvailable === false ? (
              <span className="px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-300 text-[11px] font-semibold">
                ffmpeg Missing on PATH (VTT or manual .m4a drop)
              </span>
            ) : null}

            <button
              type="button"
              onClick={onOpenEchoSessionSetup}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                echoSessionStatus?.hasSession
                  ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300 hover:bg-emerald-950/70"
                  : "bg-zinc-800 border-zinc-700 text-amber-300 hover:bg-zinc-700"
              }`}
            >
              {echoSessionStatus?.hasSession
                ? `Echo360 Connected${echoSessionStatus.userEmail ? ` (${echoSessionStatus.userEmail})` : ""}`
                : "Connect Echo360 Session"}
            </button>
          </div>
        </div>

        {/* Discovery input & Stage 2 batch actions */}
        <div className="flex flex-col md:flex-row gap-2.5">
          <input
            type="text"
            value={sectionUrl}
            onChange={(e) => setSectionUrl(e.target.value)}
            placeholder="Course code (e.g. MATH3701) or Echo360 Section URL..."
            className="flex-1 px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500"
          />
          <button
            type="button"
            onClick={() => onDiscoverLectures(sectionUrl || echoSessionStatus?.sectionUrl || courseId)}
            disabled={discoveringSection}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 border border-zinc-700 transition cursor-pointer"
          >
            <Search className={`w-3.5 h-3.5 text-cyan-400 ${discoveringSection ? "animate-spin" : ""}`} />
            <span>{discoveringSection ? "Discovering..." : "Discover Echo360 Lectures"}</span>
          </button>

          {discoveredLectures.length > 0 && (
            <>
              <button
                type="button"
                onClick={handlePullMissingMedia}
                disabled={isRunning || missingMediaCount === 0}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Pull Missing Media ({missingMediaCount})</span>
              </button>

              {failedLecturesCount > 0 && (
                <button
                  type="button"
                  onClick={() => handleRetryStageFailed("download")}
                  disabled={isRunning}
                  className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry Failed ({failedLecturesCount})</span>
                </button>
              )}
            </>
          )}
        </div>

        {discoveryError && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs">
            {discoveryError}
          </div>
        )}

        {mediaUploadMessage && (
          <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-200 text-xs">
            {mediaUploadMessage}
          </div>
        )}

        {/* Stage 2 Summary Strip */}
        {discoveredLectures.length > 0 ? (
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-zinc-300 bg-zinc-950/50 px-3.5 py-2 rounded-xl border border-zinc-800">
            <span>Total: {discoveredLectures.length}</span>
            <span className="text-zinc-600">•</span>
            <span className="text-emerald-300">Media Ready: {mediaReadyCount}</span>
            <span className="text-zinc-600">•</span>
            <span className="text-amber-300">Needs Media: {missingMediaCount}</span>
            {failedLecturesCount > 0 && (
              <>
                <span className="text-zinc-600">•</span>
                <span className="text-rose-300">Errors: {failedLecturesCount}</span>
              </>
            )}
          </div>
        ) : (
          <div className="p-6 text-center rounded-xl bg-zinc-950/40 border border-dashed border-zinc-800 text-xs text-zinc-400">
            Click <strong>Discover Echo360 Lectures</strong> above to load your course recordings and inspect what is already cached on disk.
          </div>
        )}
      </section>

      {/* STAGE 3: Per-Lecture Map-Reduce Note Distillation */}
      <section className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3.5">
          <div className="flex items-center gap-2.5">
            <span className="px-2 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-mono text-[11px] font-bold">
              STAGE 3
            </span>
            <div>
              <h3 className="text-sm font-bold text-white">
                Per-Lecture Note Distillation
              </h3>
              <p className="text-[11px] text-zinc-400">
                Uses chunk checkpoints, skips recordings without transcripts unless you enable{" "}
                <strong className="text-zinc-200">Allow PDF-Only</strong>, and upgrades existing PDF-only notes automatically.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDistillReadyLectures}
              disabled={isRunning || readyToDistillCount === 0}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-950/50 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Distill Ready Lectures ({readyToDistillCount})</span>
            </button>

            {failedLecturesCount > 0 && (
              <button
                type="button"
                onClick={() => handleRetryStageFailed("distill")}
                disabled={isRunning}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry Failed ({failedLecturesCount})</span>
              </button>
            )}
          </div>
        </div>

        {/* AI Engine Pre-Flight Banner */}
        {batchAiPreview && (
          <div
            className={`p-3 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              batchAiPreview.provider === "antigravity"
                ? "bg-amber-950/30 border-amber-500/40 text-amber-200"
                : "bg-indigo-950/30 border-indigo-500/30 text-indigo-200"
            }`}
          >
            <div className="flex items-start gap-2.5">
              {batchAiPreview.provider === "antigravity" ? (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              ) : (
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-semibold">
                  Batch AI Engine:{" "}
                  <span className="font-mono">
                    {batchAiPreview.provider} / {batchAiPreview.model}
                    {batchAiPreview.thinkingLevel ? ` (${batchAiPreview.thinkingLevel})` : ""}
                  </span>
                </p>
                {batchAiPreview.provider === "antigravity" && (
                  <p className="text-[11px] text-amber-200/80 mt-0.5">
                    No Gemini API Key found in Settings — falling back to Antigravity CLI (~3–5 min/lecture, higher 240s timeout risk). Add a Gemini API Key for fast Gemini Hydrogen (low thinking) + audio transcription fallback.
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenSettings}
              className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>AI Settings</span>
            </button>
          </div>
        )}

        {/* Stage 3 Controls & Counters */}
        {discoveredLectures.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 text-xs">
            <div className="flex flex-wrap items-center gap-3 font-mono text-[11px]">
              <span className="text-emerald-300">
                Complete (With Transcript): {completeTranscriptBackedCount}
              </span>
              <span className="text-amber-300">
                PDF-Only (Upgrade Ready): {pdfOnlyUpgradeCount}
              </span>
              <span className="text-rose-300">
                Needs Media: {missingMediaCount}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoUpgradePdfOnly}
                  onChange={(e) => setAutoUpgradePdfOnly(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-900 text-indigo-500"
                />
                <span>Auto-upgrade PDF-Only notes once media ready</span>
              </label>

              <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireAi}
                  onChange={(e) => setRequireAi(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-900 text-indigo-500"
                />
                <span>Run AI Distillation</span>
              </label>
            </div>
          </div>
        )}

        {/* Per-Lecture Unified Resumable List */}
        {discoveredLectures.length > 0 && (
          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {discoveredLectures.map((l) => {
              const hasMedia = Boolean(l.hasTranscript || l.audioDownloaded);
              const isCompleteFull = l.status === "done" && !l.pdfOnly;
              const isPdfOnly = Boolean(l.pdfOnly);
              const isError = l.status === "error";
              const isBusy = l.status === "pulling" || l.status === "distilling";

              return (
                <div
                  key={l.lessonId}
                  className={`p-3 rounded-xl border transition space-y-2 ${
                    isError
                      ? "bg-rose-950/20 border-rose-500/40"
                      : isCompleteFull
                      ? "bg-emerald-950/15 border-emerald-500/30"
                      : isPdfOnly
                      ? "bg-amber-950/15 border-amber-500/30"
                      : "bg-zinc-950/60 border-zinc-800"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-[10px] font-mono text-zinc-300">
                          W{l.week}
                        </span>
                        <span className="font-semibold text-xs text-zinc-100 truncate">
                          {l.title}
                        </span>
                        {l.date && (
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {l.date}
                          </span>
                        )}
                      </div>

                      {/* Stage status pills */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                        {l.hasTranscript ? (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-500/30 text-emerald-300">
                            Transcript: {l.transcriptCueCount || "Ready"} cues
                          </span>
                        ) : l.audioDownloaded ? (
                          <span className="px-2 py-0.5 rounded-md bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
                            Audio .m4a Ready
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-amber-950/60 border border-amber-500/40 text-amber-300">
                            Needs Transcript or Audio
                          </span>
                        )}

                        {isCompleteFull ? (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-semibold">
                            ✓ Complete Note
                          </span>
                        ) : isPdfOnly ? (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/40 text-amber-300 font-semibold">
                            PDF-Only (Upgrade Ready)
                          </span>
                        ) : l.status === "media_ready" ? (
                          <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                            Media Ready
                          </span>
                        ) : isBusy ? (
                          <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 border border-indigo-500/40 text-indigo-300">
                            {l.progressStage || l.status}
                          </span>
                        ) : isError ? (
                          <span className="px-2 py-0.5 rounded-md bg-rose-500/20 border border-rose-500/40 text-rose-300 font-semibold">
                            ! Failed
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-700 text-zinc-400">
                            <Clock className="w-2.5 h-2.5 inline mr-1" />
                            Queued
                          </span>
                        )}

                        {(l.checkpointCount || 0) > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-indigo-950/60 border border-indigo-500/30 text-indigo-300">
                            {l.checkpointCount} checkpoint(s)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Row Controls: Drop manual media, Pull single, Allow PDF-Only, Distill single */}
                    <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                      <label className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-[11px] font-medium flex items-center gap-1 cursor-pointer transition">
                        <Upload className="w-3 h-3 text-cyan-400" />
                        <span>
                          {uploadingMediaLessonId === l.lessonId
                            ? "Uploading..."
                            : "Drop .m4a/.vtt"}
                        </span>
                        <input
                          type="file"
                          accept=".m4a,.mp3,.wav,.vtt,.srt,.txt"
                          className="hidden"
                          onChange={(e) => handleManualMediaUpload(l, e.target.files)}
                          disabled={uploadingMediaLessonId === l.lessonId}
                        />
                      </label>

                      {!hasMedia && (
                        <button
                          type="button"
                          onClick={() => handlePullSingleMedia(l)}
                          disabled={isRunning}
                          className="px-2.5 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 disabled:opacity-50 border border-cyan-500/40 text-cyan-200 text-[11px] font-semibold transition cursor-pointer"
                        >
                          Pull Media
                        </button>
                      )}

                      {!hasMedia && (
                        <label
                          className="px-2 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-[11px] text-zinc-300 flex items-center gap-1.5 cursor-pointer"
                          title="Explicitly allow Stage 3 distillation without transcript or audio"
                        >
                          <input
                            type="checkbox"
                            checked={Boolean(l.allowPdfOnly)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setDiscoveredLectures((prev) =>
                                prev.map((row) =>
                                  row.lessonId === l.lessonId
                                    ? { ...row, allowPdfOnly: checked }
                                    : row
                                )
                              );
                            }}
                            className="rounded border-zinc-700 bg-zinc-950 text-amber-500"
                          />
                          <span>Allow PDF-Only</span>
                        </label>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDistillSingleLecture(l)}
                        disabled={isRunning || (!hasMedia && !l.allowPdfOnly)}
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-600/25 hover:bg-indigo-600/40 disabled:opacity-40 border border-indigo-500/40 text-indigo-200 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                      >
                        <Play className="w-3 h-3" />
                        <span>{isCompleteFull ? "Re-distill" : isPdfOnly ? "Upgrade Note" : "Distill"}</span>
                      </button>
                    </div>
                  </div>

                  {isError && (l.error || l.progressStage) && (
                    <div className="flex items-start gap-1.5 text-[11px] text-rose-300 bg-rose-950/40 border border-rose-500/30 rounded-lg px-2.5 py-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-400" />
                      <span className="break-words">{l.error || l.progressStage}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* STAGE 4: Master Course Notebook & Concept Linking */}
      <section className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-[11px] font-bold">
              STAGE 4
            </span>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Library className="w-4 h-4 text-indigo-400" />
              <span>Master Course Notebook &amp; Grounded Q&amp;A</span>
            </h3>
          </div>
          <p className="text-xs text-zinc-400">
            {notebookStats
              ? `${notebookStats.distilledCount} distilled lecture note(s), ${notebookStats.rawTranscriptsCount} raw transcript(s), and ${notebookStats.extractedMaterialsCount} PDF document(s) ready for Antigravity Hydrogen High synthesis.`
              : "Compile distilled lectures, PDFs, and syllabus into a cross-linked Course Notebook."}
          </p>
          {pdfOnlyUpgradeCount > 0 && (
            <p className="text-[11px] text-amber-300">
              Note: {pdfOnlyUpgradeCount} lecture note(s) are currently PDF-only; upgrade them in Stage 2/3 before compiling for full timestamped insights.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onOpenNotebookTab}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/50 transition cursor-pointer shrink-0"
        >
          <span>Open Master Notebook &amp; Q&amp;A</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </section>
    </div>
  );
}
