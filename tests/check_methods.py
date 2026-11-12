"""Check every statistic in the methods modules against SciPy and statsmodels.

Run from the repository root:  python tests/check_methods.py
Needs Node with esbuild available (web/node_modules) to run the browser code.
"""
import json
import subprocess
from pathlib import Path

import numpy as np
import pandas as pd
import statsmodels.api as sm
from scipy import stats
from statsmodels.stats.contingency_tables import Table2x2
from statsmodels.stats.outliers_influence import variance_inflation_factor

ROOT = Path(__file__).resolve().parents[1]
checks = 0
bad = []


def close(name, js, py, rel=1e-6, abs_=1e-9):
    global checks
    checks += 1
    js, py = float(js), float(py)
    if not (abs(js - py) <= abs_ + rel * abs(py)):
        bad.append(f"{name}: browser {js!r} vs reference {py!r}")


def run_browser():
    out = ROOT / "tests" / "_battery.cjs"
    subprocess.run(
        ["npx", "esbuild", str(ROOT / "tests" / "methods_battery.ts"), "--bundle", "--platform=node", f"--outfile={out}", "--log-level=error"],
        cwd=ROOT / "web", check=True,
    )
    res = subprocess.run(["node", str(out)], cwd=ROOT, check=True, capture_output=True, text=True)
    out.unlink()
    return json.loads(res.stdout)


def load(name):
    cols = json.loads((ROOT / "web" / "public" / "data" / f"{name}.json").read_text())["columns"]
    return pd.DataFrame(cols)


