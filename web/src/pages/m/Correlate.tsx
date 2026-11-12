import { useMemo, useState } from "react";
import { ModuleLayout, Section, KeyIdea } from "../../components/ModuleLayout";
import { CodeTabs, Quiz, Scatter } from "../../components/plots";
import { Guide, Term } from "../../components/Guide";
import { useDataset, num, str, f, pFmt, type Dataset } from "../../lib/datasets";
import * as M from "../../lib/methods";

interface Pair {
  key: string;
  ds: "english" | "ellipse" | "intercultural";
  label: string;
  x: string;
  y: string;
  xLabel: string;
  yLabel: string;
  get: (d: Dataset, c: string) => number[];
  note: string;
}

const g = (d: Dataset, c: string) => num(d, c);
const gi = (d: Dataset, c: string) => {
  if (c !== "icc") return num(d, c);
  const items = Object.keys(d.columns).filter((k) => /^(KN|AT|SK|AW)\d$/.test(k));
  return num(d, "id").map((_, i) => items.reduce((s, k) => s + (k === "AT2" ? 6 - num(d, k)[i] : num(d, k)[i]), 0) / items.length);
};
const PAIRS: Pair[] = [
  { key: "freq", ds: "english", label: "Word frequency and reaction time", x: "log_freq", y: "log_rt", xLabel: "Word frequency (log)", yLabel: "Reaction time (log ms)", get: g, note: "More frequent words are recognised faster: a classic finding in reading research." },
  { key: "fam", ds: "english", label: "Familiarity and reaction time", x: "familiarity", y: "log_rt", xLabel: "Familiarity rating", yLabel: "Reaction time (log ms)", get: g, note: "Words people rate as more familiar are recognised faster." },
  { key: "len", ds: "english", label: "Word length and reaction time", x: "length", y: "log_rt", xLabel: "Word length (letters)", yLabel: "Reaction time (log ms)", get: g, note: "For these short words (2 to 7 letters), length hardly matters." },
  { key: "freqfam", ds: "english", label: "Word frequency and familiarity", x: "log_freq", y: "familiarity", xLabel: "Word frequency (log)", yLabel: "Familiarity rating", get: g, note: "Two measures of how well-known a word is: they overlap strongly, which matters again in the regression module." },
  { key: "vg", ds: "ellipse", label: "Vocabulary and grammar ratings of learner essays", x: "vocabulary", y: "grammar", xLabel: "Vocabulary rating (1–5)", yLabel: "Grammar rating (1–5)", get: g, note: "Essays rated high on vocabulary tend to be rated high on grammar. Ratings move in half-point steps, so many points sit on top of each other." },
  { key: "mtld", ds: "ellipse", label: "Lexical diversity and overall rating", x: "mtld", y: "overall", xLabel: "Lexical diversity (MTLD)", yLabel: "Overall rating (1–5)", get: g, note: "Essays with more varied vocabulary receive somewhat higher overall ratings." },
  { key: "contact", ds: "intercultural", label: "Intercultural contact and intercultural competence", x: "contact_hours", y: "icc", xLabel: "Weekly hours of contact with people from other cultures", yLabel: "Intercultural competence (1–5)", get: gi, note: "Students with more intercultural contact report higher competence. Contact hours are skewed, so compare Pearson's r with Spearman's rho." },
  { key: "anx", ds: "intercultural", label: "Speaking anxiety and willingness to communicate", x: "anxiety", y: "wtc", xLabel: "Speaking anxiety (1–5)", yLabel: "Willingness to communicate (1–7)", get: gi, note: "A negative correlation: more anxious speakers are less willing to communicate in English." },
  { key: "prof", ds: "intercultural", label: "English proficiency and willingness to communicate", x: "proficiency", y: "wtc", xLabel: "English test score (0–100)", yLabel: "Willingness to communicate (1–7)", get: gi, note: "More proficient students are more willing to communicate, but the cloud is wide: proficiency is far from the whole story." },
  { key: "words", ds: "ellipse", label: "Essay length and overall rating", x: "words", y: "overall", xLabel: "Essay length (words)", yLabel: "Overall rating (1–5)", get: g, note: "Longer essays are rated only slightly higher, and a few very long essays stretch the picture." },
];

function sizeWord(r: number) {
  const a = Math.abs(r);
  return a < 0.1 ? "negligible" : a < 0.3 ? "small" : a < 0.5 ? "medium" : "large";
}

