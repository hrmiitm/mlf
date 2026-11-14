# Machine Learning Foundations — Solved Practice Questions (16 July 2026)

**Exam:** Quiz 1  
**Date:** 16 July 2026  
**Subject:** Machine Learning Foundations (MLF)  
**Total marks:** 40  
**Number of displayed questions:** 14, including 1 comprehension passage (0 marks) and its 3 subquestions  


---

## Before you begin: topics and solving strategies

This paper has 13 graded questions and one comprehension passage. Linear algebra accounts for 27 of the 40 marks, multivariable calculus for 6 marks, and encoder-decoder reconstruction for 7 marks. The main preparation task is to connect matrix formulas to geometry and then calculate losses carefully.

### What you should already know

Review dot products, vector norms, matrix multiplication, solving linear equations, partial derivatives, and the meaning of a function composition. An $m\times n$ matrix takes $n$ input coordinates and produces $m$ output coordinates. For a differentiable function of two variables, its gradient is $\nabla f=(f_x,f_y)$.

| Topic | Questions | What to understand | Strategy when you see it |
| --- | --- | --- | --- |
| Multivariable linear approximation | 1 | A tangent plane matches a function's value and first partial derivatives at a point. | Evaluate $f$, $f_x$, and $f_y$ at the specified point; multiply slopes by coordinate displacements. |
| Directional derivatives | 2 | The rate along a unit direction is the gradient's dot product with that direction. | Differentiate, evaluate, check direction length, then take a dot product. |
| Orthogonal projection | 3 | Projection preserves the component along the target line. | Convert the line equation into a direction vector and use $ww^T/(w^Tw)$. |
| Symmetric matrices and eigenvalues | 4, 6 | Symmetry guarantees real eigenvalues and an orthonormal eigenbasis. A repeated eigenvalue alone does not guarantee independent eigenvectors. | Use the spectral theorem for symmetric matrices; use trace, determinant, and counterexamples for general matrices. |
| Matrix products and row spaces | 5 | A row of $AB$ is a combination of rows of $B$. | Expand one row of the product and identify where its coefficients come from. |
| Rank and the four fundamental subspaces | 7 | Dimensions depend on both matrix shape and rank. | Write $m$, $n$, and $r$ first, then calculate $r$, $n-r$, and $m-r$. |
| Descriptions of a line | 8 | A point-plus-direction form and a Cartesian equation can describe the same set. | Check the base point and ensure the direction is perpendicular to the Cartesian normal. |
| Cauchy-Schwarz inequality | 9 | Inner products are bounded by the product of vector lengths. | State the bound and check that equality is attainable. |
| Recovering a matrix from eigenpairs | 10 | A matrix's action on a basis determines the matrix. | Build $S$ from the eigenvectors in the matching order, then use $A=S\Lambda S^{-1}$. |
| Encoding, decoding, and reconstruction loss | 11-14 | An encoder compresses; a decoder reconstructs; the loss compares the reconstruction with the original. | For every row compute $u=f(x)$, then $\widehat x=g(u)$, then $\|x-\widehat x\|^2$, then average over rows. |

### Core concepts to learn before attempting the questions

**1. Linear approximation uses a value and slopes.** Near $(a,b)$, a differentiable function has the first-order approximation:

$$
L(x,y)=f(a,b)+f_x(a,b)(x-a)+f_y(a,b)(y-b).
$$

The displacements are measured from the expansion point. Check $L(a,b)=f(a,b)$. For a unit vector $\widehat v$, the directional derivative is $D_{\widehat v}f(a,b)=\nabla f(a,b)^T\widehat v$. If $v$ is not unit length, use $\widehat v=v/\|v\|$ first.

**2. Distinguish a line's direction from its normal.** For $ax+by=c$, $(a,b)$ is a normal vector. A direction vector $w$ must satisfy $(a,b)^Tw=0$. For a line through the origin, its orthogonal projection matrix is:

$$
P=\frac{ww^T}{w^Tw}.
$$

It satisfies $Pw=w$, $P^T=P$, and $P^2=P$. A nonzero scalar multiple of $w$ gives the same projection matrix.

