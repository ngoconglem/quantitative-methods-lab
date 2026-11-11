const TOPICS: { id: string; title: string; body: React.ReactNode }[] = [
  {
    id: "alpha-omega",
    title: "Alpha, omega and what they do not tell you",
    body: (
      <>
        <p>
          Cronbach's alpha estimates how much of the variance in a total score is shared variance rather than noise. It assumes every item
          relates to the construct equally strongly (tau-equivalence). When loadings differ, as they usually do, alpha underestimates
          reliability. McDonald's omega uses the factor loadings themselves and does not need that assumption, so it is generally preferred
          (Dunn, Baguley, &amp; Brunsden, 2014; McNeish, 2018).
        </p>
        <p>
          Neither statistic shows that a scale measures one thing. Alpha rises with the number of items: in the sample bfi data, all 25
          personality items together give α = .70, a value often called “acceptable”, even though they measure five distinct traits. Check
          dimensionality with factor analysis first, then estimate reliability for each dimension.
        </p>
        <p>
          The corrected item-total correlation is the correlation between an item and the sum of the other items in its subscale. Values below
          .30 suggest weak fit. A negative value almost always means a reverse-worded item has not been reverse-scored.
        </p>
      </>
    ),
  },
  {
    id: "factorability",
    title: "Is factor analysis appropriate?",
    body: (
      <>
        <p>
          The Kaiser–Meyer–Olkin (KMO) measure compares the size of the correlations with the size of the partial correlations. If items share
          a common factor, partial correlations are small and KMO is high. Values of .80 and above are good, .60 is a common minimum, and
          per-item values below .60 identify items that share little with the rest (Kaiser, 1974).
        </p>
        <p>
          Bartlett's test checks whether the correlation matrix differs from an identity matrix. With any realistic sample it is almost always
          significant, so it is a minimum check rather than evidence of good structure (Bartlett, 1950).
        </p>
        <p>
          Sample size matters more than rules of thumb such as ten respondents per item suggest: with strong loadings and several items per
          factor, samples of 150–200 can be enough; with weak loadings, far larger samples are needed (MacCallum, Widaman, Zhang, &amp; Hong,
          1999).
        </p>
      </>
    ),
  },
  {
    id: "how-many",
    title: "How many factors?",
    body: (
      <>
        <p>
          Parallel analysis generates many random datasets with the same number of respondents and items, and retains the factors whose
          eigenvalues exceed those from random data (Horn, 1965). This lab uses principal-component eigenvalues and the 95th percentile of 100
          random datasets (50 for large files), with a fixed random seed so results are reproducible.
        </p>
        <p>
          The eigenvalue-greater-than-one rule and the scree plot alone tend to retain too many factors or depend on the eye of the analyst.
          Treat parallel analysis as the starting point, then compare neighbouring solutions for interpretability and theory (Fabrigar,
          Wegener, MacCallum, &amp; Strahan, 1999).
        </p>
      </>
    ),
  },
  {
    id: "extraction-rotation",
    title: "Extraction and rotation",
    body: (
      <>
        <p>
          Principal axis factoring models only the variance items share, unlike principal component analysis, which also absorbs unique and
          error variance. It is a sound default for exploratory work and does not assume multivariate normality. Here it starts from squared
          multiple correlations and iterates until communalities stabilise; at convergence it gives the same solution as the minimum residual
          method (checked against the factor_analyzer package).
        </p>
        <p>
          Rotation makes loadings easier to interpret without changing the fit. Oblique rotations such as oblimin let factors correlate;
          orthogonal rotations such as varimax force them to be uncorrelated. Constructs in education and the social sciences are almost
          always related, so an oblique rotation is the usual choice: if the factors are in fact uncorrelated, oblimin will show that (Costello
          &amp; Osborne, 2005).
        </p>
        <p>
          Loadings of |.40| or more are commonly treated as salient. Items that load saliently on no factor, or above .30 on two, need a closer
          look at their wording, not automatic deletion.
        </p>
      </>
    ),
  },
  {
    id: "limits",
    title: "What this lab does not do",
    body: (
      <ul>
        <li>
          It uses Pearson correlations. For items with few response options or strong skew, polychoric correlations are more accurate
          (Holgado-Tello, Chacón-Moscoso, Barbero-García, &amp; Vila-Abad, 2010). The lavaan code on the Report step uses them.
        </li>
        <li>It drops incomplete responses (listwise deletion). If many responses are missing, consider multiple imputation or FIML in R.</li>
        <li>It does not run confirmatory factor analysis, measurement invariance tests or item response theory models.</li>
        <li>
          Internal structure is only one of five sources of validity evidence. Content, response processes, relations to other variables and
          consequences of use need their own evidence (AERA, APA, &amp; NCME, 2014).
        </li>
      </ul>
    ),
  },
];

