"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { LectureNote, LectureInsight, Concept, QuestionMeta } from "@/lib/types";
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
  ChevronUp
} from "lucide-react";
import {
  isLocalStudio,
  getActiveCourseId,
  fetchLecturePack,
  loadActiveCourseData
} from "@/lib/pack-loader";

export default function LecturesPage() {
  const [courseId, setCourseId] = useState<string>("sample1001");
  const [lectures, setLectures] = useState<LectureNote[]>([]);
  const [selectedLecture, setSelectedLecture] = useState<LectureNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLocal, setIsLocal] = useState(true);
  const [showCapabilityDetails, setShowCapabilityDetails] = useState(false);

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
  const [ingestWeek, setIngestWeek] = useState(1);
  const [ingestTitle, setIngestTitle] = useState("");
  const [slideText, setSlideText] = useState("");
  const [transcriptText, setTranscriptText] = useState("");
  const [extracting, setExtracting] = useState(false);

  // Audio player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState("00:00:00");

  useEffect(() => {
    setIsLocal(isLocalStudio());
    const savedCourse = getActiveCourseId();
    setCourseId(savedCourse);

    fetch(`/api/lectures?course=${savedCourse}`)
      .then((res) => {
        if (!res.ok) throw new Error("API not available");
        return res.json();
      })
      .then((data: LectureNote[]) => {
        setLectures(data);
        if (data.length > 0) setSelectedLecture(data[0]);
      })
      .catch(async () => {
        const pack = await fetchLecturePack(savedCourse);
        if (pack && pack.lectures && pack.lectures.length > 0) {
          setLectures(pack.lectures);
          setSelectedLecture(pack.lectures[0]);
        }
      })
      .finally(() => setLoading(false));

    // Load concepts and questions for push selector
    fetch(`/api/concepts?course=${savedCourse}`)
      .then((res) => {
        if (!res.ok) throw new Error("API not available");
        return res.json();
      })
      .then((data) => setConcepts(data))
      .catch(async () => {
        const merged = await loadActiveCourseData();
        if (merged) setConcepts(merged.concepts);
      });

    fetch(`/api/questions?course=${savedCourse}`)
      .then((res) => {
        if (!res.ok) throw new Error("API not available");
        return res.json();
      })
      .then((data) => setQuestions(data))
      .catch(async () => {
        const merged = await loadActiveCourseData();
        if (merged) setQuestions(merged.questions);
      });
  }, []);

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
            Distilled intuitions, lecturer exam traps, and timestamped audio insights for {courseId.toUpperCase()}.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIngestModalOpen(true)}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg cursor-pointer ${
            isLocal
              ? "bg-violet-600 hover:bg-violet-500 text-white shadow-violet-950/50"
              : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
          }`}
          title={isLocal ? "Ingest a new lecture from slides & transcript" : "AI Ingest is available via local Ollama or your API key"}
        >
          <Sparkles className="w-4 h-4 text-violet-200" />
          <span>Ingest New Lecture</span>
        </button>
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
            <Link
              href="/guide#local-studio"
              className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm shrink-0"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Run Localhost Studio</span>
            </Link>
          </div>
        </div>

        {/* Side-by-Side Capabilities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* GitHub Pages Column */}
          <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-400 flex items-center gap-1.5">
                <Globe className="w-4 h-4" />
                <span>🌐 GitHub Pages (Active Now)</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/40">
                Read & Study Mode
              </span>
            </div>
            <ul className="space-y-1.5 text-zinc-300 text-[11px] leading-relaxed">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Distilled Notes & KaTeX Math:</strong> Read complete theory summaries, proofs, and definitions.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>🎙️ Spoken Intuitions:</strong> Read captured metaphors and mental models lecturers said aloud in class.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>⚠️ Exam Warnings:</strong> Review explicit exam warnings highlighting common student pitfalls.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Layer 2 Toggle:</strong> Turn lecture callout overlays ON/OFF across question sheets & concepts.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Echo360 Timestamp Links:</strong> Clicking any timestamp jumps directly to that second in Echo360.</span>
              </li>
            </ul>
          </div>

          {/* Localhost Studio Column */}
          <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-indigo-400 flex items-center gap-1.5">
                <HardDrive className="w-4 h-4" />
                <span>🖥️ Localhost Studio (<code className="text-zinc-200">npm run dev</code>)</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800/40">
                Full Powerhouse Mode
              </span>
            </div>
            <ul className="space-y-1.5 text-zinc-300 text-[11px] leading-relaxed">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                <span><strong>Local Audio HTTP 206 Streaming:</strong> Stream local <code className="text-zinc-200">.m4a</code>/<code className="text-zinc-200">.mp3</code> files directly in-app with instant waveform seeking.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                <span><strong>Automated Echo360 Download:</strong> Run <code className="text-zinc-200">python scripts/echo360_helper.py</code> to batch-download university recordings, slides, and transcripts.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                <span><strong>Offline Speech-to-Text:</strong> Transcribe audio completely private on your GPU/CPU using OpenAI Whisper.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                <span><strong>AI Slide + Transcript Distillation:</strong> Use local Ollama or cloud LLMs to synthesize slide decks and transcripts.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                <span><strong>Direct-to-Disk Injection:</strong> 1-click push to save insights permanently into your local Git Markdown files.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Detailed Breakdown (Expandable) */}
        {showCapabilityDetails && (
          <div className="pt-3 border-t border-zinc-800 text-xs text-zinc-400 space-y-2 animate-in fade-in">
            <p className="font-semibold text-zinc-200">How to launch Localhost Studio on your computer:</p>
            <div className="p-3 rounded-xl bg-zinc-950 font-mono text-[11px] text-zinc-300 space-y-1 border border-zinc-800">
              <div>git clone https://github.com/noobchester/course-noting.git</div>
              <div>cd course-noting</div>
              <div>npm install</div>
              <div className="text-emerald-400">npm run dev</div>
              <div className="text-zinc-500"># Open http://localhost:3000 to access the complete Local Studio with full audio streaming!</div>
            </div>
          </div>
        )}
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Sidebar: Lecture List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Recorded Lectures ({lectures.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-zinc-500 text-sm animate-pulse bg-zinc-900/50 rounded-2xl border border-zinc-800">
              Loading lectures...
            </div>
          ) : lectures.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-xs bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-800 space-y-2">
              <Mic className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="font-semibold text-zinc-300">No lectures ingested yet</p>
              <p className="text-zinc-500">Click &quot;Ingest New Lecture&quot; to parse slides & transcripts.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {lectures.map((lec) => {
                const isSelected = selectedLecture?.id === lec.id;
                return (
                  <button
                    key={lec.id}
                    type="button"
                    onClick={() => setSelectedLecture(lec)}
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
        <div className="lg:col-span-8 p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-6 shadow-xl">
          {selectedLecture ? (
            <>
              {/* Top Lecture Detail Header */}
              <div className="border-b border-zinc-800 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-violet-400 uppercase tracking-wider">
                    Week {selectedLecture.week} • Lecture Notes
                  </span>
                  {selectedLecture.echo360Url && (
                    <a
                      href={selectedLecture.echo360Url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                    >
                      <span>Open in Echo360</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
                <h2 className="text-2xl font-black text-white mt-1">{selectedLecture.title}</h2>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4.5 h-4.5 text-violet-400" />
                <span>Ingest Lecture into Study Stream</span>
              </h3>
              <button
                type="button"
                onClick={() => setIngestModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-zinc-400 uppercase">Week Number</label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={ingestWeek}
                  onChange={(e) => setIngestWeek(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 mt-1"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-zinc-400 uppercase">Lecture Topic / Title</label>
                <input
                  type="text"
                  placeholder="e.g. Spectral Decomposition & Eigenbasis"
                  value={ingestTitle}
                  onChange={(e) => setIngestTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 mt-1"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-400 uppercase">Slide Notes / Text</label>
              <textarea
                rows={4}
                placeholder="Paste key definitions and theorems from slides..."
                value={slideText}
                onChange={(e) => setSlideText(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-200 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-400 uppercase">Spoken Transcript Text</label>
              <textarea
                rows={6}
                placeholder="Paste raw speech-to-text transcript or drop VTT text..."
                value={transcriptText}
                onChange={(e) => setTranscriptText(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-200 font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIngestModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs text-zinc-400 hover:bg-zinc-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRunExtraction}
                disabled={extracting || (!slideText && !transcriptText)}
                className="px-5 py-2 rounded-lg text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white transition flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg shadow-violet-950/50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{extracting ? "Distilling on AI Engine..." : "Distill & Save Note"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
