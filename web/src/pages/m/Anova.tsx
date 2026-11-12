import { useMemo, useState } from "react";
import { ModuleLayout, Section, KeyIdea } from "../../components/ModuleLayout";
import { CodeTabs, MeansPlot, Quiz } from "../../components/plots";
import { Guide, Term } from "../../components/Guide";
import { useDataset, num, str, f, pFmt, type Dataset } from "../../lib/datasets";
import { oneWay, kruskal, pairwise } from "../../lib/anova";
import { tQuantile } from "../../lib/methods";

const RAMP = ["#6ea6e6", "#4a8ddd", "#2a78d6", "#1f5ea8", "#163f73"];

interface Example {
  key: string;
  label: string;
  question: string;
  simulated?: boolean;
  dataset: "ellipse" | "intercultural";
  group: (d: Dataset) => string[];
  levels: string[];
  levelNames: string[];
  outcomes: { key: string; label: string; unit: string; get: (d: Dataset) => number[] }[];
}

const icc = (d: Dataset) => {
  const items = Object.keys(d.columns).filter((k) => /^(KN|AT|SK|AW)\d$/.test(k));
  return num(d, "id").map((_, i) => items.reduce((s, k) => s + (k === "AT2" ? 6 - num(d, k)[i] : num(d, k)[i]), 0) / items.length);
};

const EXAMPLES: Example[] = [
  {
    key: "abroad",
    label: "Time abroad and intercultural competence",
    question: "Do students who have spent more time abroad report higher intercultural competence?",
    simulated: true,
    dataset: "intercultural",
    group: (d) => str(d, "abroad"),
    levels: ["None", "Short", "Long"],
    levelNames: ["No time abroad", "Short stay (under 3 months)", "Long stay (3 months or more)"],
    outcomes: [
      { key: "icc", label: "Intercultural competence (mean of 20 items, 1–5)", unit: "points", get: icc },
      { key: "wtc", label: "Willingness to communicate in English (1–7)", unit: "points", get: (d) => num(d, "wtc") },
      { key: "contact", label: "Weekly hours of intercultural contact (skewed)", unit: "hours", get: (d) => num(d, "contact_hours") },
    ],
  },
  {
    key: "grade",
    label: "Essay quality by school grade",
    question: "Do learner essays get better from grade 8 to grade 12?",
    dataset: "ellipse",
    group: (d) => num(d, "grade").map(String),
    levels: ["8", "9", "10", "11", "12"],
    levelNames: ["Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"],
    outcomes: [
      { key: "overall", label: "Overall proficiency score (1–5)", unit: "points", get: (d) => num(d, "overall") },
      { key: "vocabulary", label: "Vocabulary score (1–5)", unit: "points", get: (d) => num(d, "vocabulary") },
      { key: "words", label: "Essay length (words)", unit: "words", get: (d) => num(d, "words") },
    ],
  },
];

const sizeWord = (w2: number) => (w2 < 0.01 ? "negligible" : w2 < 0.06 ? "small" : w2 < 0.14 ? "medium" : "large");

