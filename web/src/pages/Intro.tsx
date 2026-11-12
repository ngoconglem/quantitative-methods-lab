import { useMemo, useState } from "react";
import { Pop } from "../components/Guide";
import { REFS } from "../lib/cutoffs";

/* ------------------------------------------------------------------ data */

const YEARS = ["Year 1", "Year 2", "Year 3", "Year 4"];
const YCOL = ["#2a78d6", "#2f8f6f", "#c9821f", "#8a4fa3"];
/** Class (cluster) → year level: 4 + 3 + 2 + 1 classes of 20 students. */
const CLASS_YEAR = [0, 0, 0, 0, 1, 1, 1, 2, 2, 3];

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Person {
  id: number;
  cls: number;
  year: number;
  score: number;
}

const POP: Person[] = (() => {
  const r = rng(7);
  const out: Person[] = [];
  for (let c = 0; c < 10; c++)
    for (let k = 0; k < 20; k++) {
      const y = CLASS_YEAR[c];
      const z = Math.sqrt(-2 * Math.log(r() || 1e-9)) * Math.cos(2 * Math.PI * r());
      out.push({ id: c * 20 + k, cls: c, year: y, score: 55 + 5 * y + 8 * z });
    }
  return out;
})();

const N = 20;

function shuffle<T>(xs: T[], r: () => number) {
  const a = xs.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Method = "srs" | "strat" | "cluster" | "system" | "conv";

function draw(method: Method, seed: number): Set<number> {
  const r = rng(seed);
  const ids = POP.map((p) => p.id);
  if (method === "srs") return new Set(shuffle(ids, r).slice(0, N));
  if (method === "strat") {
    const pick: number[] = [];
    [8, 6, 4, 2].forEach((k, y) => pick.push(...shuffle(POP.filter((p) => p.year === y).map((p) => p.id), r).slice(0, k)));
    return new Set(pick);
  }
  if (method === "cluster") {
    const c = Math.floor(r() * 10);
    return new Set(POP.filter((p) => p.cls === c).map((p) => p.id));
  }
  if (method === "system") {
    const start = Math.floor(r() * 10);
    return new Set(ids.filter((i) => i % 10 === start));
  }
  /* convenience: the two classes nearest the researcher, whoever turns up first */
  return new Set(POP.filter((p) => (p.cls === 0 || p.cls === 1) && p.id % 20 < 10).map((p) => p.id));
}

const METHODS: { key: Method; label: string; how: string; random: boolean }[] = [
  { key: "srs", label: "Simple random", how: "Every student has the same chance; 20 names are drawn from the full list.", random: true },
  { key: "strat", label: "Stratified", how: "The list is split by year level, then students are drawn at random from each year in proportion to its size.", random: true },
  { key: "cluster", label: "Cluster", how: "Whole classes are drawn at random, and everyone in the chosen class takes part. Here one class of 20.", random: true },
  { key: "system", label: "Systematic", how: "Every 10th student on the list, from a random starting point.", random: true },
  { key: "conv", label: "Convenience", how: "The researcher surveys the classes they teach, and whoever is there that day.", random: false },
];

/* ------------------------------------------------------------------ page */

export default function Intro() {
  return (
    <article className="intro-page">
      <p className="module-kicker level-descriptive">Introduction</p>
      <h1>Quantitative research methods: the big picture</h1>
      <p className="lede">
        Quantitative research answers questions with numbers: it measures people, situations or texts, and uses statistics to describe patterns,
        test ideas and judge how far the results might apply beyond the people studied.
      </p>

      <div className="flow" aria-label="The quantitative research process">
        {[
          ["Question", "what you want to know"],
          ["Design", "survey, experiment, correlational"],
          ["Sample", "who takes part"],
          ["Measure", "tests, scales, counts"],
          ["Analyse", "describe, test, model"],
          ["Report", "effect sizes, limits"],
        ].map(([t, s], i) => (
          <div key={t} style={{ display: "contents" }}>
            {i > 0 && <span className="flow-arrow" aria-hidden="true" />}
            <div className="flow-box">
              <strong>{t}</strong>
              <span>{s}</span>
            </div>
          </div>
        ))}
      </div>

      <h2>Research paradigms, briefly</h2>
      <p className="intro-p">
        A paradigm is a set of beliefs about what reality is and how we can know it. It shapes which methods count as good evidence (Guba &amp;
        Lincoln, <Pop label="1994">{REFS.guba1994.full}</Pop>; Creswell &amp; Creswell, <Pop label="2018">{REFS.creswell2018.full}</Pop>).
      </p>
      <table className="theory-table paradigm-table">
        <thead>
          <tr>
            <th>Paradigm</th>
            <th>Reality and knowledge</th>
            <th>Typical methods</th>
            <th>Example question</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Positivism</strong>
            </td>
            <td>Reality can be observed and measured objectively; the aim is general laws.</td>
            <td>Controlled experiments, measurement</td>
            <td>Is reading time a function of word frequency?</td>
          </tr>
          <tr className="hl">
            <td>
              <strong>Postpositivism</strong>
              <span className="small muted"> the usual home of quantitative work</span>
            </td>
            <td>There is a reality to study, but we only know it imperfectly. Evidence supports or weakens a claim; it never proves it.</td>
            <td>Surveys, experiments, statistical tests and models</td>
            <td>Does weekly intercultural contact predict willingness to communicate?</td>
          </tr>
          <tr>
            <td>
              <strong>Interpretivism / constructivism</strong>
            </td>
            <td>Reality is built by people's meanings; the aim is understanding from the inside.</td>
            <td>Interviews, observation, discourse analysis (qualitative)</td>
            <td>How do international students make sense of their first semester?</td>
          </tr>
          <tr>
            <td>
              <strong>Pragmatism</strong>
            </td>
            <td>Use whatever works to answer the question.</td>
            <td>Mixed methods: numbers and words together</td>
            <td>How large is the effect of study abroad, and why does it differ between students?</td>
          </tr>
        </tbody>
      </table>
      <p className="small muted">
        Applied linguistics and education draw on all four; quantitative studies are usually postpositivist in spirit (Dörnyei,{" "}
        <Pop label="2007">{REFS.dornyei2007.full}</Pop>).
      </p>

      <h2>Common quantitative designs</h2>
      <table className="theory-table">
        <thead>
          <tr>
            <th>Design</th>
            <th>What it does</th>
            <th>Can it show cause?</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Descriptive survey</strong></td>
            <td>Describes a group at one time: attitudes, habits, levels.</td>
            <td>No</td>
          </tr>
          <tr>
            <td><strong>Correlational</strong></td>
            <td>Looks at how measures go together, without changing anything.</td>
            <td>No: other factors may explain the link</td>
          </tr>
          <tr>
            <td><strong>Quasi-experiment</strong></td>
            <td>Compares existing groups (classes, schools) given different treatments.</td>
            <td>Partly: groups may differ from the start</td>
          </tr>
          <tr>
            <td><strong>True experiment</strong></td>
            <td>Assigns people to conditions at random, then compares outcomes.</td>
            <td>Yes, within the study's setting</td>
          </tr>
          <tr>
            <td><strong>Longitudinal</strong></td>
            <td>Measures the same people several times.</td>
            <td>Shows change and order in time; cause still needs care</td>
          </tr>
        </tbody>
      </table>

      <h2>Sampling: who takes part</h2>
      <p className="intro-p">
        You rarely study everyone. The sample is the group you actually measure; the population is the larger group you want to say something
        about. How you choose the sample decides how far you can generalise.
      </p>
      <SamplingTree />
      <SamplingSim />
      <table className="theory-table">
        <thead>
          <tr>
            <th>Technique</th>
            <th>Use it when</th>
            <th>Watch out for</th>
          </tr>
        </thead>
        <tbody>
          <tr><td><strong>Simple random</strong></td><td>You have a full list of the population</td><td>Small groups may be missed by chance</td></tr>
          <tr><td><strong>Stratified</strong></td><td>Subgroups (year, gender, school) must be represented</td><td>Needs the subgroup of every person in advance</td></tr>
          <tr><td><strong>Cluster</strong></td><td>People come in natural groups (classes, schools)</td><td>People in a cluster are alike, so you need more of them</td></tr>
          <tr><td><strong>Systematic</strong></td><td>Working down a list is easier than random draws</td><td>A repeating pattern in the list can bias it</td></tr>
          <tr><td><strong>Convenience</strong></td><td>Piloting, or access is very limited</td><td>Results may not generalise; say so</td></tr>
          <tr><td><strong>Purposive</strong></td><td>You need people with specific experience</td><td>Depends on the researcher's judgement</td></tr>
          <tr><td><strong>Snowball</strong></td><td>The group is hard to reach (e.g. heritage speakers)</td><td>Participants recruit people like themselves</td></tr>
          <tr><td><strong>Quota</strong></td><td>You want set numbers per subgroup without a full list</td><td>Matches proportions, but choice within groups is not random</td></tr>
        </tbody>
      </table>
      <p className="small muted">
        Most applied linguistics and education studies use convenience or purposive samples (Etikan et al.,{" "}
        <Pop label="2016">{REFS.etikan2016.full}</Pop>). That is acceptable when you describe the sample fully and limit your claims to similar
        people. How many to recruit is a separate question: see the sample-size activity in <a href="#groups">Two groups</a>.
      </p>

      <h2>Strengths and limitations</h2>
      <div className="two-col sl-cols">
        <div className="sl-box sl-plus">
          <h3>Strengths</h3>
          <ul>
            <li>Large samples, so results can generalise when the sampling is sound</li>
            <li>Precise answers: how big an effect is, and how sure we are</li>
            <li>Others can repeat and check the study</li>
            <li>Tests theories and compares groups fairly</li>
            <li>Efficient: one survey can reach hundreds of people</li>
          </ul>
        </div>
        <div className="sl-box sl-minus">
          <h3>Limitations</h3>
          <ul>
            <li>Only as good as its measures: a poor scale gives poor numbers</li>
            <li>Shows what and how much, less often why</li>
            <li>Fixed answer options can miss what matters to participants</li>
            <li>Correlation is not cause unless the design allows it</li>
            <li>Significance depends on sample size; report effect sizes too</li>
          </ul>
        </div>
      </div>
      <p className="small muted">When the &ldquo;why&rdquo; matters, combine numbers with interviews or open answers (mixed methods).</p>

      <h2>Where next?</h2>
      <div className="level-cards four">
        <a className="level-card level-descriptive" href="#descriptive">
          <strong>Learn step by step</strong>
          <span>Start at Level 1, Descriptive, and work up to modelling.</span>
        </a>
        <a className="level-card level-basic" href="#tests">
          <strong>Choose a test for your study</strong>
          <span>Answer three questions and get the test, fallback and R code.</span>
        </a>
        <a className="level-card level-advanced" href="#start">
          <strong>Take the 15-minute tour</strong>
          <span>Five short activities across the site.</span>
        </a>
        <a className="level-card level-scales" href="#scales">
          <strong>Build a questionnaire</strong>
          <span>From theory and items to a validated scale.</span>
        </a>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ figures */

function SamplingTree() {
  return (
    <div className="tree sampling-tree" aria-label="Types of sampling">
      <div className="st-col">
        <p className="st-head st-prob">Probability sampling</p>
        <p className="small muted">Everyone has a known chance of being chosen. Supports generalising to the population.</p>
        <ul>
          <li>Simple random</li>
          <li>Stratified</li>
          <li>Cluster</li>
          <li>Systematic</li>
        </ul>
      </div>
      <div className="st-col">
        <p className="st-head st-non">Non-probability sampling</p>
        <p className="small muted">The researcher or circumstance decides who takes part. Quicker; generalise with care.</p>
        <ul>
          <li>Convenience</li>
          <li>Purposive</li>
          <li>Snowball</li>
          <li>Quota</li>
        </ul>
      </div>
    </div>
  );
}

function SamplingSim() {
  const [method, setMethod] = useState<Method>("srs");
  const [seed, setSeed] = useState(1);
  const chosen = useMemo(() => draw(method, seed), [method, seed]);
  const m = METHODS.find((x) => x.key === method)!;
  const popShare = YEARS.map((_, y) => POP.filter((p) => p.year === y).length / POP.length);
  const sam = POP.filter((p) => chosen.has(p.id));
  const samShare = YEARS.map((_, y) => sam.filter((p) => p.year === y).length / sam.length);
  const popMean = POP.reduce((a, p) => a + p.score, 0) / POP.length;
  const samMean = sam.reduce((a, p) => a + p.score, 0) / sam.length;

  const cell = 13, gap = 10;
  const W = 5 * (4 * cell) + 4 * gap + 4, H = 2 * (5 * cell) + gap + 4;
  return (
    <figure className="sampling-sim">
      <p className="intro-p" style={{ marginBottom: 6 }}>
        <strong>Try it.</strong> A university department has 200 students in 10 classes. Each class is one year level, and there are more
        first-years than fourth-years. Choose a technique to draw 20 students. <span className="sim-tag">Simulated data</span>
      </p>
      <div className="chips" role="group" aria-label="Sampling technique">
        {METHODS.map((x) => (
          <button key={x.key} className="chip" aria-pressed={x.key === method} onClick={() => setMethod(x.key)}>
            {x.label}
          </button>
        ))}
        {m.random && (
          <button className="button-quiet" onClick={() => setSeed((s) => s + 1)}>
            Draw again
          </button>
        )}
      </div>
      <p className="small" style={{ margin: "6px 0 10px" }}>{m.how}</p>
      <div className="sim-grid">
        <svg viewBox={`0 0 ${W} ${H}`} className="plot" role="img" aria-label={`${sam.length} students chosen by ${m.label.toLowerCase()} sampling`}>
          {Array.from({ length: 10 }, (_, c) => {
            const bx = 2 + (c % 5) * (4 * cell + gap), by = 2 + Math.floor(c / 5) * (5 * cell + gap);
            return <rect key={c} x={bx - 2} y={by - 2} width={4 * cell + 3} height={5 * cell + 3} rx={4} fill="none" stroke="#dde3e8" />;
          })}
          {POP.map((p) => {
            const k = p.id % 20;
            const bx = 2 + (p.cls % 5) * (4 * cell + gap), by = 2 + Math.floor(p.cls / 5) * (5 * cell + gap);
            const on = chosen.has(p.id);
            return (
              <circle
                key={p.id}
                cx={bx + (k % 4) * cell + cell / 2}
                cy={by + Math.floor(k / 4) * cell + cell / 2}
                r={on ? 5 : 3.2}
                fill={YCOL[p.year]}
                fillOpacity={on ? 1 : 0.22}
                stroke={on ? "#fff" : "none"}
                strokeWidth={1.5}
              />
            );
          })}
        </svg>
        <div className="sim-side">
          <p className="small muted" style={{ margin: "0 0 6px" }}>Year levels: population vs sample</p>
          {YEARS.map((y, i) => (
            <div key={y} className="share-row">
              <span className="share-label">
                <span className="swatch" style={{ background: YCOL[i] }} />
                {y}
              </span>
              <div className="share-bars">
                <div className="share-bar pop" style={{ width: `${popShare[i] * 100}%` }} title={`Population ${Math.round(popShare[i] * 100)}%`} />
                <div className="share-bar" style={{ width: `${samShare[i] * 100}%`, background: YCOL[i] }} title={`Sample ${Math.round(samShare[i] * 100)}%`} />
              </div>
              <span className="share-num small">
                {Math.round(popShare[i] * 100)}% / {Math.round(samShare[i] * 100)}%
              </span>
            </div>
          ))}
          <p className="small muted" style={{ margin: "4px 0 12px" }}>Grey: population. Coloured: sample.</p>
          <div className="stat-grid two">
            <div className="stat">
              <div className="value">{popMean.toFixed(1)}</div>
              <div className="label">Population mean English score</div>
            </div>
            <div className="stat">
              <div className="value">{samMean.toFixed(1)}</div>
              <div className="label">Sample mean ({samMean - popMean >= 0 ? "+" : "−"}{Math.abs(samMean - popMean).toFixed(1)})</div>
            </div>
          </div>
        </div>
      </div>
      <figcaption className="small muted">
        Scores rise with year level, so a sample with too many first-years underestimates the department's mean. Click Draw again a few times:
        random methods vary around the true value; convenience sampling misses it every time.
      </figcaption>
    </figure>
  );
}
