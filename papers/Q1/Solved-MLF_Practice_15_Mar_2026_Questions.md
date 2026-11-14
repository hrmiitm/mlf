# Machine Learning Foundations — Solved Practice Questions (15 March 2026)

**Exam:** Quiz 1  
**Date:** 15 March 2026  
**Subject:** Machine Learning Foundations (MLF)  
**Total marks:** 40  
**Number of displayed questions:** 18, including 2 comprehension passages (0 marks each) and their subquestions  


---

## Before you begin: topics and solving strategies

This paper has 16 graded questions and two comprehension passages. Linear algebra accounts for 28 of the 40 marks; calculus accounts for 7 marks; regression loss and identifying machine learning account for 5 marks. Study vectors and matrix spaces first, then eigenvalues and projections, and finally calculus and loss calculations.

### What you should already know

Be comfortable multiplying matrices, solving simultaneous linear equations, differentiating powers, and working with fractions. A vector in $\mathbb{R}^n$ has $n$ coordinates. An $m\times n$ matrix maps an input in $\mathbb{R}^n$ to an output in $\mathbb{R}^m$.

| Topic | Questions | What to understand | Strategy when you see it |
| --- | --- | --- | --- |
| Orthogonality and dot products | 1 | Perpendicular vectors have zero dot product. | Multiply matching coordinates, add, and set the result to zero. |
| Continuity and differentiability | 2 | Continuity matches limiting values; differentiability also matches slopes. | At a piecewise boundary, check the value and both limits, then both derivatives. |
| Eigenvalues and diagonalization | 3, 6, 9, 16-18 | Eigenvectors preserve direction under a matrix; diagonalization needs enough independent eigenvectors. | Check symmetry, repeated eigenvalues, trace, and determinant before doing a long calculation. |
| Regression and mean squared loss | 4 | A model is judged by its errors on the supplied data. | Make a prediction-error table, square errors, then average. |
| Column spaces, bases, and rank | 5, 7 | A basis must span the space and be linearly independent. Rank measures independent directions. | Look for dependent columns; test both membership and independence of a proposed basis. |
| Lines in three dimensions | 8 | A line needs a point and a direction vector. Nonparallel lines can still fail to intersect. | Compare direction vectors, then solve all three coordinate equations. |
| Learning from examples | 10 | Learning a model from labeled data is supervised learning. | Ask whether the decision rule is manually supplied or fitted from examples. |
| Linear approximation | 11 | A tangent line matches a function's value and slope locally. | Use $h(x)=f(x_0)+f'(x_0)(x-x_0)$. |
| Directional derivatives | 12 | The gradient contains coordinate slopes; its dot product with a unit direction gives the slope along that direction. | Differentiate, evaluate the gradient at the point, normalize the direction if needed, then take a dot product. |
| Orthogonal projection and complements | 13-15 | Projection keeps the component along a subspace; the complementary projection keeps the perpendicular component. | Find a direction vector $w$ for the line and use $P=ww^T/(w^Tw)$, then $I-P$. |

### Core concepts to learn before attempting the questions

**1. Separate vector length, direction, and perpendicularity.** The dot product is $u^Tv=\sum_i u_iv_i$, and the Euclidean norm is $\|u\|=\sqrt{u^Tu}$. Orthogonality means $u^Tv=0$. For a nonzero direction $v$, its unit vector is $\widehat v=v/\|v\|$.

**2. A basis is an economical description of a space.** The column space is the set of all linear combinations of the columns. A basis contains enough vectors to produce every vector in that space, with no redundant vector. If the rank is $r$, every basis for that space has exactly $r$ vectors. Row reduction identifies pivot columns; take the corresponding columns from the original matrix when constructing a column-space basis.

For an $m\times n$ matrix of rank $r$:

$$
\dim\operatorname{Col}(A)=\dim\operatorname{Row}(A)=r,
\qquad \dim\ker A=n-r,
\qquad \dim\ker A^T=m-r.
$$

