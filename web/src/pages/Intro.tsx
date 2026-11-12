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
        Quantitative research answers questions with numbers. You measure something, such as test scores, opinions on a 1–5 scale or how often a
        word is used, and then use statistics to find patterns and check whether they are likely to be real.
      </p>

      <div className="flow" aria-label="The quantitative research process">
        {[
          ["Question", "what you want to find out"],
          ["Design", "how the study is set up"],
          ["Sample", "who takes part"],
          ["Measure", "tests, questionnaires, counts"],
          ["Analyse", "describe and test"],
          ["Report", "what you found, and its limits"],
        ].map(([t, sub], i) => (
          <div key={t} style={{ display: "contents" }}>
            {i > 0 && <span className="flow-arrow" aria-hidden="true" />}
            <div className="flow-box">
              <strong>{t}</strong>
              <span>{sub}</span>
            </div>
          </div>
        ))}
      </div>

      <h2>The thinking behind it: positivism</h2>
      <p className="intro-p">
        Every kind of research rests on beliefs about what is real and how we can know it. Researchers call these beliefs a <em>paradigm</em>.
        Quantitative research, and everything in this lab, rests on <strong>positivism</strong>: the idea that we learn about the world by
        observing and measuring it carefully, and by testing our ideas against the evidence (Creswell &amp; Creswell,{" "}
        <Pop label="2018">{REFS.creswell2018.full}</Pop>).
      </p>
      <table className="theory-table positivism-table">
        <thead>
          <tr>
            <th>Positivist idea, in plain words</th>
            <th>Where you see it in this lab</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>There is a real world we can observe and measure.</strong> Language ability, attitudes and reading speed show up in what people do and say.</td>
            <td><a href="#describe">Describing data</a>: look at the measurements first</td>
          </tr>
          <tr>
            <td><strong>Turn an idea into a prediction you can test.</strong> This is a hypothesis, such as “students who spend time abroad speak up more”.</td>
            <td><a href="#tests">Which test?</a> matches each kind of question to a test</td>
          </tr>
          <tr>
            <td><strong>Measure carefully, and the same way for everyone.</strong> A poor questionnaire gives poor numbers.</td>
            <td><a href="#scales">Scales</a>: build and check a questionnaire</td>
          </tr>
          <tr>
            <td><strong>Separate real patterns from chance.</strong> Any sample can show a difference by luck alone.</td>
            <td>p-values, confidence intervals and effect sizes in every module</td>
          </tr>
          <tr>
            <td><strong>Learn about many people from some of them.</strong> A well-chosen sample lets you apply results to the wider group.</td>
            <td>The sampling activity below</td>
          </tr>
          <tr>
            <td><strong>Keep the researcher's views out of the result.</strong> Others should be able to check and repeat the work.</td>
            <td>The R and Python code that comes with every module</td>
          </tr>
        </tbody>
      </table>
      <p className="small muted intro-p">
        Today most quantitative researchers add a note of humility: every measure has some error, and one study never proves anything for good.
        That is why this lab reports how big an effect is and how sure we can be, not just “significant or not”.
      </p>

      <h3>How it compares with other paradigms</h3>
      <table className="theory-table paradigm-table">
        <thead>
          <tr>
            <th>Paradigm</th>
            <th>What is real?</th>
            <th>How do we find out?</th>
            <th>Example question</th>
          </tr>
        </thead>
        <tbody>
          <tr className="hl">
            <td><strong>Positivism</strong></td>
            <td>A real world we can measure</td>
            <td>Numbers: tests, questionnaires, experiments</td>
            <td>Does time abroad raise willingness to speak English?</td>
          </tr>
          <tr>
            <td><strong>Interpretivism</strong></td>
            <td>What things mean to people, which differs from person to person</td>
            <td>Words: interviews, observation, close reading</td>
            <td>What is it like to study in a second language?</td>
          </tr>
          <tr>
            <td><strong>Pragmatism</strong></td>
            <td>Whatever helps answer the question</td>
            <td>Both numbers and words (mixed methods)</td>
            <td>How much does time abroad help, and why more for some students?</td>
          </tr>
        </tbody>
      </table>

      <h2>Common study designs</h2>
      <table className="theory-table">
        <thead>
          <tr>
            <th>Design</th>
            <th>What it does</th>
            <th>Can it show that A causes B?</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Survey</strong></td>
            <td>Describes a group at one point in time.</td>
            <td>No</td>
          </tr>
          <tr>
            <td><strong>Correlational</strong></td>
            <td>Checks whether two measures go together, without changing anything.</td>
            <td>No: something else may explain the link</td>
          </tr>
          <tr>
            <td><strong>Quasi-experiment</strong></td>
            <td>Compares groups that already exist, such as two classes taught differently.</td>
            <td>Partly: the groups may have differed from the start</td>
          </tr>
          <tr>
            <td><strong>Experiment</strong></td>
            <td>Puts people into groups by chance (like a coin toss), then compares them.</td>
            <td>Yes</td>
          </tr>
          <tr>
            <td><strong>Longitudinal</strong></td>
            <td>Measures the same people several times.</td>
            <td>Shows change over time; cause still needs care</td>
          </tr>
        </tbody>
      </table>

      <h2>Sampling: who takes part</h2>
      <p className="intro-p">
        You can rarely study everyone. The <strong>population</strong> is the whole group you care about, such as all language students at a
        university. The <strong>sample</strong> is the smaller group you actually study. How you choose the sample decides whether your results
        apply to everyone else.
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
          <tr><td><strong>Cluster</strong></td><td>People come in ready-made groups (classes, schools)</td><td>People in one group tend to be alike, so you need more groups</td></tr>
          <tr><td><strong>Systematic</strong></td><td>Working down a list is easier than random draws</td><td>A repeating pattern in the list can bias it</td></tr>
          <tr><td><strong>Convenience</strong></td><td>Piloting, or access is very limited</td><td>Results may not generalise; say so</td></tr>
          <tr><td><strong>Purposive</strong></td><td>You need people with specific experience</td><td>Depends on the researcher's judgement</td></tr>
          <tr><td><strong>Snowball</strong></td><td>The group is hard to reach (e.g. heritage speakers)</td><td>Participants recruit people like themselves</td></tr>
          <tr><td><strong>Quota</strong></td><td>You want set numbers per subgroup without a full list</td><td>Matches proportions, but choice within groups is not random</td></tr>
        </tbody>
      </table>
      <p className="small muted">
        Most studies in education and linguistics use convenience or purposive samples (Etikan et al.,{" "}
        <Pop label="2016">{REFS.etikan2016.full}</Pop>). That is fine if you describe who took part and only claim results for similar people.
        For how many people you need, see the sample-size activity in <a href="#groups">Two groups</a>.
      </p>

      <h2>Strengths and limitations</h2>
      <div className="two-col sl-cols">
        <div className="sl-box sl-plus">
          <h3>Strengths</h3>
          <ul>
            <li>Can study many people, so results can apply to a wider group</li>
            <li>Gives clear answers: how big a difference is, and how sure we can be</li>
            <li>Others can repeat the study and check it</li>
            <li>Tests ideas and compares groups fairly</li>
            <li>Quick to reach many people, for example with one online survey</li>
          </ul>
        </div>
        <div className="sl-box sl-minus">
          <h3>Limitations</h3>
          <ul>
            <li>Only as good as its measures: a poor questionnaire gives poor numbers</li>
            <li>Shows what happens and how much, but rarely why</li>
            <li>Fixed answer options can miss what matters to people</li>
            <li>Two things going together does not mean one causes the other</li>
            <li>“Significant” depends on sample size, so always say how big the effect is</li>
          </ul>
        </div>
      </div>
      <p className="small muted">When the “why” matters, add interviews or open-ended questions (mixed methods).</p>

      <h2>Where next?</h2>
      <div className="level-cards three">
        <a className="level-card level-descriptive" href="#descriptive">
          <strong>Learn step by step</strong>
          <span>Start at Level 1 and work up, one module at a time.</span>
        </a>
        <a className="level-card level-basic" href="#tests">
          <strong>Choose a test for your study</strong>
          <span>Answer three questions about your study to find the right test.</span>
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
        <p className="small muted">Chance decides who is chosen. Results can be applied to the whole group.</p>
        <ul>
          <li>Simple random</li>
          <li>Stratified</li>
          <li>Cluster</li>
          <li>Systematic</li>
        </ul>
      </div>
      <div className="st-col">
        <p className="st-head st-non">Non-probability sampling</p>
        <p className="small muted">The researcher, or whoever is available, decides. Quicker, but results may not apply to everyone.</p>
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
        <strong>Try it.</strong> A department has 200 students in 10 classes, with more first-years than fourth-years. Pick a way to choose 20
        of them, and see how well the 20 represent the whole department. <span className="sim-tag">Simulated data</span>
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
        Older students score higher, so a sample with too many first-years makes the department look weaker than it is. Click Draw again a few
        times: chance-based methods land close to the true average; convenience sampling misses it every time.
      </figcaption>
    </figure>
  );
}
