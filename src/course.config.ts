import { MathSnippet } from "./lib/math-snippets";

export interface CourseConfig {
  code: string; // e.g. "SAMPLE1001" or "MATH2621"
  name: string; // e.g. "Higher Complex Analysis"
  institution: string; // e.g. "The University of New South Wales"
  term: string; // e.g. "T3, 2026"
  logoSymbol: string; // e.g. "∫dz", "∇f", "P(A|B)"
  description: string;
  customSnippets: MathSnippet[];
}

export const COURSE_CONFIG: CourseConfig = {
  code: "SAMPLE1001",
  name: "Linear Algebra & Multivariable Calculus (Demo)",
  institution: "Open-Source Showcase",
  term: "Interactive Study Hub",
  logoSymbol: "λ",
  description: "An open-source study engine demo featuring step-by-step problem validation, KaTeX theory summaries, lecture insights, and spaced repetition review.",
  customSnippets: [
    // Linear Algebra & Calculus
    { label: "Av = λv", template: "A \\mathbf{v} = \\lambda \\mathbf{v}", category: "Linear Algebra" },
    { label: "det(A - λI)", template: "\\det(A - \\lambda I) = 0", category: "Linear Algebra" },
    { label: "Green's Thm", template: "\\oint_C (L\\,dx + M\\,dy) = \\iint_D \\left(\\frac{\\partial M}{\\partial x} - \\frac{\\partial L}{\\partial y}\\right) dA", category: "Calculus" },
    { label: "Stokes' Thm", template: "\\oint_{\\partial S} \\mathbf{F} \\cdot d\\mathbf{r} = \\iint_S (\\nabla \\times \\mathbf{F}) \\cdot d\\mathbf{S}", category: "Calculus" },
    { label: "Divergence Thm", template: "\\iint_{\\partial V} \\mathbf{F} \\cdot d\\mathbf{S} = \\iiint_V (\\nabla \\cdot \\mathbf{F}) \\, dV", category: "Calculus" },
    { label: "∂u/∂x", template: "\\frac{\\partial u}{\\partial x}", category: "Calculus" },
    { label: "∇f", template: "\\nabla f", category: "Calculus" },
    { label: "∮_C", template: "\\oint_C \\mathbf{F} \\cdot d\\mathbf{r}", category: "Integrals" },
    { label: "∬_D", template: "\\iint_D f(x, y) \\, dA", category: "Integrals" },
    { label: "a/b", template: "\\frac{a}{b}", category: "Fractions" },
    { label: "∑_{n=1}^∞", template: "\\sum_{n=1}^\\infty a_n", category: "Calculus" },
    { label: "lim_{x→x₀}", template: "\\lim_{x \\to x_0}", category: "Calculus" },

    // Complex symbols
    { label: "z = x+iy", template: "z = x + iy", category: "Symbols" },
    { label: "z = re^{iθ}", template: "z = r e^{i\\theta}", category: "Symbols" },
    { label: "Re(z)", template: "\\operatorname{Re}(z)", category: "Symbols" },
    { label: "Im(z)", template: "\\operatorname{Im}(z)", category: "Symbols" },
    { label: "Arg(z)", template: "\\operatorname{Arg}(z)", category: "Symbols" },
    { label: "Log(z)", template: "\\operatorname{Log}(z)", category: "Symbols" },
    { label: "z̄ (conj)", template: "\\bar{z}", category: "Symbols" }
  ]
};
