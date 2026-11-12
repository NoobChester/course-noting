---
name: course-textbook-hub
description: Orchestrates universal textbook synthesis, pedagogical chapter authoring, and web study hub synchronization for arbitrary university courses (e.g. MATH3051, COMP3121, MATH2011). Handles dossier mining, 7-element LaTeX chapter authoring, Tectonic XeTeX compilation, and downstream web sync into Course Noting.
---

# Course Noting & Textbook Synthesizer Skill

Use this skill whenever the user asks to synthesize, create, update, or sync a course textbook or study hub, or whenever an `.antigravity_task.json` task is invoked (e.g. `/synthesize-course`).

---

## 1. The 5-Phase Execution Pipeline

When executing course synthesis for a workspace (e.g. `courses/MATH3051` or `../math3051`):

### Phase 1: Inspect Task Scope & Inputs
Check if `.antigravity_task.json` exists in the course workspace:
* Read target chapters, ready weeks, and input paths (`raw_files/LectureNotes.pdf`, `tut_sheets/`, `transcripts/`).
* If no task file exists, run `python scripts/course_bridge.py status --workspace <path>` to assess readiness.

### Phase 2: Ingest Dossiers
Run:
```powershell
python scripts/course_bridge.py ingest --workspace <path>
```
* Generates `dossiers/transcript_digest.md` (exam deductions, lecturer analogies, physical intuition).
* Generates `dossiers/tutorial_crosswalk.json` (indexed problem sheets and syllabus topics).

### Phase 3: Author LaTeX Chapters (7-Element Chapter Anatomy)
When authoring or updating chapters in `textbook/chapters/0N-<slug>.tex`, enforce the strict **7-Element Chapter Anatomy**:

1. **Motivational Crisis ("Why do we care?")**:
   A concrete physical, analytical, or geometric breakdown showing why elementary techniques fail and force the new mathematics.
2. **Geometric & Visual Intuition Before Symbols**:
   Plain English analogies and native TikZ diagrams illustrating concepts spatially.
3. **Formal Definitions & Theorems**:
   Standardized statements wrapped in `\begin{defn}[Name]` and `\begin{thm}[Name]`.
4. **Proof Battle Plans**:
   A 2–3 sentence high-level strategic attack plan wrapped in `\begin{battleplan}[Strategy Name]`.
5. **Tiered Proof Rigor**:
   * *Tier 1 (High-Yield Exam Proofs)*: Full step-by-step rigorous proof in `\begin{proofbox}`.
   * *Tier 2 (Heavy Technical Machinery)*: Battle Plan + structural sketch.
   * *Tier 3 (Routine Verification)*: Battle Plan + reader exercise hint.
6. **Lecturer Callout Boxes**:
   * Verbatim speech analogies in `\begin{lecturerbox}[Title]`.
   * Common exam traps and grading pitfalls in `\begin{exambox}[Title]`.
7. **Contextual Tutorial Companion Boxes**:
   * Tactical hints linking to problem sheets: `\begin{tutecompanion}[Tutorial Sheet S, QN --- Title]`.

> **Rule on Future Chapters**: If a course is in-flight (partial term), upcoming chapters must be initialized with clean syllabus stubs in `textbook/chapters/` so `main.tex` compiles without error.

### Phase 4: Compile & Verify
Run:
```powershell
python scripts/course_bridge.py compile-tex --workspace <path> --target All
```
* Runs `lint_tex.py` to confirm structural balance and required box counts.
* Compiles standalone chapter PDFs (`standalone/chN.pdf`) and the master book (`output/master-textbook.pdf`).

### Phase 5: Downstream Web Sync
Run:
```powershell
python scripts/course_bridge.py sync-web --workspace <path>
```
* Parses `defn`, `thm`, `battleplan`, `tutecompanion`, `lecturerbox`, and `exambox`.
* Generates `<course>_base.json` and `<course>_lectures.json`.
* Stages compiled PDFs to `public/courses/<course_id>/`.
* Updates `public/data/catalog.local.json` and marks `.antigravity_task.json` as `completed`.

---

## 2. In-Flight Semester Incremental Updates (Mid-Semester Delta)
When new materials arrive mid-semester (e.g. Week 7):
1. Run `python scripts/course_bridge.py status --workspace <path>`.
2. Author only the newly active chapter (e.g. Chapter 3).
3. Test-compile standalone: `python scripts/course_bridge.py compile-tex --workspace <path> --target Ch3`.
4. Run `python scripts/course_bridge.py sync-web --workspace <path>` to append new questions. Existing student proofs, drawings, and SM-2 schedules remain 100% preserved.

---

## 3. Local Proof Reviewer Audits
When audited via `python scripts/course_bridge.py audit-proof --question <id> --solution <text>`:
* Assemble the 4-pillar context: Prompt, Benchmark, Relevant Concept Definitions, Student Proof.
* Output structured JSON verdict matching `ProofReviewResult` with `verdict`, `score` (0-10), `missingHypotheses`, `logicalGaps`, `strengths`, and `suggestedPatch`.
