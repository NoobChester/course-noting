#!/usr/bin/env python3
"""
ingest_lecture_exercises.py
Ingestion script for UNSW Lecture Notes textbook exercises.
Creates markdown files tagged with Chapter, Exercise Number, and Sub-topic.
"""

import os
import json

def create_textbook_question(
    course_dir: str,
    chapter_num: int,
    exercise_num: str, # e.g. "1.1", "1.10"
    global_num: int,
    title: str,
    subtopic: str,
    prompt: str,
    hints: str = "",
    official_solution: str = "",
    difficulty: int = 3,
    is_difficult: bool = False,
    concepts: list = None,
    week: int = 1
):
    questions_dir = os.path.join(course_dir, "questions")
    os.makedirs(questions_dir, exist_ok=True)

    safe_ex_num = exercise_num.replace(".", "-")
    file_id = f"book-ch{chapter_num:02d}-ex{safe_ex_num}"
    filename = f"{file_id}.md"
    filepath = os.path.join(questions_dir, filename)

    frontmatter = {
        "id": file_id,
        "number": global_num,
        "chapterNumber": chapter_num,
        "exerciseNumber": exercise_num,
        "title": title,
        "week": week,
        "topic": f"Ch {chapter_num}: {subtopic}",
        "tier": "Textbook Exercise",
        "difficulty": difficulty,
        "isDifficult": is_difficult,
        "isNonExaminable": False,
        "status": "Unattempted",
        "concepts": concepts or ["metric-topological-foundations"],
        "source": f"Lecture Notes Ch {chapter_num}",
        "starred": False,
        "createdAt": "2026-11-07T00:00:00.000Z",
        "updatedAt": "2026-11-07T00:00:00.000Z"
    }

    content = f"""---
{json.dumps(frontmatter, indent=2)}
---

{prompt.strip()}

<!-- split:hints -->
{hints.strip() if hints else "*Refer to Chapter lecture notes.*"}

<!-- split:solution -->


<!-- split:official -->
{official_solution.strip() if official_solution else "*Exercise from Lecture Notes (solutions not provided in text). Write and verify your proof here.*"}
"""

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"Created: {filename} (Ch {chapter_num} Ex {exercise_num})")
