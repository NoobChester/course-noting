import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import { Question, QuestionContent, QuestionMeta, Concept, ConceptMeta, CourseMeta } from "./types";
import { getUserCourseState, saveUserQuestionData } from "./user-service";

const COURSES_BASE_DIR = path.join(process.cwd(), "courses");

export async function getAllRegisteredCourses(): Promise<CourseMeta[]> {
  try {
    const entries = await fs.readdir(COURSES_BASE_DIR, { withFileTypes: true });
    const courses: CourseMeta[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const courseFolder = path.join(COURSES_BASE_DIR, entry.name);
      const configPath = path.join(courseFolder, "course.json");

      try {
        const configRaw = await fs.readFile(configPath, "utf-8");
        const configData: CourseMeta = JSON.parse(configRaw);
        courses.push({
          ...configData,
          id: configData.id || entry.name.toLowerCase()
        });
      } catch {
        // Fallback if course.json not present
        courses.push({
          id: entry.name.toLowerCase(),
          code: entry.name.toUpperCase(),
          name: entry.name.toUpperCase(),
          logoSymbol: "📚"
        });
      }
    }

    return courses.sort((a, b) => a.code.localeCompare(b.code));
  } catch (err) {
    console.error("Error loading courses from courses/ directory:", err);
    // Check courses.example
    try {
      const exampleDir = path.join(process.cwd(), "courses.example");
      const entries = await fs.readdir(exampleDir, { withFileTypes: true });
      const courses: CourseMeta[] = [];
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const configPath = path.join(exampleDir, entry.name, "course.json");
        try {
          const configRaw = await fs.readFile(configPath, "utf-8");
          courses.push(JSON.parse(configRaw));
        } catch {
          courses.push({
            id: entry.name.toLowerCase(),
            code: entry.name.toUpperCase(),
            name: entry.name.toUpperCase(),
            logoSymbol: "📚"
          });
        }
      }
      if (courses.length > 0) return courses;
    } catch {}

    return [
      {
        id: "sample1001",
        code: "SAMPLE1001",
        name: "Linear Algebra & Multivariable Calculus (Demo)",
        institution: "Open Demo",
        term: "Showcase",
        logoSymbol: "λ",
        preset: "general"
      }
    ];
  }
}

export async function resolveCourseFolder(courseId?: string): Promise<string> {
  const targetId = (courseId || "sample1001").toLowerCase().replace(/[^a-z0-9]/g, "");

  try {
    const entries = await fs.readdir(COURSES_BASE_DIR);
    for (const entry of entries) {
      if (entry.toLowerCase().replace(/[^a-z0-9]/g, "") === targetId) {
        return path.join(COURSES_BASE_DIR, entry);
      }
    }
  } catch {}

  // Check courses.example
  try {
    const exampleDir = path.join(process.cwd(), "courses.example");
    const entries = await fs.readdir(exampleDir);
    for (const entry of entries) {
      if (entry.toLowerCase().replace(/[^a-z0-9]/g, "") === targetId) {
        return path.join(exampleDir, entry);
      }
    }
  } catch {}

  // Default fallback
  return path.join(process.cwd(), "courses.example", "SAMPLE1001");
}

export async function resolveQuestionsDir(courseId?: string): Promise<string> {
  const courseFolder = await resolveCourseFolder(courseId);
  return path.join(courseFolder, "questions");
}

