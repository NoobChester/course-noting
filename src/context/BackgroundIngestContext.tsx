"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback
} from "react";

export interface IngestLectureItem {
  lessonId: string;
  mediaId: string;
  sectionId?: string;
  streamUrl?: string;
  groupName?: string;
  title: string;
  week: number;
  date: string;
  lessonUrl: string;
  hasVideo: boolean;
  selected: boolean;
  status: "queued" | "pulling" | "media_ready" | "error";
  error?: string;
  audioWarning?: string;
  outlineTopic?: string;
  outlineDescription?: string;
  outlineDateRange?: string;
  transcriptStatus?: "idle" | "loading" | "ready" | "none" | "error";
  transcriptCueCount?: number;
  transcriptChars?: number;
  transcriptPreview?: string;
  progressPercent?: number;
  progressStage?: string;
  ffmpegAvailable?: boolean;
  needsMedia?: boolean;
  hasTranscript?: boolean;
  audioDownloaded?: boolean;
}

export interface IngestSession {
  id: string;
  courseId: string;
  courseName?: string;
  startedAt: string;
  updatedAt: string;
  lectures: IngestLectureItem[];
  echoAudioOnly: boolean;
  phase: "downloading" | "idle";
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
  pauseQueue: () => void;
  resumeQueue: () => void;
  cancelQueue: () => void;
  resumeInterruptedSession: () => Promise<void>;
  dismissInterruptedSession: () => void;
  clearSession: () => void;
  retryFailedItems: () => Promise<void>;
  subscribeToMediaUpdates: (callback: (mediaId?: string) => void) => () => void;
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

