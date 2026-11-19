import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import crypto from "node:crypto";
import { execFile } from "child_process";
import { promisify } from "util";
import matter from "gray-matter";
import { fetchUNSWCourseOutline } from "../../courses/outline/route";
import { distillLongLecture, preprocessTranscriptWithAnchors } from "@/lib/lecture-ingest";
import { transcribeAudioWithGemini } from "@/lib/gemini-audio";
import { loadCourseMaterialContext } from "@/lib/material-extractor";

const execFileAsync = promisify(execFile);

const BASE_DIR = process.cwd();
const SESSION_DIR = path.join(BASE_DIR, ".echo360_session");
const COOKIES_FILE = path.join(SESSION_DIR, "cookies.json");
const VAULT_FILE = path.join(SESSION_DIR, "vault.json");
const COURSES_DIR = path.join(BASE_DIR, "courses");

export function safeMatterStringify(content: string = "", frontmatter: Record<string, any> = {}): string {
  const cleanContent = String(content || "");
  const cleanFrontmatter: Record<string, any> = {};
  for (const [key, value] of Object.entries(frontmatter)) {
    if (value !== undefined) {
      cleanFrontmatter[key] = value;
    }
  }
  const fullyCleaned = JSON.parse(
    JSON.stringify(cleanFrontmatter, (key, val) => (val === undefined ? undefined : val))
  );
  return matter.stringify(cleanContent, fullyCleaned);
}

function looksLikeShellOrHttpHeaders(text: string): boolean {
  return (
    /^\s*curl(?:\.exe)?\b/i.test(text) ||
    /^\s*(?::method|:path|:authority|:scheme|GET|POST|PUT|HEAD)\b/im.test(text) ||
    /^\s*(?:host|user-agent|accept|referer|origin|sec-fetch-[a-z-]+)\s*:/im.test(text)
  );
}

