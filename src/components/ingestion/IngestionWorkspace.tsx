"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  Key,
  Link2,
  Upload,
  FileText,
  Volume2,
  Play,
  Pause,
  X,
  RotateCcw,
  Download,
  ChevronDown,
  ChevronUp,
  Search,
  Trash2,
  Plus,
  Eye,
  GraduationCap,
  FolderSync
} from "lucide-react";
import {
  useBackgroundIngest,
  IngestLectureItem
} from "@/context/BackgroundIngestContext";
import { CourseMeta, UNSWCourseOutline } from "@/lib/types";
import { getCourseCatalog, setActiveCourseId } from "@/lib/pack-loader";
import {
  RawInspectorPanel,
  RawAudioSummary,
  RawTranscriptSummary,
  WeekCoverageInfo
} from "./RawInspectorPanel";

interface VaultSessionItem {
  id: string;
  courseCode: string;
  courseTitle: string;
  term?: string | null;
  sectionId?: string | null;
  sectionUrl?: string | null;
  userEmail?: string | null;
  savedAt: string;
  cookieHeader: string;
}

interface EchoSessionStatus {
  hasSession: boolean;
  isEphemeral?: boolean;
  cookieCount: number;
  lastUpdated?: string | null;
  courseCode?: string | null;
  courseTitle?: string | null;
  term?: string | null;
  sectionId?: string | null;
  sectionUrl?: string | null;
  userEmail?: string | null;
  vault?: VaultSessionItem[];
}

interface CourseMaterialItem {
  id: string;
  originalName: string;
  savedFileName: string;
  relativePath: string;
  category: string;
  categoryName: string;
  week: number | "all";
  size: number;
  extractedPath?: string;
  extractedChars?: number;
}

interface CoverageData {
  totalCourseItems: number;
  globalChars: number;
  byWeek: Record<number, WeekCoverageInfo>;
  insufficientWeeks: number[];
}

interface ServerLectureRow extends Omit<IngestLectureItem, "status" | "selected"> {
  status?: string;
  selected?: boolean;
}

function mapServerStatusToMediaStatus(
  rawStatus?: string,
  hasTranscript?: boolean,
  audioDownloaded?: boolean
): IngestLectureItem["status"] {
  if (rawStatus === "pulling") return "pulling";
  if (rawStatus === "error") return "error";
  if (rawStatus === "media_ready" || rawStatus === "done" || hasTranscript || audioDownloaded) {
    return "media_ready";
  }
  return "queued";
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getEchoAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const headers: Record<string, string> = {};
  const cookie = sessionStorage.getItem("cn_echo_session_cookie");
  const url = sessionStorage.getItem("cn_echo_session_url");
  const code = sessionStorage.getItem("cn_echo_session_course");
  if (cookie) headers["x-echo-cookie"] = cookie;
  if (url) headers["x-echo-section-url"] = url;
  if (code) headers["x-echo-course-code"] = code;
  return headers;
}

