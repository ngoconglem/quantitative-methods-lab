/**
 * Bayesian estimation of a standardised difference (Cohen's d) with a normal prior and a
 * normal approximation to the likelihood (d̂ with its standard error). Conjugate, so exact
 * under that approximation. Bayes factor by the Savage–Dickey density ratio at d = 0.
 * Checked against grid integration in tests/check_advanced.py.
 */
const dnorm = (x: number, m: number, s: number) => Math.exp(-0.5 * ((x - m) / s) ** 2) / (s * Math.sqrt(2 * Math.PI));

function pnorm(z: number): number {
  const t = 1 / (1 + 0.5 * Math.abs(z / Math.SQRT2));
  const y = t * Math.exp(-(z * z) / 2 - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
  return z >= 0 ? 1 - y / 2 : y / 2;
}

export interface Posterior {
  mean: number;
  sd: number;
  ci: [number, number];
  pPositive: number;
  bf10: number;
}

export function normalPosterior(priorMean: number, priorSd: number, est: number, se: number): Posterior {
  const wp = 1 / priorSd ** 2;
  const wd = 1 / se ** 2;
  const sd = Math.sqrt(1 / (wp + wd));
  const mean = (wp * priorMean + wd * est) * sd * sd;
  const bf01 = dnorm(0, mean, sd) / dnorm(0, priorMean, priorSd);
  return { mean, sd, ci: [mean - 1.959964 * sd, mean + 1.959964 * sd], pPositive: 1 - pnorm((0 - mean) / sd), bf10: 1 / bf01 };
}

export { dnorm };
