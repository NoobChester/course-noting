import fs from "fs/promises";
import path from "path";
import { CourseUserState, FullBackupPayload, QuestionStatus, UserQuestionData } from "./types";

const USER_DATA_DIR = path.join(process.cwd(), "userdata");

export async function ensureUserDataDir(courseId?: string): Promise<string> {
  await fs.mkdir(USER_DATA_DIR, { recursive: true });
  if (courseId) {
    const courseFolder = path.join(USER_DATA_DIR, courseId.toLowerCase().replace(/[^a-z0-9]/g, ""));
    await fs.mkdir(courseFolder, { recursive: true });
    return courseFolder;
  }
  return USER_DATA_DIR;
}

export function getUserStateFilePath(courseId: string): string {
  const cleanId = courseId.toLowerCase().replace(/[^a-z0-9]/g, "");
  return path.join(USER_DATA_DIR, cleanId, "state.json");
}

export async function getUserCourseState(courseId: string): Promise<CourseUserState> {
  const cleanId = courseId.toLowerCase().replace(/[^a-z0-9]/g, "");
  const filePath = getUserStateFilePath(cleanId);

  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const data: CourseUserState = JSON.parse(raw);
    return {
      courseId: cleanId,
      lastActive: data.lastActive || new Date().toISOString(),
      questions: data.questions || {}
    };
  } catch {
    // Return empty state if file does not exist
    return {
      courseId: cleanId,
      lastActive: new Date().toISOString(),
      questions: {}
    };
  }
}

export async function saveUserCourseState(courseId: string, state: CourseUserState): Promise<boolean> {
  try {
    const cleanId = courseId.toLowerCase().replace(/[^a-z0-9]/g, "");
    await ensureUserDataDir(cleanId);
    const filePath = getUserStateFilePath(cleanId);

    const payload: CourseUserState = {
      courseId: cleanId,
      lastActive: new Date().toISOString(),
      questions: state.questions
    };

    await fs.writeFile(filePath, JSON.stringify(payload, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error(`Failed to save user state for ${courseId}:`, err);
    return false;
  }
}

export async function saveUserQuestionData(
  courseId: string,
  questionId: string,
  data: UserQuestionData
): Promise<boolean> {
  try {
    const cleanId = courseId.toLowerCase().replace(/[^a-z0-9]/g, "");
    const state = await getUserCourseState(cleanId);

    state.questions[questionId] = {
      ...(state.questions[questionId] || {}),
      ...data,
      updatedAt: new Date().toISOString()
    };

    return await saveUserCourseState(cleanId, state);
  } catch (err) {
    console.error(`Failed to save user question ${questionId} in ${courseId}:`, err);
    return false;
  }
}

export async function getUserQuestionData(
  courseId: string,
  questionId: string
): Promise<UserQuestionData | null> {
  const cleanId = courseId.toLowerCase().replace(/[^a-z0-9]/g, "");
  const state = await getUserCourseState(cleanId);
  return state.questions[questionId] || null;
}

export async function getAllUserStates(): Promise<Record<string, CourseUserState>> {
  await ensureUserDataDir();
  const result: Record<string, CourseUserState> = {};

  try {
    const entries = await fs.readdir(USER_DATA_DIR, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const state = await getUserCourseState(entry.name);
      result[entry.name] = state;
    }
  } catch (err) {
    console.error("Error reading all user states:", err);
  }

  return result;
}

export async function exportBackupData(): Promise<FullBackupPayload> {
  const courses = await getAllUserStates();
  return {
    app: "course-noting",
    version: 1,
    exportedAt: new Date().toISOString(),
    courses
  };
}

export async function exportBackupString(): Promise<string> {
  const payload = await exportBackupData();
  const jsonStr = JSON.stringify(payload);
  const base64Str = Buffer.from(jsonStr, "utf-8").toString("base64");
  return `CNBACKUP:v1:${base64Str}`;
}

export function parseBackupString(raw: string): FullBackupPayload {
  const trimmed = raw.trim();

  // 1. Check if CNBACKUP:v1: prefixed base64
  if (trimmed.startsWith("CNBACKUP:v1:")) {
    const b64 = trimmed.substring("CNBACKUP:v1:".length);
    const jsonStr = Buffer.from(b64, "base64").toString("utf-8");
    return JSON.parse(jsonStr);
  }

  // 2. Check if raw JSON object
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return JSON.parse(trimmed);
  }

  // 3. Try generic base64 fallback
  try {
    const jsonStr = Buffer.from(trimmed, "base64").toString("utf-8");
    if (jsonStr.startsWith("{") && jsonStr.endsWith("}")) {
      return JSON.parse(jsonStr);
    }
  } catch {}

  throw new Error("Invalid save string format. Must be a CNBACKUP string or valid JSON backup.");
}

export async function importBackupPayload(
  payload: FullBackupPayload,
  mode: "merge" | "replace" = "merge"
): Promise<{ restoredCourses: number; restoredQuestions: number }> {
  if (!payload || !payload.courses || typeof payload.courses !== "object") {
    throw new Error("Invalid backup payload structure.");
  }

  let restoredCourses = 0;
  let restoredQuestions = 0;

  for (const [courseId, courseData] of Object.entries(payload.courses)) {
    const cleanId = courseId.toLowerCase().replace(/[^a-z0-9]/g, "");
    let stateToSave: CourseUserState;

    if (mode === "replace") {
      stateToSave = {
        courseId: cleanId,
        lastActive: new Date().toISOString(),
        questions: courseData.questions || {}
      };
    } else {
      // Merge mode
      const existing = await getUserCourseState(cleanId);
      stateToSave = {
        courseId: cleanId,
        lastActive: new Date().toISOString(),
        questions: {
          ...existing.questions,
          ...(courseData.questions || {})
        }
      };
    }

    const qCount = Object.keys(stateToSave.questions).length;
    await saveUserCourseState(cleanId, stateToSave);

    restoredCourses += 1;
    restoredQuestions += qCount;
  }

  return { restoredCourses, restoredQuestions };
}

export async function resetAllUserData(): Promise<boolean> {
  try {
    await ensureUserDataDir();
    const entries = await fs.readdir(USER_DATA_DIR, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name === "README.md" || entry.name === ".gitkeep") continue;
      const targetPath = path.join(USER_DATA_DIR, entry.name);
      await fs.rm(targetPath, { recursive: true, force: true });
    }
    return true;
  } catch (err) {
    console.error("Failed to reset user data:", err);
    return false;
  }
}
