/**
 * Three or more groups: one-way ANOVA (classic and Welch), effect sizes, Kruskal–Wallis,
 * and pairwise Welch t-tests with Holm's adjustment. Checked in tests/check_methods.py.
 */
import { ibeta, chiSqSf } from "./stats";
import { ranks, welch } from "./methods";

const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
const variance = (xs: number[]) => {
  const m = mean(xs);
  return xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1);
};

/** Upper tail of the F distribution. */
export function fSf(F: number, d1: number, d2: number): number {
  if (!(F > 0)) return 1;
  return ibeta(d2 / (d2 + d1 * F), d2 / 2, d1 / 2);
}

export interface GroupSummary {
  label: string;
  n: number;
  mean: number;
  sd: number;
  median: number;
}

export interface OneWay {
  groups: GroupSummary[];
  F: number;
  df1: number;
  df2: number;
  p: number;
  welchF: number;
  welchDf2: number;
  welchP: number;
  eta2: number;
  omega2: number;
}

export function oneWay(samples: number[][], labels: string[]): OneWay {
  const k = samples.length;
  const all = samples.flat();
  const N = all.length;
  const grand = mean(all);
  const ns = samples.map((s) => s.length);
  const ms = samples.map(mean);
  const vs = samples.map(variance);
  const ssB = ms.reduce((s, m, i) => s + ns[i] * (m - grand) ** 2, 0);
  const ssW = samples.reduce((s, xs, i) => s + xs.reduce((t, x) => t + (x - ms[i]) ** 2, 0), 0);
  const df1 = k - 1;
  const df2 = N - k;
  const msW = ssW / df2;
  const F = ssB / df1 / msW;
  // Welch (1951)
  const w = ns.map((n, i) => n / vs[i]);
  const W = w.reduce((s, x) => s + x, 0);
  const mw = w.reduce((s, wi, i) => s + wi * ms[i], 0) / W;
  const A = w.reduce((s, wi, i) => s + wi * (ms[i] - mw) ** 2, 0) / df1;
  const lam = w.reduce((s, wi, i) => s + (1 - wi / W) ** 2 / (ns[i] - 1), 0);
  const B = 1 + ((2 * (k - 2)) / (k * k - 1)) * lam;
  const welchF = A / B;
  const welchDf2 = (k * k - 1) / (3 * lam);
  const sorted = samples.map((s) => [...s].sort((a, b) => a - b));
  const med = (s: number[]) => (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2);
  return {
    groups: labels.map((label, i) => ({ label, n: ns[i], mean: ms[i], sd: Math.sqrt(vs[i]), median: med(sorted[i]) })),
    F,
    df1,
    df2,
    p: fSf(F, df1, df2),
    welchF,
    welchDf2,
    welchP: fSf(welchF, df1, welchDf2),
    eta2: ssB / (ssB + ssW),
    omega2: (ssB - df1 * msW) / (ssB + ssW + msW),
  };
}

export interface Kruskal {
  H: number;
  df: number;
  p: number;
  epsilon2: number;
  meanRanks: number[];
}

/** Kruskal–Wallis H with the tie correction (as scipy.stats.kruskal); epsilon² = H / (N − 1). */
export function kruskal(samples: number[][]): Kruskal {
  const all = samples.flat();
  const N = all.length;
  const r = ranks(all);
  let off = 0;
  let H = 0;
  const meanRanks: number[] = [];
  for (const s of samples) {
    const R = r.slice(off, off + s.length).reduce((a, b) => a + b, 0);
    meanRanks.push(R / s.length);
    H += (R * R) / s.length;
    off += s.length;
  }
  H = (12 / (N * (N + 1))) * H - 3 * (N + 1);
  const counts = new Map<number, number>();
  all.forEach((x) => counts.set(x, (counts.get(x) ?? 0) + 1));
  let ties = 0;
  counts.forEach((t) => (ties += t ** 3 - t));
  H /= 1 - ties / (N ** 3 - N);
  const df = samples.length - 1;
  return { H, df, p: chiSqSf(H, df), epsilon2: H / (N - 1), meanRanks };
}

export interface PairRow {
  a: string;
  b: string;
  diff: number;
  d: number;
  p: number;
  pHolm: number;
}

/** All pairwise Welch t-tests, with Holm's step-down adjustment of the p-values. */
export function pairwise(samples: number[][], labels: string[]): PairRow[] {
  const rows: PairRow[] = [];
  for (let i = 0; i < samples.length; i++)
    for (let j = i + 1; j < samples.length; j++) {
      const w = welch(samples[j], samples[i]);
      rows.push({ a: labels[j], b: labels[i], diff: w.diff, d: w.d, p: w.p, pHolm: 0 });
    }
  const order = rows.map((r, i) => [r.p, i] as const).sort((x, y) => x[0] - y[0]);
  let running = 0;
  order.forEach(([p, i], rank) => {
    running = Math.max(running, Math.min(1, (rows.length - rank) * p));
    rows[i].pHolm = running;
  });
  return rows;
}
