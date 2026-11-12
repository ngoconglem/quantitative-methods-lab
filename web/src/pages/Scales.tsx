import { useMemo, useState } from "react";
import { ModuleLayout, Section, KeyIdea } from "../components/ModuleLayout";
import { CodeTabs, Quiz } from "../components/plots";
import { Guide, Term, Pop } from "../components/Guide";
import { useDataset, num, str, f, type Dataset } from "../lib/datasets";
import * as S from "../lib/stats";
import { fitCfa, type CfaFit } from "../lib/cfa";
import { REFS } from "../lib/cutoffs";

const DIMS = ["KN", "AT", "SK", "AW"] as const;
const DIM_NAME: Record<string, string> = { KN: "Knowledge", AT: "Attitudes", SK: "Skills of interaction", AW: "Critical cultural awareness" };
const DIM_COLOR: Record<string, string> = { KN: "#2a78d6", AT: "#2f8f6f", SK: "#b26b1f", AW: "#8a4fa3" };

function itemsOf(d: Dataset) {
  return Object.keys(d.columns).filter((k) => /^(KN|AT|SK|AW)\d$/.test(k));
}
function matrix(d: Dataset, items: string[], half: "A" | "B") {
  const h = str(d, "half");
  const rows: number[][] = [];
  for (let i = 0; i < h.length; i++) if (h[i] === half) rows.push(items.map((k) => (k === "AT2" ? 6 - num(d, k)[i] : num(d, k)[i])));
  return rows;
}