The row and column spaces have the same dimension, but they can live in different ambient spaces. Also, rank equals the number of nonzero rows **after reduction to row echelon form**, not necessarily in the original matrix.

**3. Learn the eigenvalue shortcuts and their limits.** An eigenpair satisfies $Av=\lambda v$ with $v\ne0$. Eigenvalues solve $\det(A-\lambda I)=0$. Their sum is the trace and their product is the determinant, counting multiplicity. For a $2\times2$ matrix:

$$
\lambda^2-\operatorname{tr}(A)\lambda+\det(A)=0.
$$

A matrix is invertible exactly when zero is absent from its eigenvalues. An $n\times n$ matrix is diagonalizable when it has $n$ linearly independent eigenvectors. Repeated eigenvalues require checking the eigenspace dimension. A real symmetric matrix always has an orthonormal eigenbasis. Eigenvectors for distinct eigenvalues are independent; vectors for the same eigenvalue may be independent or dependent.

**4. Check values before checking slopes.** At a piecewise boundary $c$, continuity requires $\lim_{x\to c^-}f(x)=f(c)=\lim_{x\to c^+}f(x)$. Differentiability implies continuity. Once continuity is established for these polynomial pieces, compare the two one-sided slopes. For approximation and directional-derivative problems, use:

$$
L(x)=f(x_0)+f'(x_0)(x-x_0),
\qquad D_{\widehat v}f(p)=\nabla f(p)^T\widehat v.
$$

**5. Connect projection to geometry.** A line through the origin with direction $w$ is $\{tw:t\in\mathbb{R}\}$. Orthogonal projection of $x$ onto it is $w(w^Tx)/(w^Tw)$. Therefore its matrix is $P=ww^T/(w^Tw)$. Check $P^T=P$ and $P^2=P$. Its nullspace is perpendicular to the line, and the orthogonal projection onto that nullspace is $I-P$. The projection questions use this standard orthogonal-projection convention.

**6. Keep the loss definition visible.** For scalar regression on $N$ samples:

$$
\operatorname{MSE}(f)=\frac1N\sum_{i=1}^N(f(x_i)-y_i)^2.
$$

The square prevents positive and negative errors from cancelling. A zero loss means every prediction matches its label on the given dataset.

### A practical attempt strategy

1. Identify the object: a vector, a subspace, a matrix, a function, or a model's predictions.
2. Write the relevant definition or formula before substituting numbers.
3. For an MSQ, test every statement separately. A counterexample is enough to disprove a universal statement.
4. For a comprehension, derive the shared matrix once and reuse it in the subquestions.
5. Check your result: matrix dimensions, all coordinate equations, unit direction length, and the requested numerical precision.

Try each question with its solution closed. Open the dropdown to compare your reasoning, study the concept, and review the common mistake. The worked solutions below are independently derived explanations, not an official answer key. Option letters refer to the order shown in this file.

---

## Question 1 — Orthogonal vectors

**Question ID:** `6406531951381`  
**Marks:** 2 | **Type:** MCQ

Let the vectors $u=(1,a,2)$, $v=(2,-1,b)$ be orthogonal. Which of the following must be true?

**Options:**

A. $a-2b=2$  
B. $a+2=2b$  
C. $2b-a=2$  
D. $a-2b=0$

<details>
<summary>Show solution and learn the concept</summary>

**Concept: orthogonality.** Two vectors are orthogonal when their dot product is zero. This gives an equation connecting the unknown coordinates.

$$
u^Tv=1(2)+a(-1)+2b=2-a+2b=0.
$$

Rearranging gives $a-2b=2$.

**Answer: A.**

**Check the other options:** B and C both express $a-2b=-2$; D expresses $a-2b=0$. Neither matches the required equation.

**Strategy to remember:** Multiply corresponding coordinates and keep the signs attached to them. The second term here is $-a$.

</details>

---

## Question 2 — Continuity and differentiability

**Question ID:** `6406531951385`  
**Marks:** 2 | **Type:** MCQ

Consider the function $f:\mathbb{R}\to\mathbb{R}$:

