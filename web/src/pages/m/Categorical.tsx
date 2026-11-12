import { useMemo, useState } from "react";
import { ModuleLayout, Section, KeyIdea } from "../../components/ModuleLayout";
import { BLUE, CodeTabs, ORANGE, Quiz, ShareBars } from "../../components/plots";
import { Guide, Term } from "../../components/Guide";
import { useDataset, num, str, f, pFmt, type Dataset } from "../../lib/datasets";
import * as M from "../../lib/methods";

const FACTORS: Record<string, { label: string; col: string; levels: string[]; names: string[]; phrase?: string }> = {
  pronominal: { phrase: "whether the recipient was a pronoun", label: "Is the recipient a pronoun?", col: "pronominal", levels: ["nonpronominal", "pronominal"], names: ["Not a pronoun (the student)", "Pronoun (her, him, them)"] },
  animacy: { phrase: "whether the recipient was animate", label: "Is the recipient animate?", col: "animacy", levels: ["animate", "inanimate"], names: ["Animate (a person or animal)", "Inanimate (the company, the project)"] },
  definite: { phrase: "whether the recipient was definite", label: "Is the recipient definite?", col: "definite", levels: ["definite", "indefinite"], names: ["Definite (the student)", "Indefinite (a student)"] },
  accessibility: { phrase: "whether the recipient had been mentioned before", label: "Has the recipient been mentioned before?", col: "accessibility", levels: ["given", "accessible", "new"], names: ["Given (already mentioned)", "Accessible (inferable)", "New"] },
  modality: { phrase: "whether the text was spoken or written", label: "Spoken or written?", col: "modality", levels: ["spoken", "written"], names: ["Spoken (Switchboard)", "Written (Wall Street Journal)"] },
};

const PREDS = [
  { key: "inanimate", label: "Inanimate recipient", get: (d: Dataset) => str(d, "animacy").map((v) => (v === "inanimate" ? 1 : 0)), plain: "an inanimate recipient (vs animate)" },
  { key: "pronominal", label: "Pronoun recipient", get: (d: Dataset) => str(d, "pronominal").map((v) => (v === "pronominal" ? 1 : 0)), plain: "a pronoun recipient" },
  { key: "definite", label: "Definite recipient", get: (d: Dataset) => str(d, "definite").map((v) => (v === "definite" ? 1 : 0)), plain: "a definite recipient" },
  {
    key: "length_diff",
    label: "Recipient longer than theme (log ratio)",
    get: (d: Dataset) => {
      const r = num(d, "len_recipient");
      const t = num(d, "len_theme");
      return r.map((v, i) => Math.log(v) - Math.log(t[i]));
    },
    plain: "each one-unit increase in log(recipient length ÷ theme length)",
  },
  { key: "written", label: "Written (vs spoken)", get: (d: Dataset) => str(d, "modality").map((v) => (v === "written" ? 1 : 0)), plain: "written rather than spoken text" },
];

const vWord = (v: number) => (v < 0.1 ? "negligible" : v < 0.3 ? "small" : v < 0.5 ? "medium" : "large");

