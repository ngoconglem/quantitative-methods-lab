import { useMemo, useState } from "react";
import { ModuleLayout, Section } from "../../components/ModuleLayout";
import { CodeTabs, Histogram, Quiz } from "../../components/plots";
import { Guide, Term } from "../../components/Guide";
import { useDataset, num, str, f } from "../../lib/datasets";
import * as M from "../../lib/methods";

const VARS = {
  rt: { label: "Reaction time (milliseconds)", short: "reaction time", unit: "ms", log: true, get: (d: Record<string, number[]>) => d.rt_ms },
  freq: {
    label: "Word frequency (occurrences in the CELEX database)",
    short: "word frequency",
    unit: "occurrences",
    log: true,
    get: (d: Record<string, number[]>) => d.log_freq.map((v) => Math.exp(v)),
  },
  fam: { label: "Familiarity rating (1–7)", short: "familiarity", unit: "rating", log: false, get: (d: Record<string, number[]>) => d.familiarity },
  len: { label: "Word length (letters)", short: "word length", unit: "letters", log: false, get: (d: Record<string, number[]>) => d.length },
} as const;
type VarKey = keyof typeof VARS;

export default function Describe() {
  const { data, error } = useDataset("english");
  const [v, setV] = useState<VarKey>("rt");
  const [group, setGroup] = useState<"all" | "young" | "old">("all");
  const [log, setLog] = useState(false);
  const [bins, setBins] = useState(30);
  const spec = VARS[v];
  const useLog = log && spec.log;

  const res = useMemo(() => {
    if (!data) return null;
    const cols = { rt_ms: num(data, "rt_ms"), log_freq: num(data, "log_freq"), familiarity: num(data, "familiarity"), length: num(data, "length") };
    const age = str(data, "age");
    const raw = spec.get(cols);
    const xs = raw.filter((_, i) => group === "all" || age[i] === group).map((x) => (useLog ? Math.log(x) : x));
    const s = M.describe(xs);
    const h = M.histogram(xs, v === "len" ? Math.min(bins, new Set(xs).size) : bins);
    return { s, h };
  }, [data, spec, group, useLog, bins, v]);

  const shape = res
    ? Math.abs(res.s.skew) < 0.5
      ? "roughly symmetric"
      : res.s.skew > 0
        ? Math.abs(res.s.skew) > 2
          ? "strongly skewed to the right: a long tail of high values"
          : "skewed to the right: a tail of high values"
        : Math.abs(res.s.skew) > 2
          ? "strongly skewed to the left: a long tail of low values"
          : "skewed to the left: a tail of low values"
    : "";
  const xLabel = useLog ? `log of ${spec.short}` : spec.label;
  const fmt = (x: number) => (useLog ? f(x, 2) : v === "freq" ? Math.round(x).toLocaleString() : f(x, v === "rt" ? 0 : 2));

  return (
    <ModuleLayout moduleKey="describe" cutoffs="describe">
      <Section title="In plain words">
        <p>
          Before you test anything, look at your numbers. Three questions cover most of what you need to know about a measure: where is the
          middle, how spread out are the values, and what shape do they make? The answers decide which summaries are honest and which analyses
          are safe.
        </p>
        <ul>
          <li>
            <strong>The middle.</strong> The <Term id="mean">mean</Term> is the average. The <Term id="median">median</Term> is the value in the
            middle when everything is lined up in order. When a few very high values pull the mean up, the median is the better summary.
          </li>
          <li>
            <strong>The spread.</strong> The <Term id="sd">standard deviation</Term> is the typical distance from the mean. The{" "}
            <Term id="iqr">interquartile range</Term> is the width of the middle half of the values, and ignores extremes.
          </li>
          <li>
            <strong>The shape.</strong> A <Term id="histogram">histogram</Term> shows how often each range of values occurs.{" "}
            <Term id="skew">Skew</Term> puts the lopsidedness into one number: 0 is symmetric, positive means a tail to the right.
          </li>
        </ul>
      </Section>

      <Section title="The data: how quickly do people recognise words?">
        <p>
          In a <Term id="lexical-decision">lexical decision</Term> experiment, people see a string of letters such as <em>chair</em> or{" "}
          <em>blirk</em> and press a button as fast as they can to say whether it is a real English word. This dataset gives the average time
          young adults and older adults took for each of 2,284 short English nouns and verbs, with each word's frequency, familiarity and length
          (Balota et al., 2004; distributed with Baayen, 2008). Each word appears twice, once for each age group: 4,568 rows.
        </p>
      </Section>

      <Section title="Try it: explore a variable">
        {error && <p className="error">{error}</p>}
        <div className="controls">
          <label className="field">
            Variable
            <select
              value={v}
              onChange={(e) => {
                setV(e.target.value as VarKey);
                setLog(false);
              }}
            >
              {Object.entries(VARS).map(([k, s]) => (
                <option key={k} value={k}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Readers
            <select value={group} onChange={(e) => setGroup(e.target.value as typeof group)}>
              <option value="all">Both age groups</option>
              <option value="young">Young adults</option>
              <option value="old">Older adults</option>
            </select>
          </label>
          <label className="field" style={{ minWidth: 200 }}>
            Bars: {bins}
            <input type="range" min={8} max={60} value={bins} onChange={(e) => setBins(+e.target.value)} />
          </label>
          {spec.log && (
            <label className="check">
              <input type="checkbox" checked={log} onChange={(e) => setLog(e.target.checked)} /> Show on a log scale
            </label>
          )}
        </div>
        <Guide title="How to read the histogram">
          <p>
            Each bar counts the words whose value falls in that range; taller bars are more common values. The orange line marks the mean and
            the dashed black line the median. If the two lines sit apart, the distribution is lopsided, and the mean is being pulled toward
            the long tail. Hover over a bar to see its exact range and count.
          </p>
        </Guide>
        {res && (
          <>
            <Histogram edges={res.h.edges} counts={res.h.counts} xLabel={xLabel} mean={res.s.mean} median={res.s.median} format={fmt} />
            <div className="stat-grid">
              <div className="stat">
                <div className="value">{res.s.n.toLocaleString()}</div>
                <div className="label">values</div>
              </div>
              <div className="stat">
                <div className="value">{fmt(res.s.mean)}</div>
                <div className="label">mean</div>
              </div>
              <div className="stat">
                <div className="value">{fmt(res.s.median)}</div>
                <div className="label">median</div>
              </div>
              <div className="stat">
                <div className="value">{useLog ? f(res.s.sd, 2) : fmt(res.s.sd)}</div>
                <div className="label">standard deviation</div>
              </div>
              <div className="stat">
                <div className="value">
                  {fmt(res.s.q1)}–{fmt(res.s.q3)}
                </div>
                <div className="label">middle half of values (interquartile range)</div>
              </div>
              <div className="stat">
                <div className="value">{f(res.s.skew, 2)}</div>
                <div className="label">skew</div>
              </div>
            </div>
            <p className="verdict">
              The distribution is <strong>{shape}</strong> (skew = {f(res.s.skew, 2)}).{" "}
              {Math.abs(res.s.mean - res.s.median) / (res.s.sd || 1) > 0.1
                ? `The mean (${fmt(res.s.mean)}) sits ${res.s.mean > res.s.median ? "above" : "below"} the median (${fmt(res.s.median)}), so the median is the better summary of a typical word.`
                : `The mean and median are close (${fmt(res.s.mean)} and ${fmt(res.s.median)}), so either summarises a typical word well.`}{" "}
              {spec.log && !log && res.s.skew > 0.5 && "Tick “Show on a log scale” to see what a log transformation does to the shape."}
            </p>
          </>
        )}
        <Guide title="Try this">
          <ol>
            <li>
              Look at reaction time for both age groups. Where does the long tail come from? Switch between young and older adults and compare
              the middle and the spread.
            </li>
            <li>
              Tick “Show on a log scale”. The <Term id="log-transform">log transformation</Term> pulls in the long right tail, so reaction-time
              studies usually analyse log times.
            </li>
            <li>
              Switch to word frequency. A few everyday words are hundreds of times more common than most others. Compare the mean and median,
              then switch to the log scale.
            </li>
            <li>Change the number of bars. Too few hides the shape; too many makes noise look like a pattern.</li>
          </ol>
        </Guide>
      </Section>

      <Section title="Check your understanding">
        <Quiz
          items={[
            {
              q: "Reaction times have a long tail of slow responses. Which summary of a typical response is least affected by that tail?",
              options: ["The mean", "The median", "The maximum"],
              answer: 1,
              why: "The median depends only on the middle value, so a few very slow responses barely move it, while they pull the mean upward.",
            },
            {
              q: "Two classes have the same mean test score, but one has a standard deviation of 4 and the other of 12. What does that tell you?",
              options: ["The second class did better", "Scores in the second class are more spread out", "The second class is larger"],
              answer: 1,
              why: "The standard deviation describes spread around the mean, not the level of scores or the number of people.",
            },
            {
              q: "Why do researchers often analyse reaction times and word frequencies on a log scale?",
              options: ["To make the numbers smaller", "Because they are strongly right-skewed", "Because the log removes outliers"],
              answer: 1,
              why: "Both measures have long right tails. The log compresses large values more than small ones, giving a more symmetric shape that suits methods such as regression. It does not delete any values.",
            },
          ]}
        />
      </Section>

      <Section title="Reporting it">
        {res && (
          <p className="report-box">
            {spec.label.replace(/ \(.*\)$/, "")}
            {useLog ? " (log-transformed)" : ""} {group === "all" ? "" : `for ${group === "young" ? "young" : "older"} adults `}ranged from{" "}
            {fmt(res.s.min)} to {fmt(res.s.max)} (<em>M</em> = {fmt(res.s.mean)}, <em>SD</em> = {useLog ? f(res.s.sd, 2) : fmt(res.s.sd)};{" "}
            <em>Mdn</em> = {fmt(res.s.median)}, <em>IQR</em> = {fmt(res.s.q1)}–{fmt(res.s.q3)}). The distribution was {shape.split(":")[0]}{" "}
            (skew = {f(res.s.skew, 2)})
            {res.s.skew > 1 && !useLog ? ", so the variable was log-transformed before analysis." : "."}
          </p>
        )}
        <p className="small muted">
          The sentence updates with your choices above. For a skewed measure, the median and interquartile range describe a typical case more
          honestly than the mean and standard deviation.
        </p>
      </Section>

      <Section title="Do it in R or Python">
        <CodeTabs
          r={`# install.packages("languageR")  # once
library(languageR)
data(english)
rt <- exp(english$RTlexdec)          # times in milliseconds
summary(rt); sd(rt)                  # middle and spread
hist(rt, breaks = 30)                # shape
hist(log(rt), breaks = 30)           # after a log transformation
# skew as reported by SPSS (G1): install.packages("e1071")
e1071::skewness(rt, type = 2)`}
          python={`import numpy as np, pandas as pd
from scipy import stats
df = pd.read_csv("https://raw.githubusercontent.com/ngoconglem/quantitative-methods-lab/main/data/english.csv")
rt = df["rt_ms"]
print(rt.describe())                         # middle and spread
print(stats.skew(rt, bias=False))            # skew (G1)
rt.plot.hist(bins=30); np.log(rt).plot.hist(bins=30)`}
        />
      </Section>
    </ModuleLayout>
  );
}
