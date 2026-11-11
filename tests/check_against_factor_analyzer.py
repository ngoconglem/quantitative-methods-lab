"""Cross-check analysis/psychometrics.py against the independent factor_analyzer package.

Run from the repository root:  python -I tests/check_against_factor_analyzer.py
"""
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from factor_analyzer import FactorAnalyzer, calculate_bartlett_sphericity, calculate_kmo

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "analysis"))
import psychometrics as ps  # noqa: E402

fails = 0
for name, m in [("bfi", 5), ("writing_ai_simulated", 3)]:
    X = ps.listwise(pd.read_csv(ROOT / "web/public/data" / f"{name}.csv").to_numpy(float))
    R = ps.corr(X)
    n = X.shape[0]
    k_ours, _ = ps.kmo(R)
    _, k_fa = calculate_kmo(pd.DataFrame(X))
    chi_ours, _, _ = ps.bartlett(R, n)
    chi_fa, _ = calculate_bartlett_sphericity(pd.DataFrame(X))
    for rot in ["varimax", "oblimin"]:
        ours = ps.efa(R, m, rot)["loadings"]
        fa = FactorAnalyzer(n_factors=m, rotation=rot, method="minres")
        fa.fit(X)
        theirs = fa.loadings_
        # match factors by maximum absolute congruence, allowing reflection
        C = (ours.T @ theirs) / np.sqrt(np.outer((ours**2).sum(0), (theirs**2).sum(0)))
        cong = np.abs(C).max(axis=1)
        diff = np.abs(np.abs(ours) - np.abs(theirs[:, np.abs(C).argmax(axis=1)])).max()
        ok = cong.min() > 0.99
        fails += not ok
        print(f"{name:22s} {rot:8s} min Tucker congruence {cong.min():.4f}, max |loading| diff {diff:.3f} {'OK' if ok else 'CHECK'}")
    print(f"{name:22s} KMO ours {k_ours:.4f} fa {k_fa:.4f} | Bartlett chi2 ours {chi_ours:.1f} fa {chi_fa:.1f}")
    fails += abs(k_ours - k_fa) > 1e-6 or abs(chi_ours - chi_fa) / chi_fa > 1e-6
print("ALL CONSISTENT" if not fails else f"{fails} PROBLEMS")
sys.exit(1 if fails else 0)
