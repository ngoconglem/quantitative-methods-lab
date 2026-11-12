export interface ModuleInfo {
  key: string;
  href: string;
  title: string;
  question: string;
  data: string;
}

export const MODULES: ModuleInfo[] = [
  { key: "describe", href: "#describe", title: "Describing data", question: "What do my numbers look like?", data: "Word recognition times" },
  { key: "correlate", href: "#correlate", title: "Correlation", question: "Do two measures go up and down together?", data: "Word frequency and reading speed; essay ratings" },
  { key: "groups", href: "#groups", title: "Comparing two groups", question: "Do two groups differ, and by how much?", data: "Young and older readers; learner essays; the dative" },
  { key: "regress", href: "#regress", title: "Linear regression", question: "How well do several measures together predict an outcome?", data: "Word recognition times; essay ratings" },
  { key: "categorical", href: "#categorical", title: "Categorical outcomes", question: "Which factors predict a choice between two forms?", data: "The English dative alternation" },
  { key: "analyse", href: "#analyse", title: "Measurement: reliability and factor analysis", question: "Does my questionnaire measure what I think it measures?", data: "Questionnaire responses (your own or samples)" },
];
