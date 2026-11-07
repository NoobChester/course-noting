/**
 * src/lib/pack-loader.ts
 * Client-side loader for Blank Slate Course Engine & 3-Layer Save Architecture.
 * Works uniformly in local dev and static GitHub Pages.
 */

import {
  CourseBasePack,
  CourseLecturePack,
  CourseMeta,
  Concept,
  Question,
  LectureNote,
  LectureInsight,
  QuestionHintInsight,
  MergedCourseData
} from "./types";

export interface CourseCatalogItem {
  id: string;
  code: string;
  name: string;
  institution?: string;
  term?: string;
  logoSymbol?: string;
  description?: string;
  questionCount: number;
  conceptCount: number;
  lectureCount: number;
  hasBasePack: boolean;
  hasLecturePack: boolean;
}

const STORAGE_ACTIVE_COURSE = "math_active_course";
const STORAGE_CUSTOM_PACKS_PREFIX = "cn_custom_pack_";
const STORAGE_LAYER2_ENABLED = "cn_layer2_enabled";

/** Detect if running in local Node dev mode vs static GitHub Pages */
export function isLocalStudio(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0";
}

/** Get basePath for GitHub Pages hosting (e.g. /course-noting) */
export function getBasePath(): string {
  if (typeof window === "undefined") return "";
  if (window.location.pathname.startsWith("/course-noting")) {
    return "/course-noting";
  }
  return "";
}

/** Fetch the pre-bundled course catalog */
export async function getCourseCatalog(): Promise<CourseCatalogItem[]> {
  try {
    const res = await fetch(`${getBasePath()}/data/catalog.json`, { cache: "no-cache" });
    if (!res.ok) throw new Error("Catalog fetch failed");
    return await res.json();
  } catch (err) {
    console.warn("Failed to fetch /data/catalog.json, falling back to defaults:", err);
    return [
      {
        id: "sample1001",
        code: "SAMPLE1001",
        name: "Linear Algebra & Multivariable Calculus",
        institution: "Open Demo",
        term: "Showcase",
        logoSymbol: "λ",
        description: "An open-source demo course introducing core linear algebra transformations, vector calculus theorems, and practice problems.",
        questionCount: 2,
        conceptCount: 2,
        lectureCount: 1,
        hasBasePack: true,
        hasLecturePack: true
      }
    ];
  }
}

/** Get the currently selected course ID */
export function getActiveCourseId(): string {
  if (typeof window === "undefined") return "sample1001";
  return localStorage.getItem(STORAGE_ACTIVE_COURSE) || "sample1001";
}

/** Set the active course ID */
export function setActiveCourseId(courseId: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_ACTIVE_COURSE, courseId.toLowerCase());
}

/** Check if Layer 2 (Lecture Overlay) is enabled in UI */
export function isLayer2Enabled(): boolean {
  if (typeof window === "undefined") return true;
  const val = localStorage.getItem(STORAGE_LAYER2_ENABLED);
  return val === null ? true : val === "true";
}

/** Toggle Layer 2 (Lecture Overlay) on/off */
export function setLayer2Enabled(enabled: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_LAYER2_ENABLED, String(enabled));
}

