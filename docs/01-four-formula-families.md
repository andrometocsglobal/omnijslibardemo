# 01 — The Four Omnidimensional Formula Families

**Abstract.** OMNIBAL organises four classical mathematical families: arithmetic progressions (AP), geometric progressions (GP), harmonic progressions (HP) and omnidimensional geometry. It treats them as *computational primitives*. Each family turns a sequence or shape with N elements into a constant number of parameters. The mathematics is classical (Faulhaber, Bernoulli, Euler–Maclaurin, Gamma function). The engineering contribution is packaging these identities so that systems compute on the descriptor instead of enumerating elements.

Throughout, **X = n^d** is the *omnidimensional count*: the number of elements in a d-dimensional arrangement with n positions per axis.

---

## 1. Arithmetic progression (AP)

### 1.1 Definitions

```
a(k) = a0 + k·h                    k-th term (0-based)
last = a0 + (N − 1)·h
M    = (first + last)/2            midpoint — the "balance point"
S    = N·(first + last)/2 = N·M    sum of N terms
```

**Why the midpoint matters.** An AP is symmetric about M. Every term pairs with a mirror term, and the pair sums to 2M. That symmetry is why the sum collapses to N·M. It also makes all odd central moments vanish, which is the basis of OMNIBAL.

### 1.2 OMNIBAL fixed-power sum

For terms F, F+s, …, F+(X−1)s:

```
D^p = Σ_{j=0}^{X−1} (F + j·s)^p
    = X · Σ_{m=0}^{⌊p/2⌋} C(p, 2m) · M^(p−2m) · s^(2m) · μ_2m(X)
```

with the **normalised central moment block**

```
μ_r(X) = (1/X) · Σ_{j=0}^{X−1} ( j − (X−1)/2 )^r ,   μ_odd = 0
```

**Derivation sketch.** Write each term as M + s·(j − c) with c = (X−1)/2. Expand (M + s·u)^p binomially. Summing over j, the odd powers of u cancel by symmetry. The even powers become X·μ_2m(X).

**Moment-block library** (exact polynomials; each one checked in the tests for X = 1…40):

| block | polynomial in X |
|---|---|
| μ₀ | 1 |
| μ₂ | (X² − 1)/12 |
| μ₄ | (3X⁴ − 10X² + 7)/240 |
| μ₆ | (3X⁶ − 21X⁴ + 49X² − 31)/1344 |
| μ₈ | (5X⁸ − 60X⁶ + 294X⁴ − 620X² + 381)/11520 |
| μ₁₀ | (3X¹⁰ − 55X⁸ + 462X⁶ − 2046X⁴ + 4191X² − 2555)/33792 |

**Expanded forms** (for s = 1):

```
D¹ = X·[M]
D² = X·[M² + μ₂]
D³ = X·[M³ + 3M·μ₂]
D⁴ = X·[M⁴ + 6M²·μ₂ + μ₄]
D⁵ = X·[M⁵ + 10M³·μ₂ + 5M·μ₄]
D⁶ = X·[M⁶ + 15M⁴·μ₂ + 15M²·μ₄ + μ₆]
```

**Implementation.** μ_r(X) is computed exactly from Faulhaber sums Σk^t, which use Bernoulli numbers (Akiyama–Tanigawa, B₁ = +½). All arithmetic is in exact BigInt rationals (`Rational`).

**Cost.** O(p²) rational operations, which depends on the power **p only, never on X**. The Bernoulli table is cached.

**Verified cases:**
- 1⁹ + 2⁹ + 3⁹ = **20196**
- 2³ + 3³ + … + 9³ = **2024** (the "three-dimensional AP" star-lattice example)
- Σ (782 + 7j)⁵⁰ for X = 2¹⁰⁰ terms is an exact 1,576-digit integer. Enumeration could never produce it.

### 1.3 Hybrid ladder (finite differences)

For any polynomial f, `Σ_{k=0}^{X−1} f(k) = Σ_j Δ^j f(0) · C(X, j+1)`. The ladder terminates after deg(f)+1 heads, so the cost again depends on the degree, not on X.

---

## 2. Geometric progression (GP)

```
a(k)  = a·r^k
S(N)  = a·(r^N − 1)/(r − 1),   r ≠ 1     (S = a·N when r = 1)
P(X)  = a^X · r^(X(X−1)/2)               product of X terms
X = n^d  ⇒  S(d) = a·(r^(n^d) − 1)/(r − 1)
```

**Uses:**
- hierarchy sizes: a b-ary tree with L levels has (b^(L+1) − 1)/(b − 1) nodes
- capacity planning: levels = ⌈log_b(capacity)⌉
- exponential resource growth

