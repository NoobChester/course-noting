import os
import sys
import json
import re
import argparse

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COURSES_DIR = os.path.join(BASE_DIR, "courses")

PRESETS = {
    "calculus": {
        "logoSymbol": "∇f",
        "snippets": [
            {"label": "∇f", "template": "\\nabla f(x, y, z)", "category": "Calculus"},
            {"label": "∂f/∂x", "template": "\\frac{\\partial f}{\\partial x}", "category": "Calculus"},
            {"label": "∬_D", "template": "\\iint_D f(x, y) \\, dA", "category": "Integrals"},
            {"label": "∭_E", "template": "\\iiint_E f(x, y, z) \\, dV", "category": "Integrals"},
            {"label": "∮_C F·dr", "template": "\\oint_C \\mathbf{F} \\cdot d\\mathbf{r}", "category": "Integrals"},
            {"label": "curl F", "template": "\\nabla \\times \\mathbf{F}", "category": "Calculus"},
            {"label": "div F", "template": "\\nabla \\cdot \\mathbf{F}", "category": "Calculus"},
            {"label": "lim_{x→x₀}", "template": "\\lim_{(x,y) \\to (x_0, y_0)} f(x,y)", "category": "Calculus"},
            {"label": "Stokes", "template": "\\oint_C \\mathbf{F} \\cdot d\\mathbf{r} = \\iint_S (\\nabla \\times \\mathbf{F}) \\cdot d\\mathbf{S}", "category": "Integrals"},
            {"label": "Divergence Thm", "template": "\\iint_S \\mathbf{F} \\cdot d\\mathbf{S} = \\iiint_E (\\nabla \\cdot \\mathbf{F}) \\, dV", "category": "Integrals"},
            {"label": "Green's Thm", "template": "\\oint_C (P \\, dx + Q \\, dy) = \\iint_D \\left(\\frac{\\partial Q}{\\partial x} - \\frac{\\partial P}{\\partial y}\\right) dA", "category": "Integrals"}
        ],
        "default_concepts": [
            {
                "slug": "partial-derivatives-gradient",
                "title": "Partial Derivatives, Gradients & Directional Derivatives",
                "week": 1,
                "category": "Differentiation",
                "summary": "Gradient $\\nabla f = \\langle f_x, f_y, f_z \\rangle$, directional derivative $D_{\\mathbf{u}} f = \\nabla f \\cdot \\mathbf{u}$.",
                "prerequisites": [],
                "content": "### Gradients and Directional Derivatives\n\n- **Gradient Vector:** $\\nabla f = \\left\\langle \\frac{\\partial f}{\\partial x}, \\frac{\\partial f}{\\partial y}, \\frac{\\partial f}{\\partial z} \\right\\rangle$.\n- Points in the direction of maximum rate of increase.\n- Magnitude $|\\nabla f|$ is the maximum rate of increase."
            },
            {
                "slug": "multiple-integrals",
                "title": "Double and Triple Integrals & Coordinate Systems",
                "week": 3,
                "category": "Integration",
                "summary": "Fubini's Theorem, polar ($r \\, dr d\\theta$), cylindrical ($r \\, dz dr d\\theta$), and spherical ($\\rho^2 \\sin\\phi \\, d\\rho d\\phi d\\theta$).",
                "prerequisites": ["partial-derivatives-gradient"],
                "content": "### Multiple Integrals & Jacobians\n\n$$\\iint_R f(x,y) \\, dA = \\iint_G f(g(u,v), h(u,v)) \\left| \\frac{\\partial(x,y)}{\\partial(u,v)} \\right| du dv$$"
            },
            {
                "slug": "vector-calculus-theorems",
                "title": "Green's, Stokes' and Divergence Theorems",
                "week": 7,
                "category": "Vector Calculus",
                "summary": "Fundamental theorems relating boundary integrals to region/surface/volume integrals.",
                "prerequisites": ["multiple-integrals"],
                "content": "### Fundamental Theorems of Vector Calculus\n\n1. **Green's Theorem:** $\\oint_C P dx + Q dy = \\iint_D (Q_x - P_y) dA$\n2. **Stokes' Theorem:** $\\oint_C \\mathbf{F} \\cdot d\\mathbf{r} = \\iint_S (\\nabla \\times \\mathbf{F}) \\cdot d\\mathbf{S}$\n3. **Divergence Theorem:** $\\iint_S \\mathbf{F} \\cdot d\\mathbf{S} = \\iiint_E (\\nabla \\cdot \\mathbf{F}) dV$"
            }
        ]
    },
    "linear_algebra": {
        "logoSymbol": "Ax=λx",
        "snippets": [
            {"label": "A x = b", "template": "A\\mathbf{x} = \\mathbf{b}", "category": "Calculus"},
            {"label": "det(A)", "template": "\\det(A)", "category": "Calculus"},
            {"label": "A^{-1}", "template": "A^{-1} = \\frac{1}{\\det(A)} \\operatorname{adj}(A)", "category": "Fractions"},
            {"label": "Av = λv", "template": "A\\mathbf{v} = \\lambda \\mathbf{v}", "category": "Symbols"},
            {"label": "det(A - λI)", "template": "\\det(A - \\lambda I) = 0", "category": "Symbols"},
            {"label": "Matrix 2x2", "template": "\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}", "category": "Symbols"},
            {"label": "Matrix 3x3", "template": "\\begin{pmatrix} a_{11} & a_{12} & a_{13} \\\\ a_{21} & a_{22} & a_{23} \\\\ a_{31} & a_{32} & a_{33} \\end{pmatrix}", "category": "Symbols"},
            {"label": "⟨u, v⟩", "template": "\\langle \\mathbf{u}, \\mathbf{v} \\rangle = \\mathbf{u}^T \\mathbf{v}", "category": "Symbols"},
            {"label": "proj_u(v)", "template": "\\operatorname{proj}_{\\mathbf{u}}(\\mathbf{v}) = \\frac{\\mathbf{u} \\cdot \\mathbf{v}}{\\|\\mathbf{u}\\|^2} \\mathbf{u}", "category": "Calculus"}
        ],
        "default_concepts": [
            {
                "slug": "eigenvalues-eigenvectors",
                "title": "Eigenvalues, Eigenvectors & Diagonalization",
                "week": 4,
                "category": "Spectral Theory",
                "summary": "Characteristic polynomial $\\det(A - \\lambda I) = 0$, eigenspaces, diagonalization $A = P D P^{-1}$.",
                "prerequisites": [],
                "content": "### Eigendecomposition\n\n$A \\mathbf{v} = \\lambda \\mathbf{v} \\iff (A - \\lambda I)\\mathbf{v} = \\mathbf{0}$."
            }
        ]
    },
    "probability_statistics": {
        "logoSymbol": "E[X]",
        "snippets": [
            {"label": "P(A|B)", "template": "P(A \\mid B) = \\frac{P(A \\cap B)}{P(B)}", "category": "Fractions"},
            {"label": "E[X]", "template": "\\mathbb{E}[X] = \\int_{-\\infty}^\\infty x f(x) \\, dx", "category": "Integrals"},
            {"label": "Var(X)", "template": "\\operatorname{Var}(X) = \\mathbb{E}[X^2] - (\\mathbb{E}[X])^2", "category": "Calculus"},
            {"label": "Cov(X,Y)", "template": "\\operatorname{Cov}(X, Y) = \\mathbb{E}[XY] - \\mathbb{E}[X]\\mathbb{E}[Y]", "category": "Calculus"},
            {"label": "N(μ, σ²)", "template": "\\mathcal{N}(\\mu, \\sigma^2)", "category": "Symbols"},
            {"label": "MLE", "template": "\\hat{\\theta}_{\\text{MLE}} = \\arg\\max_\\theta \\sum_{i=1}^n \\ln f(x_i; \\theta)", "category": "Calculus"}
        ],
        "default_concepts": [
            {
                "slug": "random-variables-distributions",
                "title": "Random Variables & Probability Distributions",
                "week": 2,
                "category": "Foundations",
                "summary": "PDF, CDF, joint distributions, marginals, and independence.",
                "prerequisites": [],
                "content": "### Probability Distributions\n\n$F(x) = P(X \\le x) = \\int_{-\\infty}^x f(t) dt$."
            }
        ]
    },
    "discrete_math_algorithms": {
        "logoSymbol": "O(n)",
        "snippets": [
            {"label": "O(g(n))", "template": "O(n \\log n)", "category": "Symbols"},
            {"label": "Ω(g(n))", "template": "\\Omega(n^2)", "category": "Symbols"},
            {"label": "Θ(g(n))", "template": "\\Theta(n)", "category": "Symbols"},
            {"label": "Master Thm", "template": "T(n) = a T(n/b) + f(n)", "category": "Calculus"},
            {"label": "a ≡ b (mod m)", "template": "a \\equiv b \\pmod{m}", "category": "Symbols"}
        ],
        "default_concepts": [
            {
                "slug": "asymptotic-analysis-recurrences",
                "title": "Asymptotic Complexity & Recurrence Relations",
                "week": 1,
                "category": "Algorithm Analysis",
                "summary": "Big-O, Omega, Theta, Master Theorem, Akra-Bazzi.",
                "prerequisites": [],
                "content": "### Asymptotic Notation\n\n$f(n) = O(g(n)) \\iff \\exists c > 0, n_0 \\text{ s.t. } f(n) \\le c g(n) \\, \\forall n \\ge n_0$."
            }
        ]
    },
    "general": {
        "logoSymbol": "f(x)",
        "snippets": [
            {"label": "a/b", "template": "\\frac{a}{b}", "category": "Fractions"},
            {"label": "∑_{i=1}^n", "template": "\\sum_{i=1}^n x_i", "category": "Calculus"},
            {"label": "∫ f(x)dx", "template": "\\int f(x) \\, dx", "category": "Integrals"},
            {"label": "√x", "template": "\\sqrt{x}", "category": "Symbols"}
        ],
        "default_concepts": []
    }
}