$$
f(x)=\begin{cases}
x^2+2, & x\leq 1,\\
x+2, & x>1.
\end{cases}
$$

Which of the following is true?

**Options:**

A. $f$ is continuous at $x=1$, but not differentiable at $x=1$.  
B. $f$ is both continuous and differentiable at $x=1$.  
C. $f$ is neither continuous nor differentiable at $x=1$.  
D. $f$ is differentiable at $x=1$, but not continuous at $x=1$.

<details>
<summary>Show solution and learn the concept</summary>

**Concept: continuity compares values; differentiability compares slopes.** At the joining point, check these separately.

From the branch containing $x=1$, $f(1)=1^2+2=3$. The one-sided limits are:

$$
\lim_{x\to1^-}f(x)=3,\qquad \lim_{x\to1^+}f(x)=3.
$$

Both equal $f(1)$, so $f$ is continuous. The left polynomial has derivative $2x$ and the right polynomial has derivative $1$. Thus the one-sided derivatives at $1$ are $2$ and $1$. They differ, so $f$ is not differentiable there.

**Answer: A.**

**Why the other options fail:** B incorrectly gives a derivative at the corner; C incorrectly denies continuity; D is impossible because differentiability implies continuity.

**Strategy to remember:** Matching heights do not guarantee matching slopes. Check continuity before differentiability.

</details>

---

## Question 3 — Diagonalizability

**Question ID:** `6406531951382`  
**Marks:** 3 | **Type:** MCQ

Consider the following matrices:

$$
A=\begin{bmatrix}1&1\\0&1\end{bmatrix},
\qquad
B=\begin{bmatrix}2&0&0\\0&0&1\\0&1&0\end{bmatrix}.
$$

Which of the following is true?

**Options:**

A. $A$ is diagonalizable, $B$ is not diagonalizable.  
B. $A$ is not diagonalizable, $B$ is diagonalizable.  
C. Both $A$ and $B$ are diagonalizable.  
D. Neither $A$ nor $B$ is diagonalizable

<details>
<summary>Show solution and learn the concept</summary>

**Concept: diagonalization requires enough independent eigenvectors.** For a $2\times2$ matrix, two independent eigenvectors are needed. A real symmetric matrix is always diagonalizable over $\mathbb{R}$.

For $A$, the characteristic polynomial is $(1-\lambda)^2$. The only eigenvalue is $1$, repeated twice. Its eigenvectors satisfy:

$$
(A-I)v=\begin{bmatrix}0&1\\0&0\end{bmatrix}
\begin{bmatrix}v_1\\v_2\end{bmatrix}=0,
\qquad v_2=0.
$$

The eigenspace is $\operatorname{span}\{(1,0)\}$, which has dimension one. Hence $A$ is not diagonalizable.

For $B$, $B^T=B$, so the spectral theorem guarantees diagonalizability. As a direct check, $(1,0,0)$, $(0,1,1)$, and $(0,1,-1)$ are eigenvectors for eigenvalues $2$, $1$, and $-1$, respectively. They are independent.

**Answer: B.**

**Strategy to remember:** Being triangular makes eigenvalues easy to read; it does not guarantee diagonalizability. A repeated eigenvalue needs an eigenspace check.

</details>

---

## Question 4 — Mean squared loss

**Question ID:** `6406531951383`  
**Marks:** 3 | **Type:** MCQ

Consider a dataset $D$ for a regression problem where each element is of the form $(x_i,y_i)$, for $i=1,2,3$. $x_i$ is the feature and $y_i$ is the label of the $i^{\text{th}}$ data-point.

$$
D=\{(1,1),(2,4),(3,7)\}.
$$

Let $f_1,f_2:\mathbb{R}\to\mathbb{R}$ be two regression models such that:

$$
f_1(x)=2x-1,\qquad f_2(x)=3x-2.
$$

Which of the following options is correct?

**Options:**

A. $f_1(x)$ has the lower mean squared loss.  
B. $f_2(x)$ has the lower mean squared loss.  
C. Both models have same mean squared loss.

