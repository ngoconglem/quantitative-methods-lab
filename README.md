# Quantitative Methods Lab

**Plain-language statistics for the applied social sciences, with interactive activities on real and simulated data.**

**Live site: https://quant-methods-lab.vercel.app** (previously scale-validation-lab.vercel.app, which redirects here)

The Quantitative Methods Lab is a free, browser-based guide to the statistics most often used in the applied social sciences (education, linguistics, psychology, communication and related fields). Each module explains one method in plain words, lets you try it on a real published dataset, checks understanding with a short quiz, writes an APA-style reporting sentence from your results, and gives the equivalent R and Python code. The Scale development section ends with a questionnaire-validation tool that works on your own CSV file; files are read in the browser and never uploaded.

## Modules, by level

The site opens with an **Introduction** to quantitative research (paradigms, common designs, sampling techniques with an interactive sampling simulation, strengths and limitations). Each level has its own page in the main menu, and a dismissible "How to use this site" box guides first-time visitors.

| Level | Module | Real or simulated data | Activities |
|---|---|---|---|
| **Descriptive** | Describing data | Word recognition times (Balota et al., 2004) | Histogram on raw or log scale; mean, median, SD, IQR, skew; which chart for which data |
| **Basic** | Correlation | Word frequency and reading speed; ELLIPSE essay ratings; intercultural contact (simulated) | Pearson and Spearman with CIs; guess-the-correlation game |
| | Two groups | Young and older readers; the dative; ELLIPSE grades | Welch and paired t-tests, Cohen's d; 200-study sample-size simulation |
| | Counting categories | The dative alternation (Bresnan et al., 2007) | Chi-square, Cramér's V, odds ratios, expected counts |
| **Advanced** | Three or more groups | ELLIPSE essays by grade; time abroad (simulated) | Welch's ANOVA, ω², Kruskal–Wallis, Holm-adjusted pairs; false-alarm chart |
| | Multiple regression | Word recognition times; ELLIPSE ratings | Build a model; coefficients in plain words; VIF; prediction; residuals |
| | Structural equation modelling | Contact, intercultural competence and willingness to communicate (simulated) | Latent factor plus mediation; path diagram with live coefficients; indirect effect with CI; fit indices |
| | Bayesian modelling | Time abroad (simulated); ELLIPSE grades | Prior, likelihood and posterior chart; prior presets and sliders; credible interval, P(effect > 0), Bayes factor |
| **Modelling** | Logistic regression | The dative alternation | Odds ratios with other factors held constant; probability curve |
| **Scale development** | From items to a validated scale | Intercultural competence survey (simulated) | Workflow diagram; parallel analysis; EFA loading heat map (half A); CFA with fit table, path diagram, CR and AVE (half B) |
| | Questionnaire analyser | Your own CSV, or two sample questionnaires | Item screening, alpha and omega, KMO, parallel analysis, EFA, APA paragraph, lavaan code |

Also: **Which test?** (decision tree; a picker by aim, design and scale of measurement with fallbacks, effect sizes and R code; what to do when data are not normal, with Q–Q plots of real reaction times), an **Introduction** to quantitative research, plain-language definitions of every term, every cut-off value with its source.

## Data

| Dataset | Used in | Source | Licence |
|---|---|---|---|
| `english` | Describing data, Correlation, Two groups, Multiple regression | Visual lexical decision and naming latencies for 2,284 monosyllabic English words, young and older adults (Balota et al., 2004), from the languageR R package (Baayen, 2008) | GPL (>= 2) |
| `dative` | Two groups, Counting categories, Logistic regression | 3,263 dative clauses from Switchboard and the Wall Street Journal (Bresnan et al., 2007), from languageR | GPL (>= 2) |
| `ellipse` | Correlation, Two groups, Three or more groups, Multiple regression | ELLIPSE corpus of English learner essays with analytic ratings, grades 8–12 (Crossley et al., 2023). Demographic columns removed | CC BY 4.0 |
| `intercultural_simulated` | Correlation, Three or more groups, Scale development | SIMULATED survey of 600 language learners: time abroad, contact, proficiency, a 20-item intercultural competence scale modelled on Byram (1997), willingness to communicate, anxiety. `scripts/simulate_intercultural.py` | Released with this repository |
| `writing_ai_simulated` | Questionnaire analyser | Simulated 15-item questionnaire with four planted problems | Released with this repository |
| `bfi` | Questionnaire analyser | 25 Big Five items, 2,800 respondents, from the psychTools R package (Revelle) | GPL (>= 2) |

