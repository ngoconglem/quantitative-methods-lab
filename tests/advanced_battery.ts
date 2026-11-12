// Browser code for the Advanced and Scale development pages; bundled and run by tests/check_advanced.py.
import { readFileSync } from "node:fs";
import * as A from "../web/src/lib/anova";
import { fitCfa } from "../web/src/lib/cfa";
import { fitSem, indirect } from "../web/src/lib/sem";
import { semData, semSpec } from "../web/src/pages/m/Sem";
import { normalPosterior } from "../web/src/lib/bayes";

const load = (n: string) => JSON.parse(readFileSync(`web/public/data/${n}.json`, "utf8")).columns;
const ell = load("ellipse");
const ic = load("intercultural");
const out: Record<string, unknown> = {};

const byGroup = (vals: number[], g: (string | number)[], levels: (string | number)[]) => levels.map((l) => vals.filter((_, i) => g[i] === l));
const grades = [8, 9, 10, 11, 12];
const gOverall = byGroup(ell.overall, ell.grade, grades);
out.anova_grade = A.oneWay(gOverall, grades.map(String));
out.kw_grade = A.kruskal(gOverall);
const lv = ["None", "Short", "Long"];
const items = Object.keys(ic).filter((k) => /^(KN|AT|SK|AW)\d$/.test(k));
const icc = ic.id.map((_: number, i: number) => items.reduce((s, k) => s + (k === "AT2" ? 6 - ic[k][i] : ic[k][i]), 0) / items.length);
const gIcc = byGroup(icc, ic.abroad, lv);
out.anova_icc = A.oneWay(gIcc, lv);
out.kw_icc = A.kruskal(gIcc);
out.pairs_icc = A.pairwise(gIcc, lv);
out.kw_contact = A.kruskal(byGroup(ic.contact_hours, ic.abroad, lv));

const model = ["KN", "AT", "SK", "AW"];
const use = items.filter((k) => k !== "AT5");
const rowsB = ic.id.map((_: number, i: number) => i).filter((i: number) => ic.half[i] === "B");
const data = rowsB.map((i: number) => use.map((k) => (k === "AT2" ? 6 - ic[k][i] : ic[k][i])));
out.cfa = fitCfa(data, { factors: model, items: use, itemFactor: use.map((k) => model.indexOf(k.slice(0, 2))) });
const icFull = { columns: ic, n: ic.id.length, title: "", source: "" };
const spec = semSpec(true);
const semFit = fitSem(semData(icFull as never), spec);
out.sem = { est: semFit.est, se: semFit.se, std: semFit.std, chi2: semFit.chi2, df: semFit.df, cfi: semFit.cfi, tli: semFit.tli, rmsea: semFit.rmsea, labels: spec.params.map((p) => p.label), converged: semFit.converged };
out.sem_ind = indirect(semFit, spec.params.findIndex((p) => p.label.startsWith("a:")), spec.params.findIndex((p) => p.label.startsWith("b:")));
out.bayes = [[0, 0.5, 0.42, 0.11], [0.5, 0.2, 0.05, 0.03], [0, 10, -0.1, 0.08]].map(([m, s, e, se]) => normalPosterior(m, s, e, se));
console.log(JSON.stringify(out));