<details>
<summary>Show solution and learn the concept</summary>

**Concept: mean squared loss.** Evaluate both models on the same samples, square each prediction error, and average over the three samples.

| $x_i$ | $y_i$ | $f_1(x_i)$ | $(f_1(x_i)-y_i)^2$ | $f_2(x_i)$ | $(f_2(x_i)-y_i)^2$ |
| --- | --- | --- | --- | --- | --- |
| 1 | 1 | 1 | 0 | 1 | 0 |
| 2 | 4 | 3 | 1 | 4 | 0 |
| 3 | 7 | 5 | 4 | 7 | 0 |

$$
\operatorname{MSE}(f_1)=\frac{0+1+4}{3}=\frac53,
\qquad \operatorname{MSE}(f_2)=0.
$$

**Answer: B.** $f_2$ has the lower mean squared loss.

**Strategy to remember:** A model with zero error on every supplied sample has zero empirical loss. Do not compare models just by their slopes or their prediction at the first sample.

</details>

---

## Question 5 — Basis for a column space

**Question ID:** `6406531951384`  
**Marks:** 3 | **Type:** MCQ

Which of the following is a basis for the column space of the matrix $A$ given below?

$$
A=\begin{bmatrix}
1&1&2\\
2&-1&1\\
1&0&1
\end{bmatrix}.
$$

**Options:**

A. $\{(1,2,1),(1,-1,0)\}$  
B. $\{(1,0,0),(0,1,0)\}$  
C. $\{(1,2,1),(1,-1,0),(2,1,1)\}$  
D. $\{(1,3,2),(1,-1,0)\}$

<details>
<summary>Show solution and learn the concept</summary>

**Concept: a basis must satisfy both spanning and independence.** Write the columns as $c_1=(1,2,1)$, $c_2=(1,-1,0)$, and $c_3=(2,1,1)$.

Observe that $c_3=c_1+c_2$, so the third column adds no new direction. The first two columns are independent: if $\alpha c_1+\beta c_2=0$, the third coordinate gives $\alpha=0$, and then $\beta=0$. Therefore the column space has dimension two and basis $\{c_1,c_2\}$.

**Answer: A.**

**Why the other options fail:**

- **B:** Its vectors are independent, but they span the plane $z=0$. The column space contains $c_1$, whose third coordinate is $1$, so these are different planes.
- **C:** It contains the redundant column $c_3=c_1+c_2$, so it is not independent.
- **D:** The vector $(1,3,2)$ is outside the column space. Every combination of $c_1,c_2$ satisfies $x+y-3z=0$, whereas $1+3-3(2)=-2$.

**Strategy to remember:** The correct number of vectors is necessary, but not sufficient. Each proposed vector must also lie in the required space.

</details>

---

## Question 6 — Eigenvalues, trace and determinant

**Question ID:** `6406531951386`  
**Marks:** 3 | **Type:** MSQ

The matrix

$$
P=\begin{bmatrix}m&2\\1&n\end{bmatrix}
$$

has eigenvalues $0$ and $3$. Which of the following options is/are correct?

**Options:**

- [ ] A. $mn=0$
- [ ] B. $mn=2$
- [ ] C. $m+n=3$
- [ ] D. $m+n=2$

<details>
<summary>Show solution and learn the concept</summary>

**Concept: trace and determinant encode the sum and product of eigenvalues.** For the given $2\times2$ matrix:

$$
\operatorname{tr}(P)=m+n=0+3=3,
$$

$$
\det(P)=mn-2=0\cdot3=0,
\qquad mn=2.
$$

**Answer: B and C.** A and D contradict these equations.

**Strategy to remember:** A zero eigenvalue means zero determinant. It does not mean a zero product of the diagonal entries, because the off-diagonal product must be subtracted.

</details>

---

## Question 7 — Rank of a matrix

**Question ID:** `6406531951387`  
**Marks:** 3 | **Type:** MSQ

