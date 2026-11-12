/**
 * Confirmatory factor analysis by maximum likelihood, for simple-structure models
 * (each item on one factor, correlated factors, factor variances fixed at 1).
 *
 * Fit function: F = log|Σ| + tr(SΣ⁻¹) − log|S| − p, with S the covariance matrix using
 * divisor N, as lavaan does. χ² = N·F_min. Minimised by BFGS with analytic gradients.
 * Checked against semopy in tests/check_cfa.py.
 */
import { inverse, chiSqSf, type Mat } from "./stats";

export interface CfaModel {
  factors: string[];
  /** For each item (column of the data), the index of its factor. */
  itemFactor: number[];
  items: string[];
}

export interface CfaFit {
  converged: boolean;
  iterations: number;
  n: number;
  chi2: number;
  df: number;
  p: number;
  cfi: number;
  tli: number;
  rmsea: number;
  rmseaCi: [number, number];
  srmr: number;
  loadings: number[]; // unstandardised, per item
  std: number[]; // standardised loadings, per item
  resid: number[]; // residual variances
  phi: Mat; // factor correlations
  cr: number[]; // composite reliability per factor
  ave: number[]; // average variance extracted per factor
  residCorr: Mat; // standardised residual correlations (observed − implied)
}

const zeros = (r: number, c: number): Mat => Array.from({ length: r }, () => Array(c).fill(0));

export function covariance(rows: number[][]): Mat {
  const n = rows.length;
  const p = rows[0].length;
  const m = Array.from({ length: p }, (_, j) => rows.reduce((s, r) => s + r[j], 0) / n);
  const S = zeros(p, p);
  for (const r of rows)
    for (let i = 0; i < p; i++) {
      const di = r[i] - m[i];
      for (let j = i; j < p; j++) S[i][j] += di * (r[j] - m[j]);
    }
  for (let i = 0; i < p; i++)
    for (let j = i; j < p; j++) {
      S[i][j] /= n;
      S[j][i] = S[i][j];
    }
  return S;
}

function unpack(theta: number[], model: CfaModel) {
  const p = model.items.length;
  const k = model.factors.length;
  const lam = theta.slice(0, p);
  const res = theta.slice(p, 2 * p);
  const phi = zeros(k, k);
  let o = 2 * p;
  for (let f = 0; f < k; f++) {
    phi[f][f] = 1;
    for (let g = f + 1; g < k; g++) phi[f][g] = phi[g][f] = theta[o++];
  }
  return { lam, res, phi };
}

function implied(theta: number[], model: CfaModel): Mat {
  const { lam, res, phi } = unpack(theta, model);
  const p = lam.length;
  const S = zeros(p, p);
  for (let i = 0; i < p; i++)
    for (let j = 0; j < p; j++) S[i][j] = lam[i] * lam[j] * phi[model.itemFactor[i]][model.itemFactor[j]] + (i === j ? res[i] : 0);
  return S;
}

function objective(theta: number[], model: CfaModel, S: Mat, logDetS: number): { f: number; g: number[] } {
  const p = model.items.length;
  const k = model.factors.length;
  const Sig = implied(theta, model);
  const { inv, logDet } = inverse(Sig);
  // Σ must be positive definite: check via a Cholesky attempt.
  if (!isPD(Sig)) return { f: Infinity, g: [] };
  let tr = 0;
  for (let i = 0; i < p; i++) for (let j = 0; j < p; j++) tr += S[i][j] * inv[j][i];
  const f = logDet + tr - logDetS - p;
  // Ω = Σ⁻¹ (Σ − S) Σ⁻¹
  const D = Sig.map((r, i) => r.map((v, j) => v - S[i][j]));
  const tmp = inv.map((r) => D[0].map((_, j) => r.reduce((s, v, m) => s + v * D[m][j], 0)));
  const Om = tmp.map((r) => inv[0].map((_, j) => r.reduce((s, v, m) => s + v * inv[m][j], 0)));
  const { lam, phi } = unpack(theta, model);
  const g: number[] = Array(theta.length).fill(0);
  // dF/dλ_i = 2 Σ_j Ω_ij λ_j φ_{f(i) f(j)}
  for (let i = 0; i < p; i++) {
    let s = 0;
    for (let j = 0; j < p; j++) s += Om[i][j] * lam[j] * phi[model.itemFactor[i]][model.itemFactor[j]];
    g[i] = 2 * s;
    g[p + i] = Om[i][i];
  }
  let o = 2 * p;
  for (let f1 = 0; f1 < k; f1++)
    for (let f2 = f1 + 1; f2 < k; f2++) {
      let s = 0;
      for (let i = 0; i < p; i++)
        for (let j = 0; j < p; j++) if (model.itemFactor[i] === f1 && model.itemFactor[j] === f2) s += Om[i][j] * lam[i] * lam[j];
      g[o++] = 2 * s;
    }
  return { f, g };
}

