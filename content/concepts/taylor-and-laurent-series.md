---
slug: "taylor-and-laurent-series"
title: "Taylor and Laurent Series & Singularities"
week: 7
category: "Series & Singularities"
summary: "Expansion in disks and annuli, classification of singularities: removable, poles, essential."
prerequisites: ["cauchy-integral-formula"]
---

### Taylor & Laurent Series

1. **Taylor Series:**
   If $f$ is holomorphic in the open disk $|z - z_0| < R$, then:
   $$f(z) = \sum_{n=0}^\infty a_n (z - z_0)^n, \qquad a_n = \frac{f^{(n)}(z_0)}{n!}$$
   The radius of convergence $R$ equals the distance from $z_0$ to the nearest singularity of $f$.

2. **Laurent Series:**
   If $f$ is holomorphic in an annulus $A = \{z : r < |z - z_0| < R\}$, then:
   $$f(z) = \sum_{n=-\infty}^\infty a_n (z - z_0)^n = \underbrace{\sum_{n=1}^\infty \frac{a_{-n}}{(z - z_0)^n}}_{\text{Principal Part}} + \underbrace{\sum_{n=0}^\infty a_n (z - z_0)^n}_{\text{Analytic Part}}$$
   where $a_n = \frac{1}{2\pi i} \oint_\gamma \frac{f(w)}{(w - z_0)^{n+1}} \, dw$.

3. **Classification of Isolated Singularities at $z_0$:**
   Look at the principal part $\sum_{n=1}^\infty a_{-n} (z - z_0)^{-n}$:
   - **Removable Singularity:** All $a_{-n} = 0$. $\lim_{z \to z_0} f(z)$ exists and is finite (Riemann's Removable Singularity Theorem).
   - **Pole of Order $m$ ($m \ge 1$):** $a_{-m} \ne 0$ and $a_{-n} = 0$ for all $n > m$. $\lim_{z \to z_0} |f(z)| = \infty$.
   - **Essential Singularity:** Infinitely many negative powers are non-zero. The limit does not exist (Casorati-Weierstrass Theorem: $f(B^\circ(z_0, r))$ is dense in $\mathbb{C}$).

