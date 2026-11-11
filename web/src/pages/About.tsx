import { REPO_URL, SISTER_URL, notebookUrl } from "../config";

export default function About() {
  return (
    <div className="prose">
      <h1>About the lab</h1>
      <p className="lede">
        The Scale Validation Lab is an open teaching and research resource for examining the internal structure of questionnaires. It runs
        entirely in your browser: files you load are read on the page and never uploaded.
      </p>

      <h2>Sample data</h2>
      <h3>Academic Writing with AI questionnaire (simulated)</h3>
      <p>
        Fifteen items in three subscales (writing self-efficacy, critical evaluation of AI output, dependence on AI), 320 simulated respondents
        on a 1–5 scale, generated with a fixed seed (2026) from a known three-factor model with correlated factors. It is not real data. Four
        problems were planted for learners to find:
      </p>
      <details>
        <summary>Show the planted problems</summary>
        <ul>
          <li>CE4 is reverse-worded and has not been recoded in the file.</li>
          <li>SE5 is a weak item (true loading .20).</li>
          <li>DA4 also loads negatively on writing self-efficacy (a cross-loading).</li>
          <li>About 2% of responses are missing at random, so listwise deletion keeps 243 of 320 respondents.</li>
        </ul>
      </details>
      <h3>Big Five Inventory items (bfi)</h3>
      <p>
        Responses from 2,800 people to 25 personality items on a 1–6 scale, collected by the SAPA project and distributed in the psychTools R
        package (Revelle). Licence: GPL (≥ 2). The item wordings come from the International Personality Item Pool, which is in the public
        domain.
      </p>

      <h2>Methods</h2>
      <ul>
        <li>Reliability: Cronbach's α with Feldt's (1965) 95% confidence interval; McDonald's ω total from a one-factor principal axis solution; corrected item-total correlations; α if item deleted.</li>
        <li>Factorability: Kaiser–Meyer–Olkin measure (overall and per item) and Bartlett's test of sphericity.</li>
        <li>Number of factors: Horn's parallel analysis on principal-component eigenvalues, 95th percentile, fixed seed.</li>
        <li>Extraction: iterated principal axis factoring from squared multiple correlations.</li>
        <li>Rotation: direct oblimin (γ = 0) by gradient projection, or varimax with Kaiser normalisation.</li>
        <li>Pearson correlations on complete cases (listwise deletion).</li>
      </ul>

      <h2>How the numbers are checked</h2>
      <p>
        Every statistic is implemented twice, in the browser and in Python. A test compares the two on both sample datasets (42 comparisons, all
        identical). A second test compares the Python implementation with the independent factor_analyzer package: loadings, KMO and Bartlett's
        test agree exactly.
      </p>
      <ul>
        <li><a href={notebookUrl("01_items_and_reliability.ipynb")}>01_items_and_reliability.ipynb</a></li>
        <li><a href={notebookUrl("02_factorability_and_parallel_analysis.ipynb")}>02_factorability_and_parallel_analysis.ipynb</a></li>
        <li><a href={notebookUrl("03_efa_and_report.ipynb")}>03_efa_and_report.ipynb</a></li>
      </ul>

      <h2>Author</h2>
      <p>
        Built by <a href="https://research.monash.edu/en/persons/cong-ngo/">Dr Cong Ngo</a>, Research Fellow at BehaviourWorks Australia,
        Monash University, whose work includes scale development and validation in applied linguistics and education. A sister resource, the{" "}
        <a href={SISTER_URL}>Language &amp; AI Literacy Lab</a>, covers linguistic analysis of human and AI writing.
      </p>
      <h3>How to cite</h3>
      <p className="small">Ngo, C. (2026). <em>Scale Validation Lab: Open psychometrics for questionnaire research</em> [Computer software]. {REPO_URL}</p>
      <p className="small">
        Source code (MIT licence) and notebooks: <a href={REPO_URL}>{REPO_URL.replace("https://", "")}</a>
      </p>
    </div>
  );
}
