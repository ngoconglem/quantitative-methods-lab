/**
 * Every cut-off value the lab uses, why, and where it comes from.
 * Used by the step tables in Analyse, the Learn page and the glossary.
 */

export const REFS: Record<string, { short: string; full: string; url?: string }> = {
  schafer1999: {
    short: "Schafer (1999)",
    full: "Schafer, J. L. (1999). Multiple imputation: A primer. Statistical Methods in Medical Research, 8(1), 3–15.",
    url: "https://doi.org/10.1177/096228029900800102",
  },
  kim2013: {
    short: "Kim (2013)",
    full: "Kim, H.-Y. (2013). Statistical notes for clinical researchers: Assessing normal distribution (2) using skewness and kurtosis. Restorative Dentistry & Endodontics, 38(1), 52–54.",
    url: "https://doi.org/10.5395/rde.2013.38.1.52",
  },
  terwee2007: {
    short: "Terwee et al. (2007)",
    full: "Terwee, C. B., Bot, S. D. M., de Boer, M. R., van der Windt, D. A. W. M., Knol, D. L., Dekker, J., Bouter, L. M., & de Vet, H. C. W. (2007). Quality criteria were proposed for measurement properties of health status questionnaires. Journal of Clinical Epidemiology, 60(1), 34–42.",
    url: "https://doi.org/10.1016/j.jclinepi.2006.03.012",
  },
  nunnally1978: {
    short: "Nunnally (1978)",
    full: "Nunnally, J. C. (1978). Psychometric theory (2nd ed.). McGraw-Hill.",
  },
  george2003: {
    short: "George & Mallery (2003)",
    full: "George, D., & Mallery, P. (2003). SPSS for Windows step by step: A simple guide and reference, 11.0 update (4th ed.). Allyn & Bacon.",
  },
  taber2018: {
    short: "Taber (2018)",
    full: "Taber, K. S. (2018). The use of Cronbach's alpha when developing and reporting research instruments in science education. Research in Science Education, 48(6), 1273–1296.",
    url: "https://doi.org/10.1007/s11165-016-9602-2",
  },
  feldt1965: {
    short: "Feldt (1965)",
    full: "Feldt, L. S. (1965). The approximate sampling distribution of Kuder-Richardson reliability coefficient twenty. Psychometrika, 30(3), 357–370.",
    url: "https://doi.org/10.1007/BF02289499",
  },
  mcneish2018: {
    short: "McNeish (2018)",
    full: "McNeish, D. (2018). Thanks coefficient alpha, we'll take it from here. Psychological Methods, 23(3), 412–433.",
    url: "https://doi.org/10.1037/met0000144",
  },
  field2018: {
    short: "Field (2018)",
    full: "Field, A. (2018). Discovering statistics using IBM SPSS Statistics (5th ed.). SAGE.",
  },
  clark1995: {
    short: "Clark & Watson (1995)",
    full: "Clark, L. A., & Watson, D. (1995). Constructing validity: Basic issues in objective scale development. Psychological Assessment, 7(3), 309–319.",
    url: "https://doi.org/10.1037/1040-3590.7.3.309",
  },
  cohen1988: {
    short: "Cohen (1988)",
    full: "Cohen, J. (1988). Statistical power analysis for the behavioral sciences (2nd ed.). Erlbaum.",
  },
  kaiser1974: {
    short: "Kaiser (1974)",
    full: "Kaiser, H. F. (1974). An index of factorial simplicity. Psychometrika, 39(1), 31–36.",
    url: "https://doi.org/10.1007/BF02291575",
  },
  bartlett1950: {
    short: "Bartlett (1950)",
    full: "Bartlett, M. S. (1950). Tests of significance in factor analysis. British Journal of Statistical Psychology, 3(2), 77–85.",
  },
  maccallum1999: {
    short: "MacCallum et al. (1999)",
    full: "MacCallum, R. C., Widaman, K. F., Zhang, S., & Hong, S. (1999). Sample size in factor analysis. Psychological Methods, 4(1), 84–99.",
    url: "https://doi.org/10.1037/1082-989X.4.1.84",
  },
  horn1965: {
    short: "Horn (1965)",
    full: "Horn, J. L. (1965). A rationale and test for the number of factors in factor analysis. Psychometrika, 30(2), 179–185.",
    url: "https://doi.org/10.1007/BF02289447",
  },
  glorfeld1995: {
    short: "Glorfeld (1995)",
    full: "Glorfeld, L. W. (1995). An improvement on Horn's parallel analysis methodology for selecting the correct number of factors to retain. Educational and Psychological Measurement, 55(3), 377–393.",
    url: "https://doi.org/10.1177/0013164495055003002",
  },
  zwick1986: {
    short: "Zwick & Velicer (1986)",
    full: "Zwick, W. R., & Velicer, W. F. (1986). Comparison of five rules for determining the number of components to retain. Psychological Bulletin, 99(3), 432–442.",
    url: "https://doi.org/10.1037/0033-2909.99.3.432",
  },
  stevens1992: {
    short: "Stevens (1992)",
    full: "Stevens, J. P. (1992). Applied multivariate statistics for the social sciences (2nd ed.). Erlbaum.",
  },
  hair2010: {
    short: "Hair et al. (2010)",
    full: "Hair, J. F., Black, W. C., Babin, B. J., & Anderson, R. E. (2010). Multivariate data analysis (7th ed.). Pearson Prentice Hall.",
  },
  tabachnick2019: {
    short: "Tabachnick & Fidell (2019)",
    full: "Tabachnick, B. G., & Fidell, L. S. (2019). Using multivariate statistics (7th ed.). Pearson.",
  },
  costello2005: {
    short: "Costello & Osborne (2005)",
    full: "Costello, A. B., & Osborne, J. W. (2005). Best practices in exploratory factor analysis: Four recommendations for getting the most from your analysis. Practical Assessment, Research, and Evaluation, 10, Article 7.",
    url: "https://doi.org/10.7275/jyj1-4868",
  },
  fabrigar1999: {
    short: "Fabrigar et al. (1999)",
    full: "Fabrigar, L. R., Wegener, D. T., MacCallum, R. C., & Strahan, E. J. (1999). Evaluating the use of exploratory factor analysis in psychological research. Psychological Methods, 4(3), 272–299.",
    url: "https://doi.org/10.1037/1082-989X.4.3.272",
  },
  brown2015: {
    short: "Brown (2015)",
    full: "Brown, T. A. (2015). Confirmatory factor analysis for applied research (2nd ed.). Guilford Press.",
  },
  hu1999: {
    short: "Hu & Bentler (1999)",
    full: "Hu, L., & Bentler, P. M. (1999). Cutoff criteria for fit indexes in covariance structure analysis: Conventional criteria versus new alternatives. Structural Equation Modeling, 6(1), 1–55.",
    url: "https://doi.org/10.1080/10705519909540118",
  },
};