**3. Know what the spectral theorem guarantees.** A real symmetric matrix satisfies $M^T=M$ and has $M=Q\Lambda Q^T$, where $Q$ is orthogonal and $\Lambda$ is real diagonal. Thus it is diagonalizable, its eigenvalues are real, and eigenvectors for distinct eigenvalues are orthogonal and independent. For a general matrix, a repeated eigenvalue does not force diagonal entries to equal that eigenvalue or guarantee a full eigenbasis.

An eigenpair obeys $Av_i=\lambda_i v_i$. If independent eigenvectors form the columns of $S$, keep the same order in $\Lambda=\operatorname{diag}(\lambda_1,\ldots,\lambda_n)$; then $AS=S\Lambda$ and $A=S\Lambda S^{-1}$. Always verify a recovered matrix by multiplying it by the supplied eigenvectors.

**4. Keep matrix shape and rank together.** For an $m\times n$ matrix of rank $r$:

| Space | Ambient space | Dimension |
| --- | --- | --- |
| Column space | $\mathbb{R}^m$ | $r$ |
| Row space | $\mathbb{R}^n$ | $r$ |
| Nullspace $\ker A$ | $\mathbb{R}^n$ | $n-r$ |
| Left nullspace $\ker A^T$ | $\mathbb{R}^m$ | $m-r$ |

For compatible products, $\operatorname{Row}(AB)\subseteq\operatorname{Row}(B)$ and $\operatorname{Col}(AB)\subseteq\operatorname{Col}(A)$. These follow from writing product rows or columns as linear combinations. Equal matrix sizes do not make arbitrary row spaces equal.

**5. Bounds need an equality case.** Cauchy-Schwarz says:

$$
|u^Tv|\leq\|u\|\|v\|.
$$

For nonzero vectors, equality holds when they are scalar multiples. To claim a maximum, show the proposed bound can actually be achieved with the prescribed lengths.

**6. Follow the full reconstruction pipeline.** For a dataset of $N$ vectors in $\mathbb{R}^d$, the loss described in this paper is the mean of the squared Euclidean distances:

$$
u_i=f(x_i),\qquad \widehat x_i=g(u_i),\qquad
L=\frac1N\sum_{i=1}^N\|x_i-\widehat x_i\|^2.
$$

First sum the squared coordinate errors for each data point, then average over the $N$ data points. Do not divide by the number of features again. A different convention, MSE averaged over all $Nd$ scalar coordinates, equals $L/d$; it is a different normalization. Here, the wording is **mean squared distance between inputs**, so the worked solutions use $1/N$. Both conventions rank the two pairs identically when $d$ is fixed.

### A practical attempt strategy

1. Recognize the topic and write the relevant definition before calculating.
2. Use structure first: symmetry, rank, and a known eigenvalue can settle statements quickly.
3. Evaluate each MSQ statement independently; keep checking after finding one correct statement.
4. For universal claims, use small counterexamples such as identity, zero, or triangular matrices.
5. For numerical answers, verify by substitution and keep exact fractions until the last step.
6. In the comprehension, make one table of original inputs, encoded values, reconstructions, and squared distances.

Try each question with its solution closed. Open the dropdown to compare your reasoning, study the concept, and review the common mistake. The worked solutions below are independently derived explanations, not an official answer key. Option letters refer to the order shown in this file.

---

## Question 1 — Best linear approximation

**Question ID:** `6406532158886`  
**Marks:** 3 | **Type:** MCQ

What is the best linear approximation of $f(x,y)=\sqrt{x+y}$ around $(4,5)$?

**Options:**

A. $L(x,y)=9+\dfrac{1}{6}(x-5)+\dfrac{1}{6}(y-4)$  
B. $L(x,y)=3+\dfrac{1}{6}(x-4)+\dfrac{1}{6}(y-5)$  
C. $L(x,y)=3+\dfrac{1}{3}(x-4)+\dfrac{1}{3}(y-5)$  
D. $L(x,y)=9+\dfrac{1}{18}(x-4)+\dfrac{1}{18}(y-5)$

<details>
<summary>Show solution and learn the concept</summary>

**Concept: the tangent-plane approximation.** For a differentiable function at $(a,b)$:

$$
L(x,y)=f(a,b)+f_x(a,b)(x-a)+f_y(a,b)(y-b).
$$

Here $f(x,y)=(x+y)^{1/2}$, so:

$$
f(4,5)=3,\qquad f_x=f_y=\frac1{2\sqrt{x+y}},
\qquad f_x(4,5)=f_y(4,5)=\frac16.
$$