**Honest cost statement.** "O(1)" here means a *constant number of formula evaluations*. Computing r^N exactly for huge N takes O(log N) multiplications on numbers whose size grows with N, so the bit-complexity is not constant. The library offers float versions (O(1) machine operations, with `expm1`/`log1p` near r = 1) and exact BigInt versions (`sumBig`, `productBig`). The BigInt versions have a guard against accidentally enormous results. `product()` returns its result in log space so that huge X does not overflow.

---

## 3. Harmonic progression (HP)

```
H(N) = Σ_{k=1}^{N} 1/k
H(N) ≈ ln N + γ + 1/(2N) − 1/(12N²) + 1/(120N⁴) − 1/(252N⁶) + …     (γ ≈ 0.5772156649)
X = n^d ⇒ H(n^d) ≈ d·ln n + γ + 1/(2n^d) − 1/(12n^(2d)) + …
```

**The critical boundary.** Unlike AP and GP, **HP has no finite elementary closed form.** The library therefore provides four modes and never presents HP as exact-and-constant:

| mode | method | cost | accuracy |
|---|---|---|---|
| `sumExact(N)` | iteration with Kahan–Neumaier summation | O(N) | float-exact |
| `sumRational(N)` | exact BigInt rationals | O(N) | exact |
| `sumApprox(N, terms)` | Euler–Maclaurin with Bernoulli corrections | O(terms) | returns `errorBound` (first omitted term) |
| `progressionSum(a0, h, N)` | digamma: [ψ(a0/h + N) − ψ(a0/h)]/h | O(1) at fixed precision | ~1e-13 relative |

**Reciprocal powers** Σ_{k=F}^{L} k^(−s) use direct summation of a short head, then Euler–Maclaurin on the tail with derivatives f^(m)(x) = (−1)^m·s(s+1)…(s+m−1)·x^(−s−m). An error estimate is returned. This is the Hurwitz-zeta route the research PDF names.

**Test evidence:**
- For N ∈ {10, 100, 1000, 12345}, |approx − exact| ≤ reported error bound.
- Σk⁻² up to 10⁶ matches π²/6 − 10⁻⁶ to 9 digits.

---

## 4. Omnidimensional geometry

| shape | content (volume) | related |
|---|---|---|
| d-ball | V = π^(d/2) / Γ(d/2+1) · R^d | S = d·V/R |
| d-cube | V = a^d | S = 2d·a^(d−1); diagonal a√d; k-faces C(d,k)·2^(d−k) |
| d-simplex (regular) | V = a^d/d! · √((d+1)/2^d) | k-faces C(d+1, k+1) |
| d-cross-polytope | V = 2^d/d! · R^d | k-faces 2^(k+1)·C(d, k+1); dual of the cube |

**Unified lens.** V(d) = k(d)·s^d, where k(d) is the shape's dimension-dependent *fill number*.

**Correction on the surface law.** The identity S(d) = d·V/s holds when **s is the inradius**. For the ball that is R. For the cube it is a/2, *not* a: with s = a you get d·a^(d−1), which is half the true 2d·a^(d−1). The library's `Geometry.unified.surface(d, V, inradius)` takes the inradius explicitly, and the tests check the cube case.

**Notable fact the library reproduces.** The unit-ball volume peaks at d = 5 (V₅ ≈ 5.2638) and then tends to 0. `Geometry.ball.peakDimension()` returns 5. The ball volume uses lnΓ so it stays stable for large d.

### 4.1 Regular-grid addressing (the "spatial" half)

A d-dimensional row-major lattice with shape (N₁, …, N_d) has strides s_i = Π_{j>i} N_j:

```
index = Σ_i c_i · s_i                      e.g. 3-D: ((x·Ny) + y)·Nz + z
c_i   = ⌊index / s_i⌋ mod N_i              (inverse by div/mod)
nearest cell: k_i = round((x_i − origin_i) / h_i)
```

**Cost.** Each call is O(d), which is **FIXED-DIMENSION O(1)**: constant with respect to the number of cells, with no lookup table. This is *not* general nearest-neighbour search. It is constant-time only because the lattice is regular.

---

## 5. Summary table

| family | exact closed form? | query cost in N | caveat |
|---|---|---|---|
| AP | yes | O(1) (power sums O(p²) in p) | BigInt for huge values |
| GP | yes | O(1) formula calls | exponentiation bit-cost grows |
| HP | **no** (special functions) | O(1) only at fixed precision | always report the error |
| Geometry | yes (Γ for the ball) | fixed-dimension O(1) | floats limit very large d |
