#!/usr/bin/env python3
"""
seed_math3051_tute4.py
Generates Tutorial Sheet 4 questions (Q2 to Q9, numbering Q79 to Q86)
for MATH3051 with full official teacher solutions from Thanh Tran.
"""

import os
import json

COURSE_DIR = r"C:\Users\User\course noting\courses\MATH3051"
QUESTIONS_DIR = os.path.join(COURSE_DIR, "questions")
os.makedirs(QUESTIONS_DIR, exist_ok=True)

TUTORIAL_QUESTIONS = [
    {
        "id": "tute-s04-q02",
        "number": 79,
        "title": "Characterisations of Continuous Mappings (True or False)",
        "week": 4,
        "tier": "Assumed Knowledge",
        "difficulty": 2,
        "isDifficult": False,
        "topic": "Ch 2 & 3: Continuity in Metric Spaces",
        "concepts": ["metric-topological-foundations"],
        "source": "Tutorial Sheet 04",
        "prompt": r"""Let $X$ and $Y$ be two metric spaces, and $f : X \to Y$ be a mapping. Answer **True (T)** or **False (F)**:

(a) $f$ is continuous at $x_0 \in X$ if and only if for any sequence $\{y_n\}$ in $Y$, if $y_n \to y_0 = f(x_0)$ in $Y$ then $f^{-1}(y_n) \to f^{-1}(y_0)$ in $X$.
(b) $f$ is continuous at $x_0 \in X$ if and only if for any sequence $\{x_n\}$ in $X$, if $x_n \to x_0$ then $f(x_n) \to f(x_0)$ in $Y$ as $n \to \infty$.
(c) $f$ is continuous at $x_0 \in X$ if and only if for any open ball $B_r(f(x_0))$, there exists an open ball $B_\rho(x_0)$ such that:
$$f(B_r(f(x_0))) \subseteq B_\rho(x_0).$$
(d) $f$ is continuous at $x_0 \in X$ if and only if for any open ball $B_r(f(x_0))$, there exists an open ball $B_\rho(x_0)$ such that:
$$f(B_\rho(x_0)) \subseteq B_r(f(x_0)).$$
(e) $f$ is continuous on $X$ if and only if for any sequence $\{x_n\}$ in $X$, if $x_n \to x$ then $f(x_n) \to f(x)$.
(f) $f$ is continuous on $X$ if and only if $f(G)$ is open in $Y$ whenever $G$ is open in $X$.
(g) $f$ is continuous on $X$ if and only if $f^{-1}(G)$ is open in $X$ whenever $G$ is open in $Y$.""",
        "solution": r"""(a) **False.** Continuity is a forward condition on points and sequences in $X$, not backwards from $Y$.
(b) **True.** Sequential characterisation of continuity in metric spaces.
(c) **False.** The inclusion is in the wrong direction.
(d) **True.** Ball-based $(\epsilon, \delta)$ characterisation: $B_\rho(x_0)$ maps inside $B_r(f(x_0))$.
(e) **True.** $f$ is continuous on $X$ iff it is continuous at every $x \in X$.
(f) **False.** Continuous maps do not always map open sets to open sets (e.g. constant function $f(x) = c$).
(g) **True.** Topological definition: preimage of open sets is open."""
    },
    {
        "id": "tute-s04-q03",
        "number": 80,
        "title": "Cauchy Sequences and Completeness (True or False)",
        "week": 4,
        "tier": "Assumed Knowledge",
        "difficulty": 2,
        "isDifficult": False,
        "topic": "Ch 2: Cauchy Sequences & Completeness",
        "concepts": ["metric-topological-foundations"],
        "source": "Tutorial Sheet 04",
        "prompt": r"""Let $(X, d)$ be a metric space. Answer **True (T)** or **False (F)**:

(a) $\{x_n\}$ is a Cauchy sequence in $X$ if and only if:
$$\forall \epsilon > 0, \; \exists N > 0 : m, n > N \implies d(x_m, x_n) < \epsilon.$$
(b) $\{x_n\}$ is a Cauchy sequence in $X$ if and only if $d(x_m, x_n) \to 0$ as $m, n \to \infty$.
(c) A Cauchy sequence is convergent.
(d) A convergent sequence is a Cauchy sequence.
(e) If a sequence $\{x_n\}$ converges to $x$ in $X$, then every subsequence of $\{x_n\}$ converges to the same limit.
(f) If a sequence $\{x_n\}$ has two subsequences which converge to two different limits, then $\{x_n\}$ is not convergent.""",
        "solution": r"""(a) **True.** Formal definition of Cauchy sequence.
(b) **True.** Equivalent limit formulation.
(c) **False.** Only true if the metric space $X$ is complete. (Counterexample in $\mathbb{Q}$: $x_n \to \sqrt{2}$).
(d) **True.** Every convergent sequence in any metric space is Cauchy.
(e) **True.** Standard property of convergent sequences.
(f) **True.** A convergent sequence must have a unique limit for all subsequences."""
    },
    {
        "id": "tute-s04-q04",
        "number": 81,
        "title": "Cauchy Sequences in R and Completeness",
        "week": 4,
        "tier": "Basic Knowledge",
        "difficulty": 3,
        "isDifficult": False,
        "topic": "Ch 2: Cauchy Sequences & Completeness",
        "concepts": ["metric-topological-foundations"],
        "source": "Tutorial Sheet 04",
        "prompt": r"""Let $\{x_n\}$ be a Cauchy sequence in $\mathbb{R}$.

(a) Is $\{x_n\}$ bounded? Justify your answer.
(b) Is $\{x_n\}$ convergent? Justify your answer.
(c) What do you call a metric space in which every Cauchy sequence converges?
(d) Is $\mathbb{R}$ a complete metric space?""",
        "solution": r"""**(a) Yes, $\{x_n\}$ is bounded.**
Setting $\epsilon = 1$, by the Cauchy condition there exists $N \in \mathbb{N}$ such that:
$$m, n \ge N \implies |x_m - x_n| < 1.$$
In particular, for all $n \ge N$:
$$|x_n| \le |x_n - x_N| + |x_N| < 1 + |x_N|.$$
Define $M = \max\{|x_1|, |x_2|, \dots, |x_{N-1}|, 1 + |x_N|\}$. Then $|x_n| \le M$ for all $n \in \mathbb{N}$.

**(b) Yes, $\{x_n\}$ is convergent.**
By the Bolzano–Weierstrass theorem, the bounded sequence $\{x_n\}$ has a convergent subsequence $\{x_{n_k}\}$ converging to some $x \in \mathbb{R}$.
Given $\epsilon > 0$, choose $N_1$ such that $k > N_1 \implies |x_{n_k} - x| < \epsilon/2$.
Choose $N_2$ such that $m, n > N_2 \implies |x_m - x_n| < \epsilon/2$.
Let $N = \max\{N_1, N_2\}$. For $k > N$, since $n_k \ge k > N$:
$$|x_k - x| \le |x_k - x_{n_k}| + |x_{n_k} - x| < \frac{\epsilon}{2} + \frac{\epsilon}{2} = \epsilon.$$
Thus $x_k \to x$.

**(c)** A **complete metric space**.

**(d) Yes**, $\mathbb{R}$ is complete."""
    },
    {
        "id": "tute-s04-q05",
        "number": 82,
        "title": "Uniform Continuity of the Distance-to-Set Function",
        "week": 4,
        "tier": "Basic Knowledge",
        "difficulty": 3,
        "isDifficult": False,
        "topic": "Ch 2: Metric Spaces & Continuity",
        "concepts": ["metric-topological-foundations"],
        "source": "Tutorial Sheet 04",
        "prompt": r"""Let $A$ be a subset of a metric space $(X, d)$. Show that the mapping $f_A : X \to \mathbb{R}$ defined by
$$f_A(x) = d(x, A) := \inf_{a \in A} d(x, a)$$
is uniformly continuous on $X$.""",
        "solution": r"""For any $x, x' \in X$ and any $a \in A$, by the triangle inequality:
$$d(x, a) \le d(x, x') + d(x', a).$$
Taking the infimum over all $a \in A$ on both sides:
$$\inf_{a \in A} d(x, a) \le d(x, x') + \inf_{a \in A} d(x', a) \implies d(x, A) - d(x', A) \le d(x, x').$$
Interchanging the roles of $x$ and $x'$:
$$d(x', A) - d(x, A) \le d(x', x) = d(x, x').$$
Combining both inequalities gives:
$$|d(x, A) - d(x', A)| \le d(x, x'), \quad \text{i.e.} \quad |f_A(x) - f_A(x')| \le d(x, x').$$
Thus $f_A$ is Lipschitz continuous with Lipschitz constant $L = 1$.
Given any $\epsilon > 0$, choosing $\delta = \epsilon$, we have:
$$d(x, x') < \delta \implies |f_A(x) - f_A(x')| < \epsilon.$$
Hence $f_A$ is uniformly continuous."""
    },
    {
        "id": "tute-s04-q06",
        "number": 83,
        "title": "Closed Preimage Characterisation of Continuity",
        "week": 4,
        "tier": "Basic Knowledge",
        "difficulty": 3,
        "isDifficult": False,
        "topic": "Ch 2 & 3: Continuity in Metric Spaces",
        "concepts": ["metric-topological-foundations"],
        "source": "Tutorial Sheet 04",
        "prompt": r"""Prove that a mapping $f$ from a metric space $X$ to a metric space $Y$ is continuous if and only if $f^{-1}(F)$ is closed for every closed subset $F$ of $Y$.""",
        "solution": r"""Recall that a mapping $f$ is continuous if and only if $f^{-1}(G)$ is open in $X$ for every open subset $G$ of $Y$.
Notice that for any subset $B \subseteq Y$:
$$f^{-1}(B^c) = f^{-1}(Y \setminus B) = X \setminus f^{-1}(B) = (f^{-1}(B))^c.$$

$(\implies)$ Assume $f$ is continuous.
Let $F \subseteq Y$ be closed. Then $G = F^c$ is open in $Y$.
By continuity, $f^{-1}(G) = f^{-1}(F^c)$ is open in $X$.
Since $f^{-1}(F^c) = (f^{-1}(F))^c$, the complement of $f^{-1}(F)$ is open, which means $f^{-1}(F)$ is closed.

$(\impliedby)$ Assume $f^{-1}(F)$ is closed for every closed $F \subseteq Y$.
Let $G \subseteq Y$ be open. Then $F = G^c$ is closed in $Y$.
By assumption, $f^{-1}(F) = f^{-1}(G^c)$ is closed in $X$.
Then $(f^{-1}(G^c))^c = f^{-1}(G)$ is open in $X$.
Thus $f$ is continuous."""
    },
    {
        "id": "tute-s04-q07",
        "number": 84,
        "title": "Closedness of Bounded Subsets in C([a, b])",
        "week": 4,
        "tier": "Basic Knowledge",
        "difficulty": 3,
        "isDifficult": False,
        "topic": "Ch 3: Continuous Function Spaces",
        "concepts": ["metric-topological-foundations"],
        "source": "Tutorial Sheet 04",
        "prompt": r"""Let $X$ be a subset of $C([a, b])$ defined by
$$X = \{f \in C([a, b]) : |f(x)| \le M, \; \forall x \in [a, b]\}$$
for some given $M > 0$. Prove that $X$ is closed under the supremum metric $d(f, g) = \max_{a \le x \le b} |f(x) - g(x)|$.""",
        "solution": r"""**Solution 1 (Sequential Characterisation):**
Consider a sequence $\{f_n\}$ in $X$ which converges to $f \in C([a, b])$.
Given $\epsilon > 0$, there exists an integer $N$ such that $d(f, f_N) < \epsilon$, i.e.:
$$\max_{a \le x \le b} |f(x) - f_N(x)| < \epsilon.$$
Hence for any $x \in [a, b]$:
$$|f(x)| \le |f(x) - f_N(x)| + |f_N(x)| < \epsilon + M.$$
Since this holds for every $\epsilon > 0$, letting $\epsilon \to 0$ yields:
$$|f(x)| \le M \quad \forall x \in [a, b].$$
Thus $f \in X$, which proves $X$ contains all its limit points and is therefore closed.

**Solution 2 (Preimage of Closed Set):**
Consider the functional $T : C([a, b]) \to \mathbb{R}$ defined by $T(f) = \max_{a \le x \le b} |f(x)| = d(f, 0)$.
$T$ is continuous because $|T(f) - T(g)| = |d(f, 0) - d(g, 0)| \le d(f, g)$.
Then:
$$X = T^{-1}((-\infty, M]).$$
Since $(-\infty, M]$ is closed in $\mathbb{R}$ and $T$ is continuous, $X$ is closed."""
    },
    {
        "id": "tute-s04-q08",
        "number": 85,
        "title": "Open and Closed Envelopes of a Set",
        "week": 4,
        "tier": "Basic Knowledge",
        "difficulty": 4,
        "isDifficult": False,
        "topic": "Ch 2: Metric Spaces & Distance Function",
        "concepts": ["metric-topological-foundations"],
        "source": "Tutorial Sheet 04",
        "prompt": r"""Let $A$ be a subset of a metric space $X$ and let $\alpha > 0$. We define:
$$G := \{x \in X : d(x, A) < \alpha\}, \quad F := \{x \in X : d(x, A) \le \alpha\}.$$
Show that $G$ is open and $F$ is closed.""",
        "solution": r"""**Solution 1 (Using Continuity of $d(\cdot, A)$):**
By Exercise Q5, the distance mapping $f_A : X \to \mathbb{R}$ defined by $f_A(x) = d(x, A)$ is continuous.
Notice that:
- $G = f_A^{-1}((-\infty, \alpha))$. Since $(-\infty, \alpha)$ is open in $\mathbb{R}$ and $f_A$ is continuous, $G$ is open in $X$.
- $F = f_A^{-1}((-\infty, \alpha])$. Since $(-\infty, \alpha]$ is closed in $\mathbb{R}$ and $f_A$ is continuous, $F$ is closed in $X$.

**Solution 2 (Direct $\epsilon$-ball proof):**
- **For $G$:** Let $x \in G$, so $d(x, A) < \alpha$. By definition of infimum, $\exists a \in A$ such that $d(x, a) < \alpha$. Set $r = \alpha - d(x, a) > 0$. For any $y \in B_r(x)$:
  $$d(y, A) \le d(y, a) \le d(y, x) + d(x, a) < r + d(x, a) = \alpha.$$
  Thus $y \in G \implies B_r(x) \subseteq G$, so $G$ is open.
- **For $F$:** To show $F^c$ is open, let $x \in F^c$, so $d(x, A) > \alpha$. Set $r = (d(x, A) - \alpha)/2 > 0$. For any $y \in B_r(x)$ and $a \in A$:
  $$d(y, a) \ge d(x, a) - d(x, y) > d(x, A) - r = \alpha + r > \alpha.$$
  Taking infimum over $a \in A$ gives $d(y, A) \ge \alpha + r > \alpha \implies y \in F^c$.
  Thus $B_r(x) \subseteq F^c$, so $F^c$ is open, which means $F$ is closed."""
    },
    {
        "id": "tute-s04-q09",
        "number": 86,
        "title": "Nested Open Covers of Compact Spaces",
        "week": 4,
        "tier": "Basic Knowledge",
        "difficulty": 4,
        "isDifficult": False,
        "topic": "Ch 3: Compactness",
        "concepts": ["metric-topological-foundations"],
        "source": "Tutorial Sheet 04",
        "prompt": r"""Let $X$ be a compact topological space. Assume that there exists a sequence $\{G_n\}$ of open subsets of $X$ such that:
$$G_1 \subseteq G_2 \subseteq G_3 \subseteq \dots \quad \text{and} \quad X = \bigcup_{n \in \mathbb{N}} G_n.$$
Show that $X = G_n$ for some $n \in \mathbb{N}$.""",
        "solution": r"""Since each $G_n$ is open and $X = \bigcup_{n \in \mathbb{N}} G_n$, the collection $\{G_n\}_{n \in \mathbb{N}}$ forms an open cover of $X$.
Since $X$ is compact, there exists a finite subcover:
$$X = \bigcup_{k=1}^N G_{n_k}$$
for some positive integers $n_1 < n_2 < \dots < n_N$.
Let $n^* = \max_{1 \le k \le N} n_k = n_N$.
Since the sequence of sets is nested:
$$G_1 \subseteq G_2 \subseteq \dots \subseteq G_{n^*},$$
we have:
$$\bigcup_{k=1}^N G_{n_k} = G_{n^*}.$$
Therefore:
$$X = G_{n^*}.$$
This proves that the entire space $X$ equals one of the open sets $G_{n^*}$ for $n^* \in \mathbb{N}$."""
    }
]

def main():
    print(f"Writing {len(TUTORIAL_QUESTIONS)} questions for Tutorial Sheet 4...")
    for q in TUTORIAL_QUESTIONS:
        filepath = os.path.join(QUESTIONS_DIR, f"{q['id']}.md")
        frontmatter = {
            "id": q["id"],
            "number": q["number"],
            "title": f"Tute 4 Q{q['id'].split('q')[-1]}: {q['title']}",
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
*Refer to Chapter 2 & 3 lecture slides and definitions in the connected Concept guide.*

<!-- split:solution -->


<!-- split:official -->
{q['solution']}
"""
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Created {q['id']}.md (Q{q['number']})")

if __name__ == "__main__":
    main()