def load_courses():
    if not os.path.exists(COURSES_DIR):
        return []
    courses = []
    for folder in os.listdir(COURSES_DIR):
        cfg_path = os.path.join(COURSES_DIR, folder, "course.json")
        if os.path.exists(cfg_path):
            with open(cfg_path, "r", encoding="utf-8") as f:
                try:
                    courses.append(json.load(f))
                except:
                    pass
    return sorted(courses, key=lambda c: c.get("code", ""))

def create_course(code, name, term="T1, 2027", institution="University", preset="calculus"):
    course_folder = code.upper().replace(" ", "")
    target_dir = os.path.join(COURSES_DIR, course_folder)

    if os.path.exists(target_dir):
        print(f"Course folder {course_folder} already exists at {target_dir}!")
        return course_folder

    preset_data = PRESETS.get(preset, PRESETS["general"])

    new_course = {
        "id": course_folder.lower(),
        "code": course_folder,
        "name": name,
        "institution": institution,
        "term": term,
        "logoSymbol": preset_data["logoSymbol"],
        "description": f"Study workspace, question bank, and concept guides for {code} ({name}).",
        "preset": preset,
        "customSnippets": preset_data["snippets"]
    }

    questions_dir = os.path.join(target_dir, "questions")
    concepts_dir = os.path.join(target_dir, "concepts")
    os.makedirs(questions_dir, exist_ok=True)
    os.makedirs(concepts_dir, exist_ok=True)

    # Save course config
    with open(os.path.join(target_dir, "course.json"), "w", encoding="utf-8") as f:
        json.dump(new_course, f, indent=2)

    # Seed default concepts for preset
    for concept in preset_data.get("default_concepts", []):
        c_path = os.path.join(concepts_dir, f"{concept['slug']}.md")
        content = f"""---
slug: {json.dumps(concept['slug'])}
title: {json.dumps(concept['title'])}
week: {concept['week']}
category: {json.dumps(concept['category'])}
summary: {json.dumps(concept['summary'])}
prerequisites: {json.dumps(concept['prerequisites'])}
---

{concept['content']}
"""
        with open(c_path, "w", encoding="utf-8") as f:
            f.write(content)

    print(f"Successfully created self-contained course {code} ({name}) at courses/{course_folder}/")
    return course_folder

