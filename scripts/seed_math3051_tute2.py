#!/usr/bin/env python3
"""
seed_math3051_tute_sheets.py
Generates all remaining Tutorial Sheet questions (Sheets 2 through 7) for MATH3051
with full official teacher solutions from Thanh Tran.
"""

import os
import json

COURSE_DIR = r"C:\Users\User\course noting\courses\MATH3051"
QUESTIONS_DIR = os.path.join(COURSE_DIR, "questions")
os.makedirs(QUESTIONS_DIR, exist_ok=True)

TUTORIAL_QUESTIONS = [
    # =========================================================================
    # SHEET 2: Metric Spaces, Convergence sequences, Open & Closed sets (Week 2)
    # =========================================================================
    {
        "id": "tute-s02-q01",
        "number": 38,
        "title": "Definitions of Metric and Metric Space",
        "week": 2,
        "tier": "Assumed Knowledge",
        "difficulty": 1,
        "isDifficult": False,
        "topic": "Ch 2: Metric Spaces",
        "concepts": ["metric-topological-foundations"],
        "source": "Tutorial Sheet 02",
        "prompt": """Give the following definitions:

(a) A metric on a non-empty set $X$.
(b) A metric space.""",
        "solution": """(a) A **metric** on a non-empty set $X$ is a real-valued function $d : X \\times X \\to \\mathbb{R}$ satisfying for all $x, y, z \\in X$:
1. **Positive definiteness:** $d(x, y) \\ge 0$, and $d(x, y) = 0 \\iff x = y$.
2. **Symmetry:** $d(x, y) = d(y, x)$.
3. **Triangle inequality:** $d(x, y) \\le d(x, z) + d(z, y)$.

(b) A **metric space** is an ordered pair $(X, d)$ where $X$ is a non-empty set and $d$ is a metric defined on $X$."""
    },
    {
        "id": "tute-s02-q02",
        "number": 39,
        "title": "Fundamental Axioms of Metric Spaces (True or False)",
        "week": 2,
        "tier": "Assumed Knowledge",
        "difficulty": 2,
        "isDifficult": False,
        "topic": "Ch 2: Metric Spaces",
        "concepts": ["metric-topological-foundations"],
        "source": "Tutorial Sheet 02",
        "prompt": """Let $(X, d)$ be a metric space. Answer **True (T)** or **False (F)** to the following questions:

(a) $d(x, y) > 0$ for all $x, y \\in X$.
(b) $d(x, y) \\ge 0$ for all $x, y \\in X$.
(c) $d(x, y) = 0$ if and only if $x = y$.
(d) There exist $x, y \\in X$ such that $x \\ne y$ and $d(x, y) = 0$.
(e) $d(x, y) = d(y, x)$ for all $x, y \\in X$.
(f) $d(x, y) \\le d(x, z) + d(z, y)$ for all $x, y, z \\in X$.
(g) $d(x, y) \\le d(x, z) + d(y, z)$ for all $x, y, z \\in X$.""",
        "solution": """**(a) False.** When $x = y$, $d(x, x) = 0$, so it is not strictly positive everywhere.
**(b) True.** By definition of a metric, $d(x, y) \\ge 0$.
**(c) True.** This is the identity of indiscernibles.
**(d) False.** $d(x, y) = 0 \\implies x = y$.
**(e) True.** Symmetry axiom.
**(f) True.** Standard triangle inequality.
**(g) True.** By symmetry, $d(y, z) = d(z, y)$, so $d(x, z) + d(y, z) = d(x, z) + d(z, y) \\ge d(x, y)$."""
    },
    {
        "id": "tute-s02-q03",
        "number": 40,
        "title": "Metrics on Euclidean Space: l1, l2, and l-infinity",
        "week": 2,
        "tier": "Basic Knowledge",
        "difficulty": 3,
        "isDifficult": False,
        "topic": "Ch 2: Metric Spaces",
        "concepts": ["metric-topological-foundations"],
        "source": "Tutorial Sheet 02",
        "prompt": """Let $X = \\mathbb{R}^n$. Any points $\\mathbf{x}$ and $\\mathbf{y}$ in $X$ are represented as $\\mathbf{x} = (x_1, \\dots, x_n) \\in \\mathbb{R}^n$ and $\\mathbf{y} = (y_1, \\dots, y_n) \\in \\mathbb{R}^n$. Show that the following functions are metrics on $X$:

(a) $d_1(\\mathbf{x}, \\mathbf{y}) := \\sum_{i=1}^n |x_i - y_i|$
(b) $d_2(\\mathbf{x}, \\mathbf{y}) := \\left( \\sum_{i=1}^n |x_i - y_i|^2 \\right)^{1/2}$
(c) $d_\\infty(\\mathbf{x}, \\mathbf{y}) := \\max_{1 \\le i \\le n} |x_i - y_i|$""",
        "solution": """For all three, positive definiteness and symmetry follow immediately from properties of the absolute value $|\\cdot|$.

To prove the triangle inequality for (b) $d_2$:
Let $\\mathbf{x}, \\mathbf{y}, \\mathbf{z} \\in \\mathbb{R}^n$.
$$d_2^2(\\mathbf{x}, \\mathbf{y}) = \\sum_{i=1}^n (x_i - y_i)^2 = \\sum_{i=1}^n ((x_i - z_i) + (z_i - y_i))^2$$
$$= \\sum_{i=1}^n (x_i - z_i)^2 + 2 \\sum_{i=1}^n (x_i - z_i)(z_i - y_i) + \\sum_{i=1}^n (z_i - y_i)^2$$
Applying the Cauchy–Schwarz inequality:
$$\\sum_{i=1}^n a_i b_i \\le \\left( \\sum_{i=1}^n a_i^2 \\right)^{1/2} \\left( \\sum_{i=1}^n b_i^2 \\right)^{1/2}$$
gives:
$$d_2^2(\\mathbf{x}, \\mathbf{y}) \\le \\left( \\left( \\sum_{i=1}^n (x_i - z_i)^2 \\right)^{1/2} + \\left( \\sum_{i=1}^n (z_i - y_i)^2 \\right)^{1/2} \\right)^2 = (d_2(\\mathbf{x}, \\mathbf{z}) + d_2(\\mathbf{z}, \\mathbf{y}))^2$$
Taking square roots yields $d_2(\\mathbf{x}, \\mathbf{y}) \\le d_2(\\mathbf{x}, \\mathbf{z}) + d_2(\\mathbf{z}, \\mathbf{y})$.

For (a) and (c), the triangle inequality follows directly from $|x_i - y_i| \\le |x_i - z_i| + |z_i - y_i|$."""
    },
    {
        "id": "tute-s02-q04",
        "number": 41,
        "title": "The Modulus Metric on the Complex Numbers C",
        "week": 2,
        "tier": "Basic Knowledge",
        "difficulty": 3,
        "isDifficult": False,
        "topic": "Ch 2: Metric Spaces",
        "concepts": ["metric-topological-foundations"],
        "source": "Tutorial Sheet 02",
        "prompt": """Recall that the modulus of a complex number $z = a + ib$ is defined by $|z| = \\sqrt{a^2 + b^2}$.
Show that $(\\mathbb{C}, d)$ is a metric space, where $d(z_1, z_2) = |z_1 - z_2|$ for any $z_1, z_2 \\in \\mathbb{C}$.""",
        "solution": """Positive definiteness and symmetry are immediate from $|z| \\ge 0$ with $|z|=0 \\iff z=0$ and $|z_1 - z_2| = |-(z_2 - z_1)| = |z_2 - z_1|$.

To prove the triangle inequality, it suffices to show that $|z_1 + z_2| \\le |z_1| + |z_2|$:
$$|z_1 + z_2|^2 = (z_1 + z_2)\\overline{(z_1 + z_2)} = (z_1 + z_2)(\\bar{z}_1 + \\bar{z}_2)$$
$$= |z_1|^2 + (z_1 \\bar{z}_2 + z_2 \\bar{z}_1) + |z_2|^2 = |z_1|^2 + 2 \\mathrm{Re}(z_1 \\bar{z}_2) + |z_2|^2$$
$$\\le |z_1|^2 + 2|z_1 \\bar{z}_2| + |z_2|^2 = |z_1|^2 + 2|z_1||z_2| + |z_2|^2 = (|z_1| + |z_2|)^2$$
Taking square roots yields $|z_1 + z_2| \\le |z_1| + |z_2|$. Setting $z_1 = x - z$ and $z_2 = z - y$ gives $d(x, y) \\le d(x, z) + d(z, y)$."""
    },
    {
        "id": "tute-s02-q05",
        "number": 42,
        "title": "The Discrete Metric Space",
        "week": 2,
        "tier": "Basic Knowledge",
        "difficulty": 3,
        "isDifficult": False,
        "topic": "Ch 2: Metric Spaces",
        "concepts": ["metric-topological-foundations"],
        "source": "Tutorial Sheet 02",
        "prompt": """Let $X$ be an arbitrary non-empty set, and define $d(\\cdot, \\cdot)$ by
$$d(x, y) = \\begin{cases} 0 & \\text{if } x = y, \\\\ 1 & \\text{if } x \\ne y. \\end{cases}$$
Prove that $(X, d)$ is a metric space. (This metric $d$ is called the **discrete metric**).""",
        "solution": """Positive definiteness and symmetry are obvious.
It suffices to prove the triangle inequality $d(x, y) \\le d(x, z) + d(z, y)$ for $x, y, z \\in X$:

- **Case 1: $x = y$.**
  Then $d(x, y) = 0 \\le d(x, z) + d(z, y)$ (since both terms are $\\ge 0$).
- **Case 2: $x \\ne y$.**
  Then any point $z \\in X$ cannot be simultaneously equal to both $x$ and $y$. Thus at least one of $z \\ne x$ or $z \\ne y$ must hold.
  Therefore, $d(x, z) + d(z, y) \\ge 1 = d(x, y)$.

Hence the triangle inequality holds in all cases."""
    },
    {
        "id": "tute-s02-q06",
        "number": 43,
        "title": "Reverse and Quadruple Triangle Inequalities",
        "week": 2,
        "tier": "Basic Knowledge",
        "difficulty": 3,
        "isDifficult": False,
        "topic": "Ch 2: Metric Spaces",
        "concepts": ["metric-topological-foundations"],
        "source": "Tutorial Sheet 02",
        "prompt": """Let $(X, d)$ be a metric space. Prove the following inequalities:

(a) For any $x, y, z \\in X$:
$$|d(x, z) - d(y, z)| \\le d(x, y)$$

(b) For any $x, y, u, v \\in X$:
$$|d(x, y) - d(u, v)| \\le d(x, u) + d(y, v)$$""",
        "solution": """**(a)** By the triangle inequality:
$$d(x, z) \\le d(x, y) + d(y, z) \\implies d(x, z) - d(y, z) \\le d(x, y)$$
Similarly, interchanging $x$ and $y$:
$$d(y, z) \\le d(y, x) + d(x, z) = d(x, y) + d(x, z) \\implies -(d(x, z) - d(y, z)) \\le d(x, y)$$
Combining these two yields $|d(x, z) - d(y, z)| \\le d(x, y)$.

**(b)** Using the triangle inequality and symmetry:
$$d(x, y) \\le d(x, u) + d(u, y) \\le d(x, u) + d(u, v) + d(v, y) = d(x, u) + d(u, v) + d(y, v)$$
$$\\implies d(x, y) - d(u, v) \\le d(x, u) + d(y, v)$$
Similarly:
$$d(u, v) - d(x, y) \\le d(u, x) + d(v, y) = d(x, u) + d(y, v)$$
Combining both bounds gives $|d(x, y) - d(u, v)| \\le d(x, u) + d(y, v)$."""
    },
    {
        "id": "tute-s02-q07",
        "number": 44,
        "title": "Constructing Bounded Metrics via d / (1 + d)",
        "week": 2,
        "tier": "Advanced Knowledge",
        "difficulty": 5,
        "isDifficult": True,
        "topic": "Ch 2: Metric Spaces",
        "concepts": ["metric-topological-foundations"],
        "source": "Tutorial Sheet 02",
        "prompt": """Let $(X, d)$ be a metric space. Define
$$d_1(x, y) = \\frac{d(x, y)}{1 + d(x, y)} \\quad \\forall x, y \\in X.$$
Show that $d_1(\\cdot, \\cdot)$ is also a metric on $X$.""",
        "solution": """Positive definiteness and symmetry are immediate from the properties of $d$.
It remains to show the triangle inequality: $d_1(x, y) \\le d_1(x, z) + d_1(z, y)$.
Consider the difference:
$$d_1(x, z) + d_1(z, y) - d_1(x, y) = \\frac{d(x, z)}{1 + d(x, z)} + \\frac{d(z, y)}{1 + d(z, y)} - \\frac{d(x, y)}{1 + d(x, y)} = \\frac{A}{[1 + d(x, z)][1 + d(z, y)][1 + d(x, y)]}$$
where:
$$A := d(x, z)(1 + d(z, y))(1 + d(x, y)) + d(z, y)(1 + d(x, z))(1 + d(x, y)) - d(x, y)(1 + d(x, z))(1 + d(z, y))$$
Expanding and collecting terms:
$$A = [d(x, z) + d(z, y) - d(x, y)] + 2d(x, z)d(z, y) + d(x, y)d(x, z)d(z, y)$$
Since $d$ is a metric, $d(x, z) + d(z, y) - d(x, y) \\ge 0$, and all other products are non-negative.
Therefore, $A \\ge 0$, which proves that $d_1(x, y) \\le d_1(x, z) + d_1(z, y)$."""
    },
    {
        "id": "tute-s02-q08",
        "number": 45,
        "title": "Axiom Reduction & Pseudo-Metrics",
        "week": 2,
        "tier": "Advanced Knowledge",
        "difficulty": 5,
        "isDifficult": True,
        "topic": "Ch 2: Metric Spaces",
        "concepts": ["metric-topological-foundations"],
        "source": "Tutorial Sheet 02",
        "prompt": """Let $X$ be a non-empty set.

(a) Prove that a function $d : X \\times X \\to \\mathbb{R}$ satisfying for all $x, y, z \\in X$:
$$d(x, y) = 0 \\iff x = y$$
$$d(x, y) \\le d(x, z) + d(y, z)$$
is a metric on $X$.

(b) Prove that a function $\\delta : X \\times X \\to \\mathbb{R}$ satisfying:
- $\\delta(x, y) \\ge 0$
- $x = y \\implies \\delta(x, y) = 0$
- $\\delta(x, y) = \\delta(y, x)$
- $\\delta(x, y) \\le \\delta(x, z) + \\delta(z, y)$
is not necessarily a metric on $X$ (such a function is called a **pseudo-metric**).""",
        "solution": """**(a)** 
1. **Symmetry:** Setting $z = x$ in the hypothesis gives $d(x, y) \\le d(x, x) + d(y, x) = 0 + d(y, x) = d(y, x)$. Interchanging $x$ and $y$ gives $d(y, x) \\le d(x, y)$, hence $d(x, y) = d(y, x)$.
2. **Triangle Inequality:** By symmetry, $d(y, z) = d(z, y)$, so $d(x, y) \\le d(x, z) + d(z, y)$.
3. **Non-negativity:** Setting $y = x$ gives $0 = d(x, x) \\le d(x, z) + d(x, z) = 2d(x, z) \\implies d(x, z) \\ge 0$.
Hence $d$ is a metric.

**(b)** The missing axiom is the strict definiteness $\\delta(x, y) = 0 \\implies x = y$.
**Counterexample:** Let $X = C^1([0, 1])$ and define:
$$\\delta(x, y) = \\max_{0 \\le t \\le 1} |x'(t) - y'(t)|$$
Then $\\delta(x, y) \\ge 0$, is symmetric, and satisfies the triangle inequality.
However, if $x(t) = 1$ and $y(t) = 2$, then $x \\ne y$ but $x'(t) = y'(t) = 0$, so $\\delta(x, y) = 0$. Thus $\\delta$ is a pseudo-metric but not a metric."""
    },
    {
        "id": "tute-s02-q09",
        "number": 46,
        "title": "Definition of Sequence Convergence in Metric Spaces",
        "week": 2,
        "tier": "Assumed Knowledge",
        "difficulty": 1,
        "isDifficult": False,
        "topic": "Ch 2: Convergence Sequences",
        "concepts": ["metric-topological-foundations"],
        "source": "Tutorial Sheet 02",
        "prompt": """Let $\{x_n\}$ be a sequence in a metric space $(X, d)$. Write down the definition of $x_n \\to x$ in $X$.""",
        "solution": """A sequence $\{x_n\}$ converges to $x \\in X$ (denoted $x_n \\to x$ or $\\lim_{n \\to \\infty} x_n = x$) if:
$$\\forall \\epsilon > 0, \\; \\exists N \\in \\mathbb{N} \\quad \\text{such that} \\quad n > N \\implies d(x_n, x) < \\epsilon.$$
Equivalently, $\\lim_{n \\to \\infty} d(x_n, x) = 0$ in $\\mathbb{R}$."""
    },
    {
        "id": "tute-s02-q10",
        "number": 47,
        "title": "Uniqueness of Limits in Metric Spaces",
        "week": 2,
        "tier": "Basic Knowledge",
        "difficulty": 3,
        "isDifficult": False,
        "topic": "Ch 2: Convergence Sequences",
        "concepts": ["metric-topological-foundations"],
        "source": "Tutorial Sheet 02",
        "prompt": """Show that the limit of a convergent sequence $\{x_k\}$ in a metric space $(X, d)$ is unique.""",
        "solution": """Assume $\{x_k\}$ converges to both $x$ and $y$ in $X$.
By the triangle inequality:
$$0 \\le d(x, y) \\le d(x, x_k) + d(x_k, y)$$
Taking the limit as $k \\to \\infty$:
$$0 \\le d(x, y) \\le \\lim_{k \\to \\infty} d(x, x_k) + \\lim_{k \\to \\infty} d(x_k, y) = 0 + 0 = 0$$
Hence $d(x, y) = 0$, which by positive definiteness implies $x = y$."""
    },
    {
        "id": "tute-s02-q11",
        "number": 48,
        "title": "Continuity of the Metric Function",
        "week": 2,
        "tier": "Basic Knowledge",
        "difficulty": 3,
        "isDifficult": False,
        "topic": "Ch 2: Convergence Sequences",
        "concepts": ["metric-topological-foundations"],
        "source": "Tutorial Sheet 02",
        "prompt": """Let $\{x_k\}$ and $\{y_k\}$ be two sequences in $(X, d)$ which converge to $x$ and $y$, respectively.
Show that $d(x_k, y_k) \\to d(x, y)$ as $k \\to \\infty$.""",
        "solution": """By the quadruple triangle inequality proved in Q6(b):
$$|d(x_k, y_k) - d(x, y)| \\le d(x_k, x) + d(y_k, y)$$
Since $x_k \\to x$ and $y_k \\to y$, we have $d(x_k, x) \\to 0$ and $d(y_k, y) \\to 0$ as $k \\to \\infty$.
By the squeeze theorem:
$$0 \\le \\lim_{k \\to \\infty} |d(x_k, y_k) - d(x, y)| \\le 0 \\implies \\lim_{k \\to \\infty} d(x_k, y_k) = d(x, y).$$"""
    },
    {
        "id": "tute-s02-q12",
        "number": 49,
        "title": "Topological Definitions: Balls, Open/Closed Sets, Points",
        "week": 2,
        "tier": "Assumed Knowledge",
        "difficulty": 2,
        "isDifficult": False,
        "topic": "Ch 2: Open and Closed Sets",
        "concepts": ["metric-topological-foundations"],
        "source": "Tutorial Sheet 02",
        "prompt": """Give the following definitions in a metric space $(X, d)$:

(a) Open and closed balls in $(X, d)$.
(b) Open and closed sets in $(X, d)$.
(c) An interior point of a subset $A \\subseteq X$.
(d) A limit point, isolated point, contact point, and boundary point of a set $A \\subseteq X$.""",
        "solution": """(a) 
- **Open ball:** $B_r(x) := \\{y \\in X : d(x, y) < r\\}$, for $r > 0$.
- **Closed ball:** $\\bar{B}_r(x) := \\{y \\in X : d(x, y) \\le r\\}$, for $r > 0$.

(b) 
- A set $G \\subseteq X$ is **open** if for every $x \\in G$, there exists $r > 0$ such that $B_r(x) \\subseteq G$.
- A set $F \\subseteq X$ is **closed** if its complement $F^c = X \\setminus F$ is open (or equivalently, if it contains all its limit points).

(c) A point $a \\in A$ is an **interior point** of $A$ if there exists $r > 0$ such that $B_r(a) \\subseteq A$.

(d) 
- **Limit point (accumulation point):** $x \\in X$ is a limit point of $A$ if every open ball $B_r(x)$ contains a point in $A \\setminus \\{x\\}$.
- **Isolated point:** $x \\in A$ is an isolated point if there exists $r > 0$ such that $B_r(x) \\cap A = \\{x\\}$.
- **Contact point (adherent point):** $x \\in X$ is a contact point of $A$ if every open ball $B_r(x)$ intersects $A$.
- **Boundary point:** $x \\in X$ is a boundary point of $A$ if every open ball $B_r(x)$ contains at least one point of $A$ and at least one point of $A^c$."""
    },
    {
        "id": "tute-s02-q13",
        "number": 50,
        "title": "Arbitrary and Finite Unions/Intersections of Open and Closed Sets",
        "week": 2,
        "tier": "Assumed Knowledge",
        "difficulty": 2,
        "isDifficult": False,
        "topic": "Ch 2: Open and Closed Sets",
        "concepts": ["metric-topological-foundations"],
        "source": "Tutorial Sheet 02",
        "prompt": """Let $(X, d)$ be a metric space. Answer **True (T)** or **False (F)** to each of the following:

(a) A subset $A$ of $X$ is closed if its complement is open.
(b) A subset $A$ of $X$ is closed if and only if its complement is open.
(c) If a subset $A$ of $X$ is not closed, then it is open.
(d) The union of a finite number of open sets in $X$ is open.
(e) The union of a countable family of open sets in $X$ is open.
(f) The union of an uncountable family of open sets in $X$ is open.
(g) The intersection of a finite number of open sets in $X$ is open.
(h) The intersection of a countable family of open sets in $X$ is open.
(i) The intersection of an uncountable family of open sets in $X$ is open.
(j) The union of a finite number of closed sets in $X$ is closed.
(k) The union of a countable family of closed sets in $X$ is closed.
(l) The union of an uncountable family of closed sets in $X$ is closed.
(m) The intersection of a finite number of closed sets in $X$ is closed.
(n) The intersection of a countable family of closed sets in $X$ is closed.
(o) The intersection of an uncountable family of closed sets in $X$ is closed.""",
        "solution": """- (a) **T**
- (b) **T** (Standard definition)
- (c) **F** (Sets like $[0, 1)$ in $\\mathbb{R}$ are neither open nor closed)
- (d) **T**
- (e) **T**
- (f) **T** (Arbitrary unions of open sets are open)
- (g) **T** (Finite intersections of open sets are open)
- (h) **F** (Counterexample: $\\bigcap_{n=1}^\\infty (-1/n, 1/n) = \\{0\\}$, which is closed)
- (i) **F**
- (j) **T** (Finite unions of closed sets are closed)
- (k) **F** (Counterexample: $\\bigcup_{n=1}^\\infty [1/n, 1] = (0, 1]$, not closed)
- (l) **F**
- (m) **T**
- (n) **T**
- (o) **T** (Arbitrary intersections of closed sets are closed)"""
    },
    {
        "id": "tute-s02-q14",
        "number": 51,
        "title": "Definitions of Interior and Closure",
        "week": 2,
        "tier": "Assumed Knowledge",
        "difficulty": 2,
        "isDifficult": False,
        "topic": "Ch 2: Open and Closed Sets",
        "concepts": ["metric-topological-foundations"],
        "source": "Tutorial Sheet 02",
        "prompt": """Let $(X, d)$ be a metric space and $A \\subseteq X$.

(a) Give the definition of the interior of $A$.
(b) Give the definition of the closure of $A$.""",
        "solution": """(a) The **interior** of $A$, denoted $\\mathring{A}$ or $\\mathrm{Int}(A)$, is the set of all interior points of $A$. Equivalently, it is the largest open set contained in $A$, or the union of all open subsets of $A$.

(b) The **closure** of $A$, denoted $\\bar{A}$ or $\\mathrm{Cl}(A)$, is the set of all contact points of $A$. Equivalently, it is the smallest closed set containing $A$, or the intersection of all closed sets containing $A$."""
    },
    {
        "id": "tute-s02-q15",
        "number": 52,
        "title": "Properties of Interior, Limit, and Boundary Points (T/F)",
        "week": 2,
        "tier": "Assumed Knowledge",
        "difficulty": 2,
        "isDifficult": False,
        "topic": "Ch 2: Open and Closed Sets",
        "concepts": ["metric-topological-foundations"],
        "source": "Tutorial Sheet 02",
        "prompt": """Let $(X, d)$ be a metric space and $A \\subseteq X$. Answer **True (T)** or **False (F)**:

(a) If $a$ is an interior point of $A$, then $a \\in A$.
(b) $\\mathring{A} \\subseteq A$.
(c) $\\mathring{A} = A$ if and only if $A$ is open.
(d) A limit point of $A$ is a contact point of $A$.
(e) A contact point of $A$ is a limit point of $A$.
(f) If $a$ is a limit point of $A$, then $a \\in A$.
(g) If $a$ is a limit point of $A$, then $a \\notin A$.
(h) A boundary point of $A$ is a limit point of $A$.
(i) $\\bar{A} = A$ if and only if $A$ is closed.
(j) The boundary of $A$ is closed.""",
        "solution": """(a) **T** (Every interior point belongs to $A$).
(b) **T** (Interior is always a subset of $A$).
(c) **T** (A set is open iff every point is an interior point).
(d) **T** (Any ball around a limit point intersects $A \\setminus \\{x\\} \\subset A$).
(e) **F** (An isolated point of $A$ is a contact point but not a limit point).
(f) **F** ($0$ is a limit point of $(0, 1)$, but $0 \\notin (0, 1)$).
(g) **F** ($0$ is a limit point of $[0, 1]$, and $0 \\in [0, 1]$).
(h) **F** (An isolated point of $A$ is in $\\partial A$, but is not a limit point).
(i) **T** (A set is closed iff it equals its closure).
(j) **T** (The boundary is $\\partial A = \\bar{A} \\cap \\overline{A^c}$, the intersection of two closed sets, hence closed)."""
    },
    {
        "id": "tute-s02-q16",
        "number": 53,
        "title": "Hierarchy of Interior, Set, and Closure",
        "week": 2,
        "tier": "Assumed Knowledge",
        "difficulty": 2,
        "isDifficult": False,
        "topic": "Ch 2: Open and Closed Sets",
        "concepts": ["metric-topological-foundations"],
        "source": "Tutorial Sheet 02",
        "prompt": """Which of the following statement(s) is (are) correct?

(1) $\\bar{A} \\subseteq \\mathring{A} \\subseteq A$
(2) $\\mathring{A} \\subseteq A \\subseteq \\bar{A}$
(3) $\\mathring{A} \\subseteq \\bar{A} \\subseteq A$
(4) $\\bar{A} \\subseteq A \\subseteq \\mathring{A}$""",
        "solution": """**Statement (2) is correct:**
$$\\mathring{A} \\subseteq A \\subseteq \\bar{A}$$
- The interior $\\mathring{A}$ consists only of points strictly inside $A$, so $\\mathring{A} \\subseteq A$.
- The closure $\\bar{A}$ contains $A$ plus all contact points of $A$, so $A \\subseteq \\bar{A}$."""
    },
    {
        "id": "tute-s02-q17",
        "number": 54,
        "title": "Geometry of Unit Balls in R2",
        "week": 2,
        "tier": "Basic Knowledge",
        "difficulty": 3,
        "isDifficult": False,
        "topic": "Ch 2: Open and Closed Sets",
        "concepts": ["metric-topological-foundations"],
        "source": "Tutorial Sheet 02",
        "prompt": """Draw or describe the geometry of the open unit balls $B_1(\\mathbf{0})$ in $(\\mathbb{R}^2, d_1)$, $(\\mathbb{R}^2, d_2)$, and $(\\mathbb{R}^2, d_\\infty)$ where $\\mathbf{0} = (0, 0)$.""",
        "solution": """- **In $(\\mathbb{R}^2, d_1)$:**
  $B_1(\\mathbf{0}) = \\{(x_1, x_2) : |x_1| + |x_2| < 1\\}$.
  This is an open square / diamond rotated at $45^\\circ$ with vertices at $(1, 0), (0, 1), (-1, 0), (0, -1)$.

- **In $(\\mathbb{R}^2, d_2)$:**
  $B_1(\\mathbf{0}) = \\{(x_1, x_2) : x_1^2 + x_2^2 < 1\\}$.
  This is the standard open Euclidean circular disk with radius $1$.

- **In $(\\mathbb{R}^2, d_\\infty)$:**
  $B_1(\\mathbf{0}) = \\{(x_1, x_2) : \\max(|x_1|, |x_2|) < 1\\} = (-1, 1) \\times (-1, 1)$.
  This is an open axis-aligned square of side length $2$ centered at the origin."""
    },
    {
        "id": "tute-s02-q18",
        "number": 55,
        "title": "Open Balls are Open and Closed Balls are Closed",
        "week": 2,
        "tier": "Basic Knowledge",
        "difficulty": 3,
        "isDifficult": False,
        "topic": "Ch 2: Open and Closed Sets",
        "concepts": ["metric-topological-foundations"],
        "source": "Tutorial Sheet 02",
        "prompt": """Show that in any metric space $(X, d)$:

(a) An open ball is open.
(b) A closed ball is closed.""",
        "solution": """**(a)** Let $B_r(x_0)$ be an open ball in $X$ and let $x \\in B_r(x_0)$.
Then $d(x, x_0) < r$. Define $r' = r - d(x, x_0) > 0$.
We show $B_{r'}(x) \\subseteq B_r(x_0)$.
For any $y \\in B_{r'}(x)$, by the triangle inequality:
$$d(y, x_0) \\le d(y, x) + d(x, x_0) < r' + d(x, x_0) = (r - d(x, x_0)) + d(x, x_0) = r$$
Hence $y \\in B_r(x_0)$, proving $B_{r'}(x) \\subseteq B_r(x_0)$. Thus $B_r(x_0)$ is open.

**(b)** To show $\\bar{B}_r(x_0)$ is closed, we show its complement $U = X \\setminus \\bar{B}_r(x_0) = \\{y \\in X : d(y, x_0) > r\\}$ is open.
Let $x \\in U$, so $d(x, x_0) > r$. Set $\\rho = d(x, x_0) - r > 0$.
For any $y \\in B_\\rho(x)$:
$$d(y, x_0) \\ge d(x, x_0) - d(x, y) > d(x, x_0) - \\rho = r$$
Thus $y \\in U$, which implies $B_\\rho(x) \\subseteq U$. Hence $U$ is open, so $\\bar{B}_r(x_0)$ is closed."""
    },
    {
        "id": "tute-s02-q19",
        "number": 56,
        "title": "Infinite Union of Closed Sets Counterexample",
        "week": 2,
        "tier": "Basic Knowledge",
        "difficulty": 3,
        "isDifficult": False,
        "topic": "Ch 2: Open and Closed Sets",
        "concepts": ["metric-topological-foundations"],
        "source": "Tutorial Sheet 02",
        "prompt": """Show by giving a counterexample that the union of an infinite number of closed sets may not be closed.""",
        "solution": """Consider the real line $\\mathbb{R}$ with the usual metric.
For each $n \\in \\mathbb{N}$, let $F_n = [1/n, 1]$. Each $F_n$ is a closed and bounded interval, hence closed in $\\mathbb{R}$.
However, the countable union is:
$$\\bigcup_{n=1}^\\infty F_n = \\bigcup_{n=1}^\\infty [1/n, 1] = (0, 1]$$
The interval $(0, 1]$ is not closed in $\\mathbb{R}$, because $0$ is a limit point of $(0, 1]$ but $0 \\notin (0, 1]$.
Alternatively, singletons $\\{1/n\\}$ are closed sets, but $\\bigcup_{n=1}^\\infty \\{1/n\\} = \\{1, 1/2, 1/3, \\dots\\}$ is not closed because $0$ is a limit point not in the set."""
    },
    {
        "id": "tute-s02-q20",
        "number": 57,
        "title": "Exhaustive Topology Analysis of the Harmonic Sequence Set",
        "week": 2,
        "tier": "Advanced Knowledge",
        "difficulty": 5,
        "isDifficult": True,
        "topic": "Ch 2: Open and Closed Sets",
        "concepts": ["metric-topological-foundations"],
        "source": "Tutorial Sheet 02",
        "prompt": """Consider the metric space $\\mathbb{R}$ with the usual metric and let $A = \\{1, 1/2, 1/3, 1/4, \\dots\\} = \\{1/n : n \\in \\mathbb{N}\\}$.

(a) Find $\\mathring{A}$. Explain your answer.
(b) Find all the limit points of $A$. Explain your answer.
(c) Find all the isolated points of $A$. Explain your answer.
(d) Hence, find $\\bar{A}$.
(e) Find the interior $\\mathrm{Int}(A^c)$ of $A^c$. Explain your answer.
(f) Find the closure $\\mathrm{Cl}(A^c)$ of $A^c$. Explain your answer.
(g) Find all the boundary points of $A$. Explain your answer.""",
        "solution": """**(a)** $\\mathring{A} = \\emptyset$.
For any $a = 1/n \\in A$ and any $r > 0$, the interval $(a - r, a + r)$ contains irrational numbers, which do not belong to $A$. Thus no ball $B_r(a)$ is contained in $A$.

**(b)** The only limit point of $A$ is $0$.
- For any $r > 0$, by the Archimedean property there exists $n \\in \\mathbb{N}$ such that $1/n < r$. Thus $(-r, r) \\cap A \\ne \\emptyset$, so $0$ is a limit point.
- For any $x \\ne 0$:
  - If $x < 0$, choose $r = -x > 0$, then $(x-r, x+r) = (2x, 0)$ contains no points of $A$.
  - If $x > 1$, choose $r = x - 1 > 0$, then $(x-r, x+r)$ contains no points of $A$.
  - If $0 < x \\le 1$ and $x = 1/n$, choose $r = \\min(1/n - 1/(n+1), 1/(n-1) - 1/n) = 1/(n(n+1))$, so $(x-r, x+r) \\cap A = \\{1/n\\}$, containing no points of $A$ different from $x$.
  - If $0 < x < 1$ and $x \\notin A$, $x$ lies strictly between $1/(n+1)$ and $1/n$, so we can choose $r = \\min(x - 1/(n+1), 1/n - x) > 0$.

**(c)** Every point of $A$ is an isolated point, because $0$ is the only limit point and $0 \\notin A$.

**(d)** $\\bar{A} = A \\cup \\{0\\} = \\{0, 1, 1/2, 1/3, \\dots\\}$.

**(e)** $\\mathrm{Int}(A^c) = A^c \\setminus \\{0\\} = \\mathbb{R} \\setminus (A \\cup \\{0\\})$.
Since $0$ is a limit point of $A$, every neighborhood of $0$ intersects $A$, so $0$ cannot be an interior point of $A^c$. For all other points of $A^c$, we found an open neighborhood disjoint from $A$.

**(f)** $\\mathrm{Cl}(A^c) = \\mathbb{R}$.
For any $1/n \\in A$ and any $r > 0$, $(1/n - r, 1/n + r)$ contains points not in $A$. Thus every point of $A$ is a limit point of $A^c$. Hence $\\mathrm{Cl}(A^c) = A^c \\cup A = \\mathbb{R}$.

**(g)** $\\partial A = \\bar{A} \\cap \\mathrm{Cl}(A^c) = (A \\cup \\{0\\}) \\cap \\mathbb{R} = A \\cup \\{0\\}$.
Note that for this set, $\\partial A$ is strictly larger than $A$ itself."""
    },
    {
        "id": "tute-s02-q21",
        "number": 58,
        "title": "Boundaries of Semi-Open Intervals with Isolated Points",
        "week": 2,
        "tier": "Advanced Knowledge",
        "difficulty": 4,
        "isDifficult": False,
        "topic": "Ch 2: Open and Closed Sets",
        "concepts": ["metric-topological-foundations"],
        "source": "Tutorial Sheet 02",
        "prompt": """Consider the metric space $\\mathbb{R}$ with the usual metric. Let
$$A = (0, 1) \\cup \\{2\\} \\quad \\text{and} \\quad B = [0, 1) \\cup \\{2\\}.$$
Find $\\partial A$ and $\\partial B$.""",
        "solution": """Recall $\\partial S = \\bar{S} \\cap \\overline{S^c} = \\bar{S} \\setminus \\mathring{S}$.

- For $A = (0, 1) \\cup \\{2\\}$:
  - $\\bar{A} = [0, 1] \\cup \\{2\\}$
  - $\\mathring{A} = (0, 1)$
  - $\\partial A = \\bar{A} \\setminus \\mathring{A} = \\{0, 1, 2\\}$.

- For $B = [0, 1) \\cup \\{2\\}$:
  - $\\bar{B} = [0, 1] \\cup \\{2\\}$
  - $\\mathring{B} = (0, 1)$
  - $\\partial B = \\bar{B} \\setminus \\mathring{B} = \\{0, 1, 2\\}$.

Thus $\\partial A = \\partial B = \\{0, 1, 2\\}$."""
    },
    {
        "id": "tute-s02-q22",
        "number": 59,
        "title": "Open Sets as Unions of Open Balls",
        "week": 2,
        "tier": "Advanced Knowledge",
        "difficulty": 4,
        "isDifficult": False,
        "topic": "Ch 2: Open and Closed Sets",
        "concepts": ["metric-topological-foundations"],
        "source": "Tutorial Sheet 02",
        "prompt": """Let $X$ be a metric space and $G$ a non-empty subset of $X$. Show that $G$ is open if and only if $G$ is a union of open balls in $X$.""",
        "solution": """$(\\implies)$ Assume $G$ is open.
By definition, for every $x \\in G$, there exists $r_x > 0$ such that $B_{r_x}(x) \\subseteq G$.
Then:
$$G = \\bigcup_{x \\in G} \\{x\\} \\subseteq \\bigcup_{x \\in G} B_{r_x}(x) \\subseteq G$$
Therefore, $G = \\bigcup_{x \\in G} B_{r_x}(x)$, which is a union of open balls.

$(\\impliedby)$ Conversely, assume $G = \\bigcup_{i \\in I} B_{r_i}(x_i)$.
By Exercise Q18(a), every open ball is an open set.
Since an arbitrary union of open sets is open (Theorem 2.3.7), $G$ is open."""
    }
]

def main():
    print(f"Writing {len(TUTORIAL_QUESTIONS)} questions for Tutorial Sheet 2...")
    for q in TUTORIAL_QUESTIONS:
        filepath = os.path.join(QUESTIONS_DIR, f"{q['id']}.md")
        frontmatter = {
            "id": q["id"],
            "number": q["number"],
            "title": f"Tute 2 Q{q['id'].split('q')[-1]}: {q['title']}",
            "week": q["week"],
            "topic": q["topic"],
            "tier": q["tier"],
            "difficulty": q["difficulty"],
            "isDifficult": q["isDifficult"],
            "isNonExaminable": False,
            "status": "Unattempted",
            "concepts": q["concepts"],
            "source": q["source"],
            "starred": False,
            "createdAt": "2026-11-07T00:00:00.000Z",
            "updatedAt": "2026-11-07T00:00:00.000Z"
        }
        content = f"""---
{json.dumps(frontmatter, indent=2)}
---

{q['prompt']}

<!-- split:hints -->
*Refer to Chapter 2 lecture slides and definitions in the connected Concept guide.*

<!-- split:solution -->


<!-- split:official -->
{q['solution']}
"""
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Created {q['id']}.md (Q{q['number']})")

if __name__ == "__main__":
    main()
