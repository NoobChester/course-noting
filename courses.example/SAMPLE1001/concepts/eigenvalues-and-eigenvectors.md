---
title: "Eigenvalues and Eigenvectors"
topic: "Linear Algebra & Matrix Transformations"
prerequisites: ["Matrix Multiplication", "Determinants"]
key_formulae:
  - "A \\mathbf{v} = \\lambda \\mathbf{v}"
  - "\\det(A - \\lambda I) = 0"
---

# Eigenvalues and Eigenvectors

## Geometric Intuition
When a square matrix $A \in \mathbb{R}^{n \times n}$ acts on a vector $\mathbf{x}$, it typically rotates, stretches, and shears it into a completely new direction. 

An **eigenvector** is a special non-zero vector whose spatial direction remains invariant under the linear transformation $A$; the transformation merely scales it by a scalar factor $\lambda$, termed the **eigenvalue**:

$$A \mathbf{v} = \lambda \mathbf{v}, \quad \mathbf{v} \neq \mathbf{0}$$

```
    A v
    ^
    |    v
    |   ^
    |  /
    | /      (Eigenvector: scales without rotating)
    +------> 
```

## The Characteristic Equation
Rearranging the eigenvalue definition gives:

$$(A - \lambda I) \mathbf{v} = \mathbf{0}$$

For non-trivial solutions ($\mathbf{v} \neq \mathbf{0}$) to exist, the nullspace of $(A - \lambda I)$ must be non-trivial, which occurs if and only if the determinant vanishes:

$$P(\lambda) = \det(A - \lambda I) = 0$$

$P(\lambda)$ is the **characteristic polynomial** of degree $n$. Its roots give the eigenvalues of $A$.

## Eigenspaces
For each eigenvalue $\lambda_i$, the associated eigenspace $E_{\lambda_i}$ is:

$$E_{\lambda_i} = \ker(A - \lambda_i I) = \{\mathbf{v} \in \mathbb{R}^n : (A - \lambda_i I)\mathbf{v} = \mathbf{0}\}$$

The dimension of $E_{\lambda_i}$ is the **geometric multiplicity** of $\lambda_i$, which never exceeds its algebraic multiplicity.
