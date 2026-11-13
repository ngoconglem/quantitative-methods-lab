import { useEffect, useState } from "react";
import Tests from "./pages/Tests";
import Home from "./pages/Home";
import Analyse from "./pages/Analyse";
import Learn from "./pages/Learn";
import About from "./pages/About";
import Describe from "./pages/m/Describe";
import Correlate from "./pages/m/Correlate";
import Groups from "./pages/m/Groups";
import Regress from "./pages/m/Regress";
import Categorical from "./pages/m/Categorical";
import Anova from "./pages/m/Anova";
import Sem from "./pages/m/Sem";
import Bayes from "./pages/m/Bayes";
import LevelPage from "./pages/LevelPage";
import Intro from "./pages/Intro";
import { Walkthrough, ShowWalkthrough } from "./components/Walkthrough";
import { MODULES, type LevelKey } from "./lib/modules";
import Scales from "./pages/Scales";
import { GuideProvider, GuideToggle } from "./components/Guide";
import { REPO_URL } from "./config";

function useRoute(): string {
  const parse = () => window.location.hash.replace(/^#\/?/, "");
  const [route, setRoute] = useState(parse);
  useEffect(() => {
    const on = () => {
      setRoute(parse());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return route;
}

const LESSONS = ["describe", "correlate", "groups", "chisquare", "categorical", "anova", "regress", "sem", "bayes", "logistic"];
const MODULE_KEYS = [...LESSONS, "scales", "analyse", "learn"];
const LEVEL_KEYS = ["descriptive", "basic", "advanced", "modelling"];

const NAV = [
  { href: "#intro", key: "intro", label: "Introduction" },
  { href: "#tests", key: "tests", label: "Which test?" },
  { href: "#descriptive", key: "descriptive", label: "Descriptive" },
  { href: "#basic", key: "basic", label: "Basic" },
  { href: "#advanced", key: "advanced", label: "Advanced" },
  { href: "#modelling", key: "modelling", label: "Modelling" },
  { href: "#scales", key: "scales", label: "Scales" },
  { href: "#about", key: "about", label: "About" },
];

const TITLES: Record<string, string> = {
  intro: "Introduction to quantitative research",
  start: "Introduction to quantitative research",
  tests: "Which test?",
  describe: "Describing data",
  correlate: "Correlation",
  groups: "Two groups",
  chisquare: "Counting categories",
  anova: "Three or more groups",
  sem: "Structural equation modelling",
  bayes: "Bayesian modelling",
  logistic: "Logistic regression",
  scales: "Scale development",
  levels: "All modules",
  descriptive: "Descriptive statistics",
  basic: "Basic tests",
  advanced: "Advanced statistics",
  modelling: "Modelling",
  regress: "Multiple regression",
  categorical: "Categorical outcomes",
  analyse: "Measurement",
  learn: "Measurement: background",
  about: "About & data",
};

export default function App() {
  const route = useRoute();
  const page = route.startsWith("tests") ? "tests" : route.startsWith("analyse") ? "analyse" : route.startsWith("glossary") ? "glossary" : route.startsWith("learn") ? "learn" : route;

  useEffect(() => {
    document.title = TITLES[page] ? `${TITLES[page]} · Quantitative Methods Lab` : "Quantitative Methods Lab: plain-language statistics for the applied social sciences";
  }, [page]);

  return (
    <GuideProvider>
      <header className="topbar">
        <div className="shell">
          <a className="wordmark" href="#">
            <span>Quantitative Methods</span> Lab
          </a>
          <nav className="nav" aria-label="Main">
            {NAV.map((n) => (
              <a
                key={n.key}
                href={n.href}
                aria-current={page === n.key || MODULES.find((m) => m.key === page)?.level === n.key || (n.key === "scales" && ["analyse", "learn"].includes(page)) || (n.key === "modelling" && page === "categorical") ? "page" : undefined}
              >
                {n.label}
              </a>
            ))}
          </nav>
          <GuideToggle />
        </div>
      </header>
      <main>
        <div className="shell">
          <Walkthrough />
          {LEVEL_KEYS.includes(page) && <LevelPage key={page} level={page as LevelKey} />}
          {page === "describe" && <Describe />}
          {page === "correlate" && <Correlate />}
          {page === "groups" && <Groups />}
          {page === "regress" && <Regress />}
          {(page === "chisquare" || page === "categorical") && <Categorical part="chisq" />}
          {page === "logistic" && <Categorical part="logistic" />}
          {page === "anova" && <Anova />}
          {page === "sem" && <Sem />}
          {page === "bayes" && <Bayes />}
          {page === "scales" && <Scales />}
          {page === "analyse" && <Analyse key={route} initialSample={route === "analyse-simulated" ? "writing_ai_simulated" : route === "analyse-bfi" ? "bfi" : undefined} />}
          {page === "learn" && <Learn key={route} focus={route.split("/")[1]} />}
          {(page === "intro" || page === "start") && <Intro />}
          {page === "tests" && <Tests key={route} focus={route.split("/")[1]} />}
          {page === "about" && <About />}
          {![...MODULE_KEYS, ...LEVEL_KEYS, "intro", "start", "tests", "about"].includes(page) && <Home key={route} focus={page === "levels" ? "levels" : undefined} />}
        </div>
      </main>
      <footer>
        <div className="shell">
          <div className="footer-cite">
            <p className="footer-label">How to cite</p>
            <p>
              Cong-Lem, N. (2026). <em>Quantitative Methods Lab: Plain-language statistics for the applied social sciences</em> (Version 0.4.0)
              [Computer software]. https://quant-methods-lab.vercel.app
            </p>
          </div>
          <div className="footer-meta">
            <span>
              An open resource by <a href="https://research.monash.edu/en/persons/cong-ngo/">Dr Cong Ngo</a>. Code MIT; data under their own
              licences.
            </span>
            <span className="footer-links">
              <ShowWalkthrough />
              <a href={REPO_URL}>Source code and Python notebooks</a>
            </span>
          </div>
        </div>
      </footer>
    </GuideProvider>
  );
}