def main():
    js = run_browser()
    eng, dat, ell = load("english"), load("dative"), load("ellipse")

    for key, x in [("describe_rt", eng.rt_ms), ("describe_logrt", eng.log_rt), ("describe_words", ell.words)]:
        d = js[key]
        close(f"{key}.mean", d["mean"], x.mean())
        close(f"{key}.sd", d["sd"], x.std(ddof=1))
        close(f"{key}.median", d["median"], x.median())
        close(f"{key}.q1", d["q1"], np.quantile(x, 0.25))
        close(f"{key}.q3", d["q3"], np.quantile(x, 0.75))
        close(f"{key}.skew", d["skew"], stats.skew(x, bias=False))

    for key, a, b in [("r_freq_rt", eng.log_freq, eng.log_rt), ("r_fam_rt", eng.familiarity, eng.log_rt),
                      ("r_mtld_overall", ell.mtld, ell.overall), ("r_vocab_grammar", ell.vocabulary, ell.grammar)]:
        res = stats.pearsonr(a, b)
        ci = res.confidence_interval(0.95)
        close(f"{key}.r", js[key]["r"], res.statistic)
        close(f"{key}.p", js[key]["p"], res.pvalue, rel=1e-4, abs_=1e-12)
        close(f"{key}.ci_lo", js[key]["ci"][0], ci.low, rel=1e-6)
        close(f"{key}.ci_hi", js[key]["ci"][1], ci.high, rel=1e-6)
    for key, a, b in [("rho_freq_rt", eng.log_freq, eng.log_rt), ("rho_vocab_grammar", ell.vocabulary, ell.grammar)]:
        res = stats.spearmanr(a, b)
        close(f"{key}.rho", js[key]["rho"], res.statistic)
        close(f"{key}.p", js[key]["p"], res.pvalue, rel=1e-4, abs_=1e-12)

    young = eng[eng.age == "young"]
    groups = {
        "welch_noun_verb": (young[young.category == "noun"].rt_ms, young[young.category == "verb"].rt_ms),
        "welch_grade": (ell[ell.grade == 12].vocabulary, ell[ell.grade == 8].vocabulary),
        "welch_theme": (np.log(dat[dat.realization == "NP"].len_theme), np.log(dat[dat.realization == "PP"].len_theme)),
    }
    for key, (a, b) in groups.items():
        res = stats.ttest_ind(a, b, equal_var=False)
        ci = res.confidence_interval(0.95)
        close(f"{key}.t", js[key]["t"], res.statistic)
        close(f"{key}.df", js[key]["df"], res.df)
        close(f"{key}.p", js[key]["p"], res.pvalue, rel=1e-4, abs_=1e-12)
        close(f"{key}.ci_lo", js[key]["ci"][0], ci.low, rel=1e-5)
        close(f"{key}.ci_hi", js[key]["ci"][1], ci.high, rel=1e-5)
        pooled = np.sqrt(((len(a) - 1) * a.var(ddof=1) + (len(b) - 1) * b.var(ddof=1)) / (len(a) + len(b) - 2))
        close(f"{key}.d", js[key]["d"], (a.mean() - b.mean()) / pooled)

    o = eng[eng.age == "old"].set_index(["word", "category"]).rt_ms
    yv = young.set_index(["word", "category"]).rt_ms
    common = yv.index.intersection(o.index)
    res = stats.ttest_rel(o.loc[common], yv.loc[common])
    ci = res.confidence_interval(0.95)
    close("paired.t", js["paired_age"]["t"], res.statistic)
    close("paired.p", js["paired_age"]["p"], res.pvalue, rel=1e-4, abs_=1e-300)
    close("paired.ci_lo", js["paired_age"]["ci"][0], ci.low, rel=1e-5)
    close("paired.n", js["paired_age"]["n"], len(common))

    def check_ols(key, X, y):
        Xc = sm.add_constant(X)
        fit = sm.OLS(y, Xc).fit()
        res = js[key]
        for i in range(Xc.shape[1]):
            close(f"{key}.coef{i}", res["coef"][i], fit.params.iloc[i])
            close(f"{key}.se{i}", res["se"][i], fit.bse.iloc[i])
            close(f"{key}.p{i}", res["p"][i], fit.pvalues.iloc[i], rel=1e-4, abs_=1e-12)
            close(f"{key}.ci{i}", res["ci"][i][0], fit.conf_int().iloc[i, 0], rel=1e-5)
        close(f"{key}.r2", res["r2"], fit.rsquared)
        close(f"{key}.adjr2", res["adjR2"], fit.rsquared_adj)
        close(f"{key}.f", res["f"], fit.fvalue)
        if X.shape[1] > 1:
            for j in range(X.shape[1]):
                close(f"{key}.vif{j}", res["vif"][j], variance_inflation_factor(Xc.values, j + 1))

    X = pd.DataFrame({"log_freq": eng.log_freq, "familiarity": eng.familiarity, "length": eng.length, "old": (eng.age == "old").astype(float)})
    check_ols("ols_rt", X, eng.log_rt)
    check_ols("ols_rt_freq", eng[["log_freq"]], eng.log_rt)
    check_ols("ols_ellipse", pd.DataFrame({"mtld": ell.mtld, "log_words": np.log(ell.words), "grade": ell.grade}), ell.overall)

    for key, var, levels in [("chi_animacy", "animacy", ["animate", "inanimate"]), ("chi_pronominal", "pronominal", ["nonpronominal", "pronominal"]),
                             ("chi_access", "accessibility", ["accessible", "given", "new"])]:
        table = pd.crosstab(dat[var], dat.realization).loc[levels, ["NP", "PP"]].values
        chi2, p, dof, exp = stats.chi2_contingency(table, correction=False)
        close(f"{key}.chi2", js[key]["chi2"], chi2)
        close(f"{key}.p", js[key]["p"], p, rel=1e-4, abs_=1e-300)
        close(f"{key}.v", js[key]["cramerV"], np.sqrt(chi2 / (table.sum() * (min(table.shape) - 1))))
    t2 = Table2x2(pd.crosstab(dat.animacy, dat.realization).loc[["animate", "inanimate"], ["NP", "PP"]].values)
    close("or.or", js["or_animacy"]["or"], t2.oddsratio)
    close("or.ci_lo", js["or_animacy"]["ci"][0], t2.oddsratio_confint()[0], rel=1e-6)

    Xl = pd.DataFrame({
        "inanimate": (dat.animacy == "inanimate").astype(float),
        "pronominal": (dat.pronominal == "pronominal").astype(float),
        "definite": (dat.definite == "definite").astype(float),
        "length_diff": np.log(dat.len_recipient) - np.log(dat.len_theme),
        "written": (dat.modality == "written").astype(float),
    })
    fit = sm.Logit((dat.realization == "PP").astype(float), sm.add_constant(Xl)).fit(disp=0)
    lg = js["logit"]
    for i in range(len(fit.params)):
        close(f"logit.coef{i}", lg["coef"][i], fit.params.iloc[i], rel=1e-6)
        close(f"logit.se{i}", lg["se"][i], fit.bse.iloc[i], rel=1e-6)
        close(f"logit.p{i}", lg["p"][i], fit.pvalues.iloc[i], rel=1e-4, abs_=1e-12)
    close("logit.ll", lg["ll"], fit.llf)
    close("logit.mcfadden", lg["mcfadden"], fit.prsquared)
    close("logit.aic", lg["aic"], fit.aic)

    print(f"{checks} comparisons with SciPy {stats.__name__ and __import__('scipy').__version__} and statsmodels {sm.__version__ if hasattr(sm, '__version__') else __import__('statsmodels').__version__}.")
    for b in bad:
        print("MISMATCH", b)
    print("ALL MATCH" if not bad else f"{len(bad)} MISMATCHES")


if __name__ == "__main__":
    main()
