#!/usr/bin/env python3
"""
migrate_userdata.py
Extracts any student solutions/statuses into userdata/<courseId>/state.json
and cleans the course markdown files so the master repo is 100% pristine for sharing.
"""

import os
import json
import re

ROOT_DIR = r"C:\Users\User\course noting"
COURSES_DIR = os.path.join(ROOT_DIR, "courses")
USERDATA_DIR = os.path.join(ROOT_DIR, "userdata")
os.makedirs(USERDATA_DIR, exist_ok=True)

for course_name in ["MATH2621", "MATH3051"]:
    clean_course_id = course_name.lower().replace("-", "")
    course_q_dir = os.path.join(COURSES_DIR, course_name, "questions")
    if not os.path.exists(course_q_dir):
        continue

    course_user_dir = os.path.join(USERDATA_DIR, clean_course_id)
    os.makedirs(course_user_dir, exist_ok=True)
    user_state_file = os.path.join(course_user_dir, "state.json")

    user_state = {
        "courseId": clean_course_id,
        "lastActive": "2026-11-07T04:30:00.000Z",
        "questions": {}
    }

    cleaned_count = 0

    for fname in os.listdir(course_q_dir):
        if not fname.endswith(".md"):
            continue
        fpath = os.path.join(course_q_dir, fname)
        with open(fpath, "r", encoding="utf-8") as f:
            content = f.read()

        parts = content.split("---")
        if len(parts) < 3:
            continue

        fm = json.loads(parts[1]) if parts[1].strip().startswith("{") else {}
        body = "---".join(parts[2:])

        # Extract solution
        sol_match = re.search(r'<!--\s*split:solution\s*-->\s*(.*?)\s*<!--\s*split:official\s*-->', body, re.DOTALL)
        if sol_match:
            raw_sol = sol_match.group(1).replace("### My Solution", "").strip()
            # If user has typed working that is not the placeholder
            if raw_sol and raw_sol != "*Your solution working goes here...*":
                qid = fm.get("id") or fname.replace(".md", "")
                user_state["questions"][qid] = {
                    "status": fm.get("status", "In Progress"),
                    "starred": bool(fm.get("starred", False)),
                    "solution": raw_sol,
                    "updatedAt": "2026-11-07T04:30:00.000Z"
                }
                cleaned_count += 1
                print(f"Migrated user working for {qid} in {course_name}")

                # Clean master markdown back to template
                clean_body = body[:sol_match.start(1)] + "\n### My Solution\n*Your solution working goes here...*\n\n" + body[sol_match.end(1):]
                new_file_content = f"---{parts[1]}---\n{clean_body.strip()}\n"
                with open(fpath, "w", encoding="utf-8") as f:
                    f.write(new_file_content)

    with open(user_state_file, "w", encoding="utf-8") as f:
        json.dump(user_state, f, indent=2)
    print(f"Saved {user_state_file} with {len(user_state['questions'])} user questions.")

print("Migration complete!")
