const STEPS = [
  {
    title: "Find the test for your question",
    time: "2 minutes",
    href: "#tests",
    link: "Open Which test?",
    doIt: "Answer three questions about a study of your own: what you want to know, who is in each group, and what kind of outcome you have.",
    notice: "The answer names the test, the fallback when assumptions fail, the effect size to report and the R code.",
  },
  {
    title: "Look at your numbers first",
    time: "3 minutes",
    href: "#describe",
    link: "Open Describing data",
    doIt: "Look at the histogram of reaction times for 2,284 English words. Then tick “Show on a log scale”.",
    notice: "The raw times bunch up with a long tail to the right; on the log scale the shape is more even. The mean and median tell different stories when data are skewed.",
  },
  {
    title: "Guess the correlation",
    time: "3 minutes",
    href: "#correlate",
    link: "Open Correlation",
    doIt: "Play a few rounds of the guessing game: look at the cloud of dots and set the slider to your guess.",
    notice: "A correlation of .3 looks weak in a scatterplot, yet correlations of this size are common in language research. Seeing the cloud helps you read the number.",
  },
  {
    title: "See why one p-value is not enough",
    time: "4 minutes",
    href: "#groups",
    link: "Open Two groups",
    doIt: "Scroll to the sample-size activity. Run 200 studies with a small sample, then move the slider to a large sample and run them again.",
    notice: "The true difference never changes, but small studies often miss it. The effect size travels with the data; significance depends on sample size.",
  },
  {
    title: "Build a regression model",
    time: "4 minutes",
    href: "#regress",
    link: "Open Multiple regression",
    doIt: "Tick one predictor, read the “In plain words” column, then add a second predictor and watch the first one's coefficient.",
    notice: "A predictor's effect can shrink when an overlapping predictor joins the model. That is what “holding the others constant” means.",
  },
];

export default function Start() {
  return (
    <article>
      <h1>Start here: a 15-minute tour</h1>
      <p className="lede">
        No statistics background is needed. Follow the five steps in order; each opens a module and tells you what to look for. Every module
        then has a short quiz, a ready-to-adapt reporting sentence and R and Python code.
      </p>
      <ol className="tour">
        {STEPS.map((s) => (
          <li key={s.title}>
            <h2>
              {s.title} <span className="tour-time">{s.time}</span>
            </h2>
            <p>
              <strong>Do:</strong> {s.doIt}
            </p>
            <p>
              <strong>Notice:</strong> {s.notice}
            </p>
            <a className="button" href={s.href}>
              {s.link}
            </a>
          </li>
        ))}
      </ol>
      <h2>After the tour</h2>
      <ul className="lab-steps">
        <li>
          Work through the modules in order, or pick the one your study needs. <a href="#chisquare">Counting categories</a> and <a href="#logistic">Logistic regression</a> cover choices between forms; <a href="#scales">Scale development</a> takes a questionnaire from items to EFA and CFA.
        </li>
        <li>Unfamiliar term? Click any underlined word for a short definition.</li>
      </ul>
    </article>
  );
}