function GuessGame({ eng, ell }: { eng: Dataset; ell: Dataset }) {
  const [round, setRound] = useState(0);
  const [guess, setGuess] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [errors, setErrors] = useState<number[]>([]);
  const POOL = PAIRS.filter((p) => p.ds !== "intercultural");
  const pair = POOL[(round * 3) % POOL.length];
  const ds = pair.ds === "english" ? eng : ell;
  const pts = useMemo(() => {
    const idx = M.sample(
      Array.from({ length: ds.n }, (_, i) => i),
      80,
      1000 + round * 37,
    );
    const xs = pair.get(ds, pair.x);
    const ys = pair.get(ds, pair.y);
    return { x: idx.map((i) => xs[i]), y: idx.map((i) => ys[i]) };
  }, [ds, pair, round]);
  const r = M.pearson(pts.x, pts.y).r;
  return (
    <div className="game">
      <p className="small muted" style={{ marginTop: 0 }}>
        Round {round + 1}. 80 cases drawn at random from real data. The variable names are hidden so you judge the pattern alone.
      </p>
      <Scatter x={pts.x} y={pts.y} xLabel="" yLabel="" height={260} />
      <label className="field" style={{ maxWidth: 420 }}>
        Your guess: r = {f(guess, 2, true)}
        <input type="range" min={-1} max={1} step={0.05} value={guess} disabled={revealed} onChange={(e) => setGuess(+e.target.value)} />
      </label>
      {!revealed ? (
        <button
          onClick={() => {
            setRevealed(true);
            setErrors([...errors, Math.abs(guess - r)]);
          }}
        >
          Check my guess
        </button>
      ) : (
        <>
          <p className="verdict" role="status">
            The correlation is <strong>r = {f(r, 2, true)}</strong>; you were off by {f(Math.abs(guess - r), 2, true)}. These were{" "}
            <em>{pair.label.toLowerCase()}</em>. After {errors.length} round{errors.length === 1 ? "" : "s"}, your average error is{" "}
            {f(M.mean(errors), 2, true)}.
          </p>
          <button
            onClick={() => {
              setRound(round + 1);
              setRevealed(false);
              setGuess(0);
            }}
          >
            Next round
          </button>
        </>
      )}
    </div>
  );
}

