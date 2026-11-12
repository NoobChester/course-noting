"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { LectureNote, LectureInsight, Concept, QuestionMeta, UNSWCourseOutline } from "@/lib/types";
import { MathRenderer } from "@/components/math/MathRenderer";
import {
  Mic,
  BookOpen,
  Calendar,
  Sparkles,
  ExternalLink,
  Plus,
  Play,
  Pause,
  Volume2,
  Clock,
  ArrowRight,
  Send,
  AlertTriangle,
  Lightbulb,
  FileText,
  Upload,
  Check,
  ChevronRight,
  Info,
  Terminal,
  Globe,
  HardDrive,
  Headphones,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  FileDown,
  Copy,
  CheckCheck,
  Wand2,
  FolderDown,
  Key,
  Link2,
  RefreshCw,
  ShieldCheck,
  ArrowLeft,
  Layers,
  Trash2,
  FileUp,
  Settings,
  ListOrdered,
  AlertOctagon,
  Save,
  Zap,
  FolderLock
} from "lucide-react";
import { SettingsModal } from "@/components/layout/SettingsModal";
import { useBackgroundIngest, IngestLectureItem } from "@/context/BackgroundIngestContext";
import {
  isLocalStudio,
  getActiveCourseId,
  setActiveCourseId,
  fetchLecturePack,
  loadActiveCourseData,
  getCourseCatalog,
  CourseCatalogItem
} from "@/lib/pack-loader";
import JSZip from "jszip";