export function IngestionWorkspace() {
  const searchParams = useSearchParams();
  const {
    session,
    isRunning,
    isPaused,
    pauseQueue,
    resumeQueue,
    cancelQueue,
    clearSession,
    startBatchDownload,
    retryFailedItems,
    subscribeToMediaUpdates
  } = useBackgroundIngest();

  // Active course state
  const [courseId, setCourseId] = useState<string>("sample1001");
  const [courses, setCourses] = useState<CourseMeta[]>([]);
  const [activeCourseMeta, setActiveCourseMeta] = useState<CourseMeta | null>(null);

  // Echo360 session & vault state
  const [echoSessionStatus, setEchoSessionStatus] = useState<EchoSessionStatus | null>(null);
  const [echoSessionChecking, setEchoSessionChecking] = useState(false);
  const [showSessionSetup, setShowSessionSetup] = useState(false);
  const [pastedCookieString, setPastedCookieString] = useState("");
  const [persistCookieToDisk, setPersistCookieToDisk] = useState(false);
  const [savingSession, setSavingSession] = useState(false);
  const [vaultSessions, setVaultSessions] = useState<VaultSessionItem[]>([]);
  const [vaultDropdownOpen, setVaultDropdownOpen] = useState(false);

  // Discovery & UNSW outline state
  const [sectionUrl, setSectionUrl] = useState("");
  const [discoveringSection, setDiscoveringSection] = useState(false);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);
  const [discoveredLectures, setDiscoveredLectures] = useState<IngestLectureItem[]>([]);
  const [courseOutline, setCourseOutline] = useState<UNSWCourseOutline | null>(null);
  const [detectedYear, setDetectedYear] = useState<string>("2026");
  const [detectedTerm, setDetectedTerm] = useState<string>("Term 1");
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [availableTerms, setAvailableTerms] = useState<string[]>([]);
  const [loadingOutline, setLoadingOutline] = useState(false);
  const [creatingCourse, setCreatingCourse] = useState(false);
  const [outlineNotice, setOutlineNotice] = useState<string | null>(null);

  // Single recording quick pull
  const [showQuickPull, setShowQuickPull] = useState(false);
  const [quickPullUrl, setQuickPullUrl] = useState("");
  const [quickPullWeek, setQuickPullWeek] = useState(1);
  const [quickPullTitle, setQuickPullTitle] = useState("");
  const [quickPulling, setQuickPulling] = useState(false);
  const [quickPullResult, setQuickPullResult] = useState<string | null>(null);

  // Queue & manual media drop
  const [downloadAudio, setDownloadAudio] = useState(true);
  const [ffmpegAvailable, setFfmpegAvailable] = useState<boolean | null>(null);
  const [syncingDisk, setSyncingDisk] = useState(false);
  const [pullingSingleId, setPullingSingleId] = useState<string | null>(null);
  const [uploadingMediaId, setUploadingMediaId] = useState<string | null>(null);
  const [queueMessage, setQueueMessage] = useState<string | null>(null);

  // Course materials state
  const [materialItems, setMaterialItems] = useState<CourseMaterialItem[]>([]);
  const [coverage, setCoverage] = useState<CoverageData | null>(null);
  const [uploadCategory, setUploadCategory] = useState("slides");
  const [uploadWeek, setUploadWeek] = useState<number | "all">("all");
  const [uploadingMaterials, setUploadingMaterials] = useState(false);
  const [reextracting, setReextracting] = useState(false);
  const [materialMessage, setMaterialMessage] = useState<string | null>(null);

  // Raw inspector state
  const [rawTranscripts, setRawTranscripts] = useState<RawTranscriptSummary[]>([]);
  const [rawAudioFiles, setRawAudioFiles] = useState<RawAudioSummary[]>([]);
  const [loadingRaw, setLoadingRaw] = useState(false);
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [extractedPreview, setExtractedPreview] = useState<{
    filename: string;
    content: string;
    chars: number;
  } | null>(null);

  const hydratedCourseRef = useRef<string | null>(null);
  const latestLecturesRef = useRef<IngestLectureItem[]>(discoveredLectures);
  useEffect(() => {
    latestLecturesRef.current = discoveredLectures;
  }, [discoveredLectures]);

  // Load local course list
  const loadCourses = useCallback(async (preferredId?: string) => {
    let list: CourseMeta[] = [];
    try {
      const res = await fetch("/api/courses", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as CourseMeta[];
        if (Array.isArray(data)) list = data;
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
          term: c.term,
          institution: c.institution,
          logoSymbol: c.logoSymbol
        }));
      } catch {
        list = [];
      }
    }

    setCourses(list);

    const targetId =
      preferredId ||
      searchParams.get("course") ||
      (typeof window !== "undefined" ? localStorage.getItem("math_active_course") : null) ||
      list[0]?.id ||
      "sample1001";

    const matched =
      list.find((c) => c.id.toLowerCase() === targetId.toLowerCase()) ||
      list.find((c) => c.code.toLowerCase() === targetId.toLowerCase());

    const resolvedId = (matched?.id || targetId).toLowerCase();
    setCourseId(resolvedId);
    setActiveCourseMeta(matched || null);
    setActiveCourseId(resolvedId);
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
  }, [loadCourses]);

  useEffect(() => {
    const handleCourseSwitch = (e: Event) => {
      const detail = (e as CustomEvent<{ courseId?: string }>).detail;
      if (detail?.courseId) {
        loadCourses(detail.courseId);
      }
    };
    window.addEventListener("cn_active_course_change", handleCourseSwitch);
    return () => window.removeEventListener("cn_active_course_change", handleCourseSwitch);
  }, [loadCourses]);

  // Sync raw files on disk
  const fetchRawMedia = useCallback(async (targetCourse: string) => {
    if (!targetCourse) return;
    setLoadingRaw(true);
    try {
      const res = await fetch(`/api/lectures/raw?course=${encodeURIComponent(targetCourse)}`, {
        cache: "no-store"
      });
      if (res.ok) {
        const data = await res.json();
        setRawTranscripts(Array.isArray(data.transcripts) ? data.transcripts : []);
        setRawAudioFiles(Array.isArray(data.audioFiles) ? data.audioFiles : []);
      }
    } catch {
      // ignore transient errors
    } finally {
      setLoadingRaw(false);
    }
  }, []);

  // Sync course materials & per-week coverage
  const fetchCourseMaterials = useCallback(
    async (targetCourse: string, lessonsForWeeks: IngestLectureItem[] = latestLecturesRef.current) => {
      if (!targetCourse) return;
      try {
        const weeks = Array.from(
          new Set(lessonsForWeeks.map((l) => l.week || 1).concat([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]))
        ).sort((a, b) => a - b);

        const res = await fetch(
          `/api/courses/content?course=${encodeURIComponent(targetCourse)}&checkWeeks=${weeks.join(",")}`,
          { cache: "no-store" }
        );
        if (res.ok) {
          const data = await res.json();
          setMaterialItems(Array.isArray(data.manifest?.items) ? data.manifest.items : []);
          setCoverage(data.coverage || null);
        }
      } catch {
        // ignore transient errors
      }
    },
    []
  );

  // Sync lecture queue disk status
  const syncDiskStatus = useCallback(
    async (targetCourse: string = courseId, targetLessons?: IngestLectureItem[]) => {
      if (!targetCourse) return;
      const lessonsToCheck = targetLessons ?? latestLecturesRef.current;
      setSyncingDisk(true);
      try {
        await Promise.all([
          fetchCourseMaterials(targetCourse, lessonsToCheck),
          fetchRawMedia(targetCourse)
        ]);

        const res = await fetch("/api/lectures/echo360", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "pipeline-status",
            courseId: targetCourse,
            lessons: lessonsToCheck
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (typeof data.ffmpegAvailable === "boolean") {
            setFfmpegAvailable(data.ffmpegAvailable);
          }
          if (Array.isArray(data.lectures) && data.lectures.length > 0) {
            const diskRows = data.lectures as ServerLectureRow[];
            const byLessonId = new Map<string, ServerLectureRow>(
              diskRows.map((l) => [l.lessonId, l])
            );
            setDiscoveredLectures((prev) =>
              prev.map((l) => {
                const disk = byLessonId.get(l.lessonId);
                if (!disk) return l;
                const mappedStatus =
                  l.status === "pulling"
                    ? "pulling"
                    : mapServerStatusToMediaStatus(disk.status, disk.hasTranscript, disk.audioDownloaded);
                return {
                  ...l,
                  ...disk,
                  status: mappedStatus,
                  hasVideo: l.hasVideo ?? disk.hasVideo,
                  streamUrl: l.streamUrl ?? disk.streamUrl,
                  sectionId: l.sectionId ?? disk.sectionId,
                  groupName: l.groupName ?? disk.groupName,
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
    [courseId, fetchCourseMaterials, fetchRawMedia]
  );

  // Check Echo360 session status
  const checkEchoSession = useCallback(async () => {
    setEchoSessionChecking(true);
    try {
      const res = await fetch("/api/lectures/echo360", {
        headers: getEchoAuthHeaders()
      });
      if (res.ok) {
        const data: EchoSessionStatus = await res.json();
        if (data.sectionUrl && typeof window !== "undefined") {
          sessionStorage.setItem("cn_echo_session_url", data.sectionUrl);
        }
        setEchoSessionStatus(data);
        if (Array.isArray(data.vault)) {
          setVaultSessions(data.vault);
        }
      }
    } catch {
      // ignore
    } finally {
      setEchoSessionChecking(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) {
        void checkEchoSession();
      }
    });
    return () => {
      cancelled = true;
    };
  }, [checkEchoSession]);

  // Hydrate course-specific localStorage state and sync disk when courseId changes
  useEffect(() => {
    if (!courseId) return;
    let cancelled = false;

    Promise.resolve().then(() => {
      if (cancelled) return;
      hydratedCourseRef.current = courseId;
      setDiscoveryError(null);
      setOutlineNotice(null);
      setExtractedPreview(null);
      setSelectedMediaId(null);

      let initialLessons: IngestLectureItem[] = [];
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem(`cn_discovered_lectures_${courseId.toLowerCase()}`);
          if (raw) {
            const parsed = JSON.parse(raw) as unknown;
            if (Array.isArray(parsed)) {
              initialLessons = (parsed as ServerLectureRow[]).map((l) => ({
                ...l,
                selected: Boolean(l.selected),
                status: mapServerStatusToMediaStatus(l.status, l.hasTranscript, l.audioDownloaded)
              }));
            }
          }
        } catch {}
      }

      setDiscoveredLectures(initialLessons);
      if (activeCourseMeta?.echo360SectionUrl) {
        setSectionUrl(activeCourseMeta.echo360SectionUrl);
      }
      void syncDiskStatus(courseId, initialLessons);
    });

    return () => {
      cancelled = true;
    };
  }, [courseId, activeCourseMeta?.echo360SectionUrl, syncDiskStatus]);

  // Persist discovered lectures to localStorage
  useEffect(() => {
    if (!courseId || hydratedCourseRef.current !== courseId) return;
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(
        `cn_discovered_lectures_${courseId.toLowerCase()}`,
        JSON.stringify(discoveredLectures)
      );
    } catch {}
  }, [courseId, discoveredLectures]);

  // Subscribe to background download updates
  useEffect(() => {
    const unsub = subscribeToMediaUpdates((mediaId) => {
      syncDiskStatus(courseId);
      if (mediaId) {
        setSelectedMediaId(mediaId);
      }
    });
    return unsub;
  }, [courseId, subscribeToMediaUpdates, syncDiskStatus]);

  // Echo360 session handlers
  const handleSaveEchoSession = async () => {
    if (!pastedCookieString.trim()) return;
    setSavingSession(true);
    setDiscoveryError(null);
    try {
      const res = await fetch("/api/lectures/echo360", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save-session",
          cookieString: pastedCookieString.trim(),
          persistToDisk: persistCookieToDisk
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save session");

      if (typeof window !== "undefined") {
        if (data.cookieHeader) sessionStorage.setItem("cn_echo_session_cookie", data.cookieHeader);
        if (data.sectionUrl) sessionStorage.setItem("cn_echo_session_url", data.sectionUrl);
        if (data.courseCode) sessionStorage.setItem("cn_echo_session_course", data.courseCode);
      }

      await checkEchoSession();
      setShowSessionSetup(false);
      setPastedCookieString("");
      setPersistCookieToDisk(false);

      const target = data.sectionUrl || data.courseCode;
      if (target) {
        setSectionUrl(target);
      }
    } catch (err: unknown) {
      setDiscoveryError(err instanceof Error ? err.message : "Failed to save session");
    } finally {
      setSavingSession(false);
    }
  };

  const handleSwitchVaultSession = (item: VaultSessionItem) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("cn_echo_session_cookie", item.cookieHeader);
      if (item.sectionUrl) sessionStorage.setItem("cn_echo_session_url", item.sectionUrl);
      if (item.courseCode) sessionStorage.setItem("cn_echo_session_course", item.courseCode);
    }
    setVaultDropdownOpen(false);
    const target =
      item.sectionUrl ||
      (item.sectionId ? `https://echo360.net.au/section/${item.sectionId}/home` : item.courseCode);
    setSectionUrl(target);
    setEchoSessionStatus((prev) => ({
      ...(prev || { cookieCount: 0 }),
      hasSession: true,
      cookieCount: (item.cookieHeader || "").split(";").filter((c) => c.trim()).length,
      courseCode: item.courseCode,
      courseTitle: item.courseTitle,
      term: item.term,
      sectionId: item.sectionId,
      sectionUrl: target,
      userEmail: item.userEmail,
      lastUpdated: item.savedAt
    }));
  };

  const handleDeleteVaultItem = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const res = await fetch("/api/lectures/echo360", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete-vault-item", id })
      });
      if (res.ok) {
        const data = await res.json();
        setVaultSessions(data.vault || []);
      }
    } catch {}
  };

  const handleClearEchoSession = async () => {
    try {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("cn_echo_session_cookie");
        sessionStorage.removeItem("cn_echo_session_url");
        sessionStorage.removeItem("cn_echo_session_course");
      }
      await fetch("/api/lectures/echo360", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear-session" })
      });
      setEchoSessionStatus({ hasSession: false, cookieCount: 0 });
      setVaultSessions([]);
    } catch {}
  };

  // Discover section + UNSW outline
  const handleDiscoverLectures = async (overrideInput?: string) => {
    const input = (overrideInput ?? sectionUrl).trim() || courseId.toUpperCase();
    setDiscoveringSection(true);
    setDiscoveryError(null);
    setOutlineNotice(null);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...getEchoAuthHeaders()
      };
      const ephemeralCookie =
        typeof window !== "undefined" ? sessionStorage.getItem("cn_echo_session_cookie") : null;

      const res = await fetch("/api/lectures/echo360", {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "discover-section",
          courseId,
          sectionUrl: input,
          cookieHeader: ephemeralCookie || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Discovery failed for "${input}".`);
      }

      if (data.courseOutline) {
        setCourseOutline(data.courseOutline);
      } else {
        setCourseOutline(null);
      }

      if (data.sectionUrl && typeof window !== "undefined") {
        sessionStorage.setItem("cn_echo_session_url", data.sectionUrl);
        setSectionUrl(data.sectionUrl);
      }

      if (data.detectedYear) setDetectedYear(String(data.detectedYear));
      if (data.detectedTerm) setDetectedTerm(String(data.detectedTerm));
      setAvailableYears(
        Array.isArray(data.availableYears) && data.availableYears.length > 0
          ? data.availableYears
          : data.detectedYear
          ? [String(data.detectedYear)]
          : []
      );
      setAvailableTerms(
        Array.isArray(data.availableTerms) && data.availableTerms.length > 0
          ? data.availableTerms
          : data.detectedTerm
          ? [String(data.detectedTerm)]
          : []
      );

      const discoveredCode = (data.courseId || courseId).toLowerCase();
      if (discoveredCode && discoveredCode !== courseId.toLowerCase()) {
        setCourseId(discoveredCode);
        setActiveCourseId(discoveredCode);
        window.dispatchEvent(
          new CustomEvent("cn_active_course_change", { detail: { courseId: discoveredCode } })
        );
      }

      const rawLectures: ServerLectureRow[] = Array.isArray(data.lectures)
        ? (data.lectures as ServerLectureRow[])
        : [];
      const mapped: IngestLectureItem[] = rawLectures.map((l) => {
        const status = mapServerStatusToMediaStatus(l.status, l.hasTranscript, l.audioDownloaded);
        return {
          ...l,
          status,
          selected: !(l.hasTranscript && l.audioDownloaded)
        };
      });

      setDiscoveredLectures(mapped);
      if (data.message) {
        setOutlineNotice(data.message);
      }
      await syncDiskStatus(discoveredCode, mapped);
    } catch (err: unknown) {
      setDiscoveryError(err instanceof Error ? err.message : "Discovery failed");
    } finally {
      setDiscoveringSection(false);
    }
  };

  const applyOutlineScheduleToLectures = (outline: UNSWCourseOutline) => {
    const scheduleLectures = (outline.schedule || []).filter((s) => s.type === "Lecture");
    setDiscoveredLectures((prev) =>
      prev.map((l) => {
        const match = scheduleLectures.find((s) => s.week === l.week);
        if (!match) return l;
        return {
          ...l,
          outlineTopic: match.topic,
          outlineDescription: match.description,
          outlineDateRange: match.dateRange
        };
      })
    );
  };

  const handleChangeOutlineYear = async (newYear: string) => {
    setLoadingOutline(true);
    try {
      const cleanCode = (courseOutline?.courseCode || courseId).toUpperCase().replace(/[^A-Z0-9]/g, "");
      const res = await fetch(
        `/api/courses/outline?courseCode=${encodeURIComponent(cleanCode)}&year=${encodeURIComponent(newYear)}&term=${encodeURIComponent(detectedTerm)}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.outline) {
          setCourseOutline(data.outline);
          setDetectedYear(newYear);
          if (Array.isArray(data.availableTerms) && data.availableTerms.length > 0) {
            setAvailableTerms(data.availableTerms);
            if (!data.availableTerms.includes(detectedTerm)) {
              setDetectedTerm(data.availableTerms[0]);
            }
          }
          applyOutlineScheduleToLectures(data.outline);
        }
      }
    } finally {
      setLoadingOutline(false);
    }
  };

  const handleChangeOutlineTerm = async (newTerm: string) => {
    setLoadingOutline(true);
    try {
      const cleanCode = (courseOutline?.courseCode || courseId).toUpperCase().replace(/[^A-Z0-9]/g, "");
      const res = await fetch(
        `/api/courses/outline?courseCode=${encodeURIComponent(cleanCode)}&year=${encodeURIComponent(detectedYear)}&term=${encodeURIComponent(newTerm)}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.outline) {
          setCourseOutline(data.outline);
          setDetectedTerm(newTerm);
          applyOutlineScheduleToLectures(data.outline);
        }
      }
    } finally {
      setLoadingOutline(false);
    }
  };

  const handleCreateCourseFromOutline = async () => {
    if (!courseOutline) return;
    setCreatingCourse(true);
    setDiscoveryError(null);
    setOutlineNotice(null);

    const cleanCode = courseOutline.courseCode.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const cleanId = cleanCode.toLowerCase();

    try {
      const payload: CourseMeta = {
        id: cleanId,
        code: cleanCode,
        name: courseOutline.courseName || cleanCode,
        term: `${detectedTerm}, ${detectedYear}`,
        institution: courseOutline.school || courseOutline.faculty || "UNSW",
        echo360SectionUrl: sectionUrl.startsWith("http") ? sectionUrl : undefined,
        logoSymbol: "📚",
        description: courseOutline.courseSummary?.slice(0, 280) || `${courseOutline.courseName} (${cleanCode})`
      };

      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create course folder");

      await loadCourses(cleanId);
      window.dispatchEvent(new CustomEvent("cn_active_course_change", { detail: { courseId: cleanId } }));
      setOutlineNotice(`Created local course folder for ${cleanCode}.`);
    } catch (err: unknown) {
      setDiscoveryError(err instanceof Error ? err.message : "Failed to create course");
    } finally {
      setCreatingCourse(false);
    }
  };

  // Single lecture quick pull
  const handleQuickPull = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPullUrl.trim()) return;
    setQuickPulling(true);
    setQuickPullResult(null);
    setDiscoveryError(null);

    try {
      const ephemeralCookie =
        typeof window !== "undefined" ? sessionStorage.getItem("cn_echo_session_cookie") : null;
      const res = await fetch("/api/lectures/echo360", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getEchoAuthHeaders()
        },
        body: JSON.stringify({
          action: "pull",
          courseId,
          url: quickPullUrl.trim(),
          downloadAudio,
          week: quickPullWeek,
          title: quickPullTitle.trim(),
          cookieHeader: ephemeralCookie || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Single recording pull failed");

      setQuickPullResult(data.message || "Pulled raw transcript/media to disk.");
      setQuickPullUrl("");
      await syncDiskStatus(courseId);
      if (data.mediaId) {
        setSelectedMediaId(data.mediaId);
      }
    } catch (err: unknown) {
      setDiscoveryError(err instanceof Error ? err.message : "Single recording pull failed");
    } finally {
      setQuickPulling(false);
    }
  };

  // Queue handlers
  const handlePullSingleRow = async (item: IngestLectureItem) => {
    setPullingSingleId(item.lessonId);
    setQueueMessage(null);
    setDiscoveredLectures((prev) =>
      prev.map((l) => (l.lessonId === item.lessonId ? { ...l, status: "pulling", error: undefined } : l))
    );

    try {
      const ephemeralCookie =
        typeof window !== "undefined" ? sessionStorage.getItem("cn_echo_session_cookie") : null;
      const res = await fetch("/api/lectures/echo360", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getEchoAuthHeaders()
        },
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
          downloadAudio,
          outlineTopic: item.outlineTopic,
          outlineDescription: item.outlineDescription,
          cookieHeader: ephemeralCookie || undefined
        })
      });

      const data = await res.json();
      if (!res.ok || data.mediaReady === false) {
        const msg = data.warning || data.error || "Media unavailable";
        setDiscoveredLectures((prev) =>
          prev.map((l) =>
            l.lessonId === item.lessonId
              ? { ...l, status: "error", error: msg, needsMedia: true, progressStage: msg }
              : l
          )
        );
        setQueueMessage(msg);
      } else {
        setDiscoveredLectures((prev) =>
          prev.map((l) =>
            l.lessonId === item.lessonId
              ? {
                  ...l,
                  status: "media_ready",
                  error: undefined,
                  audioWarning: data.warning,
                  needsMedia: false,
                  hasTranscript: Boolean(data.hasTranscript || data.cueCount > 0),
                  audioDownloaded: Boolean(data.audioDownloaded),
                  transcriptCueCount: data.cueCount ?? l.transcriptCueCount
                }
              : l
          )
        );
        setQueueMessage(data.message || `Downloaded media for ${item.title}`);
        await syncDiskStatus(courseId);
        setSelectedMediaId(data.resolvedMediaId || item.mediaId || item.lessonId);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Download failed";
      setDiscoveredLectures((prev) =>
        prev.map((l) =>
          l.lessonId === item.lessonId ? { ...l, status: "error", error: msg } : l
        )
      );
      setQueueMessage(msg);
    } finally {
      setPullingSingleId(null);
    }
  };

  const handleManualMediaUpload = async (item: IngestLectureItem, files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingMediaId(item.lessonId);
    setQueueMessage(null);
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
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setDiscoveredLectures((prev) =>
        prev.map((l) =>
          l.lessonId === item.lessonId
            ? {
                ...l,
                status: "media_ready",
                error: undefined,
                needsMedia: false,
                hasTranscript: data.kind === "transcript" ? true : l.hasTranscript,
                audioDownloaded: data.kind === "audio" ? true : l.audioDownloaded,
                transcriptCueCount: data.cueCount ?? l.transcriptCueCount
              }
            : l
        )
      );
      setQueueMessage(`Attached ${files[0].name} to ${item.title}.`);
      await syncDiskStatus(courseId);
      setSelectedMediaId(item.mediaId || item.lessonId);
    } catch (err: unknown) {
      setQueueMessage(err instanceof Error ? err.message : "Manual upload failed");
    } finally {
      setUploadingMediaId(null);
    }
  };

  // Course materials handlers
  const handleUploadMaterials = async (files: FileList | null) => {
    if (!files || files.length === 0 || !courseId) return;
    setUploadingMaterials(true);
    setMaterialMessage(null);
    let uploaded = 0;

    try {
      const categoryLabel =
        uploadCategory === "slides"
          ? "Lecture Slides"
          : uploadCategory === "problem_sheets"
          ? "Problem Sheet"
          : uploadCategory === "course_notes"
          ? "Course Notes"
          : uploadCategory === "past_papers"
          ? "Past Papers"
          : "Other Material";

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

      await fetchCourseMaterials(courseId);
      setMaterialMessage(`Uploaded and extracted ${uploaded}/${files.length} file(s).`);
    } catch (err: unknown) {
      setMaterialMessage(err instanceof Error ? err.message : "Material upload failed");
    } finally {
      setUploadingMaterials(false);
    }
  };

  const handleReextractAll = async () => {
    if (!courseId) return;
    setReextracting(true);
    setMaterialMessage(null);
    try {
      const res = await fetch("/api/courses/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Re-extraction failed");

      await fetchCourseMaterials(courseId);
      setMaterialMessage(
        `Re-extraction complete: ${data.reextracted ?? 0} re-extracted out of ${data.total ?? 0} (${data.failed ?? 0} failed).`
      );
    } catch (err: unknown) {
      setMaterialMessage(err instanceof Error ? err.message : "Re-extraction failed");
    } finally {
      setReextracting(false);
    }
  };

  const handlePreviewExtracted = async (item: CourseMaterialItem) => {
    if (!item.extractedPath) return;
    const filename = item.extractedPath.split("/").pop() || item.extractedPath;
    try {
      const res = await fetch(
        `/api/lectures/raw?course=${encodeURIComponent(courseId)}&extracted=${encodeURIComponent(filename)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load extracted text");
      setExtractedPreview({
        filename: item.originalName,
        content: data.content || "",
        chars: data.chars || 0
      });
      document.getElementById("raw-inspector")?.scrollIntoView({ behavior: "smooth" });
    } catch (err: unknown) {
      setMaterialMessage(err instanceof Error ? err.message : "Failed to load extracted text");
    }
  };

  const courseExistsLocally = courses.some(
    (c) =>
      c.id.toLowerCase() === (courseOutline?.courseCode || courseId).toLowerCase() ||
      c.code.toUpperCase() === (courseOutline?.courseCode || courseId).toUpperCase()
  );

  const activeSessionForCourse =
    session && session.courseId.toLowerCase() === courseId.toLowerCase() ? session : null;
  const selectedCount = discoveredLectures.filter((l) => l.selected).length;
  const sessionFailedCount = activeSessionForCourse
    ? activeSessionForCourse.lectures.filter((l) => l.status === "error").length
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 text-xs font-semibold border border-cyan-500/20 mb-2">
            <Download className="w-3.5 h-3.5" />
            <span>Pre-AI Lecture Ingestion Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {activeCourseMeta?.code || courseId.toUpperCase()} Ingestion Workspace
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            {activeCourseMeta?.name || "Echo360 transcripts, .m4a audio streams, and course PDF text extraction."}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => syncDiskStatus(courseId)}
            disabled={syncingDisk}
            className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
          >
            <FolderSync className={`w-3.5 h-3.5 text-cyan-400 ${syncingDisk ? "animate-spin" : ""}`} />
            <span>Sync Disk</span>
          </button>

          <Link
            href="/courses"
            className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
            <span>Courses</span>
          </Link>
        </div>
      </div>

      {/* SECTION 1: Echo360 Session & Course Discovery */}
      <section className="rounded-2xl bg-zinc-900/70 border border-zinc-800 p-5 sm:p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-indigo-400" />
              <h2 className="text-base sm:text-lg font-bold text-white">
                1. Echo360 Session & Course Discovery
              </h2>
              {echoSessionStatus?.hasSession ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-[10px] font-semibold">
                  Connected ({echoSessionStatus.cookieCount} cookies{echoSessionStatus.isEphemeral ? " • Tab" : ""})
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-amber-950/70 border border-amber-500/40 text-amber-300 text-[10px] font-semibold">
                  {echoSessionChecking ? "Checking..." : "Not Connected"}
                </span>
              )}
            </div>
            {echoSessionStatus?.userEmail && (
              <p className="text-[11px] text-zinc-400">
                Session user: <span className="text-zinc-200 font-mono">{echoSessionStatus.userEmail}</span>
                {echoSessionStatus.courseCode ? ` • Detected ${echoSessionStatus.courseCode}` : ""}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {vaultSessions.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setVaultDropdownOpen((v) => !v)}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Cookie Vault ({vaultSessions.length})</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {vaultDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 rounded-xl bg-zinc-900 border border-zinc-700 shadow-2xl p-2 z-30 space-y-1">
                    {vaultSessions.map((v) => (
                      <div
                        key={v.id}
                        onClick={() => handleSwitchVaultSession(v)}
                        className="p-2 rounded-lg hover:bg-zinc-800 flex items-center justify-between gap-2 cursor-pointer text-xs"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-zinc-100">{v.courseCode}</div>
                          <div className="text-[10px] text-zinc-400 truncate">{v.courseTitle}</div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteVaultItem(e, v.id)}
                          className="p-1 rounded text-zinc-500 hover:text-rose-400 cursor-pointer"
                          title="Delete saved session"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowSessionSetup((v) => !v)}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Key className="w-3.5 h-3.5" />
              <span>{showSessionSetup ? "Hide Cookie Setup" : "Paste Echo360 Cookie / cURL"}</span>
            </button>

            {echoSessionStatus?.hasSession && (
              <button
                type="button"
                onClick={handleClearEchoSession}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-rose-950/60 text-zinc-300 hover:text-rose-300 text-xs font-semibold cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Cookie Paste Panel */}
        {showSessionSetup && (
          <div className="p-4 rounded-xl bg-zinc-950 border border-indigo-500/40 space-y-3">
            <div className="text-xs text-zinc-300">
              In Chrome/Edge DevTools (Network tab on an Echo360 page), right-click any Echo360 request →{" "}
              <strong>Copy as cURL</strong> (or paste JSON cookie array / raw Cookie header):
            </div>
            <textarea
              rows={3}
              value={pastedCookieString}
              onChange={(e) => setPastedCookieString(e.target.value)}
              placeholder='Paste curl "https://echo360.net.au/..." -H "cookie: ..." or raw Cookie header...'
              className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 font-mono focus:outline-none focus:border-indigo-500"
            />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={persistCookieToDisk}
                  onChange={(e) => setPersistCookieToDisk(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-900"
                />
                <span>Save to local Cookie Vault on disk (`.echo360_session/`)</span>
              </label>

              <button
                type="button"
                disabled={savingSession || !pastedCookieString.trim()}
                onClick={handleSaveEchoSession}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
              >
                {savingSession ? "Saving..." : "Connect Session"}
              </button>
            </div>
          </div>
        )}

        {/* Section / Course Code Discovery Bar */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Link2 className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={sectionUrl}
              onChange={(e) => setSectionUrl(e.target.value)}
              placeholder="Paste Echo360 Section URL (https://echo360.net.au/section/.../home) or UNSW code (e.g. MATH3701)"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs sm:text-sm text-zinc-100 font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            type="button"
            disabled={discoveringSection}
            onClick={() => handleDiscoverLectures()}
            className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shrink-0"
          >
            <Search className={`w-4 h-4 ${discoveringSection ? "animate-spin" : ""}`} />
            <span>{discoveringSection ? "Discovering..." : "Discover Lectures & Outline"}</span>
          </button>
        </div>

        {discoveryError && (
          <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-xs text-rose-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{discoveryError}</span>
          </div>
        )}

        {outlineNotice && (
          <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>{outlineNotice}</span>
          </div>
        )}

        {/* UNSW Course Outline Card */}
        {courseOutline && (
          <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-black text-indigo-300">
                  {courseOutline.courseCode}
                </span>
                <span className="text-xs font-semibold text-zinc-100">
                  {courseOutline.courseName}
                </span>
                <span className="text-[11px] text-zinc-500">
                  ({courseOutline.schedule?.filter((s) => s.type === "Lecture").length || 0} lecture weeks mapped)
                </span>
              </div>
              {courseOutline.courseSummary && (
                <p className="text-[11px] text-zinc-400 line-clamp-2 max-w-3xl">
                  {courseOutline.courseSummary}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {availableYears.length > 0 && (
                <select
                  value={detectedYear}
                  disabled={loadingOutline}
                  onChange={(e) => handleChangeOutlineYear(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-zinc-200"
                >
                  {availableYears.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              )}

              {availableTerms.length > 0 && (
                <select
                  value={detectedTerm}
                  disabled={loadingOutline}
                  onChange={(e) => handleChangeOutlineTerm(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-zinc-200"
                >
                  {availableTerms.map((tm) => (
                    <option key={tm} value={tm}>
                      {tm}
                    </option>
                  ))}
                </select>
              )}

              {!courseExistsLocally && (
                <button
                  type="button"
                  disabled={creatingCourse}
                  onClick={handleCreateCourseFromOutline}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{creatingCourse ? "Creating..." : "Create Course Folder"}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Secondary Single Recording Quick Pull */}
        <div className="border-t border-zinc-800/80 pt-3">
          <button
            type="button"
            onClick={() => setShowQuickPull((v) => !v)}
            className="text-xs font-semibold text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5 cursor-pointer"
          >
            {showQuickPull ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>Single Recording Quick Pull (direct lesson URL)</span>
          </button>

          {showQuickPull && (
            <form onSubmit={handleQuickPull} className="mt-3 grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <input
                type="url"
                required
                value={quickPullUrl}
                onChange={(e) => setQuickPullUrl(e.target.value)}
                placeholder="https://echo360.net.au/lesson/..."
                className="sm:col-span-6 p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 font-mono"
              />
              <input
                type="text"
                value={quickPullTitle}
                onChange={(e) => setQuickPullTitle(e.target.value)}
                placeholder="Optional title"
                className="sm:col-span-3 p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
              />
              <input
                type="number"
                min={1}
                max={15}
                value={quickPullWeek}
                onChange={(e) => setQuickPullWeek(Math.max(1, parseInt(e.target.value || "1", 10)))}
                className="sm:col-span-1 p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 font-mono text-center"
                title="Week"
              />
              <button
                type="submit"
                disabled={quickPulling}
                className="sm:col-span-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
              >
                {quickPulling ? "Pulling..." : "Pull Lesson"}
              </button>
              {quickPullResult && (
                <div className="sm:col-span-12 text-xs text-emerald-300">{quickPullResult}</div>
              )}
            </form>
          )}
        </div>
      </section>

      {/* SECTION 2: Lecture Queue, Batch Download & Manual Drop */}
      <section className="rounded-2xl bg-zinc-900/70 border border-zinc-800 p-5 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <h2 className="text-base sm:text-lg font-bold text-white">
                2. Lecture Queue & Media Download
              </h2>
              {ffmpegAvailable !== null && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${
                    ffmpegAvailable
                      ? "bg-emerald-950/60 border-emerald-500/30 text-emerald-300"
                      : "bg-amber-950/60 border-amber-500/30 text-amber-300"
                  }`}
                >
                  {ffmpegAvailable ? "ffmpeg detected (.m4a ready)" : "ffmpeg missing (transcripts only)"}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400">
              Select discovered lectures to pull raw transcripts and <code className="text-zinc-300">.m4a</code> audio, or drop local files directly per row.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={downloadAudio}
                onChange={(e) => setDownloadAudio(e.target.checked)}
              />
              <span>Download .m4a audio</span>
            </label>

            <button
              type="button"
              disabled={discoveredLectures.length === 0 || isRunning || selectedCount === 0}
              onClick={() => startBatchDownload(courseId, discoveredLectures, downloadAudio)}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Pull Selected Media ({selectedCount})</span>
            </button>
          </div>
        </div>

        {/* Inline Active Session Progress */}
        {activeSessionForCourse && (
          <div className="p-4 rounded-xl bg-zinc-950 border border-cyan-500/30 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="font-semibold text-zinc-200 truncate">
                {activeSessionForCourse.currentStage || activeSessionForCourse.currentLectureTitle || "Queue ready"}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono text-zinc-400">
                  {activeSessionForCourse.completedCount}/{activeSessionForCourse.totalCount} (
                  {activeSessionForCourse.progressPercent}%)
                </span>

                {isRunning && !isPaused ? (
                  <button
                    type="button"
                    onClick={pauseQueue}
                    className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-300 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Pause className="w-3 h-3" />
                    <span>Pause</span>
                  </button>
                ) : isPaused ? (
                  <button
                    type="button"
                    onClick={resumeQueue}
                    className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Play className="w-3 h-3" />
                    <span>Resume</span>
                  </button>
                ) : null}

                {!isRunning && sessionFailedCount > 0 && (
                  <button
                    type="button"
                    onClick={retryFailedItems}
                    className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Retry ({sessionFailedCount})</span>
                  </button>
                )}

                {isRunning ? (
                  <button
                    type="button"
                    onClick={cancelQueue}
                    className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-rose-300 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={clearSession}
                    className="p-1 rounded text-zinc-400 hover:text-white cursor-pointer"
                    title="Clear queue bar"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isPaused ? "bg-amber-400" : "bg-gradient-to-r from-cyan-500 to-indigo-500"
                }`}
                style={{ width: `${activeSessionForCourse.progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {queueMessage && (
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200">
            {queueMessage}
          </div>
        )}

        {discoveredLectures.length === 0 ? (
          <div className="p-8 rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40 text-center text-xs text-zinc-500">
            No Echo360 lectures discovered for this course yet. Paste a section URL or course code above to populate the queue.
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setDiscoveredLectures((prev) => prev.map((l) => ({ ...l, selected: true })))}
                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold cursor-pointer"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={() =>
                  setDiscoveredLectures((prev) =>
                    prev.map((l) => ({ ...l, selected: !(l.hasTranscript && l.audioDownloaded) }))
                  )
                }
                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold cursor-pointer"
              >
                Select Missing Media
              </button>
              <button
                type="button"
                onClick={() => setDiscoveredLectures((prev) => prev.map((l) => ({ ...l, selected: false })))}
                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-semibold cursor-pointer"
              >
                Clear
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-zinc-800">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-zinc-950/80 text-[11px] uppercase tracking-wider text-zinc-500">
                  <tr>
                    <th className="p-3 w-10">Pick</th>
                    <th className="p-3 w-20">Week</th>
                    <th className="p-3">Lecture</th>
                    <th className="p-3">Media Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80 bg-zinc-950/30">
                  {discoveredLectures.map((item) => {
                    const isPulling = pullingSingleId === item.lessonId || item.status === "pulling";
                    const isUploading = uploadingMediaId === item.lessonId;

                    return (
                      <tr key={item.lessonId} className="hover:bg-zinc-900/50 transition">
                        <td className="p-3 align-top">
                          <input
                            type="checkbox"
                            checked={item.selected}
                            onChange={() =>
                              setDiscoveredLectures((prev) =>
                                prev.map((l) =>
                                  l.lessonId === item.lessonId ? { ...l, selected: !l.selected } : l
                                )
                              )
                            }
                            className="mt-1 cursor-pointer"
                          />
                        </td>
                        <td className="p-3 align-top">
                          <input
                            type="number"
                            min={1}
                            max={15}
                            value={item.week}
                            onChange={(e) => {
                              const nextWeek = Math.max(1, parseInt(e.target.value || "1", 10));
                              setDiscoveredLectures((prev) =>
                                prev.map((l) =>
                                  l.lessonId === item.lessonId ? { ...l, week: nextWeek } : l
                                )
                              );
                            }}
                            className="w-14 px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-200 font-mono text-center"
                          />
                        </td>
                        <td className="p-3 align-top space-y-1 min-w-[220px]">
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => {
                              const nextTitle = e.target.value;
                              setDiscoveredLectures((prev) =>
                                prev.map((l) =>
                                  l.lessonId === item.lessonId ? { ...l, title: nextTitle } : l
                                )
                              );
                            }}
                            className="w-full px-2 py-1 rounded bg-zinc-900/70 border border-zinc-800 text-zinc-100 font-semibold focus:outline-none focus:border-indigo-500"
                          />
                          {(item.outlineTopic || item.date) && (
                            <div className="text-[11px] text-zinc-400 flex flex-wrap gap-1.5">
                              {item.date && <span className="text-zinc-500">{item.date}</span>}
                              {item.outlineTopic && (
                                <span className="text-indigo-300">• {item.outlineTopic}</span>
                              )}
                            </div>
                          )}
                          {(item.error || item.audioWarning) && (
                            <div className="text-[11px] text-amber-300 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 shrink-0" />
                              <span>{item.error || item.audioWarning}</span>
                            </div>
                          )}
                        </td>
                        <td className="p-3 align-top">
                          <div className="flex flex-wrap gap-1.5">
                            {item.hasTranscript ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-mono text-[10px]">
                                Transcript ({item.transcriptCueCount || 0} cues)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-500 font-mono text-[10px]">
                                No transcript
                              </span>
                            )}

                            {item.audioDownloaded ? (
                              <span className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-mono text-[10px]">
                                .m4a Ready
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-500 font-mono text-[10px]">
                                No .m4a
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 align-top text-right">
                          <div className="flex flex-wrap items-center justify-end gap-1.5">
                            <button
                              type="button"
                              disabled={isPulling}
                              onClick={() => handlePullSingleRow(item)}
                              className="px-2.5 py-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/30 text-cyan-300 font-semibold cursor-pointer disabled:opacity-50"
                            >
                              {isPulling ? "Pulling..." : "Pull"}
                            </button>

                            <label className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold cursor-pointer">
                              <span>{isUploading ? "Uploading..." : "Drop Media"}</span>
                              <input
                                type="file"
                                accept=".vtt,.srt,.txt,.m4a,.mp3,.wav,.aac,.ogg,.mp4"
                                className="hidden"
                                onChange={(e) => {
                                  handleManualMediaUpload(item, e.target.files);
                                  e.target.value = "";
                                }}
                              />
                            </label>

                            {(item.hasTranscript || item.audioDownloaded) && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedMediaId(item.mediaId || item.lessonId);
                                  document.getElementById("raw-inspector")?.scrollIntoView({ behavior: "smooth" });
                                }}
                                className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-300 font-semibold cursor-pointer"
                              >
                                Inspect
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* SECTION 3: Course Materials Upload & Text Extraction */}
      <section className="rounded-2xl bg-zinc-900/70 border border-zinc-800 p-5 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              <h2 className="text-base sm:text-lg font-bold text-white">
                3. Course Materials & PDF Text Extraction
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-[10px] font-mono">
                {materialItems.length} file{materialItems.length === 1 ? "" : "s"}
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Upload slides, tutorial sheets, notes, or <code className="text-zinc-300">.zip</code> bundles; extracted text is stored in{" "}
              <code className="text-zinc-300">raw_files/_extracted/*.txt</code>.
            </p>
          </div>

          <button
            type="button"
            disabled={reextracting || materialItems.length === 0}
            onClick={handleReextractAll}
            className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${reextracting ? "animate-spin" : ""}`} />
            <span>{reextracting ? "Re-extracting..." : "Re-extract All PDFs"}</span>
          </button>
        </div>

        {/* Upload Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <select
            value={uploadCategory}
            onChange={(e) => setUploadCategory(e.target.value)}
            className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200"
          >
            <option value="slides">Lecture Slides</option>
            <option value="problem_sheets">Problem Sheets</option>
            <option value="course_notes">Course Notes</option>
            <option value="past_papers">Past Papers</option>
            <option value="other">Other</option>
          </select>

          <select
            value={String(uploadWeek)}
            onChange={(e) => {
              const val = e.target.value;
              setUploadWeek(val === "all" ? "all" : parseInt(val, 10));
            }}
            className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200"
          >
            <option value="all">Course-wide / Auto-detect Week</option>
            {Array.from({ length: 12 }, (_, idx) => idx + 1).map((w) => (
              <option key={w} value={w}>
                Week {w}
              </option>
            ))}
          </select>

          <label className="flex-1 px-4 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-dashed border-indigo-500/50 text-indigo-200 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition">
            <Upload className="w-4 h-4 text-indigo-400" />
            <span>
              {uploadingMaterials
                ? "Uploading & extracting text..."
                : "Choose PDF, Markdown, LaTeX, Notebook, or .zip Files"}
            </span>
            <input
              type="file"
              multiple
              accept=".pdf,.zip,.md,.txt,.tex,.latex,.docx,.vtt,.srt,.csv,.json,.html,.py,.ipynb"
              className="hidden"
              onChange={(e) => {
                handleUploadMaterials(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        </div>

        {materialMessage && (
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200">
            {materialMessage}
          </div>
        )}

        {/* Per-week coverage pills */}
        {coverage && (
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="text-zinc-500 font-semibold mr-1">Weekly Coverage:</span>
            {Object.entries(coverage.byWeek)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([wk, info]) => (
                <span
                  key={wk}
                  title={`Week ${wk}: ${info.items} item(s), ${info.chars.toLocaleString()} extracted chars`}
                  className={`px-2 py-0.5 rounded-lg border font-mono ${
                    info.isInsufficient
                      ? "bg-zinc-950 border-zinc-800 text-zinc-500"
                      : "bg-emerald-950/50 border-emerald-500/30 text-emerald-300"
                  }`}
                >
                  W{wk}: {(info.chars / 1000).toFixed(1)}k
                </span>
              ))}
          </div>
        )}

        {/* Uploaded Materials Table */}
        {materialItems.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-zinc-950/80 text-[11px] uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="p-3">File</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Week</th>
                  <th className="p-3">Extracted Text</th>
                  <th className="p-3 text-right">Preview</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80 bg-zinc-950/30">
                {materialItems.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-900/50 transition">
                    <td className="p-3 font-medium text-zinc-200">
                      <div>{item.originalName}</div>
                      <div className="text-[10px] font-mono text-zinc-500">{formatBytes(item.size)}</div>
                    </td>
                    <td className="p-3 text-zinc-300">{item.categoryName || item.category}</td>
                    <td className="p-3 font-mono text-zinc-400">
                      {item.week === "all" ? "All" : `W${item.week}`}
                    </td>
                    <td className="p-3 font-mono">
                      {item.extractedChars ? (
                        <span className="text-emerald-300">
                          {item.extractedChars.toLocaleString()} chars
                        </span>
                      ) : (
                        <span className="text-zinc-500">0 chars</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {item.extractedPath ? (
                        <button
                          type="button"
                          onClick={() => handlePreviewExtracted(item)}
                          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-indigo-300 font-semibold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview Text</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-zinc-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* SECTION 4: Raw Ingestion Inspector */}
      <RawInspectorPanel
        courseId={courseId}
        transcripts={rawTranscripts}
        audioFiles={rawAudioFiles}
        discoveredLectures={discoveredLectures}
        coverageByWeek={coverage?.byWeek || {}}
        selectedMediaId={selectedMediaId}
        onSelectMediaId={setSelectedMediaId}
        loadingRaw={loadingRaw}
        onRefreshRaw={() => fetchRawMedia(courseId)}
        extractedPreview={extractedPreview}
        onCloseExtractedPreview={() => setExtractedPreview(null)}
      />
    </div>
  );
}
