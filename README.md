# Scale Validation Lab

**Open psychometrics for questionnaire research.**

**Live site: https://scale-validation-lab.vercel.app**

The Scale Validation Lab is a free, browser-based teaching and research resource for checking the internal structure of questionnaires. It takes responses through item screening, reliability and exploratory factor analysis to a draft APA-style results paragraph and lavaan code for confirmatory factor analysis, explaining each number along the way. Files are read in the browser and never uploaded.

## What it does

| Step | Analyses |
|---|---|
| **1. Data** | Load a CSV (non-item columns set aside automatically), assign subscales, mark reverse-scored items, set the response range |
| **2. Items** | Missing data, mean, SD, skew, floor and ceiling effects, response distributions, with flags |
| **3. Reliability** | Cronbach's α with Feldt 95% CI, McDonald's ω total, mean inter-item r, corrected item-total r, α if item deleted |
| **4. Factor structure** | Correlation heatmap; KMO (overall and per item); Bartlett's test; Horn's parallel analysis; principal axis factoring with oblimin or varimax rotation; loadings, communalities, factor correlations, RMSR; flags for weak, cross-loading and negative items |
| **5. Report** | Draft APA results paragraph, lavaan CFA syntax (WLSMV, ordinal), reporting checklist |

Also: **Learn** (short explainers with references), **Teach with it** (three session plans), and two sample datasets.

## Sample data

| Dataset | Description | Licence |
|---|---|---|
| `writing_ai_simulated` | Simulated 15-item "Academic Writing with AI" questionnaire, 320 respondents, three correlated factors, with four planted problems for learners to find (see the About page) | Released with this repository |
| `bfi` | 25 Big Five items, 2,800 respondents, from the psychTools R package (Revelle); data from the SAPA project; IPIP item wordings | GPL (>= 2); item wordings public domain |

`scripts/prepare_data.py` rebuilds both from the original `bfi.rda` files and the simulation seed (2026).

## Verified statistics

- `analysis/psychometrics.py`: Python reference implementation of every statistic.
- `web/src/lib/stats.ts`: the browser implementation, mirroring the Python function by function.
- `tests/compare_outputs.py`: 42 comparisons between the browser and Python code on both datasets. Status: **all match**.
- `tests/check_against_factor_analyzer.py`: cross-check with the independent `factor_analyzer` package. Loadings (Tucker congruence 1.000), KMO and Bartlett's test agree exactly.
- `notebooks/`: three executed notebooks reproducing each step.

```bash
pip install -r requirements.txt
python -I tests/compare_outputs.py              # needs Node and `npm install` in web/
python -I tests/check_against_factor_analyzer.py
python scripts/build_notebooks.py

cd web && npm install && npm run dev
```

## Deploying

A static Vite + React build in `web/`. On Vercel, import the repository, set the Root Directory to `web` and keep the Vite preset.

## Limitations

- Pearson correlations and listwise deletion. For few response options or heavy skew, polychoric correlations are preferable; the generated lavaan code uses them.
- No CFA, invariance testing or IRT in the browser; the Report step hands over to R.
- Internal structure is one source of validity evidence among five (AERA, APA, & NCME, 2014).

## Citation

Ngo, C. (2026). *Scale Validation Lab: Open psychometrics for questionnaire research* (Version 0.1.0) [Computer software]. https://github.com/ngoconglem/scale-validation-lab

Sister resource: [Language & AI Literacy Lab](https://language-ai-literacy-lab.vercel.app), linguistic analysis of human and AI writing.

## Licence

Code: MIT. Sample data: see the table above.

Built by [Dr Cong Ngo](https://research.monash.edu/en/persons/cong-ngo/), BehaviourWorks Australia, Monash University.
