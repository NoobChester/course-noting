"""
templates/coursebook/tools/mine_transcripts.py
Generalized transcript insight miner: extracts lecturer intuitions, physical motivations,
exam traps, and 'why do we care' callouts from transcripts into dossiers/.
"""

import os
import re
import json
from pathlib import Path

EXAM_PATTERNS = [
    r"\b(exam|test|marks|lose|deduct|fallacy|mistake|blunder|trap|don't write|careful|penalty)\b",
]

INTUITION_PATTERNS = [
    r"\b(why do we care|physical|intuition|picture|geometrically|analogy|metaphor|think of this as)\b",
]

def mine(workspace_path: Path):
    workspace = Path(workspace_path).resolve()
    transcripts_dir = workspace / "transcripts"
    dossiers_dir = workspace / "dossiers"
    dossiers_dir.mkdir(parents=True, exist_ok=True)

    if not transcripts_dir.exists():
        print(f"No transcripts directory found at {transcripts_dir}")
        return

    transcript_files = sorted(list(transcripts_dir.glob("*.txt")) + list(transcripts_dir.glob("*.vtt")))
    if not transcript_files:
        print(f"No transcripts found in {transcripts_dir}")
        return

    print(f"Mining {len(transcript_files)} transcripts in {transcripts_dir}...")
    
    # Process transcripts and group by week / chapter if possible
    all_insights = []
    for f in transcript_files:
        with open(f, "r", encoding="utf-8", errors="replace") as fh:
            lines = fh.readlines()
        
        for i, line in enumerate(lines):
            is_exam = any(re.search(p, line, re.IGNORECASE) for p in EXAM_PATTERNS)
            is_intuition = any(re.search(p, line, re.IGNORECASE) for p in INTUITION_PATTERNS)
            if is_exam or is_intuition:
                start = max(0, i - 2)
                end = min(len(lines), i + 3)
                context = "".join(lines[start:end]).strip()
                all_insights.append({
                    "source": f.name,
                    "type": "exam" if is_exam else "intuition",
                    "text": context
                })

    digest_file = dossiers_dir / "transcript_digest.md"
    with open(digest_file, "w", encoding="utf-8") as out:
        out.write(f"# Transcript Insight Digest\n\nTotal Insights Extracted: {len(all_insights)}\n\n")
        for item in all_insights:
            badge = "⚠️ EXAM TRAP" if item["type"] == "exam" else "🎓 LECTURER INTUITION"
            out.write(f"### {badge} ({item['source']})\n\n> {item['text']}\n\n---\n\n")

    print(f"Wrote {len(all_insights)} insights to {digest_file}")

if __name__ == "__main__":
    script_dir = Path(__file__).resolve().parent
    mine(script_dir.parent)