Therefore:

$$
L(x,y)=3+\frac16(x-4)+\frac16(y-5).
$$

**Answer: B.**

**Why the other options fail:** A and D give $L(4,5)=9$ instead of $3$. C has the correct constant but incorrect slopes $1/3$.

**Strategy to remember:** Check the base value first, then the slopes. Keep the coordinate displacements paired with the expansion point.

</details>

---

## Question 2 — Directional derivative of production cost

**Question ID:** `6406532158887`  
**Marks:** 3 | **Type:** MCQ

A company manufactures a special rectangular metal sheet. The production cost (in hundreds of rupees) depends on its length $x$ meters and width $y$ meters according to $C(x,y)=x^2+y^2$. At a particular stage, the dimensions of the sheet are $(1,2)$. The company plans to change the dimensions in the direction represented by the vector

$$
v=\frac{1}{5}(3,4)
$$

and wants to determine how rapidly the production cost changes in that specific direction. Find the directional derivative of $C(x,y)$ at the point $(1,2)$ in the direction of $v$.

**Options:**

A. $5$  
B. $4$  
C. $\dfrac{11}{5}$  
D. $\dfrac{22}{5}$

<details>
<summary>Show solution and learn the concept</summary>

**Concept: a directional derivative measures slope per unit movement in the specified direction.** Differentiate the cost function:

$$
\nabla C=(2x,2y),\qquad \nabla C(1,2)=(2,4).
$$

The supplied vector is already unit length: $\|v\|=\sqrt{3^2+4^2}/5=1$. Thus:

$$
D_vC(1,2)=(2,4)\cdot\left(\frac35,\frac45\right)
=\frac65+\frac{16}5=\frac{22}5.
$$

**Answer: D.** The rate is $22/5$ hundreds of rupees per meter of movement along the unit direction in dimension space.

**Strategy to remember:** Use the whole gradient, including both factors of $2$. Do not take the dot product with the unnormalized vector $(3,4)$.

</details>

---

## Question 3 — Orthogonal projection matrix

**Question ID:** `6406532158888`  
**Marks:** 3 | **Type:** MCQ

Find the projection matrix that projects the $xy$ plane onto the line $x+y=0$.

**Options:**

A.
$$
\frac{1}{2}\begin{bmatrix}1&-1\\-1&1\end{bmatrix}
$$

B.
$$
\frac{1}{2}\begin{bmatrix}1&1\\1&1\end{bmatrix}
$$

C.
$$
\begin{bmatrix}-1&1\\1&-1\end{bmatrix}
$$

D.
$$
\frac{1}{2}\begin{bmatrix}1&0\\1&0\end{bmatrix}
$$

<details>
<summary>Show solution and learn the concept</summary>

**Concept: orthogonal projection retains the component along a line.** The line $x+y=0$ has direction $w=(1,-1)^T$. The vector $(1,1)^T$ is its normal.

$$
P=\frac{ww^T}{w^Tw}
=\frac12\begin{bmatrix}1&-1\\-1&1\end{bmatrix}.
$$

**Answer: A.**

**Why the other options fail:** B projects onto $x=y$. C equals $-2P$, so it sends $w$ to $-2w$ instead of preserving $w$. D sends $(x,y)$ to $(x/2,x/2)$, which generally does not lie on $x+y=0$.

**Check:** $Pw=w$ and $P(1,1)^T=0$.

**Strategy to remember:** Find a direction vector from the line equation. Using its normal instead projects onto the perpendicular line.

</details>

---

## Question 4 — Properties of real symmetric matrices

**Question ID:** `6406532158889`  
**Marks:** 3 | **Type:** MCQ

Let $M$ be a real symmetric matrix. Consider the following statements.

1. $M$ is orthogonally diagonalizable.
2. $M$ is not diagonalizable.
3. All the eigenvalues of $M$ are real.
4. The eigenvalues of $M$ may be imaginary.
5. Eigenvectors corresponding to distinct eigenvalues of $M$ are linearly independent.
6. Eigenvectors corresponding to distinct eigenvalues of $M$ are linearly dependent.

Which of the above statements are true?

**Options:**

A. (1), (3), (5)  
B. (2), (4), (6)  
C. (2), (3), (5)  
D. (1), (4), (6)

<details>
<summary>Show solution and learn the concept</summary>