Which of the following is/are true?

**Options:**

- [ ] A. If $A$ and $B$ are matrices of the same size, then $\operatorname{rank}(A+B)=\operatorname{rank}(A)+\operatorname{rank}(B)$.
- [ ] B. The rank of a matrix is equal to the number of non-zero rows in it.
- [ ] C. If $A$ is a matrix which is obtained by permuting the rows of the $5\times5$ identity matrix, then the rank of $A$ is $5$.
- [ ] D. If $u$ is a non-zero column vector in $\mathbb{R}^{10}$, then the rank of the matrix $uu^T$ is $1$.

<details>
<summary>Show solution and learn the concept</summary>

**Concept: rank counts independent directions.** Check each universal statement separately.

- **A is false.** The general rule is $\operatorname{rank}(A+B)\leq\operatorname{rank}(A)+\operatorname{rank}(B)$. Take $A=[1]$ and $B=[-1]$: the left side is $0$ and the claimed right side is $2$.
- **B is false.** In $\begin{bmatrix}1&1\\2&2\end{bmatrix}$, both rows are nonzero, but one is twice the other, so the rank is $1$. Counting nonzero rows works after reduction to row echelon form.
- **C is true.** Permuting identity-matrix rows preserves independence and invertibility. The resulting $5\times5$ permutation matrix has rank $5$.
- **D is true.** Each column of $uu^T$ is a scalar multiple of $u$, so rank is at most $1$. Because $u\ne0$, at least one column is nonzero, so rank is exactly $1$.

**Answer: C and D.**

**Strategy to remember:** Distinguish a nonzero row from an independent row. For an outer product, inspect its columns instead of expanding all 100 entries.

</details>

---

## Question 8 — Lines in three dimensions

**Question ID:** `6406531951388`  
**Marks:** 3 | **Type:** MSQ

Let $L_1$ and $L_2$ be two lines in $\mathbb{R}^3$ defined in parametric form:

$$
\begin{aligned}
L_1:&\quad x=1+4t,\quad y=5-4t,\quad z=-1+5t,\quad t\in\mathbb{R},\\[3pt]
L_2:&\quad x=2+8s,\quad y=4-3s,\quad z=5+s,\quad s\in\mathbb{R}.
\end{aligned}
$$

For example, every point on line $L_1$ is of the form $(1+4t,5-4t,-1+5t)$. Which of the following is/are true?

**Options:**

- [ ] A. $L_1$ and $L_2$ are parallel
- [ ] B. $L_1$ and $L_2$ are not parallel
- [ ] C. $L_1$ and $L_2$ intersect at a point
- [ ] D. $L_1$ and $L_2$ do not intersect at any point

<details>
<summary>Show solution and learn the concept</summary>

**Concept: parallelism and intersection are different tests in three dimensions.** The direction vectors are $d_1=(4,-4,5)$ and $d_2=(8,-3,1)$.

These are not scalar multiples: the first coordinates suggest a factor of $2$, but $2(-4)=-8\ne-3$. Thus A is false and B is true.

For an intersection, the same pair $(t,s)$ must satisfy all three coordinate equations:

$$
4t-8s=1,\qquad -4t+3s=-1,\qquad 5t-s=6.
$$

Adding the first two gives $-5s=0$, hence $s=0$. The first equation then gives $t=1/4$. The third equation would require $5/4=6$, which is false. Thus C is false and D is true.

**Answer: B and D.** These lines are skew: nonparallel and nonintersecting.

**Strategy to remember:** In $\mathbb{R}^3$, solving two coordinate equations only produces a candidate intersection. Always check the third coordinate.

</details>

---

## Question 9 — Eigenvectors and eigenspaces

**Question ID:** `6406531951390`  
**Marks:** 3 | **Type:** MSQ

Which of the following is/are true?

**Options:**

