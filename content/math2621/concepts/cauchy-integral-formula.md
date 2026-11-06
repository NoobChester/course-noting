---
slug: "cauchy-integral-formula"
title: "Cauchy's Integral Formula & Applications"
week: 6
category: "Integration & Holomorphicity"
summary: "Formulas for $f(z_0)$ and $f^{(n)}(z_0)$, Cauchy's inequalities, Liouville's theorem."
prerequisites: ["contour-integration"]
---

### Cauchy's Integral Formula

Let $\Omega$ be a simply connected domain, $\gamma$ a positively oriented simple closed contour in $\Omega$, and $f$ holomorphic on $\Omega$. For any point $z_0$ inside $\gamma$:

$$f(z_0) = \frac{1}{2\pi i} \oint_\gamma \frac{f(z)}{z - z_0} \, dz$$

### Generalized Formula (Higher Derivatives)
A holomorphic function is infinitely differentiable, with:
$$f^{(n)}(z_0) = \frac{n!}{2\pi i} \oint_\gamma \frac{f(z)}{(z - z_0)^{n+1}} \, dz$$

### Core Theorems:
1. **Cauchy's Estimate:**
   If $f$ is holomorphic on $B(z_0, R)$ and $|f(z)| \le M$ on $|z - z_0| = R$:
   $$|f^{(n)}(z_0)| \le \frac{n! M}{R^n}$$

2. **Liouville's Theorem:**
   Every bounded entire function is constant.
   *(Proof: Let $R \to \infty$ in Cauchy's estimate for $f'(z_0)$).*

3. **Generalized Liouville (Polynomial Growth):**
   If $f$ is entire and $|f(z)| \le A + B|z|^k$ for all $z$, then $f$ is a polynomial of degree at most $k$.

4. **Maximum Modulus Principle:**
   If $f$ is holomorphic and non-constant on a domain $\Omega$, $|f(z)|$ cannot attain a local maximum in $\Omega$. If $\Omega$ is bounded, the maximum of $|f|$ occurs on the boundary $\partial \Omega$.

