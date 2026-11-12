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

Object.assign(REFS, {
  wasserstein2016: {
    short: "Wasserstein & Lazar (2016)",
    full: "Wasserstein, R. L., & Lazar, N. A. (2016). The ASA statement on p-values: Context, process, and purpose. The American Statistician, 70(2), 129–133.",
    url: "https://doi.org/10.1080/00031305.2016.1154108",
  },
  stevens1946: {
    short: "Stevens (1946)",
    full: "Stevens, S. S. (1946). On the theory of scales of measurement. Science, 103(2684), 677–680.",
    url: "https://doi.org/10.1126/science.103.2684.677",
  },
  norman2010: {
    short: "Norman (2010)",
    full: "Norman, G. (2010). Likert scales, levels of measurement and the “laws” of statistics. Advances in Health Sciences Education, 15(5), 625–632.",
    url: "https://doi.org/10.1007/s10459-010-9222-y",
  },
  liddell2018: {
    short: "Liddell & Kruschke (2018)",
    full: "Liddell, T. M., & Kruschke, J. K. (2018). Analyzing ordinal data with metric models: What could possibly go wrong? Journal of Experimental Social Psychology, 79, 328–348.",
    url: "https://doi.org/10.1016/j.jesp.2018.08.009",
  },
  lumley2002: {
    short: "Lumley et al. (2002)",
    full: "Lumley, T., Diehr, P., Emerson, S., & Chen, L. (2002). The importance of the normality assumption in large public health data sets. Annual Review of Public Health, 23, 151–169.",
    url: "https://doi.org/10.1146/annurev.publhealth.23.100901.140546",
  },
  wilcox2017: {
    short: "Wilcox (2017)",
    full: "Wilcox, R. R. (2017). Introduction to robust estimation and hypothesis testing (4th ed.). Academic Press.",
  },
  plonsky2014: {
    short: "Plonsky & Oswald (2014)",
    full: "Plonsky, L., & Oswald, F. L. (2014). How big is “big”? Interpreting effect sizes in L2 research. Language Learning, 64(4), 878–912.",
    url: "https://doi.org/10.1111/lang.12079",
  },
  baayen2008mixed: {
    short: "Baayen et al. (2008)",
    full: "Baayen, R. H., Davidson, D. J., & Bates, D. M. (2008). Mixed-effects modeling with crossed random effects for subjects and items. Journal of Memory and Language, 59(4), 390–412.",
    url: "https://doi.org/10.1016/j.jml.2007.12.005",
  },
  boateng2018: {
    short: "Boateng et al. (2018)",
    full: "Boateng, G. O., Neilands, T. B., Frongillo, E. A., Melgar-Quiñonez, H. R., & Young, S. L. (2018). Best practices for developing and validating scales for health, social, and behavioral research: A primer. Frontiers in Public Health, 6, 149.",
    url: "https://doi.org/10.3389/fpubh.2018.00149",
  },
  devellis2022: {
    short: "DeVellis & Thorpe (2022)",
    full: "DeVellis, R. F., & Thorpe, C. T. (2022). Scale development: Theory and applications (5th ed.). SAGE.",
  },
  deardorff2006: {
    short: "Deardorff (2006)",
    full: "Deardorff, D. K. (2006). Identification and assessment of intercultural competence as a student outcome of internationalization. Journal of Studies in International Education, 10(3), 241–266.",
    url: "https://doi.org/10.1177/1028315306287002",
  },
  willis2005: {
    short: "Willis (2005)",
    full: "Willis, G. B. (2005). Cognitive interviewing: A tool for improving questionnaire design. SAGE.",
  },
  polit2007: {
    short: "Polit et al. (2007)",
    full: "Polit, D. F., Beck, C. T., & Owen, S. V. (2007). Is the CVI an acceptable indicator of content validity? Appraisal and recommendations. Research in Nursing & Health, 30(4), 459–467.",
    url: "https://doi.org/10.1002/nur.20199",
  },
  lee2013: {
    short: "Lee & Wagenmakers (2013)",
    full: "Lee, M. D., & Wagenmakers, E.-J. (2013). Bayesian cognitive modeling: A practical course. Cambridge University Press.",
  },
  preacher2008: {
    short: "Preacher & Hayes (2008)",
    full: "Preacher, K. J., & Hayes, A. F. (2008). Asymptotic and resampling strategies for assessing and comparing indirect effects in multiple mediator models. Behavior Research Methods, 40(3), 879–891.",
    url: "https://doi.org/10.3758/BRM.40.3.879",
  },
  fornell1981: {
    short: "Fornell & Larcker (1981)",
    full: "Fornell, C., & Larcker, D. F. (1981). Evaluating structural equation models with unobservable variables and measurement error. Journal of Marketing Research, 18(1), 39–50.",
    url: "https://doi.org/10.1177/002224378101800104",
  },
  byram1997: {
    short: "Byram (1997)",
    full: "Byram, M. (1997). Teaching and assessing intercultural communicative competence. Multilingual Matters.",
  },
  holm1979: {
    short: "Holm (1979)",
    full: "Holm, S. (1979). A simple sequentially rejective multiple test procedure. Scandinavian Journal of Statistics, 6(2), 65–70.",
  },
  welch1951: {
    short: "Welch (1951)",
    full: "Welch, B. L. (1951). On the comparison of several mean values: An alternative approach. Biometrika, 38(3/4), 330–336.",
    url: "https://doi.org/10.2307/2332579",
  },
  delacre2017: {
    short: "Delacre et al. (2017)",
    full: "Delacre, M., Lakens, D., & Leys, C. (2017). Why psychologists should by default use Welch's t-test instead of Student's t-test. International Review of Social Psychology, 30(1), 92–101.",
    url: "https://doi.org/10.5334/irsp.82",
  },
  cochran1954: {
    short: "Cochran (1954)",
    full: "Cochran, W. G. (1954). Some methods for strengthening the common χ² tests. Biometrics, 10(4), 417–451.",
    url: "https://doi.org/10.2307/3001616",
  },
  peduzzi1996: {
    short: "Peduzzi et al. (1996)",
    full: "Peduzzi, P., Concato, J., Kemper, E., Holford, T. R., & Feinstein, A. R. (1996). A simulation study of the number of events per variable in logistic regression analysis. Journal of Clinical Epidemiology, 49(12), 1373–1379.",
    url: "https://doi.org/10.1016/S0895-4356(96)00236-3",
  },
  james2013: {
    short: "James et al. (2013)",
    full: "James, G., Witten, D., Hastie, T., & Tibshirani, R. (2013). An introduction to statistical learning. Springer.",
  },
  baayen2008: {
    short: "Baayen (2008)",
    full: "Baayen, R. H. (2008). Analyzing linguistic data: A practical introduction to statistics using R. Cambridge University Press.",
  },
  bresnan2007: {
    short: "Bresnan et al. (2007)",
    full: "Bresnan, J., Cueni, A., Nikitina, T., & Baayen, R. H. (2007). Predicting the dative alternation. In G. Bouma, I. Krämer, & J. Zwarts (Eds.), Cognitive foundations of interpretation (pp. 69–94). Royal Netherlands Academy of Science.",
  },
  balota2004: {
    short: "Balota et al. (2004)",
    full: "Balota, D. A., Cortese, M. J., Sergent-Marshall, S. D., Spieler, D. H., & Yap, M. J. (2004). Visual word recognition of single-syllable words. Journal of Experimental Psychology: General, 133(2), 283–316.",
    url: "https://doi.org/10.1037/0096-3445.133.2.283",
  },
  crossley2023: {
    short: "Crossley et al. (2023)",
    full: "Crossley, S. A., Tian, Y., Baffour, P., Franklin, A., Kim, Y., Morris, W., Benner, B., Picou, A., & Boser, U. (2023). Measuring second language proficiency using the English Language Learner Insight, Proficiency and Skills Evaluation (ELLIPSE) Corpus. International Journal of Learner Corpus Research, 9(2), 248–269.",
    url: "https://doi.org/10.1075/ijlcr.22026.cro",
  },
});