export default function Scales() {
  const { data, error } = useDataset("intercultural");
  const [dropAT5, setDropAT5] = useState(true);
  const [oneFactor, setOneFactor] = useState(false);

  const efa = useMemo(() => {
    if (!data) return null;
    const items = itemsOf(data);
    const X = matrix(data, items, "A");
    const R = S.corr(X);
    const eig = S.eigSym(R).values.slice().sort((a, b) => b - a);
    const pa = S.parallelAnalysis(X.length, items.length, 100, 2026, 95);
    const res = S.efa(R, 4, "oblimin");
    // order factors to match KN, AT, SK, AW by the dimension with the highest summed loading
    const order = DIMS.map((dim) => {
      let best = 0, bv = -1;
      for (let fi = 0; fi < 4; fi++) {
        const v = items.reduce((s, k, i) => s + (k.startsWith(dim) ? Math.abs(res.loadings[i][fi]) : 0), 0);
        if (v > bv) [best, bv] = [fi, v];
      }
      return best;
    });
    return { items, n: X.length, eig, pa, L: res.loadings.map((r) => order.map((o) => r[o])), h2: res.communalities };
  }, [data]);

  const cfa = useMemo(() => {
    if (!data) return null;
    const items = itemsOf(data).filter((k) => !(dropAT5 && k === "AT5"));
    const X = matrix(data, items, "B");
    const factors = oneFactor ? ["ICC"] : [...DIMS];
    const fit = fitCfa(X, { factors, items, itemFactor: items.map((k) => (oneFactor ? 0 : DIMS.indexOf(k.slice(0, 2) as (typeof DIMS)[number]))) });
    return { items, factors, fit };
  }, [data, dropAT5, oneFactor]);

  return (
    <ModuleLayout moduleKey="scales" cutoffs="cfa">
      <KeyIdea
        gist="A questionnaire score is only as good as the evidence that its items measure what you claim. The usual path: write items, check them, explore their structure, then confirm it in new data."
        points={[
          [<Term id="efa">Explore (EFA)</Term>, "Let the data show how many dimensions there are and which items belong together."],
          [<Term id="cfa">Confirm (CFA)</Term>, "Test the structure you expect, in a different sample, and see how well it fits."],
          ["Never both on the same people", "Exploring and confirming on the same data proves little: the model was shaped to fit it."],
        ]}
      />

      <div className="flow" aria-label="Scale development steps">
        {[
          ["1. Define", "the construct and its dimensions"],
          ["2. Write", "items for each dimension"],
          ["3. Screen", "items: missing, floor, ceiling"],
          ["4. Explore", "EFA on half the sample"],
          ["5. Confirm", "CFA on the other half"],
          ["6. Report", "fit, loadings, reliability"],
        ].map(([a, b], i, all) => (
          <span key={a} style={{ display: "contents" }}>
            <div className="flow-box">
              <strong>{a}</strong>
              <span>{b}</span>
            </div>
            {i < all.length - 1 && <span className="flow-arrow" aria-hidden="true" />}
          </span>
        ))}
      </div>

      <Section title="The example: an intercultural competence survey">
        <p>
          600 university language learners answered 20 statements on a 1–5 scale (strongly disagree to strongly agree). The items cover four
          dimensions modelled on Byram's{" "}
          <Pop label="(1997)" title="Byram (1997)">
            {REFS.byram1997.full}
          </Pop>{" "}
          model of intercultural communicative competence. <span className="sim-tag">Simulated data</span>
        </p>
        <div className="dim-row">
          {DIMS.map((d) => (
            <div key={d} className="dim-card" style={{ borderTopColor: DIM_COLOR[d] }}>
              <strong>{DIM_NAME[d]}</strong>
              <span>
                {d}1–{d}5
              </span>
            </div>
          ))}
        </div>
        {data?.meta?.items && (
          <details className="fold">
            <summary>See all 20 items</summary>
            <table className="mini">
              <tbody>
                {Object.entries(data.meta.items).map(([k, t]) => (
                  <tr key={k}>
                    <td>
                      <strong>{k}</strong>
                    </td>
                    <td>
                      {t}
                      {k === "AT2" && <span className="pill pill-no" style={{ marginLeft: 8 }}>negatively worded: reverse-scored</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        )}
        <p className="small muted">
          The sample is split at random into half A (n = 300) for exploring and half B (n = 300) for confirming.
        </p>
        {error && <p className="error">{error}</p>}
      </Section>

      {efa && (
        <Section title="Step 4: explore the structure (EFA, half A)">
          <h3>How many factors?</h3>
          <ScreeChart eig={efa.eig} pa={efa.pa} />
          <ParallelVerdict eig={efa.eig} pa={efa.pa} />
          <h3>Which items belong where?</h3>
          <Guide title="How to read the loading table">
            <p>
              Each cell is a <Term id="loading">loading</Term>: how strongly an item goes with a factor. Darker = stronger. Each item should load
              clearly (≥ .40) on one factor and weakly on the others.
            </p>
          </Guide>
          <LoadingTable items={efa.items} L={efa.L} />
          <div className="finding-row">
            <div className="finding">
              <strong>AT5 is weak.</strong> “I like trying food from other countries” barely relates to the other attitude items: liking food is not
              the same as openness to people.
            </div>
            <div className="finding">
              <strong>SK4 is shared.</strong> “Comparing practices without judging” loads {f(efa.L[efa.items.indexOf("SK4")][2], 2, true)} on
              skills but also {f(efa.L[efa.items.indexOf("SK4")][3], 2, true)} on critical awareness: it is the least clear skills item. Keep
              it, and consider rewording it in the next version.
            </div>
          </div>
        </Section>
      )}

      {cfa && (
        <Section title="Step 5: confirm it (CFA, half B)">
          <div className="controls">
            <label className="check">
              <input type="checkbox" checked={dropAT5} onChange={(e) => setDropAT5(e.target.checked)} /> Drop AT5 (the weak item)
            </label>
            <div className="chips" role="group" aria-label="Model">
              <button className="chip" aria-pressed={!oneFactor} onClick={() => setOneFactor(false)}>
                Four factors
              </button>
              <button className="chip" aria-pressed={oneFactor} onClick={() => setOneFactor(true)}>
                One general factor
              </button>
            </div>
          </div>
          <FitTable fit={cfa.fit} />
          {!oneFactor ? (
            <>
              <h3>The model, with standardised loadings</h3>
              <PathDiagram items={cfa.items} fit={cfa.fit} />
              <ReliabilityTable fit={cfa.fit} factors={cfa.factors} />
            </>
          ) : (
            <p className="verdict">
              One general factor fits far worse than four related factors: the four dimensions are distinct, not just one “intercultural
              competence” score. Report subscale scores, or test a second-order model.
            </p>
          )}
        </Section>
      )}

      <Section title="Check your understanding">
        <Quiz
          items={[
            {
              q: "You ran an EFA, dropped two items, then ran a CFA on the same 300 people. CFI = .98. What can you claim?",
              options: ["The structure is confirmed", "Very little: the model was shaped to fit these data", "The scale is valid"],
              answer: 1,
              why: "Confirmation needs data the model has not seen: a new sample, or a held-out half.",
            },
            {
              q: "A standardised loading of .30 means the factor explains about…",
              options: ["30% of the item's variance", "9% of the item's variance", "70% of the item's variance"],
              answer: 1,
              why: "Square the standardised loading: .30² = .09. Most of what the item measures is something else.",
            },
            {
              q: "In half B, one general factor gives CFI = .77 and RMSEA = .09; four factors give CFI = .99 and RMSEA = .02. What does this suggest?",
              options: ["Use one total score", "The four dimensions are distinct; report them separately", "Both models are fine"],
              answer: 1,
              why: "A much better fit for the four-factor model means the dimensions carry different information.",
            },
          ]}
        />
      </Section>

      <Section title="Reporting it">
        {cfa && !oneFactor && (
          <p className="report-box">
            A confirmatory factor analysis (maximum likelihood) of the four-factor model in the hold-out half (<em>n</em> = {cfa.fit.n}) showed{" "}
            {cfa.fit.cfi >= 0.95 && cfa.fit.rmsea <= 0.06 ? "good" : "acceptable"} fit, χ²({cfa.fit.df}) = {f(cfa.fit.chi2, 2)}, CFI ={" "}
            {f(cfa.fit.cfi, 3, true)}, TLI = {f(cfa.fit.tli, 3, true)}, RMSEA = {f(cfa.fit.rmsea, 3, true)} (90% CI [{f(cfa.fit.rmseaCi[0], 3, true)},{" "}
            {f(cfa.fit.rmseaCi[1], 3, true)}]), SRMR = {f(cfa.fit.srmr, 3, true)}. Standardised loadings ranged from {f(Math.min(...cfa.fit.std), 2, true)}{" "}
            to {f(Math.max(...cfa.fit.std), 2, true)}; composite reliability ranged from {f(Math.min(...cfa.fit.cr), 2, true)} to{" "}
            {f(Math.max(...cfa.fit.cr), 2, true)}.
          </p>
        )}
        <p className="small muted">
          With 1–5 ratings, many researchers prefer an estimator for ordinal data (WLSMV in lavaan). Maximum likelihood is used here so every
          number can be checked in the browser.
        </p>
      </Section>

      <Section title="Do it in R or Python" folded>
        <CodeTabs
          r={`library(lavaan); library(psych)
d <- read.csv("intercultural_simulated.csv")   # in the repository's data folder
d$AT2 <- 6 - d$AT2                              # reverse-score the negatively worded item
items <- grep("^(KN|AT|SK|AW)[0-9]$", names(d), value = TRUE)
A <- d[d$half == "A", items]; B <- d[d$half == "B", items]
fa.parallel(A, fa = "fa")                       # how many factors?
fa(A, nfactors = 4, fm = "pa", rotate = "oblimin")
model <- '
  KN =~ KN1 + KN2 + KN3 + KN4 + KN5
  AT =~ AT1 + AT2 + AT3 + AT4
  SK =~ SK1 + SK2 + SK3 + SK4 + SK5
  AW =~ AW1 + AW2 + AW3 + AW4 + AW5'
fit <- cfa(model, data = B, std.lv = TRUE)      # add estimator = "WLSMV", ordered = TRUE for ordinal data
summary(fit, fit.measures = TRUE, standardized = TRUE)
semTools::compRelSEM(fit)                       # composite reliability`}
          python={`import pandas as pd, semopy
from factor_analyzer import FactorAnalyzer
d = pd.read_csv("https://raw.githubusercontent.com/ngoconglem/quantitative-methods-lab/main/data/intercultural_simulated.csv")
d["AT2"] = 6 - d["AT2"]
items = [c for c in d.columns if c[:2] in ("KN", "AT", "SK", "AW") and c[2:].isdigit()]
A, B = d.loc[d.half == "A", items], d.loc[d.half == "B", items]
print(FactorAnalyzer(n_factors=4, rotation="oblimin", method="minres").fit(A).loadings_.round(2))
model = """KN =~ KN1 + KN2 + KN3 + KN4 + KN5
AT =~ AT1 + AT2 + AT3 + AT4
SK =~ SK1 + SK2 + SK3 + SK4 + SK5
AW =~ AW1 + AW2 + AW3 + AW4 + AW5"""
m = semopy.Model(model); m.fit(B[[c for c in items if c != "AT5"]], obj="MLW")
print(semopy.calc_stats(m).T); print(m.inspect(std_est=True))`}
        />
      </Section>

      <p className="small">
        Checking your own questionnaire? The <a href="#analyse">Questionnaire analyser</a> runs item screening, reliability and EFA on your CSV
        file in the browser.
      </p>
    </ModuleLayout>
  );
}

/* ------------------------------------------------------------------ charts */

function ScreeChart({ eig, pa }: { eig: number[]; pa: number[] }) {
  const k = Math.min(10, eig.length);
  const W = 560, H = 230, m = { l: 40, r: 14, t: 12, b: 36 };
  const top = Math.ceil(Math.max(eig[0], pa[0]));
  const sx = (i: number) => m.l + (i / (k - 1)) * (W - m.l - m.r);
  const sy = (v: number) => H - m.b - (v / top) * (H - m.t - m.b);
  const line = (vs: number[]) => vs.slice(0, k).map((v, i) => `${i ? "L" : "M"}${sx(i)},${sy(v)}`).join(" ");
  return (
    <figure className="chart-fig">
      <svg viewBox={`0 0 ${W} ${H}`} className="plot" role="img" aria-label="Scree plot with parallel analysis" style={{ maxWidth: 560 }}>
        {Array.from({ length: top + 1 }, (_, v) => (
          <g key={v}>
            <line x1={m.l} x2={W - m.r} y1={sy(v)} y2={sy(v)} stroke="#e4e9ec" />
            <text x={m.l - 6} y={sy(v) + 4} fontSize={11} textAnchor="end" fill="#6b7a87">{v}</text>
          </g>
        ))}
        {Array.from({ length: k }, (_, i) => (
          <text key={i} x={sx(i)} y={H - m.b + 16} fontSize={11} textAnchor="middle" fill="#6b7a87">{i + 1}</text>
        ))}
        <path d={line(pa)} fill="none" stroke="#eb6834" strokeWidth={2} strokeDasharray="5 4" />
        <path d={line(eig)} fill="none" stroke="#2a78d6" strokeWidth={2} />
        {eig.slice(0, k).map((v, i) => (
          <circle key={i} cx={sx(i)} cy={sy(v)} r={4.5} fill={v > pa[i] ? "#2a78d6" : "#fff"} stroke="#2a78d6" strokeWidth={2}>
            <title>{`Factor ${i + 1}: eigenvalue ${v.toFixed(2)}, random ${pa[i].toFixed(2)}`}</title>
          </circle>
        ))}
        <text x={(m.l + W - m.r) / 2} y={H - 4} fontSize={11} textAnchor="middle" fill="#475867">Factor number</text>
      </svg>
      <figcaption className="legend-row">
        <span><span className="swatch" style={{ background: "#2a78d6" }} /> Your data (filled = keep)</span>
        <span><span className="swatch dashed" style={{ borderColor: "#eb6834" }} /> Random data, 95th percentile</span>
      </figcaption>
    </figure>
  );
}

function ParallelVerdict({ eig, pa }: { eig: number[]; pa: number[] }) {
  let n = 0;
  while (n < eig.length && eig[n] > pa[n]) n++;
  return (
    <p className="verdict">
      {n} eigenvalues rise above the random-data line, so <Term id="parallel">parallel analysis</Term> suggests {n} factor{n === 1 ? "" : "s"}.{" "}
      {n === 4
        ? "That matches the four intended dimensions."
        : `The theory behind the survey says four, and the fourth eigenvalue (${eig[3].toFixed(2)}) falls just below the random line (${pa[3].toFixed(2)}). When the two disagree, compare the solutions: below, four factors give a clean pattern that matches the four dimensions, so four is kept, and the CFA tests it properly.`}
    </p>
  );
}

function LoadingTable({ items, L }: { items: string[]; L: number[][] }) {
  return (
    <div className="table-wrap">
      <table className="loading-table">
        <thead>
          <tr>
            <th>Item</th>
            {DIMS.map((d) => (
              <th key={d} className="num" style={{ color: DIM_COLOR[d] }}>
                {DIM_NAME[d].split(" ")[0]}
              </th>
            ))}
            <th>Note</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => {
            const row = L[i];
            const max = Math.max(...row.map(Math.abs));
            const salient = row.filter((v) => Math.abs(v) >= 0.3).length;
            const note = max < 0.4 ? "Weak" : salient > 1 ? "Cross-loads" : "";
            return (
              <tr key={it} className={note ? "flagged" : undefined}>
                <td>
                  <strong style={{ color: DIM_COLOR[it.slice(0, 2)] }}>{it}</strong>
                </td>
                {row.map((v, j) => {
                  const a = Math.min(1, Math.abs(v));
                  return (
                    <td key={j} className="num" style={{ background: `rgba(42,120,214,${(a * 0.5).toFixed(2)})`, fontWeight: a >= 0.4 ? 700 : 400 }}>
                      {f(v, 2, true)}
                    </td>
                  );
                })}
                <td>{note && <span className="pill pill-flag">{note}</span>}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function FitTable({ fit }: { fit: CfaFit }) {
  const rows: [string, string, boolean, string][] = [
    ["CFI", f(fit.cfi, 3, true), fit.cfi >= 0.95, "≥ .95: the model fits much better than a no-relationships model"],
    ["TLI", f(fit.tli, 3, true), fit.tli >= 0.95, "≥ .95: as CFI, with a penalty for complexity"],
    ["RMSEA", `${f(fit.rmsea, 3, true)} [${f(fit.rmseaCi[0], 3, true)}, ${f(fit.rmseaCi[1], 3, true)}]`, fit.rmsea <= 0.06, "≤ .06: average misfit per degree of freedom (90% CI)"],
    ["SRMR", f(fit.srmr, 3, true), fit.srmr <= 0.08, "≤ .08: average gap between observed and implied correlations"],
  ];
  return (
    <div className="table-wrap">
      <table className="fit-table">
        <thead>
          <tr>
            <th>Index</th>
            <th className="num">Value</th>
            <th>Meets guide?</th>
            <th>What it says</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([k, v, ok, why]) => (
            <tr key={k}>
              <td><strong>{k}</strong></td>
              <td className="num">{v}</td>
              <td><span className={`pill ${ok ? "pill-yes" : "pill-flag"}`}>{ok ? "Yes" : "No"}</span></td>
              <td className="small">{why}</td>
            </tr>
          ))}
          <tr>
            <td><strong>χ²</strong></td>
            <td className="num">{f(fit.chi2, 1)} (df {fit.df})</td>
            <td className="small muted">p {fit.p < 0.001 ? "< .001" : `= ${f(fit.p, 3, true)}`}</td>
            <td className="small">Exact-fit test; almost always significant with large samples, so read the indices above.</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function PathDiagram({ items, fit }: { items: string[]; fit: CfaFit }) {
  const W = 700, blockW = 340, blockH = 200;
  const pos = (fi: number) => ({ x: (fi % 2) * (blockW + 20), y: Math.floor(fi / 2) * (blockH + 10) });
  return (
    <figure className="chart-fig">
      <svg viewBox={`0 0 ${W} ${2 * blockH + 20}`} className="plot path-diagram" role="img" aria-label="CFA path diagram with standardised loadings">
        {DIMS.map((d, fi) => {
          const { x, y } = pos(fi);
          const its = items.map((it, i) => ({ it, i })).filter((o) => o.it.startsWith(d));
          const cx = x + 70, cy = y + blockH / 2;
          return (
            <g key={d}>
              {its.map((o, j) => {
                const by = y + 14 + j * 36;
                const v = fit.std[o.i];
                const weak = v < 0.5;
                return (
                  <g key={o.it}>
                    <line x1={cx + 58} y1={cy} x2={x + 228} y2={by + 13} stroke={weak ? "#eb6834" : "#8796a3"} strokeWidth={1 + 2.5 * v} />
                    <rect x={x + 230} y={by} width={64} height={26} rx={4} fill="#fff" stroke="#c9d3da" />
                    <text x={x + 262} y={by + 17} fontSize={12} textAnchor="middle" fill="#1c2b3a">{o.it}</text>
                    <text x={x + 302} y={by + 17} fontSize={12} fill={weak ? "#c2501f" : "#1c2b3a"} fontWeight={weak ? 700 : 400}>
                      {f(v, 2, true)}
                    </text>
                  </g>
                );
              })}
              <ellipse cx={cx} cy={cy} rx={60} ry={30} fill={DIM_COLOR[d]} fillOpacity={0.12} stroke={DIM_COLOR[d]} strokeWidth={2} />
              <text x={cx} y={cy - 2} fontSize={13} fontWeight={700} textAnchor="middle" fill={DIM_COLOR[d]}>
                {DIM_NAME[d].split(" ")[0]}
              </text>
              <text x={cx} y={cy + 14} fontSize={10} textAnchor="middle" fill="#475867">factor</text>
            </g>
          );
        })}
      </svg>
      <figcaption className="small muted">
        Ovals are the factors you cannot observe directly; boxes are the items people answered. Thicker arrows mean stronger loadings; orange
        marks loadings below .50.
      </figcaption>
    </figure>
  );
}

function ReliabilityTable({ fit, factors }: { fit: CfaFit; factors: string[] }) {
  return (
    <div className="two-col">
      <div className="table-wrap">
        <table className="mini">
          <thead>
            <tr>
              <th>Factor</th>
              <th className="num">CR</th>
              <th className="num">AVE</th>
            </tr>
          </thead>
          <tbody>
            {factors.map((fac, i) => (
              <tr key={fac}>
                <td style={{ color: DIM_COLOR[fac] }}><strong>{DIM_NAME[fac] ?? fac}</strong></td>
                <td className="num">{f(fit.cr[i], 2, true)}</td>
                <td className={`num ${fit.ave[i] < 0.5 ? "warn-cell" : ""}`}>{f(fit.ave[i], 2, true)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="small muted">CR = composite reliability (≥ .70). AVE = average variance extracted (≥ .50).</p>
        {fit.ave.some((v) => v < 0.5) && (
          <p className="small">
            <strong>AVE below .50</strong> means a factor explains less than half of its items' variance on average. That is common with
            single 1–5 items; reliability is still adequate here, but clearer items would strengthen the next version.
          </p>
        )}
      </div>
      <div className="table-wrap">
        <table className="mini">
          <thead>
            <tr>
              <th>Factor correlations</th>
              {factors.map((fac) => (
                <th key={fac} className="num">{fac}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {factors.map((a, i) => (
              <tr key={a}>
                <td><strong>{a}</strong></td>
                {factors.map((b, j) => (
                  <td key={b} className="num">{j < i ? f(fit.phi[i][j], 2, true) : j === i ? "1" : ""}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="small muted">Related but clearly below 1: four distinct dimensions of one broader competence.</p>
      </div>
    </div>
  );
}
