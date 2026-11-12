# Quantitative Methods Lab

**Plain-language statistics for language and education research, with interactive activities on real data.**

**Live site: https://quantitative-methods-lab.vercel.app** (previously scale-validation-lab.vercel.app)

The Quantitative Methods Lab is a free, browser-based guide to the statistics most often used in applied linguistics and education research. Each module explains one method in plain words, lets you try it on a real published dataset, checks understanding with a short quiz, writes an APA-style reporting sentence from your results, and gives the equivalent R and Python code. The last module is a full questionnaire-validation tool that works on your own CSV file; files are read in the browser and never uploaded.

## Modules

| Module | Question it answers | Real data | Activities |
|---|---|---|---|
| **1. Describing data** | What do my numbers look like? | Word recognition times (Balota et al., 2004) | Histogram on the raw or log scale; mean, median, SD, IQR and skew; young vs older readers |
| **2. Correlation** | Do two measures go up and down together? | Word frequency and reading speed; ELLIPSE essay ratings | Pearson and Spearman with CIs; a guess-the-correlation game |
| **3. Comparing two groups** | Do two groups differ, and by how much? | Young and older readers; the English dative; ELLIPSE grade 8 vs grade 12 | Welch and paired *t*-tests, Cohen's *d* with CIs; a 200-study simulation of what sample size does to *p*-values |
| **4. Linear regression** | How well do several measures predict an outcome? | Word recognition times; ELLIPSE essay ratings | Build a model by ticking predictors; coefficient table read in plain words; VIF; prediction calculator; residual plot |
| **5. Categorical outcomes** | Which factors predict a choice between two forms? | The English dative alternation (Bresnan et al., 2007) | Chi-square, Cramér's *V*, odds ratios with expected counts; logistic regression with a predicted-probability curve |
| **6. Measurement** | Does my questionnaire measure what I think it measures? | Your own CSV, or two sample questionnaires | Item screening, Cronbach's α and McDonald's ω, KMO, parallel analysis, exploratory factor analysis, a draft APA paragraph and lavaan CFA code |

Also: a **Which test?** guide (pick a test by aim, design and scale of measurement, with fallbacks when assumptions fail, effect sizes and R code; scales of measurement; what to do when data are not normal, with a Q–Q plot of real reaction times), a "Which method do I need?" chooser, a searchable glossary (90 terms), a table of every cut-off value with the paper that supports it, and **Teach with it** session plans, including a six-week methods course.

## Data

| Dataset | Used in | Source | Licence |
|---|---|---|---|
| `english` | Modules 1–4 | Visual lexical decision and naming latencies for 2,284 monosyllabic English words, young and older adults (Balota et al., 2004), from the languageR R package (Baayen, 2008) | GPL (>= 2) |
| `dative` | Modules 3, 5 | 3,263 dative clauses from Switchboard and the Wall Street Journal (Bresnan et al., 2007), from languageR | GPL (>= 2) |
| `ellipse` | Modules 2–4 | ELLIPSE corpus of English learner essays with analytic ratings, grades 8–12 (Crossley et al., 2023). Demographic columns removed | CC BY 4.0 |
| `writing_ai_simulated` | Module 6 | Simulated 15-item questionnaire with four planted problems | Released with this repository |
| `bfi` | Module 6 | 25 Big Five items, 2,800 respondents, from the psychTools R package (Revelle) | GPL (>= 2) |

The data files keep their original licences; the code is MIT. `scripts/prepare_methods_data.py` and `scripts/prepare_data.py` rebuild every file from the original sources.

## Verified statistics

Every number in the browser is checked against established Python libraries.

- `web/src/lib/methods.ts`: browser implementation of Modules 1–5.
- `tests/check_methods.py`: 152 comparisons with SciPy and statsmodels on the real datasets. Status: **all match**.
- `web/src/lib/stats.ts` and `analysis/psychometrics.py`: browser and Python implementations of Module 6, mirroring each other function by function.
- `tests/compare_outputs.py`: 42 comparisons between them. Status: **all match**.
- `tests/check_against_factor_analyzer.py`: cross-check with the independent `factor_analyzer` package.
- `notebooks/`: executed notebooks reproducing Module 6.

```bash
pip install -r requirements.txt
cd web && npm install && cd ..
python -I tests/check_methods.py
python -I tests/compare_outputs.py
python -I tests/check_against_factor_analyzer.py

cd web && npm run dev
```

## Deploying

A static Vite + React build in `web/`. On Vercel, import the repository, set the Root Directory to `web` and keep the Vite preset.

## Limitations

- Modules 1–5 teach one method at a time on prepared data; they do not replace a statistics package for your own analyses (the R and Python code on each page is the bridge).
- Mixed-effects models, which suit repeated-measures language data, are not yet covered.
- Module 6 uses Pearson correlations and listwise deletion. For few response options or heavy skew, polychoric correlations are preferable; the generated lavaan code uses them.

## About

Created by Ngo Cong-Lem (ORCID [0000-0002-5257-8264](https://orcid.org/0000-0002-5257-8264)), BehaviourWorks Australia, Monash University. Code was written with AI assistance (Claude, Anthropic); the author designed the content, chose the datasets and checked every result against the tests above.

## Citation

Cong-Lem, N. (2026). *Quantitative Methods Lab: Plain-language statistics for language and education research* (Version 0.3.0) [Computer software]. https://github.com/ngoconglem/quantitative-methods-lab

### References

- Baayen, R. H. (2008). *Analyzing linguistic data: A practical introduction to statistics using R*. Cambridge University Press.
- Balota, D. A., Cortese, M. J., Sergent-Marshall, S. D., Spieler, D. H., & Yap, M. J. (2004). Visual word recognition of single-syllable words. *Journal of Experimental Psychology: General, 133*(2), 283–316. https://doi.org/10.1037/0096-3445.133.2.283
- Bresnan, J., Cueni, A., Nikitina, T., & Baayen, R. H. (2007). Predicting the dative alternation. In G. Bouma, I. Krämer, & J. Zwarts (Eds.), *Cognitive foundations of interpretation* (pp. 69–94). Royal Netherlands Academy of Science.
- Crossley, S. A., Tian, Y., Baffour, P., Franklin, A., Kim, Y., Morris, W., Benner, B., Picou, A., & Boser, U. (2023). Measuring second language proficiency using the English Language Learner Insight, Proficiency and Skills Evaluation (ELLIPSE) corpus. *International Journal of Learner Corpus Research, 9*(2), 248–269. https://doi.org/10.1075/ijlcr.22026.cro
