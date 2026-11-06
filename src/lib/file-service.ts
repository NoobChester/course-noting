import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import { Question, QuestionContent, QuestionMeta, Concept, ConceptMeta, CourseMeta } from "./types";

const CONTENT_DIR = path.join(process.cwd(), "content");
const COURSES_FILE = path.join(CONTENT_DIR, "courses.json");

export async function getAllRegisteredCourses(): Promise<CourseMeta[]> {
  try {
    const data = await fs.readFile(COURSES_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [
      {
        id: "math2621",
        code: "MATH2621",
        name: "Higher Complex Analysis",
        institution: "The University of New South Wales",
        term: "T3, 2026",
        logoSymbol: "∫dz",
        preset: "complex_analysis"
      }
    ];
  }
}

export function resolveQuestionsDir(courseId?: string): string {
  const cid = (courseId || "math2621").toLowerCase().replace(/[^a-z0-9]/g, "");
  const coursePath = path.join(CONTENT_DIR, cid, "questions");
  return coursePath;
}

export function resolveConceptsDir(courseId?: string): string {
  const cid = (courseId || "math2621").toLowerCase().replace(/[^a-z0-9]/g, "");
  const coursePath = path.join(CONTENT_DIR, cid, "concepts");
  return coursePath;
}

export function parseQuestionSections(body: string): QuestionContent {
  const sections: QuestionContent = {
    prompt: "",
    hints: "",
    solution: "",
    official: ""
  };

  const parts = body.split(/<!--\s*split:(\w+)\s*-->/);
  let initial = parts[0] || "";
  sections.prompt = initial.replace(/^###\s*Prompt\s*/m, "").trim();

  for (let i = 1; i < parts.length; i += 2) {
    const key = parts[i];
    const text = parts[i + 1] || "";
    if (key === "hints") {
      sections.hints = text.replace(/^###\s*Hints\s*(&\s*Key\s*Steps)?\s*/m, "").trim();
    } else if (key === "solution") {
      sections.solution = text.replace(/^###\s*My\s*Solution\s*/m, "").trim();
    } else if (key === "official") {
      sections.official = text.replace(/^###\s*(Official\s*Answer|Model\s*(\/\s*Official)?\s*Solution(\s*Notes)?)\s*/m, "").trim();
    }
  }

  return sections;
}

export function serializeQuestionSections(content: QuestionContent): string {
  return `### Prompt
${content.prompt.trim()}

<!-- split:hints -->
### Hints & Key Steps
${content.hints.trim()}

<!-- split:solution -->
### My Solution
${content.solution.trim()}

<!-- split:official -->
### Official Answer / Solution Notes
${content.official.trim()}
`;
}

export async function getAllQuestions(courseId?: string): Promise<QuestionMeta[]> {
  try {
    let dir = resolveQuestionsDir(courseId);
    try {
      await fs.access(dir);
    } catch {
      // Fallback to content/questions if migration in progress
      dir = path.join(CONTENT_DIR, "questions");
    }

    const files = await fs.readdir(dir);
    const questions: QuestionMeta[] = [];

    for (const file of files) {
      if (!file.endsWith(".md")) continue;
      const filePath = path.join(dir, file);
      const fileContent = await fs.readFile(filePath, "utf-8");
      const { data } = matter(fileContent);

      questions.push({
        id: data.id || file.replace(/\.md$/, ""),
        number: data.number || 0,
        title: data.title || "Untitled Question",
        week: data.week || 1,
        topic: data.topic || "General",
        difficulty: data.difficulty || 2,
        isDifficult: Boolean(data.isDifficult),
        isNonExaminable: Boolean(data.isNonExaminable),
        status: data.status || "Unattempted",
        concepts: Array.isArray(data.concepts) ? data.concepts : [],
        source: data.source || "",
        snipUrl: data.snipUrl || "",
        starred: Boolean(data.starred),
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString()
      });
    }

    return questions.sort((a, b) => a.number - b.number);
  } catch (err) {
    console.error("Error reading questions:", err);
    return [];
  }
}

export async function getQuestionById(id: string, courseId?: string): Promise<Question | null> {
  try {
    let dir = resolveQuestionsDir(courseId);
    let filePath = path.join(dir, `${id}.md`);
    try {
      await fs.access(filePath);
    } catch {
      filePath = path.join(CONTENT_DIR, "questions", `${id}.md`);
    }

    const fileContent = await fs.readFile(filePath, "utf-8");
    const { data, content } = matter(fileContent);
    const parsedContent = parseQuestionSections(content);

    return {
      id: data.id || id,
      number: data.number || 0,
      title: data.title || "Untitled Question",
      week: data.week || 1,
      topic: data.topic || "General",
      difficulty: data.difficulty || 2,
      isDifficult: Boolean(data.isDifficult),
      isNonExaminable: Boolean(data.isNonExaminable),
      status: data.status || "Unattempted",
      concepts: Array.isArray(data.concepts) ? data.concepts : [],
      source: data.source || "",
      snipUrl: data.snipUrl || "",
      starred: Boolean(data.starred),
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
      content: parsedContent,
      rawBody: content
    };
  } catch (err) {
    console.error(`Error reading question ${id}:`, err);
    return null;
  }
}

export async function saveQuestion(question: Question, courseId?: string): Promise<boolean> {
  try {
    let dir = resolveQuestionsDir(courseId);
    await fs.mkdir(dir, { recursive: true });
    const filePath = path.join(dir, `${question.id}.md`);
    const serializedBody = serializeQuestionSections(question.content);

    const frontmatterData = {
      id: question.id,
      number: question.number,
      title: question.title,
      week: question.week,
      topic: question.topic,
      difficulty: question.difficulty,
      isDifficult: Boolean(question.isDifficult),
      isNonExaminable: Boolean(question.isNonExaminable),
      status: question.status,
      concepts: question.concepts,
      source: question.source || "",
      snipUrl: question.snipUrl || "",
      starred: Boolean(question.starred),
      createdAt: question.createdAt,
      updatedAt: new Date().toISOString()
    };

    const fileContent = matter.stringify(serializedBody, frontmatterData);
    await fs.writeFile(filePath, fileContent, "utf-8");
    return true;
  } catch (err) {
    console.error(`Error saving question ${question.id}:`, err);
    return false;
  }
}

export async function getAllConcepts(courseId?: string): Promise<Concept[]> {
  try {
    let dir = resolveConceptsDir(courseId);
    try {
      await fs.access(dir);
    } catch {
      dir = path.join(CONTENT_DIR, "concepts");
    }

    const files = await fs.readdir(dir);
    const concepts: Concept[] = [];
    const allQuestions = await getAllQuestions(courseId);

    for (const file of files) {
      if (!file.endsWith(".md")) continue;
      const filePath = path.join(dir, file);
      const fileContent = await fs.readFile(filePath, "utf-8");
      const { data, content } = matter(fileContent);

      const slug = data.slug || file.replace(/\.md$/, "");
      const linked = allQuestions
        .filter((q) => q.concepts.includes(slug))
        .map((q) => q.id);

      concepts.push({
        slug,
        title: data.title || "Untitled Concept",
        week: data.week || 1,
        category: data.category || "General",
        summary: data.summary || "",
        prerequisites: Array.isArray(data.prerequisites) ? data.prerequisites : [],
        content,
        linkedQuestionIds: linked
      });
    }

    return concepts.sort((a, b) => a.week - b.week);
  } catch (err) {
    console.error("Error reading concepts:", err);
    return [];
  }
}

export async function getConceptBySlug(slug: string, courseId?: string): Promise<Concept | null> {
  try {
    let dir = resolveConceptsDir(courseId);
    let filePath = path.join(dir, `${slug}.md`);
    try {
      await fs.access(filePath);
    } catch {
      filePath = path.join(CONTENT_DIR, "concepts", `${slug}.md`);
    }

    const fileContent = await fs.readFile(filePath, "utf-8");
    const { data, content } = matter(fileContent);

    const allQuestions = await getAllQuestions(courseId);
    const linked = allQuestions
      .filter((q) => q.concepts.includes(slug))
      .map((q) => q.id);

    return {
      slug: data.slug || slug,
      title: data.title || "Untitled Concept",
      week: data.week || 1,
      category: data.category || "General",
      summary: data.summary || "",
      prerequisites: Array.isArray(data.prerequisites) ? data.prerequisites : [],
      content,
      linkedQuestionIds: linked
    };
  } catch (err) {
    console.error(`Error reading concept ${slug}:`, err);
    return null;
  }
}
