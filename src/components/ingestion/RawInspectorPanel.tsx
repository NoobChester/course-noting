"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FileText,
  Volume2,
  Search,
  Clock,
  RefreshCw,
  HardDrive,
  AlertCircle,
  X
} from "lucide-react";
import { IngestLectureItem } from "@/context/BackgroundIngestContext";

export interface RawTranscriptSummary {
  filename: string;
  mediaId: string;
  size: number;
  chars: number;
  cueCount: number;
  modifiedAt: string;
  preview: string;
}

export interface RawAudioSummary {
  filename: string;
  mediaId: string;
  size: number;
  modifiedAt: string;
  audioUrl: string;
}

export interface WeekCoverageInfo {
  chars: number;
  items: number;
  isInsufficient: boolean;
}

export interface MergedRawMediaItem {
  mediaId: string;
  title: string;
  week?: number;
  outlineTopic?: string;
  transcript?: RawTranscriptSummary;
  audio?: RawAudioSummary;
}

interface RawInspectorPanelProps {
  courseId: string;
  transcripts: RawTranscriptSummary[];
  audioFiles: RawAudioSummary[];
  discoveredLectures: IngestLectureItem[];
  coverageByWeek: Record<number, WeekCoverageInfo>;
  selectedMediaId: string | null;
  onSelectMediaId: (mediaId: string) => void;
  loadingRaw: boolean;
  onRefreshRaw: () => void;
  extractedPreview: { filename: string; content: string; chars: number } | null;
  onCloseExtractedPreview: () => void;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function parseTimestampToSeconds(ts: string): number | null {
  const parts = ts.split(":").map((p) => parseInt(p, 10));
  if (parts.some((n) => Number.isNaN(n))) return null;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return null;
}

export function RawInspectorPanel({
  courseId,
  transcripts,
  audioFiles,
  discoveredLectures,
  coverageByWeek,
  selectedMediaId,
  onSelectMediaId,
  loadingRaw,
  onRefreshRaw,
  extractedPreview,
  onCloseExtractedPreview
}: RawInspectorPanelProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [transcriptState, setTranscriptState] = useState<{
    key: string;
    content: string;
    error: string | null;
  }>({ key: "", content: "", error: null });
  const [searchQuery, setSearchQuery] = useState("");

  const mergedItems = useMemo<MergedRawMediaItem[]>(() => {
    const map = new Map<string, MergedRawMediaItem>();

    const findMeta = (mediaId: string) =>
      discoveredLectures.find(
        (l) =>
          l.mediaId === mediaId ||
          l.lessonId === mediaId ||
          mediaId.startsWith(l.mediaId) ||
          l.mediaId.startsWith(mediaId)
      );

    for (const tr of transcripts) {
      const meta = findMeta(tr.mediaId);
      map.set(tr.mediaId, {
        mediaId: tr.mediaId,
        title: meta?.title || `Recording (${tr.mediaId.slice(0, 8)})`,
        week: meta?.week,
        outlineTopic: meta?.outlineTopic,
        transcript: tr
      });
    }

    for (const au of audioFiles) {
      const existing = map.get(au.mediaId);
      const meta = findMeta(au.mediaId);
      if (existing) {
        existing.audio = au;
      } else {
        map.set(au.mediaId, {
          mediaId: au.mediaId,
          title: meta?.title || `Recording (${au.mediaId.slice(0, 8)})`,
          week: meta?.week,
          outlineTopic: meta?.outlineTopic,
          audio: au
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => {
      if (a.week !== undefined && b.week !== undefined && a.week !== b.week) {
        return a.week - b.week;
      }
      return a.title.localeCompare(b.title);
    });
  }, [transcripts, audioFiles, discoveredLectures]);

  const activeItem = useMemo(
    () => mergedItems.find((m) => m.mediaId === selectedMediaId) || mergedItems[0] || null,
    [mergedItems, selectedMediaId]
  );

  const activeTranscriptFilename = activeItem?.transcript?.filename || "";
  const activeTranscriptKey = activeTranscriptFilename ? `${courseId}:${activeTranscriptFilename}` : "";

  useEffect(() => {
    if (!activeTranscriptFilename || !courseId) return;

    let cancelled = false;
    const targetKey = `${courseId}:${activeTranscriptFilename}`;

    fetch(
      `/api/lectures/raw?course=${encodeURIComponent(courseId)}&file=${encodeURIComponent(
        activeTranscriptFilename
      )}`
    )
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load transcript");
        if (!cancelled) {
          setTranscriptState({ key: targetKey, content: data.content || "", error: null });
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setTranscriptState({
            key: targetKey,
            content: "",
            error: err instanceof Error ? err.message : "Could not read transcript"
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [courseId, activeTranscriptFilename]);

  const loadingTranscript = Boolean(activeTranscriptKey && transcriptState.key !== activeTranscriptKey);
  const transcriptError =
    activeTranscriptKey && transcriptState.key === activeTranscriptKey ? transcriptState.error : null;
  const transcriptText =
    activeTranscriptKey && transcriptState.key === activeTranscriptKey ? transcriptState.content : "";

  const filteredLines = useMemo(() => {
    const lines = transcriptText.split(/\r?\n/).filter((line) => line.trim().length > 0);
    const q = searchQuery.trim().toLowerCase();
    if (!q) return lines;
    return lines.filter((line) => line.toLowerCase().includes(q));
  }, [transcriptText, searchQuery]);

  const handleSeekAudio = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = seconds;
    audio.play().catch(() => {});
  };

  return (
    <section
      id="raw-inspector"
      className="rounded-2xl bg-zinc-900/70 border border-zinc-800 p-5 sm:p-6 space-y-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-cyan-400" />
            <h2 className="text-base sm:text-lg font-bold text-white">
              Raw Ingestion Inspector
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-[10px] font-mono">
              {mergedItems.length} item{mergedItems.length === 1 ? "" : "s"} on disk
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Inspect raw downloaded transcripts and stream local <code className="text-zinc-300">.m4a</code> audio files from{" "}
            <code className="text-zinc-300">courses/{courseId.toUpperCase()}/raw_files/</code>.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefreshRaw}
          disabled={loadingRaw}
          className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingRaw ? "animate-spin" : ""}`} />
          <span>Refresh Disk</span>
        </button>
      </div>

      {extractedPreview && (
        <div className="rounded-xl bg-zinc-950 border border-indigo-500/40 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2 border-b border-zinc-800 pb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
              <FileText className="w-4 h-4" />
              <span>Extracted Material Preview: {extractedPreview.filename}</span>
              <span className="text-[10px] font-mono text-zinc-400">
                ({extractedPreview.chars.toLocaleString()} chars)
              </span>
            </div>
            <button
              type="button"
              onClick={onCloseExtractedPreview}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
              title="Close preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <pre className="max-h-72 overflow-y-auto whitespace-pre-wrap text-xs text-zinc-300 font-mono leading-relaxed bg-zinc-900/50 p-3 rounded-lg">
            {extractedPreview.content}
          </pre>
        </div>
      )}

      {mergedItems.length === 0 ? (
        <div className="p-10 rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40 text-center space-y-2">
          <FileText className="w-7 h-7 text-zinc-600 mx-auto" />
          <p className="text-sm font-semibold text-zinc-300">
            No raw lecture transcripts or audio files on disk yet
          </p>
          <p className="text-xs text-zinc-500">
            Pull recordings from Echo360 above or drop <code className="text-zinc-300">.vtt</code> / <code className="text-zinc-300">.txt</code> / <code className="text-zinc-300">.m4a</code> files into any lecture row.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: Ingested media list */}
          <div className="lg:col-span-4 space-y-2 max-h-[540px] overflow-y-auto pr-1">
            {mergedItems.map((item) => {
              const selected = activeItem?.mediaId === item.mediaId;
              const weekCov = item.week ? coverageByWeek[item.week] : undefined;

              return (
                <button
                  key={item.mediaId}
                  type="button"
                  onClick={() => onSelectMediaId(item.mediaId)}
                  className={`w-full text-left p-3 rounded-xl border transition space-y-2 cursor-pointer ${
                    selected
                      ? "bg-indigo-950/40 border-indigo-500/60 shadow-md"
                      : "bg-zinc-950/60 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-zinc-100 truncate">
                        {item.title}
                      </div>
                      {item.outlineTopic && (
                        <div className="text-[11px] text-zinc-400 truncate mt-0.5">
                          {item.outlineTopic}
                        </div>
                      )}
                    </div>
                    {item.week !== undefined && (
                      <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px] font-mono shrink-0">
                        W{item.week}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
                    {item.transcript ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-300">
                        {item.transcript.cueCount} cues • {(item.transcript.chars / 1000).toFixed(1)}k chars
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-500">
                        No transcript
                      </span>
                    )}

                    {item.audio ? (
                      <span className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
                        Audio {formatBytes(item.audio.size)}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-500">
                        No audio
                      </span>
                    )}

                    {weekCov && (
                      <span
                        className={`px-2 py-0.5 rounded border ${
                          weekCov.isInsufficient
                            ? "bg-amber-950/40 border-amber-500/30 text-amber-300"
                            : "bg-indigo-950/40 border-indigo-500/30 text-indigo-300"
                        }`}
                      >
                        PDFs: {(weekCov.chars / 1000).toFixed(1)}k
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: Audio player + Raw transcript viewer */}
          <div className="lg:col-span-8 rounded-xl bg-zinc-950 border border-zinc-800 p-4 space-y-4">
            {activeItem && (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">{activeItem.title}</h3>
                    <div className="text-[11px] font-mono text-zinc-500 truncate">
                      mediaId: {activeItem.mediaId}
                    </div>
                  </div>
                  {activeItem.week !== undefined && (
                    <span className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 self-start sm:self-auto">
                      Week {activeItem.week}
                    </span>
                  )}
                </div>

                {/* Audio Player */}
                <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
                      <Volume2 className="w-4 h-4" />
                      <span>Local Audio Stream</span>
                    </span>
                    {activeItem.audio && (
                      <span className="text-[11px] font-mono text-zinc-400">
                        {activeItem.audio.filename} ({formatBytes(activeItem.audio.size)})
                      </span>
                    )}
                  </div>
                  {activeItem.audio ? (
                    <audio
                      ref={audioRef}
                      key={activeItem.audio.audioUrl}
                      controls
                      preload="metadata"
                      src={activeItem.audio.audioUrl}
                      className="w-full h-10"
                    />
                  ) : (
                    <p className="text-xs text-zinc-500">
                      No <code className="text-zinc-400">.m4a</code> audio file downloaded for this recording yet.
                    </p>
                  )}
                </div>

                {/* Transcript Viewer */}
                <div className="space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                      <FileText className="w-4 h-4" />
                      <span>
                        Raw Transcript{" "}
                        {activeItem.transcript
                          ? `(${activeItem.transcript.filename} • ${activeItem.transcript.cueCount} cues)`
                          : ""}
                      </span>
                    </div>

                    {activeItem.transcript && (
                      <div className="relative w-full sm:w-64">
                        <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Filter transcript lines..."
                          className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    )}
                  </div>

                  {!activeItem.transcript ? (
                    <div className="p-6 rounded-xl bg-zinc-900/40 border border-zinc-800 text-xs text-zinc-500 text-center">
                      No transcript file on disk for this recording.
                    </div>
                  ) : loadingTranscript ? (
                    <div className="p-6 rounded-xl bg-zinc-900/40 border border-zinc-800 text-xs text-zinc-400 text-center">
                      Loading raw transcript...
                    </div>
                  ) : transcriptError ? (
                    <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-200 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{transcriptError}</span>
                    </div>
                  ) : (
                    <div className="max-h-96 overflow-y-auto rounded-xl bg-zinc-900/50 border border-zinc-800 p-3 space-y-1.5">
                      {filteredLines.length === 0 ? (
                        <div className="text-xs text-zinc-500 py-4 text-center">
                          No matching lines found.
                        </div>
                      ) : (
                        filteredLines.map((line, idx) => {
                          const tsMatch = line.match(/^\[(\d{1,2}:\d{2}(?::\d{2})?)\]\s*(.*)$/);
                          if (tsMatch) {
                            const ts = tsMatch[1];
                            const text = tsMatch[2];
                            const seconds = parseTimestampToSeconds(ts);
                            return (
                              <div key={idx} className="flex items-start gap-2.5 text-xs leading-relaxed">
                                <button
                                  type="button"
                                  disabled={!activeItem.audio || seconds === null}
                                  onClick={() => seconds !== null && handleSeekAudio(seconds)}
                                  title={activeItem.audio ? `Jump audio to ${ts}` : "Audio not downloaded"}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-cyan-900/60 disabled:opacity-50 text-cyan-300 font-mono text-[10px] shrink-0 mt-0.5 transition cursor-pointer disabled:cursor-default"
                                >
                                  <Clock className="w-2.5 h-2.5" />
                                  <span>{ts}</span>
                                </button>
                                <span className="text-zinc-200">{text}</span>
                              </div>
                            );
                          }
                          return (
                            <div key={idx} className="text-xs text-zinc-300 leading-relaxed">
                              {line}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