**Concept: the spectral theorem for real symmetric matrices.** Such a matrix has an orthonormal eigenbasis and real eigenvalues. Consequently:

| Statement | Verdict | Reason |
| --- | --- | --- |
| 1 | True | $M=Q\Lambda Q^T$ with orthogonal $Q$. |
| 2 | False | Orthogonal diagonalizability implies diagonalizability. |
| 3 | True | All eigenvalues of a real symmetric matrix are real. |
| 4 | False | Non-real eigenvalues are excluded by symmetry. |
| 5 | True | Eigenvectors for distinct eigenvalues are orthogonal, hence independent. |
| 6 | False | It contradicts statement 5. |

**Answer: A, representing statements (1), (3), and (5).**

**Why orthogonality holds:** If $Mu=\lambda u$ and $Mv=\mu v$, symmetry gives $u^TMv=(Mu)^Tv$, so $(\mu-\lambda)u^Tv=0$. With distinct eigenvalues, $u^Tv=0$.

**Strategy to remember:** The word *symmetric* is decisive. General real matrices can have non-real eigenvalues or fail to be diagonalizable.

</details>

---

## Question 5 — Matrix multiplication and row spaces

**Question ID:** `6406532158890`  
**Marks:** 3 | **Type:** MSQ

Let $A$ and $B$ be two square matrices of order $4$. The rows of $B$ are represented by row vectors $r_1,r_2,r_3,r_4$, from top to bottom, and the columns of $B$ are represented by column vectors $c_1,c_2,c_3,c_4$, from left to right. The second row of $A$ is $[1,3,-2,4]$. Which of the following is/are true?

**Options:**

- [ ] **A.** The second row of $AB$ is $r_1+3r_2-2r_3+4r_4$.
- [ ] **B.** The second column of $AB$ is $c_1+3c_2-2c_3+4c_4$.
- [ ] **C.** The row space of $AB$ is contained in the row space of $A$.
- [ ] **D.** The row space of $AB$ is contained in the row space of $B$.

<details>
<summary>Show solution and learn the concept</summary>

**Concept: matrix multiplication builds rows and columns through different combinations.** The $i$th row of $AB$ is $\sum_k a_{ik}\operatorname{row}_k(B)$. The $j$th column is $A c_j$.

- **A is true.** The second row of $A$ supplies the coefficients $1,3,-2,4$, so the second row of $AB$ is $r_1+3r_2-2r_3+4r_4$.
- **B is false.** The second column is $A c_2$, not a combination of the columns of $B$ with coefficients from a row of $A$. For a concrete counterexample, set $B=I_4$ and let $A$ have the stated second row and all other rows zero. The second column of $AB$ is $(0,3,0,0)^T$, whereas the proposed expression is $(1,3,-2,4)^T$.
- **C is false.** Rows of $AB$ need not lie in the row space of $A$. For example, let $A$ have only the nonzero second row $a=(1,3,-2,4)$ and let $B$ swap the first two coordinates. Then $AB$ has nonzero row $(3,1,-2,4)$, which is not a scalar multiple of $a$.
- **D is true.** Every row of $AB$ is a linear combination of rows of $B$. Hence $\operatorname{Row}(AB)\subseteq\operatorname{Row}(B)$.

**Answer: A and D.**

**Strategy to remember:** For a product $AB$, product rows are combinations of the right factor's rows; product columns are combinations of the left factor's columns.

</details>

---

## Question 6 — Repeated eigenvalue

**Question ID:** `6406532158891`  
**Marks:** 3 | **Type:** MSQ

$P$ is a square matrix of order $2$ with the eigenvalue $3$ repeated twice. Which of the following is/are true?

**Options:**

- [ ] **A.** $P$ is invertible.
- [ ] **B.** Each of the entries on the main diagonal of $P$ is equal to $3$.
- [ ] **C.** $P$ has two linearly independent eigenvectors.
- [ ] **D.** $P-3I$ is not invertible, where $I$ is the identity matrix.

<details>
<summary>Show solution and learn the concept</summary>

**Concept: eigenvalue multiplicity does not determine eigenvectors or individual diagonal entries.** Both eigenvalues are $3$.