export default function Anova() {
  const [exKey, setExKey] = useState("abroad");
  const ex = EXAMPLES.find((e) => e.key === exKey)!;
  const [outKey, setOutKey] = useState(ex.outcomes[0].key);
  const out = ex.outcomes.find((o) => o.key === outKey) ?? ex.outcomes[0];
  const ic = useDataset("intercultural");
  const el = useDataset("ellipse");
  const ds = ex.dataset === "intercultural" ? ic : el;

  const res = useMemo(() => {
    if (!ds.data) return null;
    const g = ex.group(ds.data);
    const y = out.get(ds.data);
    const samples = ex.levels.map((l) => y.filter((_, i) => g[i] === l));
    const a = oneWay(samples, ex.levelNames);
    return { samples, a, kw: kruskal(samples), pairs: pairwise(samples, ex.levelNames) };
  }, [ds.data, ex, out]);

  const plotGroups = res
    ? res.samples.map((s, i) => {
        const g = res.a.groups[i];
        const half = tQuantile(0.975, g.n - 1) * (g.sd / Math.sqrt(g.n));
        return { label: `${g.label} (n = ${g.n})`, values: s, mean: g.mean, lo: g.mean - half, hi: g.mean + half, color: RAMP[ex.levels.length === 3 ? [0, 2, 4][i] : i] };
      })
    : [];

  return (
    <ModuleLayout moduleKey="anova" cutoffs="anova">
      <KeyIdea
        gist="With three or more groups, ask two questions in order: does any group differ, and if so, which ones?"
        points={[
          ["Does any group differ?", <>One overall test: Welch's <Term id="anova">ANOVA</Term> (F).</>],
          ["How much does group matter?", "ω² (omega squared): the share of variation that goes with group membership."],
          ["Which groups?", <>Compare each pair, adjusting the p-values for running several tests (Holm).</>],
          ["Skewed or ordinal outcome?", <>The <Term id="kruskal">Kruskal–Wallis</Term> test uses ranks instead of means.</>],
        ]}
      />

      <div className="flow" aria-label="Steps of the analysis">
        <div className="flow-box">
          <strong>1. Look</strong>
          <span>means and spread of each group</span>
        </div>
        <span className="flow-arrow" aria-hidden="true" />
        <div className="flow-box">
          <strong>2. Overall test</strong>
          <span>Welch's F, or Kruskal–Wallis</span>
        </div>
        <span className="flow-arrow" aria-hidden="true" />
        <div className="flow-box">
          <strong>3. Pairs</strong>
          <span>which groups differ, Holm-adjusted</span>
        </div>
        <span className="flow-arrow" aria-hidden="true" />
        <div className="flow-box">
          <strong>4. Size</strong>
          <span>ω² overall, d for each pair</span>
        </div>
      </div>

      <Section title="Try it">
        <div className="chips" role="group" aria-label="Example">
          {EXAMPLES.map((e) => (
            <button
              key={e.key}
              className="chip"
              aria-pressed={e.key === exKey}
              onClick={() => {
                setExKey(e.key);
                setOutKey(e.outcomes[0].key);
              }}
            >
              {e.label}
            </button>
          ))}
        </div>
        <p>
          <strong>Question:</strong> {ex.question}{" "}
          {ex.simulated ? (
            <span className="sim-tag" title="Generated for teaching; no real participants">Simulated data</span>
          ) : (
            <span className="muted">(ELLIPSE corpus, 3,911 essays)</span>
          )}
        </p>
        <label className="field" style={{ maxWidth: 460 }}>
          Outcome
          <select value={out.key} onChange={(e) => setOutKey(e.target.value)}>
            {ex.outcomes.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        {ds.error && <p className="error">{ds.error}</p>}
        {res && (
          <>
            <Guide title="How to read the chart">
              <p>
                Each faint dot is one person or essay. The large dot is the group mean and the bar its 95% <Term id="ci">confidence interval</Term>.
                Bars that do not overlap at all point to a real difference; heavy overlap means the groups are similar.
              </p>
            </Guide>
            <MeansPlot groups={plotGroups} unit={out.unit} />
            <div className="stat-grid">
              <div className="stat">
                <div className="value">{f(res.a.welchF, 2)}</div>
                <div className="label">
                  Welch's F({res.a.df1}, {f(res.a.welchDf2, 1)}), {pFmt(res.a.welchP)}
                </div>
              </div>
              <div className="stat">
                <div className="value">{f(Math.max(0, res.a.omega2), 3, true)}</div>
                <div className="label">ω²: a {sizeWord(res.a.omega2)} effect</div>
              </div>
              <div className="stat">
                <div className="value">{f(res.kw.H, 1)}</div>
                <div className="label">
                  Kruskal–Wallis H({res.kw.df}), {pFmt(res.kw.p)}
                </div>
              </div>
            </div>
            <h3>Which groups differ?</h3>
            <div className="table-wrap">
              <table className="pair-table">
                <thead>
                  <tr>
                    <th>Comparison</th>
                    <th className="num">Difference</th>
                    <th className="num">d</th>
                    <th className="num">p (Holm)</th>
                    <th>Verdict</th>
                  </tr>
                </thead>
                <tbody>
                  {res.pairs.map((r) => (
                    <tr key={r.a + r.b}>
                      <td>
                        {r.a} vs {r.b}
                      </td>
                      <td className="num">{f(r.diff, 2)}</td>
                      <td className="num">{f(r.d, 2)}</td>
                      <td className="num">{pFmt(r.pHolm).replace("p ", "")}</td>
                      <td>
                        <span className={`pill ${r.pHolm < 0.05 ? "pill-yes" : "pill-no"}`}>{r.pHolm < 0.05 ? "Differ" : "Not shown to differ"}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {out.key === "contact" || out.key === "words" ? (
              <p className="verdict">
                This outcome is skewed (a few very high values), so the rank-based Kruskal–Wallis test is the safer headline; the two tests agree
                here.
              </p>
            ) : null}
          </>
        )}
      </Section>

      <Section title="Why not just run lots of t-tests?">
        <FamilywiseChart />
      </Section>

      <Section title="Check your understanding">
        <Quiz
          items={[
            {
              q: "Welch's ANOVA gives p < .001 for five grades. What do you know?",
              options: ["Every grade differs from every other", "At least one grade differs from the others", "Grade 12 is best"],
              answer: 1,
              why: "The overall test only says the means are not all equal. Pairwise comparisons show which grades differ.",
            },
            {
              q: "Essay quality across five grades: Welch's ANOVA is significant, but ω² = .007. What does that mean?",
              options: ["Grade explains a lot of the variation", "A real but negligible effect: grade explains under 1% of the variation", "The test is wrong"],
              answer: 1,
              why: "With 3,911 essays, tiny differences become significant. ω² shows grade hardly matters: older students in this corpus do not write clearly better essays.",
            },
            {
              q: "Your outcome is weekly contact hours, with a few students reporting 30+ hours. Which overall test is safer?",
              options: ["Classic ANOVA", "Kruskal–Wallis", "Chi-square"],
              answer: 1,
              why: "Kruskal–Wallis works on ranks, so a few extreme values cannot drive the result.",
            },
          ]}
        />
      </Section>

      <Section title="Reporting it">
        {res && (
          <p className="report-box">
            {out.label.replace(/ \(.*\)$/, "")} differed across groups, Welch's <em>F</em>({res.a.df1}, {f(res.a.welchDf2, 1)}) ={" "}
            {f(res.a.welchF, 2)}, {pFmt(res.a.welchP)}, ω² = {f(Math.max(0, res.a.omega2), 3, true)}.{" "}
            {res.a.groups.map((g) => `${g.label}: M = ${f(g.mean, 2)}, SD = ${f(g.sd, 2)}`).join("; ")}. Holm-adjusted pairwise comparisons showed{" "}
            {res.pairs.filter((r) => r.pHolm < 0.05).length === 0
              ? "no reliable pairwise differences"
              : `differences between ${res.pairs
                  .filter((r) => r.pHolm < 0.05)
                  .map((r) => `${r.a.toLowerCase()} and ${r.b.toLowerCase()} (d = ${f(r.d, 2)})`)
                  .join(", ")}`}
            .
          </p>
        )}
      </Section>

      <Section title="Do it in R or Python" folded>
        <CodeTabs
          r={`d <- read.csv("intercultural_simulated.csv")   # in the repository's data folder
d$abroad <- factor(d$abroad, levels = c("None", "Short", "Long"))
oneway.test(wtc ~ abroad, data = d)                 # Welch's ANOVA
pairwise.t.test(d$wtc, d$abroad, pool.sd = FALSE, p.adjust.method = "holm")
kruskal.test(contact_hours ~ abroad, data = d)
effectsize::omega_squared(aov(wtc ~ abroad, data = d))`}
          python={`import pandas as pd, pingouin as pg
d = pd.read_csv("https://raw.githubusercontent.com/ngoconglem/quantitative-methods-lab/main/data/intercultural_simulated.csv")
print(pg.welch_anova(data=d, dv="wtc", between="abroad"))
print(pg.pairwise_tests(data=d, dv="wtc", between="abroad", parametric=True, correction=True, padjust="holm"))
print(pg.kruskal(data=d, dv="contact_hours", between="abroad"))`}
        />
      </Section>
    </ModuleLayout>
  );
}

/** Chance of at least one false alarm when every pair of k groups is tested at .05 (independent-tests approximation). */
function FamilywiseChart() {
  const [k, setK] = useState(5);
  const rows = [2, 3, 4, 5, 6, 7, 8].map((g) => {
    const m = (g * (g - 1)) / 2;
    return { g, m, risk: 1 - 0.95 ** m };
  });
  const W = 560, H = 220, mb = 34, ml = 40;
  const bw = (W - ml) / rows.length;
  return (
    <div>
      <p>
        Each extra test is another chance of a false alarm. With {k} groups there are {(k * (k - 1)) / 2} pairs; testing each at .05, the
        chance of at least one false “difference” is about <strong>{Math.round((1 - 0.95 ** ((k * (k - 1)) / 2)) * 100)}%</strong>.
      </p>
      <label className="field" style={{ maxWidth: 300 }}>
        Number of groups: {k}
        <input type="range" min={2} max={8} value={k} onChange={(e) => setK(+e.target.value)} />
      </label>
      <svg viewBox={`0 0 ${W} ${H}`} className="plot" role="img" aria-label="Chance of at least one false alarm by number of groups" style={{ maxWidth: 560 }}>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <g key={t}>
            <line x1={ml} x2={W} y1={(H - mb) * (1 - t) + 6} y2={(H - mb) * (1 - t) + 6} stroke="#e4e9ec" />
            <text x={ml - 6} y={(H - mb) * (1 - t) + 10} fontSize={11} textAnchor="end" fill="#6b7a87">
              {Math.round(t * 100)}%
            </text>
          </g>
        ))}
        {rows.map((r, i) => {
          const h = (H - mb - 6) * r.risk;
          return (
            <g key={r.g}>
              <rect x={ml + i * bw + 6} y={H - mb - h} width={bw - 12} height={h} rx={4} fill={r.g === k ? "#eb6834" : "#2a78d6"}>
                <title>{`${r.g} groups, ${r.m} pairs: ${Math.round(r.risk * 100)}%`}</title>
              </rect>
              <text x={ml + i * bw + bw / 2} y={H - mb + 16} fontSize={12} textAnchor="middle" fill="#1c2b3a">
                {r.g}
              </text>
            </g>
          );
        })}
        <text x={(ml + W) / 2} y={H - 2} fontSize={11} textAnchor="middle" fill="#475867">
          Number of groups (every pair tested at .05)
        </text>
      </svg>
      <p className="small muted">
        Treating the tests as independent; real pairwise tests overlap, so the true risk is a little lower but still grows quickly. One overall
        test first, then Holm-adjusted pairs, keeps it near 5%.
      </p>
    </div>
  );
}
