/**
 * Statistics for the methods modules: description, correlation, group comparison,
 * linear and logistic regression, and contingency tables.
 * Every function is checked against SciPy and statsmodels in tests/check_methods.py.
 */
import { ibeta, chiSqSf, inverse, type Mat } from "./stats";

// ------------------------------------------------------------------ distributions

/** Complementary error function (W. J. Cody's rational approximations via erfc series; |rel err| < 1.2e-7). */
function erfc(x: number): number {
  const z = Math.abs(x);
  const t = 1 / (1 + 0.5 * z);
  const r =
    t *
    Math.exp(
      -z * z -
        1.26551223 +
        t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))),
    );
  return x >= 0 ? r : 2 - r;
}

export const normCdf = (x: number) => 0.5 * erfc(-x / Math.SQRT2);
export const normSf2 = (z: number) => erfc(Math.abs(z) / Math.SQRT2); // two-sided p

/** Acklam's inverse normal CDF, refined by one Halley step. */
export function normQuantile(p: number): number {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1, 2.506628277459239];
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
  const pl = 0.02425;
  let x: number;
  if (p < pl) {
    const q = Math.sqrt(-2 * Math.log(p));
    x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  } else if (p <= 1 - pl) {
    const q = p - 0.5;
    const r = q * q;
    x = ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  } else {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  const e = normCdf(x) - p;
  const u = e * Math.sqrt(2 * Math.PI) * Math.exp((x * x) / 2);
  return x - u / (1 + (x * u) / 2);
}

/** Two-sided p-value for a t statistic. */
export const tP2 = (t: number, df: number) => ibeta(df / (df + t * t), df / 2, 0.5);

/** Quantile of the t distribution (upper tail probability 1 - p), by bisection on the CDF. */
export function tQuantile(p: number, df: number): number {
  const cdf = (t: number) => (t >= 0 ? 1 - 0.5 * tP2(t, df) : 0.5 * tP2(t, df));
  let lo = -1e3;
  let hi = 1e3;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (cdf(mid) < p) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

export const fSf = (f: number, d1: number, d2: number) => (f <= 0 ? 1 : ibeta(d2 / (d2 + d1 * f), d2 / 2, d1 / 2));

// ------------------------------------------------------------------ description

export const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
export const mean = (xs: number[]) => sum(xs) / xs.length;
export function variance(xs: number[]): number {
  const m = mean(xs);
  return sum(xs.map((x) => (x - m) ** 2)) / (xs.length - 1);
}
export const sd = (xs: number[]) => Math.sqrt(variance(xs));

/** Quantile with linear interpolation (type 7, the default in R and NumPy). */
export function quantile(xs: number[], q: number): number {
  const s = [...xs].sort((a, b) => a - b);
  const h = (s.length - 1) * q;
  const lo = Math.floor(h);
  return s[lo] + (h - lo) * ((s[Math.min(lo + 1, s.length - 1)] ?? s[lo]) - s[lo]);
}

/** Adjusted sample skewness G1, as reported by SPSS and pandas. */
export function skewness(xs: number[]): number {
  const n = xs.length;
  const m = mean(xs);
  const m2 = sum(xs.map((x) => (x - m) ** 2)) / n;
  const m3 = sum(xs.map((x) => (x - m) ** 3)) / n;
  const g1 = m3 / Math.pow(m2, 1.5);
  return (Math.sqrt(n * (n - 1)) / (n - 2)) * g1;
}

export interface Summary {
  n: number;
  mean: number;
  sd: number;
  median: number;
  q1: number;
  q3: number;
  min: number;
  max: number;
  skew: number;
}
export function describe(xs: number[]): Summary {
  return {
    n: xs.length,
    mean: mean(xs),
    sd: sd(xs),
    median: quantile(xs, 0.5),
    q1: quantile(xs, 0.25),
    q3: quantile(xs, 0.75),
    min: Math.min(...xs),
    max: Math.max(...xs),
    skew: skewness(xs),
  };
}

export function histogram(xs: number[], bins: number): { edges: number[]; counts: number[] } {
  const lo = Math.min(...xs);
  const hi = Math.max(...xs);
  const w = (hi - lo) / bins || 1;
  const counts = new Array(bins).fill(0);
  for (const x of xs) counts[Math.min(bins - 1, Math.floor((x - lo) / w))]++;
  return { edges: Array.from({ length: bins + 1 }, (_, i) => lo + i * w), counts };
}

// ------------------------------------------------------------------ correlation

export interface Correlation {
  r: number;
  n: number;
  t: number;
  df: number;
  p: number;
  ci: [number, number];
}

export function pearson(x: number[], y: number[]): Correlation {
  const n = x.length;
  const mx = mean(x);
  const my = mean(y);
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    sxy += (x[i] - mx) * (y[i] - my);
    sxx += (x[i] - mx) ** 2;
    syy += (y[i] - my) ** 2;
  }
  const r = sxy / Math.sqrt(sxx * syy);
  const df = n - 2;
  const t = (r * Math.sqrt(df)) / Math.sqrt(1 - r * r);
  const z = Math.atanh(r);
  const se = 1 / Math.sqrt(n - 3);
  const zc = normQuantile(0.975);
  return { r, n, t, df, p: tP2(t, df), ci: [Math.tanh(z - zc * se), Math.tanh(z + zc * se)] };
}

