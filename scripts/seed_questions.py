import os
import json

QUESTIONS_DIR = os.path.join("content", "questions")
os.makedirs(QUESTIONS_DIR, exist_ok=True)

# Complete list of 131 problems from UNSW MATH2621 (Higher Complex Analysis)
questions = [
    # 1. Revision exercises
    {
        "id": "q-001",
        "number": 1,
        "title": "Modulus of Exponential Function",
        "week": 1,
        "topic": "Revision exercises",
        "difficulty": 1,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["complex-algebra-geometry"],
        "prompt": "Show that $|e^z| = e^{\\operatorname{Re}(z)}$ for all $z \\in \\mathbb{C}$.",
        "answer": "Let $z = x + iy$. Then $e^z = e^{x+iy} = e^x e^{iy}$. Since $|e^{iy}| = |\\cos y + i \\sin y| = 1$, we have $|e^z| = |e^x| |e^{iy}| = e^x = e^{\\operatorname{Re}(z)}$."
    },
    {
        "id": "q-002",
        "number": 2,
        "title": "Trig Identity and Inequality for |e^{iθ} - 1|",
        "week": 1,
        "topic": "Revision exercises",
        "difficulty": 2,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["complex-algebra-geometry"],
        "prompt": """Show that $|e^{i\\theta} - 1| = 2 |\\sin(\\theta/2)|$ for all $\\theta \\in \\mathbb{R}$:
(a) using geometry;
(b) using the algebraic formula $e^{i\\theta} - 1 = e^{i\\theta/2}(e^{i\\theta/2} - e^{-i\\theta/2})$.
Deduce that $|e^{i\\theta} - 1| \\le |\\theta|$ for all $\\theta \\in \\mathbb{R}$.""",
        "answer": "For (b): $e^{i\\theta/2} - e^{-i\\theta/2} = 2i \\sin(\\theta/2)$, so $|e^{i\\theta} - 1| = |e^{i\\theta/2}| |2i \\sin(\\theta/2)| = 2 |\\sin(\\theta/2)|$. Since $|\\sin x| \\le |x|$, $2|\\sin(\\theta/2)| \\le 2|\\theta/2| = |\\theta|$."
    },
    {
        "id": "q-003",
        "number": 3,
        "title": "Geometric Triangle Inequality",
        "week": 1,
        "topic": "Revision exercises",
        "difficulty": 1,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["complex-algebra-geometry"],
        "prompt": "Give a geometric explanation for the inequality $|w| \\le |w + z| + |z|$.",
        "answer": "Consider the triangle in the complex plane with vertices at $0$, $-z$, and $w$. The side lengths are $|-z - 0| = |z|$, $|w - (-z)| = |w + z|$, and $|w - 0| = |w|$. By the triangle inequality (the length of one side is at most the sum of the other two), $|w| \\le |w+z| + |z|$."
    },
    {
        "id": "q-004",
        "number": 4,
        "title": "Half-Angle Quotient with Polar Form",
        "week": 1,
        "topic": "Revision exercises",
        "difficulty": 2,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["complex-algebra-geometry"],
        "prompt": "Suppose that $\\alpha = \\cos t + i\\sin t$ where $0 < t < 2\\pi$. Show that $\\frac{1 + \\alpha}{1 - \\alpha} = i \\cot \\frac{t}{2}$.",
        "answer": "Since $\\alpha = e^{it}$, we have $\\frac{1 + e^{it}}{1 - e^{it}} = \\frac{e^{it/2}(e^{-it/2} + e^{it/2})}{e^{it/2}(e^{-it/2} - e^{it/2})} = \\frac{2 \\cos(t/2)}{-2i \\sin(t/2)} = i \\cot(t/2)$."
    },
    {
        "id": "q-005",
        "number": 5,
        "title": "Real Condition for α + 1/α",
        "week": 1,
        "topic": "Revision exercises",
        "difficulty": 2,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["complex-algebra-geometry"],
        "prompt": "Suppose that $\\alpha \\ne 0$. Show that $\\alpha + 1/\\alpha$ is real if and only if $\\alpha$ is real or $|\\alpha| = 1$.",
        "answer": "$\\alpha + 1/\\alpha \\in \\mathbb{R} \\iff \\alpha + 1/\\alpha = \\bar{\\alpha} + 1/\\bar{\\alpha} \\iff (\\alpha - \\bar{\\alpha}) - \\frac{\\alpha - \\bar{\\alpha}}{|\\alpha|^2} = 0 \\iff (\\alpha - \\bar{\\alpha})(1 - 1/|\\alpha|^2) = 0$. Hence either $\\alpha = \\bar{\\alpha}$ (real) or $|\\alpha| = 1$."
    },
    {
        "id": "q-006",
        "number": 6,
        "title": "Arctan Addition from Complex Multiplication",
        "week": 1,
        "topic": "Revision exercises",
        "difficulty": 1,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["complex-algebra-geometry"],
        "prompt": "Expand $(4 + i)(5 + 3i)$ and hence show that $\\frac{\\pi}{4} = \\arctan \\frac{1}{4} + \\arctan \\frac{3}{5}$.",
        "answer": "$(4+i)(5+3i) = 20 + 12i + 5i - 3 = 17 + 17i = 17(1+i)$. Taking the argument of both sides gives $\\arg(4+i) + \\arg(5+3i) = \\arg(17(1+i)) = \\frac{\\pi}{4}$."
    },
    {
        "id": "q-007",
        "number": 7,
        "title": "Exact Trig Values for 7π/12",
        "week": 1,
        "topic": "Revision exercises",
        "difficulty": 2,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["complex-algebra-geometry"],
        "prompt": "By expanding $(1 + \\sqrt{3}i)(1 + i)$, find $\\cos(7\\pi/12)$ and $\\sin(7\\pi/12)$ in surd form.",
        "answer": "(1 - \\sqrt{3})/(2\\sqrt{2}) and (1 + \\sqrt{3})/(2\\sqrt{2})"
    },
    {
        "id": "q-008",
        "number": 8,
        "title": "Parallelogram Law",
        "week": 1,
        "topic": "Revision exercises",
        "difficulty": 2,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["complex-algebra-geometry"],
        "prompt": """(a) Show that $|z_1 + z_2|^2 + |z_1 - z_2|^2 = 2|z_1|^2 + 2|z_2|^2$ for all $z_1, z_2 \\in \\mathbb{C}$.
(b) Give a geometrical interpretation of this result.""",
        "answer": "(a) Use $|w|^2 = w \\bar{w}$. Expanding both terms causes cross-terms to cancel. (b) In any parallelogram, the sum of the squares of the lengths of the two diagonals equals the sum of the squares of the lengths of the four sides."
    },
    {
        "id": "q-009",
        "number": 9,
        "title": "Equilateral Triangle Condition",
        "week": 1,
        "topic": "Revision exercises",
        "difficulty": 4,
        "isDifficult": True,
        "isNonExaminable": False,
        "concepts": ["complex-algebra-geometry"],
        "prompt": "Show that the triangle in the complex plane whose vertices are $z_1, z_2, z_3$ is equilateral if and only if $z_1^2 + z_2^2 + z_3^2 = z_1 z_2 + z_2 z_3 + z_3 z_1$.",
        "answer": "The triangle is equilateral iff rotating side $z_2 - z_1$ by $\\pi/3$ gives $z_3 - z_1$, i.e. $\\frac{z_3 - z_1}{z_2 - z_1} = e^{\\pm i\\pi/3}$. Since $e^{i\\pi/3}$ is a root of $\\omega^2 - \\omega + 1 = 0$, substituting $\\omega = \\frac{z_3 - z_1}{z_2 - z_1}$ and clearing denominators yields $z_1^2 + z_2^2 + z_3^2 - z_1 z_2 - z_2 z_3 - z_3 z_1 = 0$."
    },
    {
        "id": "q-010",
        "number": 10,
        "title": "Equality in Triangle Inequality",
        "week": 1,
        "topic": "Revision exercises",
        "difficulty": 2,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["complex-algebra-geometry"],
        "prompt": "Explain both geometrically and algebraically why $|z + w| = |z| + |w|$ if $\\arg z = \\arg w$. Does the result extend to arbitrary finite sums of complex numbers?",
        "answer": "If $\\arg z = \\arg w = \\theta$, then $z = |z|e^{i\\theta}$ and $w = |w|e^{i\\theta}$, so $z+w = (|z|+|w|)e^{i\\theta}$, hence $|z+w| = |z|+|w|$. Geometrically, the vectors point in the same direction, so the third side of the degenerate triangle equals the sum of the other two. By induction, yes, this extends to arbitrary finite sums with equal arguments."
    },
    {
        "id": "q-011",
        "number": 11,
        "title": "Root Bounds for Polynomials",
        "week": 1,
        "topic": "Revision exercises",
        "difficulty": 3,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["complex-algebra-geometry"],
        "prompt": "Show that any root $z$ of $z^4 + z + 3 = 0$ satisfies $|z| > 1$ and that any root $z$ of $4z^4 + z + 1 = 0$ satisfies $|z| \\le 1$.",
        "answer": "If $z^4 + z + 3 = 0$, then $3 = |-z^4 - z| \\le |z|^4 + |z|$. If $|z| \\le 1$, then $|z|^4 + |z| \\le 2 < 3$, a contradiction. Thus $|z| > 1$. Similarly, for $4z^4 + z + 1 = 0$, $4|z|^4 = |z + 1| \\le |z| + 1$."
    },
    {
        "id": "q-012",
        "number": 12,
        "title": "Roots of Unity and Factorisation",
        "week": 1,
        "topic": "Revision exercises",
        "difficulty": 3,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["complex-algebra-geometry"],
        "prompt": """Suppose that $w$ is an $n$th root of unity and $w \\ne 1$. Show that $1 + w + w^2 + \\cdots + w^{n-1} = 0$;
hence or otherwise, factorise $1 + z + z^2 + z^3 + z^4 + z^5$ over $\\mathbb{C}$ and over $\\mathbb{R}$.""",
        "answer": "Over $\\mathbb{C}$: $(z - e^{i\\pi/3})(z - e^{i2\\pi/3})(z - e^{i\\pi})(z - e^{i4\\pi/3})(z - e^{i5\\pi/3})$ = $(z+1)(z - e^{i\\pi/3})(z - e^{-i\\pi/3})(z - e^{i2\\pi/3})(z - e^{-i2\\pi/3})$. Over $\\mathbb{R}$: $(z+1)(z^2 - z + 1)(z^2 + z + 1)$."
    },
    {
        "id": "q-013",
        "number": 13,
        "title": "Factorisation of z^8 - 15z^4 - 16 and z^4 + 4",
        "week": 1,
        "topic": "Revision exercises",
        "difficulty": 2,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["complex-algebra-geometry"],
        "prompt": """(a) Factorise $z^8 - 15z^4 - 16$ over $\\mathbb{C}$ and over $\\mathbb{R}$.
(b) Find the real factorisation of $z^4 + 4$.""",
        "answer": "(b) $(z^2 + 2z + 2)(z^2 - 2z + 2)$"
    },
    {
        "id": "q-014",
        "number": 14,
        "title": "Dirichlet Geometric Sum",
        "week": 1,
        "topic": "Revision exercises",
        "difficulty": 3,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["complex-algebra-geometry"],
        "prompt": """Show that for $0 < \\theta < 2\\pi$:
(a) $\\operatorname{Re}\\left(\\frac{1 - e^{i(n+1)\\theta}}{1 - e^{i\\theta}}\\right) = \\frac{1}{2} + \\frac{\\sin(n + 1/2)\\theta}{2 \\sin(\\theta/2)}$.
(b) $\\operatorname{Im}\\left(\\frac{1 - e^{i(n+1)\\theta}}{1 - e^{i\\theta}}\\right) = \\frac{1}{2}\\cot\\frac{\\theta}{2} - \\frac{\\cos(n + 1/2)\\theta}{2 \\sin(\\theta/2)}$.
(c) Find $1 + \\cos\\theta + \\cos 2\\theta + \\cdots + \\cos n\\theta$ and $\\sin\\theta + \\sin 2\\theta + \\cdots + \\sin n\\theta$.""",
        "answer": "Notice $\\sum_{k=0}^n e^{ik\\theta} = \\frac{1 - e^{i(n+1)\\theta}}{1 - e^{i\\theta}}$. Taking real and imaginary parts immediately gives the sums in (c) from (a) and (b)."
    },

    # 2. Sets
    {
        "id": "q-015",
        "number": 15,
        "title": "Classification of Sets in C",
        "week": 1,
        "topic": "Sets",
        "difficulty": 2,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["complex-topology-sets"],
        "prompt": """Are the following sets open, closed, bounded, compact, polygonally path-connected, polygonally simply connected, regions or domains?
(a) $S_1 = \\{z \\in \\mathbb{C} : |z| < 1\\}$
(b) $S_2 = \\{z \\in \\mathbb{C} : |z| \\le 1\\}$
(c) $S_3 = \\{z = x + iy \\in \\mathbb{C} : xy = 1\\}$
(d) $S_4 = \\{z = x + iy \\in \\mathbb{C} : xy > 1\\}$
(e) $S_5 = \\{z = x + iy \\in \\mathbb{C} : x \\ge 0, y > 0\\}$
(f) $S_6 = \\{z \\in \\mathbb{C} : |z + i| + |z - i| < 4\\}$
(g) $S_7 = \\{z \\in \\mathbb{C} : |z + i| + |z - i| = 4\\}$
(h) $S_8 = \\mathbb{C}$
(i) $S_9 = \\emptyset$ (the empty set).""",
        "answer": "(a) Open, bounded, path-connected, simply connected domain. Not closed, not compact.\n(b) Closed, bounded, compact, path-connected. Not open, not a domain.\n(c) Closed, unbounded, disconnected (two branches $y = 1/x$).\n(d) Open, unbounded, disconnected (first and third quadrants).\n(f) Interior of ellipse: open, bounded, simply connected domain.\n(g) Ellipse boundary: closed, bounded, compact curve."
    },
    {
        "id": "q-016",
        "number": 16,
        "title": "Single Point Topology",
        "week": 1,
        "topic": "Sets",
        "difficulty": 1,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["complex-topology-sets"],
        "prompt": "If a set $S$ consists of a single point $\\{p\\}$, then is $p$ an interior point, an exterior point, or a boundary point? Is $S$ open, closed, polygonally path-connected, compact, or a region?",
        "answer": "$p$ is a boundary point of $S$. $S$ is closed, bounded, compact, polygonally path-connected (trivially). It is not open, and not a region."
    },
    {
        "id": "q-017",
        "number": 17,
        "title": "Simply Connected Sets and Complements",
        "week": 1,
        "topic": "Sets",
        "difficulty": 4,
        "isDifficult": False,
        "isNonExaminable": True,
        "concepts": ["complex-topology-sets"],
        "prompt": "If an open set $\\Omega$ is simply polygonally connected, is its complement polygonally path-connected? If the complement of a bounded open set $\\Omega$ is polygonally path-connected, is the set simply polygonally connected?",
        "answer": "For bounded open $\\Omega$, $\\Omega$ is simply connected if and only if its complement $\\mathbb{C} \\setminus \\Omega$ is connected (has no 'holes'). For unbounded open sets, complement path-connectedness can differ depending on whether the point at infinity is included."
    },

    # 3. Functions
    {
        "id": "q-018",
        "number": 18,
        "title": "Composition of Polynomials and Rational Functions",
        "week": 2,
        "topic": "Functions",
        "difficulty": 1,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["complex-algebra-geometry"],
        "prompt": "Show that the composition of two polynomials is a polynomial, and the composition of two rational functions is a rational function.",
        "answer": "If $P, Q$ are polynomials, $P(Q(z)) = \\sum a_k (Q(z))^k$ is a finite sum of products of polynomials, hence a polynomial. If $R_1 = P_1/Q_1$ and $R_2 = P_2/Q_2$, substituting $R_2$ into $R_1$ and multiplying numerator and denominator by $Q_2(z)^{\\deg P_1}$ yields a quotient of two polynomials."
    },
    {
        "id": "q-019",
        "number": 19,
        "title": "Range of Nonconstant Rational Function",
        "week": 2,
        "topic": "Functions",
        "difficulty": 4,
        "isDifficult": True,
        "isNonExaminable": False,
        "concepts": ["complex-algebra-geometry"],
        "prompt": "Suppose that $f$ is a nonconstant rational function. What can you say about the range of $f$? Hint: Write $f$ as $p/q$ and try to solve $p(z)/q(z) = \\lambda$; this is possible if and only if $\\lambda$ is in the range of $f$.",
        "answer": "By the Fundamental Theorem of Algebra, $p(z) - \\lambda q(z) = 0$ has a complex root for every $\\lambda \\in \\mathbb{C}$, unless $p(z) - \\lambda q(z)$ reduces to a non-zero constant. Thus, the range of a nonconstant rational function is either the entire complex plane $\\mathbb{C}$, or $\\mathbb{C}$ minus at most one single value (e.g. $f(z) = 1/z$ omits $0$)."
    },
    {
        "id": "q-020",
        "number": 20,
        "title": "Rotation in Complex Plane",
        "week": 2,
        "topic": "Functions",
        "difficulty": 1,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["complex-algebra-geometry"],
        "prompt": "The point $1 + i$ is rotated anticlockwise about the origin through $\\pi/6$. Find its image.",
        "answer": "\\frac{1}{2}(\\sqrt{3} - 1 + i(\\sqrt{3} + 1))"
    },
    {
        "id": "q-021",
        "number": 21,
        "title": "Linear Transformation w = (1+i)z - 2",
        "week": 2,
        "topic": "Functions",
        "difficulty": 2,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["complex-algebra-geometry"],
        "prompt": "Find the image of (a) the line $y = 2x + 5$ and (b) the circle $|z - 1| = 1$ under the transformation $w = (1 + i)z - 2$.",
        "answer": "(a) $v = -3u - 16$, (b) $|w + 1 - i| = \\sqrt{2}$."
    },
    {
        "id": "q-022",
        "number": 22,
        "title": "Mapping of a Semi-Infinite Strip",
        "week": 2,
        "topic": "Functions",
        "difficulty": 2,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["complex-algebra-geometry"],
        "prompt": "Find the image of the region $\\{z \\in \\mathbb{C} : 0 < \\operatorname{Re}(z) < \\pi/2, \\operatorname{Im}(z) > 0\\}$ under the transformation $w = iz + 2$. Express your answer using set notation.",
        "answer": "\\{w \\in \\mathbb{C} : \\operatorname{Re} w < 2, 0 < \\operatorname{Im} w < \\pi/2\\}"
    },

    # 4. Fractional linear transformations
    {
        "id": "q-023",
        "number": 23,
        "title": "Inversion Mapping w = 1/z",
        "week": 2,
        "topic": "Fractional linear transformations",
        "difficulty": 3,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["mobius-transformations"],
        "prompt": "Find the image of the following regions under the mapping $w = z^{-1}$:\n(a) $x + y = 4$, (b) $|z - 1| = 1$, (c) $|z - 1| \\le 1, z \\ne 0$.",
        "answer": "(a) Circle passing through origin: $u^2 + v^2 - \\frac{1}{4}u + \\frac{1}{4}v = 0$.\n(b) Line $\\operatorname{Re}(w) = 1/2$.\n(c) Half-plane $\\operatorname{Re}(w) \\ge 1/2$."
    },
    {
        "id": "q-024",
        "number": 24,
        "title": "Images under Möbius Transformations",
        "week": 2,
        "topic": "Fractional linear transformations",
        "difficulty": 3,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["mobius-transformations"],
        "prompt": """Find the image of:
(a) the region $|z - 1| \\le 1$ under the mapping $w = \\frac{z}{z + 2}$,
(b) the line $x + 2y = 2$ under the mapping $w = \\frac{1}{z + i}$.""",
        "answer": "(a) Since circle passes through $0, 2, 1+i$, test three boundary points. Maps to a disk centered on the real axis.\n(b) Straight line maps to a circle passing through $w=0$."
    },
    {
        "id": "q-025",
        "number": 25,
        "title": "Image of Unit Disc under f(z) = 1/(z - i)",
        "week": 2,
        "topic": "Fractional linear transformations",
        "difficulty": 2,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["mobius-transformations"],
        "prompt": "Let $f(z) = 1/(z - i)$. Find the image of $\\{z \\in \\mathbb{C} : |z| < 1\\}$ under $f$.",
        "answer": "The set $\\{w \\in \\mathbb{C} : \\operatorname{Im} w > 1/2\\}$."
    },
    {
        "id": "q-026",
        "number": 26,
        "title": "Möbius Invariance of Upper Half Plane and Unit Disc",
        "week": 2,
        "topic": "Fractional linear transformations",
        "difficulty": 4,
        "isDifficult": True,
        "isNonExaminable": False,
        "concepts": ["mobius-transformations"],
        "prompt": """Suppose that $a, b, c, d \\in \\mathbb{C}$ and $ad - bc = 1$. Let $T$ be the fractional linear transformation $z \\mapsto \\frac{az + b}{cz + d}$.
(a) Show that if $a, b, c, d \\in \\mathbb{R}$, then $T$ maps the upper half plane onto the upper half plane. Is the converse true?
(b) Find conditions on $a, b, c, d$ that ensure that $T$ maps the unit disc $\\{z \\in \\mathbb{C} : |z| < 1\\}$ onto itself.
(c) Show that if $a = i, b = 1, c = 1$ and $d = i$, then the corresponding fractional linear transformation maps the upper half plane onto the unit disc. Where does the first quadrant map to?
(d) Use your answer to (c) to connect your answers to (a) and (b).""",
        "answer": "For (a): $\\operatorname{Im}(T(z)) = \\frac{(ad-bc)\\operatorname{Im}(z)}{|cz+d|^2} = \\frac{\\operatorname{Im}(z)}{|cz+d|^2} > 0$. The converse is true up to an overall phase factor $\\pm 1$.\nFor (b): Automorphisms of $\\mathbb{D}$ are $e^{i\\theta} \\frac{z - z_0}{1 - \\bar{z}_0 z}$ for $|z_0| < 1$."
    },

    # 5. Estimating the size of functions
    {
        "id": "q-027",
        "number": 27,
        "title": "Rational Bounds on z/(z^3 + 1)",
        "week": 2,
        "topic": "Estimating the size of functions",
        "difficulty": 2,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["complex-algebra-geometry"],
        "prompt": """Show that if $|z| = R > 1$, then
$$\\left| \\frac{z}{z^3 + 1} \\right| \\le \\frac{R}{R^3 - 1}.$$
Show also that if $|z| = r < 1$, then
$$\\left| \\frac{z}{z^3 + 1} \\right| \\le \\frac{r}{1 - r^3}.$$""",
        "answer": "Apply the reverse triangle inequality $|z^3 + 1| \\ge ||z|^3 - 1| = |R^3 - 1|$. When $R > 1$, $|z^3 + 1| \\ge R^3 - 1$. When $r < 1$, $|z^3 + 1| \\ge 1 - r^3$."
    },
    {
        "id": "q-028",
        "number": 28,
        "title": "Rational Bounds on 1/(z^4 + 1)",
        "week": 2,
        "topic": "Estimating the size of functions",
        "difficulty": 2,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["complex-algebra-geometry"],
        "prompt": """Show that if $|z| = R > 1$, then
$$\\left| \\frac{1}{z^4 + 1} \\right| \\le \\frac{1}{R^4 - 1}.$$
Show also that if $|z| = r < 1$, then
$$\\left| \\frac{1}{z^4 + 1} \\right| \\le \\frac{1}{1 - r^4}.$$""",
        "answer": "Again using $|z^4 + 1| \\ge ||z|^4 - 1|$, $|1/(z^4+1)| \\le 1/(R^4-1)$ for $R > 1$, and $1/(1-r^4)$ for $r < 1$."
    },
    {
        "id": "q-029",
        "number": 29,
        "title": "Bound on e^{iz}/(z^2 + 1)",
        "week": 2,
        "topic": "Estimating the size of functions",
        "difficulty": 3,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["complex-algebra-geometry"],
        "prompt": """Show that if $z$ is real, then
$$\\left| \\frac{e^{iz}}{z^2 + 1} \\right| \\le \\frac{1}{|z|^2 + 1}.$$
Is this still true when $z$ is not real? Give two reasons for your answer.""",
        "answer": "For real $z = x$, $|e^{ix}| = 1$ and $|x^2+1| = x^2+1$, giving equality. When $z$ is not real, $z = x+iy$: (1) $|e^{iz}| = e^{-y}$ which grows exponentially large when $y < 0$; (2) $|z^2+1|$ can equal $0$ (at $z = \\pm i$), so the expression can be unbounded."
    },
    {
        "id": "q-030",
        "number": 30,
        "title": "Jordan Lemma Style Bound",
        "week": 2,
        "topic": "Estimating the size of functions",
        "difficulty": 2,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["complex-algebra-geometry"],
        "prompt": "Show that if $|z| = R \\ne 0$ and $\\operatorname{Im}(z) \\ge 0$, then $\\left| \\frac{e^{iz}}{z} \\right| \\le \\frac{1}{R}$.",
        "answer": "Writing $z = x + iy$, $\\operatorname{Im}(z) = y \\ge 0$, so $|e^{iz}| = e^{-y} \\le e^0 = 1$. Since $|z| = R$, $|e^{iz}/z| = |e^{iz}|/|z| \\le 1/R$."
    },

    # 6. Real and imaginary parts of functions
    {
        "id": "q-031",
        "number": 31,
        "title": "Decomposition of f(z) = z^3 - z + 1",
        "week": 3,
        "topic": "Real and imaginary parts of functions",
        "difficulty": 1,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["cauchy-riemann-equations"],
        "prompt": "Suppose that $f(z) = z^3 - z + 1$. Write $f(z)$ in the form $u(x, y) + iv(x, y)$, where $z = x + iy$.",
        "answer": "u(x, y) = x^3 - 3xy^2 - x + 1 and v(x, y) = 3x^2y - y^3 - y."
    },
    {
        "id": "q-032",
        "number": 32,
        "title": "Cartesian and Polar Forms of f(z) = z e^{-z}",
        "week": 3,
        "topic": "Real and imaginary parts of functions",
        "difficulty": 2,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["cauchy-riemann-equations"],
        "prompt": "Suppose that $f(z) = z e^{-z}$. Write $f(z)$ in the form $u(x, y) + iv(x, y)$, where $z = x + iy$, and in the form $u(r, \\theta) + iv(r, \\theta)$, where $z = r e^{i\\theta}$.",
        "answer": "Cartesian: $u(x,y) = e^{-x}(x \\cos y + y \\sin y)$, $v(x,y) = e^{-x}(y \\cos y - x \\sin y)$. Polar: $u(r,\\theta) = r e^{-r\\cos\\theta}\\cos(\\theta - r\\sin\\theta)$, $v(r,\\theta) = r e^{-r\\cos\\theta}\\sin(\\theta - r\\sin\\theta)$."
    },
    {
        "id": "q-033",
        "number": 33,
        "title": "Reconstructing f from u and v",
        "week": 3,
        "topic": "Real and imaginary parts of functions",
        "difficulty": 2,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["cauchy-riemann-equations"],
        "prompt": "Suppose that $u(x, y) = x^2 + y^2$ and $v(x, y) = x - y$. Can you write $u(x, y) + iv(x, y)$ as a simple function of $z$? Or of $z$ and $\\bar{z}$?",
        "answer": "$x^2+y^2 = |z|^2 = z\\bar{z}$, and $x = (z+\\bar{z})/2$, $y = (z-\\bar{z})/(2i)$. Thus $u+iv = z\\bar{z} + i\\left(\\frac{z+\\bar{z}}{2} - \\frac{z-\\bar{z}}{2i}\\right) = z\\bar{z} + \\frac{1+i}{2}z - \\frac{1-i}{2}\\bar{z}$. Because it depends explicitly on $\\bar{z}$, it cannot be written as a function of $z$ alone (it is not holomorphic)."
    },

    # 7. Graphical representation
    {
        "id": "q-034",
        "number": 34,
        "title": "Images of Lines under Quadratic Polynomials",
        "week": 3,
        "topic": "Graphical representation of complex functions",
        "difficulty": 4,
        "isDifficult": True,
        "isNonExaminable": False,
        "concepts": ["cauchy-riemann-equations"],
        "prompt": """Suppose that $f(z) = az^2 + bz + c$, where $a, b, c \\in \\mathbb{C}$ and $a \\ne 0$.
(a) Show that the image of a straight line $\\ell$ in $\\mathbb{C}$ under $f$ either lies in a straight line or is a parabola.
(b) Show that the image of a straight line $\\ell$ in $\\mathbb{C}$ under $f$ lies in a straight line if and only if $\\ell$ passes through $-b/2a$.""",
        "answer": "Completing the square: $f(z) = a(z + b/2a)^2 + (c - b^2/4a)$. Let $w = z + b/2a$. Then $\\ell$ maps to a line in $w$. If the line in $w$ passes through $0$, its square is a ray (straight line). If it does not pass through $0$, $(x_0 + it)^2 = x_0^2 - t^2 + 2i x_0 t$, which is a parabola $u = x_0^2 - (v/2x_0)^2$."
    },
    {
        "id": "q-035",
        "number": 35,
        "title": "Image of Lines under Exponential Mapping",
        "week": 3,
        "topic": "Graphical representation of complex functions",
        "difficulty": 2,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["cauchy-riemann-equations"],
        "prompt": "Suppose that $f(z) = e^z$. Show that the image of a straight line $\\ell$ in $\\mathbb{C}$ under $f$ is a straight line if and only if $\\ell$ is horizontal.",
        "answer": "If $\\ell$ is horizontal, $z = t + iy_0$ ($y_0$ constant), so $f(z) = e^t e^{iy_0}$, which is a ray from the origin (part of a straight line). If $\\ell$ is vertical, $z = x_0 + it$, $f(z) = e^{x_0}e^{it}$ is a circle. If $\\ell$ is slanted, $f(z)$ traces a logarithmic spiral, which is not a straight line."
    },

    # 8. Limits and continuity
    {
        "id": "q-036",
        "number": 36,
        "title": "Evaluating Limits in C",
        "week": 3,
        "topic": "Limits and continuity",
        "difficulty": 3,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["cauchy-riemann-equations"],
        "prompt": """Find the following limits, if they exist, or explain why they do not exist:
(a) $\\lim_{z \\to -1} \\operatorname{Arg}(z)$
(b) $\\lim_{z \\to 1+i} \\frac{z^2 - z + 1 - i}{z^2 - 2z + 2}$
(c) $\\lim_{z \\to 0} e^{1/z}$
(d) $\\lim_{z \\to 0} e^{1/z^4}$
(e) $\\lim_{(x,y) \\to (0,0)} \\frac{xy}{x^2 + y^2}$
(f) $\\lim_{(x,y) \\to (0,0)} \\frac{xy^2}{x^2 + y^4}$""",
        "answer": "Answer: (a) does not exist (discontinuous jump from $\\pi$ to $-\\pi$ across negative real axis);\n(b) $1 - i/2$;\n(c) does not exist (approaching $0$ from left vs right yields $0$ vs $\\infty$);\n(d) does not exist (different rays yield different limits);\n(e) does not exist (depends on slope $y = mx$);\n(f) does not exist (path $x = my^2$ gives $m/(m^2+1)$)."
    },
    {
        "id": "q-037",
        "number": 37,
        "title": "Formal Epsilon-Delta Limit Properties",
        "week": 3,
        "topic": "Limits and continuity",
        "difficulty": 3,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["cauchy-riemann-equations"],
        "prompt": """Use the definition of a limit in each of the following:
(a) Show that $\\lim_{z \\to \\infty} f(z) = \\lim_{z \\to 0} f(1/z)$.
(b) Suppose that $\\lim_{z \\to z_0} g(z)$ exists and is finite. Assume that $f$ is another function defined on the same domain as $g$. Show that $\\lim_{z \\to z_0} f(z)$ exists if and only if $\\lim_{z \\to z_0} [f(z) + g(z)]$ exists.
(c) Show that $\\lim_{z \\to z_0} f(az + b) = \\lim_{w \\to az_0+b} f(w)$, for every $a \\ne 0$ and $b \\in \\mathbb{R}$.""",
        "answer": "Use standard $\\epsilon-\\delta$ definition: $|z - z_0| < \\delta \\implies |f(z) - L| < \\epsilon$."
    },
    {
        "id": "q-038",
        "number": 38,
        "title": "Continuity of |z| and Re(z)",
        "week": 3,
        "topic": "Limits and continuity",
        "difficulty": 2,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["cauchy-riemann-equations"],
        "prompt": "Prove from the definition that $|z|$ and $\\operatorname{Re}(z)$ are continuous.",
        "answer": "For $|z|$: by reverse triangle inequality, $||z| - |z_0|| \\le |z - z_0| < \\delta = \\epsilon$. For $\\operatorname{Re}(z)$: $|\\operatorname{Re}(z) - \\operatorname{Re}(z_0)| = |\\operatorname{Re}(z - z_0)| \\le |z - z_0| < \\delta = \\epsilon$."
    },
    {
        "id": "q-039",
        "number": 39,
        "title": "Domain of Continuity & Continuous Extensions",
        "week": 3,
        "topic": "Limits and continuity",
        "difficulty": 3,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["cauchy-riemann-equations"],
        "prompt": """For each of the following functions, state where the function is continuous, and justify your answer:
(a) $f_1(z) = \\frac{z^2 + i}{z^2 + 1}$;
(b) $f_2(z) = \\frac{z^k}{\\bar{z}}$ (where $k$ is a positive integer);
(c) $f_3(z) = (z - i) \\operatorname{Log}(z^2 + 1)$.
Is it possible to extend their definition to a larger domain, maintaining continuity?""",
        "answer": "Answer: (a) $z \\ne \\pm i$; (b) $z \\ne 0$; if $k \\ge 2$, then $f_2$ can be extended continuously by setting $f_2(0) = 0$; (c) $z \\ne iy$ where $y \\le -1$ or $y \\ge 1$; $f_3$ can be extended continuously across $z=i$ by setting $f_3(i) = 0$."
    },

    # 9. Differentiation
    {
        "id": "q-040",
        "number": 40,
        "title": "Nowhere Differentiable Functions Im(z) and 3x + 4iy",
        "week": 3,
        "topic": "Differentiation",
        "difficulty": 2,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["cauchy-riemann-equations"],
        "prompt": "Show from the definition, and then using the Cauchy Riemann equations, that $f_1(z) = \\operatorname{Im}(z)$ and $f_2(x + iy) = 3x + 4iy$ are nowhere differentiable.",
        "answer": "For $f_1(z) = y$, $u = y, v = 0$. $u_x = 0 \\ne v_y = 0$, but $u_y = 1 \\ne -v_x = 0$. For $f_2$, $u = 3x, v = 4y$, $u_x = 3 \\ne v_y = 4$. CR equations fail everywhere."
    },
    {
        "id": "q-041",
        "number": 41,
        "title": "Differentiability vs Holomorphicity",
        "week": 3,
        "topic": "Differentiation",
        "difficulty": 3,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["cauchy-riemann-equations"],
        "prompt": """Where are the following functions differentiable? Where are they holomorphic?
(a) $f_1(z) = z|z|^2$;
(b) $f_2(x + iy) = x^2 + iy^2$;
(c) $f_3(x + iy) = (xy^2 + 5) + i(y - x^2y - 3)$;
(d) $f_4(x + iy) = (3xy^2 + 6x^2 - 4x + 3) + i(3y^2 - 3x^2y + 2y + 15)$;
(e) $f_5(z) = e^z(z - \\bar{z})^2$;
(f) $f_6(x + iy) = |x| + i|y|$.""",
        "answer": "Answer: (a) $f_1$ is differentiable at $0$; (b) $f_2$ is differentiable on the line $x = y$; (c) $f_3$ is differentiable on $x^2+y^2=1$; (d) $f_4$ on $(x+2)^2 + (y-1)^2 = 7$; (e) $f_5$ on the $x$-axis ($y=0$); (f) $f_6$ when $xy > 0$.\n$f_1$ to $f_5$ are differentiable only on curves/points containing no open set, so they are nowhere holomorphic! $f_6$ is holomorphic on the open quadrants $xy > 0$."
    },
    {
        "id": "q-042",
        "number": 42,
        "title": "Cauchy-Riemann Satisfied but Non-Continuous at Origin",
        "week": 3,
        "topic": "Differentiation",
        "difficulty": 4,
        "isDifficult": True,
        "isNonExaminable": False,
        "concepts": ["cauchy-riemann-equations"],
        "prompt": """Suppose that
$$f(z) = \\begin{cases} e^{-z^{-4}} & \\text{when } z \\ne 0 \\\\ 0 & \\text{when } z = 0 \\end{cases}$$
Show that the Cauchy–Riemann equations hold in $\\mathbb{C}$. Is $f$ entire?
Hint: You do not need to compute the partial derivatives, except at 0.""",
        "answer": "Answer: $f$ is holomorphic in $\\mathbb{C} \\setminus \\{0\\}$, so CR equations hold there. At $0$, along the axes $z = x$ and $z = iy$, $e^{-x^{-4}} \\to 0$ exponentially fast, so all partial derivatives at $0$ are $0$, satisfying CR. However, along the ray $z = r e^{i\\pi/4}$, $z^4 = -r^4$, so $f(z) = e^{1/r^4} \\to \\infty$ as $r \\to 0$. Hence $f$ is not continuous at $0$, and thus not entire!"
    },
    {
        "id": "q-043",
        "number": 43,
        "title": "Real-Valued Entire Functions are Constant",
        "week": 3,
        "topic": "Differentiation",
        "difficulty": 1,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["cauchy-riemann-equations"],
        "prompt": "Show that real-valued entire functions are constant.",
        "answer": "If $f = u + iv$ is real-valued, $v(x,y) = 0$ everywhere. By CR equations, $u_x = v_y = 0$ and $u_y = -v_x = 0$. Since both partial derivatives of $u$ vanish everywhere on connected $\\mathbb{C}$, $u$ is constant, so $f$ is constant."
    },
    {
        "id": "q-044",
        "number": 44,
        "title": "Holomorphic f and Conjugate f are Constant",
        "week": 3,
        "topic": "Differentiation",
        "difficulty": 2,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["cauchy-riemann-equations"],
        "prompt": "Show that if $f$ and $g = \\bar{f}$ are both differentiable in a domain, then $f$ is constant on that domain.",
        "answer": "Let $f = u + iv$. Then $\\bar{f} = u - iv$. For $f$: $u_x = v_y, u_y = -v_x$. For $\\bar{f}$: $u_x = -v_y, u_y = v_x$. Equating these yields $u_x = -u_x \\implies u_x = 0$, and similarly $u_y = v_x = v_y = 0$. Hence $f$ is constant."
    },
    {
        "id": "q-045",
        "number": 45,
        "title": "Holomorphicity of g(z) = conj(f(conj(z)))",
        "week": 3,
        "topic": "Differentiation",
        "difficulty": 3,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["cauchy-riemann-equations"],
        "prompt": "Suppose that $f$ is holomorphic in $\\Omega$, and $f'$ is continuous; let $g(z) = \\overline{f(\\bar{z})}$. Is $g$ holomorphic? Where?",
        "answer": "Answer: $f$ satisfies the Cauchy–Riemann equations in $\\Omega$, and so $g$ satisfies the Cauchy–Riemann equations in the conjugate set $\\bar{\\Omega} = \\{z : \\bar{z} \\in \\Omega\\}$. The partial derivatives are continuous and $\\bar{\\Omega}$ is open, so $g$ is holomorphic in $\\bar{\\Omega}$."
    },
    {
        "id": "q-046",
        "number": 46,
        "title": "Polar Cauchy-Riemann for f(z) = |z|^a e^{ia Arg(z)}",
        "week": 3,
        "topic": "Differentiation",
        "difficulty": 3,
        "isDifficult": False,
        "isNonExaminable": True,
        "concepts": ["cauchy-riemann-equations"],
        "prompt": "(Not examinable) Suppose that $a \\in \\mathbb{R}$. Use the polar form of the Cauchy–Riemann equations to find where the function $f(z) = |z|^a e^{ia \\operatorname{Arg}(z)}$ is differentiable.",
        "answer": "Writing $z = r e^{i\\theta}$, $f(z) = r^a e^{ia\\theta} = r^a \\cos(a\\theta) + i r^a \\sin(a\\theta)$. $u_r = a r^{a-1} \\cos(a\\theta) = \\frac{1}{r} v_\\theta$, and $v_r = a r^{a-1} \\sin(a\\theta) = -\\frac{1}{r} u_\\theta$. The polar CR equations are satisfied everywhere away from the branch cut $\\theta = \\pi$ and $r = 0$."
    },

    # 10. Connections with multivariable calculus
    {
        "id": "q-047",
        "number": 47,
        "title": "Angle-Preserving Linear Transformations",
        "week": 4,
        "topic": "Connections with multivariable calculus",
        "difficulty": 3,
        "isDifficult": False,
        "isNonExaminable": True,
        "concepts": ["complex-algebra-geometry"],
        "prompt": "Suppose that a linear transformation $L$ of $\\mathbb{R}^2$ preserves angles between lines passing through the origin. Show that $L$ is the composition of a scalar multiplication and a rotation, and possibly a reflection.",
        "answer": "Since $L$ preserves angles, it preserves orthogonality. The image of the standard orthonormal basis must be orthogonal with equal lengths, so $L$ is a similarity transformation (scalar multiple of an orthogonal matrix)."
    },
    {
        "id": "q-048",
        "number": 48,
        "title": "Arcwise Connectedness and Polygonal Paths",
        "week": 4,
        "topic": "Connections with multivariable calculus",
        "difficulty": 3,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["complex-topology-sets"],
        "prompt": "A subset $S$ of $\\mathbb{C}$ is said to be arcwise connected if, given any two points $p$ and $q$ of $S$, there exists a continuous curve $\\gamma : [0, 1] \\to S$ such that $\\gamma(0) = p$ and $\\gamma(1) = q$. Show that if an open set is arcwise connected, then the continuous curve $\\gamma$ may be taken to be polygonal.",
        "answer": "Cover the compact curve $\\gamma([0,1])$ with finitely many open disks contained in $S$. In each disk, any two points can be connected by a straight line segment. Concatenating these segments produces a polygonal path in $S$ connecting $p$ and $q$."
    },
    {
        "id": "q-049",
        "number": 49,
        "title": "Topological vs Path Connectedness for Open Sets",
        "week": 4,
        "topic": "Connections with multivariable calculus",
        "difficulty": 3,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["complex-topology-sets"],
        "prompt": "In General Topology, a set $S$ is said to be connected if we cannot find two open sets $\\Omega_1$ and $\\Omega_2$ such that $\\Omega_1 \\cap \\Omega_2 \\cap S = \\emptyset$, $\\Omega_1 \\cap S \\ne \\emptyset$, $\\Omega_2 \\cap S \\ne \\emptyset$ and $(\\Omega_1 \\cap S) \\cup (\\Omega_2 \\cap S) = S$. Show that an open set $\\Omega \\subseteq \\mathbb{C}$ is connected in this sense if and only if it is arcwise connected. What can you say about regions?",
        "answer": "For open subsets of $\\mathbb{C}$, path-connectedness and topological connectedness are completely equivalent, because open disks are path-connected. Regions are connected open sets (with possibly boundary points), and domains are always polygonally path-connected."
    },

    # 11. Harmonic functions
    {
        "id": "q-050",
        "number": 50,
        "title": "Harmonic Conjugate of Quartic Polynomial",
        "week": 4,
        "topic": "Harmonic functions",
        "difficulty": 2,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["harmonic-functions"],
        "prompt": "Show that the function $u(x, y) = x^4 - 6x^2y^2 + y^4$ is harmonic and find a harmonic conjugate $v$. Express $f = u + iv$ as a function of $z$.",
        "answer": "v(x, y) = 4x^3y - 4xy^3; f(z) = z^4."
    },
    {
        "id": "q-051",
        "number": 51,
        "title": "Harmonic Cubic Polynomial and Entire Function",
        "week": 4,
        "topic": "Harmonic functions",
        "difficulty": 2,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["harmonic-functions"],
        "prompt": "Find all real $a, b, c$ such that $u(x, y) = x^3 + ax^2y + bxy^2 + cy^3$ is harmonic on $\\mathbb{R}^2$. For all such $a, b, c$ determine $v(x, y)$ such that $f = u + iv$ is entire and write $f$ as a function of $z$ only.",
        "answer": "a = -3c, b = -3, v(x, y) = cx^3 + 3x^2y - 3cxy^2 - y^3, f(z) = (1+ic)z^3."
    },
    {
        "id": "q-052",
        "number": 52,
        "title": "Milne-Thomson Derivative Formula",
        "week": 4,
        "topic": "Harmonic functions",
        "difficulty": 2,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["harmonic-functions"],
        "prompt": "Suppose $u, v$ are harmonic and satisfy the Cauchy-Riemann equations in $\\mathbb{R}^2$. Show that $f = u + iv$ satisfies $f'(x) = u_x(x, 0) - i u_y(x, 0)$ for real $x$.",
        "answer": "Since $f'(z) = u_x(x,y) + i v_x(x,y) = u_x(x,y) - i u_y(x,y)$ by CR equations. Setting $y = 0$ gives $f'(x) = u_x(x,0) - i u_y(x,0)$."
    },
    {
        "id": "q-053",
        "number": 53,
        "title": "Finding Holomorphic Functions from Real Parts",
        "week": 4,
        "topic": "Harmonic functions",
        "difficulty": 3,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["harmonic-functions"],
        "prompt": """Using the result of the previous question to guess $f$, or otherwise, show that the following are harmonic and find holomorphic functions $f$ of which they are the real parts:
(a) $x - x^3 + 3xy^2$,
(b) $\\cos x \\cosh y$,
(c) $\\frac{x}{x^2 + y^2}$, where $(x, y) \\ne (0, 0)$,
*(d) $\\frac{x(x^2 + y^2 + 1)}{(x^2 + y^2)^2 + 2(x^2 - y^2) + 1}$, where $(x, y) \\ne \\pm(0, 1)$,
(e) $y$.""",
        "answer": "Answer: (a) $z - z^3$; (b) $\\cos(z)$; (c) $1/z$; (d) $\\frac{z}{z^2 + 1}$; (e) $-iz$."
    },
    {
        "id": "q-054",
        "number": 54,
        "title": "Harmonic Conjugate Skew-Symmetry",
        "week": 4,
        "topic": "Harmonic functions",
        "difficulty": 1,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["harmonic-functions"],
        "prompt": "Suppose that $v$ is a harmonic conjugate of $u$. Show that $-u$ is a harmonic conjugate of $v$.",
        "answer": "If $v$ is conjugate of $u$, then $f = u + iv$ is holomorphic. Multiplying by $-i$, $-i f = v - iu = v + i(-u)$ is also holomorphic. Thus $-u$ is a harmonic conjugate of $v$."
    },
    {
        "id": "q-055",
        "number": 55,
        "title": "Complex Gradient and Harmonic Potential",
        "week": 4,
        "topic": "Harmonic functions",
        "difficulty": 4,
        "isDifficult": True,
        "isNonExaminable": False,
        "concepts": ["harmonic-functions"],
        "prompt": "Suppose that $u$ is a harmonic function in an open set $\\Omega$, and define the function $g$ on $\\Omega$ by $g(z) = u_x(x, y) - i u_y(x, y)$, where $z = x + iy$. Show that $g$ is holomorphic in $\\Omega$. If $f \\in H(\\Omega)$ and $f' = g$, what can you say about $f$ and $u$?",
        "answer": "Let $U = u_x, V = -u_y$. Then $U_x = u_{xx}$, $V_y = -u_{yy} = u_{xx}$ (since $u$ harmonic), so $U_x = V_y$. Also $U_y = u_{xy} = -(-u_{yx}) = -V_x$. Thus $g$ satisfies CR equations, so $g$ is holomorphic. If $f' = g$, then $\\operatorname{Re}(f') = u_x$, so $\\operatorname{Re}(f) = u + C$ for some real constant $C$."
    },

    # 12. Power series
    {
        "id": "q-056",
        "number": 56,
        "title": "Centre and Radius of Convergence of Power Series",
        "week": 4,
        "topic": "Power series",
        "difficulty": 2,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["taylor-and-laurent-series"],
        "prompt": """Find the centre and radius of convergence of the following power series; if possible, identify the sum:
(a) $\\sum_{n=0}^\\infty (z - 2)^n$
(b) $\\sum_{n=0}^\\infty \\frac{1}{3^n} (z - 2)^n$
(c) $\\sum_{n=0}^\\infty \\frac{1}{n!} (z - 2)^n$
(d) $\\sum_{n=0}^\\infty \\frac{1}{3^n n!} (z - 2)^n$
(e) $\\sum_{n=0}^\\infty n(z - 2)^n$
(f) $\\sum_{n=0}^\\infty n^2(z - 2)^n$
(g) $\\sum_{n=1}^\\infty \\frac{1}{n} (z - 2)^n$
(h) $\\sum_{n=1}^\\infty \\frac{1}{n(n + 1)} (z - 2)^n$""",
        "answer": "All series are centred at $z_0 = 2$.\n(a) $R = 1$, sum = $\\frac{1}{1 - (z-2)} = \\frac{1}{3-z}$.\n(b) $R = 3$, sum = $\\frac{3}{5-z}$.\n(c) $R = \\infty$, sum = $e^{z-2}$.\n(d) $R = \\infty$, sum = $e^{(z-2)/3}$.\n(e) $R = 1$, sum = $\\frac{z-2}{(3-z)^2}$.\n(g) $R = 1$, sum = $-\\operatorname{Log}(3-z)$."
    },

    # 13. Exponential and related functions
    {
        "id": "q-057",
        "number": 57,
        "title": "Complex Trig Modulus Identities",
        "week": 5,
        "topic": "Exponential and related functions",
        "difficulty": 2,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["complex-algebra-geometry"],
        "prompt": """(a) Show that $|\\sin z|^2 = \\sin^2 x + \\sinh^2 y$ and $|\\cos z|^2 - |\\sin z|^2 = \\cos 2x$.
(b) Show that $|\\cos z|^2 + |\\sin z|^2 \\ge 1$. When does equality hold?""",
        "answer": "(b) $|\\cos z|^2 + |\\sin z|^2 = \\cos^2 x + \\sinh^2 y + \\sin^2 x + \\sinh^2 y = 1 + 2\\sinh^2 y \\ge 1$. Equality holds if and only if $\\sinh y = 0 \\iff y = 0$ ($z$ is purely real)."
    },
    {
        "id": "q-058",
        "number": 58,
        "title": "Solving Complex Exponential and Trig Equations",
        "week": 5,
        "topic": "Exponential and related functions",
        "difficulty": 2,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["complex-algebra-geometry"],
        "prompt": """Find all $z \\in \\mathbb{C}$ such that:
(a) $e^z = -2$, (b) $\\cos z = 2$, (c) $\\cosh z = -5$, (d) $\\exp(z^2) = 1$.""",
        "answer": "Answer: (c) $\\pm \\ln(5 + 2\\sqrt{6}) + (2k + 1)\\pi i$, where $k \\in \\mathbb{Z}$."
    },
    {
        "id": "q-059",
        "number": 59,
        "title": "Conformal Mapping of Strip under Cosine",
        "week": 5,
        "topic": "Exponential and related functions",
        "difficulty": 4,
        "isDifficult": True,
        "isNonExaminable": False,
        "concepts": ["mobius-transformations"],
        "prompt": """Find the image of $\\{z \\in \\mathbb{C} : 0 < \\operatorname{Re}(z) < \\pi/2, \\operatorname{Im} z > 0\\}$ under the mappings:
(a) $w = \\cos z$, (b) $w = \\cos^2 z$, (c) $w = \\cos^{1/2} z$.
(Use the principal branch of the square root.)""",
        "answer": "(a) $w = \\cos(x+iy) = \\cos x \\cosh y - i \\sin x \\sinh y$. Since $0 < x < \\pi/2$ and $y > 0$, $u > 0$ and $v < 0$, which maps to the fourth quadrant $\\{w : \\operatorname{Re}(w) > 0, \\operatorname{Im}(w) < 0\\}$."
    },
    {
        "id": "q-060",
        "number": 60,
        "title": "Image of Rectangle under Exponential",
        "week": 5,
        "topic": "Exponential and related functions",
        "difficulty": 2,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["complex-algebra-geometry"],
        "prompt": "Find the image of the region $\\{z \\in \\mathbb{C} : 0 \\le \\operatorname{Re}(z) \\le 1/2, -\\pi \\le \\operatorname{Im}(z) \\le \\pi\\}$ under the mapping $w = e^z$.",
        "answer": "The closed annulus centered at the origin: $\\{w \\in \\mathbb{C} : 1 \\le |w| \\le \\sqrt{e}\\}$."
    },
    {
        "id": "q-061",
        "number": 61,
        "title": "Maximum Value of |exp(-z^2)|",
        "week": 5,
        "topic": "Exponential and related functions",
        "difficulty": 4,
        "isDifficult": True,
        "isNonExaminable": False,
        "concepts": ["complex-algebra-geometry"],
        "prompt": "Find the maximum value of $|e^{-z^2}|$ for $|z| \\ge 5$ and $0 \\le \\arg z \\le \\pi/8$.",
        "answer": "Answer: $\\exp(-25/\\sqrt{2})$"
    },
    {
        "id": "q-062",
        "number": 62,
        "title": "Hyperbolic and Trig Equations",
        "week": 5,
        "topic": "Exponential and related functions",
        "difficulty": 2,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["complex-algebra-geometry"],
        "prompt": "Find all solutions $z \\in \\mathbb{C}$ of (a) $\\cosh z = -1$, (b) $\\sin z = 3$, (c) $\\sinh z = 2i$.",
        "answer": "(a) $z = (2k+1)\\pi i$.\n(b) $\\sin z = \\frac{e^{iz} - e^{-iz}}{2i} = 3 \\implies e^{2iz} - 6i e^{iz} - 1 = 0 \\implies e^{iz} = (3 \\pm 2\\sqrt{2})i$.\n(c) $\\sinh z = i \\sin(-iz) = 2i \\implies \\sin(y) = 2$ with $x=0$, so $z = \\pm \\cosh^{-1}(2) + (2k+1/2)\\pi i$."
    },
    {
        "id": "q-063",
        "number": 63,
        "title": "Simultaneous Hyperbolic/Trig Solutions",
        "week": 5,
        "topic": "Exponential and related functions",
        "difficulty": 2,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["complex-algebra-geometry"],
        "prompt": "Solve (a) $\\sinh z - \\cosh z = 2i$, (b) $\\cos z + \\sin z = i$.",
        "answer": "Answer: (a) $-\\ln(2) + (2k + 1/2)\\pi i$."
    },
    {
        "id": "q-064",
        "number": 64,
        "title": "Holomorphic Domain of (z^2+4)^{-1} Log(z+2i)",
        "week": 5,
        "topic": "Exponential and related functions",
        "difficulty": 3,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["cauchy-riemann-equations"],
        "prompt": "Where is the function $f(z) = (z^2 + 4)^{-1} \\operatorname{Log}(z + 2i)$ holomorphic?",
        "answer": "Answer: $f$ is holomorphic on the complement of the set $\\{2i\\} \\cup \\{x - 2i : x \\le 0\\}$."
    },
    {
        "id": "q-065",
        "number": 65,
        "title": "Values of i^i and arcsin(10)",
        "week": 5,
        "topic": "Exponential and related functions",
        "difficulty": 3,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["complex-algebra-geometry"],
        "prompt": "Find all values of (a) $i^i$, and (b) $\\sin^{-1} 10$. Which are the principal values?",
        "answer": "Answer: (a) $i^i = e^{i \\log i} = e^{i(i(\\pi/2 + 2k\\pi))} = e^{-\\pi/2 - 2k\\pi}$, principal value is $e^{-\\pi/2}$. (b) $(2k + 1/2)\\pi \\pm i\\log(10 + 3\\sqrt{11})$; principal value is $\\frac{1}{2}\\pi - i\\log(10 + 3\\sqrt{11})$."
    },
    {
        "id": "q-066",
        "number": 66,
        "title": "Principal Value of Complex Power Expression",
        "week": 5,
        "topic": "Exponential and related functions",
        "difficulty": 3,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["complex-algebra-geometry"],
        "prompt": "Find the principal value of $\\left[ \\left( \\frac{1 + \\sqrt{3}i}{2} \\right)^{-3} \\right]^{1-i}$.",
        "answer": "Notice $\\frac{1+\\sqrt{3}i}{2} = e^{i\\pi/3}$. So $(e^{i\\pi/3})^{-3} = e^{-i\\pi} = -1$. The principal value of $(-1)^{1-i}$ is $e^{(1-i)\\operatorname{Log}(-1)} = e^{(1-i)(i\\pi)} = e^{\\pi + i\\pi} = -e^\\pi$."
    },
    {
        "id": "q-067",
        "number": 67,
        "title": "Limit of (cos z)^{1/z^2}",
        "week": 5,
        "topic": "Exponential and related functions",
        "difficulty": 3,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["cauchy-riemann-equations"],
        "prompt": "Evaluate $\\lim_{z \\to 0} (\\cos z)^{1/z^2}$. (Use the principal branch of the power.)",
        "answer": "Answer: $e^{-1/2}$, by l’Hôpital’s rule on $\\frac{\\operatorname{Log}(\\cos z)}{z^2}$."
    },
    {
        "id": "q-068",
        "number": 68,
        "title": "Cartesian Components of z^i",
        "week": 5,
        "topic": "Exponential and related functions",
        "difficulty": 2,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["complex-algebra-geometry"],
        "prompt": "Write $z = r e^{i\\theta}$. Find $\\operatorname{Re}(z^i)$, $\\operatorname{Im}(z^i)$, $|z^i|$ in terms of $r$ and $\\theta$. (Use the principal value of $z^i$.)",
        "answer": "$z^i = e^{i \\operatorname{Log} z} = e^{i(\\ln r + i\\theta)} = e^{-\\theta} e^{i \\ln r}$. Thus $|z^i| = e^{-\\theta}$, $\\operatorname{Re}(z^i) = e^{-\\theta}\\cos(\\ln r)$, $\\operatorname{Im}(z^i) = e^{-\\theta}\\sin(\\ln r)$."
    },
    {
        "id": "q-069",
        "number": 69,
        "title": "Continuity and Differentiability of z Log(z)",
        "week": 5,
        "topic": "Exponential and related functions",
        "difficulty": 2,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["cauchy-riemann-equations"],
        "prompt": "Define $f(z) = z \\operatorname{Log}(z)$ when $z \\ne 0$, and $f(0) = 0$. Is $f$ continuous or differentiable at $0$?",
        "answer": "Answer: It is continuous but not differentiable (the difference quotient $\\frac{f(z)-0}{z} = \\operatorname{Log}(z)$ tends to $-\\infty$ as $z \\to 0$)."
    },
    {
        "id": "q-070",
        "number": 70,
        "title": "Holomorphic Domains and Branches of Log",
        "week": 5,
        "topic": "Exponential and related functions",
        "difficulty": 3,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["cauchy-riemann-equations"],
        "prompt": """Define functions $f$ and $g$ by $f(z) = \\operatorname{Log}(iz)$ and $g(z) = z^{-1} \\operatorname{Log}(z + 1)$.
(a) Where are $f$ and $g$ holomorphic?
(b) Find a branch of $\\log(iz)$ which is holomorphic in the region $\\{z : \\operatorname{Im}(z) > 0\\}$.""",
        "answer": "Answer: (a) $f$ is holomorphic except when $z = iy$, where $y \\ge 0$; while $g$ is holomorphic except when $z = 0$ or $z = x$, where $x \\le -1$. (b) $i\\pi/2 + \\operatorname{Log}(z)$."
    },
    {
        "id": "q-071",
        "number": 71,
        "title": "Branch Cuts for Product of Square Roots",
        "week": 5,
        "topic": "Exponential and related functions",
        "difficulty": 4,
        "isDifficult": True,
        "isNonExaminable": False,
        "concepts": ["cauchy-riemann-equations"],
        "prompt": """In this question, all square roots are the principal branch.
(a) Where is $\\sqrt{z + 1}$ holomorphic?
(b) Show that $\\sqrt{z + 1} \\sqrt{z - 1} = -\\sqrt{z^2 - 1}$ when $\\operatorname{Re} z < -1$.
(c) Show that $\\sqrt{z^2 - 1}$ is holomorphic when $\\operatorname{Re} z < -1$.
(d) Show that $\\sqrt{z + 1} \\sqrt{z - 1}$ is holomorphic on the complement of $[-1, 1]$.""",
        "answer": "(a) Holomorphic on $\\mathbb{C} \\setminus (-\\infty, -1]$. (d) When crossing $(-\\infty, -1)$, both square roots change sign simultaneously, so their product is continuous and analytic across $(-\\infty, -1)$, leaving only the branch cut on $[-1, 1]$!"
    },
    {
        "id": "q-072",
        "number": 72,
        "title": "Holomorphic Domain of Log(z + 1/z - 2)",
        "week": 5,
        "topic": "Exponential and related functions",
        "difficulty": 4,
        "isDifficult": True,
        "isNonExaminable": False,
        "concepts": ["cauchy-riemann-equations"],
        "prompt": "Where is $\\operatorname{Log}(z + z^{-1} - 2)$ holomorphic?",
        "answer": "Answer: On the complement of the set $\\{z : |z| = 1\\} \\cup (-\\infty, 0]$."
    },

    # 14. Contour integrals
    {
        "id": "q-073",
        "number": 73,
        "title": "Parameterized Contour Integrals",
        "week": 6,
        "topic": "Contour integrals",
        "difficulty": 2,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["contour-integration"],
        "prompt": """(a) Evaluate $\\int_\\gamma z \\operatorname{Im}(z^2) \\, dz$, where $\\gamma$ is the unit circle traversed once, anticlockwise.
(b) Evaluate $\\int_\\gamma e^{|z|^2} \\operatorname{Re}(z) \\, dz$, where $\\gamma$ is the line segment from $0$ to $1 + i$.""",
        "answer": "Answer: (a) $-\\pi$ (b) $(1 + i)(e^2 - 1)/4$."
    },
    {
        "id": "q-074",
        "number": 74,
        "title": "Integral of conj(z) over Line and Semicircle",
        "week": 6,
        "topic": "Contour integrals",
        "difficulty": 2,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["contour-integration"],
        "prompt": """Evaluate $\\int_\\gamma \\bar{z} \\, dz$, where $\\gamma$ is:
(a) the straight line from $-1 + 2i$ to $3 + 5i$
(b) the upper semicircle of unit radius from $-1$ to $1$.""",
        "answer": "Answer: (a) $\\frac{29}{2} - 11i$ (b) $-i\\pi$."
    },
    {
        "id": "q-075",
        "number": 75,
        "title": "Integral of e^z + z and Log(z)",
        "week": 6,
        "topic": "Contour integrals",
        "difficulty": 2,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["contour-integration"],
        "prompt": """(a) Find $\\int_\\gamma (e^z + z) \\, dz$, where $\\gamma(t) = 1 + i\\pi t$ for $0 \\le t \\le 1$.
(b) Show that $\\int_\\gamma \\operatorname{Log} z \\, dz = -2i$, where $\\gamma(t) = e^{i\\pi t}$ for $-1/2 \\le t \\le 1/2$.""",
        "answer": "(a) $e^z + z$ has primitive $e^z + z^2/2$. Evaluating at end points gives $(e^{1+i\\pi} + (1+i\\pi)^2/2) - (e^1 + 1/2) = -e + (1+2i\\pi-\\pi^2)/2 - e - 1/2 = -2e - \\pi^2/2 + i\\pi$.\n(b) Primitive is $z \\operatorname{Log} z - z$."
    },
    {
        "id": "q-076",
        "number": 76,
        "title": "Path Independence for 1/cos^2(z)",
        "week": 6,
        "topic": "Contour integrals",
        "difficulty": 2,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["contour-integration"],
        "prompt": "Show that $\\int_\\gamma \\frac{dz}{\\cos^2(z)} = 2i \\tanh 1$, for every contour $\\gamma$ in the domain of $\\sec$ that starts at $-i$ and ends at $i$.",
        "answer": "$\\frac{d}{dz}\\tan z = \\sec^2 z = \\frac{1}{\\cos^2 z}$. Since $\\tan z$ is a primitive, the integral is path independent and equals $\\tan(i) - \\tan(-i) = 2\\tan(i) = 2i \\tanh(1)$."
    },
    {
        "id": "q-077",
        "number": 77,
        "title": "Integrals of Entire Functions via Antiderivatives",
        "week": 6,
        "topic": "Contour integrals",
        "difficulty": 2,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["contour-integration"],
        "prompt": """Let $\\gamma$ be any contour from $1 - i$ to $1 + i$. Evaluate the following integrals:
(a) $\\int_\\gamma 4z^3 \\, dz$;
(b) $\\int_\\gamma \\cos z \\, dz$;
(c) $\\int_\\gamma \\sin 2z \\, dz$.""",
        "answer": "(a) $[z^4]_{1-i}^{1+i} = (1+i)^4 - (1-i)^4 = -4 - (-4) = 0$.\n(b) $[\\sin z]_{1-i}^{1+i} = 2i \\cos 1 \\sinh 1$.\n(c) $[-\\frac{1}{2}\\cos 2z]_{1-i}^{1+i} = i \\sin 2 \\sinh 2$."
    },
    {
        "id": "q-078",
        "number": 78,
        "title": "Integral of 1/z around Semicircle",
        "week": 6,
        "topic": "Contour integrals",
        "difficulty": 2,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["contour-integration"],
        "prompt": """Let $\\gamma$ be the semi-circle from $2i$ to $-2i$ that passes through $-2$. Find $\\int_\\gamma z^{-1} \\, dz$:
(a) from the definition;
(b) by using a suitable branch of log as a primitive.""",
        "answer": "Answer: $\\pi i$."
    },

    # 15. Cauchy's integral formula
    {
        "id": "q-079",
        "number": 79,
        "title": "Evaluating Integrals via Cauchy's Integral Formula",
        "week": 6,
        "topic": "Cauchy's integral formula",
        "difficulty": 2,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["cauchy-integral-formula"],
        "prompt": """Evaluate the following integrals using the Cauchy Integral Formula (all contours traversed once anti-clockwise):
(a) $\\int_{|z|=2} \\frac{e^z}{z - 1} \\, dz$
(b) $\\int_{|z|=4} \\frac{e^{2iz}}{(3z - 1)^2} \\, dz$
(c) $\\int_{|z|=2} \\frac{z^2 + 1}{(z - 3)(z^2 - 1)} \\, dz$""",
        "answer": "Answer: (a) $2\\pi e i$ (b) $-4\\pi e^{2i/3}/9$ (c) $-\\pi i/2$."
    },
    {
        "id": "q-080",
        "number": 80,
        "title": "Derivatives via Cauchy Integral Formula",
        "week": 6,
        "topic": "Cauchy's integral formula",
        "difficulty": 3,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["cauchy-integral-formula"],
        "prompt": "Find $\\frac{1}{2\\pi i} \\int_\\gamma \\frac{\\sin \\pi z}{(z - 1)^n} \\, dz$, where $n \\in \\mathbb{Z}$ and $\\gamma$ is a simple closed anticlockwise contour around $1$.",
        "answer": "Answer: $0$, unless $n = 2, 4, 6, 8, \\dots$; in this case, $(-1)^{n/2}\\pi^{n-1}/(n - 1)!$."
    },
    {
        "id": "q-081",
        "number": 81,
        "title": "Integral of e^z z^n around Unit Circle",
        "week": 6,
        "topic": "Cauchy's integral formula",
        "difficulty": 2,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["cauchy-integral-formula"],
        "prompt": "Let $\\gamma$ be the unit circle $\\{e^{i\\theta} : -\\pi \\le \\theta \\le \\pi\\}$. Use the Cauchy integral formula to find $\\int_\\gamma e^z z^n \\, dz$, where $n \\in \\mathbb{Z}$.",
        "answer": "If $n \\ge 0$, $e^z z^n$ is entire, so the integral is $0$. If $n = -k$ with $k \\ge 1$, $\\int_\\gamma \\frac{e^z}{z^k} dz = \\frac{2\\pi i}{(k-1)!} \\left.\\frac{d^{k-1}}{dz^{k-1}} e^z\\right|_{z=0} = \\frac{2\\pi i}{(k-1)!} = \\frac{2\\pi i}{(-n-1)!}$."
    },
    {
        "id": "q-082",
        "number": 82,
        "title": "Evaluating Real Semicircular Integral int_0^infty cos(x)/(x^2+1)",
        "week": 6,
        "topic": "Cauchy's integral formula",
        "difficulty": 3,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["cauchy-integral-formula", "residue-calculus"],
        "prompt": """Define the semicircular arc $\\gamma_R$ by $\\gamma_R(t) = R e^{it}$, where $0 \\le t \\le \\pi$ and $R > 1$ is a real constant. Let $\\gamma$ be the join of $\\gamma_R$ and the line segment from $-R$ to $R$.
(a) Show that, if $z \\in \\operatorname{Range}(\\gamma_R)$, then $\\left|\\frac{e^{iz}}{z^2+1}\\right| \\le \\frac{1}{R^2-1}$.
(b) Deduce that $\\left|\\int_{\\gamma_R} \\frac{e^{iz}}{z^2+1} dz\\right| \\le \\frac{\\pi R}{R^2-1}$.
(c) Evaluate $\\int_\\gamma \\frac{e^{iz}}{z^2+1} dz$.
(d) Hence find $\\int_0^\\infty \\frac{\\cos x}{x^2+1} dx$.""",
        "answer": "(c) Only singularity inside upper semicircle is $z = i$. By CIF, $\\int_\\gamma \\frac{e^{iz}/(z+i)}{z-i} dz = 2\\pi i \\frac{e^{-1}}{2i} = \\pi e^{-1}$. (d) As $R \\to \\infty$, arc integral vanishes, giving $\\int_{-\\infty}^\\infty \\frac{\\cos x}{x^2+1} dx = \\pi/e$, so $\\int_0^\\infty = \\frac{\\pi}{2e}$."
    },
    {
        "id": "q-083",
        "number": 83,
        "title": "Extended Liouville: Linear Growth Implies f(z) = az + b",
        "week": 6,
        "topic": "Cauchy's integral formula",
        "difficulty": 3,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["cauchy-integral-formula"],
        "prompt": """Let $f(z)$ be an entire function that satisfies the inequality $|f(z)| \\le 1 + |z|$ for all $z \\in \\mathbb{C}$. Show that $f(z) = az + b$ for fixed complex numbers $a$ and $b$.
Hint: Apply the generalized Cauchy integral formula on an arbitrarily large circle to show that $f^{(n)}(0) = 0$ when $n \\ge 2$.""",
        "answer": "By Cauchy's estimate, $|f''(z_0)| \\le \\frac{2! \\max_{|z-z_0|=R}|f(z)|}{R^2} \\le \\frac{2(1 + |z_0| + R)}{R^2} \\to 0$ as $R \\to \\infty$. Thus $f''(z) = 0$ for all $z \\in \\mathbb{C}$, which implies $f'(z) = a$ and $f(z) = az + b$."
    },
    {
        "id": "q-084",
        "number": 84,
        "title": "Rectangular Contour for Gaussian Integral",
        "week": 6,
        "topic": "Cauchy's integral formula",
        "difficulty": 4,
        "isDifficult": True,
        "isNonExaminable": False,
        "concepts": ["cauchy-integral-formula"],
        "prompt": """By integrating $f(z) = e^{-z^2}$ round the boundary of the rectangle with corners at $a, a + ib, -a + ib$ and $-a$, where $b > 0$, show that
$$\\int_{-\\infty}^\\infty e^{-x^2} \\cos 2bx \\, dx = e^{-b^2} \\int_{-\\infty}^\\infty e^{-x^2} \\, dx = e^{-b^2}\\sqrt{\\pi}.$$""",
        "answer": "$f(z) = e^{-z^2}$ is entire, so by Cauchy's Theorem the closed rectangle integral is $0$. The vertical sides vanish as $a \\to \\infty$ since $|e^{-(a+iy)^2}| = e^{-a^2+y^2} \\le e^{-a^2+b^2} \\to 0$. The top edge gives $\\int_a^{-a} e^{-(x+ib)^2} dx = -e^{b^2} \\int_{-\\infty}^\\infty e^{-x^2}(\\cos 2bx - i\\sin 2bx) dx$."
    },
    {
        "id": "q-085",
        "number": 85,
        "title": "Rectangular Contour for Rational Real Integrals",
        "week": 6,
        "topic": "Cauchy's integral formula",
        "difficulty": 4,
        "isDifficult": True,
        "isNonExaminable": False,
        "concepts": ["cauchy-integral-formula"],
        "prompt": """By integrating $f(z) = (1 + z^2)^{-1}$ around the perimeter of the rectangle with corners at $0, a, a+ib$ and $ib$ and letting $a \\to \\infty$, where $0 < b < 1$, show that
$$\\int_0^\\infty \\frac{1 - b^2 + x^2}{(1 - b^2 + x^2)^2 + 4b^2x^2} \\, dx = \\frac{\\pi}{2},$$
and
$$\\int_0^\\infty \\frac{x}{(1 - b^2 + x^2)^2 + 4b^2x^2} \\, dx = \\frac{1}{4b} \\operatorname{Log}\\frac{1+b}{1-b}.$$""",
        "answer": "$f(z) = \\frac{1}{1+z^2}$ has poles at $\\pm i$. Since $0 < b < 1$, no pole lies inside the rectangle, so $\\oint f(z) dz = 0$. Equating real and imaginary parts of the horizontal and vertical segments gives the two integrals."
    },
    {
        "id": "q-086",
        "number": 86,
        "title": "Fresnel Integrals via Wedge Contour",
        "week": 6,
        "topic": "Cauchy's integral formula",
        "difficulty": 4,
        "isDifficult": True,
        "isNonExaminable": False,
        "concepts": ["cauchy-integral-formula"],
        "prompt": """Apply Cauchy’s theorem to the function $f(z) = e^{-z^2}$ and the sector of the circle $|z| = R$ bounded by a section of the real axis and the linear segment making an angle $\\pi/4$ with the real axis. Show that the integral over the circular boundary tends to zero as $R \\to \\infty$ and prove that
$$\\int_0^\\infty \\cos(x^2) \\, dx = \\int_0^\\infty \\sin(x^2) \\, dx = \\frac{1}{2}\\sqrt{\\frac{\\pi}{2}}.$$""",
        "answer": "Along the ray $z = r e^{i\\pi/4}$, $z^2 = i r^2$, so $e^{-z^2} = e^{-ir^2} = \\cos(r^2) - i\\sin(r^2)$, while $dz = e^{i\\pi/4} dr = \\frac{1+i}{\\sqrt{2}} dr$. Equating this to the real Gaussian integral $\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}$ yields the Fresnel integrals."
    },

    # 16. Taylor series, Laurent series, and residues
    {
        "id": "q-087",
        "number": 87,
        "title": "Taylor Expansions and Radii of Convergence",
        "week": 7,
        "topic": "Taylor series, Laurent series, and residues",
        "difficulty": 2,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["taylor-and-laurent-series"],
        "prompt": """Expand each of the following functions in a Taylor series about the given point $z_0$ and determine the radius of convergence:
(a) $f(z) = e^{-z}, \\, z_0 = 1$;
(b) $f(z) = (z + 2)e^{3z}, \\, z_0 = 0$;
(c) $f(z) = \\frac{1}{z^2 - 5z + 4}, \\, z_0 = 2$.""",
        "answer": "(a) $e^{-1} \\sum_{n=0}^\\infty \\frac{(-1)^n}{n!} (z-1)^n$, $R = \\infty$.\n(b) $\\sum_{n=0}^\\infty \\frac{3^{n-1}(3n+2)}{n!} z^n$, $R = \\infty$.\n(c) Singularities are at $z = 1, 4$. Nearest singularity to $z_0 = 2$ is $z = 1$, so $R = |2 - 1| = 1$."
    },
    {
        "id": "q-088",
        "number": 88,
        "title": "Taylor Series of 1/(1 + z + z^2)",
        "week": 7,
        "topic": "Taylor series, Laurent series, and residues",
        "difficulty": 2,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["taylor-and-laurent-series"],
        "prompt": "Show that $\\frac{1}{1 + z + z^2} = \\sum_{n=0}^\\infty (z^{3n} - z^{3n+1})$ in the disc $|z| < 1$.",
        "answer": "Notice $\\frac{1}{1+z+z^2} = \\frac{1-z}{1-z^3} = (1-z) \\sum_{n=0}^\\infty (z^3)^n = \\sum_{n=0}^\\infty (z^{3n} - z^{3n+1})$ for $|z^3| < 1 \\iff |z| < 1$."
    },
    {
        "id": "q-089",
        "number": 89,
        "title": "Radius of Convergence without Series",
        "week": 7,
        "topic": "Taylor series, Laurent series, and residues",
        "difficulty": 1,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["taylor-and-laurent-series"],
        "prompt": "Without finding the series, state the radius of convergence of the Taylor series for the function $f$ given by $f(z) = \\frac{\\cos z}{z(z + 1)}$ about the point $z = 1 + i$.",
        "answer": "Singularities of $f$ are at $z = 0$ and $z = -1$. Distance to $0$ is $|(1+i) - 0| = \\sqrt{2}$. Distance to $-1$ is $|(1+i) - (-1)| = |2+i| = \\sqrt{5}$. The nearest singularity is at $0$, so $R = \\sqrt{2}$."
    },
    {
        "id": "q-090",
        "number": 90,
        "title": "Taylor Series of (1+z)^{1/2}",
        "week": 7,
        "topic": "Taylor series, Laurent series, and residues",
        "difficulty": 3,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["taylor-and-laurent-series"],
        "prompt": "Find the Taylor series for $f(z) = (1+z)^{1/2}$ in powers of $z$ in the disc $|z| < 1$. Use the branch of the square root that is equal to $+1$ when $z = 0$.",
        "answer": "Answer: $\\sum_{n=0}^\\infty c_n z^n$, where $c_0 = 1, c_1 = 1/2$ and $c_n = \\frac{(-1)^{n+1}}{n! 2^n}(2n - 3)!!$ when $n > 1$."
    },
    {
        "id": "q-091",
        "number": 91,
        "title": "Logarithmic Formula and Series for arctan(w)",
        "week": 7,
        "topic": "Taylor series, Laurent series, and residues",
        "difficulty": 4,
        "isDifficult": True,
        "isNonExaminable": False,
        "concepts": ["taylor-and-laurent-series"],
        "prompt": """Show that $\\tan^{-1} w = \\frac{1}{2i} \\log \\frac{1 + iw}{1 - iw}$ (as multi-valued functions). Define $\\operatorname{PV}\\tan^{-1} w = \\frac{1}{2i} \\operatorname{Log} \\frac{1 + iw}{1 - iw}$.
Find all points $w$ where $\\operatorname{PV}\\tan^{-1} w$ is differentiable, and show that, when $|w| < 1$,
$$\\operatorname{PV}\\tan^{-1} w = w - \\frac{w^3}{3} + \\frac{w^5}{5} - \\cdots.$$""",
        "answer": "Answer: Differentiable in $\\mathbb{C} \\setminus \\{it : t \\in \\mathbb{R}, |t| \\ge 1\\}$."
    },
    {
        "id": "q-092",
        "number": 92,
        "title": "Bernoulli Numbers and Maclaurin Series",
        "week": 7,
        "topic": "Taylor series, Laurent series, and residues",
        "difficulty": 4,
        "isDifficult": True,
        "isNonExaminable": False,
        "concepts": ["taylor-and-laurent-series"],
        "prompt": """Define the function $f$ by $f(z) = \\frac{z}{2} + \\frac{z}{e^z - 1}$ for $z \\ne 0$ and $f(0) = 1$. Show that $f$ has a Maclaurin series of the form $a_0 + a_2 z^2 + a_4 z^4 + \\dots$, and find $a_0, a_2$ and $a_4$.
Note: The numbers $B_{2n}$ defined as $B_{2n} = a_{2n}(2n)!$ are known as the Bernoulli numbers.""",
        "answer": "$f(z) = \\frac{z}{2} \\frac{e^z + 1}{e^z - 1} = \\frac{z}{2} \\coth(z/2)$, which is an even function! Therefore all odd coefficients vanish. $a_0 = 1, a_2 = 1/12, a_4 = -1/720$."
    },
    {
        "id": "q-093",
        "number": 93,
        "title": "Distinct Laurent Expansions for 1/[z^2(1-z)]",
        "week": 7,
        "topic": "Taylor series, Laurent series, and residues",
        "difficulty": 3,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["taylor-and-laurent-series"],
        "prompt": "Find two distinct Laurent expansions for $\\frac{1}{z^2(1 - z)}$ in powers of $z$ and state the region of convergence of each expansion.",
        "answer": "Answer: $\\sum_{n=-2}^\\infty z^n$ when $0 < |z| < 1$, and $\\sum_{n=-\\infty}^{-3} (-1) z^n$ when $|z| > 1$."
    },
    {
        "id": "q-094",
        "number": 94,
        "title": "Laurent Expansion Converging for |z - 1| > 2",
        "week": 7,
        "topic": "Taylor series, Laurent series, and residues",
        "difficulty": 3,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["taylor-and-laurent-series"],
        "prompt": "Define $f(z) = \\frac{2z - 4}{z^2 - 4z + 3}$. Find the Laurent series for $f(z)$ that converges when $|z - 1| > 2$.",
        "answer": "Answer: $\\sum_{n=-\\infty}^{-1} c_n (z - 1)^n$, where $c_{-1} = 2$ and $c_n = 2^{-n-1}$ when $n \\le -2$."
    },
    {
        "id": "q-095",
        "number": 95,
        "title": "Laurent Series with Centre 1 Converging at 3",
        "week": 7,
        "topic": "Taylor series, Laurent series, and residues",
        "difficulty": 3,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["taylor-and-laurent-series"],
        "prompt": "Define $f(z) = (z - 2i)^{-1} - (z + i)^{-1}$. Find the Laurent series for $f$ with centre $1$ that converges at $3$.",
        "answer": "Singularities are at $2i$ (distance $|1-2i| = \\sqrt{5}$) and $-i$ (distance $|1+i| = \\sqrt{2}$). At $z = 3$, distance is $|3-1| = 2$. Since $\\sqrt{2} < 2 < \\sqrt{5}$, we expand in the annulus $\\sqrt{2} < |z - 1| < \\sqrt{5}$."
    },
    {
        "id": "q-096",
        "number": 96,
        "title": "Laurent Series of 1/sin(z)",
        "week": 7,
        "topic": "Taylor series, Laurent series, and residues",
        "difficulty": 3,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["taylor-and-laurent-series"],
        "prompt": "Define $f(z) = \\frac{1}{\\sin(z)}$. Find the Laurent series for $f$ up to terms in $z^3$ about $z = 0$ that is valid at $1/2$, and state the region of convergence.",
        "answer": "Answer: $z^{-1} + \\frac{1}{6}z + \\frac{7}{360}z^3 + \\dots$, valid for $0 < |z| < \\pi$."
    },
    {
        "id": "q-097",
        "number": 97,
        "title": "All Laurent Expansions of 3/[(z-2)(z+1)] in powers of z-1",
        "week": 7,
        "topic": "Taylor series, Laurent series, and residues",
        "difficulty": 3,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["taylor-and-laurent-series"],
        "prompt": "Define the function $f$ by $f(z) = \\frac{3}{(z - 2)(z + 1)}$. Find all Laurent expansions of $f$ in powers of $z-1$ and state the region of convergence of each expansion.",
        "answer": "Singularities at $z = 2$ and $z = -1$. In powers of $w = z-1$, poles are at $w = 1$ and $w = -2$. The regions are: (1) $|z-1| < 1$, (2) $1 < |z-1| < 2$, and (3) $|z-1| > 2$."
    },
    {
        "id": "q-098",
        "number": 98,
        "title": "Laurent Expansion of 1/[(z-1)(z-2)^2]",
        "week": 7,
        "topic": "Taylor series, Laurent series, and residues",
        "difficulty": 3,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["taylor-and-laurent-series"],
        "prompt": "Find the Laurent expansion of $\\frac{1}{(z - 1)(z - 2)^2}$ that holds when $0 < |z-1| < 1$.",
        "answer": "Let $w = z-1$. Then $\\frac{1}{w(w-1)^2} = \\frac{1}{w} (1-w)^{-2} = \\frac{1}{w} \\sum_{n=0}^\\infty (n+1) w^n = \\sum_{n=-1}^\\infty (n+2)(z-1)^n$."
    },
    {
        "id": "q-099",
        "number": 99,
        "title": "Non-Isolated Singularity of 1/sin(1/z)",
        "week": 7,
        "topic": "Taylor series, Laurent series, and residues",
        "difficulty": 3,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["taylor-and-laurent-series"],
        "prompt": "Show that the function $f(z) = \\frac{1}{\\sin(1/z)}$ does not have a Laurent series about $0$ that converges to $f$ in $B^\\circ(0, r)$ for any $r > 0$.",
        "answer": "Zeros of $\\sin(1/z)$ occur at $1/z = k\\pi \\implies z = \\frac{1}{k\\pi}$ for $k \\in \\mathbb{Z} \\setminus \\{0\\}$. These poles accumulate at $z = 0$. Since $z = 0$ is a non-isolated singularity, there is no punctured disk $B^\\circ(0, r)$ free of other singularities, so no Laurent series exists."
    },
    {
        "id": "q-100",
        "number": 100,
        "title": "Parseval-Type Integral Formula for Power Series",
        "week": 7,
        "topic": "Taylor series, Laurent series, and residues",
        "difficulty": 4,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["taylor-and-laurent-series"],
        "prompt": """Suppose that $f(z) = \\sum_{n=0}^\\infty a_n z^n$ and $g(z) = \\sum_{n=0}^\\infty b_n z^n$, and the series converge when $|z| < 2$. By integrating $f(z) g(z^{-1}) z^{-1}$ around the unit circle, show that
$$\\sum_{n=0}^\\infty a_n b_n = \\frac{1}{2\\pi} \\int_0^{2\\pi} f(e^{i\\theta}) g(e^{-i\\theta}) \\, d\\theta.$$
Deduce that $\\sum_{n=0}^\\infty a_n \\bar{b}_n = \\frac{1}{2\\pi} \\int_0^{2\\pi} f(e^{i\\theta}) \\overline{g(e^{i\\theta})} \\, d\\theta$.""",
        "answer": "On the unit circle, $z = e^{i\\theta}, dz = i e^{i\\theta} d\\theta$. $\\frac{1}{2\\pi i} \\oint f(z) g(1/z) \\frac{dz}{z} = \\operatorname{Res}(f(z)g(1/z)/z, 0) = a_0 b_0 + a_1 b_1 + \\dots = \\sum a_n b_n$."
    },
    {
        "id": "q-101",
        "number": 101,
        "title": "Residue Calculations at Singularities",
        "week": 8,
        "topic": "Taylor series, Laurent series, and residues",
        "difficulty": 3,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["residue-calculus"],
        "prompt": """Find the residues of each of the following functions at each of their singularities:
(a) $\\frac{e^z}{z^2 + 1}$
(b) $\\frac{\\sinh z}{(z - i)^3}$
(c) $\\frac{z^2 - 3z + 1}{(z^2 - 1)(z - 1)}$
(d) $\\frac{e^z}{\\cosh z}$
(e) $\\tan z$""",
        "answer": "Answer: (a) $z = i, -i e^i/2; z = -i, i e^{-i}/2$; (b) $z = i, (i\\sin 1)/2$; (c) $z = -1, 5/4; z = 1, -1/4$; (d) $z = i\\pi/2 + k\\pi i, 1$; (e) $z = \\pi/2 + k\\pi, -1$."
    },
    {
        "id": "q-102",
        "number": 102,
        "title": "Locate and Classify Singularities and Residues",
        "week": 8,
        "topic": "Taylor series, Laurent series, and residues",
        "difficulty": 4,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["residue-calculus"],
        "prompt": """Locate and classify the singularities of the following functions:
(a) $\\frac{1}{z^2 \\sin z}$
(b) $\\frac{z(z - \\pi)^2}{\\sin^2 z}$
(c) $\\exp(z + 1/z)$
Evaluate the residues at each singularity of these functions (leave your answer to (c) as a series).""",
        "answer": "Answer: (a) $z = 0$: pole of order 3, residue 1/6 and $z = k\\pi, k \\ne 0$: simple poles, residue $(-1)^k (k\\pi)^{-2}$. (b) $z = 0$: simple pole, residue $\\pi^2$; $z = \\pi$: removable singularity, residue 0; $z = k\\pi, k \\ne 0, 1$: double poles, residue $(3k^2 - 4k + 1)\\pi^2$. (c) $z = 0$: essential singularity, residue $\\sum_{k=0}^\\infty \\frac{1}{k!(k+1)!}$."
    },

    # 17. Residue theorem & Contour integration applications
    {
        "id": "q-103",
        "number": 103,
        "title": "Contour Integral of cos(z)/[z^2(z^2+1)]",
        "week": 8,
        "topic": "Taylor series, Laurent series, and residues",
        "difficulty": 3,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["residue-calculus"],
        "prompt": "Find $\\int_\\Gamma \\frac{\\cos z}{z^2(z^2 + 1)} \\, dz$: (a) when $\\Gamma$ is the circle $|z| = 2$ and (b) when $\\Gamma$ is the circle $|z - i/2| = 1$, both described once anticlockwise.",
        "answer": "Poles at $0$ (double), $i$ (simple), $-i$ (simple). Residue at $0$ is $0$ (integrand is even). Residue at $i$ is $\\frac{\\cos(i)}{i^2(2i)} = \\frac{\\cosh(1)}{-2i} = \\frac{i\\cosh(1)}{2}$. For (a), sum of all residues is $0$, so integral = $0$. For (b), only $0$ and $i$ inside: integral = $2\\pi i (i\\cosh(1)/2) = -\\pi \\cosh(1)$."
    },
    {
        "id": "q-104",
        "number": 104,
        "title": "Contour Integral of (z^3 + 5)/[z(z - 1)^3]",
        "week": 8,
        "topic": "Taylor series, Laurent series, and residues",
        "difficulty": 3,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["residue-calculus"],
        "prompt": "Find $\\int_\\Gamma \\frac{z^3 + 5}{z(z - 1)^3} \\, dz$ when $\\Gamma$ is the circle $|z| = 2$ described once anticlockwise.",
        "answer": "Answer: $2\\pi i$ (using residue at infinity: $\\operatorname{Res}(f, \\infty) = -1$)."
    },
    {
        "id": "q-105",
        "number": 105,
        "title": "Improper Rational Integral 1/[(x^2+a^2)(x^2+b^2)]",
        "week": 8,
        "topic": "Taylor series, Laurent series, and residues",
        "difficulty": 3,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["residue-calculus"],
        "prompt": "Show that $\\int_{-\\infty}^\\infty \\frac{dx}{(x^2 + a^2)(x^2 + b^2)} = \\frac{\\pi}{ab(a + b)}$ when $a, b > 0$.",
        "answer": "Poles in upper half plane at $z = ia$ and $z = ib$. Residues are $\\frac{1}{2ia(b^2-a^2)}$ and $\\frac{1}{2ib(a^2-b^2)}$. Summing and multiplying by $2\\pi i$ yields $\\frac{\\pi}{ab(a+b)}$."
    },
    {
        "id": "q-106",
        "number": 106,
        "title": "Trigonometric Integrals over [0, 2π]",
        "week": 8,
        "topic": "Taylor series, Laurent series, and residues",
        "difficulty": 3,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["residue-calculus"],
        "prompt": """Use complex analysis methods to show that:
(a) $\\int_0^{2\\pi} \\frac{\\cos 2\\theta}{5 + 4 \\cos \\theta} \\, d\\theta = \\frac{\\pi}{6}$
(b) $\\int_0^{2\\pi} \\frac{\\sin^2 \\theta}{5 + 3 \\cos \\theta} \\, d\\theta = \\frac{2\\pi}{9}$""",
        "answer": "Substitute $z = e^{i\\theta}, \\cos\\theta = \\frac{z+z^{-1}}{2}, d\\theta = \\frac{dz}{iz}$ around $|z| = 1$. The only pole inside $|z| < 1$ is at $z = -1/2$ (or $-1/3$). Calculating residues gives $\\pi/6$ and $2\\pi/9$."
    },
    {
        "id": "q-107",
        "number": 107,
        "title": "Evaluating I1 and I2 with exp(6iθ)",
        "week": 8,
        "topic": "Taylor series, Laurent series, and residues",
        "difficulty": 3,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["residue-calculus"],
        "prompt": "Find $I_1 = \\int_0^{2\\pi} \\frac{\\cos 6\\theta}{5 + 4 \\sin \\theta} \\, d\\theta$ and $I_2 = \\int_0^{2\\pi} \\frac{\\sin 6\\theta}{5 + 4 \\sin \\theta} \\, d\\theta$, by first computing $I_1 + iI_2$.",
        "answer": "$I_1 + i I_2 = \\int_0^{2\\pi} \\frac{e^{6i\\theta}}{5 + 4 \\sin\\theta} d\\theta = \\oint_{|z|=1} \\frac{z^6}{5 + 2(z - z^{-1})/i} \\frac{dz}{iz} = \\oint_{|z|=1} \\frac{z^6}{2z^2 + 5iz - 2} dz$. Poles at $z = -i/2$ and $z = -2i$. Residue at $z = -i/2$ yields the exact value."
    },
    {
        "id": "q-108",
        "number": 108,
        "title": "Integral of z^2/(2z+1) and Trig Integral",
        "week": 8,
        "topic": "Taylor series, Laurent series, and residues",
        "difficulty": 3,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["residue-calculus"],
        "prompt": "Evaluate $\\int_{|z|=1} \\frac{z^2}{2z + 1} \\, dz$ and hence prove that $\\int_0^\\pi \\frac{2 \\cos 2\\theta + \\cos 3\\theta}{5 + 4 \\cos \\theta} \\, d\\theta = \\frac{\\pi}{8}$.",
        "answer": "Residue of $\\frac{z^2}{2z+1}$ at $z = -1/2$ is $(-1/2)^2/2 = 1/8$, so the contour integral is $2\\pi i(1/8) = \\pi i / 4$. Parameterizing $z = e^{i\\theta}$ and equating real parts produces $\\pi/8$."
    },
    {
        "id": "q-109",
        "number": 109,
        "title": "Wedge Sector Contour for x^q/(x^p + 1)",
        "week": 8,
        "topic": "Taylor series, Laurent series, and residues",
        "difficulty": 4,
        "isDifficult": True,
        "isNonExaminable": False,
        "concepts": ["residue-calculus"],
        "prompt": "Suppose that $p$ and $q$ are positive integers and $p > q + 1$. By integrating round the boundary of the domain $\\{z \\in \\mathbb{C} : |z| < R, 0 < \\arg(z) < \\frac{2\\pi}{p}\\}$, show that $\\int_0^\\infty \\frac{x^q}{x^p + 1} \\, dx = \\frac{\\pi}{p} \\operatorname{cosec} \\frac{\\pi(q + 1)}{p}$.",
        "answer": "The wedge has three sides: the real axis, the circular arc, and the ray at angle $2\\pi/p$. The only pole inside is $z = e^{i\\pi/p}$. Along the ray, $z = r e^{i2\\pi/p}$, so $z^p = r^p$, and the integral becomes $-e^{i 2\\pi (q+1)/p} \\int_0^\\infty \\frac{r^q}{r^p+1} dr$. Applying the residue theorem yields $\\frac{\\pi}{p \\sin(\\pi(q+1)/p)}$."
    },
    {
        "id": "q-110",
        "number": 110,
        "title": "Advanced Contour Integrals with Branch Cuts and Log",
        "week": 8,
        "topic": "Taylor series, Laurent series, and residues",
        "difficulty": 4,
        "isDifficult": True,
        "isNonExaminable": False,
        "concepts": ["residue-calculus"],
        "prompt": """By evaluating suitable contour integrals, and taking suitable limits, show that:
(a) $\\int_{-\\infty}^\\infty \\frac{\\ln(x^2 + 1)}{x^2 + 1} \\, dx = \\pi \\ln 4$;
(b) $\\int_{-\\infty}^\\infty \\frac{\\sin x}{x(x^2 + 1)} \\, dx = \\pi(1 - e^{-1})$;
(c) $\\int_0^\\infty \\frac{x^{3/4}}{x^2 + x + 1} \\, dx = \\frac{2\\pi}{\\sqrt{3}}$.""",
        "answer": "For (b): Use an indented contour around the pole at $z = 0$ on the real axis, integrating $\\frac{e^{iz}-1}{z(z^2+1)}$ or using the fractional residue $\\pi i \\operatorname{Res}(f, 0)$."
    },
    {
        "id": "q-111",
        "number": 111,
        "title": "Integral of e^z/[sin(z) + i sinh(z)]",
        "week": 8,
        "topic": "Taylor series, Laurent series, and residues",
        "difficulty": 4,
        "isDifficult": True,
        "isNonExaminable": False,
        "concepts": ["residue-calculus"],
        "prompt": """Evaluate the integral $\\int_\\gamma \\frac{e^z}{\\sin(z) + i \\sinh(z)} \\, dz$ where $\\gamma(t) = e^{i2\\pi t}, 0 \\le t \\le 1$.
What is the radius of the largest circle centred at the origin for which the integral has the same value?""",
        "answer": "At $z = 0$, $\\sin z + i \\sinh z = 2z + O(z^3)$. Thus $z = 0$ is a simple pole with residue $\\lim_{z \\to 0} z \\frac{e^z}{2z} = 1/2$. The integral around $|z| = 1$ is $2\\pi i(1/2) = \\pi i$. The integral remains $\\pi i$ until the circle reaches the next zero of $\\sin z + i \\sinh z$."
    },

    # 18. Theory of functions*
    {
        "id": "q-112",
        "number": 112,
        "title": "Liouville Bound via Contour Estimate",
        "week": 9,
        "topic": "Theory of functions*",
        "difficulty": 4,
        "isDifficult": True,
        "isNonExaminable": False,
        "concepts": ["cauchy-integral-formula"],
        "prompt": """Let $f$ be an entire function, and take $a, b \\in \\mathbb{C}$. For $R > \\max\\{|a|, |b|\\}$, estimate $\\int_{|z|=R} \\frac{f(z)}{(z - a)(z - b)} \\, dz$.
Assuming also that $f$ is bounded, let $R \\to \\infty$ and show that $f$ is constant.""",
        "answer": "By Cauchy's integral formula, for any $R$, $\\int_{|z|=R} \\frac{f(z)}{(z-a)(z-b)} dz = 2\\pi i \\frac{f(a) - f(b)}{a - b}$. On the circle $|z|=R$, $|f(z)| \\le M$, so the integral is bounded by $2\\pi R \\frac{M}{(R-|a|)(R-|b|)} \\to 0$ as $R \\to \\infty$. Thus $f(a) - f(b) = 0 \\implies f(a) = f(b)$ for all $a, b$."
    },
    {
        "id": "q-113",
        "number": 113,
        "title": "Entire Function Missing an Open Ball is Constant",
        "week": 9,
        "topic": "Theory of functions*",
        "difficulty": 3,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["cauchy-integral-formula"],
        "prompt": """Suppose that $f$ is an entire function, and that there is a (nonempty) open ball $B(w_0, r)$ such that $w \\notin \\operatorname{Range}(f)$ for all $w \\in B(w_0, r)$. Show that $f$ is constant.
Hint: Consider the function $1/(f(z) - w_0)$.""",
        "answer": "Since $f(z) \\notin B(w_0, r)$, $|f(z) - w_0| \\ge r > 0$ for all $z \\in \\mathbb{C}$. Thus $g(z) = \\frac{1}{f(z) - w_0}$ has no poles in $\\mathbb{C}$, so it is an entire function, and $|g(z)| \\le 1/r$. By Liouville's theorem, $g$ is constant, hence $f$ is constant."
    },
    {
        "id": "q-114",
        "number": 114,
        "title": "Partial Fraction Decomposition of Meromorphic Functions",
        "week": 9,
        "topic": "Theory of functions*",
        "difficulty": 4,
        "isDifficult": True,
        "isNonExaminable": False,
        "concepts": ["taylor-and-laurent-series"],
        "prompt": """Suppose that $f$ is a holomorphic function on $\\mathbb{C} \\setminus \\{z_1, \\dots, z_M\\}$, that $f$ has a pole of order $N_m$ at $z_m$, and that $\\lim_{z \\to \\infty} f(z) = 0$.
(a) Explain why $f$ has a Laurent series in a punctured ball $B^\\circ(z_m, r_m)$. What is the largest possible value for $r_m$?
(b) Define $f_m(z) = \\sum_{n=-N_m}^{-1} c_{m,n}(z - z_m)^n$. Explain why $f - f_m$ is holomorphic in $B^\\circ(z_m, r_m)$.
(c) Explain why $f - (f_1 + \\dots + f_M)$ is entire and vanishes at infinity.
(d) Explain why $f = f_1 + \\dots + f_M$.""",
        "answer": "(d) $f - \\sum f_m$ is entire and bounded (vanishes at infinity). By Liouville's theorem, an entire function vanishing at infinity must be identically $0$. Hence $f = \\sum_{m=1}^M f_m$ exactly!"
    },
    {
        "id": "q-115",
        "number": 115,
        "title": "Singularities at Infinity and Polynomial Bounds",
        "week": 9,
        "topic": "Theory of functions*",
        "difficulty": 4,
        "isDifficult": True,
        "isNonExaminable": False,
        "concepts": ["taylor-and-laurent-series"],
        "prompt": """Suppose that $f$ is holomorphic in an annulus $A(R) = \\{z \\in \\mathbb{C} : |z| > R\\}$, and define $g(z) = f(1/z)$.
(a) Show that $g$ has an isolated singularity at $0$.
(b) Show that the singularity of $g$ at $0$ is a pole if and only if given $R' > R$, there are constants $C$ and $N$ such that $|f(z)| \\le C |z|^N$ for all $z \\in A(R')$.
(c) Show that if $|f(z)| \\le C |z|^N$ for all $z \\in A(R)$, then there is a polynomial $p$ such that $f - p$ is bounded in $A(R)$.""",
        "answer": "$g(z)$ having a pole of order $N$ at $0$ means $g(z) = \\sum_{n=1}^N a_{-n} z^{-n} + \\text{analytic}$, so $f(w) = g(1/w) = \\sum_{n=1}^N a_{-n} w^n + O(1)$, which is a polynomial of degree $N$ plus a bounded function."
    },

    # 19. Counting roots of equations
    {
        "id": "q-116",
        "number": 116,
        "title": "Roots of z^4 - 8z + 10 = 0 in Annulus",
        "week": 9,
        "topic": "Counting roots of equations",
        "difficulty": 3,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["rouches-theorem-argument-principle"],
        "prompt": "How many roots of $z^4 - 8z + 10 = 0$ lie in the annulus $1 < |z| < 3$? How many of these lie in the first quadrant?",
        "answer": "Answer: Four; one. On $|z| = 1$, dominant term is $10 > |z^4 - 8z| = 9$, so $0$ roots inside $|z| < 1$. On $|z| = 3$, dominant term is $z^4$ ($3^4 = 81 > |8z-10| = 34$), so all $4$ roots lie in $|z| < 3$. Hence all 4 roots lie in $1 < |z| < 3$."
    },
    {
        "id": "q-117",
        "number": 117,
        "title": "Roots of z^9 - 2z^6 + z^2 - 8z - 2 = 0 inside Unit Circle",
        "week": 9,
        "topic": "Counting roots of equations",
        "difficulty": 2,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["rouches-theorem-argument-principle"],
        "prompt": "How many roots of $z^9 - 2z^6 + z^2 - 8z - 2 = 0$ lie inside the unit circle?",
        "answer": "Answer: One. On $|z| = 1$, let $f(z) = -8z$. $|f(z)| = 8$. Let $g(z) = z^9 - 2z^6 + z^2 - 2$. $|g(z)| \\le 1 + 2 + 1 + 2 = 6 < 8$. By Rouché's theorem, the polynomial has the same number of roots inside $|z| < 1$ as $-8z$, which is 1."
    },
    {
        "id": "q-118",
        "number": 118,
        "title": "Roots of e^z - 4z^n + 1 = 0",
        "week": 9,
        "topic": "Counting roots of equations",
        "difficulty": 2,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["rouches-theorem-argument-principle"],
        "prompt": "Let $n \\in \\mathbb{Z}^+$. Show that $e^z - 4z^n + 1 = 0$ has $n$ roots inside the unit circle.",
        "answer": "On $|z| = 1$, let $f(z) = -4z^n$, so $|f(z)| = 4$. Let $g(z) = e^z + 1$. Since $|e^z| \\le e^{\\operatorname{Re}(z)} \\le e^1 \\approx 2.718$, $|g(z)| \\le e + 1 \\approx 3.718 < 4 = |f(z)|$. By Rouché's theorem, $f(z) + g(z)$ has the same number of roots inside $|z| < 1$ as $-4z^n$, which is $n$."
    },
    {
        "id": "q-119",
        "number": 119,
        "title": "Roots of 2z^4 - 3z^3 + 3z^2 - z + 1 = 0 in Each Quadrant",
        "week": 9,
        "topic": "Counting roots of equations",
        "difficulty": 3,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["rouches-theorem-argument-principle"],
        "prompt": "How many roots has $2z^4 - 3z^3 + 3z^2 - z + 1 = 0$ in each quadrant?",
        "answer": "Answer: One in each."
    },
    {
        "id": "q-120",
        "number": 120,
        "title": "Roots with Re(z) > 0 for z^5 + z^4 + 2z^3 - 8z - 1 = 0",
        "week": 9,
        "topic": "Counting roots of equations",
        "difficulty": 3,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["rouches-theorem-argument-principle"],
        "prompt": "How many roots of $z^5 + z^4 + 2z^3 - 8z - 1 = 0$ also satisfy $\\operatorname{Re} z > 0$?",
        "answer": "Answer: One."
    },
    {
        "id": "q-121",
        "number": 121,
        "title": "Roots with Re(z) < 0 for z^7 - 2z - 5 = 0",
        "week": 9,
        "topic": "Counting roots of equations",
        "difficulty": 3,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["rouches-theorem-argument-principle"],
        "prompt": "Find the number of solutions of $z^7 - 2z - 5 = 0$ that satisfy $\\operatorname{Re} z < 0$.",
        "answer": "Answer: Four."
    },

    # 20. More on integrals
    {
        "id": "q-122",
        "number": 122,
        "title": "Complex Gamma Function and Analytic Continuation",
        "week": 10,
        "topic": "More on integrals",
        "difficulty": 4,
        "isDifficult": True,
        "isNonExaminable": False,
        "concepts": ["fourier-and-laplace-transforms"],
        "prompt": """For a complex number $z$ such that $\\operatorname{Re}(z) > 1$, consider the improper integral $\\Gamma(z) = \\int_0^\\infty e^{-t} t^{z-1} \\, dt$.
(a) Show that the improper integral converges.
(b) Assuming that it is legitimate to exchange the order of differentiation and integration, show that $\\Gamma$ is holomorphic in $\\{z \\in \\mathbb{C} : \\operatorname{Re}(z) > 1\\}$.
(c) Show that, if $\\operatorname{Re}(z) > 1$, then $\\Gamma(z + 1) = z \\Gamma(z)$.
(d) Use induction and the formula $\\Gamma(z - 1) = \\frac{\\Gamma(z)}{z - 1}$ to define $\\Gamma(z)$ in $\\{z \\in \\mathbb{C} : \\operatorname{Re}(z) > -N\\}$. Where are the singularities of $\\Gamma$? What kind of singularities are they?""",
        "answer": "(d) $\\Gamma(z)$ has simple poles at $z = 0, -1, -2, -3, \\dots$, with residues $\\operatorname{Res}(\\Gamma, -k) = \\frac{(-1)^k}{k!}$."
    },
    {
        "id": "q-123",
        "number": 123,
        "title": "Integral of x^q/(x^p + 1) via Real Substitution",
        "week": 10,
        "topic": "More on integrals",
        "difficulty": 3,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["residue-calculus"],
        "prompt": "Find the integral $\\int_0^\\infty \\frac{x^q}{x^p + 1} \\, dx$, where $p, q \\in \\mathbb{R}^+$ and $p > q + 1$, without using complex methods.",
        "answer": "Substitute $u = x^p, du = p x^{p-1} dx$, transforming into the Beta integral $B\\left(\\frac{q+1}{p}, 1 - \\frac{q+1}{p}\\right) = \\frac{\\pi}{\\sin(\\pi(q+1)/p)}$."
    },

    # 21. Fourier and Laplace transforms
    {
        "id": "q-124",
        "number": 124,
        "title": "Fourier Transform of Triangular Pulse",
        "week": 10,
        "topic": "Fourier and Laplace transforms",
        "difficulty": 3,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["fourier-and-laplace-transforms"],
        "prompt": """Define $f : \\mathbb{R} \\to \\mathbb{R}$ by
$$f(x) = \\begin{cases} 1 - |x|/2 & \\text{if } |x| \\le 2 \\\\ 0 & \\text{otherwise.} \\end{cases}$$
Calculate the Fourier transform of $f$, and show that $f, \\hat{f} \\in M(\\mathbb{R})$. Hence, using the inversion formula, show that
$$\\int_{-\\infty}^\\infty \\frac{\\sin^2(\\xi)}{\\xi^2} \\, d\\xi = \\pi.$$""",
        "answer": "$\\hat{f}(\\xi) = \\int_{-2}^2 (1 - |x|/2) e^{-i x \\xi} dx = 2 \\int_0^2 (1 - x/2) \\cos(x\\xi) dx = \\frac{2(1 - \\cos 2\\xi)}{2\\xi^2} = \\frac{2\\sin^2\\xi}{\\xi^2}$. Inversion formula at $x = 0$ gives $f(0) = 1 = \\frac{1}{2\\pi} \\int_{-\\infty}^\\infty \\frac{2\\sin^2\\xi}{\\xi^2} d\\xi$, proving the integral equals $\\pi$."
    },
    {
        "id": "q-125",
        "number": 125,
        "title": "Fourier Transform of Rectangular Pulse and Dirichlet Integral",
        "week": 10,
        "topic": "Fourier and Laplace transforms",
        "difficulty": 2,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["fourier-and-laplace-transforms"],
        "prompt": """Define $f : \\mathbb{R} \\to \\mathbb{R}$ by
$$f(x) = \\begin{cases} 1 & \\text{if } |x| \\le 1 \\\\ 0 & \\text{otherwise.} \\end{cases}$$
Calculate the Fourier transform of $f$. Assuming that the inversion formula holds for $f$ and $\\hat{f}$, compute $\\int_{-\\infty}^\\infty \\frac{\\sin(\\xi)}{\\xi} \\, d\\xi$.""",
        "answer": "$\\hat{f}(\\xi) = \\int_{-1}^1 e^{-ix\\xi} dx = \\frac{2\\sin\\xi}{\\xi}$. At $x = 0$, $f(0) = 1 = \\frac{1}{2\\pi} \\int_{-\\infty}^\\infty \\frac{2\\sin\\xi}{\\xi} d\\xi \\implies \\int_{-\\infty}^\\infty \\frac{\\sin\\xi}{\\xi} d\\xi = \\pi$."
    },
    {
        "id": "q-126",
        "number": 126,
        "title": "Standard Laplace Transforms",
        "week": 10,
        "topic": "Fourier and Laplace transforms",
        "difficulty": 2,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["fourier-and-laplace-transforms"],
        "prompt": """Compute the Laplace transforms of each of the following functions, stating the domain of the transform:
(a) $f(t) = e^{-at}$
(b) $f(t) = \\cos(\\omega t)$
(c) $f(t) = t(t^2 - 1)$,
where $a \\in \\mathbb{C}$ and $\\omega \\in \\mathbb{R}$.""",
        "answer": "(a) $\\frac{1}{z+a}$, domain $\\operatorname{Re}(z) > -\\operatorname{Re}(a)$. (b) $\\frac{z}{z^2+\\omega^2}$, domain $\\operatorname{Re}(z) > 0$. (c) $\\mathcal{L}\\{t^3 - t\\} = \\frac{6}{z^4} - \\frac{1}{z^2}$, domain $\\operatorname{Re}(z) > 0$."
    },
    {
        "id": "q-127",
        "number": 127,
        "title": "Inverse Laplace Transforms",
        "week": 10,
        "topic": "Fourier and Laplace transforms",
        "difficulty": 3,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["fourier-and-laplace-transforms"],
        "prompt": """Find the functions whose Laplace transforms are given by:
(a) $\\frac{1}{z(z + 1)}$
(b) $\\frac{z + 1}{z^2(z - 1)}$
(c) $\\frac{1}{z^4 + 1}$
(d) $\\frac{1}{(z^2 + 1)^2}$.""",
        "answer": "(a) $1 - e^{-t}$. (b) Partial fractions $\\frac{2}{z-1} - \\frac{2}{z} - \\frac{1}{z^2} \\implies 2e^t - 2 - t$. (d) $\\frac{1}{2}(\\sin t - t \\cos t)$."
    },
    {
        "id": "q-128",
        "number": 128,
        "title": "Solving ODE via Laplace Transform",
        "week": 10,
        "topic": "Fourier and Laplace transforms",
        "difficulty": 3,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["fourier-and-laplace-transforms"],
        "prompt": """Use the Laplace transform to solve the differential equation
$$\\frac{d^2u}{dt^2} + 4\\frac{du}{dt} + 3u = e^{-2t},$$
where $u : [0,\\infty) \\to \\mathbb{R}$ satisfies the initial conditions $u(0) = 0$ and $\\frac{du}{dt}(0) = 0$.""",
        "answer": "$(z^2 + 4z + 3)U(z) = \\frac{1}{z+2} \\implies U(z) = \\frac{1}{(z+1)(z+2)(z+3)} = \\frac{1/2}{z+1} - \\frac{1}{z+2} + \\frac{1/2}{z+3}$. Thus $u(t) = \\frac{1}{2}e^{-t} - e^{-2t} + \\frac{1}{2}e^{-3t}$."
    },
    {
        "id": "q-129",
        "number": 129,
        "title": "Volterra Integral Equations via Laplace Convolution",
        "week": 10,
        "topic": "Fourier and Laplace transforms",
        "difficulty": 3,
        "isDifficult": False,
        "isNonExaminable": False,
        "concepts": ["fourier-and-laplace-transforms"],
        "prompt": """Use the Laplace transform to find the solutions $u, v : [0,\\infty) \\to \\mathbb{R}$ to the integral equations:
$$u(t) = e^{-t} + \\int_0^t (t - s) e^{s-t} u(s) \\, ds$$
and
$$v(t) = e^{-t} + \\int_0^t (t - s)^2 v(s) \\, ds.$$""",
        "answer": "Notice the integrals are convolutions! For $u$: $U(z) = \\frac{1}{z+1} + \\frac{1}{(z+1)^2} U(z) \\implies U(z) = \\frac{z+1}{(z+1)^2 - 1} = \\frac{z+1}{z(z+2)} = \\frac{1/2}{z} + \\frac{1/2}{z+2}$. Inverting yields $u(t) = \\frac{1}{2} + \\frac{1}{2}e^{-2t}$."
    },

    # 22. Conformal mappings
    {
        "id": "q-130",
        "number": 130,
        "title": "Conformal Mapping w = cosh(z)",
        "week": 10,
        "topic": "Conformal mappings",
        "difficulty": 4,
        "isDifficult": True,
        "isNonExaminable": False,
        "concepts": ["mobius-transformations"],
        "prompt": """Suppose that $u \\in \\mathbb{R} \\setminus \\{0\\}$ and $v \\in \\mathbb{R}$. Show that as $y$ varies between $0$ and $\\pi/2$, the expression
$$\\frac{u^2}{\\cos^2 y} - \\frac{v^2}{\\sin^2 y} - 1$$
is increasing and changes sign, hence by the Intermediate Value Theorem there exists $y$ for which it is $0$. Now consider the mapping $w = \\cosh(z)$. Show that the region $\\{z \\in \\mathbb{C} : 0 < \\operatorname{Im}(z) < \\pi\\}$ is mapped bijectively and conformally onto $\\mathbb{C} \\setminus ((-\\infty, -1] \\cup [1,\\infty))$. Find a formula for the inverse function.""",
        "answer": "Inverse is given by the branch of $\\operatorname{arccosh}(w) = \\operatorname{Log}(w + \\sqrt{w^2 - 1})$."
    },
    {
        "id": "q-131",
        "number": 131,
        "title": "Classification of Bijective Conformal Automorphisms",
        "week": 10,
        "topic": "Conformal mappings",
        "difficulty": 4,
        "isDifficult": True,
        "isNonExaminable": False,
        "concepts": ["mobius-transformations", "cauchy-integral-formula"],
        "prompt": """Show that a bijective conformal mapping defined on the whole complex plane $\\mathbb{C}$ is affine ($f(z) = az + b$), and that a bijective conformal mapping defined on $\\mathbb{C} \\setminus \\{p\\}$, where $p \\in \\mathbb{C}$, is a fractional linear transformation.
Hint: By composing $f$ with an affine mapping, you can suppose that $f(0) = 0$ and $f'(0) = 1$. Try to show that $z \\mapsto (1/z) - (1/f(z))$ is holomorphic, bounded, and vanishes at $\\infty$, hence is 0.""",
        "answer": "Since $f$ is injective, $\\infty$ is an isolated singularity of $f$. By Casorati-Weierstrass, it cannot be essential (otherwise the image of a neighborhood of $\\infty$ would be dense and violate injectivity). So $\\infty$ is a pole. An entire function with a pole at $\\infty$ must be a polynomial. Being bijective, its degree must be 1, so $f(z) = az+b$."
    }
]

for q in questions:
    filepath = os.path.join(QUESTIONS_DIR, f"{q['id']}.md")
    frontmatter = f"""---
id: "{q['id']}"
number: {q['number']}
title: "{q['title']}"
week: {q['week']}
topic: "{q['topic']}"
difficulty: {q['difficulty']}
isDifficult: {str(q['isDifficult']).lower()}
isNonExaminable: {str(q['isNonExaminable']).lower()}
status: "Unattempted"
concepts: {json.dumps(q['concepts'])}
source: "UNSW MATH2621 Problem Sheet - Question {q['number']}"
snipUrl: ""
createdAt: "2026-11-06"
updatedAt: "2026-11-06"
---

### Prompt
{q['prompt']}

<!-- split:hints -->
### Hints & Key Steps
1. Identify the core concepts needed from **{q['topic']}**.
2. Work through the algebraic or geometric properties carefully.

<!-- split:solution -->
### My Solution
*Your solution working goes here...*

<!-- split:official -->
### Official Answer / Solution Notes
{q['answer']}
"""
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(frontmatter)

print(f"Generated {len(questions)} MATH2621 questions successfully!")
