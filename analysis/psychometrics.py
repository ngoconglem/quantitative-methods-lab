"""Reference implementation of every measurement statistic (Module 6) in the Quantitative Methods Lab.

web/src/lib/stats.ts mirrors these functions; tests/compare_outputs.py checks that the
two agree, and tests/check_against_factor_analyzer.py cross-checks this module against
the independent factor_analyzer package.
"""
from __future__ import annotations

import math

import numpy as np
from scipy import stats


# ---------------------------------------------------------------- data handling

def listwise(X: np.ndarray) -> np.ndarray:
    return X[~np.isnan(X).any(axis=1)]


def reverse(X: np.ndarray, cols: list[int], lo: float, hi: float) -> np.ndarray:
    Y = X.copy()
    Y[:, cols] = lo + hi - Y[:, cols]
    return Y


def corr(X: np.ndarray) -> np.ndarray:
    return np.corrcoef(X, rowvar=False)


# ---------------------------------------------------------------- reliability

def cronbach_alpha(X: np.ndarray) -> float:
    k = X.shape[1]
    item_var = X.var(axis=0, ddof=1).sum()
    total_var = X.sum(axis=1).var(ddof=1)
    return k / (k - 1) * (1 - item_var / total_var)


def alpha_ci(alpha: float, n: int, k: int, level: float = 0.95) -> tuple[float, float]:
    """Feldt (1965) confidence interval."""
    a = 1 - level
    df1, df2 = n - 1, (n - 1) * (k - 1)
    lo = 1 - (1 - alpha) * stats.f.ppf(1 - a / 2, df1, df2)
    hi = 1 - (1 - alpha) * stats.f.ppf(a / 2, df1, df2)
    return lo, hi


def item_stats(X: np.ndarray) -> list[dict]:
    total = X.sum(axis=1)
    out = []
    for j in range(X.shape[1]):
        rest = total - X[:, j]
        r = np.corrcoef(X[:, j], rest)[0, 1]
        out.append({"citc": r, "alphaIfDeleted": cronbach_alpha(np.delete(X, j, axis=1))})
    return out


def omega_total(R: np.ndarray, max_iter: int = 1000) -> float:
    L, _ = paf(R, 1, max_iter=max_iter)
    lam = L[:, 0]
    s = lam.sum() ** 2
    return s / (s + (1 - lam**2).sum())


# ---------------------------------------------------------------- factorability

def kmo(R: np.ndarray) -> tuple[float, np.ndarray]:
    Ri = np.linalg.inv(R)
    d = np.sqrt(np.outer(np.diag(Ri), np.diag(Ri)))
    P = -Ri / d  # partial correlations
    np.fill_diagonal(P, 0)
    R0 = R.copy()
    np.fill_diagonal(R0, 0)
    r2, p2 = (R0**2), (P**2)
    overall = r2.sum() / (r2.sum() + p2.sum())
    per_item = r2.sum(axis=0) / (r2.sum(axis=0) + p2.sum(axis=0))
    return overall, per_item


def bartlett(R: np.ndarray, n: int) -> tuple[float, int, float]:
    p = R.shape[0]
    chi2 = -(n - 1 - (2 * p + 5) / 6) * math.log(np.linalg.det(R))
    df = p * (p - 1) // 2
    return chi2, df, stats.chi2.sf(chi2, df)


# ---------------------------------------------------------------- random numbers (shared with JS)

