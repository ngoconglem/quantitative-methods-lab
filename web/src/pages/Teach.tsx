import { REPO_URL } from "../config";

const PLANS = [
  {
    id: "methods-course",
    title: "A six-week introduction to quantitative methods",
    who: "Undergraduate or postgraduate linguistics, applied linguistics, TESOL or education",
    length: "Six weekly sessions of about 90 minutes",
    outcome:
      "Students can choose an appropriate method for a research question, run it on real language data, interpret effect sizes and confidence intervals as well as p-values, and report results in APA style.",
    steps: [
      ["Week 1", <><a href="#describe">Module 1</a>: describing data. Students write a one-paragraph description of reaction times and argue for mean or median.</>],
      ["Week 2", <><a href="#correlate">Module 2</a>: correlation. Run the guess-the-correlation game as a warm-up; discuss correlation and cause with the essay ratings.</>],
      ["Week 3", <><a href="#groups">Module 3</a>: comparing two groups. Contrast the grade comparison (significant but trivial) with the dative (medium and meaningful); use the sample-size simulation to introduce power.</>],
      ["Week 4", <><a href="#regress">Module 4</a>: linear regression. Pairs build the word-recognition model step by step and explain what happens to frequency when familiarity enters.</>],
      ["Week 5", <><a href="#categorical">Module 5</a>: categorical outcomes. Groups predict the dative form from one factor, then several; link to end weight and information structure.</>],
      ["Week 6", <><a href="#analyse-simulated">Module 6</a>: measurement. Students find the four planted problems in the simulated questionnaire (see the next plan).</>],
    ],
    after: "Each module ends with R and Python code, so a lab-based course can follow every session with the same analysis in software.",
  },
  {
    id: "significance-vs-size",
    title: "Significant is not the same as important",
    who: "Any methods class or research training workshop",
    length: "45 minutes",
    outcome: "Participants can explain why a p-value does not show the size or importance of an effect, and report an effect size with its confidence interval.",
    steps: [
      ["0–10 min", <>Show the grade 8 versus grade 12 comparison in <a href="#groups">Module 3</a>: p = .014. Ask: does grade 12 have weaker vocabulary?</>],
      ["10–25 min", <>Reveal d = −0.10 and the overlapping dots. Then switch to the dative example (d = 0.57) and compare.</>],
      ["25–40 min", <>Run the sample-size simulation for both examples at 20, 50 and 200 per group. Record how often each reaches p &lt; .05.</>],
      ["40–45 min", <>Each participant rewrites a results sentence from their own field to report the effect size and interval first.</>],
    ],
    after: "Reading: Wasserstein and Lazar (2016), The ASA statement on p-values.",
  },
  {
    id: "broken-scale",
    title: "Diagnose a broken scale",
    who: "Research methods seminar, postgraduate or advanced undergraduate",
    length: "60 minutes",
    outcome: "Students can use item statistics, reliability and factor analysis together to find and explain problems in a questionnaire.",
    steps: [
      ["0–10 min", <>Show the home page. Ask: why would one item drag α from .80 to .32? Reveal the fix by reverse-scoring CE4.</>],
      ["10–35 min", <>In pairs, students load the simulated questionnaire on <a href="#analyse-simulated">Analyse</a> without changing anything and work through all five steps. Their task: find the four planted problems and the evidence for each.</>],
      ["35–50 min", <>Pairs report back. For each problem, ask which step revealed it first, and what they would do about it: fix the scoring, revise the wording, or drop the item.</>],
      ["50–60 min", <>Discuss: which problems could a careful reading of the items have caught before any data were collected?</>],
    ],
    after: "The four planted problems are listed in the data notes on the About page, so keep that page off the projector until the end.",
  },
  {
    id: "own-instrument",
    title: "Validating your own questionnaire",
    who: "HDR and honours students, early-career researchers",
    length: "90-minute workshop",
    outcome: "Participants run a first internal-structure analysis of their own instrument and leave with a draft results paragraph and CFA code.",
    steps: [
      ["Before", <>Participants export pilot data as CSV, one row per respondent, item names in the first row, names and IDs removed.</>],
      ["0–20 min", <>Walk through the bfi sample together, stopping at each step to explain the statistic (use the <a href="#learn">Learn</a> page).</>],
      ["20–60 min", <>Participants load their own file, set subscales and reverse-scored items, and work through to the Report step.</>],
      ["60–90 min", <>Peer review in threes: does the number of factors match the theory behind the instrument? Which items need rewording? Copy the lavaan syntax for a confirmatory study on a new sample.</>],
    ],
    after: "Stress that pilot samples are small: treat results as diagnostic and plan a larger confirmatory sample.",
  },
  {
    id: "alpha-demo",
    title: "High alpha is not one construct",
    who: "Lecture demonstration in any measurement or methods course",
    length: "15 minutes",
    outcome: "Students can explain why a high alpha does not show that a scale is unidimensional.",
    steps: [
      ["0–5 min", <>Load bfi on <a href="#analyse">Analyse</a>. In step 1, change every subscale to the same name, for example “All”. In step 3 the 25 items give α = .70.</>],
      ["5–10 min", <>Ask the class whether this is a good scale. Then open step 4: parallel analysis suggests five factors, and the loadings sort the items into five traits.</>],
      ["10–15 min", <>Restore the original subscales and compare each trait's α and ω. Close with the rule: check dimensionality first, then reliability.</>],
    ],
    after: null,
  },
] as const;

export default function Teach() {
  return (
    <>
      <h1>Teach with it</h1>
      <p className="lede">
        The Quantitative Methods Lab is free, needs no login and runs on a projector or students' own laptops. These session plans can be used
        as they are or adapted.
      </p>
      <section className="prose">
        <h2>First time teaching with it?</h2>
        <p>You do not need to be a statistician. Allow about an hour to prepare the first time:</p>
        <ol>
          <li>
            <strong>Work through the module you will teach</strong> with the Guidance switch on, including the activity and the quiz. Each
            module takes 20 to 40 minutes.
          </li>
          <li>
            <strong>For the measurement module, run the simulated questionnaire yourself</strong> on <a href="#analyse-simulated">Analyse</a> with the Guidance switch on.
            Find the four planted problems; the answers are in the data notes on the <a href="#about">About</a> page.
          </li>
          <li>
            <strong>Read “The big picture”</strong> at the top of <a href="#learn">Learn</a>. It is the explanation students need before they
            start.
          </li>
          <li>
            <strong>For the measurement module, learn five terms well enough to explain them</strong>: <a href="#glossary/alpha">Cronbach's alpha</a>,{" "}
            <a href="#glossary/citc">corrected item-total correlation</a>, <a href="#glossary/factor">factor</a>,{" "}
            <a href="#glossary/loading">loading</a> and <a href="#glossary/parallel">parallel analysis</a>. Everything else can be looked up
            during the session.
          </li>
          <li>
            <strong>Check the room.</strong> The site needs no login or installation and works on laptops, tablets and a projector.
          </li>
        </ol>
        <h3>Explaining the big idea in two sentences</h3>
        <p>
          “Statistics describe patterns in data and how sure we can be about them. Every method here answers a plain question, and the first
          job is always to say what that question is.”
        </p>
      </section>

      <ul className="index">
        {PLANS.map((p) => (
          <li key={p.id}>
            <a href="#teach" onClick={(e) => (e.preventDefault(), document.getElementById(p.id)?.scrollIntoView({ behavior: "smooth" }))}>
              <span className="index-title">{p.title}</span>
              <span className="index-desc">{p.who}. {p.length}.</span>
            </a>
          </li>
        ))}
      </ul>
      {PLANS.map((p) => (
        <section key={p.id} id={p.id} className="prose" style={{ scrollMarginTop: 80 }}>
          <h2>{p.title}</h2>
          <p className="muted">{p.who}. {p.length}.</p>
          <p><strong>By the end:</strong> {p.outcome}</p>
          <table>
            <tbody>
              {p.steps.map(([t, what]) => (
                <tr key={t}>
                  <td style={{ width: "7em", color: "var(--ink-2)", whiteSpace: "nowrap" }}>{t}</td>
                  <td>{what}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {p.after && <p style={{ marginTop: 14 }}>{p.after}</p>}
        </section>
      ))}
      <section className="prose">
        <h2>Preparing a file</h2>
        <ul>
          <li>CSV, one row per respondent, one column per item, item names in the first row.</li>
          <li>Numeric responses only for items (for example 1–5). Text columns such as IDs or comments are set aside automatically.</li>
          <li>Blank cells, NA, −99, −999 and 999 are treated as missing.</li>
          <li>Name items with a shared prefix per subscale (SE1, SE2 …) and the lab will group them for you.</li>
        </ul>
        <p>
          Reproduce any analysis in Python with the notebooks in the <a href={`${REPO_URL}/tree/main/notebooks`}>repository</a>.
        </p>
      </section>
    </>
  );
}
