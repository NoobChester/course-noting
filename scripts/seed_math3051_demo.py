#!/usr/bin/env python3
"""
seed_math3051_demo.py
Generates the demonstration set for MATH3051:
- 13 questions from Tutorial Sheet 1 (with official teacher solutions)
- 24 textbook exercises from Chapter 1 of LectureNotes.pdf
"""

import os
import json

COURSE_DIR = r"C:\Users\User\course noting\courses\MATH3051"
QUESTIONS_DIR = os.path.join(COURSE_DIR, "questions")
os.makedirs(QUESTIONS_DIR, exist_ok=True)

# -------------------------------------------------------------
# 1. TUTORIAL SHEET 1 QUESTIONS (Q1 to Q13)
# -------------------------------------------------------------
tute_q1_to_13 = [
    {
        "id": "tute-s01-q01",
        "number": 1,
        "title": "Definitions of Set Operations & De Morgan's Laws",
        "tier": "Assumed Knowledge",
        "difficulty": 2,
        "isDifficult": False,
        "topic": "Sets & Functions",
        "prompt": """Let $A$ and $B$ be two subsets of a given set $U$.

(a) Write down the definition of the complement of $A$.
(b) Write down the definitions of the union, intersection, and difference of $A$ and $B$.
(c) Find $(A \\cup B)^c$ and $(A \\cap B)^c$.""",
        "solution": """(a) The complement of $A$ in $U$ is:
$$A^c := \\{x \\in U : x \\notin A\\}$$

(b) 
- Union: $A \\cup B := \\{x \\in U : x \\in A \\text{ or } x \\in B\\}$
- Intersection: $A \\cap B := \\{x \\in U : x \\in A \\text{ and } x \\in B\\}$
- Difference: $A \\setminus B := \\{x \\in U : x \\in A \\text{ and } x \\notin B\\}$

(c) By De Morgan's Laws (Theorem 1.1.3):
$$(A \\cup B)^c = A^c \\cap B^c$$
$$(A \\cap B)^c = A^c \\cup B^c$$"""
    },
    {
        "id": "tute-s01-q02",
        "number": 2,
        "title": "Images and Pre-images of Mappings",
        "tier": "Assumed Knowledge",
        "difficulty": 2,
        "isDifficult": False,
        "topic": "Sets & Functions",
        "prompt": """Let $f$ be a mapping from a set $X$ into a set $Y$.

(a) Define the image of a subset $A$ of $X$.
(b) Define the pre-image (inverse image) of a subset $B$ of $Y$.""",
        "solution": """(a) The image of a subset $A \\subseteq X$ is:
$$f(A) := \\{f(x) : x \\in A\\} = \\{y \\in Y : \\exists x \\in A \\text{ such that } f(x) = y\\}$$

(b) The pre-image (or inverse image) of a subset $B \\subseteq Y$ is:
$$f^{-1}(B) := \\{x \\in X : f(x) \\in B\\}$$
*(Note: $f^{-1}(B)$ does not require $f$ to be invertible).*"""
    },
    {
        "id": "tute-s01-q03",
        "number": 3,
        "title": "Domain, Range, Images, and Pre-images of Square Root",
        "tier": "Assumed Knowledge",
        "difficulty": 2,
        "isDifficult": False,
        "topic": "Sets & Functions",
        "prompt": """Let $f : [0, \\infty) \\to \\mathbb{R}$ be defined by $f(x) = \\sqrt{x}$.

(a) Find the domain $D$ and the range $R$ of $f$.
(b) Find $f([0, 1])$, $f([2, 4])$, and $f([-4, 4])$.
(c) Find $f^{-1}([0, 2])$ and $f^{-1}((-2, 2])$.""",
        "solution": """(a) 
- Domain: $D = [0, \\infty)$.
- Range: $R = f(D) = [0, \\infty)$.

(b)
- $f([0, 1]) = [\\sqrt{0}, \\sqrt{1}] = [0, 1]$.
- $f([2, 4]) = [\\sqrt{2}, \\sqrt{4}] = [\\sqrt{2}, 2]$.
- $f([-4, 4])$ is **undefined** because $[-4, 4] \\not\\subseteq D = [0, \\infty)$.

(c)
- $f^{-1}([0, 2]) = \\{x \\in [0, \\infty) : \\sqrt{x} \\in [0, 2]\\} = [0, 4]$.
- $f^{-1}((-2, 2]) = \\{x \\in [0, \\infty) : -2 < \\sqrt{x} \\le 2\\} = [0, 4]$, since $\\sqrt{x} \\ge 0 > -2$ for all $x \\in D$."""
    },
    {
        "id": "tute-s01-q04",
        "number": 4,
        "title": "Injective, Surjective, and Bijective Mappings",
        "tier": "Assumed Knowledge",
        "difficulty": 2,
        "isDifficult": False,
        "topic": "Sets & Functions",
        "prompt": """Let $f : X \\to Y$.

(a) Define what it means by $f$ injective (or one-to-one).
(b) Define what it means by $f$ surjective (or onto).
(c) Define what it means by $f$ bijective (or one-to-one and onto).""",
        "solution": """(a) $f$ is injective (or one-to-one) if for any $x_1, x_2 \\in X$:
$$f(x_1) = f(x_2) \\implies x_1 = x_2$$
Equivalently, for every $y \\in Y$, there exists at most one $x \\in X$ such that $f(x) = y$.

(b) $f$ is surjective (or onto) if $f(X) = Y$. In other words, for every $y \\in Y$, there exists at least one $x \\in X$ such that $f(x) = y$.

(c) $f$ is bijective if $f$ is both injective and surjective. That is, for every $y \\in Y$, there exists a unique $x \\in X$ such that $f(x) = y$."""
    },
    {
        "id": "tute-s01-q05",
        "number": 5,
        "title": "Classification of Finite Set Mappings (Figure 1)",
        "tier": "Assumed Knowledge",
        "difficulty": 2,
        "isDifficult": False,
        "topic": "Sets & Functions",
        "prompt": """Consider the mappings plotted in Figure 1 of Sheet 1:
- $f_1: X_1 \\to Y_1$
- $f_2: X_2 \\to Y_2$
- $f_3: X_3 \\to Y_3$
- $f_4: X_4 \\to Y_4$
- $f_5: X_5 \\to Y_5$
- $f_6: X_6 \\to Y_6$

(a) Which mappings are injective (or one-to-one)?
(b) Which mappings are surjective (or onto)?
(c) Which mappings are bijective?""",
        "solution": """(a) **Injective**: $f_2$.  
*(Note: $f_6$ is not a valid mapping because an element in the domain has multiple arrows).*

(b) **Surjective**: $f_4$.  
*(Note: $f_5$ is not a valid mapping because an element in the domain has multiple arrows).*

(c) **Bijective**: None! (Neither $f_2$ nor $f_4$ is both one-to-one and onto)."""
    },
    {
        "id": "tute-s01-q06",
        "number": 6,
        "title": "Injectivity & Surjectivity of Power Functions with Varied Domains",
        "tier": "Assumed Knowledge",
        "difficulty": 2,
        "isDifficult": False,
        "topic": "Sets & Functions",
        "prompt": """Consider the following functions:
$$g_1 : (0, \\infty) \\to (0, \\infty), \\quad g_1(x) = \\sqrt{x}$$
$$g_2 : (0, \\infty) \\to \\mathbb{R}, \\quad g_2(x) = \\sqrt{x}$$
$$g_3 : \\mathbb{R} \\to \\mathbb{R}, \\quad g_3(x) = x^2$$
$$g_4 : \\mathbb{R} \\to [0, \\infty), \\quad g_4(x) = x^2$$
$$g_5 : [0, \\infty) \\to [0, \\infty), \\quad g_5(x) = x^2$$
$$g_6 : \\mathbb{R} \\to \\mathbb{R}, \\quad g_6(x) = x^3$$

(a) Plot the above functions.
(b) Which functions are injective?
(c) Which functions are surjective?
(d) Which functions are bijective?""",
        "solution": """(a) Standard sketches of $\\sqrt{x}, x^2, x^3$ over their defined domains.
(b) **Injective**: $g_1, g_2, g_5, g_6$. (For $g_3, g_4$, $(-x)^2 = x^2$, so they fail injectivity).
(c) **Surjective**: $g_1, g_4, g_5, g_6$. (For $g_2$, negative values in codomain $\\mathbb{R}$ are missed; for $g_3$, negative values are missed).
(d) **Bijective**: $g_1, g_5, g_6$ (both injective and surjective)."""
    },
    {
        "id": "tute-s01-q07",
        "number": 7,
        "title": "Archimedean Property of Real Numbers",
        "tier": "Exam Standard",
        "difficulty": 3,
        "isDifficult": False,
        "topic": "The Real Numbers",
        "prompt": """Prove that for any $\\epsilon > 0$, there exists a positive integer $n$ such that
$$\\frac{1}{n} < \\epsilon$$""",
        "solution": """This is the Archimedean property of real numbers (Theorem 1.4.10).
Let $a = \\epsilon > 0$ and $b = 1$.
By the Archimedean theorem, there exists $n \\in \\mathbb{N}$ such that $n a > b$, i.e.:
$$n \\epsilon > 1 \\implies \\frac{1}{n} < \\epsilon$$
*(Alternative: By definition of limit, since $\\lim_{n \\to \\infty} \\frac{1}{n} = 0$, for any $\\epsilon > 0$ there exists $n \\in \\mathbb{N}$ such that $1/n < \\epsilon$).*"""
    },
    {
        "id": "tute-s01-q08",
        "number": 8,
        "title": "Comparison of Real Numbers via Arbitrary Epsilon",
        "tier": "Exam Standard",
        "difficulty": 3,
        "isDifficult": False,
        "topic": "The Real Numbers",
        "prompt": """Let $a$ and $b$ be two real numbers which satisfy
$$a \\le b + \\epsilon \\quad \\forall \\epsilon > 0$$
Show that $a \\le b$.""",
        "solution": """We prove this by contradiction.
Assume that $b < a$. Then $a - b > 0$.
Choose:
$$\\epsilon = \\frac{a - b}{2} > 0$$
Then:
$$a \\le b + \\epsilon = b + \\frac{a - b}{2} = \\frac{a + b}{2} < a$$
which gives $a < a$, a contradiction!
Hence $a \\le b$ must hold."""
    },
    {
        "id": "tute-s01-q09",
        "number": 9,
        "title": "Uniqueness of the Least Upper Bound",
        "tier": "Exam Standard",
        "difficulty": 3,
        "isDifficult": False,
        "topic": "The Real Numbers",
        "prompt": """Prove that the least upper bound of a set $A$ of real numbers, if it exists, is unique.""",
        "solution": """A common technique to prove uniqueness is to assume that there exist two least upper bounds, say $M_1 = \\sup A$ and $M_2 = \\sup A$.
- Since $M_1$ is the least upper bound and $M_2$ is an upper bound, we have $M_1 \\le M_2$.
- On the other hand, since $M_2$ is the least upper bound and $M_1$ is an upper bound, we have $M_2 \\le M_1$.

Hence $M_1 = M_2$, proving that the supremum is unique."""
    },
    {
        "id": "tute-s01-q10",
        "number": 10,
        "title": "Characterisation of Supremum and Infimum",
        "tier": "Exam Standard",
        "difficulty": 3,
        "isDifficult": False,
        "topic": "The Real Numbers",
        "prompt": """Find $\\sup A$ and $\\inf B$ where:
$$A = \\left\\{ 4 - \\frac{1}{n} : n \\in \\mathbb{N} \\right\\} \\quad \\text{and} \\quad B = \\left\\{ \\frac{1}{n} : n \\in \\mathbb{N} \\right\\}$$""",
        "solution": """We prove $\\sup A = 4$ and $\\inf B = 0$ using the characterisation of supremum/infimum:

**1. For $\\sup A = 4$:**
(i) First note that $4 - 1/n \\le 4$ for all $n \\in \\mathbb{N}$. Thus $4$ is an upper bound for $A$.
(ii) Next consider $\\epsilon > 0$. We must show $4 - \\epsilon$ is not an upper bound of $A$, i.e. find $a \\in A$ such that $4 - \\epsilon < a$.
By definition of $A$, this requires finding $n_0 \\in \\mathbb{N}$ such that $4 - \\epsilon < 4 - 1/n_0 \\iff 1/n_0 < \\epsilon$.
This integer $n_0$ exists due to the Archimedean property (Q7). Thus $\\sup A = 4$.

**2. For $\\inf B = 0$:**
(i) First note that $0 \\le 1/n$ for all $n \\in \\mathbb{N}$. Thus $0$ is a lower bound for $B$.
(ii) Next consider $\\epsilon > 0$. We must show $0 + \\epsilon = \\epsilon$ is not a lower bound, i.e. find $1/n_0 \\in B$ such that $1/n_0 < \\epsilon$. Again this integer $n_0$ exists by the Archimedean property.
Thus $\\inf B = 0$."""
    },
    {
        "id": "tute-s01-q11",
        "number": 11,
        "title": "Density of Irrationals in the Real Line",
        "tier": "Exam Standard",
        "difficulty": 3,
        "isDifficult": False,
        "topic": "The Real Numbers",
        "prompt": """Show that between any two distinct real numbers, there exists an irrational number.""",
        "solution": """Consider two real numbers $a$ and $b$, and assume that $a < b$.
By subtracting $\\sqrt{2}$, we have $a - \\sqrt{2} < b - \\sqrt{2}$.
By the density of $\\mathbb{Q}$ in $\\mathbb{R}$ (Theorem 1.4.12), there exists a rational number $q \\in \\mathbb{Q}$ such that:
$$a - \\sqrt{2} < q < b - \\sqrt{2}$$
This implies:
$$a < q + \\sqrt{2} < b$$
Clearly $q + \\sqrt{2}$ is irrational, because if it were rational, then $\\sqrt{2} = (q + \\sqrt{2}) - q$ would be the difference of two rationals, hence rational, which contradicts Theorem 1.4.7 ($\\sqrt{2} \\notin \\mathbb{Q}$).
Hence $q + \\sqrt{2}$ is an irrational number strictly between $a$ and $b$."""
    },
    {
        "id": "tute-s01-q12",
        "number": 12,
        "title": "Subsequence Index Inequality by Induction",
        "tier": "Exam Standard",
        "difficulty": 3,
        "isDifficult": False,
        "topic": "The Real Numbers",
        "prompt": """Let $\\{a_{n_i}\\}_{i \\in \\mathbb{N}}$ be a subsequence of a sequence $\\{a_n\\}$. Show that
$$n_i \\ge i \\quad \\forall i \\in \\mathbb{N}$$""",
        "solution": """We prove by mathematical induction on $i$.
- **Base Step ($i = 1$)**: Clearly $n_1 \\ge 1$ because $n_1 \\in \\mathbb{N}$.
- **Inductive Step**: Assume that $n_i \\ge i$.
  Since indices of a subsequence are strictly increasing, $n_{i+1} > n_i$.
  Since $n_i, n_{i+1} \\in \\mathbb{N}$, $n_{i+1} > n_i \\ge i \\implies n_{i+1} \\ge i + 1$.

Hence $n_i \\ge i$ for all $i \\in \\mathbb{N}$."""
    },
    {
        "id": "tute-s01-q13",
        "number": 13,
        "title": "Convergence of Cauchy Sequences with a Convergent Subsequence",
        "tier": "DN/HD Advanced",
        "difficulty": 5,
        "isDifficult": True,
        "topic": "The Real Numbers",
        "prompt": """Recall that $\\{a_n\\}$ is called a Cauchy sequence in $\\mathbb{R}$ if
$$\\forall \\epsilon > 0, \\; \\exists N > 0 : n, m > N \\implies |a_n - a_m| < \\epsilon$$
Show that if $\\{a_n\\}$ is a Cauchy sequence of real numbers which has a convergent subsequence, then $\\{a_n\\}$ is also convergent and it converges to the same limit.""",
        "solution": """Assume that $\\{a_{n_k}\\}$ is a subsequence of $\\{a_n\\}$ such that $a_{n_k} \\to a$ as $k \\to \\infty$.
Given $\\epsilon > 0$:
1. There exists $N_1 > 0$ such that:
   $$k > N_1 \\implies |a_{n_k} - a| < \\frac{\\epsilon}{2}$$
2. Since $\\{a_n\\}$ is a Cauchy sequence, there exists $N_2 > 0$ such that:
   $$m, n > N_2 \\implies |a_m - a_n| < \\frac{\\epsilon}{2}$$

Let $N = \\max\\{N_1, N_2\\}$.
By using Exercise (Q12), for any $k > N$:
$$n_k \\ge k > N \\ge N_2$$
Thus, using the triangle inequality:
$$|a_k - a| \\le |a_k - a_{n_k}| + |a_{n_k} - a| < \\frac{\\epsilon}{2} + \\frac{\\epsilon}{2} = \\epsilon$$
This shows that $a_k \\to a$ as $k \\to \\infty$. Hence $\\{a_n\\}$ converges to $a$. $\\blacksquare$"""
    }
]

