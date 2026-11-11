// Bundled with esbuild and run in Node: dumps the browser implementation's outputs for comparison.
import { readFileSync, writeFileSync } from "node:fs";
import * as S from "../web/src/lib/stats";

function readCsv(path: string) {
  const [head, ...rows] = readFileSync(path, "utf8").trim().split(/\r?\n/);
  const cols = head.split(",");
  const X = rows.map((r) => r.split(",").map((v) => (v === "" ? null : Number(v))));
  return { cols, X };
}
const out: Record<string, unknown> = {};
for (const [name, m, rev, lo, hi] of [["writing_ai_simulated", 3, [8], 1, 5], ["bfi", 5, [0, 8, 9, 10, 11, 21, 24], 1, 6]] as const) {
  const { X } = readCsv(`${process.argv[2]}/${name}.csv`);
  const D = S.reverseCols(S.listwise(X), [...rev], lo, hi);
  const R = S.corr(D);
  const sub = S.selectCols(D, [0, 1, 2, 3, 4]);
  const a = S.cronbachAlpha(sub);
  out[name] = {
    n: D.length,
    R,
    alpha: a,
    ci: S.alphaCI(a, D.length, 5),
    items: S.itemStats(sub),
    omega: S.omegaTotal(S.corr(sub)),
    kmo: S.kmo(R),
    bartlett: S.bartlett(R, D.length),
    eig: S.eigSym(R).values,
    pa: S.parallelAnalysis(D.length, R.length, 20, 2026, 95),
    oblimin: S.efa(R, m, "oblimin"),
    varimax: S.efa(R, m, "varimax"),
  };
}
writeFileSync(process.argv[3], JSON.stringify(out));
