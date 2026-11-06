---
slug: "fourier-and-laplace-transforms"
title: "Fourier and Laplace Transforms in Complex Analysis"
week: 10
category: "Transforms & Applications"
summary: "Complex inversion integral (Bromwich contour), transform properties, solving ODEs."
prerequisites: ["residue-calculus"]
---

### Fourier and Laplace Transforms

1. **Fourier Transform:**
   $$\hat{f}(\xi) = \int_{-\infty}^\infty f(x) e^{-i x \xi} \, dx$$
   Inversion formula:
   $$f(x) = \frac{1}{2\pi} \int_{-\infty}^\infty \hat{f}(\xi) e^{i x \xi} \, d\xi$$

2. **Laplace Transform:**
   $$\mathcal{L}\{f\}(z) = F(z) = \int_0^\infty f(t) e^{-z t} \, dt, \quad \operatorname{Re}(z) > \sigma_0$$
   - $\mathcal{L}\{e^{-a t}\} = \frac{1}{z + a}$
   - $\mathcal{L}\{\cos(\omega t)\} = \frac{z}{z^2 + \omega^2}$
   - $\mathcal{L}\{\sin(\omega t)\} = \frac{\omega}{z^2 + \omega^2}$
   - $\mathcal{L}\{u'\} = z U(z) - u(0)$, $\mathcal{L}\{u''\} = z^2 U(z) - z u(0) - u'(0)$.

3. **Bromwich Inversion Formula:**
   $$f(t) = \frac{1}{2\pi i} \int_{\gamma - i\infty}^{\gamma + i\infty} F(z) e^{z t} \, dz = \sum_{\text{poles}} \operatorname{Res}\left(F(z) e^{z t}, z_k\right)$$

