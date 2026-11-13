import { MathSnippet } from "./math-snippets";

export type QuestionStatus = "Unattempted" | "In Progress" | "Needs Review" | "Mastered";

export interface CourseMeta {
  id: string;
  code: string;
  name: string;
  institution?: string;
  term?: string;
  logoSymbol?: string;
  description?: string;
  preset?: string;
  echo360SectionUrl?: string;
  weeklySyllabus?: Array<{
    week: number;
    weekLabel?: string;
    topic: string;
    description?: string;
    dates?: string;
  }>;
  customSnippets?: MathSnippet[];
}

export interface UNSWCourseOutline {
  courseCode: string;
  courseName: string;
  year: string;
  term: string;
  teachingPeriod?: string;
  coid?: string;
  school?: string;
  faculty?: string;
  career?: string;
  unitsOfCredit?: string;
  uoc?: string;
  convenorName?: string;
  coordinatorName?: string;
  courseSummary?: string;
  courseAims?: string;
  handbookLink?: string;
  timetableLink?: string;
  deliveryMode?: string;
  deliveryFormat?: string;
  schedule: Array<{
    week: number;
    weekLabel: string;
    type: string; // "Lecture" | "Tutorial" | "Assessment"
    topic: string;
    description: string;
    dateRange?: string;
  }>;
  assessments: Array<{
    title: string;
    type?: string;
    weight?: string;
    dueDate?: string;
    description?: string;
  }>;
  learningOutcomes: Array<{
    code: string;
    description: string;
  }>;
  lastUpdated?: string;
}