def parse_text_or_pdf(text, course_code, default_topic="General"):
    course_folder = course_code.upper().replace(" ", "")
    questions_dir = os.path.join(COURSES_DIR, course_folder, "questions")
    os.makedirs(questions_dir, exist_ok=True)

    # Regex to identify question boundaries
    pattern = re.compile(r'(?:^|\n)(?:(?:Question|Problem)\s+(\d+)|(\d+)[\.\)])\s*([^\n]*)', re.IGNORECASE)
    matches = list(pattern.finditer(text))

    if not matches:
        print("No numbered questions detected via pattern.")
        return 0

    count = 0
    current_topic = default_topic

    for i in range(len(matches)):
        m = matches[i]
        q_num = int(m.group(1) or m.group(2))
        q_title_snippet = m.group(3).strip()

        start_idx = m.end()
        end_idx = matches[i+1].start() if i + 1 < len(matches) else len(text)
        body = text[start_idx:end_idx].strip()

        # Check for Answer:
        answer = ""
        ans_match = re.search(r'Answer:\s*(.*)', body, re.DOTALL | re.IGNORECASE)
        if ans_match:
            answer = ans_match.group(1).strip()
            prompt = body[:ans_match.start()].strip()
        else:
            prompt = body

        title = f"Problem {q_num}"
        if q_title_snippet and len(q_title_snippet) < 60:
            title = f"{title}: {q_title_snippet}"

        q_id = f"q-{str(q_num).zfill(3)}"
        is_difficult = "*" in m.group(0) or "*" in q_title_snippet
        is_extension = "†" in m.group(0)

        file_content = f"""---
id: "{q_id}"
number: {q_num}
title: {json.dumps(title)}
week: {max(1, min(10, (q_num // 12) + 1))}
topic: {json.dumps(current_topic)}
difficulty: {4 if is_difficult else 2}
isDifficult: {str(is_difficult).lower()}
isNonExaminable: {str(is_extension).lower()}
status: "Unattempted"
concepts: []
source: "{course_id.upper()} Problem Sheet - Q{q_num}"
snipUrl: ""
createdAt: "2026-11-06"
updatedAt: "2026-11-06"
---

### Prompt
{prompt}

<!-- split:hints -->
### Hints & Key Steps
1. Identify key definitions and setup.

<!-- split:solution -->
### My Solution
*Your working goes here...*

<!-- split:official -->
### Official Answer / Solution Notes
{answer}
"""
        with open(os.path.join(questions_dir, f"{q_id}.md"), "w", encoding="utf-8") as f:
            f.write(file_content)
        count += 1

    print(f"Parsed and created {count} questions for {course_id}!")
    return count