- **A is true.** $\det P=3\cdot3=9\ne0$, so $P$ is invertible.
- **B is false.** The trace is $6$, but this only determines the sum of the diagonal entries. For example, $\begin{bmatrix}2&1\\-1&4\end{bmatrix}$ has characteristic polynomial $(\lambda-3)^2$ while its diagonal entries are $2$ and $4$.
- **C is false.** $\begin{bmatrix}3&1\\0&3\end{bmatrix}$ has eigenvalue $3$ twice but its eigenspace is only $\operatorname{span}\{(1,0)\}$. Two independent eigenvectors are not guaranteed.
- **D is true.** Since $3$ is an eigenvalue, there is a nonzero $v$ with $(P-3I)v=0$, so $P-3I$ is singular.

**Answer: A and D.**

**Strategy to remember:** A repeated root of the characteristic polynomial gives algebraic multiplicity. Count independent eigenvectors using the kernel of $P-3I$.

</details>

---

## Question 7 — Rank and fundamental subspaces

**Question ID:** `6406532158892`  
**Marks:** 4 | **Type:** MSQ

Suppose $M$ is a $6\times4$ matrix with rank $4$. Which of the following is/are true?

**Options:**

- [ ] **A.** Columns of $M$ are linearly independent.
- [ ] **B.** Null space of $M$ contains only the zero vector.
- [ ] **C.** Row space of $M$ is $\mathbb{R}^6$.
- [ ] **D.** Left null space of $M$ has dimension $2$.

<details>
<summary>Show solution and learn the concept</summary>

**Concept: rank-nullity and ambient spaces.** Here $m=6$, $n=4$, and $r=4$.

| Quantity | Calculation | Value |
| --- | --- | --- |
| Column-space dimension | $r$ | 4 |
| Row-space dimension | $r$ | 4 |
| Nullspace dimension | $n-r$ | 0 |
| Left-nullspace dimension | $m-r$ | 2 |

- **A is true:** All four columns are independent because the column rank is four.
- **B is true:** A zero-dimensional nullspace contains only the zero vector.
- **C is false:** Rows have four coordinates, so the row space is a subspace of $\mathbb{R}^4$. Its dimension is four, making it all of $\mathbb{R}^4$, not $\mathbb{R}^6$.
- **D is true:** The left nullspace is $\ker M^T$ and has dimension $6-4=2$.

**Answer: A, B, and D.**

**Strategy to remember:** Use the number of columns for ordinary nullity and the number of rows for left nullity. A space's dimension and the number of coordinates in its vectors are different pieces of information.

</details>

---

## Question 8 — Parametric and Cartesian forms of a line

**Question ID:** `6406532158893`  
**Marks:** 4 | **Type:** MSQ

Which of the following represents the set of all points on the line passing through $(2,1)$ along the direction $(-3,2)$? (More than one option can be correct).

**Options:**

- [ ] **A.** $\{(2,1)+\alpha(-3,2):\alpha\in\mathbb{R}\}$
- [ ] **B.** $\{(x,y):2x+3y=7;\ x,y\in\mathbb{R}\}$
- [ ] **C.** $\{(-3,2)+\alpha(2,1):\alpha\in\mathbb{R}\}$
- [ ] **D.** $\{(x,y):2y-x=7;\ x,y\in\mathbb{R}\}$

<details>
<summary>Show solution and learn the concept</summary>

**Concept: equivalent descriptions of a line need the same location and direction.** The required line has point $p=(2,1)$ and direction $d=(-3,2)$.

- **A is true:** It is exactly $p+\alpha d$ for all real $\alpha$.
- **B is true:** Its normal is $n=(2,3)$. Since $n^Td=2(-3)+3(2)=0$ and $n^Tp=2(2)+3(1)=7$, the equation $2x+3y=7$ describes the required line.
- **C is false:** It uses base point $(-3,2)$ and direction $(2,1)$. In particular, the base point gives $2(-3)+3(2)=0\ne7$, so it lies outside the required line.
- **D is false:** The required point $(2,1)$ gives $2y-x=0$, not $7$.

**Answer: A and B.**

**Strategy to remember:** A Cartesian line equation can be checked in two steps: the base point must satisfy it, and its normal must be perpendicular to the direction. Sharing just a point or just a direction is insufficient.

</details>

---

## Question 9 — Maximum absolute inner product

**Question ID:** `6406532158894`  
**Marks:** 3 | **Type:** SA

