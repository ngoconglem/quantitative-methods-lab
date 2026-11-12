// Browser code for the Advanced and Scale development pages; bundled and run by tests/check_advanced.py.
import { readFileSync } from "node:fs";
import * as A from "../web/src/lib/anova";
import { fitCfa } from "../web/src/lib/cfa";

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
console.log(JSON.stringify(out));
