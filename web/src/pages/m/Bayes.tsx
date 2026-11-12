import { useMemo, useState } from "react";
import { ModuleLayout, Section, KeyIdea } from "../../components/ModuleLayout";
import { CodeTabs, Quiz } from "../../components/plots";
import { Guide } from "../../components/Guide";
import { useDataset, num, str, f, type Dataset } from "../../lib/datasets";
import { normalPosterior, dnorm } from "../../lib/bayes";
import { welch, sample } from "../../lib/methods";

interface Example {
  key: string;
  label: string;
  question: string;
  simulated?: boolean;
  ds: "intercultural" | "ellipse";
  groups: (d: Dataset) => { a: number[]; b: number[] };
  aName: string;
  bName: string;
}

const EXAMPLES: Example[] = [
  {
    key: "abroad",
    label: "Time abroad and willingness to communicate",
    question: "How much more willing to communicate are students who spent 3+ months abroad than those who never went?",
    simulated: true,
    ds: "intercultural",
    groups: (d) => {
      const g = str(d, "abroad");
      const y = num(d, "wtc");
      return { a: y.filter((_, i) => g[i] === "Long"), b: y.filter((_, i) => g[i] === "None") };
    },
    aName: "Long stay",
    bName: "No time abroad",
  },
  {
    key: "grade",
    label: "Vocabulary in grade 12 vs grade 8 essays",
    question: "Do grade 12 learners write with better vocabulary than grade 8 learners?",
    ds: "ellipse",
    groups: (d) => {
      const g = num(d, "grade");
      const y = num(d, "vocabulary");
      return { a: y.filter((_, i) => g[i] === 12), b: y.filter((_, i) => g[i] === 8) };
    },
    aName: "Grade 12",
    bName: "Grade 8",
  },
];

const PRIORS: { key: string; label: string; mean: number; sd: number; why: string }[] = [
  { key: "vague", label: "Vague", mean: 0, sd: 2, why: "Almost any effect is plausible: the data decide." },
  { key: "default", label: "Weakly informative", mean: 0, sd: 0.5, why: "Effects beyond d = ±1 are unlikely, as in most social science." },
  { key: "sceptic", label: "Sceptical", mean: 0, sd: 0.1, why: "A sceptic who expects at most a tiny effect." },
  { key: "informed", label: "Informed by earlier studies", mean: 0.5, sd: 0.15, why: "Earlier studies suggest a medium effect (d ≈ 0.5)." },
];

const bfWord = (bf: number) =>
  bf > 100 ? "extreme" : bf > 30 ? "very strong" : bf > 10 ? "strong" : bf > 3 ? "moderate" : bf > 1 ? "anecdotal" : "none";