export interface QuestionMeta {
  id: string;
  number: number;
  title: string;
  week: number;
  topic: string;
  difficulty: number; // 1 to 5
  isDifficult?: boolean; // * marked in problem sheet
  isNonExaminable?: boolean; // † marked in problem sheet
  status: QuestionStatus;
  concepts: string[];
  chapter?: number;
  chapterPdfPage?: number;
  source?: string;
  snipUrl?: string;
  starred?: boolean;
  sm2?: SM2Data;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionContent {
  prompt: string;
  hints: string;
  solution: string;
  official: string;
}

export interface Question extends QuestionMeta {
  content: QuestionContent;
  rawBody: string;
  canvasData?: string;
  lastProofReview?: ProofReviewResult;
}

export interface ConceptMeta {
  slug: string;
  title: string;
  week: number;
  category: string;
  summary: string;
  prerequisites: string[];
}

export interface Concept extends ConceptMeta {
  content: string;
  linkedQuestionIds?: string[];
}

export interface FilterOptions {
  search: string;
  topic: string;
  status: string;
  difficulty: string;
  week: string;
  onlyStarred: boolean;
  onlyDifficult: boolean;
}

export interface SM2Data {
  repetition: number;
  interval: number;
  easeFactor: number;
  dueDate: string;
  lastReviewedAt: string;
}

export type SM2Rating = "again" | "hard" | "good" | "easy";

export interface UserQuestionData {
  status?: QuestionStatus;
  starred?: boolean;
  solution?: string;
  hints?: string;
  snipUrl?: string;
  canvasData?: string; // Serialized vector strokes for re-editing
  sm2?: SM2Data;
  lastProofReview?: ProofReviewResult;
  updatedAt?: string;
}

export interface CourseUserState {
  courseId: string;
  lastActive?: string;
  questions: Record<string, UserQuestionData>;
}

export interface FullBackupPayload {
  app: "course-noting";
  version: number;
  exportedAt: string;
  activeCourse?: string;
  courses: Record<string, CourseUserState>;
}

export type AIProvider = "antigravity" | "gemini" | "openai" | "anthropic" | "ollama";

export interface AISettings {
  provider: AIProvider;
  antigravityModel?: string;
  geminiKey?: string;
  geminiModel?: string;
  openaiKey?: string;
  openaiModel?: string;
  anthropicKey?: string;
  anthropicModel?: string;
  ollamaUrl?: string;
  ollamaModel?: string;
  // Batch Lecture Engine (Stage 1 transcript ingestion token-saver split)
  useBatchEngine?: boolean;
  batchProvider?: AIProvider;
  batchModel?: string;
  batchThinkingLevel?: "minimal" | "low" | "medium" | "high";
  batchOllamaModel?: string;
}

export interface ProofReviewResult {
  verdict: "Rigorous Proof" | "Correct with Minor Gaps" | "Missing Hypotheses" | "Flawed Logic";
  score: number; // 0 to 10
  summary: string;
  missingHypotheses: string[];
  logicalGaps: string[];
  strengths: string[];
  suggestedPatch: string;
  alternativeMethodNotes?: string;
}

// -------------------------------------------------------------
// 3-Layer Architecture & Lecture Intelligence Engine Schemas
// -------------------------------------------------------------

export type LectureInsightType = "intuition" | "exam_warning" | "nuance" | "heuristic";

export interface LectureInsight {
  id?: string;
  conceptSlug?: string;
  questionId?: string;
  type: LectureInsightType;
  title: string;
  timestamp?: string; // e.g. "00:24:10"
  seconds?: number;
  content: string; // KaTeX markdown
  text?: string; // Optional legacy alias for content
}

export interface QuestionHintInsight {
  questionId: string;
  timestamp?: string;
  hint: string;
}

export interface LectureNoteMeta {
  id: string;
  week: number;
  lectureNumber?: number;
  title: string;
  date?: string;
  echo360Url?: string;
  topics: string[];
  sourceSlides?: string;
  sourceTranscript?: string;
  sourceAudio?: string;
  linkedConcepts?: string[];
  linkedQuestions?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LectureNote extends LectureNoteMeta {
  content: string; // Full markdown content
  outline?: string[];
  insights?: LectureInsight[];
  questionHints?: QuestionHintInsight[];
  contextWarning?: string;
}

/** Layer 1: Canonical Base Course Pack */
export interface CourseBasePack {
  version: "1.0";
  layer: "base";
  course: CourseMeta;
  concepts: Concept[];
  questions: Question[];
}

/** Layer 2: Dynamic Lecture Insights Pack */
export interface CourseLecturePack {
  version: "1.0";
  layer: "lectures";
  courseId: string;
  lectures: LectureNote[];
  insights: LectureInsight[];
  questionHints: QuestionHintInsight[];
}

/** Merged runtime view of Course, Concepts, and Questions */
export interface MergedCourseData {
  course: CourseMeta;
  concepts: Concept[];
  questions: Question[];
  lectures: LectureNote[];
  layer2Active: boolean;
}

// -------------------------------------------------------------
// Selective Export & Classmate Sharing Schemas
// -------------------------------------------------------------

export interface SelectiveExportOptions {
  courseId: string;
  selectedWeeks: "all" | number[]; // Array of selected week numbers. 0 represents General / Unassigned. "all" represents all weeks.

  // Curriculum
  includeQuestions: boolean;
  includeConcepts: boolean;

  // Lecture Layer
  includeLectureNotes: boolean;
  includeSpokenIntuitions: boolean;
  includeExamWarnings: boolean;

  // Student Work
  includeWrittenSolutions: boolean;
  includeCanvasScratchpads: boolean;

  // Private Study Metrics
  includeSm2Stats: boolean;
  includeMasteryStatus: boolean;
  includeStarredFlags: boolean;
  includeAiReviewHistory: boolean;
}

export type ExportFormat = "json" | "markdown" | "string";

export interface ExportedPackSummary {
  courseCode: string;
  courseName: string;
  totalCourses: number;
  questionCount: number;
  conceptCount: number;
  lectureCount: number;
  insightCount: number;
  writtenSolutionCount: number;
  hasCanvasDrawings: boolean;
  hasPrivateMetrics: boolean;
  exportedAt?: string;
  formatType: "pack_json" | "save_string" | "markdown" | "unknown";
}