function isPD(A: Mat): boolean {
  const n = A.length;
  const L = zeros(n, n);
  for (let i = 0; i < n; i++)
    for (let j = 0; j <= i; j++) {
      let s = A[i][j];
      for (let m = 0; m < j; m++) s -= L[i][m] * L[j][m];
      if (i === j) {
        if (s <= 1e-12) return false;
        L[i][i] = Math.sqrt(s);
      } else L[i][j] = s / L[j][j];
    }
  return true;
}

function bfgs(fn: (x: number[]) => { f: number; g: number[] }, x0: number[], maxIter = 2000) {
  const n = x0.length;
  let x = [...x0];
  let { f, g } = fn(x);
  let H: Mat = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
  let it = 0;
  for (; it < maxIter; it++) {
    const gnorm = Math.sqrt(g.reduce((s, v) => s + v * v, 0));
    if (gnorm < 1e-7) break;
    const d = H.map((r) => -r.reduce((s, v, j) => s + v * g[j], 0));
    let slope = d.reduce((s, v, i) => s + v * g[i], 0);
    if (slope >= 0) {
      H = H.map((r, i) => r.map((_, j) => (i === j ? 1 : 0) as number));
      for (let i = 0; i < n; i++) d[i] = -g[i];
      slope = -gnorm * gnorm;
    }
    let step = 1;
    let xn: number[] = x;
    let res = { f: Infinity, g: [] as number[] };
    for (let ls = 0; ls < 60; ls++) {
      xn = x.map((v, i) => v + step * d[i]);
      res = fn(xn);
      if (res.f <= f + 1e-4 * step * slope) break;
      step *= 0.5;
    }
    if (!isFinite(res.f)) break;
    const s = xn.map((v, i) => v - x[i]);
    const y = res.g.map((v, i) => v - g[i]);
    const sy = s.reduce((a, v, i) => a + v * y[i], 0);
    if (Math.abs(f - res.f) < 1e-14 && step < 1e-10) {
      x = xn;
      f = res.f;
      g = res.g;
      break;
    }
    x = xn;
    f = res.f;
    g = res.g;
    if (sy > 1e-12) {
      const Hy = H.map((r) => r.reduce((a, v, j) => a + v * y[j], 0));
      const yHy = y.reduce((a, v, i) => a + v * Hy[i], 0);
      for (let i = 0; i < n; i++)
        for (let j = 0; j < n; j++) H[i][j] += ((sy + yHy) * s[i] * s[j]) / (sy * sy) - (Hy[i] * s[j] + s[i] * Hy[j]) / sy;
    }
  }
  const gnorm = Math.sqrt(g.reduce((s, v) => s + v * v, 0));
  return { x, f, iterations: it, converged: gnorm < 1e-5 };
}

/** Lower-tail CDF of the non-central chi-square (Poisson mixture of central chi-squares). */
function ncx2Cdf(x: number, df: number, nc: number): number {
  if (nc <= 0) return 1 - chiSqSf(x, df);
  const h = nc / 2;
  const kMax = Math.ceil(h + 12 * Math.sqrt(h) + 30);
  let logw = -h;
  let total = 0;
  for (let k = 0; k <= kMax; k++) {
    if (k > 0) logw += Math.log(h) - Math.log(k);
    total += Math.exp(logw) * (1 - chiSqSf(x, df + 2 * k));
  }
  return Math.min(1, Math.max(0, total));
}

