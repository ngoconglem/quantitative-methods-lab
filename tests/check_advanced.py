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
# ---- SEM vs semopy
d = ic.copy(); d["AT2"] = 6 - d["AT2"]
for k, rng in {"KN": range(1, 6), "AT": range(1, 5), "SK": range(1, 6), "AW": range(1, 6)}.items():
    d[k] = d[[f"{k}{i}" for i in rng]].mean(axis=1)
d["contact"] = np.log1p(d.contact_hours); d["prof"] = d.proficiency / 10
sm = semopy.Model("""ICC =~ KN + AT + SK + AW
ICC ~ contact + prof
wtc ~ ICC + contact + prof""")
sm.fit(d[["contact", "prof", "KN", "AT", "SK", "AW", "wtc"]], obj="MLW")
st = semopy.calc_stats(sm).T["Value"]
s_js = js["sem"]
print(f"SEM: semopy chi2 {st['chi2']:.4f} df {st['DoF']} vs browser {s_js['chi2']:.4f} df {s_js['df']}; converged {s_js['converged']}")
close("sem chi2", s_js["chi2"], st["chi2"], rel=2e-3)
# semopy counts the exogenous variances and covariance as fixed moments (df = ours + 3); lavaan's fixed.x default
# gives our df. chi2 is identical under both conventions, so df, CFI and RMSEA are checked against an independent
# Python implementation of the same RAM model below instead.
ins = sm.inspect(std_est=True)
def ref(lval, rval, col="Estimate"):
    r = ins[(ins.lval == lval) & (ins.rval == rval) & (ins.op == "~")]
    return float(r[col].iloc[0])
pairs = {"Proficiency → ICC": ("ICC", "prof"), "ICC → Attitudes": ("AT", "ICC"), "ICC → Skills": ("SK", "ICC"), "ICC → Awareness": ("AW", "ICC"), "a: Contact → ICC": ("ICC", "contact"),
         "b: ICC → WTC": ("wtc", "ICC"), "c′: Contact → WTC": ("wtc", "contact"), "Proficiency → WTC": ("wtc", "prof")}
for k, lab in enumerate(s_js["labels"]):
    if lab in pairs:
        lv, rv = pairs[lab]
        close(f"sem est {lab}", s_js["est"][k], ref(lv, rv), rel=3e-3, abs_=1e-4)
        close(f"sem std {lab}", s_js["std"][k], ref(lv, rv, "Est. Std"), rel=3e-3, abs_=1e-4)

# ---- independent Python RAM implementation (scipy) for SEs, df and fit indices
from scipy.optimize import minimize
X = d[["contact", "prof", "KN", "AT", "SK", "AW", "wtc"]].to_numpy(float)
N, p = X.shape
Sm = np.cov(X, rowvar=False, bias=True)
m_ = 8
labels = s_js["labels"]
idx = {"contact": 0, "prof": 1, "KN": 2, "AT": 3, "SK": 4, "AW": 5, "wtc": 6, "ICC": 7}
spec = []
for lab in labels:
    if lab in pairs: spec.append(("A", idx[pairs[lab][0]], idx[pairs[lab][1]]))
    elif lab.startswith("var("): v = {"Contact": 0, "Proficiency": 1}[lab[4:-1]]; spec.append(("S", v, v))
    elif lab.startswith("cov("): spec.append(("S", 0, 1))
    elif lab == "ICC disturbance": spec.append(("S", 7, 7))
    elif lab == "WTC residual": spec.append(("S", 6, 6))
    else: v = idx[lab.split()[0]]; spec.append(("S", v, v))
def sigma(th):
    A = np.zeros((m_, m_)); S = np.zeros((m_, m_)); A[2, 7] = 1
    for (k, r, c), v in zip(spec, th):
        if k == "A": A[r, c] = v
        else: S[r, c] = S[c, r] = v
    B = np.linalg.inv(np.eye(m_) - A)
    return (B @ S @ B.T)[:p, :p]
