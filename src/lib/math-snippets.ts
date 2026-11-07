export interface MathSnippet {
  label: string;
  template: string;
  category: "Calculus" | "Integrals" | "Residues" | "Fractions" | "Symbols" | "Linear Algebra" | string;
}

export const MATH_SNIPPETS: MathSnippet[] = [
  // Integrals & Residues
  { label: "∮_C", template: "\\oint_C f(z) \\, dz", category: "Integrals" },
  { label: "∫_{-∞}^∞", template: "\\int_{-\\infty}^\\infty f(x) \\, dx", category: "Integrals" },
  { label: "∫_0^{2π}", template: "\\int_0^{2\\pi} R(\\cos\\theta, \\sin\\theta) \\, d\\theta", category: "Integrals" },
  { label: "Res(f, z₀)", template: "\\operatorname{Res}(f, z_0)", category: "Residues" },
  { label: "Res formula (simple)", template: "\\lim_{z \\to z_0} (z - z_0) f(z)", category: "Residues" },
  { label: "Res formula (pole m)", template: "\\frac{1}{(m-1)!} \\lim_{z \\to z_0} \\frac{d^{m-1}}{dz^{m-1}} \\left[(z - z_0)^m f(z)\\right]", category: "Residues" },
  { label: "2πi ∑ Res", template: "2\\pi i \\sum_{k=1}^n \\operatorname{Res}(f, z_k)", category: "Residues" },

  // Cauchy-Riemann & Holomorphicity
  { label: "∂u/∂x = ∂v/∂y", template: "\\frac{\\partial u}{\\partial x} = \\frac{\\partial v}{\\partial y}, \\quad \\frac{\\partial u}{\\partial y} = -\\frac{\\partial v}{\\partial x}", category: "Calculus" },
  { label: "f'(z) formula", template: "f'(z) = u_x + i v_x = u_x - i u_y", category: "Calculus" },
  { label: "CIF: f(z₀)", template: "f(z_0) = \\frac{1}{2\\pi i} \\oint_C \\frac{f(z)}{z - z_0} \\, dz", category: "Calculus" },
  { label: "CIF: fⁿ(z₀)", template: "f^{(n)}(z_0) = \\frac{n!}{2\\pi i} \\oint_C \\frac{f(z)}{(z - z_0)^{n+1}} \\, dz", category: "Calculus" },

  // Fractions & Notation
  { label: "a/b", template: "\\frac{a}{b}", category: "Fractions" },
  { label: "Möbius", template: "\\frac{az + b}{cz + d}", category: "Fractions" },
  { label: "√z", template: "\\sqrt{z}", category: "Symbols" },
  { label: "∑_{n=0}^∞", template: "\\sum_{n=0}^\\infty a_n (z - z_0)^n", category: "Calculus" },
  { label: "∑_{-∞}^∞", template: "\\sum_{n=-\\infty}^\\infty a_n (z - z_0)^n", category: "Calculus" },
  { label: "lim_{z→z₀}", template: "\\lim_{z \\to z_0}", category: "Calculus" },

  // Complex symbols
  { label: "z = x+iy", template: "z = x + iy", category: "Symbols" },
  { label: "z = re^{iθ}", template: "z = r e^{i\\theta}", category: "Symbols" },
  { label: "Re(z)", template: "\\operatorname{Re}(z)", category: "Symbols" },
  { label: "Im(z)", template: "\\operatorname{Im}(z)", category: "Symbols" },
  { label: "Arg(z)", template: "\\operatorname{Arg}(z)", category: "Symbols" },
  { label: "Log(z)", template: "\\operatorname{Log}(z)", category: "Symbols" },
  { label: "z̄ (conj)", template: "\\bar{z}", category: "Symbols" }
];
