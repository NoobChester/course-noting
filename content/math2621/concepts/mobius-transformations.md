---
slug: "mobius-transformations"
title: "Fractional Linear (M\u00f6bius) Transformations"
week: 2
category: "Transformations & Geometry"
summary: "Mappings $w = \\frac{az+b}{cz+d}$ with $ad-bc \\ne 0$, circle-preserving property, cross-ratio."
prerequisites: ["complex-algebra-geometry"]
---

### Möbius Transformations

A mapping of the form:
$$T(z) = \frac{az + b}{cz + d}, \quad a,b,c,d \in \mathbb{C}, \quad ad - bc \ne 0$$

1. **Key Properties:**
   - Conformal everywhere on $\mathbb{C} \setminus \{-d/c\}$.
   - Compositions and inverses of Möbius transformations are also Möbius transformations (they form the group $\operatorname{PSL}(2, \mathbb{C})$).
   - **Circles and Lines:** Maps generalized circles (circles and straight lines) to generalized circles.

2. **Standard Mappings:**
   - Upper half-plane $\mathbb{H} = \{z : \operatorname{Im}(z) > 0\}$ to the open unit disk $\mathbb{D} = \{w : |w| < 1\}$:
     $$w = e^{i\phi} \frac{z - z_0}{z - \bar{z}_0}, \quad \operatorname{Im}(z_0) > 0$$
   - Cayley transform: $w = \frac{z - i}{z + i}$ maps $\mathbb{H} \to \mathbb{D}$, sending $i \mapsto 0$ and the real axis to the unit circle.

3. **Three-Point Cross Ratio:**
   $$(z, z_1, z_2, z_3) = \frac{(z - z_1)(z_2 - z_3)}{(z - z_3)(z_2 - z_1)}$$
   The unique Möbius transformation sending $z_1 \mapsto w_1, z_2 \mapsto w_2, z_3 \mapsto w_3$ is determined by equating cross-ratios:
   $$(w, w_1, w_2, w_3) = (z, z_1, z_2, z_3)$$