- [ ] A. Every square matrix with real entries has at least one real eigenvalue.
- [ ] B. A set of two eigenvectors corresponding to the same eigenvalue of a square matrix must be linearly dependent.
- [ ] C. Given a square matrix of order $n$, the set of all eigenvectors for an eigenvalue $\lambda$, along with the zero vector, forms a subspace of $\mathbb{R}^n$.
- [ ] D. A square matrix is not invertible if and only if $0$ is one of its eigenvalues.

<details>
<summary>Show solution and learn the concept</summary>

**Concept: eigenvalues, eigenspaces, and invertibility.** In the real-vector setting intended by this question, the eigenspace for a real eigenvalue $\lambda$ is $\ker(A-\lambda I)$.

- **A is false.** The real matrix $\begin{bmatrix}0&-1\\1&0\end{bmatrix}$ has characteristic polynomial $\lambda^2+1$ and eigenvalues $i,-i$, so neither eigenvalue is real.
- **B is false.** For $I_2$, both $(1,0)$ and $(0,1)$ are eigenvectors with eigenvalue $1$, and they are independent.
- **C is true in the intended real setting.** Eigenvectors for a fixed $\lambda$, together with zero, form $\ker(A-\lambda I)$. A kernel contains zero and is closed under addition and scalar multiplication, so it is a subspace. If one instead works with complex eigenvalues and complex eigenvectors, the corresponding statement uses $\mathbb{C}^n$.
- **D is true.** If $Av=0$ for some $v\ne0$, then $0$ is an eigenvalue and $A$ is singular. Conversely, a singular square matrix has a nonzero null vector, which is an eigenvector for eigenvalue zero.

**Answer: C and D.**

**Strategy to remember:** Real entries do not force real eigenvalues. Also, an eigenspace includes zero even though zero itself is never an eigenvector.

</details>

---

## Question 10 — Rule-based systems versus machine learning

**Question ID:** `6406531951389`  
**Marks:** 2 | **Type:** MSQ

Suppose you are building a credit card fraud detection system and have two approaches:

(i) Manually writing rules such as “If transaction amount is above Rs. 50,000 and the location is overseas, mark it as fraud.”

(ii) Training a model using millions of past transactions labeled as fraud or not fraud.

Which of the following options is/are correct?

**Options:**

- [ ] A. Approach (i) is not machine learning.
- [ ] B. Approach (ii) is machine learning.
- [ ] C. Both approaches are machine learning.
- [ ] D. Neither approach is machine learning.

<details>
<summary>Show solution and learn the concept</summary>

**Concept: a learned rule is fitted from examples.** A manually specified rule uses thresholds and conditions directly supplied by a person. A supervised learning model uses labeled examples to fit a decision rule.

- **A is true:** Approach (i) consists of manually written rules.
- **B is true:** Approach (ii) learns from past transactions labeled fraud or not fraud. This is supervised classification.
- **C is false:** Approach (i), as described, does not learn its rules from data.
- **D is false:** Approach (ii) is machine learning.

**Answer: A and B.**

**Strategy to remember:** Using software or processing many transactions does not by itself make a system machine learning. Identify how the decision rule was obtained.

</details>

---

## Question 11 — Linear approximation

**Question ID:** `6406531951391`  
**Marks:** 2 | **Type:** SA

Consider the function $f:\mathbb{R}\setminus\{-\frac12\}\to\mathbb{R}$ given by

$$
f(x)=\frac{1}{(1+2x)^5}.
$$

If the best linear approximation to $f$ at $x=0$ is given as $h(x)=a+bx$, find $a-b$.

Your answer should be an integer.

**Answer (Numeric):** __________

<details>
<summary>Show solution and learn the concept</summary>

**Concept: first-order Taylor approximation.** At $x_0=0$:

$$
h(x)=f(0)+f'(0)x.
$$

Write $f(x)=(1+2x)^{-5}$. By the chain rule:

$$
f'(x)=-5(1+2x)^{-6}\cdot2=-10(1+2x)^{-6}.
$$

Thus $f(0)=1$, $f'(0)=-10$, and $h(x)=1-10x$. Comparing with $a+bx$ gives $a=1$ and $b=-10$.

