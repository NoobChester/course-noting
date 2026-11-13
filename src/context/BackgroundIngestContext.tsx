"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback
} from "react";
import { loadClientAiSettings, normalizeBatchAiPayload } from "@/lib/ai-settings";

export interface IngestLectureItem {
  lessonId: string;
  mediaId: string;
  title: string;
  week: number;
  date: string;
  lessonUrl: string;
  hasVideo: boolean;
  selected: boolean;
  status: "queued" | "pulling" | "media_ready" | "distilling" | "done" | "error";
  error?: string;
  insightsCount?: number;
  audioTranscribed?: boolean;
  partsProcessed?: number;
  contextWarning?: string;
  outlineTopic?: string;
  outlineDescription?: string;
  outlineDateRange?: string;
  transcriptStatus?: "idle" | "loading" | "ready" | "none" | "error";
  transcriptCueCount?: number;
  transcriptPreview?: string;
  progressPercent?: number;
  progressStage?: string;
}

export interface IngestSession {
  id: string;
  courseId: string;
  courseName?: string;
  startedAt: string;
  updatedAt: string;
  lectures: IngestLectureItem[];
  requireAi: boolean;
  aiSettings?: any;
  echoAudioOnly: boolean;
  phase: "downloading" | "distilling" | "idle";
  status: "idle" | "running" | "paused" | "completed" | "error";
  currentLectureTitle?: string;
  currentLectureIndex: number;
  currentStage?: string;
  progressPercent: number;
  completedCount: number;
  totalCount: number;
  errorCount: number;
  lastError?: string;
}

interface BackgroundIngestContextType {
  session: IngestSession | null;
  isRunning: boolean;
  isPaused: boolean;
  hasIncompleteSession: boolean;
  interruptedSession: IngestSession | null;
  dockOpen: boolean;
  setDockOpen: (open: boolean) => void;
  startBatchDownload: (
    courseId: string,
    lectures: IngestLectureItem[],
    echoAudioOnly?: boolean
  ) => Promise<void>;
  startDistillationQueue: (
    courseId: string,
    lectures: IngestLectureItem[],
    requireAi: boolean,
    aiSettings?: any,
    echoAudioOnly?: boolean
  ) => Promise<void>;
  startPullThenDistill: (
    courseId: string,
    lectures: IngestLectureItem[],
    requireAi: boolean,
    aiSettings?: any,
    echoAudioOnly?: boolean
  ) => Promise<void>;
  pauseQueue: () => void;
  resumeQueue: () => void;
  cancelQueue: () => void;
  resumeInterruptedSession: () => Promise<void>;
  dismissInterruptedSession: () => void;
  clearSession: () => void;
  subscribeToNoteUpdates: (callback: (noteId?: string) => void) => () => void;
}

const STORAGE_KEY = "cn_active_ingest_session";

const BackgroundIngestContext = createContext<BackgroundIngestContextType | null>(null);

