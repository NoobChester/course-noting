/**
 * src/lib/selective-export.ts
 * Filtering and packaging engine for selective export and classmate sharing in Course Noting.
 * Works seamlessly in both static GitHub Pages and Localhost Studio.
 */

import {
  SelectiveExportOptions,
  MergedCourseData,
  Question,
  Concept,
  LectureNote,
  LectureInsight,
  ExportedPackSummary
} from "./types";

export const PRESET_CLASSMATE = "classmate";
export const PRESET_BLANK = "blank";
export const PRESET_FULL = "full";

/**
 * Helper to check whether an item's week matches the selected weeks
 * @param itemWeek - week number on the item (undefined, 0, or positive integer)
 * @param selectedWeeks - "all" or an array of numbers (where 0 represents General / Unassigned)
 */
export function isWeekIncluded(itemWeek: number | undefined, selectedWeeks: "all" | number[]): boolean {
  if (selectedWeeks === "all") return true;
  if (!Array.isArray(selectedWeeks) || selectedWeeks.length === 0) return false;

  const normalizedWeek = (!itemWeek || isNaN(itemWeek) || itemWeek <= 0) ? 0 : itemWeek;
  return selectedWeeks.includes(normalizedWeek);
}

export function getPresetOptions(preset: string, courseId: string): SelectiveExportOptions {
  if (preset === PRESET_BLANK) {
    return {
      courseId,
      selectedWeeks: "all",
      includeQuestions: true,
      includeConcepts: true,
      includeLectureNotes: true,
      includeSpokenIntuitions: true,
      includeExamWarnings: true,
      includeWrittenSolutions: false,
      includeCanvasScratchpads: false,
      includeSm2Stats: false,
      includeMasteryStatus: false,
      includeStarredFlags: false,
      includeAiReviewHistory: false
    };
  }

  if (preset === PRESET_FULL) {
    return {
      courseId,
      selectedWeeks: "all",
      includeQuestions: true,
      includeConcepts: true,
      includeLectureNotes: true,
      includeSpokenIntuitions: true,
      includeExamWarnings: true,
      includeWrittenSolutions: true,
      includeCanvasScratchpads: true,
      includeSm2Stats: true,
      includeMasteryStatus: true,
      includeStarredFlags: true,
      includeAiReviewHistory: true
    };
  }

  // Default: Share with Classmates
  return {
    courseId,
    selectedWeeks: "all",
    includeQuestions: true,
    includeConcepts: true,
    includeLectureNotes: true,
    includeSpokenIntuitions: true,
    includeExamWarnings: true,
    includeWrittenSolutions: true,
    includeCanvasScratchpads: false,
    includeSm2Stats: false,
    includeMasteryStatus: false,
    includeStarredFlags: false,
    includeAiReviewHistory: false
  };
}

/**
 * Filter course data and emit JSON, Markdown, and Base64 payloads based on user checkboxes
 */
