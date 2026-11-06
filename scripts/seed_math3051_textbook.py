#!/usr/bin/env python3
"""
seed_math3051_textbook.py
Extracts and generates all textbook exercises from LectureNotes.pdf
across Chapters 2 through 11 (Exercises 2.1 to 11.3, numbering Q130 to Q287)
with full metadata, chapter topics, concept links, and notes.
"""

import os
import re
import json
import pypdf

COURSE_DIR = r"C:\Users\User\course noting\courses\MATH3051"
PDF_PATH = os.path.join(COURSE_DIR, "raw_files", "LectureNotes.pdf")
QUESTIONS_DIR = os.path.join(COURSE_DIR, "questions")
os.makedirs(QUESTIONS_DIR, exist_ok=True)

CHAPTER_CONFIG = [
    {
        "ch": 2,
        "name": "Metric Spaces",
        "week": 2,
        "concept": "metric-topological-foundations",
        "p_start": 47,
        "p_end": 54,
        "next_ch": "Chapter 3",
        "section": "2.11"
    },
    {
        "ch": 3,
        "name": "Topological Spaces",
        "week": 3,
        "concept": "metric-topological-foundations",
        "p_start": 76,
        "p_end": 81,
        "next_ch": "Chapter 4",
        "section": "3.12"
    },
    {
        "ch": 4,
        "name": "Measure Theory & Lebesgue Integrals",
        "week": 4,
        "concept": "measure-theory-lebesgue-integrals",
        "p_start": 106,
        "p_end": 110,
        "next_ch": "Chapter 5",
        "section": "4.5"
    },
    {
        "ch": 5,
        "name": "Normed Vector Spaces",
        "week": 7,
        "concept": "normed-spaces-duals-theorems",
        "p_start": 147,
        "p_end": 152,
        "next_ch": "Chapter 6",
        "section": "5.16"
    },
    {
        "ch": 6,
        "name": "Differential Calculus in Normed Spaces",
        "week": 8,
        "concept": "normed-spaces-duals-theorems",
        "p_start": 160,
        "p_end": 163,
        "next_ch": "Chapter 7",
        "section": "6.5"
    },
    {
        "ch": 7,
        "name": "The Lp Spaces",
        "week": 8,
        "concept": "lp-spaces-hilbert-spaces",
        "p_start": 181,
        "p_end": 184,
        "next_ch": "Chapter 8",
        "section": "7.5"
    },
    {
        "ch": 8,
        "name": "Hilbert Spaces",
        "week": 9,
        "concept": "lp-spaces-hilbert-spaces",
        "p_start": 206,
        "p_end": 209,
        "next_ch": "Chapter 9",
        "section": "8.9"
    },
    {
        "ch": 10,
        "name": "Compact Operators",
        "week": 10,
        "concept": "sobolev-spaces-compact-operators-pdes",
        "p_start": 240,
        "p_end": 243,
        "next_ch": "Chapter 11",
        "section": "10.8"
    },
    {
        "ch": 11,
        "name": "The Galerkin Methods",
        "week": 10,
        "concept": "sobolev-spaces-compact-operators-pdes",
        "p_start": 247,
        "p_end": 250,
        "next_ch": "Chapter 12",
        "section": "11.3"
    }
]

def clean_exercise_text(raw_text):
    # Ligatures
    t = raw_text.replace('ﬁ', 'fi').replace('ﬂ', 'fl').replace('ﬀ', 'ff').replace('ﬃ', 'ffi')
    # Math symbols from Type 1 font
    t = t.replace(';:::;', ', \\dots, ')
    t = t.replace(';:::', ', \\dots')
    t = t.replace(';::: ', ', \\dots ')
    t = t.replace(' 2 ', ' \\in ')
    t = t.replace(' 2Rn', ' \\in \\mathbb{R}^n')
    t = t.replace(' 2C', ' \\in \\mathbb{C}')
    t = t.replace(' 2X', ' \\in X')
    t = t.replace(' 2Y', ' \\in Y')
    t = t.replace(' 2H', ' \\in H')
    t = t.replace(' 8 ', ' \\forall ')
    t = t.replace('8x', '\\forall x')
    t = t.replace('8y', '\\forall y')
    t = t.replace('8n', '\\forall n')
    t = t.replace('8k', '\\forall k')
    t = t.replace('8t', '\\forall t')
    t = t.replace(' 9 ', ' \\exists ')
    t = t.replace('! =)', ' \\implies ')
    t = t.replace(' =)', ' \\implies ')
    t = t.replace(' <=>', ' \\iff ')
    t = t.replace(' ! ', ' \\to ')
    
    # Strip running headers
    lines = [l.strip() for l in t.split('\n') if l.strip()]
    clean_lines = []
    for l in lines:
        if re.match(r'^\d+\s+Thanh Tran$', l) or re.match(r'^Applied Real and Functional Analysis\s+\d+$', l):
            continue
        if re.search(r'^\d+\.\d+\s+Exercises$', l):
            continue
        clean_lines.append(l)
    
    full = ' '.join(clean_lines)
    # clean extra whitespace
    full = re.sub(r'\s+', ' ', full).strip()
    return full