export default function Bayes() {
  const [exKey, setExKey] = useState("abroad");
  const ex = EXAMPLES.find((e) => e.key === exKey)!;
  const [priorMean, setPriorMean] = useState(0);
  const [priorSd, setPriorSd] = useState(0.5);
  const [nPer, setNPer] = useState(30);
  const ic = useDataset("intercultural");
  const el = useDataset("ellipse");
  const ds = ex.ds === "intercultural" ? ic : el;

  const res = useMemo(() => {
    if (!ds.data) return null;
    const { a, b } = ex.groups(ds.data);
    const k = Math.min(nPer, a.length, b.length);
    const sa = nPer >= a.length ? a : sample(a, k, 11);
    const sb = nPer >= b.length ? b : sample(b, k, 23);
    const w = welch(sa, sb);
    const n1 = sa.length, n2 = sb.length;
    const se = Math.sqrt((n1 + n2) / (n1 * n2) + (w.d * w.d) / (2 * (n1 + n2)));
    return { w, se, n1, n2, maxN: Math.min(a.length, b.length), post: normalPosterior(priorMean, priorSd, w.d, se) };
  }, [ds.data, ex, nPer, priorMean, priorSd]);

  return (
    <ModuleLayout moduleKey="bayes" cutoffs="bayes">
      <KeyIdea
        gist="Bayesian analysis starts from what you believed before the study (the prior), combines it with the data, and gives what you should believe now (the posterior)."
        points={[
          ["Prior", "Your belief about the effect before seeing the data, written as a distribution."],
          ["Posterior", "The updated belief. Its middle 95% is the credible interval: a 95% chance the effect lies inside, given the model and prior."],
          ["Bayes factor", "How many times more likely the data are if there is an effect than if there is none."],
          ["What it adds", "Direct statements such as “a 98% probability the effect is positive”, and evidence for no effect as well as for an effect."],
        ]}
      />

      <div className="flow" aria-label="Bayesian updating">
        <div className="flow-box"><strong>Prior</strong><span>belief before the data</span></div>
        <span className="flow-arrow" aria-hidden="true" />
        <div className="flow-box"><strong>× Likelihood</strong><span>what the data say</span></div>
        <span className="flow-arrow" aria-hidden="true" />
        <div className="flow-box"><strong>= Posterior</strong><span>belief after the data</span></div>
      </div>

      <Section title="Try it">
        <div className="chips" role="group" aria-label="Example">
          {EXAMPLES.map((e) => (
            <button key={e.key} className="chip" aria-pressed={e.key === exKey} onClick={() => setExKey(e.key)}>
              {e.label}
            </button>
          ))}
        </div>
        <p>
          <strong>Question:</strong> {ex.question}{" "}
          {ex.simulated ? <span className="sim-tag">Simulated data</span> : <span className="muted">(ELLIPSE corpus)</span>} The effect is
          Cohen's d: the difference in standard-deviation units.
        </p>
        <div className="chips" role="group" aria-label="Prior">
          {PRIORS.map((p) => (
            <button
              key={p.key}
              className="chip"
              aria-pressed={priorMean === p.mean && priorSd === p.sd}
              onClick={() => {
                setPriorMean(p.mean);
                setPriorSd(p.sd);
              }}
              title={p.why}
            >
              {p.label} prior
            </button>
          ))}
        </div>
        <div className="controls">
          <label className="field" style={{ minWidth: 220 }}>
            Prior centre: d = {f(priorMean, 2)}
            <input type="range" min={-1} max={1} step={0.05} value={priorMean} onChange={(e) => setPriorMean(+e.target.value)} />
          </label>
          <label className="field" style={{ minWidth: 220 }}>
            Prior spread (SD): {f(priorSd, 2)}
            <input type="range" min={0.05} max={2} step={0.05} value={priorSd} onChange={(e) => setPriorSd(+e.target.value)} />
          </label>
          {res && (
            <label className="field" style={{ minWidth: 220 }}>
              People per group: {Math.min(nPer, res.maxN)}
              <input type="range" min={5} max={res.maxN} step={5} value={Math.min(nPer, res.maxN)} onChange={(e) => setNPer(+e.target.value)} />
            </label>
          )}
        </div>
        {ds.error && <p className="error">{ds.error}</p>}
        {res && (
          <>
            <PosteriorChart priorMean={priorMean} priorSd={priorSd} est={res.w.d} se={res.se} post={res.post} />
            <div className="stat-grid">
              <div className="stat">
                <div className="value">{f(res.post.mean, 2)}</div>
                <div className="label">Posterior estimate of d</div>
              </div>
              <div className="stat">
                <div className="value">[{f(res.post.ci[0], 2)}, {f(res.post.ci[1], 2)}]</div>
                <div className="label">95% credible interval</div>
              </div>
              <div className="stat">
                <div className="value">{Math.round(res.post.pPositive * 1000) / 10}%</div>
                <div className="label">Probability the effect is positive</div>
              </div>
              <div className="stat">
                <div className="value">{res.post.bf10 >= 1 ? f(res.post.bf10, res.post.bf10 > 100 ? 0 : 1) : `1/${f(1 / res.post.bf10, 1)}`}</div>
                <div className="label">Bayes factor (effect vs none)</div>
              </div>
            </div>
            <p className="verdict">
              With {res.n1} and {res.n2} people, the data alone give d = {f(res.w.d, 2)}.{" "}
              {res.post.bf10 >= 1
                ? `The Bayes factor gives ${bfWord(res.post.bf10)} evidence for an effect.`
                : `The Bayes factor favours no effect: the data are ${f(1 / res.post.bf10, 1)} times more likely if d = 0 (${bfWord(1 / res.post.bf10)} evidence for no effect).`}{" "}
              Move the sample size up and the prior matters less and less.
            </p>
            <Guide title="How to read the chart">
              <p>
                The dashed orange curve is the prior; the grey curve is what the data alone say (the likelihood); the blue area is the posterior,
                with its 95% credible interval shaded darker. The posterior always lies between prior and data, closer to whichever is more
                precise.
              </p>
            </Guide>
          </>
        )}
      </Section>

      <Section title="Check your understanding">
        <Quiz
          items={[
            {
              q: "A 95% credible interval of [0.20, 0.60] means…",
              options: ["95% of studies would find d in this range", "Given the model and prior, there is a 95% probability d lies between .20 and .60", "p < .05"],
              answer: 1,
              why: "That direct probability statement is what Bayesian intervals give, and what many people wrongly read into frequentist confidence intervals.",
            },
            {
              q: "With a sceptical prior and only 10 people per group, the posterior sits near 0. With 300 per group it moves to the data. Why?",
              options: ["The prior changed", "More data carry more weight than the prior", "Bayesian methods ignore small samples"],
              answer: 1,
              why: "The posterior weights prior and data by their precision. Large samples are precise, so they dominate.",
            },
            {
              q: "BF10 = 1/8. What does this mean?",
              options: ["Strong evidence for an effect", "The data are 8 times more likely under no effect", "The study failed"],
              answer: 1,
              why: "Unlike a non-significant p-value, a Bayes factor below 1 is positive evidence for the null.",
            },
          ]}
        />
      </Section>

      <Section title="Reporting it">
        {res && (
          <p className="report-box">
            Using a normal prior on Cohen's d (M = {f(priorMean, 2)}, SD = {f(priorSd, 2)}), the posterior estimate was d = {f(res.post.mean, 2)},
            95% CrI [{f(res.post.ci[0], 2)}, {f(res.post.ci[1], 2)}], with a {Math.round(res.post.pPositive * 1000) / 10}% posterior probability
            that the effect is positive; BF₁₀ = {res.post.bf10 >= 1 ? f(res.post.bf10, 2) : f(res.post.bf10, 3)}. Report the prior and why you
            chose it, and show that conclusions hold under a different reasonable prior.
          </p>
        )}
        <p className="small muted">
          This page uses a normal approximation to the likelihood so it can update instantly. For full Bayesian models (regression, multilevel,
          ordinal), use brms in R or PyMC in Python, below.
        </p>
      </Section>

      <Section title="Do it in R or Python" folded>
        <CodeTabs
          r={`library(brms)
d <- read.csv("intercultural_simulated.csv")   # in the repository's data folder
d <- subset(d, abroad %in% c("None", "Long"))
d$long <- as.integer(d$abroad == "Long")
d$z <- (d$wtc - mean(d$wtc)) / sd(d$wtc)        # standardise so the slope is on the d scale
fit <- brm(z ~ long, data = d,
           prior = prior(normal(0, 0.5), class = "b"), sample_prior = "yes")
summary(fit)
hypothesis(fit, "long > 0")                     # posterior probability the effect is positive
hypothesis(fit, "long = 0")                     # Savage-Dickey Bayes factor (Evid.Ratio = BF01)`}
          python={`import pandas as pd, pymc as pm, arviz as az
d = pd.read_csv("https://raw.githubusercontent.com/ngoconglem/quantitative-methods-lab/main/data/intercultural_simulated.csv")
d = d[d.abroad.isin(["None", "Long"])]
long = (d.abroad == "Long").astype(int).to_numpy(); z = ((d.wtc - d.wtc.mean()) / d.wtc.std()).to_numpy()
with pm.Model():
    b = pm.Normal("b", 0, 0.5); a = pm.Normal("a", 0, 1); s = pm.HalfNormal("s", 1)
    pm.Normal("y", a + b * long, s, observed=z)
    idata = pm.sample()
print(az.summary(idata)); print((idata.posterior["b"] > 0).mean().item())`}
        />
      </Section>
    </ModuleLayout>
  );
}