export async function resolveConceptsDir(courseId?: string): Promise<string> {
  const courseFolder = await resolveCourseFolder(courseId);
  return path.join(courseFolder, "concepts");
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
    const cleanCourseId = (courseId || "sample1001").toLowerCase().replace(/[^a-z0-9]/g, "");
    const dir = await resolveQuestionsDir(cleanCourseId);
    const files = await fs.readdir(dir);
    const questions: QuestionMeta[] = [];

    // Load dedicated user progress (overlay)
    const userState = await getUserCourseState(cleanCourseId);

    for (const file of files) {
      if (!file.endsWith(".md")) continue;
      const filePath = path.join(dir, file);
      const fileContent = await fs.readFile(filePath, "utf-8");
      const { data } = matter(fileContent);

      const qId = data.id || file.replace(/\.md$/, "");
      const userData = userState.questions[qId];

      questions.push({
        id: qId,
        number: data.number || 0,
        title: data.title || "Untitled Question",
        week: data.week || 1,
        topic: data.topic || "General",
        difficulty: data.difficulty || 2,
        isDifficult: Boolean(data.isDifficult),
        isNonExaminable: Boolean(data.isNonExaminable),
        status: userData?.status || data.status || "Unattempted",
        concepts: Array.isArray(data.concepts) ? data.concepts : [],
        source: data.source || "",
        snipUrl: userData?.snipUrl || data.snipUrl || "",
        starred: userData?.starred !== undefined ? Boolean(userData.starred) : Boolean(data.starred),
        sm2: userData?.sm2,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: userData?.updatedAt || data.updatedAt || new Date().toISOString()
      });
    }

    return questions.sort((a, b) => a.number - b.number || a.id.localeCompare(b.id));
  } catch (err) {
    console.error("Error reading questions:", err);
    return [];
  }
}

export async function getQuestionById(id: string, courseId?: string): Promise<Question | null> {
  try {
    const cleanCourseId = (courseId || "sample1001").toLowerCase().replace(/[^a-z0-9]/g, "");
    const dir = await resolveQuestionsDir(cleanCourseId);
    const filePath = path.join(dir, `${id}.md`);
    const fileContent = await fs.readFile(filePath, "utf-8");
    const { data, content } = matter(fileContent);
    const parsedContent = parseQuestionSections(content);

    // Overlay personal student progress from dedicated userdata/
    const userState = await getUserCourseState(cleanCourseId);
    const userData = userState.questions[id];

    if (userData) {
      if (userData.solution !== undefined) {
        parsedContent.solution = userData.solution;
      }
      if (userData.hints !== undefined && userData.hints.trim()) {
        parsedContent.hints = userData.hints;
      }
    }

    return {
      id: data.id || id,
      number: data.number || 0,
      title: data.title || "Untitled Question",
      week: data.week || 1,
      topic: data.topic || "General",
      difficulty: data.difficulty || 2,
      isDifficult: Boolean(data.isDifficult),
      isNonExaminable: Boolean(data.isNonExaminable),
      status: userData?.status || data.status || "Unattempted",
      concepts: Array.isArray(data.concepts) ? data.concepts : [],
      source: data.source || "",
      snipUrl: userData?.snipUrl || data.snipUrl || "",
      starred: userData?.starred !== undefined ? Boolean(userData.starred) : Boolean(data.starred),
      sm2: userData?.sm2,
      canvasData: userData?.canvasData,
      lastProofReview: userData?.lastProofReview,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: userData?.updatedAt || data.updatedAt || new Date().toISOString(),
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
    const cleanCourseId = (courseId || "sample1001").toLowerCase().replace(/[^a-z0-9]/g, "");

    // Dedicate user modifications to userdata/
    const success = await saveUserQuestionData(cleanCourseId, question.id, {
      status: question.status,
      starred: Boolean(question.starred),
      solution: question.content.solution,
      hints: question.content.hints,
      snipUrl: question.snipUrl || "",
      canvasData: question.canvasData,
      sm2: question.sm2,
      lastProofReview: question.lastProofReview
    });

    return success;
  } catch (err) {
    console.error(`Error saving user question ${question.id}:`, err);
    return false;
  }
}

export async function createOrUpdateMasterQuestion(question: Question, courseId?: string): Promise<boolean> {
  try {
    const dir = await resolveQuestionsDir(courseId);
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
    console.error(`Error creating master question ${question.id}:`, err);
    return false;
  }
}

export async function getAllConcepts(courseId?: string): Promise<Concept[]> {
  try {
    const dir = await resolveConceptsDir(courseId);
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
    const dir = await resolveConceptsDir(courseId);
    const filePath = path.join(dir, `${slug}.md`);
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
