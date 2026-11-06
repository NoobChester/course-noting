#!/usr/bin/env python3
"""
ingest_tutorial_sheet.py
Ingestion script for UNSW Tutorial Sheets with built-in solutions.
Extracts questions, categorizes difficulty tiers (Assumed, Basic/Exam, Advanced/DN/HD),
and embeds the official solutions under <!-- split:official -->.
"""

import os
import json

def create_tutorial_question(
    course_dir: str,
    sheet_num: int,
    q_num_in_sheet: int,
    global_num: int,
    title: str,
    tier: str, # "Assumed", "Exam", "Advanced"
    topic: str,
    prompt: str,
    official_solution: str,
    concepts: list = None,
    week: int = 1
):
    questions_dir = os.path.join(course_dir, "questions")
    os.makedirs(questions_dir, exist_ok=True)

    difficulty_map = {
        "Assumed": 2,
        "Exam": 3,
        "Advanced": 5
    }
    difficulty = difficulty_map.get(tier, 3)
    is_difficult = (tier == "Advanced")

    file_id = f"tute-s{sheet_num:02d}-q{q_num_in_sheet:02d}"
    filename = f"{file_id}.md"
    filepath = os.path.join(questions_dir, filename)

    frontmatter = {
        "id": file_id,
        "number": global_num,
        "sheetNumber": sheet_num,
        "qNumberInSheet": q_num_in_sheet,
        "title": title,
        "week": week,
        "topic": topic,
        "tier": tier,
        "difficulty": difficulty,
        "isDifficult": is_difficult,
        "isNonExaminable": False,
        "status": "Unattempted",
        "concepts": concepts or ["metric-topological-foundations"],
        "source": f"Tutorial Sheet {sheet_num:02d}",
        "starred": False,
        "createdAt": "2026-11-07T00:00:00.000Z",
        "updatedAt": "2026-11-07T00:00:00.000Z"
    }

    content = f"""---
{json.dumps(frontmatter, indent=2)}
---

{prompt.strip()}

<!-- split:hints -->
*Hints will appear here or can be added as you study.*

<!-- split:solution -->


<!-- split:official -->
{official_solution.strip()}
"""

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"Created: {filename} (Sheet {sheet_num} Q{q_num_in_sheet} - {tier})")