/** Average ranks (ties share the mean rank). */
export function ranks(xs: number[]): number[] {
  const idx = xs.map((v, i) => [v, i] as const).sort((a, b) => a[0] - b[0]);
  const out = new Array(xs.length);
  for (let i = 0; i < idx.length; ) {
    let j = i;
    while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++;
    const rank = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) out[idx[k][1]] = rank;
    i = j + 1;
  }
  return out;
}

export function spearman(x: number[], y: number[]): { rho: number; p: number } {
  const c = pearson(ranks(x), ranks(y));
  return { rho: c.r, p: c.p };
}

// ------------------------------------------------------------------ two groups

export interface TwoGroups {
  meanA: number;
  meanB: number;
  diff: number;
  t: number;
  df: number;
  p: number;
  ci: [number, number];
  d: number;
  dCi: [number, number];
  nA: number;
  nB: number;
}

/** Welch's t-test (unequal variances), with Cohen's d using the pooled SD. */
export function welch(a: number[], b: number[]): TwoGroups {
  const nA = a.length;
  const nB = b.length;
  const va = variance(a);
  const vb = variance(b);
  const se = Math.sqrt(va / nA + vb / nB);
  const diff = mean(a) - mean(b);
  const t = diff / se;
  const df = (va / nA + vb / nB) ** 2 / ((va / nA) ** 2 / (nA - 1) + (vb / nB) ** 2 / (nB - 1));
  const tc = tQuantile(0.975, df);
  const pooled = Math.sqrt(((nA - 1) * va + (nB - 1) * vb) / (nA + nB - 2));
  const d = diff / pooled;
  const seD = Math.sqrt((nA + nB) / (nA * nB) + (d * d) / (2 * (nA + nB)));
  const zc = normQuantile(0.975);
  return { meanA: mean(a), meanB: mean(b), diff, t, df, p: tP2(t, df), ci: [diff - tc * se, diff + tc * se], d, dCi: [d - zc * seD, d + zc * seD], nA, nB };
}

/** Paired t-test; d is d_z (mean difference / SD of differences). */
export function paired(a: number[], b: number[]) {
  const diffs = a.map((x, i) => x - b[i]);
  const n = diffs.length;
  const m = mean(diffs);
  const s = sd(diffs);
  const se = s / Math.sqrt(n);
  const t = m / se;
  const df = n - 1;
  const tc = tQuantile(0.975, df);
  return { n, meanA: mean(a), meanB: mean(b), diff: m, t, df, p: tP2(t, df), ci: [m - tc * se, m + tc * se] as [number, number], dz: m / s };
}

// ------------------------------------------------------------------ linear regression

export interface Ols {
  names: string[];
  coef: number[];
  se: number[];
  t: number[];
  p: number[];
  ci: [number, number][];
  r2: number;
  adjR2: number;
  f: number;
  fP: number;
  dfModel: number;
  dfResid: number;
  n: number;
  fitted: number[];
  resid: number[];
  vif: number[];
  sigma: number;
}

