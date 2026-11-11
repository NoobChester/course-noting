#!/usr/bin/env python3
"""
scripts/bundle_packs.py
Compiles Markdown files from courses/<CODE>/ into static JSON packs in public/data/
for the Blank Slate WebApp runtime and GitHub Pages export.
- Layer 1: public/data/<courseId>_base.json
- Layer 2: public/data/<courseId>_lectures.json
- Catalog:  public/data/catalog.json
"""

import os
import sys
import json
import re

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COURSES_DIR = os.path.join(BASE_DIR, "courses")
COURSES_EXAMPLE_DIR = os.path.join(BASE_DIR, "courses.example")
PUBLIC_DATA_DIR = os.path.join(BASE_DIR, "public", "data")

def parse_simple_yaml(text):
    """Robust parser for simple and nested YAML dictionaries and lists without external dependencies."""
    result = {}
    current_key = None
    current_list = None
    current_item = None

    for line in text.splitlines():
        raw_line = line
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue

        indent = len(raw_line) - len(raw_line.lstrip())

        # List item: starts with '- ' or '  - '
        if stripped.startswith("- "):
            item_text = stripped[2:].strip()
            if current_key and current_list is not None:
                if ":" in item_text:
                    # New dict inside list
                    current_item = {}
                    current_list.append(current_item)
                    k, v = item_text.split(":", 1)
                    current_item[k.strip()] = clean_yaml_val(v.strip())
                else:
                    # Primitive value in list
                    current_list.append(clean_yaml_val(item_text))
                    current_item = None
            continue

        # Property of dict inside list (indented further)
        if current_item is not None and indent >= 4 and ":" in stripped:
            k, v = stripped.split(":", 1)
            current_item[k.strip()] = clean_yaml_val(v.strip())
            continue

        # Top-level key: value
        if ":" in stripped:
            k, v = stripped.split(":", 1)
            k = k.strip()
            v = v.strip()
            if not v:
                # Start of nested list or dict
                current_key = k
                current_list = []
                result[current_key] = current_list
                current_item = None
            else:
                result[k] = clean_yaml_val(v)
                current_key = None
                current_list = None
                current_item = None

    return result

def clean_yaml_val(v):
    if v.lower() == "true":
        return True
    if v.lower() == "false":
        return False
    if re.match(r"^-?\d+$", v):
        return int(v)
    if re.match(r"^-?\d+\.\d+$", v):
        return float(v)
    if v.startswith("[") and v.endswith("]"):
        try:
            return json.loads(v)
        except:
            return [x.strip().strip('"').strip("'") for x in v[1:-1].split(",") if x.strip()]
    if (v.startswith('"') and v.endswith('"')) or (v.startswith("'") and v.endswith("'")):
        return v[1:-1]
    return v

def parse_markdown_with_frontmatter(file_path):
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        text = f.read()

    m = re.match(r"^---\s*\n(.*?)\n---\s*\n(.*)$", text, re.DOTALL)
    if not m:
        return {}, text.strip()

    front_raw, body = m.group(1), m.group(2)
    meta = {}

    if front_raw.strip().startswith("{") and front_raw.strip().endswith("}"):
        try:
            meta = json.loads(front_raw)
        except Exception:
            pass

    if not meta:
        meta = parse_simple_yaml(front_raw)

    return meta, body.strip()

def split_question_content(body):
    # Splits by <!-- split:hints -->, <!-- split:solution -->, <!-- split:official -->
    sections = re.split(r'<!--\s*split:(hints|solution|official)\s*-->', body, flags=re.IGNORECASE)
    
    prompt = sections[0].strip()
    if prompt.startswith("### Prompt"):
        prompt = prompt[len("### Prompt"):].strip()

    hints = ""
    solution = ""
    official = ""

    for i in range(1, len(sections), 2):
        sec_name = sections[i].lower()
        sec_content = sections[i+1].strip() if i+1 < len(sections) else ""
        if sec_name == "hints":
            hints = sec_content
        elif sec_name == "solution":
            solution = sec_content
        elif sec_name == "official":
            official = sec_content

    return {
        "prompt": prompt,
        "hints": hints,
        "solution": solution,
        "official": official
    }

