// Psychometric statistics for the Scale Validation Lab.
// Mirrors analysis/psychometrics.py function by function; tests/compare_outputs.py checks they agree.

export type Mat = number[][];

// ---------------------------------------------------------------- small linear algebra

export const zeros = (r: number, c: number): Mat => Array.from({ length: r }, () => new Array(c).fill(0));
export const eye = (n: number): Mat => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
export const transpose = (A: Mat): Mat => A[0].map((_, j) => A.map((r) => r[j]));
export function matmul(A: Mat, B: Mat): Mat {
  const n = A.length, m = B[0].length, k = B.length;
  const C = zeros(n, m);
  for (let i = 0; i < n; i++)
    for (let t = 0; t < k; t++) {
      const a = A[i][t];
      if (a === 0) continue;
      const Bt = B[t];
      const Ci = C[i];
      for (let j = 0; j < m; j++) Ci[j] += a * Bt[j];
    }
  return C;
}

/** Gauss-Jordan inverse with partial pivoting; also returns log|det|. */
export function inverse(A: Mat): { inv: Mat; logDet: number } {
  const n = A.length;
  const M = A.map((r, i) => [...r, ...eye(n)[i]]);
  let logDet = 0;
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    if (Math.abs(M[p][c]) < 1e-14) throw new Error("The correlation matrix is singular: two or more items may be identical or perfectly related.");
    [M[c], M[p]] = [M[p], M[c]];
    const piv = M[c][c];
    logDet += Math.log(Math.abs(piv));
    for (let j = 0; j < 2 * n; j++) M[c][j] /= piv;
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = M[r][c];
      if (f === 0) continue;
      for (let j = 0; j < 2 * n; j++) M[r][j] -= f * M[c][j];
    }
  }
  return { inv: M.map((r) => r.slice(n)), logDet };
}

/** Cyclic Jacobi eigen-decomposition of a symmetric matrix. Values descending; vectors as columns. */
export function eigSym(S: Mat): { values: number[]; vectors: Mat } {
  const n = S.length;
  const A = S.map((r) => [...r]);
  const V = eye(n);
  for (let sweep = 0; sweep < 100; sweep++) {
    let off = 0;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) off += A[i][j] * A[i][j];
    if (off < 1e-22) break;
    for (let p = 0; p < n; p++)
      for (let q = p + 1; q < n; q++) {
        const apq = A[p][q];
        if (Math.abs(apq) < 1e-300) continue;
        const theta = (A[q][q] - A[p][p]) / (2 * apq);
        const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
        const c = 1 / Math.sqrt(t * t + 1);
        const s = t * c;
        for (let k = 0; k < n; k++) {
          const akp = A[k][p], akq = A[k][q];
          A[k][p] = c * akp - s * akq;
          A[k][q] = s * akp + c * akq;
        }
        for (let k = 0; k < n; k++) {
          const apk = A[p][k], aqk = A[q][k];
          A[p][k] = c * apk - s * aqk;
          A[q][k] = s * apk + c * aqk;
        }
        for (let k = 0; k < n; k++) {
          const vkp = V[k][p], vkq = V[k][q];
          V[k][p] = c * vkp - s * vkq;
          V[k][q] = s * vkp + c * vkq;
        }
      }
  }
  const order = A.map((r, i) => [r[i], i]).sort((a, b) => b[0] - a[0]);
  return { values: order.map((o) => o[0]), vectors: V.map((r) => order.map((o) => r[o[1]])) };
}

/** SVD of a small square matrix via eigen-decomposition of B'B. */
function svdSmall(B: Mat): { U: Mat; s: number[]; V: Mat } {
  const { values, vectors: V } = eigSym(matmul(transpose(B), B));
  const s = values.map((v) => Math.sqrt(Math.max(v, 0)));
  const BV = matmul(B, V);
  const U = BV.map((r) => r.map((x, j) => (s[j] > 1e-14 ? x / s[j] : 0)));
  return { U, s, V };
}

// ---------------------------------------------------------------- distributions

function lgamma(x: number): number {
  const g = 7;
  const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x);
  x -= 1;
  let a = c[0];
  const t = x + g + 0.5;
  for (let i = 1; i < g + 2; i++) a += c[i] / (x + i);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

function betacf(a: number, b: number, x: number): number {
  const MAXIT = 300, EPS = 3e-16, FPMIN = 1e-300;
  const qab = a + b, qap = a + 1, qam = a - 1;
  let c = 1, d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d; h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}

/** Regularized incomplete beta I_x(a, b). */
export function ibeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  return x < (a + 1) / (a + b + 2) ? (bt * betacf(a, b, x)) / a : 1 - (bt * betacf(b, a, 1 - x)) / b;
}

