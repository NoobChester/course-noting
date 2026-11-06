---
slug: "rouches-theorem-argument-principle"
title: "Argument Principle & Rouch\u00e9's Theorem"
week: 9
category: "Root Counting & Geometry"
summary: "Counting zeros and poles: $\\frac{1}{2\\pi i} \\oint \\frac{f'}{f} dz = Z - P$, Rouch\u00e9's $|f| > |g|$ bound."
prerequisites: ["residue-calculus"]
---

### Argument Principle & Rouché's Theorem

1. **The Argument Principle:**
   Let $f$ be meromorphic inside and on a simple closed contour $C$, with no zeros or poles on $C$. Then:
   $$\frac{1}{2\pi i} \oint_C \frac{f'(z)}{f(z)} \, dz = Z - P$$
   where $Z$ is the number of zeros and $P$ is the number of poles of $f$ inside $C$ (counted with multiplicity).
   Geometrically, $\frac{1}{2\pi} \Delta_C \arg f(z) = Z - P$.

2. **Rouché's Theorem:**
   Let $f$ and $g$ be holomorphic inside and on a simple closed contour $C$. If the strict inequality:
   $$|g(z)| < |f(z)| \quad \text{holds for all } z \in C,$$
   then $f(z)$ and $f(z) + g(z)$ have the exact same number of zeros inside $C$ (counted with multiplicity).

3. **Strategy for Root Counting:**
   - To find the number of roots of $P(z) = 0$ in $|z| < R$:
     Identify the dominating term on $|z| = R$ as $f(z)$, and let $g(z) = P(z) - f(z)$.
     Verify that $|g(z)| < |f(z)|$ on $|z| = R$. Then $P(z)$ has the same number of roots in $|z| < R$ as $f(z)$.

