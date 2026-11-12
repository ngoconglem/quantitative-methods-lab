import { LEVELS, MODULES, type LevelKey } from "../lib/modules";

const INTRO: Record<string, { lede: string; before: string; pick: [string, string][] }> = {
  descriptive: {
    lede: "Before any test, look at your data. Averages, spread and a good chart show what is typical, what is unusual, and which test will suit.",
    before: "No background needed. Start here.",
    pick: [
      ["What is a typical value, and how spread out are the rest?", "Describing data"],
      ["Are there outliers or a long tail?", "Describing data"],
      ["Which chart suits my variable?", "Describing data"],
    ],
  },
  basic: {
    lede: "Tests that look at two variables at a time: does one measure go with another, do two groups differ, does a choice depend on the situation?",
    before: "Helpful first: Describing data.",
    pick: [
      ["Two numeric measures: do they go up and down together?", "Correlation"],
      ["A numeric outcome and two groups: do they differ?", "Two groups"],
      ["Two categories: does one depend on the other?", "Counting categories"],
    ],
  },
  advanced: {
    lede: "More groups, more predictors, and models of how variables influence each other. Also a different way of reasoning about evidence: Bayesian updating.",
    before: "Helpful first: Correlation and Two groups.",
    pick: [
      ["A numeric outcome and three or more groups", "Three or more groups"],
      ["A numeric outcome and several predictors", "Multiple regression"],
      ["Latent factors, mediation, a theory with several paths", "Structural equation modelling"],
      ["How probable is an effect, given the data and earlier evidence?", "Bayesian modelling"],
    ],
  },
  modelling: {
    lede: "Models for outcomes that are choices (yes or no, this form or that), with several factors weighed at once.",
    before: "Helpful first: Counting categories and Multiple regression.",
    pick: [["A yes/no or either/or outcome and several predictors", "Logistic regression"]],
  },
};

const ORDER: LevelKey[] = ["descriptive", "basic", "advanced", "modelling"];

export default function LevelPage({ level }: { level: LevelKey }) {
  const i = ORDER.indexOf(level);
  const l = LEVELS.find((x) => x.key === level)!;
  const mods = MODULES.filter((m) => m.level === level);
  const intro = INTRO[level];
  const next = ORDER[i + 1] ? LEVELS.find((x) => x.key === ORDER[i + 1])! : LEVELS.find((x) => x.key === "scales")!;
  const href = (title: string) => MODULES.find((m) => m.title === title || (title === "Scale development" && m.key === "scales"))?.href ?? "#";

  return (
    <article className={`level-page level-${level}`}>
      <nav className="level-strip" aria-label="Levels">
        {LEVELS.map((x, j) => (
          <a key={x.key} href={`#${x.key}`} className={`level-${x.key}`} aria-current={x.key === level ? "page" : undefined}>
            <span>{x.key === "scales" ? "Specialist" : `Level ${j + 1}`}</span>
            {x.title}
          </a>
        ))}
      </nav>

      <p className={`module-kicker level-${level}`}>Level {i + 1} of 4</p>
      <h1>{l.title}</h1>
      <p className="lede">{intro.lede}</p>
      <p className="small muted">{intro.before}</p>

      <h2>Which module answers your question?</h2>
      <table className="pick-table">
        <thead>
          <tr>
            <th>Your question</th>
            <th>Go to</th>
          </tr>
        </thead>
        <tbody>
          {intro.pick.map(([q, m]) => (
            <tr key={q}>
              <td>{q}</td>
              <td>
                <a href={href(m)}>{m}</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Modules at this level</h2>
      <div className={`level-cards${mods.length === 4 ? " four" : ""}`}>
        {mods.map((m) => (
          <a key={m.key} className="level-card" href={m.href}>
            <strong>{m.title}</strong>
            <span>{m.question}</span>
            <span className="level-card-data">Data: {m.data}</span>
          </a>
        ))}
      </div>

      <p className="level-next">
        <a className="button" href={`#${next.key}`}>
          Next: {next.title}
        </a>
        <a href="#tests">Not sure? Use Which test?</a>
      </p>
    </article>
  );
}
