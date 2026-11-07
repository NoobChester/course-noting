# 🎓 Course Noting — The Privacy-First University Study Hub & Proof Engine

[![Next.js 16](https://img.shields.io/badge/Next.js-16.4.5-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS-4.0-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![KaTeX](https://img.shields.io/badge/KaTeX-Math_Engine-00d084?style=for-the-badge)](https://katex.org/)
[![Deploy to GitHub Pages](https://github.com/NoobChester/course-noting/actions/workflows/deploy.yml/badge.svg)](https://github.com/NoobChester/course-noting/actions/workflows/deploy.yml)
[![Live Demo](https://img.shields.io/badge/Live_Demo-GitHub_Pages-indigo?style=for-the-badge&logo=github)](https://noobchester.github.io/course-noting/)

> **Course Noting** is an open-source, context-aware study hub and mathematical proof engine designed for university students in mathematics, physics, and computer science. 
> It bridges the gap between static PDF problem sheets, spoken lecture insights, LaTeX proof writing, and spaced repetition recall — while ensuring **zero university intellectual property ever leaks into public repositories**.

---

## 🚀 Live Demo

Experience the full interactive client-side web application on GitHub Pages:  
👉 **[https://noobchester.github.io/course-noting/](https://noobchester.github.io/course-noting/)**

* Ships with an open-source demonstration course: **`SAMPLE1001: Linear Algebra & Multivariable Calculus`**.
* 100% client-side: user progress, handwritten canvas strokes, and AI proof audits persist safely in your browser's `localStorage` / `IndexedDB`.

---

## 🏛️ The 3-Layer Save Architecture

University study materials belong to three fundamentally different categories. Course Noting completely isolates them:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        COURSE NOTING ENGINE                            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
    ┌───────────────────────────────┼───────────────────────────────┐
    ▼                               ▼                               ▼
┌─────────────────────────┐   ┌─────────────────────────┐   ┌─────────────────────────┐
│         LAYER 1         │   │         LAYER 2         │   │         LAYER 3         │
│   Base Curriculum Pack  │   │  Lecture Insights Pack  │   │  User Progress & State  │
├─────────────────────────┤   ├─────────────────────────┤   ├─────────────────────────┤
│ • Canonical Problems    │   │ • 🎙️ Spoken Intuitions  │   │ • Written LaTeX Proofs  │
│ • Numerical Solutions   │   │ • ⚠️ Lecturer Exam Tips │   │ • Scratchpad Drawings   │
│ • Theory Cheat Sheets   │   │ • Verbal Pitfall Alerts │   │ • SM-2 Flashcard Dates  │
│ • KaTeX Concept Defs    │   │ • Linked Question Hints │   │ • Starred Question List │
├─────────────────────────┤   ├─────────────────────────┤   ├─────────────────────────┤
│ <course>_base.json      │   │ <course>_lectures.json  │   │ browser / userdata/     │
│ (Static & Open Source)  │   │ (Toggleable in UI)      │   │ (100% Personal/Private) │
└─────────────────────────┘   └─────────────────────────┘   └─────────────────────────┘
```

1. **Layer 1: Base Curriculum Pack (`<course>_base.json`)**  
   Contains the syllabus framework: question statements, numerical answers, difficulty ratings, and markdown concept cheat sheets with KaTeX formatting.
2. **Layer 2: Lecture Insights Overlay (`<course>_lectures.json`)**  
   Extracted from speech-to-text audio and multi-LLM distillation. Overlays verbal intuitions (🎙️) and lecturer exam warnings (⚠️) directly into questions and theory. Can be switched on/off globally at any time using the navbar **`[🎙️ Lectures ON/OFF]`** toggle.
3. **Layer 3: User Progress & State**  
   Your personal answers, handwritten canvas sketches, mastery flags, and SuperMemo SM-2 retention intervals. On GitHub Pages, this lives strictly inside your browser; in local studio mode, it is kept in `userdata/` (which is strictly gitignored).

---

## ✨ Key Features

### ✍️ Split LaTeX Editor with Live KaTeX Rendering
* Compose proofs with mathematical rigor using standard Markdown and LaTeX math (`$inline$` or `$$display$$`).
* Real-time preview with ultra-fast KaTeX rendering.
* One-click math snippet palette for quick symbol insertion ($\oint_C$, $\partial u / \partial x$, $\sum_{n=1}^\infty$, $\operatorname{Res}$, $\nabla \times \mathbf{F}$).

### 🎨 Freehand Scratchpad Canvas
* Switch to the **Scratchpad tab** on any question to draw contour paths in the complex plane, sketch surface geometries, or do side scratch calculations.
* Features responsive pen, highlighter, eraser, and color pickers. Auto-saves directly with your question state.

### 🤖 Automated AI Proof Reviewer & Rigor Auditor
* Get instant critiques on mathematical logic, step-by-step clarity, and potential edge-case misses.
* **100% Private:** Your API keys are saved only in your local browser storage and never sent to any intermediary server.
* Supports **Google Gemini 1.5 Flash (Free Tier)**, **Anthropic Claude 3.5 Sonnet**, **OpenAI GPT-4o**, and **Local Ollama** (e.g. `qwen2.5:7b-instruct` / `llama3`).

### 📈 SM-2 Spaced Repetition Daily Review Queue
* Built-in SuperMemo-2 (SM-2) retention algorithm.
* Rate recall from **0 (Blankout)** to **5 (Mastered 🎉)**.
* Visit `/daily-review` to work through your daily queue of matured problems before exam day.

### 🎙️ Lecture Intelligence & Audio Streaming Engine
* Ingests Echo360 / university lecture recordings without downloading massive video streams.
* Automatically extracts and categorizes spoken lecturer insights into high-yield exam takeaways.
* Built-in HTTP 206 Partial Content audio player with KaTeX synchronized notes.

### ✂️ In-App PDF Question Snipper (`/import`)
* Load master tutorial sheets or past exam PDFs.
* Crop problem regions with an interactive bounding box to instantly populate question cards.

---

## 🏃 Local Studio Quickstart (For University Students)

To run the study engine on your local PC and add your university courses securely:

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/NoobChester/course-noting.git
cd course-noting
npm install
```

### 2. Launch Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📚 Adding Your Own University Courses

All course files inside `courses/<COURSE_CODE>/` are **strictly ignored by Git** (`.gitignore`), ensuring your university's proprietary PDFs, tutorial sheets, and lecture recordings remain 100% local on your hard drive.

### 1. Scaffolding a New Course
Run the built-in course generator CLI:
```bash
python scripts/course_manager.py new COMP3121 "Algorithms and Programming Techniques"
```
This creates the following directory structure:
```
courses/COMP3121/
├── course.json          # Metadata, topics, sources
├── concepts/            # Theory cheat sheets (.md with KaTeX)
├── questions/           # Question cards (.md with prompts & solutions)
└── lectures/            # Distilled lecture notes (.md with insights)
```

### 2. Ingesting Lecture Recordings (Echo360 Helper)
To fetch transcripts and lightweight audio streams from your university's Echo360 portal:
```bash
python scripts/echo360_helper.py --course COMP3121 --transcripts-only
```

### 3. Bundling Static Course Packs
Compile your course markdown files into high-speed static JSON packs:
```bash
python scripts/bundle_packs.py
```

---

## 💾 Save, Load & Cross-Device Sync

1. Click **Save / Load** in the top navigation bar.
2. **Copy Save String:** Produces a compressed, single-line string containing your complete study progress, solutions, and SM-2 schedules.
3. **Restore:** Paste the string on another device (or upload your `course-noting-backup.json`) to resume studying seamlessly.
4. **Clean Slate for Sharing:** Reset personal solutions with one click when sharing your study hub with friends while leaving course questions intact.

---

## 🛠️ Tech Stack & Architecture

* **Framework:** [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
* **Language:** [TypeScript 5](https://www.typescriptlang.org/)
* **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
* **Math Rendering:** [KaTeX 0.19](https://katex.org/)
* **Icons:** [Lucide React](https://lucide.dev/)
* **Static Export Pipeline:** Python zero-dependency pack bundler + `output: 'export'`
* **CI/CD:** GitHub Actions deploying to GitHub Pages

---

## 📜 License

Distributed under the [MIT License](LICENSE). Open source, free for academic and personal use.