def bundle_course(parent_dir, course_folder):
    course_path = os.path.join(parent_dir, course_folder)
    cfg_path = os.path.join(course_path, "course.json")
    
    if not os.path.exists(cfg_path):
        return None

    with open(cfg_path, "r", encoding="utf-8") as f:
        course_meta = json.load(f)

    course_id = course_meta.get("id", course_folder.lower()).lower()
    course_meta["id"] = course_id

    # 1. Parse Concepts (Layer 1)
    concepts = []
    concepts_dir = os.path.join(course_path, "concepts")
    if os.path.exists(concepts_dir):
        for fname in sorted(os.listdir(concepts_dir)):
            if not fname.endswith(".md"):
                continue
            c_meta, c_content = parse_markdown_with_frontmatter(os.path.join(concepts_dir, fname))
            slug = c_meta.get("slug", fname[:-3])
            concepts.append({
                "slug": slug,
                "title": c_meta.get("title", slug.replace("-", " ").title()),
                "week": c_meta.get("week", 1),
                "category": c_meta.get("category", "General"),
                "summary": c_meta.get("summary", ""),
                "prerequisites": c_meta.get("prerequisites", []),
                "content": c_content
            })

    # 2. Parse Questions (Layer 1)
    questions = []
    questions_dir = os.path.join(course_path, "questions")
    if os.path.exists(questions_dir):
        for fname in sorted(os.listdir(questions_dir)):
            if not fname.endswith(".md"):
                continue
            q_meta, q_body = parse_markdown_with_frontmatter(os.path.join(questions_dir, fname))
            q_id = q_meta.get("id", fname[:-3])
            q_content = split_question_content(q_body)
            
            questions.append({
                "id": q_id,
                "number": q_meta.get("number", len(questions) + 1),
                "title": q_meta.get("title", f"Question {len(questions) + 1}"),
                "week": q_meta.get("week", 1),
                "topic": q_meta.get("topic", "General"),
                "difficulty": q_meta.get("difficulty", 3),
                "isDifficult": q_meta.get("isDifficult", False),
                "isNonExaminable": q_meta.get("isNonExaminable", False),
                "status": q_meta.get("status", "Unattempted"),
                "concepts": q_meta.get("concepts", []),
                "source": q_meta.get("source", ""),
                "content": q_content,
                "rawBody": q_body,
                "createdAt": q_meta.get("createdAt", "2026-11-07T00:00:00.000Z"),
                "updatedAt": q_meta.get("updatedAt", "2026-11-07T00:00:00.000Z")
            })

    # Sort questions by number
    questions.sort(key=lambda q: q["number"])

    # Build Layer 1 Pack
    base_pack = {
        "version": "1.0",
        "layer": "base",
        "course": course_meta,
        "concepts": concepts,
        "questions": questions
    }

    # 3. Parse Lectures (Layer 2)
    lectures = []
    all_insights = []
    all_question_hints = []
    lectures_dir = os.path.join(course_path, "lectures")

    if os.path.exists(lectures_dir):
        for fname in sorted(os.listdir(lectures_dir)):
            if not fname.endswith(".md"):
                continue
            l_meta, l_body = parse_markdown_with_frontmatter(os.path.join(lectures_dir, fname))
            lec_id = l_meta.get("id", fname[:-3])
            
            # Extract structured insights if present in frontmatter or comments
            insights = l_meta.get("insights", [])
            q_hints = l_meta.get("questionHints", [])

            lec_obj = {
                "id": lec_id,
                "week": l_meta.get("week", 1),
                "lectureNumber": l_meta.get("lectureNumber", None),
                "title": l_meta.get("title", lec_id.replace("-", " ").title()),
                "date": l_meta.get("date", ""),
                "echo360Url": l_meta.get("echo360Url", ""),
                "topics": l_meta.get("topics", []),
                "sourceSlides": l_meta.get("sourceSlides", ""),
                "sourceTranscript": l_meta.get("sourceTranscript", ""),
                "sourceAudio": l_meta.get("sourceAudio", ""),
                "linkedConcepts": l_meta.get("linkedConcepts", []),
                "linkedQuestions": l_meta.get("linkedQuestions", []),
                "createdAt": l_meta.get("createdAt", "2026-11-07T00:00:00.000Z"),
                "updatedAt": l_meta.get("updatedAt", "2026-11-07T00:00:00.000Z"),
                "content": l_body,
                "insights": insights,
                "questionHints": q_hints
            }
            lectures.append(lec_obj)
            all_insights.extend(insights)
            all_question_hints.extend(q_hints)

    # Build Layer 2 Pack
    lecture_pack = {
        "version": "1.0",
        "layer": "lectures",
        "courseId": course_id,
        "lectures": lectures,
        "insights": all_insights,
        "questionHints": all_question_hints
    }

    # Output paths
    os.makedirs(PUBLIC_DATA_DIR, exist_ok=True)
    base_file = os.path.join(PUBLIC_DATA_DIR, f"{course_id}_base.json")
    lec_file = os.path.join(PUBLIC_DATA_DIR, f"{course_id}_lectures.json")

    with open(base_file, "w", encoding="utf-8") as f:
        json.dump(base_pack, f, indent=2)

    with open(lec_file, "w", encoding="utf-8") as f:
        json.dump(lecture_pack, f, indent=2)

    print(f"Bundled {course_meta['code']}:")
    print(f"  -> Layer 1 (Base): {len(questions)} questions, {len(concepts)} concepts -> {base_file}")
    print(f"  -> Layer 2 (Lectures): {len(lectures)} lectures, {len(all_insights)} insights -> {lec_file}")

    return {
        "id": course_id,
        "code": course_meta.get("code", course_folder),
        "name": course_meta.get("name", ""),
        "institution": course_meta.get("institution", ""),
        "term": course_meta.get("term", ""),
        "logoSymbol": course_meta.get("logoSymbol", "📚"),
        "description": course_meta.get("description", ""),
        "questionCount": len(questions),
        "conceptCount": len(concepts),
        "lectureCount": len(lectures),
        "hasBasePack": True,
        "hasLecturePack": len(lectures) > 0
    }