function solveNormal(X: Mat, y: number[]): { beta: number[]; XtXinv: Mat } {
  const k = X[0].length;
  const XtX: Mat = Array.from({ length: k }, (_, i) => Array.from({ length: k }, (_, j) => sum(X.map((r) => r[i] * r[j]))));
  const Xty = Array.from({ length: k }, (_, i) => sum(X.map((r, n) => r[i] * y[n])));
  const { inv } = inverse(XtX);
  return { beta: inv.map((row) => sum(row.map((v, j) => v * Xty[j]))), XtXinv: inv };
}

/** Ordinary least squares. `cols` excludes the intercept, which is added. */
export function ols(cols: number[][], names: string[], y: number[]): Ols {
  const n = y.length;
  const X: Mat = y.map((_, i) => [1, ...cols.map((c) => c[i])]);
  const { beta, XtXinv } = solveNormal(X, y);
  const fitted = X.map((r) => sum(r.map((v, j) => v * beta[j])));
  const resid = y.map((v, i) => v - fitted[i]);
  const k = beta.length;
  const dfResid = n - k;
  const sse = sum(resid.map((e) => e * e));
  const my = mean(y);
  const sst = sum(y.map((v) => (v - my) ** 2));
  const s2 = sse / dfResid;
  const se = XtXinv.map((row, i) => Math.sqrt(s2 * row[i]));
  const t = beta.map((b, i) => b / se[i]);
  const tc = tQuantile(0.975, dfResid);
  const r2 = 1 - sse / sst;
  const dfModel = k - 1;
  const f = (r2 / dfModel) / ((1 - r2) / dfResid);
  const vif = cols.map((_, j) => {
    if (cols.length < 2) return 1;
    const others = cols.filter((__, i) => i !== j);
    const sub = olsR2(others, cols[j]);
    return 1 / (1 - sub);
  });
  return {
    names: ["(Intercept)", ...names],
    coef: beta,
    se,
    t,
    p: t.map((v) => tP2(v, dfResid)),
    ci: beta.map((b, i) => [b - tc * se[i], b + tc * se[i]] as [number, number]),
    r2,
    adjR2: 1 - ((1 - r2) * (n - 1)) / dfResid,
    f,
    fP: fSf(f, dfModel, dfResid),
    dfModel,
    dfResid,
    n,
    fitted,
    resid,
    vif,
    sigma: Math.sqrt(s2),
  };
}

function olsR2(cols: number[][], y: number[]): number {
  const X: Mat = y.map((_, i) => [1, ...cols.map((c) => c[i])]);
  const { beta } = solveNormal(X, y);
  const my = mean(y);
  let sse = 0;
  let sst = 0;
  X.forEach((r, i) => {
    const f = sum(r.map((v, j) => v * beta[j]));
    sse += (y[i] - f) ** 2;
    sst += (y[i] - my) ** 2;
  });
  return 1 - sse / sst;
}

// ------------------------------------------------------------------ contingency tables

export interface ChiSq {
  chi2: number;
  df: number;
  p: number;
  expected: Mat;
  cramerV: number;
  minExpected: number;
}

/** Pearson's chi-square test of independence, without continuity correction. */
export function chiSquare(table: Mat): ChiSq {
  const rows = table.map((r) => sum(r));
  const colsT = table[0].map((_, j) => sum(table.map((r) => r[j])));
  const n = sum(rows);
  const expected = table.map((r, i) => r.map((_, j) => (rows[i] * colsT[j]) / n));
  let chi2 = 0;
  table.forEach((r, i) => r.forEach((o, j) => (chi2 += (o - expected[i][j]) ** 2 / expected[i][j])));
  const df = (table.length - 1) * (table[0].length - 1);
  const k = Math.min(table.length, table[0].length);
  return { chi2, df, p: chiSqSf(chi2, df), expected, cramerV: Math.sqrt(chi2 / (n * (k - 1))), minExpected: Math.min(...expected.flat()) };
}

