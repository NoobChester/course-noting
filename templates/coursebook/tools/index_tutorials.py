"""
templates/coursebook/tools/index_tutorials.py
Indexes tutorial sheets and problem PDFs into dossiers/tutorial_crosswalk.json
for contextual cross-referencing and \tutecompanion mapping.
"""

import os
import re
import json
from pathlib import Path

def index_tutorials(workspace_path: Path):
    workspace = Path(workspace_path).resolve()
    tut_dir = workspace / "tut sheets"
    if not tut_dir.exists():
        tut_dir = workspace / "raw_files" / "tut_sheets"
    dossiers_dir = workspace / "dossiers"
    dossiers_dir.mkdir(parents=True, exist_ok=True)

    crosswalk = {
        "sheets": [],
        "questions": []
    }

    if tut_dir.exists():
        pdf_files = sorted(list(tut_dir.glob("*.pdf")))
        for f in pdf_files:
            match = re.search(r"(\d+)", f.name)
            sheet_num = int(match.group(1)) if match else len(crosswalk["sheets"]) + 1
            crosswalk["sheets"].append({
                "sheet": sheet_num,
                "filename": f.name,
                "path": str(f.relative_to(workspace))
            })

    crosswalk_file = dossiers_dir / "tutorial_crosswalk.json"
    with open(crosswalk_file, "w", encoding="utf-8") as out:
        json.dump(crosswalk, out, indent=2)

    print(f"Indexed {len(crosswalk['sheets'])} sheets into {crosswalk_file}")

if __name__ == "__main__":
    script_dir = Path(__file__).resolve().parent
    index_tutorials(script_dir.parent)
