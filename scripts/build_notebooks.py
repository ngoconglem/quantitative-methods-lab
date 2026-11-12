"""Generate and execute the reproduction notebooks in notebooks/.

Run from the repository root:  python scripts/build_notebooks.py
"""
from pathlib import Path

import nbformat as nbf
from nbconvert.preprocessors import ExecutePreprocessor

ROOT = Path(__file__).resolve().parent.parent
NB = ROOT / "notebooks"
NB.mkdir(exist_ok=True)

SETUP = '''import json, sys
from pathlib import Path
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

sys.path.insert(0, "../analysis")
import psychometrics as ps

DATA = Path("../web/public/data")
pd.set_option("display.precision", 3)
plt.rcParams.update({"figure.dpi": 110, "axes.spines.top": False, "axes.spines.right": False})

def load(name):
    df = pd.read_csv(DATA / f"{name}.csv")
    meta = json.loads((DATA / f"{name}.json").read_text())
    return df, meta
'''

NOTEBOOKS = {
    "01_items_and_reliability.ipynb": [
        ("md", "# Items and reliability\n\nReproduces steps 2–3 of the measurement module (Module 6) of the Quantitative Methods Lab for the simulated *Academic Writing with AI* questionnaire, before and after fixing the reverse-worded item."),
        ("code", SETUP),
        ("code", """df, meta = load("writing_ai_simulated")
print(meta["name"], "| n =", len(df), "| complete cases:", len(df.dropna()))
desc = df.agg(["mean", "std", "skew"]).T
desc["missing_%"] = 100 * df.isna().mean()
desc"""),
        ("code", """subscales = {}
for it in meta["items"]:
    subscales.setdefault(it["subscale"], []).append(df.columns.get_loc(it["id"]))

def reliability(X_all, reverse_cols=()):
    rows = []
    X_all = ps.reverse(X_all, list(reverse_cols), *meta["scale"])
    for name, cols in subscales.items():
        X = ps.listwise(X_all[:, cols])
        a = ps.cronbach_alpha(X)
        lo, hi = ps.alpha_ci(a, len(X), len(cols))
        rows.append({"subscale": name, "n": len(X), "alpha": a, "ci_low": lo, "ci_high": hi, "omega": ps.omega_total(ps.corr(X))})
    return pd.DataFrame(rows)

X = df.to_numpy(float)
print("As supplied (CE4 not reverse-scored):")
display(reliability(X))
print("After reverse-scoring CE4:")
display(reliability(X, [df.columns.get_loc("CE4")]))"""),
        ("code", """cols = subscales["Critical evaluation of AI output"]
Xc = ps.listwise(X[:, cols])
pd.DataFrame(ps.item_stats(Xc), index=df.columns[cols]).rename(columns={"citc": "corrected item-total r", "alphaIfDeleted": "alpha if deleted"})"""),
    ],
    "02_factorability_and_parallel_analysis.ipynb": [
        ("md", "# Factorability and parallel analysis\n\nKMO, Bartlett's test and Horn's parallel analysis (same seed and random-number generator as the browser) for both sample datasets."),
        ("code", SETUP),
        ("code", """results = {}
for name, rev in [("writing_ai_simulated", ["CE4"]), ("bfi", ["A1", "C4", "C5", "E1", "E2", "O2", "O5"])]:
    df, meta = load(name)
    X = ps.reverse(ps.listwise(df.to_numpy(float)), [df.columns.get_loc(c) for c in rev], *meta["scale"])
    R = ps.corr(X)
    k, per_item = ps.kmo(R)
    chi2, dof, p = ps.bartlett(R, len(X))
    eig = np.sort(np.linalg.eigvalsh(R))[::-1]
    iters = 50 if len(X) * X.shape[1] > 40000 else 100
    pa = ps.parallel_analysis(len(X), X.shape[1], iters, 2026, 95)
    n_factors = int(np.argmax(eig <= pa)) if (eig <= pa).any() else len(eig)
    results[name] = dict(n=len(X), kmo=k, bartlett_chi2=chi2, df=dof, p=p, suggested_factors=n_factors)
    plt.figure(figsize=(6, 3))
    plt.plot(range(1, 16), eig[:15], "o-", color="#2a78d6", label="Observed")
    plt.plot(range(1, 16), pa[:15], "o--", color="#eb6834", ms=4, label="Random data, 95th percentile")
    plt.title(meta["name"]); plt.xlabel("Factor"); plt.ylabel("Eigenvalue"); plt.legend(); plt.tight_layout()
pd.DataFrame(results).T"""),
    ],
    "03_efa_and_report.ipynb": [
        ("md", "# Exploratory factor analysis\n\nPrincipal axis factoring with oblimin rotation, as in step 4, plus the cross-check against the independent `factor_analyzer` package."),
        ("code", SETUP),
        ("code", """df, meta = load("writing_ai_simulated")
X = ps.reverse(ps.listwise(df.to_numpy(float)), [df.columns.get_loc("CE4")], *meta["scale"])
res = ps.efa(ps.corr(X), 3, "oblimin")
L = pd.DataFrame(res["loadings"], index=df.columns, columns=["F1", "F2", "F3"])
L["h2"] = res["communalities"]
print("RMSR:", round(res["rmsr"], 3))
L.style.format("{:.2f}").map(lambda v: "font-weight: bold" if abs(v) >= .40 else "", subset=["F1", "F2", "F3"])"""),
        ("code", """pd.DataFrame(res["phi"], index=["F1", "F2", "F3"], columns=["F1", "F2", "F3"]).round(2)"""),
        ("code", """from factor_analyzer import FactorAnalyzer
fa = FactorAnalyzer(n_factors=3, rotation="oblimin", method="minres").fit(X)
ours, theirs = res["loadings"], fa.loadings_
C = (ours.T @ theirs) / np.sqrt(np.outer((ours**2).sum(0), (theirs**2).sum(0)))
print("Tucker congruence with factor_analyzer (minres), per factor:", np.round(np.abs(C).max(axis=1), 4))"""),
    ],
}


def build():
    ep = ExecutePreprocessor(timeout=600, kernel_name="python3")
    for name, cells in NOTEBOOKS.items():
        nb = nbf.v4.new_notebook()
        nb.cells = [nbf.v4.new_markdown_cell(c) if k == "md" else nbf.v4.new_code_cell(c) for k, c in cells]
        nb.metadata["kernelspec"] = {"name": "python3", "display_name": "Python 3", "language": "python"}
        ep.preprocess(nb, {"metadata": {"path": str(NB)}})
        nbf.write(nb, NB / name)
        print("built", name)


if __name__ == "__main__":
    build()
