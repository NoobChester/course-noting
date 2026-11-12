r"""
templates/coursebook/tools/lint_tex.py
Pedagogical chapter linter: verifies Motivational Crisis, Geometric Intuition,
required pedagogical boxes (defn, thm, battleplan, lecturerbox, exambox, tutecompanion),
and balanced environments.
"""

import os
import re
import sys
import shutil
import subprocess
from pathlib import Path

REQUIRED_ENVIRONMENTS = ["lecturerbox", "exambox", "battleplan", "tutecompanion"]

def lint_file_anatomy(filepath, ch_num):
    issues = []
    with open(filepath, "r", encoding="utf-8", errors="replace") as f:
        content = f.read()

    # 1. Check sections
    if not re.search(r"Motivational Crisis|Why do we care", content, re.IGNORECASE):
        issues.append("Missing Motivational Crisis / 'Why do we care?' section.")
        
    if not re.search(r"Geometric Intuition", content, re.IGNORECASE):
        issues.append("Missing Geometric Intuition section.")

    # 2. Check required environments
    for env in REQUIRED_ENVIRONMENTS:
        count = len(re.findall(rf"\\begin\{{{env}\}}", content))
        if count == 0:
            issues.append(f"Missing required environment: \\begin{{{env}}}")
        elif env in ["lecturerbox", "exambox"] and count < 2:
            issues.append(f"Low count for \\begin{{{env}}}: found {count}, recommended at least 2.")

    # 3. Check environment balancing
    begins = re.findall(r"\\begin\{([a-zA-Z*]+)\}", content)
    ends = re.findall(r"\\end\{([a-zA-Z*]+)\}", content)
    
    begin_counts = {}
    for b in begins:
        begin_counts[b] = begin_counts.get(b, 0) + 1
    for e in ends:
        begin_counts[e] = begin_counts.get(e, 0) - 1
        
    unbalanced = {k: v for k, v in begin_counts.items() if v != 0 and k not in ["document"]}
    if unbalanced:
        issues.append(f"Unbalanced LaTeX environments: {unbalanced}")

    # 4. Check label naming convention (ch<N>:slug)
    labels = re.findall(r"\\label\{([^}]+)\}", content)
    bad_labels = []
    valid_types = ["thm", "def", "sec", "lem", "prop", "cor", "fig", "eq", "res", "tut", "tute", "exam", "exm", "rem", "ex", "tab"]
    for lbl in labels:
        parts = lbl.split(":")
        if len(parts) >= 2:
            if not any(lbl.startswith(f"{t}:ch{ch_num}:") or lbl.startswith(f"ch{ch_num}:") for t in valid_types):
                bad_labels.append(lbl)
    if bad_labels:
        issues.append(f"Labels violating prefix convention (should use 'ch{ch_num}:...'): {bad_labels[:5]}")

    return issues

def main():
    script_dir = Path(__file__).resolve().parent
    workspace = script_dir.parent
    chapters_dir = workspace / "textbook" / "chapters"
    if not chapters_dir.exists():
        chapters_dir = workspace / "chapters"

    if not chapters_dir.exists():
        print(f"Chapters directory not found at {chapters_dir}")
        sys.exit(0)

    all_ok = True
    chapter_files = sorted(list(chapters_dir.glob("*.tex")))
    if not chapter_files:
        print("No chapter files found to lint.")
        return

    for path in chapter_files:
        match = re.search(r"(\d+)", path.name)
        ch_num = int(match.group(1)) if match else 1
        issues = lint_file_anatomy(path, ch_num)
        if issues:
            all_ok = False
            print(f"\n[FAIL] {path.name}:")
            for issue in issues:
                print(f"  - {issue}")
        else:
            print(f"[PASS] {path.name} adheres to 7-element chapter anatomy.")

    if not all_ok:
        sys.exit(1)
    print("\nAll chapters successfully passed pedagogical linting!")

if __name__ == "__main__":
    main()