export default function Learn() {
  return (
    <div className="prose">
      <h1>Learn the ideas</h1>
      <p className="lede">Short explanations of each step in the lab, with the sources to cite.</p>
      <ul>
        {TOPICS.map((t) => (
          <li key={t.id}>
            <a href={`#learn`} onClick={(e) => (e.preventDefault(), document.getElementById(t.id)?.scrollIntoView({ behavior: "smooth" }))}>
              {t.title}
            </a>
          </li>
        ))}
      </ul>
      {TOPICS.map((t) => (
        <section key={t.id} id={t.id} style={{ scrollMarginTop: 80 }}>
          <h2>{t.title}</h2>
          {t.body}
        </section>
      ))}
      <h2>Further reading on scale validation in applied linguistics</h2>
      <p>
        For an overview of how applied linguists validate scales, see Cong-Lem (2025), a review of methodological trends and challenges in
        scale validation in the field.
      </p>
      <h2>References</h2>
      <ul className="small">
        <li>American Educational Research Association, American Psychological Association, &amp; National Council on Measurement in Education. (2014). <em>Standards for educational and psychological testing</em>. AERA.</li>
        <li>Bartlett, M. S. (1950). Tests of significance in factor analysis. <em>British Journal of Statistical Psychology, 3</em>(2), 77–85.</li>
        <li>Cong-Lem, N. (2025). Scale validation in applied linguistics: Methodological trends and challenges. <em>Research Methods in Applied Linguistics, 4</em>(2), 100217.</li>
        <li>Costello, A. B., &amp; Osborne, J. (2005). Best practices in exploratory factor analysis. <em>Practical Assessment, Research, and Evaluation, 10</em>, Article 7.</li>
        <li>Dunn, T. J., Baguley, T., &amp; Brunsden, V. (2014). From alpha to omega. <em>British Journal of Psychology, 105</em>(3), 399–412.</li>
        <li>Fabrigar, L. R., Wegener, D. T., MacCallum, R. C., &amp; Strahan, E. J. (1999). Evaluating the use of exploratory factor analysis in psychological research. <em>Psychological Methods, 4</em>(3), 272–299.</li>
        <li>Feldt, L. S. (1965). The approximate sampling distribution of Kuder-Richardson reliability coefficient twenty. <em>Psychometrika, 30</em>(3), 357–370.</li>
        <li>Holgado-Tello, F. P., Chacón-Moscoso, S., Barbero-García, I., &amp; Vila-Abad, E. (2010). Polychoric versus Pearson correlations in exploratory and confirmatory factor analysis of ordinal variables. <em>Quality &amp; Quantity, 44</em>(1), 153–166.</li>
        <li>Horn, J. L. (1965). A rationale and test for the number of factors in factor analysis. <em>Psychometrika, 30</em>(2), 179–185.</li>
        <li>Kaiser, H. F. (1974). An index of factorial simplicity. <em>Psychometrika, 39</em>(1), 31–36.</li>
        <li>MacCallum, R. C., Widaman, K. F., Zhang, S., &amp; Hong, S. (1999). Sample size in factor analysis. <em>Psychological Methods, 4</em>(1), 84–99.</li>
        <li>McNeish, D. (2018). Thanks coefficient alpha, we'll take it from here. <em>Psychological Methods, 23</em>(3), 412–433.</li>
      </ul>
    </div>
  );
}
