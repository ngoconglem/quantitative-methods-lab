export type LevelKey = "descriptive" | "basic" | "advanced" | "modelling" | "scales";

export interface Level {
  key: LevelKey;
  title: string;
  blurb: string;
}

export const LEVELS: Level[] = [
  { key: "descriptive", title: "Descriptive", blurb: "Look at your data first" },
  { key: "basic", title: "Basic tests", blurb: "Two variables at a time" },
  { key: "advanced", title: "Advanced", blurb: "More groups, more predictors" },
  { key: "modelling", title: "Modelling", blurb: "Outcomes that are choices" },
  { key: "scales", title: "Scale development", blurb: "Build and test a questionnaire" },
];

export interface ModuleInfo {
  key: string;
  href: string;
  title: string;
  question: string;
  data: string;
  level: LevelKey;
}

export const MODULES: ModuleInfo[] = [
  { key: "describe", href: "#describe", level: "descriptive", title: "Describing data", question: "What do my numbers look like?", data: "Word recognition times" },
  { key: "correlate", href: "#correlate", level: "basic", title: "Correlation", question: "Do two measures go up and down together?", data: "Word frequency; essay ratings; intercultural contact (simulated)" },
  { key: "groups", href: "#groups", level: "basic", title: "Two groups", question: "Do two groups differ, and by how much?", data: "Young and older readers; learner essays; the dative" },
  { key: "chisquare", href: "#chisquare", level: "basic", title: "Counting categories", question: "Does a choice depend on the situation?", data: "The English dative alternation" },
  { key: "anova", href: "#anova", level: "advanced", title: "Three or more groups", question: "Do several groups differ, and which ones?", data: "Learner essays by grade; time abroad (simulated)" },
  { key: "regress", href: "#regress", level: "advanced", title: "Multiple regression", question: "How well do several measures together predict an outcome?", data: "Word recognition times; essay ratings" },
  { key: "logistic", href: "#logistic", level: "modelling", title: "Logistic regression", question: "Which factors together predict a choice?", data: "The English dative alternation" },
  { key: "scales", href: "#scales", level: "scales", title: "From items to a validated scale", question: "How do I show my questionnaire works? EFA, then CFA", data: "Intercultural competence survey (simulated)" },
  { key: "analyse", href: "#analyse", level: "scales", title: "Questionnaire analyser", question: "Check reliability and factor structure of your own data", data: "Your own CSV, or sample questionnaires" },
];

export const levelOf = (key: string) => LEVELS.find((l) => l.key === MODULES.find((m) => m.key === key)?.level);