export default function LecturesPage() {
  const {
    session,
    isRunning: globalIsRunning,
    startBatchDownload: globalStartBatchDownload,
    startDistillationQueue: globalStartDistillationQueue,
    subscribeToNoteUpdates
  } = useBackgroundIngest();

  const [courseId, setCourseId] = useState<string>("");
  const [availableCourses, setAvailableCourses] = useState<CourseCatalogItem[]>([]);
  const [lectures, setLectures] = useState<LectureNote[]>([]);
  const [selectedLecture, setSelectedLecture] = useState<LectureNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLocal, setIsLocal] = useState(false);
  const [showCapabilityDetails, setShowCapabilityDetails] = useState(false);
  const [mobileTab, setMobileTab] = useState<"list" | "viewer">("viewer");

  // Push modal state
  const [pushModalOpen, setPushModalOpen] = useState(false);
  const [activeSnippet, setActiveSnippet] = useState<{ title: string; content: string; timestamp?: string } | null>(null);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [questions, setQuestions] = useState<QuestionMeta[]>([]);
  const [targetType, setTargetType] = useState<"concept" | "question">("concept");
  const [targetId, setTargetId] = useState<string>("");
  const [pushing, setPushing] = useState(false);
  const [pushSuccess, setPushSuccess] = useState(false);

  // Ingest modal state
  const [ingestModalOpen, setIngestModalOpen] = useState(false);
  const [ingestTab, setIngestTab] = useState<"echo360" | "upload" | "paste">("echo360");
  const [ingestWeek, setIngestWeek] = useState(1);
  const [ingestTitle, setIngestTitle] = useState("");
  const [slideText, setSlideText] = useState("");
  const [transcriptText, setTranscriptText] = useState("");
  const [audioFilename, setAudioFilename] = useState("");
  const [slidesFileName, setSlidesFileName] = useState<string | null>(null);
  const [transcriptFileName, setTranscriptFileName] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);

  // Echo360 GUI Auto-Pull state
  const [echoSessionStatus, setEchoSessionStatus] = useState<{
    hasSession: boolean;
    cookieCount: number;
    lastUpdated?: string | null;
    courseCode?: string | null;
    courseTitle?: string | null;
    term?: string | null;
    sectionId?: string | null;
    sectionUrl?: string | null;
    userEmail?: string | null;
  } | null>(null);
  const [echoSessionChecking, setEchoSessionChecking] = useState(false);
  const [showSessionSetup, setShowSessionSetup] = useState(false);
  const [pastedCookieString, setPastedCookieString] = useState("");
  const [persistCookieToDisk, setPersistCookieToDisk] = useState(false);
  const [vaultSessions, setVaultSessions] = useState<Array<{
    id: string;
    courseCode: string;
    courseTitle: string;
    term?: string | null;
    sectionId?: string | null;
    sectionUrl?: string | null;
    userEmail?: string | null;
    savedAt: string;
    cookieHeader: string;
    rawInput?: string;
  }>>([]);
  const [vaultDropdownOpen, setVaultDropdownOpen] = useState(false);
  const [savingSession, setSavingSession] = useState(false);
  const [autoPulling, setAutoPulling] = useState(false);
  const [autoPullProgress, setAutoPullProgress] = useState<string>("");
  const [autoPullError, setAutoPullError] = useState<string | null>(null);
  const [autoPullSuccess, setAutoPullSuccess] = useState(false);
  const [autoDistillAfterPull, setAutoDistillAfterPull] = useState(true);

  // Echo360 helper state
  const [echoUrl, setEchoUrl] = useState("");
  const [echoAudioOnly, setEchoAudioOnly] = useState(true);
  const [copiedLoginCmd, setCopiedLoginCmd] = useState(false);
  const [copiedDownloadCmd, setCopiedDownloadCmd] = useState(false);

  // Batch Auto-Processing state (Course Syllabus / All Lectures)
  const [pullMode, setPullMode] = useState<"batch" | "single">("batch");
  const [sectionUrl, setSectionUrl] = useState("");
  const [discoveringSection, setDiscoveringSection] = useState(false);
  const [discoveredLectures, setDiscoveredLectures] = useState<IngestLectureItem[]>([]);
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, title: "", percent: 0 });
  const [batchComplete, setBatchComplete] = useState(false);

  // Ingest Modal Stepper & Content Uploading State
  const [ingestStep, setIngestStep] = useState<"select-lectures" | "upload-content">("select-lectures");
  const [activePill, setActivePill] = useState<string>("problem_sheets");
  const [customPillName, setCustomPillName] = useState<string>("");
  const [contentBoxes, setContentBoxes] = useState<Array<{
    id: string;
    category: string;
    categoryName: string;
    week: number | "all";
    files: Array<{ name: string; size: number; path: string; status: "uploading" | "uploaded" | "error" }>;
  }>>([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);

  // Streaming Distillation in Notes Viewer
  const [distillationStreaming, setDistillationStreaming] = useState(false);
  const [distillationProgress, setDistillationProgress] = useState({ current: 0, total: 0, title: "", percent: 0 });

  // Sync background queue states with local lecture view
  const isBatchDownloading = Boolean(
    (session &&
      session.courseId.toLowerCase() === courseId.toLowerCase() &&
      session.phase === "downloading" &&
      session.status === "running") ||
    batchRunning
  );

  const activeBatchProgress =
    session &&
    session.courseId.toLowerCase() === courseId.toLowerCase() &&
    session.phase === "downloading"
      ? {
          current: session.completedCount,
          total: session.totalCount,
          title: session.currentLectureTitle || "",
          percent: session.progressPercent
        }
      : batchProgress;

  const isDistillationActive = Boolean(
    (session &&
      session.courseId.toLowerCase() === courseId.toLowerCase() &&
      session.phase === "distilling" &&
      (session.status === "running" || session.status === "paused")) ||
    distillationStreaming
  );

  const activeDistillationProgress =
    session &&
    session.courseId.toLowerCase() === courseId.toLowerCase() &&
    session.phase === "distilling"
      ? {
          current: session.completedCount,
          total: session.totalCount,
          title: session.currentStage || session.currentLectureTitle || "",
          percent: session.progressPercent
        }
      : distillationProgress;

  // Sync discovered lectures with background session if active for this course
  useEffect(() => {
    if (
      session &&
      session.courseId.toLowerCase() === courseId.toLowerCase() &&
      session.lectures?.length > 0
    ) {
      setDiscoveredLectures(session.lectures);
    }
  }, [session, courseId]);

  // Listen for lecture note distillations completed in background
  useEffect(() => {
    const unsubscribe = subscribeToNoteUpdates(async (noteId?: string) => {
      try {
        const res = await fetch(`/api/lectures?course=${courseId}`);
        if (res.ok) {
          const notes = await res.json();
          if (Array.isArray(notes)) {
            setLectures(notes);
            if (noteId) {
              const match = notes.find((n: any) => n.id === noteId);
              if (match) setSelectedLecture(match);
            } else if (notes.length > 0 && !selectedLecture) {
              setSelectedLecture(notes[0]);
            }
          }
        }
      } catch (e) {
        console.error("Failed to auto-refresh lectures", e);
      }
    });
    return unsubscribe;
  }, [courseId, selectedLecture, subscribeToNoteUpdates]);

  // AI Configuration State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [aiConfigured, setAiConfigured] = useState<{ configured: boolean; provider: string; model?: string }>({
    configured: false,
    provider: "gemini",
    model: "gemini-2.5-flash"
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("cn_ai_settings");
        if (stored) {
          const parsed = JSON.parse(stored);
          const hasKey = Boolean(
            parsed.provider === "ollama" ||
            (parsed.provider === "gemini" && parsed.geminiKey?.trim()) ||
            (parsed.provider === "openai" && parsed.openaiKey?.trim()) ||
            (parsed.provider === "anthropic" && parsed.anthropicKey?.trim())
          );
          const activeModel =
            parsed.provider === "gemini"
              ? parsed.geminiModel || "gemini-2.5-flash"
              : parsed.provider === "openai"
              ? parsed.openaiModel || "gpt-4o-mini"
              : parsed.provider === "anthropic"
              ? parsed.anthropicModel || "claude-3-5-sonnet-20241022"
              : parsed.ollamaModel || "llama3";

          setAiConfigured({ configured: hasKey, provider: parsed.provider || "gemini", model: activeModel });
        } else {
          setAiConfigured({ configured: false, provider: "gemini", model: "gemini-2.5-flash" });
        }
      } catch {}
    }
  }, [ingestModalOpen, isSettingsOpen]);

  // Authentic UNSW Course Outline state
  const [courseOutline, setCourseOutline] = useState<UNSWCourseOutline | null>(null);
  const [detectedYear, setDetectedYear] = useState<number>(2026);
  const [detectedTerm, setDetectedTerm] = useState<string>("Term 1");
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [availableTerms, setAvailableTerms] = useState<string[]>([]);
  const [isClosestMatch, setIsClosestMatch] = useState<boolean>(false);
  const [closestYear, setClosestYear] = useState<string | undefined>(undefined);
  const [needsSectionUrl, setNeedsSectionUrl] = useState<boolean>(false);
  const [loadingOutline, setLoadingOutline] = useState<boolean>(false);
  const [isCreatingCourse, setIsCreatingCourse] = useState<boolean>(false);
  const [createdCourseSuccess, setCreatedCourseSuccess] = useState<string | null>(null);

  // Audio player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState("00:00:00");

  const loadCourseData = (targetCourse: string) => {
    if (!targetCourse) {
      setLectures([]);
      setSelectedLecture(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/lectures?course=${targetCourse}`)
      .then((res) => {
        if (!res.ok) throw new Error("API not available");
        return res.json();
      })
      .then((data: LectureNote[]) => {
        setLectures(data);
        if (data.length > 0) setSelectedLecture(data[0]);
        else setSelectedLecture(null);
      })
      .catch(async () => {
        const pack = await fetchLecturePack(targetCourse);
        if (pack && pack.lectures && pack.lectures.length > 0) {
          setLectures(pack.lectures);
          setSelectedLecture(pack.lectures[0]);
        } else {
          setLectures([]);
          setSelectedLecture(null);
        }
      })
      .finally(() => setLoading(false));

    // Load concepts and questions for push selector
    fetch(`/api/concepts?course=${targetCourse}`)
      .then((res) => {
        if (!res.ok) throw new Error("API not available");
        return res.json();
      })
      .then((data) => setConcepts(data))
      .catch(async () => {
        const merged = await loadActiveCourseData();
        if (merged) setConcepts(merged.concepts);
      });

    fetch(`/api/questions?course=${targetCourse}`)
      .then((res) => {
        if (!res.ok) throw new Error("API not available");
        return res.json();
      })
      .then((data) => setQuestions(data))
      .catch(async () => {
        const merged = await loadActiveCourseData();
        if (merged) setQuestions(merged.questions);
      });
  };

  const handleSwitchCourse = (newCourse: string) => {
    const clean = newCourse.toLowerCase();
    setCourseId(clean);
    setActiveCourseId(clean);
    setDiscoveredLectures([]);
    setSectionUrl("");
    setCourseOutline(null);
    setNeedsSectionUrl(false);
    loadCourseData(clean);
  };

  // Debounce typing to auto-trigger outline & lectures discovery immediately
  useEffect(() => {
    const trimmed = sectionUrl.trim();
    if (!trimmed) return;

    // Detect if input is either a course code (e.g. MATH3701, COMP3121, MATH2621) or an Echo360 URL
    const isCourseCode = /^[A-Za-z]{4}\s*\d{4}$/.test(trimmed);
    const isEchoUrl =
      trimmed.startsWith("http://") ||
      trimmed.startsWith("https://") ||
      trimmed.includes("echo360.net.au") ||
      trimmed.includes("echo360.org");

    if (isCourseCode || isEchoUrl) {
      const timer = setTimeout(() => {
        handleDiscoverLectures(trimmed);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [sectionUrl]);

  useEffect(() => {
    setIsLocal(isLocalStudio());
    const savedCourse = getActiveCourseId();
    if (savedCourse) {
      setCourseId(savedCourse);
      loadCourseData(savedCourse);
    } else {
      setLoading(false);
    }

    getCourseCatalog()
      .then((catalog) => {
        setAvailableCourses(catalog);
      })
      .catch(() => {});

    checkEchoSession(true);

    // Auto-discover the course from the connected cookie when ingest modal opens
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("addCourse") === "true" || params.get("openIngest") === "true") {
        setIngestModalOpen(true);
        setCourseOutline(null);
        setSectionUrl("");
        setDiscoveredLectures([]);
        setAutoPullError(null);
      }
    }
  }, []);

  // Automatically trigger outline & lectures discovery for the connected cookie course
  useEffect(() => {
    if (ingestModalOpen && echoSessionStatus?.hasSession) {
      const target = echoSessionStatus.sectionUrl || echoSessionStatus.courseCode;
      if (target && (!courseOutline || (echoSessionStatus.courseCode && courseOutline.courseCode !== echoSessionStatus.courseCode))) {
        setSectionUrl(target);
        handleDiscoverLectures(target);
      }
    }
  }, [ingestModalOpen, echoSessionStatus?.hasSession, echoSessionStatus?.courseCode, echoSessionStatus?.sectionUrl]);

  const handleTimestampClick = (timeStr?: string) => {
    if (!timeStr) return;
    if (isLocal && selectedLecture?.sourceAudio) {
      // In local mode: seek in local audio player
      setCurrentTime(timeStr);
      setIsPlaying(true);
    } else if (selectedLecture?.echo360Url) {
      // In GitHub Pages mode or external: open Echo360 at timestamp
      window.open(`${selectedLecture.echo360Url}#t=${timeStr}`, "_blank");
    } else {
      alert(`Timestamp: ${timeStr} (Audio available in Localhost Studio)`);
    }
  };

  const openPushModal = (title: string, content: string, timestamp?: string) => {
    setActiveSnippet({ title, content, timestamp });
    setPushModalOpen(true);
    setPushSuccess(false);
    if (concepts.length > 0) setTargetId(concepts[0].slug);
  };

  const handlePushSubmit = async () => {
    if (!activeSnippet || !targetId) return;
    setPushing(true);
    try {
      if (isLocal) {
        const res = await fetch("/api/lectures/push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseId,
            targetType,
            targetId,
            snippet: activeSnippet.content,
            title: activeSnippet.title,
            timestamp: activeSnippet.timestamp
          })
        });
        if (!res.ok) throw new Error("Push failed via API");
      } else {
        // GitHub Pages client-side persistence
        const existingInsightsRaw = localStorage.getItem(`cn_pushed_insights_${courseId}`) || "[]";
        const existingInsights = JSON.parse(existingInsightsRaw);
        existingInsights.push({
          targetType,
          targetId,
          snippet: activeSnippet.content,
          title: activeSnippet.title,
          timestamp: activeSnippet.timestamp,
          pushedAt: new Date().toISOString()
        });
        localStorage.setItem(`cn_pushed_insights_${courseId}`, JSON.stringify(existingInsights));
      }

      setPushSuccess(true);
      setTimeout(() => {
        setPushModalOpen(false);
        setPushSuccess(false);
      }, 1200);
    } catch (err: any) {
      alert(err.message || "Failed to push snippet");
    } finally {
      setPushing(false);
    }
  };

  const handleTranscriptFileUpload = async (file: File) => {
    if (file.name.toLowerCase().endsWith(".zip")) {
      try {
        const zip = await JSZip.loadAsync(file);
        let foundName = "";
        let foundContent = "";
        const candidateEntries = Object.entries(zip.files).filter(([relPath, entry]) => {
          if (entry.dir || relPath.startsWith("__MACOSX")) return false;
          const base = entry.name.split("/").pop() || "";
          return !base.startsWith(".");
        });

        for (const [, entry] of candidateEntries) {
          const lower = entry.name.toLowerCase();
          if (lower.endsWith(".vtt") || lower.endsWith(".srt") || lower.endsWith(".txt") || lower.endsWith(".json")) {
            foundName = entry.name.split("/").pop() || entry.name;
            foundContent = await entry.async("string");
            break;
          }
        }

        if (foundContent) {
          setTranscriptFileName(foundName);
          setTranscriptText(foundContent);
          if (!audioFilename) {
            const base = foundName.replace(/\.[^/.]+$/, "");
            setAudioFilename(`${base}.m4a`);
          }
        }
      } catch (err) {
        console.error("Failed to extract transcript from zip:", err);
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = (e.target?.result as string) || "";
      setTranscriptFileName(file.name);
      setTranscriptText(content);
      if (!audioFilename) {
        const base = file.name.replace(/\.[^/.]+$/, "");
        setAudioFilename(`${base}.m4a`);
      }
    };
    reader.readAsText(file);
  };

  const handleSlidesFileUpload = async (file: File) => {
    if (file.name.toLowerCase().endsWith(".zip")) {
      try {
        const zip = await JSZip.loadAsync(file);
        let foundName = "";
        let foundContent = "";
        const candidateEntries = Object.entries(zip.files).filter(([relPath, entry]) => {
          if (entry.dir || relPath.startsWith("__MACOSX")) return false;
          const base = entry.name.split("/").pop() || "";
          return !base.startsWith(".");
        });

        for (const [, entry] of candidateEntries) {
          const lower = entry.name.toLowerCase();
          if (lower.endsWith(".md") || lower.endsWith(".txt") || lower.endsWith(".tex") || lower.endsWith(".latex")) {
            foundName = entry.name.split("/").pop() || entry.name;
            foundContent = await entry.async("string");
            break;
          }
        }

        if (foundContent) {
          setSlidesFileName(foundName);
          setSlideText(foundContent);
          if (!ingestTitle) {
            const cleanName = foundName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
            setIngestTitle(cleanName);
          }
        }
      } catch (err) {
        console.error("Failed to extract slides from zip:", err);
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = (e.target?.result as string) || "";
      setSlidesFileName(file.name);
      setSlideText(content);
      if (!ingestTitle) {
        const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
        setIngestTitle(cleanName);
      }
    };
    reader.readAsText(file);
  };

  const checkEchoSession = async (autoTrigger: boolean = false) => {
    setEchoSessionChecking(true);
    try {
      const ephemeralCookie = typeof window !== "undefined" ? sessionStorage.getItem("cn_echo_session_cookie") : null;
      const ephemeralUrl = typeof window !== "undefined" ? sessionStorage.getItem("cn_echo_session_url") : null;
      const ephemeralCourse = typeof window !== "undefined" ? sessionStorage.getItem("cn_echo_session_course") : null;
      const headers: Record<string, string> = {};
      if (ephemeralCookie) {
        headers["x-echo-cookie"] = ephemeralCookie;
      }
      if (ephemeralUrl) {
        headers["x-echo-section-url"] = ephemeralUrl;
      }
      if (ephemeralCourse) {
        headers["x-echo-course-code"] = ephemeralCourse;
      }
      const res = await fetch("/api/lectures/echo360", { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.sectionUrl && typeof window !== "undefined") {
          sessionStorage.setItem("cn_echo_session_url", data.sectionUrl);
        }
        setEchoSessionStatus(data);
        if (Array.isArray(data.vault)) {
          setVaultSessions(data.vault);
        }
        if (autoTrigger && data.hasSession) {
          const target = data.sectionUrl || ephemeralUrl || data.courseCode;
          if (target) {
            setSectionUrl(target);
            handleDiscoverLectures(target);
          }
        }
      }
    } catch {
      // not in local api mode
    } finally {
      setEchoSessionChecking(false);
    }
  };

  const handleSaveEchoSession = async () => {
    if (!pastedCookieString.trim()) return;
    setSavingSession(true);
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

      // Store in sessionStorage for current tab immediate use
      if (typeof window !== "undefined") {
        if (data.cookieHeader) sessionStorage.setItem("cn_echo_session_cookie", data.cookieHeader);
        if (data.sectionUrl) sessionStorage.setItem("cn_echo_session_url", data.sectionUrl);
        if (data.courseCode) sessionStorage.setItem("cn_echo_session_course", data.courseCode);
      }

      await checkEchoSession(true);
      setShowSessionSetup(false);
      setPastedCookieString("");
      setPersistCookieToDisk(false); // Reset back to default unchecked!

      const target = data.sectionUrl || data.courseCode;
      if (target) {
        setSectionUrl(target);
        handleDiscoverLectures(target);
      }
    } catch (err: any) {
      alert(err.message || "Failed to save session");
    } finally {
      setSavingSession(false);
    }
  };

  const handleSwitchVaultSession = async (item: any) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("cn_echo_session_cookie", item.cookieHeader);
    }
    setVaultDropdownOpen(false);
    const target = item.sectionUrl || (item.sectionId ? `https://echo360.net.au/section/${item.sectionId}/home` : item.courseCode);
    setSectionUrl(target);
    setEchoSessionStatus({
      hasSession: true,
      cookieCount: (item.cookieHeader || "").split(";").filter((c: string) => c.trim()).length,
      courseCode: item.courseCode,
      courseTitle: item.courseTitle,
      term: item.term,
      sectionId: item.sectionId,
      sectionUrl: item.sectionUrl || (item.sectionId ? `https://echo360.net.au/section/${item.sectionId}/home` : null),
      userEmail: item.userEmail,
      lastUpdated: item.savedAt
    });
    handleDiscoverLectures(target);
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

  const handleAutoPull = async () => {
    if (!echoUrl.trim()) return;
    setAutoPulling(true);
    setAutoPullError(null);
    setAutoPullSuccess(false);

    try {
      const trimmed = echoUrl.trim();
      const isUrl = trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.includes("echo360") || trimmed.includes("/");
      if (!isUrl) {
        throw new Error(`"${trimmed}" is not a valid URL. Echo360 cannot pull by course code; please paste the full lecture recording URL.`);
      }

      setAutoPullProgress("Resolving media ID and transcripts from Echo360...");

      const ephemeralCookie = typeof window !== "undefined" ? sessionStorage.getItem("cn_echo_session_cookie") : null;
      const ephemeralUrl = typeof window !== "undefined" ? sessionStorage.getItem("cn_echo_session_url") : null;
      const pullHeaders: Record<string, string> = { "Content-Type": "application/json" };
      if (ephemeralCookie) pullHeaders["x-echo-cookie"] = ephemeralCookie;
      if (ephemeralUrl) pullHeaders["x-echo-section-url"] = ephemeralUrl;

      const res = await fetch("/api/lectures/echo360", {
        method: "POST",
        headers: pullHeaders,
        body: JSON.stringify({
          action: "pull",
          courseId,
          url: trimmed,
          downloadAudio: echoAudioOnly,
          week: ingestWeek,
          title: ingestTitle,
          cookieHeader: ephemeralCookie || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Auto-pull failed");

      setTranscriptText(data.transcriptText || "");
      setTranscriptFileName(`lecture_${data.mediaId}.txt`);
      if (data.audioFile) {
        setAudioFilename(data.audioFile);
      }
      if (data.suggestedTitle && !ingestTitle) {
        setIngestTitle(data.suggestedTitle);
      }

      if (autoDistillAfterPull && data.transcriptText) {
        setAutoPullProgress("Distilling high-yield intuitions with AI engine...");
        const settingsStr = localStorage.getItem("cn_ai_settings");
        const settings = settingsStr ? JSON.parse(settingsStr) : {};

        const enrichRes = await fetch("/api/lectures/enrich", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseId,
            week: ingestWeek,
            lectureTitle: data.suggestedTitle || ingestTitle || `Week ${ingestWeek} Lecture`,
            slideText: slideText || `### Overview of ${data.suggestedTitle || "Lecture"}`,
            transcriptText: data.transcriptText,
            provider: settings.provider || "gemini",
            apiKey: settings.geminiKey || settings.openaiKey || settings.anthropicKey,
            ollamaUrl: settings.ollamaUrl || "http://localhost:11434",
            ollamaModel: settings.ollamaModel || "qwen2.5:7b-instruct"
          })
        });

        const enrichData = await enrichRes.json();
        if (enrichRes.ok && enrichData.result) {
          const enriched = enrichData.result;
          const newNote: LectureNote = {
            id: `lec-w${String(ingestWeek).padStart(2, "0")}-${(enriched.title || "notes").toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
            week: ingestWeek,
            title: enriched.title || `Week ${ingestWeek} Lecture`,
            topics: enriched.outline || [],
            content: enriched.distilledContent || "",
            insights: enriched.insights || [],
            questionHints: enriched.questionHints || [],
            sourceAudio: data.audioFile || undefined,
            sourceTranscript: `lecture_${data.mediaId}.txt`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          if (isLocal) {
            await fetch("/api/lectures", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ courseId, note: newNote })
            });
          }

          setLectures([newNote, ...lectures]);
          setSelectedLecture(newNote);
          setAutoPullSuccess(true);
          setAutoPullProgress("🎉 Lecture successfully pulled, audio linked, and AI notes distilled!");
          setTimeout(() => {
            setIngestModalOpen(false);
            setAutoPulling(false);
          }, 1500);
          return;
        }
      }

      setAutoPullSuccess(true);
      setAutoPullProgress("🎉 Transcript & media successfully pulled! You can now review or distill.");
      setIngestTab("upload");
    } catch (err: any) {
      setAutoPullError(err.message || "Failed to auto-pull lecture");
    } finally {
      setAutoPulling(false);
    }
  };

  // Fast background transcript fetcher
  const fetchTranscriptsInBackground = async (items: typeof discoveredLectures) => {
    for (const item of items) {
      if (!item.mediaId || item.mediaId.startsWith("outline-") || item.mediaId.includes("demo")) {
        setDiscoveredLectures((prev) =>
          prev.map((l) =>
            l.lessonId === item.lessonId ? { ...l, transcriptStatus: "none" } : l
          )
        );
        continue;
      }

      try {
        const ephemeralCookie = typeof window !== "undefined" ? sessionStorage.getItem("cn_echo_session_cookie") : null;
        const ephemeralUrl = typeof window !== "undefined" ? sessionStorage.getItem("cn_echo_session_url") : null;
        const quickHeaders: Record<string, string> = { "Content-Type": "application/json" };
        if (ephemeralCookie) quickHeaders["x-echo-cookie"] = ephemeralCookie;
        if (ephemeralUrl) quickHeaders["x-echo-section-url"] = ephemeralUrl;

        const res = await fetch("/api/lectures/echo360", {
          method: "POST",
          headers: quickHeaders,
          body: JSON.stringify({
            action: "fetch-transcript-quick",
            courseId,
            mediaId: item.mediaId,
            lessonUrl: item.lessonUrl,
            cookieHeader: ephemeralCookie || undefined
          })
        });

        if (res.ok) {
          const data = await res.json();
          setDiscoveredLectures((prev) =>
            prev.map((l) =>
              l.lessonId === item.lessonId
                ? {
                    ...l,
                    transcriptStatus: data.hasTranscript ? "ready" : "none",
                    transcriptCueCount: data.cueCount || 0,
                    transcriptPreview: data.preview || ""
                  }
                : l
            )
          );
        } else {
          setDiscoveredLectures((prev) =>
            prev.map((l) =>
              l.lessonId === item.lessonId ? { ...l, transcriptStatus: "none" } : l
            )
          );
        }
      } catch {
        setDiscoveredLectures((prev) =>
          prev.map((l) =>
            l.lessonId === item.lessonId ? { ...l, transcriptStatus: "none" } : l
          )
        );
      }
    }
  };

  const handleDiscoverLectures = async (overrideInput?: string) => {
    const ephemeralUrl = typeof window !== "undefined" ? sessionStorage.getItem("cn_echo_session_url") : null;
    let input = (overrideInput !== undefined ? overrideInput : sectionUrl).trim();
    
    // If input is empty or matches active session courseCode, prioritize known sectionUrl!
    if (!input && echoSessionStatus?.hasSession) {
      input = echoSessionStatus.sectionUrl || ephemeralUrl || echoSessionStatus.courseCode || "";
    } else if (echoSessionStatus?.hasSession && echoSessionStatus.courseCode && input.toUpperCase() === echoSessionStatus.courseCode.toUpperCase()) {
      if (echoSessionStatus.sectionUrl || ephemeralUrl) {
        input = echoSessionStatus.sectionUrl || ephemeralUrl!;
      }
    }
    
    // Explicitly reset search and outline states immediately so previous course NEVER shows again!
    setCourseOutline(null);
    setDiscoveredLectures([]);
    setCourseOutline(null);
    setAutoPullError(null);
    setBatchComplete(false);
    setIsClosestMatch(false);
    setClosestYear(undefined);
    setNeedsSectionUrl(false);
    setAvailableYears([]);
    setAvailableTerms([]);
    setCreatedCourseSuccess(null);

    if (!input) {
      setAutoPullError("Please enter a course code (e.g. MATH3701) or paste your Echo360 Section URL.");
      return;
    }

    setDiscoveringSection(true);

    try {
      const ephemeralCookie = typeof window !== "undefined" ? sessionStorage.getItem("cn_echo_session_cookie") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (ephemeralCookie) {
        headers["x-echo-cookie"] = ephemeralCookie;
      }
      if (ephemeralUrl) {
        headers["x-echo-section-url"] = ephemeralUrl;
      }

      const res = await fetch("/api/lectures/echo360", {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "discover-section",
          courseId: courseId || "math3701",
          sectionUrl: input,
          cookieHeader: ephemeralCookie || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Course "${input.toUpperCase()}" not found. Please verify the course code or Echo360 section URL.`);
      }

      if (!data.courseOutline && (!data.lectures || data.lectures.length === 0)) {
        throw new Error(data.error || `Course "${input.toUpperCase()}" not found. No course outline or Echo360 recordings were located.`);
      }

      if (data.courseOutline) {
        setCourseOutline(data.courseOutline);
      }
      if (data.sectionUrl && typeof window !== "undefined") {
        sessionStorage.setItem("cn_echo_session_url", data.sectionUrl);
        setEchoSessionStatus((prev) => (prev ? { ...prev, sectionUrl: data.sectionUrl } : prev));
      }
      if (data.courseId) {
        const cleanId = data.courseId.toLowerCase();
        setCourseId(cleanId);
        setActiveCourseId(cleanId);
      }
      if (data.detectedYear) setDetectedYear(Number(data.detectedYear) || 2026);
      if (data.detectedTerm) setDetectedTerm(data.detectedTerm);

      // Strictly populate only existing years and existing terms!
      if (Array.isArray(data.availableYears) && data.availableYears.length > 0) {
        setAvailableYears(data.availableYears);
      } else if (data.detectedYear) {
        setAvailableYears([String(data.detectedYear)]);
      }

      if (Array.isArray(data.availableTerms) && data.availableTerms.length > 0) {
        setAvailableTerms(data.availableTerms);
      } else if (data.detectedTerm) {
        setAvailableTerms([data.detectedTerm]);
      }

      setIsClosestMatch(Boolean(data.isClosestMatch));
      setClosestYear(data.closestYear);
      setNeedsSectionUrl(Boolean(data.needsSectionUrl));

      const rawLectures = Array.isArray(data.lectures) ? data.lectures : [];
      const mapped = rawLectures.map((l: any) => ({
        ...l,
        selected: true,
        status: "queued" as const,
        transcriptStatus: "loading" as const
      }));
      setDiscoveredLectures(mapped);

      // Automatically pull transcripts in the background!
      if (mapped.length > 0) {
        fetchTranscriptsInBackground(mapped);
      }
    } catch (err: any) {
      setCourseOutline(null);
      setDiscoveredLectures([]);
      setAutoPullError(err.message || `Course "${input.toUpperCase()}" not found. Please verify the course code or Echo360 section URL.`);
    } finally {
      setDiscoveringSection(false);
    }
  };

  const handleChangeOutlineYear = async (newYear: string) => {
    setLoadingOutline(true);
    try {
      const cleanCourse = (courseOutline?.courseCode || courseId).toUpperCase().replace(/[^A-Z0-9]/g, "");
      const res = await fetch(`/api/courses/outline?courseCode=${cleanCourse}&year=${newYear}&term=${detectedTerm}`);
      if (res.ok) {
        const data = await res.json();
        if (data.outline) {
          setCourseOutline(data.outline);
          setDetectedYear(Number(newYear) || detectedYear);
          setIsClosestMatch(Boolean(data.isClosestMatch));
          setClosestYear(data.closestYear);
          if (Array.isArray(data.availableTerms) && data.availableTerms.length > 0) {
            setAvailableTerms(data.availableTerms);
            if (!data.availableTerms.includes(detectedTerm)) {
              setDetectedTerm(data.availableTerms[0]);
            }
          }

          // Update outline topics on existing discovered lectures
          const scheduleLectures = (data.outline.schedule || []).filter((s: any) => s.type === "Lecture");
          setDiscoveredLectures((prev) =>
            prev.map((l) => {
              const match = scheduleLectures.find((s: any) => s.week === l.week);
              if (match) {
                return {
                  ...l,
                  outlineTopic: match.topic,
                  outlineDescription: match.description,
                  outlineDateRange: match.dateRange
                };
              }
              return l;
            })
          );
        }
      }
    } catch (err: any) {
      console.error("Failed to change outline year", err);
    } finally {
      setLoadingOutline(false);
    }
  };

  const handleChangeOutlineTerm = async (newTerm: string) => {
    setLoadingOutline(true);
    try {
      const cleanCourse = (courseOutline?.courseCode || courseId).toUpperCase().replace(/[^A-Z0-9]/g, "");
      const res = await fetch(`/api/courses/outline?courseCode=${cleanCourse}&year=${detectedYear}&term=${newTerm}`);
      if (res.ok) {
        const data = await res.json();
        if (data.outline) {
          setCourseOutline(data.outline);
          setDetectedTerm(newTerm);
          setIsClosestMatch(Boolean(data.isClosestMatch));
          setClosestYear(data.closestYear);
        }
      }
    } catch (err: any) {
      console.error("Failed to change outline term", err);
    } finally {
      setLoadingOutline(false);
    }
  };

  const handleCreateCourseFromOutline = async () => {
    if (!courseOutline) return;
    setIsCreatingCourse(true);
    setAutoPullError(null);
    setCreatedCourseSuccess(null);

    const cleanCode = courseOutline.courseCode.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const cleanId = cleanCode.toLowerCase();
    const weeksCount = Math.max(10, ...(courseOutline.schedule?.map((s) => s.week) || [10]));

    try {
      const res = await fetch("/api/courses/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: cleanCode,
          name: courseOutline.courseName,
          term: `${detectedTerm}, ${detectedYear}`,
          institution: courseOutline.school || courseOutline.faculty || "UNSW",
          weeks: weeksCount,
          echo360SectionUrl: sectionUrl.startsWith("http") ? sectionUrl : undefined
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to initialize course hub");

      // Set as active course
      setCourseId(cleanId);
      setActiveCourseId(cleanId);
      localStorage.setItem("math_active_course", cleanId);

      // Refresh catalog
      const catalog = await getCourseCatalog().catch(() => []);
      setAvailableCourses(catalog);

      setCreatedCourseSuccess(`🎉 Course Hub for ${cleanCode} created successfully! You can now ingest lectures or upload notes.`);
    } catch (err: any) {
      setAutoPullError(err.message || "Failed to create course from outline");
    } finally {
      setIsCreatingCourse(false);
    }
  };

  const handlePopulateFromOutline = () => {
    if (!courseOutline?.schedule) return;
    const lectureSchedule = courseOutline.schedule.filter((s) => s.type === "Lecture");
    const scheduleItems = lectureSchedule.length > 0 ? lectureSchedule : courseOutline.schedule;
    const items = scheduleItems.map((s, idx) => ({
      lessonId: `outline-w${s.week}-${idx + 1}`,
      mediaId: `outline-w${s.week}-${idx + 1}`,
      title: s.topic || `Week ${s.week} Lecture`,
      week: s.week,
      date: s.dateRange || `Week ${s.week}`,
      lessonUrl: "",
      hasVideo: false,
      selected: true,
      status: "queued" as const,
      outlineTopic: s.topic,
      outlineDescription: s.description,
      outlineDateRange: s.dateRange,
      transcriptStatus: "none" as const
    }));
    setDiscoveredLectures(items);
  };

  const handleUpdateLectureWeek = (lessonId: string, newWeek: number) => {
    setDiscoveredLectures((prev) =>
      prev.map((l) => (l.lessonId === lessonId ? { ...l, week: newWeek } : l))
    );
  };

  const handleUpdateLectureTitle = (lessonId: string, newTitle: string) => {
    setDiscoveredLectures((prev) =>
      prev.map((l) => (l.lessonId === lessonId ? { ...l, title: newTitle } : l))
    );
  };

  const handleToggleSelectAll = (select: boolean) => {
    setDiscoveredLectures((prev) => prev.map((l) => ({ ...l, selected: select })));
  };

  const handleToggleLectureSelect = (lessonId: string) => {
    setDiscoveredLectures((prev) =>
      prev.map((l) => (l.lessonId === lessonId ? { ...l, selected: !l.selected } : l))
    );
  };

  const getPillLabel = (pill: string) => {
    switch (pill) {
      case "problem_sheets":
        return "Weekly Problem Sheet";
      case "slides":
        return "Weekly Lecture (Slides)";
      case "course_notes":
        return "Full Course Notes";
      case "past_papers":
        return "Past Papers";
      default:
        return "Course Material";
    }
  };

  const handleAddContentBox = () => {
    const name =
      activePill === "other" && customPillName.trim()
        ? customPillName.trim()
        : getPillLabel(activePill);
    const newBox = {
      id: `box-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      category: activePill,
      categoryName: name,
      week: "all" as number | "all",
      files: []
    };
    setContentBoxes((prev) => [...prev, newBox]);
    if (activePill === "other") setCustomPillName("");
  };

  const handleUpdateBoxWeek = (boxId: string, week: number | "all") => {
    setContentBoxes((prev) =>
      prev.map((b) => (b.id === boxId ? { ...b, week } : b))
    );
  };

  const handleRemoveBox = (boxId: string) => {
    setContentBoxes((prev) => prev.filter((b) => b.id !== boxId));
  };

  const handleUploadFilesToBox = async (boxId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploadingFiles(true);
    const box = contentBoxes.find((b) => b.id === boxId);
    if (!box) {
      setIsUploadingFiles(false);
      return;
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append("courseId", courseId);
      formData.append("category", box.category);
      formData.append("categoryName", box.categoryName);
      formData.append("week", String(box.week));
      formData.append("file", file);

      try {
        const res = await fetch("/api/courses/content", {
          method: "POST",
          body: formData
        });
        if (res.ok) {
          const data = await res.json();
          if (data.isZip && Array.isArray(data.items) && data.items.length > 0) {
            const newFiles = data.items.map((it: any) => ({
              name: it.originalName,
              size: it.size,
              path: it.relativePath || "",
              status: "uploaded" as const
            }));
            setContentBoxes((prev) =>
              prev.map((b) =>
                b.id === boxId
                  ? {
                      ...b,
                      files: [...b.files, ...newFiles]
                    }
                  : b
              )
            );
          } else {
            setContentBoxes((prev) =>
              prev.map((b) =>
                b.id === boxId
                  ? {
                      ...b,
                      files: [
                        ...b.files,
                        {
                          name: file.name,
                          size: file.size,
                          path: data.item?.relativePath || "",
                          status: "uploaded" as const
                        }
                      ]
                    }
                  : b
              )
            );
          }
        }
      } catch (err) {
        console.error("Failed to upload content file:", err);
      }
    }
    setIsUploadingFiles(false);
  };

  const handleStartBatchDownload = async () => {
    const selected = discoveredLectures.filter((l) => l.selected && l.status !== "done" && l.status !== "media_ready");
    if (selected.length === 0) {
      setIngestStep("upload-content");
      return;
    }

    setAutoPullError(null);
    setIngestStep("upload-content"); // Automatically advance to Step 2 per approved plan!
    await globalStartBatchDownload(courseId, discoveredLectures, echoAudioOnly);
  };

  const handleStartDistillationPipeline = async (withUploadedContext: boolean = true, requireAi: boolean = true) => {
    // Check AI configuration from localStorage
    let currentAiSettings: any = null;
    try {
      const stored = localStorage.getItem("cn_ai_settings");
      if (stored) currentAiSettings = JSON.parse(stored);
    } catch {}

    const hasAiKey = Boolean(
      currentAiSettings && (
        currentAiSettings.provider === "ollama" ||
        (currentAiSettings.provider === "gemini" && currentAiSettings.geminiKey?.trim()) ||
        (currentAiSettings.provider === "openai" && currentAiSettings.openaiKey?.trim()) ||
        (currentAiSettings.provider === "anthropic" && currentAiSettings.anthropicKey?.trim())
      )
    );

    if (requireAi && !hasAiKey) {
      setAutoPullError(
        "⚠️ No AI provider configured. Note distillation requires an AI model to extract definitions, KaTeX formulas, intuitions (🎙️), and exam traps (⚠️). Please click 'Connect AI Key' below to enter your Google Gemini API key or connect Ollama, or choose 'Save Raw Transcripts Without AI'."
      );
      setIsSettingsOpen(true);
      return;
    }

    // 1. Immediately close modal and run distillation in background!
    setIngestModalOpen(false);

    const selected = discoveredLectures.filter((l) => l.selected && l.status !== "done");
    if (selected.length === 0) {
      return;
    }

    await globalStartDistillationQueue(
      courseId,
      discoveredLectures,
      requireAi,
      currentAiSettings,
      echoAudioOnly
    );
  };

  const handleLoadSample = () => {
    setIngestWeek(4);
    setIngestTitle("Cauchy's Integral Formula & Residue Calculus");
    setAudioFilename("lecture_04_residues.m4a");
    setSlidesFileName("week-04-slides.md");
    setTranscriptFileName("week-04-echo-transcript.vtt");
    setSlideText(`### Cauchy's Integral Formula
If $f(z)$ is holomorphic on and inside a simple closed counter-clockwise contour $C$:
$$f(z_0) = \\frac{1}{2\\pi i} \\oint_C \\frac{f(z)}{z - z_0} \\, dz$$

### Cauchy's Residue Theorem
$$\\oint_C f(z) \\, dz = 2\\pi i \\sum_{k=1}^n \\operatorname{Res}(f, z_k)$$
where $z_k$ are the isolated singular points lying strictly inside $C$.`);
    setTranscriptText(`WEBVTT

00:15:30.000 --> 00:15:45.000
Okay everyone, pay very close attention to Cauchy's integral formula here.

00:16:10.000 --> 00:16:30.000
Geometrically, think of 1/(2*pi*i) as an acoustic boundary average. The boundary values completely dictate the interior values of any analytic function!

00:24:45.000 --> 00:25:05.000
Now, warning about the upcoming final exam: Every single year, students forget to check that z_0 actually lies inside the contour C!

00:25:10.000 --> 00:25:35.000
If z_0 is outside the contour C, f(z)/(z - z_0) is holomorphic everywhere inside C, so the contour integral is simply ZERO by Cauchy-Goursat! Do not spend 15 minutes computing residues for a point that is outside the contour!

00:38:20.000 --> 00:38:45.000
For problem sheet question 3, notice that you can factor the denominator as (z^2 + 1)(z - 2). Use partial fractions before picking which poles matter for the contour.`);
    setIngestTab("upload");
  };

  const handleCopyLoginCmd = () => {
    navigator.clipboard.writeText("python scripts/echo360_helper.py --login");
    setCopiedLoginCmd(true);
    setTimeout(() => setCopiedLoginCmd(false), 2000);
  };

  const handleCopyDownloadCmd = () => {
    const cmd = `python scripts/echo360_helper.py --course ${courseId.toUpperCase()} --url "${echoUrl || "https://echo360.net.au/section/..."}" ${echoAudioOnly ? "--audio" : ""}`.trim();
    navigator.clipboard.writeText(cmd);
    setCopiedDownloadCmd(true);
    setTimeout(() => setCopiedDownloadCmd(false), 2000);
  };

  const handleRunExtraction = async () => {
    setExtracting(true);
    try {
      const settingsStr = localStorage.getItem("cn_ai_settings");
      const settings = settingsStr ? JSON.parse(settingsStr) : {};

      const res = await fetch("/api/lectures/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          week: ingestWeek,
          lectureTitle: ingestTitle || `Week ${ingestWeek} Lecture`,
          slideText,
          transcriptText,
          provider: settings.provider || "gemini",
          apiKey: settings.geminiKey || settings.openaiKey || settings.anthropicKey,
          ollamaUrl: settings.ollamaUrl || "http://localhost:11434",
          ollamaModel: settings.ollamaModel || "qwen2.5:7b-instruct"
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Extraction failed");

      const enriched = data.result;
      const newNote: LectureNote = {
        id: `lec-w${String(ingestWeek).padStart(2, "0")}-${(enriched.title || "notes").toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
        week: ingestWeek,
        title: enriched.title || `Week ${ingestWeek} Lecture`,
        topics: enriched.outline || [],
        content: enriched.distilledContent || "",
        insights: enriched.insights || [],
        questionHints: enriched.questionHints || [],
        sourceAudio: audioFilename || undefined,
        sourceSlides: slidesFileName || undefined,
        sourceTranscript: transcriptFileName || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (isLocal) {
        // Save to disk via API
        await fetch("/api/lectures", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ courseId, note: newNote })
        });
      }

      setLectures([newNote, ...lectures]);
      setSelectedLecture(newNote);
      setIngestModalOpen(false);
    } catch (err: any) {
      alert(err.message || "Extraction error");
    } finally {
      setExtracting(false);
    }
  };

  const exportLectureMarkdown = (lecture: LectureNote) => {
    let md = `# ${lecture.title}\n\n`;
    md += `**Course:** ${courseId.toUpperCase()}\n`;
    md += `**Week:** ${lecture.week}\n`;
    if (lecture.date) md += `**Date:** ${lecture.date}\n`;
    if (lecture.echo360Url) md += `**Echo360:** ${lecture.echo360Url}\n`;
    md += `\n---\n\n`;

    if (lecture.insights && lecture.insights.length > 0) {
      md += `## 💡 Extracted Spoken Intuitions & Exam Warnings\n\n`;
      lecture.insights.forEach((ins) => {
        const icon = ins.type === "exam_warning" ? "⚠️ [EXAM WARNING]" : "🎙️ [INTUITION]";
        const ts = ins.timestamp ? ` (${ins.timestamp})` : "";
        md += `### ${icon} ${ins.title || "Insight"}${ts}\n`;
        md += `${ins.content || ins.text || ""}\n\n`;
      });
      md += `---\n\n`;
    }

    md += `## 📝 Distilled Lecture Notes\n\n`;
    md += `${lecture.content}\n`;

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${lecture.id || `lecture-w${lecture.week}`}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportLecturePackJson = () => {
    const pack = {
      version: "1.0",
      layer: "lectures",
      courseId,
      exportedAt: new Date().toISOString(),
      lectures,
      insights: lectures.flatMap((l) => l.insights || [])
    };
    const blob = new Blob([JSON.stringify(pack, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${courseId}_lectures_pack.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-zinc-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-violet-400 bg-violet-950/60 px-2.5 py-0.5 rounded-full border border-violet-800/40">
              Layer 2 • Dynamic Study Stream
            </span>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                isLocal
                  ? "text-emerald-400 bg-emerald-950/40 border-emerald-800/30"
                  : "text-amber-400 bg-amber-950/40 border-amber-800/30"
              }`}
            >
              {isLocal ? <HardDrive className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
              <span>{isLocal ? "Local Studio (Full Audio & Node API)" : "GitHub Pages (Static Mode)"}</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">Lectures & Value Insights</h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
            Distilled intuitions, lecturer exam traps, and timestamped audio insights{courseId ? ` for ${courseId.toUpperCase()}` : ""}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Active Course Selector Dropdown */}
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-1.5 shadow-md">
            <BookOpen className="w-3.5 h-3.5 text-violet-400 shrink-0" />
            <span className="text-xs text-zinc-400 font-semibold">Course:</span>
            <select
              value={courseId}
              onChange={(e) => handleSwitchCourse(e.target.value)}
              className="bg-transparent text-xs font-bold text-violet-300 focus:outline-hidden cursor-pointer"
            >
              <option value="" className="bg-zinc-900 text-zinc-400">
                -- Select Course --
              </option>
              {availableCourses.map((c) => (
                <option key={c.id} value={c.id} className="bg-zinc-900 text-zinc-200">
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              setIngestTab("echo360");
              setIngestModalOpen(true);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg cursor-pointer ${
              isLocal
                ? "bg-violet-600 hover:bg-violet-500 text-white shadow-violet-950/50"
                : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
            }`}
            title="Auto-pull lecture recording or drop transcript"
          >
            <Sparkles className="w-4 h-4 text-violet-200" />
            <span>⚡ Guided Auto-Pull / Ingest</span>
          </button>
        </div>
      </div>

      {/* 3-Step Ingestion & Audio Pipeline Banner */}
      <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <span>Lecture Intelligence Pipeline: How Recordings Turn into Study Insights</span>
              </h2>
              <p className="text-xs text-zinc-400">
                A seamless 3-step pipeline to ingest recordings, extract spoken value, and link to problem sheets.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIngestTab("echo360");
                setIngestModalOpen(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-violet-950/50 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>⚡ Guided Auto-Pull (Echo360)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIngestTab("upload");
                setIngestModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition border border-zinc-700 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-violet-400" />
              <span>Drop Files / Manual</span>
            </button>
          </div>
        </div>

        {/* 3-Step Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-violet-400 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-300 flex items-center justify-center text-[10px] font-mono">1</span>
                <span>Auto-Pull or Drop Media</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">Source</span>
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              Run <code className="text-zinc-300">echo360_helper.py</code> to batch-download lightweight <code className="text-zinc-300">.m4a</code> audio & transcripts, or drop local <code className="text-zinc-300">.vtt</code>, <code className="text-zinc-300">.srt</code>, or <code className="text-zinc-300">.txt</code> files directly.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-400 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-[10px] font-mono">2</span>
                <span>AI Distillation Engine</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 font-mono">Synthesis</span>
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              Synthesizes slide theorems with spoken transcripts to extract verbal analogies (<span className="text-violet-300 font-medium">🎙️ Intuitions</span>) and lecturer warnings (<span className="text-amber-300 font-medium">⚠️ Exam Traps</span>) with timestamps.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[10px] font-mono">3</span>
                <span>Layer 2 Push & Audio Player</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 font-mono">Overlay</span>
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              Stream local recordings in-app with HTTP 206 waveform seeking. 1-click push insights directly into question hints (<code className="text-zinc-300">&lt;!-- split:hints --&gt;</code>) and theory cheat sheets.
            </p>
          </div>
        </div>
      </div>

      {/* Mode Capabilities Guide: GitHub Pages vs Localhost Studio */}
      <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <Headphones className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <span>Lecture Intelligence: What You Can Do in Localhost vs GitHub Pages</span>
              </h2>
              <p className="text-xs text-zinc-400">
                Course Noting operates in two distinct tiers depending on whether you run locally or on GitHub Pages.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCapabilityDetails(!showCapabilityDetails)}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 transition border border-zinc-700 cursor-pointer"
            >
              <span>{showCapabilityDetails ? "Compact Matrix" : "Show Full Breakdown"}</span>
              {showCapabilityDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {isLocal ? (
              <span className="px-3 py-1.5 rounded-xl bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 text-xs font-semibold flex items-center gap-1.5 shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Local Studio Connected</span>
              </span>
            ) : (
              <Link
                href="/guide#local-studio"
                className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm shrink-0"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Run Localhost Studio</span>
              </Link>
            )}
          </div>
        </div>

        {/* Side-by-Side Capabilities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* GitHub Pages Column */}
          <div
            className={`p-4 rounded-xl border space-y-2.5 transition-all ${
              !isLocal
                ? "bg-amber-950/20 border-amber-500/40 ring-1 ring-amber-500/20 shadow-md"
                : "bg-zinc-950/70 border-zinc-800 opacity-80 hover:opacity-100"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`font-bold flex items-center gap-1.5 ${!isLocal ? "text-amber-400" : "text-zinc-300"}`}>
                <Globe className="w-4 h-4" />
                <span>🌐 GitHub Pages {!isLocal && "(Active Now)"}</span>
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  !isLocal
                    ? "bg-amber-950/60 text-amber-300 border-amber-800/40 font-semibold"
                    : "bg-zinc-900 text-zinc-500 border-zinc-800"
                }`}
              >
                {!isLocal ? "Active • Read & Study Mode" : "Read & Study Mode"}
              </span>
            </div>
            <ul className="space-y-1.5 text-zinc-300 text-[11px] leading-relaxed">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${!isLocal ? "text-emerald-400" : "text-zinc-500"}`} />
                <span><strong>Distilled Notes & KaTeX Math:</strong> Read complete theory summaries, proofs, and definitions.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${!isLocal ? "text-emerald-400" : "text-zinc-500"}`} />
                <span><strong>🎙️ Spoken Intuitions:</strong> Read captured metaphors and mental models lecturers said aloud in class.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${!isLocal ? "text-emerald-400" : "text-zinc-500"}`} />
                <span><strong>⚠️ Exam Warnings:</strong> Review explicit exam warnings highlighting common student pitfalls.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${!isLocal ? "text-emerald-400" : "text-zinc-500"}`} />
                <span><strong>Layer 2 Toggle:</strong> Turn lecture callout overlays ON/OFF across question sheets & concepts.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${!isLocal ? "text-emerald-400" : "text-zinc-500"}`} />
                <span><strong>Echo360 Timestamp Links:</strong> Clicking any timestamp jumps directly to that second in Echo360.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${!isLocal ? "text-emerald-400" : "text-zinc-500"}`} />
                <span><strong>Export Notes & Insights:</strong> 1-click download of notes as Markdown (<code className="text-zinc-200">.md</code>) or Layer 2 Lecture Packs (<code className="text-zinc-200">.json</code>).</span>
              </li>
            </ul>
          </div>

          {/* Localhost Studio Column */}
          <div
            className={`p-4 rounded-xl border space-y-2.5 transition-all ${
              isLocal
                ? "bg-indigo-950/20 border-indigo-500/40 ring-1 ring-indigo-500/20 shadow-md"
                : "bg-zinc-950/70 border-zinc-800 opacity-80 hover:opacity-100"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`font-bold flex items-center gap-1.5 ${isLocal ? "text-indigo-400" : "text-zinc-300"}`}>
                <HardDrive className="w-4 h-4" />
                <span>
                  🖥️ Localhost Studio {isLocal ? "(Active Now)" : <span className="text-zinc-400 font-normal">(<code className="text-zinc-300">npm run dev</code>)</span>}
                </span>
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  isLocal
                    ? "bg-indigo-950/60 text-indigo-300 border-indigo-800/40 font-semibold"
                    : "bg-zinc-900 text-zinc-500 border-zinc-800"
                }`}
              >
                {isLocal ? "Active • Full Powerhouse Mode" : "Full Powerhouse Mode"}
              </span>
            </div>
            <ul className="space-y-1.5 text-zinc-300 text-[11px] leading-relaxed">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isLocal ? "text-indigo-400" : "text-zinc-500"}`} />
                <span><strong>Local Audio HTTP 206 Streaming:</strong> Stream local <code className="text-zinc-200">.m4a</code>/<code className="text-zinc-200">.mp3</code> files directly in-app with instant waveform seeking.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isLocal ? "text-indigo-400" : "text-zinc-500"}`} />
                <span><strong>Automated Echo360 Download:</strong> Run <code className="text-zinc-200">python scripts/echo360_helper.py</code> to batch-download university recordings, slides, and transcripts.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isLocal ? "text-indigo-400" : "text-zinc-500"}`} />
                <span><strong>Offline Speech-to-Text:</strong> Transcribe audio completely private on your GPU/CPU using OpenAI Whisper.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isLocal ? "text-indigo-400" : "text-zinc-500"}`} />
                <span><strong>AI Slide + Transcript Distillation:</strong> Use local Ollama or cloud LLMs to synthesize slide decks and transcripts.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isLocal ? "text-indigo-400" : "text-zinc-500"}`} />
                <span><strong>Direct-to-Disk Injection:</strong> 1-click push to save insights permanently into your private course Markdown files on disk (<code className="text-zinc-200">courses/</code>).</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Detailed Breakdown (Expandable) */}
        {showCapabilityDetails && (
          <div className="pt-3 border-t border-zinc-800 text-xs text-zinc-400 space-y-2 animate-in fade-in">
            {isLocal ? (
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Localhost Studio is actively running on this machine</span>
                </p>
                <p className="text-zinc-400 text-[11px]">
                  You have full local filesystem access. Audio placed inside <code className="text-zinc-300">courses/{courseId}/audio/</code> will stream directly via the built-in HTTP 206 audio player, and lecture insights can be injected straight into your local markdown files.
                </p>
              </div>
            ) : (
              <>
                <p className="font-semibold text-zinc-200">How to launch Localhost Studio on your computer:</p>
                <div className="p-3 rounded-xl bg-zinc-950 font-mono text-[11px] text-zinc-300 space-y-1 border border-zinc-800">
                  <div>git clone https://github.com/noobchester/course-noting.git</div>
                  <div>cd course-noting</div>
                  <div>npm install</div>
                  <div className="text-emerald-400">npm run dev</div>
                  <div className="text-zinc-500"># Open http://localhost:3000 to access the complete Local Studio with full audio streaming!</div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Mobile Segmented Switcher (< lg) */}
      <div className="lg:hidden flex items-center p-1 bg-zinc-900/90 border border-zinc-800 rounded-xl mb-4 shadow-sm">
        <button
          type="button"
          onClick={() => setMobileTab("list")}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
            mobileTab === "list"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <ListOrdered className="w-3.5 h-3.5" />
          <span>Lecture List ({lectures.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("viewer")}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
            mobileTab === "viewer"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Notes & Audio</span>
        </button>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Sidebar: Lecture List */}
        <div className={`lg:col-span-4 space-y-3 ${mobileTab === "viewer" ? "hidden lg:block" : "block"}`}>
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Recorded Lectures ({lectures.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-zinc-500 text-sm animate-pulse bg-zinc-900/50 rounded-2xl border border-zinc-800">
              Loading lectures...
            </div>
          ) : !courseId ? (
            <div className="p-8 text-center text-zinc-500 text-xs bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-800 space-y-3">
              <BookOpen className="w-8 h-8 text-violet-400 mx-auto" />
              <p className="font-semibold text-zinc-200 text-sm">No Course Selected</p>
              <p className="text-zinc-400 max-w-sm mx-auto">
                Select an active course from the top dropdown, or click below to auto-discover and ingest a new course.
              </p>
              <button
                type="button"
                onClick={() => {
                  setIngestTab("echo360");
                  setIngestModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs inline-flex items-center gap-1.5 transition cursor-pointer shadow-md"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>⚡ Auto-Discover Course &amp; Ingest</span>
              </button>
            </div>
          ) : lectures.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-xs bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-800 space-y-2">
              <Mic className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="font-semibold text-zinc-300">No lectures ingested yet for {courseId.toUpperCase()}</p>
              <p className="text-zinc-500">Click &quot;Guided Auto-Pull / Ingest&quot; to parse Echo360 recordings or slides.</p>
              <button
                type="button"
                onClick={() => {
                  setIngestTab("echo360");
                  setIngestModalOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-violet-600/80 hover:bg-violet-600 text-white font-semibold text-xs inline-flex items-center gap-1.5 transition cursor-pointer mt-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ingest Lectures</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {lectures.map((lec) => {
                const isSelected = selectedLecture?.id === lec.id;
                return (
                  <button
                    key={lec.id}
                    type="button"
                    onClick={() => {
                      setSelectedLecture(lec);
                      setMobileTab("viewer");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className={`w-full text-left p-4 rounded-xl border transition cursor-pointer flex flex-col gap-1.5 ${
                      isSelected
                        ? "bg-violet-950/40 border-violet-500/50 shadow-lg"
                        : "bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-900 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-800 text-violet-300">
                        Week {lec.week}
                      </span>
                      {lec.date && <span className="text-[10px] text-zinc-500">{lec.date}</span>}
                    </div>

                    <div className="text-sm font-bold text-zinc-100 line-clamp-1">{lec.title}</div>

                    <div className="flex items-center gap-3 text-[11px] text-zinc-400 pt-1">
                      {lec.insights && (
                        <span className="flex items-center gap-1 text-amber-400/90 font-medium">
                          <Lightbulb className="w-3 h-3" />
                          <span>{lec.insights.length} insights</span>
                        </span>
                      )}
                      {lec.sourceAudio && (
                        <span className="flex items-center gap-1 text-emerald-400/90 font-medium">
                          <Volume2 className="w-3 h-3" />
                          <span>Audio</span>
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Main Panel: Selected Lecture Content & Insights */}
        <div className={`lg:col-span-8 p-4 sm:p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-6 shadow-xl ${mobileTab === "list" ? "hidden lg:block" : "block"}`}>
          {/* Mobile Back to List Button */}
          <button
            type="button"
            onClick={() => setMobileTab("list")}
            className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold mb-2 transition cursor-pointer w-fit"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>← View Lecture Queue ({lectures.length})</span>
          </button>
          {/* Live Distillation Progress Toast */}
          {isDistillationActive && (
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-violet-950/80 via-zinc-900/90 to-zinc-900 border border-violet-800/80 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2.5 min-w-0">
                <RefreshCw className="w-4 h-4 animate-spin text-violet-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">
                      Distilling Notes with Course Context ({activeDistillationProgress.current}/{activeDistillationProgress.total})
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-violet-900/60 text-violet-300 text-[10px] font-mono">
                      {activeDistillationProgress.percent}%
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-300 truncate">
                    {activeDistillationProgress.title}
                  </p>
                </div>
              </div>
              <div className="w-full sm:w-44 h-2 rounded-full bg-zinc-800 overflow-hidden shrink-0">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-emerald-500 transition-all duration-300 ease-out"
                  style={{ width: `${activeDistillationProgress.percent}%` }}
                />
              </div>
            </div>
          )}

          {selectedLecture ? (
            <>
              {/* Top Lecture Detail Header */}
              <div className="border-b border-zinc-800 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-violet-400 uppercase tracking-wider">
                    Week {selectedLecture.week} • Lecture Notes
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => exportLectureMarkdown(selectedLecture)}
                      className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition border border-zinc-700 cursor-pointer"
                      title="Download this lecture's notes and insights as Markdown (.md)"
                    >
                      <FileDown className="w-3.5 h-3.5 text-violet-400" />
                      <span>Export .md</span>
                    </button>
                    <button
                      type="button"
                      onClick={exportLecturePackJson}
                      className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition border border-zinc-700 cursor-pointer"
                      title="Export all lectures and insights as a JSON Lecture Pack"
                    >
                      <Download className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Export Pack (.json)</span>
                    </button>
                    {selectedLecture.echo360Url && (
                      <a
                        href={selectedLecture.echo360Url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold ml-1"
                      >
                        <span>Open in Echo360</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
                <h2 className="text-2xl font-black text-white mt-2">{selectedLecture.title}</h2>
              </div>

              {/* Spoken Intuitions Callouts */}
              {selectedLecture.insights && selectedLecture.insights.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4 text-amber-400" />
                    <span>Extracted Intuitions & Exam Warnings</span>
                  </h3>

                  <div className="grid grid-cols-1 gap-3">
                    {selectedLecture.insights.map((ins, i) => {
                      const isWarning = ins.type === "exam_warning";
                      return (
                        <div
                          key={i}
                          className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
                            isWarning
                              ? "bg-amber-950/20 border-amber-500/40 text-amber-200"
                              : "bg-indigo-950/20 border-indigo-500/40 text-indigo-200"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-bold flex items-center gap-1.5">
                                {isWarning ? <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> : <Lightbulb className="w-3.5 h-3.5 text-indigo-400" />}
                                {ins.title || (isWarning ? "Exam Trap Warning" : "Spoken Intuition")}
                              </span>
                              {ins.timestamp && (
                                <button
                                  type="button"
                                  onClick={() => handleTimestampClick(ins.timestamp)}
                                  className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 flex items-center gap-1 cursor-pointer"
                                  title="Jump to audio/video timestamp"
                                >
                                  <Clock className="w-3 h-3 text-violet-400" />
                                  <span>{ins.timestamp}</span>
                                </button>
                              )}
                            </div>
                            <div className="text-xs text-zinc-300">
                              <MathRenderer content={ins.content || ins.text || ""} />
                            </div>
                          </div>

                          <div className="flex justify-end pt-2 border-t border-zinc-800/60">
                            <button
                              type="button"
                              onClick={() => openPushModal(ins.title || "Insight", ins.content || ins.text || "", ins.timestamp)}
                              className="text-[11px] font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1 cursor-pointer bg-zinc-900/80 px-2.5 py-1 rounded-lg border border-zinc-800 hover:border-violet-500/40 transition"
                            >
                              <span>Push to Concept / Question</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Full Distilled Markdown Body */}
              <div className="pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-violet-400" />
                  <span>Distilled Lecture Notes (KaTeX)</span>
                </h3>
                <div className="prose prose-invert max-w-none text-zinc-200 text-sm bg-zinc-950/60 p-5 rounded-xl border border-zinc-800">
                  <MathRenderer content={selectedLecture.content} />
                </div>
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-zinc-500 text-sm">
              Select a lecture on the left to read its notes.
            </div>
          )}
        </div>
      </div>

      {/* Push to Concept / Question Modal */}
      {pushModalOpen && activeSnippet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-violet-400" />
              <span>Inject Insight into Course Hub</span>
            </h3>

            <div className="text-xs text-zinc-300 bg-zinc-950 p-3 rounded-lg border border-zinc-800 line-clamp-3">
              {activeSnippet.content}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400">Target Destination</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTargetType("concept");
                    if (concepts.length > 0) setTargetId(concepts[0].slug);
                  }}
                  className={`p-2 rounded-lg text-xs font-bold border cursor-pointer ${
                    targetType === "concept"
                      ? "bg-violet-600 text-white border-violet-500"
                      : "bg-zinc-800 text-zinc-400 border-zinc-700"
                  }`}
                >
                  Concept Cheat Sheet
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTargetType("question");
                    if (questions.length > 0) setTargetId(questions[0].id);
                  }}
                  className={`p-2 rounded-lg text-xs font-bold border cursor-pointer ${
                    targetType === "question"
                      ? "bg-violet-600 text-white border-violet-500"
                      : "bg-zinc-800 text-zinc-400 border-zinc-700"
                  }`}
                >
                  Problem Hint Tab
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400">
                Select {targetType === "concept" ? "Concept" : "Question"}
              </label>
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-200 focus:outline-hidden focus:border-violet-500"
              >
                {targetType === "concept"
                  ? concepts.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.title} (Week {c.week})
                      </option>
                    ))
                  : questions.map((q) => (
                      <option key={q.id} value={q.id}>
                        Q{q.number}: {q.title}
                      </option>
                    ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPushModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:bg-zinc-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePushSubmit}
                disabled={pushing || pushSuccess}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {pushSuccess ? <Check className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                <span>{pushSuccess ? "Injected!" : pushing ? "Injecting..." : "Inject Now"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ingest New Lecture Modal */}
      {ingestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in">
          <div className="bg-zinc-900 border-t sm:border border-zinc-800 rounded-t-2xl sm:rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 max-h-[95vh] sm:max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-zinc-800 pb-4 gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-violet-400" />
                  <span>Ingest Lecture into Study Stream</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Choose how to bring lecture recordings, transcripts, and slides into study hub.
                </p>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
                <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-700/80 rounded-lg px-2.5 py-1">
                  <span className="text-[11px] text-zinc-400 font-medium">Target:</span>
                  <select
                    value={courseId}
                    onChange={(e) => handleSwitchCourse(e.target.value)}
                    className="bg-transparent text-xs font-bold text-violet-400 focus:outline-hidden cursor-pointer"
                  >
                    <option value="" className="bg-zinc-900 text-zinc-400">
                      -- New / Select Course --
                    </option>
                    {availableCourses.map((c) => (
                      <option key={c.id} value={c.id} className="bg-zinc-900 text-zinc-200">
                        {c.code}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setIngestModalOpen(false)}
                  className="text-zinc-500 hover:text-zinc-300 p-1.5 rounded-lg hover:bg-zinc-800 text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Ingestion Mode Tabs */}
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
              <button
                type="button"
                onClick={() => setIngestTab("echo360")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  ingestTab === "echo360"
                    ? "bg-violet-600 text-white shadow-md shadow-violet-950/50"
                    : "bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-violet-200" />
                <span>1. Guided Auto-Pull (Echo360)</span>
              </button>
              <button
                type="button"
                onClick={() => setIngestTab("upload")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  ingestTab === "upload"
                    ? "bg-violet-600 text-white shadow-md shadow-violet-950/50"
                    : "bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>2. Drop Files & Audio</span>
              </button>
              <button
                type="button"
                onClick={() => setIngestTab("paste")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  ingestTab === "paste"
                    ? "bg-violet-600 text-white shadow-md shadow-violet-950/50"
                    : "bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>3. Direct Paste</span>
              </button>
            </div>

            {/* TAB 1: GUI-GUIDED AUTO-PULL FROM ECHO360 */}
            {ingestTab === "echo360" && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* Session Authentication Bar */}
                <div
                  className={`p-4 rounded-xl border space-y-3 transition ${
                    echoSessionStatus?.hasSession
                      ? "bg-emerald-950/20 border-emerald-800/40"
                      : "bg-amber-950/25 border-amber-800/40"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-1.5 rounded-lg border ${
                          echoSessionStatus?.hasSession
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}
                      >
                        {echoSessionStatus?.hasSession ? <ShieldCheck className="w-4 h-4" /> : <Key className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-zinc-100 flex items-center gap-2 flex-wrap">
                          <span>
                            {echoSessionStatus?.hasSession
                              ? "Echo360 Session Connected"
                              : "Echo360 Connection Required"}
                          </span>
                          {echoSessionStatus?.hasSession && echoSessionStatus.courseCode && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-violet-900/60 text-violet-300 border border-violet-700/50 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse"></span>
                              <span>Cookie Course: {echoSessionStatus.courseCode}</span>
                              {echoSessionStatus.term && <span className="opacity-80">({echoSessionStatus.term})</span>}
                            </span>
                          )}
                          {echoSessionStatus?.hasSession && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700/40">
                              {echoSessionStatus.cookieCount} Cookies Active
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          {echoSessionStatus?.hasSession ? (
                            <span>
                              {echoSessionStatus.courseTitle ? (
                                <>
                                  Scoped to: <strong className="text-zinc-200">{echoSessionStatus.courseTitle}</strong>
                                  {echoSessionStatus.userEmail && <span className="text-zinc-500"> • {echoSessionStatus.userEmail}</span>}
                                </>
                              ) : (
                                "Ready to auto-pull recordings, clean transcripts, and audio streams."
                              )}
                            </span>
                          ) : (
                            "Connect once with your university credentials to enable 1-click lecture pulling."
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {vaultSessions.length > 0 && (
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setVaultDropdownOpen(!vaultDropdownOpen)}
                            className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition border border-zinc-700 cursor-pointer"
                            title="Switch between saved course sessions"
                          >
                            <FolderLock className="w-3.5 h-3.5 text-violet-400" />
                            <span>Saved Vault ({vaultSessions.length})</span>
                            <ChevronDown className="w-3 h-3 text-zinc-400" />
                          </button>

                          {vaultDropdownOpen && (
                            <div className="absolute right-0 top-full mt-1.5 w-80 bg-zinc-900 border border-zinc-700/80 rounded-xl shadow-2xl p-2 z-50 space-y-1 text-xs animate-in fade-in">
                              <div className="px-2 py-1 text-[11px] font-bold text-zinc-400 border-b border-zinc-800 flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                  <FolderLock className="w-3.5 h-3.5 text-violet-400" />
                                  <span>Saved Course Vault</span>
                                </span>
                                <span className="text-[10px] text-zinc-500 font-mono">{vaultSessions.length} courses</span>
                              </div>
                              <div className="max-h-56 overflow-y-auto space-y-1 py-1">
                                {vaultSessions.map((item) => (
                                  <div
                                    key={item.id}
                                    className="p-2 rounded-lg bg-zinc-950/70 hover:bg-zinc-800/60 border border-zinc-800 flex items-center justify-between gap-2 transition"
                                  >
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-mono font-bold text-violet-300 text-xs">
                                          {item.courseCode}
                                        </span>
                                        {item.term && (
                                          <span className="text-[10px] text-zinc-400 font-normal">
                                            ({item.term})
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-[10px] text-zinc-400 truncate" title={item.courseTitle}>
                                        {item.courseTitle}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => handleSwitchVaultSession(item)}
                                        className="px-2 py-1 rounded bg-violet-600 hover:bg-violet-500 text-white font-bold text-[10px] flex items-center gap-1 transition cursor-pointer"
                                        title={`Switch to ${item.courseCode}`}
                                      >
                                        <Zap className="w-3 h-3" />
                                        <span>Use</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => handleDeleteVaultItem(e, item.id)}
                                        className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition cursor-pointer"
                                        title="Delete from vault"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => setShowSessionSetup(!showSessionSetup)}
                        className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition border border-zinc-700 cursor-pointer"
                      >
                        <Key className="w-3.5 h-3.5 text-violet-400" />
                        <span>{echoSessionStatus?.hasSession ? "Update Session" : "Connect Session"}</span>
                      </button>
                      {echoSessionStatus?.hasSession && (
                        <button
                          type="button"
                          onClick={handleClearEchoSession}
                          className="px-2.5 py-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-800 text-xs transition cursor-pointer"
                          title="Clear active session"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Inline Session Setup Assistant */}
                  {(!echoSessionStatus?.hasSession || showSessionSetup) && (
                    <div className="pt-3 border-t border-zinc-800/80 space-y-3 animate-in fade-in">
                      <div className="text-xs text-zinc-300 font-semibold flex items-center gap-1.5">
                        <span>How to connect your Echo360 account in 15 seconds:</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-400">
                        <div className="p-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800 space-y-1">
                          <span className="font-bold text-zinc-200">1. Open UNSW Echo360:</span>
                          <p className="text-[11px]">Log in with your university SSO & Microsoft 2FA push.</p>
                          <a
                            href="https://echo360.net.au"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-violet-400 hover:underline pt-0.5"
                          >
                            <span>Open echo360.net.au in New Tab</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <div className="p-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800 space-y-1">
                          <span className="font-bold text-zinc-200">2. Copy Request (Network Tab):</span>
                          <p className="text-[11px]">
                            Press <kbd className="px-1 py-0.5 rounded bg-zinc-800 font-mono text-[9px]">F12</kbd> &gt; <strong>Network</strong> tab &gt; right-click any request to <code className="text-violet-300 font-mono">echo360.net.au</code> &gt; <strong>Copy &gt; Copy as cURL</strong> (or <strong>Copy request headers</strong>).
                          </p>
                          <p className="text-[10px] text-amber-400/90 leading-tight pt-0.5">
                            💡 Echo360 session cookies are <code className="font-mono text-zinc-300">HttpOnly</code>, so <code className="font-mono text-zinc-300">document.cookie</code> in console cannot see them. Copying via DevTools Network tab bypasses this cleanly!
                          </p>
                        </div>
                      </div>

                      {/* Red Danger Warning Card with Checkbox (OFF by Default) */}
                      <div className="p-3 rounded-xl bg-red-950/30 border border-red-600/70 text-red-200 space-y-2 animate-in fade-in">
                        <div className="flex items-center gap-2">
                          <AlertOctagon className="w-4 h-4 text-red-400 shrink-0" />
                          <span className="text-xs font-bold text-red-300 uppercase tracking-wide">
                            Credential Persistence Warning (Danger)
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-300 leading-relaxed">
                          Session cookies contain sensitive authentication tokens (UNSW Single Sign-On and CloudFront streaming keys).
                          Saving writes these credentials unencrypted to local disk (<code className="text-red-300 font-mono">.echo360_session/</code>).
                          By default, this is <strong>disabled</strong> so your cookie remains strictly in this temporary browser tab.
                        </p>
                        <label className="flex items-center gap-2.5 pt-1 text-xs text-red-200 font-bold cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={persistCookieToDisk}
                            onChange={(e) => setPersistCookieToDisk(e.target.checked)}
                            className="w-4 h-4 rounded border-red-500 text-red-600 accent-red-600 focus:ring-red-500 cursor-pointer"
                          />
                          <span>⚠️ Persist this session cookie to local disk for future reuse (DANGER)</span>
                        </label>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-zinc-300 uppercase flex items-center justify-between">
                          <span>Paste Copied cURL Command, Request Headers, or Cookies</span>
                          <span className="text-[10px] font-normal text-zinc-500">Auto-detected & parsed</span>
                        </label>
                        <div className="flex gap-2 items-start">
                          <textarea
                            rows={2}
                            placeholder="Paste your copied cURL command (curl 'https://echo360.net.au/...' -H 'cookie: ...'), Request Headers, or raw cookie string here..."
                            value={pastedCookieString}
                            onChange={(e) => setPastedCookieString(e.target.value)}
                            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 font-mono focus:outline-hidden focus:border-violet-500 resize-none"
                          />
                          <button
                            type="button"
                            onClick={handleSaveEchoSession}
                            disabled={savingSession || !pastedCookieString.trim()}
                            className={`px-4 py-3 rounded-lg text-white font-bold text-xs shrink-0 cursor-pointer transition flex items-center gap-1.5 shadow-md ${
                              persistCookieToDisk
                                ? "bg-red-700 hover:bg-red-600 border border-red-500/80 shadow-red-950/50"
                                : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/40"
                            }`}
                          >
                            {savingSession ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : persistCookieToDisk ? (
                              <Save className="w-3.5 h-3.5" />
                            ) : (
                              <Zap className="w-3.5 h-3.5" />
                            )}
                            <span>
                              {savingSession
                                ? "Connecting..."
                                : persistCookieToDisk
                                ? "Save to Cookie Vault & Connect"
                                : "Use in Current Tab Only (Ephemeral)"}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Auto-Pull Mode Switcher: Batch Course Syllabus vs Single Lecture */}
                <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
                  <button
                    type="button"
                    onClick={() => setPullMode("batch")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      pullMode === "batch"
                        ? "bg-violet-600 text-white shadow-md shadow-violet-950/40"
                        : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>⚡ Auto-Process Course (All Lectures)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPullMode("single")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      pullMode === "single"
                        ? "bg-violet-600 text-white shadow-md shadow-violet-950/40"
                        : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                    }`}
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    <span>Single Lecture Link</span>
                  </button>
                </div>

                {/* BATCH COURSE SYLLABUS MODE */}
                {pullMode === "batch" ? (
                  <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-4">
                    {/* Stepper Navigation */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <button
                          type="button"
                          onClick={() => setIngestStep("select-lectures")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                            ingestStep === "select-lectures"
                              ? "bg-violet-600 text-white shadow-xs"
                              : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"
                          }`}
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>1. Select & Download Lectures</span>
                        </button>
                        <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
                        <button
                          type="button"
                          onClick={() => setIngestStep("upload-content")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                            ingestStep === "upload-content"
                              ? "bg-violet-600 text-white shadow-xs"
                              : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"
                          }`}
                        >
                          <FileUp className="w-3.5 h-3.5" />
                          <span>2. Upload Course Notes & Slides</span>
                          {contentBoxes.length > 0 && (
                            <span className="px-1.5 py-0.2 rounded-full bg-violet-900/80 text-violet-200 text-[10px] font-mono">
                              {contentBoxes.reduce((acc, b) => acc + b.files.length, 0)}
                            </span>
                          )}
                        </button>
                      </div>

                      {ingestStep === "select-lectures" && discoveredLectures.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setIngestStep("upload-content")}
                          className="text-xs text-violet-400 hover:text-violet-300 font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <span>Upload Materials</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                      {ingestStep === "upload-content" && (
                        <button
                          type="button"
                          onClick={() => setIngestStep("select-lectures")}
                          className="text-xs text-zinc-400 hover:text-zinc-200 font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <ArrowLeft className="w-3 h-3" />
                          <span>Back to Queue</span>
                        </button>
                      )}
                    </div>

                    {autoPullError && (
                      <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-800/70 text-red-200 text-xs space-y-1 animate-in fade-in">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 font-bold text-red-300">
                            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                            <span>Course Not Found</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setAutoPullError(null)}
                            className="text-zinc-400 hover:text-white text-xs cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                        <p className="text-zinc-300 pl-6 leading-relaxed">
                          {autoPullError}
                        </p>
                      </div>
                    )}

                    {/* STEP 1: SELECT & DOWNLOAD LECTURES */}
                    {ingestStep === "select-lectures" ? (
                      <div className="space-y-4">
                        {/* Course / Syllabus Discovery Form */}
                        <div className="space-y-3">
                          {echoSessionStatus?.hasSession && echoSessionStatus?.courseCode ? (
                            <div className="p-3.5 rounded-xl bg-violet-950/40 border border-violet-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20">
                                  <Sparkles className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-white flex items-center gap-2">
                                    <span>Course from Echo360 Cookie:</span>
                                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-violet-600/30 text-violet-200 border border-violet-500/40 font-bold">
                                      {echoSessionStatus.courseCode}
                                    </span>
                                    {echoSessionStatus.term && (
                                      <span className="text-[11px] text-zinc-400 font-normal">
                                        ({echoSessionStatus.term})
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-zinc-400 mt-0.5">
                                    {echoSessionStatus.courseTitle || `Auto-loaded directly from your connected Echo360 session cookie.`}
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const target = echoSessionStatus.sectionUrl || echoSessionStatus.courseCode!;
                                  setSectionUrl(target);
                                  handleDiscoverLectures(target);
                                }}
                                disabled={discoveringSection}
                                className="px-3.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold text-xs shrink-0 cursor-pointer transition flex items-center gap-1.5 shadow-md shadow-violet-950/40"
                              >
                                {discoveringSection ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                                <span>{discoveringSection ? "Discovering..." : "Re-Discover from Cookie"}</span>
                              </button>
                            </div>
                          ) : (
                            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 text-xs text-amber-200 flex items-center justify-between gap-2">
                              <span>No active Echo360 cookie detected. Connect your session above to auto-detect course.</span>
                              <button
                                type="button"
                                onClick={() => setShowSessionSetup(true)}
                                className="px-2.5 py-1 rounded bg-amber-900/60 hover:bg-amber-800 text-amber-100 font-bold text-[10px] shrink-0 cursor-pointer"
                              >
                                Connect Session
                              </button>
                            </div>
                          )}

                          {/* Unified Course Code & Section URL Bar */}
                          <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <label className="text-zinc-300 font-semibold flex items-center gap-1.5">
                                <BookOpen className="w-3.5 h-3.5 text-violet-400" />
                                <span>Course Code, Section URL, or Syllabus Link</span>
                              </label>
                              {echoSessionStatus?.hasSession && echoSessionStatus?.courseCode && (
                                <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  <span>Active: {echoSessionStatus.courseCode}</span>
                                </span>
                              )}
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <input
                                type="text"
                                placeholder="e.g. MATH3701, MATH2621, or paste Echo360 Section URL..."
                                value={sectionUrl}
                                onChange={(e) => setSectionUrl(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleDiscoverLectures();
                                  }
                                }}
                                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-100 font-mono focus:outline-hidden focus:border-violet-500 placeholder:text-zinc-600 shadow-inner"
                              />
                              <button
                                type="button"
                                onClick={() => handleDiscoverLectures()}
                                disabled={discoveringSection}
                                className="px-4 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold text-xs shrink-0 cursor-pointer transition flex items-center justify-center gap-2 shadow-md shadow-violet-950/40"
                              >
                                {discoveringSection ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-violet-200" />}
                                <span>{discoveringSection ? "Discovering..." : "Auto-Discover All Lectures"}</span>
                              </button>
                            </div>
                          </div>

                          {/* Official UNSW Course Outline Card */}
                          {courseOutline && (
                            <div className="p-3.5 rounded-xl bg-gradient-to-r from-violet-950/30 via-zinc-900/60 to-zinc-900/60 border border-violet-800/40 space-y-3 animate-in fade-in">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded bg-violet-600/30 border border-violet-500/40 text-violet-300 font-bold text-[10px] tracking-wide uppercase flex items-center gap-1">
                                      <BookOpen className="w-3 h-3 text-violet-400" />
                                      <span>UNSW Official Course Outline</span>
                                    </span>
                                    {isClosestMatch && (
                                      <span className="px-2 py-0.5 rounded bg-amber-950/70 border border-amber-800/60 text-amber-300 text-[10px] font-semibold">
                                        Closest Match ({closestYear || detectedYear})
                                      </span>
                                    )}
                                  </div>
                                  <h4 className="font-bold text-white text-xs sm:text-sm">
                                    {courseOutline.courseCode} — {courseOutline.courseName}
                                  </h4>
                                  <p className="text-[11px] text-zinc-400">
                                    {courseOutline.school || courseOutline.faculty || "UNSW Sydney"} • {courseOutline.career || "Undergraduate"}
                                  </p>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                                    <Calendar className="w-3.5 h-3.5 text-violet-400" />
                                    <select
                                      value={detectedYear}
                                      disabled={loadingOutline || availableYears.length <= 1}
                                      onChange={(e) => handleChangeOutlineYear(e.target.value)}
                                      className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 font-bold focus:outline-hidden focus:border-violet-500 cursor-pointer disabled:opacity-80"
                                      title={availableYears.length <= 1 ? "Only existing year for this course" : "Select year"}
                                    >
                                      {availableYears.map((yr) => (
                                        <option key={yr} value={yr}>
                                          Year {yr}
                                        </option>
                                      ))}
                                    </select>
                                    <select
                                      value={detectedTerm}
                                      disabled={loadingOutline || availableTerms.length <= 1}
                                      onChange={(e) => handleChangeOutlineTerm(e.target.value)}
                                      className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 font-bold focus:outline-hidden focus:border-violet-500 cursor-pointer disabled:opacity-80"
                                      title={availableTerms.length <= 1 ? "Only existing term for this course" : "Select term"}
                                    >
                                      {availableTerms.map((t) => (
                                        <option key={t} value={t}>
                                          {t}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  {courseOutline.coid && (
                                    <a
                                      href={`https://courseoutlines.unsw.edu.au/courseoutline?coid=${courseOutline.coid}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 text-[11px] font-medium flex items-center gap-1 transition"
                                    >
                                      <span>View Outline</span>
                                      <ExternalLink className="w-3 h-3 text-zinc-400" />
                                    </a>
                                  )}
                                </div>
                              </div>

                              {/* Outline Metrics */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1 border-t border-zinc-800/80">
                                <div className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800">
                                  <span className="text-zinc-500 block text-[10px] uppercase font-bold">Schedule</span>
                                  <span className="text-zinc-200 font-semibold">{courseOutline.schedule?.length || 0} Topics</span>
                                </div>
                                <div className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800">
                                  <span className="text-zinc-500 block text-[10px] uppercase font-bold">Assessments</span>
                                  <span className="text-zinc-200 font-semibold">{courseOutline.assessments?.length || 0} Tasks</span>
                                </div>
                                <div className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800">
                                  <span className="text-zinc-500 block text-[10px] uppercase font-bold">Units of Credit</span>
                                  <span className="text-zinc-200 font-semibold">{courseOutline.uoc || "6 UOC"}</span>
                                </div>
                                <div className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800">
                                  <span className="text-zinc-500 block text-[10px] uppercase font-bold">Coordinator</span>
                                  <span className="text-zinc-200 font-semibold truncate block" title={courseOutline.convenorName || courseOutline.coordinatorName}>
                                    {courseOutline.convenorName || courseOutline.coordinatorName || "UNSW Staff"}
                                  </span>
                                </div>
                              </div>

                              {/* 1-Click Course Hub Creation Action */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2.5 border-t border-violet-800/40">
                                <div className="space-y-0.5">
                                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>Create Course Hub from Discovered Outline</span>
                                  </div>
                                  <p className="text-[11px] text-zinc-400">
                                    {courseOutline.courseCode} ({detectedTerm}, {detectedYear}) will be initialized with full schedule &amp; dossiers — zero manual typing.
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={handleCreateCourseFromOutline}
                                  disabled={isCreatingCourse}
                                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition cursor-pointer disabled:opacity-50 shrink-0"
                                >
                                  {isCreatingCourse ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                  <span>{isCreatingCourse ? "Initializing Hub..." : `⚡ Create Course Hub for ${courseOutline.courseCode}`}</span>
                                </button>
                              </div>

                              {createdCourseSuccess && (
                                <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800/70 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                  <span className="font-semibold">{createdCourseSuccess}</span>
                                </div>
                              )}

                              {/* Mismatch Warning: Active Cookie Course vs Current Outline Course */}
                              {echoSessionStatus?.hasSession && echoSessionStatus.courseCode && courseOutline && echoSessionStatus.courseCode !== courseOutline.courseCode && (
                                <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-800/50 text-[11px] text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-in fade-in">
                                  <div className="flex items-center gap-1.5">
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                    <span>
                                      Your Echo360 cookie is scoped to <strong>{echoSessionStatus.courseCode}</strong>, but you are viewing <strong>{courseOutline.courseCode}</strong>.
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setShowSessionSetup(true)}
                                    className="px-2.5 py-1 rounded bg-amber-900/70 hover:bg-amber-800 border border-amber-700/60 text-amber-100 font-bold text-[10px] shrink-0 cursor-pointer transition self-start sm:self-auto"
                                  >
                                    Update Cookie for {courseOutline.courseCode}
                                  </button>
                                </div>
                              )}

                              {/* If Course Outline loaded but no Echo360 section linked yet */}
                              {needsSectionUrl && discoveredLectures.length === 0 && (
                                <div className="p-3.5 rounded-xl bg-violet-950/40 border border-violet-800/50 text-[11px] text-violet-200 space-y-2.5">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <Sparkles className="w-4 h-4 text-violet-400 shrink-0" />
                                      <span className="font-semibold text-white">
                                        Public UNSW Course Outline Loaded ({detectedTerm}, {detectedYear})
                                      </span>
                                    </div>
                                    {availableYears.includes("2025") && detectedYear !== 2025 && (
                                      <button
                                        type="button"
                                        onClick={() => handleChangeOutlineYear("2025")}
                                        className="px-2.5 py-1 rounded bg-violet-800/80 hover:bg-violet-700 border border-violet-600/50 text-white font-bold text-[10px] transition cursor-pointer flex items-center gap-1 shadow-sm"
                                        title="Switch to 2025 Course Outline"
                                      >
                                        <Calendar className="w-3 h-3 text-violet-300" />
                                        <span>Switch to 2025</span>
                                      </button>
                                    )}
                                  </div>

                                  <div className="space-y-2 text-zinc-300 leading-relaxed">
                                    <p>
                                      Course code search pulls the official syllabus from the public UNSW handbook (defaulting to {detectedYear}).
                                    </p>
                                    {echoSessionStatus?.hasSession && echoSessionStatus?.courseCode && echoSessionStatus.courseCode !== courseOutline.courseCode && (
                                      <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-800/50 text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div className="flex items-center gap-1.5">
                                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                          <span>
                                            Connected session is for <strong>{echoSessionStatus.courseCode}</strong>. UNSW Moodle sessions are scoped to their specific course.
                                          </span>
                                        </div>
                                        {echoSessionStatus.sectionUrl && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setSectionUrl(echoSessionStatus.sectionUrl!);
                                              handleDiscoverLectures(echoSessionStatus.sectionUrl!);
                                            }}
                                            className="px-2.5 py-1 rounded bg-amber-600/80 hover:bg-amber-500 text-white font-bold text-[10px] shrink-0 transition flex items-center gap-1 cursor-pointer"
                                          >
                                            <Sparkles className="w-3 h-3" />
                                            <span>Load {echoSessionStatus.courseCode} Lectures</span>
                                          </button>
                                        )}
                                      </div>
                                    )}
                                    <p className="text-zinc-400 text-[10px]">
                                      To link actual recordings for {courseOutline.courseCode}, open {courseOutline.courseCode} in Moodle and paste its Echo360 Section URL or session cURL in Step 1.
                                    </p>
                                  </div>

                                  {courseOutline.schedule && courseOutline.schedule.length > 0 && (
                                    <button
                                      type="button"
                                      onClick={handlePopulateFromOutline}
                                      className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md"
                                    >
                                      <BookOpen className="w-3.5 h-3.5" />
                                      <span>📋 Populate Queue with Official Outline Lectures ({courseOutline.schedule.filter(s => s.type === "Lecture").length || courseOutline.schedule.length} Weeks)</span>
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Options Bar */}
                        <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={echoAudioOnly}
                              onChange={(e) => setEchoAudioOnly(e.target.checked)}
                              className="rounded border-zinc-700 text-violet-600 focus:ring-violet-500"
                            />
                            <span>Download <code className="text-zinc-200">.m4a</code> Audio (FFmpeg)</span>
                          </label>
                          <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={autoDistillAfterPull}
                              onChange={(e) => setAutoDistillAfterPull(e.target.checked)}
                              className="rounded border-zinc-700 text-violet-600 focus:ring-violet-500"
                            />
                            <span>Auto-Distill Notes & Intuitions (AI)</span>
                          </label>
                        </div>

                        {/* Discovered Lectures Queue */}
                        {discoveredLectures.length > 0 && (
                          <div className="space-y-3 pt-2 border-t border-zinc-800 animate-in fade-in">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-zinc-200">
                                  Course Lecture Queue ({discoveredLectures.length} Total)
                                </span>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                                  {discoveredLectures.filter(l => l.selected).length} Selected
                                </span>
                                {discoveredLectures.some(l => l.transcriptStatus === "loading") && (
                                  <span className="text-[10px] text-violet-400 flex items-center gap-1 font-medium animate-pulse">
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                    <span>Pulling transcripts in background...</span>
                                  </span>
                                )}
                                {batchComplete && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                                    ✓ Audio Downloads Complete
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 text-xs">
                                <button
                                  type="button"
                                  onClick={() => handleToggleSelectAll(true)}
                                  className="text-[11px] text-zinc-400 hover:text-white cursor-pointer"
                                >
                                  Select All
                                </button>
                                <span className="text-zinc-700">|</span>
                                <button
                                  type="button"
                                  onClick={() => handleToggleSelectAll(false)}
                                  className="text-[11px] text-zinc-400 hover:text-white cursor-pointer"
                                >
                                  Deselect All
                                </button>
                              </div>
                            </div>

                            {/* Live Batch Download Progress Bar */}
                            {isBatchDownloading && (
                              <div className="p-3 rounded-xl bg-violet-950/40 border border-violet-800/50 space-y-2 animate-in fade-in">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-semibold text-violet-200 flex items-center gap-2">
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-violet-400" />
                                    <span>Downloading Media {activeBatchProgress.current} of {activeBatchProgress.total}: {activeBatchProgress.title}</span>
                                  </span>
                                  <span className="font-mono text-violet-300 font-bold">{activeBatchProgress.percent}%</span>
                                </div>
                                <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-violet-500 via-indigo-500 to-emerald-500 transition-all duration-300 ease-out"
                                    style={{ width: `${activeBatchProgress.percent}%` }}
                                  />
                                </div>
                              </div>
                            )}

                            {/* Queue Table with Per-Lecture Progress Bars */}
                            <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1 rounded-lg border border-zinc-800/80 p-1.5 bg-zinc-950/60">
                              {discoveredLectures.map((l) => (
                                <div
                                  key={l.lessonId}
                                  className={`p-2.5 rounded-lg border flex flex-col gap-1.5 text-xs transition ${
                                    l.status === "done"
                                      ? "bg-emerald-950/15 border-emerald-800/30 text-emerald-200"
                                      : l.status === "media_ready"
                                      ? "bg-blue-950/20 border-blue-800/40 text-blue-200"
                                      : l.status === "pulling"
                                      ? "bg-violet-950/30 border-violet-800/50 text-violet-200"
                                      : l.status === "error"
                                      ? "bg-red-950/20 border-red-800/30 text-red-300"
                                      : "bg-zinc-900/60 border-zinc-800/60 text-zinc-300"
                                  }`}
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                      <input
                                        type="checkbox"
                                        checked={l.selected}
                                        disabled={isBatchDownloading || l.status === "done"}
                                        onChange={() => handleToggleLectureSelect(l.lessonId)}
                                        className="rounded border-zinc-700 text-violet-600 focus:ring-violet-500 cursor-pointer shrink-0"
                                      />
                                      <div className="flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-zinc-850 border border-zinc-700/70 text-zinc-400 text-[10px] font-mono shrink-0 hover:border-violet-500/60 focus-within:border-violet-500 transition shadow-xs">
                                        <span className="text-zinc-500 font-bold select-none text-[10px]">W</span>
                                        <input
                                          type="number"
                                          min={1}
                                          max={12}
                                          value={l.week}
                                          disabled={isBatchDownloading || l.status === "done"}
                                          onChange={(e) => handleUpdateLectureWeek(l.lessonId, parseInt(e.target.value, 10) || 1)}
                                          className="w-4 bg-transparent text-center font-bold text-zinc-100 focus:outline-hidden text-[10px] cursor-pointer focus:cursor-text"
                                          title="Week number (click to change)"
                                        />
                                      </div>
                                      <div className="min-w-0 flex-1 space-y-0.5">
                                        <input
                                          type="text"
                                          value={l.title}
                                          disabled={isBatchDownloading || l.status === "done"}
                                          onChange={(e) => handleUpdateLectureTitle(l.lessonId, e.target.value)}
                                          className="w-full bg-transparent hover:bg-zinc-800/40 focus:bg-zinc-850 px-1 py-0.5 rounded text-xs text-zinc-100 font-medium border border-transparent focus:border-zinc-700 focus:outline-hidden truncate"
                                          title="Click to edit lecture title"
                                        />
                                        {l.outlineTopic && (
                                          <div className="text-[10px] text-zinc-400 flex items-center gap-1 truncate pl-1">
                                            <span className="text-violet-400 font-semibold shrink-0">🎯 Outline:</span>
                                            <span className="truncate text-zinc-300">{l.outlineTopic}</span>
                                            {l.outlineDateRange && <span className="text-zinc-500">({l.outlineDateRange})</span>}
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    <div className="shrink-0 flex flex-wrap items-center gap-2 pl-7 sm:pl-0">
                                      {/* Transcript Status Indicator */}
                                      {l.transcriptStatus === "loading" && (
                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-950/80 text-violet-300 border border-violet-700/60 flex items-center gap-1.5 shadow-sm animate-pulse">
                                          <RefreshCw className="w-3 h-3 animate-spin text-violet-400" />
                                          <span>Transcript...</span>
                                        </span>
                                      )}
                                      {l.transcriptStatus === "ready" && (
                                        <span
                                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950/70 text-emerald-300 border border-emerald-700/50 flex items-center gap-1"
                                          title={l.transcriptPreview || `${l.transcriptCueCount} cues`}
                                        >
                                          <CheckCheck className="w-3 h-3 text-emerald-400" />
                                          <span>Ready</span>
                                        </span>
                                      )}

                                      {/* Status Badges */}
                                      {l.status === "queued" && (
                                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                                          Queued
                                        </span>
                                      )}
                                      {l.status === "media_ready" && (
                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-900/60 text-blue-200 border border-blue-700/50 flex items-center gap-1">
                                          <CheckCircle2 className="w-3 h-3 text-blue-400" />
                                          <span>Media Ready</span>
                                        </span>
                                      )}
                                      {l.status === "distilling" && (
                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-violet-900/60 text-violet-300 border border-violet-700/50 flex items-center gap-1 animate-pulse">
                                          <RefreshCw className="w-3 h-3 animate-spin" />
                                          <span>Distilling...</span>
                                        </span>
                                      )}
                                      {l.status === "done" && (
                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700/50 flex items-center gap-1">
                                          <Check className="w-3 h-3 text-emerald-400" />
                                          <span>Ingested</span>
                                        </span>
                                      )}
                                      {l.status === "error" && (
                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-red-900/60 text-red-300 border border-red-700/50">
                                          Error
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Multi-stage Progress Bar under Downloading Lecture Row */}
                                  {l.status === "pulling" && (
                                    <div className="pl-6 space-y-1 animate-in fade-in">
                                      <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                                        <div
                                          className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-300"
                                          style={{ width: `${l.progressPercent || 30}%` }}
                                        />
                                      </div>
                                      <div className="flex items-center justify-between text-[10px] text-zinc-400">
                                        <span className="flex items-center gap-1">
                                          <RefreshCw className="w-2.5 h-2.5 animate-spin text-violet-400" />
                                          <span>{l.progressStage || "Downloading media stream..."}</span>
                                        </span>
                                        <span className="font-mono text-violet-300">{l.progressPercent || 30}%</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>

                            {/* Start Batch Download / Next Step Button */}
                            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                              <button
                                type="button"
                                onClick={handleStartBatchDownload}
                                disabled={isBatchDownloading || discoveredLectures.filter(l => l.selected && l.status !== "done").length === 0}
                                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-emerald-600 hover:from-violet-500 hover:to-emerald-500 disabled:opacity-50 text-white font-bold text-xs tracking-wide cursor-pointer transition shadow-lg shadow-violet-950/50 flex items-center justify-center gap-2"
                              >
                                {isBatchDownloading ? (
                                  <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    <span>Downloading Audio Streams ({activeBatchProgress.current}/{activeBatchProgress.total})... Continue to Upload</span>
                                    <ArrowRight className="w-4 h-4" />
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-4 h-4" />
                                    <span>
                                      ⚡ Start Batch Download ({discoveredLectures.filter(l => l.selected && l.status !== "done").length} Lectures) & Continue to Content Upload
                                    </span>
                                    <ArrowRight className="w-4 h-4" />
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* STEP 2: COURSE CONTENT UPLOAD SCREEN */
                      <div className="space-y-4 animate-in fade-in">
                        {/* High-Level Lecture Download Summary Pinned Card */}
                        <div className="p-3.5 rounded-xl bg-gradient-to-r from-violet-950/50 via-zinc-900 to-zinc-900 border border-violet-800/40 space-y-2.5 shadow-md">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              {isBatchDownloading ? (
                                <RefreshCw className="w-4 h-4 animate-spin text-violet-400 shrink-0" />
                              ) : batchComplete ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              ) : (
                                <Layers className="w-4 h-4 text-violet-400 shrink-0" />
                              )}
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-white">
                                    {isBatchDownloading
                                      ? `Downloading Lecture Media (${activeBatchProgress.current} of ${activeBatchProgress.total} in progress)`
                                      : batchComplete
                                      ? `All Selected Lecture Audio & Transcripts Ready (${activeBatchProgress.total} Lectures)`
                                      : `Audio Downloads: ${discoveredLectures.filter(l => l.status === "media_ready" || l.status === "done").length} Ready`}
                                  </span>
                                  <span className="px-1.5 py-0.2 rounded bg-violet-900/60 text-violet-300 font-mono text-[10px]">
                                    {activeBatchProgress.percent}%
                                  </span>
                                </div>
                                <p className="text-[10px] text-zinc-400">
                                  {isBatchDownloading
                                    ? `Current: ${activeBatchProgress.title}`
                                    : "Audio streams are ready. Stage your course notes below, then start distillation."}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => setIngestStep("select-lectures")}
                              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[11px] font-semibold flex items-center gap-1 transition shrink-0 cursor-pointer border border-zinc-700"
                            >
                              <ArrowLeft className="w-3 h-3" />
                              <span>View Lecture Queue</span>
                            </button>
                          </div>

                          <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-violet-500 via-indigo-500 to-emerald-500 transition-all duration-300"
                              style={{ width: `${activeBatchProgress.percent || (batchComplete ? 100 : 0)}%` }}
                            />
                          </div>
                        </div>

                        {/* AI Engine Status Banner */}
                        <div className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs ${
                          aiConfigured.configured
                            ? "bg-emerald-950/20 border-emerald-800/40 text-emerald-300"
                            : "bg-amber-950/20 border-amber-800/40 text-amber-300"
                        }`}>
                          <div className="flex items-center gap-2.5">
                            {aiConfigured.configured ? (
                              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold">
                                  {aiConfigured.configured
                                    ? `AI Engine: ${aiConfigured.provider.toUpperCase()} (${aiConfigured.model || "Active"})`
                                    : "No AI Provider Configured"}
                                </span>
                                <span className={`px-1.5 py-0.2 rounded font-mono text-[9px] ${
                                  aiConfigured.configured ? "bg-emerald-900/60 text-emerald-300" : "bg-amber-900/60 text-amber-300"
                                }`}>
                                  {aiConfigured.configured ? "Model Selected" : "Setup Needed"}
                                </span>
                              </div>
                              <p className="text-[10px] text-zinc-400 mt-0.5">
                                {aiConfigured.configured
                                  ? `Distilling with ${aiConfigured.model}. LaTeX definitions, theorems, spoken intuitions (🎙️), and exam traps (⚠️) will be synthesized.`
                                  : "Click 'Select / Change Model' to configure your Gemini API key (or Ollama/OpenAI) and select your preferred model."}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setIsSettingsOpen(true)}
                            className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-semibold flex items-center gap-1.5 transition shrink-0 cursor-pointer border border-zinc-700 self-start sm:self-auto"
                          >
                            <Settings className="w-3.5 h-3.5" />
                            <span>{aiConfigured.configured ? "Select / Change Model" : "⚙️ Connect AI Key"}</span>
                          </button>
                        </div>

                        {/* Category Selector Bar & Box Creator */}
                        <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                              <FileUp className="w-3.5 h-3.5 text-violet-400" />
                              <span>Stage Course Materials (Slides, Problem Sheets, Notes)</span>
                            </label>
                            <span className="text-[10px] text-zinc-500">
                              PDF, LaTeX (.tex), Markdown, Text
                            </span>
                          </div>

                          {/* Category Pills */}
                          <div className="flex flex-wrap items-center gap-1.5 text-xs">
                            {[
                              { id: "problem_sheets", label: "Weekly Problem Sheet" },
                              { id: "slides", label: "Weekly Lecture (Slides)" },
                              { id: "course_notes", label: "Full Course Notes" },
                              { id: "past_papers", label: "Past Papers" },
                              { id: "other", label: "+ Others (write in)" }
                            ].map((pill) => (
                              <button
                                key={pill.id}
                                type="button"
                                onClick={() => setActivePill(pill.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                                  activePill === pill.id
                                    ? "bg-violet-600 text-white shadow-xs"
                                    : "bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60"
                                }`}
                              >
                                <span>{pill.label}</span>
                              </button>
                            ))}
                          </div>

                          {/* Custom Name Input if 'other' is chosen */}
                          {activePill === "other" && (
                            <div className="flex items-center gap-2 pt-1 animate-in fade-in">
                              <input
                                type="text"
                                placeholder="Type custom category name (e.g. Tutorial Solutions, Formula Sheet, Review Deck)..."
                                value={customPillName}
                                onChange={(e) => setCustomPillName(e.target.value)}
                                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 focus:outline-hidden focus:border-violet-500 placeholder:text-zinc-600 font-medium"
                              />
                            </div>
                          )}

                          {/* Add Upload Box Button */}
                          <button
                            type="button"
                            onClick={handleAddContentBox}
                            className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition shadow-xs"
                          >
                            <Plus className="w-3.5 h-3.5 text-violet-400" />
                            <span>
                              Add Upload Box for {activePill === "other" && customPillName.trim() ? customPillName.trim() : getPillLabel(activePill)}
                            </span>
                          </button>
                        </div>

                        {/* Staged Content Boxes Container */}
                        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                          {contentBoxes.length === 0 ? (
                            <div className="p-6 rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40 text-center space-y-1.5">
                              <FolderDown className="w-6 h-6 text-zinc-600 mx-auto" />
                              <p className="text-xs text-zinc-300 font-semibold">No Course Content Boxes Added Yet</p>
                              <p className="text-[11px] text-zinc-500 max-w-md mx-auto">
                                Click any category pill above and click <strong>&quot;Add Upload Box&quot;</strong> to stage weekly problem sheets, lecture slides, or complete course notes.
                              </p>
                            </div>
                          ) : (
                            contentBoxes.map((box) => (
                              <div
                                key={box.id}
                                className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2.5 animate-in fade-in"
                              >
                                <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 pb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded bg-violet-900/40 border border-violet-700/50 text-violet-300 font-bold text-[10px] uppercase">
                                      {box.categoryName}
                                    </span>

                                    {/* Smart Week Tagging Selector */}
                                    <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                                      <span>Week:</span>
                                      <select
                                        value={box.week}
                                        onChange={(e) =>
                                          handleUpdateBoxWeek(box.id, e.target.value === "all" ? "all" : parseInt(e.target.value, 10))
                                        }
                                        className="bg-zinc-800 border border-zinc-700 rounded px-1.5 py-0.5 text-[11px] text-zinc-200 focus:outline-hidden focus:border-violet-500 cursor-pointer"
                                      >
                                        <option value="all">All Weeks (Course-Wide)</option>
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((w) => (
                                          <option key={w} value={w}>
                                            Week {w}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleRemoveBox(box.id)}
                                    className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition cursor-pointer"
                                    title="Remove this upload box"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                {/* Drag and drop upload zone */}
                                <label className="flex flex-col items-center justify-center p-4 border border-dashed border-zinc-700/80 hover:border-violet-500 rounded-lg bg-zinc-950/60 cursor-pointer transition group">
                                  <Upload className="w-4 h-4 text-zinc-500 group-hover:text-violet-400 transition mb-1" />
                                  <span className="text-[11px] text-zinc-300 group-hover:text-white font-medium">
                                    Click or Drag &amp; Drop {box.categoryName} files
                                  </span>
                                  <span className="text-[10px] text-zinc-500">
                                    .pdf, .tex, .md, .txt, or .zip archive
                                  </span>
                                  <input
                                    type="file"
                                    multiple
                                    accept=".pdf,.tex,.latex,.md,.txt,.docx,.vtt,.srt,.zip,application/zip,application/x-zip-compressed"
                                    onChange={(e) => handleUploadFilesToBox(box.id, e.target.files)}
                                    className="hidden"
                                  />
                                </label>

                                {/* List of Staged Files */}
                                {box.files.length > 0 && (
                                  <div className="space-y-1 pt-1">
                                    {box.files.map((file, idx) => (
                                      <div
                                        key={idx}
                                        className="flex items-center justify-between p-1.5 rounded bg-zinc-950/80 border border-zinc-800 text-[11px]"
                                      >
                                        <div className="flex items-center gap-1.5 truncate">
                                          <FileText className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                                          <span className="text-zinc-200 truncate">{file.name}</span>
                                          <span className="text-zinc-500 text-[10px]">
                                            ({Math.round(file.size / 1024)} KB)
                                          </span>
                                        </div>
                                        <span className="text-[10px] text-emerald-400 font-medium px-1.5 py-0.2 rounded bg-emerald-950/80 border border-emerald-800/60">
                                          ✓ Staged
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>

                        {/* Footer Actions: Raw Outline vs AI Distillation (Sticky on Mobile) */}
                        <div className="sticky bottom-0 bg-zinc-900/95 backdrop-blur-xs pt-3 pb-1 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 z-10">
                          <button
                            type="button"
                            onClick={() => handleStartDistillationPipeline(false, false)}
                            className="text-xs text-zinc-400 hover:text-zinc-200 underline cursor-pointer"
                          >
                            📝 Save Raw Transcripts Without AI
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStartDistillationPipeline(true, true)}
                            disabled={discoveredLectures.filter(l => l.selected).length === 0}
                            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-emerald-600 hover:from-violet-500 hover:to-emerald-500 text-white font-bold text-xs tracking-wide cursor-pointer transition shadow-lg shadow-violet-950/50 flex items-center justify-center gap-2"
                          >
                            <Sparkles className="w-4 h-4" />
                            <span>
                              🚀 Finished Uploading — Start Distilling Notes with Course Context
                              {contentBoxes.reduce((acc, b) => acc + b.files.length, 0) > 0 &&
                                ` (${contentBoxes.reduce((acc, b) => acc + b.files.length, 0)} Files)`}
                            </span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* SINGLE LECTURE FORM */
                  <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-3.5">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                          <Link2 className="w-3.5 h-3.5 text-violet-400" />
                          <span>Echo360 Lesson URL or Course Code</span>
                        </label>
                      </div>
                      <input
                        type="text"
                        placeholder={`Type Course Code (e.g. ${courseId.toUpperCase()}) or paste Echo360 Lesson URL...`}
                        value={echoUrl}
                        onChange={(e) => setEchoUrl(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-200 font-mono focus:outline-hidden focus:border-violet-500 placeholder:text-zinc-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-zinc-400 uppercase">Week Number</label>
                        <input
                          type="number"
                          min={1}
                          max={12}
                          value={ingestWeek}
                          onChange={(e) => setIngestWeek(Number(e.target.value))}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 mt-1 focus:outline-hidden focus:border-violet-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-zinc-400 uppercase">Lecture Topic / Title (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. Cauchy Residues & Contour Integrals"
                          value={ingestTitle}
                          onChange={(e) => setIngestTitle(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 mt-1 focus:outline-hidden focus:border-violet-500"
                        />
                      </div>
                    </div>

                    {/* Options */}
                    <div className="pt-2 border-t border-zinc-800 space-y-2 text-xs">
                      <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={echoAudioOnly}
                          onChange={(e) => setEchoAudioOnly(e.target.checked)}
                          className="rounded border-zinc-700 text-violet-600 focus:ring-violet-500"
                        />
                        <span>Download Streamlined Audio Recording (<code className="text-zinc-200">.m4a</code> via FFmpeg for in-app waveform player)</span>
                      </label>

                      <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={autoDistillAfterPull}
                          onChange={(e) => setAutoDistillAfterPull(e.target.checked)}
                          className="rounded border-zinc-700 text-violet-600 focus:ring-violet-500"
                        />
                        <span>Auto-distill with AI immediately after pulling (extracts <span className="text-violet-300 font-medium">🎙️ Intuitions</span> & <span className="text-amber-300 font-medium">⚠️ Exam Traps</span>)</span>
                      </label>
                    </div>

                    {/* Live Progress Feedback */}
                    {autoPulling && (
                      <div className="p-3 rounded-xl bg-violet-950/40 border border-violet-800/50 flex items-center gap-3 text-xs text-violet-200 animate-pulse">
                        <RefreshCw className="w-4 h-4 animate-spin text-violet-400 shrink-0" />
                        <span>{autoPullProgress}</span>
                      </div>
                    )}

                    {autoPullError && (
                      <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/50 flex items-start gap-2.5 text-xs text-red-300">
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">Auto-Pull Failed:</span> {autoPullError}
                        </div>
                      </div>
                    )}

                    {autoPullSuccess && (
                      <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/50 flex items-center gap-2 text-xs text-emerald-300">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{autoPullProgress}</span>
                      </div>
                    )}

                    {/* Auto Pull Trigger Button */}
                    <button
                      type="button"
                      onClick={handleAutoPull}
                      disabled={autoPulling || !echoUrl.trim()}
                      className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-violet-950/60"
                    >
                      <Sparkles className="w-4 h-4 text-violet-200" />
                      <span>{autoPulling ? "Auto-Pulling Lecture..." : "⚡ Start Auto-Pull & Ingest"}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: UPLOAD & DROP FILES */}
            {ingestTab === "upload" && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* One-click demo sample prompt */}
                <div className="p-3.5 rounded-xl bg-violet-950/30 border border-violet-800/40 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-violet-300">
                    <Wand2 className="w-4 h-4 text-violet-400 shrink-0" />
                    <span>Want to test the AI distillation pipeline immediately?</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleLoadSample}
                    className="px-3 py-1 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shrink-0 cursor-pointer shadow-sm"
                  >
                    Load Sample Math Lecture
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Dropzone A: Transcript */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center justify-between">
                      <span>Spoken Transcript</span>
                      <span className="text-[10px] text-zinc-500 font-normal">(.vtt, .srt, .txt, .zip)</span>
                    </label>
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (e.dataTransfer.files?.[0]) handleTranscriptFileUpload(e.dataTransfer.files[0]);
                      }}
                      className="border border-dashed border-zinc-700 hover:border-violet-500/80 rounded-xl p-4 text-center bg-zinc-950/60 transition group cursor-pointer relative"
                    >
                      <input
                        type="file"
                        accept=".vtt,.srt,.txt,.json,.zip,application/zip"
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleTranscriptFileUpload(e.target.files[0]);
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <Mic className="w-6 h-6 text-violet-400 mx-auto mb-2 group-hover:scale-110 transition" />
                      {transcriptFileName ? (
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            <span className="truncate max-w-[180px]">{transcriptFileName}</span>
                          </p>
                          <p className="text-[10px] text-zinc-400">
                            {transcriptText.length > 0 ? `${transcriptText.split("\n").length} lines loaded` : "Loaded"}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs font-semibold text-zinc-300">Drop transcript or click to browse</p>
                          <p className="text-[10px] text-zinc-500 mt-0.5">Auto-cleans VTT timestamps and cue noise (supports .zip)</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dropzone B: Slides */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center justify-between">
                      <span>Slide Notes / Theorems</span>
                      <span className="text-[10px] text-zinc-500 font-normal">(.md, .txt, .tex, .zip)</span>
                    </label>
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (e.dataTransfer.files?.[0]) handleSlidesFileUpload(e.dataTransfer.files[0]);
                      }}
                      className="border border-dashed border-zinc-700 hover:border-violet-500/80 rounded-xl p-4 text-center bg-zinc-950/60 transition group cursor-pointer relative"
                    >
                      <input
                        type="file"
                        accept=".md,.txt,.text,.tex,.latex,.zip,application/zip"
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleSlidesFileUpload(e.target.files[0]);
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <FileText className="w-6 h-6 text-indigo-400 mx-auto mb-2 group-hover:scale-110 transition" />
                      {slidesFileName ? (
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            <span className="truncate max-w-[180px]">{slidesFileName}</span>
                          </p>
                          <p className="text-[10px] text-zinc-400">
                            {slideText.length > 0 ? `${slideText.length} characters` : "Loaded"}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs font-semibold text-zinc-300">Drop slide notes or click to browse</p>
                          <p className="text-[10px] text-zinc-500 mt-0.5">Markdown or text definitions and formulas</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Local Audio Linking (HTTP 206) */}
                <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-violet-400" />
                      <span>Local Audio Recording Filename (Optional)</span>
                    </label>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                      HTTP 206 Streaming
                    </span>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. week_04_lecture.m4a or lecture_01.mp3"
                    value={audioFilename}
                    onChange={(e) => setAudioFilename(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 font-mono focus:outline-hidden focus:border-violet-500"
                  />
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    To enable instant in-app audio playback with seeking, place your <code className="text-zinc-200">.m4a</code> or <code className="text-zinc-200">.mp3</code> in:
                    <br />
                    <code className="text-violet-300 font-mono">courses/{courseId.toUpperCase()}/raw_files/audio/{audioFilename || "<filename>.m4a"}</code>
                  </p>
                </div>
              </div>
            )}

            {/* TAB 3: DIRECT PASTE */}
            {ingestTab === "paste" && (
              <div className="space-y-3 animate-in fade-in duration-150">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-zinc-400 uppercase">Slide Notes / Text</label>
                    <span className="text-[10px] text-zinc-500">{slideText.length} characters</span>
                  </div>
                  <textarea
                    rows={4}
                    placeholder="Paste key definitions, theorems, or slide bullet points..."
                    value={slideText}
                    onChange={(e) => setSlideText(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-200 font-mono focus:outline-hidden focus:border-violet-500"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-zinc-400 uppercase">Spoken Transcript Text</label>
                    <span className="text-[10px] text-zinc-500">{transcriptText.length} characters</span>
                  </div>
                  <textarea
                    rows={6}
                    placeholder="Paste raw speech-to-text transcript or paste VTT content..."
                    value={transcriptText}
                    onChange={(e) => setTranscriptText(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-200 font-mono focus:outline-hidden focus:border-violet-500"
                  />
                </div>
              </div>
            )}

            {/* Common Metadata Fields */}
            <div className="pt-2 border-t border-zinc-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-zinc-400 uppercase">Week Number</label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={ingestWeek}
                  onChange={(e) => setIngestWeek(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 mt-1 focus:outline-hidden focus:border-violet-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-zinc-400 uppercase">Lecture Topic / Title</label>
                <input
                  type="text"
                  placeholder="e.g. Spectral Decomposition & Cauchy Residues"
                  value={ingestTitle}
                  onChange={(e) => setIngestTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 mt-1 focus:outline-hidden focus:border-violet-500"
                />
              </div>
            </div>

            {/* Modal Action Bar */}
            <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
              <div className="text-[11px] text-zinc-500">
                {!slideText && !transcriptText ? (
                  <span>Provide slides or a transcript above to begin.</span>
                ) : (
                  <span className="text-emerald-400 flex items-center gap-1 font-medium">
                    <Check className="w-3.5 h-3.5" />
                    <span>Ready for AI distillation</span>
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIngestModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:bg-zinc-800 cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRunExtraction}
                  disabled={extracting || (!slideText && !transcriptText)}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white transition flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg shadow-violet-950/50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{extracting ? "Distilling on AI Engine..." : "Distill & Save Note"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* AI Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