function solveNc(x: number, df: number, target: number): number {
  // smallest nc with cdf(x; df, nc) = target; cdf decreases as nc grows
  if (ncx2Cdf(x, df, 0) < target) return 0;
  let lo = 0;
  let hi = Math.max(10, x);
  while (ncx2Cdf(x, df, hi) > target) hi *= 2;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (ncx2Cdf(x, df, mid) > target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

export function fitCfa(rows: number[][], model: CfaModel): CfaFit {
  const n = rows.length;
  const p = model.items.length;
  const k = model.factors.length;
  const S = covariance(rows);
  const { logDet: logDetS } = inverse(S);
  const theta0 = [
    ...S.map((r, i) => 0.7 * Math.sqrt(r[i])),
    ...S.map((r, i) => 0.5 * r[i]),
    ...Array((k * (k - 1)) / 2).fill(0.3),
  ];
  const opt = bfgs((x) => objective(x, model, S, logDetS), theta0);
  const { lam, res, phi } = unpack(opt.x, model);
  const Sig = implied(opt.x, model);
  const q = opt.x.length;
  const df = (p * (p + 1)) / 2 - q;
  const chi2 = n * opt.f;
  // baseline: independence model
  const f0 = S.reduce((s, r, i) => s + Math.log(r[i]), 0) - logDetS;
  const chi0 = n * f0;
  const df0 = (p * (p - 1)) / 2;
  const cfi = 1 - Math.max(chi2 - df, 0) / Math.max(chi0 - df0, chi2 - df, 0);
  const tli = (chi0 / df0 - chi2 / df) / (chi0 / df0 - 1);
  const rmsea = Math.sqrt(Math.max(0, (chi2 - df) / (df * n)));
  const ncLo = solveNc(chi2, df, 0.95);
  const ncHi = solveNc(chi2, df, 0.05);
  const residCorr = zeros(p, p);
  let ss = 0;
  for (let i = 0; i < p; i++)
    for (let j = 0; j <= i; j++) {
      const r = S[i][j] / Math.sqrt(S[i][i] * S[j][j]) - Sig[i][j] / Math.sqrt(Sig[i][i] * Sig[j][j]);
      residCorr[i][j] = residCorr[j][i] = r;
      ss += r * r;
    }
  const std = lam.map((l, i) => l / Math.sqrt(Sig[i][i]));
  // flip a factor's sign if most of its loadings are negative
  for (let f = 0; f < k; f++) {
    const idx = model.itemFactor.map((g, i) => (g === f ? i : -1)).filter((i) => i >= 0);
    if (idx.reduce((s, i) => s + std[i], 0) < 0) {
      idx.forEach((i) => {
        std[i] = -std[i];
        lam[i] = -lam[i];
      });
      for (let g = 0; g < k; g++) if (g !== f) phi[f][g] = phi[g][f] = -phi[f][g];
    }
  }
  const cr: number[] = [];
  const ave: number[] = [];
  for (let f = 0; f < k; f++) {
    const ls = std.filter((_, i) => model.itemFactor[i] === f);
    const sl = ls.reduce((s, v) => s + v, 0);
    const se = ls.reduce((s, v) => s + (1 - v * v), 0);
    cr.push((sl * sl) / (sl * sl + se));
    ave.push(ls.reduce((s, v) => s + v * v, 0) / ls.length);
  }
  return {
    converged: opt.converged,
    iterations: opt.iterations,
    n,
    chi2,
    df,
    p: chiSqSf(chi2, df),
    cfi,
    tli,
    rmsea,
    rmseaCi: [Math.sqrt(ncLo / (df * n)), Math.sqrt(ncHi / (df * n))],
    srmr: Math.sqrt(ss / ((p * (p + 1)) / 2)),
    loadings: lam,
    std,
    resid: res,
    phi,
    cr,
    ave,
    residCorr,
  };
}
