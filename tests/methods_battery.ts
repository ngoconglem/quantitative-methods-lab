// Runs the analyses used in the methods modules with the browser code and prints JSON.
// Bundled and run by tests/check_methods.py.
import { readFileSync } from "node:fs";
import * as M from "../web/src/lib/methods";

const load = (n: string) => JSON.parse(readFileSync(`web/public/data/${n}.json`, "utf8")).columns;
const eng = load("english");
const dat = load("dative");
const ell = load("ellipse");
const idx = (n: number) => Array.from({ length: n }, (_, i) => i);
const pick = (col: (number | string)[], rows: number[]) => rows.map((i) => col[i] as number);

const out: Record<string, unknown> = {};
const all = idx(eng.rt_ms.length);
out.describe_rt = M.describe(eng.rt_ms);
out.describe_logrt = M.describe(eng.log_rt);
out.describe_words = M.describe(ell.words);

out.r_freq_rt = M.pearson(eng.log_freq, eng.log_rt);
out.r_fam_rt = M.pearson(eng.familiarity, eng.log_rt);
out.r_mtld_overall = M.pearson(ell.mtld, ell.overall);
out.r_vocab_grammar = M.pearson(ell.vocabulary, ell.grammar);
out.rho_freq_rt = M.spearman(eng.log_freq, eng.log_rt);
out.rho_vocab_grammar = M.spearman(ell.vocabulary, ell.grammar);

const young = all.filter((i) => eng.age[i] === "young");
out.welch_noun_verb = M.welch(
  pick(eng.rt_ms, young.filter((i) => eng.category[i] === "noun")),
  pick(eng.rt_ms, young.filter((i) => eng.category[i] === "verb")),
);
const eAll = idx(ell.grade.length);
out.welch_grade = M.welch(pick(ell.vocabulary, eAll.filter((i) => ell.grade[i] === 12)), pick(ell.vocabulary, eAll.filter((i) => ell.grade[i] === 8)));
const dAll = idx(dat.realization.length);
const logTheme = dat.len_theme.map((v: number) => Math.log(v));
out.welch_theme = M.welch(pick(logTheme, dAll.filter((i) => dat.realization[i] === "NP")), pick(logTheme, dAll.filter((i) => dat.realization[i] === "PP")));

const key = (i: number) => `${eng.word[i]}|${eng.category[i]}`;
const oldBy = new Map(all.filter((i) => eng.age[i] === "old").map((i) => [key(i), i]));
const pairs = young.filter((i) => oldBy.has(key(i)));
out.paired_age = M.paired(pairs.map((i) => eng.rt_ms[oldBy.get(key(i))!]), pairs.map((i) => eng.rt_ms[i]));

const old = eng.age.map((a: string) => (a === "old" ? 1 : 0));
const strip = (o: M.Ols) => ({ ...o, fitted: undefined, resid: undefined });
out.ols_rt = strip(M.ols([eng.log_freq, eng.familiarity, eng.length, old], ["log_freq", "familiarity", "length", "old"], eng.log_rt));
out.ols_rt_freq = strip(M.ols([eng.log_freq], ["log_freq"], eng.log_rt));
out.ols_ellipse = strip(M.ols([ell.mtld, ell.words.map((v: number) => Math.log(v)), ell.grade], ["mtld", "log_words", "grade"], ell.overall));

const tab = (rowVar: string[], rowLevels: string[]) =>
  rowLevels.map((lv) => ["NP", "PP"].map((r) => dAll.filter((i) => rowVar[i] === lv && dat.realization[i] === r).length));
out.chi_animacy = M.chiSquare(tab(dat.animacy, ["animate", "inanimate"]));
out.chi_pronominal = M.chiSquare(tab(dat.pronominal, ["nonpronominal", "pronominal"]));
out.chi_access = M.chiSquare(tab(dat.accessibility, ["accessible", "given", "new"]));
out.or_animacy = M.oddsRatio(tab(dat.animacy, ["animate", "inanimate"]));

const y = dat.realization.map((r: string) => (r === "PP" ? 1 : 0));
const lg = M.logistic(
  [
    dat.animacy.map((a: string) => (a === "inanimate" ? 1 : 0)),
    dat.pronominal.map((a: string) => (a === "pronominal" ? 1 : 0)),
    dat.definite.map((a: string) => (a === "definite" ? 1 : 0)),
    dAll.map((i) => Math.log(dat.len_recipient[i]) - Math.log(dat.len_theme[i])),
    dat.modality.map((a: string) => (a === "written" ? 1 : 0)),
  ],
  ["inanimate", "pronominal", "definite", "length_diff", "written"],
  y,
);
out.logit = { ...lg, predict: undefined };
console.log(JSON.stringify(out));
