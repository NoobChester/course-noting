#!/usr/bin/env python3
"""
seed_math3051_tute3.py
Generates all Tutorial Sheet 3 questions (Q1 to Q19, numbering Q60 to Q78)
for MATH3051 with full official teacher solutions from Thanh Tran.
"""

import os
import json

COURSE_DIR = r"C:\Users\User\course noting\courses\MATH3051"
QUESTIONS_DIR = os.path.join(COURSE_DIR, "questions")
os.makedirs(QUESTIONS_DIR, exist_ok=True)

TUTORIAL_QUESTIONS = [
    {
        "id": "tute-s03-q01",
        "number": 60,
        "title": "Definitions of Topology, Topological Space, and Neighbourhoods",
        "week": 3,
        "tier": "Assumed Knowledge",
        "difficulty": 1,
        "isDifficult": False,
        "topic": "Ch 3: Topological Spaces",
        "concepts": ["metric-topological-foundations"],
        "source": "Tutorial Sheet 03",
        "prompt": r"""Give the following definitions:

(a) A topology on a non-empty set $X$.
(b) A topological space.
(c) Open and closed sets in a topological space.
(d) An interior point and the interior of a subset $A$ of a topological space $(X, \mathcal{T})$.
(e) A neighbourhood of a point $x$ in $X$.""",
        "solution": r"""(a) A **topology** $\mathcal{T}$ on a non-empty set $X$ is a collection of subsets of $X$ satisfying:
1. $\emptyset \in \mathcal{T}$ and $X \in \mathcal{T}$.
2. If $G_i \in \mathcal{T}$ for all $i \in I$ (arbitrary family), then $\bigcup_{i \in I} G_i \in \mathcal{T}$.
3. If $G_1, \dots, G_n \in \mathcal{T}$ (finite family), then $\bigcap_{i=1}^n G_i \in \mathcal{T}$.

(b) A **topological space** is an ordered pair $(X, \mathcal{T})$ where $X$ is a non-empty set and $\mathcal{T}$ is a topology on $X$.

(c) 
- An element $G \in \mathcal{T}$ is called an **open set** in $X$.
- A subset $F \subseteq X$ is called **closed** if its complement $F^c = X \setminus F$ is open (i.e. $F^c \in \mathcal{T}$).

(d) 
- A point $a \in A$ is an **interior point** of $A$ if there exists an open set $G \in \mathcal{T}$ such that $a \in G \subseteq A$.
- The **interior** of $A$, denoted $\mathring{A}$ or $\mathrm{Int}(A)$, is the union of all open subsets of $A$ (or the set of all interior points).

(e) A subset $N \subseteq X$ is a **neighbourhood** of a point $x \in X$ if there exists an open set $G \in \mathcal{T}$ such that $x \in G \subseteq N$."""
    },
    {
        "id": "tute-s03-q02",
        "number": 61,
        "title": "Axioms of General Topological Spaces (True or False)",
        "week": 3,
        "tier": "Assumed Knowledge",
        "difficulty": 2,
        "isDifficult": False,
        "topic": "Ch 3: Topological Spaces",
        "concepts": ["metric-topological-foundations"],
        "source": "Tutorial Sheet 03",
        "prompt": r"""Let $(X, \mathcal{T})$ be a topological space. Answer **True (T)** or **False (F)** to each of the following:

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
        "solution": r"""(a) **T**
(b) **T** (Definition of closed set)
(c) **F** (A set can be neither, or both)
(d) **T**
(e) **T**
(f) **T** (Arbitrary unions of open sets are open)
(g) **T** (Finite intersections of open sets are open)
(h) **F** (Countable intersections of open sets need not be open)
(i) **F**
(j) **T** (Finite unions of closed sets are closed)
(k) **F**
(l) **F**
(m) **T**
(n) **T**
(o) **T** (Arbitrary intersections of closed sets are closed)"""
    },
    {
        "id": "tute-s03-q03",
        "number": 62,
        "title": "Definitions of Interior and Closure in Topological Spaces",
        "week": 3,
        "tier": "Assumed Knowledge",
        "difficulty": 2,
        "isDifficult": False,
        "topic": "Ch 3: Topological Spaces",
        "concepts": ["metric-topological-foundations"],
        "source": "Tutorial Sheet 03",
        "prompt": r"""Let $(X, \mathcal{T})$ be a topological space and $A \subseteq X$.

(a) Give the definition of the interior of $A$.
(b) Give the definition of the closure of $A$.""",
        "solution": r"""(a) The **interior** of $A$, denoted $\mathring{A}$, is the set of all interior points of $A$. Equivalently, it is the largest open set contained in $A$:
$$\mathring{A} = \bigcup \{G \in \mathcal{T} : G \subseteq A\}.$$

(b) The **closure** of $A$, denoted $\bar{A}$, is the set of all contact points of $A$ (points $x \in X$ such that every neighbourhood of $x$ intersects $A$). Equivalently, it is the smallest closed set containing $A$:
$$\bar{A} = \bigcap \{F \subseteq X : F \text{ is closed and } A \subseteq F\}.$$"""
    },
    {
        "id": "tute-s03-q04",
        "number": 63,
        "title": "Topological Point Classification (True or False)",
        "week": 3,
        "tier": "Assumed Knowledge",
        "difficulty": 2,
        "isDifficult": False,
        "topic": "Ch 3: Topological Spaces",
        "concepts": ["metric-topological-foundations"],
        "source": "Tutorial Sheet 03",
        "prompt": r"""Let $(X, \mathcal{T})$ be a topological space and $A \subseteq X$. Answer **True (T)** or **False (F)**:

(a) If $a$ is an interior point of $A$, then $a \in A$.
(b) $\mathring{A} \subseteq A$.
(c) $\mathring{A} = A$ if and only if $A$ is open.
(d) A limit point of $A$ is a contact point of $A$.
(e) A contact point of $A$ is a limit point of $A$.
(f) If $a$ is a limit point of $A$, then $a \in A$.
(g) If $a$ is a limit point of $A$, then $a \notin A$.
(h) A boundary point of $A$ is a limit point of $A$.
(i) $\bar{A} = A$ if and only if $A$ is closed.
(j) The boundary of $A$ is closed.""",
        "solution": r"""(a) **T** (Interior points must belong to the set)
(b) **T** ($\mathring{A} \subseteq A$)
(c) **T** ($A$ is open iff $A = \mathring{A}$)
(d) **T** (Every punctured neighborhood intersects $A$, so every neighborhood intersects $A$)
(e) **F** (An isolated point of $A$ is a contact point but not a limit point)
(f) **F** (Limit points can lie outside $A$, e.g., $0$ for $(0, 1)$)
(g) **F** (Limit points can belong to $A$, e.g., $0$ for $[0, 1]$)
(h) **F** (An isolated point is a boundary point but not a limit point)
(i) **T** ($A$ is closed iff $A = \bar{A}$)
(j) **T** ($\partial A = \bar{A} \cap \overline{A^c}$ is the intersection of two closed sets, hence closed)"""
    },
    {
        "id": "tute-s03-q05",
        "number": 64,
        "title": "Set Inclusion Relations: Int(A), A, and Cl(A)",
        "week": 3,
        "tier": "Assumed Knowledge",
        "difficulty": 2,
        "isDifficult": False,
        "topic": "Ch 3: Topological Spaces",
        "concepts": ["metric-topological-foundations"],
        "source": "Tutorial Sheet 03",
        "prompt": r"""Which of the following statement(s) is (are) correct?

(1) $\bar{A} \subseteq \mathring{A} \subseteq A$
(2) $\mathring{A} \subseteq A \subseteq \bar{A}$
(3) $\mathring{A} \subseteq \bar{A} \subseteq A$
(4) $\bar{A} \subseteq A \subseteq \mathring{A}$""",
        "solution": r"""**Statement (2) is correct:**
$$\mathring{A} \subseteq A \subseteq \bar{A}$$
The interior is the largest open subset inside $A$, and the closure is the smallest closed superset containing $A$."""
    },
    {
        "id": "tute-s03-q06",
        "number": 65,
        "title": "Characterisation of Open Sets via Neighbourhoods",
        "week": 3,
        "tier": "Basic Knowledge",
        "difficulty": 3,
        "isDifficult": False,
        "topic": "Ch 3: Topological Spaces",
        "concepts": ["metric-topological-foundations"],
        "source": "Tutorial Sheet 03",
        "prompt": r"""Given a topological space $(X, \mathcal{T})$, show that $G \subseteq X$ is open if and only if every point $x \in G$ has a neighbourhood contained in $G$.""",
        "solution": r"""$(\implies)$ Assume $G$ is open.
For any $x \in G$, $G$ itself is an open set containing $x$ and $G \subseteq G$. By definition of neighbourhood, $G$ is a neighbourhood of $x$ contained in $G$.

$(\impliedby)$ Conversely, assume that for every $x \in G$, there exists a neighbourhood $N_x$ such that $N_x \subseteq G$.
By definition of neighbourhood, there exists an open set $G_x \in \mathcal{T}$ such that $x \in G_x \subseteq N_x \subseteq G$.
Then:
$$G = \bigcup_{x \in G} \{x\} \subseteq \bigcup_{x \in G} G_x \subseteq G \implies G = \bigcup_{x \in G} G_x.$$
Since each $G_x \in \mathcal{T}$ and $\mathcal{T}$ is closed under arbitrary unions, $G \in \mathcal{T}$, i.e., $G$ is open."""
    },
    {
        "id": "tute-s03-q07",
        "number": 66,
        "title": "Topological Properties of Intervals in R",
        "week": 3,
        "tier": "Basic Knowledge",
        "difficulty": 3,
        "isDifficult": False,
        "topic": "Ch 3: Topological Spaces",
        "concepts": ["metric-topological-foundations"],
        "source": "Tutorial Sheet 03",
        "prompt": r"""Consider $\mathbb{R}$ with the usual metric. For any $a < b < c$, define:
$$A_1 = (a, b), \quad A_2 = [a, b), \quad A_3 = (-\infty, a), \quad A_4 = [b, \infty), \quad A_5 = [a, b) \cup \{c\}.$$

(a) Which of the above sets are open and which are closed?
(b) Write down the interiors, closures, and boundaries of each set.""",
        "solution": r"""**(a)**
- **Open sets:** $A_1 = (a, b)$ and $A_3 = (-\infty, a)$.
- **Closed set:** $A_4 = [b, \infty)$.
- Neither open nor closed: $A_2$ and $A_5$.

**(b)**
- For $A_1 = (a, b)$:
  $\mathring{A}_1 = (a, b)$, $\bar{A}_1 = [a, b]$, $\partial A_1 = \{a, b\}$.
- For $A_2 = [a, b)$:
  $\mathring{A}_2 = (a, b)$, $\bar{A}_2 = [a, b]$, $\partial A_2 = \{a, b\}$.
- For $A_3 = (-\infty, a)$:
  $\mathring{A}_3 = (-\infty, a)$, $\bar{A}_3 = (-\infty, a]$, $\partial A_3 = \{a\}$.
- For $A_4 = [b, \infty)$:
  $\mathring{A}_4 = (b, \infty)$, $\bar{A}_4 = [b, \infty)$, $\partial A_4 = \{b\}$.
- For $A_5 = [a, b) \cup \{c\}$:
  $\mathring{A}_5 = (a, b)$, $\bar{A}_5 = [a, b] \cup \{c\}$, $\partial A_5 = \{a, b, c\}$."""
    },
    {
        "id": "tute-s03-q08",
        "number": 67,
        "title": "Endpoints as Limit Points of Open Intervals",
        "week": 3,
        "tier": "Basic Knowledge",
        "difficulty": 3,
        "isDifficult": False,
        "topic": "Ch 3: Topological Spaces",
        "concepts": ["metric-topological-foundations"],
        "source": "Tutorial Sheet 03",
        "prompt": r"""Show that $a$ is a limit point of $A = (a, b)$ in $\mathbb{R}$ with the usual topology.""",
        "solution": r"""We need to show that for any $\epsilon > 0$, the punctured neighborhood $(a - \epsilon, a + \epsilon) \setminus \{a\}$ intersects $(a, b)$.
By the Archimedean property, there exists $N \in \mathbb{N}$ such that $1/N < \min\{\epsilon, b - a\}$.
Consider the sequence $a_n = a + 1/n$ for $n \ge N$.
Then $a < a_n < a + (b - a) = b$, so $a_n \in (a, b)$ for all $n \ge N$.
Moreover, $|a_n - a| = 1/n \le 1/N < \epsilon$, so $a_n \in (a - \epsilon, a + \epsilon)$.
Since $a_n \ne a$, the open ball $B_\epsilon(a)$ contains a point in $A \setminus \{a\}$.
Thus $a$ is a limit point of $A$. (A symmetric argument shows $b$ is also a limit point of $A$)."""
    },
    {
        "id": "tute-s03-q09",
        "number": 68,
        "title": "Topology and Neighbourhoods on a Four-Point Set",
        "week": 3,
        "tier": "Basic Knowledge",
        "difficulty": 3,
        "isDifficult": False,
        "topic": "Ch 3: Topological Spaces",
        "concepts": ["metric-topological-foundations"],
        "source": "Tutorial Sheet 03",
        "prompt": r"""Let $X = \{1, 2, 3, 4\}$, $A = \{1, 2, 4\}$, and $G = \{1, 2, 3\}$.

(a) Show that $\mathcal{T} := \{\emptyset, G, X\}$ is a topology on $X$.
(b) Write down all neighbourhoods of $1$ in $(X, \mathcal{T})$.
(c) Write down all neighbourhoods of $2$ in $(X, \mathcal{T})$.
(d) Write down all neighbourhoods of $3$ in $(X, \mathcal{T})$.
(e) Write down all neighbourhoods of $4$ in $(X, \mathcal{T})$.
(f) Write down the interior, closure, and boundary of $A$. Give reasons.""",
        "solution": r"""**(a)** $\emptyset, X \in \mathcal{T}$.
Unions: $\emptyset \cup G = G \in \mathcal{T}$, $\emptyset \cup X = X \in \mathcal{T}$, $G \cup X = X \in \mathcal{T}$.
Intersections: $\emptyset \cap G = \emptyset \in \mathcal{T}$, $\emptyset \cap X = \emptyset \in \mathcal{T}$, $G \cap X = G \in \mathcal{T}$.
Hence $\mathcal{T}$ is a topology on $X$.

**(b), (c), (d)**
The open sets containing $1$ are $G$ and $X$. Any superset of an open set containing $x$ is a neighbourhood.
Since the only subsets containing $G$ are $G$ and $X$:
- Neighbourhoods of $1$: $G = \{1, 2, 3\}$ and $X = \{1, 2, 3, 4\}$.
- Neighbourhoods of $2$: $G$ and $X$.
- Neighbourhoods of $3$: $G$ and $X$.

**(e)**
The only open set containing $4$ is $X$.
- Neighbourhoods of $4$: $X$ only.

**(f)**
- **Interior $\mathring{A}$:** The open sets are $\emptyset, G, X$. Only $\emptyset \subseteq A$ (since $G = \{1, 2, 3\} \not\subseteq A$ because $3 \notin A$, and $X \not\subseteq A$). Thus $\mathring{A} = \emptyset$.
- **Closure $\bar{A}$:** The closed sets are the complements: $\emptyset^c = X$, $G^c = \{4\}$, $X^c = \emptyset$. The closed sets containing $A = \{1, 2, 4\}$ are only $X$. Thus $\bar{A} = X$.
- **Boundary $\partial A$:** $\partial A = \bar{A} \cap \overline{A^c} = X \cap \overline{\{3\}}$. The closed sets containing $\{3\}$ are only $X$. Thus $\overline{\{3\}} = X$, so $\partial A = X \cap X = X$."""
    },
    {
        "id": "tute-s03-q10",
        "number": 69,
        "title": "Subbasis Generated Topology on a 5-Point Space",
        "week": 3,
        "tier": "Basic Knowledge",
        "difficulty": 4,
        "isDifficult": False,
        "topic": "Ch 3: Topological Spaces",
        "concepts": ["metric-topological-foundations"],
        "source": "Tutorial Sheet 03",
        "prompt": r"""Let $X = \{a, b, c, d, e\}$, $\mathcal{S} = \{\{a\}, \{c\}, \{d\}\}$, and $A = \{a, b\}$.

(a) Write down the topology $\mathcal{T}_\mathcal{S}$ generated by $\mathcal{S}$.
(b) Find the interior $\mathring{A}$ of $A$. Give reasons.
(c) Find the closure $\bar{A}$ of $A$. Give reasons.
(d) Find the boundary $\partial A$ of $A$. Give reasons.""",
        "solution": r"""**(a)** Finite intersections of elements of $\mathcal{S}$:
$\emptyset$ (e.g. $\{a\} \cap \{c\}$), $\{a\}, \{c\}, \{d\}$, and $X$ (empty intersection).
Arbitrary unions of these finite intersections yield:
$$\mathcal{T}_\mathcal{S} = \{\emptyset, X, \{a\}, \{c\}, \{d\}, \{a, c\}, \{a, d\}, \{c, d\}, \{a, c, d\}\}$$

**(b) Interior $\mathring{A}$:**
The open subsets contained in $A = \{a, b\}$ are $\emptyset$ and $\{a\}$.
The largest open subset is $\{a\}$. Thus $\mathring{A} = \{a\}$.

**(c) Closure $\bar{A}$:**
The closed sets are complements of open sets:
$$\mathcal{F} = \{X, \emptyset, \{b, c, d, e\}, \{a, b, d, e\}, \{a, b, c, e\}, \{b, d, e\}, \{b, c, e\}, \{a, b, e\}, \{b, e\}\}$$
The closed sets containing $A = \{a, b\}$ are:
$\{a, b, d, e\}$, $\{a, b, c, e\}$, and $X$.
Their intersection is:
$$\bar{A} = \{a, b, d, e\} \cap \{a, b, c, e\} \cap X = \{a, b, e\}.$$

**(d) Boundary $\partial A$:**
$A^c = \{c, d, e\}$. The closed sets containing $A^c$ are $\{b, c, d, e\}$ and $X$.
Thus $\overline{A^c} = \{b, c, d, e\}$.
Therefore:
$$\partial A = \bar{A} \cap \overline{A^c} = \{a, b, e\} \cap \{b, c, d, e\} = \{b, e\}.$$"""
    },
    {
        "id": "tute-s03-q11",
        "number": 70,
        "title": "Advanced Interior, Closure, and Boundary Set Identities",
        "week": 3,
        "tier": "Advanced Knowledge",
        "difficulty": 5,
        "isDifficult": True,
        "topic": "Ch 3: Topological Spaces",
        "concepts": ["metric-topological-foundations"],
        "source": "Tutorial Sheet 03",
        "prompt": r"""Let $X$ be a topological space. Prove the following statements:

(a) $\mathrm{Int}(\mathring{A}) = \mathring{A}$ for all $A \subseteq X$.
(b) $\mathrm{Int}(A) \cup \mathrm{Int}(B) \subseteq \mathrm{Int}(A \cup B)$ for all $A, B \subseteq X$.
(c) Give an example where the inclusion in (b) is strict.
(d) For all $A, B \subseteq X$:
$$\mathrm{Int}(A \cup B) \subseteq \mathrm{Int}(A) \cup \mathrm{Int}(B) \iff \partial A \cap \partial B \subseteq \partial(A \cup B).$$
(e) $\bar{\bar{A}} = \bar{A}$ for all $A \subseteq X$.
(f) $\overline{A \cup B} = \bar{A} \cup \bar{B}$ for all $A, B \subseteq X$.""",
        "solution": r"""**(a)** Since $\mathring{A}$ is open, its interior is itself: $\mathrm{Int}(\mathring{A}) = \mathring{A}$.

**(b)** Since $A \subseteq A \cup B$, $\mathrm{Int}(A) \subseteq \mathrm{Int}(A \cup B)$. Similarly $\mathrm{Int}(B) \subseteq \mathrm{Int}(A \cup B)$. Taking the union yields $\mathrm{Int}(A) \cup \mathrm{Int}(B) \subseteq \mathrm{Int}(A \cup B)$.

**(c)** Let $A = (0, 1)$ and $B = [1, 2)$ in $\mathbb{R}$. Then $A \cup B = (0, 2)$, so $\mathrm{Int}(A \cup B) = (0, 2)$.
However, $\mathrm{Int}(A) = (0, 1)$ and $\mathrm{Int}(B) = (1, 2)$, so $\mathrm{Int}(A) \cup \mathrm{Int}(B) = (0, 1) \cup (1, 2) \subsetneq (0, 2)$.

**(d)** 
$(\implies)$ Assume $\mathrm{Int}(A \cup B) \subseteq \mathrm{Int}(A) \cup \mathrm{Int}(B)$. Suppose for contradiction that $\exists x \in \partial A \cap \partial B$ with $x \notin \partial(A \cup B)$.
Since $x \in \partial A$, $x \notin \mathrm{Int}(A)$. Since $x \in \partial B$, $x \notin \mathrm{Int}(B)$. Thus $x \notin \mathrm{Int}(A) \cup \mathrm{Int}(B) \implies x \notin \mathrm{Int}(A \cup B)$.
Since $x \notin \partial(A \cup B)$ and $x \notin \mathrm{Int}(A \cup B)$, we must have $x \in \mathrm{Int}((A \cup B)^c) = \mathrm{Int}(A^c \cap B^c) \subseteq \mathrm{Int}(A^c)$.
This implies $x \notin \partial A$, contradiction! Hence $\partial A \cap \partial B \subseteq \partial(A \cup B)$.

$(\impliedby)$ Conversely, assume $\partial A \cap \partial B \subseteq \partial(A \cup B)$. Suppose $\exists x \in \mathrm{Int}(A \cup B)$ such that $x \notin \mathrm{Int}(A) \cup \mathrm{Int}(B)$.
Since $x \in \mathrm{Int}(A \cup B)$, $x \notin \partial(A \cup B) \implies x \notin \partial A \cap \partial B$.
Thus $x \notin \partial A$ (without loss of generality). Since $x \notin \mathrm{Int}(A)$ and $x \notin \partial A$, $x \in \mathrm{Int}(A^c)$.
Thus $\exists$ neighbourhood $G$ with $x \in G \subseteq A^c$. Also $\exists G'$ with $x \in G' \subseteq A \cup B$.
Then $x \in G \cap G' \subseteq A^c \cap (A \cup B) \subseteq B \implies x \in \mathrm{Int}(B)$, contradiction!

**(e)** Since $\bar{A}$ is closed, its closure is itself: $\bar{\bar{A}} = \bar{A}$.

**(f)** $\bar{A}$ and $\bar{B}$ are closed, so $\bar{A} \cup \bar{B}$ is a closed set containing $A \cup B$, so $\overline{A \cup B} \subseteq \bar{A} \cup \bar{B}$.
Conversely, $A \subseteq A \cup B \implies \bar{A} \subseteq \overline{A \cup B}$ and $B \subseteq A \cup B \implies \bar{B} \subseteq \overline{A \cup B}$, so $\bar{A} \cup \bar{B} \subseteq \overline{A \cup B}$."""
    },
    {
        "id": "tute-s03-q12",
        "number": 71,
        "title": "Definitions: Convergence, Compactness, Continuous Maps",
        "week": 3,
        "tier": "Assumed Knowledge",
        "difficulty": 2,
        "isDifficult": False,
        "topic": "Ch 3: Convergence & Compactness",
        "concepts": ["metric-topological-foundations"],
        "source": "Tutorial Sheet 03",
        "prompt": r"""Give the following definitions:

(a) A sequence $\{x_n\}$ converging to $x$ in a topological space $(X, \mathcal{T})$.
(b) An open cover, a subcover, and a compact set in $X$.
(c) A continuous map from a topological space $(X, \mathcal{T}_X)$ into $(Y, \mathcal{T}_Y)$.""",
        "solution": r"""(a) $\{x_n\}$ **converges** to $x$ in $(X, \mathcal{T})$ if for every neighbourhood $U$ of $x$, there exists $N \in \mathbb{N}$ such that $x_n \in U$ for all $n > N$.

(b) 
- An **open cover** of a subset $K \subseteq X$ is a family $\{G_i\}_{i \in I} \subseteq \mathcal{T}$ such that $K \subseteq \bigcup_{i \in I} G_i$.
- A **subcover** is a subfamily $\{G_j\}_{j \in J}$ with $J \subseteq I$ such that $K \subseteq \bigcup_{j \in J} G_j$.
- A subset $K$ is **compact** if every open cover of $K$ has a finite subcover.

(c) A mapping $f : X \to Y$ is **continuous** if for every open set $V \in \mathcal{T}_Y$, the preimage $f^{-1}(V) \in \mathcal{T}_X$ (the preimage of every open set is open)."""
    },
    {
        "id": "tute-s03-q13",
        "number": 72,
        "title": "Function Spaces C(X) and the Arzela-Ascoli Theorem",
        "week": 3,
        "tier": "Basic Knowledge",
        "difficulty": 3,
        "isDifficult": False,
        "topic": "Ch 3: Continuous Mappings & Compactness",
        "concepts": ["metric-topological-foundations"],
        "source": "Tutorial Sheet 03",
        "prompt": r"""Let $X$ be a metric space and $C(X)$ be the space of continuous mappings from $X$ into $\mathbb{R}$.

(a) If $f \in C(X)$, define what it means for $f$ to be bounded.
(b) If $\mathcal{F} \subseteq C(X)$, define what it means for $\mathcal{F}$ to be uniformly bounded.
(c) If $\mathcal{F} \subseteq C(X)$, define what it means for $\mathcal{F}$ to be equicontinuous.
(d) What is the Arzelà–Ascoli theorem about?""",
        "solution": r"""(a) $f$ is **bounded** if there exists $M > 0$ such that $|f(x)| \le M$ for all $x \in X$.

(b) A family $\mathcal{F}$ is **uniformly bounded** if there exists a single constant $M > 0$ such that:
$$|f(x)| \le M \quad \forall f \in \mathcal{F}, \; \forall x \in X.$$

(c) $\mathcal{F}$ is **equicontinuous** if for every $\epsilon > 0$, there exists $\delta > 0$ such that:
$$d(x, y) < \delta \implies |f(x) - f(y)| < \epsilon \quad \forall f \in \mathcal{F}, \; \forall x, y \in X.$$

(d) The **Arzelà–Ascoli Theorem** characterizes compactness in function spaces:
Let $X$ be a compact metric space. A subset $\mathcal{F} \subseteq C(X)$ (equipped with the supremum norm $\|f\|_\infty = \max_{x \in X} |f(x)|$) is **relatively compact** (its closure is compact) if and only if $\mathcal{F}$ is **uniformly bounded** and **equicontinuous**."""
    },
    {
        "id": "tute-s03-q14",
        "number": 73,
        "title": "Closed Subsets of Compact Spaces are Compact",
        "week": 3,
        "tier": "Basic Knowledge",
        "difficulty": 3,
        "isDifficult": False,
        "topic": "Ch 3: Compactness",
        "concepts": ["metric-topological-foundations"],
        "source": "Tutorial Sheet 03",
        "prompt": r"""Let $(X, \mathcal{T})$ be a topological space and $M \subseteq X$. Is the following statement true? If not, add a sufficient condition so that it becomes true:

"If $X$ is compact and $M$ is closed, then $M$ is compact.\"""",
        "solution": r"""**The statement is True.**
*Proof:* Let $\{G_i\}_{i \in I}$ be an arbitrary open cover of $M$, so $M \subseteq \bigcup_{i \in I} G_i$.
Since $M$ is closed, its complement $M^c = X \setminus M$ is open in $X$.
Then $\{G_i\}_{i \in I} \cup \{M^c\}$ is an open cover of the whole space $X$:
$$X = M \cup M^c \subseteq \left(\bigcup_{i \in I} G_i\right) \cup M^c.$$
Since $X$ is compact, there exists a finite subcover of $X$:
$$X \subseteq G_{i_1} \cup G_{i_2} \cup \dots \cup G_{i_k} \cup M^c.$$
Since $M \cap M^c = \emptyset$, it follows that:
$$M \subseteq G_{i_1} \cup G_{i_2} \cup \dots \cup G_{i_k}.$$
Thus $\{G_{i_1}, \dots, G_{i_k}\}$ is a finite subcover of $M$. Hence $M$ is compact."""
    },
    {
        "id": "tute-s03-q15",
        "number": 74,
        "title": "Non-Compactness of Bounded Non-Closed Intervals",
        "week": 3,
        "tier": "Advanced Knowledge",
        "difficulty": 5,
        "isDifficult": True,
        "topic": "Ch 3: Compactness",
        "concepts": ["metric-topological-foundations"],
        "source": "Tutorial Sheet 03",
        "prompt": r"""Use the definition of compactness (via open covers) to show that the intervals $(a, b)$, $[a, b)$, and $(a, b]$ are not compact.""",
        "solution": r"""Consider $(a, b)$.
Define open sets $G_n = (a + 1/n, b)$ for $n \in \mathbb{N}$ with $1/n < b - a$.
For any $x \in (a, b)$, $x - a > 0$, so by the Archimedean property there exists $n_0$ such that $1/n_0 < x - a \implies a + 1/n_0 < x < b$.
Thus $x \in G_{n_0}$, which proves that:
$$(a, b) = \bigcup_{n=1}^\infty G_n.$$
So $\{G_n\}_{n=1}^\infty$ is an open cover of $(a, b)$.
Assume for contradiction that $(a, b)$ is compact. Then there exists a finite subcover $\{G_{n_1}, \dots, G_{n_k}\}$.
Let $n^* = \max_{1 \le i \le k} n_i$. Then since $G_n \subseteq G_{n+1}$, we have:
$$\bigcup_{i=1}^k G_{n_i} = G_{n^*} = (a + 1/n^*, b).$$
Choose $x \in (a, a + 1/n^*)$. Then $x \in (a, b)$, but $x \notin G_{n^*}$, contradiction!
Hence $(a, b)$ is not compact.

The exact same open cover construction shows $[a, b)$ is not compact (using $G_n = [a, b - 1/n)$) and $(a, b]$ is not compact."""
    },
    {
        "id": "tute-s03-q16",
        "number": 75,
        "title": "Non-Compactness of R via Open Covers",
        "week": 3,
        "tier": "Advanced Knowledge",
        "difficulty": 4,
        "isDifficult": False,
        "topic": "Ch 3: Compactness",
        "concepts": ["metric-topological-foundations"],
        "source": "Tutorial Sheet 03",
        "prompt": r"""Show using the definition of compactness that the real line $\mathbb{R}$ equipped with the usual topology is not compact.""",
        "solution": r"""Consider the family of open sets $\mathcal{G} = \{G_n\}_{n \in \mathbb{Z}}$ defined by:
$$G_n := (n, n + 3/2).$$
Each $G_n$ is open in $\mathbb{R}$.
For any $x \in \mathbb{R}$, letting $n = \lfloor x \rfloor$, we have $n \le x < n + 1 < n + 3/2$, so $x \in G_n$.
Therefore, $\mathcal{G}$ is an open cover of $\mathbb{R}$:
$$\mathbb{R} = \bigcup_{n \in \mathbb{Z}} G_n.$$
Assume for contradiction that $\mathbb{R}$ is compact. Then there exists a finite subcover $\{G_{n_1}, G_{n_2}, \dots, G_{n_N}\}$.
Let $n_{\min} = \min_{1 \le i \le N} n_i$ and $n_{\max} = \max_{1 \le i \le N} n_i$.
Then:
$$\bigcup_{i=1}^N G_{n_i} \subseteq (n_{\min}, n_{\max} + 3/2).$$
This is a bounded interval, so it cannot contain the unbounded set $\mathbb{R}$.
Contradiction! Hence $\mathbb{R}$ is not compact."""
    },
    {
        "id": "tute-s03-q17",
        "number": 76,
        "title": "Compactness of the Harmonic Sequence with its Limit Point",
        "week": 3,
        "tier": "Advanced Knowledge",
        "difficulty": 5,
        "isDifficult": True,
        "topic": "Ch 3: Compactness",
        "concepts": ["metric-topological-foundations"],
        "source": "Tutorial Sheet 03",
        "prompt": r"""Use the definition of compactness (via open covers) to show that the set
$$M = \{1/n : n \in \mathbb{N}\} \cup \{0\}$$
is compact in $\mathbb{R}$ equipped with the usual topology.""",
        "solution": r"""Let $\{G_i\}_{i \in I}$ be an arbitrary open cover of $M$, so $M \subseteq \bigcup_{i \in I} G_i$.
Since $0 \in M$, there must exist some index $i_0 \in I$ such that $0 \in G_{i_0}$.
Because $G_{i_0}$ is open, there exists $\epsilon > 0$ such that $(-\epsilon, \epsilon) \subseteq G_{i_0}$.
Since $1/n \to 0$ as $n \to \infty$, there exists $N \in \mathbb{N}$ such that:
$$n > N \implies \frac{1}{n} \in (-\epsilon, \epsilon) \subseteq G_{i_0}.$$
Thus, the single open set $G_{i_0}$ covers $0$ and infinitely many points $\{1/n : n > N\}$.
It remains to cover the remaining finite set of points $\{1, 1/2, 1/3, \dots, 1/N\}$.
For each $k \in \{1, \dots, N\}$, since $1/k \in M$, there exists some $i_k \in I$ such that $1/k \in G_{i_k}$.
Then the finite subcollection:
$$\{G_{i_0}, G_{i_1}, G_{i_2}, \dots, G_{i_N}\}$$
covers all of $M$:
$$M \subseteq G_{i_0} \cup G_{i_1} \cup \dots \cup G_{i_N}.$$
Since every open cover has a finite subcover, $M$ is compact."""
    },
    {
        "id": "tute-s03-q18",
        "number": 77,
        "title": "Continuous Bijection on Compact Spaces is a Homeomorphism",
        "week": 3,
        "tier": "Advanced Knowledge",
        "difficulty": 5,
        "isDifficult": True,
        "topic": "Ch 3: Continuous Mappings & Compactness",
        "concepts": ["metric-topological-foundations"],
        "source": "Tutorial Sheet 03",
        "prompt": r"""Show that if $f$ is a continuous bijection from a compact metric space $X$ onto a metric space $Y$, then the inverse map $f^{-1} : Y \to X$ is also continuous (i.e. $f$ is a homeomorphism).""",
        "solution": r"""Let $g = f^{-1} : Y \to X$.
To show $g$ is continuous, it suffices to prove that the preimage of any closed set under $g$ is closed in $Y$.
Let $F \subseteq X$ be an arbitrary closed subset.
The preimage under $g$ is:
$$g^{-1}(F) = (f^{-1})^{-1}(F) = f(F).$$
We must show that $f(F)$ is closed in $Y$:
1. Since $X$ is compact and $F \subseteq X$ is closed, $F$ is compact (by Q14).
2. The continuous image of a compact set is compact (Theorem 3.7.1), so $f(F)$ is compact in $Y$.
3. In any metric space (or Hausdorff topological space), every compact subset is closed. Thus $f(F)$ is closed in $Y$.
Therefore, $g^{-1}(F) = f(F)$ is closed in $Y$ for every closed $F \subseteq X$.
This proves that $g = f^{-1}$ is continuous."""
    },
    {
        "id": "tute-s03-q19",
        "number": 78,
        "title": "Heine-Cantor Theorem: Continuity on Compact Intervals",
        "week": 3,
        "tier": "Advanced Knowledge",
        "difficulty": 5,
        "isDifficult": True,
        "topic": "Ch 3: Continuous Mappings & Compactness",
        "concepts": ["metric-topological-foundations"],
        "source": "Tutorial Sheet 03",
        "prompt": r"""Prove that if $f \in C([a, b])$, then $f$ is uniformly continuous on $[a, b]$, i.e., for any $\epsilon > 0$, there exists $\delta > 0$ such that for any $x, y \in [a, b]$:
$$|x - y| < \delta \implies |f(x) - f(y)| < \epsilon.$$""",
        "solution": r"""We prove by contradiction.
Assume $f$ is not uniformly continuous.
Then there exists $\epsilon_0 > 0$ such that for every $n \in \mathbb{N}$ (setting $\delta = 1/n$), there exist points $x_n, y_n \in [a, b]$ satisfying:
$$|x_n - y_n| < \frac{1}{n} \quad \text{and} \quad |f(x_n) - f(y_n)| \ge \epsilon_0. \quad (1)$$
Since $[a, b]$ is bounded, by the Bolzano–Weierstrass theorem the sequence $\{x_n\}$ has a convergent subsequence $\{x_{n_k}\}$:
$$x_{n_k} \to x^* \in [a, b] \quad \text{as } k \to \infty.$$
Now consider the corresponding subsequence $\{y_{n_k}\}$:
$$|y_{n_k} - x^*| \le |y_{n_k} - x_{n_k}| + |x_{n_k} - x^*| < \frac{1}{n_k} + |x_{n_k} - x^*| \to 0 \quad \text{as } k \to \infty.$$
Thus $\{y_{n_k}\}$ also converges to the same limit $x^*$.
Since $f$ is continuous at $x^*$:
$$f(x_{n_k}) \to f(x^*) \quad \text{and} \quad f(y_{n_k}) \to f(x^*).$$
Therefore:
$$|f(x_{n_k}) - f(y_{n_k})| \le |f(x_{n_k}) - f(x^*)| + |f(x^*) - f(y_{n_k})| \to 0 \quad \text{as } k \to \infty.$$
However, from (1), $|f(x_{n_k}) - f(y_{n_k})| \ge \epsilon_0 > 0$ for all $k$, which is a contradiction!
Hence $f$ must be uniformly continuous on $[a, b]$."""
    }
]

def main():
    print(f"Writing {len(TUTORIAL_QUESTIONS)} questions for Tutorial Sheet 3...")
    for q in TUTORIAL_QUESTIONS:
        filepath = os.path.join(QUESTIONS_DIR, f"{q['id']}.md")
        frontmatter = {
            "id": q["id"],
            "number": q["number"],
            "title": f"Tute 3 Q{q['id'].split('q')[-1]}: {q['title']}",
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
*Refer to Chapter 3 lecture slides and definitions in the connected Concept guide.*

<!-- split:solution -->


<!-- split:official -->
{q['solution']}
"""
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Created {q['id']}.md (Q{q['number']})")

if __name__ == "__main__":
    main()
