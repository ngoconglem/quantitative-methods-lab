import { useEffect, useState } from "react";
import Home from "./pages/Home";
import Analyse from "./pages/Analyse";
import Learn from "./pages/Learn";
import Teach from "./pages/Teach";
import About from "./pages/About";
import Glossary from "./pages/Glossary";
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

const NAV = [
  { href: "#analyse", key: "analyse", label: "Analyse" },
  { href: "#learn", key: "learn", label: "Learn" },
  { href: "#teach", key: "teach", label: "Teach with it" },
  { href: "#glossary", key: "glossary", label: "Glossary" },
  { href: "#about", key: "about", label: "About & data" },
];

const TITLES: Record<string, string> = { analyse: "Analyse", learn: "Learn", teach: "Teach with it", glossary: "Glossary", about: "About & data" };

export default function App() {
  const route = useRoute();
  const page = route.startsWith("analyse") ? "analyse" : route.startsWith("glossary") ? "glossary" : route;

  useEffect(() => {
    document.title = TITLES[page] ? `${TITLES[page]} · Scale Validation Lab` : "Scale Validation Lab: open psychometrics for questionnaire research";
  }, [page]);

  return (
    <GuideProvider>
      <header className="topbar">
        <div className="shell">
          <a className="wordmark" href="#">
            <span>Scale Validation</span> Lab
          </a>
          <nav className="nav" aria-label="Main">
            {NAV.map((n) => (
              <a key={n.key} href={n.href} aria-current={page === n.key ? "page" : undefined}>
                {n.label}
              </a>
            ))}
          </nav>
          <GuideToggle />
        </div>
      </header>
      <main>
        <div className="shell">
          {page === "analyse" && <Analyse key={route} initialSample={route === "analyse-simulated" ? "writing_ai_simulated" : route === "analyse-bfi" ? "bfi" : undefined} />}
          {page === "learn" && <Learn />}
          {page === "teach" && <Teach />}
          {page === "about" && <About />}
          {page === "glossary" && <Glossary key={route} focus={route.split("/")[1]} />}
          {!["analyse", "learn", "teach", "about", "glossary"].includes(page) && <Home />}
        </div>
      </main>
      <footer>
        <div className="shell">
          <span>
            Scale Validation Lab, an open resource by <a href="https://research.monash.edu/en/persons/cong-ngo/">Dr Cong Ngo</a>. Code MIT; sample
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