export const fCdf = (x: number, d1: number, d2: number) => (x <= 0 ? 0 : ibeta((d1 * x) / (d1 * x + d2), d1 / 2, d2 / 2));

/** Quantile of the F distribution by bisection on a log scale. */
export function fQuantile(p: number, d1: number, d2: number): number {
  let lo = -30, hi = 30;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (fCdf(Math.exp(mid), d1, d2) < p) lo = mid;
    else hi = mid;
  }
  return Math.exp((lo + hi) / 2);
}

/** Upper tail of the chi-square distribution (regularized upper incomplete gamma). */
export function chiSqSf(x: number, df: number): number {
  const a = df / 2, z = x / 2;
  if (z <= 0) return 1;
  const gln = lgamma(a);
  if (z < a + 1) {
    let sum = 1 / a, del = sum, ap = a;
    for (let n = 0; n < 1000; n++) {
      ap += 1; del *= z / ap; sum += del;
      if (Math.abs(del) < Math.abs(sum) * 1e-16) break;
    }
    return 1 - sum * Math.exp(-z + a * Math.log(z) - gln);
  }
  let b = z + 1 - a, c = 1e300, d = 1 / b, h = d;
  for (let i = 1; i < 1000; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300;
    c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 1e-16) break;
  }
  return Math.exp(-z + a * Math.log(z) - gln) * h;
}

// ---------------------------------------------------------------- data handling

/** Rows with no missing values. */
export const listwise = (X: (number | null)[][]): Mat => X.filter((r) => r.every((v) => v !== null && Number.isFinite(v))) as Mat;

export const reverseCols = (X: Mat, cols: number[], lo: number, hi: number): Mat =>
  X.map((r) => r.map((v, j) => (cols.includes(j) ? lo + hi - v : v)));

export const selectCols = (X: Mat, cols: number[]): Mat => X.map((r) => cols.map((j) => r[j]));

function colMeans(X: Mat): number[] {
  const p = X[0].length;
  const m = new Array(p).fill(0);
  for (const r of X) for (let j = 0; j < p; j++) m[j] += r[j];
  return m.map((s) => s / X.length);
}

function variance(xs: number[]): number {
  const m = xs.reduce((a, b) => a + b, 0) / xs.length;
  return xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1);
}

function pearson(x: number[], y: number[]): number {
  const n = x.length;
  const mx = x.reduce((a, b) => a + b, 0) / n, my = y.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) {
    sxy += (x[i] - mx) * (y[i] - my);
    sxx += (x[i] - mx) ** 2;
    syy += (y[i] - my) ** 2;
  }
  return sxy / Math.sqrt(sxx * syy);
}

export function corr(X: Mat): Mat {
  const n = X.length, p = X[0].length;
  const m = colMeans(X);
  const C = zeros(p, p);
  for (const r of X) {
    const d = r.map((v, j) => v - m[j]);
    for (let i = 0; i < p; i++) {
      const di = d[i];
      const Ci = C[i];
      for (let j = i; j < p; j++) Ci[j] += di * d[j];
    }
  }
  for (let i = 0; i < p; i++) for (let j = i; j < p; j++) C[j][i] = C[i][j];
  const sd = C.map((r, i) => Math.sqrt(r[i]));
  void n;
  return C.map((r, i) => r.map((v, j) => (i === j ? 1 : v / (sd[i] * sd[j]))));
}

// ---------------------------------------------------------------- reliability

export function cronbachAlpha(X: Mat): number {
  const k = X[0].length;
  let itemVar = 0;
  for (let j = 0; j < k; j++) itemVar += variance(X.map((r) => r[j]));
  const totalVar = variance(X.map((r) => r.reduce((a, b) => a + b, 0)));
  return (k / (k - 1)) * (1 - itemVar / totalVar);
}

/** Feldt (1965) confidence interval for alpha. */
export function alphaCI(alpha: number, n: number, k: number, level = 0.95): [number, number] {
  const a = 1 - level;
  const d1 = n - 1, d2 = (n - 1) * (k - 1);
  return [1 - (1 - alpha) * fQuantile(1 - a / 2, d1, d2), 1 - (1 - alpha) * fQuantile(a / 2, d1, d2)];
}

export interface ItemStat {
  citc: number;
  alphaIfDeleted: number;
}

export function itemStats(X: Mat): ItemStat[] {
  const k = X[0].length;
  const total = X.map((r) => r.reduce((a, b) => a + b, 0));
  return Array.from({ length: k }, (_, j) => ({
    citc: pearson(X.map((r) => r[j]), total.map((t, i) => t - X[i][j])),
    alphaIfDeleted: k > 2 ? cronbachAlpha(X.map((r) => r.filter((_, c) => c !== j))) : NaN,
  }));
}

