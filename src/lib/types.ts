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

export interface UserQuestionData {
  status?: QuestionStatus;
  starred?: boolean;
  solution?: string;
  hints?: string;
  snipUrl?: string;
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