Object.assign(REFS, {
  aera2014: {
    short: "AERA, APA & NCME (2014)",
    full: "American Educational Research Association, American Psychological Association, & National Council on Measurement in Education. (2014). Standards for educational and psychological testing. AERA.",
  },
  conglem2025: {
    short: "Cong-Lem (2025)",
    full: "Cong-Lem, N. (2025). Scale validation in applied linguistics: Methodological trends and challenges. Research Methods in Applied Linguistics, 4(2), 100217.",
  },
  dunn2014: {
    short: "Dunn et al. (2014)",
    full: "Dunn, T. J., Baguley, T., & Brunsden, V. (2014). From alpha to omega: A practical solution to the pervasive problem of internal consistency estimation. British Journal of Psychology, 105(3), 399–412.",
    url: "https://doi.org/10.1111/bjop.12046",
  },
  holgado2010: {
    short: "Holgado-Tello et al. (2010)",
    full: "Holgado-Tello, F. P., Chacón-Moscoso, S., Barbero-García, I., & Vila-Abad, E. (2010). Polychoric versus Pearson correlations in exploratory and confirmatory factor analysis of ordinal variables. Quality & Quantity, 44(1), 153–166.",
    url: "https://doi.org/10.1007/s11135-008-9190-y",
  },
});

