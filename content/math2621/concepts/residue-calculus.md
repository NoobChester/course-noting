---
slug: "residue-calculus"
title: "Cauchy's Residue Theorem & Integral Evaluation"
week: 8
category: "Residue Calculus"
summary: "Residue calculation rules, Jordan's Lemma, evaluation of improper, trig, and indented integrals."
prerequisites: ["taylor-and-laurent-series"]
---

### Residues & The Residue Theorem

The **residue** of $f$ at an isolated singularity $z_0$ is the coefficient $a_{-1}$ in its Laurent series:
$$\operatorname{Res}(f, z_0) = a_{-1} = \frac{1}{2\pi i} \oint_\gamma f(z) \, dz$$

### Residue Calculation Rules
1. **Simple Pole ($m=1$):**
   $$\operatorname{Res}(f, z_0) = \lim_{z \to z_0} (z - z_0) f(z)$$
   If $f(z) = \frac{p(z)}{q(z)}$ with $p(z_0) \ne 0, q(z_0) = 0, q'(z_0) \ne 0$:
   $$\operatorname{Res}(f, z_0) = \frac{p(z_0)}{q'(z_0)}$$

2. **Pole of Order $m$ ($m \ge 2$):**
   $$\operatorname{Res}(f, z_0) = \frac{1}{(m-1)!} \lim_{z \to z_0} \frac{d^{m-1}}{dz^{m-1}} \left[ (z - z_0)^m f(z) \right]$$

3. **Cauchy's Residue Theorem:**
   $$\oint_C f(z) \, dz = 2\pi i \sum_{k=1}^N \operatorname{Res}(f, z_k)$$

### Standard Applications to Real Integrals
1. **Rational Functions $\int_{-\infty}^\infty \frac{P(x)}{Q(x)} dx$ ($\deg Q \ge \deg P + 2$, no real poles):**
   $$\int_{-\infty}^\infty \frac{P(x)}{Q(x)} \, dx = 2\pi i \sum_{\operatorname{Im}(z_k) > 0} \operatorname{Res}\left(\frac{P}{Q}, z_k\right)$$

2. **Trigonometric Integrals $\int_0^{2\pi} R(\cos\theta, \sin\theta) d\theta$:**
   Substitute $z = e^{i\theta}, \, dz = i z d\theta, \, \cos\theta = \frac{z + z^{-1}}{2}, \, \sin\theta = \frac{z - z^{-1}}{2i}$ around $|z| = 1$.

3. **Fourier Integrals & Jordan's Lemma $\int_{-\infty}^\infty f(x) e^{i a x} dx$ ($a > 0$):**
   If $|f(z)| \to 0$ as $|z| \to \infty$ on the upper semicircle $C_R$, then:
   $$\lim_{R \to \infty} \int_{C_R} f(z) e^{i a z} \, dz = 0.$$