export function buildSelectiveExport(
  options: SelectiveExportOptions,
  rawData: MergedCourseData
): {
  jsonPayload: any;
  markdownText: string;
  base64String: string;
  summary: ExportedPackSummary;
} {
  const course = rawData.course;
  const courseId = course.id.toLowerCase();

  // 1. Filter Concepts
  let filteredConcepts: Concept[] = [];
  if (options.includeConcepts) {
    filteredConcepts = (rawData.concepts || []).filter((c) => {
      if (!isWeekIncluded(c.week, options.selectedWeeks)) return false;
      return true;
    });
  }

  // 2. Filter Lectures & Insights
  let filteredLectures: LectureNote[] = [];
  let totalInsights = 0;
  if (options.includeLectureNotes || options.includeSpokenIntuitions || options.includeExamWarnings) {
    filteredLectures = (rawData.lectures || [])
      .filter((l) => {
        if (!isWeekIncluded(l.week, options.selectedWeeks)) return false;
        return true;
      })
      .map((lec) => {
        const insights: LectureInsight[] = (lec.insights || []).filter((ins) => {
          if (ins.type === "intuition" && !options.includeSpokenIntuitions) return false;
          if (ins.type === "exam_warning" && !options.includeExamWarnings) return false;
          return true;
        });

        totalInsights += insights.length;

        return {
          ...lec,
          content: options.includeLectureNotes ? lec.content : "",
          insights
        };
      });
  }

  // 3. Filter Questions & Apply Student Work / Privacy Options
  let filteredQuestions: Question[] = [];
  let totalSolutions = 0;
  let hasCanvas = false;
  let hasPrivate = false;

  if (options.includeQuestions) {
    filteredQuestions = (rawData.questions || [])
      .filter((q) => {
        if (!isWeekIncluded(q.week, options.selectedWeeks)) return false;
        return true;
      })
      .map((q) => {
        // Read local user override if present in browser storage
        let solution = q.content.solution || "";
        let canvas = q.canvasData;
        let status = q.status;
        let starred = q.starred || false;
        let sm2 = q.sm2;
        let review = q.lastProofReview;

        if (typeof window !== "undefined") {
          try {
            const rawProgress =
              localStorage.getItem(`cn_progress_${courseId}_${q.id}`) ||
              localStorage.getItem(`cn_user_q_${courseId}_${q.id}`);
            if (rawProgress) {
              const parsed = JSON.parse(rawProgress);
              if (parsed.content?.solution) solution = parsed.content.solution;
              if (parsed.canvasData) canvas = parsed.canvasData;
              if (parsed.status) status = parsed.status;
              if (parsed.starred !== undefined) starred = parsed.starred;
              if (parsed.sm2) sm2 = parsed.sm2;
              if (parsed.lastProofReview) review = parsed.lastProofReview;
            }
          } catch {}
        }

        if (solution.trim()) totalSolutions++;
        if (canvas) hasCanvas = true;
        if (sm2 || status !== "Unattempted" || starred) hasPrivate = true;

        return {
          ...q,
          status: options.includeMasteryStatus ? status : "Unattempted",
          starred: options.includeStarredFlags ? starred : false,
          sm2: options.includeSm2Stats ? sm2 : undefined,
          lastProofReview: options.includeAiReviewHistory ? review : undefined,
          canvasData: options.includeCanvasScratchpads ? canvas : undefined,
          content: {
            ...q.content,
            solution: options.includeWrittenSolutions ? solution : ""
          }
        };
      });
  }

  // 4. Build Standardized Shared Pack JSON
  const jsonPayload = {
    version: "1.0",
    layer: "shared_pack",
    exportedAt: new Date().toISOString(),
    course,
    options,
    concepts: filteredConcepts,
    lectures: filteredLectures,
    questions: filteredQuestions
  };

  const jsonRaw = JSON.stringify(jsonPayload, null, 2);
  const base64String = btoa(unescape(encodeURIComponent(jsonRaw)));

  // 5. Build Human-Readable Markdown Document (.md)
  let md = `# ${course.code}: ${course.name}\n\n`;
  md += `*Study & Solution Pack exported on ${new Date().toISOString().slice(0, 10)}*\n`;
  if (course.institution) md += `*Institution: ${course.institution}*\n`;
  md += `\n---\n\n`;

  // Concepts Section
  if (filteredConcepts.length > 0) {
    md += `## 📚 Core Theorems & Concept Summaries (${filteredConcepts.length})\n\n`;
    filteredConcepts.forEach((c) => {
      md += `### ${c.title} (Week ${c.week})\n\n`;
      md += `${c.content}\n\n`;
      md += `---\n\n`;
    });
  }

  // Lectures Section
  if (filteredLectures.length > 0) {
    md += `## 🎙️ Lecture Notes & Spoken Intuitions (${filteredLectures.length})\n\n`;
    filteredLectures.forEach((l) => {
      md += `### Week ${l.week}: ${l.title}\n`;
      if (l.date) md += `*Date: ${l.date}*\n\n`;

      if (l.insights && l.insights.length > 0) {
        md += `#### 💡 Key Intuitions & Warnings\n`;
        l.insights.forEach((ins) => {
          const badge = ins.type === "exam_warning" ? "⚠️ [EXAM WARNING]" : "🎙️ [INTUITION]";
          const ts = ins.timestamp ? ` (${ins.timestamp})` : "";
          md += `* **${badge} ${ins.title}${ts}:** ${ins.content || ins.text || ""}\n`;
        });
        md += `\n`;
      }

      if (l.content) {
        md += `#### Notes\n${l.content}\n\n`;
      }
      md += `---\n\n`;
    });
  }

  // Questions Section
  if (filteredQuestions.length > 0) {
    md += `## 📝 Practice Problems & Solutions (${filteredQuestions.length})\n\n`;
    filteredQuestions.forEach((q) => {
      md += `### Q${q.number}: ${q.title} (Week ${q.week} • ${q.topic})\n\n`;
      md += `**Problem Statement:**\n\n${q.content.prompt}\n\n`;

      if (q.content.hints) {
        md += `> **Hints & Key Steps:**\n>\n> ${q.content.hints.replace(/\n/g, "\n> ")}\n\n`;
      }

      if (q.content.solution) {
        md += `#### Solution / Written Proof:\n\n${q.content.solution}\n\n`;
      }

      if (q.content.official) {
        md += `*Official Answer:* ${q.content.official}\n\n`;
      }
      md += `---\n\n`;
    });
  }

  const summary: ExportedPackSummary = {
    courseCode: course.code,
    courseName: course.name,
    totalCourses: 1,
    questionCount: filteredQuestions.length,
    conceptCount: filteredConcepts.length,
    lectureCount: filteredLectures.length,
    insightCount: totalInsights,
    writtenSolutionCount: options.includeWrittenSolutions ? totalSolutions : 0,
    hasCanvasDrawings: options.includeCanvasScratchpads && hasCanvas,
    hasPrivateMetrics: (options.includeSm2Stats || options.includeMasteryStatus || options.includeStarredFlags) && hasPrivate,
    exportedAt: jsonPayload.exportedAt,
    formatType: "pack_json"
  };

  return {
    jsonPayload,
    markdownText: md,
    base64String,
    summary
  };
}

