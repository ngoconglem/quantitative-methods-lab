import { useMemo, useState } from "react";
import { ModuleLayout, Section, KeyIdea } from "../../components/ModuleLayout";
import { CodeTabs, Quiz, Scatter } from "../../components/plots";
import { Guide, Term } from "../../components/Guide";
import { useDataset, num, str, f, pFmt, type Dataset } from "../../lib/datasets";
import * as M from "../../lib/methods";

interface Pred {
  key: string;
  label: string;
  unit: string;
  get: (d: Dataset) => number[];
  min: number;
  max: number;
  step: number;
  binary?: boolean;
}

const DESIGNS = {
  english: {
    title: "What makes a word quick to recognise?",
    outcome: "Reaction time",
    outcomeNote: "log of milliseconds",
    y: (d: Dataset) => num(d, "log_rt"),
    log: true,
    preds: [
      { key: "log_freq", label: "Word frequency (log)", unit: "log unit", get: (d: Dataset) => num(d, "log_freq"), min: 0, max: 11, step: 0.5 },
      { key: "familiarity", label: "Familiarity rating", unit: "rating point", get: (d: Dataset) => num(d, "familiarity"), min: 1, max: 7, step: 0.25 },
      { key: "length", label: "Word length", unit: "letter", get: (d: Dataset) => num(d, "length"), min: 2, max: 7, step: 1 },
      { key: "old", label: "Older reader (vs young)", unit: "", get: (d: Dataset) => str(d, "age").map((a) => (a === "old" ? 1 : 0)), min: 0, max: 1, step: 1, binary: true },
    ] as Pred[],
  },
  ellipse: {
    title: "What goes with higher ratings of learner essays?",
    outcome: "Overall rating",
    outcomeNote: "1–5 scale",
    y: (d: Dataset) => num(d, "overall"),
    log: false,
    preds: [
      { key: "mtld", label: "Lexical diversity (MTLD)", unit: "MTLD point", get: (d: Dataset) => num(d, "mtld"), min: 15, max: 90, step: 1 },
      { key: "log_words", label: "Essay length (log words)", unit: "log unit", get: (d: Dataset) => num(d, "words").map(Math.log), min: 4, max: 7.5, step: 0.1 },
      { key: "grade", label: "Grade (8–12)", unit: "grade", get: (d: Dataset) => num(d, "grade"), min: 8, max: 12, step: 1 },
    ] as Pred[],
  },
};
type DesignKey = keyof typeof DESIGNS;

