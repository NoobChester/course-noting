import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";

const COURSES_DIR = path.join(process.cwd(), "courses");

export async function POST(req: NextRequest) {
  try {
    const {
      courseId = "math3701",
      targetType, // "concept" | "question"
      targetId, // slug for concept, qId for question
      snippet,
      title = "Lecturer Spoken Insight",
      timestamp
    } = await req.json();

    if (!targetType || !targetId || !snippet) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const cleanCourseId = courseId.toUpperCase().replace(/[^A-Z0-9]/g, "");

    if (targetType === "concept") {
      const conceptsDir = path.join(COURSES_DIR, cleanCourseId, "concepts");
      const conceptFile = path.join(conceptsDir, `${targetId}.md`);

      const raw = await fs.readFile(conceptFile, "utf-8");
      const { data, content } = matter(raw);

      const timestampTag = timestamp ? ` [${timestamp}]` : "";
      const injectionBlock = `\n\n### 🎙️ ${title}${timestampTag}\n${snippet.trim()}\n`;

      const updatedContent = content + injectionBlock;
      const updatedFile = matter.stringify(updatedContent, {
        ...data,
        updatedAt: new Date().toISOString()
      });

      await fs.writeFile(conceptFile, updatedFile, "utf-8");
      return NextResponse.json({ success: true, target: `concept:${targetId}` });
    } else if (targetType === "question") {
      const questionsDir = path.join(COURSES_DIR, cleanCourseId, "questions");
      const questionFile = path.join(questionsDir, `${targetId}.md`);

      const raw = await fs.readFile(questionFile, "utf-8");
      const { data, content } = matter(raw);

      // Questions use <!-- split:hints -->
      const timestampTag = timestamp ? ` [${timestamp}]` : "";
      const hintAddition = `\n* **Lecturer Tip${timestampTag}:** ${snippet.trim()}\n`;

      let updatedContent = content;
      if (updatedContent.includes("<!-- split:hints -->")) {
        updatedContent = updatedContent.replace(
          "<!-- split:hints -->",
          `<!-- split:hints -->\n${hintAddition}`
        );
      } else {
        updatedContent += `\n\n<!-- split:hints -->\n### Hints & Key Steps\n${hintAddition}`;
      }

      const updatedFile = matter.stringify(updatedContent, {
        ...data,
        updatedAt: new Date().toISOString()
      });

      await fs.writeFile(questionFile, updatedFile, "utf-8");
      return NextResponse.json({ success: true, target: `question:${targetId}` });
    } else {
      return NextResponse.json({ error: "Invalid targetType" }, { status: 400 });
    }
  } catch (err: any) {
    console.error("Error in /api/lectures/push:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