def main():
    parser = argparse.ArgumentParser(description="Study Hub Course Manager CLI")
    subparsers = parser.add_subparsers(dest="command")

    # list
    subparsers.add_parser("list")

    # create
    create_p = subparsers.add_parser("create")
    create_p.add_argument("--code", required=True, help="Course code, e.g. MATH2011")
    create_p.add_argument("--name", required=True, help="Course name, e.g. Several Variable Calculus")
    create_p.add_argument("--term", default="T1, 2027")
    create_p.add_argument("--institution", default="UNSW")
    create_p.add_argument("--preset", choices=list(PRESETS.keys()), default="calculus")

    # import-text
    import_p = subparsers.add_parser("import-text")
    import_p.add_argument("--course", required=True)
    import_p.add_argument("--file", required=True, help="Text or markdown file with questions")
    import_p.add_argument("--topic", default="General")

    args = parser.parse_args()

    if args.command == "list":
        courses = load_courses()
        print(f"\nRegistered Courses ({len(courses)}):")
        for c in courses:
            c_code = c.get("code", c.get("id", ""))
            q_dir = os.path.join(COURSES_DIR, c_code, "questions")
            c_dir = os.path.join(COURSES_DIR, c_code, "concepts")
            q_count = len([f for f in os.listdir(q_dir) if f.endswith(".md")]) if os.path.exists(q_dir) else 0
            c_count = len([f for f in os.listdir(c_dir) if f.endswith(".md")]) if os.path.exists(c_dir) else 0
            print(f"  • {c['code']} - {c['name']} (Preset: {c.get('preset', 'N/A')}) -> {q_count} questions, {c_count} concepts")
        print()
    elif args.command == "create":
        create_course(args.code, args.name, args.term, args.institution, args.preset)
    elif args.command == "import-text":
        with open(args.file, "r", encoding="utf-8", errors="ignore") as f:
            text = f.read()
        parse_text_or_pdf(text, args.course.lower().replace(" ", ""), args.topic)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
