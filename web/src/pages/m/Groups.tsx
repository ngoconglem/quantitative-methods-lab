import { useMemo, useState } from "react";
import { ModuleLayout, Section } from "../../components/ModuleLayout";
import { BLUE, CodeTabs, MeansPlot, ORANGE, Quiz } from "../../components/plots";
import { Guide, Term } from "../../components/Guide";
import { useDataset, num, str, f, pFmt, type Dataset } from "../../lib/datasets";
import * as M from "../../lib/methods";

type ExKey = "age" | "theme" | "nounverb" | "grade";

const EXAMPLES: Record<ExKey, { title: string; question: string; design: "paired" | "independent"; unit: string }> = {
  age: {
    title: "Young and older readers",
    question: "Do older adults take longer to recognise the same words than young adults?",
    design: "paired",
    unit: "Reaction time (ms)",
  },
  theme: {
    title: "The dative and end weight",
    question:
      "In “gave the student a very long book”, the thing given (the theme) comes last. Is the theme longer when it comes last (recipient as a noun phrase) than when it comes first (“gave it to the student”)?",
    design: "independent",
    unit: "Theme length (log of number of words)",
  },
  nounverb: {
    title: "Nouns and verbs",
    question: "Do young adults recognise nouns faster than verbs?",
    design: "independent",
    unit: "Reaction time (ms)",
  },
  grade: {
    title: "Essays in grade 8 and grade 12",
    question: "Do learners in grade 12 receive higher vocabulary ratings than learners in grade 8?",
    design: "independent",
    unit: "Vocabulary rating (1–5)",
  },
};

function groupsFor(key: ExKey, eng: Dataset, dat: Dataset, ell: Dataset): { a: number[]; b: number[]; la: string; lb: string } {
  if (key === "theme") {
    const len = num(dat, "len_theme").map(Math.log);
    const r = str(dat, "realization");
    return { a: len.filter((_, i) => r[i] === "NP"), b: len.filter((_, i) => r[i] === "PP"), la: "Theme last (gave her the book)", lb: "Theme first (gave the book to her)" };
  }
  if (key === "grade") {
    const v = num(ell, "vocabulary");
    const gr = num(ell, "grade");
    return { a: v.filter((_, i) => gr[i] === 12), b: v.filter((_, i) => gr[i] === 8), la: "Grade 12", lb: "Grade 8" };
  }
  const rt = num(eng, "rt_ms");
  const age = str(eng, "age");
  const cat = str(eng, "category");
  if (key === "nounverb") {
    return {
      a: rt.filter((_, i) => age[i] === "young" && cat[i] === "noun"),
      b: rt.filter((_, i) => age[i] === "young" && cat[i] === "verb"),
      la: "Nouns (young adults)",
      lb: "Verbs (young adults)",
    };
  }
  const word = str(eng, "word");
  const keyOf = (i: number) => `${word[i]}|${cat[i]}`;
  const old = new Map<string, number>();
  rt.forEach((v, i) => age[i] === "old" && old.set(keyOf(i), v));
  const a: number[] = [];
  const b: number[] = [];
  rt.forEach((v, i) => {
    if (age[i] === "young" && old.has(keyOf(i))) {
      a.push(old.get(keyOf(i))!);
      b.push(v);
    }
  });
  return { a, b, la: "Older adults", lb: "Young adults" };
}

const dWord = (d: number) => {
  const a = Math.abs(d);
  return a < 0.2 ? "negligible" : a < 0.5 ? "small" : a < 0.8 ? "medium" : "large";
};

