"""Check one-way ANOVA, Welch ANOVA, Kruskal-Wallis, Holm-adjusted pairwise tests and CFA
against SciPy, pingouin and semopy.   python tests/check_advanced.py
"""
import json, subprocess, warnings
from pathlib import Path
import numpy as np, pandas as pd
from scipy import stats
import pingouin as pg
import semopy
from statsmodels.stats.multitest import multipletests

warnings.filterwarnings("ignore")
ROOT = Path(__file__).resolve().parents[1]
checks, bad = 0, []

def close(name, js, py, rel=1e-6, abs_=1e-8):
    global checks
    checks += 1
    if not abs(float(js) - float(py)) <= abs_ + rel * abs(float(py)):
        bad.append(f"{name}: browser {js!r} vs reference {py!r}")

out = ROOT / "tests" / "_adv.cjs"
subprocess.run(["npx", "esbuild", str(ROOT / "tests" / "advanced_battery.ts"), "--bundle", "--platform=node", f"--outfile={out}", "--log-level=error"], cwd=ROOT / "web", check=True)
js = json.loads(subprocess.run(["node", str(out)], cwd=ROOT, check=True, capture_output=True, text=True).stdout)
out.unlink()

ell = pd.DataFrame(json.load(open(ROOT / "web/public/data/ellipse.json"))["columns"])
ic = pd.DataFrame(json.load(open(ROOT / "web/public/data/intercultural.json"))["columns"])
items = [c for c in ic.columns if len(c) == 3 and c[:2] in ("KN", "AT", "SK", "AW") and c[2].isdigit()]
X = ic[items].copy(); X["AT2"] = 6 - X["AT2"]
ic["icc"] = X.mean(1)

def check_anova(name, df, dv, g, levels):
    samples = [df.loc[df[g] == l, dv].to_numpy(float) for l in levels]
    F, p = stats.f_oneway(*samples)
    r = js[name]
    close(f"{name} F", r["F"], F); close(f"{name} p", r["p"], p, rel=1e-5, abs_=1e-12)
    aov = pg.anova(data=df, dv=dv, between=g, detailed=True)
    close(f"{name} eta2", r["eta2"], aov["SS"][0] / aov["SS"].sum())
    w = pg.welch_anova(data=df, dv=dv, between=g)
    close(f"{name} welch F", r["welchF"], w["F"][0]); close(f"{name} welch df2", r["welchDf2"], w["ddof2"][0])
    close(f"{name} welch p", r["welchP"], w["p_unc"][0] if "p_unc" in w else w["p-unc"][0], rel=1e-5, abs_=1e-12)
    ssb = aov["SS"][0]; sst = aov["SS"].sum(); msw = aov["MS"][1]
    close(f"{name} omega2", r["omega2"], (ssb - (len(levels) - 1) * msw) / (sst + msw))
    return samples

s = check_anova("anova_grade", ell, "overall", "grade", [8, 9, 10, 11, 12])
H, p = stats.kruskal(*s); close("kw_grade H", js["kw_grade"]["H"], H); close("kw_grade p", js["kw_grade"]["p"], p, rel=1e-5, abs_=1e-12)
s = check_anova("anova_icc", ic, "icc", "abroad", ["None", "Short", "Long"])
H, p = stats.kruskal(*s); close("kw_icc H", js["kw_icc"]["H"], H); close("kw_icc p", js["kw_icc"]["p"], p, rel=1e-5, abs_=1e-12)
H, p = stats.kruskal(*[ic.loc[ic.abroad == l, "contact_hours"] for l in ["None", "Short", "Long"]]); close("kw_contact H", js["kw_contact"]["H"], H)
lv = ["None", "Short", "Long"]
ps = []
for i in range(3):
    for j in range(i + 1, 3):
        ps.append(stats.ttest_ind(s[j], s[i], equal_var=False).pvalue)
holm = multipletests(ps, method="holm")[1]
for k, row in enumerate(js["pairs_icc"]):
    close(f"pair {k} p", row["p"], ps[k], rel=1e-5, abs_=1e-12); close(f"pair {k} holm", row["pHolm"], holm[k], rel=1e-5, abs_=1e-12)

use = [c for c in items if c != "AT5"]
B = X.loc[ic.half == "B", use]
desc = "\n".join(f"{f} =~ " + " + ".join(c for c in use if c.startswith(f)) for f in ["KN", "AT", "SK", "AW"])
m = semopy.Model(desc); m.fit(B, obj="MLW")
st = semopy.calc_stats(m).T["Value"]
c = js["cfa"]
print(f"semopy chi2 {st['chi2']:.4f} vs browser {c['chi2']:.4f}; DoF {st['DoF']} vs {c['df']}")
close("cfa df", c["df"], st["DoF"])
close("cfa chi2", c["chi2"], st["chi2"], rel=2e-3)
close("cfa CFI", c["cfi"], st["CFI"], rel=2e-3)
close("cfa TLI", c["tli"], st["TLI"], rel=2e-3)
close("cfa RMSEA", c["rmsea"], st["RMSEA"], rel=5e-3)
std = m.inspect(std_est=True)
lo = std[std.op == "~"]
for k, item in enumerate(use):
    ref = lo.loc[lo.lval == item, "Est. Std"].iloc[0]
    close(f"cfa std loading {item}", abs(c["std"][k]), abs(ref), rel=2e-3)
print(f"{checks} comparisons:", "ALL MATCH" if not bad else "MISMATCH")
for b in bad: print("  ", b)