function PosteriorChart({ priorMean, priorSd, est, se, post }: { priorMean: number; priorSd: number; est: number; se: number; post: { mean: number; sd: number; ci: [number, number] } }) {
  const W = 640, H = 240, m = { l: 14, r: 14, t: 12, b: 34 };
  const lo = -1.5, hi = 2;
  const xs = Array.from({ length: 351 }, (_, i) => lo + (i * (hi - lo)) / 350);
  const pr = xs.map((x) => dnorm(x, priorMean, priorSd));
  const lk = xs.map((x) => dnorm(x, est, se));
  const po = xs.map((x) => dnorm(x, post.mean, post.sd));
  const top = Math.max(...po, ...lk, ...pr.map((v) => Math.min(v, Math.max(...po))));
  const sx = (x: number) => m.l + ((x - lo) / (hi - lo)) * (W - m.l - m.r);
  const sy = (v: number) => H - m.b - (Math.min(v, top) / top) * (H - m.t - m.b);
  const path = (ys: number[]) => ys.map((v, i) => `${i ? "L" : "M"}${sx(xs[i]).toFixed(1)},${sy(v).toFixed(1)}`).join(" ");
  const area = (ys: number[], a = lo, b = hi) => {
    const idx = xs.map((x, i) => [x, i] as const).filter(([x]) => x >= a && x <= b).map(([, i]) => i);
    if (!idx.length) return "";
    return `M${sx(xs[idx[0]])},${sy(0)} ` + idx.map((i) => `L${sx(xs[i]).toFixed(1)},${sy(ys[i]).toFixed(1)}`).join(" ") + ` L${sx(xs[idx[idx.length - 1]])},${sy(0)} Z`;
  };
  return (
    <figure className="chart-fig">
      <svg viewBox={`0 0 ${W} ${H}`} className="plot" role="img" aria-label="Prior, likelihood and posterior distributions">
        {[-1, -0.5, 0, 0.5, 1, 1.5, 2].map((t) => (
          <g key={t}>
            <line x1={sx(t)} x2={sx(t)} y1={m.t} y2={H - m.b} stroke={t === 0 ? "#9fb0bd" : "#eef1f3"} />
            <text x={sx(t)} y={H - m.b + 15} fontSize={11} textAnchor="middle" fill="#6b7a87">{t}</text>
          </g>
        ))}
        <path d={area(po)} fill="#2a78d6" fillOpacity={0.15} />
        <path d={area(po, post.ci[0], post.ci[1])} fill="#2a78d6" fillOpacity={0.3} />
        <path d={path(lk)} fill="none" stroke="#8a96a0" strokeWidth={2} />
        <path d={path(pr)} fill="none" stroke="#eb6834" strokeWidth={2} strokeDasharray="6 4" />
        <path d={path(po)} fill="none" stroke="#2a78d6" strokeWidth={2.5} />
        <text x={(m.l + W - m.r) / 2} y={H - 4} fontSize={11} textAnchor="middle" fill="#475867">Effect size (Cohen's d)</text>
      </svg>
      <figcaption className="legend-row">
        <span><span className="swatch dashed" style={{ borderColor: "#eb6834" }} /> Prior</span>
        <span><span className="swatch" style={{ background: "#8a96a0" }} /> Data (likelihood)</span>
        <span><span className="swatch" style={{ background: "#2a78d6" }} /> Posterior, 95% credible interval shaded</span>
      </figcaption>
    </figure>
  );
}