def generate_title(ex_str, prompt):
    # Try to find a heading or clean the first sentence
    first_sentence = prompt.split('.')[0]
    if len(first_sentence) < 15 and len(prompt.split('.')) > 1:
        first_sentence = prompt.split('.')[0] + ': ' + prompt.split('.')[1]
    title = first_sentence.replace('**', '').replace('*', '').strip()
    # remove leading exercise number if repeated
    title = re.sub(rf'^{re.escape(ex_str)}\.?\s*', '', title)
    if len(title) > 65:
        title = title[:62] + '...'
    if not title:
        title = f"Exercise {ex_str}"
    return title

def main():
    print(f"Reading {PDF_PATH}...")
    reader = pypdf.PdfReader(PDF_PATH)
    total_pdf_pages = len(reader.pages)
    print(f"Total pages: {total_pdf_pages}")

    current_number = 130
    total_created = 0

    for cfg in CHAPTER_CONFIG:
        ch = cfg["ch"]
        print(f"\nProcessing Chapter {ch}: {cfg['name']}...")
        
        # Extract text from page range
        ch_text = ""
        for p in range(cfg["p_start"] - 1, min(cfg["p_end"], total_pdf_pages)):
            ch_text += reader.pages[p].extract_text() + "\n"
        
        # Locate exercises section
        m = re.search(rf'{ch}\.\d+\s+Exercises', ch_text)
        if m:
            ch_text = ch_text[m.start():]
        end = ch_text.find(cfg["next_ch"])
        if end != -1:
            ch_text = ch_text[:end]
            
        # Split exercises by pattern e.g. \n*2.1. or \n2.1.
        chunks = re.split(rf'\n(?=\*?\*?{ch}\.\d+\.)', ch_text)
        # Drop the header chunk
        ex_chunks = [c for c in chunks if re.match(rf'^\*?\*?{ch}\.\d+\.', c.strip())]
        print(f"  Found {len(ex_chunks)} exercises for Chapter {ch}")

        for chunk in ex_chunks:
            # Extract exercise label
            label_match = re.match(rf'^(\*?\*?)({ch}\.\d+)\.\s*(.*)', chunk.strip(), re.DOTALL)
            if not label_match:
                continue
            stars, ex_str, raw_body = label_match.groups()
            
            # Difficulty mapping
            if stars == "**":
                diff = 5
                is_diff = True
                tier = "Advanced / DN & HD"
            elif stars == "*":
                diff = 4
                is_diff = True
                tier = "Advanced / Credit+"
            else:
                diff = 3
                is_diff = False
                tier = "Textbook Exercise"

            cleaned_prompt = clean_exercise_text(raw_body)
            if not cleaned_prompt:
                cleaned_prompt = f"Exercise {ex_str} from Section {cfg['section']} of Thanh Tran's Lecture Notes."

            title_text = generate_title(ex_str, cleaned_prompt)

            ex_id = f"book-ch{ch:02d}-ex{ex_str.replace('.', '-')}"
            filename = f"{ex_id}.md"
            filepath = os.path.join(QUESTIONS_DIR, filename)

            frontmatter = {
                "id": ex_id,
                "number": current_number,
                "title": f"Exercise {ex_str}: {title_text}",
                "week": cfg["week"],
                "topic": f"Ch {ch}: {cfg['name']}",
                "tier": tier,
                "difficulty": diff,
                "isDifficult": is_diff,
                "isNonExaminable": False,
                "status": "Unattempted",
                "concepts": [cfg["concept"]],
                "source": f"Lecture Notes Ch {ch}",
                "starred": False,
                "createdAt": "2026-11-07T00:00:00.000Z",
                "updatedAt": "2026-11-07T00:00:00.000Z"
            }

            content = f"""---
{json.dumps(frontmatter, indent=2)}
---

{cleaned_prompt}

<!-- split:hints -->
*Refer to Section {cfg['section']} and the relevant definitions/theorems in Chapter {ch} of the Lecture Notes.*

<!-- split:solution -->


<!-- split:official -->
*Exercise {ex_str} from Section {cfg['section']} (Chapter {ch}: {cfg['name']}). Check the corresponding domain concept cheat sheet `{cfg['concept']}` for full theory references.*
"""
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(content)

            current_number += 1
            total_created += 1

    print(f"\n==========================================")
    print(f"SUCCESS: Created {total_created} textbook exercises!")
    print(f"Total questions in MATH3051 now numbered up to Q{current_number - 1}")
    print(f"==========================================")

if __name__ == "__main__":
    main()
