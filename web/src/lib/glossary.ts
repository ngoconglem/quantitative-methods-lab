export interface GlossaryEntry {
  id: string;
  term: string;
  /** One or two plain sentences, no jargon. */
  plain: string;
  /** Longer explanation for the glossary page. */
  detail?: string;
  /** A practical rule of thumb for reading the number. */
  rule?: string;
  example?: string;
  topic: string;
}

export const GLOSSARY: GlossaryEntry[] = [
  // ---------------------------------------------------------------- statistics modules
  {
    id: "median",
    term: "Median",
    plain: "The middle value when all values are put in order. Half the cases are below it and half above, so a few extreme values hardly move it.",
    topic: "Describing data",
  },
  {
    id: "iqr",
    term: "Interquartile range (IQR)",
    plain: "The range covered by the middle half of the values, from the 25th to the 75th percentile. Like the median, it ignores extremes.",
    topic: "Describing data",
  },
  {
    id: "histogram",
    term: "Histogram",
    plain: "A bar chart of how many cases fall in each range of values. It shows the shape of a distribution: where values cluster, how spread out they are, and whether there is a long tail.",
    topic: "Describing data",
  },
  {
    id: "log-transform",
    term: "Log transformation",
    plain: "Replacing each value with its logarithm. It squeezes large values more than small ones, turning a long right tail into a more symmetric shape. Common for reaction times, word frequencies and essay lengths.",
    rule: "On a log scale, differences become ratios: a difference of 0.1 in log units is roughly a 10% difference in the original units.",
    topic: "Describing data",
  },
  {
    id: "lexical-decision",
    term: "Lexical decision task",
    plain: "An experiment in which people see a string of letters and decide as quickly as possible whether it is a real word. The time they take shows how easily the word is recognised.",
    topic: "Describing data",
  },
  {
    id: "r-squared",
    term: "R² (r squared)",
    plain: "The share of variation in one measure that is accounted for by another (for a correlation) or by all the predictors together (for a regression), from 0 to 1.",
    example: "r = .50 gives r² = .25: a quarter of the variation is shared.",
    topic: "Relationships and differences",
  },
  {
    id: "spearman",
    term: "Spearman's rho",
    plain: "A correlation computed on the ranks of the values instead of the values themselves. It captures any steadily rising or falling relationship and is less affected by extreme values than Pearson's r.",
    topic: "Relationships and differences",
  },
  {
    id: "effect-size",
    term: "Effect size",
    plain: "A number that describes how big a difference or relationship is, separately from whether it is statistically significant. Examples: Cohen's d, r, odds ratios, Cramér's V.",
    topic: "Relationships and differences",
  },
  {
    id: "cohen-d",
    term: "Cohen's d",
    plain: "The difference between two group means divided by their pooled standard deviation: how many standard deviations apart the groups are.",
    rule: "Cohen (1988): 0.2 small, 0.5 medium, 0.8 large. Even at 0.8, the two groups overlap a great deal.",
    topic: "Relationships and differences",
  },
  {
    id: "t-test",
    term: "t-test",
    plain: "A test of whether the difference between two means is larger than you would expect from sampling alone. It divides the difference by its standard error.",
    topic: "Relationships and differences",
  },
  {
    id: "welch",
    term: "Welch's t-test",
    plain: "The version of the t-test for two independent groups that does not assume the groups have equal variances. Recommended as the default (Delacre et al., 2017).",
    topic: "Relationships and differences",
  },
  {
    id: "paired-t",
    term: "Paired t-test",
    plain: "The t-test for two measurements of the same people or items, such as before and after a course. It tests the average of the differences within each pair.",
    topic: "Relationships and differences",
  },
  {
    id: "power",
    term: "Statistical power",
    plain: "The chance that a study detects a real effect of a given size. Small studies have low power: they often miss real effects, and the effects they do find tend to be overestimated.",
    rule: "80% power is a common target when planning a study.",
    topic: "Relationships and differences",
  },
  {
    id: "regression",
    term: "Linear regression",
    plain: "A model that predicts a numerical outcome from one or more predictors by fitting the best straight-line (or flat-plane) relationship.",
    topic: "Regression",
  },
  {
    id: "coefficient",
    term: "Regression coefficient (b)",
    plain: "How much the predicted outcome changes for a one-unit increase in a predictor, with the other predictors held constant.",
    topic: "Regression",
  },
  {
    id: "residual",
    term: "Residual",
    plain: "The difference between a case's actual value and the value the model predicts for it: the model's error for that case.",
    topic: "Regression",
  },
  {
    id: "vif",
    term: "Variance inflation factor (VIF)",
    plain: "How much a predictor overlaps with the other predictors. 1 means no overlap. High values mean its coefficient is estimated imprecisely because other predictors carry much the same information.",
    rule: "Above 5 or 10 is commonly treated as a problem (James et al., 2013).",
    topic: "Regression",
  },
  {
    id: "dative",
    term: "Dative alternation",
    plain: "The choice in English between “gave the student a book” (double object, recipient as a noun phrase) and “gave a book to the student” (recipient in a prepositional phrase).",
    detail: "Bresnan, J., Cueni, A., Nikitina, T., & Baayen, R. H. (2007). Predicting the dative alternation. In G. Bouma, I. Krämer, & J. Zwarts (Eds.), Cognitive foundations of interpretation (pp. 69–94). Royal Netherlands Academy of Science.",
    topic: "Categorical data",
  },
  {
    id: "chi-square-test",
    term: "Chi-square test of independence",
    plain: "A test of whether two categorical variables are related, comparing the counts in a table with the counts expected if they were unrelated.",
    rule: "Needs expected counts of about 5 or more in most cells (Cochran, 1954).",
    topic: "Categorical data",
  },
  {
    id: "cramer-v",
    term: "Cramér's V",
    plain: "The strength of association in a table of counts, from 0 (none) to 1 (perfect).",
    rule: "For 2 × 2 tables, Cohen (1988): .10 small, .30 medium, .50 large.",
    topic: "Categorical data",
  },
  {
    id: "odds-ratio",
    term: "Odds ratio",
    plain: "Odds are the chance of something happening divided by the chance of it not happening. An odds ratio compares the odds in two situations: 1 means no difference, 2 means twice the odds, 0.5 half the odds.",
    topic: "Categorical data",
  },
  {
    id: "logistic",
    term: "Logistic regression",
    plain: "Regression for an outcome with two categories, such as which of two forms a speaker uses. It models the log odds of one outcome, so its results are reported as odds ratios.",
    rule: "Aim for at least 10 cases of the rarer outcome per predictor (Peduzzi et al., 1996).",
    topic: "Categorical data",
  },
  // ---------------------------------------------------------------- the data
  {
    id: "item",
    term: "Item",
    plain: "One question or statement in a questionnaire, such as “I can revise my own writing without help”, answered on a rating scale.",
    topic: "The data",
  },
  {
    id: "likert",
    term: "Rating scale (Likert scale)",
    plain: "A fixed set of answer options, usually numbered, such as 1 = strongly disagree to 5 = strongly agree.",
    detail: "Strictly, a Likert scale is the whole set of items summed together; each item is answered on a Likert-type response format. Most people use the word loosely for both.",
    topic: "The data",
  },
  {
    id: "construct",
    term: "Construct",
    plain: "The underlying quality a questionnaire tries to measure, which cannot be observed directly: for example self-efficacy, anxiety or motivation.",
    topic: "The data",
  },
  {
    id: "subscale",
    term: "Subscale",
    plain: "A group of items meant to measure the same construct. A questionnaire on writing with AI might have three subscales, each with five items.",
    topic: "The data",
  },
  {
    id: "reverse",
    term: "Reverse-worded item and reverse-scoring",
    plain: "An item worded in the opposite direction to the rest of its subscale, such as “I accept AI-generated references without checking them” in a subscale about critically evaluating AI output. Its scores must be flipped before analysis so that a high score means the same thing on every item.",
    rule: "Flipped score = lowest option + highest option − the response. On a 1–5 scale, 1 becomes 5, 2 becomes 4, 3 stays 3.",
    example: "If CE4 is not reverse-scored, its correlation with the other items comes out negative and the subscale's alpha collapses.",
    topic: "The data",
  },
  {
    id: "csv",
    term: "CSV file",
    plain: "A plain spreadsheet file saved as “comma-separated values”. Excel, Google Sheets, SPSS, Qualtrics and R can all save in this format.",
    example: "First row: SE1,SE2,SE3,… Each further row: one person's answers, for example 4,5,3,…",
    topic: "The data",
  },
  {
    id: "missing",
    term: "Missing data",
    plain: "Answers that are blank because a respondent skipped an item. In your file, blank cells, NA and −99 are treated as missing.",
    rule: "The lab flags items with more than 5% missing; Schafer (1999) described 5% or less as inconsequential.",
    topic: "The data",
  },
  {
    id: "listwise",
    term: "Listwise deletion",
    plain: "Leaving out anyone who skipped any item, so every analysis uses only complete responses. Simple, but it can shrink the sample and bias results if the people who skip items differ from the rest.",
    topic: "The data",
  },

  // ---------------------------------------------------------------- describing items
  {
    id: "mean",
    term: "Mean",
    plain: "The average response to an item.",
    topic: "Describing items",
  },
  {
    id: "sd",
    term: "Standard deviation (SD)",
    plain: "How spread out the answers to an item are. A small SD means almost everyone gave the same answer, so the item tells you little about differences between people.",
    rule: "The lab flags SDs below 0.6 on a 1–5 scale. This is the lab's own prompt; there is no published standard.",
    topic: "Describing items",
  },
  {
    id: "skew",
    term: "Skew",
    plain: "Whether answers are lopsided. Negative skew means most people chose the high end; positive skew means most chose the low end.",
    rule: "Kim (2013) gives an absolute skew above 2 as a reference value for substantial non-normality in samples over 300.",
    topic: "Describing items",
  },
  {
    id: "floor-ceiling",
    term: "Floor and ceiling effects",
    plain: "A ceiling effect is when many people choose the highest option, such as “strongly agree”. Some may agree far more strongly than others, but the item cannot show it because there is no higher option. A floor effect is the same at the lowest option. Either way the item stops telling people apart.",
    rule: "Terwee et al. (2007) treat more than 15% of respondents at the lowest or highest score as a floor or ceiling effect. They wrote it for total scores; the lab applies it to single items as a prompt.",
    topic: "Describing items",
  },

  // ---------------------------------------------------------------- reliability
  {
    id: "correlation",
    term: "Correlation (r)",
    plain: "How strongly two sets of answers move together, from −1 to +1. Positive means people who score high on one item tend to score high on the other; 0 means no relationship; negative means opposite directions.",
    rule: "Cohen (1988): .10 is small, .30 medium and .50 large.",
    topic: "Reliability",
  },
  {
    id: "reliability",
    term: "Reliability (internal consistency)",
    plain: "How consistently the items in a subscale measure the same thing. If they do, people who agree with one item tend to agree with the others, and the total score contains little random noise.",
    topic: "Reliability",
  },
  {
    id: "alpha",
    term: "Cronbach's alpha (α)",
    plain: "The most widely reported reliability estimate. It runs from 0 to 1; higher means the items hang together more consistently.",
    rule: "George & Mallery (2003): .90 excellent, .80 good, .70 acceptable, .60 questionable, .50 poor. Nunnally (1978): at least .70 for early-stage research. Above .95 the items may be near-duplicates (Terwee et al., 2007). These are conventions, not tests (Taber, 2018).",
    detail:
      "Alpha assumes every item is equally strongly related to the construct (tau-equivalence). When items differ in strength, as they usually do, alpha slightly underestimates reliability, and omega is preferred. Alpha also rises simply because a scale has more items.",
    topic: "Reliability",
  },
  {
    id: "ci",
    term: "Confidence interval (CI)",
    plain: "A range of plausible values for the true figure, given the sample size. A 95% CI of [.74, .82] means the data are consistent with a true alpha anywhere in that range.",
    rule: "Wide intervals come from small samples. Report the interval, not just the single number.",
    detail: "This lab uses Feldt's (1965) method for the confidence interval of alpha.",
    topic: "Reliability",
  },
  {
    id: "omega",
    term: "McDonald's omega (ω)",
    plain: "A reliability estimate based on how strongly each item relates to the construct (its factor loading). It does not assume all items are equally strong, so it is usually more accurate than alpha.",
    rule: "Read it on the same scale as alpha: .70 acceptable, .80 good. Prefer it to alpha when they differ (McNeish, 2018).",
    detail: "This lab computes omega total from a one-factor solution for each subscale. See Dunn, Baguley and Brunsden (2014) and McNeish (2018).",
    topic: "Reliability",
  },
  {
    id: "tau",
    term: "Tau-equivalence",
    plain: "The assumption, built into alpha, that every item measures the construct equally well. It rarely holds exactly.",
    topic: "Reliability",
  },
  {
    id: "citc",
    term: "Corrected item-total correlation",
    plain: "The correlation between one item and the total of the other items in its subscale. It shows how well that item fits with the rest.",
    rule: "Below about .30 suggests weak fit (Field, 2018); some authors accept .20. A negative value almost always means a reverse-worded item has not been reverse-scored.",
    topic: "Reliability",
  },
  {
    id: "alpha-deleted",
    term: "Alpha if item deleted",
    plain: "What alpha would be if this item were removed. If it is clearly higher than the current alpha, the item is pulling reliability down.",
    detail: "Do not delete items on this number alone: check the wording and the content the item covers first.",
    topic: "Reliability",
  },
  {
    id: "mean-r",
    term: "Mean inter-item correlation",
    plain: "The average correlation between every pair of items in a subscale. Unlike alpha, it does not rise just because a scale is longer.",
    rule: "Clark & Watson (1995) recommend .15 to .50: nearer .15–.20 for a broad construct, nearer .40–.50 for a narrow one.",
    topic: "Reliability",
  },

  // ---------------------------------------------------------------- factorability
  {
    id: "factor",
    term: "Factor",
    plain: "A hidden (latent) dimension that explains why some items correlate with each other. If five items all reflect self-efficacy, factor analysis should find one factor behind them.",
    topic: "Factor analysis",
  },
  {
    id: "efa",
    term: "Exploratory factor analysis (EFA)",
    plain: "A method that looks at the correlations between all the items and finds a small number of factors that explain them, without being told in advance which items belong together.",
    detail: "EFA is used when developing or checking a questionnaire. Its job here is to test whether items group into the subscales you intended.",
    topic: "Factor analysis",
  },
  {
    id: "corr-matrix",
    term: "Correlation matrix (heatmap)",
    plain: "A grid showing the correlation between every pair of items. Blocks of strong correlations suggest groups of items that measure the same thing.",
    topic: "Factor analysis",
  },
  {
    id: "kmo",
    term: "Kaiser–Meyer–Olkin measure (KMO)",
    plain: "A check, from 0 to 1, of whether the items share enough in common for factor analysis to be worthwhile.",
    rule: "Kaiser (1974): .90s marvellous, .80s meritorious, .70s middling, .60s mediocre, .50s miserable, below .50 unacceptable. .60 is a common minimum.",
    detail: "Kaiser (1974). It compares ordinary correlations with partial correlations (correlations after removing the influence of all other items).",
    topic: "Factor analysis",
  },
  {
    id: "bartlett",
    term: "Bartlett's test of sphericity",
    plain: "A test of whether the items are correlated at all. If it is not significant, there is nothing for factor analysis to find.",
    rule: "With any realistic sample it is almost always significant (p < .001), so treat it as a minimum check, not as evidence of good structure.",
    topic: "Factor analysis",
  },
  {
    id: "p-value",
    term: "p-value",
    plain: "Roughly, how surprising the result would be if there were really nothing there. p < .001 means a result this strong would almost never arise by chance.",
    topic: "Factor analysis",
  },
  {
    id: "chi-square",
    term: "Chi-square (χ²)",
    plain: "The test statistic behind Bartlett's test. Larger values mean stronger evidence that the items are correlated. The number in brackets is its degrees of freedom, which depends on how many items there are.",
    topic: "Factor analysis",
  },
  {
    id: "sample-size",
    term: "Sample size for factor analysis",
    plain: "How many respondents you need. It depends less on a fixed ratio than on how strong the loadings are and how many items each factor has.",
    rule: "MacCallum et al. (1999): with high communalities (around .60 or more) and several items per factor, modest samples can work; with low communalities, several hundred may not be enough. Ratios such as “10 per item” are rough guides only.",
    detail: "MacCallum, Widaman, Zhang and Hong (1999).",
    topic: "Factor analysis",
  },

  // ---------------------------------------------------------------- how many factors
  {
    id: "eigenvalue",
    term: "Eigenvalue",
    plain: "How much of the items' shared variation one factor accounts for, counted in “items' worth”. An eigenvalue of 3 means that factor explains as much as three items would on their own.",
    topic: "How many factors?",
  },
  {
    id: "scree",
    term: "Scree plot",
    plain: "A line chart of the eigenvalues from largest to smallest. The first few factors usually stand well above the rest, and the line then flattens into “scree”, like rubble at the foot of a cliff.",
    topic: "How many factors?",
  },
  {
    id: "parallel",
    term: "Parallel analysis",
    plain: "A way to decide how many factors to keep. It creates many random datasets of the same size as yours and keeps only the factors whose eigenvalues beat what random data produce.",
    rule: "Keep the factors whose observed eigenvalue (the solid line) is above the random line (Horn, 1965; 95th percentile as recommended by Glorfeld, 1995).",
    detail: "Horn (1965). This lab uses 100 random datasets (50 for large files), the 95th percentile, and a fixed seed so results are reproducible.",
    topic: "How many factors?",
  },
  {
    id: "kaiser-rule",
    term: "Eigenvalue-greater-than-one rule",
    plain: "An old rule that keeps every factor with an eigenvalue above 1. It often keeps too many factors (Zwick & Velicer, 1986), so parallel analysis is preferred.",
    topic: "How many factors?",
  },

  // ---------------------------------------------------------------- results
  {
    id: "paf",
    term: "Principal axis factoring (PAF)",
    plain: "The method this lab uses to extract factors. It models only the variation items share with each other, ignoring each item's unique noise, which suits questionnaire data.",
    detail: "At convergence it gives the same solution as the minimum residual (minres) method. It differs from principal component analysis (PCA), which also absorbs each item's unique and error variance.",
    topic: "Factor analysis results",
  },
  {
    id: "loading",
    term: "Factor loading (λ)",
    plain: "How strongly an item is related to a factor, roughly from −1 to +1. A high loading means the item is a good indicator of that factor.",
    rule: "|.40| is the usual cut-off for a meaningful loading (Stevens, 1992); Tabachnick & Fidell (2019) treat .32 as the minimum. Hair et al. (2010): .40 is significant with about 200 respondents, .30 needs about 350.",
    topic: "Factor analysis results",
  },
  {
    id: "salient",
    term: "Salient loading",
    plain: "A loading large enough to count, using a cut-off you choose (often .40). Salient loadings are shown in bold.",
    topic: "Factor analysis results",
  },
  {
    id: "cross-loading",
    term: "Cross-loading",
    plain: "When an item loads .32 or more on a second factor (Costello & Osborne, 2005). It is not a clean indicator of either factor, and its wording usually needs a closer look.",
    topic: "Factor analysis results",
  },
  {
    id: "communality",
    term: "Communality (h²)",
    plain: "The share of an item's variation that the factors explain together, from 0 to 1. A low communality means the item has little in common with the others.",
    rule: "Below .40 suggests the item has little in common with the others or points to another factor (Costello & Osborne, 2005); .40 to .70 is common in social science data.",
    topic: "Factor analysis results",
  },
  {
    id: "heywood",
    term: "Heywood case",
    plain: "A communality of 1 or more, which is impossible in theory. It signals a problem: too many factors, too few respondents, or an item that nearly duplicates another.",
    topic: "Factor analysis results",
  },
  {
    id: "rotation",
    term: "Rotation",
    plain: "A step that turns the factors to make the loadings easier to read, so each item loads clearly on one factor. It does not change how well the solution fits the data.",
    topic: "Factor analysis results",
  },
  {
    id: "oblimin",
    term: "Oblimin rotation (oblique)",
    plain: "A rotation that allows factors to be correlated. Usually the right choice in education and the social sciences, where constructs such as confidence and motivation are related; Costello & Osborne (2005) recommend it as the default.",
    topic: "Factor analysis results",
  },
  {
    id: "varimax",
    term: "Varimax rotation (orthogonal)",
    plain: "A rotation that forces factors to be uncorrelated. Use it only if you have a reason to believe the constructs are unrelated.",
    topic: "Factor analysis results",
  },
  {
    id: "phi",
    term: "Factor correlations",
    plain: "How strongly the factors themselves are related, after an oblique rotation. Correlations of .85 or more suggest two factors may really be one (Brown, 2015).",
    topic: "Factor analysis results",
  },
  {
    id: "rmsr",
    term: "Root mean square of residuals (RMSR)",
    plain: "How far the correlations predicted by the factors are, on average, from the actual correlations. Smaller is better.",
    rule: "No agreed cut-off exists for exploratory analysis. Field (2018) advises that fewer than half the residual correlations should exceed .05, so the lab treats an RMSR below .05 as good.",
    topic: "Factor analysis results",
  },
  {
    id: "variance-explained",
    term: "Variance explained",
    plain: "The percentage of the items' shared variation that the factors account for. Higher means the factors capture more of what the items have in common.",
    topic: "Factor analysis results",
  },

  // ---------------------------------------------------------------- reporting
  {
    id: "cfa",
    term: "Confirmatory factor analysis (CFA)",
    plain: "The next step after EFA. You specify in advance which items belong to which factor and test how well that model fits new data.",
    detail: "Run it on a different sample from the one used for the EFA; testing a structure on the same data that suggested it overstates the fit.",
    topic: "Reporting and next steps",
  },
  {
    id: "lavaan",
    term: "lavaan",
    plain: "A free R package for confirmatory factor analysis and structural equation modelling. The Report step writes lavaan code you can paste into R.",
    topic: "Reporting and next steps",
  },
  {
    id: "wlsmv",
    term: "WLSMV and polychoric correlations",
    plain: "A way of estimating CFA that treats rating-scale answers as ordered categories rather than continuous numbers. It is more accurate for items with five or fewer options.",
    detail: "Polychoric correlations estimate how two items would correlate if the underlying construct were measured continuously.",
    topic: "Reporting and next steps",
  },
  {
    id: "apa",
    term: "APA style",
    plain: "The reporting conventions of the American Psychological Association, widely used in education and the social sciences: for example α = .81, no zero before the decimal point for values that cannot exceed 1.",
    topic: "Reporting and next steps",
  },
  {
    id: "validity",
    term: "Validity evidence",
    plain: "Evidence that scores mean what you claim they mean. Internal structure (what this lab examines) is one source; the others are content, response processes, relations to other variables and consequences of use.",
    detail: "AERA, APA and NCME (2014), Standards for Educational and Psychological Testing.",
    topic: "Reporting and next steps",
  },
];

export const GLOSSARY_BY_ID: Record<string, GlossaryEntry> = Object.fromEntries(GLOSSARY.map((g) => [g.id, g]));
