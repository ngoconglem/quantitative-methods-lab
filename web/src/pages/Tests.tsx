import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Term, Pop } from "../components/Guide";
import { BLUE, ORANGE } from "../components/plots";
import { useDataset, num } from "../lib/datasets";
import { describe, normQuantile } from "../lib/methods";
import { REFS } from "../lib/cutoffs";

/* ------------------------------------------------------------------ the map */

type Aim = "compare" | "relate" | "predict" | "agree";
type Scale = "continuous" | "ordinal" | "binary" | "categories" | "count";
interface Rec {
  test: ReactNode;
  ifNot?: ReactNode;
  size: ReactNode;
  r: string;
  module?: [string, string];
}

const SCALE_LABEL: Record<Scale, string> = {
  continuous: "A score or measurement",
  ordinal: "Ordered categories or a single rating item",
  binary: "Two categories (yes/no, form A/B)",
  categories: "Three or more unordered categories",
  count: "A count (errors, words)",
};

const DESIGNS = {
  ind2: "Two independent groups",
  rel2: "Same people or items, twice",
  ind3: "Three or more independent groups",
  rel3: "Same people or items, three or more times",
} as const;
type Design = keyof typeof DESIGNS;

const mixedNote = (
  <>
    With several items per participant (the usual case in language experiments), use a <Term id="mixed-model">mixed-effects model</Term> with
    participants and items as random effects.
  </>
);