export default function Categorical() {
  const { data, error } = useDataset("dative");
  const [factor, setFactor] = useState("pronominal");
  const [chosen, setChosen] = useState<string[]>(["inanimate", "pronominal", "length_diff"]);
  const fac = FACTORS[factor];

  const tab = useMemo(() => {
    if (!data) return null;
    const col = str(data, fac.col);
    const real = str(data, "realization");
    const table = fac.levels.map((lv) => ["NP", "PP"].map((r) => col.filter((v, i) => v === lv && real[i] === r).length));
    return { table, chi: M.chiSquare(table), or: table.length === 2 ? M.oddsRatio(table) : null };
  }, [data, fac]);

  const logit = useMemo(() => {
    if (!data || chosen.length === 0) return null;
    const ps = PREDS.filter((p) => chosen.includes(p.key));
    const y = str(data, "realization").map((r) => (r === "PP" ? 1 : 0));
    return { ps, fit: M.logistic(ps.map((p) => p.get(data)), ps.map((p) => p.label), y) };
  }, [data, chosen]);

  const curve = useMemo(() => {
    if (!logit || !logit.ps.some((p) => p.key === "length_diff")) return null;
    const xs = Array.from({ length: 61 }, (_, i) => -3 + i * 0.1);
    const line = (pron: number) =>
      xs.map((x) => logit.fit.predict(logit.ps.map((p) => (p.key === "length_diff" ? x : p.key === "pronominal" ? pron : p.key === "definite" ? 1 : 0))));
    return { xs, a: line(0), b: logit.ps.some((p) => p.key === "pronominal") ? line(1) : null };
  }, [logit]);

  return (
    <ModuleLayout moduleKey="categorical" cutoffs="categorical">
      <KeyIdea
        gist={<>Many linguistic outcomes are choices, not measurements: <em>gave the student a book</em> (NP) or <em>gave a book to the student</em> (PP), the <Term id="dative">dative alternation</Term>. What makes speakers choose?</>}
        points={[
          ["One factor", <>A <Term id="chi-square-test">chi-square test</Term> asks whether the choice depends on it; <Term id="cramer-v">Cramér's V</Term> says how strongly.</>],
          ["Size of a contrast", <>The <Term id="odds-ratio">odds ratio</Term>: 1 = no difference, 3 = three times the odds.</>],
          ["Several factors", <><Term id="logistic">Logistic regression</Term> weighs them together, as linear regression does for measurements.</>],
        ]}
      />
      <p className="small muted">
        Data: 3,263 dative clauses from spoken (Switchboard) and written (Wall Street Journal) American English, coded by Bresnan et al. (2007),
        distributed with Baayen (2008).
      </p>

      <Section title="Try it: one factor at a time">
        {error && <p className="error">{error}</p>}
        <label className="field" style={{ maxWidth: 420 }}>
          Factor
          <select value={factor} onChange={(e) => setFactor(e.target.value)}>
            {Object.entries(FACTORS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </label>
        <Guide title="How to read the bars">
          <p>
            Each bar is one kind of recipient, split into the share of clauses using each form. If the factor made no difference, every bar would
            be split the same way. The further apart the splits, the stronger the association.
          </p>
        </Guide>
        {tab && (
          <>
            <ShareBars
              outcomes={[
                { label: "NP: gave her the book", color: BLUE },
                { label: "PP: gave the book to her", color: ORANGE },
              ]}
              rows={tab.table.map((r, i) => ({ label: fac.names[i], counts: r }))}
            />
            <div className="table-wrap" style={{ marginTop: 16 }}>
              <table className="mini">
                <caption className="small muted" style={{ captionSide: "top", textAlign: "left" }}>
                  Observed counts, with the counts expected if the form did not depend on the factor in brackets
                </caption>
                <thead>
                  <tr>
                    <th>Recipient</th>
                    <th className="num">NP</th>
                    <th className="num">PP</th>
                  </tr>
                </thead>
                <tbody>
                  {tab.table.map((r, i) => (
                    <tr key={i}>
                      <td>{fac.names[i]}</td>
                      {r.map((c, j) => (
                        <td key={j} className="num">
                          {c.toLocaleString()} <span className="muted">({Math.round(tab.chi.expected[i][j]).toLocaleString()})</span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="stat-grid">
              <div className="stat">
                <div className="value">{f(tab.chi.chi2, 1)}</div>
                <div className="label">
                  χ²({tab.chi.df}), {pFmt(tab.chi.p)}
                </div>
              </div>
              <div className="stat">
                <div className="value">{f(tab.chi.cramerV, 2, true)}</div>
                <div className="label">Cramér's V ({vWord(tab.chi.cramerV)})</div>
              </div>
              {tab.or && (
                <div className="stat">
                  <div className="value">{f(tab.or.or, 2)}</div>
                  <div className="label">
                    odds ratio, 95% CI [{f(tab.or.ci[0], 2)}, {f(tab.or.ci[1], 2)}]{tab.or.or < 1 ? " (below 1: lower odds of PP)" : " (above 1: higher odds of PP)"}
                  </div>
                </div>
              )}
              <div className="stat">
                <div className="value">{Math.round(tab.chi.minExpected)}</div>
                <div className="label">smallest expected count {tab.chi.minExpected >= 5 ? "(at least 5: fine)" : "(below 5: be cautious)"}</div>
              </div>
            </div>
            {tab.or && (
              <p className="verdict">
                For “{fac.names[1].split(" (")[0].toLowerCase()}” recipients, the odds of choosing the PP form are{" "}
                <strong>
                  {tab.or.or >= 1 ? `${f(tab.or.or, 1)} times as high` : `about 1/${Math.round(1 / tab.or.or)} as high (odds ratio ${f(tab.or.or, 2)})`}
                </strong>{" "}
                as for “{fac.names[0].split(" (")[0].toLowerCase()}” recipients: a {vWord(tab.chi.cramerV)} association (V ={" "}
                {f(tab.chi.cramerV, 2, true)}).
              </p>
            )}
            {!tab.or && (
              <p className="verdict">
                The form depends on whether the recipient has been mentioned before: a {vWord(tab.chi.cramerV)} association (V ={" "}
                {f(tab.chi.cramerV, 2, true)}). Given recipients strongly prefer the NP form (gave <em>her</em> the book).
              </p>
            )}
          </>
        )}
      </Section>

      <Section title="Try it: several factors together (logistic regression)">
        <p>
          Pronoun recipients are usually short and already mentioned, so the factors above overlap. Logistic regression estimates each factor's
          effect on the odds of the PP form while holding the others constant.
        </p>
        <fieldset className="pred-choice">
          <legend>Predictors in the model</legend>
          {PREDS.map((p) => (
            <label key={p.key} className="check">
              <input
                type="checkbox"
                checked={chosen.includes(p.key)}
                onChange={() => setChosen(chosen.includes(p.key) ? chosen.filter((k) => k !== p.key) : [...chosen, p.key])}
              />{" "}
              {p.label}
            </label>
          ))}
        </fieldset>
        <Guide title="How to read the table">
          <ul>
            <li>
              <strong>Odds ratio</strong>: how the odds of the PP form change with this factor, the others held constant. Above 1 favours PP
              (gave the book <em>to her</em>); below 1 favours NP (gave <em>her</em> the book).
            </li>
            <li>
              <strong>95% CI</strong>: if it excludes 1, the factor matters at the .05 level.
            </li>
            <li>
              <strong>McFadden's R²</strong> is a rough analogue of R² for choices. There are no agreed benchmarks; use it to compare models on
              the same data.
            </li>
          </ul>
        </Guide>
        {logit && (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Predictor</th>
                    <th className="num">Odds ratio</th>
                    <th className="num">95% CI</th>
                    <th className="num">p</th>
                    <th>In plain words</th>
                  </tr>
                </thead>
                <tbody>
                  {logit.ps.map((p, j) => {
                    const or = logit.fit.or[j + 1];
                    const [lo, hi] = logit.fit.orCi[j + 1];
                    return (
                      <tr key={p.key}>
                        <td>{p.label}</td>
                        <td className="num">{f(or, 2)}</td>
                        <td className="num">
                          [{f(lo, 2)}, {f(hi, 2)}]
                        </td>
                        <td className="num">{pFmt(logit.fit.p[j + 1]).replace("p ", "").replace("= ", "")}</td>
                        <td className="small">
                          {or >= 1
                            ? `With ${p.plain}, the odds of the PP form are ${f(or, 2)} times as high.`
                            : `With ${p.plain}, the odds of the PP form are about 1/${f(1 / or, 1)} as high.`}
                          {lo < 1 && hi > 1 ? " The interval includes 1: no clear effect." : ""}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="stat-grid">
              <div className="stat">
                <div className="value">{f(logit.fit.mcfadden, 2, true)}</div>
                <div className="label">McFadden's R²</div>
              </div>
              <div className="stat">
                <div className="value">{Math.round(logit.fit.aic).toLocaleString()}</div>
                <div className="label">AIC (lower is better, for models on the same data)</div>
              </div>
              <div className="stat">
                <div className="value">{Math.round(Math.min(logit.fit.events, logit.fit.n - logit.fit.events) / logit.ps.length)}</div>
                <div className="label">cases of the rarer form per predictor (10 or more advised; Peduzzi et al., 1996)</div>
              </div>
            </div>
            {curve && <ProbCurve xs={curve.xs} a={curve.a} b={curve.b} />}
          </>
        )}
        <Guide title="Try this">
          <ol>
            <li>Start with only “Pronoun recipient”. Then add “Recipient longer than theme”. What happens to the pronoun effect, and why?</li>
            <li>Add “Written (vs spoken)”. Once the other factors are in, does mode still matter?</li>
            <li>Compare AIC across models: which simple model does nearly as well as the full one?</li>
          </ol>
        </Guide>
      </Section>

      <Section title="Check your understanding">
        <Quiz
          items={[
            {
              q: "An odds ratio of 0.25 for pronoun recipients means…",
              options: ["Pronoun recipients use PP 25% of the time", "The odds of PP are a quarter as high for pronoun recipients", "The effect is not significant"],
              answer: 1,
              why: "An odds ratio below 1 means lower odds; 0.25 is a quarter of the odds, so pronoun recipients strongly favour the NP form (gave her the book).",
            },
            {
              q: "Why can a factor's odds ratio change when other predictors are added?",
              options: ["Because the data changed", "Because factors overlap, and the model now holds the others constant", "Because of rounding"],
              answer: 1,
              why: "Pronouns are short, so part of the pronoun effect in a one-factor model is really a length effect. Holding length constant separates the two.",
            },
            {
              q: "A chi-square test on a table with an expected count of 2 in one cell…",
              options: ["Is fine", "May be unreliable; use Fisher's exact test or combine categories", "Cannot be computed"],
              answer: 1,
              why: "The chi-square approximation needs reasonably large expected counts (Cochran, 1954). Fisher's exact test or merging sparse categories are the usual remedies.",
            },
          ]}
        />
      </Section>

      <Section title="Reporting it">
        {tab && (
          <p className="report-box">
            The realization of the recipient was associated with {fac.phrase},{" "}
            χ²({tab.chi.df}, <em>N</em> = {data ? data.n.toLocaleString() : "…"}) = {f(tab.chi.chi2, 2)}, {pFmt(tab.chi.p)}, Cramér's <em>V</em> ={" "}
            {f(tab.chi.cramerV, 2, true)}.
          </p>
        )}
        {logit && (
          <p className="report-box">
            A logistic regression predicted the PP form from {listJoin(logit.ps.map((p) => p.label.toLowerCase()))} entered together (McFadden's{" "}
            <em>R</em>² = {f(logit.fit.mcfadden, 2, true)}). Odds ratios:{" "}
            {logit.ps.map((p, j) => `${p.label.toLowerCase()}, OR = ${f(logit.fit.or[j + 1], 2)}, 95% CI [${f(logit.fit.orCi[j + 1][0], 2)}, ${f(logit.fit.orCi[j + 1][1], 2)}]`).join("; ")}.
          </p>
        )}
      </Section>

      <Section title="Do it in R or Python" folded>
        <CodeTabs
          r={`library(languageR); data(dative)
tab <- table(dative$PronomOfRec, dative$RealizationOfRecipient)
chisq.test(tab, correct = FALSE)         # chi-square without continuity correction
m <- glm(RealizationOfRecipient ~ AnimacyOfRec + PronomOfRec +
           I(log(LengthOfRecipient) - log(LengthOfTheme)),
         family = binomial, data = dative)
summary(m); exp(cbind(OR = coef(m), confint.default(m)))   # odds ratios with Wald CIs`}
          python={`import numpy as np, pandas as pd
import statsmodels.formula.api as smf
from scipy import stats
d = pd.read_csv("https://raw.githubusercontent.com/ngoconglem/quantitative-methods-lab/main/data/dative.csv")
print(stats.chi2_contingency(pd.crosstab(d.pronominal, d.realization), correction=False))
d["pp"] = (d.realization == "PP").astype(int)
d["length_diff"] = np.log(d.len_recipient) - np.log(d.len_theme)
m = smf.logit("pp ~ C(animacy) + C(pronominal) + length_diff", data=d).fit()
print(m.summary()); print(np.exp(m.params))`}
        />
      </Section>
    </ModuleLayout>
  );
}

function listJoin(xs: string[]) {
  if (xs.length <= 1) return xs.join("");
  if (xs.length === 2) return `${xs[0]} and ${xs[1]}`;
  return `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;
}

function ProbCurve({ xs, a, b }: { xs: number[]; a: number[]; b: number[] | null }) {
  const W = 640;
  const H = 260;
  const m = { l: 56, r: 16, t: 14, b: 46 };
  const sx = (x: number) => m.l + ((x + 3) / 6) * (W - m.l - m.r);
  const sy = (p: number) => H - m.b - p * (H - m.t - m.b);
  const path = (ys: number[]) => ys.map((p, i) => `${i ? "L" : "M"}${sx(xs[i]).toFixed(1)},${sy(p).toFixed(1)}`).join("");
  return (
    <figure style={{ margin: "16px 0" }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="plot" role="img" aria-label="Predicted probability of the PP form by relative length of recipient and theme">
        {[0, 0.25, 0.5, 0.75, 1].map((p) => (
          <g key={p}>
            <line x1={m.l} x2={W - m.r} y1={sy(p)} y2={sy(p)} stroke="#e4e9ec" />
            <text x={m.l - 6} y={sy(p) + 4} textAnchor="end" fontSize={11} fill="#6b7a87">
              {Math.round(p * 100)}%
            </text>
          </g>
        ))}
        {[-3, -2, -1, 0, 1, 2, 3].map((x) => (
          <text key={x} x={sx(x)} y={H - m.b + 16} textAnchor="middle" fontSize={11} fill="#6b7a87">
            {x === 0 ? "equal" : `${f(Math.exp(Math.abs(x)), 0)}×`}
          </text>
        ))}
        <path d={path(a)} fill="none" stroke={BLUE} strokeWidth={2.5} />
        {b && <path d={path(b)} fill="none" stroke={ORANGE} strokeWidth={2.5} />}
        <text x={sx(xs[28]) - 4} y={sy(a[28]) - 10} textAnchor="end" fontSize={12} fill={BLUE}>
          not a pronoun
        </text>
        {b && (
          <text x={sx(xs[32]) + 6} y={sy(b[32]) + 18} fontSize={12} fill={ORANGE}>
            pronoun
          </text>
        )}
        <text x={m.l} y={H - 8} textAnchor="start" fontSize={12} fill="#475867">
          ← theme longer than recipient
        </text>
        <text x={W - m.r} y={H - 8} textAnchor="end" fontSize={12} fill="#475867">
          recipient longer than theme →
        </text>
      </svg>
      <figcaption className="small muted">
        Predicted chance of the PP form (gave the book to her) for a definite, animate recipient, as the recipient gets longer relative to the
        theme. Longer recipients go last, in the PP form: end weight again.
      </figcaption>
    </figure>
  );
}
