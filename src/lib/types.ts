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
  customSnippets?: MathSnippet[];
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

export type AIProvider = "gemini" | "openai" | "anthropic" | "ollama";

export interface AISettings {
  provider: AIProvider;
  geminiKey?: string;
  openaiKey?: string;
  anthropicKey?: string;
  ollamaUrl?: string;
  ollamaModel?: string;
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