def main():
    is_ci = os.environ.get("GITHUB_ACTIONS") == "true" or os.environ.get("NEXT_PUBLIC_DEMO_ONLY") == "true" or "--demo-only" in sys.argv
    public_catalog = []
    local_catalog = []
    seen_public = set()
    seen_local = set()

    # 1. Process courses.example if it exists (always available as safe demo)
    if os.path.exists(COURSES_EXAMPLE_DIR):
        for folder in sorted(os.listdir(COURSES_EXAMPLE_DIR)):
            cdir = os.path.join(COURSES_EXAMPLE_DIR, folder)
            if os.path.isdir(cdir):
                item = bundle_course(COURSES_EXAMPLE_DIR, folder)
                if item:
                    if item["id"] not in seen_public:
                        public_catalog.append(item)
                        seen_public.add(item["id"])
                    if item["id"] not in seen_local:
                        local_catalog.append(item)
                        seen_local.add(item["id"])

    # 2. Process local courses/ directory (saved ONLY to local_catalog and catalog.local.json)
    if not is_ci and os.path.exists(COURSES_DIR):
        for folder in sorted(os.listdir(COURSES_DIR)):
            cdir = os.path.join(COURSES_DIR, folder)
            if os.path.isdir(cdir):
                item = bundle_course(COURSES_DIR, folder)
                if item and item["id"] not in seen_local:
                    local_catalog.append(item)
                    seen_local.add(item["id"])

    os.makedirs(PUBLIC_DATA_DIR, exist_ok=True)

    # Public catalog: Strictly demo courses, tracked in Git
    catalog_file = os.path.join(PUBLIC_DATA_DIR, "catalog.json")
    with open(catalog_file, "w", encoding="utf-8") as f:
        json.dump(public_catalog, f, indent=2)

    # Local catalog: All courses (demo + local university), ignored by Git (.gitignore)
    local_catalog_file = os.path.join(PUBLIC_DATA_DIR, "catalog.local.json")
    with open(local_catalog_file, "w", encoding="utf-8") as f:
        json.dump(local_catalog, f, indent=2)

    print(f"\n[OK] Public Catalog (Git Tracked): {len(public_catalog)} demo course(s) at {catalog_file}")
    print(f"[OK] Local Catalog (.gitignore Protected): {len(local_catalog)} course(s) at {local_catalog_file}")

if __name__ == "__main__":
    main()