function Simulation({ a, b, la, lb }: { a: number[]; b: number[]; la: string; lb: string }) {
  const [n, setN] = useState(30);
  const [seed, setSeed] = useState(1);
  const sim = useMemo(() => {
    const runs = 200;
    let sig = 0;
    const ds: number[] = [];
    for (let k = 0; k < runs; k++) {
      const sa = M.sample(a, n, seed * 1000 + k);
      const sb = M.sample(b, n, seed * 1000 + k + 500000);
      const w = M.welch(sa, sb);
      if (w.p < 0.05) sig++;
      ds.push(w.d);
    }
    ds.sort((x, y) => x - y);
    return { share: sig / runs, lo: ds[Math.floor(0.05 * runs)], hi: ds[Math.floor(0.95 * runs)], runs };
  }, [a, b, n, seed]);
  const full = M.welch(a, b);
  return (
    <div className="panel">
      <label className="field" style={{ maxWidth: 420 }}>
        People (or items) per group in each study: {n}
        <input type="range" min={10} max={300} step={10} value={n} onChange={(e) => setN(+e.target.value)} />
      </label>
      <p className="verdict" role="status">
        If 200 researchers each sampled {n} from “{la}” and {n} from “{lb}”, about <strong>{Math.round(100 * sim.share)}%</strong> would find
        a statistically significant difference (<em>p</em> &lt; .05). Their effect sizes would range from about <em>d</em> ={" "}
        {f(sim.lo, 2)} to {f(sim.hi, 2)} (middle 90%), around the full-data value of <em>d</em> = {f(full.d, 2)}.
      </p>
      <button className="quiet" onClick={() => setSeed(seed + 1)}>
        Run 200 new studies
      </button>
    </div>
  );
}