def Fml(th):
    Sg = sigma(th)
    sign, ld = np.linalg.slogdet(Sg)
    if sign <= 0: return 1e10
    return ld + np.trace(Sm @ np.linalg.inv(Sg)) - np.linalg.slogdet(Sm)[1] - p
r = minimize(Fml, np.array(s_js["est"]) * 0.9 + 0.01, method="BFGS", options={"gtol": 1e-10, "maxiter": 10000})
th = r.x; q = len(th); h = 1e-4
H = np.zeros((q, q))
for i in range(q):
    for j in range(i, q):
        e = np.zeros(q); e[i] = h; f_ = np.zeros(q); f_[j] = h
        H[i, j] = H[j, i] = (Fml(th + e + f_) - Fml(th + e - f_) - Fml(th - e + f_) + Fml(th - e - f_)) / (4 * h * h)
se_py = np.sqrt(np.diag(np.linalg.inv(H)) * 2 / N)
chi2_py = N * Fml(th); df_py = p * (p + 1) // 2 - q
chi0 = N * (np.sum(np.log(np.diag(Sm))) - np.linalg.slogdet(Sm)[1]); df0 = p * (p - 1) // 2
cfi_py = 1 - max(chi2_py - df_py, 0) / max(chi0 - df0, chi2_py - df_py, 0)
rmsea_py = np.sqrt(max(0, (chi2_py - df_py) / (df_py * N)))
close("sem chi2 (python)", s_js["chi2"], chi2_py, rel=1e-4); close("sem df (python)", s_js["df"], df_py)
close("sem CFI (python)", s_js["cfi"], cfi_py, rel=1e-4); close("sem RMSEA (python)", s_js["rmsea"], rmsea_py, rel=1e-4)
for k in range(q):
    close(f"sem est (python) {labels[k]}", s_js["est"][k], th[k], rel=1e-3, abs_=1e-4)
    close(f"sem se (python) {labels[k]}", s_js["se"][k], se_py[k], rel=1e-2, abs_=1e-4)
ia, ib = labels.index("a: Contact → ICC"), labels.index("b: ICC → WTC")
Cov = np.linalg.inv(H) * 2 / N
ind_se = np.sqrt(th[ib] ** 2 * Cov[ia, ia] + th[ia] ** 2 * Cov[ib, ib] + 2 * th[ia] * th[ib] * Cov[ia, ib])
close("sem indirect", js["sem_ind"]["est"], th[ia] * th[ib], rel=1e-3); close("sem indirect se", js["sem_ind"]["se"], ind_se, rel=1e-2)

# ---- Bayesian normal-normal vs grid integration
grid = np.linspace(-15, 15, 600001)
for k, (m0, s0, e, se) in enumerate([[0, 0.5, 0.42, 0.11], [0.5, 0.2, 0.05, 0.03], [0, 10, -0.1, 0.08]]):
    prior = stats.norm.pdf(grid, m0, s0); lik = stats.norm.pdf(e, grid, se)
    post = prior * lik; post /= np.trapezoid(post, grid)
    pm = np.trapezoid(grid * post, grid); psd = np.sqrt(np.trapezoid((grid - pm) ** 2 * post, grid))
    ppos = stats.norm.sf(0, pm, psd)
    bf10 = stats.norm.pdf(0, m0, s0) / np.interp(0, grid, post)
    b = js["bayes"][k]
    close(f"bayes {k} mean", b["mean"], pm, rel=1e-5, abs_=1e-6); close(f"bayes {k} sd", b["sd"], psd, rel=1e-5)
    close(f"bayes {k} P>0", b["pPositive"], ppos, rel=1e-4, abs_=1e-6); close(f"bayes {k} BF10", b["bf10"], bf10, rel=1e-4)
print(f"{checks} comparisons:", "ALL MATCH" if not bad else "MISMATCH")
for b in bad: print("  ", b)
