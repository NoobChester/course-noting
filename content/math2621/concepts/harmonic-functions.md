---
slug: "harmonic-functions"
title: "Harmonic Functions & Conjugates"
week: 4
category: "Harmonic Analysis"
summary: "Laplace equation $\\Delta u = 0$, harmonic conjugates $v$, Milne-Thomson method."
prerequisites: ["cauchy-riemann-equations"]
---

### Harmonic Functions

A real-valued function $u(x,y)$ with continuous second partial derivatives is **harmonic** on an open set $\Omega$ if it satisfies Laplace's equation:
$$\Delta u = \frac{\partial^2 u}{\partial x^2} + \frac{\partial^2 u}{\partial y^2} = 0$$

1. **Harmonic Conjugate:**
   If $f = u + iv$ is holomorphic on $\Omega$, then both $u$ and $v$ are harmonic, and $v$ is called a **harmonic conjugate** of $u$.
   - Note: $v$ is a harmonic conjugate of $u$ $\iff$ $-u$ is a harmonic conjugate of $v$.
   - On a simply connected domain, every harmonic function has a harmonic conjugate (unique up to an additive real constant).

2. **Milne-Thomson Method / Derivative Identity:**
   Since $f'(z) = u_x(x,y) - i u_y(x,y)$, for $z = x$ (setting $y=0$):
   $$f'(x) = u_x(x, 0) - i u_y(x, 0)$$
   By analytic continuation, replacing $x$ by $z$:
   $$f'(z) = u_x(z, 0) - i u_y(z, 0)$$
   Integrating $f'(z)$ yields $f(z)$ directly without needing to compute $v(x,y)$ term by term!