const COMPARE: Record<Design, Partial<Record<Scale, Rec>>> = {
  ind2: {
    continuous: {
      test: <Term id="welch">Welch's t-test</Term>,
      ifNot: <><Term id="mann-whitney">Mann–Whitney U</Term>, Yuen's <Term id="trimmed-mean">trimmed-means</Term> test, or a <Term id="bootstrap">bootstrap</Term> CI</>,
      size: <><Term id="cohen-d">Cohen's d</Term> (Hedges' g for small samples)</>,
      r: "t.test(score ~ group, data = d)",
      module: ["#groups", "Two groups"],
    },
    ordinal: {
      test: <Term id="mann-whitney">Mann–Whitney U</Term>,
      ifNot: <><Term id="ordinal-regression">Ordinal regression</Term> to add covariates</>,
      size: "Rank-biserial r or Cliff's delta",
      r: "wilcox.test(rating ~ group, data = d)",
    },
    binary: {
      test: <><Term id="chi-square-test">Chi-square test</Term> (2 × 2)</>,
      ifNot: "Fisher's exact test when an expected count is below 5",
      size: <><Term id="odds-ratio">Odds ratio</Term> or phi</>,
      r: "chisq.test(table(d$group, d$choice), correct = FALSE)",
      module: ["#chisquare", "Counting categories"],
    },
    categories: {
      test: <><Term id="chi-square-test">Chi-square test</Term> of independence</>,
      ifNot: "Fisher's exact test (or simulated p) with small expected counts",
      size: <Term id="cramer-v">Cramér's V</Term>,
      r: "chisq.test(table(d$group, d$category))",
      module: ["#chisquare", "Counting categories"],
    },
    count: {
      test: <Term id="poisson">Negative binomial regression</Term>,
      ifNot: "Poisson regression if the variance is close to the mean",
      size: "Rate ratio",
      r: "MASS::glm.nb(errors ~ group + offset(log(words)), data = d)",
    },
  },
  rel2: {
    continuous: {
      test: <Term id="paired-t">Paired t-test</Term>,
      ifNot: <><Term id="wilcoxon">Wilcoxon signed-rank</Term> or a <Term id="bootstrap">bootstrap</Term> CI of the differences</>,
      size: <><em>d</em><sub>z</sub> (or <em>d</em><sub>av</sub> to compare with between-group studies)</>,
      r: "t.test(d$post, d$pre, paired = TRUE)",
      module: ["#groups", "Two groups"],
    },
    ordinal: { test: <Term id="wilcoxon">Wilcoxon signed-rank</Term>, ifNot: "Sign test if differences cannot be ranked", size: "Matched-pairs rank-biserial r", r: "wilcox.test(d$post, d$pre, paired = TRUE)" },
    binary: { test: "McNemar's test", ifNot: "Exact McNemar (binomial) test with few changes", size: "Odds ratio of the discordant pairs", r: "mcnemar.test(table(d$before, d$after))" },
    categories: { test: "Stuart–Maxwell test", size: "Proportions that changed", r: "DescTools::StuartMaxwellTest(table(d$before, d$after))" },
    count: { test: <>Poisson or negative binomial <Term id="mixed-model">mixed model</Term></>, size: "Rate ratio", r: "lme4::glmer(errors ~ time + (1 | id), family = poisson, data = d)" },
  },
  ind3: {
    continuous: {
      test: <>Welch's <Term id="anova">ANOVA</Term>, then Games–Howell comparisons</>,
      ifNot: <><Term id="kruskal">Kruskal–Wallis</Term>, then Dunn's tests</>,
      size: <>ω² or η²</>,
      r: "oneway.test(score ~ group, data = d)",
      module: ["#anova", "Three or more groups"],
    },
    ordinal: { test: <Term id="kruskal">Kruskal–Wallis</Term>, ifNot: <><Term id="ordinal-regression">Ordinal regression</Term></>, size: "ε² (rank epsilon squared)", r: "kruskal.test(rating ~ group, data = d)" },
    binary: { test: <><Term id="chi-square-test">Chi-square test</Term> (k × 2)</>, ifNot: <><Term id="logistic">Logistic regression</Term> to add covariates</>, size: <Term id="cramer-v">Cramér's V</Term>, r: "chisq.test(table(d$group, d$choice))", module: ["#chisquare", "Counting categories"] },
    categories: { test: <><Term id="chi-square-test">Chi-square test</Term> (r × c)</>, ifNot: "Multinomial logistic regression", size: <Term id="cramer-v">Cramér's V</Term>, r: "chisq.test(table(d$group, d$category))" },
    count: { test: <Term id="poisson">Negative binomial regression</Term>, size: "Rate ratios", r: "MASS::glm.nb(errors ~ group, data = d)" },
  },
  rel3: {
    continuous: {
      test: <><Term id="mixed-model">Linear mixed-effects model</Term> (or repeated-measures ANOVA with the Greenhouse–Geisser correction)</>,
      ifNot: "Friedman test; or the mixed model on log values",
      size: "Generalised η², or model coefficients in raw units",
      r: "lme4::lmer(score ~ time + (1 | id), data = d)",
    },
    ordinal: { test: "Friedman test", ifNot: <>Cumulative-link <Term id="mixed-model">mixed model</Term> (ordinal::clmm)</>, size: "Kendall's W", r: "friedman.test(rating ~ time | id, data = d)" },
    binary: { test: <>Mixed-effects <Term id="logistic">logistic regression</Term></>, ifNot: "Cochran's Q", size: "Odds ratios", r: "lme4::glmer(correct ~ time + (1 | id), family = binomial, data = d)" },
    categories: { test: "Multinomial mixed model", size: "Odds ratios", r: "brms or mclogit packages" },
    count: { test: <>Poisson or negative binomial <Term id="mixed-model">mixed model</Term></>, size: "Rate ratios", r: "glmmTMB::glmmTMB(errors ~ time + (1 | id), family = nbinom2, data = d)" },
  },
};

const PREDICT: Partial<Record<Scale, Rec>> = {
  continuous: { test: <Term id="regression">Linear regression</Term>, ifNot: "Log-transform a skewed outcome, use robust (HC3) standard errors, or bootstrap", size: <>Coefficients in raw units, <Term id="r-squared">R²</Term></>, r: "lm(score ~ x1 + x2, data = d)", module: ["#regress", "Multiple regression"] },
  ordinal: { test: <Term id="ordinal-regression">Ordinal regression</Term>, size: "Odds ratios", r: "ordinal::clm(factor(rating, ordered = TRUE) ~ x1 + x2, data = d)" },
  binary: { test: <Term id="logistic">Logistic regression</Term>, size: <><Term id="odds-ratio">Odds ratios</Term>, McFadden R²</>, r: "glm(choice ~ x1 + x2, family = binomial, data = d)", module: ["#logistic", "Logistic regression"] },
  categories: { test: "Multinomial logistic regression", size: "Odds ratios against a reference category", r: "nnet::multinom(category ~ x1 + x2, data = d)" },
  count: { test: <Term id="poisson">Negative binomial regression</Term>, ifNot: "Poisson if the variance is close to the mean", size: "Rate ratios", r: "MASS::glm.nb(errors ~ x1 + offset(log(words)), data = d)" },
};

const RELATE: Partial<Record<Scale, Rec>> = {
  continuous: { test: <>Pearson's <Term id="correlation">r</Term></>, ifNot: <><Term id="spearman">Spearman's rho</Term> for outliers or curved but rising patterns</>, size: <><em>r</em> itself (<em>r</em>² = shared variation)</>, r: "cor.test(d$x, d$y)", module: ["#correlate", "Correlation"] },
  ordinal: { test: <><Term id="spearman">Spearman's rho</Term> or Kendall's tau-b</>, size: "rho or tau", r: 'cor.test(d$x, d$y, method = "spearman")', module: ["#correlate", "Correlation"] },
  binary: { test: "Point-biserial r (one binary, one numerical); phi (both binary)", size: "r or phi", r: "cor.test(as.numeric(d$group), d$score)" },
  categories: { test: <><Term id="chi-square-test">Chi-square test</Term> of independence</>, size: <Term id="cramer-v">Cramér's V</Term>, r: "chisq.test(table(d$a, d$b))", module: ["#chisquare", "Counting categories"] },
  count: { test: <><Term id="spearman">Spearman's rho</Term>, or a count regression</>, size: "rho, or rate ratio", r: 'cor.test(d$x, d$errors, method = "spearman")' },
};

const AGREE: Partial<Record<Scale, Rec>> = {
  continuous: { test: <><Term id="icc">Intraclass correlation (ICC)</Term> between raters</>, size: "ICC with 95% CI; name the form, e.g. ICC(2,1)", r: "irr::icc(ratings, model = \"twoway\", type = \"agreement\")" },
  ordinal: { test: <>Weighted <Term id="kappa">Cohen's kappa</Term> (two raters); Krippendorff's alpha (more)</>, size: "kappa or alpha", r: 'irr::kappa2(ratings, weight = "squared")' },
  binary: { test: <><Term id="kappa">Cohen's kappa</Term>; Fleiss' kappa for three or more raters</>, size: "kappa, plus raw % agreement", r: "irr::kappa2(ratings)" },
  categories: { test: <><Term id="kappa">Cohen's kappa</Term>; Fleiss' kappa for three or more raters</>, size: "kappa, plus raw % agreement", r: "irr::kappam.fleiss(ratings)" },
  count: { test: <Term id="icc">ICC</Term>, size: "ICC with 95% CI", r: 'irr::icc(ratings, model = "twoway")' },
};

const AIMS: [Aim, string][] = [
  ["compare", "Compare groups or conditions"],
  ["relate", "See whether two measures go together"],
  ["predict", "Predict an outcome from several variables"],
  ["agree", "Check agreement between raters"],
];

function Picker() {
  const [aim, setAim] = useState<Aim | null>(null);
  const [design, setDesign] = useState<Design | null>(null);
  const [scale, setScale] = useState<Scale | null>(null);
  const rec: Rec | undefined =
    !aim || !scale
      ? undefined
      : aim === "compare"
        ? design
          ? COMPARE[design][scale]
          : undefined
        : { relate: RELATE, predict: PREDICT, agree: AGREE }[aim][scale];
  const scaleQ = aim === "relate" ? "What kind of measures are they?" : aim === "agree" ? "What do the raters give?" : "What kind of outcome do you have?";
  return (
    <div className="chooser" aria-live="polite">
      <p className="chooser-q">1. What do you want to do?</p>
      <div className="chips" role="group">
        {AIMS.map(([k, l]) => (
          <button key={k} className="chip" aria-pressed={aim === k} onClick={() => { setAim(k); setDesign(null); setScale(null); }}>
            {l}
          </button>
        ))}
      </div>
      {aim === "compare" && (
        <>
          <p className="chooser-q">2. Who is in each group or condition?</p>
          <div className="chips" role="group">
            {(Object.keys(DESIGNS) as Design[]).map((k) => (
              <button key={k} className="chip" aria-pressed={design === k} onClick={() => setDesign(k)}>
                {DESIGNS[k]}
              </button>
            ))}
          </div>
        </>
      )}
      {aim && (aim !== "compare" || design) && (
        <>
          <p className="chooser-q">{aim === "compare" ? "3" : "2"}. {scaleQ}</p>
          <div className="chips" role="group">
            {(Object.keys(SCALE_LABEL) as Scale[]).map((k) => (
              <button key={k} className="chip" aria-pressed={scale === k} onClick={() => setScale(k)}>
                {SCALE_LABEL[k]}
              </button>
            ))}
          </div>
        </>
      )}
      {rec && (
        <div className="test-card">
          <dl>
            <div><dt>Use</dt><dd><strong>{rec.test}</strong></dd></div>
            {rec.ifNot && <div><dt>If assumptions fail</dt><dd>{rec.ifNot}</dd></div>}
            <div><dt>Report the size with</dt><dd>{rec.size}</dd></div>
            <div><dt>In R</dt><dd><code>{rec.r}</code></dd></div>
          </dl>
          {aim === "compare" && (design === "rel2" || design === "rel3") && <p className="small muted">{mixedNote}</p>}
          {rec.module && (
            <p className="small">
              Try it with real data in <a href={rec.module[0]}>{rec.module[1]}</a>.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function MapTable() {
  const scales: Scale[] = ["continuous", "ordinal", "binary", "count"];
  const short: Record<Scale, string> = { continuous: "Score", ordinal: "Ordinal", binary: "Two categories", categories: "Categories", count: "Count" };
  const rows: [string, Partial<Record<Scale, Rec>>][] = [
    ...(Object.keys(DESIGNS) as Design[]).map((k) => [`Compare: ${DESIGNS[k].toLowerCase()}`, COMPARE[k]] as [string, Partial<Record<Scale, Rec>>]),
    ["Relate two measures", RELATE],
    ["Predict an outcome", PREDICT],
  ];
  return (
    <div className="table-wrap">
      <table className="test-map">
        <thead>
          <tr>
            <th>Aim and design</th>
            {scales.map((s) => (
              <th key={s}>{short[s]}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, recs]) => (
            <tr key={label}>
              <th scope="row">{label}</th>
              {scales.map((s) => (
                <td key={s}>
                  {recs[s]?.test ?? "—"}
                  {recs[s]?.ifNot && <span className="alt">If not: {recs[s]!.ifNot}</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


/* ------------------------------------------------------------------ decision tree */

const TREE: { root: string; scale: string; leaves: [string, string, string?][] }[] = [
  {
    root: "A score or measurement",
    scale: "interval / ratio",
    leaves: [
      ["2 groups", "Welch's t-test", "#groups"],
      ["3+ groups", "Welch's ANOVA", "#anova"],
      ["Two measures", "Pearson's r", "#correlate"],
      ["Several predictors", "Multiple regression", "#regress"],
      ["Latent variables, mediation", "Structural equation model", "#sem"],
    ],
  },
  {
    root: "Ordered categories or ratings",
    scale: "ordinal",
    leaves: [
      ["2 groups", "Mann–Whitney U"],
      ["3+ groups", "Kruskal–Wallis", "#anova"],
      ["Two measures", "Spearman's rho", "#correlate"],
      ["Several predictors", "Ordinal regression"],
      ["Questionnaire items", "CFA (ordinal estimator)", "#scales"],
    ],
  },
  {
    root: "Categories or a choice",
    scale: "nominal",
    leaves: [
      ["One factor", "Chi-square test", "#chisquare"],
      ["Several factors", "Logistic regression", "#logistic"],
      ["Same people twice", "McNemar's test"],
      ["Raters agree?", "Cohen's kappa"],
      ["Two related categories", "Cramér's V"],
    ],
  },
];

function DecisionTree() {
  return (
    <div className="tree" aria-label="Decision tree: from the kind of outcome to the test">
      <div className="tree-top">What kind of outcome do you have?</div>
      <div className="tree-branches">
        {TREE.map((b) => (
          <div key={b.root} className="tree-branch">
            <div className="tree-node">
              <strong>{b.root}</strong>
              <span>{b.scale}</span>
            </div>
            <ul>
              {b.leaves.map(([when, test, href]) => (
                <li key={when}>
                  <span className="tree-when">{when}</span>
                  {href ? <a href={href}>{test}</a> : <span className="tree-test">{test}</span>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="small muted" style={{ marginTop: 8 }}>
        Linked tests have a module with data to try. Any of these can also be run as a <a href="#bayes">Bayesian model</a>. Repeated measures and
        counts: use the picker below.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ scales */

const SCALES = [
  { id: "nominal", name: "Nominal", ex: "First language; NP vs PP dative", ok: "Counts, percentages, mode", tests: "Chi-square, logistic regression" },
  { id: "ordinal", name: "Ordinal", ex: "CEFR level; one 5-point agree item", ok: "Median, IQR, % per category", tests: "Rank-based tests, ordinal regression" },
  { id: "interval", name: "Interval", ex: "Standardised test score; sum of many rating items", ok: "Mean, SD", tests: "t-test, ANOVA, regression" },
  { id: "ratio", name: "Ratio", ex: "Reaction time; essay length; years of study", ok: "All of the above, plus ratios", tests: "As interval; often log-transform first" },
];

/* ------------------------------------------------------------------ Q–Q demo */

function QQ({ xs, color, label }: { xs: number[]; color: string; label: string }) {
  const W = 300, H = 260, m = { l: 40, r: 10, t: 12, b: 36 };
  const pts = useMemo(() => {
    const s = [...xs].sort((a, b) => a - b);
    const { mean, sd } = describe(s);
    const n = s.length;
    const k = 160;
    return Array.from({ length: k }, (_, j) => {
      const i = Math.round(((j + 0.5) / k) * n - 0.5);
      return { t: normQuantile((i + 0.5) / n), v: (s[i] - mean) / sd };
    });
  }, [xs]);
  const lim = 4;
  const sx = (v: number) => m.l + ((v + lim) / (2 * lim)) * (W - m.l - m.r);
  const sy = (v: number) => H - m.b - ((Math.max(-lim, Math.min(lim, v)) + lim) / (2 * lim)) * (H - m.t - m.b);
  return (
    <figure className="qq">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Q–Q plot: ${label}`}>
        {[-3, -2, -1, 0, 1, 2, 3].map((v) => (
          <g key={v}>
            <line x1={sx(v)} x2={sx(v)} y1={m.t} y2={H - m.b} stroke="#e4e9ec" />
            <line x1={m.l} x2={W - m.r} y1={sy(v)} y2={sy(v)} stroke="#e4e9ec" />
            <text x={sx(v)} y={H - m.b + 14} fontSize={10} textAnchor="middle" fill="#6b7a87">{v}</text>
            <text x={m.l - 6} y={sy(v) + 3} fontSize={10} textAnchor="end" fill="#6b7a87">{v}</text>
          </g>
        ))}
        <line x1={sx(-lim)} y1={sy(-lim)} x2={sx(lim)} y2={sy(lim)} stroke="#1c2b3a" strokeWidth={1.5} strokeDasharray="4 3" />
        {pts.map((p, i) => (
          <circle key={i} cx={sx(p.t)} cy={sy(p.v)} r={3} fill={color} fillOpacity={0.75} />
        ))}
        <text x={(m.l + W - m.r) / 2} y={H - 4} fontSize={11} textAnchor="middle" fill="#475867">Expected if normal (z)</text>
      </svg>
      <figcaption>{label}</figcaption>
    </figure>
  );
}

function NormalityDemo() {
  const { data, error } = useDataset("english");
  const rt = useMemo(() => (data ? num(data, "rt_ms") : []), [data]);
  if (error) return <p className="error">{error}</p>;
  if (!rt.length) return <p className="small muted">Loading 2,284 reaction times…</p>;
  const raw = describe(rt);
  const logd = describe(rt.map(Math.log));
  return (
    <>
      <div className="qq-pair">
        <QQ xs={rt} color={ORANGE} label={`Raw reaction times (skew ${raw.skew.toFixed(2)})`} />
        <QQ xs={rt.map(Math.log)} color={BLUE} label={`Log reaction times (skew ${logd.skew.toFixed(2)})`} />
      </div>
      <p className="small muted">
        Each dot is a slice of the 2,284 word-recognition times used in Describing data. On the left, the dots bend away above the dashed line at the
        right end: a long tail of slow responses. On the log scale they follow the line far more closely.
      </p>
    </>
  );
}

/* ------------------------------------------------------------------ page */

const PAGE_REFS = ["stevens1946", "norman2010", "liddell2018", "lumley2002", "delacre2017", "wilcox2017", "plonsky2014", "baayen2008mixed"];

export default function Tests({ focus }: { focus?: string }) {
  useEffect(() => {
    if (focus) document.getElementById(focus)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [focus]);
  return (
    <article className="tests-page">
      <h1>Which test?</h1>
      <p className="lede">
        Three questions pick the analysis: what you want to know, how your data were collected, and what kind of numbers you have. Underlined
        terms open a short definition.
      </p>

      <h2>The short version</h2>
      <DecisionTree />

      <h2>Find your test</h2>
      <Picker />

      <h2 id="scales">What kind of numbers do you have?</h2>
      <p className="section-lede">
        The scale of measurement decides which summaries mean anything (<Pop label="Stevens, 1946" title="Stevens (1946)">{REFS.stevens1946.full}</Pop>).
      </p>
      <div className="scale-grid">
        {SCALES.map((s) => (
          <div key={s.id} className="scale-card">
            <p className="scale-name">
              <Term id={s.id}>{s.name}</Term>
            </p>
            <p><span className="muted">e.g.</span> {s.ex}</p>
            <p><span className="muted">Summarise with</span> {s.ok}</p>
            <p><span className="muted">Typical tests</span> {s.tests}</p>
          </div>
        ))}
      </div>
      <p className="note">
        <strong>Likert data.</strong> A scale score summed over many items is usually analysed as interval, and parametric tests hold up well
        (<Pop label="Norman, 2010" title="Why sums of Likert items can be treated as interval">Norman reviews decades of simulation evidence that t-tests, ANOVA and correlation are robust to ordinal, non-normal rating data. {REFS.norman2010.full}</Pop>).
        A <em>single</em> item is better modelled as ordinal: treating it as a number can even reverse the order of group means (
        <Pop label="Liddell & Kruschke, 2018" title="The case for ordinal models">They show inflated false positives, missed effects and inverted effects when ordinal ratings are analysed as metric, and recommend ordered-probit or similar models. {REFS.liddell2018.full}</Pop>).
      </p>

      <h2 id="normality">When the data are not normal</h2>
      <ol className="steps-compact">
        <li>
          <strong>Check the right thing.</strong> Tests assume the <Term id="residual">residuals</Term> are roughly normal, not the raw scores, and
          with larger samples the t-test and regression stay valid even for skewed outcomes (
          <Pop label="Lumley et al., 2002" title="Normality matters less than you think">Their simulations show the t-test and linear regression remain valid in large samples whatever the distribution; unequal variances matter more. {REFS.lumley2002.full}</Pop>).
        </li>
        <li>
          <strong>Look, don't just test.</strong> Use a histogram and a <Term id="qq-plot">Q–Q plot</Term>.{" "}
          <Pop label="Why not Shapiro–Wilk?">With large samples it flags trivial departures that do no harm; with small samples it misses large ones that do. A plot shows how much and where.</Pop>
        </li>
        <li>
          <strong>Unequal spreads?</strong> Use Welch's versions by default (
          <Pop label="Delacre et al., 2017" title="Welch by default">{REFS.delacre2017.full}</Pop>).
        </li>
        <li>
          <strong>Then pick a fix that matches the problem:</strong>
        </li>
      </ol>
      <div className="table-wrap">
        <table className="fix-table">
          <thead>
            <tr>
              <th>What you see</th>
              <th>Do this</th>
              <th>Example</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Long right tail (times, durations, frequencies)</td>
              <td><Term id="log-transform">Log-transform</Term>, analyse, report back on the original scale</td>
              <td>Reaction times, below</td>
            </tr>
            <tr>
              <td>A few extreme values, heavy tails</td>
              <td>Robust methods: <Term id="trimmed-mean">trimmed means</Term>, <Term id="bootstrap">bootstrap</Term> CIs (<Pop label="Wilcox, 2017">{REFS.wilcox2017.full}</Pop>)</td>
              <td>Essay lengths with a few very long essays</td>
            </tr>
            <tr>
              <td>Ordinal outcome, or small sample with odd shape</td>
              <td><Term id="nonparametric">Rank-based tests</Term>; they compare typical rank, not means</td>
              <td>CEFR levels across three classes</td>
            </tr>
            <tr>
              <td>Outcome is not a measurement at all</td>
              <td>Model it directly: <Term id="logistic">logistic</Term>, <Term id="poisson">count</Term> or <Term id="ordinal-regression">ordinal</Term> regression</td>
              <td>Correct/incorrect; number of errors; one rating item</td>
            </tr>
            <tr>
              <td>Repeated measures over participants and items</td>
              <td><Term id="mixed-model">Mixed-effects model</Term> (<Pop label="Baayen et al., 2008">{REFS.baayen2008mixed.full}</Pop>)</td>
              <td>Every participant reads every word</td>
            </tr>
          </tbody>
        </table>
      </div>
      <h3>See it: a skewed measure and its log</h3>
      <NormalityDemo />

      <h2>Effect sizes: how big is big?</h2>
      <p className="section-lede">
        Cohen's small, medium and large were meant as a last resort. Compare your effect with others in your area; in L2 research, typical
        effects are larger than Cohen's labels suggest (
        <Pop label="Plonsky & Oswald, 2014">{REFS.plonsky2014.full}</Pop>). Always give the difference in raw units too, such as milliseconds
        or test points.
      </p>

      <h2>Full map</h2>
      <MapTable />
      <p className="small muted">Three or more unordered categories follow the same rows as two categories, with Cramér's V or multinomial models.</p>

      <details className="fold">
        <summary>References</summary>
        <ul className="references">
          {PAGE_REFS.map((k) => (
            <li key={k}>
              {REFS[k].full}{" "}
              {REFS[k].url && (
                <a href={REFS[k].url} target="_blank" rel="noreferrer">
                  {REFS[k].url!.replace("https://", "")}
                </a>
              )}
            </li>
          ))}
        </ul>
      </details>
    </article>
  );
}