/**
 * Inspect an incoming pack (JSON or Base64 string) and return a summary for the Import Preview card
 */
export function analyzeImportPack(rawInput: string): ExportedPackSummary | null {
  if (!rawInput || !rawInput.trim()) return null;

  try {
    let jsonStr = rawInput.trim();
    let formatType: "pack_json" | "save_string" | "markdown" = "pack_json";

    // Detect base64 encoded string
    if (!jsonStr.startsWith("{") && !jsonStr.startsWith("[")) {
      try {
        jsonStr = decodeURIComponent(escape(atob(jsonStr)));
        formatType = "save_string";
      } catch {
        return null;
      }
    }

    const data = JSON.parse(jsonStr);

    // Case 1: Selective Shared Pack (layer: "shared_pack")
    if (data.layer === "shared_pack" && data.course) {
      const qCount = data.questions?.length || 0;
      const cCount = data.concepts?.length || 0;
      const lCount = data.lectures?.length || 0;
      let insightCount = 0;
      let solCount = 0;
      let hasCanvas = false;
      let hasPrivate = false;

      (data.lectures || []).forEach((l: any) => {
        insightCount += l.insights?.length || 0;
      });

      (data.questions || []).forEach((q: any) => {
        if (q.content?.solution?.trim()) solCount++;
        if (q.canvasData) hasCanvas = true;
        if (q.sm2 || q.status !== "Unattempted" || q.starred) hasPrivate = true;
      });

      return {
        courseCode: data.course.code || "Course",
        courseName: data.course.name || "",
        totalCourses: 1,
        questionCount: qCount,
        conceptCount: cCount,
        lectureCount: lCount,
        insightCount,
        writtenSolutionCount: solCount,
        hasCanvasDrawings: hasCanvas,
        hasPrivateMetrics: hasPrivate,
        exportedAt: data.exportedAt,
        formatType
      };
    }

    // Case 2: Layer 1 Base Pack (layer: "base")
    if (data.layer === "base" && data.course) {
      return {
        courseCode: data.course.code || "Base Pack",
        courseName: data.course.name || "",
        totalCourses: 1,
        questionCount: data.questions?.length || 0,
        conceptCount: data.concepts?.length || 0,
        lectureCount: 0,
        insightCount: 0,
        writtenSolutionCount: 0,
        hasCanvasDrawings: false,
        hasPrivateMetrics: false,
        formatType
      };
    }

    // Case 3: Layer 2 Lecture Pack (layer: "lectures")
    if (data.layer === "lectures" && data.courseId) {
      let insightCount = (data.insights?.length || 0);
      (data.lectures || []).forEach((l: any) => {
        insightCount += l.insights?.length || 0;
      });

      return {
        courseCode: data.courseId.toUpperCase(),
        courseName: "Lecture Insights Pack",
        totalCourses: 1,
        questionCount: 0,
        conceptCount: 0,
        lectureCount: data.lectures?.length || 0,
        insightCount,
        writtenSolutionCount: 0,
        hasCanvasDrawings: false,
        hasPrivateMetrics: false,
        formatType
      };
    }

    // Case 4: Full Multi-Course User Backup Payload
    if (typeof data === "object") {
      let qCount = 0;
      let solCount = 0;
      let hasPrivate = false;
      const courseKeys = Object.keys(data).filter((k) => k.startsWith("cn_") || k.startsWith("math_"));

      courseKeys.forEach((k) => {
        if (k.includes("_q_") || k.includes("_progress_")) {
          qCount++;
          try {
            const val = typeof data[k] === "string" ? JSON.parse(data[k]) : data[k];
            if (val.content?.solution?.trim()) solCount++;
            if (val.sm2 || val.status) hasPrivate = true;
          } catch {}
        }
      });

      return {
        courseCode: "Full Backup",
        courseName: "Multi-Course Workspace Backup",
        totalCourses: Math.max(1, Math.round(courseKeys.length / 5)),
        questionCount: qCount,
        conceptCount: 0,
        lectureCount: 0,
        insightCount: 0,
        writtenSolutionCount: solCount,
        hasCanvasDrawings: false,
        hasPrivateMetrics: hasPrivate,
        formatType
      };
    }

    return null;
  } catch (e) {
    return null;
  }
}