Let $u,v\in\mathbb{R}^5$ be two vectors with $\|u\|=2$ and $\|v\|=3$. Find the maximum possible value of $|u^Tv|$, where $|x|$ represents the absolute value of $x$. Your answer should be an integer.

**Answer (Numeric):** __________

<details>
<summary>Show solution and learn the concept</summary>

**Concept: Cauchy-Schwarz bounds an inner product.** The vector space dimension does not change the bound:

$$
|u^Tv|\leq\|u\|\|v\|=2\cdot3=6.
$$

This bound is attainable. Choose $u=(2,0,0,0,0)$ and $v=(3,0,0,0,0)$. Their lengths are $2$ and $3$, and $|u^Tv|=6$. Opposite directions also attain the same absolute value.

**Answer to enter: `6`.**

**Strategy to remember:** A bound becomes a maximum only when equality can be achieved. Here it is achieved by parallel vectors with the prescribed lengths.

</details>

---

## Question 10 — Reconstruct a matrix from eigenpairs

**Question ID:** `6406532158895`  
**Marks:** 4 | **Type:** SA

Let

$$
A=\begin{bmatrix}a&b\\c&d\end{bmatrix}
$$

be the matrix whose eigenvalues are $1$ and $4$, and whose eigenvectors are $(3,1)$ and $(2,1)$ respectively. Find $a+b+c+d$. Your answer should be an integer.

**Answer (Numeric):** __________

<details>
<summary>Show solution and learn the concept</summary>

**Concept: a matrix is determined by its action on a basis.** The eigenvectors $(3,1)^T$ and $(2,1)^T$ are independent, since the determinant of the matrix with these columns is $3-2=1$.

Put the eigenvectors and their matching eigenvalues in the same order:

$$
S=\begin{bmatrix}3&2\\1&1\end{bmatrix},\qquad
\Lambda=\begin{bmatrix}1&0\\0&4\end{bmatrix},\qquad
S^{-1}=\begin{bmatrix}1&-2\\-1&3\end{bmatrix}.
$$

Then:

$$
A=S\Lambda S^{-1}
=\begin{bmatrix}3&8\\1&4\end{bmatrix}
\begin{bmatrix}1&-2\\-1&3\end{bmatrix}
=\begin{bmatrix}-5&18\\-3&10\end{bmatrix}.
$$

Therefore $a+b+c+d=-5+18-3+10=20$.

**Answer to enter: `20`.**

**Check:** $A(3,1)^T=(3,1)^T$ and $A(2,1)^T=(8,4)^T=4(2,1)^T$.

**Alternative without an inverse:** Write $3a+b=3$, $3c+d=1$, $2a+b=8$, and $2c+d=4$, then solve the two pairs of equations.

**Strategy to remember:** The eigenvalue $1$ belongs to the first vector and $4$ to the second. Switching the order in only one of $S$ or $\Lambda$ produces the wrong matrix.

</details>

---

## Question 11 — Comprehension: Encoder–decoder reconstruction

**Question ID:** `6406532158896`  
**Marks:** 0 | **Type:** COMPREHENSION

Consider the following dataset consisting of two features $x_1$ and $x_2$:

| $x_1$ | $x_2$ |
| ---: | ---: |
| 2 | 4 |
| 6 | 8 |

We want to reduce the dimensionality of the dataset from $2$ to $1$ using the following encoder-decoder pairs.

**Pair 1:**

$$
f(x_1,x_2)=\frac{x_1+x_2}{2},\qquad g(u)=[u,u]
$$

**Pair 2:**

$$
f(x_1,x_2)=x_1-x_2,\qquad g(u)=[u,u]
$$

The reconstruction loss is defined as the mean squared distance between the reconstructed input and the original input. Based on the above information, answer the given sub-questions.

<details>
<summary>Show solution and learn the concept</summary>

**Concept: evaluate the encoder and then the decoder.** For each original row $x=(x_1,x_2)$, compute the scalar code $u=f(x)$ and the reconstructed vector $\widehat x=g(u)=(u,u)$.

The loss specified as the mean squared distance is:

$$
L=\frac12\left(\|x^{(1)}-\widehat x^{(1)}\|^2+
\|x^{(2)}-\widehat x^{(2)}\|^2\right).
$$