function unescapeWindowsCmdCurl(text: string): string {
  // Collapse Windows cmd line continuations (^ at end of line)
  let out = text.replace(/\^\r?\n\s*/g, " ");
  // Chrome/Edge Windows "Copy as cURL (cmd)" escapes inner quotes as ^\^" or ^\"
  out = out.replace(/\^\\\^"/g, '\\"').replace(/\^\\"/g, '\\"');
  // Unescape remaining cmd ^-escaped characters (^", ^&, ^%, ^^, ^|, ^<, ^>)
  out = out.replace(/\^([\s\S])/g, "$1");
  return out;
}

function readNextCurlArg(input: string, startPos: number): { value: string; nextPos: number } | null {
  let i = startPos;
  while (i < input.length && /\s/.test(input[i])) i++;
  if (i >= input.length) return null;

  // Support bash $'...' ANSI-C quoting
  if (input[i] === "$" && input[i + 1] === "'") {
    i += 1;
  }

  const quote = input[i];
  if (quote === "'" || quote === '"') {
    i++;
    let buf = "";
    while (i < input.length) {
      const ch = input[i];
      if (quote === "'") {
        // Bash single-quote escape sequence: '\''
        if (ch === "'" && input.slice(i, i + 4) === "'\\''") {
          buf += "'";
          i += 4;
          continue;
        }
        if (ch === "'") {
          return { value: buf, nextPos: i + 1 };
        }
        buf += ch;
        i++;
      } else {
        if (ch === "\\" && i + 1 < input.length) {
          const next = input[i + 1];
          if (next === '"' || next === "\\" || next === "$") {
            buf += next;
            i += 2;
            continue;
          }
        }
        if (ch === '"') {
          return { value: buf, nextPos: i + 1 };
        }
        buf += ch;
        i++;
      }
    }
    return { value: buf, nextPos: i };
  }

  let buf = "";
  while (i < input.length && !/\s/.test(input[i])) {
    buf += input[i];
    i++;
  }
  return buf ? { value: buf, nextPos: i } : null;
}

function extractCookieFromCurl(rawText: string): string {
  const isCmdStyle = /\^"/.test(rawText) || /\^\r?\n/.test(rawText);
  const normalized = isCmdStyle
    ? unescapeWindowsCmdCurl(rawText)
    : rawText.replace(/\\\r?\n\s*/g, " ");

  let i = 0;
  while (i < normalized.length) {
    const ch = normalized[i];
    if (ch === "'" || ch === '"') {
      const skipped = readNextCurlArg(normalized, i);
      if (!skipped) break;
      i = skipped.nextPos;
      continue;
    }

    const atBoundary = i === 0 || /\s/.test(normalized[i - 1]);
    if (atBoundary) {
      const rest = normalized.slice(i);
      const flagMatch = rest.match(/^(?:--cookie|-b|--header|-H)(?=\s|=)/);
      if (flagMatch) {
        const flag = flagMatch[0];
        let argStart = i + flag.length;
        if (normalized[argStart] === "=") argStart++;
        const arg = readNextCurlArg(normalized, argStart);
        if (arg) {
          if (flag === "-b" || flag === "--cookie") {
            if (arg.value.includes("=")) {
              return arg.value.replace(/[\r\n]+/g, " ").trim();
            }
          } else {
            const cookieHdr = arg.value.match(/^cookie\s*:\s*(.+)$/i);
            if (cookieHdr) {
              return cookieHdr[1].replace(/[\r\n]+/g, " ").trim();
            }
          }
          i = arg.nextPos;
          continue;
        }
      }
    }
    i++;
  }
  return "";
}

export function parseCookiesFromAnyInput(raw: string): string {
  if (!raw || !raw.trim()) return "";
  const text = raw.trim();

  // 1. JSON array of cookie objects: [{"name": "...", "value": "..."}]
  if (text.startsWith("[") && text.endsWith("]")) {
    try {
      const arr = JSON.parse(text);
      if (Array.isArray(arr)) {
        return arr
          .filter(
            (c): c is { name: unknown; value: unknown } =>
              Boolean(c && typeof c === "object" && "name" in c && "value" in c && c.name && c.value !== undefined)
          )
          .map((c) => `${String(c.name).trim()}=${String(c.value).replace(/[\r\n]+/g, "")}`)
          .join("; ");
      }
    } catch {}
  }

  // 2. cURL command (Chrome/Edge/Firefox: Copy as cURL bash or Windows cmd, -b/--cookie or -H/--header)
  if (/^\s*curl(?:\.exe)?\b/i.test(text) || /(?:^|\s)(?:-b|--cookie|-H|--header)\s+[\^"']?/i.test(text)) {
    const fromCurl = extractCookieFromCurl(text);
    if (fromCurl) return fromCurl;
  }

  // 3. Raw HTTP Request Headers block (Copy request headers) -> match cookie: line
  const lineCookieMatch = text.match(/^cookie\s*:\s*(.+)$/im);
  if (lineCookieMatch) {
    return lineCookieMatch[1].replace(/[\r\n]+/g, " ").trim();
  }

  // 4. Reject unparsed cURL commands or multi-line HTTP header blocks instead of sending them as a Cookie header
  if (looksLikeShellOrHttpHeaders(text)) {
    return "";
  }

  // 5. Prefix with "Cookie: "
  if (/^cookie\s*:\s*/i.test(text)) {
    return text.replace(/^cookie\s*:\s*/i, "").replace(/[\r\n]+/g, " ").trim();
  }

  // 6. Raw cookie string (must contain at least one name=value pair and no newlines)
  const sanitized = text.replace(/[\r\n]+/g, " ").trim();
  return sanitized.includes("=") ? sanitized : "";
}

export function mergeCookies(baseCookie: string, res: Response): string {
  const cookieMap = new Map<string, string>();
  const addPair = (pair: string) => {
    const trimmed = pair.trim();
    if (!trimmed) return;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx <= 0) return;
    const name = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).replace(/[\r\n]+/g, "").trim();
    if (name) cookieMap.set(name, val);
  };

  if (baseCookie) {
    for (const part of baseCookie.split(";")) {
      addPair(part);
    }
  }

  let setCookies: string[] = [];
  const hdrs = res.headers as Headers & { getSetCookie?: () => string[] };
  if (typeof hdrs.getSetCookie === "function") {
    try {
      setCookies = hdrs.getSetCookie();
    } catch {}
  }
  if (setCookies.length === 0) {
    const rawSetCookie = res.headers.get("set-cookie");
    if (rawSetCookie) {
      setCookies = rawSetCookie.split(/,\s*(?=[^;,=\s]+=)/);
    }
  }

  for (const sc of setCookies) {
    const firstSegment = sc.split(";")[0];
    if (firstSegment) addPair(firstSegment);
  }

  return Array.from(cookieMap.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

export function extractUrlFromInput(raw: string): string {
  if (!raw || !raw.trim()) return "";
  const text = raw.trim().replace(/\^\r?\n\s*/g, " ");
  const curlUrlMatch = text.match(/curl(?:\.exe)?\s+[\^"']*(https?:\/\/[^\s"'^]+)/i);
  if (curlUrlMatch) return curlUrlMatch[1];
  const urlMatch = text.match(/(https?:\/\/[^\s"'>^]+)/);
  if (urlMatch && (urlMatch[1].includes("echo360") || urlMatch[1].includes("lesson") || urlMatch[1].includes("section"))) {
    return urlMatch[1];
  }
  return text;
}

function extractMediaId(htmlOrUrl: string): string | null {
  if (!htmlOrUrl) return null;

  // 1. Explicit mediaId JSON/JS property
  const mediaIdMatch = htmlOrUrl.match(/(?:\\?"mediaId\\?"|mediaId)\s*[:=]\s*\\?["']([0-9a-fA-F-]{36})\\?["']/i);
  if (mediaIdMatch) return mediaIdMatch[1];

  // 2. Echo360 media paths: .../echoplayer/media/<uuid> or .../media/<uuid>
  const mediaPathMatch = htmlOrUrl.match(
    /(?:echoplayer\/media|\/media)\/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/i
  );
  if (mediaPathMatch) return mediaPathMatch[1];

  // 3. Nested "video": { ... "media": { ... "id": "<uuid>" } } JSON structure
  const nestedVideoMediaMatch = htmlOrUrl.match(
    /"video"\s*:\s*\{[\s\S]{0,400}?"media"\s*:\s*\{[\s\S]{0,200}?"id"\s*:\s*"([0-9a-fA-F-]{36})"/i
  );
  if (nestedVideoMediaMatch) return nestedVideoMediaMatch[1];

  // 4. Only match arbitrary/lesson UUIDs when input is a single URL (never raw HTML)
  const trimmed = htmlOrUrl.trim();
  if (/^https?:\/\/\S+$/i.test(trimmed) && !trimmed.includes("<")) {
    const urlUuidMatch = trimmed.match(/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/i);
    if (urlUuidMatch) return urlUuidMatch[1];
  }

  return null;
}

function parseEcho360Transcript(json: any): { lines: string[]; fullText: string; cueCount: number } {
  let cues: any[] = [];
  function findCues(obj: any) {
    if (!obj) return;
    if (Array.isArray(obj)) {
      for (const item of obj) findCues(item);
    } else if (typeof obj === "object") {
      if (Array.isArray(obj.cues)) {
        cues = obj.cues;
        return;
      }
      for (const val of Object.values(obj)) {
        findCues(val);
        if (cues.length > 0) return;
      }
    }
  }
  findCues(json);

  const formattedLines: string[] = [];
  let prevText = "";

  for (const cue of cues) {
    const rawContent = (cue.content || cue.text || "").trim();
    if (!rawContent || rawContent.toLowerCase() === prevText.toLowerCase()) continue;

    let timestampPrefix = "";
    if (typeof cue.start === "number") {
      const totalSec = Math.floor(cue.start > 10000 ? cue.start / 1000 : cue.start);
      const hrs = String(Math.floor(totalSec / 3600)).padStart(2, "0");
      const mins = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
      const secs = String(totalSec % 60).padStart(2, "0");
      timestampPrefix = `[${hrs}:${mins}:${secs}] `;
    }

    formattedLines.push(`${timestampPrefix}${rawContent}`);
    prevText = rawContent;
  }

  return {
    lines: formattedLines,
    fullText: formattedLines.join("\n"),
    cueCount: formattedLines.length
  };
}



function detectYearsAndTerms(dates: string[], sectionName: string = ""): {
  year: string;
  term: string;
  availableYears: string[];
  availableTerms: string[];
} {
  const yearsSet = new Set<string>();
  const termsSet = new Set<string>();

  // Check section name for 4-digit year (e.g. 2024, 2025, 2026, 2027)
  const yearInName = sectionName.match(/\b(202\d)\b/);
  if (yearInName) {
    yearsSet.add(yearInName[1]);
  }

  // Check section name for T1, T2, T3 or Term 1, Term 2, Term 3
  const termMatches = sectionName.match(/\b(T[123]|Term\s*[123])\b/gi) || [];
  for (const t of termMatches) {
    const raw = t.toUpperCase();
    if (raw.includes("1")) termsSet.add("Term 1");
    else if (raw.includes("2")) termsSet.add("Term 2");
    else if (raw.includes("3")) termsSet.add("Term 3");
  }

  // Inspect dates from lessons
  for (const d of dates) {
    if (!d) continue;
    const parsed = new Date(d);
    if (!isNaN(parsed.getTime())) {
      yearsSet.add(parsed.getFullYear().toString());
      const month = parsed.getMonth(); // 0 = Jan, 11 = Dec
      if (month >= 0 && month <= 4) termsSet.add("Term 1");
      else if (month >= 5 && month <= 7) termsSet.add("Term 2");
      else if (month >= 8 && month <= 11) termsSet.add("Term 3");
    }
  }

  const availableYears = Array.from(yearsSet).sort().reverse();
  const availableTerms = Array.from(termsSet).sort();

  const currentYear = new Date().getFullYear().toString();
  const year = availableYears[0] || (yearInName ? yearInName[1] : currentYear);
  const term = availableTerms[0] || "Term 1";

  return {
    year,
    term,
    availableYears: availableYears.length > 0 ? availableYears : [year],
    availableTerms: availableTerms.length > 0 ? availableTerms : [term]
  };
}

function pickBestEchoStreamUrl(mediaContainer: unknown, echoHost: string): string | null {
  if (!mediaContainer || typeof mediaContainer !== "object") return null;

  interface ScoredCandidate {
    url: string;
    priority: number;
    sizeMetric: number;
    order: number;
  }

  const candidates: ScoredCandidate[] = [];
  let order = 0;

  const toFullUrl = (rawUrl: string): string | null => {
    const val = normalizeEscapedMediaText(rawUrl.trim());
    if (!val || (!val.startsWith("http://") && !val.startsWith("https://") && !val.startsWith("/"))) {
      return null;
    }
    return val.startsWith("/") ? `${echoHost}${val}` : val;
  };

  const collectFileArray = (arr: unknown, isSecondary: boolean) => {
    if (!Array.isArray(arr)) return;
    for (const entry of arr) {
      order++;
      if (typeof entry === "string") {
        const url = toFullUrl(entry);
        if (!url) continue;
        const prio = isSecondary ? 5 : /s0q\d+\.m3u8/i.test(url) ? 1 : /\.m3u8(?:[?#]|$)/i.test(url) ? 2 : 4;
        candidates.push({ url, priority: prio, sizeMetric: Number.MAX_SAFE_INTEGER, order });
        continue;
      }
      if (!entry || typeof entry !== "object") continue;
      const rec = entry as Record<string, unknown>;
      const rawUrl = [rec.s3Url, rec.uri, rec.url, rec.hlsUrl, rec.sourceUrl, rec.manifestUrl, rec.src].find(
        (v): v is string => typeof v === "string" && v.trim().length > 0
      );
      if (!rawUrl) continue;
      const url = toFullUrl(rawUrl);
      if (!url) continue;

      const sizeVal = typeof rec.size === "number" && rec.size > 0 ? rec.size : null;
      const widthVal = typeof rec.width === "number" && rec.width > 0 ? rec.width : null;
      const sizeMetric = sizeVal ?? (widthVal ? widthVal * 1_000_000 : Number.MAX_SAFE_INTEGER);
      const isExplicitAudio =
        rec.audioOnly === true ||
        /audio/i.test(String(rec.mediaType || rec.type || "")) ||
        /s0q\d+\.(?:m4a|mp4)/i.test(url) ||
        /\.(?:m4a|mp3)(?:[?#]|$)/i.test(url);

      let priority: number;
      if (isSecondary) {
        priority = 5;
      } else if (/s0q\d+\.m3u8/i.test(url)) {
        priority = 1;
      } else if (/\.m3u8(?:[?#]|$)/i.test(url)) {
        priority = 2;
      } else if (isExplicitAudio) {
        priority = 3;
      } else {
        priority = 4;
      }

      candidates.push({ url, priority, sizeMetric, order });
    }
  };

  const root = mediaContainer as Record<string, unknown>;
  const mediaLvl1 = (root.media && typeof root.media === "object" ? root.media : root) as Record<string, unknown>;
  const mediaLvl2 = (mediaLvl1.media && typeof mediaLvl1.media === "object" ? mediaLvl1.media : mediaLvl1) as Record<string, unknown>;
  const currentObj = (mediaLvl2.current && typeof mediaLvl2.current === "object" ? mediaLvl2.current : mediaLvl2) as Record<string, unknown>;

  const primarySources: unknown[] = [
    currentObj.primaryFiles,
    mediaLvl2.primaryFiles,
    mediaLvl1.primaryFiles,
    root.primaryFiles,
    currentObj.audioFiles,
    mediaLvl2.audioFiles,
    mediaLvl1.audioFiles,
    root.audioFiles,
    currentObj.playableMedias,
    mediaLvl2.playableMedias,
    mediaLvl1.playableMedias,
    root.playableMedias
  ];
  for (const srcArr of primarySources) {
    collectFileArray(srcArr, false);
  }

  const secondarySources: unknown[] = [
    currentObj.secondaryFiles,
    mediaLvl2.secondaryFiles,
    mediaLvl1.secondaryFiles,
    root.secondaryFiles
  ];
  for (const srcArr of secondarySources) {
    collectFileArray(srcArr, true);
  }

  if (candidates.length > 0) {
    candidates.sort((a, b) => a.priority - b.priority || a.sizeMetric - b.sizeMetric || a.order - b.order);
    return candidates[0].url;
  }

  return findStreamUrlInJson(mediaContainer, echoHost);
}

interface ParsedSyllabusLesson {
  lessonId: string;
  mediaId: string;
  title: string;
  week: number;
  date: string;
  rawStartTime: string;
  lessonUrl: string;
  hasVideo: boolean;
  streamUrl?: string;
  sectionId?: string;
  groupName?: string;
  status: string;
}

function parseSyllabusLessons(json: unknown, echoHost: string, sectionId?: string): ParsedSyllabusLesson[] {
  const items: ParsedSyllabusLesson[] = [];
  const jsonObj = json && typeof json === "object" ? (json as Record<string, unknown>) : null;
  const rawList = Array.isArray(json)
    ? json
    : ((jsonObj?.data || jsonObj?.lessons || jsonObj?.classes || []) as unknown[]);

  // Unwrap grouped weeks (entry.groupInfo + entry.lessons[]) into flat lecture rows
  const flattened: { raw: Record<string, unknown>; groupName: string }[] = [];
  for (const entry of rawList) {
    if (!entry || typeof entry !== "object") continue;
    const rec = entry as Record<string, unknown>;
    if (Array.isArray(rec.lessons)) {
      const groupInfo = (rec.groupInfo && typeof rec.groupInfo === "object" ? rec.groupInfo : {}) as Record<string, unknown>;
      const groupName = String(groupInfo.name || groupInfo.title || rec.name || "");
      for (const child of rec.lessons) {
        if (child && typeof child === "object") {
          flattened.push({ raw: child as Record<string, unknown>, groupName });
        }
      }
    } else {
      flattened.push({ raw: rec, groupName: "" });
    }
  }

  flattened.forEach(({ raw, groupName }, index) => {
    const rawLesson = raw.lesson && typeof raw.lesson === "object" ? (raw.lesson as Record<string, unknown>) : null;
    const container =
      rawLesson && (rawLesson.lesson || rawLesson.video || rawLesson.medias) ? rawLesson : raw;
    const l =
      container.lesson && typeof container.lesson === "object"
        ? (container.lesson as Record<string, unknown>)
        : container;

    const lessonId = String(l.id || container.id || raw.id || `lesson-${index + 1}`);
    const name = String(
      l.name ||
        l.title ||
        container.name ||
        raw.name ||
        (groupName ? `${groupName} — Lecture ${index + 1}` : `Lecture ${index + 1}`)
    );

    const videoObj = (container.video || raw.video || l.video) as Record<string, unknown> | undefined;
    const videoMediaObj = (
      videoObj?.media && typeof videoObj.media === "object" ? videoObj.media : videoObj
    ) as Record<string, unknown> | undefined;
    const mediasArr = (
      Array.isArray(container.medias)
        ? container.medias
        : Array.isArray(l.medias)
        ? l.medias
        : Array.isArray(raw.medias)
        ? raw.medias
        : []
    ) as Record<string, unknown>[];

    const vidFromMedias =
      mediasArr.find((m) => /video|audio/i.test(String(m?.mediaType || m?.type || ""))) || mediasArr[0];

    const candidateIds = [
      videoMediaObj?.id,
      videoObj?.mediaId,
      videoObj?.id,
      vidFromMedias?.id,
      vidFromMedias?.mediaId,
      l.mediaId,
      container.mediaId,
      raw.mediaId
    ]
      .map((v) => (typeof v === "string" ? v.trim() : ""))
      .filter((v) => Boolean(v) && !v.startsWith("G_"));

    const explicitMediaId = candidateIds[0] || "";
    const streamUrl = pickBestEchoStreamUrl(videoObj || container, echoHost);
    const hasVideo = Boolean(
      explicitMediaId ||
        streamUrl ||
        l.hasVideo ||
        container.hasVideo ||
        mediasArr.some((m) => /video|audio/i.test(String(m?.mediaType || m?.type || "")))
    );

    const timingObj = l.timing && typeof l.timing === "object" ? (l.timing as Record<string, unknown>) : undefined;
    const startTime = String(l.startTimeUtc || timingObj?.start || l.createdAt || "");

    let week = 1;
    const weekMatch =
      name.match(/week\s*(\d+)/i) ||
      name.match(/\bw(\d+)\b/i) ||
      groupName.match(/week\s*(\d+)/i) ||
      groupName.match(/\bw(\d+)\b/i);
    if (weekMatch) {
      week = parseInt(weekMatch[1], 10);
    } else {
      week = Math.floor(index / 2) + 1;
    }

    const dateStr = startTime
      ? new Date(startTime).toLocaleDateString("en-AU", { month: "short", day: "numeric" })
      : `Lecture ${index + 1}`;

    items.push({
      lessonId,
      mediaId: explicitMediaId || lessonId,
      title: name,
      week,
      date: dateStr,
      rawStartTime: startTime,
      lessonUrl: `${echoHost}/lesson/${lessonId}/classroom`,
      hasVideo,
      streamUrl: streamUrl || undefined,
      sectionId: sectionId || undefined,
      groupName: groupName || undefined,
      status: "queued"
    });
  });

  return items;
}

function extractLessonsFromHtml(html: string, echoHost: string) {
  const items: any[] = [];
  const lessonMatches = [...html.matchAll(/(?:lesson|media)\/([0-9a-fA-F-]{36})/g)];
  const seen = new Set<string>();

  lessonMatches.forEach((m) => {
    const id = m[1];
    if (seen.has(id)) return;
    seen.add(id);

    items.push({
      lessonId: id,
      mediaId: id,
      title: `Echo360 Lesson ${items.length + 1}`,
      week: Math.floor(items.length / 2) + 1,
      date: `Lecture ${items.length + 1}`,
      rawStartTime: "",
      lessonUrl: `${echoHost}/lesson/${id}/classroom`,
      hasVideo: true,
      status: "queued"
    });
  });

  return items;
}

function synthesizeNotesFromTranscript(
  rawTranscript: string,
  title: string,
  week: number,
  outlineTopic?: string,
  outlineDescription?: string,
  courseContext?: string
) {
  const lines = (rawTranscript || "").split("\n").filter((l) => l.trim().length > 0);
  const insights: any[] = [];
  const questionHints: any[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const timeMatch = line.match(/\[(\d{2}:\d{2}:\d{2})\]/);
    const ts = timeMatch ? timeMatch[1] : "";
    const cleanText = line.replace(/\[\d{2}:\d{2}:\d{2}\]/, "").trim();

    if (/exam|warning|mistake|trap|careful|penalty|don't forget|beware/i.test(cleanText)) {
      if (insights.filter((x) => x.type === "exam_warning").length < 3) {
        insights.push({
          type: "exam_warning",
          title: `Exam Warning (Week ${week})`,
          timestamp: ts,
          content: cleanText
        });
      }
    } else if (/think of|intuition|analogy|picture|geometrically|meaning|reason/i.test(cleanText)) {
      if (insights.filter((x) => x.type === "intuition").length < 3) {
        insights.push({
          type: "intuition",
          title: `Spoken Intuition (${title.slice(0, 30)})`,
          timestamp: ts,
          content: cleanText
        });
      }
    } else if (/problem|sheet|question|tutorial|homework|exercise/i.test(cleanText)) {
      if (questionHints.length < 3) {
        questionHints.push({
          questionId: `week-${week}`,
          timestamp: ts,
          hint: cleanText
        });
      }
    }
  }

  const topicHeading = outlineTopic ? `${title} — ${outlineTopic}` : title;
  const outlineCallout = outlineDescription
    ? `> [!NOTE] 🎯 Official UNSW Course Outline — Week ${week}: ${outlineTopic || title}\n> ${outlineDescription}\n\n`
    : "";

  const courseContextCallout = courseContext && courseContext.trim().length > 0
    ? `> [!TIP] 📚 Uploaded Course Materials Context (Problem Sheets & Slides)\n> ${courseContext.slice(0, 400).replace(/\n/g, " ")}...\n\n`
    : "";

  const outline = outlineTopic ? [outlineTopic, `Lecture: ${title}`] : (lines.length > 0 ? [`Topic: ${title}`] : []);

  const distilledContent = lines.length > 0
    ? `${outlineCallout}${courseContextCallout}### Spoken Transcript Highlights: ${topicHeading}

**Week ${week}**

${lines.slice(0, 30).join("\n")}
`
    : `${outlineCallout}${courseContextCallout}### Lecture Notes: ${topicHeading}

**Week ${week}**

*No spoken transcript was available on Echo360 for this recording.*
`;

  return {
    title: topicHeading,
    outline,
    distilledContent,
    insights,
    questionHints
  };
}

function buildUniqueNoteId(week: number, safeMediaId: string): string {
  const hash = crypto.createHash("sha1").update(safeMediaId).digest("hex").slice(0, 8);
  return `lecture-w${String(Number(week) || 1).padStart(2, "0")}-${hash}`;
}

let cachedFfmpegAvailable: boolean | null = null;
async function checkFfmpegAvailable(): Promise<boolean> {
  if (cachedFfmpegAvailable !== null) return cachedFfmpegAvailable;
  try {
    await execFileAsync("ffmpeg", ["-version"]);
    cachedFfmpegAvailable = true;
  } catch {
    cachedFfmpegAvailable = false;
  }
  return cachedFfmpegAvailable;
}

function isEchoAuthRedirect(res: Response, bodyText: string, echoHost: string): boolean {
  if (res.status === 401 || res.status === 403) return true;
  try {
    const expectedHost = new URL(echoHost).hostname.toLowerCase();
    if (res.url) {
      const finalUrl = new URL(res.url);
      if (finalUrl.hostname.toLowerCase() !== expectedHost) {
        return true;
      }
      if (/\/(?:login|signin|sign-in|sso|saml|oauth|auth)\b/i.test(finalUrl.pathname)) {
        return true;
      }
    }
  } catch {}
  if (
    bodyText &&
    (/SAMLRequest|login\.microsoftonline\.com|Sign in to your account/i.test(bodyText) ||
      /<form[^>]+(?:login|saml|signin)/i.test(bodyText))
  ) {
    return true;
  }
  return false;
}

function normalizeEscapedMediaText(raw: string): string {
  return raw
    .replace(/\\\//g, "/")
    .replace(/\\u002[fF]/g, "/")
    .replace(/\\u0026/g, "&")
    .replace(/&amp;/g, "&");
}

function extractStreamUrlFromPayload(raw: string, echoHost: string): string | null {
  if (!raw) return null;
  const text = normalizeEscapedMediaText(raw);

  // 1. Audio-only Echo360 HLS stream in master playlist or embedded manifest
  const s0qQuoted = text.match(/URI="([^"]*s0q\d+\.m3u8[^"]*)"/i);
  if (s0qQuoted) {
    const candidate = s0qQuoted[1];
    return candidate.startsWith("/") ? `${echoHost}${candidate}` : candidate;
  }

  // 2. Direct s0q*.m3u8 HTTPS URL
  const s0qUrl = text.match(/https?:\/\/[^"'\s\\<>]+?s0q\d+\.m3u8[^"'\s\\<>]*/i);
  if (s0qUrl) return s0qUrl[0];

  // 3. Any HTTPS .m3u8 playlist URL
  const anyM3u8 = text.match(/https?:\/\/[^"'\s\\<>]+?\.m3u8[^"'\s\\<>]*/i);
  if (anyM3u8) return anyM3u8[0];

  // 4. Relative .m3u8 path inside URI="..." or JSON property
  const relM3u8 = text.match(
    /(?:URI=|["'](?:uri|url|src|source|hlsUrl|manifestUrl)["']\s*:\s*)["'](\/[^"'\s\\<>]+?\.m3u8[^"'\s\\<>]*)["']/i
  );
  if (relM3u8) return `${echoHost}${relM3u8[1]}`;

  // 5. Progressive Echo360 audio/video stream fallback (ffmpeg extracts audio via -vn)
  const directStream = text.match(
    /https?:\/\/[^"'\s\\<>]+?(?:s\dq\d+\.(?:mp4|m4a)|\/audio[^"'\s\\<>]*\.(?:m4a|mp3|mp4))[^"'\s\\<>]*/i
  );
  if (directStream) return directStream[0];

  return null;
}

function findStreamUrlInJson(obj: unknown, echoHost: string): string | null {
  if (!obj) return null;
  const candidates: { url: string; priority: number }[] = [];

  const visit = (node: unknown, keyPath: string) => {
    if (!node) return;
    if (typeof node === "string") {
      const val = normalizeEscapedMediaText(node.trim());
      if (!val.startsWith("http") && !val.startsWith("/")) return;
      const fullUrl = val.startsWith("/") ? `${echoHost}${val}` : val;
      if (/s0q\d+\.m3u8/i.test(fullUrl)) {
        candidates.push({ url: fullUrl, priority: 1 });
      } else if (/\.m3u8(?:[?#]|$)/i.test(fullUrl)) {
        candidates.push({ url: fullUrl, priority: 2 });
      } else if (/s0q\d+\.(?:m4a|mp4)/i.test(fullUrl) || (/audio/i.test(keyPath) && /\.(?:m4a|mp3|mp4)(?:[?#]|$)/i.test(fullUrl))) {
        candidates.push({ url: fullUrl, priority: 3 });
      } else if (/(?:s\dq\d+\.mp4|(?:playable|primary|secondary|media).*\.mp4(?:[?#]|$))/i.test(`${keyPath}:${fullUrl}`)) {
        candidates.push({ url: fullUrl, priority: 4 });
      }
      return;
    }
    if (Array.isArray(node)) {
      for (const item of node) visit(item, keyPath);
      return;
    }
    if (typeof node === "object") {
      for (const [k, v] of Object.entries(node)) {
        visit(v, keyPath ? `${keyPath}.${k}` : k);
      }
    }
  };

  visit(obj, "");
  if (candidates.length > 0) {
    candidates.sort((a, b) => a.priority - b.priority);
    return candidates[0].url;
  }

  return extractStreamUrlFromPayload(JSON.stringify(obj), echoHost);
}

async function resolveRealPlayerMedia(opts: {
  safeMediaId: string;
  lessonUrl?: string;
  echoHost: string;
  activeCookie: string;
}): Promise<{
  resolvedMediaId: string;
  pageHtml: string;
  m3u8Url: string | null;
  authExpired: boolean;
  mergedCookie: string;
}> {
  const { safeMediaId, lessonUrl, echoHost, activeCookie } = opts;
  const userAgent =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

  const isUuid = (id: string) => Boolean(id) && !id.startsWith("G_") && /^[0-9a-fA-F-]{36}$/.test(id);
  const lessonIdFromUrl = lessonUrl?.match(/\/lesson\/([^/?#]+)/i)?.[1] || "";

  let resolvedMediaId = safeMediaId;
  let pageHtml = "";
  let m3u8Url: string | null = null;
  let authExpired = false;
  let mergedCookie = activeCookie;

  // 1. Fetch classroom / lesson page if available (or for G_... IDs)
  const targetUrl = lessonUrl || (safeMediaId.startsWith("G_") ? `${echoHost}/lesson/${safeMediaId}/classroom` : "");
  if (targetUrl) {
    try {
      const res = await fetch(targetUrl, { headers: { Cookie: mergedCookie, "User-Agent": userAgent } });
      mergedCookie = mergeCookies(mergedCookie, res);
      const html = await res.text();
      if (isEchoAuthRedirect(res, html, echoHost)) {
        return { resolvedMediaId, pageHtml: html, m3u8Url: null, authExpired: true, mergedCookie };
      }
      if (res.ok) {
        pageHtml = html;
        m3u8Url = extractStreamUrlFromPayload(html, echoHost);
        const extracted = extractMediaId(html);
        if (extracted && !isUuid(resolvedMediaId)) {
          resolvedMediaId = extracted;
        }
        // Check for embedded player iframe/route if stream URL wasn't inline
        if (!m3u8Url) {
          const embedMatch = html.match(/(?:src|href)=["']([^"']*\/(?:echoplayer|media)\/[^"']+)["']/i);
          if (embedMatch) {
            const embedUrl = embedMatch[1].startsWith("/") ? `${echoHost}${embedMatch[1]}` : embedMatch[1];
            if (embedUrl.startsWith(echoHost)) {
              try {
                const eRes = await fetch(embedUrl, { headers: { Cookie: mergedCookie, "User-Agent": userAgent } });
                mergedCookie = mergeCookies(mergedCookie, eRes);
                const eText = await eRes.text();
                if (!isEchoAuthRedirect(eRes, eText, echoHost) && eRes.ok) {
                  m3u8Url = extractStreamUrlFromPayload(eText, echoHost);
                }
              } catch {}
            }
          }
        }
      }
    } catch {}
  }

  // 2. Query Echo360 JSON lesson / player APIs whenever stream URL or real UUID is still missing
  const lessonLookupId = lessonIdFromUrl || (!isUuid(safeMediaId) ? safeMediaId : "");
  const jsonEndpoints: string[] = [];
  if (lessonLookupId) {
    jsonEndpoints.push(`${echoHost}/api/ui/lessons/${encodeURIComponent(lessonLookupId)}`);
    jsonEndpoints.push(`${echoHost}/api/ui/lessons/${encodeURIComponent(lessonLookupId)}/medias`);
  }
  if (isUuid(resolvedMediaId)) {
    jsonEndpoints.push(`${echoHost}/api/ui/echoplayer/media/${encodeURIComponent(resolvedMediaId)}`);
    jsonEndpoints.push(`${echoHost}/api/ui/medias/${encodeURIComponent(resolvedMediaId)}`);
    jsonEndpoints.push(`${echoHost}/api/ui/echoplayer/mediaplayer?mediaId=${encodeURIComponent(resolvedMediaId)}`);
  }

  const visited = new Set<string>();
  for (let idx = 0; idx < jsonEndpoints.length; idx++) {
    const endpoint = jsonEndpoints[idx];
    if (visited.has(endpoint) || (m3u8Url && isUuid(resolvedMediaId))) break;
    visited.add(endpoint);

    try {
      const jRes = await fetch(endpoint, {
        headers: { Cookie: mergedCookie, "User-Agent": userAgent, Accept: "application/json, text/plain, */*" }
      });
      mergedCookie = mergeCookies(mergedCookie, jRes);
      const rawText = await jRes.text();
      if (isEchoAuthRedirect(jRes, rawText, echoHost)) {
        authExpired = true;
        continue;
      }
      if (!jRes.ok) continue;

      let parsedJson: unknown = null;
      try {
        parsedJson = JSON.parse(rawText);
      } catch {}

      if (parsedJson && typeof parsedJson === "object" && !isUuid(resolvedMediaId)) {
        const rec = parsedJson as {
          data?: { medias?: { id?: string }[]; video?: { media?: { id?: string } } } | { id?: string }[];
          medias?: { id?: string }[];
          media?: { id?: string };
          video?: { media?: { id?: string } };
        };
        const dataVideoMedia = !Array.isArray(rec.data) ? rec.data?.video?.media?.id : undefined;
        const dataMedias = !Array.isArray(rec.data) ? rec.data?.medias?.[0]?.id : rec.data?.[0]?.id;
        const discoveredUuid =
          dataVideoMedia || rec.video?.media?.id || dataMedias || rec.medias?.[0]?.id || rec.media?.id || extractMediaId(rawText);
        if (discoveredUuid && isUuid(discoveredUuid)) {
          resolvedMediaId = discoveredUuid;
          jsonEndpoints.push(`${echoHost}/api/ui/echoplayer/media/${encodeURIComponent(discoveredUuid)}`);
          jsonEndpoints.push(`${echoHost}/api/ui/medias/${encodeURIComponent(discoveredUuid)}`);
        }
      }

      if (!m3u8Url) {
        m3u8Url = parsedJson
          ? pickBestEchoStreamUrl(parsedJson, echoHost)
          : extractStreamUrlFromPayload(rawText, echoHost);
      }
    } catch {}
  }

  return { resolvedMediaId, pageHtml, m3u8Url, authExpired, mergedCookie };
}

function extractSectionIdFromString(input?: string | null): string | null {
  if (!input) return null;
  const m = input.match(/section\/([0-9a-fA-F-]{36}|[0-9a-zA-Z_-]+)/i);
  return m ? m[1] : null;
}

async function resolveSectionIdForCourse(
  req: NextRequest,
  bodySectionId: string | undefined,
  cleanCourse: string
): Promise<string | null> {
  if (bodySectionId && bodySectionId.trim()) {
    return bodySectionId.trim();
  }

  const headerSectionUrl = req.headers.get("x-echo-section-url");
  const fromHeader = extractSectionIdFromString(headerSectionUrl);
  if (fromHeader) return fromHeader;

  for (const dirName of [cleanCourse, cleanCourse.toLowerCase()]) {
    try {
      const cfgRaw = await fs.readFile(path.join(/*turbopackIgnore: true*/ COURSES_DIR, dirName, "course.json"), "utf-8");
      const cfg = JSON.parse(cfgRaw) as { echo360SectionUrl?: string };
      const fromCfg = extractSectionIdFromString(cfg.echo360SectionUrl);
      if (fromCfg) return fromCfg;
    } catch {}
  }

  try {
    const vault = await getVaultSessions();
    const matched = vault.find((v) => v.courseCode?.toUpperCase() === cleanCourse || v.id === cleanCourse.toLowerCase());
    if (matched) {
      if (matched.sectionId) return matched.sectionId;
      const fromVaultUrl = extractSectionIdFromString(matched.sectionUrl);
      if (fromVaultUrl) return fromVaultUrl;
    }
  } catch {}

  return null;
}

async function refreshLessonFromSyllabus(opts: {
  echoHost: string;
  sectionId: string;
  lessonId?: string;
  mediaId?: string;
  activeCookie: string;
}): Promise<{
  matched: ParsedSyllabusLesson | null;
  mergedCookie: string;
  authExpired: boolean;
}> {
  const { echoHost, sectionId, lessonId, mediaId, activeCookie } = opts;
  const syllabusUrl = `${echoHost}/section/${encodeURIComponent(sectionId)}/syllabus`;
  let mergedCookie = activeCookie;

  try {
    const res = await fetch(syllabusUrl, {
      headers: {
        Cookie: mergedCookie,
        Accept: "application/json, text/plain, */*",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    mergedCookie = mergeCookies(mergedCookie, res);
    const text = await res.text();
    if (isEchoAuthRedirect(res, text, echoHost)) {
      return { matched: null, mergedCookie, authExpired: true };
    }
    if (!res.ok) {
      return { matched: null, mergedCookie, authExpired: false };
    }

    const sylJson = JSON.parse(text);
    const lessons = parseSyllabusLessons(sylJson, echoHost, sectionId);
    const matched =
      lessons.find(
        (l) =>
          (lessonId && (l.lessonId === lessonId || l.mediaId === lessonId)) ||
          (mediaId && (l.mediaId === mediaId || l.lessonId === mediaId))
      ) || null;

    return { matched, mergedCookie, authExpired: false };
  } catch {
    return { matched: null, mergedCookie, authExpired: false };
  }
}

async function enrichLessonsWithDiskState(lessons: any[], cleanCourse: string): Promise<void> {
  const courseDir = path.join(/*turbopackIgnore: true*/ COURSES_DIR, cleanCourse);
  const rawAudioDir = path.join(/*turbopackIgnore: true*/ courseDir, "raw_files", "audio");
  const rawTranscriptsDir = path.join(/*turbopackIgnore: true*/ courseDir, "raw_files", "transcripts");
  const checkpointsDir = path.join(/*turbopackIgnore: true*/ courseDir, "raw_files", "_checkpoints");
  const lecturesDir = path.join(/*turbopackIgnore: true*/ courseDir, "lectures");

  // Clean up any stale .tmp / .tmp.m4a files from previous interrupted downloads
  try {
    const audioFiles = await fs.readdir(rawAudioDir);
    for (const f of audioFiles) {
      if (f.endsWith(".tmp") || f.endsWith(".tmp.m4a")) {
        try { await fs.unlink(path.join(/*turbopackIgnore: true*/ rawAudioDir, f)); } catch {}
      }
    }
  } catch {}

  let lectureFiles: string[] = [];
  const parsedNotes: { file: string; id: string; week: number; echo360Url: string; sourceTranscript: string; data: any; content: string }[] = [];
  try {
    lectureFiles = (await fs.readdir(lecturesDir)).filter((f) => f.endsWith(".md"));
    for (const f of lectureFiles) {
      try {
        const raw = await fs.readFile(path.join(/*turbopackIgnore: true*/ lecturesDir, f), "utf-8");
        const parsed = matter(raw);
        parsedNotes.push({
          file: f,
          id: parsed.data.id || f.replace(/\.md$/, ""),
          week: Number(parsed.data.week) || 1,
          echo360Url: String(parsed.data.echo360Url || ""),
          sourceTranscript: String(parsed.data.sourceTranscript || ""),
          data: parsed.data,
          content: parsed.content || ""
        });
      } catch {}
    }
  } catch {}

  let checkpointFiles: string[] = [];
  try {
    checkpointFiles = await fs.readdir(checkpointsDir);
  } catch {}

  const ffmpegAvailable = await checkFfmpegAvailable();

  for (const l of lessons) {
    const safeId = (l.mediaId || l.lessonId || "").replace(/[^a-zA-Z0-9-_]/g, "");
    const safeLessonId = (l.lessonId || "").replace(/[^a-zA-Z0-9-_]/g, "");
    if (!safeId && !safeLessonId) continue;

    const candidateIds = Array.from(new Set([safeId, safeLessonId].filter(Boolean)));
    l.ffmpegAvailable = ffmpegAvailable;

    let hasAudio = false;
    for (const cid of candidateIds) {
      const audioFile = path.join(/*turbopackIgnore: true*/ rawAudioDir, `lecture_${cid}.m4a`);
      try {
        const stat = await fs.stat(audioFile);
        if (stat.size > 20000) {
          hasAudio = true;
          break;
        }
      } catch {}
    }

    let hasTranscript = false;
    let transcriptChars = 0;
    let cueCount = 0;
    for (const cid of candidateIds) {
      const transcriptFile = path.join(/*turbopackIgnore: true*/ rawTranscriptsDir, `lecture_${cid}.txt`);
      try {
        const txt = await fs.readFile(transcriptFile, "utf-8");
        if (txt.trim().length > 0) {
          hasTranscript = true;
          transcriptChars = txt.length;
          cueCount = txt.split("\n").filter((ln) => ln.includes("[")).length;
          break;
        }
      } catch {}
    }

    const cpCount = checkpointFiles.filter((f) =>
      candidateIds.some((cid) => f.startsWith(`${cid}.part`) && f.endsWith(".json"))
    ).length;

    const matchedNote = candidateIds.reduce<typeof parsedNotes[number] | undefined>((found, cid) => {
      if (found) return found;
      const uniqueId = buildUniqueNoteId(Number(l.week) || 1, cid);
      const shortId = cid.slice(0, 8);
      return (
        parsedNotes.find((n) => n.id === uniqueId || n.file === `${uniqueId}.md`) ||
        parsedNotes.find((n) => n.sourceTranscript === `lecture_${cid}.txt`) ||
        parsedNotes.find((n) => l.lessonUrl && n.echo360Url === l.lessonUrl) ||
        parsedNotes.find((n) => n.week === (Number(l.week) || 1) && n.file.includes(shortId))
      );
    }, undefined);

    l.transcriptChars = transcriptChars;
    l.transcriptCueCount = cueCount;
    l.hasTranscript = hasTranscript;
    l.audioDownloaded = hasAudio;
    l.checkpointCount = cpCount;

    if (matchedNote) {
      l.noteId = matchedNote.id;
      const noteLooksPdfOnly =
        Boolean(matchedNote.data?.noTranscript) ||
        (!hasTranscript && !matchedNote.data?.audioTranscribed && !/\[\d{2}:\d{2}:\d{2}\]/.test(matchedNote.content));

      l.pdfOnly = noteLooksPdfOnly;
      if (noteLooksPdfOnly) {
        l.status = "queued";
        l.progressPercent = 50;
        l.progressStage = "PDF-Only note saved (needs transcript upgrade)";
      } else {
        l.status = "done";
        l.progressPercent = 100;
        l.progressStage = "Ingested";
      }
    } else if (hasAudio && hasTranscript) {
      l.status = "media_ready";
      l.progressPercent = 100;
      l.progressStage = `Transcript (${cueCount} cues) & audio ready`;
    } else if (hasAudio) {
      l.status = "media_ready";
      l.progressPercent = 100;
      l.progressStage = "Audio ready (Gemini transcription fallback)";
    } else if (hasTranscript) {
      l.status = "media_ready";
      l.progressPercent = 100;
      l.progressStage = `Transcript ready (${cueCount} cues)`;
    } else if (cpCount > 0) {
      l.status = "queued";
      l.progressPercent = 40;
      l.progressStage = `Resumable (${cpCount} partial chunks saved)`;
    } else if (l.hasVideo === false) {
      l.status = "queued";
      l.progressPercent = 0;
      l.progressStage = "No video recording available";
    } else {
      l.status = "queued";
      l.progressPercent = 0;
      l.progressStage = "Queued for Stage 2 media pull";
    }
  }
}

export interface VaultSessionItem {
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
}

export async function getVaultSessions(): Promise<VaultSessionItem[]> {
  try {
    const raw = await fs.readFile(VAULT_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveVaultSession(item: VaultSessionItem): Promise<VaultSessionItem[]> {
  await fs.mkdir(SESSION_DIR, { recursive: true });
  const current = await getVaultSessions();
  const filtered = current.filter((s) => s.courseCode !== item.courseCode && s.id !== item.id);
  filtered.unshift(item);
  await fs.writeFile(VAULT_FILE, JSON.stringify(filtered, null, 2), "utf-8");
  return filtered;
}

export async function deleteVaultSession(id: string): Promise<VaultSessionItem[]> {
  const current = await getVaultSessions();
  const filtered = current.filter((s) => s.id !== id && s.courseCode !== id.toUpperCase());
  await fs.writeFile(VAULT_FILE, JSON.stringify(filtered, null, 2), "utf-8");
  return filtered;
}

export async function clearVault(): Promise<void> {
  try {
    await fs.unlink(VAULT_FILE);
  } catch {}
}

async function getSavedCookieHeader(): Promise<string> {
  try {
    const raw = await fs.readFile(COOKIES_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((c) => `${c.name}=${c.value}`).join("; ");
    } else if (typeof parsed === "object" && parsed.cookieHeader) {
      return parseCookiesFromAnyInput(parsed.cookieHeader);
    } else if (typeof parsed === "string") {
      return parseCookiesFromAnyInput(parsed);
    }
    return "";
  } catch {
    return "";
  }
}

export async function resolveActiveCookie(
  req: NextRequest,
  clientCookie?: string | null,
  courseId?: string | null
): Promise<string> {
  // 1. Direct body cookie
  if (clientCookie && clientCookie.trim().length > 10) {
    return parseCookiesFromAnyInput(clientCookie);
  }

  // 2. Request header (e.g. from sessionStorage)
  const headerCookie = req.headers.get("x-echo-cookie");
  if (headerCookie && headerCookie.trim().length > 10) {
    return parseCookiesFromAnyInput(headerCookie);
  }

  // 3. Saved disk cookie (if user checked "Save cookie to disk")
  const savedDisk = await getSavedCookieHeader();
  if (savedDisk && savedDisk.trim().length > 10) {
    return savedDisk;
  }

  // 4. Cookie Vault (match courseId or fallback to newest)
  try {
    const vault = await getVaultSessions();
    if (vault && vault.length > 0) {
      if (courseId) {
        const clean = courseId.toUpperCase().replace(/[^A-Z0-9]/g, "");
        const matched = vault.find((v) => v.courseCode?.toUpperCase() === clean);
        if (matched && matched.cookieHeader && matched.cookieHeader.trim().length > 10) {
          return parseCookiesFromAnyInput(matched.cookieHeader);
        }
      }
      const firstValid = vault.find((v) => v.cookieHeader && v.cookieHeader.trim().length > 10);
      if (firstValid) {
        return parseCookiesFromAnyInput(firstValid.cookieHeader);
      }
    }
  } catch {}

  return "";
}

export function extractSessionMetadata(text: string): {
  courseCode: string | null;
  courseTitle: string | null;
  term: string | null;
  sectionId: string | null;
  sectionUrl: string | null;
  userEmail: string | null;
} {
  let courseCode: string | null = null;
  let courseTitle: string | null = null;
  let term: string | null = null;
  let sectionId: string | null = null;
  let userEmail: string | null = null;

  if (!text) return { courseCode, courseTitle, term, sectionId, sectionUrl: null, userEmail };

  // Unescape Windows carets (e.g. ^&, %^28, etc.)
  const clean = text.replace(/\^/g, "");

  // 1. contextTitle inside PLAY_SESSION
  const titleMatch = clean.match(/contextTitle=([^&;\^\"'\s]+)/i);
  if (titleMatch) {
    try {
      courseTitle = decodeURIComponent(titleMatch[1].replace(/\+/g, " "));
      const codeMatch = courseTitle.match(/\b([A-Za-z]{4}\s*\d{4})\b/);
      if (codeMatch) courseCode = codeMatch[1].toUpperCase().replace(/\s+/g, "");
      const termMatch = courseTitle.match(/\(?(\d{4}\s*T\d)\)?/i);
      if (termMatch) term = termMatch[1];
    } catch {}
  }

  // 2. Section ID from URL or Referer
  const secMatch = clean.match(/section\/([0-9a-fA-F-]{36}|[0-9a-zA-Z_-]+)/i);
  if (secMatch) sectionId = secMatch[1];

  // 3. ECHO_JWT
  const jwtMatch = clean.match(/ECHO_JWT=([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/);
  if (jwtMatch) {
    try {
      const parts = jwtMatch[1].split(".");
      const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf8"));
      if (payload.sub || payload.ssoId) userEmail = payload.sub || payload.ssoId;
    } catch {}
  }

  const sectionUrl = sectionId ? `https://echo360.net.au/section/${sectionId}/home` : null;

  return { courseCode, courseTitle, term, sectionId, sectionUrl, userEmail };
}

// GET: Check session status (supports ephemeral header or saved vault/file)
export async function GET(req: NextRequest) {
  try {
    const headerCookie = req.headers.get("x-echo-cookie") || "";
    const headerSectionUrl = req.headers.get("x-echo-section-url") || "";
    const cookieHeader = headerCookie ? parseCookiesFromAnyInput(headerCookie) : (await getSavedCookieHeader());
    let fileStat = null;
    let rawContent = "";
    try {
      fileStat = await fs.stat(COOKIES_FILE);
      rawContent = await fs.readFile(COOKIES_FILE, "utf-8");
    } catch {}

    const vault = await getVaultSessions();
    const hasSession = Boolean(cookieHeader && cookieHeader.trim().length > 10);
    const count = hasSession ? cookieHeader.split(";").filter((c) => c.trim()).length : 0;

    const sourceText = headerCookie || rawContent || cookieHeader;
    const meta = hasSession && sourceText ? extractSessionMetadata(sourceText) : {
      courseCode: null,
      courseTitle: null,
      term: null,
      sectionId: null,
      sectionUrl: null,
      userEmail: null
    };

    if (headerSectionUrl && !meta.sectionUrl) {
      meta.sectionUrl = headerSectionUrl;
      const m = headerSectionUrl.match(/section\/([0-9a-fA-F-]{36}|[0-9a-zA-Z_-]+)/i);
      if (m) meta.sectionId = m[1];
    }

    // Auto-restore sectionUrl from courses/<courseCode>/course.json if missing
    if (!meta.sectionUrl && meta.courseCode) {
      try {
        const configPath = path.join(COURSES_DIR, meta.courseCode.toUpperCase(), "course.json");
        const cfg = JSON.parse(await fs.readFile(configPath, "utf-8"));
        if (cfg.echo360SectionUrl) {
          meta.sectionUrl = cfg.echo360SectionUrl;
          const m = cfg.echo360SectionUrl.match(/section\/([0-9a-fA-F-]{36}|[0-9a-zA-Z_-]+)/i);
          if (m) meta.sectionId = m[1];
        }
      } catch {}
    }

    return NextResponse.json({
      hasSession,
      isEphemeral: Boolean(headerCookie && !rawContent),
      cookieCount: count,
      lastUpdated: fileStat ? fileStat.mtime.toISOString() : null,
      courseCode: meta.courseCode,
      courseTitle: meta.courseTitle,
      term: meta.term,
      sectionId: meta.sectionId,
      sectionUrl: meta.sectionUrl,
      userEmail: meta.userEmail,
      vault
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Actions (save-session, list-vault, delete-vault-item, clear-vault, pipeline-status, auto-ingest, pull) + multipart lecture media upload
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    // Manual per-lecture .m4a/.mp3 or .vtt/.srt/.txt upload in Stage 2
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const courseId = String(formData.get("courseId") || "math3701");
      const mediaId = String(formData.get("mediaId") || formData.get("lessonId") || "lecture");
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
      }

      const cleanCourse = courseId.toUpperCase().replace(/[^A-Z0-9]/g, "");
      const safeMediaId = mediaId.replace(/[^a-zA-Z0-9-_]/g, "");
      const rawDir = path.join(/*turbopackIgnore: true*/ COURSES_DIR, cleanCourse, "raw_files");
      const audioDir = path.join(/*turbopackIgnore: true*/ rawDir, "audio");
      const transcriptsDir = path.join(/*turbopackIgnore: true*/ rawDir, "transcripts");
      await fs.mkdir(audioDir, { recursive: true });
      await fs.mkdir(transcriptsDir, { recursive: true });

      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = path.extname(file.name).toLowerCase();

      if ([".vtt", ".srt", ".txt"].includes(ext)) {
        const cleaned = preprocessTranscriptWithAnchors(buffer.toString("utf-8"));
        const cueCount = cleaned.split("\n").filter((ln) => ln.includes("[")).length;
        const outPath = path.join(/*turbopackIgnore: true*/ transcriptsDir, `lecture_${safeMediaId}.txt`);
        await fs.writeFile(outPath, cleaned || buffer.toString("utf-8"), "utf-8");
        return NextResponse.json({
          success: true,
          kind: "transcript",
          cueCount,
          chars: cleaned.length,
          transcriptFile: `lecture_${safeMediaId}.txt`
        });
      }

      if ([".m4a", ".mp3", ".wav", ".aac", ".ogg", ".mp4"].includes(ext)) {
        const outPath = path.join(/*turbopackIgnore: true*/ audioDir, `lecture_${safeMediaId}.m4a`);
        await fs.writeFile(outPath, buffer);
        return NextResponse.json({
          success: true,
          kind: "audio",
          size: buffer.length,
          audioFile: `lecture_${safeMediaId}.m4a`
        });
      }

      return NextResponse.json(
        { error: `Unsupported lecture media format "${ext}". Upload .vtt, .srt, .txt, .m4a, or .mp3.` },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { action } = body;

    // ACTION: Refresh disk pipeline status for Stage 1-4 UI
    if (action === "pipeline-status") {
      const cleanCourse = (body.courseId || "math3701").toUpperCase().replace(/[^A-Z0-9]/g, "");
      const lessons = Array.isArray(body.lessons) ? body.lessons.map((l: any) => ({ ...l })) : [];
      await enrichLessonsWithDiskState(lessons, cleanCourse);
      const ffmpegAvailable = await checkFfmpegAvailable();
      return NextResponse.json({
        success: true,
        courseId: cleanCourse,
        ffmpegAvailable,
        lectures: lessons
      });
    }

    // ACTION: Save Session (Ephemeral by default, or persistent to Vault if persistToDisk=true)
    if (action === "save-session") {
      const { cookies, cookieString, persistToDisk = false } = body;
      let cleanedCookies = "";
      let rawText = "";

      if (Array.isArray(cookies)) {
        cleanedCookies = cookies.map((c: any) => `${c.name}=${c.value}`).join("; ");
        rawText = JSON.stringify(cookies);
      } else if (cookieString && typeof cookieString === "string") {
        cleanedCookies = parseCookiesFromAnyInput(cookieString);
        rawText = cookieString;
        if (!cleanedCookies) {
          return NextResponse.json(
            {
              error:
                "Could not find valid Echo360 cookies in your pasted input. Make sure the copied cURL/headers came from an echo360.net.au request containing -b / Cookie data."
            },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json({ error: "Missing cookie content to save" }, { status: 400 });
      }

      const meta = extractSessionMetadata(rawText || cleanedCookies);
      const count = cleanedCookies.split(";").filter((c: string) => c.trim()).length;

      // Auto-save discovered section link directly to course.json
      if (meta.courseCode && meta.sectionUrl) {
        try {
          const courseDir = path.join(COURSES_DIR, meta.courseCode.toUpperCase());
          await fs.mkdir(courseDir, { recursive: true });
          const configPath = path.join(courseDir, "course.json");
          let config: any = {};
          try {
            config = JSON.parse(await fs.readFile(configPath, "utf-8"));
          } catch {}
          config.echo360SectionUrl = meta.sectionUrl;
          await fs.writeFile(configPath, JSON.stringify(config, null, 2), "utf-8");
        } catch (err) {
          console.warn("Could not auto-save echo360SectionUrl to course.json:", err);
        }
      }

      let vault: VaultSessionItem[] = [];
      if (persistToDisk) {
        await fs.mkdir(SESSION_DIR, { recursive: true });
        const toSave = { cookieHeader: cleanedCookies, rawInput: rawText };
        await fs.writeFile(COOKIES_FILE, JSON.stringify(toSave, null, 2), "utf-8");

        const sessionItem: VaultSessionItem = {
          id: (meta.courseCode || `session-${Date.now()}`).toLowerCase(),
          courseCode: meta.courseCode || "GENERAL",
          courseTitle: meta.courseTitle || `${meta.courseCode || "Echo360"} Session`,
          term: meta.term || null,
          sectionId: meta.sectionId || null,
          sectionUrl: meta.sectionUrl || null,
          userEmail: meta.userEmail || null,
          savedAt: new Date().toISOString(),
          cookieHeader: cleanedCookies,
          rawInput: rawText
        };
        vault = await saveVaultSession(sessionItem);
      } else {
        vault = await getVaultSessions();
      }

      return NextResponse.json({
        success: true,
        persisted: Boolean(persistToDisk),
        message: persistToDisk
          ? `Persisted ${meta.courseCode || "Echo360"} session to Cookie Vault`
          : "Session active in current browser tab only (ephemeral)",
        cookieHeader: cleanedCookies,
        cookieCount: count,
        courseCode: meta.courseCode,
        courseTitle: meta.courseTitle,
        term: meta.term,
        sectionId: meta.sectionId,
        sectionUrl: meta.sectionUrl,
        userEmail: meta.userEmail,
        vault
      });
    }

    // ACTION: List Vault
    if (action === "list-vault") {
      const vault = await getVaultSessions();
      return NextResponse.json({ success: true, vault });
    }

    // ACTION: Delete Vault Item
    if (action === "delete-vault-item") {
      const { id } = body;
      const vault = await deleteVaultSession(id);
      return NextResponse.json({ success: true, message: `Removed session ${id} from vault`, vault });
    }

    // ACTION: Clear Entire Vault & Session
    if (action === "clear-vault" || action === "clear-session") {
      await clearVault();
      try {
        await fs.unlink(COOKIES_FILE);
      } catch {}
      return NextResponse.json({ success: true, message: "Cleared all saved cookies from vault", vault: [] });
    }

    // ACTION: Discover Section Syllabus & Lectures
    if (action === "discover-section") {
      let { courseId = "math3701", sectionUrl, cookieHeader: clientCookieHeader } = body;
      const headerCookie = req.headers.get("x-echo-cookie");
      if (!clientCookieHeader && headerCookie) {
        clientCookieHeader = headerCookie;
      }
      let cleanCourse = (courseId || "math3701").toUpperCase().replace(/[^A-Z0-9]/g, "");

      let rawInput = (sectionUrl || "").trim();

      // Check if user entered a course code directly (e.g. "MATH3701")
      const isInputUrl =
        rawInput.startsWith("http://") ||
        rawInput.startsWith("https://") ||
        rawInput.includes("echo360") ||
        rawInput.includes("/");

      const directCodeMatch = rawInput.match(/\b([A-Za-z]{4}\s*\d{4})\b/);
      if (directCodeMatch) {
        cleanCourse = directCodeMatch[1].toUpperCase().replace(/\s+/g, "");
      } else if (!isInputUrl && rawInput) {
        cleanCourse = rawInput.toUpperCase().replace(/[^A-Z0-9]/g, "");
      }

      const headerSectionUrl = req.headers.get("x-echo-section-url");

      // Check for saved or active section URL in priority order:
      // 1. Check if course has a saved echo360SectionUrl in course.json
      let savedSectionUrl = "";
      try {
        const configRaw = await fs.readFile(path.join(COURSES_DIR, cleanCourse, "course.json"), "utf-8");
        const config = JSON.parse(configRaw);
        if (config.echo360SectionUrl) {
          savedSectionUrl = config.echo360SectionUrl;
        }
      } catch {
        try {
          const configRaw = await fs.readFile(path.join(COURSES_DIR, cleanCourse.toLowerCase(), "course.json"), "utf-8");
          const config = JSON.parse(configRaw);
          if (config.echo360SectionUrl) {
            savedSectionUrl = config.echo360SectionUrl;
          }
        } catch {}
      }

      // 2. Check headerSectionUrl
      if (!savedSectionUrl && headerSectionUrl) {
        savedSectionUrl = headerSectionUrl;
      }

      // 2. Check active session cookie metadata
      let sessionSource = clientCookieHeader || "";
      if (!sessionSource) {
        try {
          const fileRaw = await fs.readFile(COOKIES_FILE, "utf-8");
          const parsed = JSON.parse(fileRaw);
          sessionSource = parsed.rawInput || parsed.cookieHeader || "";
        } catch {}
      }
      const activeMeta = extractSessionMetadata(sessionSource);

      // If active session has a sectionUrl and matches this course (or user didn't specify a different code)
      if (!savedSectionUrl && activeMeta.sectionUrl) {
        if (!activeMeta.courseCode || activeMeta.courseCode === cleanCourse || !rawInput) {
          savedSectionUrl = activeMeta.sectionUrl;
          if (activeMeta.courseCode) cleanCourse = activeMeta.courseCode;
        }
      }

      // 3. Check Vault for this course
      if (!savedSectionUrl) {
        const vault = await getVaultSessions();
        const vaultItem = vault.find((v) => v.courseCode === cleanCourse || v.id === cleanCourse.toLowerCase());
        if (vaultItem && (vaultItem.sectionUrl || vaultItem.sectionId)) {
          savedSectionUrl = vaultItem.sectionUrl || `https://echo360.net.au/section/${vaultItem.sectionId}/home`;
          if (!clientCookieHeader && vaultItem.cookieHeader) {
            clientCookieHeader = vaultItem.cookieHeader;
          }
        }
      }

      if (!isInputUrl && savedSectionUrl) {
        rawInput = savedSectionUrl;
      }

      // If still not a URL, fetch and return the UNSW course outline immediately!
      if (!rawInput || (!rawInput.startsWith("http") && !rawInput.includes("echo360") && !rawInput.includes("/"))) {
        const outlineResult = await fetchUNSWCourseOutline(cleanCourse);
        if (!outlineResult.outline) {
          return NextResponse.json({
            error: outlineResult.error || `Course "${cleanCourse}" not found in UNSW Course Outlines. Please check the course code or paste an Echo360 Section URL.`,
            courseOutline: null,
            lectures: []
          }, { status: 404 });
        }
        return NextResponse.json({
          success: true,
          count: 0,
          courseId: cleanCourse,
          sectionTitle: `${cleanCourse} (UNSW Course Outline)`,
          lectures: [],
          courseOutline: outlineResult.outline,
          availableYears: outlineResult.availableYears,
          availableTerms: outlineResult.availableTerms,
          detectedYear: outlineResult.outline.year,
          detectedTerm: outlineResult.outline.term,
          needsSectionUrl: true,
          activeSessionCourse: activeMeta.courseCode || null,
          activeSessionSectionUrl: activeMeta.sectionUrl || null,
          message: activeMeta.courseCode && activeMeta.courseCode !== cleanCourse
            ? `Connected Echo360 session is for ${activeMeta.courseCode}. To link recordings for ${cleanCourse}, paste your ${cleanCourse} Echo360 Section URL or connect your ${cleanCourse} Moodle session.`
            : `UNSW Course Outline for ${cleanCourse} loaded. Paste the Echo360 Section URL once to link lecture recordings.`
        });
      }

      const urls = rawInput.match(/https?:\/\/[^\s"',]+/g) || [];

      // Multi-URL batch paste
      if (urls.length > 1) {
        const items = urls.map((u: string, idx: number) => {
          const mediaId = extractMediaId(u) || `media-item-${idx + 1}`;
          const week = Math.floor(idx / 2) + 1;
          return {
            lessonId: `lesson-${idx + 1}`,
            mediaId,
            title: `Lecture ${idx + 1}`,
            week,
            date: `Lecture ${idx + 1}`,
            lessonUrl: u,
            hasVideo: true,
            status: "queued"
          };
        });

        // Fetch course outline
        const outlineResult = await fetchUNSWCourseOutline(cleanCourse);
        const scheduleLectures = (outlineResult.outline?.schedule || []).filter((s) => s.type === "Lecture");
        items.forEach((l: any) => {
          const match = scheduleLectures.find((s: any) => s.week === l.week);
          if (match) {
            (l as any).outlineTopic = match.topic;
            (l as any).outlineDescription = match.description;
            (l as any).outlineDateRange = match.dateRange;
          }
        });

        await enrichLessonsWithDiskState(items, cleanCourse);

        return NextResponse.json({
          success: true,
          count: items.length,
          courseId: cleanCourse,
          sectionTitle: `Batch URL Import (${items.length} Lectures)`,
          lectures: items,
          courseOutline: outlineResult.outline || null
        });
      }

      // Single URL: Check if section URL
      const cleanUrl = extractUrlFromInput(rawInput);
      const secMatch = cleanUrl.match(/section\/([0-9a-fA-F-]{36}|[0-9a-zA-Z_-]+)/i);

      if (secMatch) {
        const sectionId = secMatch[1];
        let echoHost = "https://echo360.net.au";
        try {
          const uObj = new URL(cleanUrl);
          echoHost = uObj.origin;
        } catch {}

        let activeCookie = await resolveActiveCookie(req, clientCookieHeader, cleanCourse);
        if (!activeCookie) {
          const outlineResult = await fetchUNSWCourseOutline(cleanCourse);
          return NextResponse.json(
            {
              error: "No Echo360 session cookie found. Please connect your Echo360 session in Step 1 first.",
              courseOutline: outlineResult.outline || null
            },
            { status: 401 }
          );
        }

        const syllabusUrl = `${echoHost}/section/${sectionId}/syllabus`;
        let discoveredLessons: any[] = [];
        let sectionTitle = `Echo360 Section (${sectionId.slice(0, 8)})`;
        let authExpired = false;

        try {
          const sylRes = await fetch(syllabusUrl, {
            headers: {
              Cookie: activeCookie,
              Accept: "application/json, text/plain, */*",
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
          });

          const sylText = await sylRes.text();
          if (isEchoAuthRedirect(sylRes, sylText, echoHost)) {
            authExpired = true;
          } else if (sylRes.ok) {
            try {
              const sylJson = JSON.parse(sylText);
              discoveredLessons = parseSyllabusLessons(sylJson, echoHost, sectionId);
              if (sylJson.sectionName) sectionTitle = sylJson.sectionName;
            } catch {}
          }
        } catch (sylErr) {
          console.warn("Failed querying /syllabus JSON:", sylErr);
        }

        // Fallback: Query section home HTML to parse lesson / media IDs
        if (discoveredLessons.length === 0) {
          try {
            const homeUrl = `${echoHost}/section/${sectionId}/home`;
            const homeRes = await fetch(homeUrl, {
              headers: {
                Cookie: activeCookie,
                Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
              }
            });

            const html = await homeRes.text();
            if (isEchoAuthRedirect(homeRes, html, echoHost)) {
              authExpired = true;
            } else if (homeRes.ok) {
              discoveredLessons = extractLessonsFromHtml(html, echoHost);
            }
          } catch (homeErr) {
            console.warn("Failed querying /home HTML:", homeErr);
          }
        }

        if (discoveredLessons.length > 0) {
          // Detect actual course code from Echo360 section title or lesson titles!
          let detectedCourseMatch = sectionTitle.match(/\b([A-Za-z]{4}\s*\d{4})\b/);
          if (!detectedCourseMatch) {
            for (const l of discoveredLessons) {
              const m = (l.title || "").match(/\b([A-Za-z]{4}\s*\d{4})\b/);
              if (m) {
                detectedCourseMatch = m;
                break;
              }
            }
          }

          if (detectedCourseMatch) {
            cleanCourse = detectedCourseMatch[1].toUpperCase().replace(/\s+/g, "");
          } else if (activeMeta.courseCode) {
            cleanCourse = activeMeta.courseCode.toUpperCase().replace(/[^A-Z0-9]/g, "");
          }

          // Detect Year and Term from Echo360 section & lessons
          const dates = discoveredLessons.map((l) => l.rawStartTime).filter(Boolean);
          const detection = detectYearsAndTerms(dates, sectionTitle);

          // Save section URL to course.json for this specific detected course
          try {
            const courseDir = path.join(COURSES_DIR, cleanCourse);
            await fs.mkdir(courseDir, { recursive: true });
            const configPath = path.join(courseDir, "course.json");
            let config: any = {};
            try {
              const configRaw = await fs.readFile(configPath, "utf-8");
              config = JSON.parse(configRaw);
            } catch {}
            if (config.echo360SectionUrl !== cleanUrl) {
              config.echo360SectionUrl = cleanUrl;
              await fs.writeFile(configPath, JSON.stringify(config, null, 2), "utf-8");
            }

            // Also update Vault entry if it exists for this course
            const vault = await getVaultSessions();
            const idx = vault.findIndex((v) => v.courseCode === cleanCourse);
            if (idx >= 0 && (!vault[idx].sectionUrl || !vault[idx].sectionId)) {
              vault[idx].sectionUrl = cleanUrl;
              vault[idx].sectionId = sectionId;
              await fs.writeFile(VAULT_FILE, JSON.stringify(vault, null, 2), "utf-8");
            }
          } catch {}

          // Query official UNSW Course Outline for the ACTUAL detected course!
          const outlineResult = await fetchUNSWCourseOutline(cleanCourse, detection.year, detection.term);

          // Pair each lecture's week to the course outline schedule
          const scheduleLectures = (outlineResult.outline?.schedule || []).filter((s) => s.type === "Lecture");
          discoveredLessons.forEach((l) => {
            const match = scheduleLectures.find((s) => s.week === l.week);
            if (match) {
              l.outlineTopic = match.topic;
              l.outlineDescription = match.description;
              l.outlineDateRange = match.dateRange;
            }
          });

          await enrichLessonsWithDiskState(discoveredLessons, cleanCourse);

          return NextResponse.json({
            success: true,
            count: discoveredLessons.length,
            sectionId,
            sectionUrl: cleanUrl,
            sectionTitle,
            courseId: cleanCourse,
            lectures: discoveredLessons,
            courseOutline: outlineResult.outline || null,
            detectedYear: detection.year,
            detectedTerm: detection.term,
            isClosestMatch: outlineResult.isClosestMatch,
            closestYear: outlineResult.closestYear,
            availableYears: detection.availableYears,
            availableTerms: detection.availableTerms
          });
        } else {
          return NextResponse.json(
            {
              error: authExpired
                ? `Echo360 session expired or redirected to SSO login for section (${sectionId.slice(0, 8)}). Please reconnect your session in Step 1.`
                : `Could not load recordings for Echo360 section (${sectionId.slice(0, 8)}). Your Echo360 session may have expired or is unauthorized for this section. Please reconnect your session in Step 1.`,
              courseOutline: null,
              lectures: []
            },
            { status: 401 }
          );
        }
      }

      // If single lesson URL provided:
      const mediaId = extractMediaId(cleanUrl);
      if (mediaId) {
        const outlineResult = await fetchUNSWCourseOutline(cleanCourse);
        const singleItems = [
          {
            lessonId: mediaId,
            mediaId,
            title: `Echo360 Lecture (${mediaId.slice(0, 8)})`,
            week: 1,
            date: "Lesson 1",
            lessonUrl: cleanUrl,
            hasVideo: true,
            status: "queued"
          }
        ];
        await enrichLessonsWithDiskState(singleItems, cleanCourse);

        return NextResponse.json({
          success: true,
          count: 1,
          sectionTitle: "Single Lecture",
          courseId: cleanCourse,
          courseOutline: outlineResult.outline || null,
          availableYears: outlineResult.availableYears,
          availableTerms: outlineResult.availableTerms,
          lectures: singleItems
        });
      }

      return NextResponse.json(
        { error: `Could not discover lectures or course data from the provided URL. Please verify the section link or ensure your Echo360 session is active.` },
        { status: 404 }
      );
    }

    // ACTION: Quick Fetch Transcript for Queue
    if (action === "fetch-transcript-quick") {
      const { mediaId, lessonUrl, cookieHeader: clientCookieHeader } = body;
      const safeMediaId = (mediaId || "").replace(/[^a-zA-Z0-9-_]/g, "");
      if (!safeMediaId) {
        return NextResponse.json({ error: "Missing mediaId" }, { status: 400 });
      }

      let activeCookie = await resolveActiveCookie(req, clientCookieHeader, body.courseId);
      if (!activeCookie) {
        return NextResponse.json({ error: "Missing Echo360 session cookie" }, { status: 401 });
      }

      let echoHost = "https://echo360.net.au";
      if (lessonUrl) {
        try {
          echoHost = new URL(lessonUrl).origin;
        } catch {}
      }

      const resolved = await resolveRealPlayerMedia({
        safeMediaId,
        lessonUrl,
        echoHost,
        activeCookie
      });
      const candidateIds = Array.from(new Set([resolved.resolvedMediaId, safeMediaId].filter(Boolean)));

      try {
        for (const cid of candidateIds) {
          const transcriptUrl = `${echoHost}/api/ui/echoplayer/media/${cid}/transcript`;
          const trRes = await fetch(transcriptUrl, {
            headers: {
              Cookie: activeCookie,
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
          });

          if (trRes.ok) {
            const trJson = await trRes.json();
            const parsed = parseEcho360Transcript(trJson);
            if (parsed.cueCount > 0) {
              return NextResponse.json({
                success: true,
                resolvedMediaId: cid,
                hasTranscript: true,
                cueCount: parsed.cueCount,
                preview: parsed.lines.slice(0, 5).join("\n"),
                fullText: parsed.fullText
              });
            }
          }
        }
      } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, hasTranscript: false, cueCount: 0, resolvedMediaId: resolved.resolvedMediaId });
    }

    // ACTION: Auto-Ingest Single Lecture in Batch Queue (Supports two-phase pipeline)
    if (action === "auto-ingest") {
      const {
        courseId = "math3701",
        phase = "all", // "download-media" | "distill-note" | "all"
        lessonId,
        mediaId,
        sectionId: bodySectionId,
        streamUrl: bodyStreamUrl,
        title,
        week = 1,
        date,
        lessonUrl,
        downloadAudio = true,
        autoDistill = true,
        outlineTopic,
        outlineDescription,
        cookieHeader: clientCookieHeader
      } = body;

      const cleanCourse = courseId.toUpperCase().replace(/[^A-Z0-9]/g, "");
      const courseDir = path.join(COURSES_DIR, cleanCourse);
      const lecturesDir = path.join(courseDir, "lectures");
      const rawDir = path.join(courseDir, "raw_files");
      const transcriptsDir = path.join(rawDir, "transcripts");
      const audioDir = path.join(rawDir, "audio");

      await fs.mkdir(lecturesDir, { recursive: true });
      await fs.mkdir(transcriptsDir, { recursive: true });
      await fs.mkdir(audioDir, { recursive: true });

      const safeMediaId = (mediaId || lessonId || "lecture").replace(/[^a-zA-Z0-9-_]/g, "");
      const safeLessonId = (lessonId || "").replace(/[^a-zA-Z0-9-_]/g, "");

      if (safeMediaId.includes("demo") || (lessonUrl && lessonUrl.includes("demo"))) {
        return NextResponse.json(
          { error: "Synthetic demo ingestion is disabled. Please provide an authentic Echo360 recording." },
          { status: 400 }
        );
      }

      let activeMediaId = safeMediaId;
      let audioFileName = `lecture_${activeMediaId}.m4a`;
      let audioOutPath = path.join(audioDir, audioFileName);
      let transcriptOutPath = path.join(transcriptsDir, `lecture_${activeMediaId}.txt`);

      let echoHost = "https://echo360.net.au";
      if (lessonUrl) {
        try {
          echoHost = new URL(lessonUrl).origin;
        } catch {}
      }

      let transcriptText = "";
      let cueCount = 0;
      let audioDownloaded = false;

      // Check if media already downloaded on disk (prefer safeMediaId, fall back to safeLessonId)
      const diskCandidateIds = Array.from(new Set([safeMediaId, safeLessonId].filter(Boolean)));
      for (const cid of diskCandidateIds) {
        const candidateAudio = path.join(audioDir, `lecture_${cid}.m4a`);
        try {
          const audioStat = await fs.stat(candidateAudio);
          if (audioStat.size > 20000) {
            audioDownloaded = true;
            audioFileName = `lecture_${cid}.m4a`;
            audioOutPath = candidateAudio;
            break;
          }
        } catch {}
      }

      for (const cid of diskCandidateIds) {
        const candidateTranscript = path.join(transcriptsDir, `lecture_${cid}.txt`);
        try {
          const txt = await fs.readFile(candidateTranscript, "utf-8");
          if (txt.trim().length > 0) {
            transcriptText = txt;
            cueCount = txt.split("\n").filter((l) => l.includes("[")).length;
            transcriptOutPath = candidateTranscript;
            break;
          }
        } catch {}
      }

      // If media download is required
      if (phase === "download-media" || phase === "all") {
        const activeCookie = await resolveActiveCookie(req, clientCookieHeader, cleanCourse);
        if (!activeCookie) {
          return NextResponse.json({ error: "Missing Echo360 session authentication. Please connect your Echo360 session first." }, { status: 401 });
        }

        let mergedCookie = activeCookie;
        let streamUrl: string | null =
          typeof bodyStreamUrl === "string" && bodyStreamUrl.trim() ? bodyStreamUrl.trim() : null;
        let authExpired = false;
        let syllabusRefreshed = false;

        const resolvedSectionId = await resolveSectionIdForCourse(req, bodySectionId, cleanCourse);
        const hasCloudFrontCookies = /CloudFront-Policy=/i.test(mergedCookie);

        // Refresh from /syllabus when streamUrl/mediaId is missing or CloudFront cookies are absent
        if (
          resolvedSectionId &&
          (!streamUrl ||
            activeMediaId.startsWith("G_") ||
            (safeLessonId && activeMediaId === safeLessonId) ||
            (downloadAudio && !audioDownloaded && !hasCloudFrontCookies))
        ) {
          const refreshed = await refreshLessonFromSyllabus({
            echoHost,
            sectionId: resolvedSectionId,
            lessonId: safeLessonId || undefined,
            mediaId: activeMediaId,
            activeCookie: mergedCookie
          });
          mergedCookie = refreshed.mergedCookie;
          syllabusRefreshed = true;
          if (refreshed.authExpired) authExpired = true;
          if (refreshed.matched) {
            if (refreshed.matched.mediaId && !refreshed.matched.mediaId.startsWith("G_")) {
              activeMediaId = refreshed.matched.mediaId.replace(/[^a-zA-Z0-9-_]/g, "");
            }
            if (refreshed.matched.streamUrl) {
              streamUrl = refreshed.matched.streamUrl;
            }
          }
        }

        // Fall back to lesson HTML / player JSON APIs when streamUrl or real UUID is still missing
        if (
          !authExpired &&
          (!streamUrl ||
            activeMediaId.startsWith("G_") ||
            (!transcriptText && safeLessonId && activeMediaId === safeLessonId))
        ) {
          const resolved = await resolveRealPlayerMedia({
            safeMediaId: activeMediaId,
            lessonUrl,
            echoHost,
            activeCookie: mergedCookie
          });
          mergedCookie = resolved.mergedCookie;
          if (resolved.authExpired) authExpired = true;
          if (resolved.resolvedMediaId && !resolved.resolvedMediaId.startsWith("G_")) {
            activeMediaId = resolved.resolvedMediaId.replace(/[^a-zA-Z0-9-_]/g, "");
          }
          if (!streamUrl && resolved.m3u8Url) {
            streamUrl = resolved.m3u8Url;
          }
        }

        // Sync output paths if activeMediaId resolved from G_/lessonId to real media UUID
        if (activeMediaId && activeMediaId !== safeMediaId) {
          const resolvedAudioPath = path.join(audioDir, `lecture_${activeMediaId}.m4a`);
          const resolvedTranscriptPath = path.join(transcriptsDir, `lecture_${activeMediaId}.txt`);
          if (!audioDownloaded) {
            audioFileName = `lecture_${activeMediaId}.m4a`;
            audioOutPath = resolvedAudioPath;
            try {
              const st = await fs.stat(audioOutPath);
              if (st.size > 20000) audioDownloaded = true;
            } catch {}
          }
          if (!transcriptText) {
            transcriptOutPath = resolvedTranscriptPath;
            try {
              const txt = await fs.readFile(transcriptOutPath, "utf-8");
              if (txt.trim().length > 0) {
                transcriptText = txt;
                cueCount = txt.split("\n").filter((l) => l.includes("[")).length;
              }
            } catch {}
          }
        }

        if (authExpired && !transcriptText.trim() && !audioDownloaded) {
          return NextResponse.json(
            {
              error:
                "Echo360 session cookie expired or redirected to SSO login. Please reconnect your Echo360 session in Step 1."
            },
            { status: 401 }
          );
        }

        // Fetch transcript if not already saved (using real player mediaId UUID when G_ lessonId was given)
        if (!transcriptText) {
          const candidateIds = Array.from(
            new Set([activeMediaId, safeMediaId].filter((id) => Boolean(id) && !id.startsWith("G_")))
          );
          for (const cid of candidateIds) {
            const transcriptUrl = `${echoHost}/api/ui/echoplayer/media/${cid}/transcript`;
            try {
              const trRes = await fetch(transcriptUrl, {
                headers: {
                  Cookie: mergedCookie,
                  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                }
              });
              mergedCookie = mergeCookies(mergedCookie, trRes);
              if (trRes.ok) {
                const trJson = await trRes.json();
                const parsed = parseEcho360Transcript(trJson);
                if (parsed.fullText && parsed.cueCount > 0) {
                  transcriptText = parsed.fullText;
                  cueCount = parsed.cueCount;
                  await fs.writeFile(transcriptOutPath, transcriptText, "utf-8");
                  break;
                }
              }
            } catch (trErr) {
              console.warn("Could not fetch transcript:", trErr);
            }
          }
        }

        // Download audio stream via ffmpeg if installed (always attempt when downloadAudio=true; use .tmp.m4a so ffmpeg detects m4a format)
        const ffmpegAvailable = await checkFfmpegAvailable();
        let ffmpegError: string | null = null;
        const audioTmpPath = path.join(audioDir, `lecture_${activeMediaId}.tmp.m4a`);
        try { await fs.unlink(audioTmpPath); } catch {}

        const downloadWithFfmpeg = async (targetUrl: string, cookieHdr: string): Promise<void> => {
          const ffmpegArgs = ["-y"];
          if (cookieHdr) {
            ffmpegArgs.push("-headers", `Cookie: ${cookieHdr}\r\n`);
          }
          ffmpegArgs.push("-i", targetUrl, "-vn", "-c:a", "copy", audioTmpPath);
          await execFileAsync("ffmpeg", ffmpegArgs);
        };

        if (downloadAudio && !audioDownloaded && ffmpegAvailable) {
          if (streamUrl) {
            try {
              await downloadWithFfmpeg(streamUrl, mergedCookie);
              const stat = await fs.stat(audioTmpPath);
              if (stat.size <= 20000) {
                throw new Error("Downloaded audio stream was empty (<20KB).");
              }
              await fs.rename(audioTmpPath, audioOutPath);
              audioDownloaded = true;
            } catch (audioErr: any) {
              ffmpegError = audioErr?.message || "FFmpeg failed to record stream.";
              try { await fs.unlink(audioTmpPath); } catch {}

              // Auto-refresh streamUrl + CloudFront Set-Cookie once from /syllabus if first attempt failed (e.g. 403 or empty)
              if (!syllabusRefreshed && resolvedSectionId) {
                const refreshed = await refreshLessonFromSyllabus({
                  echoHost,
                  sectionId: resolvedSectionId,
                  lessonId: safeLessonId || undefined,
                  mediaId: activeMediaId,
                  activeCookie: mergedCookie
                });
                mergedCookie = refreshed.mergedCookie;
                if (refreshed.authExpired) {
                  authExpired = true;
                  ffmpegError = "Echo360 session expired while refreshing audio stream. Please reconnect Step 1.";
                } else if (refreshed.matched?.streamUrl) {
                  streamUrl = refreshed.matched.streamUrl;
                  try {
                    await downloadWithFfmpeg(streamUrl, mergedCookie);
                    const retryStat = await fs.stat(audioTmpPath);
                    if (retryStat.size > 20000) {
                      await fs.rename(audioTmpPath, audioOutPath);
                      audioDownloaded = true;
                      ffmpegError = null;
                    } else {
                      try { await fs.unlink(audioTmpPath); } catch {}
                    }
                  } catch (retryErr: any) {
                    ffmpegError = retryErr?.message || ffmpegError;
                    try { await fs.unlink(audioTmpPath); } catch {}
                  }
                }
              }
            }
          } else {
            ffmpegError = authExpired
              ? "Echo360 session expired while resolving audio stream. Please reconnect Step 1."
              : "Could not find an HLS .m3u8 or MP4 audio stream on Echo360 for this lecture.";
          }
        } else if (downloadAudio && !audioDownloaded && !ffmpegAvailable) {
          ffmpegError = "ffmpeg is not installed on PATH for .m4a downloads.";
        }

        if (phase === "download-media") {
          const hasTranscript = transcriptText.trim().length > 0;
          const mediaReady = hasTranscript || audioDownloaded;
          const audioWarning =
            hasTranscript && !audioDownloaded && ffmpegError ? ffmpegError : undefined;
          const warning = !mediaReady
            ? !ffmpegAvailable
              ? "0 Echo360 VTT captions found & ffmpeg not installed (drop .m4a/.vtt manually or install ffmpeg)."
              : ffmpegError || "0 Echo360 VTT captions found and no .m4a stream could be downloaded."
            : audioWarning
            ? `Transcript saved (${cueCount} cues); audio skipped (${audioWarning})`
            : undefined;

          return NextResponse.json({
            success: true,
            phase: "download-media",
            mediaReady,
            cueCount,
            audioDownloaded,
            ffmpegAvailable,
            hasTranscript,
            needsManualMedia: !mediaReady,
            resolvedMediaId: activeMediaId,
            streamUrl: streamUrl || undefined,
            audioWarning,
            warning,
            transcriptFile: hasTranscript ? path.basename(transcriptOutPath) : null,
            audioFile: audioDownloaded ? audioFileName : null,
            message: mediaReady
              ? `Ready: ${hasTranscript ? `${cueCount} VTT cues` : ""}${hasTranscript && audioDownloaded ? " + " : ""}${audioDownloaded ? ".m4a audio" : ""}`
              : warning
          });
        }
      }

      // Phase: "distill-note" or "all"
      const allowPdfOnly = Boolean(body.allowPdfOnly);
      if (!transcriptText.trim() && !audioDownloaded && !allowPdfOnly) {
        return NextResponse.json(
          {
            error:
              "Needs Transcript or Audio: No Echo360 transcript (.txt) or audio (.m4a) exists on disk for this recording. Pull media in Stage 2, drop a .vtt/.m4a file, or enable 'Allow PDF-Only'.",
            needsMedia: true
          },
          { status: 422 }
        );
      }

      // Phase: "distill-note" or "all"
      const materialCtx = await loadCourseMaterialContext(courseDir, Number(week) || 1, 12000);
      const courseContext = materialCtx.text;

      const { aiSettings, requireAi = true } = body;

      let synthesized: any = null;
      let aiModelUsed: string | null = null;
      let audioTranscribed = false;

      const hasAiConfigured = aiSettings && (
        aiSettings.provider === "antigravity" ||
        aiSettings.provider === "ollama" ||
        (aiSettings.provider === "gemini" && (aiSettings.apiKey?.trim() || process.env.GEMINI_API_KEY)) ||
        (aiSettings.provider === "openai" && (aiSettings.apiKey?.trim() || process.env.OPENAI_API_KEY)) ||
        (aiSettings.provider === "anthropic" && (aiSettings.apiKey?.trim() || process.env.ANTHROPIC_API_KEY))
      );

      if (hasAiConfigured) {
        try {
          // Multimodal Gemini audio fallback if Echo360 had 0 VTT cues but .m4a audio was downloaded
          if (!transcriptText.trim() && audioDownloaded) {
            const geminiAudioKey =
              aiSettings.geminiFallbackKey ||
              (aiSettings.provider === "gemini" ? aiSettings.apiKey : undefined) ||
              process.env.GEMINI_API_KEY;
            const transcribed = await transcribeAudioWithGemini({
              audioPath: audioOutPath,
              apiKey: geminiAudioKey || "",
              model: aiSettings.provider === "gemini" ? aiSettings.geminiModel || aiSettings.model : undefined,
              lectureTitle: title || `Lecture (Week ${week})`,
              week: Number(week) || 1,
              courseContext
            });
            transcriptText = transcribed.transcriptText;
            cueCount = transcribed.cueCount;
            audioTranscribed = true;
            await fs.writeFile(transcriptOutPath, transcriptText, "utf-8");
          }

          const aiResult = await distillLongLecture({
            courseId: cleanCourse,
            courseDir,
            mediaId: activeMediaId,
            week: Number(week) || 1,
            lectureTitle: title || `Lecture (Week ${week})`,
            outlineTopic,
            outlineDescription,
            transcriptText,
            aiSettings
          });
          synthesized = aiResult;
          aiModelUsed = aiResult.aiModelUsed;
        } catch (aiErr: any) {
          console.error("AI Distillation error:", aiErr);
          return NextResponse.json(
            { error: `AI Distillation error: ${aiErr.message || "Failed to distill note"}` },
            { status: 500 }
          );
        }
      } else {
        // If user requested AI distillation but has not provided an AI key/provider
        if (requireAi && autoDistill) {
          return NextResponse.json(
            {
              error: "No AI provider configured. Please open AI Settings to select Antigravity (Local Studio), connect Ollama, or enter a Gemini/OpenAI/Anthropic API key to distill notes.",
              needsAiConfig: true
            },
            { status: 400 }
          );
        }

        // Fallback: User explicitly requested raw transcript outline without AI
        synthesized = synthesizeNotesFromTranscript(
          transcriptText,
          title || `Lecture (Week ${week})`,
          Number(week) || 1,
          outlineTopic,
          outlineDescription,
          courseContext
        );
      }

      const noteId = buildUniqueNoteId(Number(week) || 1, activeMediaId);
      const notePath = path.join(/*turbopackIgnore: true*/ lecturesDir, `${noteId}.md`);
      const noTranscript = !transcriptText.trim() && !audioTranscribed;

      const frontmatter: Record<string, any> = {
        id: noteId,
        week: Number(week) || 1,
        title: title || synthesized.title,
        date: date || new Date().toISOString().split("T")[0],
        echo360Url: lessonUrl || `${echoHost}/media/${activeMediaId}`,
        sourceTranscript: path.basename(transcriptOutPath),
        topics: synthesized.outline || [],
        insights: synthesized.insights || [],
        questionHints: synthesized.questionHints || [],
        aiDistilled: Boolean(aiModelUsed),
        aiModel: aiModelUsed || "None (Raw Transcript Outline)",
        audioTranscribed: audioTranscribed || undefined,
        noTranscript: noTranscript || undefined,
        partsProcessed: synthesized.partsProcessed || undefined,
        contextWarning: synthesized.contextWarning || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      if (outlineTopic) {
        frontmatter.outlineTopic = outlineTopic;
      }
      if (audioDownloaded && audioFileName) {
        frontmatter.sourceAudio = audioFileName;
      }

      const mdContent = safeMatterStringify(synthesized.distilledContent, frontmatter);
      await fs.writeFile(notePath, mdContent, "utf-8");

      return NextResponse.json({
        success: true,
        phase: phase === "distill-note" ? "distill-note" : "all",
        noteId,
        title: frontmatter.title,
        week: frontmatter.week,
        cueCount,
        audioDownloaded,
        audioTranscribed,
        partsProcessed: synthesized.partsProcessed || 1,
        contextWarning: synthesized.contextWarning,
        aiDistilled: Boolean(aiModelUsed),
        aiModel: aiModelUsed,
        insightsCount: synthesized.insights.length,
        message: `Saved ${frontmatter.title} (${synthesized.insights.length} insights)`
      });
    }

    // ACTION: Pull Lecture (Auto-Pull via GUI)
    if (action === "pull") {
      let {
        courseId = "math3701",
        url,
        cookieHeader: clientCookieHeader,
        downloadAudio = true,
        week = 1,
        title = ""
      } = body;

      if (!url || typeof url !== "string" || !url.trim()) {
        return NextResponse.json({ error: "Please enter a valid Echo360 Lecture or Classroom URL." }, { status: 400 });
      }

      const trimmed = url.trim();
      const isUrl =
        trimmed.startsWith("http://") ||
        trimmed.startsWith("https://") ||
        trimmed.includes("echo360") ||
        trimmed.includes("/");

      if (!isUrl) {
        return NextResponse.json(
          { error: `"${trimmed}" is not a valid URL. Please paste the full Echo360 lecture recording or classroom link.` },
          { status: 400 }
        );
      }

      url = extractUrlFromInput(trimmed);

      const cleanCourse = courseId.toUpperCase().replace(/[^A-Z0-9]/g, "");
      const rawDir = path.join(COURSES_DIR, cleanCourse, "raw_files");
      const transcriptsDir = path.join(rawDir, "transcripts");
      const audioDir = path.join(rawDir, "audio");

      await fs.mkdir(transcriptsDir, { recursive: true });
      await fs.mkdir(audioDir, { recursive: true });

      // Check session
      let activeCookie = await resolveActiveCookie(req, clientCookieHeader, body.courseId);
      if (!activeCookie || activeCookie.trim().length < 5) {
        return NextResponse.json(
          {
            error: "No active Echo360 session found. Please paste your Echo360 session cookie in Step 1 to authenticate."
          },
          { status: 401 }
        );
      }

      // Determine Echo360 Host domain (e.g. echo360.net.au, echo360.org.au, or echo360.org)
      const urlObj = new URL(url);
      const echoHost = urlObj.origin;
      const initialId = extractMediaId(url) || url.match(/\/lesson\/([^/?#]+)/i)?.[1] || "";

      // 1. Resolve lesson / player media via classroom HTML and Echo360 JSON APIs
      const resolved = await resolveRealPlayerMedia({
        safeMediaId: initialId,
        lessonUrl: url,
        echoHost,
        activeCookie
      });

      if (resolved.authExpired) {
        return NextResponse.json(
          {
            error: "Echo360 session cookie expired or redirected to SSO login. Please re-copy your cookies in Step 1."
          },
          { status: 401 }
        );
      }

      const mediaId =
        (!resolved.resolvedMediaId.startsWith("G_") && resolved.resolvedMediaId) ||
        extractMediaId(resolved.pageHtml) ||
        extractMediaId(url);

      if (!mediaId) {
        return NextResponse.json(
          {
            error:
              "Could not locate Media ID on the Echo360 page. Verify the URL points to a specific lesson or video player."
          },
          { status: 400 }
        );
      }

      // 2. Fetch Transcript
      let mergedCookie = resolved.mergedCookie || activeCookie;
      let transcriptText = "";
      let cueCount = 0;
      const transcriptUrl = `${echoHost}/api/ui/echoplayer/media/${mediaId}/transcript`;

      try {
        const trRes = await fetch(transcriptUrl, {
          headers: {
            Cookie: mergedCookie,
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          }
        });
        mergedCookie = mergeCookies(mergedCookie, trRes);

        if (trRes.ok) {
          const trJson = await trRes.json();
          const parsed = parseEcho360Transcript(trJson);
          transcriptText = parsed.fullText;
          cueCount = parsed.cueCount;

          if (transcriptText) {
            const txtPath = path.join(transcriptsDir, `lecture_${mediaId}.txt`);
            await fs.writeFile(txtPath, transcriptText, "utf-8");
          }
        }
      } catch (err) {
        console.warn("Failed fetching transcript:", err);
      }

      // 3. Audio Stream Extraction (if requested)
      let audioDownloaded = false;
      const audioFileName = `lecture_${mediaId}.m4a`;
      const audioOutPath = path.join(audioDir, audioFileName);
      const audioTmpPath = path.join(audioDir, `lecture_${mediaId}.tmp.m4a`);
      try { await fs.unlink(audioTmpPath); } catch {}

      if (downloadAudio && resolved.m3u8Url && (await checkFfmpegAvailable())) {
        try {
          const ffmpegArgs = ["-y"];
          if (mergedCookie) {
            ffmpegArgs.push("-headers", `Cookie: ${mergedCookie}\r\n`);
          }
          ffmpegArgs.push("-i", resolved.m3u8Url, "-vn", "-c:a", "copy", audioTmpPath);
          await execFileAsync("ffmpeg", ffmpegArgs);
          const stat = await fs.stat(audioTmpPath);
          if (stat.size > 20000) {
            await fs.rename(audioTmpPath, audioOutPath);
            audioDownloaded = true;
          } else {
            try { await fs.unlink(audioTmpPath); } catch {}
          }
        } catch (ffmpegErr) {
          console.warn("FFmpeg audio download error:", ffmpegErr);
          try { await fs.unlink(audioTmpPath); } catch {}
        }
      }

      return NextResponse.json({
        success: true,
        mediaId,
        suggestedTitle: title || `Echo360 Lecture (${mediaId.slice(0, 8)})`,
        week: Number(week) || 1,
        transcriptText,
        cueCount,
        audioFile: audioDownloaded ? audioFileName : undefined,
        audioDownloaded,
        message: `Auto-pulled transcript (${cueCount} cues)${audioDownloaded ? " and audio stream" : ""} successfully!`
      });
    }

    return NextResponse.json({ error: `Unknown action '${action}'` }, { status: 400 });
  } catch (err: any) {
    console.error("Echo360 Auto-Pull error:", err);
    return NextResponse.json({ error: err.message || "Auto-pull failed" }, { status: 500 });
  }
}