$$
a-b=1-(-10)=11.
$$

**Answer to enter: `11`.**

**Strategy to remember:** Include the inner derivative $2$ in the chain rule, and retain the negative sign when subtracting $b$.

</details>

---

## Question 12 — Directional derivative

**Question ID:** `6406531951392`  
**Marks:** 3 | **Type:** SA

Find the directional derivative of the function $f:\mathbb{R}^3\to\mathbb{R}$ given by

$$
f(x,y,z)=x^2y-yz^3+z
$$

at the point $(1,-2,0)$ in the direction of the vector

$$
\frac13\begin{bmatrix}-2\\-1\\2\end{bmatrix}.
$$

Your answer should be an integer.

**Answer (Numeric):** __________

<details>
<summary>Show solution and learn the concept</summary>

**Concept: a directional derivative is a gradient-dot-unit-direction calculation.** The given direction already has length one:

$$
\left\|\tfrac13(-2,-1,2)\right\|=\tfrac13\sqrt{4+1+4}=1.
$$

Differentiate with respect to each coordinate:

$$
\nabla f=(2xy,\ x^2-z^3,\ -3yz^2+1).
$$

At $(1,-2,0)$, $\nabla f=(-4,1,1)$. Therefore:

$$
D_vf(1,-2,0)=(-4,1,1)\cdot\tfrac13(-2,-1,2)
=\frac{8-1+2}{3}=3.
$$

**Answer to enter: `3`.**

**Strategy to remember:** Evaluate the gradient at the specified point before taking the dot product. The $+z$ term contributes $+1$ to the third partial derivative.

</details>

---

## Question 13 — Comprehension passage: projection matrices

**Question ID:** `6406531951393`  
**Marks:** 0 | **Type:** COMPREHENSION

Let

$$
P=\begin{bmatrix}a&b\\c&d\end{bmatrix}
$$

be the projection matrix that projects vectors in $\mathbb{R}^2$ onto the line $y=3x$. Let

$$
A=\begin{bmatrix}e&f\\g&h\end{bmatrix}
$$

be the matrix that projects vectors in $\mathbb{R}^2$ onto the nullspace of $P$.

Based on the above data, answer the given subquestions.

<details>
<summary>Show solution and learn the concept</summary>

**Concept: orthogonal projection onto a line through the origin.** A direction vector for $y=3x$ is $w=(1,3)^T$. Using the standard orthogonal-projection interpretation:

$$
P=\frac{ww^T}{w^Tw}
=\frac1{10}\begin{bmatrix}1&3\\3&9\end{bmatrix}.
$$

The nullspace of $P$ is the perpendicular line, with direction $q=(-3,1)^T$. Its orthogonal projection is:

$$
A=I-P=\frac1{10}\begin{bmatrix}9&-3\\-3&1\end{bmatrix}
=\frac{qq^T}{q^Tq}.
$$

**Shared result:** Use these two matrices in Questions 14 and 15. This passage has no separate answer to enter.

**Check:** $P(1,3)^T=(1,3)^T$, $P(-3,1)^T=0$, and $P+A=I$.

**Strategy to remember:** For orthogonal projection, the nullspace is the perpendicular complement of the target line. The direction $(1,3)$ is not a unit vector, so divide its outer product by $1^2+3^2=10$.

</details>


### Question 14 — Sum of entries in $P$

**Question ID:** `6406531951394`  
**Marks:** 3 | **Type:** SA

Find $10(a+b+c+d)$.

Your answer should be an integer.

**Answer (Numeric):** __________

<details>
<summary>Show solution and learn the concept</summary>

**Concept: read matrix entries from the shared projection.** From Question 13:

$$
a=\frac1{10},\quad b=\frac3{10},\quad c=\frac3{10},\quad d=\frac9{10}.
$$

Therefore:

$$
10(a+b+c+d)=10\left(\frac{1+3+3+9}{10}\right)=16.
$$

**Answer to enter: `16`.**

**Strategy to remember:** Sum all four entries. The trace would only sum the two diagonal entries and answers a different question.