class Mulberry32:
    """Small seeded PRNG identical to the browser version, so parallel analysis is reproducible."""

    def __init__(self, seed: int):
        self.a = seed & 0xFFFFFFFF

    def random(self) -> float:
        self.a = (self.a + 0x6D2B79F5) & 0xFFFFFFFF
        t = self.a
        t = ((t ^ (t >> 15)) * (t | 1)) & 0xFFFFFFFF
        t ^= (t + (((t ^ (t >> 7)) * (t | 61)) & 0xFFFFFFFF)) & 0xFFFFFFFF
        return ((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296

    def normal(self) -> float:
        u = 0.0
        while u == 0.0:
            u = self.random()
        v = self.random()
        return math.sqrt(-2 * math.log(u)) * math.cos(2 * math.pi * v)


def parallel_analysis(n: int, p: int, iters: int = 100, seed: int = 2026, pct: float = 95) -> np.ndarray:
    """Horn's parallel analysis on principal-component eigenvalues of random normal data."""
    rng = Mulberry32(seed)
    eigs = np.empty((iters, p))
    for t in range(iters):
        Z = np.array([[rng.normal() for _ in range(p)] for _ in range(n)])
        eigs[t] = np.sort(np.linalg.eigvalsh(corr(Z)))[::-1]
    # nearest-rank percentile, matching the browser code
    k = max(0, math.ceil(pct / 100 * iters) - 1)
    return np.sort(eigs, axis=0)[k]


# ---------------------------------------------------------------- extraction

def smc(R: np.ndarray) -> np.ndarray:
    return 1 - 1 / np.diag(np.linalg.inv(R))


def paf(R: np.ndarray, m: int, max_iter: int = 1000, tol: float = 1e-6) -> tuple[np.ndarray, int]:
    """Iterated principal axis factoring, starting from squared multiple correlations."""
    h = smc(R)
    it = 0
    for it in range(1, max_iter + 1):
        Rh = R.copy()
        np.fill_diagonal(Rh, h)
        w, V = np.linalg.eigh(Rh)
        idx = np.argsort(w)[::-1][:m]
        L = V[:, idx] * np.sqrt(np.clip(w[idx], 0, None))
        h_new = np.minimum((L**2).sum(axis=1), 0.999)
        if np.max(np.abs(h_new - h)) < tol:
            h = h_new
            break
        h = h_new
    return L, it


# ---------------------------------------------------------------- rotation

def varimax(L: np.ndarray, eps: float = 1e-5, max_iter: int = 1000) -> np.ndarray:
    """R stats::varimax with Kaiser normalisation."""
    p, m = L.shape
    if m < 2:
        return L.copy()
    sc = np.sqrt((L**2).sum(axis=1))
    x = L / sc[:, None]
    T = np.eye(m)
    d = 0.0
    for _ in range(max_iter):
        z = x @ T
        B = x.T @ (z**3 - z @ np.diag((z**2).sum(axis=0)) / p)
        U, s, Vt = np.linalg.svd(B)
        T = U @ Vt
        d_past, d = d, s.sum()
        if d < d_past * (1 + eps):
            break
    return (x @ T) * sc[:, None]


def _oblimin_vgq(L: np.ndarray, gamma: float = 0.0):
    p, m = L.shape
    L2 = L**2
    N = np.ones((m, m)) - np.eye(m)
    if gamma != 0:
        C = np.ones((p, p)) / p
        X = (np.eye(p) - gamma * C) @ L2 @ N
    else:
        X = L2 @ N
    return L * X, (L2 * X).sum() / 4


def oblimin(A: np.ndarray, gamma: float = 0.0, eps: float = 1e-5, max_iter: int = 1000) -> tuple[np.ndarray, np.ndarray]:
    """Direct oblimin by gradient projection (GPArotation::GPFoblq), no normalisation."""
    m = A.shape[1]
    if m < 2:
        return A.copy(), np.eye(1)
    T = np.eye(m)
    al = 1.0
    L = A @ np.linalg.inv(T).T
    Gq, f = _oblimin_vgq(L, gamma)
    G = -(L.T @ Gq @ np.linalg.inv(T)).T
    for _ in range(max_iter):
        Gp = G - T @ np.diag((T * G).sum(axis=0))
        s = math.sqrt(np.trace(Gp.T @ Gp))
        if s < eps:
            break
        al *= 2
        for _ in range(11):
            X = T - al * Gp
            v = 1 / np.sqrt((X**2).sum(axis=0))
            Tt = X @ np.diag(v)
            L = A @ np.linalg.inv(Tt).T
            Gqt, ft = _oblimin_vgq(L, gamma)
            if f - ft > 0.5 * s**2 * al:
                break
            al /= 2
        T, f = Tt, ft
        G = -(L.T @ Gqt @ np.linalg.inv(Tt)).T
    Phi = T.T @ T
    return L, Phi


def tidy(L: np.ndarray, Phi: np.ndarray | None) -> tuple[np.ndarray, np.ndarray]:
    """Order factors by variance explained and make each column's loadings sum positive."""
    m = L.shape[1]
    Phi = np.eye(m) if Phi is None else Phi
    ss = (L**2).sum(axis=0)
    order = np.argsort(-ss, kind="stable")
    L, Phi = L[:, order], Phi[np.ix_(order, order)]
    sign = np.where(L.sum(axis=0) < 0, -1.0, 1.0)
    return L * sign, Phi * np.outer(sign, sign)


def efa(R: np.ndarray, m: int, rotation: str = "oblimin") -> dict:
    L0, iters = paf(R, m)
    if rotation == "varimax":
        L, Phi = varimax(L0), None
    elif rotation == "oblimin":
        L, Phi = oblimin(L0)
    else:
        L, Phi = L0, None
    L, Phi = tidy(L, Phi)
    h2 = (L0**2).sum(axis=1)
    implied = L @ Phi @ L.T
    resid = R - implied
    np.fill_diagonal(resid, 0)
    p = R.shape[0]
    rmsr = math.sqrt((resid**2).sum() / (p * (p - 1)))
    return {"loadings": L, "phi": Phi, "communalities": h2, "rmsr": rmsr, "iterations": iters}