export function BackgroundIngestProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<IngestSession | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [hasIncompleteSession, setHasIncompleteSession] = useState(false);
  const [interruptedSession, setInterruptedSession] = useState<IngestSession | null>(null);
  const [dockOpen, setDockOpen] = useState(false);

  // Control refs for background loop
  const isPausedRef = useRef(false);
  const isCancelledRef = useRef(false);
  const resumeResolverRef = useRef<(() => void) | null>(null);
  const sessionRef = useRef<IngestSession | null>(null);
  const subscribersRef = useRef<Set<(noteId?: string) => void>>(new Set());

  // Keep sessionRef in sync with session state
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  // Save session to localStorage
  const saveSessionToStorage = useCallback((sess: IngestSession | null) => {
    if (typeof window === "undefined") return;
    try {
      if (sess) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sess));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.error("Failed to sync session with localStorage", e);
    }
  }, []);

  // Subscribe to lecture note completions
  const subscribeToNoteUpdates = useCallback((callback: (noteId?: string) => void) => {
    subscribersRef.current.add(callback);
    return () => {
      subscribersRef.current.delete(callback);
    };
  }, []);

  const notifySubscribers = useCallback((noteId?: string) => {
    subscribersRef.current.forEach((cb) => {
      try {
        cb(noteId);
      } catch (e) {
        console.error("Error in note update subscriber callback", e);
      }
    });
  }, []);

  // Check localStorage on initial mount for interrupted or recent sessions
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: IngestSession = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.lectures) && parsed.lectures.length > 0) {
          const completed = parsed.lectures.filter((l) => l.status === "done").length;
          const selected = parsed.lectures.filter((l) => l.selected);
          const remaining = selected.filter((l) => l.status !== "done").length;

          if (remaining > 0 && parsed.status !== "completed") {
            // An uncompleted session was interrupted!
            setHasIncompleteSession(true);
            setInterruptedSession(parsed);
            setSession({
              ...parsed,
              status: "paused"
            });
          } else if (parsed.status === "completed") {
            // Completed session within recent time
            setSession(parsed);
          }
        }
      }
    } catch (e) {
      console.error("Failed to parse stored ingest session", e);
    }
  }, []);

  // Helper: wait while paused
  const checkWaitWhilePaused = async () => {
    if (!isPausedRef.current) return;
    await new Promise<void>((resolve) => {
      resumeResolverRef.current = resolve;
    });
  };

  // 1. Queue Engine for Distillation
  const runDistillationLoop = async (initialSession: IngestSession) => {
    setIsRunning(true);
    setIsPaused(false);
    isPausedRef.current = false;
    isCancelledRef.current = false;
    setDockOpen(true);

    let currentSession = { ...initialSession };
    const { courseId, requireAi, aiSettings, echoAudioOnly } = currentSession;
    const selectedLectures = currentSession.lectures.filter((l) => l.selected);
    const totalCount = selectedLectures.length;

    for (let i = 0; i < currentSession.lectures.length; i++) {
      if (isCancelledRef.current) {
        break;
      }

      await checkWaitWhilePaused();
      if (isCancelledRef.current) break;

      const item = currentSession.lectures[i];
      if (!item.selected || item.status === "done") {
        continue;
      }

      // Update current lecture status to distilling
      const currentDone = currentSession.lectures.filter((l) => l.status === "done").length;
      const progressPercent = Math.round((currentDone / Math.max(1, totalCount)) * 100);

      currentSession = {
        ...currentSession,
        status: "running",
        phase: "distilling",
        currentLectureIndex: i + 1,
        currentLectureTitle: item.title,
        currentStage: requireAi
          ? `Distilling ${item.title} with AI & course context...`
          : `Writing notes for ${item.title}...`,
        progressPercent,
        updatedAt: new Date().toISOString(),
        lectures: currentSession.lectures.map((l, idx) =>
          idx === i
            ? {
                ...l,
                status: "distilling",
                progressPercent: 30,
                progressStage: requireAi
                  ? "Distilling with course context & KaTeX..."
                  : "Writing transcript notes..."
              }
            : l
        )
      };
      setSession(currentSession);
      saveSessionToStorage(currentSession);

      try {
        const ephemeralCookie = typeof window !== "undefined" ? sessionStorage.getItem("cn_echo_session_cookie") : null;
        const ephemeralUrl = typeof window !== "undefined" ? sessionStorage.getItem("cn_echo_session_url") : null;
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (ephemeralCookie) headers["x-echo-cookie"] = ephemeralCookie;
        if (ephemeralUrl) headers["x-echo-section-url"] = ephemeralUrl;

        const retryDelaysMs = [8000, 20000, 35000];
        let res: Response | null = null;
        let data: any = null;
        let lastErr: any = null;

        for (let attempt = 0; attempt <= retryDelaysMs.length; attempt++) {
          if (isCancelledRef.current) break;
          await checkWaitWhilePaused();
          if (isCancelledRef.current) break;

          try {
            res = await fetch("/api/lectures/echo360", {
              method: "POST",
              headers,
              body: JSON.stringify({
                action: "auto-ingest",
                phase: "distill-note",
                courseId,
                lessonId: item.lessonId,
                mediaId: item.mediaId,
                title: item.title,
                week: item.week,
                date: item.date,
                lessonUrl: item.lessonUrl,
                downloadAudio: echoAudioOnly,
                autoDistill: requireAi,
                requireAi,
                outlineTopic: item.outlineTopic,
                outlineDescription: item.outlineDescription,
                cookieHeader: ephemeralCookie || undefined,
                aiSettings
              })
            });
            data = await res.json();

            const transientHttp = res.status === 429 || res.status === 502 || res.status === 503 || res.status === 504;
            const transientMsg =
              typeof data?.error === "string" && /429|rate limit|quota|timeout|temporarily/i.test(data.error);

            if (res.ok || (!transientHttp && !transientMsg) || attempt === retryDelaysMs.length) {
              break;
            }
          } catch (fetchErr: any) {
            lastErr = fetchErr;
            if (attempt === retryDelaysMs.length) {
              throw fetchErr;
            }
          }

          const delay = retryDelaysMs[attempt] ?? 20000;
          currentSession = {
            ...currentSession,
            currentStage: `Rate-limited or busy on ${item.title} — retrying in ${Math.round(delay / 1000)}s...`,
            updatedAt: new Date().toISOString(),
            lectures: currentSession.lectures.map((l, idx) =>
              idx === i
                ? {
                    ...l,
                    progressStage: `Retrying (${attempt + 1}/${retryDelaysMs.length}) after ${Math.round(delay / 1000)}s...`
                  }
                : l
            )
          };
          setSession(currentSession);
          saveSessionToStorage(currentSession);
          await new Promise((r) => setTimeout(r, delay));
        }

        if (isCancelledRef.current) break;
        if (!res) throw lastErr || new Error("No response from server");

        if (res.ok) {
          const newDone = currentSession.lectures.filter((l, idx) => idx === i || l.status === "done").length;
          const newPercent = Math.round((newDone / Math.max(1, totalCount)) * 100);
          const stageBadges: string[] = ["Ingested"];
          if (data.audioTranscribed) stageBadges.push("Audio fallback");
          if (typeof data.partsProcessed === "number" && data.partsProcessed > 1) {
            stageBadges.push(`${data.partsProcessed} parts`);
          }
          if (data.contextWarning) stageBadges.push("Sparse PDF warning");

          currentSession = {
            ...currentSession,
            completedCount: newDone,
            progressPercent: newPercent,
            currentStage: `✓ Completed ${item.title}${data.audioTranscribed ? " (Audio fallback)" : ""}`,
            updatedAt: new Date().toISOString(),
            lectures: currentSession.lectures.map((l, idx) =>
              idx === i
                ? {
                    ...l,
                    status: "done",
                    progressPercent: 100,
                    progressStage: stageBadges.join(" • "),
                    insightsCount: data.insightsCount || 0,
                    audioTranscribed: Boolean(data.audioTranscribed),
                    partsProcessed: data.partsProcessed,
                    contextWarning: data.contextWarning
                  }
                : l
            )
          };
          setSession(currentSession);
          saveSessionToStorage(currentSession);

          // Broadcast update so open views can refresh notes list
          notifySubscribers(data.noteId);

          if (requireAi) {
            await new Promise((r) => setTimeout(r, 1500));
          }
        } else {
          currentSession = {
            ...currentSession,
            errorCount: currentSession.errorCount + 1,
            lastError: data.error || "Distillation failed",
            currentStage: `⚠️ Error on ${item.title}: ${data.error || "Failed"}`,
            updatedAt: new Date().toISOString(),
            lectures: currentSession.lectures.map((l, idx) =>
              idx === i
                ? {
                    ...l,
                    status: "error",
                    progressPercent: 0,
                    progressStage: data.error || "Distillation failed"
                  }
                : l
            )
          };
          setSession(currentSession);
          saveSessionToStorage(currentSession);
        }
      } catch (err: any) {
        currentSession = {
          ...currentSession,
          errorCount: currentSession.errorCount + 1,
          lastError: err.message || "Network error",
          currentStage: `⚠️ Network error on ${item.title}`,
          updatedAt: new Date().toISOString(),
          lectures: currentSession.lectures.map((l, idx) =>
            idx === i
              ? {
                  ...l,
                  status: "error",
                  progressPercent: 0,
                  progressStage: err.message || "Network error"
                }
              : l
          )
        };
        setSession(currentSession);
        saveSessionToStorage(currentSession);
      }
    }

    if (!isCancelledRef.current) {
      const finalDone = currentSession.lectures.filter((l) => l.status === "done").length;
      const isAllDone = finalDone >= totalCount;

      currentSession = {
        ...currentSession,
        status: isAllDone ? "completed" : "paused",
        phase: "idle",
        progressPercent: isAllDone ? 100 : currentSession.progressPercent,
        currentStage: isAllDone
          ? `🎉 All ${totalCount} lecture(s) successfully distilled!`
          : `Distillation ended (${finalDone}/${totalCount} finished).`,
        updatedAt: new Date().toISOString()
      };
      setSession(currentSession);
      saveSessionToStorage(currentSession);
    }

    setIsRunning(false);
  };

  // 2. Queue Engine for Audio Downloads
  const runDownloadLoop = async (initialSession: IngestSession, chainToDistill: boolean = false) => {
    setIsRunning(true);
    setIsPaused(false);
    isPausedRef.current = false;
    isCancelledRef.current = false;
    setDockOpen(true);

    let currentSession = { ...initialSession };
    const { courseId, echoAudioOnly } = currentSession;
    const selectedLectures = currentSession.lectures.filter((l) => l.selected);
    const totalCount = selectedLectures.length;

    for (let i = 0; i < currentSession.lectures.length; i++) {
      if (isCancelledRef.current) break;
      await checkWaitWhilePaused();
      if (isCancelledRef.current) break;

      const item = currentSession.lectures[i];
      if (!item.selected || item.status === "done" || item.status === "media_ready") {
        continue;
      }

      const currentDone = currentSession.lectures.filter(
        (l) => l.status === "media_ready" || l.status === "done"
      ).length;
      const progressPercent = Math.round((currentDone / Math.max(1, totalCount)) * 100);

      currentSession = {
        ...currentSession,
        status: "running",
        phase: "downloading",
        currentLectureIndex: i + 1,
        currentLectureTitle: item.title,
        currentStage: `Downloading audio for ${item.title}...`,
        progressPercent,
        updatedAt: new Date().toISOString(),
        lectures: currentSession.lectures.map((l, idx) =>
          idx === i
            ? {
                ...l,
                status: "pulling",
                progressPercent: 35,
                progressStage: "Streaming .m4a audio stream via FFmpeg..."
              }
            : l
        )
      };
      setSession(currentSession);
      saveSessionToStorage(currentSession);

      try {
        const ephemeralCookie = typeof window !== "undefined" ? sessionStorage.getItem("cn_echo_session_cookie") : null;
        const ephemeralUrl = typeof window !== "undefined" ? sessionStorage.getItem("cn_echo_session_url") : null;
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (ephemeralCookie) headers["x-echo-cookie"] = ephemeralCookie;
        if (ephemeralUrl) headers["x-echo-section-url"] = ephemeralUrl;

        const res = await fetch("/api/lectures/echo360", {
          method: "POST",
          headers,
          body: JSON.stringify({
            action: "auto-ingest",
            phase: "download-media",
            courseId,
            lessonId: item.lessonId,
            mediaId: item.mediaId,
            title: item.title,
            week: item.week,
            date: item.date,
            lessonUrl: item.lessonUrl,
            downloadAudio: echoAudioOnly,
            outlineTopic: item.outlineTopic,
            outlineDescription: item.outlineDescription,
            cookieHeader: ephemeralCookie || undefined
          })
        });

        const data = await res.json();
        if (res.ok) {
          const newDone = currentSession.lectures.filter(
            (l, idx) => idx === i || l.status === "media_ready" || l.status === "done"
          ).length;
          const newPercent = Math.round((newDone / Math.max(1, totalCount)) * 100);

          currentSession = {
            ...currentSession,
            completedCount: newDone,
            progressPercent: newPercent,
            currentStage: `✓ Audio downloaded for ${item.title}`,
            updatedAt: new Date().toISOString(),
            lectures: currentSession.lectures.map((l, idx) =>
              idx === i
                ? {
                    ...l,
                    status: "media_ready",
                    progressPercent: 100,
                    progressStage: "✓ Audio ready"
                  }
                : l
            )
          };
          setSession(currentSession);
          saveSessionToStorage(currentSession);
        } else {
          currentSession = {
            ...currentSession,
            errorCount: currentSession.errorCount + 1,
            lastError: data.error || "Media download failed",
            currentStage: `⚠️ Download error on ${item.title}`,
            updatedAt: new Date().toISOString(),
            lectures: currentSession.lectures.map((l, idx) =>
              idx === i
                ? {
                    ...l,
                    status: "error",
                    progressPercent: 0,
                    progressStage: data.error || "Download error"
                  }
                : l
            )
          };
          setSession(currentSession);
          saveSessionToStorage(currentSession);
        }
      } catch (err: any) {
        currentSession = {
          ...currentSession,
          errorCount: currentSession.errorCount + 1,
          lastError: err.message || "Network error",
          currentStage: `⚠️ Network error downloading ${item.title}`,
          updatedAt: new Date().toISOString(),
          lectures: currentSession.lectures.map((l, idx) =>
            idx === i
              ? {
                  ...l,
                  status: "error",
                  progressPercent: 0,
                  progressStage: err.message || "Network error"
                }
              : l
          )
        };
        setSession(currentSession);
        saveSessionToStorage(currentSession);
      }
    }

    if (!isCancelledRef.current) {
      const finalDone = currentSession.lectures.filter(
        (l) => l.status === "media_ready" || l.status === "done"
      ).length;
      const isAllDone = finalDone >= totalCount;

      currentSession = {
        ...currentSession,
        status: chainToDistill ? "running" : isAllDone ? "completed" : "paused",
        phase: chainToDistill ? "distilling" : "idle",
        progressPercent: chainToDistill ? 0 : isAllDone ? 100 : currentSession.progressPercent,
        currentStage: chainToDistill
          ? "Audio downloads ready — switching to Batch Distillation..."
          : isAllDone
          ? `✓ All ${totalCount} lecture audio file(s) downloaded!`
          : `Download stopped (${finalDone}/${totalCount} ready).`,
        updatedAt: new Date().toISOString()
      };
      setSession(currentSession);
      saveSessionToStorage(currentSession);

      if (chainToDistill) {
        await runDistillationLoop({
          ...currentSession,
          completedCount: currentSession.lectures.filter((l) => l.status === "done").length
        });
        return;
      }
    }

    setIsRunning(false);
  };

  // Start Batch Distillation
  const startDistillationQueue = async (
    courseId: string,
    lectures: IngestLectureItem[],
    requireAi: boolean,
    aiSettings?: any,
    echoAudioOnly: boolean = true
  ) => {
    // Resolve & normalize Batch AI settings (defaults to gemini-4-hydrogen thinkingLevel=low when API key configured)
    let resolvedAiSettings = aiSettings;
    if (resolvedAiSettings) {
      if (resolvedAiSettings.apiKey === undefined && resolvedAiSettings.model === undefined) {
        resolvedAiSettings = normalizeBatchAiPayload(resolvedAiSettings);
      }
    } else if (typeof window !== "undefined") {
      try {
        resolvedAiSettings = normalizeBatchAiPayload(loadClientAiSettings());
      } catch {}
    }

    const selected = lectures.filter((l) => l.selected);
    const newSession: IngestSession = {
      id: `session_${courseId}_${Date.now()}`,
      courseId,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lectures,
      requireAi,
      aiSettings: resolvedAiSettings,
      echoAudioOnly,
      phase: "distilling",
      status: "running",
      currentLectureIndex: 1,
      currentLectureTitle: selected[0]?.title || "",
      currentStage: "Initializing background distillation...",
      progressPercent: 0,
      completedCount: lectures.filter((l) => l.status === "done").length,
      totalCount: selected.length,
      errorCount: 0
    };

    setSession(newSession);
    saveSessionToStorage(newSession);
    setHasIncompleteSession(false);
    setInterruptedSession(null);

    runDistillationLoop(newSession);
  };

  // Download missing .m4a audio streams first, then run batch distillation
  const startPullThenDistill = async (
    courseId: string,
    lectures: IngestLectureItem[],
    requireAi: boolean,
    aiSettings?: any,
    echoAudioOnly: boolean = true
  ) => {
    let resolvedAiSettings = aiSettings;
    if (resolvedAiSettings) {
      if (resolvedAiSettings.apiKey === undefined && resolvedAiSettings.model === undefined) {
        resolvedAiSettings = normalizeBatchAiPayload(resolvedAiSettings);
      }
    } else if (typeof window !== "undefined") {
      try {
        resolvedAiSettings = normalizeBatchAiPayload(loadClientAiSettings());
      } catch {}
    }

    const selected = lectures.filter((l) => l.selected);
    const newSession: IngestSession = {
      id: `pull_distill_${courseId}_${Date.now()}`,
      courseId,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lectures,
      requireAi,
      aiSettings: resolvedAiSettings,
      echoAudioOnly,
      phase: "downloading",
      status: "running",
      currentLectureIndex: 1,
      currentLectureTitle: selected[0]?.title || "",
      currentStage: "Step 1/2: Pulling audio streams before batch distillation...",
      progressPercent: 0,
      completedCount: lectures.filter((l) => l.status === "done").length,
      totalCount: selected.length,
      errorCount: 0
    };

    setSession(newSession);
    saveSessionToStorage(newSession);
    setHasIncompleteSession(false);
    setInterruptedSession(null);

    runDownloadLoop(newSession, true);
  };

  // Start Batch Download
  const startBatchDownload = async (
    courseId: string,
    lectures: IngestLectureItem[],
    echoAudioOnly: boolean = true
  ) => {
    const selected = lectures.filter((l) => l.selected);
    const newSession: IngestSession = {
      id: `download_${courseId}_${Date.now()}`,
      courseId,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lectures,
      requireAi: false,
      echoAudioOnly,
      phase: "downloading",
      status: "running",
      currentLectureIndex: 1,
      currentLectureTitle: selected[0]?.title || "",
      currentStage: "Starting media downloads...",
      progressPercent: 0,
      completedCount: lectures.filter((l) => l.status === "media_ready" || l.status === "done").length,
      totalCount: selected.length,
      errorCount: 0
    };

    setSession(newSession);
    saveSessionToStorage(newSession);
    setHasIncompleteSession(false);
    setInterruptedSession(null);

    runDownloadLoop(newSession);
  };

  // Pause
  const pauseQueue = () => {
    isPausedRef.current = true;
    setIsPaused(true);
    if (sessionRef.current) {
      const updated: IngestSession = {
        ...sessionRef.current,
        status: "paused",
        currentStage: "Paused by user"
      };
      setSession(updated);
      saveSessionToStorage(updated);
    }
  };

  // Resume active paused queue
  const resumeQueue = () => {
    isPausedRef.current = false;
    setIsPaused(false);
    if (resumeResolverRef.current) {
      resumeResolverRef.current();
      resumeResolverRef.current = null;
    }
    if (sessionRef.current) {
      const updated: IngestSession = {
        ...sessionRef.current,
        status: "running",
        currentStage: "Resuming..."
      };
      setSession(updated);
      saveSessionToStorage(updated);
    }
  };

  // Cancel
  const cancelQueue = () => {
    isCancelledRef.current = true;
    isPausedRef.current = false;
    setIsRunning(false);
    setIsPaused(false);
    if (resumeResolverRef.current) {
      resumeResolverRef.current();
      resumeResolverRef.current = null;
    }
    if (sessionRef.current) {
      const updated: IngestSession = {
        ...sessionRef.current,
        status: "idle",
        currentStage: "Cancelled"
      };
      setSession(updated);
      saveSessionToStorage(updated);
    }
  };

  // Resume Interrupted Session (from tab close or refresh)
  const resumeInterruptedSession = async () => {
    if (!interruptedSession) return;
    setHasIncompleteSession(false);
    const targetSession = {
      ...interruptedSession,
      status: "running" as const
    };
    setSession(targetSession);
    saveSessionToStorage(targetSession);
    setInterruptedSession(null);

    if (targetSession.phase === "downloading") {
      runDownloadLoop(targetSession);
    } else {
      runDistillationLoop(targetSession);
    }
  };

  // Dismiss Interrupted Session
  const dismissInterruptedSession = () => {
    setHasIncompleteSession(false);
    setInterruptedSession(null);
    saveSessionToStorage(null);
    setSession(null);
  };

  // Clear Session
  const clearSession = () => {
    cancelQueue();
    setSession(null);
    setHasIncompleteSession(false);
    setInterruptedSession(null);
    saveSessionToStorage(null);
    setDockOpen(false);
  };

  return (
    <BackgroundIngestContext.Provider
      value={{
        session,
        isRunning,
        isPaused,
        hasIncompleteSession,
        interruptedSession,
        dockOpen,
        setDockOpen,
        startBatchDownload,
        startDistillationQueue,
        startPullThenDistill,
        pauseQueue,
        resumeQueue,
        cancelQueue,
        resumeInterruptedSession,
        dismissInterruptedSession,
        clearSession,
        subscribeToNoteUpdates
      }}
    >
      {children}
    </BackgroundIngestContext.Provider>
  );
}

export function useBackgroundIngest() {
  const ctx = useContext(BackgroundIngestContext);
  if (!ctx) {
    throw new Error("useBackgroundIngest must be used within a BackgroundIngestProvider");
  }
  return ctx;
}