export function omegaTotal(R: Mat): number {
  const { L } = paf(R, 1);
  const lam = L.map((r) => r[0]);
  const s = lam.reduce((a, b) => a + b, 0) ** 2;
  return s / (s + lam.reduce((a, l) => a + (1 - l * l), 0));
}

// ---------------------------------------------------------------- factorability

export function kmo(R: Mat): { overall: number; perItem: number[] } {
  const p = R.length;
  const { inv } = inverse(R);
  let r2s = 0, p2s = 0;
  const r2c = new Array(p).fill(0), p2c = new Array(p).fill(0);
  for (let i = 0; i < p; i++)
    for (let j = 0; j < p; j++) {
      if (i === j) continue;
      const r2 = R[i][j] ** 2;
      const pc = -inv[i][j] / Math.sqrt(inv[i][i] * inv[j][j]);
      const p2 = pc * pc;
      r2s += r2; p2s += p2; r2c[j] += r2; p2c[j] += p2;
    }
  return { overall: r2s / (r2s + p2s), perItem: r2c.map((r, j) => r / (r + p2c[j])) };
}

export function bartlett(R: Mat, n: number): { chi2: number; df: number; p: number } {
  const p = R.length;
  const { logDet } = inverse(R);
  const chi2 = -(n - 1 - (2 * p + 5) / 6) * logDet;
  const df = (p * (p - 1)) / 2;
  return { chi2, df, p: chiSqSf(chi2, df) };
}