/** Odds ratio for a 2 × 2 table [[a, b], [c, d]] with Woolf's 95% CI. */
export function oddsRatio(t: Mat): { or: number; ci: [number, number] } {
  const [[a, b], [c, d]] = t;
  const or = (a * d) / (b * c);
  const se = Math.sqrt(1 / a + 1 / b + 1 / c + 1 / d);
  const zc = normQuantile(0.975);
  return { or, ci: [Math.exp(Math.log(or) - zc * se), Math.exp(Math.log(or) + zc * se)] };
}

// ------------------------------------------------------------------ logistic regression

export interface Logit {
  names: string[];
  coef: number[];
  se: number[];
  z: number[];
  p: number[];
  ci: [number, number][];
  or: number[];
  orCi: [number, number][];
  ll: number;
  llNull: number;
  mcfadden: number;
  aic: number;
  n: number;
  events: number;
  iterations: number;
  predict: (row: number[]) => number;
}

/** Logistic regression by iteratively reweighted least squares. `cols` excludes the intercept. */
export function logistic(cols: number[][], names: string[], y: number[]): Logit {
  const n = y.length;
  const X: Mat = y.map((_, i) => [1, ...cols.map((c) => c[i])]);
  const k = X[0].length;
  let beta = new Array(k).fill(0);
  let iterations = 0;
  let cov: Mat = [];
  const loglik = (b: number[]) =>
    sum(
      X.map((r, i) => {
        const eta = sum(r.map((v, j) => v * b[j]));
        return y[i] * eta - Math.log1p(Math.exp(eta));
      }),
    );
  for (; iterations < 100; iterations++) {
    const p = X.map((r) => 1 / (1 + Math.exp(-sum(r.map((v, j) => v * beta[j])))));
    const W = p.map((pi) => pi * (1 - pi));
    const XtWX: Mat = Array.from({ length: k }, (_, a) => Array.from({ length: k }, (_, b) => sum(X.map((r, i) => r[a] * r[b] * W[i]))));
    const grad = Array.from({ length: k }, (_, a) => sum(X.map((r, i) => r[a] * (y[i] - p[i]))));
    cov = inverse(XtWX).inv;
    const step = cov.map((row) => sum(row.map((v, j) => v * grad[j])));
    beta = beta.map((b, j) => b + step[j]);
    if (Math.max(...step.map(Math.abs)) < 1e-10) {
      iterations++;
      const p2 = X.map((r) => 1 / (1 + Math.exp(-sum(r.map((v, j) => v * beta[j])))));
      const W2 = p2.map((pi) => pi * (1 - pi));
      cov = inverse(Array.from({ length: k }, (_, a) => Array.from({ length: k }, (_, b) => sum(X.map((r, i) => r[a] * r[b] * W2[i]))))).inv;
      break;
    }
  }
  const se = cov.map((row, i) => Math.sqrt(row[i]));
  const z = beta.map((b, i) => b / se[i]);
  const zc = normQuantile(0.975);
  const ci = beta.map((b, i) => [b - zc * se[i], b + zc * se[i]] as [number, number]);
  const events = sum(y);
  const pbar = events / n;
  const llNull = events * Math.log(pbar) + (n - events) * Math.log(1 - pbar);
  const ll = loglik(beta);
  const b = beta;
  return {
    names: ["(Intercept)", ...names],
    coef: beta,
    se,
    z,
    p: z.map(normSf2),
    ci,
    or: beta.map(Math.exp),
    orCi: ci.map(([lo, hi]) => [Math.exp(lo), Math.exp(hi)] as [number, number]),
    ll,
    llNull,
    mcfadden: 1 - ll / llNull,
    aic: -2 * ll + 2 * k,
    n,
    events,
    iterations,
    predict: (row: number[]) => 1 / (1 + Math.exp(-(b[0] + sum(row.map((v, j) => v * b[j + 1]))))),
  };
}

// ------------------------------------------------------------------ helpers

/** Deterministic shuffle-sample of size k from xs (seeded Mulberry32). */
export function sample<T>(xs: T[], k: number, seed: number): T[] {
  let s = seed >>> 0;
  const rnd = () => {
    s += 0x6d2b79f5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, Math.min(k, a.length));
}
