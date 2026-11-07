---
title: "Green's Theorem in the Plane"
topic: "Vector Calculus & Integral Theorems"
prerequisites: ["Line Integrals", "Double Integrals", "Curl"]
key_formulae:
  - "\\oint_C (L\\,dx + M\\,dy) = \\iint_D \\left(\\frac{\\partial M}{\\partial x} - \\frac{\\partial L}{\\partial y}\\right) dA"
---

# Green's Theorem in the Plane

## Formal Statement
Let $C$ be a positively oriented (counterclockwise), piecewise smooth, simple closed curve in the $xy$-plane enclosing a compact domain $D \subset \mathbb{R}^2$. Let $\mathbf{F}(x, y) = \begin{pmatrix} L(x, y) \\ M(x, y) \end{pmatrix}$ be a $C^1$ vector field defined on an open region containing $D$. Then:

$$\oint_{\partial D} (L\,dx + M\,dy) = \iint_D \left(\frac{\partial M}{\partial x} - \frac{\partial L}{\partial y}\right) dx\,dy$$

## Intuition & Microscopic Circulation
The integrand $\left(\frac{\partial M}{\partial x} - \frac{\partial L}{\partial y}\right)$ represents the **2D curl** $(\operatorname{curl} \mathbf{F}) \cdot \mathbf{k}$, measuring microscopic whirlpools or vorticity at each point $(x, y) \in D$.

When summing all microscopic circulation loops over the entire domain $D$, adjacent internal boundaries cancel out in opposite directions, leaving only the net macroscopic circulation along the perimeter curve $C = \partial D$.

## Application to Planar Area Computation
Setting $L = -y/2$ and $M = x/2$ yields $\frac{\partial M}{\partial x} - \frac{\partial L}{\partial y} = \frac{1}{2} - \left(-\frac{1}{2}\right) = 1$. Consequently, the area of region $D$ can be computed purely from its boundary curve:

$$\operatorname{Area}(D) = \frac{1}{2} \oint_C (x\,dy - y\,dx)$$