| Pair | Original $x$ | Code $u$ | Reconstruction $\widehat x$ | Squared distance |
| --- | --- | --- | --- | --- |
| 1 | $(2,4)$ | 3 | $(3,3)$ | $(-1)^2+1^2=2$ |
| 1 | $(6,8)$ | 7 | $(7,7)$ | $(-1)^2+1^2=2$ |
| 2 | $(2,4)$ | $-2$ | $(-2,-2)$ | $4^2+6^2=52$ |
| 2 | $(6,8)$ | $-2$ | $(-2,-2)$ | $8^2+10^2=164$ |

**Shared setup:** Average the two distances for the selected pair in Questions 12 and 13, then compare them in Question 14. This passage has no separate answer to enter.

**Geometric interpretation:** Pair 1 is orthogonal projection onto the diagonal line $x_1=x_2$. For a reconstruction constrained to $(u,u)$, minimizing $(x_1-u)^2+(x_2-u)^2$ gives $4u-2(x_1+x_2)=0$, hence $u=(x_1+x_2)/2$. Pair 2 sends both supplied inputs to the same code $-2$, losing the difference between their positions along the diagonal direction.

**Strategy to remember:** The decoder output is compared with the original two-coordinate vector. Do not compare the scalar code directly with either feature.

</details>


### Question 12 — Reconstruction loss for Pair 1

**Question ID:** `6406532158897`  
**Marks:** 3 | **Type:** SA | **Parent:** Question 11

Compute the reconstruction loss for Pair 1. NOTE: Your answer should be an integer

**Answer (Numeric):** __________

<details>
<summary>Show solution and learn the concept</summary>

**Concept: average squared distances over data points.** For Pair 1:

$$
(2,4)\xrightarrow{f}3\xrightarrow{g}(3,3),
\qquad \|(2,4)-(3,3)\|^2=1+1=2.
$$

$$
(6,8)\xrightarrow{f}7\xrightarrow{g}(7,7),
\qquad \|(6,8)-(7,7)\|^2=1+1=2.
$$

There are two data points, so:

$$
L_1=\frac{2+2}{2}=2.
$$

**Answer to enter: `2`.**

**Strategy to remember:** Each squared Euclidean distance already sums the two coordinate errors. An additional division by the feature count would give coordinate-averaged MSE $1$, rather than the mean squared distance requested here.

</details>


### Question 13 — Reconstruction loss for Pair 2

**Question ID:** `6406532158898`  
**Marks:** 3 | **Type:** SA | **Parent:** Question 11

Compute the reconstruction loss for Pair 2. NOTE: Your answer should be an integer

**Answer (Numeric):** __________

<details>
<summary>Show solution and learn the concept</summary>

**Concept: the same scalar code can reconstruct different original inputs poorly.** For Pair 2, both inputs have code $u=x_1-x_2=-2$, so both reconstruct to $(-2,-2)$.

For the first point:

$$
\|(2,4)-(-2,-2)\|^2=4^2+6^2=52.
$$

For the second point:

$$
\|(6,8)-(-2,-2)\|^2=8^2+10^2=164.
$$

Average the two distances:

$$
L_2=\frac{52+164}{2}=108.
$$

**Answer to enter: `108`.**

**Strategy to remember:** Subtracting a negative reconstruction adds its magnitude. As in Question 12, coordinate-averaged MSE would be a different normalization, giving $54$; the mean squared distance is $108$.

</details>


### Question 14 — Best encoder–decoder pair

**Question ID:** `6406532158899`  
**Marks:** 1 | **Type:** MCQ | **Parent:** Question 11

Which encoder-decoder pair performs better?

**Options:**

A. Pair-1  
B. Pair-2

<details>
<summary>Show solution and learn the concept</summary>

**Concept: compare models using the same loss on the same dataset.** A smaller reconstruction loss means the reconstructed inputs are closer to the original inputs on average.

From Questions 12 and 13, $L_1=2$ and $L_2=108$. Since $2<108$, Pair 1 performs better.

**Answer: A, Pair-1.**

**Why:** Pair 1 retains each input's average coordinate and gives its closest point on the diagonal line. Pair 2 maps both inputs to the same distant point $(-2,-2)$. This comparison is for the two specified pairs on the supplied dataset.

**Strategy to remember:** Compare the final reconstruction losses, not the apparent simplicity of the encoder formulas. Dividing both losses by the same feature count would not change which pair wins.

</details>

---

**End of solved practice paper.**
