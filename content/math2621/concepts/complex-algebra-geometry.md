---
slug: "complex-algebra-geometry"
title: "Complex Numbers, Polar Form & Geometry"
week: 1
category: "Revision & Foundations"
summary: "Modulus, argument, polar form $z = r e^{i\\theta}$, triangle inequality, roots of unity."
prerequisites: []
---

### Core Concepts & Formulas

1. **Modulus and Conjugate:**
   - $|z|^2 = z \bar{z} = x^2 + y^2$.
   - $\operatorname{Re}(z) = \frac{z + \bar{z}}{2}$, $\operatorname{Im}(z) = \frac{z - \bar{z}}{2i}$.
   - $|z_1 z_2| = |z_1| |z_2|$ and $\operatorname{Arg}(z_1 z_2) = \operatorname{Arg}(z_1) + \operatorname{Arg}(z_2) \pmod{2\pi}$.

2. **Triangle Inequalities:**
   - $|z_1 + z_2| \le |z_1| + |z_2|$.
   - Reverse triangle inequality: $||z_1| - |z_2|| \le |z_1 - z_2| \le |z_1| + |z_2|$.
   - Useful for bounds: If $|z| = R > 1$, then $|z^n \pm 1| \ge R^n - 1$, so $\frac{1}{|z^n \pm 1|} \le \frac{1}{R^n - 1}$.

3. **Roots of Unity:**
   - The solutions to $z^n = 1$ are $\omega_k = e^{i 2\pi k / n}$ for $k = 0, 1, \dots, n-1$.
   - For any root $\omega \ne 1$, $\sum_{k=0}^{n-1} \omega^k = \frac{1 - \omega^n}{1 - \omega} = 0$.