export type StepKey = "items" | "reliability" | "structure" | "report";

export interface Cutoff {
  id: string;
  step: StepKey;
  check: string;
  value: string;
  why: string;
  refs: string[];
}

export const CUTOFFS: Cutoff[] = [
  // ------------------------------------------------------------ step 2
  {
    id: "missing",
    step: "items",
    check: "Missing responses",
    value: "More than 5% flagged",
    why: "Schafer described missing rates of 5% or less as inconsequential. Above that, ask why people skipped the item, and consider methods such as multiple imputation rather than dropping people.",
    refs: ["schafer1999"],
  },
  {
    id: "sd",
    step: "items",
    check: "Little variation (SD)",
    value: "SD below 0.6 flagged",
    why: "There is no published standard for this. It is this lab's own prompt to look at items where nearly everyone gave the same answer, because such items cannot distinguish between people.",
    refs: [],
  },
  {
    id: "skew",
    step: "items",
    check: "Skew",
    value: "Beyond ±2 flagged",
    why: "Kim suggests an absolute skew above 2 as a reference value for substantial non-normality in samples over 300. In smaller samples, treat it as a rough guide.",
    refs: ["kim2013"],
  },
  {
    id: "floor-ceiling",
    step: "items",
    check: "Floor and ceiling effects",
    value: "More than 15% at the lowest or highest option",
    why: "Terwee et al. treat more than 15% of respondents at the lowest or highest possible score as a floor or ceiling effect. Their criterion was written for total scale scores; the lab applies it to single items as a screening prompt, so expect it to flag more often.",
    refs: ["terwee2007"],
  },
  // ------------------------------------------------------------ step 3
  {
    id: "alpha",
    step: "reliability",
    check: "Cronbach's alpha and McDonald's omega",
    value: "≥ .90 excellent, ≥ .80 good, ≥ .70 acceptable, ≥ .60 questionable, ≥ .50 poor, < .50 unacceptable",
    why: "The labels follow George and Mallery. Nunnally recommended .70 for early-stage research and .80 for basic research. The same benchmarks are used for omega. Taber shows these labels are conventions rather than tests, so report the value and its interval, not just the label.",
    refs: ["george2003", "nunnally1978", "taber2018"],
  },
  {
    id: "alpha-high",
    step: "reliability",
    check: "Very high alpha",
    value: "Above .95 flagged as possibly redundant",
    why: "Terwee et al. rate alpha between .70 and .95 as positive; above .95 the items may be near-duplicates that add length without adding information.",
    refs: ["terwee2007"],
  },
  {
    id: "alpha-ci",
    step: "reliability",
    check: "Confidence interval for alpha",
    value: "95% interval",
    why: "Computed with Feldt's method. A wide interval means the sample is too small to estimate reliability precisely.",
    refs: ["feldt1965"],
  },
  {
    id: "citc",
    step: "reliability",
    check: "Corrected item-total correlation",
    value: "Below .30 flagged as weak fit; any negative value flagged",
    why: "Field recommends that items correlate at least about .30 with the rest of the scale; some authors accept .20. A negative value almost always means a reverse-worded item has not been reverse-scored.",
    refs: ["field2018"],
  },
  {
    id: "alpha-deleted",
    step: "reliability",
    check: "Alpha if item deleted",
    value: "Flagged if alpha would rise by more than .01",
    why: "This is the lab's own prompt, not a published standard. Dropping an item also narrows what a subscale covers, so read the item before deciding.",
    refs: [],
  },
  {
    id: "mean-r",
    step: "reliability",
    check: "Mean inter-item correlation",
    value: ".15 to .50",
    why: "Clark and Watson recommend this range: toward .15–.20 for a broad construct, toward .40–.50 for a narrow one. Unlike alpha, it does not rise just because a scale has more items.",
    refs: ["clark1995"],
  },
  // ------------------------------------------------------------ step 4
  {
    id: "kmo",
    step: "structure",
    check: "Kaiser–Meyer–Olkin (KMO)",
    value: ".60 minimum; ≥ .80 good",
    why: "Kaiser described values in the .90s as marvellous, .80s meritorious, .70s middling, .60s mediocre, .50s miserable and below .50 unacceptable. Many authors treat .60 as the minimum; Field accepts .50 as a bare minimum.",
    refs: ["kaiser1974", "field2018"],
  },
  {
    id: "bartlett",
    step: "structure",
    check: "Bartlett's test of sphericity",
    value: "p < .05",
    why: "Tests whether the items are correlated at all. With realistic sample sizes it is almost always significant, so it is a minimum check only.",
    refs: ["bartlett1950"],
  },
  {
    id: "sample",
    step: "structure",
    check: "Sample size",
    value: "No single minimum; the lab notes samples under 150",
    why: "MacCallum et al. showed that the sample needed depends on communalities and on how many items define each factor: with high communalities (around .60 or more) and several items per factor, smaller samples can work; with low communalities, several hundred may not be enough.",
    refs: ["maccallum1999"],
  },
  {
    id: "parallel",
    step: "structure",
    check: "Number of factors",
    value: "Keep factors whose eigenvalue beats the 95th percentile of random data",
    why: "Horn's parallel analysis, using the 95th percentile as Glorfeld recommended. The older eigenvalue-greater-than-one rule tends to keep too many factors (Zwick & Velicer).",
    refs: ["horn1965", "glorfeld1995", "zwick1986"],
  },
  {
    id: "salient",
    step: "structure",
    check: "Salient loading (the slider)",
    value: "|λ| ≥ .40 by default; adjustable from .30 to .50",
    why: "Stevens suggests .40 for interpretation. Hair et al. link the cut-off to sample size: a loading of .40 is statistically significant with about 200 respondents, .30 needs about 350 and .50 about 120. Tabachnick and Fidell treat .32 as the minimum worth interpreting.",
    refs: ["stevens1992", "hair2010", "tabachnick2019"],
  },
  {
    id: "cross",
    step: "structure",
    check: "Cross-loading",
    value: "|λ| ≥ .32 on a second factor",
    why: "Costello and Osborne define a cross-loading item as one that loads at .32 or higher on two or more factors.",
    refs: ["costello2005"],
  },
  {
    id: "communality",
    step: "structure",
    check: "Communality (h²)",
    value: "Below .40 worth a look",
    why: "Costello and Osborne note that an item with a communality below .40 may not be related to the other items, or may point to an additional factor. Communalities of .40 to .70 are common in social science data.",
    refs: ["costello2005"],
  },
  {
    id: "rmsr",
    step: "structure",
    check: "Root mean square of residuals (RMSR)",
    value: "Below .05 good",
    why: "There is no agreed cut-off for RMSR in exploratory analysis. Field advises that fewer than half of the residual correlations should exceed .05; an average residual below .05 is consistent with that.",
    refs: ["field2018"],
  },
  {
    id: "rotation",
    step: "structure",
    check: "Rotation",
    value: "Oblimin (oblique) by default",
    why: "Costello and Osborne recommend oblique rotation because it reproduces an orthogonal solution when factors are uncorrelated, but not the reverse; Fabrigar et al. make the same case.",
    refs: ["costello2005", "fabrigar1999"],
  },
  {
    id: "phi",
    step: "structure",
    check: "Factor correlations",
    value: "Above .85 suggests two factors may be one",
    why: "Brown treats factor correlations of .85 or more as evidence of poor discriminant validity.",
    refs: ["brown2015"],
  },
  // ------------------------------------------------------------ step 5
  {
    id: "cfa-fit",
    step: "report",
    check: "CFA fit (in R, next study)",
    value: "CFI and TLI ≥ .95; RMSEA ≤ .06; SRMR ≤ .08",
    why: "Hu and Bentler's widely used criteria. They were derived from simulations under particular conditions, so treat them as guides rather than pass marks.",
    refs: ["hu1999"],
  },
];

export const cite = (ids: string[]) => ids.map((id) => REFS[id]?.short).filter(Boolean).join("; ");
