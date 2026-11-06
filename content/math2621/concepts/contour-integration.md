---
slug: "contour-integration"
title: "Contour Integrals & Cauchy-Goursat Theorem"
week: 5
category: "Integration"
summary: "Parameterization $\\int_\\gamma f(z) dz$, primitives, path independence, Cauchy-Goursat theorem."
prerequisites: ["cauchy-riemann-equations"]
---

### Contour Integration

1. **Definition by Parameterization:**
   Let $\gamma: [a, b] \to \mathbb{C}$ be a smooth curve. For continuous $f$:
   $$\int_\gamma f(z) \, dz = \int_a^b f(\gamma(t)) \, \gamma'(t) \, dt$$

2. **ML Inequality (Estimation Lemma):**
   If $|f(z)| \le M$ for all $z \in \gamma$, and the arc length of $\gamma$ is $L$:
   $$\left| \int_\gamma f(z) \, dz \right| \le M \cdot L$$

3. **Fundamental Theorem of Contour Integration:**
   If $f$ has a primitive $F$ ($F' = f$) in a domain containing $\gamma$:
   $$\int_\gamma f(z) \, dz = F(\gamma(b)) - F(\gamma(a))$$
   In particular, $\oint_\gamma f(z) \, dz = 0$ for any closed curve if $f$ has a primitive.

4. **Cauchy-Goursat Theorem:**
   If $f$ is holomorphic on a simply connected domain $\Omega$, then for any closed contour $\gamma \subset \Omega$:
   $$\oint_\gamma f(z) \, dz = 0$$

