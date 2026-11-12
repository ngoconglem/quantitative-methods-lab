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
    rule: "On a 1–5 scale, an SD below about 0.6 suggests very little variation.",
    topic: "Describing items",
  },
  {
    id: "skew",
    term: "Skew",
    plain: "Whether answers are lopsided. Negative skew means most people chose the high end; positive skew means most chose the low end.",
    rule: "Values beyond ±2 are a common sign of strong skew.",
    topic: "Describing items",
  },
  {
    id: "floor-ceiling",
    term: "Floor and ceiling effects",
    plain: "When many people choose the lowest option (floor) or the highest option (ceiling). The item cannot distinguish between them, because they have nowhere further to go.",
    rule: "More than about 15% of answers at one end is often flagged.",
    topic: "Describing items",
  },

  // ---------------------------------------------------------------- reliability
  {
    id: "correlation",
    term: "Correlation (r)",
    plain: "How strongly two sets of answers move together, from −1 to +1. Positive means people who score high on one item tend to score high on the other; 0 means no relationship; negative means opposite directions.",
    rule: "Roughly: .10 is small, .30 is moderate and .50 or more is large.",
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
    rule: "Common benchmarks: .70 acceptable for research, .80 good, .90 very high (above .95 can mean the items are near-duplicates). Treat these as conventions, not laws.",
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
    rule: "Read it on the same scale as alpha: .70 acceptable, .80 good.",
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
    rule: "Below .30 suggests weak fit. A negative value almost always means a reverse-worded item has not been reverse-scored.",
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
    rule: "Between about .15 and .50 is typical of a well-focused subscale; much higher can mean the items are near-duplicates.",
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
    rule: ".80 or more is good, .70 middling, .60 a common minimum. Individual items below .60 share little with the rest.",
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
    rule: "With strong loadings and four or more items per factor, 150–200 respondents can be enough; weak loadings need far more. Ratios such as “10 per item” are rough guides only.",
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
    rule: "Keep the factors whose observed eigenvalue (the solid line) is above the random line. It is more accurate than the older “eigenvalue greater than 1” rule.",
    detail: "Horn (1965). This lab uses 100 random datasets (50 for large files), the 95th percentile, and a fixed seed so results are reproducible.",
    topic: "How many factors?",
  },
  {
    id: "kaiser-rule",
    term: "Eigenvalue-greater-than-one rule",
    plain: "An old rule that keeps every factor with an eigenvalue above 1. It often keeps too many factors, so parallel analysis is preferred.",
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
    rule: "|.40| or more is usually treated as a meaningful (salient) loading; .70 or more is strong.",
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
    plain: "When an item loads noticeably (here, .30 or more) on two factors. It is not a clean indicator of either, and its wording usually needs a closer look.",
    topic: "Factor analysis results",
  },
  {
    id: "communality",
    term: "Communality (h²)",
    plain: "The share of an item's variation that the factors explain together, from 0 to 1. A low communality means the item has little in common with the others.",
    rule: "Below about .20 suggests an item that fits poorly.",
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
    plain: "A rotation that allows factors to be correlated. Usually the right choice in education and the social sciences, where constructs such as confidence and motivation are related.",
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
    plain: "How strongly the factors themselves are related, after an oblique rotation. Very high values (above about .80) suggest two factors may really be one.",
    topic: "Factor analysis results",
  },
  {
    id: "rmsr",
    term: "Root mean square of residuals (RMSR)",
    plain: "How far the correlations predicted by the factors are, on average, from the actual correlations. Smaller is better.",
    rule: "Below .05 suggests the factors reproduce the correlations well; above .08 suggests something is missing.",
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
