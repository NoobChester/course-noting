#!/usr/bin/env python3
"""
seed_math3051_tute7.py
Generates Tutorial Sheet 7 questions (Q1 to Q14, numbering Q116 to Q129)
for MATH3051 with full official teacher solutions from Thanh Tran.
"""

import os
import json

COURSE_DIR = r"C:\Users\User\course noting\courses\MATH3051"
QUESTIONS_DIR = os.path.join(COURSE_DIR, "questions")
os.makedirs(QUESTIONS_DIR, exist_ok=True)

TUTORIAL_QUESTIONS = [
    {
        "id": "tute-s07-q01",
        "number": 116,
        "title": "Linearity of the Inverse Mapping",
        "week": 8,
        "tier": "Basic Knowledge",
        "difficulty": 3,
        "isDifficult": False,
        "topic": "Ch 5: Normed Vector Spaces",
        "concepts": ["normed-spaces-duals-theorems"],
        "source": "Tutorial Sheet 07",
        "prompt": r"""Let $X$ and $Y$ be two linear spaces, and let $f$ be a linear mapping from $X$ into $Y$. Show that if $f$ is a bijection, then $f^{-1} : Y \to X$ is also linear.""",
        "solution": r"""Let $\alpha_1, \alpha_2$ be scalars in $\mathbb{K}$ and $y_1, y_2 \in Y$.
Since $f$ is a bijection, there exist unique $x_1, x_2 \in X$ such that:
$$f(x_1) = y_1 \quad \text{and} \quad f(x_2) = y_2,$$
which means $x_1 = f^{-1}(y_1)$ and $x_2 = f^{-1}(y_2)$.
By the linearity of $f$:
$$f(\alpha_1 x_1 + \alpha_2 x_2) = \alpha_1 f(x_1) + \alpha_2 f(x_2) = \alpha_1 y_1 + \alpha_2 y_2.$$
Applying $f^{-1}$ to both sides:
$$f^{-1}(\alpha_1 y_1 + \alpha_2 y_2) = \alpha_1 x_1 + \alpha_2 x_2 = \alpha_1 f^{-1}(y_1) + \alpha_2 f^{-1}(y_2).$$
Thus $f^{-1}$ preserves vector addition and scalar multiplication, so $f^{-1}$ is linear."""
    },
    {
        "id": "tute-s07-q02",
        "number": 117,
        "title": "Closed Graph of Continuous Mappings",
        "week": 8,
        "tier": "Basic Knowledge",
        "difficulty": 3,
        "isDifficult": False,
        "topic": "Ch 5: Continuous Mappings & Graphs",
        "concepts": ["normed-spaces-duals-theorems"],
        "source": "Tutorial Sheet 07",
        "prompt": r"""Let $f$ be a continuous mapping from a metric space $X$ into a metric space $Y$. Show that the graph:
$$\mathcal{G} = \{(x, f(x)) : x \in X\}$$
is closed in the product space $X \times Y$.""",
        "solution": r"""Let $\{(x_n, f(x_n))\}$ be any sequence in $\mathcal{G}$ that converges to some point $(x, y) \in X \times Y$.
In the product metric space, sequence convergence is equivalent to coordinate-wise convergence:
$$x_n \to x \quad \text{in } X, \quad \text{and} \quad f(x_n) \to y \quad \text{in } Y.$$
Since $f$ is continuous on $X$ and $x_n \to x$, we must have:
$$f(x_n) \to f(x) \quad \text{in } Y.$$
By the uniqueness of limits in the metric space $Y$:
$$y = f(x).$$
Therefore, $(x, y) = (x, f(x)) \in \mathcal{G}$.
Since $\mathcal{G}$ contains the limits of all its convergent sequences, $\mathcal{G}$ is closed in $X \times Y$.
*(Note: This is the forward direction of the celebrated Closed Graph Theorem).*"""
    },
    {
        "id": "tute-s07-q03",
        "number": 118,
        "title": "Equivalence of Norms via Open Mapping Theorem",
        "week": 8,
        "tier": "Advanced Knowledge",
        "difficulty": 5,
        "isDifficult": True,
        "topic": "Ch 5: Open Mapping Theorem",
        "concepts": ["normed-spaces-duals-theorems"],
        "source": "Tutorial Sheet 07",
        "prompt": r"""Let $\|\cdot\|_1$ and $\|\cdot\|_2$ be two norms defined on a vector space $E$. Assume that $E$ is a Banach space with both norms. Prove that if there exists a positive constant $c$ such that:
$$\|x\|_2 \le c \|x\|_1 \quad \forall x \in E,$$
then there exists a positive constant $C$ such that:
$$\|x\|_1 \le C \|x\|_2 \quad \forall x \in E.$$
(This means that if two complete norms are comparable, they must be equivalent).""",
        "solution": r"""Let $X = (E, \|\cdot\|_1)$ and $Y = (E, \|\cdot\|_2)$.
Both $X$ and $Y$ are Banach spaces by assumption.
Consider the identity operator:
$$T = I : X \to Y, \quad T(x) = x.$$
1. $T$ is obviously linear and bijective (it is the identity map on the underlying set $E$).
2. By the given inequality, for all $x \in X$:
$$\|Tx\|_Y = \|x\|_2 \le c \|x\|_1 = c \|x\|_X.$$
Thus $T \in \mathcal{L}(X, Y)$ is a bounded (continuous) linear operator with $\|T\| \le c$.

By the **Open Mapping Theorem** (or bounded inverse corollary), any continuous linear bijection between Banach spaces has a continuous (bounded) inverse $T^{-1} : Y \to X$.
Therefore $T^{-1} \in \mathcal{L}(Y, X)$, so there exists a constant $C = \|T^{-1}\| < \infty$ such that:
$$\|x\|_1 = \|T^{-1} x\|_1 \le \|T^{-1}\| \|x\|_2 = C \|x\|_2 \quad \forall x \in E.$$
Hence $C_1 \|x\|_2 \le \|x\|_1 \le C \|x\|_2$, proving the two norms are equivalent."""
    },
    {
        "id": "tute-s07-q04",
        "number": 119,
        "title": "Boundedness of Weakly Convergent Sequences (Banach-Steinhaus)",
        "week": 8,
        "tier": "Advanced Knowledge",
        "difficulty": 5,
        "isDifficult": True,
        "topic": "Ch 5: Weak Convergence & Duality",
        "concepts": ["normed-spaces-duals-theorems"],
        "source": "Tutorial Sheet 07",
        "prompt": r"""Let $\{x_n\}$ be a sequence in a normed space $X$ which weakly converges to $x \in X$ (denoted $x_n \rightharpoonup x$). Show that $\{x_n\}$ is bounded in $X$.""",
        "solution": r"""Recall that $x_n \rightharpoonup x$ means $\langle f, x_n \rangle \to \langle f, x \rangle$ for every continuous linear functional $f \in X^*$.
Consider the canonical embedding $J : X \hookrightarrow X^{**}$ into the second dual space $X^{**} = \mathcal{L}(X^*, \mathbb{R})$.
For each $n \in \mathbb{N}$, define the linear functional:
$$T_n : X^* \to \mathbb{R}, \quad T_n(f) := \langle f, x_n \rangle.$$
Each $T_n \in X^{**}$.
Since $x_n \rightharpoonup x$, for each fixed $f \in X^*$:
$$T_n(f) = \langle f, x_n \rangle \to \langle f, x \rangle \quad \text{in } \mathbb{R}.$$
Since a convergent sequence of real numbers is bounded, for each fixed $f \in X^*$ there exists $M_f < \infty$ such that:
$$|T_n(f)| \le M_f \quad \forall n \in \mathbb{N}.$$
Since $X^*$ is a Banach space (the dual of any normed space is always complete), we can apply the **Banach–Steinhaus Theorem (Uniform Boundedness Principle)** to the family $\{T_n\} \subset \mathcal{L}(X^*, \mathbb{R})$.
The theorem guarantees that $\{T_n\}$ is uniformly bounded in operator norm:
$$\|T_n\|_{X^{**}} \le M \quad \forall n \in \mathbb{N}.$$
By a fundamental corollary of the **Hahn–Banach Theorem**, the canonical embedding is isometric:
$$\|x_n\|_X = \sup_{f \in X^*, \|f\| \le 1} |\langle f, x_n \rangle| = \sup_{f \in X^*, \|f\| \le 1} |T_n(f)| = \|T_n\|_{X^{**}} \le M.$$
Therefore, $\|x_n\| \le M$ for all $n \in \mathbb{N}$, so $\{x_n\}$ is bounded in $X$."""
    },
    {
        "id": "tute-s07-q05",
        "number": 120,
        "title": "Weak Boundedness Implies Strong Boundedness",
        "week": 8,
        "tier": "Advanced Knowledge",
        "difficulty": 5,
        "isDifficult": True,
        "topic": "Ch 5: Weak Convergence & Duality",
        "concepts": ["normed-spaces-duals-theorems"],
        "source": "Tutorial Sheet 07",
        "prompt": r"""Let $X$ be a Banach space and $M$ be a subset of $X$. Assume that for every $f \in X^*$, the set:
$$f(M) := \{\langle f, x \rangle : x \in M\}$$
is a bounded subset of $\mathbb{R}$. Prove that $M$ is bounded in norm. (We say: if $M$ is weakly bounded, then it is strongly bounded).""",
        "solution": r"""For each $x \in M$, define the evaluation functional on the dual space:
$$T_x : X^* \to \mathbb{R}, \quad T_x(f) := \langle f, x \rangle \quad \forall f \in X^*.$$
Then $T_x \in X^{**}$.
By assumption, for each fixed $f \in X^*$, the set $f(M) = \{T_x(f) : x \in M\}$ is bounded in $\mathbb{R}$:
$$\sup_{x \in M} |T_x(f)| < \infty \quad \forall f \in X^*.$$
Since $X^*$ is complete, we apply the **Banach–Steinhaus Theorem (Uniform Boundedness Principle)** to the family of linear operators $\{T_x : x \in M\} \subseteq \mathcal{L}(X^*, \mathbb{R})$.
It follows that the family is uniformly bounded in the operator norm:
$$K := \sup_{x \in M} \|T_x\|_{X^{**}} < \infty.$$
By the **Hahn–Banach Theorem**, the norm of an element in $X$ equals its norm as an evaluation functional:
$$\|x\|_X = \sup_{f \in X^*, \|f\|_{X^*} \le 1} |\langle f, x \rangle| = \|T_x\|_{X^{**}} \le K \quad \forall x \in M.$$
Thus $\|x\| \le K$ for all $x \in M$, which proves that $M$ is bounded in $X$."""
    },
    {
        "id": "tute-s07-q06",
        "number": 121,
        "title": "Definitions of Frechet and Gateaux Derivatives",
        "week": 8,
        "tier": "Assumed Knowledge",
        "difficulty": 2,
        "isDifficult": False,
        "topic": "Ch 6: Differential Calculus in Normed Spaces",
        "concepts": ["normed-spaces-duals-theorems"],
        "source": "Tutorial Sheet 07",
        "prompt": r"""Let $X$ and $Y$ be two normed spaces and $f : X \to Y$.

(a) Write down the equation that defines the Fréchet derivative of $f$ at $x$.
(b) Is the statement $D_F f(x) = \lim_{h \to 0} \frac{f(x + h) - f(x)}{h}$ true? Explain.
(c) If $f$ is Fréchet differentiable at all $x \in X$, define the derivative $D_F f$. Is $D_F f$ linear?
(d) Write down the definition of the Gateaux derivative $D_G f(x; h)$ of $f$ at $x$ in direction $h \in X$. Which space does it belong to?
(e) If $f$ is Gateaux differentiable at $x$, write down $D_G f(x)$. Is this linear?""",
        "solution": r"""(a) The **Fréchet derivative** of $f$ at $x$ is a bounded linear operator $D_F f(x) \in \mathcal{L}(X, Y)$ satisfying:
$$f(x + h) - f(x) = D_F f(x)h + o(h) \quad \text{as } h \to 0,$$
i.e., $\lim_{h \to 0} \frac{\|f(x + h) - f(x) - D_F f(x)h\|_Y}{\|h\|_X} = 0$.

(b) **False.** Firstly, $h \in X$ is a vector in a general normed space, so division by $h$ is undefined. Secondly, $D_F f(x)$ is a linear operator acting on $h$, denoted $D_F f(x)h$, not a scalar quotient.

(c) $D_F f$ is a mapping from $X$ into the operator space $\mathcal{L}(X, Y)$:
$$D_F f : X \to \mathcal{L}(X, Y), \quad x \mapsto D_F f(x).$$
In general, $D_F f$ is **not linear**. For instance, if $f$ is linear, $D_F f(x) = f$ (a constant map), and a non-zero constant map is not linear.

(d) The **Gateaux derivative** of $f$ at $x$ in direction $h \in X$ is the directional derivative:
$$D_G f(x; h) := \lim_{s \to 0, s \in \mathbb{R}} \frac{f(x + sh) - f(x)}{s} \in Y.$$

(e) If $D_G f(x; h)$ exists for all $h \in X$, the Gateaux derivative operator is:
$$D_G f(x) : X \to Y, \quad h \mapsto D_G f(x; h).$$
In general, $D_G f(x)$ is **not necessarily linear** with respect to $h$, unless additional continuity or Fréchet conditions hold."""
    },
    {
        "id": "tute-s07-q07",
        "number": 122,
        "title": "Frechet Differentiability Implies Continuity",
        "week": 8,
        "tier": "Basic Knowledge",
        "difficulty": 3,
        "isDifficult": False,
        "topic": "Ch 6: Differential Calculus in Normed Spaces",
        "concepts": ["normed-spaces-duals-theorems"],
        "source": "Tutorial Sheet 07",
        "prompt": r"""Let $f : U \subset X \to Y$ where $X$ and $Y$ are normed spaces. Prove that if $f$ is Fréchet differentiable at $x \in U$, then $f$ is continuous at $x$.""",
        "solution": r"""By definition of the Fréchet derivative at $x$:
$$f(x + h) - f(x) = D_F f(x)h + o(h) \quad \text{where } \lim_{h \to 0} \frac{\|o(h)\|_Y}{\|h\|_X} = 0.$$
Taking the norm in $Y$ and applying the triangle inequality:
$$\|f(x + h) - f(x)\|_Y \le \|D_F f(x)h\|_Y + \|o(h)\|_Y.$$
Since $D_F f(x) \in \mathcal{L}(X, Y)$ is a bounded linear operator:
$$\|D_F f(x)h\|_Y \le \|D_F f(x)\| \|h\|_X.$$
Therefore:
$$\|f(x + h) - f(x)\|_Y \le \|D_F f(x)\| \|h\|_X + \|o(h)\|_Y.$$
As $h \to 0$ in $X$, $\|h\|_X \to 0$ and $\|o(h)\|_Y \to 0$.
Thus:
$$\lim_{h \to 0} \|f(x + h) - f(x)\|_Y = 0 \implies \lim_{h \to 0} f(x + h) = f(x).$$
Hence $f$ is continuous at $x$."""
    },
    {
        "id": "tute-s07-q08",
        "number": 123,
        "title": "Frechet Derivative of Bounded Linear Operators",
        "week": 8,
        "tier": "Basic Knowledge",
        "difficulty": 3,
        "isDifficult": False,
        "topic": "Ch 6: Differential Calculus in Normed Spaces",
        "concepts": ["normed-spaces-duals-theorems"],
        "source": "Tutorial Sheet 07",
        "prompt": r"""Let $X$ and $Y$ be two normed spaces and let $f \in \mathcal{L}(X, Y)$. Prove that $f$ is Fréchet differentiable everywhere on $X$ and $D_F f(x) = f$ for all $x \in X$.""",
        "solution": r"""By the linearity of $f$, for any $x, h \in X$:
$$f(x + h) - f(x) = f(x) + f(h) - f(x) = f(h).$$
Notice that $f$ is already a bounded linear operator from $X$ to $Y$ (since $f \in \mathcal{L}(X, Y)$).
Therefore:
$$f(x + h) - f(x) - f(h) = 0.$$
Then:
$$\lim_{h \to 0} \frac{\|f(x + h) - f(x) - f(h)\|_Y}{\|h\|_X} = \lim_{h \to 0} \frac{\|0\|_Y}{\|h\|_X} = 0.$$
By definition of the Fréchet derivative, $f$ is Fréchet differentiable at $x$ and:
$$D_F f(x) = f \quad \forall x \in X.$$"""
    },
    {
        "id": "tute-s07-q09",
        "number": 124,
        "title": "Variational Functional Derivative on C1([a, b])",
        "week": 8,
        "tier": "Advanced Knowledge",
        "difficulty": 5,
        "isDifficult": True,
        "topic": "Ch 6: Differential Calculus in Normed Spaces",
        "concepts": ["normed-spaces-duals-theorems"],
        "source": "Tutorial Sheet 07",
        "prompt": r"""Let $X = C^1([a, b])$ with norm $\|\phi\|_X = \left( \max_{a \le t \le b} |\phi(t)|^2 + \max_{a \le t \le b} |\phi'(t)|^2 \right)^{1/2}$.
Let $J : X \to \mathbb{R}$ be defined by:
$$J(\phi) = \frac{1}{2} \int_a^b \left( (\phi'(t))^2 + \phi^2(t) \right) dt.$$
Find $D_F J(\phi)$ and $D_G J(\phi)$.""",
        "solution": r"""We evaluate the increment $J(\phi + h) - J(\phi)$:
$$J(\phi + h) - J(\phi) = \frac{1}{2} \int_a^b \left( (\phi' + h')^2 + (\phi + h)^2 \right) dt - \frac{1}{2} \int_a^b \left( (\phi')^2 + \phi^2 \right) dt$$
$$= \int_a^b \left( \phi(t)h(t) + \phi'(t)h'(t) \right) dt + \frac{1}{2} \int_a^b \left( h^2(t) + (h'(t))^2 \right) dt.$$
Define the candidate linear functional:
$$T_\phi(h) := \int_a^b \left( \phi(t)h(t) + \phi'(t)h'(t) \right) dt.$$
$T_\phi$ is clearly linear in $h$.
To prove boundedness on $X$:
$$|T_\phi(h)| \le \int_a^b \left( |\phi(t)||h(t)| + |\phi'(t)||h'(t)| \right) dt$$
Applying Cauchy–Schwarz in $\mathbb{R}^2$:
$$|\phi h + \phi' h'| \le (\phi^2 + (\phi')^2)^{1/2} (h^2 + (h')^2)^{1/2} \le (\phi^2 + (\phi')^2)^{1/2} \|h\|_X.$$
Integrating over $[a, b]$:
$$|T_\phi(h)| \le \|h\|_X \int_a^b (\phi^2(t) + (\phi'(t))^2)^{1/2} dt = C_\phi \|h\|_X.$$
Thus $T_\phi \in \mathcal{L}(X, \mathbb{R}) = X^*$.
Now for the remainder term $R(h) = \frac{1}{2} \int_a^b (h^2(t) + (h'(t))^2) dt$:
$$|R(h)| \le \frac{1}{2} (b - a) \left( \max |h|^2 + \max |h'|^2 \right) = \frac{b - a}{2} \|h\|_X^2.$$
Thus:
$$\lim_{h \to 0} \frac{|R(h)|}{\|h\|_X} \le \lim_{h \to 0} \frac{b - a}{2} \|h\|_X = 0.$$
Hence $J$ is Fréchet differentiable at $\phi$ with:
$$D_F J(\phi)h = \int_a^b \left( \phi(t)h(t) + \phi'(t)h'(t) \right) dt.$$
Since Fréchet differentiability implies Gateaux differentiability with $D_G J = D_F J$:
$$D_G J(\phi)h = \int_a^b \left( \phi(t)h(t) + \phi'(t)h'(t) \right) dt.$$"""
    },
    {
        "id": "tute-s07-q10",
        "number": 125,
        "title": "Definition of the Lp Norm",
        "week": 8,
        "tier": "Assumed Knowledge",
        "difficulty": 1,
        "isDifficult": False,
        "topic": "Ch 7: The Lp Spaces",
        "concepts": ["lp-spaces-hilbert-spaces"],
        "source": "Tutorial Sheet 07",
        "prompt": r"""Define the norm $\|f\|_p$ for $f \in L^p(\Omega)$ for $1 \le p \le \infty$.""",
        "solution": r"""- For $1 \le p < \infty$:
$$\|f\|_p := \left( \int_\Omega |f(x)|^p \, d\mu \right)^{1/p}.$$
$L^p(\Omega)$ is the space of equivalence classes of measurable functions (equal a.e.) for which $\|f\|_p < \infty$.

- For $p = \infty$:
$$\|f\|_\infty := \mathrm{ess\,sup}_{x \in \Omega} |f(x)| = \inf \{M \ge 0 : \mu(\{x \in \Omega : |f(x)| > M\}) = 0\}.$$
$L^\infty(\Omega)$ is the space of essentially bounded measurable functions."""
    },
    {
        "id": "tute-s07-q11",
        "number": 126,
        "title": "Duality, Reflexivity, and Separability of Lp Spaces",
        "week": 8,
        "tier": "Assumed Knowledge",
        "difficulty": 2,
        "isDifficult": False,
        "topic": "Ch 7: The Lp Spaces",
        "concepts": ["lp-spaces-hilbert-spaces"],
        "source": "Tutorial Sheet 07",
        "prompt": r"""For the Lebesgue spaces $L^p$ ($1 \le p \le \infty$):
(a) What is the dual space of $L^p$?
(b) For which values of $p$ is $L^p$ reflexive?
(c) For which values of $p$ is $L^p$ separable?""",
        "solution": r"""| $p$ | Dual Space $(L^p)^*$ | Reflexive? | Separable? |
| :--- | :--- | :---: | :---: |
| $1 < p < \infty$ | $L^q$ where $\frac{1}{p} + \frac{1}{q} = 1$ | **Yes** | **Yes** |
| $p = 1$ | $L^\infty$ | **No** | **Yes** |
| $p = \infty$ | Strictly contains $L^1$ ($ba(\Omega)$) | **No** | **No** |

- $L^p$ is **reflexive** if and only if $1 < p < \infty$.
- $L^p$ is **separable** if and only if $1 \le p < \infty$ (assuming $\Omega \subseteq \mathbb{R}^d$ with Lebesgue measure). $L^\infty$ is never separable."""
    },
    {
        "id": "tute-s07-q12",
        "number": 127,
        "title": "Continuous Embedding of Lq into Lp on Bounded Domains",
        "week": 8,
        "tier": "Basic Knowledge",
        "difficulty": 3,
        "isDifficult": False,
        "topic": "Ch 7: The Lp Spaces",
        "concepts": ["lp-spaces-hilbert-spaces"],
        "source": "Tutorial Sheet 07",
        "prompt": r"""Prove that if $1 \le p < q \le \infty$, then $L^q(a, b) \subset L^p(a, b)$ and:
$$\|f\|_p \le (b - a)^{\frac{1}{p} - \frac{1}{q}} \|f\|_q.$$""",
        "solution": r"""We use **Hölder's Inequality**:
$$\int_a^b |u(x) v(x)| \, dx \le \|u\|_{p'} \|v\|_{q'}$$
where $\frac{1}{p'} + \frac{1}{q'} = 1$.
Write:
$$\int_a^b |f(x)|^p \, dx = \int_a^b |f(x)|^p \cdot 1 \, dx.$$
Set $u(x) = |f(x)|^p$ and $v(x) = 1$.
Choose $p' = \frac{q}{p} > 1$. Its Hölder conjugate exponent $q'$ is:
$$\frac{1}{q'} = 1 - \frac{1}{p'} = 1 - \frac{p}{q} = \frac{q - p}{q} \implies q' = \frac{q}{q - p}.$$
Applying Hölder's inequality:
$$\int_a^b |f(x)|^p \, dx \le \left( \int_a^b (|f(x)|^p)^{q/p} \, dx \right)^{p/q} \left( \int_a^b 1^{q'} \, dx \right)^{1/q'}$$
$$= \left( \int_a^b |f(x)|^q \, dx \right)^{p/q} (b - a)^{\frac{q - p}{q}} = \|f\|_q^p (b - a)^{1 - p/q}.$$
Taking the $p$-th root on both sides:
$$\|f\|_p = \left( \int_a^b |f(x)|^p \, dx \right)^{1/p} \le \|f\|_q (b - a)^{\frac{1}{p} - \frac{1}{q}}.$$
Since $b - a < \infty$, $(b - a)^{\frac{1}{p} - \frac{1}{q}} < \infty$.
Hence if $f \in L^q(a, b)$ (so $\|f\|_q < \infty$), then $\|f\|_p < \infty$, which proves $L^q(a, b) \subset L^p(a, b)$."""
    },
    {
        "id": "tute-s07-q13",
        "number": 128,
        "title": "Generalized Holder Inequality for Multiple Functions",
        "week": 8,
        "tier": "Advanced Knowledge",
        "difficulty": 5,
        "isDifficult": True,
        "topic": "Ch 7: The Lp Spaces",
        "concepts": ["lp-spaces-hilbert-spaces"],
        "source": "Tutorial Sheet 07",
        "prompt": r"""Assume that $p_j \in [1, \infty]$, $j = 1, \dots, k$, satisfy:
$$\frac{1}{p_1} + \frac{1}{p_2} + \dots + \frac{1}{p_k} = \frac{1}{p} \le 1.$$
Prove that if $f_j \in L^{p_j}$ and $f = f_1 f_2 \cdots f_k$, then $f \in L^p$ and:
$$\|f\|_p \le \|f_1\|_{p_1} \|f_2\|_{p_2} \cdots \|f_k\|_{p_k}.$$""",
        "solution": r"""We prove by induction on $k$.

**Base Case: $k = 2$.**
We have $\frac{1}{p_1} + \frac{1}{p_2} = \frac{1}{p}$.
Define $g_j = |f_j|^p$ and $q_j = \frac{p_j}{p}$ for $j = 1, 2$.
Then:
$$\frac{1}{q_1} + \frac{1}{q_2} = \frac{p}{p_1} + \frac{p}{p_2} = p\left(\frac{1}{p_1} + \frac{1}{p_2}\right) = p \cdot \frac{1}{p} = 1.$$
Applying the standard 2-function Hölder inequality to $g_1 \in L^{q_1}$ and $g_2 \in L^{q_2}$:
$$\|g_1 g_2\|_1 \le \|g_1\|_{q_1} \|g_2\|_{q_2}.$$
Notice that:
$$\|g_1 g_2\|_1 = \int |f_1 f_2|^p \, d\mu = \|f_1 f_2\|_p^p,$$
and:
$$\|g_j\|_{q_j} = \left( \int (|f_j|^p)^{p_j/p} \, d\mu \right)^{p/p_j} = \left( \int |f_j|^{p_j} \, d\mu \right)^{p/p_j} = \|f_j\|_{p_j}^p.$$
Therefore:
$$\|f_1 f_2\|_p^p \le \|f_1\|_{p_1}^p \|f_2\|_{p_2}^p.$$
Taking the $p$-th root yields $\|f_1 f_2\|_p \le \|f_1\|_{p_1} \|f_2\|_{p_2}$.

**Inductive Step:**
Assume the result holds for $k - 1$ functions.
Let $\frac{1}{r} = \frac{1}{p_1} + \dots + \frac{1}{p_{k-1}}$.
Then $\frac{1}{r} + \frac{1}{p_k} = \frac{1}{p}$.
By the base case for 2 functions:
$$\|(f_1 \cdots f_{k-1}) f_k\|_p \le \|f_1 \cdots f_{k-1}\|_r \|f_k\|_{p_k}.$$
By the inductive hypothesis applied to the $k - 1$ product:
$$\|f_1 \cdots f_{k-1}\|_r \le \|f_1\|_{p_1} \cdots \|f_{k-1}\|_{p_{k-1}}.$$
Combining both yields $\|f\|_p \le \prod_{j=1}^k \|f_j\|_{p_j}$."""
    },
    {
        "id": "tute-s07-q14",
        "number": 129,
        "title": "Lp Interpolation Inequality",
        "week": 8,
        "tier": "Advanced Knowledge",
        "difficulty": 5,
        "isDifficult": True,
        "topic": "Ch 7: The Lp Spaces",
        "concepts": ["lp-spaces-hilbert-spaces"],
        "source": "Tutorial Sheet 07",
        "prompt": r"""Prove that if $f \in L^p \cap L^q$ with $1 \le p \le q \le \infty$, then $f \in L^r$ for all $r \in [p, q]$ and:
$$\|f\|_r \le \|f\|_p^\alpha \|f\|_q^{1 - \alpha}$$
where $\alpha \in [0, 1]$ satisfies $\frac{1}{r} = \frac{\alpha}{p} + \frac{1 - \alpha}{q}$.""",
        "solution": r"""We decompose $|f|^r$:
$$|f|^r = |f|^{\alpha r} |f|^{(1 - \alpha)r}.$$
Applying Hölder's inequality with exponents $p_1 = \frac{p}{\alpha r}$ and $p_2 = \frac{q}{(1 - \alpha)r}$:
Notice that:
$$\frac{1}{p_1} + \frac{1}{p_2} = \frac{\alpha r}{p} + \frac{(1 - \alpha)r}{q} = r\left(\frac{\alpha}{p} + \frac{1 - \alpha}{q}\right) = r \cdot \frac{1}{r} = 1.$$
Since $p_1, p_2 \ge 1$ and $\frac{1}{p_1} + \frac{1}{p_2} = 1$, Hölder's inequality gives:
$$\|f\|_r^r = \int_\Omega |f|^r \, d\mu = \int_\Omega |f|^{\alpha r} |f|^{(1 - \alpha)r} \, d\mu$$
$$\le \left( \int_\Omega (|f|^{\alpha r})^{p/(\alpha r)} \, d\mu \right)^{\frac{\alpha r}{p}} \left( \int_\Omega (|f|^{(1 - \alpha)r})^{q/((1 - \alpha)r)} \, d\mu \right)^{\frac{(1 - \alpha)r}{q}}$$
$$= \left( \int_\Omega |f|^p \, d\mu \right)^{\frac{\alpha r}{p}} \left( \int_\Omega |f|^q \, d\mu \right)^{\frac{(1 - \alpha)r}{q}} = (\|f\|_p^p)^{\frac{\alpha r}{p}} (\|f\|_q^q)^{\frac{(1 - \alpha)r}{q}} = \|f\|_p^{\alpha r} \|f\|_q^{(1 - \alpha)r}.$$
Taking the $r$-th root on both sides yields:
$$\|f\|_r \le \|f\|_p^\alpha \|f\|_q^{1 - \alpha}.$$
This is the fundamental **$L^p$ Interpolation Inequality**."""
    }
]

def main():
    print(f"Writing {len(TUTORIAL_QUESTIONS)} questions for Tutorial Sheet 7...")
    for q in TUTORIAL_QUESTIONS:
        filepath = os.path.join(QUESTIONS_DIR, f"{q['id']}.md")
        frontmatter = {
            "id": q["id"],
            "number": q["number"],
            "title": f"Tute 7 Q{q['id'].split('q')[-1]}: {q['title']}",
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
*Refer to Chapters 5, 6, and 7 lecture slides and definitions in the connected Concept guide.*

<!-- split:solution -->


<!-- split:official -->
{q['solution']}
"""
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Created {q['id']}.md (Q{q['number']})")

if __name__ == "__main__":
    main()