# -------------------------------------------------------------
# 2. LECTURE NOTES CHAPTER 1 TEXTBOOK EXERCISES (1.1 to 1.24)
# -------------------------------------------------------------
book_ch1_exercises = [
    {
        "ex": "1.1",
        "num": 14,
        "title": "De Morgan's Laws for Arbitrary Families of Sets",
        "subtopic": "Set Theory and Functions",
        "diff": 2,
        "hard": False,
        "prompt": "Prove the second identity in Theorem 1.1.3:\n$$\\left(\\bigcap_{i \\in I} A_i\\right)^c = \\bigcup_{i \\in I} A_i^c$$"
    },
    {
        "ex": "1.2",
        "num": 15,
        "title": "Image of Intersection Under a Mapping",
        "subtopic": "Set Theory and Functions",
        "diff": 2,
        "hard": False,
        "prompt": "Prove that in general $f(A \\cap B) \\ne f(A) \\cap f(B)$; see Theorem 1.2.3. Give an explicit counterexample."
    },
    {
        "ex": "1.3",
        "num": 16,
        "title": "Properties of Inverse Images Under Mappings",
        "subtopic": "Set Theory and Functions",
        "diff": 3,
        "hard": False,
        "prompt": "Prove Theorem 1.2.4:\n- $f^{-1}(\\emptyset) = \\emptyset, \\quad f^{-1}(Y) = X$\n- $f^{-1}(B^c) = (f^{-1}(B))^c$\n- $B_1 \\subseteq B_2 \\implies f^{-1}(B_1) \\subseteq f^{-1}(B_2)$\n- $f^{-1}\\left(\\bigcup_{i \\in I} B_i\\right) = \\bigcup_{i \\in I} f^{-1}(B_i)$\n- $f^{-1}\\left(\\bigcap_{i \\in I} B_i\\right) = \\bigcap_{i \\in I} f^{-1}(B_i)$"
    },
    {
        "ex": "1.4",
        "num": 17,
        "title": "Image and Pre-image Inclusions & Injectivity/Surjectivity",
        "subtopic": "Set Theory and Functions",
        "diff": 3,
        "hard": False,
        "prompt": "Let $f$ be a mapping from $X$ to $Y$, and let $A \\subseteq X$ and $B \\subseteq Y$ be arbitrary subsets.\nProve the following:\n(a) $f(f^{-1}(B)) \\subseteq B$\n(b) $f(f^{-1}(B)) = B \\iff f$ is surjective (onto)\n(c) $A \\subseteq f^{-1}(f(A))$\n(d) $A = f^{-1}(f(A)) \\iff f$ is injective (one-to-one)"
    },
    {
        "ex": "1.5",
        "num": 18,
        "title": "Preservation of Intersections Characterises Injectivity",
        "subtopic": "Set Theory and Functions",
        "diff": 3,
        "hard": False,
        "prompt": "Let $f$ be a mapping from $X$ to $Y$, and let $A_1, A_2 \\subseteq X$. Prove that\n$$f(A_1 \\cap A_2) = f(A_1) \\cap f(A_2) \\iff f \\text{ is injective (one-to-one)}$$"
    },
    {
        "ex": "1.6",
        "num": 19,
        "title": "Complements of Images Characterise Surjectivity & Bijectivity",
        "subtopic": "Set Theory and Functions",
        "diff": 4,
        "hard": False,
        "prompt": "Let $f$ be a mapping from $X$ to $Y$ and let $A$ be a subset of $X$. Prove that:\n(a) $(f(A))^c \\subseteq f(A^c) \\iff f$ is surjective (onto)\n(b) $(f(A))^c = f(A^c) \\iff f$ is bijective"
    },
    {
        "ex": "1.7",
        "num": 20,
        "title": "The Archimedean Property",
        "subtopic": "The Real Numbers",
        "diff": 2,
        "hard": False,
        "prompt": "Prove that for any $\\epsilon > 0$, there exists a positive integer $n$ such that $\\frac{1}{n} < \\epsilon$."
    },
    {
        "ex": "1.8",
        "num": 21,
        "title": "Epsilon-Inequality Characterisation of Order",
        "subtopic": "The Real Numbers",
        "diff": 2,
        "hard": False,
        "prompt": "Let $a$ and $b$ be two real numbers which satisfy $a \\le b + \\epsilon$ for all $\\epsilon > 0$. Show that $a \\le b$."
    },
    {
        "ex": "1.9",
        "num": 22,
        "title": "Uniqueness of Least Upper Bound",
        "subtopic": "The Real Numbers",
        "diff": 2,
        "hard": False,
        "prompt": "Prove that the least upper bound of a set $A$ of real numbers, if it exists, is unique."
    },
    {
        "ex": "1.10",
        "num": 23,
        "title": "Supremum and Infimum Computations",
        "subtopic": "The Real Numbers",
        "diff": 2,
        "hard": False,
        "prompt": "Find $\\sup A$ and $\\inf B$ where $A = \\{4 - \\frac{1}{n} : n \\in \\mathbb{N}\\}$ and $B = \\{\\frac{1}{n} : n \\in \\mathbb{N}\\}$."
    },
    {
        "ex": "1.11",
        "num": 24,
        "title": "Density of Irrationals",
        "subtopic": "The Real Numbers",
        "diff": 3,
        "hard": False,
        "prompt": "Show that between any two distinct real numbers, there exists an irrational number."
    },
    {
        "ex": "1.12",
        "num": 25,
        "title": "Supremum of a Rational Lower Set",
        "subtopic": "The Real Numbers",
        "diff": 3,
        "hard": False,
        "prompt": "Let $a$ be a given real number. Find $\\sup A$ where $A = \\{x \\in \\mathbb{Q} : x \\le a\\}$. Justify using the density of $\\mathbb{Q}$."
    },
    {
        "ex": "1.13",
        "num": 26,
        "title": "Supremum and Infimum of Bounded Irrationals",
        "subtopic": "The Real Numbers",
        "diff": 3,
        "hard": False,
        "prompt": "Let $A = \\{x \\in \\mathbb{R} : x \\text{ is irrational and } x^2 < 2\\}$. Find $\\sup A$ and $\\inf A$."
    },
    {
        "ex": "1.14",
        "num": 27,
        "title": "Order of Infima and Suprema for Nested Subsets",
        "subtopic": "The Real Numbers",
        "diff": 2,
        "hard": False,
        "prompt": "Let $A$ and $B$ be two subsets of $\\mathbb{R}$ satisfying $\\emptyset \\ne B \\subseteq A \\subset \\mathbb{R}$. Show that:\n$$\\inf A \\le \\inf B \\le \\sup B \\le \\sup A$$"
    },
    {
        "ex": "1.15",
        "num": 28,
        "title": "Supremum and Infimum of Set Unions",
        "subtopic": "The Real Numbers",
        "diff": 3,
        "hard": False,
        "prompt": "Let $A$ and $B$ be two bounded non-empty subsets of $\\mathbb{R}$. Show that:\n(a) $\\sup(A \\cup B) = \\max \\{\\sup A, \\sup B\\}$\n(b) $\\inf(A \\cup B) = \\min \\{\\inf A, \\inf B\\}$"
    },
    {
        "ex": "1.16",
        "num": 29,
        "title": "Minkowski Sum and Product of Sets",
        "subtopic": "The Real Numbers",
        "diff": 3,
        "hard": False,
        "prompt": "Let $A$ and $B$ be two non-empty and bounded subsets of $\\mathbb{R}$. Define:\n$$A + B := \\{x + y : x \\in A \\text{ and } y \\in B\\}, \\quad A \\cdot B := \\{xy : x \\in A \\text{ and } y \\in B\\}$$\n(a) Prove that $\\sup(A + B) = \\sup A + \\sup B$.\n(b) Assume further that the elements of $A$ and $B$ are non-negative. Prove that $\\sup(A \\cdot B) = \\sup A \\cdot \\sup B$."
    },
    {
        "ex": "1.17",
        "num": 30,
        "title": "Reciprocal Bounds of Strictly Positive Sequences",
        "subtopic": "The Real Numbers",
        "diff": 3,
        "hard": False,
        "prompt": "Let $\\{a_n\\}$ be a bounded sequence of real numbers such that $\\inf_{n \\in \\mathbb{N}} a_n > 0$. Show that:\n(a) $\\sup_{n \\in \\mathbb{N}} \\frac{1}{a_n} = \\frac{1}{\\inf_{n \\in \\mathbb{N}} a_n}$\n(b) $\\inf_{n \\in \\mathbb{N}} \\frac{1}{a_n} = \\frac{1}{\\sup_{n \\in \\mathbb{N}} a_n}$"
    },
    {
        "ex": "1.18",
        "num": 31,
        "title": "Inequalities for Sums of Sequences",
        "subtopic": "The Real Numbers",
        "diff": 4,
        "hard": False,
        "prompt": "Let $\\{a_n\\}$ and $\\{b_n\\}$ be two bounded sequences of real numbers.\n(a) Show that:\n$$\\inf_{n \\in \\mathbb{N}} a_n + \\inf_{n \\in \\mathbb{N}} b_n \\le \\inf_{n \\in \\mathbb{N}} (a_n + b_n) \\le \\sup_{n \\in \\mathbb{N}} a_n + \\inf_{n \\in \\mathbb{N}} b_n \\le \\sup_{n \\in \\mathbb{N}} (a_n + b_n) \\le \\sup_{n \\in \\mathbb{N}} a_n + \\sup_{n \\in \\mathbb{N}} b_n$$\n(b) Are the opposite inequalities true? Provide counterexamples if not."
    },
    {
        "ex": "1.19",
        "num": 32,
        "title": "Inequalities for Products of Non-negative Sequences",
        "subtopic": "The Real Numbers",
        "diff": 4,
        "hard": False,
        "prompt": "Let $\\{a_n\\}$ and $\\{b_n\\}$ be two bounded sequences of non-negative real numbers.\n(a) Show that:\n$$\\inf_{n \\in \\mathbb{N}} a_n \\inf_{n \\in \\mathbb{N}} b_n \\le \\inf_{n \\in \\mathbb{N}} (a_n b_n) \\le \\sup_{n \\in \\mathbb{N}} (a_n b_n) \\le \\sup_{n \\in \\mathbb{N}} a_n \\sup_{n \\in \\mathbb{N}} b_n$$\n(b) Are the opposite inequalities true?"
    },
    {
        "ex": "1.20",
        "num": 33,
        "title": "Subsequence Index Property",
        "subtopic": "The Real Numbers",
        "diff": 2,
        "hard": False,
        "prompt": "Let $\\{a_{n_i}\\}_{i \\in \\mathbb{N}}$ be a subsequence of a sequence $\\{a_n\\}$. Show that $n_i \\ge i$ for all $i \\in \\mathbb{N}$."
    },
    {
        "ex": "1.21",
        "num": 34,
        "title": "Convergence of Cauchy Sequence via Subsequence",
        "subtopic": "The Real Numbers",
        "diff": 4,
        "hard": True,
        "prompt": "Show that if $\\{a_n\\}$ is a Cauchy sequence which has a convergent subsequence, then $\\{a_n\\}$ is also convergent and it converges to the same limit."
    },
    {
        "ex": "1.22",
        "num": 35,
        "title": "Countability of Positive Even Numbers",
        "subtopic": "Countable sets",
        "diff": 2,
        "hard": False,
        "prompt": "Show that the set of all positive even numbers is countable by constructing an explicit bijection to $\\mathbb{N}$."
    },
    {
        "ex": "1.23",
        "num": 36,
        "title": "Countability of Positive Odd Numbers",
        "subtopic": "Countable sets",
        "diff": 2,
        "hard": False,
        "prompt": "Show that the set of all positive odd numbers is countable by constructing an explicit bijection to $\\mathbb{N}$."
    },
    {
        "ex": "1.24",
        "num": 37,
        "title": "Countability of Powers of Two",
        "subtopic": "Countable sets",
        "diff": 2,
        "hard": False,
        "prompt": "Show that the set $\\{2, 4, 8, \\dots, 2^n, \\dots\\}$ is countable by constructing an explicit bijection to $\\mathbb{N}$."
    }
]

