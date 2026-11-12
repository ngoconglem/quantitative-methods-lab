import { REPO_URL, SISTER_URL, notebookUrl } from "../config";

export default function About() {
  return (
    <div className="prose">
      <h1>About the lab</h1>
      <p className="lede">
        The Quantitative Methods Lab is an open resource for quantitative methods in the applied social sciences. Modules at
        four levels (descriptive, basic, advanced, modelling) plus a scale development section explain each method in plain words and let you
        try it on data. It runs entirely in your browser: files you load are read on the
        page and never uploaded.
      </p>

      <h2>Real data</h2>
      <h3>Word recognition times (Describing data, Correlation, Two groups, Multiple regression)</h3>
      <p>
        Mean visual lexical decision times for 2,284 monosyllabic English nouns and verbs, for young and older adults, with written frequency
        (CELEX), familiarity ratings and length. From Balota, Cortese and Pilotti (1999) and Spieler and Balota (1998), analysed in Balota et
        al. (2004), and distributed as <code>english</code> in the languageR R package (Baayen, 2008). Licence: GPL (≥ 2).
      </p>
      <h3>The dative alternation (Two groups, Counting categories, Logistic regression)</h3>
      <p>
        3,263 dative clauses from the Switchboard corpus of spoken American English and the Wall Street Journal, coded for the form of the
        recipient and properties of recipient and theme by Bresnan, Cueni, Nikitina and Baayen (2007). Distributed as <code>dative</code> in
        languageR (Baayen, 2008). Licence: GPL (≥ 2).
      </p>
      <h3>Learner essay ratings (Correlation, Two groups, Three or more groups, Multiple regression)</h3>
      <p>
        Analytic and overall ratings, length and lexical diversity (MTLD) for 3,911 essays by English language learners in US grades 8–12: the
        training set of the ELLIPSE corpus (Crossley et al., 2023). Licence: CC BY 4.0. The corpus also records gender, race/ethnicity and
        socio-economic status; the lab does not use those columns.
      </p>
      <p className="small">
        All three are provided as CSV files in the repository's <code>data</code> folder, built by <code>scripts/prepare_methods_data.py</code>.
      </p>

      <h2>Simulated data</h2>
      <h3>Intercultural competence survey (simulated)</h3>
      <p>
        600 simulated university language learners: time spent abroad (none, short, long), weekly hours of intercultural contact, an English
        test score, 20 intercultural competence items on a 1–5 scale in four dimensions modelled on Byram (1997) (knowledge, attitudes, skills
        of interaction, critical cultural awareness), willingness to communicate, speaking anxiety and whether they applied for an exchange
        programme. It is not real data: it was generated with a fixed seed from a known model by <code>scripts/simulate_intercultural.py</code>,
        so the answers are known. One item (AT5) is deliberately weak and one (SK4) deliberately shared between two dimensions, for teaching. Used
        in Correlation, Three or more groups and Scale development, and labelled as simulated wherever it appears.
      </p>
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

      <h2>Methods for scale development</h2>
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
        Descriptive, basic, advanced and modelling modules: every statistic the browser computes (descriptive statistics, Pearson and Spearman correlations with confidence intervals,
        Welch's and paired t-tests, Cohen's d, linear regression with VIF, chi-square tests, odds ratios and logistic regression) is compared with
        SciPy and statsmodels on the real datasets: 152 comparisons, all matching (<code>tests/check_methods.py</code>). One-way and
        Welch's ANOVA, ω², Kruskal–Wallis and Holm-adjusted pairwise tests are compared with SciPy, pingouin and statsmodels, and the
        confirmatory factor analysis and the structural equation model (χ², fit indices and every standardised estimate) with semopy. Standard
        errors, the indirect effect and its confidence interval are checked against an independent Python fit, and the Bayesian posterior
        against numerical integration: 118 comparisons, all matching (<code>tests/check_advanced.py</code>).
      </p>
      <p>
        Scale development: every psychometric statistic is implemented twice, in the browser and in Python. A test compares the two on both sample
        datasets (42 comparisons, all identical). A second test compares the Python implementation with the independent factor_analyzer
        package: loadings, KMO and Bartlett's test agree exactly.
      </p>
      <ul>
        <li><a href={notebookUrl("01_items_and_reliability.ipynb")}>01_items_and_reliability.ipynb</a></li>
        <li><a href={notebookUrl("02_factorability_and_parallel_analysis.ipynb")}>02_factorability_and_parallel_analysis.ipynb</a></li>
        <li><a href={notebookUrl("03_efa_and_report.ipynb")}>03_efa_and_report.ipynb</a></li>
      </ul>

      <h2>Author</h2>
      <p>
        Built by <a href="https://research.monash.edu/en/persons/cong-ngo/">Dr Cong Ngo</a> (publishing as Ngo Cong-Lem;{" "}
        <a href="https://orcid.org/0000-0002-5257-8264">ORCID 0000-0002-5257-8264</a>), Research Fellow at BehaviourWorks Australia, Monash
        University, whose work includes quantitative modelling of language learning and scale validation in applied linguistics. A sister
        resource, the <a href={SISTER_URL}>Language &amp; AI Literacy Lab</a>, covers linguistic analysis of human and AI writing.
      </p>
      <p className="small">
        Developed with AI coding assistance. Every statistic is checked against SciPy, statsmodels or an independent Python implementation by
        automated tests (see the <code>tests</code> folder in the repository); the choice of methods, data, explanations and interpretations
        are the author's.
      </p>

      <h2>Related research by the author</h2>
      <ul>
        <li>
          Cong-Lem, N. (2025). Scale validation in applied linguistics: Methodological trends and challenges.{" "}
          <em>Research Methods in Applied Linguistics, 4</em>(2), 100217.{" "}
          <a href="https://doi.org/10.1016/j.rmal.2025.100217">doi.org/10.1016/j.rmal.2025.100217</a>
          <br />
          <span className="small muted">Related here: the scale development pages follow the validation steps this review recommends.</span>
        </li>
        <li>
          Cong-Lem, N., &amp; Lee, S. Y. (2020). Exposure to L2 online text on lexical and reading growth. <em>Language Learning &amp; Technology,
          24</em>(3), 87–102.
          <br />
          <span className="small muted">Related here: modelling language-learning outcomes from predictors, as in Multiple regression.</span>
        </li>
        <li>
          Cong-Lem, N., Nguyen, T. T., Nguyen, K. N. H., &amp; Nguyen, Q. N. H. (2026). Development and psychometric validation of a short-form
          critical thinking scale in generative AI contexts (GenAI–CrT). <em>Journal of Educational Technology Development and Exchange, 19</em>
          (1).
          <br />
          <span className="small muted">Related here: the simulated questionnaire in the Questionnaire analyser concerns academic writing with AI.</span>
        </li>
      </ul>

      <h3>How to cite</h3>
      <p className="small">
        Cong-Lem, N. (2026). <em>Quantitative Methods Lab: Plain-language statistics for the applied social sciences</em> (Version 0.4.0)
        [Computer software]. https://quantitative-methods-lab.vercel.app
      </p>
      <p className="small">
        Source code (MIT licence) and notebooks: <a href={REPO_URL}>{REPO_URL.replace("https://", "")}</a>
      </p>
    </div>
  );
}
