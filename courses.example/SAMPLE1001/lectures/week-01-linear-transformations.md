---
id: "sample-lec-01"
week: 1
title: "Geometric Linear Transformations & Eigenvalues"
courseId: "SAMPLE1001"
date: "2026-03-02"
audioFile: ""
summary: "Introduction to eigenvalues as axes of invariant direction, characteristic polynomials, and geometric multiplicities."
insights:
  - type: "intuition"
    text: "Eigenvectors represent the natural coordinate system of the matrix transformation. When you express the space in the eigenbasis, the matrix simply acts as independent 1D scalar stretches along each axis."
    conceptSlug: "eigenvalues-and-eigenvectors"
  - type: "exam_warning"
    text: "Common exam trap: If the characteristic polynomial has a repeated root (algebraic multiplicity > 1), you cannot assume the matrix is diagonalizable without verifying the eigenspace dimension (geometric multiplicity)."
    questionId: "q-001"
---

# Lecture 1: Geometric Linear Transformations & Eigenvalues

## Core Notes
- **Transformation as Distortion:** Any real $2 \times 2$ matrix maps the unit circle to an ellipse. The major and minor axes of this ellipse correspond to the singular values, while invariant vectors that do not tilt off their lines are eigenvectors.
- **Trace and Determinant Invariance:**
  $$\operatorname{Tr}(A) = \sum_{i=1}^n \lambda_i, \quad \det(A) = \prod_{i=1}^n \lambda_i$$
  These identities provide an instant mental check during exams to verify calculated eigenvalues.
- **Symmetric Matrices:** Real symmetric matrices always possess purely real eigenvalues and orthogonal eigenvectors (Spectral Theorem).
