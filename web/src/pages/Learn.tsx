import { useEffect } from "react";
import { Guide, Term } from "../components/Guide";
import { CutoffTable, ReferenceList } from "../components/Cutoffs";

const TOPICS: { id: string; title: string; short: React.ReactNode; body: React.ReactNode }[] = [
  {
    id: "alpha-omega",
    title: "Alpha, omega and what they do not tell you",
    short: (
      <>
        Alpha and omega tell you whether the items in a subscale give consistent answers. Prefer omega. Neither tells you that the subscale
        measures only one thing, so check that with factor analysis first.
      </>
    ),
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
          .30 suggest weak fit (Field, 2018). A negative value almost always means a reverse-worded item has not been reverse-scored.
        </p>
      </>
    ),
  },
  {
    id: "factorability",
    title: "Is factor analysis appropriate?",
    short: (
      <>
        Before looking for factors, check that the items share enough in common (KMO of .60 or more) and that you have enough respondents.
        Bartlett's test is a minimum check that almost always passes.
      </>
    ),
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
    short: (
      <>
        Keep the factors that are stronger than what random data would produce (parallel analysis), then check that the solution makes sense
        given the theory behind your questionnaire.
      </>
    ),
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
    short: (
      <>
        Use principal axis factoring with an oblique rotation (oblimin) unless you have a strong reason not to. Read the loadings: each item
        should load .40 or more on one factor and little on the others.
      </>
    ),
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
          Loadings of |.40| or more are commonly treated as salient. Items that load saliently on no factor, or .32 or more on a second
          factor (Costello &amp; Osborne, 2005), need a closer look at their wording, not automatic deletion. See the{" "}
          <a href="#learn/cutoffs">cut-off table</a> for the sources of every threshold.
        </p>
      </>
    ),
  },
  {
    id: "limits",
    title: "What this lab does not do",
    short: <>This lab covers the internal structure of a scale. Confirmatory analysis, invariance testing and other kinds of validity evidence need other tools.</>,
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

export default function Learn({ focus }: { focus?: string }) {
  useEffect(() => {
    if (focus) document.getElementById(focus)?.scrollIntoView({ block: "start" });
  }, [focus]);
  return (
    <div className="prose">
      <h1>Measurement: background reading</h1>
      <p className="lede">Short explanations of each step in the lab, with the sources to cite.</p>

      <h2>The big picture, for complete beginners</h2>
      <p>
        A questionnaire tries to measure something you cannot observe directly, such as confidence in writing or dependence on AI. This is
        called a <Term id="construct">construct</Term>. Because no single question captures it, you ask several related questions (
        <Term id="item">items</Term>) and combine the answers into a score.
      </p>
      <p>That only works if three things are true, and each step of the lab checks one of them:</p>
      <ol>
        <li>
          <strong>Each item works on its own</strong>: people answered it and did not all give the same answer (step 2, Items).
        </li>
        <li>
          <strong>The items in a group agree with each other</strong>, so the combined score is consistent (step 3,{" "}
          <Term id="reliability">reliability</Term>).
        </li>
        <li>
          <strong>The items group the way you intended</strong>: items written for “confidence” go together, separate from items written for
          “dependence” (step 4, <Term id="efa">factor analysis</Term>).
        </li>
      </ol>
      <p>
        Passing these checks is necessary but not enough to show a questionnaire is valid: you also need evidence that the items cover the
        construct well and that scores relate to other measures as expected (<Term id="validity">validity evidence</Term>). The rest of this page
        explains each check in more depth. For any single term, see the <a href="#glossary">glossary</a>.
      </p>

      <h2>Topics</h2>
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
          <Guide title="In short">
            <p>{t.short}</p>
          </Guide>
          {t.body}
        </section>
      ))}
      <h2>Further reading on scale validation in applied linguistics</h2>
      <p>
        For an overview of how applied linguists validate scales, see Cong-Lem (2025), a review of methodological trends and challenges in
        scale validation in the field.
      </p>
      <section id="cutoffs" style={{ scrollMarginTop: 90 }}>
        <h2>Cut-off values and where they come from</h2>
        <p>
          Every threshold the lab uses to flag an item or label a result is listed here with the reason for it and its source. Two are the
          lab's own screening prompts and are marked as such. Cut-offs are conventions that help you decide where to look; report the actual
          values and explain your decisions rather than relying on a label.
        </p>
      </section>
      <CutoffTable title="All cut-offs" />
      <h2>References</h2>
      <ReferenceList include={["aera2014", "conglem2025", "dunn2014", "holgado2010", "mcneish2018"]} />
    </div>
  );
}
