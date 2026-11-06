export type QuestionStatus = "Unattempted" | "In Progress" | "Needs Review" | "Mastered";

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
