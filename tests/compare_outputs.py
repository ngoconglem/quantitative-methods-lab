"""Check that the browser (TypeScript) and Python implementations give the same numbers.

Run from the repository root:  python -I tests/compare_outputs.py   (needs Node and `npm install` in web/)
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "analysis"))
import psychometrics as ps  # noqa: E402

DATA = ROOT / "web/public/data"
bundle, out = ROOT / "tests/js_dump.mjs", ROOT / "tests/js_out.json"
subprocess.run(["npx", "esbuild", str(ROOT / "tests/js_dump.ts"), "--bundle", "--platform=node", "--format=esm", f"--outfile={bundle}"],
               cwd=ROOT / "web", check=True, capture_output=True)
subprocess.run(["node", str(bundle), str(DATA), str(out)], check=True)
js = json.loads(out.read_text())

fails, checks = 0, 0


def close(label, a, b, tol=1e-8):
    global fails, checks
    checks += 1
    d = float(np.max(np.abs(np.asarray(a, float) - np.asarray(b, float))))
    if d > tol:
        fails += 1
        print(f"MISMATCH {label}: max diff {d:.2e}")


for name, m, rev, lo, hi in [("writing_ai_simulated", 3, [8], 1, 5), ("bfi", 5, [0, 8, 9, 10, 11, 21, 24], 1, 6)]:
    j = js[name]
    X = ps.reverse(ps.listwise(pd.read_csv(DATA / f"{name}.csv").to_numpy(float)), rev, lo, hi)
    R = ps.corr(X)
    sub = X[:, :5]
    a = ps.cronbach_alpha(sub)
    close(f"{name} n", len(X), j["n"])
    close(f"{name} R", R, j["R"])
    close(f"{name} alpha", a, j["alpha"])
    close(f"{name} alpha CI", ps.alpha_ci(a, len(X), 5), j["ci"], 1e-6)
    close(f"{name} CITC", [s["citc"] for s in ps.item_stats(sub)], [s["citc"] for s in j["items"]])
    close(f"{name} alpha-if-deleted", [s["alphaIfDeleted"] for s in ps.item_stats(sub)], [s["alphaIfDeleted"] for s in j["items"]])
    close(f"{name} omega", ps.omega_total(ps.corr(sub)), j["omega"], 1e-6)
    k, per = ps.kmo(R)
    close(f"{name} KMO", k, j["kmo"]["overall"])
    close(f"{name} KMO items", per, j["kmo"]["perItem"])
    chi, df, p = ps.bartlett(R, len(X))
    close(f"{name} Bartlett chi2", chi, j["bartlett"]["chi2"], 1e-6)
    close(f"{name} Bartlett p", p, j["bartlett"]["p"], 1e-10)
    close(f"{name} eigenvalues", np.sort(np.linalg.eigvalsh(R))[::-1], j["eig"])
    close(f"{name} parallel analysis", ps.parallel_analysis(len(X), R.shape[0], 20, 2026, 95), j["pa"], 1e-8)
    for rot in ["oblimin", "varimax"]:
        r = ps.efa(R, m, rot)
        close(f"{name} {rot} loadings", r["loadings"], j[rot]["loadings"], 1e-5)
        close(f"{name} {rot} phi", r["phi"], j[rot]["phi"], 1e-5)
        close(f"{name} {rot} communalities", r["communalities"], j[rot]["communalities"], 1e-6)
        close(f"{name} {rot} RMSR", r["rmsr"], j[rot]["rmsr"], 1e-6)

out.unlink()
bundle.unlink()
print(f"{checks} comparisons across 2 datasets.")
print("ALL MATCH" if not fails else f"{fails} MISMATCHES")
sys.exit(1 if fails else 0)
