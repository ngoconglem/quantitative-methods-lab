/**
 * Structural equation models by maximum likelihood, in RAM form:
 *   Σ = F (I − A)⁻¹ S (I − A)⁻ᵀ Fᵀ
 * A holds directed paths (row = outcome, column = cause), S variances and covariances,
 * F selects the observed variables. Same fit function and χ² = N·F as lib/cfa.ts (lavaan's default).
 * Standard errors come from the numerical Hessian: Cov(θ) = (2/N) H⁻¹.
 * Checked against semopy in tests/check_advanced.py.
 */
import { inverse, chiSqSf, type Mat } from "./stats";
import { bfgs, covariance, isPD } from "./cfa";

export interface SemParam {
  kind: "A" | "S";
  row: number;
  col: number;
  label: string;
}

export interface SemSpec {
  vars: string[]; // observed first, then latent
  nObserved: number;
  params: SemParam[];
  /** Fixed non-zero entries, e.g. a marker loading of 1. */
  fixed: { kind: "A" | "S"; row: number; col: number; value: number }[];
}

export interface SemFit {
  converged: boolean;
  n: number;
  chi2: number;
  df: number;
  p: number;
  cfi: number;
  tli: number;
  rmsea: number;
  srmr: number;
  est: number[];
  se: number[];
  z: number[];
  pval: number[];
  std: number[]; // standardised value of each parameter
  cov: Mat; // covariance matrix of the estimates
  implied: (theta: number[]) => Mat; // full model-implied covariance of all variables
}

const eye = (n: number): Mat => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
const mul = (A: Mat, B: Mat): Mat => A.map((r) => B[0].map((_, j) => r.reduce((s, v, k) => s + v * B[k][j], 0)));
const tr = (A: Mat): Mat => A[0].map((_, j) => A.map((r) => r[j]));

function build(spec: SemSpec, theta: number[]) {
  const m = spec.vars.length;
  const A = Array.from({ length: m }, () => Array(m).fill(0));
  const S = Array.from({ length: m }, () => Array(m).fill(0));
  for (const f of spec.fixed) {
    if (f.kind === "A") A[f.row][f.col] = f.value;
    else S[f.row][f.col] = S[f.col][f.row] = f.value;
  }
  spec.params.forEach((p, k) => {
    if (p.kind === "A") A[p.row][p.col] = theta[k];
    else S[p.row][p.col] = S[p.col][p.row] = theta[k];
  });
  const IA = eye(m).map((r, i) => r.map((v, j) => v - A[i][j]));
  const B = inverse(IA).inv;
  const C = mul(mul(B, S), tr(B)); // all variables
  return { A, S, C };
}

export function fitSem(rows: number[][], spec: SemSpec): SemFit {
  const n = rows.length;
  const p = spec.nObserved;
  const Sm = covariance(rows);
  const { logDet: logDetS } = inverse(Sm);
  const impliedObs = (theta: number[]) => build(spec, theta).C.slice(0, p).map((r) => r.slice(0, p));
  const F = (theta: number[]) => {
    const Sig = impliedObs(theta);
    if (!isPD(Sig)) return Infinity;
    const { inv, logDet } = inverse(Sig);
    let t = 0;
    for (let i = 0; i < p; i++) for (let j = 0; j < p; j++) t += Sm[i][j] * inv[j][i];
    return logDet + t - logDetS - p;
  };
  const grad = (theta: number[]) => {
    const h = 1e-6;
    return theta.map((_, k) => {
      const a = [...theta];
      const b = [...theta];
      a[k] += h;
      b[k] -= h;
      return (F(a) - F(b)) / (2 * h);
    });
  };
  // starting values: variances from the data, paths and loadings small
  const theta0 = spec.params.map((q) => {
    if (q.kind === "S" && q.row === q.col) return q.row < p ? 0.5 * Sm[q.row][q.row] : 0.5;
    if (q.kind === "S") return 0;
    return q.row < p && q.col >= p ? 1 : 0.1;
  });
  const opt = bfgs((x) => {
    const f = F(x);
    return { f, g: isFinite(f) ? grad(x) : [] };
  }, theta0, 3000);
  const est = opt.x;
  const q = est.length;
  // numerical Hessian of F
  const h = 1e-4;
  const H: Mat = Array.from({ length: q }, () => Array(q).fill(0));
  const f0 = F(est);
  for (let i = 0; i < q; i++)
    for (let j = i; j < q; j++) {
      const pp = [...est], pm = [...est], mp = [...est], mm = [...est];
      pp[i] += h; pp[j] += h;
      pm[i] += h; pm[j] -= h;
      mp[i] -= h; mp[j] += h;
      mm[i] -= h; mm[j] -= h;
      H[i][j] = H[j][i] = i === j ? (F(pp) - 2 * f0 + F(mm)) / (4 * h * h) : (F(pp) - F(pm) - F(mp) + F(mm)) / (4 * h * h);
    }
  const covEst = inverse(H).inv.map((r) => r.map((v) => (2 / n) * v));
  const se = covEst.map((r, i) => Math.sqrt(Math.max(0, r[i])));
  const z = est.map((v, i) => v / se[i]);
  const erfc = (x: number) => {
    const t = 1 / (1 + 0.5 * Math.abs(x));
    const y = t * Math.exp(-x * x - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
    return x >= 0 ? y : 2 - y;
  };
  const pval = z.map((v) => erfc(Math.abs(v) / Math.SQRT2));
  // fit
  const chi2 = n * f0;
  const df = (p * (p + 1)) / 2 - q;
  const f00 = Sm.reduce((s, r, i) => s + Math.log(r[i]), 0) - logDetS;
  const chi0 = n * f00;
  const df0 = (p * (p - 1)) / 2;
  const cfi = 1 - Math.max(chi2 - df, 0) / Math.max(chi0 - df0, chi2 - df, 0);
  const tli = (chi0 / df0 - chi2 / df) / (chi0 / df0 - 1);
  const rmsea = Math.sqrt(Math.max(0, (chi2 - df) / (df * n)));
  const Sig = impliedObs(est);
  let ss = 0;
  for (let i = 0; i < p; i++)
    for (let j = 0; j <= i; j++) ss += (Sm[i][j] / Math.sqrt(Sm[i][i] * Sm[j][j]) - Sig[i][j] / Math.sqrt(Sig[i][i] * Sig[j][j])) ** 2;
  const { C } = build(spec, est);
  const std = spec.params.map((prm, k) =>
    prm.kind === "A" ? (est[k] * Math.sqrt(C[prm.col][prm.col])) / Math.sqrt(C[prm.row][prm.row]) : est[k] / Math.sqrt(C[prm.row][prm.row] * C[prm.col][prm.col]),
  );
  return {
    converged: opt.converged,
    n,
    chi2,
    df,
    p: chiSqSf(chi2, df),
    cfi,
    tli,
    rmsea,
    srmr: Math.sqrt(ss / ((p * (p + 1)) / 2)),
    est,
    se,
    z,
    pval,
    std,
    cov: covEst,
    implied: (theta) => build(spec, theta).C,
  };
}

/** Indirect effect a×b with a delta-method (Sobel) standard error. */
export function indirect(fit: SemFit, a: number, b: number) {
  const ea = fit.est[a];
  const eb = fit.est[b];
  const v = eb * eb * fit.cov[a][a] + ea * ea * fit.cov[b][b] + 2 * ea * eb * fit.cov[a][b];
  const se = Math.sqrt(v);
  return { est: ea * eb, se, lo: ea * eb - 1.959964 * se, hi: ea * eb + 1.959964 * se, std: fit.std[a] * fit.std[b] };
}
