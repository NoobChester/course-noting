---
slug: "complex-topology-sets"
title: "Sets in the Complex Plane & Topology"
week: 1
category: "Topology & Sets"
summary: "Open, closed, bounded, compact, path-connected, domains, and regions in $\\mathbb{C}$."
prerequisites: ["complex-algebra-geometry"]
---

### Definitions & Properties

1. **Open & Closed Sets:**
   - An open disk (ball) of radius $r$ centered at $z_0$: $B(z_0, r) = \{z \in \mathbb{C} : |z - z_0| < r\}$.
   - $S \subset \mathbb{C}$ is **open** if for every $z \in S$, there exists $\epsilon > 0$ such that $B(z, \epsilon) \subset S$.
   - $S$ is **closed** if its complement $\mathbb{C} \setminus S$ is open (or equivalently, it contains all its limit points).

2. **Bounded and Compact:**
   - $S$ is **bounded** if there exists $M > 0$ such that $|z| \le M$ for all $z \in S$.
   - By the Heine-Borel theorem, $S \subset \mathbb{C}$ is **compact** if and only if it is closed and bounded.

3. **Connectedness, Domains, and Regions:**
   - An open set $\Omega \subset \mathbb{C}$ is **polygonally connected** (or path-connected) if any two points in $\Omega$ can be joined by a polygonal path lying entirely in $\Omega$.
   - A **domain** is an open, connected non-empty subset of $\mathbb{C}$.
   - A **region** is a domain together with some, all, or none of its boundary points.
   - A domain $\Omega$ is **simply connected** if every simple closed loop in $\Omega$ can be continuously contracted to a point within $\Omega$ (informally, it has 'no holes').