export type StepKey = "items" | "reliability" | "structure" | "report" | "describe" | "correlation" | "groups" | "regression" | "categorical" | "anova" | "cfa" | "sem" | "bayes";

export interface Cutoff {
  id: string;
  step: StepKey;
  check: string;
  value: string;
  why: string;
  refs: string[];
}

export const CUTOFFS: Cutoff[] = [
  {
    id: "sem-fit",
    step: "sem",
    check: "Model fit",
    value: "CFI and TLI ≥ .95; RMSEA ≤ .06; SRMR ≤ .08",
    why: "The same guides as for CFA. Treat them as guides, not pass marks, and compare alternative models.",
    refs: ["hu1999"],
  },
  {
    id: "indirect",
    step: "sem",
    check: "Indirect (mediated) effect",
    value: "95% CI excluding 0; bootstrap preferred",
    why: "The product a × b is not normally distributed in small samples, so bootstrap confidence intervals are recommended over the normal-theory (Sobel) test.",
    refs: ["preacher2008"],
  },
  {
    id: "bf",
    step: "bayes",
    check: "Bayes factor",
    value: "1–3 anecdotal, 3–10 moderate, 10–30 strong, 30–100 very strong, > 100 extreme",
    why: "A widely used labelling, adapted from Jeffreys. The same bands apply in reverse (1/3, 1/10…) for evidence for no effect.",
    refs: ["lee2013"],
  },
  // ------------------------------------------------------------ confirmatory factor analysis
  {
    id: "i-cvi",
    step: "cfa",
    check: "Expert relevance ratings (I-CVI)",
    value: "≥ .78 per item",
    why: "The share of experts rating an item relevant (3 or 4 on a 4-point scale). Polit, Beck and Owen suggest .78 or higher, with three or more experts, as good content validity; revise or drop items below it.",
    refs: ["polit2007"],
  },
  {
    id: "cfa-fit-indices",
    step: "cfa",
    check: "Model fit",
    value: "CFI and TLI ≥ .95; RMSEA ≤ .06; SRMR ≤ .08",
    why: "Hu and Bentler's widely used criteria, derived from simulations under particular conditions. Treat them as guides, and look at loadings and residuals too.",
    refs: ["hu1999"],
  },
  {
    id: "cfa-loading",
    step: "cfa",
    check: "Standardised loading",
    value: "≥ .50 (ideally ≥ .70)",
    why: "An item with a loading below .50 shares less than a quarter of its variance with its factor. The thresholds are conventions, not laws.",
    refs: ["hair2010"],
  },
  {
    id: "cr-ave",
    step: "cfa",
    check: "Composite reliability and AVE",
    value: "CR ≥ .70; AVE ≥ .50",
    why: "Composite reliability is the CFA version of omega. Average variance extracted (AVE) of .50 or more means the factor explains at least half of its items' variance on average.",
    refs: ["fornell1981", "hair2010"],
  },
  // ------------------------------------------------------------ three or more groups
  {
    id: "omega2",
    step: "anova",
    check: "How much group matters (ω² or η²)",
    value: ".01 small, .06 medium, .14 large",
    why: "Cohen's benchmarks for the share of variation explained. ω² corrects η²'s upward bias in small samples. As with d, compare with typical effects in your field.",
    refs: ["cohen1988"],
  },
  {
    id: "welch-anova",
    step: "anova",
    check: "Which overall test",
    value: "Welch's ANOVA by default",
    why: "Welch's F does not assume equal variances across groups, the same reasoning as Welch's t-test for two groups.",
    refs: ["welch1951", "delacre2017"],
  },
  {
    id: "holm",
    step: "anova",
    check: "Many pairwise tests",
    value: "Adjust p-values (Holm)",
    why: "Each extra test adds a chance of a false alarm. Holm's method keeps the overall false-alarm rate at 5% and is never less powerful than the Bonferroni correction.",
    refs: ["holm1979"],
  },
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
  // ------------------------------------------------------------ statistics modules
  {
    id: "skew-describe",
    step: "describe",
    check: "Skew",
    value: "Beyond ±2 treated as strong skew",
    why: "Kim gives an absolute skew above 2 as a reference value for substantial non-normality in samples over 300. Strongly skewed measures such as reaction times and word frequencies are often analysed on a log scale.",
    refs: ["kim2013"],
  },
  {
    id: "alpha-05",
    step: "correlation",
    check: "Statistical significance",
    value: "p < .05 by convention",
    why: "A convention, not a law. The American Statistical Association warns that a p-value does not measure the size or importance of an effect, so the lab always reports an effect size and confidence interval beside it.",
    refs: ["wasserstein2016"],
  },
  {
    id: "r-size",
    step: "correlation",
    check: "Size of a correlation (r)",
    value: ".10 small, .30 medium, .50 large",
    why: "Cohen's benchmarks, offered as a last resort when there is nothing better to compare with. Compare with correlations reported in your own field where you can.",
    refs: ["cohen1988"],
  },
  {
    id: "d-size",
    step: "groups",
    check: "Size of a difference (Cohen's d)",
    value: "0.2 small, 0.5 medium, 0.8 large",
    why: "Cohen's benchmarks for the difference between two means in standard-deviation units. Even a large d leaves the two groups overlapping a great deal.",
    refs: ["cohen1988"],
  },
  {
    id: "welch",
    step: "groups",
    check: "Which t-test",
    value: "Welch's t-test by default",
    why: "Welch's test does not assume the two groups have equal variances, and loses almost nothing when they do. Delacre et al. recommend it as the default.",
    refs: ["delacre2017"],
  },
  {
    id: "p-groups",
    step: "groups",
    check: "Statistical significance",
    value: "p < .05 by convention",
    why: "With large samples, tiny and unimportant differences become significant. Judge the size of the difference and its confidence interval, not the p-value alone.",
    refs: ["wasserstein2016"],
  },
  {
    id: "f2",
    step: "regression",
    check: "Size of a model (R² and f²)",
    value: "f² of .02 small, .15 medium, .35 large",
    why: "Cohen's benchmarks for f² = R² / (1 − R²). An R² that is small by these standards can still matter in practice, and one that is large can come from a trivial predictor.",
    refs: ["cohen1988"],
  },
  {
    id: "vif",
    step: "regression",
    check: "Overlapping predictors (VIF)",
    value: "VIF above 5 or 10 worth attention",
    why: "James et al. give a variance inflation factor above 5 or 10 as a sign of problematic collinearity: the predictors carry so much of the same information that their separate effects are estimated imprecisely.",
    refs: ["james2013"],
  },
  {
    id: "expected5",
    step: "categorical",
    check: "Expected counts for chi-square",
    value: "Expected count of at least 5 in most cells",
    why: "Cochran's guidance: the chi-square approximation is unreliable when expected counts are small (no more than 20% of cells below 5, and none below 1).",
    refs: ["cochran1954"],
  },
  {
    id: "v-size",
    step: "categorical",
    check: "Size of an association (Cramér's V)",
    value: ".10 small, .30 medium, .50 large (2 × 2 tables)",
    why: "For a 2 × 2 table, Cramér's V equals Cohen's w, with these benchmarks. Larger tables have lower benchmarks.",
    refs: ["cohen1988"],
  },
  {
    id: "epv",
    step: "categorical",
    check: "Events per predictor in logistic regression",
    value: "At least 10 events per predictor",
    why: "Peduzzi et al.'s simulations found unreliable estimates when there were fewer than about 10 cases of the rarer outcome for each predictor.",
    refs: ["peduzzi1996"],
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
