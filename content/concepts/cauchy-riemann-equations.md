---
slug: "cauchy-riemann-equations"
title: "Cauchy-Riemann Equations & Holomorphic Functions"
week: 3
category: "Differentiation & Holomorphicity"
summary: "Complex differentiability, CR equations in Cartesian and Polar coordinates, holomorphicity."
prerequisites: ["complex-algebra-geometry"]
---

### Complex Differentiability & Holomorphicity

A function $f: \Omega \to \mathbb{C}$ is **complex differentiable** at $z_0 \in \Omega$ if:
$$f'(z_0) = \lim_{h \to 0} \frac{f(z_0 + h) - f(z_0)}{h} \quad \text{exists}.$$
$f$ is **holomorphic** (or analytic) on an open set $\Omega$ if it is complex differentiable at every point in $\Omega$.

1. **Cauchy-Riemann Equations (Cartesian):**
   Writing $f(x + iy) = u(x,y) + i v(x,y)$:
   $$\frac{\partial u}{\partial x} = \frac{\partial v}{\partial y}, \qquad \frac{\partial u}{\partial y} = -\frac{\partial v}{\partial x}$$
   The complex derivative is given by:
   $$f'(z) = u_x + i v_x = v_y - i u_y = u_x - i u_y.$$

2. **Cauchy-Riemann Equations (Polar form):**
   Writing $f(r e^{i\theta}) = u(r, \theta) + i v(r, \theta)$:
   $$\frac{\partial u}{\partial r} = \frac{1}{r} \frac{\partial v}{\partial \theta}, \qquad \frac{\partial v}{\partial r} = -\frac{1}{r} \frac{\partial u}{\partial \theta}$$
   $$f'(z) = e^{-i\theta} (u_r + i v_r).$$

3. **Theorem (Sufficient Conditions):**
   If $u(x,y)$ and $v(x,y)$ have continuous first partial derivatives in a neighborhood of $z_0$ and satisfy the CR equations at $z_0$, then $f$ is complex differentiable at $z_0$.

4. **Consequences:**
   - If $f$ is holomorphic on a domain $\Omega$ and $f'(z) = 0$ everywhere, then $f$ is constant.
   - If $f$ is holomorphic and real-valued, $f$ is constant.
   - If $f$ and $\bar{f}$ are both holomorphic, $f$ is constant.