def main():
    print("Seeding Tutorial Sheet 1 Questions...")
    for q in tute_q1_to_13:
        filepath = os.path.join(QUESTIONS_DIR, f"{q['id']}.md")
        frontmatter = {
            "id": q["id"],
            "number": q["number"],
            "title": q["title"],
            "week": 1,
            "topic": q["topic"],
            "tier": q["tier"],
            "difficulty": q["difficulty"],
            "isDifficult": q["isDifficult"],
            "isNonExaminable": False,
            "status": "Unattempted",
            "concepts": ["metric-topological-foundations"],
            "source": "Tutorial Sheet 01",
            "starred": False,
            "createdAt": "2026-11-07T00:00:00.000Z",
            "updatedAt": "2026-11-07T00:00:00.000Z"
        }
        content = f"""---
{json.dumps(frontmatter, indent=2)}
---

{q['prompt']}

<!-- split:hints -->
*Work through definitions and verify boundary cases.*

<!-- split:solution -->


<!-- split:official -->
{q['solution']}
"""
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Created {q['id']}.md (Q{q['number']})")

    print("\nSeeding Lecture Notes Chapter 1 Exercises...")
    for ex in book_ch1_exercises:
        filepath = os.path.join(QUESTIONS_DIR, f"book-ch01-ex{ex['ex'].replace('.', '-')}.md")
        frontmatter = {
            "id": f"book-ch01-ex{ex['ex'].replace('.', '-')}",
            "number": ex["num"],
            "title": f"Exercise {ex['ex']}: {ex['title']}",
            "week": 1,
            "topic": f"Ch 1: {ex['subtopic']}",
            "tier": "Textbook Exercise",
            "difficulty": ex["diff"],
            "isDifficult": ex["hard"],
            "isNonExaminable": False,
            "status": "Unattempted",
            "concepts": ["metric-topological-foundations"],
            "source": "Lecture Notes Ch 1",
            "starred": False,
            "createdAt": "2026-11-07T00:00:00.000Z",
            "updatedAt": "2026-11-07T00:00:00.000Z"
        }
        content = f"""---
{json.dumps(frontmatter, indent=2)}
---

{ex['prompt']}

<!-- split:hints -->
*Refer to Chapter 1 of Thanh Tran's Lecture Notes.*

<!-- split:solution -->


<!-- split:official -->
*Exercise {ex['ex']} from Lecture Notes Section 1.7. Write your formal proof in the Solution tab and verify against definitions in the connected Concept guide.*
"""
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Created book-ch01-ex{ex['ex'].replace('.', '-')}.md (Q{ex['num']})")

    print(f"\nDone! Ingested {len(tute_q1_to_13)} Tutorial questions and {len(book_ch1_exercises)} Textbook exercises.")

if __name__ == "__main__":
    main()
