import { useMemo, useState } from "react";
import { ModuleLayout, Section, KeyIdea } from "../components/ModuleLayout";
import { CodeTabs, Quiz } from "../components/plots";
import { Guide, Term, Pop } from "../components/Guide";
import { useDataset, num, str, f, type Dataset } from "../lib/datasets";
import * as S from "../lib/stats";
import { fitCfa, type CfaFit } from "../lib/cfa";
import { REFS } from "../lib/cutoffs";

const PHASES: { title: string; start: number; steps: [string, string][] }[] = [
  { title: "Develop the items", start: 1, steps: [["Define", "the construct from theory"], ["Review", "previous research and existing scales"], ["Write", "a pool of items for each dimension"], ["Ask experts", "to rate each item's relevance"]] },
  { title: "Pilot", start: 5, steps: [["Interview", "a few people as they answer (cognitive interviews)"], ["Screen", "items in a small pilot survey; revise"]] },
  { title: "Test", start: 7, steps: [["Explore", "the structure (EFA) on half the main sample"], ["Confirm", "it (CFA) on the other half; report"]] },
];

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

  const pilot = useMemo(() => {
    if (!data) return null;
    const items = itemsOf(data);
    const X = matrix(data, items, "A").slice(0, 60);
    return items.map((it, i) => {
      const counts = [1, 2, 3, 4, 5].map((v) => X.filter((r) => r[i] === v).length);
      const same = items.map((k, j) => (k.slice(0, 2) === it.slice(0, 2) ? j : -1)).filter((j) => j >= 0);
      const stats = S.itemStats(X.map((r) => same.map((j) => r[j])));
      return { item: it, counts, n: X.length, citc: stats[same.indexOf(i)].citc };
    });
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
        gist="A questionnaire score is only as good as the evidence that its items measure what you claim. Build items from theory and previous research, check them with experts and a pilot, then test their structure in new data."
        points={[
          ["Start from theory", "Define each dimension from a theory and earlier studies before writing a single item."],
          ["Pilot before the main study", "Ask a few people to think aloud as they answer, then screen the items in a small survey."],
          [<Term id="efa">Explore (EFA)</Term>, "Let the data show how many dimensions there are and which items belong together."],
          [<Term id="cfa">Confirm (CFA)</Term>, "Test the structure you expect, in a different sample, and see how well it fits."],
          ["Never both on the same people", "Exploring and confirming on the same data proves little: the model was shaped to fit it."],
        ]}
      />

      <div className="phase-flow" aria-label="Scale development phases and steps">
        {PHASES.map((ph, pi) => (
          <span key={ph.title} style={{ display: "contents" }}>
            <div className="phase">
              <p className="phase-title">{ph.title}</p>
              <ol start={ph.start}>
                {ph.steps.map(([a, b]) => (
                  <li key={a}>
                    <strong>{a}</strong> <span>{b}</span>
                  </li>
                ))}
              </ol>
            </div>
            {pi < PHASES.length - 1 && <span className="flow-arrow" aria-hidden="true" />}
          </span>
        ))}
      </div>
      <p className="small muted">
        Steps follow DeVellis and Thorpe{" "}
        <Pop label="(2022)">{REFS.devellis2022.full}</Pop> and Boateng et al.{" "}
        <Pop label="(2018)">{REFS.boateng2018.full}</Pop>.
      </p>

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

      <Section title="Steps 1–3: from theory and previous research to items">
        <p>
          Each dimension is defined first, from Byram's model and from Deardorff's{" "}
          <Pop label="(2006)" title="Deardorff (2006)">
            {REFS.deardorff2006.full} An expert-consensus study of how intercultural competence should be defined and assessed.
          </Pop>{" "}
          consensus study. Items are then written to cover each definition, in the words students use.
        </p>
        <div className="table-wrap">
          <table className="theory-table">
            <thead>
              <tr>
                <th>Dimension</th>
                <th>Theory (Byram, 1997)</th>
                <th>Previous research (Deardorff, 2006)</th>
                <th>Example item</th>
              </tr>
            </thead>
            <tbody>
              {THEORY.map((r) => (
                <tr key={r.dim}>
                  <td style={{ color: DIM_COLOR[r.dim] }}>
                    <strong>{DIM_NAME[r.dim]}</strong>
                  </td>
                  <td>{r.byram}</td>
                  <td>{r.deardorff}</td>
                  <td className="small">
                    <strong>{r.item}</strong> {data?.meta?.items?.[r.item]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h3>Writing good items</h3>
        <div className="table-wrap">
          <table className="dodont">
            <thead>
              <tr>
                <th>Rule</th>
                <th>Avoid</th>
                <th>Better</th>
              </tr>
            </thead>
            <tbody>
              {ITEM_RULES.map(([rule, bad, good]) => (
                <tr key={rule}>
                  <td><strong>{rule}</strong></td>
                  <td className="bad">{bad}</td>
                  <td className="good">{good}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="small muted">Write more items than you need: the weakest are dropped in the next steps.</p>
      </Section>

      <Section title="Step 4: expert review (content validity)">
        <p>
          Six experts rate how relevant each draft item is to its dimension, from 1 (not relevant) to 4 (highly relevant). Click a rating to
          change it.
        </p>
        <ExpertPanel />
      </Section>

      <Section title="Steps 5–6: pilot the items">
        <div className="two-col">
          <div>
            <h3>Cognitive interviews</h3>
            <p className="small">
              Five to ten people from the target group answer the items while thinking aloud, and the interviewer probes (Willis{" "}
              <Pop label="2005">{REFS.willis2005.full}</Pop>).
            </p>
            <table className="mini">
              <tbody>
                {PROBES.map(([kind, q]) => (
                  <tr key={kind}>
                    <td><strong>{kind}</strong></td>
                    <td className="small">{q}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <h3>Pilot survey: screen the items</h3>
            <p className="small">
              A small pilot survey shows how people use each item. Look for piled-up answers at one end and items that do not go with the rest
              of their dimension. Illustrated with 60 respondents from the simulated survey.
            </p>
            {pilot && <PilotBars rows={pilot} />}
          </div>
        </div>
      </Section>

      {efa && (
        <Section title="Step 7: explore the structure (EFA, half A)">
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
        <Section title="Step 8: confirm it (CFA, half B)">
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

/* ------------------------------------------------------------------ item development */

const THEORY = [
  { dim: "KN", item: "KN4", byram: "Knowledge of social groups and their practices, in one's own and the other's country.", deardorff: "Cultural self-awareness and a deep understanding of culture." },
  { dim: "AT", item: "AT3", byram: "Curiosity and openness; readiness to suspend disbelief about other cultures and belief about one's own.", deardorff: "Respect, openness, and curiosity and discovery, seen as the foundation." },
  { dim: "SK", item: "SK1", byram: "Skills of interpreting and relating, and of discovery and interaction.", deardorff: "Listening, observing and interpreting; analysing, evaluating and relating." },
  { dim: "AW", item: "AW1", byram: "Critical cultural awareness: evaluating practices in one's own and other cultures on explicit criteria.", deardorff: "An ethnorelative view: seeing one's own culture as one among many." },
];

const ITEM_RULES: [string, string, string][] = [
  ["One idea per item", "I enjoy meeting people from other cultures and travelling abroad.", "I enjoy meeting people from other cultures."],
  ["No double negatives", "I do not dislike unfamiliar customs.", "I am comfortable with unfamiliar customs."],
  ["Plain, specific words", "I possess intercultural sensitivity.", "I notice when someone feels uncomfortable because of a cultural difference."],
  ["Stay on the construct", "I like trying food from other countries.", "I am curious about how people from other cultures live."],
  ["Use negative wording with care", "I never fail to respect other cultures.", "Keep a few clearly worded negative items, e.g. AT2, and reverse-score them."],
];

const PROBES: [string, string][] = [
  ["Comprehension", "What does “clear criteria” mean to you in this statement?"],
  ["Paraphrase", "Can you say this item in your own words?"],
  ["Recall", "What situation were you thinking of when you answered?"],
  ["Confidence", "How sure are you of your answer? Why?"],
];

const EXPERT_ITEMS: [string, number[]][] = [
  ["KN2 I can explain how communication styles differ between cultures.", [4, 4, 3, 4, 4, 3]],
  ["AT1 I enjoy meeting people from other cultures.", [4, 3, 4, 4, 3, 4]],
  ["AT5 I like trying food from other countries.", [2, 1, 3, 2, 2, 3]],
  ["AW1 I evaluate cultural practices, including my own, using clear criteria.", [4, 3, 4, 2, 4, 4]],
  ["Draft: I enjoy meeting people from other cultures and travelling abroad.", [3, 2, 4, 2, 3, 2]],
];

function ExpertPanel() {
  const [ratings, setRatings] = useState(EXPERT_ITEMS.map(([, r]) => r));
  const icvi = ratings.map((r) => r.filter((v) => v >= 3).length / r.length);
  const scvi = icvi.reduce((a, b) => a + b, 0) / icvi.length;
  return (
    <>
      <div className="table-wrap">
        <table className="expert-table">
          <thead>
            <tr>
              <th>Item</th>
              {[1, 2, 3, 4, 5, 6].map((e) => (
                <th key={e} className="num">E{e}</th>
              ))}
              <th className="num">I-CVI</th>
              <th>Decision</th>
            </tr>
          </thead>
          <tbody>
            {EXPERT_ITEMS.map(([text], i) => (
              <tr key={text}>
                <td className="small">{text}</td>
                {ratings[i].map((v, j) => (
                  <td key={j} className="num">
                    <button
                      className={`rating r${v}`}
                      aria-label={`Expert ${j + 1} rating ${v}; click to change`}
                      onClick={() => setRatings((rs) => rs.map((row, a) => (a === i ? row.map((x, b) => (b === j ? (x % 4) + 1 : x)) : row)))}
                    >
                      {v}
                    </button>
                  </td>
                ))}
                <td className="num">
                  <strong>{f(icvi[i], 2, true)}</strong>
                </td>
                <td>
                  <span className={`pill ${icvi[i] >= 0.78 ? "pill-yes" : "pill-flag"}`}>{icvi[i] >= 0.78 ? "Keep" : "Revise or drop"}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="verdict">
        I-CVI is the share of experts rating an item 3 or 4. Keep items at .78 or above (Polit et al.,{" "}
        <Pop label="2007">{REFS.polit2007.full}</Pop>). Scale average (S-CVI/Ave) = <strong>{f(scvi, 2, true)}</strong>.
      </p>
    </>
  );
}

function PilotBars({ rows }: { rows: { item: string; counts: number[]; n: number; citc: number }[] }) {
  const COLS = ["#d9653b", "#f0a77f", "#d7dde2", "#8db8ea", "#2a78d6"];
  return (
    <div className="pilot-bars">
      <div className="pilot-legend small">
        {["Strongly disagree", "", "Neutral", "", "Strongly agree"].map((l, i) => (
          <span key={i}>
            <span className="swatch" style={{ background: COLS[i] }} />
            {l || (i === 1 ? "Disagree" : "Agree")}
          </span>
        ))}
      </div>
      {rows.map((r) => {
        const neg = (r.counts[0] + r.counts[1] + r.counts[2] / 2) / r.n;
        const flag = r.citc < 0.3 ? "Weak link to its dimension" : r.counts[4] / r.n > 0.5 ? "Ceiling" : "";
        return (
          <div key={r.item} className="pilot-row" title={`${r.item}: item–rest r = ${r.citc.toFixed(2)}`}>
            <span className="pilot-label" style={{ color: DIM_COLOR[r.item.slice(0, 2)] }}>{r.item}</span>
            <div className="pilot-track">
              <div className="pilot-bar" style={{ marginLeft: `${(0.5 - neg) * 100}%` }}>
                {r.counts.map((c, i) => (
                  <span key={i} style={{ width: `${(100 * c) / r.n}%`, background: COLS[i] }} />
                ))}
              </div>
              <span className="pilot-mid" />
            </div>
            <span className={`pilot-r small${flag ? " pilot-flag" : ""}`}>
              r = {f(r.citc, 2, true)}
              {flag && " ⚑"}
            </span>
          </div>
        );
      })}
      {(() => {
        const weak = rows.filter((r) => r.citc < 0.3).map((r) => r.item);
        const ceil = rows.filter((r) => r.citc >= 0.3 && r.counts[4] / r.n > 0.5).map((r) => r.item);
        return weak.length || ceil.length ? (
          <p className="verdict">
            ⚑ Flagged for revision:{" "}
            {weak.length > 0 && `${weak.join(", ")} (weak link to its dimension)`}
            {weak.length > 0 && ceil.length > 0 && "; "}
            {ceil.length > 0 && `${ceil.join(", ")} (most people strongly agree)`}.
          </p>
        ) : null;
      })()}
      <p className="small muted">Bars are centred on the neutral point: disagreement left, agreement right. r = correlation with the rest of the item's dimension (aim for .30 or more).</p>
    </div>
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