</details>


### Question 15 — Sum of entries in $A$

**Question ID:** `6406531951395`  
**Marks:** 1 | **Type:** SA

Find $10(e+f+g+h)$.

Your answer should be an integer.

**Answer (Numeric):** __________

<details>
<summary>Show solution and learn the concept</summary>

**Concept: the complementary projection is $I-P$.** From the shared setup:

$$
A=\frac1{10}\begin{bmatrix}9&-3\\-3&1\end{bmatrix}.
$$

Thus:

$$
10(e+f+g+h)=10\left(\frac{9-3-3+1}{10}\right)=4.
$$

**Answer to enter: `4`.**

**Check:** The sums of all entries in $P$ and $A$ add to the sum of all entries in $I_2$, which is $2$. Therefore the two quantities multiplied by $10$ should add to $20$: $16+4=20$.

**Strategy to remember:** Subtracting $P$ from $I$ makes both off-diagonal entries negative.

</details>

---

## Question 16 — Comprehension passage: eigenvalues and eigenvectors

**Question ID:** `6406531951396`  
**Marks:** 0 | **Type:** COMPREHENSION

Consider the matrix $A$ given below:

$$
A=\begin{bmatrix}1&5\\4&2\end{bmatrix}.
$$

Based on the above data, answer the given subquestions.

<details>
<summary>Show solution and learn the concept</summary>

**Concept: a shared matrix supports an eigenvalue calculation followed by an eigenvector calculation.** For this matrix, the trace is $3$ and the determinant is $2-20=-18$.

$$
\det(A-\lambda I)=(1-\lambda)(2-\lambda)-20
=\lambda^2-3\lambda-18
=(\lambda-6)(\lambda+3).
$$

The eigenvalues are $6$ and $-3$. The smallest is $\lambda=-3$. Use it in both following subquestions. This passage has no separate answer to enter.

**Strategy to remember:** First find the eigenvalue requested by the passage, then use that same value when computing its eigenvector.

</details>


### Question 17 — Smallest eigenvalue

**Question ID:** `6406531951397`  
**Marks:** 2 | **Type:** SA

If $\lambda$ is the smallest eigenvalue of $A$, enter the value of $\lambda$.

Your answer should be an integer.

**Answer (Numeric):** __________

<details>
<summary>Show solution and learn the concept</summary>

**Concept: eigenvalues are the roots of the characteristic polynomial.** Using the matrix in Question 16:

$$
\det(A-\lambda I)=(\lambda-6)(\lambda+3)=0.
$$

The roots are $6$ and $-3$. Since $-3<6$, the smallest eigenvalue is $-3$.

**Answer to enter: `-3`.**

**Check:** The roots sum to $3$, the trace, and multiply to $-18$, the determinant.

**Strategy to remember:** Smallest means smallest numerical value, not smallest absolute value.

</details>


### Question 18 — Eigenvector component

**Question ID:** `6406531951398`  
**Marks:** 2 | **Type:** SA

If $v=(a,-1)$ is an eigenvector of $A$ corresponding to $\lambda$, find $a$.

Enter your answer correct to two decimal places.

**Answer (Numeric):** __________

<details>
<summary>Show solution and learn the concept</summary>

**Concept: an eigenvector satisfies $Av=\lambda v$.** Here $\lambda=-3$ from Question 17 and $v=(a,-1)^T$.

$$
Av=\begin{bmatrix}a-5\\4a-2\end{bmatrix},
\qquad \lambda v=\begin{bmatrix}-3a\\3\end{bmatrix}.
$$

Equating first coordinates gives $a-5=-3a$, so $4a=5$ and $a=5/4=1.25$. The second coordinate checks the result: $4(1.25)-2=3$.

**Answer to enter: `1.25`.**

**Strategy to remember:** Eigenvectors can generally be rescaled, but fixing the second coordinate to $-1$ fixes the scale here. Check both rows of the matrix equation.

</details>

---

**End of solved practice paper.**
