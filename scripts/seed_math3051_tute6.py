#!/usr/bin/env python3
"""
seed_math3051_tute6.py
Generates Tutorial Sheet 6 questions (Q1 to Q16, numbering Q100 to Q115)
for MATH3051 with full official teacher solutions from Thanh Tran.
"""

import os
import json

COURSE_DIR = r"C:\Users\User\course noting\courses\MATH3051"
QUESTIONS_DIR = os.path.join(COURSE_DIR, "questions")
os.makedirs(QUESTIONS_DIR, exist_ok=True)

TUTORIAL_QUESTIONS = [
    {
        "id": "tute-s06-q01",
        "number": 100,
        "title": "Definition of Normed Vector Space",
        "week": 7,
        "tier": "Assumed Knowledge",
        "difficulty": 1,
        "isDifficult": False,
        "topic": "Ch 5: Normed Vector Spaces",
        "concepts": ["normed-spaces-duals-theorems"],
        "source": "Tutorial Sheet 06",
        "prompt": r"""Give the definition of a normed vector space.""",
        "solution": r"""A **normed vector space** (or normed space) is an ordered pair $(X, \|\cdot\|)$ where $X$ is a vector space over a field $\mathbb{K}$ (usually $\mathbb{R}$ or $\mathbb{C}$) and $\|\cdot\| : X \to \mathbb{R}$ is a function (called a **norm**) satisfying for all $x, y \in X$ and $\alpha \in \mathbb{K}$:
1. **Positive definiteness:** $\|x\| \ge 0$, and $\|x\| = 0 \iff x = 0$;
2. **Absolute homogeneity:** $\|\alpha x\| = |\alpha| \|x\|$;
3. **Triangle inequality:** $\|x + y\| \le \|x\| + \|y\|$."""
    },
    {
        "id": "tute-s06-q02",
        "number": 101,
        "title": "Metric Induced by a Norm",
        "week": 7,
        "tier": "Assumed Knowledge",
        "difficulty": 2,
        "isDifficult": False,
        "topic": "Ch 5: Normed Vector Spaces",
        "concepts": ["normed-spaces-duals-theorems"],
        "source": "Tutorial Sheet 06",
        "prompt": r"""Explain why a normed space $(X, \|\cdot\|)$ is a metric space.""",
        "solution": r"""Define $d(x, y) := \|x - y\|$ for all $x, y \in X$.
We verify the three metric axioms:
1. **Positive definiteness:** $d(x, y) = \|x - y\| \ge 0$, and $d(x, y) = 0 \iff \|x - y\| = 0 \iff x - y = 0 \iff x = y$.
2. **Symmetry:** $d(x, y) = \|x - y\| = \|(-1)(y - x)\| = |-1| \|y - x\| = \|y - x\| = d(y, x)$.
3. **Triangle inequality:** For any $x, y, z \in X$:
$$d(x, y) = \|x - y\| = \|(x - z) + (z - y)\| \le \|x - z\| + \|z - y\| = d(x, z) + d(z, y).$$
Thus $d(x, y) = \|x - y\|$ defines a metric on $X$, called the metric induced by the norm."""
    },
    {
        "id": "tute-s06-q03",
        "number": 102,
        "title": "Is Every Metric Space a Normed Space?",
        "week": 7,
        "tier": "Assumed Knowledge",
        "difficulty": 2,
        "isDifficult": False,
        "topic": "Ch 5: Normed Vector Spaces",
        "concepts": ["normed-spaces-duals-theorems"],
        "source": "Tutorial Sheet 06",
        "prompt": r"""Is a metric space always a normed space? Explain your answer.""",
        "solution": r"""**No, not necessarily.**
1. A metric space $(X, d)$ is defined on an arbitrary non-empty set $X$. It does not need to possess any algebraic structure (vector addition or scalar multiplication). Without a vector space structure, a norm cannot be defined.
2. Even if $X$ is a vector space, not every metric can be derived from a norm.
   If a metric $d$ comes from a norm $\|x\| = d(x, 0)$, it must be:
   - **Translation-invariant:** $d(x + z, y + z) = d(x, y)$ for all $x, y, z \in X$.
   - **Homogeneous:** $d(\alpha x, \alpha y) = |\alpha| d(x, y)$ for all scalars $\alpha$.
   For example, the discrete metric $d(x, y) = 1$ ($x \ne y$) on $\mathbb{R}$ satisfies neither property, so it cannot be induced by any norm."""
    },
    {
        "id": "tute-s06-q04",
        "number": 103,
        "title": "Definition of Banach Space",
        "week": 7,
        "tier": "Assumed Knowledge",
        "difficulty": 2,
        "isDifficult": False,
        "topic": "Ch 5: Banach Spaces",
        "concepts": ["normed-spaces-duals-theorems"],
        "source": "Tutorial Sheet 06",
        "prompt": r"""Give the definition of a Banach space.""",
        "solution": r"""A **Banach space** is a normed vector space $(X, \|\cdot\|)$ which is **complete** with respect to the metric induced by its norm.
That is, every Cauchy sequence in $X$ converges to a limit that also belongs to $X$:
$$\forall \{x_n\} \subseteq X \text{ with } \lim_{m, n \to \infty} \|x_m - x_n\| = 0 \implies \exists x \in X \text{ such that } \lim_{n \to \infty} \|x_n - x\| = 0.$$"""
    },
    {
        "id": "tute-s06-q05",
        "number": 104,
        "title": "Condition for Equivalence of Norms",
        "week": 7,
        "tier": "Assumed Knowledge",
        "difficulty": 2,
        "isDifficult": False,
        "topic": "Ch 5: Equivalence of Norms",
        "concepts": ["normed-spaces-duals-theorems"],
        "source": "Tutorial Sheet 06",
        "prompt": r"""Let $\|\cdot\|_1$ and $\|\cdot\|_2$ be two norms defined on a vector space $X$. Write down the condition for the two norms to be equivalent.""",
        "solution": r"""Two norms $\|\cdot\|_1$ and $\|\cdot\|_2$ on a vector space $X$ are **equivalent** if there exist two positive constants $C_1, C_2 > 0$ such that:
$$C_1 \|x\|_1 \le \|x\|_2 \le C_2 \|x\|_1 \quad \forall x \in X.$$
Equivalently:
$$\frac{1}{C_2} \|x\|_2 \le \|x\|_1 \le \frac{1}{C_1} \|x\|_2 \quad \forall x \in X.$$
This means both norms generate identical topologies on $X$."""
    },
    {
        "id": "tute-s06-q06",
        "number": 105,
        "title": "Sequence Convergence Under Equivalent Norms",
        "week": 7,
        "tier": "Basic Knowledge",
        "difficulty": 3,
        "isDifficult": False,
        "topic": "Ch 5: Equivalence of Norms",
        "concepts": ["normed-spaces-duals-theorems"],
        "source": "Tutorial Sheet 06",
        "prompt": r"""Let $\|\cdot\|_1$ and $\|\cdot\|_2$ be two equivalent norms on a vector space $X$. Let $\{x_n\}$ be a sequence in $X$. Prove that $\{x_n\}$ converges to $x$ in one norm if and only if it converges to $x$ in the other norm.""",
        "solution": r"""Since the norms are equivalent, there exist constants $C_1, C_2 > 0$ such that for all $n \in \mathbb{N}$:
$$C_1 \|x_n - x\|_1 \le \|x_n - x\|_2 \le C_2 \|x_n - x\|_1.$$

- **$(\implies)$** If $x_n \to x$ in $\|\cdot\|_1$, then $\|x_n - x\|_1 \to 0$ as $n \to \infty$.
  Then $0 \le \|x_n - x\|_2 \le C_2 \|x_n - x\|_1 \to 0$, so by the squeeze theorem $\|x_n - x\|_2 \to 0$.
  Thus $x_n \to x$ in $\|\cdot\|_2$.

- **$(\impliedby)$** Conversely, if $x_n \to x$ in $\|\cdot\|_2$, then $\|x_n - x\|_2 \to 0$.
  Then $0 \le \|x_n - x\|_1 \le \frac{1}{C_1} \|x_n - x\|_2 \to 0$, so $\|x_n - x\|_1 \to 0$.
  Thus $x_n \to x$ in $\|\cdot\|_1$."""
    },
    {
        "id": "tute-s06-q07",
        "number": 106,
        "title": "Reverse Triangle Inequality for Norms and Limit of Norms",
        "week": 7,
        "tier": "Basic Knowledge",
        "difficulty": 3,
        "isDifficult": False,
        "topic": "Ch 5: Normed Vector Spaces",
        "concepts": ["normed-spaces-duals-theorems"],
        "source": "Tutorial Sheet 06",
        "prompt": r"""Let $\{x_n\}$ be a sequence in a normed space $X$.

(a) Prove that if $\{x_n\}$ converges to $x \in X$, then $\|x_n\| \to \|x\|$.
(b) If $\|x_n\| \to \|x\|$, is it true that $\|x_n - x\| \to 0$? Explain your answer.""",
        "solution": r"""**(a)** We first prove the reverse triangle inequality:
$$\big| \|x\| - \|y\| \big| \le \|x - y\| \quad \forall x, y \in X.$$
Indeed:
$$\|x\| = \|(x - y) + y\| \le \|x - y\| + \|y\| \implies \|x\| - \|y\| \le \|x - y\|.$$
Interchanging $x$ and $y$:
$$\|y\| - \|x\| \le \|y - x\| = \|x - y\| \implies -(\|x\| - \|y\|) \le \|x - y\|.$$
Thus $\big| \|x\| - \|y\| \big| \le \|x - y\|$.
Applying this to $x_n$:
$$\big| \|x_n\| - \|x\| \big| \le \|x_n - x\| \to 0 \quad \text{as } n \to \infty.$$
Therefore $\|x_n\| \to \|x\|$.

**(b) No, the converse is false.**
**Counterexample:** Let $X = \mathbb{R}$ and $x_n = (-1)^n$.
Then $\|x_n\| = |(-1)^n| = 1$ for all $n$, so $\|x_n\| \to 1 = \|x\|$ where $x = 1$.
However, $\{x_n\}$ alternates between $1$ and $-1$, so $\|x_n - x\| = |(-1)^n - 1|$ alternates between $0$ and $2$, which does not converge to $0$."""
    },
    {
        "id": "tute-s06-q08",
        "number": 107,
        "title": "Boundedness of Convergent Sequences in Normed Spaces",
        "week": 7,
        "tier": "Basic Knowledge",
        "difficulty": 3,
        "isDifficult": False,
        "topic": "Ch 5: Normed Vector Spaces",
        "concepts": ["normed-spaces-duals-theorems"],
        "source": "Tutorial Sheet 06",
        "prompt": r"""Prove that a convergent sequence in a normed space is bounded.""",
        "solution": r"""Let $\{x_n\}$ be a sequence in a normed space $(X, \|\cdot\|)$ converging to $x \in X$.
Choose $\epsilon = 1$. By the definition of convergence, there exists $N \in \mathbb{N}$ such that:
$$n > N \implies \|x_n - x\| < 1.$$
By the triangle inequality, for all $n > N$:
$$\|x_n\| = \|(x_n - x) + x\| \le \|x_n - x\| + \|x\| < 1 + \|x\|.$$
Now consider the finite set of initial norms $\{\|x_1\|, \|x_2\|, \dots, \|x_N\|\}$.
Define:
$$M := \max\{\|x_1\|, \|x_2\|, \dots, \|x_N\|, 1 + \|x\|\}.$$
Then for all $n \in \mathbb{N}$, $\|x_n\| \le M$.
Thus $\{x_n\}$ is bounded."""
    },
    {
        "id": "tute-s06-q09",
        "number": 108,
        "title": "Bounded Subsets Contained in Closed Balls",
        "week": 7,
        "tier": "Basic Knowledge",
        "difficulty": 3,
        "isDifficult": False,
        "topic": "Ch 5: Normed Vector Spaces",
        "concepts": ["normed-spaces-duals-theorems"],
        "source": "Tutorial Sheet 06",
        "prompt": r"""Show that a non-empty subset $A$ of a normed space $X$ is bounded if and only if there exists a positive constant $K$ such that:
$$\|x\| \le K \quad \forall x \in A.$$
In other words, $A$ is contained in the closed ball $\bar{B}_K(0)$ with centre $0$ and radius $K$.""",
        "solution": r"""Recall that a subset $A$ of a metric space is bounded if its diameter is finite:
$$\mathrm{diam}(A) = \sup_{x, x' \in A} \|x - x'\| < \infty.$$

- **$(\implies)$** Assume $A$ is bounded, so $\mathrm{diam}(A) < \infty$.
  Fix any point $x' \in A$. For any $x \in A$, by the triangle inequality:
  $$\|x\| \le \|x - x'\| + \|x'\| \le \mathrm{diam}(A) + \|x'\| =: K.$$
  Since $x'$ is fixed, $K$ is a constant independent of $x$. Thus $\|x\| \le K$ for all $x \in A$.

- **$(\impliedby)$** Conversely, assume $\|x\| \le K$ for all $x \in A$.
  Then for any $x, x' \in A$:
  $$\|x - x'\| \le \|x\| + \|x'\| \le K + K = 2K.$$
  Taking the supremum over all $x, x' \in A$ yields $\mathrm{diam}(A) \le 2K < \infty$.
  Thus $A$ is bounded."""
    },
    {
        "id": "tute-s06-q10",
        "number": 109,
        "title": "Continuity of Scalar Multiplication for Sequences",
        "week": 7,
        "tier": "Basic Knowledge",
        "difficulty": 3,
        "isDifficult": False,
        "topic": "Ch 5: Normed Vector Spaces",
        "concepts": ["normed-spaces-duals-theorems"],
        "source": "Tutorial Sheet 06",
        "prompt": r"""Let $\{x_n\}$ be a sequence in a normed space $X$ and $x \in X$. Assume that $\{\alpha_n\}$ is a sequence of real numbers which converges to $\alpha \ne 0$. Show that if
$$\|\alpha_n x_n - \alpha x\| \to 0 \quad \text{as } n \to \infty,$$
then
$$\|x_n - x\| \to 0 \quad \text{as } n \to \infty.$$""",
        "solution": r"""Since $\alpha_n \to \alpha \ne 0$, for sufficiently large $n$ we have $\alpha_n \ne 0$, and $\alpha_n^{-1} \to \alpha^{-1}$.
We can write:
$$x_n - x = \alpha_n^{-1} (\alpha_n x_n) - \alpha^{-1}(\alpha x)$$
$$= (\alpha_n^{-1} - \alpha^{-1}) \alpha_n x_n + \alpha^{-1}(\alpha_n x_n - \alpha x).$$
Taking the norm and applying the triangle inequality:
$$\|x_n - x\| \le |\alpha_n^{-1} - \alpha^{-1}| \|\alpha_n x_n\| + |\alpha^{-1}| \|\alpha_n x_n - \alpha x\|.$$
Since $\|\alpha_n x_n - \alpha x\| \to 0$, the sequence $\{\alpha_n x_n\}$ is convergent and therefore bounded, say $\|\alpha_n x_n\| \le M$ for all $n$.
Then:
$$\|x_n - x\| \le M |\alpha_n^{-1} - \alpha^{-1}| + |\alpha^{-1}| \|\alpha_n x_n - \alpha x\|.$$
Since $|\alpha_n^{-1} - \alpha^{-1}| \to 0$ and $\|\alpha_n x_n - \alpha x\| \to 0$, the right-hand side converges to $0$.
Therefore, $\|x_n - x\| \to 0$ as $n \to \infty$."""
    },
    {
        "id": "tute-s06-q11",
        "number": 110,
        "title": "Basic Properties of Linear Transformations",
        "week": 7,
        "tier": "Basic Knowledge",
        "difficulty": 3,
        "isDifficult": False,
        "topic": "Ch 5: Linear Operators",
        "concepts": ["normed-spaces-duals-theorems"],
        "source": "Tutorial Sheet 06",
        "prompt": r"""Let $T$ be a linear transformation from a linear space $X$ into a linear space $Y$. Show that:
$$T(0) = 0 \quad \text{and} \quad T(-x) = -T(x) \quad \forall x \in X.$$""",
        "solution": r"""By linearity of $T$:
1. $T(0) = T(0 + 0) = T(0) + T(0)$.
   Subtracting $T(0)$ from both sides yields $T(0) = 0$.
   (Alternatively, $T(0) = T(0 \cdot x) = 0 \cdot T(x) = 0$).

2. $T(-x) = T((-1) \cdot x) = (-1) \cdot T(x) = -T(x)$.
   (Alternatively, $0 = T(0) = T(x + (-x)) = T(x) + T(-x) \implies T(-x) = -T(x)$)."""
    },
    {
        "id": "tute-s06-q12",
        "number": 111,
        "title": "Submultiplicativity of Operator Norms and Counterexample",
        "week": 7,
        "tier": "Basic Knowledge",
        "difficulty": 3,
        "isDifficult": False,
        "topic": "Ch 5: Bounded Linear Operators",
        "concepts": ["normed-spaces-duals-theorems"],
        "source": "Tutorial Sheet 06",
        "prompt": r"""Let $X, Y, Z$ be three normed spaces, and let $T \in \mathcal{L}(X, Y)$ and $S \in \mathcal{L}(Y, Z)$. Show that $S \circ T \in \mathcal{L}(X, Z)$ and:
$$\|S \circ T\| \le \|S\| \|T\|.$$
Is equality true in general?""",
        "solution": r"""For any $x \in X$:
$$\|(S \circ T)(x)\| = \|S(Tx)\| \le \|S\| \|Tx\| \le \|S\| (\|T\| \|x\|) = (\|S\| \|T\|) \|x\|.$$
By definition of the operator norm:
$$\|S \circ T\| = \sup_{\|x\| \le 1} \|(S \circ T)(x)\| \le \sup_{\|x\| \le 1} (\|S\| \|T\| \|x\|) = \|S\| \|T\|.$$
This proves $S \circ T$ is bounded and $\|S \circ T\| \le \|S\| \|T\|$.

**Equality is false in general.**
**Counterexample:** Let $X = Y = Z = \mathbb{R}^2$ with Euclidean norm.
Define projections onto the axes:
$$T(x_1, x_2) = (x_1, 0) \quad \text{and} \quad S(x_1, x_2) = (0, x_2).$$
Clearly $\|T\| = 1$ and $\|S\| = 1$.
However, $(S \circ T)(x_1, x_2) = S(x_1, 0) = (0, 0)$ for all $(x_1, x_2)$.
Thus $S \circ T = 0$, so $\|S \circ T\| = 0$.
Here $0 = \|S \circ T\| < \|S\| \|T\| = 1 \cdot 1 = 1$."""
    },
    {
        "id": "tute-s06-q13",
        "number": 112,
        "title": "Four Equivalent Definitions of the Operator Norm",
        "week": 7,
        "tier": "Basic Knowledge",
        "difficulty": 4,
        "isDifficult": False,
        "topic": "Ch 5: Bounded Linear Operators",
        "concepts": ["normed-spaces-duals-theorems"],
        "source": "Tutorial Sheet 06",
        "prompt": r"""Given $T \in \mathcal{L}(X, Y)$, we define $\|T\| = \sup_{x \in X, \|x\| \le 1} \|Tx\|$. Prove that:
$$\|T\| = \sup_{\|x\| = 1} \|Tx\| = \sup_{x \ne 0} \frac{\|Tx\|}{\|x\|} = \inf \{K \in \mathbb{R}^+ : \|Tx\| \le K \|x\| \; \forall x \in X\}.$$""",
        "solution": r"""Let $N_1 = \sup_{\|x\| \le 1} \|Tx\|$, $N_2 = \sup_{\|x\| = 1} \|Tx\|$, $N_3 = \sup_{x \ne 0} \frac{\|Tx\|}{\|x\|}$, and $N_4 = \inf \{K \ge 0 : \|Tx\| \le K \|x\| \; \forall x\}$.

1. **$N_2 \le N_1$:** Since $\{x : \|x\| = 1\} \subseteq \{x : \|x\| \le 1\}$, the supremum over the smaller set is $\le$ the supremum over the larger set: $N_2 \le N_1$.
2. **$N_1 \le N_2$:** For any $0 < \|x\| \le 1$, write $u = x / \|x\|$, so $\|u\| = 1$. By linearity:
   $$\|Tx\| = \|x\| \|Tu\| \le 1 \cdot N_2 = N_2.$$
   For $x = 0$, $\|T(0)\| = 0 \le N_2$. Taking supremum gives $N_1 \le N_2$. Hence $N_1 = N_2$.
3. **$N_2 = N_3$:** For any $x \ne 0$, $\frac{\|Tx\|}{\|x\|} = \|T(x / \|x\|)\| = \|Tu\|$ where $\|u\| = 1$. Taking the supremum gives $N_3 = N_2$.
4. **$N_3 = N_4$:** From step 3, for all $x \in X$, $\|Tx\| \le N_3 \|x\|$. Thus $N_3$ belongs to the set of valid bounds, so $N_4 = \inf K \le N_3$.
   Conversely, for any $K$ satisfying $\|Tx\| \le K \|x\|$ for all $x$, dividing by $\|x\| \ne 0$ gives $\frac{\|Tx\|}{\|x\|} \le K$, so $N_3 \le K$. Taking the infimum over all such $K$ gives $N_3 \le N_4$.
   Hence $N_3 = N_4$.

Therefore, all four definitions coincide."""
    },
    {
        "id": "tute-s06-q14",
        "number": 113,
        "title": "Equivalence of All Norms on Finite-Dimensional Spaces Rn",
        "week": 7,
        "tier": "Advanced Knowledge",
        "difficulty": 5,
        "isDifficult": True,
        "topic": "Ch 5: Equivalence of Norms",
        "concepts": ["normed-spaces-duals-theorems"],
        "source": "Tutorial Sheet 06",
        "prompt": r"""Prove that all norms on the finite-dimensional space $\mathbb{R}^n$ are equivalent.""",
        "solution": r"""Since norm equivalence is transitive, it suffices to prove that every arbitrary norm $\|\cdot\|_*$ on $\mathbb{R}^n$ is equivalent to the 1-norm $\|x\|_1 = \sum_{i=1}^n |x_i|$.
That is, we show there exist constants $C_1, C_2 > 0$ such that:
$$C_1 \|x\|_1 \le \|x\|_* \le C_2 \|x\|_1 \quad \forall x \in \mathbb{R}^n.$$

**Step 1: Upper Bound ($C_2$).**
Let $\{e_1, \dots, e_n\}$ be the standard canonical basis of $\mathbb{R}^n$.
Any $x = \sum_{i=1}^n x_i e_i$. By the triangle inequality and absolute homogeneity:
$$\|x\|_* = \left\| \sum_{i=1}^n x_i e_i \right\|_* \le \sum_{i=1}^n |x_i| \|e_i\|_* \le \left(\max_{1 \le i \le n} \|e_i\|_*\right) \sum_{i=1}^n |x_i| = C_2 \|x\|_1,$$
where $C_2 := \max_{1 \le i \le n} \|e_i\|_* > 0$.

**Step 2: Continuity of $\|\cdot\|_*$ on $(\mathbb{R}^n, \|\cdot\|_1)$.**
By the reverse triangle inequality and Step 1:
$$\big| \|x\|_* - \|y\|_* \big| \le \|x - y\|_* \le C_2 \|x - y\|_1.$$
Thus the map $f(x) = \|x\|_*$ is Lipschitz continuous on $(\mathbb{R}^n, \|\cdot\|_1)$.

**Step 3: Lower Bound ($C_1$).**
Consider the unit sphere $S = \{x \in \mathbb{R}^n : \|x\|_1 = 1\}$.
In $\mathbb{R}^n$, $S$ is closed and bounded under $\|\cdot\|_1$, hence **compact** by the Heine–Borel theorem.
By the Extreme Value Theorem, the continuous function $f(x) = \|x\|_*$ attains its minimum on $S$:
$$C_1 := \min_{x \in S} \|x\|_* = \|x^*\|_* \quad \text{for some } x^* \in S.$$
Since $x^* \in S$, $\|x^*\|_1 = 1 \implies x^* \ne 0$.
Since $\|\cdot\|_*$ is a norm, $\|x^*\|_* > 0$, so $C_1 > 0$.
Then for any $x \ne 0$, $u = x / \|x\|_1 \in S$, so:
$$\|u\|_* \ge C_1 \implies \left\|\frac{x}{\|x\|_1}\right\|_* \ge C_1 \implies \|x\|_* \ge C_1 \|x\|_1.$$
Combining Steps 1 and 3 gives $C_1 \|x\|_1 \le \|x\|_* \le C_2 \|x\|_1$ for all $x \in \mathbb{R}^n$."""
    },
    {
        "id": "tute-s06-q15",
        "number": 114,
        "title": "Closure of an Open Ball in a Normed Space",
        "week": 7,
        "tier": "Advanced Knowledge",
        "difficulty": 5,
        "isDifficult": True,
        "topic": "Ch 5: Normed Vector Spaces",
        "concepts": ["normed-spaces-duals-theorems"],
        "source": "Tutorial Sheet 06",
        "prompt": r"""Let $(X, \|\cdot\|)$ be a normed vector space over $\mathbb{R}$. Show that the closure of the open ball $B_r(x_0)$ is the closed ball $\bar{B}_r(x_0)$.""",
        "solution": r"""We know that $\bar{B}_r(x_0) = \{y \in X : \|y - x_0\| \le r\}$ is closed (by continuity of the norm) and contains $B_r(x_0)$.
Since the closure $\overline{B_r(x_0)}$ is the smallest closed set containing $B_r(x_0)$, we immediately have:
$$\overline{B_r(x_0)} \subseteq \bar{B}_r(x_0).$$
It remains to show the reverse inclusion: $\bar{B}_r(x_0) \subseteq \overline{B_r(x_0)}$.
Let $x \in \bar{B}_r(x_0)$.
- If $\|x - x_0\| < r$, then $x \in B_r(x_0) \subseteq \overline{B_r(x_0)}$.
- If $\|x - x_0\| = r$, consider the sequence of points along the segment connecting $x_0$ to $x$:
$$x_n = \left(1 - \frac{1}{n}\right)x + \frac{1}{n}x_0 \quad \text{for } n \ge 2.$$
Then:
$$\|x_n - x_0\| = \left\| \left(1 - \frac{1}{n}\right)(x - x_0) \right\| = \left(1 - \frac{1}{n}\right)\|x - x_0\| = \left(1 - \frac{1}{n}\right)r < r.$$
Thus $x_n \in B_r(x_0)$ for all $n \ge 2$.
Furthermore:
$$\|x_n - x\| = \left\| -\frac{1}{n}x + \frac{1}{n}x_0 \right\| = \frac{1}{n}\|x - x_0\| = \frac{r}{n} \to 0 \quad \text{as } n \to \infty.$$
Thus $x_n \to x$, which means $x$ is the limit of a sequence in $B_r(x_0)$.
Hence $x \in \overline{B_r(x_0)}$.
Therefore $\overline{B_r(x_0)} = \bar{B}_r(x_0)$."""
    },
    {
        "id": "tute-s06-q16",
        "number": 115,
        "title": "Fundamental Equivalence of Bounded Linear Operators",
        "week": 7,
        "tier": "Advanced Knowledge",
        "difficulty": 5,
        "isDifficult": True,
        "topic": "Ch 5: Bounded Linear Operators",
        "concepts": ["normed-spaces-duals-theorems"],
        "source": "Tutorial Sheet 06",
        "prompt": r"""Let $T$ be a linear operator from a normed space $X$ into a normed space $Y$. Prove the following:

(a) If $T$ is continuous at the origin $0$, then $T$ is continuous everywhere on $X$.
(b) If $T$ is bounded (i.e. $\exists K > 0$ such that $\|Tx\|_Y \le K \|x\|_X$ for all $x$), then $T$ is continuous at $0$.
(c) If the image of the closed unit ball $\bar{B}_1(0)$ in $X$ is bounded in $Y$, then $T$ is bounded.""",
        "solution": r"""**(a)** Let $x \in X$ be arbitrary and let $\{x_n\}$ be any sequence converging to $x$ in $X$.
Then $x_n - x \to 0$ in $X$.
Since $T$ is continuous at $0$ and $T(0) = 0$:
$$T(x_n - x) \to T(0) = 0 \quad \text{in } Y.$$
By linearity of $T$:
$$T(x_n) - T(x) = T(x_n - x) \to 0 \implies T(x_n) \to T(x).$$
Hence $T$ is continuous at $x$. Since $x$ was arbitrary, $T$ is continuous everywhere on $X$.

**(b)** Suppose $\|Tx\|_Y \le K \|x\|_X$ for all $x$.
Let $x_n \to 0$ in $X$, so $\|x_n\|_X \to 0$.
Then:
$$0 \le \|Tx_n\|_Y \le K \|x_n\|_X \to 0.$$
Thus $Tx_n \to 0 = T(0)$ in $Y$.
Hence $T$ is continuous at $0$.

**(c)** Suppose $T(\bar{B}_1(0))$ is bounded in $Y$.
Then there exists $K > 0$ such that:
$$\|Tu\|_Y \le K \quad \forall u \in X \text{ with } \|u\|_X \le 1.$$
Now let $x \in X$ be any non-zero element ($x \ne 0$).
Set $u = \frac{x}{\|x\|_X}$. Then $\|u\|_X = 1$, so $u \in \bar{B}_1(0)$.
By linearity of $T$:
$$T(u) = T\left(\frac{x}{\|x\|_X}\right) = \frac{1}{\|x\|_X} T(x) \implies T(x) = \|x\|_X T(u).$$
Taking the norm in $Y$:
$$\|Tx\|_Y = \|x\|_X \|Tu\|_Y \le K \|x\|_X.$$
This inequality also trivially holds for $x = 0$ since $\|T(0)\|_Y = 0 \le K \cdot 0$.
Therefore $T$ is bounded with operator norm $\|T\| \le K$."""
    }
]

def main():
    print(f"Writing {len(TUTORIAL_QUESTIONS)} questions for Tutorial Sheet 6...")
    for q in TUTORIAL_QUESTIONS:
        filepath = os.path.join(QUESTIONS_DIR, f"{q['id']}.md")
        frontmatter = {
            "id": q["id"],
            "number": q["number"],
            "title": f"Tute 6 Q{q['id'].split('q')[-1]}: {q['title']}",
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
*Refer to Chapter 5 lecture slides and definitions in the connected Concept guide.*

<!-- split:solution -->


<!-- split:official -->
{q['solution']}
"""
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Created {q['id']}.md (Q{q['number']})")

if __name__ == "__main__":
    main()