export default function Regress() {
  const eng = useDataset("english");
  const ell = useDataset("ellipse");
  const [design, setDesign] = useState<DesignKey>("english");
  const [chosen, setChosen] = useState<Record<DesignKey, string[]>>({ english: ["log_freq"], ellipse: ["mtld", "log_words"] });
  const [vals, setVals] = useState<Record<string, number>>({ log_freq: 5, familiarity: 4, length: 4, old: 0, mtld: 45, log_words: 6, grade: 10 });
  const spec = DESIGNS[design];
  const ds = design === "english" ? eng.data : ell.data;
  const preds = spec.preds.filter((p) => chosen[design].includes(p.key));

  const fit = useMemo(() => {
    if (!ds || preds.length === 0) return null;
    const y = spec.y(ds);
    const res = M.ols(
      preds.map((p) => p.get(ds)),
      preds.map((p) => p.label),
      y,
    );
    const idx = M.sample(
      Array.from({ length: y.length }, (_, i) => i),
      800,
      11,
    );
    return { res, rx: idx.map((i) => res.fitted[i]), ry: idx.map((i) => res.resid[i]) };
  }, [ds, preds, spec]);

  const toggle = (k: string) =>
    setChosen({ ...chosen, [design]: chosen[design].includes(k) ? chosen[design].filter((x) => x !== k) : [...chosen[design], k] });

  const reading = (p: Pred, b: number) => {
    if (spec.log) {
      const pct = (Math.exp(b) - 1) * 100;
      const dir = pct < 0 ? "faster" : "slower";
      return p.binary
        ? `${p.label.replace(" (vs young)", "s")} are about ${f(Math.abs(pct), 1)}% ${dir}, other predictors held constant.`
        : `Each extra ${p.unit} goes with responses about ${f(Math.abs(pct), 1)}% ${dir}, other predictors held constant.`;
    }
    return `Each extra ${p.unit} goes with a rating ${f(Math.abs(b), 3)} points ${b < 0 ? "lower" : "higher"}, other predictors held constant.`;
  };

  const prediction = fit
    ? fit.res.coef[0] + preds.reduce((s, p, j) => s + fit.res.coef[j + 1] * (vals[p.key] ?? 0), 0)
    : null;
  const f2 = fit ? fit.res.r2 / (1 - fit.res.r2) : 0;
  const bothKnown = design === "english" && chosen.english.includes("log_freq") && chosen.english.includes("familiarity");

  return (
    <ModuleLayout moduleKey="regress" cutoffs="regression">
      <KeyIdea
        gist={<><Term id="regression">Linear regression</Term> predicts one outcome from several predictors at once. Each <Term id="coefficient">coefficient</Term> is that predictor's effect while the others are held constant.</>}
        points={[
          [<Term id="r-squared">R²</Term>, "The share of variation in the outcome the model explains, from 0 to 1."],
          [<Term id="residual">Residuals</Term>, "What the model gets wrong for each case. Their shape, not the outcome's, is what should look normal."],
          [<Term id="vif">Overlap (VIF)</Term>, "Predictors carrying the same information blur each other's coefficients."],
        ]}
      />

      <Section title="Try it: build a model">
        {(eng.error || ell.error) && <p className="error">{eng.error ?? ell.error}</p>}
        <div className="chips" role="group" aria-label="Choose a dataset">
          {(Object.keys(DESIGNS) as DesignKey[]).map((k) => (
            <button key={k} className="chip" aria-pressed={design === k} onClick={() => setDesign(k)}>
              {DESIGNS[k].title}
            </button>
          ))}
        </div>
        <p className="small muted">
          {design === "english"
            ? "Outcome: log reaction time for 2,284 words, each read by young and older adults (Balota et al., 2004). On a log scale, coefficients translate into percentage changes."
            : "Outcome: the overall rating of 3,911 learner essays (ELLIPSE corpus; Crossley et al., 2023)."}
        </p>
        <fieldset className="pred-choice">
          <legend>Predictors in the model</legend>
          {spec.preds.map((p) => (
            <label key={p.key} className="check">
              <input type="checkbox" checked={chosen[design].includes(p.key)} onChange={() => toggle(p.key)} /> {p.label}
            </label>
          ))}
        </fieldset>
        {preds.length === 0 && <p className="verdict">Tick at least one predictor.</p>}
        {fit && (
          <>
            <div className="stat-grid">
              <div className="stat">
                <div className="value">{f(fit.res.r2, 3, true)}</div>
                <div className="label">
                  R² ({Math.round(100 * fit.res.r2)}% of variation explained); adjusted R² = {f(fit.res.adjR2, 3, true)}
                </div>
              </div>
              <div className="stat">
                <div className="value">{f(fit.res.f, 1)}</div>
                <div className="label">
                  F({fit.res.dfModel}, {fit.res.dfResid.toLocaleString()}), {pFmt(fit.res.fP)}
                </div>
              </div>
              <div className="stat">
                <div className="value">{f(f2, 2, true)}</div>
                <div className="label">Cohen's f² ({f2 < 0.02 ? "below small" : f2 < 0.15 ? "small" : f2 < 0.35 ? "medium" : "large"})</div>
              </div>
            </div>
            <Guide title="How to read the coefficient table">
              <ul>
                <li>
                  <strong>b</strong> is the coefficient: the change in the outcome for a one-unit increase in that predictor, the others held
                  constant. The intercept is the predicted outcome when every predictor is 0, which is often not a meaningful case.
                </li>
                <li>
                  <strong>95% CI</strong> is the range of plausible values for b. If it excludes 0, the predictor is statistically significant
                  at the .05 level.
                </li>
                <li>
                  <strong>VIF</strong> above 5 to 10 means the predictor overlaps heavily with the others (James et al., 2013).
                </li>
                <li>The last column puts each coefficient into words.</li>
              </ul>
            </Guide>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Predictor</th>
                    <th className="num">b</th>
                    <th className="num">95% CI</th>
                    <th className="num">p</th>
                    <th className="num">VIF</th>
                    <th>In plain words</th>
                  </tr>
                </thead>
                <tbody>
                  {fit.res.names.map((n, i) => (
                    <tr key={n}>
                      <td>{n}</td>
                      <td className="num">{f(fit.res.coef[i], 4)}</td>
                      <td className="num">
                        [{f(fit.res.ci[i][0], 4)}, {f(fit.res.ci[i][1], 4)}]
                      </td>
                      <td className="num">{pFmt(fit.res.p[i]).replace("p ", "").replace("= ", "")}</td>
                      <td className="num">{i === 0 ? "" : f(fit.res.vif[i - 1], 2)}</td>
                      <td className="small">
                        {i === 0
                          ? "Predicted outcome when every predictor is 0."
                          : `${reading(preds[i - 1], fit.res.coef[i])}${fit.res.ci[i][0] < 0 && fit.res.ci[i][1] > 0 ? " The interval includes 0: no clear effect." : ""}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {bothKnown && (
              <p className="verdict">
                Frequency and familiarity are both in the model. They correlate at about .79, so each one's coefficient is smaller than when it
                is entered alone (compare frequency alone: b = −0.037). Neither has “lost” its effect; the model is sharing credit for what they
                have in common.
              </p>
            )}

            <h3>Predict a new case</h3>
            <div className="controls">
              {preds.map((p) => (
                <label key={p.key} className="field" style={{ minWidth: 200 }}>
                  {p.label}: {p.binary ? (vals[p.key] ? "yes" : "no") : vals[p.key]}
                  <input type="range" min={p.min} max={p.max} step={p.step} value={vals[p.key]} onChange={(e) => setVals({ ...vals, [p.key]: +e.target.value })} />
                </label>
              ))}
            </div>
            {prediction !== null && (
              <p className="verdict">
                Predicted {spec.outcome.toLowerCase()}:{" "}
                <strong>{spec.log ? `${Math.round(Math.exp(prediction))} ms` : `${f(prediction, 2)} on the 1–5 scale`}</strong>. Predictions are
                most trustworthy inside the range of the data the model was fitted to.
              </p>
            )}

            <h3>Check the residuals</h3>
            <Guide>
              <p>
                Each dot is one case: its predicted value along the bottom and the model's error up the side. A healthy model shows a shapeless
                cloud around the dashed zero line. A curve suggests a relationship that is not straight; a funnel suggests errors that grow with
                the prediction. {design === "ellipse" && "The diagonal stripes come from ratings moving in half-point steps; they are expected."}
              </p>
            </Guide>
            <Scatter x={fit.rx} y={fit.ry} xLabel={`Predicted ${spec.outcome.toLowerCase()} (${spec.outcomeNote})`} yLabel="Residual" zeroLine height={260} />
          </>
        )}
        <Guide title="Try this">
          <ol>
            <li>Word recognition, frequency only: note R² and the frequency coefficient. Then add familiarity. What happens to both?</li>
            <li>Add “Older reader”. R² jumps, because age group explains a large share of the variation in reaction times.</li>
            <li>Add word length. Its interval includes zero for these short words.</li>
            <li>
              Switch to essay ratings. Diversity and length together explain under a fifth of the variation in ratings. What else might raters be
              responding to?
            </li>
          </ol>
        </Guide>
      </Section>

      <Section title="Check your understanding">
        <Quiz
          items={[
            {
              q: "In the word model, the frequency coefficient shrinks when familiarity is added. Why?",
              options: ["Frequency stopped mattering", "The two predictors overlap, so the model shares credit between them", "The sample changed"],
              answer: 1,
              why: "Coefficients describe each predictor's contribution holding the others constant. When two predictors carry much the same information, each one's unique contribution is smaller.",
            },
            {
              q: "A model has R² = .18. What does this mean?",
              options: ["18% of predictions are correct", "The predictors account for 18% of the variation in the outcome", "The model is useless"],
              answer: 1,
              why: "R² is the share of variation explained. Whether .18 is useful depends on the field and the purpose; in research on human behaviour it is often respectable.",
            },
            {
              q: "On the log reaction-time scale, b = 0.22 for older readers. Roughly what does that mean?",
              options: ["Older readers are 0.22 ms slower", "Older readers are about 25% slower, other things equal", "Older readers are 22 times slower"],
              answer: 1,
              why: "On a log scale, exp(0.22) ≈ 1.25, so responses are about 25% slower. That is why the plain-words column converts log coefficients into percentages.",
            },
          ]}
        />
      </Section>

      <Section title="Reporting it">
        {fit && (
          <p className="report-box">
            A linear regression predicting {spec.outcome.toLowerCase()}
            {spec.log ? " (log-transformed)" : ""} from {preds.map((p) => p.label.toLowerCase()).join(", ")} explained{" "}
            {Math.round(100 * fit.res.r2)}% of the variance, <em>R</em>² = {f(fit.res.r2, 2, true)}, <em>F</em>({fit.res.dfModel},{" "}
            {fit.res.dfResid}) = {f(fit.res.f, 1)}, {pFmt(fit.res.fP)}.{" "}
            {preds
              .map(
                (p, j) =>
                  `${p.label}: b = ${f(fit.res.coef[j + 1], 3)}, 95% CI [${f(fit.res.ci[j + 1][0], 3)}, ${f(fit.res.ci[j + 1][1], 3)}], ${pFmt(fit.res.p[j + 1])}`,
              )
              .join("; ")}
            .
          </p>
        )}
      </Section>

      <Section title="Do it in R or Python" folded>
        <CodeTabs
          r={`library(languageR); data(english)
m <- lm(RTlexdec ~ WrittenFrequency + Familiarity + LengthInLetters + AgeSubject, data = english)
summary(m)          # coefficients, R², F
confint(m)          # 95% CIs
car::vif(m)         # install.packages("car")
plot(fitted(m), resid(m)); abline(h = 0, lty = 2)`}
          python={`import pandas as pd
import statsmodels.formula.api as smf
df = pd.read_csv("https://raw.githubusercontent.com/ngoconglem/quantitative-methods-lab/main/data/english.csv")
m = smf.ols("log_rt ~ log_freq + familiarity + length + C(age)", data=df).fit()
print(m.summary())`}
        />
      </Section>
    </ModuleLayout>
  );
}