export default function Groups() {
  const eng = useDataset("english");
  const dat = useDataset("dative");
  const ell = useDataset("ellipse");
  const [ex, setEx] = useState<ExKey>("theme");
  const spec = EXAMPLES[ex];
  const ready = eng.data && dat.data && ell.data;

  const res = useMemo(() => {
    if (!ready) return null;
    const gr = groupsFor(ex, eng.data!, dat.data!, ell.data!);
    if (spec.design === "paired") {
      const p = M.paired(gr.a, gr.b);
      return { gr, paired: p, welch: null };
    }
    return { gr, paired: null, welch: M.welch(gr.a, gr.b) };
  }, [ready, ex, eng.data, dat.data, ell.data, spec.design]);

  const ciOf = (xs: number[]) => {
    const m = M.mean(xs);
    const se = M.sd(xs) / Math.sqrt(xs.length);
    const t = M.tQuantile(0.975, xs.length - 1);
    return { mean: m, lo: m - t * se, hi: m + t * se };
  };
  const digits = ex === "grade" || ex === "theme" ? 2 : 0;

  return (
    <ModuleLayout moduleKey="groups" cutoffs="groups">
      <Section title="In plain words">
        <p>
          Comparing two groups asks two separate questions, and it is worth keeping them apart. <strong>How big is the difference?</strong>{" "}
          That is the <Term id="effect-size">effect size</Term>, here <Term id="cohen-d">Cohen's d</Term>: the difference between the means in
          standard-deviation units. <strong>Could a difference this size be a fluke of sampling?</strong> That is what the{" "}
          <Term id="t-test">t-test</Term> and its <Term id="p-value">p-value</Term> address.
        </p>
        <ul>
          <li>
            <strong>Independent groups</strong> contain different people or items, such as nouns and verbs. Use{" "}
            <Term id="welch">Welch's t-test</Term>.
          </li>
          <li>
            <strong>Paired measurements</strong> come from the same people or items measured twice, such as the same word read by young and
            older adults. Use the <Term id="paired-t">paired t-test</Term>, which compares each pair directly and is far more sensitive.
          </li>
        </ul>
      </Section>

      <Section title="Try it: four real comparisons">
        {(eng.error || dat.error || ell.error) && <p className="error">{eng.error ?? dat.error ?? ell.error}</p>}
        <div className="chips" role="group" aria-label="Choose a comparison">
          {(Object.keys(EXAMPLES) as ExKey[]).map((k) => (
            <button key={k} className="chip" aria-pressed={ex === k} onClick={() => setEx(k)}>
              {EXAMPLES[k].title}
            </button>
          ))}
        </div>
        <p style={{ maxWidth: "var(--measure)" }}>
          <strong>Question:</strong> {spec.question}{" "}
          <span className="muted">
            ({spec.design === "paired" ? "Paired: the same 2,284 words, read by both age groups." : "Independent groups."})
          </span>
        </p>
        <Guide title="How to read the chart">
          <p>
            The faint dots are individual {ex === "grade" ? "essays" : ex === "theme" ? "clauses" : "words"}. The large dot is each group's
            mean, and the black bar is its 95% <Term id="ci">confidence interval</Term>: the range of means consistent with the data. Look at
            how far apart the means are compared with how spread out the dots are. Hover over a mean for exact values.
          </p>
        </Guide>
        {res && (
          <>
            <MeansPlot
              unit={spec.unit}
              groups={[
                { label: res.gr.la, values: M.sample(res.gr.a, 600, 3), color: BLUE, ...ciOf(res.gr.a) },
                { label: res.gr.lb, values: M.sample(res.gr.b, 600, 4), color: ORANGE, ...ciOf(res.gr.b) },
              ]}
            />
            {res.welch && (
              <>
                <div className="stat-grid">
                  <div className="stat">
                    <div className="value">{f(res.welch.diff, digits)}</div>
                    <div className="label">
                      difference in means, 95% CI [{f(res.welch.ci[0], digits)}, {f(res.welch.ci[1], digits)}]
                    </div>
                  </div>
                  <div className="stat">
                    <div className="value">{f(res.welch.d, 2)}</div>
                    <div className="label">
                      Cohen's d, 95% CI [{f(res.welch.dCi[0], 2)}, {f(res.welch.dCi[1], 2)}]
                    </div>
                  </div>
                  <div className="stat">
                    <div className="value">{f(res.welch.t, 2)}</div>
                    <div className="label">
                      Welch's t ({f(res.welch.df, 1)} df), {pFmt(res.welch.p)}
                    </div>
                  </div>
                  <div className="stat">
                    <div className="value">
                      {res.welch.nA.toLocaleString()} / {res.welch.nB.toLocaleString()}
                    </div>
                    <div className="label">cases per group</div>
                  </div>
                </div>
                <p className="verdict">
                  “{res.gr.la}” averages {f(Math.abs(res.welch.diff), digits)} {res.welch.diff > 0 ? "higher" : "lower"} than “{res.gr.lb}”: a{" "}
                  <strong>{dWord(res.welch.d)}</strong> difference (<em>d</em> = {f(res.welch.d, 2)}; Cohen, 1988),{" "}
                  {res.welch.p < 0.05 ? "and statistically significant" : "and not statistically significant"} ({pFmt(res.welch.p)}).{" "}
                  {ex === "grade" &&
                    "The difference is tiny and runs the opposite way from what many would expect. Significance here comes from the large samples, not from an important difference; and ratings may be judged relative to each grade."}
                  {ex === "theme" &&
                    "Speakers tend to put longer phrases last, a pattern known as end weight: when the theme is long, “gave the student a long book” is preferred to putting it first."}
                  {ex === "nounverb" && "The difference is real but small: about 10 milliseconds, with the two groups overlapping almost completely."}
                </p>
              </>
            )}
            {res.paired && (
              <>
                <div className="stat-grid">
                  <div className="stat">
                    <div className="value">{f(res.paired.diff, 0)} ms</div>
                    <div className="label">
                      mean difference per word, 95% CI [{f(res.paired.ci[0], 0)}, {f(res.paired.ci[1], 0)}]
                    </div>
                  </div>
                  <div className="stat">
                    <div className="value">{f(res.paired.dz, 2)}</div>
                    <div className="label">
                      effect size <em>d</em>
                      <sub>z</sub> (difference ÷ SD of differences)
                    </div>
                  </div>
                  <div className="stat">
                    <div className="value">{f(res.paired.t, 1)}</div>
                    <div className="label">
                      paired t ({res.paired.df.toLocaleString()} df), {pFmt(res.paired.p)}
                    </div>
                  </div>
                  <div className="stat">
                    <div className="value">{res.paired.n.toLocaleString()}</div>
                    <div className="label">pairs of measurements</div>
                  </div>
                </div>
                <p className="verdict">
                  Older adults took on average <strong>{f(res.paired.diff, 0)} ms longer</strong> to recognise the same word, a very large and
                  consistent difference. Because every word is measured in both groups, the paired test compares like with like and removes the
                  large differences between easy and hard words.
                </p>
              </>
            )}
          </>
        )}
      </Section>

      {res?.welch && (
        <Section title="Activity: what sample size does to p-values">
          <p>
            Imagine many researchers each study a small random sample from these same real groups. How often would they find a significant
            difference? Move the slider to change the sample size; the true difference stays the same.
          </p>
          <Simulation a={res.gr.a} b={res.gr.b} la={res.gr.la} lb={res.gr.lb} />
          <Guide title="What to notice">
            <ul>
              <li>
                For the dative example, small studies often miss a real, medium-sized difference. The share of studies that find it is the
                study's <Term id="power">statistical power</Term>.
              </li>
              <li>For nouns and verbs, or grades 8 and 12, the difference is so small that most small studies find nothing, and that is the right answer for most purposes.</li>
              <li>Small studies produce effect sizes scattered widely around the truth. A single small study can badly over- or underestimate an effect.</li>
            </ul>
          </Guide>
        </Section>
      )}

      <Section title="Check your understanding">
        <Quiz
          items={[
            {
              q: "Grade 12 essays score .06 points lower on vocabulary than grade 8 essays, p = .014, d = −.10. What is the best summary?",
              options: ["Grade 12 students have much weaker vocabulary", "A statistically significant but very small difference", "The test is wrong because p < .05"],
              answer: 1,
              why: "With over 2,000 essays, even a tenth of a standard deviation reaches significance. The size tells you the difference is too small to matter for most decisions.",
            },
            {
              q: "You measure 30 students' writing before and after a course. Which test fits?",
              options: ["Welch's t-test", "Paired t-test", "Chi-square test"],
              answer: 1,
              why: "The same students are measured twice, so the measurements are paired.",
            },
            {
              q: "A small study (20 per group) finds p = .30. What can you conclude?",
              options: ["There is no difference", "The study could not rule out zero; it may have been too small to detect a real difference", "The groups are identical"],
              answer: 1,
              why: "A non-significant result is not evidence of no difference, especially in a small study. Look at the confidence interval: if it is wide, the data are consistent with both no effect and a sizeable one.",
            },
          ]}
        />
      </Section>

      <Section title="Reporting it">
        {res?.welch && (
          <p className="report-box">
            {res.gr.la} (<em>M</em> = {f(res.welch.meanA, digits)}) and {res.gr.lb.toLowerCase()} (<em>M</em> = {f(res.welch.meanB, digits)}) differed
            by {f(res.welch.diff, digits)}, 95% CI [{f(res.welch.ci[0], digits)}, {f(res.welch.ci[1], digits)}], Welch's <em>t</em>(
            {f(res.welch.df, 1)}) = {f(res.welch.t, 2)}, {pFmt(res.welch.p)}, <em>d</em> = {f(res.welch.d, 2)}.
          </p>
        )}
        {res?.paired && (
          <p className="report-box">
            Older adults responded more slowly than young adults to the same words (<em>M</em> difference = {f(res.paired.diff, 0)} ms, 95% CI [
            {f(res.paired.ci[0], 0)}, {f(res.paired.ci[1], 0)}]), paired <em>t</em>({res.paired.df}) = {f(res.paired.t, 1)}, {pFmt(res.paired.p)},{" "}
            <em>d</em>
            <sub>z</sub> = {f(res.paired.dz, 2)}.
          </p>
        )}
      </Section>

      <Section title="Do it in R or Python">
        <CodeTabs
          r={`library(languageR); data(dative)
# Welch's t-test (R's default for two independent groups)
t.test(log(LengthOfTheme) ~ RealizationOfRecipient, data = dative)
# Cohen's d: install.packages("effectsize")
effectsize::cohens_d(log(LengthOfTheme) ~ RealizationOfRecipient, data = dative)
# Paired t-test: one row per word, two columns
# t.test(old_rt, young_rt, paired = TRUE)`}
          python={`import numpy as np, pandas as pd
from scipy import stats
d = pd.read_csv("https://raw.githubusercontent.com/ngoconglem/quantitative-methods-lab/main/data/dative.csv")
np_ = np.log(d.loc[d.realization == "NP", "len_theme"])
pp = np.log(d.loc[d.realization == "PP", "len_theme"])
res = stats.ttest_ind(np_, pp, equal_var=False)   # Welch's t-test
print(res, res.confidence_interval())
# paired: stats.ttest_rel(old_rt, young_rt)`}
        />
      </Section>
    </ModuleLayout>
  );
}