The data files keep their original licences; the code is MIT. `scripts/prepare_methods_data.py` and `scripts/prepare_data.py` rebuild every file from the original sources.

## Verified statistics

Every number in the browser is checked against established Python libraries.

- `web/src/lib/methods.ts`: browser implementation of the descriptive, basic, advanced and modelling modules.
- `tests/check_methods.py`: 152 comparisons with SciPy and statsmodels on the real datasets. Status: **all match**.
- `web/src/lib/anova.ts`, `cfa.ts`, `sem.ts`, `bayes.ts` and `tests/check_advanced.py`: ANOVA, Welch's ANOVA, Kruskal–Wallis, Holm-adjusted pairs (SciPy, pingouin, statsmodels); maximum-likelihood CFA and SEM (semopy, plus an independent SciPy fit for standard errors and the indirect effect); Bayesian posterior (numerical integration): 118 comparisons. Status: **all match**.
- `web/src/lib/stats.ts` and `analysis/psychometrics.py`: browser and Python implementations of the Questionnaire analyser, mirroring each other function by function.
- `tests/compare_outputs.py`: 42 comparisons between them. Status: **all match**.
- `tests/check_against_factor_analyzer.py`: cross-check with the independent `factor_analyzer` package.
- `notebooks/`: executed notebooks reproducing the Questionnaire analyser.

```bash
pip install -r requirements.txt
cd web && npm install && cd ..
python -I tests/check_methods.py
python -I tests/check_advanced.py
python -I tests/compare_outputs.py
python -I tests/check_against_factor_analyzer.py

cd web && npm run dev
```

## Deploying

A static Vite + React build in `web/`. On Vercel, import the repository, set the Root Directory to `web` and keep the Vite preset.

## Limitations

- The modules teach one method at a time on prepared data; they do not replace a statistics package for your own analyses (the R and Python code on each page is the bridge).
- Mixed-effects models, which suit repeated-measures language data, are not yet covered.
- The Questionnaire analyser uses Pearson correlations and listwise deletion. For few response options or heavy skew, polychoric correlations are preferable; the generated lavaan code uses them.

## About

Created by Ngo Cong-Lem (ORCID [0000-0002-5257-8264](https://orcid.org/0000-0002-5257-8264)), BehaviourWorks Australia, Monash University. Code was written with AI assistance (Claude, Anthropic); the author designed the content, chose the datasets and checked every result against the tests above.

## Citation

Cong-Lem, N. (2026). *Quantitative Methods Lab: Plain-language statistics for the applied social sciences* (Version 0.4.0) [Computer software]. https://quant-methods-lab.vercel.app

### References

- Baayen, R. H. (2008). *Analyzing linguistic data: A practical introduction to statistics using R*. Cambridge University Press.
- Balota, D. A., Cortese, M. J., Sergent-Marshall, S. D., Spieler, D. H., & Yap, M. J. (2004). Visual word recognition of single-syllable words. *Journal of Experimental Psychology: General, 133*(2), 283–316. https://doi.org/10.1037/0096-3445.133.2.283
- Bresnan, J., Cueni, A., Nikitina, T., & Baayen, R. H. (2007). Predicting the dative alternation. In G. Bouma, I. Krämer, & J. Zwarts (Eds.), *Cognitive foundations of interpretation* (pp. 69–94). Royal Netherlands Academy of Science.
- Crossley, S. A., Tian, Y., Baffour, P., Franklin, A., Kim, Y., Morris, W., Benner, B., Picou, A., & Boser, U. (2023). Measuring second language proficiency using the English Language Learner Insight, Proficiency and Skills Evaluation (ELLIPSE) corpus. *International Journal of Learner Corpus Research, 9*(2), 248–269. https://doi.org/10.1075/ijlcr.22026.cro