/**
 * Apply an analyzed import pack directly into browser storage
 */
export function applyImportPack(
  rawInput: string,
  mode: "merge" | "replace"
): { success: boolean; message: string; courseId: string } {
  try {
    let jsonStr = rawInput.trim();
    if (!jsonStr.startsWith("{") && !jsonStr.startsWith("[")) {
      jsonStr = decodeURIComponent(escape(atob(jsonStr)));
    }

    const data = JSON.parse(jsonStr);

    if (data.layer === "shared_pack" && data.course) {
      const courseId = data.course.id.toLowerCase();

      // 1. Save or merge Base Pack
      const existingBaseRaw = localStorage.getItem(`cn_custom_pack_${courseId}_base`);
      let basePack = existingBaseRaw ? JSON.parse(existingBaseRaw) : null;

      if (!basePack || mode === "replace") {
        basePack = {
          version: "1.0",
          layer: "base",
          course: data.course,
          concepts: data.concepts || [],
          questions: data.questions || []
        };
      } else {
        // Merge questions & concepts
        const qMap = new Map();
        basePack.questions.forEach((q: any) => qMap.set(q.id, q));
        (data.questions || []).forEach((q: any) => qMap.set(q.id, q));
        basePack.questions = Array.from(qMap.values());

        const cMap = new Map();
        basePack.concepts.forEach((c: any) => cMap.set(c.slug, c));
        (data.concepts || []).forEach((c: any) => cMap.set(c.slug, c));
        basePack.concepts = Array.from(cMap.values());
      }
      localStorage.setItem(`cn_custom_pack_${courseId}_base`, JSON.stringify(basePack));

      // 2. Save or merge Lecture Pack
      if (data.lectures && data.lectures.length > 0) {
        const existingLecRaw = localStorage.getItem(`cn_custom_pack_${courseId}_lectures`);
        let lecPack = existingLecRaw ? JSON.parse(existingLecRaw) : null;

        if (!lecPack || mode === "replace") {
          lecPack = {
            version: "1.0",
            layer: "lectures",
            courseId,
            lectures: data.lectures,
            insights: data.lectures.flatMap((l: any) => l.insights || []),
            questionHints: []
          };
        } else {
          const lMap = new Map();
          lecPack.lectures.forEach((l: any) => lMap.set(l.id, l));
          data.lectures.forEach((l: any) => lMap.set(l.id, l));
          lecPack.lectures = Array.from(lMap.values());
          lecPack.insights = lecPack.lectures.flatMap((l: any) => l.insights || []);
        }
        localStorage.setItem(`cn_custom_pack_${courseId}_lectures`, JSON.stringify(lecPack));
      }

      // 3. Register course in custom course list
      const customCoursesRaw = localStorage.getItem("cn_custom_courses_list") || "[]";
      const customCourses = JSON.parse(customCoursesRaw);
      if (!customCourses.some((c: any) => c.id.toLowerCase() === courseId)) {
        customCourses.push(data.course);
        localStorage.setItem("cn_custom_courses_list", JSON.stringify(customCourses));
      }

      // 4. Save question progress / solutions into local user storage
      (data.questions || []).forEach((q: any) => {
        if (q.content?.solution || q.canvasData || q.status !== "Unattempted" || q.sm2) {
          localStorage.setItem(`cn_progress_${courseId}_${q.id}`, JSON.stringify(q));
        }
      });

      localStorage.setItem("math_active_course", courseId);
      return {
        success: true,
        message: `Successfully loaded shared pack for ${data.course.code}!`,
        courseId
      };
    }

    // Generic JSON / base64 key-value restore fallback
    let count = 0;
    Object.entries(data).forEach(([k, v]) => {
      if (typeof v === "string") localStorage.setItem(k, v);
      else localStorage.setItem(k, JSON.stringify(v));
      count++;
    });

    return {
      success: true,
      message: `Restored ${count} data entries successfully!`,
      courseId: "all"
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Failed to process import pack.",
      courseId: ""
    };
  }
}
