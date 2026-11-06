---
name: course-study-hub
description: Automatically create, ingest, or manage study hubs for any university course (e.g. MATH2621, MATH2011, MATH2801, COMP3121) using the built-in course manager CLI and LaTeX problem parser.
---

# Course Study Hub Automation Skill

Use this skill whenever the user wants to add a new university course, ingest a new problem sheet PDF, or generate concept cheat sheets for their study hub.

---

## 1. Quick Ingestion Procedure

When a user provides a course code/name or problem sheet:

### Step 1: Create the Course Entry
Run the course manager CLI:
```powershell
python scripts/course_manager.py create --code <COURSE_CODE> --name "<COURSE_NAME>" --preset <PRESET>
```
Available Presets:
- `calculus` (Multivariable calculus, partial derivatives, double/triple integrals, Green's, Stokes', Divergence)
- `linear_algebra` (Matrices, determinants, eigenvalues, eigenvectors, diagonalisation)
- `complex_analysis` (Contour integration, residues, Cauchy formulas, Laurent series)
- `probability_statistics` (Distributions, expectation, variance, hypothesis testing, MLE)
- `discrete_math_algorithms` (Big-O notation, master theorem, recurrence relations, graphs)
- `general` (General STEM problem sets)

### Step 2: Ingest Problems from PDF or Text
If the user provides a PDF or text file of problems:
1. Extract questions into `content/<courseId>/questions/q-XXX.md`.
2. Format LaTeX formulas cleanly ($...$ for inline, $$...$$ for display blocks).
3. Populate `<!-- split:hints -->`, `<!-- split:solution -->`, and `<!-- split:official -->`.
4. Tag questions with the appropriate concept slugs.

### Step 3: Verify and Build
Run:
```powershell
npm run build
```
Verify that all YAML frontmatter, slugs, and formulas compile cleanly.
