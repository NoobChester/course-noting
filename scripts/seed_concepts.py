import os
import json

QUESTIONS_DIR = os.path.join("content", "questions")
CONCEPTS_DIR = os.path.join("content", "concepts")
UPLOADS_DIR = os.path.join("public", "uploads")
SNIPS_DIR = os.path.join("public", "uploads", "snips")
SHEETS_DIR = os.path.join("public", "problem-sheets")

os.makedirs(QUESTIONS_DIR, exist_ok=True)
os.makedirs(CONCEPTS_DIR, exist_ok=True)
os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(SNIPS_DIR, exist_ok=True)
os.makedirs(SHEETS_DIR, exist_ok=True)

# 1. CORE CONCEPTS
concepts = [
    {
        "slug": "complex-algebra-geometry",
        "title": "Complex Numbers, Polar Form & Geometry",
        "week": 1,
        "category": "Revision & Foundations",
        "summary": "Modulus, argument, polar form $z = r e^{i\\theta}$, triangle inequality, roots of unity.",
        "prerequisites": [],
        "content": """### Core Concepts & Formulas

1. **Modulus and Conjugate:**
   - $|z|^2 = z \\bar{z} = x^2 + y^2$.
   - $\\operatorname{Re}(z) = \\frac{z + \\bar{z}}{2}$, $\\operatorname{Im}(z) = \\frac{z - \\bar{z}}{2i}$.
   - $|z_1 z_2| = |z_1| |z_2|$ and $\\operatorname{Arg}(z_1 z_2) = \\operatorname{Arg}(z_1) + \\operatorname{Arg}(z_2) \\pmod{2\\pi}$.

2. **Triangle Inequalities:**
   - $|z_1 + z_2| \\le |z_1| + |z_2|$.
   - Reverse triangle inequality: $||z_1| - |z_2|| \\le |z_1 - z_2| \\le |z_1| + |z_2|$.
   - Useful for bounds: If $|z| = R > 1$, then $|z^n \\pm 1| \\ge R^n - 1$, so $\\frac{1}{|z^n \\pm 1|} \\le \\frac{1}{R^n - 1}$.

3. **Roots of Unity:**
   - The solutions to $z^n = 1$ are $\\omega_k = e^{i 2\\pi k / n}$ for $k = 0, 1, \\dots, n-1$.
   - For any root $\\omega \\ne 1$, $\\sum_{k=0}^{n-1} \\omega^k = \\frac{1 - \\omega^n}{1 - \\omega} = 0$.
"""
    },
    {
        "slug": "complex-topology-sets",
        "title": "Sets in the Complex Plane & Topology",
        "week": 1,
        "category": "Topology & Sets",
        "summary": "Open, closed, bounded, compact, path-connected, domains, and regions in $\\mathbb{C}$.",
        "prerequisites": ["complex-algebra-geometry"],
        "content": """### Definitions & Properties

1. **Open & Closed Sets:**
   - An open disk (ball) of radius $r$ centered at $z_0$: $B(z_0, r) = \\{z \\in \\mathbb{C} : |z - z_0| < r\\}$.
   - $S \\subset \\mathbb{C}$ is **open** if for every $z \\in S$, there exists $\\epsilon > 0$ such that $B(z, \\epsilon) \\subset S$.
   - $S$ is **closed** if its complement $\\mathbb{C} \\setminus S$ is open (or equivalently, it contains all its limit points).

2. **Bounded and Compact:**
   - $S$ is **bounded** if there exists $M > 0$ such that $|z| \\le M$ for all $z \\in S$.
   - By the Heine-Borel theorem, $S \\subset \\mathbb{C}$ is **compact** if and only if it is closed and bounded.

3. **Connectedness, Domains, and Regions:**
   - An open set $\\Omega \\subset \\mathbb{C}$ is **polygonally connected** (or path-connected) if any two points in $\\Omega$ can be joined by a polygonal path lying entirely in $\\Omega$.
   - A **domain** is an open, connected non-empty subset of $\\mathbb{C}$.
   - A **region** is a domain together with some, all, or none of its boundary points.
   - A domain $\\Omega$ is **simply connected** if every simple closed loop in $\\Omega$ can be continuously contracted to a point within $\\Omega$ (informally, it has 'no holes').
"""
    },
    {
        "slug": "mobius-transformations",
        "title": "Fractional Linear (Möbius) Transformations",
        "week": 2,
        "category": "Transformations & Geometry",
        "summary": "Mappings $w = \\frac{az+b}{cz+d}$ with $ad-bc \\ne 0$, circle-preserving property, cross-ratio.",
        "prerequisites": ["complex-algebra-geometry"],
        "content": """### Möbius Transformations

A mapping of the form:
$$T(z) = \\frac{az + b}{cz + d}, \\quad a,b,c,d \\in \\mathbb{C}, \\quad ad - bc \\ne 0$$

1. **Key Properties:**
   - Conformal everywhere on $\\mathbb{C} \\setminus \\{-d/c\\}$.
   - Compositions and inverses of Möbius transformations are also Möbius transformations (they form the group $\\operatorname{PSL}(2, \\mathbb{C})$).
   - **Circles and Lines:** Maps generalized circles (circles and straight lines) to generalized circles.

2. **Standard Mappings:**
   - Upper half-plane $\\mathbb{H} = \\{z : \\operatorname{Im}(z) > 0\\}$ to the open unit disk $\\mathbb{D} = \\{w : |w| < 1\\}$:
     $$w = e^{i\\phi} \\frac{z - z_0}{z - \\bar{z}_0}, \\quad \\operatorname{Im}(z_0) > 0$$
   - Cayley transform: $w = \\frac{z - i}{z + i}$ maps $\\mathbb{H} \\to \\mathbb{D}$, sending $i \\mapsto 0$ and the real axis to the unit circle.

3. **Three-Point Cross Ratio:**
   $$(z, z_1, z_2, z_3) = \\frac{(z - z_1)(z_2 - z_3)}{(z - z_3)(z_2 - z_1)}$$
   The unique Möbius transformation sending $z_1 \\mapsto w_1, z_2 \\mapsto w_2, z_3 \\mapsto w_3$ is determined by equating cross-ratios:
   $$(w, w_1, w_2, w_3) = (z, z_1, z_2, z_3)$$
"""
    },
    {
        "slug": "cauchy-riemann-equations",
        "title": "Cauchy-Riemann Equations & Holomorphic Functions",
        "week": 3,
        "category": "Differentiation & Holomorphicity",
        "summary": "Complex differentiability, CR equations in Cartesian and Polar coordinates, holomorphicity.",
        "prerequisites": ["complex-algebra-geometry"],
        "content": """### Complex Differentiability & Holomorphicity

A function $f: \\Omega \\to \\mathbb{C}$ is **complex differentiable** at $z_0 \\in \\Omega$ if:
$$f'(z_0) = \\lim_{h \\to 0} \\frac{f(z_0 + h) - f(z_0)}{h} \\quad \\text{exists}.$$
$f$ is **holomorphic** (or analytic) on an open set $\\Omega$ if it is complex differentiable at every point in $\\Omega$.

1. **Cauchy-Riemann Equations (Cartesian):**
   Writing $f(x + iy) = u(x,y) + i v(x,y)$:
   $$\\frac{\\partial u}{\\partial x} = \\frac{\\partial v}{\\partial y}, \\qquad \\frac{\\partial u}{\\partial y} = -\\frac{\\partial v}{\\partial x}$$
   The complex derivative is given by:
   $$f'(z) = u_x + i v_x = v_y - i u_y = u_x - i u_y.$$

2. **Cauchy-Riemann Equations (Polar form):**
   Writing $f(r e^{i\\theta}) = u(r, \\theta) + i v(r, \\theta)$:
   $$\\frac{\\partial u}{\\partial r} = \\frac{1}{r} \\frac{\\partial v}{\\partial \\theta}, \\qquad \\frac{\\partial v}{\\partial r} = -\\frac{1}{r} \\frac{\\partial u}{\\partial \\theta}$$
   $$f'(z) = e^{-i\\theta} (u_r + i v_r).$$

3. **Theorem (Sufficient Conditions):**
   If $u(x,y)$ and $v(x,y)$ have continuous first partial derivatives in a neighborhood of $z_0$ and satisfy the CR equations at $z_0$, then $f$ is complex differentiable at $z_0$.

4. **Consequences:**
   - If $f$ is holomorphic on a domain $\\Omega$ and $f'(z) = 0$ everywhere, then $f$ is constant.
   - If $f$ is holomorphic and real-valued, $f$ is constant.
   - If $f$ and $\\bar{f}$ are both holomorphic, $f$ is constant.
"""
    },
    {
        "slug": "harmonic-functions",
        "title": "Harmonic Functions & Conjugates",
        "week": 4,
        "category": "Harmonic Analysis",
        "summary": "Laplace equation $\\Delta u = 0$, harmonic conjugates $v$, Milne-Thomson method.",
        "prerequisites": ["cauchy-riemann-equations"],
        "content": """### Harmonic Functions

A real-valued function $u(x,y)$ with continuous second partial derivatives is **harmonic** on an open set $\\Omega$ if it satisfies Laplace's equation:
$$\\Delta u = \\frac{\\partial^2 u}{\\partial x^2} + \\frac{\\partial^2 u}{\\partial y^2} = 0$$

1. **Harmonic Conjugate:**
   If $f = u + iv$ is holomorphic on $\\Omega$, then both $u$ and $v$ are harmonic, and $v$ is called a **harmonic conjugate** of $u$.
   - Note: $v$ is a harmonic conjugate of $u$ $\\iff$ $-u$ is a harmonic conjugate of $v$.
   - On a simply connected domain, every harmonic function has a harmonic conjugate (unique up to an additive real constant).

2. **Milne-Thomson Method / Derivative Identity:**
   Since $f'(z) = u_x(x,y) - i u_y(x,y)$, for $z = x$ (setting $y=0$):
   $$f'(x) = u_x(x, 0) - i u_y(x, 0)$$
   By analytic continuation, replacing $x$ by $z$:
   $$f'(z) = u_x(z, 0) - i u_y(z, 0)$$
   Integrating $f'(z)$ yields $f(z)$ directly without needing to compute $v(x,y)$ term by term!
"""
    },
    {
        "slug": "contour-integration",
        "title": "Contour Integrals & Cauchy-Goursat Theorem",
        "week": 5,
        "category": "Integration",
        "summary": "Parameterization $\\int_\\gamma f(z) dz$, primitives, path independence, Cauchy-Goursat theorem.",
        "prerequisites": ["cauchy-riemann-equations"],
        "content": """### Contour Integration

1. **Definition by Parameterization:**
   Let $\\gamma: [a, b] \\to \\mathbb{C}$ be a smooth curve. For continuous $f$:
   $$\\int_\\gamma f(z) \\, dz = \\int_a^b f(\\gamma(t)) \\, \\gamma'(t) \\, dt$$

2. **ML Inequality (Estimation Lemma):**
   If $|f(z)| \\le M$ for all $z \\in \\gamma$, and the arc length of $\\gamma$ is $L$:
   $$\\left| \\int_\\gamma f(z) \\, dz \\right| \\le M \\cdot L$$

3. **Fundamental Theorem of Contour Integration:**
   If $f$ has a primitive $F$ ($F' = f$) in a domain containing $\\gamma$:
   $$\\int_\\gamma f(z) \\, dz = F(\\gamma(b)) - F(\\gamma(a))$$
   In particular, $\\oint_\\gamma f(z) \\, dz = 0$ for any closed curve if $f$ has a primitive.

4. **Cauchy-Goursat Theorem:**
   If $f$ is holomorphic on a simply connected domain $\\Omega$, then for any closed contour $\\gamma \\subset \\Omega$:
   $$\\oint_\\gamma f(z) \\, dz = 0$$
"""
    },
    {
        "slug": "cauchy-integral-formula",
        "title": "Cauchy's Integral Formula & Applications",
        "week": 6,
        "category": "Integration & Holomorphicity",
        "summary": "Formulas for $f(z_0)$ and $f^{(n)}(z_0)$, Cauchy's inequalities, Liouville's theorem.",
        "prerequisites": ["contour-integration"],
        "content": """### Cauchy's Integral Formula

Let $\\Omega$ be a simply connected domain, $\\gamma$ a positively oriented simple closed contour in $\\Omega$, and $f$ holomorphic on $\\Omega$. For any point $z_0$ inside $\\gamma$:

$$f(z_0) = \\frac{1}{2\\pi i} \\oint_\\gamma \\frac{f(z)}{z - z_0} \\, dz$$

### Generalized Formula (Higher Derivatives)
A holomorphic function is infinitely differentiable, with:
$$f^{(n)}(z_0) = \\frac{n!}{2\\pi i} \\oint_\\gamma \\frac{f(z)}{(z - z_0)^{n+1}} \\, dz$$

### Core Theorems:
1. **Cauchy's Estimate:**
   If $f$ is holomorphic on $B(z_0, R)$ and $|f(z)| \\le M$ on $|z - z_0| = R$:
   $$|f^{(n)}(z_0)| \\le \\frac{n! M}{R^n}$$

2. **Liouville's Theorem:**
   Every bounded entire function is constant.
   *(Proof: Let $R \\to \\infty$ in Cauchy's estimate for $f'(z_0)$).*

3. **Generalized Liouville (Polynomial Growth):**
   If $f$ is entire and $|f(z)| \\le A + B|z|^k$ for all $z$, then $f$ is a polynomial of degree at most $k$.

4. **Maximum Modulus Principle:**
   If $f$ is holomorphic and non-constant on a domain $\\Omega$, $|f(z)|$ cannot attain a local maximum in $\\Omega$. If $\\Omega$ is bounded, the maximum of $|f|$ occurs on the boundary $\\partial \\Omega$.
"""
    },
    {
        "slug": "taylor-and-laurent-series",
        "title": "Taylor and Laurent Series & Singularities",
        "week": 7,
        "category": "Series & Singularities",
        "summary": "Expansion in disks and annuli, classification of singularities: removable, poles, essential.",
        "prerequisites": ["cauchy-integral-formula"],
        "content": """### Taylor & Laurent Series

1. **Taylor Series:**
   If $f$ is holomorphic in the open disk $|z - z_0| < R$, then:
   $$f(z) = \\sum_{n=0}^\\infty a_n (z - z_0)^n, \\qquad a_n = \\frac{f^{(n)}(z_0)}{n!}$$
   The radius of convergence $R$ equals the distance from $z_0$ to the nearest singularity of $f$.

2. **Laurent Series:**
   If $f$ is holomorphic in an annulus $A = \\{z : r < |z - z_0| < R\\}$, then:
   $$f(z) = \\sum_{n=-\\infty}^\\infty a_n (z - z_0)^n = \\underbrace{\\sum_{n=1}^\\infty \\frac{a_{-n}}{(z - z_0)^n}}_{\\text{Principal Part}} + \\underbrace{\\sum_{n=0}^\\infty a_n (z - z_0)^n}_{\\text{Analytic Part}}$$
   where $a_n = \\frac{1}{2\\pi i} \\oint_\\gamma \\frac{f(w)}{(w - z_0)^{n+1}} \\, dw$.

3. **Classification of Isolated Singularities at $z_0$:**
   Look at the principal part $\\sum_{n=1}^\\infty a_{-n} (z - z_0)^{-n}$:
   - **Removable Singularity:** All $a_{-n} = 0$. $\\lim_{z \\to z_0} f(z)$ exists and is finite (Riemann's Removable Singularity Theorem).
   - **Pole of Order $m$ ($m \\ge 1$):** $a_{-m} \\ne 0$ and $a_{-n} = 0$ for all $n > m$. $\\lim_{z \\to z_0} |f(z)| = \\infty$.
   - **Essential Singularity:** Infinitely many negative powers are non-zero. The limit does not exist (Casorati-Weierstrass Theorem: $f(B^\\circ(z_0, r))$ is dense in $\\mathbb{C}$).
"""
    },
    {
        "slug": "residue-calculus",
        "title": "Cauchy's Residue Theorem & Integral Evaluation",
        "week": 8,
        "category": "Residue Calculus",
        "summary": "Residue calculation rules, Jordan's Lemma, evaluation of improper, trig, and indented integrals.",
        "prerequisites": ["taylor-and-laurent-series"],
        "content": """### Residues & The Residue Theorem

The **residue** of $f$ at an isolated singularity $z_0$ is the coefficient $a_{-1}$ in its Laurent series:
$$\\operatorname{Res}(f, z_0) = a_{-1} = \\frac{1}{2\\pi i} \\oint_\\gamma f(z) \\, dz$$

### Residue Calculation Rules
1. **Simple Pole ($m=1$):**
   $$\\operatorname{Res}(f, z_0) = \\lim_{z \\to z_0} (z - z_0) f(z)$$
   If $f(z) = \\frac{p(z)}{q(z)}$ with $p(z_0) \\ne 0, q(z_0) = 0, q'(z_0) \\ne 0$:
   $$\\operatorname{Res}(f, z_0) = \\frac{p(z_0)}{q'(z_0)}$$

2. **Pole of Order $m$ ($m \\ge 2$):**
   $$\\operatorname{Res}(f, z_0) = \\frac{1}{(m-1)!} \\lim_{z \\to z_0} \\frac{d^{m-1}}{dz^{m-1}} \\left[ (z - z_0)^m f(z) \\right]$$

3. **Cauchy's Residue Theorem:**
   $$\\oint_C f(z) \\, dz = 2\\pi i \\sum_{k=1}^N \\operatorname{Res}(f, z_k)$$

### Standard Applications to Real Integrals
1. **Rational Functions $\\int_{-\\infty}^\\infty \\frac{P(x)}{Q(x)} dx$ ($\deg Q \\ge \\deg P + 2$, no real poles):**
   $$\\int_{-\\infty}^\\infty \\frac{P(x)}{Q(x)} \\, dx = 2\\pi i \\sum_{\\operatorname{Im}(z_k) > 0} \\operatorname{Res}\\left(\\frac{P}{Q}, z_k\\right)$$

2. **Trigonometric Integrals $\\int_0^{2\\pi} R(\\cos\\theta, \\sin\\theta) d\\theta$:**
   Substitute $z = e^{i\\theta}, \\, dz = i z d\\theta, \\, \\cos\\theta = \\frac{z + z^{-1}}{2}, \\, \\sin\\theta = \\frac{z - z^{-1}}{2i}$ around $|z| = 1$.

3. **Fourier Integrals & Jordan's Lemma $\\int_{-\\infty}^\\infty f(x) e^{i a x} dx$ ($a > 0$):**
   If $|f(z)| \\to 0$ as $|z| \\to \\infty$ on the upper semicircle $C_R$, then:
   $$\\lim_{R \\to \\infty} \\int_{C_R} f(z) e^{i a z} \\, dz = 0.$$
"""
    },
    {
        "slug": "rouches-theorem-argument-principle",
        "title": "Argument Principle & Rouché's Theorem",
        "week": 9,
        "category": "Root Counting & Geometry",
        "summary": "Counting zeros and poles: $\\frac{1}{2\\pi i} \\oint \\frac{f'}{f} dz = Z - P$, Rouché's $|f| > |g|$ bound.",
        "prerequisites": ["residue-calculus"],
        "content": """### Argument Principle & Rouché's Theorem

1. **The Argument Principle:**
   Let $f$ be meromorphic inside and on a simple closed contour $C$, with no zeros or poles on $C$. Then:
   $$\\frac{1}{2\\pi i} \\oint_C \\frac{f'(z)}{f(z)} \\, dz = Z - P$$
   where $Z$ is the number of zeros and $P$ is the number of poles of $f$ inside $C$ (counted with multiplicity).
   Geometrically, $\\frac{1}{2\\pi} \\Delta_C \\arg f(z) = Z - P$.

2. **Rouché's Theorem:**
   Let $f$ and $g$ be holomorphic inside and on a simple closed contour $C$. If the strict inequality:
   $$|g(z)| < |f(z)| \\quad \\text{holds for all } z \\in C,$$
   then $f(z)$ and $f(z) + g(z)$ have the exact same number of zeros inside $C$ (counted with multiplicity).

3. **Strategy for Root Counting:**
   - To find the number of roots of $P(z) = 0$ in $|z| < R$:
     Identify the dominating term on $|z| = R$ as $f(z)$, and let $g(z) = P(z) - f(z)$.
     Verify that $|g(z)| < |f(z)|$ on $|z| = R$. Then $P(z)$ has the same number of roots in $|z| < R$ as $f(z)$.
"""
    },
    {
        "slug": "fourier-and-laplace-transforms",
        "title": "Fourier and Laplace Transforms in Complex Analysis",
        "week": 10,
        "category": "Transforms & Applications",
        "summary": "Complex inversion integral (Bromwich contour), transform properties, solving ODEs.",
        "prerequisites": ["residue-calculus"],
        "content": """### Fourier and Laplace Transforms

1. **Fourier Transform:**
   $$\\hat{f}(\\xi) = \\int_{-\\infty}^\\infty f(x) e^{-i x \\xi} \\, dx$$
   Inversion formula:
   $$f(x) = \\frac{1}{2\\pi} \\int_{-\\infty}^\\infty \\hat{f}(\\xi) e^{i x \\xi} \\, d\\xi$$

2. **Laplace Transform:**
   $$\\mathcal{L}\\{f\\}(z) = F(z) = \\int_0^\\infty f(t) e^{-z t} \\, dt, \\quad \\operatorname{Re}(z) > \\sigma_0$$
   - $\\mathcal{L}\\{e^{-a t}\\} = \\frac{1}{z + a}$
   - $\\mathcal{L}\\{\\cos(\\omega t)\\} = \\frac{z}{z^2 + \\omega^2}$
   - $\\mathcal{L}\\{\\sin(\\omega t)\\} = \\frac{\\omega}{z^2 + \\omega^2}$
   - $\\mathcal{L}\\{u'\\} = z U(z) - u(0)$, $\\mathcal{L}\\{u''\\} = z^2 U(z) - z u(0) - u'(0)$.

3. **Bromwich Inversion Formula:**
   $$f(t) = \\frac{1}{2\\pi i} \\int_{\\gamma - i\\infty}^{\\gamma + i\\infty} F(z) e^{z t} \\, dz = \\sum_{\\text{poles}} \\operatorname{Res}\\left(F(z) e^{z t}, z_k\\right)$$
"""
    }
]

for c in concepts:
    filepath = os.path.join(CONCEPTS_DIR, f"{c['slug']}.md")
    frontmatter = f"""---
slug: {json.dumps(c['slug'])}
title: {json.dumps(c['title'])}
week: {c['week']}
category: {json.dumps(c['category'])}
summary: {json.dumps(c['summary'])}
prerequisites: {json.dumps(c['prerequisites'])}
---

{c['content']}
"""
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(frontmatter)

print(f"Generated {len(concepts)} concepts successfully.")
