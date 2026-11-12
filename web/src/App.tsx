import { useEffect, useState } from "react";
import Start from "./pages/Start";
import Tests from "./pages/Tests";
import Home from "./pages/Home";
import Analyse from "./pages/Analyse";
import Learn from "./pages/Learn";
import Teach from "./pages/Teach";
import About from "./pages/About";
import Glossary from "./pages/Glossary";
import Describe from "./pages/m/Describe";
import Correlate from "./pages/m/Correlate";
import Groups from "./pages/m/Groups";
import Regress from "./pages/m/Regress";
import Categorical from "./pages/m/Categorical";
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

const MODULE_KEYS = ["describe", "correlate", "groups", "regress", "categorical", "analyse", "learn"];

const NAV = [
  { href: "#start", key: "start", label: "Start here" },
  { href: "#tests", key: "tests", label: "Which test?" },
  { href: "#describe", key: "modules", label: "Modules" },
  { href: "#analyse", key: "analyse", label: "Measurement" },
  { href: "#teach", key: "teach", label: "Teach with it" },
  { href: "#glossary", key: "glossary", label: "Glossary" },
  { href: "#about", key: "about", label: "About" },
];

const TITLES: Record<string, string> = {
  start: "Start here",
  tests: "Which test?",
  describe: "Describing data",
  correlate: "Correlation",
  groups: "Comparing two groups",
  regress: "Linear regression",
  categorical: "Categorical outcomes",
  analyse: "Measurement",
  learn: "Measurement: background",
  teach: "Teach with it",
  glossary: "Glossary",
  about: "About & data",
};

export default function App() {
  const route = useRoute();
  const page = route.startsWith("tests") ? "tests" : route.startsWith("analyse") ? "analyse" : route.startsWith("glossary") ? "glossary" : route.startsWith("learn") ? "learn" : route;

  useEffect(() => {
    document.title = TITLES[page] ? `${TITLES[page]} · Quantitative Methods Lab` : "Quantitative Methods Lab: statistics for language research, explained with real data";
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
                aria-current={page === n.key || (n.key === "modules" && ["describe", "correlate", "groups", "regress", "categorical"].includes(page)) || (n.key === "analyse" && page === "learn") ? "page" : undefined}
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
          {page === "describe" && <Describe />}
          {page === "correlate" && <Correlate />}
          {page === "groups" && <Groups />}
          {page === "regress" && <Regress />}
          {page === "categorical" && <Categorical />}
          {page === "analyse" && <Analyse key={route} initialSample={route === "analyse-simulated" ? "writing_ai_simulated" : route === "analyse-bfi" ? "bfi" : undefined} />}
          {page === "learn" && <Learn key={route} focus={route.split("/")[1]} />}
          {page === "start" && <Start />}
          {page === "tests" && <Tests key={route} focus={route.split("/")[1]} />}
          {page === "teach" && <Teach />}
          {page === "about" && <About />}
          {page === "glossary" && <Glossary key={route} focus={route.split("/")[1]} />}
          {![...MODULE_KEYS, "start", "tests", "teach", "about", "glossary"].includes(page) && <Home />}
        </div>
      </main>
      <footer>
        <div className="shell">
          <span>
            Quantitative Methods Lab, an open resource by <a href="https://research.monash.edu/en/persons/cong-ngo/">Dr Cong Ngo</a>. Code MIT; sample
            data under their own licences.
          </span>
          <span>
            <a href={REPO_URL}>Source code and Python notebooks</a>
          </span>
        </div>
      </footer>
    </GuideProvider>
  );
}
