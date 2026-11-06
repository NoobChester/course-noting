# AI Agent Course Initialization Prompt

> **Usage:** Whenever you take a new course, copy this project folder (or clear `content/questions` & `content/concepts`), open your AI coding assistant (like Antigravity), upload your new course problem sheet / lecture PDF, and paste the prompt below.

---

### Copy & Paste Prompt for AI Agent:

```markdown
I have a new course: [INSERT COURSE CODE & NAME, e.g. "MATH2011 Several Variable Calculus"].
Attached is the PDF of our problem sheets and course notes.

Please initialize this Study Hub for this new course:

1. Update `src/course.config.ts`:
   - code: "[e.g. MATH2011]"
   - name: "[e.g. Several Variable Calculus]"
   - institution: "[e.g. UNSW]"
   - term: "[e.g. T1 2027]"
   - logoSymbol: "[e.g. ∇f]"
   - customSnippets: Replace the math toolbar formulas with 12-16 essential LaTeX snippets for this specific subject.

2. Clear out any old questions and concepts in `content/questions/` and `content/concepts/`.

3. Parse the attached problem sheets:
   - Identify each syllabus section, topic, and week.
   - For every question, generate `content/questions/q-XXX.md` with:
     - Frontmatter: id, number, title, week, topic, difficulty (1-5), isDifficult (true if starred *), isNonExaminable (true if extension †), status ("Unattempted"), concepts ([slugs]).
     - Body: `### Prompt` with LaTeX math ($...$ and $$...$$).
     - `<!-- split:hints -->` with key steps.
     - `<!-- split:solution -->` placeholder for my working.
     - `<!-- split:official -->` with official problem sheet answers or notes.

4. Create 8-12 core concept guides in `content/concepts/<slug>.md`:
   - High-yield theorem statements, definitions, and formulas.
   - 1-2 sentence summary for the quick-reference slideout drawer.
   - Link each concept slug in the frontmatter of related questions.

5. Test the build with `npm run build` to verify all YAML frontmatter and LaTeX syntax are error-free.
```