  const isPausedRef = useRef(false);
  const isCancelledRef = useRef(false);
  const resumeResolverRef = useRef<(() => void) | null>(null);
  const sessionRef = useRef<IngestSession | null>(null);
  const subscribersRef = useRef<Set<(mediaId?: string) => void>>(new Set());

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const saveSessionToStorage = useCallback((sess: IngestSession | null) => {
    if (typeof window === "undefined") return;
    try {
      if (sess) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sess));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.error("Failed to sync ingest session with localStorage", e);
    }
  }, []);

  const subscribeToMediaUpdates = useCallback((callback: (mediaId?: string) => void) => {
    subscribersRef.current.add(callback);
    return () => {
      subscribersRef.current.delete(callback);
    };
  }, []);

  const notifySubscribers = useCallback((mediaId?: string) => {
    subscribersRef.current.forEach((cb) => {
      try {
        cb(mediaId);
      } catch (e) {
        console.error("Error in media update subscriber callback", e);
      }
    });
  }, []);

  // Hydrate interrupted download sessions on mount; ignore legacy non-download sessions
  useEffect(() => {
    if (typeof window === "undefined") return;
    const timer = setTimeout(() => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return;
        const parsed = JSON.parse(stored) as IngestSession & { phase?: string };
        if (!parsed || !Array.isArray(parsed.lectures) || parsed.lectures.length === 0) return;

        if (parsed.phase !== "downloading" && parsed.status !== "completed") {
          localStorage.removeItem(STORAGE_KEY);
          return;
        }

        const normalizedLectures: IngestLectureItem[] = parsed.lectures.map((l) => {
          const rawStatus = l.status as string;
          const safeStatus: IngestLectureItem["status"] =
            rawStatus === "done" || rawStatus === "media_ready"
              ? "media_ready"
              : rawStatus === "error"
              ? "error"
              : "queued";
          return { ...l, status: safeStatus };
        });

        const normalizedSession: IngestSession = {
          ...parsed,
          phase: parsed.status === "completed" ? "idle" : "downloading",
          lectures: normalizedLectures
        };

        const selected = normalizedLectures.filter((l) => l.selected);
        const remaining = selected.filter((l) => l.status !== "media_ready").length;

        if (remaining > 0 && normalizedSession.status !== "completed" && normalizedSession.phase === "downloading") {
          setHasIncompleteSession(true);
          setInterruptedSession(normalizedSession);
          setSession({
            ...normalizedSession,
            status: "paused"
          });
        } else if (normalizedSession.status === "completed") {
          setSession(normalizedSession);
        }
      } catch (e) {
        console.error("Failed to parse stored ingest session", e);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const checkWaitWhilePaused = async () => {
    if (!isPausedRef.current) return;
    await new Promise<void>((resolve) => {
      resumeResolverRef.current = resolve;
    });
  };

  const runDownloadLoop = async (initialSession: IngestSession) => {
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
      if (!item.selected || item.status === "media_ready") {
        continue;
      }

      const currentDone = currentSession.lectures.filter((l) => l.selected && l.status === "media_ready").length;
      const progressPercent = Math.round((currentDone / Math.max(1, totalCount)) * 100);

      currentSession = {
        ...currentSession,
        status: "running",
        phase: "downloading",
        currentLectureIndex: i + 1,
        currentLectureTitle: item.title,
        currentStage: echoAudioOnly
          ? `Pulling transcript & .m4a audio for ${item.title}...`
          : `Pulling transcript for ${item.title}...`,
        progressPercent,
        updatedAt: new Date().toISOString(),
        lectures: currentSession.lectures.map((l, idx) =>
          idx === i
            ? {
                ...l,
                status: "pulling",
                progressPercent: 35,
                progressStage: echoAudioOnly
                  ? "Fetching transcript & streaming .m4a audio..."
                  : "Fetching Echo360 transcript..."
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
            sectionId: item.sectionId,
            streamUrl: item.streamUrl,
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
        if (res.ok && data.mediaReady === false) {
          const warnMsg =
            data.warning ||
            "0 Echo360 VTT cues & audio unavailable — drop .m4a or .vtt manually";
          currentSession = {
            ...currentSession,
            errorCount: currentSession.errorCount + 1,
            lastError: warnMsg,
            currentStage: `No media for ${item.title}: ${warnMsg}`,
            updatedAt: new Date().toISOString(),
            lectures: currentSession.lectures.map((l, idx) =>
              idx === i
                ? {
                    ...l,
                    status: "error",
                    error: warnMsg,
                    needsMedia: true,
                    hasTranscript: Boolean(data.hasTranscript),
                    audioDownloaded: Boolean(data.audioDownloaded),
                    transcriptCueCount: data.cueCount || 0,
                    ffmpegAvailable: data.ffmpegAvailable,
                    progressPercent: 0,
                    progressStage: warnMsg
                  }
                : l
            )
          };
          setSession(currentSession);
          saveSessionToStorage(currentSession);
        } else if (res.ok) {
          const newDone = currentSession.lectures.filter(
            (l, idx) => l.selected && (idx === i || l.status === "media_ready")
          ).length;
          const newPercent = Math.round((newDone / Math.max(1, totalCount)) * 100);
          const readyLabel =
            data.audioDownloaded && data.cueCount > 0
              ? `Transcript (${data.cueCount} cues) + .m4a ready`
              : data.cueCount > 0
              ? `Transcript (${data.cueCount} cues) ready`
              : "Audio .m4a ready";

          currentSession = {
            ...currentSession,
            completedCount: newDone,
            progressPercent: newPercent,
            currentStage: `${readyLabel} for ${item.title}`,
            updatedAt: new Date().toISOString(),
            lectures: currentSession.lectures.map((l, idx) =>
              idx === i
                ? {
                    ...l,
                    status: "media_ready",
                    error: undefined,
                    audioWarning: data.warning,
                    needsMedia: false,
                    hasTranscript: Boolean(data.hasTranscript || data.cueCount > 0),
                    audioDownloaded: Boolean(data.audioDownloaded),
                    transcriptCueCount: data.cueCount ?? l.transcriptCueCount,
                    ffmpegAvailable: data.ffmpegAvailable,
                    progressPercent: 100,
                    progressStage: readyLabel
                  }
                : l
            )
          };
          setSession(currentSession);
          saveSessionToStorage(currentSession);
          notifySubscribers(data.resolvedMediaId || item.mediaId || item.lessonId);
        } else {
          const dlErr = data.error || "Media download failed";
          currentSession = {
            ...currentSession,
            errorCount: currentSession.errorCount + 1,
            lastError: dlErr,
            currentStage: `Download error on ${item.title}`,
            updatedAt: new Date().toISOString(),
            lectures: currentSession.lectures.map((l, idx) =>
              idx === i
                ? {
                    ...l,
                    status: "error",
                    error: dlErr,
                    progressPercent: 0,
                    progressStage: dlErr
                  }
                : l
            )
          };
          setSession(currentSession);
          saveSessionToStorage(currentSession);
        }
      } catch (err: unknown) {
        const netErr = err instanceof Error ? err.message : "Network error";
        currentSession = {
          ...currentSession,
          errorCount: currentSession.errorCount + 1,
          lastError: netErr,
          currentStage: `Network error downloading ${item.title}`,
          updatedAt: new Date().toISOString(),
          lectures: currentSession.lectures.map((l, idx) =>
            idx === i
              ? {
                  ...l,
                  status: "error",
                  error: netErr,
                  progressPercent: 0,
                  progressStage: netErr
                }
              : l
          )
        };
        setSession(currentSession);
        saveSessionToStorage(currentSession);
      }
    }

    if (!isCancelledRef.current) {
      const finalDone = currentSession.lectures.filter((l) => l.selected && l.status === "media_ready").length;
      const isAllDone = finalDone >= totalCount;

      currentSession = {
        ...currentSession,
        status: isAllDone ? "completed" : "paused",
        phase: "idle",
        progressPercent: isAllDone ? 100 : currentSession.progressPercent,
        currentStage: isAllDone
          ? `All ${totalCount} lecture media item(s) downloaded!`
          : `Download paused (${finalDone}/${totalCount} ready).`,
        updatedAt: new Date().toISOString()
      };
      setSession(currentSession);
      saveSessionToStorage(currentSession);
    }

    setIsRunning(false);
  };

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
      echoAudioOnly,
      phase: "downloading",
      status: "running",
      currentLectureIndex: 1,
      currentLectureTitle: selected[0]?.title || "",
      currentStage: "Starting media downloads...",
      progressPercent: 0,
      completedCount: selected.filter((l) => l.status === "media_ready").length,
      totalCount: selected.length,
      errorCount: 0
    };

    setSession(newSession);
    saveSessionToStorage(newSession);
    setHasIncompleteSession(false);
    setInterruptedSession(null);

    await runDownloadLoop(newSession);
  };

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
        currentStage: "Resuming media downloads..."
      };
      setSession(updated);
      saveSessionToStorage(updated);
    }
  };

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
        phase: "idle",
        currentStage: "Cancelled"
      };
      setSession(updated);
      saveSessionToStorage(updated);
    }
  };

  const resumeInterruptedSession = async () => {
    if (!interruptedSession) return;
    setHasIncompleteSession(false);
    const targetSession: IngestSession = {
      ...interruptedSession,
      phase: "downloading",
      status: "running"
    };
    setSession(targetSession);
    saveSessionToStorage(targetSession);
    setInterruptedSession(null);

    await runDownloadLoop(targetSession);
  };

  const dismissInterruptedSession = () => {
    setHasIncompleteSession(false);
    setInterruptedSession(null);
    saveSessionToStorage(null);
    setSession(null);
  };

  const retryFailedItems = async () => {
    const active = sessionRef.current || interruptedSession;
    if (!active || isRunning) return;

    const hasFailed = active.lectures.some((l) => l.status === "error");
    if (!hasFailed) return;

    const resetLectures = active.lectures.map((l) =>
      l.status === "error"
        ? {
            ...l,
            selected: true,
            status: "queued" as const,
            error: undefined,
            progressPercent: 0,
            progressStage: "Retrying..."
          }
        : l
    );

    const retrySession: IngestSession = {
      ...active,
      phase: "downloading",
      status: "running",
      errorCount: 0,
      lastError: undefined,
      updatedAt: new Date().toISOString(),
      currentStage: "Retrying failed media downloads...",
      lectures: resetLectures
    };

    setSession(retrySession);
    saveSessionToStorage(retrySession);
    setHasIncompleteSession(false);
    setInterruptedSession(null);

    await runDownloadLoop(retrySession);
  };

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
        pauseQueue,
        resumeQueue,
        cancelQueue,
        resumeInterruptedSession,
        dismissInterruptedSession,
        clearSession,
        retryFailedItems,
        subscribeToMediaUpdates
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