/** Fetch Layer 1 (Base Course Pack) */
export async function fetchBasePack(courseId: string): Promise<CourseBasePack | null> {
  const cleanId = courseId.toLowerCase().replace(/[^a-z0-9]/g, "");

  // 1. Check custom user-loaded packs in localStorage first
  if (typeof window !== "undefined") {
    const custom = localStorage.getItem(`${STORAGE_CUSTOM_PACKS_PREFIX}${cleanId}_base`);
    if (custom) {
      try {
        return JSON.parse(custom) as CourseBasePack;
      } catch (e) {
        console.error("Failed to parse custom base pack:", e);
      }
    }
  }

  // 2. Fetch from static public/data/<cleanId>_base.json
  try {
    const res = await fetch(`${getBasePath()}/data/${cleanId}_base.json`, { cache: "no-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(`Failed to load base pack for ${courseId}:`, err);
    return null;
  }
}

/** Fetch Layer 2 (Lecture Insights Pack) */
export async function fetchLecturePack(courseId: string): Promise<CourseLecturePack | null> {
  const cleanId = courseId.toLowerCase().replace(/[^a-z0-9]/g, "");

  // 1. Check custom user-loaded packs in localStorage first
  if (typeof window !== "undefined") {
    const custom = localStorage.getItem(`${STORAGE_CUSTOM_PACKS_PREFIX}${cleanId}_lectures`);
    if (custom) {
      try {
        return JSON.parse(custom) as CourseLecturePack;
      } catch (e) {
        console.error("Failed to parse custom lecture pack:", e);
      }
    }
  }

  // 2. Fetch from static public/data/<cleanId>_lectures.json
  try {
    const res = await fetch(`${getBasePath()}/data/${cleanId}_lectures.json`, { cache: "no-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    // Empty default if no lecture pack exists yet
    return {
      version: "1.0",
      layer: "lectures",
      courseId: cleanId,
      lectures: [],
      insights: [],
      questionHints: []
    };
  }
}

/** Load a custom external Base or Lecture Pack from a JSON string */
export function importCustomPack(jsonString: string): { success: boolean; layer: string; courseId: string } {
  try {
    const data = JSON.parse(jsonString);
    if (!data.version || !data.layer) {
      throw new Error("Invalid pack format: missing version or layer tag.");
    }

    if (data.layer === "base") {
      const courseId = data.course?.id?.toLowerCase();
      if (!courseId) throw new Error("Base pack missing course.id");
      localStorage.setItem(`${STORAGE_CUSTOM_PACKS_PREFIX}${courseId}_base`, JSON.stringify(data));
      setActiveCourseId(courseId);
      return { success: true, layer: "base", courseId };
    } else if (data.layer === "lectures") {
      const courseId = data.courseId?.toLowerCase();
      if (!courseId) throw new Error("Lecture pack missing courseId");
      localStorage.setItem(`${STORAGE_CUSTOM_PACKS_PREFIX}${courseId}_lectures`, JSON.stringify(data));
      return { success: true, layer: "lectures", courseId };
    } else {
      throw new Error(`Unknown pack layer: ${data.layer}`);
    }
  } catch (err: any) {
    console.error("Import error:", err);
    throw err;
  }
}

/**
 * Merges Layer 1 (Base Pack) and Layer 2 (Lecture Insights) dynamically
 */
export function mergePacks(
  basePack: CourseBasePack,
  lecturePack: CourseLecturePack | null,
  layer2Active: boolean
): MergedCourseData {
  const course = basePack.course;
  const rawConcepts = basePack.concepts;
  const rawQuestions = basePack.questions;
  const lectures = lecturePack?.lectures || [];

  if (!lecturePack || !layer2Active) {
    return {
      course,
      concepts: rawConcepts,
      questions: rawQuestions,
      lectures,
      layer2Active: false
    };
  }

  // Group insights by conceptSlug
  const insightsByConcept: Record<string, LectureInsight[]> = {};
  for (const ins of lecturePack.insights || []) {
    if (ins.conceptSlug) {
      if (!insightsByConcept[ins.conceptSlug]) {
        insightsByConcept[ins.conceptSlug] = [];
      }
      insightsByConcept[ins.conceptSlug].push(ins);
    }
  }

  // Merge insights into concepts
  const enrichedConcepts: Concept[] = rawConcepts.map((concept) => {
    const matchingInsights = insightsByConcept[concept.slug];
    if (!matchingInsights || matchingInsights.length === 0) {
      return concept;
    }

    // Append formatted Layer 2 insight callouts to concept content
    const intuitionBlocks = matchingInsights
      .filter((i) => i.type === "intuition")
      .map((i) => `* **${i.title}${i.timestamp ? ` [${i.timestamp}]` : ""}:** ${i.content}`)
      .join("\n\n");

    const warningBlocks = matchingInsights
      .filter((i) => i.type === "exam_warning")
      .map((i) => `* **${i.title}${i.timestamp ? ` [${i.timestamp}]` : ""}:** ${i.content}`)
      .join("\n\n");

    let enrichedContent = concept.content;

    if (intuitionBlocks) {
      enrichedContent += `\n\n### 🎙️ Spoken Intuition (Lecture Layer)\n${intuitionBlocks}`;
    }
    if (warningBlocks) {
      enrichedContent += `\n\n### ⚠️ Lecturer Exam Warnings\n${warningBlocks}`;
    }

    return {
      ...concept,
      content: enrichedContent
    };
  });

  // Group hints by questionId
  const hintsByQuestion: Record<string, QuestionHintInsight[]> = {};
  for (const qh of lecturePack.questionHints || []) {
    if (qh.questionId) {
      if (!hintsByQuestion[qh.questionId]) {
        hintsByQuestion[qh.questionId] = [];
      }
      hintsByQuestion[qh.questionId].push(qh);
    }
  }

  // Merge question hints
  const enrichedQuestions: Question[] = rawQuestions.map((q) => {
    const matchingHints = hintsByQuestion[q.id];
    if (!matchingHints || matchingHints.length === 0) {
      return q;
    }

    const extraHintsText = matchingHints
      .map((h) => `* *Lecturer Hint${h.timestamp ? ` [${h.timestamp}]` : ""}:* ${h.hint}`)
      .join("\n\n");

    return {
      ...q,
      content: {
        ...q.content,
        hints: q.content.hints
          ? `${q.content.hints}\n\n### 🎙️ Spoken Hints (Lecture Layer)\n${extraHintsText}`
          : `### 🎙️ Spoken Hints (Lecture Layer)\n${extraHintsText}`
      }
    };
  });

  return {
    course,
    concepts: enrichedConcepts,
    questions: enrichedQuestions,
    lectures,
    layer2Active: true
  };
}

/** Full Loader: Fetches Base + Lectures + Merges */
export async function loadActiveCourseData(): Promise<MergedCourseData | null> {
  const activeCourseId = getActiveCourseId();
  const layer2Active = isLayer2Enabled();

  const [basePack, lecturePack] = await Promise.all([
    fetchBasePack(activeCourseId),
    fetchLecturePack(activeCourseId)
  ]);

  if (!basePack) return null;

  return mergePacks(basePack, lecturePack, layer2Active);
}