export default function Correlate() {
  const eng = useDataset("english");
  const ell = useDataset("ellipse");
  const ic = useDataset("intercultural");
  const [key, setKey] = useState("freq");
  const [group, setGroup] = useState<"all" | "young" | "old">("all");
  const pair = PAIRS.find((p) => p.key === key)!;
  const ds = pair.ds === "english" ? eng.data : pair.ds === "ellipse" ? ell.data : ic.data;

  const res = useMemo(() => {
    if (!ds) return null;
    const xs = pair.get(ds, pair.x);
    const ys = pair.get(ds, pair.y);
    let rows = Array.from({ length: ds.n }, (_, i) => i);
    if (pair.ds === "english" && group !== "all") {
      const age = str(ds, "age");
      rows = rows.filter((i) => age[i] === group);
    }
    const x = rows.map((i) => xs[i]);
    const y = rows.map((i) => ys[i]);
    const c = M.pearson(x, y);
    const s = M.spearman(x, y);
    const fit = M.ols([x], ["x"], y);
    const shown = M.sample(rows, 900, 7);
    return { c, s, line: { a: fit.coef[0], b: fit.coef[1] }, sx: shown.map((i) => xs[i]), sy: shown.map((i) => ys[i]) };
  }, [ds, pair, group]);

  return (
    <ModuleLayout moduleKey="correlate" cutoffs="correlation">
      <KeyIdea
        gist={<>A <Term id="correlation">correlation</Term> (<em>r</em>, from −1 to +1) says how closely two measures move together along a straight line.</>}
        points={[
          ["Size", <>Further from 0 = tighter. <Term id="r-squared">r²</Term> is the shared variation: <em>r</em> = .50 means 25%.</>],
          ["Uncertainty", <>Report the <Term id="ci">95% CI</Term>. The <Term id="p-value">p-value</Term> only asks whether <em>r</em> could be 0.</>],
          ["Watch out", <>Straight lines only; a few extreme points can sway it; it says nothing about cause. <Term id="spearman">Spearman's rho</Term> uses ranks and resists outliers.</>],
        ]}
      />

      <Section title="Try it: explore real relationships">
        {(eng.error || ell.error) && <p className="error">{eng.error ?? ell.error}</p>}
        <div className="controls">
          <label className="field">
            Relationship
            <select value={key} onChange={(e) => setKey(e.target.value)}>
              <optgroup label="Word recognition (Balota et al., 2004)">
                {PAIRS.filter((p) => p.ds === "english").map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Learner essays (ELLIPSE corpus)">
                {PAIRS.filter((p) => p.ds === "ellipse").map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Intercultural survey (simulated)">
                {PAIRS.filter((p) => p.ds === "intercultural").map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </optgroup>
            </select>
          </label>
          {pair.ds === "english" && (
            <label className="field">
              Readers
              <select value={group} onChange={(e) => setGroup(e.target.value as typeof group)}>
                <option value="all">Both age groups</option>
                <option value="young">Young adults</option>
                <option value="old">Older adults</option>
              </select>
            </label>
          )}
        </div>
        <Guide title="How to read the scatter plot">
          <p>
            Each dot is one {pair.ds === "english" ? "word (for one age group)" : "essay"}; up to 900 are drawn so the picture stays readable,
            but every statistic uses all cases. The orange line is the straight line that fits best. The more tightly the dots hug it, the
            larger <em>r</em>. Dots that run downhill from left to right mean a negative correlation.
          </p>
        </Guide>
        {res && (
          <>
            <Scatter x={res.sx} y={res.sy} xLabel={pair.xLabel} yLabel={pair.yLabel} line={res.line} />
            <div className="stat-grid">
              <div className="stat">
                <div className="value">{f(res.c.r, 2, true)}</div>
                <div className="label">Pearson's r, 95% CI [{f(res.c.ci[0], 2, true)}, {f(res.c.ci[1], 2, true)}]</div>
              </div>
              <div className="stat">
                <div className="value">{Math.round(100 * res.c.r ** 2)}%</div>
                <div className="label">shared variation (r²)</div>
              </div>
              <div className="stat">
                <div className="value">{f(res.s.rho, 2, true)}</div>
                <div className="label">Spearman's rho</div>
              </div>
              <div className="stat">
                <div className="value">{res.c.n.toLocaleString()}</div>
                <div className="label">cases; {pFmt(res.c.p)}</div>
              </div>
            </div>
            <p className="verdict">
              {pair.ds === "intercultural" && <span className="sim-tag" style={{ marginRight: 8 }}>Simulated data</span>}A{" "}
              <strong>{sizeWord(res.c.r)}</strong>, {res.c.r < 0 ? "negative" : "positive"} correlation (Cohen, 1988). {pair.note} The two
              measures share about {Math.round(100 * res.c.r ** 2)}% of their variation, so {100 - Math.round(100 * res.c.r ** 2)}% is down to
              other things. {res.c.n > 1000 && "With this many cases even a tiny correlation is statistically significant, so the size matters more than the p-value."}
            </p>
          </>
        )}
        <Guide title="Try this">
          <ol>
            <li>Compare word frequency and familiarity as predictors of reaction time. Which is stronger? Then look at how they relate to each other.</li>
            <li>Switch to word length. A correlation near zero does not mean length never matters: these words are all 2 to 7 letters long.</li>
            <li>
              Look at essay length and overall rating. Compare Pearson's <em>r</em> with Spearman's rho, which is less affected by the few very
              long essays.
            </li>
            <li>Ask of every pair: could something else explain the relationship? Correlation shows that measures go together, not why.</li>
          </ol>
        </Guide>
      </Section>

      <Section title="Activity: guess the correlation">
        <p>
          Researchers often misjudge correlations by eye. Each round shows 80 cases drawn from one of the relationships above. Guess <em>r</em>,
          check, and see whether your eye improves.
        </p>
        {eng.data && ell.data && <GuessGame eng={eng.data} ell={ell.data} />}
      </Section>

      <Section title="Check your understanding">
        <Quiz
          items={[
            {
              q: "Word frequency and reaction time correlate at about r = −.43. What does the minus sign mean?",
              options: ["The correlation is weak", "More frequent words take less time to recognise", "The result is not significant"],
              answer: 1,
              why: "The sign gives the direction: as frequency goes up, reaction time goes down. The size (.43) tells you the strength.",
            },
            {
              q: "A correlation of r = .30 means the two measures share about how much of their variation?",
              options: ["30%", "9%", "60%"],
              answer: 1,
              why: "Square r: .30 × .30 = .09, or 9%. That is why a 'medium' correlation still leaves most of the variation unexplained.",
            },
            {
              q: "Essays with more varied vocabulary get higher overall ratings (r ≈ .36). Can we conclude that teaching varied vocabulary will raise ratings?",
              options: ["Yes, the correlation shows it", "No, a correlation does not show cause and effect", "Only if p < .05"],
              answer: 1,
              why: "Both could reflect overall proficiency, or raters might reward variety for its own sake. An experiment, or at least controlling for other factors, is needed to argue cause.",
            },
          ]}
        />
      </Section>

      <Section title="Reporting it">
        {res && (
          <p className="report-box">
            {pair.label} were {res.c.r < 0 ? "negatively" : "positively"} correlated, <em>r</em>({res.c.df.toLocaleString()}) ={" "}
            {f(res.c.r, 2, true)}, 95% CI [{f(res.c.ci[0], 2, true)}, {f(res.c.ci[1], 2, true)}], {pFmt(res.c.p)}.
          </p>
        )}
        <p className="small muted">The number in brackets after r is its degrees of freedom: the number of cases minus 2.</p>
      </Section>

      <Section title="Do it in R or Python" folded>
        <CodeTabs
          r={`library(languageR); data(english)
cor.test(english$WrittenFrequency, english$RTlexdec)                      # Pearson r, CI and p
cor.test(english$WrittenFrequency, english$RTlexdec, method = "spearman") # Spearman's rho
plot(english$WrittenFrequency, english$RTlexdec)`}
          python={`import pandas as pd
from scipy import stats
df = pd.read_csv("https://raw.githubusercontent.com/ngoconglem/quantitative-methods-lab/main/data/english.csv")
res = stats.pearsonr(df["log_freq"], df["log_rt"])
print(res.statistic, res.pvalue, res.confidence_interval())
print(stats.spearmanr(df["log_freq"], df["log_rt"]))`}
        />
      </Section>
    </ModuleLayout>
  );
}