// ---------------------------------------------------------------- parallel analysis

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function normalGen(seed: number) {
  const rnd = mulberry32(seed);
  return () => {
    let u = 0;
    while (u === 0) u = rnd();
    const v = rnd();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
}

/** Horn's parallel analysis on principal-component eigenvalues of random normal data (nearest-rank percentile). */
export function parallelAnalysis(n: number, p: number, iters = 100, seed = 2026, pct = 95): number[] {
  const normal = normalGen(seed);
  const eigs: number[][] = [];
  for (let t = 0; t < iters; t++) {
    const Z: Mat = Array.from({ length: n }, () => Array.from({ length: p }, () => normal()));
    eigs.push(eigSym(corr(Z)).values);
  }
  const k = Math.max(0, Math.ceil((pct / 100) * iters) - 1);
  return Array.from({ length: p }, (_, j) => eigs.map((e) => e[j]).sort((a, b) => a - b)[k]);
}

// ---------------------------------------------------------------- extraction and rotation

export function smc(R: Mat): number[] {
  const { inv } = inverse(R);
  return inv.map((r, i) => 1 - 1 / r[i]);
}

/** Iterated principal axis factoring from squared multiple correlations. */
export function paf(R: Mat, m: number, maxIter = 1000, tol = 1e-6): { L: Mat; iterations: number } {
  let h = smc(R);
  let L: Mat = [];
  let it = 0;
  for (it = 1; it <= maxIter; it++) {
    const Rh = R.map((r, i) => r.map((v, j) => (i === j ? h[i] : v)));
    const { values, vectors } = eigSym(Rh);
    L = vectors.map((r) => r.slice(0, m).map((v, j) => v * Math.sqrt(Math.max(values[j], 0))));
    const hNew = L.map((r) => Math.min(r.reduce((a, b) => a + b * b, 0), 0.999));
    const delta = Math.max(...hNew.map((v, i) => Math.abs(v - h[i])));
    h = hNew;
    if (delta < tol) break;
  }
  return { L, iterations: it };
}

/** R stats::varimax with Kaiser normalisation. */
export function varimax(L: Mat, eps = 1e-5, maxIter = 1000): Mat {
  const p = L.length, m = L[0].length;
  if (m < 2) return L.map((r) => [...r]);
  const sc = L.map((r) => Math.sqrt(r.reduce((a, b) => a + b * b, 0)));
  const x = L.map((r, i) => r.map((v) => v / sc[i]));
  let T = eye(m);
  let d = 0;
  for (let it = 0; it < maxIter; it++) {
    const z = matmul(x, T);
    const colSq = z[0].map((_, j) => z.reduce((a, r) => a + r[j] * r[j], 0));
    const inner = z.map((r) => r.map((v, j) => v ** 3 - (v * colSq[j]) / p));
    const B = matmul(transpose(x), inner);
    const { U, s, V } = svdSmall(B);
    T = matmul(U, transpose(V));
    const dPast = d;
    d = s.reduce((a, b) => a + b, 0);
    if (d < dPast * (1 + eps)) break;
  }
  return matmul(x, T).map((r, i) => r.map((v) => v * sc[i]));
}

function obliminVgQ(L: Mat, gamma: number): { Gq: Mat; f: number } {
  const p = L.length, m = L[0].length;
  const L2 = L.map((r) => r.map((v) => v * v));
  const N = Array.from({ length: m }, (_, i) => Array.from({ length: m }, (_, j) => (i === j ? 0 : 1)));
  let X = matmul(L2, N);
  if (gamma !== 0) {
    const colMean = X[0].map((_, j) => X.reduce((a, r) => a + r[j], 0) / p);
    X = X.map((r) => r.map((v, j) => v - gamma * colMean[j]));
  }
  let f = 0;
  const Gq = L.map((r, i) => r.map((v, j) => {
    f += L2[i][j] * X[i][j];
    return v * X[i][j];
  }));
  return { Gq, f: f / 4 };
}

/** Direct oblimin by gradient projection (GPArotation::GPFoblq), no normalisation. */
export function oblimin(A: Mat, gamma = 0, eps = 1e-5, maxIter = 1000): { L: Mat; Phi: Mat } {
  const m = A[0].length;
  if (m < 2) return { L: A.map((r) => [...r]), Phi: [[1]] };
  let T = eye(m);
  let al = 1;
  const rotate = (Tm: Mat) => matmul(A, transpose(inverse(Tm).inv));
  let L = rotate(T);
  let { Gq, f } = obliminVgQ(L, gamma);
  let G = transpose(matmul(matmul(transpose(L), Gq), inverse(T).inv)).map((r) => r.map((v) => -v));
  for (let it = 0; it < maxIter; it++) {
    const colTG = T[0].map((_, j) => T.reduce((a, r, i) => a + r[j] * G[i][j], 0));
    const Gp = G.map((r, i) => r.map((v, j) => v - T[i][j] * colTG[j]));
    const s = Math.sqrt(Gp.reduce((a, r) => a + r.reduce((b, v) => b + v * v, 0), 0));
    if (s < eps) break;
    al *= 2;
    let Tt = T, Lt = L, Gqt = Gq, ft = f;
    for (let i = 0; i <= 10; i++) {
      const X = T.map((r, a) => r.map((v, j) => v - al * Gp[a][j]));
      const v = X[0].map((_, j) => 1 / Math.sqrt(X.reduce((acc, r) => acc + r[j] * r[j], 0)));
      Tt = X.map((r) => r.map((x, j) => x * v[j]));
      Lt = rotate(Tt);
      ({ Gq: Gqt, f: ft } = obliminVgQ(Lt, gamma));
      if (f - ft > 0.5 * s * s * al) break;
      al /= 2;
    }
    T = Tt; L = Lt; Gq = Gqt; f = ft;
    G = transpose(matmul(matmul(transpose(L), Gq), inverse(T).inv)).map((r) => r.map((x) => -x));
  }
  return { L, Phi: matmul(transpose(T), T) };
}

/** Order factors by variance explained and make each column's loadings sum positive. */
export function tidy(L: Mat, Phi: Mat | null): { L: Mat; Phi: Mat } {
  const m = L[0].length;
  const P = Phi ?? eye(m);
  const ss = L[0].map((_, j) => L.reduce((a, r) => a + r[j] * r[j], 0));
  const order = ss.map((v, j) => [v, j]).sort((a, b) => b[0] - a[0] || a[1] - b[1]).map((x) => x[1]);
  const Lo = L.map((r) => order.map((j) => r[j]));
  const sign = order.map((_, k) => (Lo.reduce((a, r) => a + r[k], 0) < 0 ? -1 : 1));
  return {
    L: Lo.map((r) => r.map((v, k) => v * sign[k])),
    Phi: order.map((i, a) => order.map((j, b) => P[i][j] * sign[a] * sign[b])),
  };
}

export type Rotation = "oblimin" | "varimax" | "none";

export interface EfaResult {
  loadings: Mat;
  phi: Mat;
  communalities: number[];
  rmsr: number;
  iterations: number;
}

export function efa(R: Mat, m: number, rotation: Rotation = "oblimin"): EfaResult {
  const { L: L0, iterations } = paf(R, m);
  let L: Mat, Phi: Mat | null = null;
  if (rotation === "varimax") L = varimax(L0);
  else if (rotation === "oblimin") ({ L, Phi } = oblimin(L0));
  else L = L0;
  const t = tidy(L, Phi);
  const h2 = L0.map((r) => r.reduce((a, b) => a + b * b, 0));
  const implied = matmul(matmul(t.L, t.Phi), transpose(t.L));
  const p = R.length;
  let ss = 0;
  for (let i = 0; i < p; i++) for (let j = 0; j < p; j++) if (i !== j) ss += (R[i][j] - implied[i][j]) ** 2;
  return { loadings: t.L, phi: t.Phi, communalities: h2, rmsr: Math.sqrt(ss / (p * (p - 1))), iterations };
}
